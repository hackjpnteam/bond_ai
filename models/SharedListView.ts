import mongoose, { Document, Model, Schema } from 'mongoose';

export interface ISharedListView extends Document {
  userId: mongoose.Types.ObjectId;
  sharedListId: mongoose.Types.ObjectId;
  viewedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const SharedListViewSchema: Schema<ISharedListView> = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  sharedListId: {
    type: Schema.Types.ObjectId,
    ref: 'SharedList',
    required: true,
    index: true
  },
  viewedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// ユーザーごとの閲覧済みリスト一覧用のインデックス
SharedListViewSchema.index({ userId: 1, viewedAt: -1 });
// 重複を防ぐためのユニークインデックス
SharedListViewSchema.index({ userId: 1, sharedListId: 1 }, { unique: true });

// Delete cached model in development
if (process.env.NODE_ENV !== 'production' && mongoose.models.SharedListView) {
  delete mongoose.models.SharedListView;
}

const SharedListView: Model<ISharedListView> = mongoose.models.SharedListView || mongoose.model<ISharedListView>('SharedListView', SharedListViewSchema);

export default SharedListView;
