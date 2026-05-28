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
  title: string;
  subject: string;
  dueDate: string;            // ISO date string
  questionTypes: QuestionTypeConfig[];
  additionalInfo?: string;
  filePath?: string;          // uploaded file path on server
  status: AssignmentStatus;
  resultId?: string;          // ref to GeneratedPaper
  createdAt: string;
  updatedAt: string;
}

export type QuestionDifficulty = 'easy' | 'moderate' | 'hard';

export interface Question {
  id: string;
  text: string;
  difficulty: QuestionDifficulty;
  marks: number;
  answer?: string;            // for answer key
}

export interface Section {
  title: string;              // e.g., "Section A"
  instruction: string;        // e.g., "Attempt all questions. Each question carries 2 marks."
  questions: Question[];
}

export interface GeneratedPaper {
  _id: string;
  assignmentId: string;
  schoolName: string;
  subject: string;
  className: string;
  timeAllowed: string;        // e.g., "45 minutes"
  totalMarks: number;
  sections: Section[];
  generatedAt: string;
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
