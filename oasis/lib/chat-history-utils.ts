import { randomUUID } from 'crypto';
import { Buffer } from 'buffer';
import { sql } from './db';
import { analyzeSentiment, SentimentAnalysis } from './sentiment-utils';

export interface ChatAttachment {
  id: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  data?: string;
}

export interface ChatAttachmentInput {
  id?: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  data: string;
}

export interface ChatMessage {
  id: number;
  sender: 'user' | 'bot';
  text: string;
  timestamp: string;
  sentiment?: SentimentAnalysis;
  attachments?: ChatAttachment[];
}

export interface ChatSession {
  id: string;
  userId: string;
  title: string | null;
  createdAt: string;
  updatedAt: string;
  isBookmarked: boolean;
  lastMessagePreview: string | null;
  messageCount?: number;
}

export interface ChatSessionWithMessages extends ChatSession {
  messages: ChatMessage[];
}

// Generate a unique user ID (using browser fingerprint or session)
export function generateUserId(): string {
  // In a real app, this would come from authentication
  // For now, we'll use localStorage to persist a user ID
  if (typeof window !== 'undefined') {
    let userId = localStorage.getItem('chat_user_id');
    if (!userId) {
      userId = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('chat_user_id', userId);
    }
    return userId;
  }
  return `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Create a new chat session
export async function createChatSession(
  userId: string,
  title?: string
): Promise<ChatSession> {
  const sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  await sql`
    INSERT INTO chat_sessions (id, user_id, title, last_message_preview)
    VALUES (${sessionId}, ${userId}, ${title || null}, ${null})
  `;

  return {
    id: sessionId,
    userId,
    title: title || null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isBookmarked: false,
    lastMessagePreview: null,
  };
}

// Save a message to a session
export async function saveChatMessage(
  sessionId: string,
  sender: 'user' | 'bot',
  text: string,
  attachments?: ChatAttachmentInput[]
): Promise<void> {
  // Analyze sentiment for user messages only
  let sentiment: SentimentAnalysis | undefined;
  if (sender === 'user') {
    sentiment = analyzeSentiment(text);
  }

  // Check if all sentiment columns exist
  const sentimentColumns = await sql`
    SELECT column_name 
    FROM information_schema.columns 
    WHERE table_name = 'chat_messages' 
      AND column_name IN ('sentiment_score', 'sentiment_comparative', 'sentiment_label', 'sentiment_magnitude')
  `;
  
  const hasAllSentimentColumns = sentimentColumns.length === 4;

  const timestamp = new Date().toISOString();
  let messageId: number | null = null;

  if (hasAllSentimentColumns) {
    const result = await sql`
      INSERT INTO chat_messages (session_id, sender, text, timestamp, sentiment_score, sentiment_comparative, sentiment_label, sentiment_magnitude)
      VALUES (
        ${sessionId}, 
        ${sender}, 
        ${text}, 
        ${timestamp},
        ${sentiment?.score ?? null},
        ${sentiment?.comparative ?? null},
        ${sentiment?.label ?? null},
        ${sentiment?.magnitude ?? null}
      )
      RETURNING id
    `;
    messageId = result[0]?.id ?? null;
  } else {
    const result = await sql`
      INSERT INTO chat_messages (session_id, sender, text, timestamp)
      VALUES (
        ${sessionId}, 
        ${sender}, 
        ${text}, 
        ${timestamp}
      )
      RETURNING id
    `;
    messageId = result[0]?.id ?? null;
  }

  if (messageId && attachments && attachments.length > 0) {
    for (const attachment of attachments) {
      const attachmentId = attachment.id || randomUUID();
      const buffer = Buffer.from(attachment.data, 'base64');
      await sql`
        INSERT INTO attachments (id, message_id, file_name, mime_type, file_size, data)
        VALUES (
          ${attachmentId},
          ${messageId},
          ${attachment.fileName},
          ${attachment.mimeType || 'application/octet-stream'},
          ${attachment.fileSize},
          ${buffer}
        )
      `;
    }
  }

  // Update session's last message preview and updated_at
  const preview = text.length > 100 ? text.substring(0, 100) + '...' : text;
  await sql`
    UPDATE chat_sessions
    SET last_message_preview = ${preview},
        updated_at = NOW()
    WHERE id = ${sessionId}
  `;
}

// Get all sessions for a user
export async function getUserSessions(
  userId: string,
  limit: number = 50,
  offset: number = 0
): Promise<ChatSession[]> {
  const sessions = await sql`
    SELECT 
      s.id,
      s.user_id,
      s.title,
      s.created_at,
      s.updated_at,
      s.is_bookmarked,
      s.last_message_preview,
      COUNT(m.id) as message_count
    FROM chat_sessions s
    LEFT JOIN chat_messages m ON s.id = m.session_id
    WHERE s.user_id = ${userId}
    GROUP BY s.id
    ORDER BY s.updated_at DESC
    LIMIT ${limit}
    OFFSET ${offset}
  `;

  return sessions.map((s: any) => ({
    id: s.id,
    userId: s.user_id,
    title: s.title,
    createdAt: s.created_at.toISOString(),
    updatedAt: s.updated_at.toISOString(),
    isBookmarked: s.is_bookmarked,
    lastMessagePreview: s.last_message_preview,
    messageCount: parseInt(s.message_count) || 0,
  }));
}

// Get a session with all messages
export async function getSessionWithMessages(
  sessionId: string,
  userId: string
): Promise<ChatSessionWithMessages | null> {
  // Verify session belongs to user
  const sessionResult = await sql`
    SELECT id, user_id, title, created_at, updated_at, is_bookmarked, last_message_preview
    FROM chat_sessions
    WHERE id = ${sessionId} AND user_id = ${userId}
  `;

  if (sessionResult.length === 0) {
    return null;
  }

  const session = sessionResult[0];

  // Get all messages for this session
  // Try to select with sentiment columns, fallback if they don't exist
  let messagesResult: any[];
  try {
    messagesResult = await sql`
      SELECT id, sender, text, timestamp, sentiment_score, sentiment_comparative, sentiment_label, sentiment_magnitude
      FROM chat_messages
      WHERE session_id = ${sessionId}
      ORDER BY timestamp ASC
    `;
  } catch (error: any) {
    // If sentiment columns don't exist, select without them
    if (error?.code === '42703') {
      messagesResult = await sql`
        SELECT id, sender, text, timestamp
        FROM chat_messages
        WHERE session_id = ${sessionId}
        ORDER BY timestamp ASC
      `;
    } else {
      throw error;
    }
  }

  // Load attachments for messages
  const attachmentsByMessage: Record<number, ChatAttachment[]> = {};
  for (const message of messagesResult) {
    const attachmentRows = await sql`
      SELECT id, file_name, mime_type, file_size, data
      FROM attachments
      WHERE message_id = ${message.id}
      ORDER BY created_at ASC
    `;
    attachmentsByMessage[message.id] = attachmentRows.map((att: any) => ({
      id: att.id,
      fileName: att.file_name,
      mimeType: att.mime_type,
      fileSize: att.file_size,
      data: Buffer.isBuffer(att.data) ? att.data.toString('base64') : att.data,
    }));
  }

  return {
    id: session.id,
    userId: session.user_id,
    title: session.title,
    createdAt: session.created_at.toISOString(),
    updatedAt: session.updated_at.toISOString(),
    isBookmarked: session.is_bookmarked,
    lastMessagePreview: session.last_message_preview,
    messages: messagesResult.map((m: any) => ({
      id: m.id,
      sender: m.sender as 'user' | 'bot',
      text: m.text,
      timestamp: m.timestamp.toISOString(),
      sentiment: m.sentiment_score !== null && m.sentiment_score !== undefined ? {
        score: parseFloat(m.sentiment_score),
        comparative: parseFloat(m.sentiment_comparative),
        label: m.sentiment_label as 'positive' | 'neutral' | 'negative',
        magnitude: m.sentiment_magnitude as 'low' | 'medium' | 'high',
      } : undefined,
      attachments: attachmentsByMessage[m.id] || [],
    })),
  };
}

// Search sessions by message content
export async function searchSessions(
  userId: string,
  query: string,
  limit: number = 20
): Promise<ChatSession[]> {
  const searchQuery = `%${query}%`;
  
  const sessions = await sql`
    SELECT DISTINCT
      s.id,
      s.user_id,
      s.title,
      s.created_at,
      s.updated_at,
      s.is_bookmarked,
      s.last_message_preview,
      COUNT(DISTINCT m.id) as message_count
    FROM chat_sessions s
    LEFT JOIN chat_messages m ON s.id = m.session_id
    WHERE s.user_id = ${userId}
      AND (
        s.title ILIKE ${searchQuery}
        OR s.last_message_preview ILIKE ${searchQuery}
        OR m.text ILIKE ${searchQuery}
      )
    GROUP BY s.id
    ORDER BY s.updated_at DESC
    LIMIT ${limit}
  `;

  return sessions.map((s: any) => ({
    id: s.id,
    userId: s.user_id,
    title: s.title,
    createdAt: s.created_at.toISOString(),
    updatedAt: s.updated_at.toISOString(),
    isBookmarked: s.is_bookmarked,
    lastMessagePreview: s.last_message_preview,
    messageCount: parseInt(s.message_count) || 0,
  }));
}

// Get bookmarked sessions
export async function getBookmarkedSessions(userId: string): Promise<ChatSession[]> {
  const sessions = await sql`
    SELECT 
      s.id,
      s.user_id,
      s.title,
      s.created_at,
      s.updated_at,
      s.is_bookmarked,
      s.last_message_preview,
      COUNT(m.id) as message_count
    FROM chat_sessions s
    LEFT JOIN chat_messages m ON s.id = m.session_id
    WHERE s.user_id = ${userId} AND s.is_bookmarked = TRUE
    GROUP BY s.id
    ORDER BY s.updated_at DESC
  `;

  return sessions.map((s: any) => ({
    id: s.id,
    userId: s.user_id,
    title: s.title,
    createdAt: s.created_at.toISOString(),
    updatedAt: s.updated_at.toISOString(),
    isBookmarked: s.is_bookmarked,
    lastMessagePreview: s.last_message_preview,
    messageCount: parseInt(s.message_count) || 0,
  }));
}

// Toggle bookmark status
export async function toggleBookmark(
  sessionId: string,
  userId: string
): Promise<boolean> {
  // First verify session belongs to user
  const sessionResult = await sql`
    SELECT is_bookmarked
    FROM chat_sessions
    WHERE id = ${sessionId} AND user_id = ${userId}
  `;

  if (sessionResult.length === 0) {
    throw new Error('Session not found');
  }

  const newBookmarkStatus = !sessionResult[0].is_bookmarked;

  await sql`
    UPDATE chat_sessions
    SET is_bookmarked = ${newBookmarkStatus}
    WHERE id = ${sessionId} AND user_id = ${userId}
  `;

  return newBookmarkStatus;
}

// Update session title
export async function updateSessionTitle(
  sessionId: string,
  userId: string,
  title: string
): Promise<void> {
  await sql`
    UPDATE chat_sessions
    SET title = ${title}
    WHERE id = ${sessionId} AND user_id = ${userId}
  `;
}

// Delete a session
export async function deleteSession(
  sessionId: string,
  userId: string
): Promise<void> {
  await sql`
    DELETE FROM chat_sessions
    WHERE id = ${sessionId} AND user_id = ${userId}
  `;
}

