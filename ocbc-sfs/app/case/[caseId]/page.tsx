'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

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
  escalatedAt?: string;
}

export default function CaseDetailsPage() {
  const params = useParams();
  const caseId = params?.caseId as string;
  const [caseData, setCaseData] = useState<Case | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCase = async () => {
      if (!caseId) return;

      try {
        const response = await fetch(`/api/cases?id=${caseId}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch case');
        }

        setCaseData(data.case);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load case');
      } finally {
        setLoading(false);
      }
    };

    fetchCase();
  }, [caseId]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading case details...</p>
        </div>
      </div>
    );
  }

  if (error || !caseData) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center dark:border-red-800 dark:bg-red-900/20">
          <h1 className="mb-2 text-xl font-semibold text-red-800 dark:text-red-400">
            Case Not Found
          </h1>
          <p className="text-red-600 dark:text-red-300">
            {error || 'The case you are looking for does not exist.'}
          </p>
        </div>
      </div>
    );
  }

  const formattedDate = new Date(caseData.timestamp).toLocaleString();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800">
      <div className="mx-auto max-w-4xl px-4 py-8">
        {/* Header */}
        <div className="mb-6 rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h1 className="mb-2 text-2xl font-bold text-gray-900 dark:text-white">
                Case Details
              </h1>
              <p className="text-sm font-mono text-gray-500 dark:text-gray-400">
                {caseData.id}
              </p>
            </div>
            <div className="text-right">
              <span
                className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${
                  caseData.status === 'escalated'
                    ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400'
                    : caseData.status === 'resolved'
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                    : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                }`}
              >
                {caseData.status.toUpperCase()}
              </span>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Created</p>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {formattedDate}
              </p>
            </div>
            {caseData.escalatedAt && (
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Escalated</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {new Date(caseData.escalatedAt).toLocaleString()}
                </p>
              </div>
            )}
          </div>
          {caseData.summary && (
            <div className="mt-4 rounded-lg bg-gray-50 p-4 dark:bg-gray-700/50">
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                Summary
              </p>
              <p className="mt-1 text-sm text-gray-900 dark:text-white">
                {caseData.summary}
              </p>
            </div>
          )}
        </div>

        {/* Chat History */}
        <div className="rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Chat History
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Complete conversation transcript
            </p>
          </div>
          <div className="space-y-4 p-6">
            {caseData.messages.map((message, index) => {
              const isUser = message.sender === 'user';
              const messageTime = new Date(message.timestamp).toLocaleTimeString();

              return (
                <div
                  key={index}
                  className={`flex items-start gap-3 ${
                    isUser ? 'flex-row-reverse' : 'flex-row'
                  }`}
                >
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                      isUser
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                    }`}
                  >
                    {isUser ? (
                      <svg
                        className="h-5 w-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="h-5 w-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                        />
                      </svg>
                    )}
                  </div>
                  <div
                    className={`flex max-w-[80%] flex-col gap-1 ${
                      isUser ? 'items-end' : 'items-start'
                    }`}
                  >
                    <div
                      className={`rounded-2xl px-4 py-3 shadow-sm ${
                        isUser
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-900 dark:bg-gray-700 dark:text-gray-100'
                      }`}
                    >
                      <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">
                        {message.text}
                      </p>
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {messageTime}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 flex gap-4">
          <a
            href="/"
            className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2 text-center text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            Back to Chat
          </a>
          <button
            onClick={() => window.print()}
            className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
          >
            Print Case
          </button>
        </div>
      </div>
    </div>
  );
}

