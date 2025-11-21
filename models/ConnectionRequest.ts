import mongoose, { Document, Schema } from 'mongoose'

export interface IConnectionRequest extends Document {
  requester: mongoose.Types.ObjectId
  recipient: mongoose.Types.ObjectId
  status: 'pending' | 'accepted' | 'rejected' | 'cancelled'
  message?: string
  respondedAt?: Date
  createdAt: Date
  updatedAt: Date
}

const ConnectionRequestSchema = new Schema<IConnectionRequest>(
  {
    requester: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    recipient: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected', 'cancelled'],
      default: 'pending'
    },
    message: {
      type: String,
      maxlength: 500
    },
    respondedAt: Date
  },
  {
    timestamps: true
  }
)

ConnectionRequestSchema.index({ requester: 1, recipient: 1 })
ConnectionRequestSchema.index({ recipient: 1, status: 1 })
ConnectionRequestSchema.index({ requester: 1, status: 1 })

export default mongoose.models.ConnectionRequest || 
  mongoose.model<IConnectionRequest>('ConnectionRequest', ConnectionRequestSchema)