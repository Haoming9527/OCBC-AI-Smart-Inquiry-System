'use client';

import { BankingGuide } from '../lib/banking-knowledge';

interface BankingGuideProps {
  guide: BankingGuide;
}

export default function BankingGuideComponent({ guide }: BankingGuideProps) {
  return (
    <div className="my-4 rounded-lg border border-blue-200 bg-blue-50 p-5 dark:border-blue-800 dark:bg-blue-900/20">
      <h3 className="mb-2 text-lg font-semibold text-blue-900 dark:text-blue-100">
        📋 {guide.title}
      </h3>
      {guide.description && (
        <p className="mb-4 text-sm text-blue-700 dark:text-blue-300">
          {guide.description}
        </p>
      )}
      <div className="mb-4 space-y-2.5">
        {guide.steps.map((step, index) => (
          <div key={index} className="flex items-start gap-3">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-semibold text-white">
              {index + 1}
            </div>
            <p className="flex-1 text-sm leading-relaxed text-blue-800 dark:text-blue-200">
              {step}
            </p>
          </div>
        ))}
      </div>
      {guide.importantNotes && guide.importantNotes.length > 0 && (
        <div className="mb-4 rounded-md border-l-4 border-orange-400 bg-orange-50 p-3 dark:border-orange-600 dark:bg-orange-900/20">
          <p className="mb-2 text-xs font-semibold text-orange-800 dark:text-orange-300">
            ⚠️ Important Notes:
          </p>
          <ul className="space-y-1.5">
            {guide.importantNotes.map((note, index) => (
              <li key={index} className="flex items-start gap-2 text-xs text-orange-700 dark:text-orange-300">
                <span className="mt-0.5">•</span>
                <span>{note}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {guide.links && guide.links.length > 0 && (
        <div className="mt-4 border-t border-blue-200 pt-4 dark:border-blue-800">
          <p className="mb-2 text-xs font-semibold text-blue-700 dark:text-blue-300">
            🔗 Useful Links:
          </p>
          <div className="flex flex-wrap gap-2">
            {guide.links.map((link, index) => (
              <a
                key={index}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-blue-700"
              >
                {link.text} →
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

