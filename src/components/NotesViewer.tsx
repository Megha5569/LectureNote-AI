import React, { useState } from 'react';
import { jsPDF } from 'jspdf';
import { 
  Download, FileText, CheckSquare, Award, BookOpen, Layers, Info, 
  HelpCircle, Sparkles, Code, CheckCircle, Clock, Calendar, 
  FileCheck, HelpCircle as QiIcon, HelpCircle as VivaIcon, ArrowRight
} from 'lucide-react';
import { Lecture, Flashcard, MCQ } from '../types';

interface NotesViewerProps {
  lecture: Lecture;
  onUpdateLecture: (updated: Lecture) => void;
}

export default function NotesViewer({ lecture, onUpdateLecture }: NotesViewerProps) {
  const [activeTab, setActiveTab] = useState<'notes' | 'summary' | 'quiz' | 'flashcards'>('notes');
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  
  // MCQ state
  const [selectedAnswers, setSelectedAnswers] = useState<{ [key: number]: number }>({});
  const [submittedMCQs, setSubmittedMCQs] = useState<{ [key: number]: boolean }>({});
  const [shortAnswersCollapsed, setShortAnswersCollapsed] = useState<{ [key: number]: boolean }>({});
  const [actionItemCompletion, setActionItemCompletion] = useState<{ [key: number]: boolean }>({});

  const { notes, summary, quiz, flashcards } = lecture;

  if (!notes || !summary || !quiz) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-sm">
        <Sparkles className="w-12 h-12 text-indigo-500 mb-4 animate-pulse" />
        <h3 className="text-xl font-medium text-zinc-900 dark:text-zinc-100">Generating Study Experience</h3>
        <p className="text-zinc-500 dark:text-zinc-400 max-w-md mt-2">
          Your lecture content is currently being analyzed by the Gemini AI agent. Hang tight, this will only take a moment!
        </p>
      </div>
    );
  }

  // Handle PDF Export
  const exportToPDF = (section: 'all' | 'notes' | 'summary' | 'quiz' | 'flashcards') => {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    let yPosition = 20;
    const pageHeight = 297;
    const margin = 15;
    const contentWidth = 210 - (margin * 2);

    const checkPageBreak = (neededHeight: number) => {
      if (yPosition + neededHeight > pageHeight - margin) {
        doc.addPage();
        yPosition = 20;
      }
    };

    const addTitle = (text: string) => {
      checkPageBreak(15);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.setTextColor(55, 48, 163); // Indigo-900
      doc.text(text, margin, yPosition);
      yPosition += 8;
    };

    const addSubtitle = (text: string) => {
      checkPageBreak(12);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(31, 41, 55); // Gray-805
      doc.text(text, margin, yPosition);
      yPosition += 6;
    };

    const addBodyText = (text: string) => {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(75, 85, 99); // Gray-600
      const splitText = doc.splitTextToSize(text, contentWidth);
      const linesHeight = splitText.length * 5;
      checkPageBreak(linesHeight + 5);
      doc.text(splitText, margin, yPosition);
      yPosition += linesHeight + 4;
    };

    // Header Metadata
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.setTextColor(30, 27, 75); // Dark Purple/indigo
    doc.text(lecture.title, margin, yPosition);
    yPosition += 8;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(156, 163, 175); // Gray-400
    const metaText = lecture.semester 
      ? `Subject: ${lecture.subject}  |  Semester: ${lecture.semester}  |  Date: ${new Date(lecture.date).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}`
      : `Subject: ${lecture.subject}  |  Date: ${new Date(lecture.date).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}`;
    doc.text(metaText, margin, yPosition);
    yPosition += 12;

    doc.setDrawColor(229, 231, 235); // Divider
    doc.line(margin, yPosition, 210 - margin, yPosition);
    yPosition += 10;

    // notes sections export
    if (section === 'all' || section === 'notes') {
      addTitle('Lecture Overview & Detailed Notes');
      
      addSubtitle('Primary Topics Covered:');
      addBodyText(notes.topics.join(', '));

      addSubtitle('Detailed Analysis:');
      addBodyText(notes.detailedExpl);

      if (notes.keyPoints && notes.keyPoints.length > 0) {
        addSubtitle('Core Lecture Key Points:');
        notes.keyPoints.forEach((point, i) => {
          addBodyText(`${i + 1}. ${point}`);
        });
      }

      if (notes.definitions && notes.definitions.length > 0) {
        addSubtitle('Important Terminology & Definitions:');
        notes.definitions.forEach((def) => {
          checkPageBreak(15);
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(10);
          doc.setTextColor(17, 24, 39);
          doc.text(`* ${def.term}:`, margin, yPosition);
          yPosition += 4;
          addBodyText(def.definition);
        });
      }

      if (notes.formulas && notes.formulas.length > 0) {
        addSubtitle('Formulas & Mathematical Equations:');
        notes.formulas.forEach((form) => {
          checkPageBreak(25);
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(10);
          doc.setTextColor(17, 24, 39);
          doc.text(`${form.name}:`, margin, yPosition);
          yPosition += 4;
          doc.setFont('courier', 'bold');
          doc.setFontSize(12);
          doc.setTextColor(220, 38, 38); // Red equation
          doc.text(`   ${form.equation}`, margin, yPosition);
          yPosition += 6;
          if (form.context) {
            doc.setFont('helvetica', 'italic');
            doc.setFontSize(9);
            doc.setTextColor(107, 114, 128);
            doc.text(`   Context: ${form.context}`, margin, yPosition);
            yPosition += 5;
          }
          yPosition += 2;
        });
      }

      if (notes.codeSnippets && notes.codeSnippets.length > 0) {
        addSubtitle('Algorithms & Programming Code Snippets:');
        notes.codeSnippets.forEach((snippet) => {
          checkPageBreak(40);
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(10);
          doc.setTextColor(17, 24, 39);
          doc.text(`[${snippet.language.toUpperCase()}] ${snippet.title}:`, margin, yPosition);
          yPosition += 4;
          
          doc.setFont('courier', 'normal');
          doc.setFontSize(8.5);
          doc.setTextColor(31, 41, 55);
          const lines = snippet.code.split('\n');
          lines.forEach(codeLine => {
            checkPageBreak(4);
            doc.text(codeLine, margin + 4, yPosition);
            yPosition += 4;
          });
          yPosition += 4;
        });
      }

      if (notes.actionItems && notes.actionItems.length > 0) {
        addSubtitle('Upcoming Tasks & Deadlines (Action Items):');
        notes.actionItems.forEach((action) => {
          let textLine = `[ ] ${action.task}`;
          if (action.deadline) {
            textLine += ` (Deadline: ${action.deadline})`;
          }
          addBodyText(textLine);
        });
      }
    }

    if (section === 'all' || section === 'summary') {
      if (section === 'all') doc.addPage() && (yPosition = 20);
      addTitle('AI Summary & Rapid Review Sheet');
      
      addSubtitle('Executive Summary:');
      addBodyText(summary.executive);

      addSubtitle('Thorough Lecture Summary:');
      addBodyText(summary.detailed);

      addSubtitle('Cheat Sheet Revision Outline:');
      addBodyText(summary.revision);

      addSubtitle('One-Page Visual Review:');
      addBodyText(summary.onePageReview);
    }

    if (section === 'all' || section === 'quiz') {
      if (section === 'all') doc.addPage() && (yPosition = 20);
      addTitle('Lecture Quiz & Practice Examination');

      if (quiz.mcqs && quiz.mcqs.length > 0) {
        addSubtitle('Multiple Choice Questions (MCQs):');
        quiz.mcqs.forEach((mcq, idx) => {
          checkPageBreak(40);
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(10);
          doc.setTextColor(17, 24, 39);
          doc.text(`Q${idx + 1}: ${mcq.question}`, margin, yPosition);
          yPosition += 6;

          mcq.options.forEach((opt, optIdx) => {
            const letter = String.fromCharCode(65 + optIdx);
            const isCorrect = optIdx === mcq.answerIndex ? ' (CORRECT)' : '';
            doc.setFont('helvetica', 'normal');
            doc.text(`   [${letter}] ${opt}${isCorrect}`, margin, yPosition);
            yPosition += 5;
          });
          
          // explanation
          doc.setFont('helvetica', 'italic');
          doc.setFontSize(9);
          doc.setTextColor(79, 70, 229);
          doc.text(`   Rationale: ${mcq.explanation}`, margin, yPosition);
          yPosition += 8;
        });
      }

      if (quiz.shortAnswers && quiz.shortAnswers.length > 0) {
        addSubtitle('Conceptual Short Answer Challenges:');
        quiz.shortAnswers.forEach((sa, idx) => {
          checkPageBreak(20);
          doc.setFont('helvetica', 'bold');
          doc.text(`Q: ${sa.question}`, margin, yPosition);
          yPosition += 5;
          addBodyText(`A: ${sa.answer}`);
          yPosition += 2;
        });
      }

      if (quiz.interviews && quiz.interviews.length > 0) {
        addSubtitle('Job & Internship Interview Challenges:');
        quiz.interviews.forEach((ic, idx) => {
          checkPageBreak(20);
          doc.setFont('helvetica', 'bold');
          doc.text(`Prompt: ${ic.question}`, margin, yPosition);
          yPosition += 5;
          addBodyText(`Suggested Response: ${ic.idealResponse}`);
          yPosition += 2;
        });
      }
    }

    if (section === 'all' || section === 'flashcards') {
      if (section === 'all') doc.addPage() && (yPosition = 20);
      addTitle('Quick Recall Study Flashcards');
      
      if (flashcards && flashcards.length > 0) {
        flashcards.forEach((card, idx) => {
          checkPageBreak(30);
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(10);
          doc.setTextColor(30, 41, 59);
          doc.text(`Flashcard #${idx + 1}`, margin, yPosition);
          yPosition += 4;
          doc.setFont('helvetica', 'bold');
          doc.text(`Q: ${card.question}`, margin + 5, yPosition);
          yPosition += 5;
          doc.setFont('helvetica', 'normal');
          doc.text(`A: ${card.answer}`, margin + 5, yPosition);
          yPosition += 8;
        });
      }
    }

    doc.save(`LectureNote_AI_${lecture.title.replace(/\s+/g, '_')}_${section}.pdf`);
  };

  const handleMCQSelect = (idx: number, optIdx: number) => {
    if (submittedMCQs[idx]) return;
    setSelectedAnswers(prev => ({ ...prev, [idx]: optIdx }));
  };

  const submitMCQ = (idx: number) => {
    if (selectedAnswers[idx] === undefined) return;
    setSubmittedMCQs(prev => ({ ...prev, [idx]: true }));
  };

  const toggleSa = (idx: number) => {
    setShortAnswersCollapsed(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  const toggleActionItem = (idx: number) => {
    const nextState = !actionItemCompletion[idx];
    setActionItemCompletion(prev => ({ ...prev, [idx]: nextState }));
    
    // Update progress bar status if they check things off
    const totalActions = notes.actionItems.length;
    const completedCount = Object.values({ ...actionItemCompletion, [idx]: nextState }).filter(Boolean).length;
    const completedRatio = totalActions ? Math.round((completedCount / totalActions) * 100) : 100;
    
    onUpdateLecture({
      ...lecture,
      progress: Math.max(lecture.progress, completedRatio)
    });
  };

  return (
    <div id="notes-viewer-root" className="w-full space-y-6">
      
      {/* Top Banner with Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between p-6 bg-slate-50 dark:bg-[#161C2A] border border-slate-200 dark:border-zinc-805 rounded-xl gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-3 py-1 bg-blue-50 dark:bg-blue-955/30 text-blue-600 dark:text-blue-400 text-xs font-semibold rounded-lg uppercase tracking-wider">
              {lecture.subject}
            </span>
            {lecture.semester && (
              <span className="px-3 py-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 text-xs font-medium rounded-lg">
                {lecture.semester}
              </span>
            )}
          </div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-zinc-100 tracking-tight">{lecture.title}</h2>
          <div className="flex items-center gap-4 mt-2 text-sm text-slate-500 dark:text-zinc-400">
            <span className="flex items-center gap-1">
              <Calendar className="w-4 h-4 text-slate-400" />
              {new Date(lecture.date).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4 text-slate-400" />
              Study Progress: {lecture.progress}%
            </span>
          </div>
        </div>

        {/* PDF Export Dropdown */}
        <div className="flex flex-wrap items-center gap-2">
          <button 
            id="export-brief-btn"
            onClick={() => exportToPDF('notes')}
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-zinc-800 border border-slate-205 dark:border-zinc-700 hover:border-blue-450 hover:bg-slate-50 text-slate-700 dark:text-zinc-300 text-xs font-semibold rounded-lg transition-all shadow-xs cursor-pointer"
          >
            <Download className="w-4 h-4" />
            Download Notes PDF
          </button>
          <button 
            id="export-full-btn"
            onClick={() => exportToPDF('all')}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-all shadow-sm shadow-blue-100 cursor-pointer"
          >
            <FileCheck className="w-4 h-4" />
            Export Complete Package (PDF)
          </button>
        </div>
      </div>

      {/* Success Download Highlight Banner */}
      <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-emerald-850 dark:text-emerald-400">
        <div className="flex items-start gap-2.5">
          <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-450 mt-0.5 shrink-0" />
          <div>
            <p className="font-bold text-sm text-emerald-900 dark:text-emerald-300">Class Analysis Report Complete!</p>
            <p className="text-xs text-slate-600 dark:text-zinc-400 leading-normal mt-0.5">
              {lecture.slides && lecture.slides.length > 0
                ? "The companion successfully transcribed the audio feed, processed whiteboard slides, and prepared clean notes, mock exams, and digital flashcards."
                : "The companion successfully digested the video context, parsed semantic subtitles, and prepared clean notes, mock exams, and digital flashcards."}
            </p>
          </div>
        </div>
        <button
          onClick={() => exportToPDF('all')}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg cursor-pointer shrink-0 transition-all shadow-xs"
        >
          <Download className="w-3.5 h-3.5" />
          Download Complete Notes PDF
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 dark:border-zinc-800 overflow-x-auto pb-px">
        <button
          id="tab-notes"
          onClick={() => setActiveTab('notes')}
          className={`flex items-center gap-2 px-5 py-3 border-b-2 font-semibold text-sm transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'notes'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-zinc-200'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          Study Notes
          <span className="px-1.5 py-0.5 bg-blue-50 dark:bg-blue-955/35 text-blue-600 dark:text-blue-400 text-[10px] font-bold rounded uppercase">
            Rich
          </span>
        </button>

        <button
          id="tab-summary"
          onClick={() => setActiveTab('summary')}
          className={`flex items-center gap-2 px-5 py-3 border-b-2 font-semibold text-sm transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'summary'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-zinc-200'
          }`}
        >
          <Layers className="w-4 h-4" />
          AI Review Summary
        </button>

        <button
          id="tab-quiz"
          onClick={() => setActiveTab('quiz')}
          className={`flex items-center gap-2 px-5 py-3 border-b-2 font-semibold text-sm transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'quiz'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-zinc-200'
          }`}
        >
          <CheckSquare className="w-4 h-4" />
          Practice Quiz
          {quiz.mcqs.length > 0 && (
            <span className="px-1.5 py-0.2 bg-emerald-50 dark:bg-emerald-955 text-emerald-700 dark:text-emerald-400 text-xxs font-bold rounded-full">
              {quiz.mcqs.length}
            </span>
          )}
        </button>

        <button
          id="tab-flashcards"
          onClick={() => setActiveTab('flashcards')}
          className={`flex items-center gap-2 px-5 py-3 border-b-2 font-semibold text-sm transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'flashcards'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-zinc-200'
          }`}
        >
          <Award className="w-4 h-4" />
          Flashcards
          {flashcards && flashcards.length > 0 && (
            <span className="px-1.5 py-0.2 bg-[#EFF6FF] dark:bg-blue-955 text-blue-600 dark:text-blue-405 text-xxs font-bold rounded-full">
              {flashcards.length}
            </span>
          )}
        </button>
      </div>

      {/* Tab Panels */}
      <div className="py-2">
        {/* 1. STUDY NOTES PANEL */}
        {activeTab === 'notes' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Primary Left Body: Notes Content */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Detailed Explanation */}
              <div className="p-6 md:p-8 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-xs space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-zinc-100 dark:border-zinc-800">
                  <FileText className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Lecturer Analysis Explanations</h3>
                </div>
                <div className="prose prose-zinc dark:prose-invert max-w-none text-zinc-650 dark:text-zinc-350 leading-relaxed whitespace-pre-wrap">
                  {notes.detailedExpl}
                </div>
              </div>

              {/* Key Formulas Section */}
              {notes.formulas && notes.formulas.length > 0 && (
                <div className="p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-xs space-y-4">
                  <div className="flex items-center gap-2 pb-3 border-b border-zinc-100 dark:border-zinc-800">
                    <Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Formulas & Mathematical Equations</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {notes.formulas.map((form, idx) => (
                      <div key={idx} className="p-4 bg-linear-to-br from-indigo-50/50 to-purple-50/50 dark:from-indigo-950/20 dark:to-purple-950/10 border border-indigo-100/50 dark:border-indigo-950/40 rounded-2xl flex flex-col justify-between">
                        <div>
                          <h4 className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm mb-1">{form.name}</h4>
                          <div className="my-3 py-2 text-center bg-white dark:bg-zinc-950 border border-zinc-200/55 dark:border-zinc-850 rounded-lg">
                            <code className="font-mono text-base font-bold text-red-600 dark:text-red-400 select-all">
                              {form.equation}
                            </code>
                          </div>
                        </div>
                        {form.context && (
                          <p className="text-xs text-zinc-500 dark:text-zinc-400 italic">
                            Context: {form.context}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Code Snippets and Algorithms */}
              {notes.codeSnippets && notes.codeSnippets.length > 0 && (
                <div className="p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-xs space-y-4">
                  <div className="flex items-center gap-2 pb-3 border-b border-zinc-100 dark:border-zinc-800">
                    <Code className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Discovered Algorithms & Code Templates</h3>
                  </div>
                  <div className="space-y-6">
                    {notes.codeSnippets.map((snippet, idx) => (
                      <div key={idx} className="border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-2xs">
                        <div className="px-4 py-2 bg-zinc-50 dark:bg-zinc-850 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                          <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider font-mono">
                            {snippet.language}
                          </span>
                          <span className="text-xs font-medium text-zinc-505 dark:text-zinc-400 italic">
                            {snippet.title}
                          </span>
                        </div>
                        <pre className="p-4 bg-zinc-950 text-zinc-200 text-xs overflow-x-auto font-mono leading-relaxed select-all">
                          <code>{snippet.code}</code>
                        </pre>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Explanatory Walk-through Examples */}
              {notes.examples && notes.examples.length > 0 && (
                <div className="p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-xs space-y-4">
                  <div className="flex items-center gap-2 pb-3 border-b border-zinc-100 dark:border-zinc-800">
                    <Info className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Step-by-Step Practical Examples</h3>
                  </div>
                  <div className="grid grid-cols-1 gap-4">
                    {notes.examples.map((item, idx) => (
                      <div key={idx} className="p-5 bg-zinc-50 dark:bg-zinc-850/50 border border-zinc-200/60 dark:border-zinc-800 rounded-2xl">
                        <span className="px-2 py-0.5 bg-zinc-200 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-300 text-xxs font-black uppercase rounded-md">
                          {item.topic}
                        </span>
                        <h4 className="font-bold text-zinc-900 dark:text-zinc-100 mt-2 text-sm">{item.scenario}</h4>
                        <p className="text-zinc-650 dark:text-zinc-400 mt-2 text-xs leading-relaxed leading-relaxed whitespace-pre-wrap">
                          {item.explanation}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>

            {/* Sidebar Columns (Definitions, Action Items etc) */}
            <div className="space-y-6">
              
              {/* Important Action Items / Homework Task Sheet */}
              <div className="p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-xs space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-zinc-100 dark:border-zinc-800">
                  <CheckSquare className="w-5 h-5 text-indigo-650 dark:text-indigo-400" />
                  <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">Tasks & Deadlines</h3>
                </div>

                {notes.actionItems && notes.actionItems.length > 0 ? (
                  <div className="space-y-3">
                    {notes.actionItems.map((action, idx) => (
                      <div 
                        id={`action-item-${idx}`}
                        key={idx} 
                        className={`p-3 border rounded-xl flex items-start gap-2.5 transition-all cursor-pointer ${
                          actionItemCompletion[idx] 
                            ? 'bg-zinc-50/50 dark:bg-zinc-900/10 border-zinc-200/50 dark:border-zinc-800 pb-2 bg-gradient-to-r opacity-60' 
                            : 'bg-white dark:bg-zinc-900 border-zinc-150 dark:border-zinc-800 hover:border-indigo-200'
                        }`}
                        onClick={() => toggleActionItem(idx)}
                      >
                        <input
                          id={`chk-action-${idx}`}
                          type="checkbox"
                          checked={!!actionItemCompletion[idx]}
                          onChange={() => {}} // toggled by container div click
                          className="mt-0.5 rounded text-indigo-650 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                        />
                        <div className="flex-1">
                          <p className={`text-xs font-semibold text-zinc-800 dark:text-zinc-200 ${actionItemCompletion[idx] ? 'line-through text-zinc-400 dark:text-zinc-500' : ''}`}>
                            {action.task}
                          </p>
                          {action.deadline && (
                            <p className="text-xxs text-rose-500 dark:text-rose-400 font-medium mt-1 flex items-center gap-1">
                              <span className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-ping"></span>
                              Deadline: {action.deadline}
                            </p>
                          )}
                          {action.type && (
                            <span className="inline-block mt-1.5 px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 text-xxs font-semibold rounded uppercase tracking-wider">
                              {action.type}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-zinc-400 dark:text-zinc-500">
                    No active homework asssignments or deadlines identified by the AI.
                  </p>
                )}
              </div>

              {/* Glossary / Definitions */}
              {notes.definitions && notes.definitions.length > 0 && (
                <div className="p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-xs space-y-4">
                  <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 pb-1 border-b border-zinc-100 dark:border-zinc-800 flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-indigo-500" />
                    Lecture Glossary
                  </h3>
                  <div className="space-y-4 max-h-[350px] overflow-y-auto scrollbar-thin">
                    {notes.definitions.map((def, idx) => (
                      <div key={idx} className="space-y-1">
                        <h4 className="text-xs font-black text-indigo-650 dark:text-indigo-400 select-all tracking-tight font-serif">
                          {def.term}
                        </h4>
                        <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-normal">
                          {def.definition}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          </div>
        )}

        {/* 2. SUMMARY PANEL */}
        {activeTab === 'summary' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Executive Summary */}
              <div className="p-6 md:p-8 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-xs space-y-4">
                <span className="px-3 py-1 bg-indigo-55/60 dark:bg-indigo-950/45 text-indigo-700 dark:text-indigo-400 text-xxs font-extrabold uppercase rounded-full">
                  Executive Abstract
                </span>
                <p className="text-zinc-650 dark:text-zinc-350 text-sm leading-relaxed whitespace-pre-wrap">
                  {summary.executive}
                </p>
              </div>

              {/* One Page Quick Review */}
              <div className="p-6 md:p-8 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-xs space-y-4">
                <span className="px-3 py-1 bg-purple-55/60 dark:bg-purple-950/45 text-purple-700 dark:text-purple-400 text-xxs font-extrabold uppercase rounded-full">
                  One-Page Review Sheet
                </span>
                <p className="text-zinc-650 dark:text-zinc-350 text-sm leading-relaxed whitespace-pre-wrap font-mono text-xs p-4 bg-zinc-50 dark:bg-zinc-850 rounded-2xl">
                  {summary.onePageReview}
                </p>
              </div>

            </div>

            {/* Detailed study summary */}
            <div className="p-6 md:p-8 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-xs space-y-4">
              <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <Layers className="w-5 h-5 text-indigo-500" />
                Comprehensive Study Summary
              </h3>
              <p className="text-zinc-650 dark:text-zinc-350 text-sm leading-relaxed whitespace-pre-wrap">
                {summary.detailed}
              </p>
            </div>

            {/* Quick Revision Notes Cheat Sheet */}
            <div className="p-6 md:p-8 bg-zinc-900 dark:bg-zinc-950 text-zinc-100 border border-zinc-800 rounded-3xl shadow-xs space-y-4">
              <h3 className="text-lg font-extrabold text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-yellow-450" />
                Shorthand Revision Cheat Sheet
              </h3>
              <div className="text-zinc-300 text-sm whitespace-pre-wrap leading-relaxed font-sans">
                {summary.revision}
              </div>
            </div>
          </div>
        )}

        {/* 3. INTERACTIVE QUIZ PANEL */}
        {activeTab === 'quiz' && (
          <div className="space-y-8">
            
            {/* Multiple Choice Section */}
            {quiz.mcqs && quiz.mcqs.length > 0 && (
              <div className="space-y-6">
                <div className="p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-xs">
                  <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2 pb-3 border-b border-zinc-100 dark:border-zinc-800">
                    <Award className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    Multiple-Choice Practice Examination
                  </h3>
                  
                  <div className="space-y-8 mt-6">
                    {quiz.mcqs.map((mcq, idx) => {
                      const selectedOptIndex = selectedAnswers[idx];
                      const isSubmitted = submittedMCQs[idx];
                      const isCorrect = selectedOptIndex === mcq.answerIndex;

                      return (
                        <div id={`mcq-card-${idx}`} key={idx} className="p-5 border border-zinc-100 dark:border-zinc-800/80 rounded-2xl relative space-y-4">
                          <span className="px-2.5 py-0.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-350 text-xxs font-extrabold rounded">
                            Question {idx + 1}
                          </span>
                          <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mt-2 select-all">
                            {mcq.question}
                          </h4>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                            {mcq.options.map((opt, optIdx) => {
                              const isSelected = selectedOptIndex === optIdx;
                              const isThisCorrect = optIdx === mcq.answerIndex;
                              let btnClass = 'border-zinc-200 dark:border-zinc-800 hover:border-indigo-300';
                              
                              if (isSelected) {
                                if (isSubmitted) {
                                  btnClass = isCorrect 
                                    ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-500 text-emerald-800 dark:text-emerald-355'
                                    : 'bg-rose-50 dark:bg-rose-950/20 border-rose-505 text-rose-800 dark:text-rose-355';
                                } else {
                                  btnClass = 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-500 text-indigo-900 dark:text-indigo-300';
                                }
                              } else if (isSubmitted && isThisCorrect) {
                                // show correct option anyway when submitted
                                btnClass = 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-500 text-emerald-800 dark:text-emerald-355';
                              }

                              return (
                                <button
                                  id={`mcq-${idx}-opt-${optIdx}`}
                                  key={optIdx}
                                  onClick={() => handleMCQSelect(idx, optIdx)}
                                  className={`p-3.5 border text-left text-xs font-semibold rounded-xl transition-all cursor-pointer ${btnClass}`}
                                  disabled={isSubmitted}
                                >
                                  <span className="inline-block w-5 h-5 text-center leading-5 rounded-full bg-zinc-100 dark:bg-zinc-800 mr-2 text-xxs text-zinc-500 font-bold">
                                    {String.fromCharCode(65 + optIdx)}
                                  </span>
                                  {opt}
                                </button>
                              );
                            })}
                          </div>

                          <div className="flex items-center justify-between pt-1">
                            {selectedOptIndex !== undefined && !isSubmitted && (
                              <button
                                id={`mcq-submit-${idx}`}
                                onClick={() => submitMCQ(idx)}
                                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs rounded-lg shadow-2xs cursor-pointer transition-all"
                              >
                                Submit Answer
                              </button>
                            )}

                            {isSubmitted && (
                              <div className="flex items-center gap-2">
                                {isCorrect ? (
                                  <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 text-xs font-bold">
                                    <CheckCircle className="w-4 h-4" /> Correct Match
                                  </span>
                                ) : (
                                  <span className="flex items-center gap-1 text-rose-600 dark:text-rose-450 text-xs font-bold">
                                    Incomplete Recapitulation
                                  </span>
                                )}
                              </div>
                            )}
                          </div>

                          {isSubmitted && (
                            <div className="p-4 bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100/50 dark:border-indigo-950/30 rounded-xl mt-3 text-xs text-zinc-650 dark:text-zinc-350 leading-relaxed whitespace-pre-wrap">
                              <span className="font-extrabold text-indigo-700 dark:text-indigo-400 block mb-1">Study Guide Rationale:</span>
                              {mcq.explanation}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Short answers Section */}
            {quiz.shortAnswers && quiz.shortAnswers.length > 0 && (
              <div className="p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-xs space-y-4">
                <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2 pb-1 border-b border-zinc-100 dark:border-zinc-800">
                  <BookOpen className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  Short Answer Conceptual Drill
                </h3>
                <div className="space-y-4 mt-4">
                  {quiz.shortAnswers.map((item, idx) => (
                    <div id={`sa-item-${idx}`} key={idx} className="p-4 border border-zinc-150 dark:border-zinc-800 rounded-2xl flex flex-col gap-2">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-zinc-755 dark:text-zinc-300">Question {idx + 1}</span>
                        <button
                          id={`sa-toggle-${idx}`}
                          onClick={() => toggleSa(idx)}
                          className="text-xs font-semibold text-indigo-650 dark:text-indigo-400 cursor-pointer"
                        >
                          {shortAnswersCollapsed[idx] ? 'Hide Answer' : 'Reveal Answer'}
                        </button>
                      </div>
                      <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100">{item.question}</p>
                      {shortAnswersCollapsed[idx] && (
                        <div className="p-3 bg-zinc-50 dark:bg-zinc-850 rounded-xl border border-zinc-200/50 dark:border-zinc-800 text-xs text-zinc-650 dark:text-zinc-400 mt-2">
                          <span className="font-black text-indigo-600 dark:text-indigo-400 block mb-1">Model Answer:</span>
                          {item.answer}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Interview & Viva Questions */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Technical Interviews Preparation */}
              {quiz.interviews && quiz.interviews.length > 0 && (
                <div className="p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-xs space-y-4">
                  <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2 pb-2 border-b border-zinc-100 dark:border-zinc-800">
                    <QiIcon className="w-4 h-4 text-purple-600" />
                    Interview Preparation Prompts
                  </h3>
                  <div className="space-y-4 max-h-[400px] overflow-y-auto scrollbar-thin">
                    {quiz.interviews.map((item, idx) => (
                      <div key={idx} className="p-3 bg-purple-50/20 dark:bg-purple-950/10 border border-purple-100/50 dark:border-purple-950/20 rounded-xl space-y-1">
                        <p className="text-xs font-extrabold text-zinc-900 dark:text-zinc-100">Q: {item.question}</p>
                        <p className="text-xxs text-zinc-600 dark:text-zinc-400 mt-1 pl-2 border-l border-purple-500 font-sans leading-relaxed">
                          <strong className="text-purple-700 dark:text-purple-400 block mb-0.5">Key Response Pillars:</strong>
                          {item.idealResponse}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Lab Vivas Rapid Fire */}
              {quiz.vivas && quiz.vivas.length > 0 && (
                <div className="p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-xs space-y-4">
                  <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2 pb-2 border-b border-zinc-100 dark:border-zinc-800">
                    <VivaIcon className="w-4 h-4 text-amber-500" />
                    Viva-Voce Oral Challenges
                  </h3>
                  <div className="space-y-4 max-h-[400px] overflow-y-auto scrollbar-thin">
                    {quiz.vivas.map((item, idx) => (
                      <div key={idx} className="p-3 bg-amber-50/20 dark:bg-amber-950/10 border border-amber-100/50 dark:border-amber-950/20 rounded-xl space-y-1">
                        <p className="text-xs font-extrabold text-zinc-900 dark:text-zinc-100">Viva prompt: {item.question}</p>
                        <p className="text-xxs text-zinc-650 dark:text-zinc-400 mt-1 pl-2 border-l border-amber-500">
                          <strong className="text-amber-800 dark:text-amber-400 block mb-0.5">Recommended Response:</strong>
                          {item.sampleResponse}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>

          </div>
        )}

        {/* 4. RECALL FLASHCARDS PANEL */}
        {activeTab === 'flashcards' && (
          <div className="flex flex-col items-center justify-center py-6">
            {flashcards && flashcards.length > 0 ? (
              <div className="max-w-xl w-full space-y-6">
                
                {/* Score indicators */}
                <div className="flex items-center justify-between text-sm text-zinc-500 dark:text-zinc-400 px-2">
                  <span>Card {currentCardIndex + 1} of {flashcards.length}</span>
                  <button 
                    id="flash-review-btn"
                    onClick={() => {
                      setCurrentCardIndex(0);
                      setShowAnswer(false);
                    }}
                    className="text-xs text-indigo-650 dark:text-indigo-400 font-semibold cursor-pointer"
                  >
                    Reset Study Deck
                  </button>
                </div>

                {/* Flip Card Stage */}
                <div 
                  id="flashcard-box"
                  onClick={() => setShowAnswer(!showAnswer)}
                  className={`h-72 w-full flex flex-col items-center justify-center text-center p-8 border rounded-3xl cursor-pointer transition-all shadow-md select-none relative overflow-hidden group ${
                    showAnswer
                      ? 'bg-gradient-to-br from-indigo-900 to-slate-900 border-indigo-755 text-white'
                      : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 hover:border-indigo-400'
                  }`}
                >
                  <span className="absolute top-4 left-4 inline-block px-2.5 py-1 text-9px rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 font-extrabold tracking-widest uppercase">
                    {showAnswer ? 'Answer Sheet' : 'Question Prompt'}
                  </span>

                  <span className="absolute top-4 right-4 text-xxs text-zinc-400 dark:text-zinc-500 font-semibold group-hover:scale-105">
                    Click to flip
                  </span>

                  <div className="max-w-md px-4">
                    {showAnswer ? (
                      <p className="text-base text-zinc-100 leading-relaxed font-sans">{flashcards[currentCardIndex].answer}</p>
                    ) : (
                      <p className="text-lg font-extrabold font-serif tracking-tight">{flashcards[currentCardIndex].question}</p>
                    )}
                  </div>

                  <span className="absolute bottom-4 text-9px uppercase text-zinc-400/50 tracking-wider">
                    LectureNote recall index
                  </span>
                </div>

                {/* Control Bar */}
                <div className="flex items-center justify-between gap-4">
                  <button
                    id="flash-prev"
                    disabled={currentCardIndex === 0}
                    onClick={() => {
                      setCurrentCardIndex(prev => Math.max(0, prev - 1));
                      setShowAnswer(false);
                    }}
                    className="px-4 py-2 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-650 dark:text-zinc-350 font-semibold text-xs rounded-xl shadow-2xs hover:bg-zinc-50 dark:hover:bg-zinc-805 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    Previous Deck
                  </button>

                  <div className="flex gap-2">
                    <button
                      id="flash-know"
                      onClick={() => {
                        setShowAnswer(false);
                        if (currentCardIndex < flashcards.length - 1) {
                          setCurrentCardIndex(prev => prev + 1);
                        } else {
                          alert("Splendid! You have reviewed the entire study deck.");
                        }
                      }}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs rounded-xl shadow-2xs cursor-pointer"
                    >
                      I Know This!
                    </button>
                    <button
                      id="flash-review-later"
                      onClick={() => {
                        setShowAnswer(false);
                        if (currentCardIndex < flashcards.length - 1) {
                          setCurrentCardIndex(prev => prev + 1);
                        }
                      }}
                      className="px-4 py-2 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-755 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-950/30 font-medium text-xs rounded-xl hover:bg-indigo-100 cursor-pointer"
                    >
                      Review Later
                    </button>
                  </div>

                  <button
                    id="flash-next"
                    disabled={currentCardIndex === flashcards.length - 1}
                    onClick={() => {
                      setCurrentCardIndex(prev => Math.min(flashcards.length - 1, prev + 1));
                      setShowAnswer(false);
                    }}
                    className="px-4 py-2 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-650 dark:text-zinc-350 font-semibold text-xs rounded-xl shadow-2xs hover:bg-zinc-50 dark:hover:bg-zinc-805 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    Next Deck
                  </button>
                </div>

              </div>
            ) : (
              <p className="text-zinc-500">Flashcards are unavailable for this lecture.</p>
            )}
          </div>
        )}
      </div>

    </div>
  );
}
