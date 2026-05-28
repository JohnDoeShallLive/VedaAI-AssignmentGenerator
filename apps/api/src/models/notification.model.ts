import { Schema, model, Document } from 'mongoose';
import { Notification as INotification } from '@vedaai/types';

export interface NotificationDocument extends Omit<INotification, '_id' | 'createdAt' | 'updatedAt'>, Document {
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<NotificationDocument>({
  userId: { type: Schema.Types.ObjectId as any, ref: 'User', required: true, index: true },
  message: { type: String, required: true },
  type: {
    type: String,
    enum: ['success', 'error', 'info'],
    required: true,
  },
  read: { type: Boolean, default: false, required: true },
  assignmentId: { type: Schema.Types.ObjectId as any, ref: 'Assignment' },
}, {
  timestamps: true,
  toJSON: {
    transform: (doc, ret: any) => {
      ret._id = ret._id.toString();
      ret.userId = ret.userId.toString();
      if (ret.assignmentId) ret.assignmentId = ret.assignmentId.toString();
      delete ret.__v;
      return ret;
    }
  }
});

export const Notification = model<NotificationDocument>('Notification', NotificationSchema);
