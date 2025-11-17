import { NextRequest, NextResponse } from 'next/server';
import { saveCase, initializeDatabase } from '../../../../lib/db-utils';

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

// POST: Escalate a case (mark as escalated and return case ID)
export async function POST(request: NextRequest) {
  try {
    await ensureDatabaseInitialized();
    const { messages, reason } = await request.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Messages array is required' },
        { status: 400 }
      );
    }

    const newCase = {
      id: `CASE-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      timestamp: new Date().toISOString(),
      messages: messages.map((msg: any) => ({
        sender: msg.sender,
        text: msg.text,
        timestamp: msg.timestamp || new Date().toISOString(),
      })),
      status: 'escalated' as const,
      summary: reason || 'Customer enquiry requiring human assistance',
      escalatedAt: new Date().toISOString(),
    };

    await saveCase(newCase);

    return NextResponse.json({
      caseId: newCase.id,
      case: newCase,
    });
  } catch (error) {
    console.error('Error escalating case:', error);
    return NextResponse.json(
      { error: 'Failed to escalate case' },
      { status: 500 }
    );
  }
}
