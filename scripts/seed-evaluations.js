const mongoose = require('mongoose');

// Evaluation Schema
const EvaluationSchema = new mongoose.Schema({
  userId: String,
  companyName: String,
  companySlug: String,
  rating: Number,
  comment: String,
  categories: {
    culture: Number,
    growth: Number,
    workLifeBalance: Number,
    compensation: Number,
    leadership: Number
  },
  isPublic: { type: Boolean, default: true },
  isAnonymous: { type: Boolean, default: false }
}, { timestamps: true });

// Company Schema
const CompanySchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
  industry: { type: String, required: true, trim: true },
  description: String,
  founded: String,
  employees: String,
  website: String,
  searchCount: { type: Number, default: 0 },
  averageRating: { type: Number, default: 0 }
}, { timestamps: true });

const Evaluation = mongoose.models.Evaluation || mongoose.model('Evaluation', EvaluationSchema);
const Company = mongoose.models.Company || mongoose.model('Company', CompanySchema);

async function seedEvaluations() {
  try {
    // Connect to MongoDB using the environment variable
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/bond';
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    // Sample evaluations for u_hikaru
    const evaluations = [
      {
        userId: 'u_hikaru',
        companyName: 'ギグー',
        companySlug: 'gigoo',
        relationship: 'employee',
        rating: 5,
        comment: '最高の会社です。技術力が高く、成長機会も豊富です。',
        categories: {
          culture: 5,
          growth: 5,
          workLifeBalance: 4,
          compensation: 4,
          leadership: 5
        },
        isPublic: true,
        isAnonymous: false
      },
      {
        userId: 'u_hikaru',
        companyName: 'メルカリ',
        companySlug: 'mercari',
        relationship: 'partner',
        rating: 4,
        comment: 'グローバルに展開している素晴らしい会社。エンジニアにとって学びが多い環境です。',
        categories: {
          culture: 4,
          growth: 5,
          workLifeBalance: 3,
          compensation: 4,
          leadership: 4
        },
        isPublic: true,
        isAnonymous: false
      },
      {
        userId: 'u_hikaru',
        companyName: 'サイバーエージェント',
        companySlug: 'cyberagent',
        relationship: 'customer',
        rating: 4,
        comment: 'エンジニアファーストな文化が根付いている会社。技術への投資も積極的です。',
        categories: {
          culture: 4,
          growth: 4,
          workLifeBalance: 3,
          compensation: 4,
          leadership: 4
        },
        isPublic: true,
        isAnonymous: false
      }
    ];

    // Sample companies
    const companies = [
      {
        name: 'ギグー',
        slug: 'gigoo',
        industry: 'IT・インターネット',
        description: '革新的なテクノロジーで社会課題を解決するスタートアップ',
        founded: '2023年',
        employees: '50名',
        website: 'https://gigoo.co.jp',
        averageRating: 5
      },
      {
        name: 'メルカリ',
        slug: 'mercari',
        industry: 'Eコマース',
        description: 'フリマアプリ「メルカリ」を運営する日本最大級のCtoCプラットフォーム',
        founded: '2013年',
        employees: '2000名',
        website: 'https://mercari.com',
        averageRating: 4
      },
      {
        name: 'サイバーエージェント',
        slug: 'cyberagent',
        industry: 'インターネット広告',
        description: 'AbemaTVやAmeba、広告事業を展開する総合インターネット企業',
        founded: '1998年',
        employees: '6000名',
        website: 'https://cyberagent.co.jp',
        averageRating: 4
      }
    ];

    // Clear existing data for u_hikaru
    await Evaluation.deleteMany({ userId: 'u_hikaru' });
    console.log('🗑️ Cleared existing evaluations for u_hikaru');

    // Insert companies (update or create)
    for (const companyData of companies) {
      await Company.findOneAndUpdate(
        { slug: companyData.slug },
        companyData,
        { upsert: true, new: true }
      );
      console.log(`📝 Created/updated company: ${companyData.name}`);
    }

    // Insert evaluations
    await Evaluation.insertMany(evaluations);
    console.log(`✅ Created ${evaluations.length} evaluations for u_hikaru`);

    // Show what was created
    const createdEvaluations = await Evaluation.find({ userId: 'u_hikaru' });
    console.log('\n📊 Created evaluations:');
    createdEvaluations.forEach((eval, index) => {
      console.log(`${index + 1}. ${eval.companyName} - ${eval.rating}/5 stars`);
      console.log(`   "${eval.comment}"`);
    });

    await mongoose.connection.close();
    console.log('\n✅ Database seeding completed');
    
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

seedEvaluations();
