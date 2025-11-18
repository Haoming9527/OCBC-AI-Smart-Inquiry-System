import { NextRequest, NextResponse } from 'next/server';
import { initializeDatabase } from '../../../../../lib/db-utils';
import { sql } from '../../../../../lib/db';

function toCsv(rows: string[][]): string {
  return rows
    .map((row) =>
      row
        .map((value) => {
          const str = value ?? '';
          const escaped = str.replace(/"/g, '""');
          return `"${escaped}"`;
        })
        .join(',')
    )
    .join('\n');
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ caseId: string }> | { caseId: string } }
) {
  try {
    await initializeDatabase();
    const resolvedParams = await Promise.resolve(context.params);
    const caseId = resolvedParams.caseId;

    if (!caseId) {
      return NextResponse.json({ error: 'Case ID is required' }, { status: 400 });
    }

    const caseResult = await sql`
      SELECT id, status, summary, contact_email, contact_phone, timestamp, escalated_at
      FROM cases
      WHERE id = ${caseId}
      LIMIT 1
    `;

    if (caseResult.length === 0) {
      return NextResponse.json({ error: 'Case not found' }, { status: 404 });
    }

    const caseRow = caseResult[0];
    const messages = await sql`
      SELECT sender, text, timestamp
      FROM messages
      WHERE case_id = ${caseId}
      ORDER BY timestamp ASC
    `;

    const header = [
      'Message #',
      'Sender',
      'Text',
      'Timestamp',
    ];

    const rows: string[][] = [
      ['Case ID', caseRow.id],
      ['Status', caseRow.status],
      ['Summary', caseRow.summary || ''],
      ['Contact Email', caseRow.contact_email || ''],
      ['Contact Phone', caseRow.contact_phone || ''],
      ['Created At', caseRow.timestamp ? new Date(caseRow.timestamp).toISOString() : ''],
      ['Escalated At', caseRow.escalated_at ? new Date(caseRow.escalated_at).toISOString() : ''],
      [],
      header,
      ...messages.map((msg: any, index: number) => [
        `${index + 1}`,
        msg.sender,
        msg.text || '',
        msg.timestamp ? new Date(msg.timestamp).toISOString() : '',
      ]),
    ];

    const csv = toCsv(rows);

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="case-${caseId}.csv"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('Error exporting case:', error);
    return NextResponse.json({ error: 'Failed to export case' }, { status: 500 });
  }
}

