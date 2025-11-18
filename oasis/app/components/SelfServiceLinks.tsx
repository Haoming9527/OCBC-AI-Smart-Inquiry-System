'use client';

import { SelfServiceLink } from '../lib/banking-knowledge';

interface SelfServiceLinksProps {
  links: SelfServiceLink[];
  heading?: string;
  className?: string;
}

export default function SelfServiceLinksComponent({
  links,
  heading = '🔗 Self-Service Options',
  className = 'my-4',
}: SelfServiceLinksProps) {
  if (links.length === 0) return null;

  return (
    <div className={`${className} rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-900/20`}>
      {heading && (
        <h3 className="mb-3 text-lg font-semibold text-green-900 dark:text-green-100">
          {heading}
        </h3>
      )}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {links.map((link) => (
          <a
            key={link.id}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group rounded-lg border border-green-200 bg-white p-4 transition-all hover:border-green-400 hover:shadow-md dark:border-green-800 dark:bg-gray-800 dark:hover:border-green-600"
          >
            <div className="mb-2 flex items-center gap-2">
              {link.icon && <span className="text-xl">{link.icon}</span>}
              <h4 className="font-semibold text-green-900 group-hover:text-green-700 dark:text-green-100 dark:group-hover:text-green-300">
                {link.title}
              </h4>
            </div>
            <p className="text-xs leading-relaxed text-green-700 dark:text-green-300">
              {link.description}
            </p>
          </a>
        ))}
      </div>
    </div>
  );
}

