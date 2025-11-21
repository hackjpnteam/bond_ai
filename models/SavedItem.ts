import mongoose, { Document, Model, Schema } from 'mongoose';

export interface ISavedItem extends Document {
  userId: mongoose.Types.ObjectId;
  itemType: 'company' | 'person' | 'search_result';
  itemData: {
    name: string;
    slug?: string;
    description?: string;
    metadata?: any;
  };
  tags?: string[];
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const SavedItemSchema: Schema<ISavedItem> = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  itemType: {
    type: String,
    enum: ['company', 'person', 'search_result'],
    required: true
  },
  itemData: {
    name: { type: String, required: true, trim: true },
    slug: { type: String, trim: true, lowercase: true },
    description: { type: String, maxlength: 1000 },
    metadata: { type: Schema.Types.Mixed }
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: 50
  }],
  notes: {
    type: String,
    maxlength: 2000
  }
}, {
  timestamps: true
});

// Compound indexes
SavedItemSchema.index({ userId: 1, itemType: 1, createdAt: -1 });
SavedItemSchema.index({ userId: 1, 'itemData.name': 1 });

const SavedItem: Model<ISavedItem> = mongoose.models.SavedItem || mongoose.model<ISavedItem>('SavedItem', SavedItemSchema);

export default SavedItem;