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
const MAX_ATTACHMENT_SIZE = 5 * 1024 * 1024; // 5MB per file
const MAX_ATTACHMENTS = 5;

export async function POST(request: NextRequest) {
  try {
    await ensureDatabaseInitialized();
    const {
      sessionId,
      userId,
      sender,
      text,
      createNewSession,
      attachments,
    } = await request.json();

    if (!sender || (!text?.trim() && (!attachments || attachments.length === 0))) {
      return NextResponse.json(
        { error: 'Sender and either text or attachments are required' },
        { status: 400 }
      );
    }

    let normalizedAttachments: any[] = [];
    if (attachments && Array.isArray(attachments)) {
      if (attachments.length > MAX_ATTACHMENTS) {
        return NextResponse.json(
          { error: `You can attach up to ${MAX_ATTACHMENTS} files per message.` },
          { status: 400 }
        );
      }

      try {
        normalizedAttachments = attachments.map((attachment: any) => {
          if (
            !attachment ||
            !attachment.fileName ||
            !attachment.mimeType ||
            typeof attachment.fileSize !== 'number' ||
            !attachment.data
          ) {
            throw new Error('Invalid attachment payload');
          }
          if (attachment.fileSize > MAX_ATTACHMENT_SIZE) {
            throw new Error(
              `File "${attachment.fileName}" exceeds the maximum size of ${Math.round(
                MAX_ATTACHMENT_SIZE / (1024 * 1024)
              )}MB.`
            );
          }
          return {
            id: attachment.id,
            fileName: attachment.fileName,
            mimeType: attachment.mimeType,
            fileSize: attachment.fileSize,
            data: attachment.data,
          };
        });
      } catch (attachmentError: any) {
        return NextResponse.json(
          { error: attachmentError?.message || 'Invalid attachment.' },
          { status: 400 }
        );
      }
    }

    let finalSessionId = sessionId;
    const finalUserId = userId || generateUserId();

    // Create new session if needed
    if (!finalSessionId || createNewSession) {
      const session = await createChatSession(finalUserId);
      finalSessionId = session.id;
    }

    // Save the message
    await saveChatMessage(finalSessionId, sender, text || '', normalizedAttachments);

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

