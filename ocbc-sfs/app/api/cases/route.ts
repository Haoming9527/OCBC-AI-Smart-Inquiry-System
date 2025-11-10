import { NextRequest, NextResponse } from 'next/server';
import { writeFile, readFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

interface Case {
  id: string;
  timestamp: string;
  messages: Array<{
    sender: 'user' | 'bot';
    text: string;
    timestamp: string;
  }>;
  status: 'open' | 'resolved' | 'escalated';
  summary?: string;
}

const CASES_DIR = path.join(process.cwd(), 'data', 'cases');
const CASES_FILE = path.join(CASES_DIR, 'cases.json');

// Ensure data directory exists
async function ensureDataDir() {
  if (!existsSync(CASES_DIR)) {
    await mkdir(CASES_DIR, { recursive: true });
  }
}

// Load cases from file
async function loadCases(): Promise<Case[]> {
  await ensureDataDir();
  try {
    if (existsSync(CASES_FILE)) {
      const data = await readFile(CASES_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error loading cases:', error);
  }
  return [];
}

// Save cases to file
async function saveCases(cases: Case[]) {
  await ensureDataDir();
  await writeFile(CASES_FILE, JSON.stringify(cases, null, 2), 'utf-8');
}

// POST: Create a new case
export async function POST(request: NextRequest) {
  try {
    const { messages, summary } = await request.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Messages array is required' },
        { status: 400 }
      );
    }

    const cases = await loadCases();
    
    const newCase: Case = {
      id: `CASE-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      timestamp: new Date().toISOString(),
      messages: messages.map((msg: any) => ({
        sender: msg.sender,
        text: msg.text,
        timestamp: msg.timestamp || new Date().toISOString(),
      })),
      status: 'open',
      summary: summary || 'Customer enquiry requiring human assistance',
    };

    cases.push(newCase);
    await saveCases(cases);

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
    const { searchParams } = new URL(request.url);
    const caseId = searchParams.get('id');

    const cases = await loadCases();

    if (caseId) {
      const foundCase = cases.find((c) => c.id === caseId);
      if (!foundCase) {
        return NextResponse.json(
          { error: 'Case not found' },
          { status: 404 }
        );
      }
      return NextResponse.json({ case: foundCase });
    }

    return NextResponse.json({ cases });
  } catch (error) {
    console.error('Error fetching cases:', error);
    return NextResponse.json(
      { error: 'Failed to fetch cases' },
      { status: 500 }
    );
  }
}

