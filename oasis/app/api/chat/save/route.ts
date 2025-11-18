import { NextRequest, NextResponse } from 'next/server';
import {
  saveChatMessage,
  createChatSession,
  generateUserId,
} from '../../../../lib/chat-history-utils';
import { initializeDatabase } from '../../../../lib/db-utils';

// Initialize database on first import
let dbInitialized = false;
async function ensureDatabaseInitialized() {
  if (!dbInitialized) {
    try {
      await initializeDatabase();
      dbInitialized = true;
    } catch (error) {
      console.error('Failed to initialize database:', error);
    }
  }
}

// POST: Save a message to a session
export async function POST(request: NextRequest) {
  try {
    await ensureDatabaseInitialized();
    const { sessionId, userId, sender, text, createNewSession } = await request.json();

    if (!sender || !text) {
      return NextResponse.json(
        { error: 'Sender and text are required' },
        { status: 400 }
      );
    }

    let finalSessionId = sessionId;
    const finalUserId = userId || generateUserId();

    // Create new session if needed
    if (!finalSessionId || createNewSession) {
      const session = await createChatSession(finalUserId);
      finalSessionId = session.id;
    }

    // Save the message
    await saveChatMessage(finalSessionId, sender, text);

    return NextResponse.json({
      success: true,
      sessionId: finalSessionId,
      userId: finalUserId,
    });
  } catch (error) {
    console.error('Error saving message:', error);
    return NextResponse.json(
      { error: 'Failed to save message' },
      { status: 500 }
    );
  }
}

