'use client';

import { useState, useEffect } from 'react';
import { Message } from './ChatBot';

interface EscalationQRProps {
  caseId: string;
  messages: Message[];
}

export default function EscalationQR({ caseId, messages }: EscalationQRProps) {
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [caseUrl, setCaseUrl] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const generateQR = async () => {
      try {
        const response = await fetch(`/api/cases/qrcode?caseId=${caseId}`);
        const data = await response.json();
        
        if (data.qrCode) {
          setQrCode(data.qrCode);
          setCaseUrl(data.caseUrl);
        }
      } catch (error) {
        console.error('Error generating QR code:', error);
      } finally {
        setLoading(false);
      }
    };

    generateQR();
  }, [caseId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="text-gray-500">Generating QR code...</div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-md dark:border-gray-700 dark:bg-gray-800">
      <div className="mb-4 text-center">
        <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
          Case Escalated
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Please scan this QR code to view case details
        </p>
      </div>
      
      {qrCode && (
        <div className="flex flex-col items-center gap-4">
          <div className="rounded-lg border-2 border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
            <img
              src={qrCode}
              alt="Case QR Code"
              className="h-64 w-64"
            />
          </div>
          
          <div className="w-full space-y-2 text-center">
            <p className="text-xs font-mono text-gray-500 dark:text-gray-400">
              Case ID: {caseId}
            </p>
            <a
              href={caseUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block text-sm text-[#E11A27] hover:underline dark:text-[#F02A37] font-medium"
            >
              View Case Details
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

