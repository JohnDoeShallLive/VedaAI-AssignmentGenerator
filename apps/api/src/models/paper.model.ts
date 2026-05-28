import { Schema, model, Document } from 'mongoose';
import { GeneratedPaper as IGeneratedPaper, Section, Question } from '@vedaai/types';

export interface GeneratedPaperDocument extends Omit<IGeneratedPaper, '_id'>, Document {}

const QuestionSchema = new Schema<Question>({
  id: { type: String, required: true },
  text: { type: String, required: true },
  type: {
    type: String,
    enum: ['mcq', 'short', 'diagram', 'numerical', 'long'],
    required: true,
  },
  options: { type: [String] },
  correctAnswer: { type: String },
  difficulty: {
    type: String,
    enum: ['easy', 'moderate', 'hard'],
    required: true,
  },
  marks: { type: Number, required: true },
  answer: { type: String },
}, { _id: false });

const SectionSchema = new Schema<Section>({
  title: { type: String, required: true },
  instruction: { type: String, required: true },
  questions: { type: [QuestionSchema], required: true },
}, { _id: false });

const GeneratedPaperSchema = new Schema<any>({
  assignmentId: { type: Schema.Types.ObjectId, ref: 'Assignment', required: true },
  schoolName: { type: String, required: true },
  subject: { type: String, required: true },
  className: { type: String, required: true },
  timeAllowed: { type: String, required: true },
  totalMarks: { type: Number, required: true },
  sections: { type: [SectionSchema], required: true },
  generatedAt: { type: String, default: () => new Date().toISOString() },
}, {
  timestamps: true,
  toJSON: {
    transform: (doc, ret: any) => {
      ret._id = ret._id.toString();
      ret.assignmentId = ret.assignmentId.toString();
      delete ret.__v;
      return ret;
    }
  }
});

export const GeneratedPaper = model<GeneratedPaperDocument>('GeneratedPaper', GeneratedPaperSchema);
