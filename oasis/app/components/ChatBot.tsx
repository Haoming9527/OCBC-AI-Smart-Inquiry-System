'use client';

import { useState, useRef, useEffect, ChangeEvent } from 'react';
import MessageBubble from './MessageBubble';
import ChatInput from './ChatInput';
import EscalationQR from './EscalationQR';
import BankingGuide from './BankingGuide';
import SelfServiceLinks from './SelfServiceLinks';
import ChatHistory from './ChatHistory';
import HelpModal from './HelpModal';
import { detectBankingQuery, BankingGuide as BankingGuideType, SelfServiceLink } from '../lib/banking-knowledge';
import { analyzeSentiment, shouldEscalateBySentiment, SentimentAnalysis } from '../../lib/sentiment-utils';

export interface MessageAttachment {
  id: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  data: string;
}

export interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  guide?: BankingGuideType;
  links?: SelfServiceLink[];
  sentiment?: SentimentAnalysis;
  attachments?: MessageAttachment[];
}

// Escalation detection logic
function shouldEscalate(botResponse: string, userMessage: string, userSentiment?: SentimentAnalysis): boolean {
  const escalationKeywords = [
    'cannot help',
    "can't help",
    'unable to assist',
    'need human',
    'speak to someone',
    'talk to agent',
    'transfer',
    'escalate',
    'complex issue',
    'not sure',
    'unclear',
  ];

  const userEscalationKeywords = [
    'speak to human',
    'talk to person',
    'agent',
    'representative',
    'manager',
    'supervisor',
    'escalate',
    'transfer',
    'complex',
    'complicated',
    'urgent',
    'emergency',
  ];

  const botLower = botResponse.toLowerCase();
  const userLower = userMessage.toLowerCase();

  // Check if bot response indicates it can't help
  const botNeedsEscalation = escalationKeywords.some((keyword) =>
    botLower.includes(keyword)
  );

  // Check if user explicitly requests escalation
  const userRequestsEscalation = userEscalationKeywords.some((keyword) =>
    userLower.includes(keyword)
  );

  // Check if sentiment indicates escalation is needed
  const sentimentNeedsEscalation = userSentiment ? shouldEscalateBySentiment(userSentiment) : false;

  return botNeedsEscalation || userRequestsEscalation || sentimentNeedsEscalation;
}

export default function ChatBot() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Hello! I\'m your OCBC AI Smart Inquiry System (OASIS) assistant. How can I help you today?',
      sender: 'bot',
      timestamp: new Date(),
    },
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const [escalatedCaseId, setEscalatedCaseId] = useState<string | null>(null);
  const [showEscalation, setShowEscalation] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string>('');
  const [showHistory, setShowHistory] = useState(false);
  const [viewingSessionId, setViewingSessionId] = useState<string | null>(null);
  const [viewingSessionMessages, setViewingSessionMessages] = useState<Message[]>([]);
  const [showHelp, setShowHelp] = useState(false);
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize user ID and session
  useEffect(() => {
    // Get or create user ID
    let storedUserId = localStorage.getItem('chat_user_id');
    if (!storedUserId) {
      storedUserId = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('chat_user_id', storedUserId);
    }
    setUserId(storedUserId);

    // Create new session
    const createSession = async () => {
      try {
        const response = await fetch('/api/chat/history', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: storedUserId }),
        });
        const data = await response.json();
        if (data.session) {
          setCurrentSessionId(data.session.id);
          // Save initial bot message
          await saveMessageToHistory(data.session.id, storedUserId!, 'bot', messages[0].text, []);
        }
      } catch (error) {
        console.error('Error creating session:', error);
      }
    };
    createSession();
  }, []);

  // Load stored contact preferences
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const savedEmail = localStorage.getItem('chat_contact_email');
    const savedPhone = localStorage.getItem('chat_contact_phone');
    if (savedEmail) setContactEmail(savedEmail);
    if (savedPhone) setContactPhone(savedPhone);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('chat_contact_email', contactEmail);
    localStorage.setItem('chat_contact_phone', contactPhone);
  }, [contactEmail, contactPhone]);

  // Save message to history
  const saveMessageToHistory = async (
    sessionId: string,
    userId: string,
    sender: 'user' | 'bot',
    text: string,
    attachments?: MessageAttachment[]
  ) => {
    try {
      await fetch('/api/chat/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          userId,
          sender,
          text,
          attachments:
            attachments?.map((attachment) => ({
              id: attachment.id,
              fileName: attachment.fileName,
              mimeType: attachment.mimeType,
              fileSize: attachment.fileSize,
              data: attachment.data,
            })) || [],
        }),
      });
    } catch (error) {
      console.error('Error saving message:', error);
    }
  };

  const mapApiMessageToClient = (msg: any): Message => {
    const attachments = Array.isArray(msg.attachments)
      ? msg.attachments.map((attachment: any) => ({
          id: attachment.id?.toString() ?? `att-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
          fileName: attachment.fileName ?? attachment.file_name ?? 'attachment',
          mimeType: attachment.mimeType ?? attachment.mime_type ?? 'application/octet-stream',
          fileSize: attachment.fileSize ?? attachment.file_size ?? 0,
          data: attachment.data ?? '',
        }))
      : [];

    return {
      id: msg.id?.toString() ?? Date.now().toString(),
      text: msg.text ?? '',
      sender: msg.sender as 'user' | 'bot',
      timestamp: new Date(msg.timestamp),
      sentiment: msg.sentiment
        ? {
            score: msg.sentiment.score,
            comparative: msg.sentiment.comparative,
            label: msg.sentiment.label,
            magnitude: msg.sentiment.magnitude,
          }
        : undefined,
      attachments: attachments.length ? attachments : undefined,
    };
  };

  const fileToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(',')[1] || '';
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const buildAttachmentPayload = async (files: File[]): Promise<MessageAttachment[]> => {
    const payloads = await Promise.all(
      files.map(async (file) => ({
        id: `att-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        fileName: file.name,
        mimeType: file.type || 'application/octet-stream',
        fileSize: file.size,
        data: await fileToBase64(file),
      }))
    );
    return payloads;
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSendMessage = async (text: string, files: File[] = []) => {
    const trimmedText = text.trim();
    if (!trimmedText && files.length === 0) return;

    const attachments = files.length ? await buildAttachmentPayload(files) : [];
    const messageText = trimmedText || (attachments.length > 0 ? '[Image attachment]' : '');
    const llmText = trimmedText || (attachments.length > 0 ? 'User shared image attachment(s).' : '');
    const sanitizedEmail = contactEmail.trim() || null;
    const sanitizedPhone = contactPhone.trim() || null;

    // Analyze sentiment only when there is textual content
    const userSentiment = trimmedText ? analyzeSentiment(trimmedText) : undefined;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: messageText,
      sender: 'user',
      timestamp: new Date(),
      sentiment: userSentiment,
      attachments: attachments.length ? attachments : undefined,
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsTyping(true);

    // Save user message to history
    if (currentSessionId && userId) {
      await saveMessageToHistory(currentSessionId, userId, 'user', messageText, attachments);
    }

    try {
      // Call our API route which connects to Ollama
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
          body: JSON.stringify({
            messages: [...messages, { ...userMessage, text: llmText }],
          }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get response');
      }

      const botResponse = data.message || 'Sorry, I could not generate a response.';
      
      // Detect banking queries and get relevant guides/links
      const bankingInfo = detectBankingQuery(trimmedText || '');
      
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: botResponse,
        sender: 'bot',
        timestamp: new Date(),
        guide: bankingInfo.guide || undefined,
        links: bankingInfo.links.length > 0 ? bankingInfo.links : undefined,
      };

      setMessages((prev) => [...prev, botMessage]);

      // Save bot message to history
      if (currentSessionId && userId) {
        await saveMessageToHistory(currentSessionId, userId, 'bot', botResponse, []);
      }

      // Check if escalation is needed (including sentiment-based escalation)
      const needsEscalation = shouldEscalate(botResponse, trimmedText || '', userSentiment);
      
      if (needsEscalation && !escalatedCaseId) {
        // Create case and generate QR code
        try {
          const escalateResponse = await fetch('/api/cases/escalate', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              messages: [...messages, userMessage, botMessage],
              reason: 'Bot unable to handle customer enquiry',
              contactEmail: sanitizedEmail,
              contactPhone: sanitizedPhone,
            }),
          });

          const escalateData = await escalateResponse.json();
          
          if (escalateData.caseId) {
            setEscalatedCaseId(escalateData.caseId);
            setShowEscalation(true);
            
            // Add escalation message
            const escalationMessage: Message = {
              id: (Date.now() + 2).toString(),
              text:
                'I understand this requires additional assistance. I\'ve created a case and generated a QR code for you. Please scan it to transfer your enquiry to our support team.' +
                (sanitizedEmail || sanitizedPhone
                  ? ' We will also reach out using the contact details you provided.'
                  : ''),
              sender: 'bot',
              timestamp: new Date(),
            };
            setMessages((prev) => [...prev, escalationMessage]);
          }
        } catch (error) {
          console.error('Error escalating case:', error);
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: error instanceof Error 
          ? `Error: ${error.message}. Please make sure Ollama is installed and running. See setup instructions in the README.`
          : 'Sorry, there was an error processing your message. Please try again.',
        sender: 'bot',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex h-screen flex-col bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800">
      {/* History Sidebar */}
      {showHistory && (
        <ChatHistory
          userId={userId}
          onClose={() => setShowHistory(false)}
          onLoadSession={async (sessionId: string) => {
            try {
              const response = await fetch(`/api/chat/history?sessionId=${sessionId}&userId=${userId}`);
              const data = await response.json();
              if (data.session) {
                setCurrentSessionId(sessionId);
                setMessages(data.session.messages.map(mapApiMessageToClient));
                setShowHistory(false);
                setViewingSessionId(null);
                setViewingSessionMessages([]);
              }
            } catch (error) {
              console.error('Error loading session:', error);
            }
          }}
          onViewSession={async (sessionId: string) => {
            try {
              const response = await fetch(`/api/chat/history?sessionId=${sessionId}&userId=${userId}`);
              const data = await response.json();
              if (data.session) {
                setViewingSessionId(sessionId);
                setViewingSessionMessages(
                  data.session.messages.map(mapApiMessageToClient)
                );
                setShowHistory(false);
              }
            } catch (error) {
              console.error('Error viewing session:', error);
            }
          }}
        />
      )}
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="flex h-10 w-10 items-center justify-center rounded-lg text-gray-600 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
            title="Chat History"
          >
            <svg
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </button>
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-white">
            <svg
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
              />
            </svg>
          </div>
          <div>
            <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
              OCBC AI Smart Inquiry System (OASIS)
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              AI Assistant
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowHelp(true)}
          className="inline-flex items-center gap-2 rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-400 dark:bg-red-500 dark:hover:bg-red-600"
        >
          <span>Need Help?</span>
          <svg
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>
      </div>

      {/* Viewing Session Overlay */}
      {viewingSessionId && viewingSessionMessages.length > 0 && (
        <div className="fixed inset-0 z-40 flex justify-end">
          {/* Soft overlay to suggest modal state without hiding chat */}
          <div
            className="absolute inset-0 bg-black/10 dark:bg-black/40"
            aria-hidden="true"
            onClick={() => {
              setViewingSessionId(null);
              setViewingSessionMessages([]);
            }}
          />
          <div className="relative h-full w-full max-w-4xl bg-white shadow-2xl dark:bg-gray-800 flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Viewing Conversation
              </h2>
              <button
                onClick={() => {
                  setViewingSessionId(null);
                  setViewingSessionMessages([]);
                }}
                className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
              >
                <svg
                  className="h-6 w-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-6">
              <div className="mx-auto max-w-3xl space-y-4">
                {viewingSessionMessages.map((message) => (
                  <div key={message.id} className="space-y-2">
                    <MessageBubble message={message} />
                    {message.sender === 'bot' && message.guide && (
                      <BankingGuide guide={message.guide} />
                    )}
                    {message.sender === 'bot' && message.links && message.links.length > 0 && (
                      <SelfServiceLinks links={message.links} />
                    )}
                  </div>
                ))}
              </div>
            </div>
            {/* Footer */}
            <div className="border-t border-gray-200 px-6 py-4 dark:border-gray-700">
              <button
                onClick={async () => {
                  setCurrentSessionId(viewingSessionId);
                  setMessages(viewingSessionMessages);
                  setViewingSessionId(null);
                  setViewingSessionMessages([]);
                }}
                className="w-full rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
              >
                Load This Conversation
              </button>
            </div>
          </div>
        </div>
      )}

      <HelpModal open={showHelp} onClose={() => setShowHelp(false)} />

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="mx-auto max-w-3xl space-y-4">
          {messages.map((message) => (
            <div key={message.id} className="space-y-2">
              <MessageBubble message={message} />
              {message.sender === 'bot' && message.guide && (
                <BankingGuide guide={message.guide} />
              )}
              {message.sender === 'bot' && message.links && message.links.length > 0 && (
                <SelfServiceLinks links={message.links} />
              )}
            </div>
          ))}
          {showEscalation && escalatedCaseId && (
            <EscalationQR caseId={escalatedCaseId} messages={messages} />
          )}
          {isTyping && (
            <div className="flex items-center gap-2">
              <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700"></div>
              <div className="flex gap-1 rounded-2xl bg-white px-4 py-3 shadow-sm dark:bg-gray-700">
                <div className="h-2 w-2 animate-bounce rounded-full bg-gray-400 [animation-delay:-0.3s]"></div>
                <div className="h-2 w-2 animate-bounce rounded-full bg-gray-400 [animation-delay:-0.15s]"></div>
                <div className="h-2 w-2 animate-bounce rounded-full bg-gray-400"></div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="border-t border-gray-200 bg-white px-4 py-4 dark:border-gray-700 dark:bg-gray-800">
        <div className="mx-auto max-w-3xl">
          <div className="mb-4 rounded-2xl border border-blue-100 bg-blue-50/70 p-4 text-sm text-blue-900 dark:border-blue-900/40 dark:bg-blue-900/10 dark:text-blue-100">
            <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <p className="font-semibold">Share contact details (optional)</p>
              <span className="text-xs text-blue-700 dark:text-blue-200">
                We&apos;ll only use this if a human specialist needs to follow up.
              </span>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-blue-800 dark:text-blue-200">
                  Email
                </label>
                <input
                  type="email"
                  value={contactEmail}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setContactEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full rounded-lg border border-blue-200 bg-white px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-blue-900/40 dark:bg-blue-950/40 dark:text-blue-50"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-blue-800 dark:text-blue-200">
                  SMS / Phone
                </label>
                <input
                  type="tel"
                  value={contactPhone}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setContactPhone(e.target.value)}
                  placeholder="+65 9123 4567"
                  className="w-full rounded-lg border border-blue-200 bg-white px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-blue-900/40 dark:bg-blue-950/40 dark:text-blue-50"
                />
              </div>
            </div>
          </div>
          <div className="mb-2 flex items-center justify-between">
            {!showEscalation && (
              <button
                onClick={async () => {
                  const sanitizeEmail = contactEmail.trim() || null;
                  const sanitizePhone = contactPhone.trim() || null;
                  try {
                    const escalateResponse = await fetch('/api/cases/escalate', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify({
                        messages: messages,
                        reason: 'Manual escalation requested by user',
                        contactEmail: sanitizeEmail,
                        contactPhone: sanitizePhone,
                      }),
                    });

                    const escalateData = await escalateResponse.json();
                    
                    if (escalateData.caseId) {
                      setEscalatedCaseId(escalateData.caseId);
                      setShowEscalation(true);
                      
                      const escalationMessage: Message = {
                        id: Date.now().toString(),
                        text:
                          'I\'ve created a case and generated a case reference for you. Please scan the QR code to share the details with our support team.' +
                          (sanitizeEmail || sanitizePhone
                            ? ' We will also reach out using your provided contact details.'
                            : ''),
                        sender: 'bot',
                        timestamp: new Date(),
                      };
                      setMessages((prev) => [...prev, escalationMessage]);
                    }
                  } catch (error) {
                    console.error('Error escalating case:', error);
                  }
                }}
                className="text-sm text-blue-600 hover:underline dark:text-blue-400"
              >
                Need human assistance? Click here
              </button>
            )}
            {showEscalation && (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Case escalated - QR code displayed above
              </p>
            )}
          </div>
          <ChatInput onSendMessage={handleSendMessage} />
        </div>
      </div>
    </div>
  );
}

