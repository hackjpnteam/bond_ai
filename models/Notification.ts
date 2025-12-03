import mongoose, { Document, Schema } from 'mongoose'

export interface INotification extends Document {
  recipient: mongoose.Types.ObjectId
  type: 'connection_request' | 'connection_accepted' | 'evaluation' | 'message' | 'system' | 'shared_list_invite'
  title: string
  message: string
  data?: any
  read: boolean
  createdAt: Date
  updatedAt: Date
}

const NotificationSchema = new Schema<INotification>(
  {
    recipient: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    type: {
      type: String,
      enum: ['connection_request', 'connection_accepted', 'evaluation', 'message', 'system', 'shared_list_invite'],
      required: true
    },
    title: {
      type: String,
      required: true
    },
    message: {
      type: String,
      required: true
    },
    data: {
      type: Schema.Types.Mixed
    },
    read: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
)

NotificationSchema.index({ recipient: 1, read: 1, createdAt: -1 })

export default mongoose.models.Notification || 
  mongoose.model<INotification>('Notification', NotificationSchema)