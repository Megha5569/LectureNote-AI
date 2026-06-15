export interface Definition {
  term: string;
  definition: string;
}

export interface Formula {
  name: string;
  equation: string;
  context?: string;
}

export interface Algorithm {
  name: string;
  steps: string[];
}

export interface CodeSnippet {
  language: string;
  title: string;
  code: string;
}

export interface Example {
  topic: string;
  scenario: string;
  explanation: string;
}

export interface ActionItem {
  task: string;
  deadline?: string;
  type?: 'assignment' | 'deadline' | 'reading' | 'other';
}

export interface StudyNotes {
  title: string;
  topics: string[];
  detailedExpl: string;
  keyPoints: string[];
  definitions: Definition[];
  formulas: Formula[];
  algorithms: Algorithm[];
  codeSnippets: CodeSnippet[];
  examples: Example[];
  actionItems: ActionItem[];
}

export interface StudySummary {
  executive: string;
  detailed: string;
  revision: string;
  onePageReview: string;
}

export interface MCQ {
  question: string;
  options: string[];
  answerIndex: number;
  explanation: string;
}

export interface ShortAnswer {
  question: string;
  answer: string;
}

export interface InterviewQuestion {
  question: string;
  idealResponse: string;
}

export interface VivaQuestion {
  question: string;
  sampleResponse: string;
}

export interface Quiz {
  mcqs: MCQ[];
  shortAnswers: ShortAnswer[];
  interviews: InterviewQuestion[];
  vivas: VivaQuestion[];
}

export interface Flashcard {
  id: string;
  question: string;
  answer: string;
}

export interface Lecture {
  id: string;
  title: string;
  date: string;
  subject: string;
  semester: string;
  tags: string[];
  transcript?: string;
  slides?: string[]; // array of base64 screenshots
  favorite: boolean;
  progress: number; // 0 to 100
  notes?: StudyNotes;
  summary?: StudySummary;
  quiz?: Quiz;
  flashcards?: Flashcard[];
}

export interface UserProfile {
  name: string;
  theme: 'light' | 'dark';
  subjects: string[];
  semesters: string[];
}
