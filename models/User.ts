import mongoose, { Schema, Document, Model } from 'mongoose';

export type UserRole = 'chairman' | 'convener' | 'member';

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  username?: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  avatarUrl?: string;
  isActive: boolean;
  gameHighScore?: number;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    username: {
      type: String,
      unique: true,
      sparse: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    passwordHash: {
      type: String,
      required: [true, 'Password is required'],
      select: false,
    },
    role: {
      type: String,
      enum: ['chairman', 'convener', 'member'],
      default: 'member',
      required: true,
    },
    avatarUrl: {
      type: String,
      default: '',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    gameHighScore: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent recompilation in Next.js hot reload
const User: Model<IUser> = mongoose.models?.User || mongoose.model<IUser>('User', UserSchema);

export default User;
