'use client';

import { useState, useEffect } from 'react';

interface ChatSession {
  id: string;
  userId: string;
  title: string | null;
  createdAt: string;
  updatedAt: string;
  isBookmarked: boolean;
  lastMessagePreview: string | null;
  messageCount?: number;
}

interface ChatHistoryProps {
  userId: string;
  onClose: () => void;
  onLoadSession: (sessionId: string) => void;
  onViewSession: (sessionId: string) => void;
}

export default function ChatHistory({ userId, onClose, onLoadSession, onViewSession }: ChatHistoryProps) {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showBookmarked, setShowBookmarked] = useState(false);
  const [editingTitle, setEditingTitle] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  useEffect(() => {
    fetchSessions();
  }, [userId, showBookmarked, searchQuery]);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      let url = '/api/chat/history?userId=' + encodeURIComponent(userId);
      
      if (showBookmarked) {
        url += '&bookmarked=true';
      } else if (searchQuery) {
        url += '&search=' + encodeURIComponent(searchQuery);
      }

      const response = await fetch(url);
      const data = await response.json();
      
      if (response.ok) {
        setSessions(data.sessions || []);
      }
    } catch (error) {
      console.error('Error fetching sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBookmark = async (sessionId: string, currentStatus: boolean) => {
    try {
      const response = await fetch('/api/chat/history', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          userId,
          action: 'bookmark',
        }),
      });

      if (response.ok) {
        setSessions((prev) =>
          prev.map((s) =>
            s.id === sessionId ? { ...s, isBookmarked: !currentStatus } : s
          )
        );
      }
    } catch (error) {
      console.error('Error toggling bookmark:', error);
    }
  };

  const handleDelete = async (sessionId: string) => {
    if (!confirm('Are you sure you want to delete this conversation?')) {
      return;
    }

    try {
      const response = await fetch(
        `/api/chat/history?sessionId=${sessionId}&userId=${userId}`,
        { method: 'DELETE' }
      );

      if (response.ok) {
        setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      }
    } catch (error) {
      console.error('Error deleting session:', error);
    }
  };

  const handleExport = async (sessionId: string, format: 'csv' | 'json') => {
    try {
      const response = await fetch(
        `/api/chat/export?sessionId=${sessionId}&userId=${userId}&format=${format}`
      );

      if (format === 'csv') {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `chat-${sessionId}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
      } else {
        const data = await response.json();
        const blob = new Blob([JSON.stringify(data, null, 2)], {
          type: 'application/json',
        });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `chat-${sessionId}.json`;
        a.click();
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Error exporting session:', error);
    }
  };

  const handleUpdateTitle = async (sessionId: string) => {
    if (!newTitle.trim()) return;

    try {
      const response = await fetch('/api/chat/history', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          userId,
          action: 'updateTitle',
          title: newTitle.trim(),
        }),
      });

      if (response.ok) {
        setSessions((prev) =>
          prev.map((s) =>
            s.id === sessionId ? { ...s, title: newTitle.trim() } : s
          )
        );
        setEditingTitle(null);
        setNewTitle('');
      }
    } catch (error) {
      console.error('Error updating title:', error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      });
    } else if (days === 1) {
      return 'Yesterday';
    } else if (days < 7) {
      return `${days} days ago`;
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
      });
    }
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setOpenMenuId(null);
    };
    if (openMenuId) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [openMenuId]);

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Overlay (hidden on desktop so chat stays visible) */}
      <div
        className="absolute inset-0 bg-black/40 dark:bg-black/70 md:bg-transparent md:dark:bg-transparent"
        onClick={onClose}
      />

      {/* Sidebar */}
      <div className="relative z-10 h-full w-full max-w-md bg-white shadow-xl dark:bg-gray-800 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Chat History
          </h2>
          <button
            onClick={onClose}
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

        {/* Search and Filters */}
        <div className="border-b border-gray-200 p-4 dark:border-gray-700">
          <div className="mb-3">
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowBookmarked(!showBookmarked)}
              className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                showBookmarked
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
              }`}
            >
              <span className="mr-2">⭐</span>
              Bookmarks
            </button>
          </div>
        </div>

        {/* Sessions List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
            </div>
          ) : sessions.length === 0 ? (
            <div className="py-12 text-center text-gray-500 dark:text-gray-400">
              {showBookmarked
                ? 'No bookmarked conversations'
                : searchQuery
                ? 'No conversations found'
                : 'No conversation history'}
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  className="group p-4 transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/50"
                >
                  <div className="flex items-start justify-between">
                    <div
                      className="flex-1 cursor-pointer"
                      onClick={() => onViewSession(session.id)}
                    >
                      {editingTitle === session.id ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={newTitle}
                            onChange={(e) => setNewTitle(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleUpdateTitle(session.id);
                              } else if (e.key === 'Escape') {
                                setEditingTitle(null);
                                setNewTitle('');
                              }
                            }}
                            className="flex-1 rounded border border-gray-300 px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                            autoFocus
                          />
                          <button
                            onClick={() => handleUpdateTitle(session.id)}
                            className="rounded px-2 py-1 text-sm text-blue-600 hover:bg-blue-50 dark:text-blue-400"
                          >
                            ✓
                          </button>
                        </div>
                      ) : (
                        <div>
                          <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                            {session.title ||
                              session.lastMessagePreview ||
                              'New Conversation'}
                          </h3>
                          {session.lastMessagePreview && (
                            <p className="mt-0.5 truncate text-xs text-gray-500 dark:text-gray-400">
                              {session.lastMessagePreview}
                            </p>
                          )}
                          <div className="mt-1 flex items-center gap-3 text-[11px] text-gray-400">
                            <span>{formatDate(session.updatedAt)}</span>
                            {session.messageCount !== undefined && (
                              <span>{session.messageCount} messages</span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="ml-4 flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onLoadSession(session.id);
                        }}
                        className="rounded p-1.5 text-blue-600 transition-colors hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20"
                        title="Load this conversation"
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
                            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                          />
                        </svg>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleBookmark(session.id, session.isBookmarked);
                        }}
                        className="rounded p-1.5 text-gray-500 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-600"
                        title={session.isBookmarked ? 'Remove bookmark' : 'Bookmark'}
                      >
                        <svg
                          className={`h-5 w-5 ${
                            session.isBookmarked ? 'fill-yellow-400 text-yellow-400' : ''
                          }`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                          />
                        </svg>
                      </button>

                      <div className="relative">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenMenuId(openMenuId === session.id ? null : session.id);
                          }}
                          className="rounded p-1.5 text-gray-500 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-600"
                          title="More options"
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
                              d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                            />
                          </svg>
                        </button>
                        {openMenuId === session.id && (
                          <div
                            onClick={(e) => e.stopPropagation()}
                            className="absolute right-0 top-full z-10 mt-1 w-48 rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800"
                          >
                            <button
                              onClick={() => {
                                setEditingTitle(session.id);
                                setNewTitle(session.title || '');
                                setOpenMenuId(null);
                              }}
                              className="block w-full px-4 py-2 text-left text-sm text-gray-700 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                            >
                              Rename
                            </button>
                            <button
                              onClick={() => {
                                handleExport(session.id, 'csv');
                                setOpenMenuId(null);
                              }}
                              className="block w-full px-4 py-2 text-left text-sm text-gray-700 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                            >
                              Export CSV
                            </button>
                            <button
                              onClick={() => {
                                handleExport(session.id, 'json');
                                setOpenMenuId(null);
                              }}
                              className="block w-full px-4 py-2 text-left text-sm text-gray-700 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                            >
                              Export JSON
                            </button>
                            <button
                              onClick={() => {
                                handleDelete(session.id);
                                setOpenMenuId(null);
                              }}
                              className="block w-full px-4 py-2 text-left text-sm text-red-600 transition-colors hover:bg-gray-100 dark:text-red-400 dark:hover:bg-gray-700"
                            >
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

