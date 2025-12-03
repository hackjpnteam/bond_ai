import mongoose, { Document, Model, Schema } from 'mongoose';

export interface ISharedListItem extends Document {
  sharedListId: mongoose.Types.ObjectId;
  addedBy: mongoose.Types.ObjectId; // 追加したユーザー
  itemType: 'company' | 'person' | 'service' | 'search_result';
  itemData: {
    name: string;
    slug?: string;
    description?: string;
    logoUrl?: string; // 会社ロゴURL
    metadata?: any;
  };
  tags?: string[];
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const SharedListItemSchema: Schema<ISharedListItem> = new Schema({
  sharedListId: {
    type: Schema.Types.ObjectId,
    ref: 'SharedList',
    required: true,
    index: true
  },
  addedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: false // 匿名ユーザーも追加可能（公開リストの場合）
  },
  itemType: {
    type: String,
    enum: ['company', 'person', 'service', 'search_result'],
    required: true
  },
  itemData: {
    name: { type: String, required: true, trim: true },
    slug: { type: String, trim: true, lowercase: true },
    description: { type: String, maxlength: 1000 },
    logoUrl: { type: String },
    metadata: { type: Schema.Types.Mixed }
  },
  tags: [{
    type: String,
    trim: true
  }],
  notes: {
    type: String,
    maxlength: 2000
  }
}, {
  timestamps: true
});

// Compound indexes
SharedListItemSchema.index({ sharedListId: 1, createdAt: -1 });

// Delete cached model in development
if (process.env.NODE_ENV !== 'production' && mongoose.models.SharedListItem) {
  delete mongoose.models.SharedListItem;
}

const SharedListItem: Model<ISharedListItem> = mongoose.models.SharedListItem || mongoose.model<ISharedListItem>('SharedListItem', SharedListItemSchema);

export default SharedListItem;
