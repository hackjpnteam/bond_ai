import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IPerson extends Document {
  name: string;
  slug: string;
  nameKana?: string;
  title?: string; // 肩書き
  company?: string; // 所属企業
  companySlug?: string;
  position?: string; // 役職
  biography: string; // 経歴・プロフィール
  career?: string; // キャリア履歴
  education?: string; // 学歴
  achievements?: string; // 主な実績
  expertise?: string[]; // 専門分野
  socialLinks?: {
    twitter?: string;
    linkedin?: string;
    facebook?: string;
    website?: string;
  };
  imageUrl?: string;
  searchCount: number;
  averageRating: number;
  isUserEdited: boolean;
  dataSource: 'auto' | 'user_edited' | 'mixed' | 'ai_search';
  lastEditedBy?: string;
  lastEditedAt?: Date;
  lastSearchAt?: Date;
  sources?: Array<{
    url: string;
    title?: string;
    published_at?: string;
  }>;
  editHistory?: Array<{
    field: string;
    oldValue: string;
    newValue: string;
    editor: string;
    editedAt: Date;
    reason?: string;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const PersonSchema: Schema<IPerson> = new Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true
  },
  nameKana: {
    type: String,
    trim: true,
    maxlength: 200
  },
  title: {
    type: String,
    trim: true,
    maxlength: 200
  },
  company: {
    type: String,
    trim: true,
    maxlength: 200
  },
  companySlug: {
    type: String,
    trim: true,
    maxlength: 200
  },
  position: {
    type: String,
    trim: true,
    maxlength: 100
  },
  biography: {
    type: String,
    required: true,
    maxlength: 50000
  },
  career: {
    type: String,
    maxlength: 20000
  },
  education: {
    type: String,
    maxlength: 5000
  },
  achievements: {
    type: String,
    maxlength: 10000
  },
  expertise: [{
    type: String,
    maxlength: 100
  }],
  socialLinks: {
    twitter: { type: String, maxlength: 300 },
    linkedin: { type: String, maxlength: 300 },
    facebook: { type: String, maxlength: 300 },
    website: { type: String, maxlength: 300 }
  },
  imageUrl: {
    type: String,
    maxlength: 500
  },
  searchCount: {
    type: Number,
    default: 0,
    min: 0
  },
  averageRating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  isUserEdited: {
    type: Boolean,
    default: false
  },
  dataSource: {
    type: String,
    enum: ['auto', 'user_edited', 'mixed', 'ai_search'],
    default: 'auto'
  },
  lastEditedBy: {
    type: String
  },
  lastEditedAt: {
    type: Date
  },
  lastSearchAt: {
    type: Date
  },
  sources: [{
    url: { type: String, required: true },
    title: { type: String },
    published_at: { type: String }
  }],
  editHistory: [{
    field: { type: String, required: true },
    oldValue: { type: String, required: true },
    newValue: { type: String, required: true },
    editor: { type: String, required: true },
    editedAt: { type: Date, default: Date.now },
    reason: { type: String, maxlength: 500 }
  }]
}, {
  timestamps: true
});

// Indexes
PersonSchema.index({ name: 1 });
PersonSchema.index({ company: 1 });
PersonSchema.index({ averageRating: -1 });
PersonSchema.index({ searchCount: -1 });

const Person: Model<IPerson> = mongoose.models.Person || mongoose.model<IPerson>('Person', PersonSchema);

export default Person;
