import mongoose, { Document, Schema } from 'mongoose'

export interface IConnection extends Document {
  users: mongoose.Types.ObjectId[]
  initiator: mongoose.Types.ObjectId
  status: 'active' | 'blocked' | 'removed'
  strength: number
  tags?: string[]
  notes?: string
  createdAt: Date
  updatedAt: Date
}

const ConnectionSchema = new Schema<IConnection>(
  {
    users: [{
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }],
    initiator: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    status: {
      type: String,
      enum: ['active', 'blocked', 'removed'],
      default: 'active'
    },
    strength: {
      type: Number,
      min: 0,
      max: 10,
      default: 1
    },
    tags: [{
      type: String
    }],
    notes: {
      type: String,
      maxlength: 1000
    }
  },
  {
    timestamps: true
  }
)

ConnectionSchema.index({ users: 1 })
ConnectionSchema.index({ status: 1 })

export default mongoose.models.Connection || 
  mongoose.model<IConnection>('Connection', ConnectionSchema)