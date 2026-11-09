/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import {
  BarChart3,
  Calendar,
  Clock,
  CheckCircle,
  TrendingUp,
  PieChart,
  BookOpen,
  Filter,
  Sparkles,
  Layers,
  ChevronDown,
  ArrowRightLeft,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatLocalDate } from '../../services/streaks';

type TimeFilter = 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom';

export const AnalyticsView: React.FC = () => {
  const { sessions, projects } = useApp();

  const [timeFilter, setTimeFilter] = useState<TimeFilter>('weekly');
  const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>([]); // empty means all
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [activeChartTooltip, setActiveChartTooltip] = useState<{ label: string; value: string } | null>(null);

  // Filter projects helper
  const toggleProjectFilter = (id: string) => {
    if (selectedProjectIds.includes(id)) {
      setSelectedProjectIds(selectedProjectIds.filter(pId => pId !== id));
    } else {
      setSelectedProjectIds([...selectedProjectIds, id]);
    }
  };

  const selectAllProjects = () => setSelectedProjectIds([]);

  // Time range calculation
  const { filteredSessions, periodLabel } = useMemo(() => {
    const now = new Date();
    let startTime = 0;
    let label = 'Current Week';

    if (timeFilter === 'daily') {
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      startTime = today.getTime();
      label = 'Today';
    } else if (timeFilter === 'weekly') {
      // Past 7 days
      startTime = Date.now() - 7 * 24 * 60 * 60 * 1000;
      label = 'Last 7 Days';
    } else if (timeFilter === 'monthly') {
      // Past 30 days
      startTime = Date.now() - 30 * 24 * 60 * 60 * 1000;
      label = 'Last 30 Days';
    } else if (timeFilter === 'yearly') {
      // Past 365 days
      startTime = Date.now() - 365 * 24 * 60 * 60 * 1000;
      label = 'Last 12 Months';
    } else if (timeFilter === 'custom' && customStartDate) {
      startTime = new Date(customStartDate + 'T00:00:00').getTime();
      const endTime = customEndDate ? new Date(customEndDate + 'T23:59:59').getTime() : Date.now();
      label = `${customStartDate} to ${customEndDate || 'Now'}`;
    }

    const res = sessions.filter(s => {
      if (s.sessionType !== 'focus') return false;
      if (s.startTime < startTime) return false;
      if (timeFilter === 'custom' && customEndDate) {
        const endTime = new Date(customEndDate + 'T23:59:59').getTime();
        if (s.startTime > endTime) return false;
      }
      if (selectedProjectIds.length > 0) {
        if (!s.projectId || !selectedProjectIds.includes(s.projectId)) return false;
      }
      return true;
    });

    return { filteredSessions: res, periodLabel: label };
  }, [sessions, timeFilter, selectedProjectIds, customStartDate, customEndDate]);

  // Aggregate stats across all time & period
  const stats = useMemo(() => {
    const now = new Date();
    const todayStr = formatLocalDate(now.getTime());
    const weekAgoTime = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const monthAgoTime = Date.now() - 30 * 24 * 60 * 60 * 1000;

    let totalFocusSeconds = 0;
    let todayFocusSeconds = 0;
    let weeklyFocusSeconds = 0;
    let monthlyFocusSeconds = 0;
    let totalCompletedSessions = 0;

    const dayOfWeekDistribution = [0, 0, 0, 0, 0, 0, 0]; // Sun to Sat
    const hourOfDayDistribution = new Array(24).fill(0); // 0h to 23h
    const daysWithSessions = new Set<string>();

    for (const s of sessions) {
      if (s.sessionType !== 'focus') continue;
      totalFocusSeconds += s.durationSeconds;
      if (s.completed) totalCompletedSessions++;

      const dateStr = formatLocalDate(s.startTime);
      daysWithSessions.add(dateStr);

      if (dateStr === todayStr) {
        todayFocusSeconds += s.durationSeconds;
      }
      if (s.startTime >= weekAgoTime) {
        weeklyFocusSeconds += s.durationSeconds;
      }
      if (s.startTime >= monthAgoTime) {
        monthlyFocusSeconds += s.durationSeconds;
      }

      const d = new Date(s.startTime);
      dayOfWeekDistribution[d.getDay()] += s.durationSeconds;
      hourOfDayDistribution[d.getHours()] += s.durationSeconds;
    }

    // Averages
    const distinctDaysCount = Math.max(1, daysWithSessions.size);
    const avgDailySeconds = Math.round(totalFocusSeconds / distinctDaysCount);
    const avgSessionDurationSeconds = totalCompletedSessions > 0 ? Math.round(totalFocusSeconds / totalCompletedSessions) : 0;

    // Most productive day of week
    const daysName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    let bestDayIdx = 1;
    let maxDaySec = 0;
    dayOfWeekDistribution.forEach((sec, idx) => {
      if (sec > maxDaySec) {
        maxDaySec = sec;
        bestDayIdx = idx;
      }
    });

    // Most productive time of day
    let bestHour = 9;
    let maxHourSec = 0;
    hourOfDayDistribution.forEach((sec, hr) => {
      if (sec > maxHourSec) {
        maxHourSec = sec;
        bestHour = hr;
      }
    });

    const formatHour = (h: number) => {
      const ampm = h >= 12 ? 'PM' : 'AM';
      const h12 = h % 12 === 0 ? 12 : h % 12;
      return `${h12}:00 ${ampm}`;
    };

    return {
      totalHours: (totalFocusSeconds / 3600).toFixed(1),
      todayHours: (todayFocusSeconds / 3600).toFixed(1),
      todayMinutes: Math.floor(todayFocusSeconds / 60),
      weeklyHours: (weeklyFocusSeconds / 3600).toFixed(1),
      monthlyHours: (monthlyFocusSeconds / 3600).toFixed(1),
      totalCompletedSessions,
      avgDailyMinutes: Math.round(avgDailySeconds / 60),
      avgSessionMinutes: Math.round(avgSessionDurationSeconds / 60),
      mostProductiveDay: maxDaySec > 0 ? daysName[bestDayIdx] : 'None yet',
      mostProductiveTime: maxHourSec > 0 ? `${formatHour(bestHour)} - ${formatHour((bestHour + 1) % 24)}` : 'None yet',
    };
  }, [sessions]);

  // Daily Chart Data for the Selected Timeframe
  const chartData = useMemo(() => {
    const items: { label: string; hours: number; rawSeconds: number }[] = [];

    if (timeFilter === 'yearly') {
      // 12 months
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const now = new Date();
      for (let i = 11; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const y = d.getFullYear();
        const m = d.getMonth();
        const monthLabel = months[m];

        let sec = 0;
        for (const s of filteredSessions) {
          const sDate = new Date(s.startTime);
          if (sDate.getFullYear() === y && sDate.getMonth() === m) {
            sec += s.durationSeconds;
          }
        }
        items.push({
          label: monthLabel,
          hours: parseFloat((sec / 3600).toFixed(2)),
          rawSeconds: sec,
        });
      }
    } else {
      // Days
      const count = timeFilter === 'monthly' ? 30 : 7;
      const now = new Date();
      for (let i = count - 1; i >= 0; i--) {
        const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const dateStr = formatLocalDate(d.getTime());
        const dayLabel = timeFilter === 'monthly' ? `${d.getDate()}` : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.getDay()];

        let sec = 0;
        for (const s of filteredSessions) {
          if (formatLocalDate(s.startTime) === dateStr) {
            sec += s.durationSeconds;
          }
        }
        items.push({
          label: dayLabel,
          hours: parseFloat((sec / 3600).toFixed(2)),
          rawSeconds: sec,
        });
      }
    }

    const maxHours = Math.max(...items.map(i => i.hours), 1);
    return { items, maxHours };
  }, [filteredSessions, timeFilter]);

  // Project Comparison Matrix (compare multiple selected projects in the period)
  const projectComparison = useMemo(() => {
    const targetProjects = selectedProjectIds.length > 0
      ? projects.filter(p => selectedProjectIds.includes(p.id))
      : projects;

    const data = targetProjects.map(p => {
      const pSessions = filteredSessions.filter(s => s.projectId === p.id);
      const sec = pSessions.reduce((acc, s) => acc + s.durationSeconds, 0);
      return {
        id: p.id,
        name: p.name,
        color: p.color,
        category: p.category,
        hours: parseFloat((sec / 3600).toFixed(2)),
        sessionsCount: pSessions.length,
      };
    }).sort((a, b) => b.hours - a.hours);

    const maxHours = Math.max(...data.map(d => d.hours), 1);
    return { data, maxHours };
  }, [projects, selectedProjectIds, filteredSessions]);

  // Project Distribution Breakdown
  const projectDistribution = useMemo(() => {
    const projMap: Record<string, number> = {};
    let totalSec = 0;

    for (const s of filteredSessions) {
      const key = s.projectId || 'unassigned';
      projMap[key] = (projMap[key] || 0) + s.durationSeconds;
      totalSec += s.durationSeconds;
    }

    const results = Object.keys(projMap).map(id => {
      const p = projects.find(proj => proj.id === id);
      const sec = projMap[id];
      const hours = (sec / 3600).toFixed(1);
      const percent = totalSec > 0 ? Math.round((sec / totalSec) * 100) : 0;
      return {
        id,
        name: id === 'unassigned' ? 'General Focus' : p ? p.name : 'Unknown Project',
        color: p?.color || '#71717a',
        hours,
        percent,
      };
    }).sort((a, b) => b.percent - a.percent);

    return { results, totalSec };
  }, [filteredSessions, projects]);

  // Book Reading Analytics
  const readingStats = useMemo(() => {
    const bookProjects = projects.filter(p => p.isBookProject && p.bookDetails);
    const completedBooks = bookProjects.filter(p => p.bookDetails?.isCompleted);
    const readingBooks = bookProjects.filter(p => !p.bookDetails?.isCompleted);

    const totalPagesRead = bookProjects.reduce((acc, p) => acc + (p.bookDetails?.currentPage || 0), 0);
    const totalTargetPages = bookProjects.reduce((acc, p) => acc + (p.bookDetails?.totalPages || 0), 0);

    // Lifetime Reading time in sessions
    const bookIds = new Set(bookProjects.map(b => b.id));
    const readingSessions = sessions.filter(s => s.projectId && bookIds.has(s.projectId));
    const readingSeconds = readingSessions.reduce((acc, s) => acc + s.durationSeconds, 0);

    // Period-specific reading stats
    const periodSessions = filteredSessions.filter(s => s.projectId && bookIds.has(s.projectId));
    const periodReadingSeconds = periodSessions.reduce((acc, s) => acc + s.durationSeconds, 0);
    const pagesReadInPeriod = periodSessions.reduce((acc, s) => acc + (s.pagesRead || 0), 0);

    return {
      hasBooks: bookProjects.length > 0,
      completedCount: completedBooks.length,
      readingCount: readingBooks.length,
      totalPagesRead,
      totalTargetPages,
      readingHours: (readingSeconds / 3600).toFixed(1),
      periodReadingHours: (periodReadingSeconds / 3600).toFixed(1),
      pagesReadInPeriod,
      avgProgress: totalTargetPages > 0 ? Math.round((totalPagesRead / totalTargetPages) * 100) : 0,
    };
  }, [projects, sessions, filteredSessions]);

  // 28-Day Activity Heatmap Grid
  const activityHeatmap = useMemo(() => {
    const days: { dateStr: string; minutes: number; intensity: number }[] = [];
    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;

    const dailyMinutes: Record<string, number> = {};
    for (const s of sessions) {
      if (s.sessionType === 'focus') {
        const dStr = formatLocalDate(s.startTime);
        dailyMinutes[dStr] = (dailyMinutes[dStr] || 0) + Math.round(s.durationSeconds / 60);
      }
    }

    for (let i = 27; i >= 0; i--) {
      const time = now - i * dayMs;
      const dateStr = formatLocalDate(time);
      const minutes = dailyMinutes[dateStr] || 0;
      let intensity = 0;
      if (minutes >= 60) intensity = 4;
      else if (minutes >= 30) intensity = 3;
      else if (minutes >= 15) intensity = 2; // qualifying
      else if (minutes > 0) intensity = 1;

      days.push({ dateStr, minutes, intensity });
    }

    return days;
  }, [sessions]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-4 sm:py-6 pb-28 sm:pb-12 space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-zinc-300" />
            <span>Productivity Analytics</span>
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Real performance telemetry, interactive time filters, and project comparisons.
          </p>
        </div>

        {/* Time Filters */}
        <div className="flex items-center gap-1 p-1 bg-zinc-900 rounded-2xl border border-zinc-800 text-xs">
          {(['daily', 'weekly', 'monthly', 'yearly', 'custom'] as TimeFilter[]).map((f) => (
            <button
              key={f}
              onClick={() => setTimeFilter(f)}
              className={`px-3 py-1.5 rounded-xl font-semibold capitalize transition-all ${
                timeFilter === f
                  ? 'bg-zinc-100 text-zinc-950 shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Custom Date Range Selector (if selected) */}
      {timeFilter === 'custom' && (
        <div className="flex flex-wrap items-center gap-3 p-3 bg-zinc-900/60 rounded-2xl border border-zinc-800 text-xs">
          <span className="text-zinc-400 font-medium">Select Range:</span>
          <input
            type="date"
            value={customStartDate}
            onChange={(e) => setCustomStartDate(e.target.value)}
            className="bg-zinc-800 border border-zinc-700 text-white rounded-lg px-2.5 py-1"
          />
          <span className="text-zinc-500">to</span>
          <input
            type="date"
            value={customEndDate}
            onChange={(e) => setCustomEndDate(e.target.value)}
            className="bg-zinc-800 border border-zinc-700 text-white rounded-lg px-2.5 py-1"
          />
        </div>
      )}

      {/* Project Filter Chips */}
      {projects.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <span className="text-xs text-zinc-500 flex items-center gap-1 whitespace-nowrap">
            <Filter className="w-3.5 h-3.5" />
            <span>Filter Projects:</span>
          </span>
          <button
            onClick={selectAllProjects}
            className={`px-3 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              selectedProjectIds.length === 0
                ? 'bg-zinc-200 text-zinc-950 font-bold'
                : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
            }`}
          >
            All Projects
          </button>
          {projects.map((p) => {
            const isSelected = selectedProjectIds.includes(p.id);
            return (
              <button
                key={p.id}
                onClick={() => toggleProjectFilter(p.id)}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-medium whitespace-nowrap border transition-all ${
                  isSelected
                    ? 'bg-zinc-800 border-white text-white'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: p.color }}
                />
                <span>{p.name}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Main KPI Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 bg-zinc-900/60 border border-zinc-800 rounded-2xl space-y-1">
          <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block">
            Total Focus
          </span>
          <span className="text-2xl font-extrabold text-white tracking-tight">
            {stats.totalHours} <span className="text-xs font-normal text-zinc-400">hours</span>
          </span>
          <p className="text-[10px] text-zinc-500">Across lifetime</p>
        </div>

        <div className="p-4 bg-zinc-900/60 border border-zinc-800 rounded-2xl space-y-1">
          <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block">
            Today
          </span>
          <span className="text-2xl font-extrabold text-emerald-400 tracking-tight">
            {stats.todayMinutes} <span className="text-xs font-normal text-zinc-400">min</span>
          </span>
          <p className="text-[10px] text-zinc-500">
            {stats.todayMinutes >= 15 ? '✓ 15m streak secured' : `${15 - stats.todayMinutes}m left for streak`}
          </p>
        </div>

        <div className="p-4 bg-zinc-900/60 border border-zinc-800 rounded-2xl space-y-1">
          <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block">
            Completed Sessions
          </span>
          <span className="text-2xl font-extrabold text-white tracking-tight">
            {stats.totalCompletedSessions}
          </span>
          <p className="text-[10px] text-zinc-500">Avg {stats.avgSessionMinutes}m / session</p>
        </div>

        <div className="p-4 bg-zinc-900/60 border border-zinc-800 rounded-2xl space-y-1">
          <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block">
            Peak Focus
          </span>
          <span className="text-sm font-bold text-amber-400 tracking-tight truncate block">
            {stats.mostProductiveDay}
          </span>
          <p className="text-[10px] text-zinc-500 truncate">{stats.mostProductiveTime}</p>
        </div>
      </div>

      {/* Interactive Time Trend Bar Chart */}
      <div className="p-5 bg-zinc-900/70 border border-zinc-800/80 rounded-3xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-zinc-400" />
              <span>Focus Time Breakdown ({periodLabel})</span>
            </h3>
            <p className="text-xs text-zinc-400">Tap bars to view exact time</p>
          </div>
          {activeChartTooltip && (
            <div className="px-3 py-1 bg-zinc-800 text-white rounded-lg text-xs font-mono font-semibold animate-fade-in border border-zinc-700">
              {activeChartTooltip.label}: {activeChartTooltip.value}
            </div>
          )}
        </div>

        {/* SVG Interactive Chart */}
        <div className="h-52 w-full pt-4 flex items-end justify-between gap-1 sm:gap-2">
          {chartData.items.map((item, idx) => {
            const heightPercent = Math.max(4, Math.round((item.hours / chartData.maxHours) * 100));
            return (
              <div
                key={idx}
                onMouseEnter={() =>
                  setActiveChartTooltip({
                    label: item.label,
                    value: `${item.hours}h (${Math.round(item.rawSeconds / 60)} min)`,
                  })
                }
                onClick={() =>
                  setActiveChartTooltip({
                    label: item.label,
                    value: `${item.hours}h (${Math.round(item.rawSeconds / 60)} min)`,
                  })
                }
                className="flex-1 flex flex-col items-center h-full justify-end group cursor-pointer"
              >
                <div className="w-full flex justify-center h-44 items-end">
                  <div
                    className={`w-full max-w-[28px] rounded-t-lg transition-all duration-300 ${
                      item.hours > 0
                        ? 'bg-zinc-200 group-hover:bg-white group-hover:shadow-[0_0_12px_rgba(255,255,255,0.4)]'
                        : 'bg-zinc-800/60'
                    }`}
                    style={{ height: `${heightPercent}%` }}
                  />
                </div>
                <span className="text-[10px] text-zinc-500 group-hover:text-zinc-200 mt-2 truncate max-w-[36px] text-center">
                  {item.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Side-by-Side Project Comparison Chart */}
      {projectComparison.data.length > 0 && (
        <div className="p-5 bg-zinc-900/70 border border-zinc-800/80 rounded-3xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <ArrowRightLeft className="w-4 h-4 text-zinc-400" />
              <span>Project Comparison Matrix ({periodLabel})</span>
            </h3>
            <span className="text-xs text-zinc-500">
              {projectComparison.data.length} projects analyzed
            </span>
          </div>

          <div className="space-y-3 pt-2">
            {projectComparison.data.map((proj) => {
              const barPercent = Math.max(3, Math.round((proj.hours / projectComparison.maxHours) * 100));
              return (
                <div key={proj.id} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: proj.color }} />
                      <span className="font-semibold text-zinc-200">{proj.name}</span>
                      <span className="text-[10px] text-zinc-500">({proj.category})</span>
                    </div>
                    <span className="font-mono text-zinc-300 font-semibold">
                      {proj.hours}h <span className="text-zinc-500 text-[10px]">({proj.sessionsCount} sessions)</span>
                    </span>
                  </div>

                  <div className="w-full bg-zinc-800 h-2.5 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${barPercent}%`,
                        backgroundColor: proj.color,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 4-Week Activity Calendar Heatmap */}
      <div className="p-5 bg-zinc-900/70 border border-zinc-800/80 rounded-3xl space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Calendar className="w-4 h-4 text-zinc-400" />
            <span>Study Activity Matrix (Past 28 Days)</span>
          </h3>
          <div className="flex items-center gap-1.5 text-[10px] text-zinc-400">
            <span>Less</span>
            <span className="w-2.5 h-2.5 rounded-sm bg-zinc-800" />
            <span className="w-2.5 h-2.5 rounded-sm bg-emerald-950" />
            <span className="w-2.5 h-2.5 rounded-sm bg-emerald-800" />
            <span className="w-2.5 h-2.5 rounded-sm bg-emerald-600" />
            <span>More</span>
          </div>
        </div>

        <div className="grid grid-cols-7 sm:grid-cols-14 gap-2 pt-2">
          {activityHeatmap.map((day, i) => {
            const colors = [
              'bg-zinc-800 border-zinc-700/40 text-zinc-600',
              'bg-emerald-950/80 border-emerald-900/60 text-emerald-400',
              'bg-emerald-800/80 border-emerald-700 text-emerald-200',
              'bg-emerald-600 border-emerald-500 text-white',
              'bg-emerald-400 border-white text-zinc-950 font-bold',
            ];
            return (
              <div
                key={i}
                className={`h-11 rounded-xl p-1 flex flex-col justify-between border text-[9px] transition-all hover:scale-105 cursor-pointer ${
                  colors[day.intensity]
                }`}
                title={`${day.dateStr}: ${day.minutes} minutes focused`}
              >
                <span className="truncate opacity-80">{day.dateStr.slice(5)}</span>
                <span className="font-mono font-semibold">{day.minutes}m</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Project Distribution Breakdown */}
      <div className="p-5 bg-zinc-900/70 border border-zinc-800/80 rounded-3xl space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <PieChart className="w-4 h-4 text-zinc-400" />
          <span>Project Time Distribution ({periodLabel})</span>
        </h3>

        {projectDistribution.results.length === 0 ? (
          <p className="text-xs text-zinc-500 py-4 text-center">No recorded sessions in this timeframe.</p>
        ) : (
          <div className="space-y-3">
            {projectDistribution.results.map((item) => (
              <div key={item.id} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="font-medium text-zinc-200">{item.name}</span>
                  </div>
                  <span className="font-mono text-zinc-400">
                    {item.hours}h ({item.percent}%)
                  </span>
                </div>
                <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${item.percent}%`,
                      backgroundColor: item.color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Dedicated Book Reading Analytics (Appears if book projects exist) */}
      {readingStats.hasBooks && (
        <div className="p-5 bg-gradient-to-br from-zinc-900 to-zinc-900/80 border border-emerald-500/20 rounded-3xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-emerald-400" />
              <span>Reading Analytics & Book Journey</span>
            </h3>
            <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
              {readingStats.completedCount} Books Finished
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div className="p-3 bg-zinc-950/60 rounded-xl border border-zinc-800">
              <span className="text-[10px] text-zinc-400 block">Total Pages Read</span>
              <span className="text-xl font-mono font-bold text-white">{readingStats.totalPagesRead}</span>
              <span className="text-[9px] text-emerald-400 block mt-0.5">
                +{readingStats.pagesReadInPeriod} in {periodLabel}
              </span>
            </div>
            <div className="p-3 bg-zinc-950/60 rounded-xl border border-zinc-800">
              <span className="text-[10px] text-zinc-400 block">Books in Progress</span>
              <span className="text-xl font-mono font-bold text-emerald-400">{readingStats.readingCount}</span>
              <span className="text-[9px] text-zinc-500 block mt-0.5">of {readingStats.completedCount + readingStats.readingCount} total</span>
            </div>
            <div className="p-3 bg-zinc-950/60 rounded-xl border border-zinc-800">
              <span className="text-[10px] text-zinc-400 block">Reading Focus ({periodLabel})</span>
              <span className="text-xl font-mono font-bold text-white">{readingStats.periodReadingHours}h</span>
              <span className="text-[9px] text-zinc-500 block mt-0.5">{readingStats.readingHours}h lifetime</span>
            </div>
            <div className="p-3 bg-zinc-950/60 rounded-xl border border-zinc-800">
              <span className="text-[10px] text-zinc-400 block">Overall Progress</span>
              <span className="text-xl font-mono font-bold text-white">{readingStats.avgProgress}%</span>
              <span className="text-[9px] text-zinc-500 block mt-0.5">{readingStats.totalTargetPages - readingStats.totalPagesRead} pages left</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
