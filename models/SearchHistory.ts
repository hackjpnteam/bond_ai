import mongoose, { Document, Model, Schema } from 'mongoose';

export interface ISearchHistory extends Document {
  userId: mongoose.Types.ObjectId;
  query: string;
  mode: 'company' | 'person' | 'service';
  results?: any;
  createdAt: Date;
}

const SearchHistorySchema: Schema<ISearchHistory> = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  query: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  mode: {
    type: String,
    enum: ['company', 'person', 'service'],
    required: true
  },
  results: {
    type: Schema.Types.Mixed,
    default: null
  }
}, {
  timestamps: { createdAt: true, updatedAt: false }
});

// Index for efficient queries
SearchHistorySchema.index({ userId: 1, createdAt: -1 });
SearchHistorySchema.index({ query: 1, mode: 1 });

// TTL index to auto-delete old search history (6 months)
SearchHistorySchema.index({ createdAt: 1 }, { expireAfterSeconds: 15552000 });

const SearchHistory: Model<ISearchHistory> = mongoose.models.SearchHistory || mongoose.model<ISearchHistory>('SearchHistory', SearchHistorySchema);

export default SearchHistory;