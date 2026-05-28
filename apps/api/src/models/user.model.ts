import { Schema, model, Document } from 'mongoose';
import { User as IUser, Institution } from '@vedaai/types';

export interface UserDocument extends Omit<IUser, '_id' | 'createdAt' | 'updatedAt'>, Document {
  createdAt: Date;
  updatedAt: Date;
}

const InstitutionSchema = new Schema<Institution>({
  name: { type: String, required: true },
  type: {
    type: String,
    enum: ['school', 'college', 'coaching', 'university', 'other'],
    required: true,
  },
  city: { type: String },
  board: { type: String },
  logoUrl: { type: String },
}, { _id: false });

const UserSchema = new Schema<UserDocument>({
  email: { type: String, required: true, unique: true, index: true, lowercase: true, trim: true },
  name: { type: String, required: true, trim: true },
  firebaseUid: { type: String, required: true, unique: true, index: true },
  avatarUrl: { type: String },
  provider: {
    type: String,
    enum: ['credentials', 'google'],
    required: true,
  },
  institution: { type: InstitutionSchema },
  onboardingComplete: { type: Boolean, default: false, required: true },
  role: { type: String, default: 'Teacher' },
}, {
  timestamps: true,
  toJSON: {
    transform: (doc, ret: any) => {
      ret._id = ret._id.toString();
      delete ret.__v;
      return ret;
    }
  }
});

export const User = model<UserDocument>('User', UserSchema);
