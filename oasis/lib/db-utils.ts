import { sql } from './db';

export interface Case {
  id: string;
  timestamp: string;
  messages: Array<{
    sender: 'user' | 'bot';
    text: string;
    timestamp: string;
  }>;
  status: 'open' | 'resolved' | 'escalated';
  summary?: string;
  escalatedAt?: string;
}

// Initialize database schema
export async function initializeDatabase() {
  try {
    // Create cases table
    await sql`
      CREATE TABLE IF NOT EXISTS cases (
        id VARCHAR(255) PRIMARY KEY,
        timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        status VARCHAR(20) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'resolved', 'escalated')),
        summary TEXT,
        escalated_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      )
    `;

    // Create messages table
    await sql`
      CREATE TABLE IF NOT EXISTS messages (
        id SERIAL PRIMARY KEY,
        case_id VARCHAR(255) NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
        sender VARCHAR(10) NOT NULL CHECK (sender IN ('user', 'bot')),
        text TEXT NOT NULL,
        timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      )
    `;

    // Create indexes
    await sql`
      CREATE INDEX IF NOT EXISTS idx_messages_case_id ON messages(case_id)
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_cases_status ON cases(status)
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_cases_timestamp ON cases(timestamp)
    `;

    // Create chat_sessions table for storing conversation history
    await sql`
      CREATE TABLE IF NOT EXISTS chat_sessions (
        id VARCHAR(255) PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        title VARCHAR(500),
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        is_bookmarked BOOLEAN DEFAULT FALSE,
        last_message_preview TEXT
      )
    `;

    // Create chat_messages table for storing individual messages in sessions
    await sql`
      CREATE TABLE IF NOT EXISTS chat_messages (
        id SERIAL PRIMARY KEY,
        session_id VARCHAR(255) NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
        sender VARCHAR(10) NOT NULL CHECK (sender IN ('user', 'bot')),
        text TEXT NOT NULL,
        timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      )
    `;

    // Create indexes for chat sessions
    await sql`
      CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_id ON chat_sessions(user_id)
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_chat_sessions_updated_at ON chat_sessions(updated_at DESC)
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_chat_sessions_bookmarked ON chat_sessions(is_bookmarked)
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id ON chat_messages(session_id)
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_chat_messages_timestamp ON chat_messages(timestamp)
    `;

    console.log('Database schema initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
}

// Load all cases with their messages
export async function loadCases(): Promise<Case[]> {
  try {
    const casesResult = await sql`
      SELECT id, timestamp, status, summary, escalated_at
      FROM cases
      ORDER BY timestamp DESC
    `;

    const cases: Case[] = [];

    for (const caseRow of casesResult) {
      const messagesResult = await sql`
        SELECT sender, text, timestamp
        FROM messages
        WHERE case_id = ${caseRow.id}
        ORDER BY timestamp ASC
      `;

      cases.push({
        id: caseRow.id,
        timestamp: caseRow.timestamp.toISOString(),
        status: caseRow.status as 'open' | 'resolved' | 'escalated',
        summary: caseRow.summary || undefined,
        escalatedAt: caseRow.escalated_at ? caseRow.escalated_at.toISOString() : undefined,
        messages: messagesResult.map((msg: any) => ({
          sender: msg.sender as 'user' | 'bot',
          text: msg.text,
          timestamp: msg.timestamp.toISOString(),
        })),
      });
    }

    return cases;
  } catch (error) {
    console.error('Error loading cases:', error);
    // If tables don't exist, initialize them
    if (error instanceof Error && error.message.includes('does not exist')) {
      await initializeDatabase();
      return [];
    }
    throw error;
  }
}

// Load a single case by ID
export async function loadCaseById(caseId: string): Promise<Case | null> {
  try {
    const caseResult = await sql`
      SELECT id, timestamp, status, summary, escalated_at
      FROM cases
      WHERE id = ${caseId}
    `;

    if (caseResult.length === 0) {
      return null;
    }

    const caseRow = caseResult[0];

    const messagesResult = await sql`
      SELECT sender, text, timestamp
      FROM messages
      WHERE case_id = ${caseId}
      ORDER BY timestamp ASC
    `;

    return {
      id: caseRow.id,
      timestamp: caseRow.timestamp.toISOString(),
      status: caseRow.status as 'open' | 'resolved' | 'escalated',
      summary: caseRow.summary || undefined,
      escalatedAt: caseRow.escalated_at ? caseRow.escalated_at.toISOString() : undefined,
      messages: messagesResult.map((msg: any) => ({
        sender: msg.sender as 'user' | 'bot',
        text: msg.text,
        timestamp: msg.timestamp.toISOString(),
      })),
    };
  } catch (error) {
    console.error('Error loading case:', error);
    throw error;
  }
}

// Save a new case
export async function saveCase(caseData: Case): Promise<void> {
  try {
    // Insert case
    await sql`
      INSERT INTO cases (id, timestamp, status, summary, escalated_at)
      VALUES (${caseData.id}, ${caseData.timestamp}, ${caseData.status}, ${caseData.summary || null}, ${caseData.escalatedAt || null})
      ON CONFLICT (id) DO UPDATE
      SET status = ${caseData.status},
          summary = ${caseData.summary || null},
          escalated_at = ${caseData.escalatedAt || null},
          updated_at = NOW()
    `;

    // Delete existing messages and insert new ones
    await sql`DELETE FROM messages WHERE case_id = ${caseData.id}`;

    // Insert messages
    for (const message of caseData.messages) {
      await sql`
        INSERT INTO messages (case_id, sender, text, timestamp)
        VALUES (${caseData.id}, ${message.sender}, ${message.text}, ${message.timestamp})
      `;
    }
  } catch (error) {
    console.error('Error saving case:', error);
    throw error;
  }
}

// Update case status
export async function updateCaseStatus(
  caseId: string,
  status: 'open' | 'resolved' | 'escalated'
): Promise<Case | null> {
  try {
    // If setting to escalated and escalated_at is null, set it to now
    // Otherwise, keep the existing escalated_at value
    await sql`
      UPDATE cases
      SET status = ${status},
          escalated_at = CASE 
            WHEN ${status} = 'escalated' AND escalated_at IS NULL THEN NOW()
            ELSE escalated_at
          END,
          updated_at = NOW()
      WHERE id = ${caseId}
    `;

    return await loadCaseById(caseId);
  } catch (error) {
    console.error('Error updating case status:', error);
    throw error;
  }
}

