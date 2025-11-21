import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IUserProfile extends Document {
  userId: mongoose.Types.ObjectId;
  profileImage?: string;
  bio?: string;
  website?: string;
  linkedin?: string;
  twitter?: string;
  location?: string;
  skills?: string[];
  interests?: string[];
  createdAt: Date;
  updatedAt: Date;
}

const UserProfileSchema: Schema<IUserProfile> = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true
  },
  profileImage: {
    type: String,
    default: null
  },
  bio: {
    type: String,
    maxlength: 500
  },
  website: {
    type: String,
    validate: {
      validator: function(v: string) {
        return !v || /^https?:\/\/.+/.test(v);
      },
      message: 'Website must be a valid URL'
    }
  },
  linkedin: {
    type: String,
    validate: {
      validator: function(v: string) {
        return !v || /^https?:\/\/(www\.)?linkedin\.com\//.test(v);
      },
      message: 'LinkedIn must be a valid LinkedIn URL'
    }
  },
  twitter: {
    type: String,
    validate: {
      validator: function(v: string) {
        return !v || /^https?:\/\/(www\.)?(twitter\.com|x\.com)\//.test(v);
      },
      message: 'Twitter must be a valid Twitter/X URL'
    }
  },
  location: {
    type: String,
    maxlength: 100
  },
  skills: [{
    type: String,
    maxlength: 50
  }],
  interests: [{
    type: String,
    maxlength: 50
  }]
}, {
  timestamps: true
});

const UserProfile: Model<IUserProfile> = mongoose.models.UserProfile || mongoose.model<IUserProfile>('UserProfile', UserProfileSchema);

export default UserProfile;