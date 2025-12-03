import mongoose, { Document, Model, Schema } from 'mongoose';
import crypto from 'crypto';

// 閲覧範囲の種類
export type VisibilityType = 'public' | 'link_only' | 'invited_only';

// 編集権限の種類
export type EditPermissionType = 'owner_only' | 'anyone';

export interface ISharedList extends Document {
  ownerId: mongoose.Types.ObjectId;
  shareId: string; // 公開リンク用のユニークID
  title: string;
  description?: string;
  tags: string[]; // 共有するタグ（複数選択可）
  isPublic: boolean; // 後方互換性のため残す（visibility で管理）
  visibility: VisibilityType; // 閲覧範囲: public=ネット公開, link_only=リンク限定, invited_only=招待者限定
  editPermission: EditPermissionType; // 編集権限: owner_only=オーナーのみ, anyone=誰でも（Wikiモード）
  sharedWith: mongoose.Types.ObjectId[]; // 特定ユーザーに共有（invited_only時に使用）
  viewCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const SharedListSchema: Schema<ISharedList> = new Schema({
  ownerId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  shareId: {
    type: String,
    unique: true,
    required: true,
    default: () => crypto.randomBytes(8).toString('hex')
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: 50
  }],
  isPublic: {
    type: Boolean,
    default: true
  },
  visibility: {
    type: String,
    enum: ['public', 'link_only', 'invited_only'],
    default: 'public'
  },
  editPermission: {
    type: String,
    enum: ['owner_only', 'anyone'],
    default: 'owner_only'
  },
  sharedWith: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  viewCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Indexes (shareId already has unique: true which creates an index)
SharedListSchema.index({ ownerId: 1, createdAt: -1 });
SharedListSchema.index({ sharedWith: 1 });

// Delete cached model in development
if (process.env.NODE_ENV !== 'production' && mongoose.models.SharedList) {
  delete mongoose.models.SharedList;
}

const SharedList: Model<ISharedList> = mongoose.models.SharedList || mongoose.model<ISharedList>('SharedList', SharedListSchema);

export default SharedList;
