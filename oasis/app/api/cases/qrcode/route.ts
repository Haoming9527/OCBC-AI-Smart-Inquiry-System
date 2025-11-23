import { NextRequest, NextResponse } from 'next/server';
import QRCode from 'qrcode';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const caseId = searchParams.get('caseId');

    if (!caseId) {
      return NextResponse.json(
        { error: 'caseId is required' },
        { status: 400 }
      );
    }

    // Create URL that will be encoded in QR code
    // Try to get base URL from environment variable, request headers, or fallback to localhost
    let baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
    
    if (!baseUrl) {
      const host = request.headers.get('host');
      const protocol = request.headers.get('x-forwarded-proto') || 
                      (host?.includes('localhost') ? 'http' : 'https');
      baseUrl = host ? `${protocol}://${host}` : 'http://localhost:3000';
    }
    
    const caseUrl = `${baseUrl}/case/${caseId}`;

    // Generate QR code as data URL (PNG image)
    const qrCodeDataUrl = await QRCode.toDataURL(caseUrl, {
      width: 400,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    });

    return NextResponse.json({
      qrCode: qrCodeDataUrl,
      caseUrl: caseUrl,
      caseId: caseId,
    });
  } catch (error) {
    console.error('Error generating QR code:', error);
    return NextResponse.json(
      { error: 'Failed to generate QR code' },
      { status: 500 }
    );
  }
}

