import mongoose, { Document, Model, Schema } from 'mongoose';

export interface ICompanyEditHistory extends Document {
  companyId: mongoose.Types.ObjectId;
  field: string;
  oldValue: string;
  newValue: string;
  editorId: mongoose.Types.ObjectId;
  editorName: string;
  reason?: string;
  createdAt: Date;
}

const CompanyEditHistorySchema: Schema<ICompanyEditHistory> = new Schema({
  companyId: {
    type: Schema.Types.ObjectId,
    ref: 'Company',
    required: true,
    index: true
  },
  field: {
    type: String,
    required: true,
    trim: true,
    enum: ['description', 'industry', 'founded', 'employees', 'website']
  },
  oldValue: {
    type: String,
    required: true,
    maxlength: 5000
  },
  newValue: {
    type: String,
    required: true,
    maxlength: 5000
  },
  editorId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  editorName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  reason: {
    type: String,
    trim: true,
    maxlength: 500
  }
}, {
  timestamps: { createdAt: true, updatedAt: false }
});

// Indexes
CompanyEditHistorySchema.index({ companyId: 1, createdAt: -1 });
CompanyEditHistorySchema.index({ editorId: 1, createdAt: -1 });
CompanyEditHistorySchema.index({ field: 1, createdAt: -1 });

// TTL index to auto-delete old edit history (1 year)
CompanyEditHistorySchema.index({ createdAt: 1 }, { expireAfterSeconds: 31536000 });

const CompanyEditHistory: Model<ICompanyEditHistory> = mongoose.models.CompanyEditHistory || mongoose.model<ICompanyEditHistory>('CompanyEditHistory', CompanyEditHistorySchema);

export default CompanyEditHistory;