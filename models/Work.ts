import mongoose, { Schema, Document, Model } from 'mongoose';

export type WorkCategory =
  | 'poster'
  | 'video'
  | 'reels'
  | 'photo'
  | 'design'
  | 'social_media'
  | 'other';

export type WorkPriority = 'low' | 'medium' | 'high';
export type WorkStatus = 'pending' | 'in_progress' | 'completed';

export interface ISubTask {
  _id?: mongoose.Types.ObjectId;
  title: string;
  assignedTo?: mongoose.Types.ObjectId;
  status: WorkStatus;
  completedAt?: Date;
}

export interface IWork extends Document {
  _id: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  category: WorkCategory;
  priority: WorkPriority;
  deadline: Date;
  status: WorkStatus;
  assignedTo: mongoose.Types.ObjectId[];
  subtasks: ISubTask[];
  createdBy: mongoose.Types.ObjectId;
  completedAt?: Date;
  completedBy?: mongoose.Types.ObjectId;
  attachments: string[];
  createdAt: Date;
  updatedAt: Date;
}

const SubTaskSchema = new Schema<ISubTask>(
  {
    title: {
      type: String,
      required: [true, 'Subtask title is required'],
      trim: true,
    },
    assignedTo: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'completed'],
      default: 'pending',
      required: true,
    },
    completedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

const WorkSchema = new Schema<IWork>(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      index: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    category: {
      type: String,
      enum: ['poster', 'video', 'reels', 'photo', 'design', 'social_media', 'other'],
      default: 'other',
      required: true,
      index: true,
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium',
      required: true,
      index: true,
    },
    deadline: {
      type: Date,
      required: [true, 'Deadline is required'],
      index: true,
    },
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'completed'],
      default: 'pending',
      required: true,
      index: true,
    },
    assignedTo: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
        index: true,
      },
    ],
    subtasks: [SubTaskSchema],
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    completedAt: {
      type: Date,
    },
    completedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    attachments: [
      {
        type: String,
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Prevent recompilation in Next.js hot reload
const Work: Model<IWork> = mongoose.models?.Work || mongoose.model<IWork>('Work', WorkSchema);

export default Work;
