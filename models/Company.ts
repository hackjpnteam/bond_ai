import mongoose, { Document, Model, Schema } from 'mongoose';

export interface ICompany extends Document {
  name: string;
  slug: string;
  industry: string;
  description: string;
  founded: string;
  employees: string;
  website?: string;
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

const CompanySchema: Schema<ICompany> = new Schema({
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
  industry: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    required: true,
    maxlength: 50000
  },
  founded: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  employees: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  website: {
    type: String,
    trim: true,
    maxlength: 300
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
CompanySchema.index({ name: 1 });
CompanySchema.index({ industry: 1 });
CompanySchema.index({ averageRating: -1 });
CompanySchema.index({ searchCount: -1 });

const Company: Model<ICompany> = mongoose.models.Company || mongoose.model<ICompany>('Company', CompanySchema);

export default Company;