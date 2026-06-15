import React, { useState, useEffect } from 'react';
import { 
  Tv, Sparkles, BookOpen, User, Sun, Moon, Info, LayoutDashboard, 
  HelpCircle, Compass, Star, LogOut, CheckSquare, Layers, Award, FileText
} from 'lucide-react';
import { Lecture, UserProfile } from './types';
import Dashboard from './components/Dashboard';
import CaptureModule from './components/CaptureModule';
import NotesViewer from './components/NotesViewer';

const DEFAULT_SUBJECTS = ['Computer Science', 'Organic Chemistry', 'Mathematics', 'Biology', 'Microeconomics'];

const DEMO_LECTURES_PRESET: Lecture[] = [
  {
    id: "demo-preset-1",
    title: "Web Application Architectures and Scale-to-Zero Microservices",
    date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
    subject: "Computer Science",
    semester: "Fall 2026",
    tags: ["Monolith", "Containers", "Cloud Run"],
    favorite: true,
    progress: 75,
    transcript: "Good morning class. Today we are unpacking the structural pivot from legacy monolithic backend software systems in favor of decentralized, containerized microservices. In a typical monolith, all features, routing, and databases share CPU and RAM. Alternatively, microservices isolate distinct domains, communicating through REST APIs or ultrafast gRPC channels. We use instruments like Amdahl's Law S(latency) = 1/((1-p)+(p/s)) to audit which specific services are bottlenecks. Additionally, container platforms such as Google Cloud Run allow us to scale-to-zero, saving costs during idle weekend cycles. Ensure you finish Workbook homework page 12 on container port maps.",
    notes: {
      title: "Web Application Architectures and Scale-to-Zero Microservices",
      topics: ["Monolith vs Microservices", "Container Scaling", "Service Boundary Mapping"],
      detailedExpl: "This introductory lecture explored the differences between modern application hosting models. We analyzed how legacy monoliths bundle routing, view generation, and database connections into a single process. In contrast, cloud-native microservice systems scale resources horizontally by isolation. Service communication relies on robust RESTful JSON payloads or gRPC tunnels. A major focus was placed on container lifecycle events, health-checks, and automatic cold starts of workloads mapped with server systems.",
      keyPoints: [
        "Monolithic architectures offer lower initial communication complexity but hit scaling boundaries.",
        "Microservices promote separate team ownership of distinct bounded contexts.",
        "Deployments on scale-to-zero container platforms (such as Google Cloud Run) reduce cost for sparse workloads."
      ],
      definitions: [
        { term: "Microservice", definition: "A lightweight, independent service focusing on a single business capability, running in its own process and communicating via API layers." },
        { term: "Container Ingress", definition: "The routing process that accepts incoming internet requests and directs them safely to container hosts." }
      ],
      formulas: [
        { name: "Amdahl's Law of Scaling", equation: "S(latency) = 1 / ((1 - p) + (p / s))", context: "Predicts potential speedup of a system when only specific partition microservices are scaled." }
      ],
      algorithms: [
        { name: "Load Balancing Round Robin", steps: ["1. Keep a sequential list of healthy container IPs.", "2. When a request arrives, route it to index counter.", "3. Increment index modulo length.", "4. Repeat on failure."] }
      ],
      codeSnippets: [
        { language: "javascript", title: "Express server listener on port 3000", code: "const express = require('express');\nconst app = express();\n\napp.get('/api/health', (req, res) => {\n  res.json({ status: 'healthy', timestamp: Date.now() });\n});\n\napp.listen(3000, '0.0.0.0', () => {\n  console.log('Ingress running on port 3000');\n});" }
      ],
      examples: [
        { topic: "Monolithic limits", scenario: "Rapid seasonal e-commerce checkout traffic peaks.", explanation: "If checkout scale demand locks the database pool, the entire frontend catalog serves slow. Solution: decouple checkout service from catalog service." }
      ],
      actionItems: [
        { task: "Finish Workbook homework page 12 on container port maps.", deadline: "Next Wednesday at Noon", type: "assignment" }
      ]
    },
    summary: {
      executive: "A complete study on monolis vs lightweight microservices and cloud scaling.",
      detailed: "This lecture introduces the shift from giant monoliths toward cloud containers. We explained Amdahl's scaling bounds and how modern server platforms auto-restart instances horizontally to manage web metrics.",
      revision: "1. Monoliths share memory context. \n2. Microservices decouple boundaries. \n3. Cloud Run scales containers to zero.",
      onePageReview: "CHEATSHEET:\nContainer Port: 3000\nAPI Gateway: routes external ingress\nREST: Stateless HTTP JSON communication"
    },
    quiz: {
      mcqs: [
        { question: "What does Amdahl's Law measure?", options: ["Maximum dataset index limits", "Expected speedup boundaries of parallel execution", "HTTP response network delays", "SQL index cardinality"], answerIndex: 1, explanation: "Amdahl's Law measures the maximum speedup achievable by parallelizing or scaling a segment of an application." }
      ],
      shortAnswers: [
        { question: "Why bind container servers to 0.0.0.0 instead of 127.0.0.1?", answer: "Binding to 0.0.0.0 tells the container web-listener to accept requests on any network interface, allowing external ingress gateways to route traffic inside." }
      ],
      interviews: [
        { question: "What is a 'noisy neighbor' issue in shared hosting?", idealResponse: "When one container process on a physical host exhausts shared hardware limits (like I/O or memory bandwidth), degrading surrounding processes." }
      ],
      vivas: [
        { question: "What port does the AI Studio architecture reserve?", sampleResponse: "Port 3000 is the only externally routable interface mapped for developer previews." }
      ]
    },
    flashcards: [
      { id: "demo-card-1", question: "What is loose coupling?", answer: "Developing microservices so modifications in one do not break dependent external systems." }
    ]
  }
];

export default function App() {
  // App state
  const [user, setUser] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('ln_user_profile');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return {
      name: '',
      theme: 'dark', // default dark/slate mode for eye fatigue prevention
      subjects: DEFAULT_SUBJECTS,
      semesters: ['Fall 2026', 'Spring 2026']
    };
  });

  const [lectures, setLectures] = useState<Lecture[]>(() => {
    const saved = localStorage.getItem('ln_user_lectures');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    return DEMO_LECTURES_PRESET;
  });

  const [activeTab, setActiveTab] = useState<'dashboard' | 'capture' | 'help'>('dashboard');
  const [selectedLectureId, setSelectedLectureId] = useState<string | null>(null);

  // Sync user profile
  useEffect(() => {
    localStorage.setItem('ln_user_profile', JSON.stringify(user));
  }, [user]);

  // Sync lectures
  useEffect(() => {
    localStorage.setItem('ln_user_lectures', JSON.stringify(lectures));
  }, [lectures]);

  // Sync theme to root classlist
  useEffect(() => {
    const root = document.documentElement;
    if (user.theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [user.theme]);

  // Handler functions
  const handleAddNewLecture = (newLec: Lecture) => {
    setLectures(prev => [newLec, ...prev]);
    setSelectedLectureId(newLec.id);
    if (newLec.subject && !user.subjects.includes(newLec.subject)) {
      setUser(prev => ({
        ...prev,
        subjects: [...prev.subjects, newLec.subject]
      }));
    }
  };

  const handleDeleteLecture = (id: string) => {
    setLectures(prev => prev.filter(l => l.id !== id));
    if (selectedLectureId === id) setSelectedLectureId(null);
  };

  const handleToggleFavorite = (id: string) => {
    setLectures(prev => prev.map(l => l.id === id ? { ...l, favorite: !l.favorite } : l));
  };

  const handleUpdateLecture = (updated: Lecture) => {
    setLectures(prev => prev.map(l => l.id === updated.id ? updated : l));
  };

  const toggleTheme = () => {
    setUser(prev => ({ ...prev, theme: prev.theme === 'dark' ? 'light' : 'dark' }));
  };

  // Render Onboarding Workspace if they haven't set their name yet
  if (!user.name) {
    return <OnboardingWizard onComplete={(name) => setUser(prev => ({ ...prev, name }))} />;
  }

  // Active Lecture context
  const activeLecture = lectures.find(l => l.id === selectedLectureId);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#090D16] text-slate-900 dark:text-slate-100 flex flex-col md:flex-row transition-all duration-300">
      
      {/* LEFT STATIC NAVIGATION RAIL */}
      <aside className="w-full md:w-64 bg-white dark:bg-zinc-900 border-b md:border-b-0 md:border-r border-slate-200 dark:border-zinc-805 shrink-0 flex flex-col justify-between">
        <div>
          {/* Logo Brand */}
          <div className="p-6 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-sm shadow-blue-200">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
              </div>
              <div>
                <span className="block text-sm font-bold tracking-tight text-slate-800 dark:text-white">LectureNote AI</span>
                <span className="block text-9px text-blue-600 font-extrabold tracking-widest uppercase">Study Hub</span>
              </div>
            </div>
            
            <button
              id="theme-toggler"
              onClick={toggleTheme}
              className="p-2 rounded-lg bg-slate-50 dark:bg-zinc-850 hover:bg-slate-100 text-slate-600 dark:text-zinc-350 cursor-pointer"
            >
              {user.theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-blue-600" />}
            </button>
          </div>

          {/* Nav link deck */}
          <nav className="p-4 space-y-1">
            <button
              id="nav-dashboard"
              onClick={() => {
                setSelectedLectureId(null);
                setActiveTab('dashboard');
              }}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left text-xs font-medium transition-all cursor-pointer ${
                selectedLectureId === null && activeTab === 'dashboard'
                  ? 'bg-blue-50 text-blue-700 font-semibold'
                  : 'text-slate-600 hover:bg-slate-50 dark:text-zinc-400 dark:hover:bg-zinc-800'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              Dashboard Home
            </button>

            <button
              id="nav-capture"
              onClick={() => {
                setSelectedLectureId(null);
                setActiveTab('capture');
              }}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left text-xs font-medium transition-all cursor-pointer ${
                selectedLectureId === null && activeTab === 'capture'
                  ? 'bg-blue-50 text-blue-700 font-semibold'
                  : 'text-slate-600 hover:bg-slate-50 dark:text-zinc-400 dark:hover:bg-zinc-800'
              }`}
            >
              <Tv className="w-4 h-4" />
              Capture Workspace
            </button>

            <button
              id="nav-help"
              onClick={() => {
                setSelectedLectureId(null);
                setActiveTab('help');
              }}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left text-xs font-medium transition-all cursor-pointer ${
                selectedLectureId === null && activeTab === 'help'
                  ? 'bg-blue-50 text-blue-700 font-semibold'
                  : 'text-slate-600 hover:bg-slate-50 dark:text-zinc-400 dark:hover:bg-zinc-800'
              }`}
            >
              <HelpCircle className="w-4 h-4" />
              Platform Guide
            </button>
          </nav>

          {/* Quick list of lectures sidebar shortcuts */}
          {lectures.length > 0 && (
            <div className="px-4 py-2 mt-4">
              <span className="block text-[10px] font-bold text-slate-400 dark:text-zinc-550 uppercase tracking-widest px-3 mb-2">My Classes</span>
              <div className="space-y-1 max-h-[180px] overflow-y-auto scrollbar-thin">
                {lectures.map((lec) => (
                  <button
                    id={`lec-shortcut-${lec.id}`}
                    key={lec.id}
                    onClick={() => setSelectedLectureId(lec.id)}
                    className={`w-full block px-3 py-1.5 rounded-lg text-left text-[11px] font-medium truncate ${
                      selectedLectureId === lec.id
                        ? 'bg-blue-50 dark:bg-zinc-850 text-blue-700 dark:text-blue-400 font-bold border-l-2 border-blue-600'
                        : 'text-slate-650 dark:text-zinc-450 hover:text-blue-600'
                    }`}
                  >
                    {lec.title}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Support credit */}
        <div className="p-4 border-t border-slate-100 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950/20 text-xxs text-slate-400 dark:text-zinc-500 text-center flex flex-col gap-1.5">
          <div className="flex items-center gap-1.5 justify-center font-bold text-slate-600 dark:text-zinc-300">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span>
            Privacy Protections Fully Active
          </div>
          <p className="leading-normal mx-2">No audio sharing payloads are saved. Standard safety guidelines enforced.</p>
        </div>
      </aside>

      {/* RIGHT MAIN SCATTER STAGE */}
      <main className="flex-1 p-6 md:p-8 overflow-y-auto max-w-7xl mx-auto w-full space-y-6">
        
        {/* Active view mapping */}
        {selectedLectureId ? (
          <div>
            {/* Breadcrumb row to jump back */}
            <div className="mb-4">
              <button 
                id="back-to-dashboard"
                onClick={() => setSelectedLectureId(null)}
                className="text-xs font-semibold text-slate-400 hover:text-blue-600 flex items-center gap-1.5 cursor-pointer"
              >
                &lsaquo; Back to Catalog / Dashboard
              </button>
            </div>
            {activeLecture && (
              <NotesViewer 
                lecture={activeLecture} 
                onUpdateLecture={handleUpdateLecture}
              />
            )}
          </div>
        ) : activeTab === 'dashboard' ? (
          <Dashboard 
            lectures={lectures}
            onSelectLecture={setSelectedLectureId}
            onDeleteLecture={handleDeleteLecture}
            onToggleFavorite={handleToggleFavorite}
            user={user}
            onUpdateUser={setUser}
            onOpenCapture={() => setActiveTab('capture')}
          />
        ) : activeTab === 'capture' ? (
          <div className="space-y-6">
            <div className="pb-2 border-b border-zinc-200 dark:border-zinc-800">
              <h2 className="text-2xl font-extrabold tracking-tight">Active Class Capturing Desk</h2>
              <p className="text-xs text-zinc-500 mt-1">Hook up browser screen shares and microphone audio to construct revision manuals dynamically.</p>
            </div>
            <CaptureModule 
              onLectureCreated={handleAddNewLecture}
              subjects={user.subjects}
            />
          </div>
        ) : (
          /* PLATFORM GUIDE WORKSPACE */
          <div className="p-6 md:p-8 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl space-y-6 max-w-3xl shadow-sm">
            <div className="space-y-2">
              <h2 className="text-xl font-bold tracking-tight text-slate-800 dark:text-zinc-100">Student Success Guide</h2>
              <p className="text-xs text-blue-600 dark:text-blue-400 font-bold">Everything you need to know about LectureNote AI</p>
            </div>

            <div className="space-y-4 text-xs text-slate-650 dark:text-zinc-400 leading-relaxed whitespace-pre-line">
              <strong>1. How does the Lecture Capture system work?</strong>
              By clicking "Initialize Capture Engine", the system calls <code className="px-1.5 py-0.5 bg-slate-50 dark:bg-zinc-800 font-mono text-slate-800 dark:text-zinc-250 border border-slate-200 rounded">navigator.mediaDevices.getDisplayMedia</code>. This allows securely sharing your webinar, slides window, YouTube player, or meeting. Snapshot intervals periodically analyze screen visuals for equations, algorithms, and code.

              <strong>2. No live lecture right now?</strong>
              Use the <strong className="text-blue-600">Instant Study Simulator</strong>. We pre-configured comprehensive university templates in Computer Science & Organic Chemistry. You can trigger them with one click on the active sidebar card to see the flashcard builder and practice tests instantly.

              <strong>3. Privacy Guarantee</strong>
              The app complies with education safety constraints:
              - No attendee faces are analyzed or stored.
              - No voice print profiling is carried out to detect personal identities.
              - Standard local storage stores files on your browser securely.
            </div>

            <button
              id="guide-to-home"
              onClick={() => setActiveTab('dashboard')}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg cursor-pointer shadow-sm transition-all shadow-blue-200"
            >
              Start Studying Now
            </button>
          </div>
        )}

      </main>

    </div>
  );
}

// Simple onboarding component to satisfy the "Ask the user for name" requirement elegantly
interface OnboardingWizardProps {
  onComplete: (name: string) => void;
}

function OnboardingWizard({ onComplete }: OnboardingWizardProps) {
  const [typed, setTyped] = useState('');

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (typed.trim()) {
      onComplete(typed.trim());
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#090D16] text-slate-900 dark:text-zinc-100 flex items-center justify-center p-6">
      <div className="max-w-md w-full p-8 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-sm space-y-6 text-center relative overflow-hidden">
        
        {/* Accent bubble */}
        <div className="absolute top-0 left-0 w-24 h-24 bg-blue-10/40 dark:bg-zinc-950/20 rounded-full blur-2xl pointer-events-none"></div>

        <div className="space-y-2">
          <div className="w-12 h-12 bg-blue-600 text-white font-extrabold text-xl flex items-center justify-center rounded-xl mx-auto shadow-sm shadow-blue-200">
            L
          </div>
          <h2 className="text-xl font-bold tracking-tight mt-4 text-slate-800 dark:text-zinc-100">Welcome to LectureNote AI</h2>
          <p className="text-slate-500 dark:text-zinc-400 text-xs leading-normal">
            Your specialized study assistant that turns webinars, recorded lectures, system voice audio, and diagrams into exam-ready study guides.
          </p>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div className="text-left">
            <label className="block text-9px font-black text-slate-400 dark:text-zinc-550 uppercase tracking-widest mb-1.5">What should we call you?</label>
            <input
              id="onboarding-name-input"
              type="text"
              required
              maxLength={20}
              placeholder="e.g., Emily, Charles, Meghana..."
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              className="w-full px-4 py-2.5 bg-[#F8FAFC] dark:bg-zinc-850 border border-slate-200 dark:border-zinc-800 rounded-lg focus:ring-1 focus:ring-blue-500 outline-hidden text-sm font-semibold text-slate-800 dark:text-zinc-100"
              autoFocus
            />
          </div>

          <button
            id="onboarding-setup-desk-btn"
            type="submit"
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg shadow-sm transition-all hover:scale-101 cursor-pointer shadow-blue-105"
          >
            Configure My Lecture Desk
          </button>
        </form>

        <p className="text-[10px] text-slate-400 dark:text-zinc-500 italic">
          Fully local persistence. Adheres to zero-tracking privacy rules.
        </p>

      </div>
    </div>
  );
}
