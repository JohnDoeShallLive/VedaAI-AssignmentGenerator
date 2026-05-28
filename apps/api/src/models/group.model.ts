import { Schema, model, Document } from 'mongoose';
import { Group as IGroup } from '@vedaai/types';

export interface GroupDocument extends Omit<IGroup, '_id' | 'createdAt' | 'updatedAt'>, Document {
  createdAt: Date;
  updatedAt: Date;
}

const GroupSchema = new Schema<GroupDocument>({
  userId: { type: Schema.Types.ObjectId as any, ref: 'User', required: true, index: true },
  name: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
}, {
  timestamps: true,
  toJSON: {
    transform: (doc, ret: any) => {
      ret._id = ret._id.toString();
      ret.userId = ret.userId.toString();
      delete ret.__v;
      return ret;
    }
  }
});

export const Group = model<GroupDocument>('Group', GroupSchema);
