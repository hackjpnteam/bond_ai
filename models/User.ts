import mongoose, { Document, Model, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  name: string;
  email: string;
  username?: string;
  password?: string;
  role: string;
  company?: string;
  image?: string;
  bio?: string;
  interests?: string[];
  skills?: string[];
  verified: boolean;
  provider?: string;
  providerId?: string;
  evaluationCount: number;
  onboardingCompleted: boolean;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const UserSchema: Schema<IUser> = new Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [50, 'Name cannot be more than 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      'Please enter a valid email'
    ]
  },
  username: {
    type: String,
    unique: true,
    sparse: true,
    trim: true,
    lowercase: true,
    maxlength: [30, 'Username cannot be more than 30 characters']
  },
  password: {
    type: String,
    required: false,
    minlength: [6, 'Password must be at least 6 characters']
  },
  role: {
    type: String,
    required: [true, 'Role is required'],
    enum: [
      'founder',      // 創業者・経営者
      'executive',    // 役員
      'engineer',     // エンジニア
      'sales',        // セールス
      'marketer',     // マーケター
      'designer',     // デザイナー
      'employee',     // 従業員
      'freelancer',   // フリーランス
      'investor',     // 投資家
      'vc',           // VC
      'cvc',          // CVC
      'advisor',      // アドバイザー
      'other'         // その他
    ],
    default: 'other'
  },
  company: {
    type: String,
    trim: true,
    maxlength: [100, 'Company name cannot be more than 100 characters']
  },
  image: {
    type: String,
    trim: true
  },
  bio: {
    type: String,
    trim: true,
    maxlength: [500, 'Bio cannot be more than 500 characters']
  },
  interests: {
    type: [String],
    default: []
  },
  skills: {
    type: [String],
    default: []
  },
  verified: {
    type: Boolean,
    default: false
  },
  provider: {
    type: String,
    trim: true
  },
  providerId: {
    type: String,
    trim: true
  },
  evaluationCount: {
    type: Number,
    default: 0
  },
  onboardingCompleted: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Generate unique username from email if not set
UserSchema.pre('save', async function(next) {
  // usernameが未設定の場合、emailから自動生成
  if (!this.username && this.email) {
    const baseUsername = this.email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
    let username = baseUsername;
    let counter = 1;

    // 同じusernameが存在する場合、数字を付けてユニークにする
    const UserModel = mongoose.models.User || mongoose.model('User', UserSchema);
    while (await UserModel.exists({ username, _id: { $ne: this._id } })) {
      username = `${baseUsername}${counter}`;
      counter++;
    }
    this.username = username;
  }
  next();
});

// Hash password before saving
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password') || !this.password) return next();

  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error: any) {
    next(error);
  }
});

// Compare password method
UserSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

// Delete cached model in development to allow schema updates
if (process.env.NODE_ENV !== 'production' && mongoose.models.User) {
  delete mongoose.models.User;
}

const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

export default User;