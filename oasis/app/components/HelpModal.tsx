'use client';

import { selfServiceLinks } from '../lib/banking-knowledge';
import SelfServiceLinksComponent from './SelfServiceLinks';

interface HelpModalProps {
  open: boolean;
  onClose: () => void;
}

const howItWorksSteps = [
  {
    title: 'Ask your question',
    description: 'Type your inquiry or request directly in the chat box. You can also add images (coming soon) for faster support.',
  },
  {
    title: 'AI + Knowledge Base',
    description: 'The chatbot combines banking guides, self-service tools, and live data to craft a tailored response.',
  },
  {
    title: 'Escalate when needed',
    description: 'If the issue is complex, the assistant automatically prepares a case for a human specialist.',
  },
];

export default function HelpModal({ open, onClose }: HelpModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative z-10 m-4 w-full max-w-4xl rounded-2xl bg-white shadow-2xl dark:bg-gray-900">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-800">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Help &amp; Support</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">Quick links, FAQs, and chatbot tips in one place.</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-gray-500 transition hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
            aria-label="Close help modal"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="max-h-[80vh] overflow-y-auto px-6 py-6 space-y-8">
          {/* How it works */}
          <section className="rounded-xl border border-blue-100 bg-blue-50/60 p-5 dark:border-blue-900/40 dark:bg-blue-950/20">
            <h3 className="mb-4 text-lg font-semibold text-blue-900 dark:text-blue-100">How this chatbot works</h3>
            <div className="grid gap-4 md:grid-cols-3">
              {howItWorksSteps.map((step) => (
                <div
                  key={step.title}
                  className="rounded-lg border border-blue-100 bg-white/80 p-4 shadow-sm dark:border-blue-900/40 dark:bg-blue-950/40"
                >
                  <h4 className="mb-1 text-sm font-semibold text-blue-900 dark:text-blue-100">{step.title}</h4>
                  <p className="text-xs text-blue-800 dark:text-blue-200">{step.description}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Self-service links */}
          <section>
            <h3 className="mb-3 text-lg font-semibold text-gray-900 dark:text-gray-100">Popular self-service options</h3>
            <SelfServiceLinksComponent
              links={selfServiceLinks.slice(0, 6)}
              heading=""
              className="my-2"
            />
          </section>

          {/* Help & Support CTA */}
          <section className="rounded-xl border border-gray-200 bg-gray-50 p-5 dark:border-gray-800 dark:bg-gray-800/40">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Visit OCBC Help &amp; Support Centre</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Browse the full FAQ library, download forms, and access every contact channel in one place.
                </p>
              </div>
              <a
                href="https://www.ocbc.com/personal-banking/help-and-support"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-red-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-400 dark:bg-red-500 dark:hover:bg-red-600"
              >
                Go to Help Centre
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </a>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

