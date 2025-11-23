'use client';

import { useEffect, useRef, useState, KeyboardEvent } from 'react';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  placeholder?: string;
  language?: 'en' | 'zh';
}

export default function ChatInput({
  onSendMessage,
  placeholder = 'Type your message here...',
  language = 'en',
}: ChatInputProps) {
  const [input, setInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);
  const [recordingError, setRecordingError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);
  const baseTextRef = useRef('');

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setSpeechSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = language === 'zh' ? 'zh-CN' : 'en-US';
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results)
        .map((result: any) => result[0]?.transcript ?? '')
        .join('');
      setInput(baseTextRef.current + transcript);
    };

    recognition.onerror = (event: any) => {
      setIsRecording(false);
      setRecordingError(
        event.error === 'not-allowed'
          ? 'Microphone access denied.'
          : 'Voice input unavailable. Please try again.'
      );
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.stop?.();
    };
  }, [language]);

  useEffect(() => {
    if (recognitionRef.current) {
      recognitionRef.current.lang = language === 'zh' ? 'zh-CN' : 'en-US';
    }
  }, [language]);

  const handleSend = () => {
    if (recognitionRef.current && isRecording) {
      recognitionRef.current.stop();
    }

    if (input.trim()) {
      onSendMessage(input);
      setInput('');
    }
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const toggleRecording = () => {
    if (!speechSupported || !recognitionRef.current) {
      return;
    }

    setRecordingError(null);

    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
      baseTextRef.current = input;
      return;
    }

    try {
      baseTextRef.current = input;
      recognitionRef.current.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Speech recognition error:', error);
      setRecordingError('Unable to access microphone.');
      setIsRecording(false);
    }
  };

  const isSendDisabled = !input.trim();

  return (
    <div className="space-y-2">
      <div className="flex items-end gap-3 rounded-2xl border border-gray-200 bg-gray-50 p-3 dark:border-gray-600 dark:bg-gray-700">
        <button
          type="button"
          onClick={toggleRecording}
          disabled={!speechSupported}
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border transition ${
            isRecording
              ? 'border-red-500 bg-red-50 text-red-600 dark:border-red-400 dark:bg-red-900/30 dark:text-red-200'
              : 'border-gray-300 text-gray-600 hover:border-[#E11A27] hover:text-[#E11A27] dark:border-gray-500 dark:text-gray-300'
          } ${!speechSupported ? 'cursor-not-allowed opacity-50' : ''}`}
          aria-label={isRecording ? 'Stop voice input' : 'Start voice input'}
          title={speechSupported ? 'Voice input' : 'Voice input not supported'}
        >
          <svg
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth={2}
          >
            {isRecording ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            ) : (
              <>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                />
              </>
            )}
          </svg>
        </button>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder={placeholder}
          rows={1}
          className="max-h-32 flex-1 resize-none border-none bg-transparent text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-0 dark:text-gray-100 dark:placeholder-gray-400"
          style={{
            height: 'auto',
            minHeight: '24px',
          }}
          onInput={(e) => {
            const target = e.target as HTMLTextAreaElement;
            target.style.height = 'auto';
            target.style.height = `${Math.min(target.scrollHeight, 128)}px`;
          }}
        />
        <button
          onClick={handleSend}
          disabled={isSendDisabled}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#E11A27] text-white transition-all hover:bg-[#C41622] hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-[#E11A27] active:scale-95"
          aria-label="Send message"
        >
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
              d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
            />
          </svg>
        </button>
      </div>
      {!speechSupported && (
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Voice input is not supported in this browser. Try the latest version of Chrome, Edge, or Safari.
        </p>
      )}
      {recordingError && (
        <p className="text-xs text-red-600 dark:text-red-400">{recordingError}</p>
      )}
    </div>
  );
}

