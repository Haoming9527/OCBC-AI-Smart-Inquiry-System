import { NextRequest, NextResponse } from 'next/server';
import { initializeDatabase } from '../../../../lib/db-utils';
import { sql } from '../../../../lib/db';

function serializeCsv(rows: string[][]): string {
  return rows
    .map((row) =>
      row
        .map((value) => {
          const str = value ?? '';
          const escaped = str.toString().replace(/"/g, '""');
          return `"${escaped}"`;
        })
        .join(',')
    )
    .join('\n');
}

export async function GET(request: NextRequest) {
  try {
    await initializeDatabase();

    const { searchParams } = new URL(request.url);
    const format = (searchParams.get('format') || 'csv').toLowerCase();
    const statusFilter = searchParams.get('status');

    if (format !== 'csv') {
      return NextResponse.json({ error: 'Unsupported format' }, { status: 400 });
    }

    const cases = await sql`
      SELECT
        c.id,
        c.timestamp,
        c.status,
        c.summary,
        c.contact_email,
        c.contact_phone,
        c.escalated_at,
        COUNT(m.id) AS message_count
      FROM cases c
      LEFT JOIN messages m ON m.case_id = c.id
      ${statusFilter && statusFilter !== 'all' ? sql`WHERE c.status = ${statusFilter}` : sql``}
      GROUP BY c.id
      ORDER BY c.timestamp DESC
    `;

    const rows: string[][] = [
      ['Case ID', 'Created At', 'Status', 'Summary', 'Contact Email', 'Contact Phone', 'Escalated At', 'Message Count'],
      ...cases.map((row: any) => [
        row.id,
        row.timestamp ? new Date(row.timestamp).toISOString() : '',
        row.status,
        row.summary || '',
        row.contact_email || '',
        row.contact_phone || '',
        row.escalated_at ? new Date(row.escalated_at).toISOString() : '',
        row.message_count?.toString() ?? '0',
      ]),
    ];

    const csv = serializeCsv(rows);

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="ocbc-cases-${Date.now()}.csv"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('Error exporting cases:', error);
    return NextResponse.json({ error: 'Failed to export cases' }, { status: 500 });
  }
}
