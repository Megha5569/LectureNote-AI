import React, { useState } from 'react';
import { 
  Search, BookOpen, Calendar, Star, Trash2, ArrowRight, BookMarked, 
  HelpCircle, Sparkles, User, Award, CheckSquare, PlusCircle, CheckCircle, Flame
} from 'lucide-react';
import { Lecture, UserProfile } from '../types';

interface DashboardProps {
  lectures: Lecture[];
  onSelectLecture: (id: string | null) => void;
  onDeleteLecture: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  user: UserProfile;
  onUpdateUser: (updatedUser: UserProfile) => void;
  onOpenCapture: () => void;
}

export default function Dashboard({ 
  lectures, 
  onSelectLecture, 
  onDeleteLecture, 
  onToggleFavorite,
  user,
  onUpdateUser,
  onOpenCapture
}: DashboardProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [editingName, setEditingName] = useState(false);
  const [tempName, setTempName] = useState(user.name);

  // Compute stats
  const totalLectures = lectures.length;
  const favoriteLectures = lectures.filter(l => l.favorite).length;
  const averageProgress = totalLectures 
    ? Math.round(lectures.reduce((acc, curr) => acc + curr.progress, 0) / totalLectures)
    : 0;
  
  // Calculate distinct subject counts
  const subjectDistribution = lectures.reduce((acc, curr) => {
    acc[curr.subject] = (acc[curr.subject] || 0) + 1;
    return acc;
  }, {} as { [key: string]: number });

  // Handle Name update
  const saveName = (e: React.FormEvent) => {
    e.preventDefault();
    if (tempName.trim()) {
      onUpdateUser({ ...user, name: tempName.trim() });
      setEditingName(false);
    }
  };

  // Filter Lectures
  const filteredLectures = lectures.filter(lecture => {
    // 1. Text Search matching title or topics
    const matchText = searchQuery.trim().toLowerCase() === '' || 
      lecture.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lecture.notes?.topics?.some(topic => topic.toLowerCase().includes(searchQuery.toLowerCase()));

    // 2. Subject Filter matching
    const matchSubject = subjectFilter === 'all' || lecture.subject === subjectFilter;

    // 3. Date Filter matching
    let matchDate = true;
    if (dateFilter !== 'all') {
      const lectureDate = new Date(lecture.date);
      const today = new Date();
      
      if (dateFilter === 'today') {
        matchDate = lectureDate.toDateString() === today.toDateString();
      } else if (dateFilter === 'week') {
        const oneWeekAgo = new Date(today.getTime() - (7 * 24 * 60 * 60 * 1000));
        matchDate = lectureDate >= oneWeekAgo;
      } else if (dateFilter === 'month') {
        const oneMonthAgo = new Date(today.getTime() - (30 * 24 * 60 * 60 * 1000));
        matchDate = lectureDate >= oneMonthAgo;
      }
    }

    return matchText && matchSubject && matchDate;
  });

  return (
    <div id="dashboard-root" className="space-y-6">
      
      {/* 1. STUDENT WELCOME JUMBOTRON */}
      <div className="p-6 md:p-8 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl relative overflow-hidden mb-4 shadow-sm shadow-blue-100">
        
        {/* Abstract background blobs */}
        <div className="absolute right-0 top-0 w-80 h-80 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute left-1/3 bottom-0 w-60 h-60 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6 z-10">
          
          <div className="space-y-2">
            <span className="flex items-center gap-1.5 px-3 py-1 bg-white/20 text-white text-xs font-semibold rounded-full uppercase tracking-wider w-fit">
              <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-bounce" />
              LectureNote AI Active Companion
            </span>
            
            {editingName ? (
              <form onSubmit={saveName} className="flex items-center gap-2">
                <input
                  id="dashboard-user-name-input"
                  type="text"
                  maxLength={25}
                  value={tempName}
                  onChange={(e) => setTempName(e.target.value)}
                  className="px-4 py-2 bg-white/10 border border-white/20 rounded-xl focus:ring-1 focus:ring-blue-400 text-white text-xl font-bold font-sans outline-hidden"
                  placeholder="Your name"
                  autoFocus
                />
                <button
                  id="dashboard-save-name-btn"
                  type="submit"
                  className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold rounded-xl shadow-md cursor-pointer transition-all"
                >
                  Save
                </button>
              </form>
            ) : (
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white flex items-center flex-wrap gap-2">
                Hello, <span className="text-blue-200 font-serif italic pr-1">{user.name || 'Student'}</span>!
                <button 
                  id="dashboard-edit-name-btn"
                  onClick={() => setEditingName(true)} 
                  className="text-xs text-blue-200/85 hover:text-white font-medium underline flex items-center cursor-pointer ml-1"
                >
                  (Change Name)
                </button>
              </h1>
            )}

            <p className="text-blue-50 text-xs md:text-sm max-w-xl font-sans leading-normal">
              Organize your classes, slides, and exam preparation material with premium, fullstack educational support. Your files are encrypted and processed with absolute learner safety controls.
            </p>
          </div>

          <div className="flex flex-wrap gap-3 shrink-0">
            <button
              id="dashboard-capture-trigger"
              onClick={onOpenCapture}
              className="px-4 py-2.5 bg-white hover:bg-slate-50 text-blue-600 font-bold text-xs rounded-lg shadow-sm cursor-pointer flex items-center gap-2 transition-all hover:scale-102 active:scale-98"
            >
              <PlusCircle className="w-4 h-4 text-blue-600" />
              Capture Live Lecture
            </button>
          </div>

        </div>
      </div>

      {/* 2. STATS OVERVIEW DECK */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        
        <div className="p-4 bg-white dark:bg-[#161C2A] border border-slate-200 dark:border-zinc-805 rounded-xl flex items-center justify-between shadow-2xs">
          <div>
            <span className="block text-[9px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest leading-none">Lectures Logged</span>
            <span className="block text-2xl font-bold mt-2 text-slate-800 dark:text-zinc-100">{totalLectures}</span>
          </div>
          <BookOpen className="w-10 h-10 text-blue-500/20" />
        </div>

        <div className="p-4 bg-white dark:bg-[#161C2A] border border-slate-200 dark:border-zinc-805 rounded-xl flex items-center justify-between shadow-2xs">
          <div>
            <span className="block text-[9px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest leading-none">Starred Reviews</span>
            <span className="block text-2xl font-bold mt-2 text-slate-800 dark:text-zinc-100">{favoriteLectures}</span>
          </div>
          <Star className="w-10 h-10 text-amber-500/25" />
        </div>

        <div className="p-4 bg-white dark:bg-[#161C2A] border border-slate-200 dark:border-zinc-805 rounded-xl flex items-center justify-between shadow-2xs">
          <div>
            <span className="block text-[9px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest leading-none">Study Completion</span>
            <span className="block text-2xl font-bold mt-2 text-slate-800 dark:text-zinc-100">{averageProgress}%</span>
          </div>
          <Award className="w-10 h-10 text-emerald-500/25" />
        </div>

        <div className="p-4 bg-white dark:bg-[#161C2A] border border-slate-200 dark:border-zinc-805 rounded-xl flex items-center justify-between shadow-2xs">
          <div>
            <span className="block text-[9px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest leading-none">Retention streak</span>
            <span className="block text-2xl font-bold mt-2 text-slate-800 dark:text-zinc-100 flex items-center gap-1.5">
              5 Days
            </span>
          </div>
          <Flame className="w-10 h-10 text-orange-500/25 animate-pulse" />
        </div>

      </div>

      {/* 3. LECTURE SEARCH, ORGANIZE AND FILTER RAIL */}
      <div className="p-5 bg-white dark:bg-[#161C2A] border border-slate-200 dark:border-zinc-805 rounded-xl shadow-3xs space-y-4">
        
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          
          {/* Query Bar */}
          <div className="w-full md:w-96 relative">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
            <input
              id="dashboard-search-notes"
              type="text"
              placeholder="Search previous notes, terminology, or titles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg focus:ring-1 focus:ring-blue-500 text-xs text-slate-800 dark:text-zinc-100 focus:outline-hidden"
            />
          </div>

          {/* Categorized Filter Selectors */}
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
            
            {/* Subject Tag Categories */}
            <select
              id="dashboard-subject-filter"
              value={subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value)}
              className="text-xs px-3 py-2 bg-slate-50 dark:bg-[#202738] border border-slate-200 dark:border-zinc-800 rounded-lg font-semibold text-slate-700 dark:text-zinc-300 cursor-pointer focus:outline-hidden"
            >
              <option value="all">All Academic Subjects</option>
              {user.subjects.map(sub => (
                <option key={sub} value={sub}>{sub}</option>
              ))}
            </select>

            {/* Date categorised filters */}
            <div className="flex items-center p-0.5 bg-slate-100 dark:bg-[#202738] rounded-lg border border-slate-200 dark:border-zinc-800">
              <button
                id="date-filter-all"
                onClick={() => setDateFilter('all')}
                className={`px-3 py-1.5 text-[9px] uppercase font-bold tracking-wider rounded-md transition-all cursor-pointer ${
                  dateFilter === 'all'
                    ? 'bg-white dark:bg-zinc-900 shadow-3xs text-blue-600 dark:text-blue-400'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                All
              </button>
              <button
                id="date-filter-today"
                onClick={() => setDateFilter('today')}
                className={`px-3 py-1.5 text-[9px] uppercase font-bold tracking-wider rounded-md transition-all cursor-pointer ${
                  dateFilter === 'today'
                    ? 'bg-white dark:bg-zinc-900 shadow-3xs text-blue-600 dark:text-blue-400'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Today
              </button>
              <button
                id="date-filter-week"
                onClick={() => setDateFilter('week')}
                className={`px-3 py-1.5 text-[9px] uppercase font-bold tracking-wider rounded-md transition-all cursor-pointer ${
                  dateFilter === 'week'
                    ? 'bg-white dark:bg-zinc-900 shadow-3xs text-blue-600 dark:text-blue-400'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                1W
              </button>
              <button
                id="date-filter-month"
                onClick={() => setDateFilter('month')}
                className={`px-3 py-1.5 text-[9px] uppercase font-bold tracking-wider rounded-md transition-all cursor-pointer ${
                  dateFilter === 'month'
                    ? 'bg-white dark:bg-zinc-900 shadow-3xs text-blue-600 dark:text-blue-400'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                1M
              </button>
            </div>

          </div>

        </div>

        {/* 4. CHRONICLED HISTORY CARD LIST */}
        {filteredLectures.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredLectures.map((lecture) => (
              <div 
                id={`lecture-card-${lecture.id}`}
                key={lecture.id}
                className="group p-5 bg-white dark:bg-[#161C2A] w-full border border-slate-200 dark:border-zinc-800 rounded-xl hover:border-blue-400 hover:shadow-xs transition-all flex flex-col justify-between"
              >
                {/* Header Tag list */}
                <div>
                  <div className="flex items-center justify-between text-xs mb-3">
                    <span className="px-2 py-0.5 bg-blue-50 dark:bg-blue-955/30 text-blue-600 dark:text-blue-400 text-xxs font-semibold rounded">
                      {lecture.subject}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        id={`fav-btn-${lecture.id}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleFavorite(lecture.id);
                        }}
                        className="p-1 hover:text-yellow-500 transition-colors text-slate-400 cursor-pointer"
                      >
                        <Star className={`w-4 h-4 ${lecture.favorite ? 'fill-yellow-400 text-yellow-500' : ''}`} />
                      </button>
                      <button
                        id={`del-btn-${lecture.id}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm("Delete notes for this lecture permanently?")) {
                            onDeleteLecture(lecture.id);
                          }
                        }}
                        className="p-1 hover:text-rose-600 transition-colors text-slate-400 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Title & Date */}
                  <h4 
                    id={`lecture-title-click-${lecture.id}`}
                    onClick={() => onSelectLecture(lecture.id)}
                    className="font-bold text-slate-800 dark:text-zinc-100 text-sm cursor-pointer group-hover:text-blue-600 dark:group-hover:text-blue-400 tracking-tight line-clamp-2 select-all mb-2"
                  >
                    {lecture.title}
                  </h4>

                  <div className="flex items-center gap-3 text-xxs text-slate-400 dark:text-zinc-500 font-medium mb-4">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(lecture.date).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                    </span>
                    {lecture.notes?.topics && (
                      <span className="bg-slate-50 dark:bg-zinc-850 px-1.5 py-0.2 rounded">
                        {lecture.notes.topics.length} Covered Topics
                      </span>
                    )}
                  </div>
                </div>

                {/* Footer Progress Indicators */}
                <div className="pt-3 border-t border-slate-100 dark:border-zinc-850/80 flex items-center justify-between">
                  <div className="flex-1 mr-4">
                    <div className="flex justify-between text-[10px] text-slate-400 dark:text-zinc-500 font-bold mb-1">
                      <span>Study Comp</span>
                      <span>{lecture.progress}%</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-blue-600 h-full rounded-full transition-all" style={{ width: `${lecture.progress}%` }}></div>
                    </div>
                  </div>
                  <button
                    id={`review-btn-${lecture.id}`}
                    onClick={() => onSelectLecture(lecture.id)}
                    className="p-1.5 rounded-lg bg-slate-50 dark:bg-zinc-850 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-950/20 text-blue-600 dark:text-blue-400 cursor-pointer"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>

              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed border-slate-200 dark:border-zinc-805 rounded-xl">
            <BookMarked className="w-12 h-12 text-blue-200 dark:text-blue-950/20 mb-3" />
            <h5 className="font-bold text-slate-700 dark:text-zinc-100 text-sm">No Chronicled Lecture Files Found</h5>
            <p className="text-slate-405 dark:text-zinc-500 text-xs mt-1 max-w-sm">
              Either clear active search parameters or launch the Class Capture controls above to begin!
            </p>
          </div>
        )}

      </div>

    </div>
  );
}
