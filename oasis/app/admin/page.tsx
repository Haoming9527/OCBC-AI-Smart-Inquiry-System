'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

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
  contactEmail?: string | null;
  contactPhone?: string | null;
  escalatedAt?: string;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'resolved' | 'escalated'>('all');
  const [sortBy, setSortBy] = useState<'timestamp' | 'status'>('timestamp');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [activeTab, setActiveTab] = useState<'overview' | 'cases'>('overview');

  useEffect(() => {
    fetchCases();
  }, []);

  const fetchCases = async () => {
    try {
      const response = await fetch('/api/cases');
      const data = await response.json();
      if (response.ok) {
        const casesData = data.cases || [];
        console.log('Fetched cases:', casesData);
        // Verify each case has an id
        casesData.forEach((c: any, index: number) => {
          if (!c.id) {
            console.error(`Case at index ${index} is missing id:`, c);
          }
        });
        setCases(casesData);
      }
    } catch (error) {
      console.error('Error fetching cases:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateCaseStatus = async (caseId: string, newStatus: 'open' | 'resolved' | 'escalated') => {
    if (!caseId) {
      console.error('Case ID is undefined or empty');
      alert('Error: Case ID is missing. Please refresh the page and try again.');
      return;
    }

    try {
      console.log('Updating case status:', caseId, 'to', newStatus);
      const encodedCaseId = encodeURIComponent(caseId);
      console.log('Encoded case ID:', encodedCaseId);
      
      const response = await fetch(`/api/cases/${encodedCaseId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await response.json();

      if (response.ok) {
        // Update local state
        setCases((prevCases) =>
          prevCases.map((c) => (c.id === caseId ? { ...c, status: newStatus } : c))
        );
      } else {
        console.error('Failed to update case status:', data);
        console.error('Response status:', response.status);
        console.error('Case ID used:', caseId);
        alert(`Failed to update case status: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error updating case status:', error);
      console.error('Case ID that failed:', caseId);
      alert(`Error updating case status: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Calculate statistics
  const stats = {
    total: cases.length,
    open: cases.filter((c) => c.status === 'open').length,
    escalated: cases.filter((c) => c.status === 'escalated').length,
    resolved: cases.filter((c) => c.status === 'resolved').length,
  };

  const totalMessages = cases.reduce((sum, c) => sum + c.messages.length, 0);
  const averageMessagesPerCase = stats.total ? (totalMessages / stats.total).toFixed(1) : '0';

  const resolvedCases = cases.filter((c) => c.status === 'resolved');
  const averageResolutionTimeHours = (() => {
    if (!resolvedCases.length) return '—';

    const totalDuration = resolvedCases.reduce((sum, c) => {
      const start = new Date(c.timestamp).getTime();
      const lastMessageTime = c.messages.length
        ? new Date(c.messages[c.messages.length - 1].timestamp).getTime()
        : start;
      return sum + Math.max(lastMessageTime - start, 0);
    }, 0);

    const avgMs = totalDuration / resolvedCases.length;
    const hours = avgMs / (1000 * 60 * 60);
    return `${hours < 1 ? (hours * 60).toFixed(0) + ' min' : hours.toFixed(1) + ' h'}`;
  })();

  const resolutionRate = stats.total ? Math.round((stats.resolved / stats.total) * 100) : 0;

  const getDailyActivity = () => {
    const today = new Date();
    const dayBuckets: Record<string, number> = {};

    cases.forEach((c) => {
      const dayKey = new Date(c.timestamp).toISOString().split('T')[0];
      dayBuckets[dayKey] = (dayBuckets[dayKey] ?? 0) + 1;
    });

    const days = Array.from({ length: 7 }, (_, idx) => {
      const day = new Date(today);
      day.setDate(today.getDate() - (6 - idx));
      const dayKey = day.toISOString().split('T')[0];
      return {
        label: day.toLocaleDateString('en-US', { weekday: 'short' }),
        date: dayKey,
        count: dayBuckets[dayKey] ?? 0,
      };
    });

    return days;
  };

  const dailyActivity = getDailyActivity();
  const maxDailyCount = Math.max(...dailyActivity.map((d) => d.count), 1);
  const activityPoints = dailyActivity
    .map((d, idx) => {
      const x = (idx / (dailyActivity.length - 1 || 1)) * 100;
      const y = 100 - (d.count / maxDailyCount) * 100;
      return `${x},${Number.isFinite(y) ? y : 100}`;
    })
    .join(' ');

  // Filter and sort cases
  const filteredCases = cases
    .filter((c) => {
      // Status filter
      if (statusFilter !== 'all' && c.status !== statusFilter) return false;

      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          c.id.toLowerCase().includes(query) ||
          c.summary?.toLowerCase().includes(query) ||
          c.messages.some((m) => m.text.toLowerCase().includes(query))
        );
      }

      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'timestamp') {
        const dateA = new Date(a.timestamp).getTime();
        const dateB = new Date(b.timestamp).getTime();
        return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
      } else {
        // Sort by status
        const statusOrder = { open: 0, escalated: 1, resolved: 2 };
        const orderA = statusOrder[a.status];
        const orderB = statusOrder[b.status];
        return sortOrder === 'asc' ? orderA - orderB : orderB - orderA;
      }
    });

  const handleExport = (format = 'csv') => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams({ format });
    if (statusFilter !== 'all') {
      params.append('status', statusFilter);
    }
    const url = `/api/cases/export?${params.toString()}`;
    window.open(url, '_blank');
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-[#FFE5E7] text-[#C41622] dark:bg-[#E11A27]/30 dark:text-[#F02A37]';
      case 'escalated':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400';
      case 'resolved':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getFirstUserMessage = (messages: Case['messages']) => {
    return messages.find((m) => m.sender === 'user')?.text || 'No user message';
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#E11A27] border-r-transparent"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading cases...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      <div className="mx-auto max-w-7xl px-4 py-8">
        {/* Header */}
        <div className="mb-8 border-b border-gray-200 pb-6 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#E11A27] text-white shadow-md">
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
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Admin Dashboard
              </h1>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Manage and monitor all customer cases
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6 flex flex-wrap gap-3">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'cases', label: 'Cases' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as 'overview' | 'cases')}
              className={`rounded-full px-5 py-2 text-sm font-medium transition ${
                activeTab === tab.id
                  ? 'bg-[#E11A27] text-white shadow-md'
                  : 'bg-white text-gray-600 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'overview' && (
          <>
            {/* Statistics Cards */}
        <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-4">
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Total Cases
                </p>
                <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
                  {stats.total}
                </p>
              </div>
              <div className="rounded-full bg-[#FFE5E7] p-3 dark:bg-[#E11A27]/30">
                <svg
                  className="h-6 w-6 text-[#E11A27] dark:text-[#F02A37]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Open Cases
                </p>
                <p className="mt-2 text-3xl font-bold text-[#E11A27] dark:text-[#F02A37]">
                  {stats.open}
                </p>
              </div>
              <div className="rounded-full bg-[#FFE5E7] p-3 dark:bg-[#E11A27]/30">
                <svg
                  className="h-6 w-6 text-[#E11A27] dark:text-[#F02A37]"
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
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Escalated
                </p>
                <p className="mt-2 text-3xl font-bold text-orange-600 dark:text-orange-400">
                  {stats.escalated}
                </p>
              </div>
              <div className="rounded-full bg-orange-100 p-3 dark:bg-orange-900/30">
                <svg
                  className="h-6 w-6 text-orange-600 dark:text-orange-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Resolved
                </p>
                <p className="mt-2 text-3xl font-bold text-green-600 dark:text-green-400">
                  {stats.resolved}
                </p>
              </div>
              <div className="rounded-full bg-green-100 p-3 dark:bg-green-900/30">
                <svg
                  className="h-6 w-6 text-green-600 dark:text-green-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Analytics */}
        <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800 lg:col-span-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Case Volume</p>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Last 7 Days</h2>
              </div>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Peak: {maxDailyCount} {maxDailyCount === 1 ? 'case' : 'cases'}
              </span>
            </div>
            <div className="mt-6">
              <svg viewBox="0 0 100 60" className="h-32 w-full stroke-blue-500" preserveAspectRatio="none">
                <polyline
                  fill="none"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points={activityPoints}
                />
                <polygon
                  points={`${activityPoints} 100,100 0,100`}
                  fill="url(#gradient)"
                  className="opacity-20"
                />
                <defs>
                  <linearGradient id="gradient" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="mt-4 grid grid-cols-7 gap-2 text-center text-xs text-gray-500 dark:text-gray-400">
                {dailyActivity.map((day) => (
                  <div key={day.date}>
                    <div className="font-medium text-gray-900 dark:text-gray-100">{day.count}</div>
                    <div>{day.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Performance</p>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Agent Insights</h2>
            <div className="mt-6 flex flex-col gap-4">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Resolution Rate</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">{resolutionRate}%</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {stats.resolved} of {stats.total || 0} cases resolved
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Avg. Resolution Time</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">{averageResolutionTimeHours}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Based on last {resolvedCases.length} resolved cases</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Avg. Messages per Case</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">{averageMessagesPerCase}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {totalMessages} total messages in {stats.total || 0} cases
                </p>
              </div>
            </div>
          </div>
        </div>
          </>
        )}

        {activeTab === 'cases' && (
          <>
        {/* Filters and Search */}
        <div className="mb-6 rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="grid flex-1 grid-cols-1 gap-4 md:grid-cols-4">
              {/* Search */}
              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Search
                </label>
                <input
                  type="text"
                  placeholder="Search by case ID, summary, or message..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm focus:border-[#E11A27] focus:outline-none focus:ring-2 focus:ring-[#E11A27]/20 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
              </div>

              {/* Status Filter */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Status
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) =>
                    setStatusFilter(
                      e.target.value as 'all' | 'open' | 'resolved' | 'escalated'
                    )
                  }
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm focus:border-[#E11A27] focus:outline-none focus:ring-2 focus:ring-[#E11A27]/20 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                >
                  <option value="all">All Status</option>
                  <option value="open">Open</option>
                  <option value="escalated">Escalated</option>
                  <option value="resolved">Resolved</option>
                </select>
              </div>

              {/* Sort */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Sort By
                </label>
                <div className="flex gap-2">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as 'timestamp' | 'status')}
                    className="flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="timestamp">Date</option>
                    <option value="status">Status</option>
                  </select>
                  <button
                    onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                    className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:hover:bg-gray-600"
                    title={sortOrder === 'asc' ? 'Ascending' : 'Descending'}
                  >
                    {sortOrder === 'asc' ? '↑' : '↓'}
                  </button>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => handleExport('csv')}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-600 dark:text-gray-100 dark:hover:bg-gray-700"
              >
                Export CSV
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v16h16V8l-6-4H4z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 3v5h5" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Cases Table */}
        <div className="rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Case ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Summary
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    First Message
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Messages
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-800">
                {filteredCases.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                      No cases found
                    </td>
                  </tr>
                ) : (
                  filteredCases.map((caseItem) => (
                    <tr
                      key={caseItem.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700/50"
                    >
                      <td className="whitespace-nowrap px-6 py-4">
                        <code className="text-xs font-mono text-gray-900 dark:text-gray-100">
                          {caseItem.id}
                        </code>
                      </td>
                      <td className="px-6 py-4">
                        <p className="max-w-xs truncate text-sm text-gray-900 dark:text-gray-100">
                          {caseItem.summary || 'No summary'}
                        </p>
                        {(caseItem.contactEmail || caseItem.contactPhone) && (
                          <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                            {caseItem.contactEmail && (
                              <p>📧 {caseItem.contactEmail}</p>
                            )}
                            {caseItem.contactPhone && (
                              <p>📱 {caseItem.contactPhone}</p>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <p className="max-w-xs truncate text-sm text-gray-600 dark:text-gray-400">
                          {getFirstUserMessage(caseItem.messages)}
                        </p>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <span
                          className={`inline-block rounded-full px-2 py-1 text-xs font-semibold ${getStatusBadgeColor(
                            caseItem.status
                          )}`}
                        >
                          {caseItem.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                        {formatDate(caseItem.timestamp)}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                        {caseItem.messages.length}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          <select
                            value={caseItem.status}
                            onChange={(e) => {
                              if (!caseItem.id) {
                                console.error('Case ID is missing for case:', caseItem);
                                alert('Error: Case ID is missing. Please refresh the page.');
                                return;
                              }
                              updateCaseStatus(
                                caseItem.id,
                                e.target.value as 'open' | 'resolved' | 'escalated'
                              );
                            }}
                            className="rounded-lg border border-gray-300 bg-white px-2 py-1 text-xs focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                          >
                            <option value="open">Open</option>
                            <option value="escalated">Escalated</option>
                            <option value="resolved">Resolved</option>
                          </select>
                          <a
                            href={`/case/${caseItem.id}`}
                            onClick={(e) => e.stopPropagation()}
                            className="rounded-lg bg-[#E11A27] px-3 py-1 text-xs font-medium text-white transition-colors hover:bg-[#C41622] shadow-sm"
                          >
                            View Details
                          </a>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Results count */}
        <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
          Showing {filteredCases.length} of {cases.length} cases
        </div>
          </>
        )}
      </div>
    </div>
  );
}

