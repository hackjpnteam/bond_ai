import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IUserSession extends Document {
  userId: mongoose.Types.ObjectId;
  sessionToken: string;
  expiresAt: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const UserSessionSchema: Schema<IUserSession> = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  sessionToken: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  expiresAt: {
    type: Date,
    required: true,
    index: { expireAfterSeconds: 0 } // MongoDB TTL index
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Cleanup expired sessions
UserSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const UserSession: Model<IUserSession> = mongoose.models.UserSession || mongoose.model<IUserSession>('UserSession', UserSessionSchema);

export default UserSession;