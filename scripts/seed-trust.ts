import { config } from "dotenv";

// Load environment variables first
config({ path: ".env.local" });

import clientPromise from "../lib/mongodb-client";

async function main() {
  const client = await clientPromise;
  const db = client.db(process.env.MONGODB_DB);

  // デフォルトプロフィール画像のリスト
  const defaultAvatars = [
    "/avatars/defaults/Alisher.svg",
    "/avatars/defaults/Eugene.svg", 
    "/avatars/defaults/fukuda_t.svg",
    "/avatars/defaults/Hacker.svg",
    "/avatars/defaults/Lana.svg",
    "/avatars/defaults/madam.svg",
    "/avatars/defaults/madam2.svg",
    "/avatars/defaults/Mako.svg",
    "/avatars/defaults/Mako2.svg",
    "/avatars/defaults/makoのコピー.svg",
    "/avatars/defaults/melissaのコピー.svg",
    "/avatars/defaults/Miki.svg",
    "/avatars/defaults/sei.svg",
    "/avatars/defaults/seika.svg",
    "/avatars/defaults/sosan01.svg",
    "/avatars/defaults/takumiのコピー.svg"
  ];

  // ランダムにデフォルト画像を選択する関数
  const getRandomAvatar = () => defaultAvatars[Math.floor(Math.random() * defaultAvatars.length)];

  const users = [
    { _id: "u_hikaru", name: "Hikaru Tomura", type: "user", avatarUrl: "/avatars/hikaru.svg", bondScore: 4.5 },
    { _id: "u_akira", name: "Akira Sato", type: "user", avatarUrl: getRandomAvatar(), bondScore: 4.7 },
    { _id: "u_mika", name: "Mika Tanaka", type: "user", avatarUrl: getRandomAvatar(), bondScore: 4.3 },
    { _id: "u_kim", name: "Jason Kim", type: "user", avatarUrl: getRandomAvatar(), bondScore: 4.5 }
  ] as any[];
  const companies = [
    { 
      _id: "c_hackjpn", 
      name: "HackJPN", 
      type: "company", 
      logoUrl: "/logos/hackjpn.png", 
      bondScore: 4.9, 
      location: "Tokyo",
      foundedYear: "情報収集中",
      employeeCount: "情報収集中",
      industry: "スタートアップ支援",
      website: "https://hackjpn.org"
    },
    { 
      _id: "c_startuphub", 
      name: "StartupHub", 
      type: "company", 
      logoUrl: "/logos/startuphub.png", 
      bondScore: 4.6, 
      location: "Tokyo",
      foundedYear: "情報収集中",
      employeeCount: "情報収集中",
      industry: "コワーキングスペース",
      website: "https://startuphub.tokyo"
    }
  ] as any[];
  const now = new Date().toISOString();
  const reviews = [
    { _id: "r1", fromUserId: "u_akira", toEntityId: "c_hackjpn", toEntityType: "company", sentiment: 0.8, confidence: 0.95, weight: 0.85, tags: ["投資実行"], isAnonymous: false, createdAt: now },
    { _id: "r2", fromUserId: "u_mika", toEntityId: "c_hackjpn", toEntityType: "company", sentiment: 0.3, confidence: 0.8,  weight: 0.6,  tags: ["採用協力"], isAnonymous: true, createdAt: now },
    { _id: "r3", fromUserId: "u_kim",  toEntityId: "u_akira",   toEntityType: "user",    sentiment: 0.6, confidence: 0.7,  weight: 0.55, tags: ["紹介実績"], isAnonymous: false, createdAt: now },
    { _id: "r4", fromUserId: "u_akira", toEntityId: "c_startuphub", toEntityType: "company", sentiment: -0.2, confidence: 0.9, weight: 0.5, tags: ["PMF評価"], isAnonymous: true, createdAt: now },
    { _id: "r5", fromUserId: "u_hikaru", toEntityId: "c_hackjpn", toEntityType: "company", sentiment: 0.7, confidence: 0.9, weight: 0.8, tags: ["投資検討"], isAnonymous: false, createdAt: now },
    { _id: "r6", fromUserId: "u_hikaru", toEntityId: "u_akira", toEntityType: "user", sentiment: 0.8, confidence: 0.85, weight: 0.75, tags: ["信頼関係"], isAnonymous: false, createdAt: now },
    { _id: "r7", fromUserId: "u_mika", toEntityId: "u_hikaru", toEntityType: "user", sentiment: 0.6, confidence: 0.8, weight: 0.65, tags: ["ビジネス協力"], isAnonymous: true, createdAt: now }
  ] as any[];

  await db.collection("users").deleteMany({});
  await db.collection("companies").deleteMany({});
  await db.collection("reviews").deleteMany({});
  await db.collection("edit_history").deleteMany({});
  await db.collection("users").insertMany(users);
  await db.collection("companies").insertMany(companies);
  await db.collection("reviews").insertMany(reviews);

  console.log("Seeded trust graph data ✅");
  process.exit(0);
}
main().catch(e => { console.error(e); process.exit(1); });