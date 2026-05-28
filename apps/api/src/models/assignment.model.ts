import { Schema, model, Document } from 'mongoose';
import { Assignment as IAssignment, QuestionTypeConfig } from '@vedaai/types';

export interface AssignmentDocument extends Omit<IAssignment, '_id' | 'createdAt' | 'updatedAt'>, Document {
  createdAt: Date;
  updatedAt: Date;
}

const QuestionTypeSchema = new Schema<QuestionTypeConfig>({
  type: {
    type: String,
    enum: ['mcq', 'short', 'diagram', 'numerical', 'long'],
    required: true,
  },
  label: { type: String, required: true },
  count: { type: Number, required: true, min: 1 },
  marksEach: { type: Number, required: true, min: 1 },
}, { _id: false });

const AssignmentSchema = new Schema<any>({
  title: { type: String, required: true, trim: true },
  subject: { type: String, required: true, trim: true },
  dueDate: { type: String, required: true },
  questionTypes: { type: [QuestionTypeSchema], required: true },
  additionalInfo: { type: String, default: '' },
  filePath: { type: String },
  status: {
    type: String,
    enum: ['draft', 'queued', 'processing', 'done', 'failed'],
    default: 'draft',
    required: true,
  },
  resultId: { type: Schema.Types.ObjectId, ref: 'GeneratedPaper' },
}, {
  timestamps: true,
  toJSON: {
    transform: (doc, ret: any) => {
      ret._id = ret._id.toString();
      if (ret.resultId) ret.resultId = ret.resultId.toString();
      delete ret.__v;
      return ret;
    }
  }
});

export const Assignment = model<AssignmentDocument>('Assignment', AssignmentSchema);
