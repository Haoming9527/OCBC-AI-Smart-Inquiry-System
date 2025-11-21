'use client';

import { Message } from './ChatBot';
import { getSentimentEmoji, getSentimentColor } from '../../lib/sentiment-utils';

interface MessageBubbleProps {
  message: Message;
  speechSupported?: boolean;
  isSpeaking?: boolean;
  isSpeechPaused?: boolean;
  onToggleSpeak?: () => void;
}

export default function MessageBubble({
  message,
  speechSupported = false,
  isSpeaking = false,
  isSpeechPaused = false,
  onToggleSpeak,
}: MessageBubbleProps) {
  const isUser = message.sender === 'user';
  const timeString = message.timestamp.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div
      className={`flex items-end gap-3 ${
        isUser ? 'flex-row-reverse' : 'flex-row'
      }`}
    >
      {/* Avatar */}
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

      {/* Message Content */}
      <div
        className={`flex max-w-[80%] flex-col gap-1 ${
          isUser ? 'items-end' : 'items-start'
        }`}
      >
        <div
          className={`rounded-2xl px-4 py-3 shadow-sm ${
            isUser
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-900 dark:bg-gray-700 dark:text-gray-100'
          }`}
        >
          <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">
            {message.text}
          </p>
        </div>
        <div className={`flex items-center gap-2 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {timeString}
          </span>
          {isUser && message.sentiment && (
            <span
              className={`text-xs font-medium ${getSentimentColor(message.sentiment.label)}`}
              title={`Sentiment: ${message.sentiment.label} (${message.sentiment.magnitude})`}
            >
              {getSentimentEmoji(message.sentiment.label)} {message.sentiment.label}
            </span>
          )}
          {!isUser && speechSupported && (
            <button
              type="button"
              onClick={onToggleSpeak}
              className="inline-flex items-center gap-1 rounded-full border border-gray-300 px-3 py-1 text-xs font-medium text-gray-600 transition hover:border-blue-400 hover:text-blue-600 dark:border-gray-600 dark:text-gray-200 dark:hover:border-blue-400 dark:hover:text-blue-200"
            >
              <svg
                className="h-3.5 w-3.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d={
                    isSpeaking
                      ? isSpeechPaused
                        ? 'M12 5v14M5 12h14'
                        : 'M10 9v6m4-6v6'
                      : 'M8 5v14l11-7z'
                  }
                />
              </svg>
              <span>
                {isSpeaking ? (isSpeechPaused ? 'Resume voice' : 'Pause voice') : 'Play voice'}
              </span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

