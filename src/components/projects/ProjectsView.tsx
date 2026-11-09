/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Plus,
  Play,
  BookOpen,
  FolderKanban,
  Edit2,
  Trash2,
  Archive,
  ArchiveRestore,
  CheckCircle,
  Clock,
  Target,
  ChevronRight,
  Sparkles,
  BookMarked,
  Layers,
  Filter,
  Calendar,
  AlertTriangle,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Project, ProjectCategory, BookDetails, ProjectGoal } from '../../types';

export const ProjectsView: React.FC = () => {
  const {
    projects,
    sessions,
    createProject,
    updateProject,
    deleteProject,
    startFocusForProject,
  } = useApp();

  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<ProjectCategory>('Study');
  const [color, setColor] = useState('#3b82f6');
  const [icon, setIcon] = useState('folder');
  const [isBookProject, setIsBookProject] = useState(false);

  // Book Specific
  const [bookAuthor, setBookAuthor] = useState('');
  const [bookTotalPages, setBookTotalPages] = useState<number>(300);
  const [bookCurrentPage, setBookCurrentPage] = useState<number>(0);
  const [bookTarget, setBookTarget] = useState('');

  // Goal
  const [goalHours, setGoalHours] = useState<number>(0);
  const [goalPages, setGoalPages] = useState<number>(0);
  const [goalDate, setGoalDate] = useState<string>('');

  const categories: string[] = [
    'All',
    'Study',
    'Book Reading',
    'Gym & Fitness',
    'Language Learning',
    'Professional Work',
    'Personal Development',
    'Custom',
    'Archived',
  ];

  const colorOptions = [
    '#3b82f6', // blue
    '#10b981', // emerald
    '#8b5cf6', // purple
    '#f59e0b', // amber
    '#ef4444', // red
    '#ec4899', // pink
    '#06b6d4', // cyan
    '#71717a', // zinc
  ];

  const openCreateModal = () => {
    setName('');
    setDescription('');
    setCategory('Study');
    setColor('#3b82f6');
    setIcon('folder');
    setIsBookProject(false);
    setBookAuthor('');
    setBookTotalPages(300);
    setBookCurrentPage(0);
    setBookTarget('');
    setGoalHours(0);
    setGoalPages(0);
    setGoalDate('');
    setEditingProject(null);
    setShowCreateModal(true);
  };

  const openEditModal = (p: Project) => {
    setEditingProject(p);
    setName(p.name);
    setDescription(p.description || '');
    setCategory(p.category);
    setColor(p.color);
    setIcon(p.icon);
    setIsBookProject(!!p.isBookProject);
    setBookAuthor(p.bookDetails?.author || '');
    setBookTotalPages(p.bookDetails?.totalPages || 300);
    setBookCurrentPage(p.bookDetails?.currentPage || 0);
    setBookTarget(p.bookDetails?.readingTarget || '');
    setGoalHours(p.goal?.targetHours || 0);
    setGoalPages(p.goal?.targetPages || 0);
    setGoalDate(p.goal?.targetDate || '');
    setShowCreateModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const bookDetails: BookDetails | undefined = isBookProject
      ? {
          author: bookAuthor.trim() || undefined,
          totalPages: Math.max(1, bookTotalPages),
          currentPage: Math.max(0, Math.min(bookCurrentPage, bookTotalPages)),
          readingTarget: bookTarget.trim() || undefined,
          isCompleted: bookCurrentPage >= bookTotalPages,
          completedDate: bookCurrentPage >= bookTotalPages ? new Date().toISOString() : undefined,
        }
      : undefined;

    const goal: ProjectGoal | undefined = (goalHours > 0 || goalPages > 0 || goalDate)
      ? {
          targetHours: goalHours > 0 ? goalHours : undefined,
          targetPages: goalPages > 0 ? goalPages : undefined,
          targetDate: goalDate || undefined,
        }
      : undefined;

    if (editingProject) {
      await updateProject({
        ...editingProject,
        name: name.trim(),
        description: description.trim() || undefined,
        category,
        color,
        icon,
        isBookProject,
        bookDetails,
        goal,
      });
    } else {
      await createProject({
        name: name.trim(),
        description: description.trim() || undefined,
        category,
        color,
        icon,
        isArchived: false,
        isBookProject,
        bookDetails,
        goal,
      });
    }

    setShowCreateModal(false);
    setEditingProject(null);
  };

  // Toggle Archive
  const handleToggleArchive = async (project: Project) => {
    await updateProject({
      ...project,
      isArchived: !project.isArchived,
    });
  };

  // Quick page progress update for book projects
  const handleQuickPageUpdate = async (project: Project, newPage: number) => {
    if (!project.bookDetails) return;
    const total = project.bookDetails.totalPages;
    const clamped = Math.max(0, Math.min(newPage, total));
    const isCompleted = clamped >= total;

    const updated: Project = {
      ...project,
      bookDetails: {
        ...project.bookDetails,
        currentPage: clamped,
        isCompleted,
        completedDate: isCompleted ? new Date().toISOString() : undefined,
      },
    };
    await updateProject(updated);
  };

  // Filtered list
  const filteredProjects = projects.filter((p) => {
    if (selectedCategory === 'Archived') {
      return p.isArchived;
    }
    if (p.isArchived) return false;
    if (selectedCategory === 'All') return true;
    return p.category === selectedCategory;
  });

  // Calculate project statistics
  const getProjectStats = (projectId: string) => {
    const projectSessions = sessions.filter(
      (s) => s.projectId === projectId && s.sessionType === 'focus'
    );
    const totalSeconds = projectSessions.reduce((acc, s) => acc + s.durationSeconds, 0);
    const totalHours = (totalSeconds / 3600).toFixed(1);
    const sessionCount = projectSessions.length;
    return { totalHours, sessionCount, totalSeconds };
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-4 sm:py-6 pb-28 sm:pb-12 space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white flex items-center gap-2">
            <FolderKanban className="w-6 h-6 text-zinc-300" />
            <span>Projects & Reading</span>
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Organize study subjects, reading journeys, and skill pursuits.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-zinc-200 text-zinc-950 font-bold text-xs tracking-wide shadow-md active:scale-95 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>New Project / Book</span>
        </button>
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              selectedCategory === cat
                ? 'bg-zinc-100 text-zinc-950 shadow-sm'
                : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-400 border border-zinc-800'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Projects Grid */}
      {filteredProjects.length === 0 ? (
        <div className="text-center py-16 px-4 bg-zinc-900/40 rounded-3xl border border-zinc-800/80 space-y-3">
          <div className="w-12 h-12 mx-auto rounded-full bg-zinc-800/80 flex items-center justify-center text-zinc-400">
            <FolderKanban className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-white">
            {selectedCategory === 'Archived' ? 'No archived projects' : 'No projects in this category yet'}
          </h3>
          <p className="text-xs text-zinc-400 max-w-sm mx-auto">
            {selectedCategory === 'Archived'
              ? 'Archived projects will appear here and can be unarchived anytime.'
              : 'Create your first project or book to track dedicated focus sessions and milestones.'}
          </p>
          {selectedCategory !== 'Archived' && (
            <button
              onClick={openCreateModal}
              className="px-4 py-2 rounded-xl bg-white text-zinc-950 font-bold text-xs hover:bg-zinc-200 transition-colors inline-block"
            >
              Create Project
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredProjects.map((project) => {
            const stats = getProjectStats(project.id);
            const isBook = !!project.isBookProject && project.bookDetails;
            const bookProgress = isBook
              ? Math.min(
                  100,
                  Math.round(
                    (project.bookDetails!.currentPage / project.bookDetails!.totalPages) * 100
                  )
                )
              : 0;

            const goalPercent =
              project.goal?.targetHours && project.goal.targetHours > 0
                ? Math.min(100, Math.round((parseFloat(stats.totalHours) / project.goal.targetHours) * 100))
                : null;

            return (
              <div
                key={project.id}
                className="group relative bg-zinc-900/70 hover:bg-zinc-900 border border-zinc-800/80 hover:border-zinc-700/80 rounded-2xl p-5 transition-all duration-200 space-y-4"
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold shadow-sm"
                      style={{ backgroundColor: project.color }}
                    >
                      {isBook ? <BookOpen className="w-5 h-5" /> : <FolderKanban className="w-5 h-5" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-white tracking-tight">{project.name}</h4>
                        {isBook && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                            Book
                          </span>
                        )}
                        {project.isArchived && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700">
                            Archived
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-zinc-400 mt-0.5">
                        {isBook && project.bookDetails?.author ? `By ${project.bookDetails.author} • ` : ''}
                        {project.category}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => openEditModal(project)}
                      className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800"
                      title="Edit project"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleToggleArchive(project)}
                      className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800"
                      title={project.isArchived ? 'Restore / Unarchive' : 'Archive project'}
                    >
                      {project.isArchived ? (
                        <ArchiveRestore className="w-3.5 h-3.5 text-amber-400" />
                      ) : (
                        <Archive className="w-3.5 h-3.5" />
                      )}
                    </button>
                    <button
                      onClick={() => setProjectToDelete(project)}
                      className="p-1.5 rounded-lg text-zinc-400 hover:text-red-400 hover:bg-zinc-800"
                      title="Delete project"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Description */}
                {project.description && (
                  <p className="text-xs text-zinc-400 line-clamp-2">{project.description}</p>
                )}

                {/* Book Reading Progress */}
                {isBook && project.bookDetails && (
                  <div className="p-3 bg-zinc-950/60 rounded-xl border border-zinc-800/80 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-zinc-400 font-medium">Reading Progress</span>
                      <span className="font-mono font-bold text-white">
                        {project.bookDetails.currentPage} / {project.bookDetails.totalPages} pages ({bookProgress}%)
                      </span>
                    </div>

                    <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                        style={{ width: `${bookProgress}%` }}
                      />
                    </div>

                    {/* Quick increment buttons */}
                    <div className="flex items-center justify-between pt-1 text-[11px]">
                      <span className="text-zinc-500">
                        {project.bookDetails.totalPages - project.bookDetails.currentPage} pages left
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleQuickPageUpdate(project, project.bookDetails!.currentPage + 5)}
                          className="px-2 py-0.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded font-mono"
                        >
                          +5p
                        </button>
                        <button
                          onClick={() => handleQuickPageUpdate(project, project.bookDetails!.currentPage + 10)}
                          className="px-2 py-0.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded font-mono"
                        >
                          +10p
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Project Goal Progress (if configured) */}
                {project.goal && (project.goal.targetHours || project.goal.targetPages || project.goal.targetDate) && (
                  <div className="p-2.5 bg-zinc-950/40 rounded-xl border border-zinc-800/60 space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] text-zinc-400">
                      <span className="flex items-center gap-1 text-zinc-300 font-medium">
                        <Target className="w-3.5 h-3.5 text-blue-400" />
                        <span>
                          Goal: {project.goal.targetHours ? `${project.goal.targetHours}h` : ''}
                          {project.goal.targetHours && project.goal.targetPages ? ' • ' : ''}
                          {project.goal.targetPages ? `${project.goal.targetPages} pages` : ''}
                        </span>
                      </span>
                      {goalPercent !== null && (
                        <span className="font-mono text-blue-400 font-semibold">{goalPercent}%</span>
                      )}
                    </div>
                    {goalPercent !== null && (
                      <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-blue-500 h-full rounded-full"
                          style={{ width: `${goalPercent}%` }}
                        />
                      </div>
                    )}
                    {project.goal.targetDate && (
                      <span className="text-[10px] text-zinc-500 block">
                        Target completion: {project.goal.targetDate}
                      </span>
                    )}
                  </div>
                )}

                {/* Stats & Start Focus CTA */}
                <div className="flex items-center justify-between pt-2 border-t border-zinc-800/80">
                  <div className="flex items-center gap-3 text-xs text-zinc-400">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-zinc-500" />
                      <span className="font-semibold text-zinc-200">{stats.totalHours}h</span>
                    </div>
                    <span>•</span>
                    <div>
                      <span className="font-semibold text-zinc-200">{stats.sessionCount}</span> sessions
                    </div>
                  </div>

                  {/* START FOCUS BUTTON */}
                  {!project.isArchived && (
                    <button
                      onClick={() => startFocusForProject(project.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-zinc-200 text-zinc-950 font-bold text-xs shadow-sm active:scale-95 transition-all"
                    >
                      <Play className="w-3 h-3 fill-zinc-950" />
                      <span>START FOCUS</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {projectToDelete && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl max-w-sm w-full p-6 space-y-4 animate-scale-up">
            <div className="flex items-center gap-3 text-red-400">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Delete Project?</h3>
                <p className="text-xs text-zinc-400">This action cannot be undone.</p>
              </div>
            </div>

            <p className="text-xs text-zinc-300 leading-relaxed">
              Are you sure you want to delete <span className="font-bold text-white">"{projectToDelete.name}"</span>?
              Your historical focus sessions and streaks will be preserved as unassigned.
            </p>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setProjectToDelete(null)}
                className="flex-1 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  await deleteProject(projectToDelete.id);
                  setProjectToDelete(null);
                }}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold"
              >
                Delete Project
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create / Edit Project Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl max-w-lg w-full p-6 space-y-5 max-h-[92vh] overflow-y-auto animate-scale-up">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <FolderKanban className="w-5 h-5 text-zinc-400" />
                <span>{editingProject ? 'Edit Project' : 'Create New Project'}</span>
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-zinc-500 hover:text-white text-xs font-semibold"
              >
                Cancel
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              {/* Name */}
              <div>
                <label className="text-xs font-semibold text-zinc-400 block mb-1">
                  Project or Book Title *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Advanced Mathematics, Atomic Habits, Gym Workout"
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-white"
                />
              </div>

              {/* Description */}
              <div>
                <label className="text-xs font-semibold text-zinc-400 block mb-1">
                  Description (Optional)
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What is your purpose or objective for this project?"
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-white"
                />
              </div>

              {/* Category & Color */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-zinc-400 block mb-1">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => {
                      const val = e.target.value as ProjectCategory;
                      setCategory(val);
                      if (val === 'Book Reading') setIsBookProject(true);
                    }}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-2.5 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-white"
                  >
                    {categories.filter(c => c !== 'All' && c !== 'Archived').map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-zinc-400 block mb-1">
                    Theme Color
                  </label>
                  <div className="flex items-center gap-1.5 pt-1 overflow-x-auto">
                    {colorOptions.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setColor(c)}
                        className={`w-6 h-6 rounded-full transition-transform ${
                          color === c ? 'scale-125 ring-2 ring-white' : 'hover:scale-110'
                        }`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Dedicated Book Project Switcher */}
              <div className="flex items-center justify-between p-3 bg-zinc-800/60 rounded-xl border border-zinc-700/60">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-emerald-400" />
                  <div>
                    <p className="text-xs font-bold text-white">Book Reading Project</p>
                    <p className="text-[11px] text-zinc-400">Track book pages, speed, and reading targets</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={isBookProject}
                  onChange={(e) => setIsBookProject(e.target.checked)}
                  className="w-5 h-5 accent-emerald-500 rounded cursor-pointer"
                />
              </div>

              {/* Dedicated Book Fields */}
              {isBookProject && (
                <div className="space-y-3 p-3 bg-zinc-950/60 rounded-2xl border border-zinc-800">
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="text-zinc-400 block mb-1">Author</label>
                      <input
                        type="text"
                        value={bookAuthor}
                        onChange={(e) => setBookAuthor(e.target.value)}
                        placeholder="e.g. James Clear"
                        className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-white"
                      />
                    </div>
                    <div>
                      <label className="text-zinc-400 block mb-1">Reading Target</label>
                      <input
                        type="text"
                        value={bookTarget}
                        onChange={(e) => setBookTarget(e.target.value)}
                        placeholder="e.g. 20 pages/day"
                        className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="text-zinc-400 block mb-1">Total Book Pages *</label>
                      <input
                        type="number"
                        min="1"
                        value={bookTotalPages}
                        onChange={(e) => setBookTotalPages(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-white"
                      />
                    </div>
                    <div>
                      <label className="text-zinc-400 block mb-1">Current Page</label>
                      <input
                        type="number"
                        min="0"
                        max={bookTotalPages}
                        value={bookCurrentPage}
                        onChange={(e) => setBookCurrentPage(Math.max(0, parseInt(e.target.value) || 0))}
                        className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-white"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Project Goals: Hours, Pages, Completion Date */}
              <div className="p-3 bg-zinc-950/60 rounded-2xl border border-zinc-800 space-y-3">
                <span className="text-xs font-bold text-zinc-300 block">Project Goal (Optional)</span>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <label className="text-zinc-400 block mb-1">Target Hours</label>
                    <input
                      type="number"
                      min="0"
                      max="1000"
                      value={goalHours || ''}
                      onChange={(e) => setGoalHours(Math.max(0, parseInt(e.target.value) || 0))}
                      placeholder="e.g. 50"
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-2 py-1.5 text-white"
                    />
                  </div>
                  <div>
                    <label className="text-zinc-400 block mb-1">Target Pages</label>
                    <input
                      type="number"
                      min="0"
                      max="5000"
                      value={goalPages || ''}
                      onChange={(e) => setGoalPages(Math.max(0, parseInt(e.target.value) || 0))}
                      placeholder="e.g. 300"
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-2 py-1.5 text-white"
                    />
                  </div>
                  <div>
                    <label className="text-zinc-400 block mb-1">Target Date</label>
                    <input
                      type="date"
                      value={goalDate}
                      onChange={(e) => setGoalDate(e.target.value)}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-2 py-1.5 text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Submit CTA */}
              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-white hover:bg-zinc-200 text-zinc-950 text-xs font-bold transition-all shadow-md active:scale-98"
              >
                {editingProject ? 'Save Changes' : 'Create Project'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
