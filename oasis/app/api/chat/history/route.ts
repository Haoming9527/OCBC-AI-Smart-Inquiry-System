import { NextRequest, NextResponse } from 'next/server';
import {
  getUserSessions,
  createChatSession,
  getSessionWithMessages,
  searchSessions,
  getBookmarkedSessions,
  toggleBookmark,
  updateSessionTitle,
  deleteSession,
  generateUserId,
  initializeDatabase,
} from '../../../../lib/chat-history-utils';

// Initialize database on first import
let dbInitialized = false;
async function ensureDatabaseInitialized() {
  if (!dbInitialized) {
    try {
      const { initializeDatabase: initDb } = await import('../../../../lib/db-utils');
      await initDb();
      dbInitialized = true;
    } catch (error) {
      console.error('Failed to initialize database:', error);
    }
  }
}

// GET: Get all sessions for a user, search, or get bookmarked
export async function GET(request: NextRequest) {
  try {
    await ensureDatabaseInitialized();
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || generateUserId();
    const search = searchParams.get('search');
    const bookmarked = searchParams.get('bookmarked') === 'true';
    const sessionId = searchParams.get('sessionId');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Get specific session with messages
    if (sessionId) {
      const session = await getSessionWithMessages(sessionId, userId);
      if (!session) {
        return NextResponse.json(
          { error: 'Session not found' },
          { status: 404 }
        );
      }
      return NextResponse.json({ session });
    }

    // Get bookmarked sessions
    if (bookmarked) {
      const sessions = await getBookmarkedSessions(userId);
      return NextResponse.json({ sessions });
    }

    // Search sessions
    if (search) {
      const sessions = await searchSessions(userId, search, limit);
      return NextResponse.json({ sessions });
    }

    // Get all sessions
    const sessions = await getUserSessions(userId, limit, offset);
    return NextResponse.json({ sessions, userId });
  } catch (error) {
    console.error('Error fetching chat history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch chat history' },
      { status: 500 }
    );
  }
}

// POST: Create a new session
export async function POST(request: NextRequest) {
  try {
    await ensureDatabaseInitialized();
    const { userId, title } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const session = await createChatSession(userId, title);
    return NextResponse.json({ session });
  } catch (error) {
    console.error('Error creating session:', error);
    return NextResponse.json(
      { error: 'Failed to create session' },
      { status: 500 }
    );
  }
}

// PATCH: Update session (title, bookmark)
export async function PATCH(request: NextRequest) {
  try {
    await ensureDatabaseInitialized();
    const { sessionId, userId, action, title } = await request.json();

    if (!sessionId || !userId) {
      return NextResponse.json(
        { error: 'Session ID and User ID are required' },
        { status: 400 }
      );
    }

    if (action === 'bookmark') {
      const isBookmarked = await toggleBookmark(sessionId, userId);
      return NextResponse.json({ isBookmarked });
    }

    if (action === 'updateTitle' && title) {
      await updateSessionTitle(sessionId, userId, title);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error updating session:', error);
    return NextResponse.json(
      { error: 'Failed to update session' },
      { status: 500 }
    );
  }
}

// DELETE: Delete a session
export async function DELETE(request: NextRequest) {
  try {
    await ensureDatabaseInitialized();
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    const userId = searchParams.get('userId');

    if (!sessionId || !userId) {
      return NextResponse.json(
        { error: 'Session ID and User ID are required' },
        { status: 400 }
      );
    }

    await deleteSession(sessionId, userId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting session:', error);
    return NextResponse.json(
      { error: 'Failed to delete session' },
      { status: 500 }
    );
  }
}

