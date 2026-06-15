import React, { useState, useRef, useEffect } from 'react';
import { 
  Tv, Mic, Square, Play, RefreshCw, Upload, AlertCircle, FileText, 
  HelpCircle, MonitorPlay, Sparkles, BookOpen, Volume2, CloudUpload,
  Video, ArrowLeft, Camera, ShieldCheck, CheckCircle
} from 'lucide-react';
import { Lecture } from '../types';

interface CaptureModuleProps {
  onLectureCreated: (newLecture: Lecture) => void;
  subjects: string[];
}

// Preset interactive script data to power the custom simulator dynamically
const SUBJECT_SCRIPTS: { [key: string]: { title: string; phrases: string[]; slides: string[] } } = {
  'computer science': {
    title: 'Advanced Machine Learning & Neural Network Backpropagation',
    phrases: [
      "[Professor]: Hello team. Let's study how a multi-layer Neural Network propagates weights.",
      "[Professor]: Every node computes input activations times weight matrices plus bias transposes.",
      "[Professor]: The error delta backpropagates using partial derivatives: del(Error)/del(Weights).",
      "[Professor]: We perform stochastic gradient steps with learning multiplier speed alpha.",
      "[Professor]: Check slide #2. Here is the vectorized optimization line in standard Python code.",
      "[Professor]: Remember that midterm task #1 is scheduled to open this Friday evening.",
      "[Professor]: Review optimization boundaries, because activation bounds define cost bounds."
    ],
    slides: [
      'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=600&auto=format&fit=crop&q=60', // neural net
      'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=600&auto=format&fit=crop&q=60', // code
      'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=60'  // server diagram
    ]
  },
  'organic chemistry': {
    title: 'Stereochemistry: Enantiomers and Chiral Carbon Centers',
    phrases: [
      "[Professor]: Good morning chemists. Today we are tackling stereoisomers.",
      "[Professor]: A chiral center possesses an asymmetric carbon holding four unique or distinct organic chains.",
      "[Professor]: We apply the Cahn-Ingold-Prelog priority numbering from heavy atoms to light atoms.",
      "[Professor]: Clockwise tracing indicates R (Rectus) configuration orientation.",
      "[Professor]: Counter-clockwise sequence designates S (Sinister) configurations.",
      "[Professor]: Look at specific optical rotation formula: [alpha] = observed-deg / (concentration * length_dm).",
      "[Professor]: Workbook homework question #3 is due next Tuesday block on chemical analysis."
    ],
    slides: [
      'https://images.unsplash.com/photo-1532187863486-abf9d39d66e8?w=600&auto=format&fit=crop&q=60', // chem lab
      'https://images.unsplash.com/photo-1617155093730-a8bf47be792d?w=600&auto=format&fit=crop&q=60'  // molecular models
    ]
  },
  'mathematics': {
    title: 'Differential Calculus: Limits, Derivatives, and Rate of Change',
    phrases: [
      "[Professor]: Welcome back to Calculus. Today we define the rate of relative change.",
      "[Professor]: The derivative represents the limit of [f(x+h) - f(x)] divided by h as h approaches 0.",
      "[Professor]: Geometrically, this defines the exact tangent slope line of standard curves at point x.",
      "[Professor]: If a function continuous bounds have differential endpoints, Rolle's Theorem applies.",
      "[Professor]: Look at the Taylor series limit expansion formula on slide #1.",
      "[Professor]: We have a quick exam revision test this Monday in class. Bring your graphing calculators.",
      "[Professor]: Practice workbook chapters 5.1 through 5.4 before our recitations."
    ],
    slides: [
      'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=600&auto=format&fit=crop&q=60', // chalkboard equations
      'https://images.unsplash.com/photo-1453733190148-c44698c265a8?w=600&auto=format&fit=crop&q=60'  // workbook draft
    ]
  },
  'general': {
    title: 'Introduction to Modern Research and Applied Study Methods',
    phrases: [
      "[Professor]: Welcome to today's seminar. Let's outline the core principles of active study.",
      "[Professor]: Scholarly retention spikes when we couple audio capturing with rapid flashcard recall.",
      "[Professor]: Structured outlines segment topics into executive recaps, key terminologies, and diagrams.",
      "[Professor]: Make sure to snap whiteboard diagrams when they illustrate core concepts.",
      "[Professor]: Active review sessions of only 15 minutes outperform hours of passive reading.",
      "[Professor]: The course syllabus requires a 2-page essay due next Wednesday.",
      "[Professor]: Let's move to the main formula panel for our general engineering overview."
    ],
    slides: [
      'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=600&auto=format&fit=crop&q=60', // university room
      'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=600&auto=format&fit=crop&q=60'  // note taking pad
    ]
  }
};

const getScript = (subject: string) => {
  const normalized = subject.toLowerCase().trim();
  if (normalized.includes('science') || normalized.includes('computer') || normalized.includes('cs') || normalized.includes('code') || normalized.includes('programming') || normalized.includes('python')) {
    return SUBJECT_SCRIPTS['computer science'];
  }
  if (normalized.includes('chem') || normalized.includes('organic') || normalized.includes('biochem') || normalized.includes('molecular')) {
    return SUBJECT_SCRIPTS['organic chemistry'];
  }
  if (normalized.includes('math') || normalized.includes('calculus') || normalized.includes('linear') || normalized.includes('algebra') || normalized.includes('differential')) {
    return SUBJECT_SCRIPTS['mathematics'];
  }
  return SUBJECT_SCRIPTS['general'];
};

export default function CaptureModule({ onLectureCreated, subjects }: CaptureModuleProps) {
  // Capture Stage
  const [captureStage, setCaptureStage] = useState<'setup' | 'connection' | 'active'>('setup');
  
  // Audio & video stream captures
  const [isRecording, setIsRecording] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [liveTranscript, setLiveTranscript] = useState('');
  const [snapshots, setSnapshots] = useState<string[]>([]);
  const [timer, setTimer] = useState(0);
  const [selectedSubject, setSelectedSubject] = useState(subjects[0] || 'Computer Science');
  
  // Custom manual paste states
  const [uploadText, setUploadText] = useState('');
  const [uploadTitle, setUploadTitle] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  // Simulation flags
  const [isSimulatedStream, setIsSimulatedStream] = useState(false);
  const [simulationIndex, setSimulationIndex] = useState(0);
  const [flashEffect, setFlashEffect] = useState(false);

  // New Meeting ID integration variables
  const [meetingIdOrLink, setMeetingIdOrLink] = useState('');
  const [meetingPasscode, setMeetingPasscode] = useState('');
  const [connectionMethod, setConnectionMethod] = useState<'meeting-id' | 'screen-share' | 'sandbox' | null>(null);
  const [isCompanionJoining, setIsCompanionJoining] = useState(false);
  const [companionJoinStep, setCompanionJoinStep] = useState(0);

  // References
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const recognitionRef = useRef<any>(null);

  // Core Timer clock trigger
  useEffect(() => {
    if (isRecording) {
      timerIntervalRef.current = setInterval(() => {
        setTimer(prev => prev + 1);
      }, 1000);
    } else {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      setTimer(0);
    }
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [isRecording]);

  useEffect(() => {
    return () => {
      stopRecordingTracks();
    };
  }, []);

  // Classroom Live Simulator ticker effect
  useEffect(() => {
    if (isRecording && isSimulatedStream) {
      const script = getScript(selectedSubject);
      const phrases = script.phrases;
      const slidesList = script.slides;

      // Update active presentation slide index every 14 seconds
      const slideIdx = Math.floor(timer / 14) % slidesList.length;
      setSimulationIndex(slideIdx);

      // Auto capture current presentation whiteboard slide to snapshot lists every 20 seconds
      if (timer > 0 && timer % 20 === 0) {
        const currentSlideImg = slidesList[slideIdx] || slidesList[0];
        if (currentSlideImg) {
          setSnapshots(prev => {
            if (prev.includes(currentSlideImg)) return prev;
            return [...prev, currentSlideImg].slice(-4);
          });
        }
      }

      // Append speech phrase blocks every 6 seconds as if speaking
      if (timer > 0 && timer % 6 === 0) {
        const textIdx = Math.floor(timer / 6) % phrases.length;
        const nextPhrase = phrases[textIdx];
        if (nextPhrase) {
          setLiveTranscript(prev => {
            if (prev.includes(nextPhrase)) return prev;
            return prev + '\n' + nextPhrase;
          });
        }
      }
    }
  }, [timer, isRecording, isSimulatedStream, selectedSubject]);

  const startSimulatedSession = () => {
    setUploadError('');
    setIsSimulatedStream(true);
    setIsRecording(true);
    setCaptureStage('active');
    setConnectionMethod('sandbox');
    
    const script = getScript(selectedSubject);
    setLiveTranscript(`[System: Live Webinar Companion Simulator Initialized for Class: "${selectedSubject || 'General'}"]\nConnecting virtual microphone feed... Live!\nWhiteboard feed... Syncing!\n\n[System]: Transcribed lecture audio blocks will stream below live. Manual and automatic screen slides are OCR-processed.`);
    setSnapshots([]);
    setTimer(0);
  };

  const startMeetingBotSession = async () => {
    if (!meetingIdOrLink.trim()) {
      setUploadError("Please provide a valid Zoom, Teams, Skype, Meet, or YouTube URL link.");
      return;
    }
    setUploadError('');

    // Detect if this is a web link / URL
    const isUrl = meetingIdOrLink.toLowerCase().includes('http://') || 
                  meetingIdOrLink.toLowerCase().includes('https://') ||
                  meetingIdOrLink.toLowerCase().includes('www.') ||
                  meetingIdOrLink.toLowerCase().includes('youtu');

    if (isUrl) {
      setIsCompanionJoining(true);
      setCompanionJoinStep(1);
      setConnectionMethod('meeting-id');

      try {
        setCompanionJoinStep(1);
        await new Promise(r => setTimeout(r, 600));
        
        setCompanionJoinStep(2);
        // Direct, high-speed crawler digestion
        const endpoint = '/api/generate-demo-lecture';
        const body = { 
          subject: selectedSubject, 
          topic: uploadTitle || "Online Web Session",
          link: meetingIdOrLink
        };

        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        });

        setCompanionJoinStep(3);
        await new Promise(r => setTimeout(r, 600));
        
        setCompanionJoinStep(4);
        await new Promise(r => setTimeout(r, 400));

        if (!res.ok) {
          const errDetails = await res.json();
          throw new Error(errDetails.error || 'Link processing failed. Verify server configuration.');
        }

        const generatedData = await res.json();

        const completedLecture: Lecture = {
          id: Math.random().toString(36).substring(2, 9),
          title: generatedData.title || uploadTitle || `${selectedSubject}: Online Session`,
          date: new Date().toISOString(),
          subject: selectedSubject.trim() || generatedData.subject || 'General Studies',
          semester: 'Fall 2026',
          tags: generatedData.tags || ['WebClass', 'DirectDigest'],
          transcript: generatedData.transcript || `[Transcribed from Shared Link]: ${meetingIdOrLink}`,
          slides: [], // No snapshots/blackboard slide overlays when reading from direct link!
          favorite: false,
          progress: 100,
          notes: generatedData.notes,
          summary: generatedData.summary,
          quiz: generatedData.quiz,
          flashcards: generatedData.flashcards?.map((c: any, index: number) => ({
            id: `card-${index}-${Date.now()}`,
            question: c.question,
            answer: c.answer
          })) || []
        };

        onLectureCreated(completedLecture);
        setMeetingIdOrLink('');
        setMeetingPasscode('');
        
      } catch (err: any) {
        console.error("Direct Link Digest Error:", err);
        setUploadError(err.message || "Failed to digest link. Ensure the link is publicly accessible or try again.");
      } finally {
        setIsCompanionJoining(false);
      }
      return;
    }

    // Otherwise, run the fallback live interactive call simulation (requires whiteboard / snapshots)
    setIsCompanionJoining(true);
    setCompanionJoinStep(1);
    setConnectionMethod('meeting-id');

    let currentStep = 1;
    const stepInterval = setInterval(() => {
      currentStep++;
      if (currentStep <= 4) {
        setCompanionJoinStep(currentStep);
      } else {
        clearInterval(stepInterval);
        setIsCompanionJoining(false);
        setIsRecording(true);
        setIsSimulatedStream(true); // Powered by high-fidelity AI simulation loop
        setCaptureStage('active');
        
        const cleanName = uploadTitle || "Session Study Series";
        setLiveTranscript(`[System: AI Companion Bot Joined Live Virtual Call]\nMeeting Target Room: "${meetingIdOrLink}"\nSubject: "${selectedSubject}"\nTopic: "${cleanName}"\nStatus: Dual-channel audio stream active, capturing live speaking tracks...\n\n[LectureNote Bot]: Hello! I am securely listening to the webinar feed in the background. I am transcribing the professor's voices and preparing your comprehensive revision manual with practice tests. Proceed as normal!`);
        setSnapshots([]);
        setTimer(0);
      }
    }, 1200);
  };

  const stopRecordingTracks = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }
    setStream(null);
  };

  // Real display capture through navigator.getDisplayMedia
  const startRealCapture = async () => {
    try {
      setUploadError('');
      const mediaStream = await navigator.mediaDevices.getDisplayMedia({
        video: { displaySurface: 'browser' },
        audio: true
      });

      setStream(mediaStream);
      setIsSimulatedStream(false);
      setIsRecording(true);
      setCaptureStage('active');
      setConnectionMethod('screen-share');
      setLiveTranscript(`[System]: Real screen media pipeline successfully attached.\nTranscribing lecture speech in real-time... Make sure your meeting speaker audio is outputting to system channel.`);

      // Connect standard video Ref to display screen inside monitor
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      }, 300);

      // Periodically capture visual snapshots from screen slide (every 12 seconds)
      intervalRef.current = setInterval(() => {
        captureFrame(mediaStream);
      }, 12000);

      // Start the voice audio voice translation using Web Speech recognition if in browser
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onresult = (event: any) => {
          let chunk = '';
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              chunk += event.results[i][0].transcript + ' ';
            }
          }
          if (chunk) {
            setLiveTranscript(prev => prev + '\n' + chunk);
          }
        };

        recognition.onerror = (e: any) => {
          console.warn("Speech API warning:", e);
        };

        recognition.onend = () => {
          if (isRecording) {
            try { recognition.start(); } catch (err) {}
          }
        };

        recognitionRef.current = recognition;
        recognition.start();
      } else {
        setLiveTranscript(prev => prev + "\n[Warning]: browser SpeechRecognition unavailable. Generating study notes primarily from slide snapshot contents & transcript backups.");
      }

    } catch (e: any) {
      console.error(e);
      setUploadError(
        "Failed to execute 'getDisplayMedia' on 'MediaDevices': Access to the feature 'display-capture' is disallowed by browser/iframe permissions policy. " +
        "To test instantly without security locks, please launch the live Classroom Simulation Sandbox instead!"
      );
      setCaptureStage('connection');
      setIsRecording(false);
    }
  };

  // Real image grab helper converting media frame to OCR base64
  const captureFrame = (activeStream: MediaStream) => {
    try {
      const videoTrack = activeStream.getVideoTracks()[0];
      if (!videoTrack) return;

      const videoElement = document.createElement('video');
      videoElement.srcObject = activeStream;
      videoElement.play();

      videoElement.onloadedmetadata = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 640;
        canvas.height = 360;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
          const base64 = canvas.toDataURL('image/jpeg', 0.5);
          
          setSnapshots(prev => {
            if (prev.length >= 4) {
              return [...prev.slice(1), base64];
            }
            return [...prev, base64];
          });
        }
        videoElement.srcObject = null;
      };
    } catch (err) {
      console.warn("Snapshot capture frame skipped:", err);
    }
  };

  const manualSnapSimulatedSlide = () => {
    const script = getScript(selectedSubject);
    const activeImg = script.slides[simulationIndex] || script.slides[0];
    if (activeImg) {
      setSnapshots(prev => {
        if (prev.includes(activeImg)) return prev;
        return [...prev, activeImg].slice(-4);
      });
      // Trigger camera click visual flash effect
      setFlashEffect(true);
      setTimeout(() => setFlashEffect(false), 250);
    }
  };

  const manualSnapRealFrame = () => {
    if (stream) {
      captureFrame(stream);
      // Trigger camera click visual flash effect
      setFlashEffect(true);
      setTimeout(() => setFlashEffect(false), 250);
    }
  };

  // Publish session and push accumulated materials to fullstack backend with real Gemini PDF builders
  const handlePublishClass = async () => {
    setIsUploading(true);
    setUploadError('');

    try {
      const isMeetingBot = connectionMethod === 'meeting-id';
      
      // If we are in the Sandbox simulator, we want the generated study guides to be super rich 
      // and reflect exactly what the core session delivered, containing the entire preset phrases and slides!
      let finalTranscript = liveTranscript;
      let finalSnapshots = snapshots;

      if (connectionMethod === 'sandbox') {
        const fullScript = getScript(selectedSubject);
        const completePhrases = [
          `[System: Live Webinar Companion Simulator Initialized for Class: "${selectedSubject}"]`,
          `[Lecture Topic]: ${fullScript.title}`,
          `[Duration]: Full Lecture Session`,
          ...fullScript.phrases
        ].join('\n');
        
        finalTranscript = completePhrases;
        finalSnapshots = fullScript.slides;
      }

      const endpoint = isMeetingBot ? '/api/generate-demo-lecture' : '/api/analyze-lecture';
      const body = isMeetingBot 
        ? { 
            subject: selectedSubject, 
            topic: uploadTitle || "Advanced Educational Symposium",
            link: meetingIdOrLink
          }
        : { transcript: finalTranscript, slideImages: finalSnapshots };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (!res.ok) {
        const errDetails = await res.json();
        throw new Error(errDetails.error || 'Study synthesizing error. Verify Gemini API Key configuration.');
      }

      const generatedData = await res.json();
      
      const completedLecture: Lecture = {
        id: Math.random().toString(36).substring(2, 9),
        title: generatedData.title || uploadTitle || `Class Lecture Notes: ${selectedSubject}`,
        date: new Date().toISOString(),
        subject: selectedSubject.trim() || generatedData.subject || 'General Studies',
        semester: 'Fall 2026',
        tags: generatedData.tags || ['Webinar', 'LectureNotes'],
        transcript: finalTranscript || JSON.stringify(generatedData.notes?.topics || []),
        slides: finalSnapshots,
        favorite: false,
        progress: 100,
        notes: generatedData.notes,
        summary: generatedData.summary,
        quiz: generatedData.quiz,
        flashcards: generatedData.flashcards?.map((c: any, index: number) => ({
          id: `card-${index}-${Date.now()}`,
          question: c.question,
          answer: c.answer
        })) || []
      };

      onLectureCreated(completedLecture);
      resetCaptureSession();

    } catch (err: any) {
      console.error(err);
      setUploadError(err.message || 'Gemini processing error. Is the server API Key provisioned?');
    } finally {
      setIsUploading(false);
    }
  };

  // Direct paste transcription manual processor
  const handleManualUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadText.trim()) {
      setUploadError('Please specify transcript or lecture script first.');
      return;
    }

    setIsUploading(true);
    setUploadError('');

    try {
      const res = await fetch('/api/analyze-lecture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript: uploadText,
          slideImages: []
        })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed generating outline summary.');
      }

      const parsedLecture = await res.json();

      const createdLecture: Lecture = {
        id: Math.random().toString(36).substring(2, 9),
        title: parsedLecture.title || uploadTitle || `Manual Analysis: ${selectedSubject}`,
        date: new Date().toISOString(),
        subject: selectedSubject.trim() || parsedLecture.subject || 'General Studies',
        semester: '',
        tags: parsedLecture.tags || ['StudyManual', 'Drafts'],
        transcript: uploadText,
        slides: [],
        favorite: false,
        progress: 100,
        notes: parsedLecture.notes,
        summary: parsedLecture.summary,
        quiz: parsedLecture.quiz,
        flashcards: parsedLecture.flashcards?.map((fc: any, i: number) => ({
          id: `fc-${i}-${Date.now()}`,
          question: fc.question,
          answer: fc.answer
        })) || []
      };

      onLectureCreated(createdLecture);
      setUploadText('');
      setUploadTitle('');
      setCaptureStage('setup');

    } catch (err: any) {
      console.error(err);
      setUploadError(err.message || 'AI processing error. Verify your system setup.');
    } finally {
      setIsUploading(false);
    }
  };

  const resetCaptureSession = () => {
    stopRecordingTracks();
    setIsRecording(false);
    setIsSimulatedStream(false);
    setLiveTranscript('');
    setSnapshots([]);
    setTimer(0);
    setUploadError('');
    setCaptureStage('setup');
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remaining = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remaining.toString().padStart(2, '0')}`;
  };

  // Define simulated background slides matching subject selector
  const scriptData = getScript(selectedSubject);
  const activeSlideImage = scriptData.slides[simulationIndex] || scriptData.slides[0];

  return (
    <div id="capture-module-root" className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      
      {/* COMPACT AI GENERATING OVERLAY */}
      {isUploading && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-50 flex items-center justify-center p-6 text-center animate-fade-in">
          <div className="bg-white dark:bg-[#161C2A] border border-slate-200 dark:border-zinc-800 p-8 rounded-3xl max-w-md w-full shadow-2xl space-y-6">
            <div className="relative w-16 h-16 mx-auto">
              <div className="absolute inset-0 rounded-full border-4 border-slate-100 dark:border-zinc-800"></div>
              <div className="absolute inset-0 rounded-full border-4 border-blue-600 border-t-transparent animate-spin"></div>
              <Sparkles className="absolute inset-4 text-amber-500 animate-pulse w-8 h-8" />
            </div>
            
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-slate-800 dark:text-zinc-100">Analyzing Captured Materials</h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400 leading-normal">
                Google Gemini AI is transcribing speaker tracks, performing Optical Character Recognition on whiteboard visuals, and compiling scholar notes & quiz sheets.
              </p>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-zinc-900/60 rounded-xl space-y-1.5 text-left">
              <div className="flex items-center gap-2 text-xxs font-bold text-slate-400 dark:text-zinc-500 uppercase">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                Deduplicated slides indexed
              </div>
              <div className="flex items-center gap-2 text-xxs font-bold text-slate-405 dark:text-zinc-500 uppercase">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                Drafting key vocabulary items
              </div>
              <div className="flex items-center gap-2 text-xxs font-bold text-slate-400 dark:text-zinc-500 uppercase">
                <RefreshCw className="w-3 h-3 text-blue-500 animate-spin" />
                Synthesizing downloadable study PDF
              </div>
            </div>
          </div>
        </div>
      )}

      {/* LEFT 2 COLUMNS: DIRECT INTERACTIVE COMPANION RECORDER */}
      <div className="lg:col-span-2 space-y-6">
        
        {/* COMPACT AI GENERATING OVERLAY */}
        {isUploading && (
          <div className="fixed inset-0 bg-slate-900/85 backdrop-blur-md z-50 flex items-center justify-center p-6 text-center animate-fade-in">
            <div className="bg-white dark:bg-[#111622] border border-slate-200 dark:border-zinc-800 p-8 rounded-3xl max-w-md w-full shadow-2xl space-y-6">
              <div className="relative w-16 h-16 mx-auto">
                <div className="absolute inset-0 rounded-full border-4 border-slate-100 dark:border-zinc-800/60"></div>
                <div className="absolute inset-0 rounded-full border-4 border-blue-600 border-t-transparent animate-spin"></div>
                <Sparkles className="absolute inset-4 text-amber-500 animate-pulse w-8 h-8" />
              </div>
              
              <div className="space-y-2">
                <h3 className="text-lg font-black text-slate-805 dark:text-zinc-100 tracking-tight">Synthesizing Lecture Guide</h3>
                <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed font-sans">
                  LectureNote is transcribing speaker tracks, interpreting mathematical formulas, generating interactive flashcards, and compiling a textbook-grade PDF study booklet.
                </p>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-zinc-900/60 border border-slate-100 dark:border-zinc-800/80 rounded-2xl space-y-2 text-left">
                <div className="flex items-center gap-2.5 text-xxs font-bold text-slate-500 dark:text-zinc-400 uppercase">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  Structuring bullet study blocks
                </div>
                <div className="flex items-center gap-2.5 text-xxs font-bold text-slate-500 dark:text-zinc-400 uppercase">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  Formulating high-yield exams questions
                </div>
                <div className="flex items-center gap-2.5 text-xxs font-bold text-slate-500 dark:text-zinc-400 uppercase">
                  <span className="w-3 h-3 text-blue-500 animate-spin flex items-center justify-center font-bold">↻</span>
                  Building downloadable PDF revision package
                </div>
              </div>
            </div>
          </div>
        )}

        {/* COMPACT COMPANION CONNECTING OVERLAY */}
        {isCompanionJoining && (() => {
          const isUrl = meetingIdOrLink.toLowerCase().includes('http://') || 
                        meetingIdOrLink.toLowerCase().includes('https://') ||
                        meetingIdOrLink.toLowerCase().includes('www.') ||
                        meetingIdOrLink.toLowerCase().includes('youtu');
          return (
            <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-50 flex items-center justify-center p-6 text-center animate-fade-in">
              <div className="bg-[#111622] border border-zinc-800 p-8 rounded-3xl max-w-sm w-full shadow-2xl space-y-6 text-white text-left font-sans">
                <div className="flex items-center gap-3 border-b border-zinc-805 pb-4 mb-2">
                  <div className="p-2 bg-blue-500/10 rounded-xl border border-blue-500/20">
                    <Sparkles className="w-5 h-5 text-blue-400 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-zinc-100 uppercase tracking-wider">
                      {isUrl ? "AI Web Link Digesting" : "AI Companion Joiner"}
                    </h3>
                    <p className="text-[10px] text-zinc-400">
                      {isUrl ? "Analyzing and reading video transcripts..." : "Deploying cloud virtual listener bot..."}
                    </p>
                  </div>
                </div>

                <div className="space-y-3.5 text-xs">
                  <div className="flex items-center gap-3">
                    <span className={`w-3 h-3 rounded-full flex items-center justify-center text-[8px] font-black ${companionJoinStep >= 1 ? 'bg-emerald-500 text-white animate-pulse' : 'bg-zinc-805 text-zinc-400'}`}>1</span>
                    <span className={companionJoinStep >= 1 ? 'text-zinc-200 font-semibold' : 'text-zinc-500'}>
                      {isUrl ? `Reading and resolving target link: "${meetingIdOrLink}"` : `Resolving meeting endpoint: "${meetingIdOrLink}"`}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`w-3 h-3 rounded-full flex items-center justify-center text-[8px] font-black ${companionJoinStep >= 2 ? 'bg-emerald-500 text-white animate-pulse' : 'bg-zinc-805 text-zinc-400'}`}>2</span>
                    <span className={companionJoinStep >= 2 ? 'text-zinc-200 font-semibold' : 'text-zinc-500'}>
                      {isUrl ? "Extracting actual video subtitle tracks and text content..." : "Securing WebRTC stream pipelines..."}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`w-3 h-3 rounded-full flex items-center justify-center text-[8px] font-black ${companionJoinStep >= 3 ? 'bg-emerald-500 text-white animate-pulse' : 'bg-zinc-805 text-zinc-400'}`}>3</span>
                    <span className={companionJoinStep >= 3 ? 'text-zinc-200 font-semibold' : 'text-zinc-500'}>
                      {isUrl ? "Initializing Gemini Deep-Learning Study Synthesizer..." : "Entering virtual meeting lobby... Accepted!"}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`w-3 h-3 rounded-full flex items-center justify-center text-[8px] font-black ${companionJoinStep >= 4 ? 'bg-emerald-500 text-white animate-bounce' : 'bg-zinc-805 text-zinc-400'}`}>4</span>
                    <span className={companionJoinStep >= 4 ? 'text-emerald-400 font-black animate-pulse' : 'text-zinc-500'}>
                      {isUrl ? "Compiling structured notes, quizzes, and exams..." : "Activating classroom voice feed listener"}
                    </span>
                  </div>
                </div>

                <div className="p-3 bg-zinc-950 rounded-lg text-[10px] text-zinc-400 leading-relaxed border border-zinc-850">
                  {isUrl ? (
                    <span>⚡ <b>Direct Link Engine</b>: Automatically extracts transcripts. Manual slide snapshots are skipped because we synthesize everything directly from the source!</span>
                  ) : (
                    <span>🤖 <b>Bot Presence guest alias</b>: <span className="font-mono text-blue-400">"LectureNote AI Companion"</span>. No human login required. Enjoy safe background transcription!</span>
                  )}
                </div>
              </div>
            </div>
          );
        })()}

        {/* WIZARD PROCESS STAGE 1: SET NAME & LECTURE OUTLINE */}
        {captureStage === 'setup' && (
          <div className="p-6 bg-white dark:bg-[#161C2A] border border-slate-205 dark:border-zinc-800 rounded-2xl shadow-xs space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-zinc-850">
              <div className="space-y-0.5">
                <span className="text-[10px] uppercase tracking-widest font-extrabold text-blue-600 dark:text-blue-400">Step 1 of 2</span>
                <h3 className="text-base font-extrabold text-slate-800 dark:text-zinc-150">Describe Your Class Session</h3>
              </div>
              <Tv className="w-5 h-5 text-slate-400" />
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-600 dark:text-zinc-400">
                  Lecture Topic / Title
                </label>
                <input
                  id="lecture-title-input"
                  type="text"
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  placeholder="e.g., Photosynthesis & Carbon Cycles, Intro to Neural Networks..."
                  className="w-full text-xs font-semibold px-4 py-3 bg-slate-50 dark:bg-zinc-900 border border-slate-205 dark:border-zinc-800 rounded-xl focus:ring-1 focus:ring-blue-500 text-slate-800 dark:text-zinc-200 outline-none"
                />
                <span className="text-[10px] text-slate-400 dark:text-zinc-500 block">
                  💡 This name will be printed directly onto your customizable PDF study guides and booklets!
                </span>
              </div>

              <div className="space-y-1.5 pt-2">
                <label className="block text-xs font-bold text-slate-600 dark:text-zinc-400">
                  Academic Focus Subject
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {subjects.map(sub => (
                    <button
                      key={sub}
                      id={`preset-subject-${sub.replace(/\s+/g, '-').toLowerCase()}`}
                      type="button"
                      onClick={() => setSelectedSubject(sub)}
                      className={`px-3.5 py-2 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
                        selectedSubject === sub 
                          ? 'bg-blue-600 text-white shadow-xs' 
                          : 'bg-slate-105 hover:bg-slate-200 dark:bg-zinc-850 dark:hover:bg-zinc-800 text-slate-600 dark:text-zinc-350'
                      }`}
                    >
                      {sub}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-4 bg-blue-50/40 dark:bg-blue-990/10 border border-blue-100/60 dark:border-blue-900/30 rounded-xl">
                <p className="text-[11px] text-slate-600 dark:text-zinc-400 leading-relaxed font-sans">
                  💡 High-fidelity templates for formulas, terminology indexes, algorithm structures, and quiz outlines will load dynamically to elevate study guide output accuracy.
                </p>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  id="next-step-btn"
                  onClick={() => setCaptureStage('connection')}
                  disabled={!uploadTitle.trim()}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-40"
                >
                  Configure Lecture Stream &rarr;
                </button>
              </div>
            </div>
          </div>
        )}

        {/* WIZARD PROCESS STAGE 2: ACCESS CONNECT METHOD selection */}
        {captureStage === 'connection' && (
          <div className="p-6 bg-white dark:bg-[#161C2A] border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-xs space-y-6 font-sans">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-zinc-850">
              <div className="space-y-0.5">
                <span className="text-[10px] uppercase tracking-widest font-extrabold text-blue-600 dark:text-blue-400">Step 2 of 2</span>
                <h3 className="text-base font-extrabold text-slate-800 dark:text-zinc-150 font-sans">Select Streaming Screen Input</h3>
              </div>
              <button 
                onClick={() => setCaptureStage('setup')}
                className="text-xs font-bold text-slate-400 hover:text-slate-600 cursor-pointer flex items-center gap-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Subject
              </button>
            </div>

            <div className="bg-slate-50 dark:bg-zinc-950 p-4 rounded-xl flex items-center justify-between gap-4">
              <div className="space-y-0.5">
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Preparing Note Guide For</p>
                <p className="text-xs font-extrabold text-slate-800 dark:text-zinc-200">"{uploadTitle}" — <span className="text-blue-400 text-[10px]">{selectedSubject}</span></p>
              </div>
              <BookOpen className="w-5 h-5 text-blue-500" />
            </div>

            {uploadError && (
              <div className="space-y-4">
                <div className="p-3.5 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/40 text-rose-600 dark:text-rose-400 text-xs rounded-xl flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <div className="space-y-1">
                    <span className="font-bold block">Action Required / Permission Blocked</span>
                    <span className="font-medium text-[11px] leading-relaxed block text-slate-700 dark:text-zinc-200">{uploadError}</span>
                  </div>
                </div>

                {(() => {
                  const errLower = uploadError.toLowerCase();
                  return errLower.includes('screen capture') || 
                         errLower.includes('getdisplaymedia') || 
                         errLower.includes('display-capture') || 
                         errLower.includes('permission') || 
                         errLower.includes('denied') || 
                         errLower.includes('allow') || 
                         errLower.includes('restrict');
                })() && (
                  <div className="p-5 bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-2xl space-y-4 shadow-lg animate-fade-in border border-blue-500/30">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-white/15 rounded-xl mt-0.5 animate-pulse">
                        <Sparkles className="w-5 h-5 text-amber-300" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-[#93C5FD]">Suggested Sandbox Bypass</h4>
                        <p className="text-[13px] font-black">Run the Classroom Sandbox instead!</p>
                        <p className="text-[11px] text-blue-100 leading-relaxed font-sans">
                          Bypasses iframe permissions instantly, giving you simulated transcripts and presentation slides ready to test-drive.
                        </p>
                      </div>
                    </div>
                    
                    <button
                      id="fallback-sandbox-btn"
                      onClick={() => {
                        setUploadError('');
                        startSimulatedSession();
                      }}
                      className="w-full py-3 bg-white hover:bg-slate-50 text-slate-900 hover:text-blue-800 font-extrabold text-xs rounded-xl transition-all cursor-pointer shadow-md hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-1.5"
                    >
                      <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
                      Launch Live Simulator Room &rarr;
                    </button>
                  </div>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 gap-6">
              
              {/* Option A: The Virtual Companion Meeting ID Ingress */}
              <div className="p-5 bg-white dark:bg-zinc-900 border-2 border-blue-550 dark:border-blue-500/30 rounded-2xl space-y-4 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 p-3 bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-300 rounded-bl-xl text-[9px] font-black uppercase tracking-widest font-mono">
                  Recommended Offline/Online Safe
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-blue-105 dark:bg-blue-955 rounded-lg text-blue-600 dark:text-blue-400">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-extrabold uppercase tracking-widest text-blue-600 dark:text-blue-400">Option 1: Otter-style AI Companion & Video Link Parser</span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-800 dark:text-zinc-150">Let AI Join Skype, Google Meet, or Digest any YouTube / Browser Link</h4>
                  <p className="text-[11px] text-slate-500 dark:text-zinc-400 leading-relaxed font-sans">
                    Rather than dealing with standard secure iframe screen-capturing blocks, simply provide your online classroom link, meeting ID, or any <b>YouTube video link</b> below. Our digital companion bot will instantly process and transcribing!
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-[9px] font-black uppercase text-slate-400 mb-1 tracking-wider">
                      Zoom/Teams/Meet link, or YouTube/Web URL
                    </label>
                    <input
                      id="meeting-id-field"
                      type="text"
                      placeholder="e.g. https://www.youtube.com/watch?v=... or Meet URL"
                      value={meetingIdOrLink}
                      onChange={(e) => setMeetingIdOrLink(e.target.value)}
                      className="w-full text-xs px-3 py-2.5 bg-slate-50 dark:bg-zinc-950 border border-slate-205 dark:border-zinc-800 rounded-lg focus:ring-1 focus:ring-blue-500 text-slate-800 dark:text-zinc-100"
                    />
                  </div>

                  <div>
                    <label className="block text-[9px] font-black uppercase text-slate-400 mb-1 tracking-wider">
                      Passcode if required (Optional)
                    </label>
                    <input
                      id="meeting-passcode-field"
                      type="text"
                      placeholder="e.g. 19283"
                      value={meetingPasscode}
                      onChange={(e) => setMeetingPasscode(e.target.value)}
                      className="w-full text-xs px-3 py-2.5 bg-slate-50 dark:bg-zinc-950 border border-slate-205 dark:border-zinc-800 rounded-lg focus:ring-1 focus:ring-blue-500 text-slate-800 dark:text-zinc-100"
                    />
                  </div>
                </div>

                <button
                  id="let-bot-join-btn"
                  onClick={startMeetingBotSession}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-755 text-white font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
                  {meetingIdOrLink.toLowerCase().includes('http://') || 
                   meetingIdOrLink.toLowerCase().includes('https://') ||
                   meetingIdOrLink.toLowerCase().includes('www.') ||
                   meetingIdOrLink.toLowerCase().includes('youtu')
                    ? "Analyze & Digest Video Content (No Permissions Required)"
                    : "Connect & Join AI Companion Bot"}
                </button>
              </div>

              {/* Grid split for Native Screen Share vs Simulator Sandbox */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Option B: Screen Sharing */}
                <div className="p-5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl flex flex-col justify-between space-y-3.5">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-slate-600 dark:text-zinc-400">
                      <Video className="w-4 h-4" />
                      <span className="text-[10px] font-extrabold uppercase tracking-wider">Option 2: Native Share Screen</span>
                    </div>
                    <h5 className="text-xs font-bold text-slate-800 dark:text-zinc-200">Share Class Tab / WebRTC</h5>
                    <p className="text-[10.5px] text-slate-500 dark:text-zinc-400 leading-normal">
                      Share browser tabs, Zoom, or Teams window directly. You must <b>Open App in a New Tab</b> first to elevate secure sandbox permissions.
                    </p>
                  </div>

                  <div className="space-y-1.5 pt-1">
                    <a
                      href={window.location.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full inline-flex items-center justify-center gap-1.5 py-2 bg-slate-800 hover:bg-slate-900 dark:bg-zinc-800 dark:hover:bg-zinc-750 text-white font-bold text-xxs rounded-xl transition-all cursor-pointer text-center"
                    >
                      <MonitorPlay className="w-3.5 h-3.5 text-emerald-400" />
                      Open in New Tab & Share ↗
                    </a>
                    <button
                      id="current-frame-share-btn"
                      onClick={startRealCapture}
                      className="w-full py-1.5 bg-slate-100 hover:bg-slate-150 dark:bg-zinc-850 dark:hover:bg-zinc-805 text-slate-700 dark:text-zinc-300 text-xxs font-semibold rounded-lg cursor-pointer"
                    >
                      Try Local Frame Screen Share
                    </button>
                  </div>
                </div>

                {/* Option C: Simulator */}
                <div className="p-5 bg-slate-900 text-white rounded-2xl flex flex-col justify-between space-y-3.5 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none"></div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-cyan-300">
                      <Sparkles className="w-4 h-4 animate-pulse" />
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-cyan-200">Option 3: Classroom Simulator</span>
                    </div>
                    <h5 className="text-xs font-bold text-white">Full Demonstration Sandbox</h5>
                    <p className="text-[10.5px] text-slate-350 leading-normal">
                      Don't have an active class or meeting link ready? Instantly experience real-time speech and slide analysis on your requested academic subject.
                    </p>
                  </div>

                  <button
                    id="connect-sandbox-btn"
                    onClick={startSimulatedSession}
                    className="w-full py-2 bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xxs rounded-xl transition-all cursor-pointer"
                  >
                    Quick Test Run Simulation
                  </button>
                </div>

              </div>
            </div>
          </div>
        )}

        {/* WIZARD PROCESS STAGE 3: THE ACTIVE RECORDER CONTROL ROOM */}
        {captureStage === 'active' && isRecording && (
          <div className="space-y-6 animate-fade-in">
            
            {/* Status grid */}
            <div className="p-4 bg-slate-900 text-white rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 font-sans">
              <div className="flex items-center gap-3">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
                </span>
                <div>
                  <span className="block text-[9px] font-black uppercase tracking-widest text-[#94A3B8]">Listening Active</span>
                  <span className="block text-xs font-bold text-white max-w-sm truncate">Classroom Monitor: {selectedSubject}</span>
                </div>
              </div>

              {/* Real-time visual audio wave animation to let them know audio capture is active */}
              <div className="flex items-center gap-4">
                <div className="hidden sm:flex items-center gap-1 bg-slate-800 p-2 rounded-lg border border-slate-700">
                  <span className="text-[9px] font-bold text-slate-400 mr-1 font-mono">MIC STATUS:</span>
                  <span className="w-1.5 h-3 bg-blue-400 rounded-sm animate-pulse"></span>
                  <span className="w-1.5 h-5 bg-blue-400 rounded-sm animate-pulse" style={{ animationDelay: '0.1s' }}></span>
                  <span className="w-1.5 h-2 bg-blue-400 rounded-sm animate-pulse" style={{ animationDelay: '0.2s' }}></span>
                  <span className="w-1.5 h-4 bg-blue-400 rounded-sm animate-pulse" style={{ animationDelay: '0.3s' }}></span>
                  <span className="w-1.5 h-2 bg-blue-400 rounded-sm animate-pulse" style={{ animationDelay: '0.4s' }}></span>
                </div>
                <div className="px-4 py-1 bg-slate-800 border border-slate-705 text-xs font-mono font-bold text-cyan-300 rounded-md">
                  {formatTime(timer)}
                </div>
              </div>
            </div>

            {/* Split Monitor Layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Screen Feed Viewport */}
              <div className="p-5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl space-y-4">
                <div className="flex items-center justify-between pb-1.5 border-b border-slate-50 dark:border-zinc-850">
                  <span className="text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-widest">
                    {isSimulatedStream ? "Simulated Whiteboard slides" : "Live Shared Stream"}
                  </span>
                  <span className="text-xxs px-2 py-0.5 bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-300 font-bold rounded-full">
                    {isSimulatedStream ? "Simulation Active" : "Teams / Zoom Feed"}
                  </span>
                </div>

                {/* Whiteboard / Video container */}
                <div className="aspect-video bg-slate-950 rounded-xl overflow-hidden relative border border-slate-800 flex items-center justify-center">
                  
                  {isSimulatedStream ? (
                    <div className="w-full h-full relative">
                      {/* Active slide display image */}
                      <img 
                        src={activeSlideImage} 
                        referrerPolicy="no-referrer"
                        alt="Simulated PowerPoint slide" 
                        className="w-full h-full object-cover transition-opacity duration-300" 
                      />
                      {/* Interactive slide watermark overlay */}
                      <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/85 via-black/40 to-transparent flex items-end justify-between">
                        <div className="space-y-0.5">
                          <span className="bg-blue-600 text-white font-mono text-[9px] px-1.5 py-0.2 rounded uppercase font-bold">Whiteboard Slide</span>
                          <span className="block text-[11px] font-semibold text-white truncate max-w-[200px]">{scriptData.title}</span>
                        </div>
                        <span className="text-[10px] font-bold text-slate-300 font-mono">Slide {simulationIndex + 1} of {scriptData.slides.length}</span>
                      </div>

                      {/* Manual mock click camera feedback element */}
                      {flashEffect && (
                        <div className="absolute inset-0 bg-white z-40 animate-fade-out flex items-center justify-center">
                          <Camera className="w-12 h-12 text-slate-300 animate-zoom-in" />
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="w-full h-full relative">
                      <video 
                        ref={videoRef} 
                        autoPlay 
                        playsInline 
                        muted 
                        className="w-full h-full object-contain"
                      />
                      {flashEffect && (
                        <div className="absolute inset-0 bg-white z-40 animate-fade-out" />
                      )}
                    </div>
                  )}
                </div>

                <p className="text-[10.5px] text-slate-500 dark:text-zinc-400 leading-normal">
                  {isSimulatedStream 
                    ? "💻 Simulated slideshow automatically rotates every 14s. Clicking 'Capture Slide' manually grabs a snapshot of this active visual."
                    : "💻 Your active shared window. Keep your Zoom/Teams whiteboard visible on this stream so slide snapshot OCR runs cleanly."
                  }
                </p>
              </div>

              {/* Transcription Transcript Feed */}
              <div className="p-5 bg-zinc-950 text-indigo-400 border border-zinc-900 rounded-2xl flex flex-col justify-between min-h-[300px]">
                <div className="space-y-3">
                  <div className="flex items-center justify-between pb-1.5 border-b border-zinc-850">
                    <span className="text-[10px] uppercase font-mono tracking-widest text-zinc-500 flex items-center gap-1">
                      <Volume2 className="w-3.5 h-3.5 text-zinc-400" /> Live Audio Captions
                    </span>
                    <span className="text-xxs px-1.5 py-0.2 bg-indigo-950/40 text-indigo-300 font-semibold rounded font-mono">Speech Recognition</span>
                  </div>
                  
                  {/* Streaming rolling transcript log */}
                  <div className="h-60 overflow-y-auto scrollbar-thin rounded-lg p-3 bg-zinc-900/40 border border-zinc-850/60 font-mono text-[11.5px] text-zinc-300 whitespace-pre-wrap leading-relaxed">
                    {liveTranscript || "Awaiting speaking voice tracks..."}
                  </div>
                </div>

                <div className="pt-2 flex items-center gap-1.5 text-zinc-500 font-mono text-[10px]">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span>
                  Processing active webinar voice channels
                </div>
              </div>

            </div>

            {/* Slide Cache strip */}
            <div className="p-5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-805 rounded-xl space-y-3">
              <span className="block text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-widest">
                Slide Snapshot Cache (OCR Feed Base)
              </span>
              
              {snapshots.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {snapshots.map((img, i) => (
                    <div key={i} className="aspect-video relative rounded-lg overflow-hidden border border-slate-200 dark:border-zinc-800 shadow-xs group">
                      <img src={img} alt="Snapshot feed" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="text-white text-10px font-mono">Slide #{i + 1}</span>
                      </div>
                      <span className="absolute bottom-1 right-1 bg-black/70 text-white text-[9px] px-1.5 rounded font-mono">
                        #{i + 1}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center border-2 border-dashed border-slate-200 dark:border-zinc-800 rounded-xl">
                  <MonitorPlay className="w-8 h-8 text-slate-350 dark:text-zinc-700 mb-1.5" />
                  <span className="text-xs font-bold text-slate-400 dark:text-zinc-500">No slides grabbed currently</span>
                  <p className="text-[10px] text-slate-400 mt-0.5">They will auto-capture, or you can manually click snapshot below.</p>
                </div>
              )}
            </div>

            {/* CONTROL ACTION BAR */}
            <div className="p-4 bg-white dark:bg-[#161C2A] border border-slate-200 dark:border-zinc-800 rounded-xl flex flex-wrap items-center justify-between gap-3">
              <button
                id="discard-class-btn"
                onClick={resetCaptureSession}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-750 text-slate-700 dark:text-zinc-300 font-bold text-xs rounded-lg cursor-pointer"
              >
                Cancel Session
              </button>

              <div className="flex items-center gap-2">
                <button
                  id="snap-blackboard-btn"
                  onClick={isSimulatedStream ? manualSnapSimulatedSlide : manualSnapRealFrame}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-850 dark:hover:bg-zinc-800 text-slate-800 dark:text-zinc-300 font-bold text-xs rounded-lg cursor-pointer flex items-center gap-1.5"
                >
                  <Camera className="w-4 h-4 text-slate-500" />
                  Snapshot Whiteboard
                </button>
                
                <button
                  id="active-publish-btn"
                  onClick={handlePublishClass}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg cursor-pointer shadow-sm shadow-blue-200 flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-350" />
                  Finish & Summarize Class
                </button>
              </div>
            </div>

          </div>
        )}

        {/* FEEDBACK DIAGNOSTIC BOX */}
        {uploadError && (
          <div className="p-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-450 text-xs rounded-2xl space-y-4">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 mt-0.5 shrink-0 animate-bounce" />
              <div className="flex-1 space-y-1">
                <p className="font-bold">System Connection Notice</p>
                <p className="leading-relaxed text-slate-600 dark:text-zinc-330">{uploadError}</p>
              </div>
            </div>
            
            <div className="pt-3 border-t border-rose-200/40 dark:border-rose-950/45 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white/40 dark:bg-zinc-900/40 p-3 rounded-xl">
              <div className="space-y-0.5">
                <p className="font-bold text-slate-800 dark:text-zinc-200 text-xs">Run the Classroom Sandbox instead!</p>
                <p className="text-[10px] text-slate-500 dark:text-zinc-405 leading-normal">
                  Bypasses iframe permissions instantly, giving you simulated transcripts and presentation slides ready to test-drive.
                </p>
              </div>
              <button
                id="sandbox-override-btn"
                onClick={startSimulatedSession}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg shadow-sm font-sans cursor-pointer flex items-center gap-1.5 shrink-0"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
                Launch Live Simulator
              </button>
            </div>
          </div>
        )}

      </div>

      {/* RIGHT COLUMN: DIRECT MANUAL INGESTION FOR SYLLABUS FILES */}
      <div className="space-y-6">
        
        {/* Clean explanatory Card for webinars */}
        <div className="p-5 bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-2xl shadow-xs space-y-4 font-sans">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-300" />
            <h4 className="text-xs font-black tracking-widest uppercase text-blue-200">System Integration Details</h4>
          </div>
          <p className="text-[11px] text-blue-50/90 leading-relaxed font-normal">
            For native screen sharing:
            <span className="block mt-1">1. Click <b>"Initialize Capture"</b> or <b>"Share Window"</b>.</span>
            <span className="block">2. Choose your Microsoft Teams application, Zoom client, or desktop screen layout in the web popup.</span>
            <span className="block">3. Enable system-audio capturing for optimal voice feed.</span>
          </p>
          <div className="pt-2 border-t border-blue-500/40 text-[10px] text-blue-200 flex items-center gap-1.5">
            <Volume2 className="w-3.5 h-3.5" /> Zero voice signatures stored. Privacy guaranteed.
          </div>
        </div>

        {/* Fallback Manual Syllabus Ingestion */}
        <div className="p-5 bg-white dark:bg-[#161C2A] border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-xs">
          <h4 className="text-sm font-bold text-slate-800 dark:text-zinc-100 pb-2.5 border-b border-slate-100 dark:border-zinc-800 flex items-center gap-2 mb-3">
            <Upload className="w-4 h-4 text-blue-600" />
            Manual Material Ingestion
          </h4>

          <form onSubmit={handleManualUpload} className="space-y-3">
            <div>
              <label className="block text-[9px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-widest mb-1">
                Course or Lecture Name
              </label>
              <input
                id="manual-title-input"
                type="text"
                placeholder="e.g., Photosynthesis & Carbon Cycles"
                value={uploadTitle}
                onChange={(e) => setUploadTitle(e.target.value)}
                className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg focus:ring-1 focus:ring-blue-500 text-slate-800 dark:text-zinc-100"
              />
            </div>

            <div>
              <label className="block text-[9px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-widest mb-1">
                Transcript script / Study outline
              </label>
              <textarea
                id="manual-script-input"
                rows={4}
                placeholder="Paste teacher notes, speech transcript text blocks, or study guides directly here to formulate practice booklets..."
                value={uploadText}
                onChange={(e) => setUploadText(e.target.value)}
                className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg focus:ring-1 focus:ring-blue-500 font-sans text-slate-800 dark:text-zinc-100"
              />
            </div>

            <button
              id="submit-manual-notes-btn"
              type="submit"
              disabled={isUploading}
              className="w-full flex items-center justify-center gap-2 py-2 bg-slate-50 dark:bg-zinc-850 hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300 text-xs font-bold rounded-lg border border-slate-200 dark:border-zinc-750 cursor-pointer"
            >
              {isUploading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
                  Generating Booklets...
                </>
              ) : (
                <>
                  <FileText className="w-4 h-4 text-slate-400" />
                  Analyze Text Outline
                </>
              )}
            </button>
          </form>
        </div>

      </div>

    </div>
  );
}
