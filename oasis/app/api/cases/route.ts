import { NextRequest, NextResponse } from 'next/server';
import { loadCases, loadCaseById, saveCase, initializeDatabase } from '../../../lib/db-utils';

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

// POST: Create a new case
export async function POST(request: NextRequest) {
  try {
    await ensureDatabaseInitialized();
    const { messages, summary } = await request.json();

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
      status: 'open' as const,
      summary: summary || 'Customer enquiry requiring human assistance',
    };

    await saveCase(newCase);

    return NextResponse.json({
      caseId: newCase.id,
      case: newCase,
    });
  } catch (error) {
    console.error('Error creating case:', error);
    return NextResponse.json(
      { error: 'Failed to create case' },
      { status: 500 }
    );
  }
}

// GET: Get all cases or a specific case
export async function GET(request: NextRequest) {
  try {
    await ensureDatabaseInitialized();
    const { searchParams } = new URL(request.url);
    const caseId = searchParams.get('id');

    if (caseId) {
      const foundCase = await loadCaseById(caseId);
      if (!foundCase) {
        return NextResponse.json(
          { error: 'Case not found' },
          { status: 404 }
        );
      }
      return NextResponse.json({ case: foundCase });
    }

    const cases = await loadCases();
    return NextResponse.json({ cases });
  } catch (error) {
    console.error('Error fetching cases:', error);
    return NextResponse.json(
      { error: 'Failed to fetch cases' },
      { status: 500 }
    );
  }
}
