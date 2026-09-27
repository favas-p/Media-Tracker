import mongoose, { Schema, Document, Model } from 'mongoose';

export type ActivityAction =
  | 'created'
  | 'assigned'
  | 'status_changed'
  | 'commented'
  | 'updated'
  | 'deleted';

export interface IActivity extends Document {
  _id: mongoose.Types.ObjectId;
  workId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  action: ActivityAction;
  meta?: Record<string, unknown>;
  createdAt: Date;
}

const ActivitySchema = new Schema<IActivity>(
  {
    workId: {
      type: Schema.Types.ObjectId,
      ref: 'Work',
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    action: {
      type: String,
      enum: ['created', 'assigned', 'status_changed', 'commented', 'updated', 'deleted'],
      required: true,
    },
    meta: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

const Activity: Model<IActivity> =
  mongoose.models?.Activity || mongoose.model<IActivity>('Activity', ActivitySchema);

export default Activity;
