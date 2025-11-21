import mongoose, { Document, Model, Schema } from 'mongoose';

export interface ISearchResult extends Document {
  userId: mongoose.Types.ObjectId;
  query: string;
  company: string;
  answer: string;
  metadata?: any;
  createdAt: Date;
}

const SearchResultSchema: Schema<ISearchResult> = new Schema({
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
  company: {
    type: String,
    required: true,
    trim: true
  },
  answer: {
    type: String,
    required: true
  },
  metadata: {
    type: Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: { createdAt: true, updatedAt: false }
});

// Indexes
SearchResultSchema.index({ userId: 1, createdAt: -1 });
SearchResultSchema.index({ company: 1, createdAt: -1 });

// TTL index to auto-delete old search results (3 months)
SearchResultSchema.index({ createdAt: 1 }, { expireAfterSeconds: 7776000 });

const SearchResult: Model<ISearchResult> = mongoose.models.SearchResult || mongoose.model<ISearchResult>('SearchResult', SearchResultSchema);

export default SearchResult;