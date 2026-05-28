import { Schema, model, Document } from 'mongoose';
import { GeneratedPaper as IGeneratedPaper, Section, Question } from '@vedaai/types';

export interface GeneratedPaperDocument extends Omit<IGeneratedPaper, '_id'>, Document {}

const QuestionSchema = new Schema<Question>({
  id: { type: String, required: true },
  type: { type: String }, // Add type!
  text: { type: String, required: true },
  options: { type: [String], default: undefined }, // Add options!
  correctAnswer: { type: String }, // Add correctAnswer!
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
  userId: { type: Schema.Types.ObjectId, ref: 'User', index: true }, // Scoped owner — nullable for backward compatibility
  institutionName: { type: String }, // Snapshot at generation time — nullable for backward compatibility
  schoolName: { type: String }, // Legacy snapshot support — nullable
  logoUrl: { type: String }, // Snapshot of school crest at generation time — optional
  subject: { type: String, required: true },
  className: { type: String }, // Snapshot — nullable for backward compatibility
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
      if (ret.userId) ret.userId = ret.userId.toString();
      delete ret.__v;
      return ret;
    }
  }
});

export const GeneratedPaper = model<GeneratedPaperDocument>('GeneratedPaper', GeneratedPaperSchema);
