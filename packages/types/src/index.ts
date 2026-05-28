export type QuestionType = 'mcq' | 'short' | 'diagram' | 'numerical' | 'long';

export interface QuestionTypeConfig {
  type: QuestionType;
  label: string;
  count: number;        // number of questions
  marksEach: number;   // marks per question
}

export type AssignmentStatus = 'draft' | 'queued' | 'processing' | 'done' | 'failed';

export interface Assignment {
  _id: string;
  userId?: string;            // owner — nullable for backward compatibility
  groupId?: string;           // assigned group — optional
  title: string;
  subject: string;
  className?: string;         // e.g. "Grade 8" — nullable for backward compatibility
  dueDate: string;            // ISO date string
  questionTypes: QuestionTypeConfig[];
  additionalInfo?: string;
  fileUrl?: string;           // Cloudinary upload URL (replaces local filePath)
  filePath?: string;          // local file path (legacy support fallback)
  status: AssignmentStatus;
  resultId?: string;          // ref to GeneratedPaper
  createdAt: string;
  updatedAt: string;
}

export type QuestionDifficulty = 'easy' | 'moderate' | 'hard';

export interface Question {
  id: string;
  text: string;
  type?: QuestionType;
  options?: string[];         // for MCQs
  correctAnswer?: string;     // for MCQs
  difficulty: QuestionDifficulty;
  marks: number;
  answer?: string;            // for descriptive answer key
}

export interface Section {
  title: string;              // e.g., "Section A"
  instruction: string;        // e.g., "Attempt all questions. Each question carries 2 marks."
  questions: Question[];
}

export interface GeneratedPaper {
  _id: string;
  assignmentId: string;
  userId?: string;            // owner — nullable for backward compatibility
  institutionName?: string;   // user's institution snapshot — nullable for backward compatibility
  schoolName?: string;        // legacy school name fallback
  logoUrl?: string;           // snapshot of school crest at generation time — optional
  subject: string;
  className?: string;         // snapshot — nullable for backward compatibility
  timeAllowed: string;        // e.g., "45 minutes"
  totalMarks: number;
  sections: Section[];
  generatedAt: string;
}

// SaaS SaaS Data Models

export interface Institution {
  name: string;
  type: 'school' | 'college' | 'coaching' | 'university' | 'other';
  city?: string;
  board?: string;
  logoUrl?: string;
}

export interface User {
  _id: string;
  email: string;
  name: string;
  firebaseUid: string;
  avatarUrl?: string;
  provider: 'credentials' | 'google';
  institution?: Institution;   // nullable for legacy or onboarding state
  onboardingComplete: boolean;
  role?: string;               // store role field only
  createdAt: string;
  updatedAt: string;
}

export interface Group {
  _id: string;
  userId: string;
  name: string;               // e.g., "Class 8A"
  description?: string;
  assignmentCount?: number;   // virtual or aggregate count
  createdAt: string;
  updatedAt: string;
}

export interface Notification {
  _id: string;
  userId: string;
  message: string;
  type: 'success' | 'error' | 'info';
  read: boolean;
  assignmentId?: string;
  createdAt: string;
  updatedAt: string;
}

// WebSocket types
export type WebSocketEvent = 'job.queued' | 'job.processing' | 'job.done' | 'job.failed';

export interface WSClientSubscribeMessage {
  type: 'subscribe';
  assignmentId: string;
}

export interface WSServerProgressMessage {
  event: WebSocketEvent;
  assignmentId: string;
  resultId?: string;
  error?: string;
}
