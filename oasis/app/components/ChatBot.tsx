'use client';

import { useState, useRef, useEffect } from 'react';
import MessageBubble from './MessageBubble';
import ChatInput from './ChatInput';
import EscalationQR from './EscalationQR';
import BankingGuide from './BankingGuide';
import SelfServiceLinks from './SelfServiceLinks';
import ChatHistory from './ChatHistory';
import { detectBankingQuery, BankingGuide as BankingGuideType, SelfServiceLink } from '../lib/banking-knowledge';

export interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  guide?: BankingGuideType;
  links?: SelfServiceLink[];
}

// Escalation detection logic
function shouldEscalate(botResponse: string, userMessage: string): boolean {
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

  return botNeedsEscalation || userRequestsEscalation;
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
          await saveMessageToHistory(data.session.id, storedUserId!, 'bot', messages[0].text);
        }
      } catch (error) {
        console.error('Error creating session:', error);
      }
    };
    createSession();
  }, []);

  // Save message to history
  const saveMessageToHistory = async (
    sessionId: string,
    userId: string,
    sender: 'user' | 'bot',
    text: string
  ) => {
    try {
      await fetch('/api/chat/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, userId, sender, text }),
      });
    } catch (error) {
      console.error('Error saving message:', error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSendMessage = async (text: string) => {
    if (!text.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: text.trim(),
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsTyping(true);

    // Save user message to history
    if (currentSessionId && userId) {
      await saveMessageToHistory(currentSessionId, userId, 'user', text.trim());
    }

    try {
      // Call our API route which connects to Ollama
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...messages, userMessage],
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get response');
      }

      const botResponse = data.message || 'Sorry, I could not generate a response.';
      
      // Detect banking queries and get relevant guides/links
      const bankingInfo = detectBankingQuery(text);
      
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
        await saveMessageToHistory(currentSessionId, userId, 'bot', botResponse);
      }

      // Check if escalation is needed
      const needsEscalation = shouldEscalate(botResponse, text);
      
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
            }),
          });

          const escalateData = await escalateResponse.json();
          
          if (escalateData.caseId) {
            setEscalatedCaseId(escalateData.caseId);
            setShowEscalation(true);
            
            // Add escalation message
            const escalationMessage: Message = {
              id: (Date.now() + 2).toString(),
              text: 'I understand this requires additional assistance. I\'ve created a case and generated a QR code for you. Please scan it to transfer your enquiry to our support team.',
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
                setMessages(
                  data.session.messages.map((msg: any) => ({
                    id: msg.id.toString(),
                    text: msg.text,
                    sender: msg.sender,
                    timestamp: new Date(msg.timestamp),
                  }))
                );
                setShowHistory(false);
              }
            } catch (error) {
              console.error('Error loading session:', error);
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
      </div>

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
          <div className="mb-2 flex items-center justify-between">
            {!showEscalation && (
              <button
                onClick={async () => {
                  try {
                    const escalateResponse = await fetch('/api/cases/escalate', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify({
                        messages: messages,
                        reason: 'Manual escalation requested by user',
                      }),
                    });

                    const escalateData = await escalateResponse.json();
                    
                    if (escalateData.caseId) {
                      setEscalatedCaseId(escalateData.caseId);
                      setShowEscalation(true);
                      
                      const escalationMessage: Message = {
                        id: Date.now().toString(),
                        text: 'I\'ve created a case and generated a QR code for you. Please scan it to transfer your enquiry to our support team.',
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

