import { NextRequest, NextResponse } from 'next/server';
import { loadCaseById, updateCaseStatus, initializeDatabase } from '../../../../lib/db-utils';

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

// PATCH: Update case status
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ caseId: string }> | { caseId: string } }
) {
  try {
    await ensureDatabaseInitialized();
    
    // Handle both Promise and direct params for Next.js compatibility
    const params = context.params instanceof Promise ? await context.params : context.params;
    const { caseId } = params;
    
    if (!caseId) {
      console.error('Case ID is missing from params:', params);
      console.error('Full context:', context);
      return NextResponse.json(
        { error: 'Case ID is required' },
        { status: 400 }
      );
    }
    
    // Decode the caseId in case it was URL encoded
    const decodedCaseId = decodeURIComponent(caseId);
    console.log('PATCH request - Original caseId:', caseId);
    console.log('PATCH request - Decoded caseId:', decodedCaseId);
    
    const { status } = await request.json();

    if (!status || !['open', 'resolved', 'escalated'].includes(status)) {
      return NextResponse.json(
        { error: 'Valid status is required (open, resolved, or escalated)' },
        { status: 400 }
      );
    }

    const updatedCase = await updateCaseStatus(
      decodedCaseId,
      status as 'open' | 'resolved' | 'escalated'
    );

    if (!updatedCase) {
      console.error(`Case not found: ${decodedCaseId}`);
      return NextResponse.json(
        { error: `Case not found: ${decodedCaseId}` },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      case: updatedCase,
    });
  } catch (error) {
    console.error('Error updating case:', error);
    return NextResponse.json(
      { error: 'Failed to update case' },
      { status: 500 }
    );
  }
}

// GET: Get a specific case
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ caseId: string }> | { caseId: string } }
) {
  try {
    await ensureDatabaseInitialized();
    
    // Handle both Promise and direct params for Next.js compatibility
    const params = context.params instanceof Promise ? await context.params : context.params;
    const { caseId } = params;
    
    if (!caseId) {
      console.error('Case ID is missing from params:', params);
      return NextResponse.json(
        { error: 'Case ID is required' },
        { status: 400 }
      );
    }
    
    // Decode the caseId in case it was URL encoded
    const decodedCaseId = decodeURIComponent(caseId);
    const foundCase = await loadCaseById(decodedCaseId);

    if (!foundCase) {
      return NextResponse.json(
        { error: 'Case not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ case: foundCase });
  } catch (error) {
    console.error('Error fetching case:', error);
    return NextResponse.json(
      { error: 'Failed to fetch case' },
      { status: 500 }
    );
  }
}
