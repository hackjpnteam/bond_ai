import mongoose, { Document, Model, Schema } from 'mongoose';

export type EditActionType = 'update_description' | 'update_notes' | 'update_tags' | 'update_logo' | 'add_item' | 'remove_item' | 'update_settings';

export interface ISharedListEditHistory extends Document {
  sharedListId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  action: EditActionType;
  itemId?: string; // 編集対象のアイテムID
  itemName?: string; // 編集対象のアイテム名
  field?: string; // 編集したフィールド
  oldValue?: string;
  newValue?: string;
  createdAt: Date;
}

const SharedListEditHistorySchema: Schema<ISharedListEditHistory> = new Schema({
  sharedListId: {
    type: Schema.Types.ObjectId,
    ref: 'SharedList',
    required: true,
    index: true
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  action: {
    type: String,
    enum: ['update_description', 'update_notes', 'update_tags', 'update_logo', 'add_item', 'remove_item', 'update_settings'],
    required: true
  },
  itemId: {
    type: String
  },
  itemName: {
    type: String
  },
  field: {
    type: String
  },
  oldValue: {
    type: String,
    maxlength: 10000
  },
  newValue: {
    type: String,
    maxlength: 10000
  }
}, {
  timestamps: true
});

// 共有リストごとの履歴一覧用インデックス
SharedListEditHistorySchema.index({ sharedListId: 1, createdAt: -1 });

// Delete cached model in development
if (process.env.NODE_ENV !== 'production' && mongoose.models.SharedListEditHistory) {
  delete mongoose.models.SharedListEditHistory;
}

const SharedListEditHistory: Model<ISharedListEditHistory> = mongoose.models.SharedListEditHistory || mongoose.model<ISharedListEditHistory>('SharedListEditHistory', SharedListEditHistorySchema);

export default SharedListEditHistory;
