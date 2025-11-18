import { sql } from './db';
import { analyzeSentiment, SentimentAnalysis } from './sentiment-utils';

export interface Case {
  id: string;
  timestamp: string;
  messages: Array<{
    sender: 'user' | 'bot';
    text: string;
    timestamp: string;
    sentiment?: SentimentAnalysis;
  }>;
  status: 'open' | 'resolved' | 'escalated';
  summary?: string;
  contactEmail?: string | null;
  contactPhone?: string | null;
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
        contact_email VARCHAR(255),
        contact_phone VARCHAR(50),
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
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        sentiment_score NUMERIC,
        sentiment_comparative NUMERIC,
        sentiment_label VARCHAR(10) CHECK (sentiment_label IN ('positive', 'neutral', 'negative')),
        sentiment_magnitude VARCHAR(10) CHECK (sentiment_magnitude IN ('low', 'medium', 'high'))
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
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        sentiment_score NUMERIC,
        sentiment_comparative NUMERIC,
        sentiment_label VARCHAR(10) CHECK (sentiment_label IN ('positive', 'neutral', 'negative')),
        sentiment_magnitude VARCHAR(10) CHECK (sentiment_magnitude IN ('low', 'medium', 'high'))
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

    // Ensure contact columns exist on cases table
    try {
      await sql`
        ALTER TABLE cases
        ADD COLUMN IF NOT EXISTS contact_email VARCHAR(255)
      `;
      await sql`
        ALTER TABLE cases
        ADD COLUMN IF NOT EXISTS contact_phone VARCHAR(50)
      `;
    } catch (error) {
      console.warn('Error ensuring contact columns on cases table:', error);
    }

    // Migrate existing tables to add sentiment columns if they don't exist
    // Check and add sentiment columns to messages table
    try {
      const messagesColumns = await sql`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'messages' AND column_name = 'sentiment_score'
      `;
      
      if (messagesColumns.length === 0) {
        console.log('Migrating messages table: adding sentiment columns...');
        await sql`ALTER TABLE messages ADD COLUMN sentiment_score NUMERIC`;
        await sql`ALTER TABLE messages ADD COLUMN sentiment_comparative NUMERIC`;
        await sql`ALTER TABLE messages ADD COLUMN sentiment_label VARCHAR(10)`;
        await sql`ALTER TABLE messages ADD COLUMN sentiment_magnitude VARCHAR(10)`;
        // Add check constraints separately (with IF NOT EXISTS check)
        try {
          await sql`
            ALTER TABLE messages 
            ADD CONSTRAINT messages_sentiment_label_check 
            CHECK (sentiment_label IS NULL OR sentiment_label IN ('positive', 'neutral', 'negative'))
          `;
        } catch (e: any) {
          if (!e?.message?.includes('already exists')) {
            throw e;
          }
        }
        try {
          await sql`
            ALTER TABLE messages 
            ADD CONSTRAINT messages_sentiment_magnitude_check 
            CHECK (sentiment_magnitude IS NULL OR sentiment_magnitude IN ('low', 'medium', 'high'))
          `;
        } catch (e: any) {
          if (!e?.message?.includes('already exists')) {
            throw e;
          }
        }
        console.log('Messages table migration completed');
      }
    } catch (error: any) {
      console.warn('Error migrating messages table:', error);
    }

    // Check and add sentiment columns to chat_messages table
    try {
      const chatMessagesColumns = await sql`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'chat_messages' AND column_name = 'sentiment_score'
      `;
      
      if (chatMessagesColumns.length === 0) {
        console.log('Migrating chat_messages table: adding sentiment columns...');
        await sql`ALTER TABLE chat_messages ADD COLUMN sentiment_score NUMERIC`;
        await sql`ALTER TABLE chat_messages ADD COLUMN sentiment_comparative NUMERIC`;
        await sql`ALTER TABLE chat_messages ADD COLUMN sentiment_label VARCHAR(10)`;
        await sql`ALTER TABLE chat_messages ADD COLUMN sentiment_magnitude VARCHAR(10)`;
        // Add check constraints separately
        try {
          await sql`
            ALTER TABLE chat_messages 
            ADD CONSTRAINT chat_messages_sentiment_label_check 
            CHECK (sentiment_label IS NULL OR sentiment_label IN ('positive', 'neutral', 'negative'))
          `;
        } catch (e: any) {
          if (!e?.message?.includes('already exists')) {
            throw e;
          }
        }
        try {
          await sql`
            ALTER TABLE chat_messages 
            ADD CONSTRAINT chat_messages_sentiment_magnitude_check 
            CHECK (sentiment_magnitude IS NULL OR sentiment_magnitude IN ('low', 'medium', 'high'))
          `;
        } catch (e: any) {
          if (!e?.message?.includes('already exists')) {
            throw e;
          }
        }
        console.log('Chat_messages table migration completed');
      }
    } catch (error: any) {
      console.warn('Error migrating chat_messages table:', error);
    }

    // Create sentiment indexes (only if columns exist)
    try {
      const chatMessagesHasColumn = await sql`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'chat_messages' AND column_name = 'sentiment_label'
      `;
      if (chatMessagesHasColumn.length > 0) {
        await sql`
          CREATE INDEX IF NOT EXISTS idx_chat_messages_sentiment_label ON chat_messages(sentiment_label)
        `;
      }
    } catch (error) {
      console.warn('Error creating chat_messages sentiment index:', error);
    }

    try {
      const messagesHasColumn = await sql`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'messages' AND column_name = 'sentiment_label'
      `;
      if (messagesHasColumn.length > 0) {
        await sql`
          CREATE INDEX IF NOT EXISTS idx_messages_sentiment_label ON messages(sentiment_label)
        `;
      }
    } catch (error) {
      console.warn('Error creating messages sentiment index:', error);
    }

    // Create attachments table for chat message files
    await sql`
      CREATE TABLE IF NOT EXISTS attachments (
        id VARCHAR(255) PRIMARY KEY,
        message_id INTEGER NOT NULL REFERENCES chat_messages(id) ON DELETE CASCADE,
        file_name TEXT NOT NULL,
        mime_type VARCHAR(100) NOT NULL,
        file_size INTEGER NOT NULL,
        data BYTEA NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      )
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_attachments_message_id ON attachments(message_id)
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
      SELECT id, timestamp, status, summary, contact_email, contact_phone, escalated_at
      FROM cases
      ORDER BY timestamp DESC
    `;

    const cases: Case[] = [];

    for (const caseRow of casesResult) {
      // Try to select with sentiment columns, fallback if they don't exist
      let messagesResult: any[];
      try {
        messagesResult = await sql`
          SELECT sender, text, timestamp, sentiment_score, sentiment_comparative, sentiment_label, sentiment_magnitude
          FROM messages
          WHERE case_id = ${caseRow.id}
          ORDER BY timestamp ASC
        `;
      } catch (error: any) {
        // If sentiment columns don't exist, select without them
        if (error?.code === '42703') {
          messagesResult = await sql`
            SELECT sender, text, timestamp
            FROM messages
            WHERE case_id = ${caseRow.id}
            ORDER BY timestamp ASC
          `;
        } else {
          throw error;
        }
      }

      cases.push({
        id: caseRow.id,
        timestamp: caseRow.timestamp.toISOString(),
        status: caseRow.status as 'open' | 'resolved' | 'escalated',
        summary: caseRow.summary || undefined,
        contactEmail: caseRow.contact_email || undefined,
        contactPhone: caseRow.contact_phone || undefined,
        escalatedAt: caseRow.escalated_at ? caseRow.escalated_at.toISOString() : undefined,
        messages: messagesResult.map((msg: any) => ({
          sender: msg.sender as 'user' | 'bot',
          text: msg.text,
          timestamp: msg.timestamp.toISOString(),
          sentiment: msg.sentiment_score !== null && msg.sentiment_score !== undefined ? {
            score: parseFloat(msg.sentiment_score),
            comparative: parseFloat(msg.sentiment_comparative),
            label: msg.sentiment_label as 'positive' | 'neutral' | 'negative',
            magnitude: msg.sentiment_magnitude as 'low' | 'medium' | 'high',
          } : undefined,
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
      SELECT id, timestamp, status, summary, contact_email, contact_phone, escalated_at
      FROM cases
      WHERE id = ${caseId}
    `;

    if (caseResult.length === 0) {
      return null;
    }

    const caseRow = caseResult[0];

    // Try to select with sentiment columns, fallback if they don't exist
    let messagesResult: any[];
    try {
      messagesResult = await sql`
        SELECT sender, text, timestamp, sentiment_score, sentiment_comparative, sentiment_label, sentiment_magnitude
        FROM messages
        WHERE case_id = ${caseId}
        ORDER BY timestamp ASC
      `;
    } catch (error: any) {
      // If sentiment columns don't exist, select without them
      if (error?.code === '42703') {
        messagesResult = await sql`
          SELECT sender, text, timestamp
          FROM messages
          WHERE case_id = ${caseId}
          ORDER BY timestamp ASC
        `;
      } else {
        throw error;
      }
    }

    return {
      id: caseRow.id,
      timestamp: caseRow.timestamp.toISOString(),
      status: caseRow.status as 'open' | 'resolved' | 'escalated',
      summary: caseRow.summary || undefined,
      contactEmail: caseRow.contact_email || undefined,
      contactPhone: caseRow.contact_phone || undefined,
      escalatedAt: caseRow.escalated_at ? caseRow.escalated_at.toISOString() : undefined,
      messages: messagesResult.map((msg: any) => ({
        sender: msg.sender as 'user' | 'bot',
        text: msg.text,
        timestamp: msg.timestamp.toISOString(),
        sentiment: msg.sentiment_score !== null && msg.sentiment_score !== undefined ? {
          score: parseFloat(msg.sentiment_score),
          comparative: parseFloat(msg.sentiment_comparative),
          label: msg.sentiment_label as 'positive' | 'neutral' | 'negative',
          magnitude: msg.sentiment_magnitude as 'low' | 'medium' | 'high',
        } : undefined,
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
      INSERT INTO cases (id, timestamp, status, summary, contact_email, contact_phone, escalated_at)
      VALUES (
        ${caseData.id},
        ${caseData.timestamp},
        ${caseData.status},
        ${caseData.summary || null},
        ${caseData.contactEmail || null},
        ${caseData.contactPhone || null},
        ${caseData.escalatedAt || null}
      )
      ON CONFLICT (id) DO UPDATE
      SET status = ${caseData.status},
          summary = ${caseData.summary || null},
          contact_email = ${caseData.contactEmail || null},
          contact_phone = ${caseData.contactPhone || null},
          escalated_at = ${caseData.escalatedAt || null},
          updated_at = NOW()
    `;

    // Delete existing messages and insert new ones
    await sql`DELETE FROM messages WHERE case_id = ${caseData.id}`;

    // Check if all sentiment columns exist
    const sentimentColumns = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'messages' 
        AND column_name IN ('sentiment_score', 'sentiment_comparative', 'sentiment_label', 'sentiment_magnitude')
    `;
    
    const hasAllSentimentColumns = sentimentColumns.length === 4;

    // Insert messages with sentiment analysis
    for (const message of caseData.messages) {
      // Analyze sentiment for user messages only
      let sentiment = message.sentiment;
      if (!sentiment && message.sender === 'user') {
        sentiment = analyzeSentiment(message.text);
      }
      
      if (hasAllSentimentColumns) {
        // Insert with sentiment columns
        await sql`
          INSERT INTO messages (case_id, sender, text, timestamp, sentiment_score, sentiment_comparative, sentiment_label, sentiment_magnitude)
          VALUES (
            ${caseData.id}, 
            ${message.sender}, 
            ${message.text}, 
            ${message.timestamp},
            ${sentiment?.score ?? null},
            ${sentiment?.comparative ?? null},
            ${sentiment?.label ?? null},
            ${sentiment?.magnitude ?? null}
          )
        `;
      } else {
        // Fallback: insert without sentiment columns
        await sql`
          INSERT INTO messages (case_id, sender, text, timestamp)
          VALUES (
            ${caseData.id}, 
            ${message.sender}, 
            ${message.text}, 
            ${message.timestamp}
          )
        `;
      }
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

