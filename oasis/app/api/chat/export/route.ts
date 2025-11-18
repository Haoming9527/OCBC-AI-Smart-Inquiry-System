import { NextRequest, NextResponse } from 'next/server';
import { getSessionWithMessages, generateUserId } from '../../../../lib/chat-history-utils';
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

// GET: Export session as CSV or JSON
export async function GET(request: NextRequest) {
  try {
    await ensureDatabaseInitialized();
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    const userId = searchParams.get('userId') || generateUserId();
    const format = searchParams.get('format') || 'json'; // 'json' or 'csv'

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    const session = await getSessionWithMessages(sessionId, userId);
    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    if (format === 'csv') {
      // Generate CSV
      const csvHeader = 'Timestamp,Sender,Message\n';
      const csvRows = session.messages.map((msg) => {
        const timestamp = new Date(msg.timestamp).toLocaleString();
        const sender = msg.sender;
        const text = msg.text.replace(/"/g, '""'); // Escape quotes
        return `"${timestamp}","${sender}","${text}"`;
      }).join('\n');

      const csv = csvHeader + csvRows;

      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="chat-${sessionId}.csv"`,
        },
      });
    }

    // Return JSON
    return NextResponse.json({ session });
  } catch (error) {
    console.error('Error exporting session:', error);
    return NextResponse.json(
      { error: 'Failed to export session' },
      { status: 500 }
    );
  }
}

