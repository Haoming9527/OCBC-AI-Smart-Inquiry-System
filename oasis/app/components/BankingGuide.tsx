'use client';

import { BankingGuide } from '../lib/banking-knowledge';

interface BankingGuideProps {
  guide: BankingGuide;
}

export default function BankingGuideComponent({ guide }: BankingGuideProps) {
  return (
    <div className="my-4 rounded-lg border border-[#FFE5E7] bg-[#FFE5E7]/50 p-5 shadow-sm dark:border-[#E11A27]/40 dark:bg-[#E11A27]/10">
      <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-gray-100">
        📋 {guide.title}
      </h3>
      {guide.description && (
        <p className="mb-4 text-sm text-gray-700 dark:text-gray-300">
          {guide.description}
        </p>
      )}
      <div className="mb-4 space-y-2.5">
        {guide.steps.map((step, index) => (
          <div key={index} className="flex items-start gap-3">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#E11A27] text-xs font-semibold text-white shadow-sm">
              {index + 1}
            </div>
            <p className="flex-1 text-sm leading-relaxed text-gray-800 dark:text-gray-200">
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
        <div className="mt-4 border-t border-[#FFE5E7] pt-4 dark:border-[#E11A27]/40">
          <p className="mb-2 text-xs font-semibold text-gray-700 dark:text-gray-300">
            🔗 Useful Links:
          </p>
          <div className="flex flex-wrap gap-2">
            {guide.links.map((link, index) => (
              <a
                key={index}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-md bg-[#E11A27] px-3 py-1.5 text-xs font-medium text-white transition-all hover:bg-[#C41622] hover:shadow-md active:scale-95"
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

