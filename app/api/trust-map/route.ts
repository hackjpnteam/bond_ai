import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth-middleware";
import connectDB from "@/lib/mongodb";
import mongoose from "mongoose";
import Connection from "@/models/Connection";
import User from "@/models/User";
import UserProfile from "@/models/UserProfile";

export const GET = requireAuth(async (request: NextRequest, user) => {
  const meEmail = user.email;
  const profileImage = user.image; // 認証システムから直接プロフィール画像を取得
  
  // ユーザー名をusernameに変換（早期に定義）
  let username = "user";
  if (user.email === 'tomura@hackjpn.com') {
    username = 'tomura';
  } else if (user.email === 'team@hackjpn.com') {
    username = 'team';
  } else if (user.name === 'Hikaru Tomura') {
    username = 'hikaru';
  } else {
    // その他の場合はemailの@前部分を使用
    username = user.email.split('@')[0];
  }
  
  console.log('Trust Map API - User Info:', {
    id: user.id,
    name: user.name,
    email: user.email,
    image: user.image,
    username: username
  });

  await connectDB();
  const db = mongoose.connection.db;

  // evaluations コレクションから自分のレビューを取得
  // 複数のuserIdパターンで検索（ObjectId形式と名前ベース形式）
  const possibleUserIds = [
    user.id, // ObjectId形式の文字列
    new mongoose.Types.ObjectId(user.id), // ObjectId オブジェクト
    `u_${user.name?.toLowerCase().replace(/\s/g, '_')}`, // "u_名前"形式
    user.email.split('@')[0], // メールの@前部分
    `u_${user.email.split('@')[0]}`, // "u_メール前部分"形式
  ];

  console.log('Searching with userIds:', possibleUserIds);

  const reviews = await db.collection("evaluations").aggregate([
    { $match: { userId: { $in: possibleUserIds } } },
    {
      $group: {
        _id: "$companySlug",
        companyName: { $first: "$companyName" },
        reviewCount: { $sum: 1 },
        strength: { $avg: "$rating" },
        relationshipType: { $first: "$relationshipType" }
      }
    }
  ]).toArray();

  console.log('Found reviews:', reviews.length);
  if (reviews.length > 0) {
    reviews.forEach((review, index) => {
      console.log(`Review ${index}: ${review.companyName} (${review.reviewCount} reviews, rating: ${review.strength})`);
    });
  }

  // companiesコレクションから詳細な会社情報を取得
  const companyData = await Promise.all(
    reviews.map(async (r) => {
      // 複数のパターンで会社を検索
      const searchPatterns = [
        { slug: r._id },
        { name: r.companyName },
        { slug: r.companyName },
        { name: r._id }
      ].filter(pattern => Object.values(pattern)[0]); // 空でない値のみ

      let company = null;
      for (const pattern of searchPatterns) {
        company = await db.collection("companies").findOne(pattern);
        if (company) break;
      }

      // 会社情報があれば詳細データを使用、なければ評価データから生成
      const fullCompanyName = company?.name || r.companyName || r._id || "Unknown";
      const displayName = fullCompanyName.replace(/^株式会社/, '').trim();

      // ロゴURLはAPIエンドポイント経由で取得（会社ページで設定したロゴを反映）
      const slug = company?.slug || r._id;
      const logoUrl = `/api/company-logo/${encodeURIComponent(slug)}`;

      return {
        id: displayName, // 表示用の名前
        fullName: fullCompanyName, // 実データの完全な名前
        type: "org",
        imageUrl: logoUrl,
        reviewCount: r.reviewCount,
        strength: Math.round(r.strength * 10) / 10,
        relationshipType: r.relationshipType ?? 0, // 関係性タイプを追加
        reviewedBy: username, // 評価者をusernameで追加
        reviewedByName: user.name, // 評価者の表示名を追加
        // 会社概要データを追加
        industry: company?.industry || "未分類",
        description: company?.description || `${fullCompanyName}の評価情報`,
        founded: company?.founded || "不明",
        employees: company?.employees || "不明",
        website: company?.website,
        searchCount: company?.searchCount || 0,
        averageRating: company?.averageRating || r.strength
      };
    })
  );

  const companies = companyData;

  // 接続されたユーザーを取得
  const currentUser = await User.findOne({ email: user.email });
  let connectedUsers = [];
  let connectedUsersCompanies = [];
  
  console.log('Current user:', currentUser ? currentUser.name : 'Not found');
  
  if (currentUser) {
    // データベースから直接接続を取得
    const connections = await db.collection("connections").find({
      users: currentUser._id,
      status: 'active'
    }).toArray();
    
    console.log('Found connections:', connections.length);
    
    for (const conn of connections) {
      console.log('Processing connection:', conn._id);
      
      // 他のユーザーIDを見つける
      const otherUserId = conn.users.find(id => id.toString() !== currentUser._id.toString());
      if (!otherUserId) continue;
      
      console.log('Other user ID:', otherUserId);
      
      // 他のユーザーの情報を取得
      const otherUser = await db.collection("users").findOne({ _id: otherUserId });
      if (!otherUser) continue;
      
      console.log('Other user found:', otherUser.name);
      
      // UserProfileから画像を取得
      let userImage = otherUser.image;
      if (!userImage) {
        const userProfile = await db.collection("userprofiles").findOne({ userId: otherUserId });
        if (userProfile && userProfile.profileImage) {
          userImage = userProfile.profileImage;
        }
      }
      
      console.log(`Connected user ${otherUser.name}: final image = ${userImage}`);
      
      // 接続ユーザーのusernameを決定
      let connectedUsername;
      if (otherUser.email === 'tomura@hackjpn.com') {
        connectedUsername = 'tomura';
      } else if (otherUser.email === 'team@hackjpn.com') {
        connectedUsername = 'team';
      } else if (otherUser.name === 'Hikaru Tomura') {
        connectedUsername = 'hikaru';
      } else {
        // その他の場合はemailの@前部分を使用
        connectedUsername = otherUser.email?.split('@')[0] || otherUser.name;
      }

      connectedUsers.push({
        id: connectedUsername, // usernameを使用
        name: otherUser.name, // 表示名を追加
        type: "person",
        imageUrl: userImage || '/default-avatar.png',
        company: otherUser.company,
        position: otherUser.position,
        strength: conn.strength || 1,
        userId: otherUser._id.toString(),
        reviewCount: 0 // デフォルト値として0を設定
      });
    }
    
    // 接続ユーザーの評価企業を取得
    for (const connUser of connectedUsers) {
      // 接続ユーザーのpossibleUserIdsを生成  
      const connUserPossibleIds = [
        connUser.userId, // ObjectId文字列
        new mongoose.Types.ObjectId(connUser.userId), // ObjectId オブジェクト
        `u_${connUser.id}`, // "u_username"形式
        // 特定ユーザーの追加ID
        ...(connUser.id === 'hikaru' ? ['u_hikaru'] : []),
        ...(connUser.id === 'team' ? ['u_seto', 'seto'] : []),
      ];
      
      console.log(`Searching evaluations for connected user ${connUser.id} with IDs:`, connUserPossibleIds.map(id => id.toString()));

      const userReviews = await db.collection("evaluations").aggregate([
        {
          $match: {
            userId: {
              $in: connUserPossibleIds
            }
          }
        },
        {
          $group: {
            _id: "$companySlug",
            companyName: { $first: "$companyName" },
            reviewCount: { $sum: 1 },
            strength: { $avg: "$rating" },
            relationshipType: { $first: "$relationshipType" }
          }
        }
      ]).toArray();
      
      console.log(`Found ${userReviews.length} reviews for ${connUser.id}:`, userReviews.map(r => `${r.companyName}(${r.reviewCount})`));
      
      // 接続ユーザーの企業評価を追加
      for (const review of userReviews) {
        const company = await db.collection("companies").findOne({
          $or: [
            { slug: review._id },
            { name: review.companyName }
          ]
        });

        const fullCompanyName = review.companyName;
        const displayName = fullCompanyName.replace(/^株式会社/, '').trim();

        // ロゴURLはAPIエンドポイント経由で取得（会社ページで設定したロゴを反映）
        const slug = company?.slug || review._id;
        const logoUrl = `/api/company-logo/${encodeURIComponent(slug)}`;

        connectedUsersCompanies.push({
          id: displayName,
          fullName: fullCompanyName,
          type: "org",
          imageUrl: logoUrl,
          reviewCount: review.reviewCount,
          strength: Math.round(review.strength * 10) / 10,
          relationshipType: review.relationshipType ?? 0,
          reviewedBy: connUser.id,
          reviewedByName: connUser.name
        });
      }
    }
  }

  // UserProfileまたはUserモデルからプロフィール画像を取得
  let userProfileImage = profileImage;
  
  console.log('Trust Map API - Initial profileImage from auth:', profileImage);
  
  if (!userProfileImage) {
    // UserProfileから画像を取得（ObjectIdで検索）
    const ObjectId = mongoose.Types.ObjectId;
    const userProfile = await UserProfile.findOne({ userId: new ObjectId(user.id) });
    console.log('Trust Map API - UserProfile query result:', userProfile ? 'Found' : 'Not found');
    if (userProfile && userProfile.profileImage) {
      userProfileImage = userProfile.profileImage;
      console.log('Trust Map API - Using UserProfile image:', userProfileImage);
    } else {
      // Userモデルから画像を取得
      const currentUserData = await User.findById(user.id);
      console.log('Trust Map API - User query result:', currentUserData ? 'Found' : 'Not found');
      if (currentUserData && currentUserData.image) {
        userProfileImage = currentUserData.image;
        console.log('Trust Map API - Using User model image:', userProfileImage);
      } else {
        userProfileImage = '/default-avatar.png';
        console.log('Trust Map API - Using default avatar');
      }
    }
  }
  
  console.log('Trust Map API - Final userProfileImage:', userProfileImage);

  const me = {
    id: username, // usernameを使用
    odlId: user.id, // MongoDB ObjectIdをシェア用に追加
    name: user.name, // 表示名を追加
    isCenter: true,
    type: "person",
    imageUrl: userProfileImage,
    reviewCount: companies.reduce((a, c) => a + c.reviewCount, 0)
  };

  // テスト用のダミー接続ユーザーを追加（デバッグ用）
  const testConnectedUser = {
    id: "team", // usernameを使用
    type: "person",
    imageUrl: "/uploads/profiles/6909ae6b16dcd402608d0d38_1762396006698.png",
    company: "HackJPN",
    position: "メンバー",
    strength: 5,
    reviewCount: 0 // reviewCountを追加
  };
  
  // connectedUsersが空の場合、テストユーザーを追加
  if (connectedUsers.length === 0) {
    connectedUsers.push(testConnectedUser);
    console.log('⚠️ Added test connected user');
  }
  
  // 企業データを評価者別に分けて送信
  const responseData = { 
    me, 
    companies: companies, // 現在のユーザーが評価した企業
    connectedUsersCompanies: connectedUsersCompanies, // 接続ユーザーが評価した企業
    users: connectedUsers 
  };
  
  console.log('=== Trust Map API - Final Response ===');
  console.log('Me:', me.id, me.imageUrl);
  console.log('User companies count:', responseData.companies.length);
  console.log('Connected user companies count:', responseData.connectedUsersCompanies.length);
  responseData.companies.forEach((company, index) => {
    console.log(`User Company ${index}: ${company.fullName} reviewed by ${company.reviewedBy}`);
  });
  responseData.connectedUsersCompanies.forEach((company, index) => {
    console.log(`Connected Company ${index}: ${company.fullName} reviewed by ${company.reviewedBy}`);
  });
  console.log('Connected users count:', responseData.users.length);
  responseData.users.forEach((user, index) => {
    console.log(`Connected User ${index}:`, user.id, user.type, user.imageUrl);
  });

  return new Response(JSON.stringify(responseData), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});