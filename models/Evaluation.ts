import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IReply {
  userId: string;
  content: string;
  isAnonymous: boolean;
  createdAt: Date;
}

export interface IEvaluation extends Document {
  userId: string;
  companyName: string;
  companySlug: string;
  rating: number;
  relationshipType: number; // 0-6: 0=未設定, 1=知人, 2=取引先, 3=協業先, 4=投資先, 5=株主, 6=友達
  comment?: string;
  categories: {
    culture: number;
    growth: number;
    workLifeBalance: number;
    compensation: number;
    leadership: number;
  };
  editHistory?: Array<{
    previousRating: number;
    previousComment?: string;
    editedAt: Date;
    reason?: string;
  }>;
  likes: string[]; // Array of user IDs who liked (legacy)
  likesCount: number; // Total like count (can be incremented multiple times)
  replies: IReply[];
  isPublic: boolean;
  isAnonymous: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const EvaluationSchema: Schema<IEvaluation> = new Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  companyName: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  companySlug: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    index: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  relationshipType: {
    type: Number,
    required: true,
    min: 0,
    max: 6,
    default: 0
  },
  comment: {
    type: String,
    default: '',
    maxlength: 2000
  },
  categories: {
    culture: { type: Number, min: 1, max: 5, required: true },
    growth: { type: Number, min: 1, max: 5, required: true },
    workLifeBalance: { type: Number, min: 1, max: 5, required: true },
    compensation: { type: Number, min: 1, max: 5, required: true },
    leadership: { type: Number, min: 1, max: 5, required: true }
  },
  editHistory: [{
    previousRating: { type: Number, required: true },
    previousComment: { type: String, default: '' },
    editedAt: { type: Date, default: Date.now },
    reason: { type: String, maxlength: 500 }
  }],
  likes: [{
    type: String,
    ref: 'User'
  }],
  likesCount: {
    type: Number,
    default: 0
  },
  replies: [{
    userId: { type: String, required: true, ref: 'User' },
    content: { type: String, required: true, maxlength: 500 },
    isAnonymous: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
  }],
  isPublic: {
    type: Boolean,
    default: true
  },
  isAnonymous: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Compound indexes for efficient queries
EvaluationSchema.index({ userId: 1, companySlug: 1 });
EvaluationSchema.index({ companySlug: 1, createdAt: -1 });
EvaluationSchema.index({ userId: 1, createdAt: -1 });

// Delete cached model in development to apply schema changes
if (process.env.NODE_ENV !== 'production' && mongoose.models.Evaluation) {
  delete mongoose.models.Evaluation;
}

const Evaluation: Model<IEvaluation> = mongoose.models.Evaluation || mongoose.model<IEvaluation>('Evaluation', EvaluationSchema);

export default Evaluation;
