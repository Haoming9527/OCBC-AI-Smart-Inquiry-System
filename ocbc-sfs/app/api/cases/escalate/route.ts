import { NextRequest, NextResponse } from 'next/server';
import { readFile, writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

const CASES_DIR = path.join(process.cwd(), 'data', 'cases');
const CASES_FILE = path.join(CASES_DIR, 'cases.json');

async function loadCases() {
  if (!existsSync(CASES_FILE)) {
    return [];
  }
  try {
    const data = await readFile(CASES_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error loading cases:', error);
    return [];
  }
}

async function saveCases(cases: any[]) {
  if (!existsSync(CASES_DIR)) {
    await mkdir(CASES_DIR, { recursive: true });
  }
  await writeFile(CASES_FILE, JSON.stringify(cases, null, 2), 'utf-8');
}

// POST: Escalate a case (mark as escalated and return case ID)
export async function POST(request: NextRequest) {
  try {
    const { messages, reason } = await request.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Messages array is required' },
        { status: 400 }
      );
    }

    const cases = await loadCases();
    
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

    cases.push(newCase);
    await saveCases(cases);

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

