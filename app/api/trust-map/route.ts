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

  // companiesコレクションから詳細な会社情報を一括取得
  const slugsAndNames = reviews.flatMap(r => [r._id, r.companyName].filter(Boolean));
  const companiesFromDb = await db.collection("companies").find({
    $or: [
      { slug: { $in: slugsAndNames } },
      { name: { $in: slugsAndNames } }
    ]
  }).toArray();

  // 検索用マップを作成
  const companyMap = new Map();
  companiesFromDb.forEach(c => {
    if (c.slug) companyMap.set(c.slug, c);
    if (c.name) companyMap.set(c.name, c);
  });

  const companyData = reviews.map((r) => {
    // マップから会社を検索
    const company = companyMap.get(r._id) || companyMap.get(r.companyName) || null;

    const fullCompanyName = company?.name || r.companyName || r._id || "Unknown";
    const displayName = fullCompanyName.replace(/^株式会社/, '').trim();
    const slug = company?.slug || r._id;
    const logoUrl = `/api/company-logo/${encodeURIComponent(slug)}`;

    return {
      id: displayName,
      fullName: fullCompanyName,
      type: "org",
      imageUrl: logoUrl,
      reviewCount: r.reviewCount,
      strength: Math.round(r.strength * 10) / 10,
      relationshipType: r.relationshipType ?? 0,
      reviewedBy: username,
      reviewedByName: user.name,
      industry: company?.industry || "未分類",
      description: company?.description || `${fullCompanyName}の評価情報`,
      founded: company?.founded || "不明",
      employees: company?.employees || "不明",
      website: company?.website,
      searchCount: company?.searchCount || 0,
      averageRating: company?.averageRating || r.strength
    };
  });

  const companies = companyData;

  // 接続されたユーザーを取得
  const currentUser = await User.findOne({ email: user.email });
  let connectedUsers: any[] = [];
  let connectedUsersCompanies: any[] = [];

  console.log('Current user:', currentUser ? currentUser.name : 'Not found');

  if (currentUser) {
    // データベースから直接接続を取得
    const connections = await db.collection("connections").find({
      users: currentUser._id,
      status: 'active'
    }).toArray();

    console.log('Found connections:', connections.length);

    // 他のユーザーIDを一括取得
    const otherUserIds = connections
      .map(conn => conn.users.find((id: any) => id.toString() !== currentUser._id.toString()))
      .filter(Boolean);

    if (otherUserIds.length > 0) {
      // ユーザー情報を一括取得
      const otherUsers = await db.collection("users").find({ _id: { $in: otherUserIds } }).toArray();
      const otherUsersMap = new Map(otherUsers.map(u => [u._id.toString(), u]));

      // UserProfile情報を一括取得
      const userProfiles = await db.collection("userprofiles").find({ userId: { $in: otherUserIds } }).toArray();
      const userProfilesMap = new Map(userProfiles.map(p => [p.userId.toString(), p]));

      // 接続情報をマップに
      const connectionStrengthMap = new Map(connections.map(conn => {
        const otherId = conn.users.find((id: any) => id.toString() !== currentUser._id.toString());
        return [otherId?.toString(), conn.strength || 1];
      }));

      for (const otherUserId of otherUserIds) {
        const otherUser = otherUsersMap.get(otherUserId.toString());
        if (!otherUser) continue;

        let userImage = otherUser.image;
        if (!userImage) {
          const userProfile = userProfilesMap.get(otherUserId.toString());
          if (userProfile?.profileImage) {
            userImage = userProfile.profileImage;
          }
        }

        let connectedUsername;
        if (otherUser.email === 'tomura@hackjpn.com') {
          connectedUsername = 'tomura';
        } else if (otherUser.email === 'team@hackjpn.com') {
          connectedUsername = 'team';
        } else if (otherUser.name === 'Hikaru Tomura') {
          connectedUsername = 'hikaru';
        } else {
          connectedUsername = otherUser.email?.split('@')[0] || otherUser.name;
        }

        connectedUsers.push({
          id: connectedUsername,
          name: otherUser.name,
          type: "person",
          imageUrl: userImage || '/default-avatar.png',
          company: otherUser.company,
          position: otherUser.position,
          strength: connectionStrengthMap.get(otherUserId.toString()) || 1,
          userId: otherUser._id.toString(),
          reviewCount: 0
        });
      }
    }

    // 接続ユーザーの評価企業を一括取得
    if (connectedUsers.length > 0) {
      // 全ての接続ユーザーのpossibleUserIdsを生成
      const allPossibleIds: any[] = [];
      const userIdToConnUser = new Map();

      for (const connUser of connectedUsers) {
        const possibleIds = [
          connUser.userId,
          new mongoose.Types.ObjectId(connUser.userId),
          `u_${connUser.id}`,
          ...(connUser.id === 'hikaru' ? ['u_hikaru'] : []),
          ...(connUser.id === 'team' ? ['u_seto', 'seto'] : []),
        ];
        possibleIds.forEach(id => {
          allPossibleIds.push(id);
          userIdToConnUser.set(id.toString(), connUser);
        });
      }

      // 全ての評価を一括取得
      const allUserReviews = await db.collection("evaluations").find({
        userId: { $in: allPossibleIds }
      }).toArray();

      // companySlugとcompanyNameを収集
      const allSlugsAndNames = allUserReviews.flatMap(r => [r.companySlug, r.companyName].filter(Boolean));

      // 企業情報を一括取得
      const connectedCompaniesFromDb = await db.collection("companies").find({
        $or: [
          { slug: { $in: allSlugsAndNames } },
          { name: { $in: allSlugsAndNames } }
        ]
      }).toArray();

      const connectedCompanyMap = new Map();
      connectedCompaniesFromDb.forEach(c => {
        if (c.slug) connectedCompanyMap.set(c.slug, c);
        if (c.name) connectedCompanyMap.set(c.name, c);
      });

      // 評価をユーザーごとにグループ化
      const reviewsByUser = new Map();
      for (const review of allUserReviews) {
        const connUser = userIdToConnUser.get(review.userId?.toString());
        if (!connUser) continue;

        const key = `${connUser.id}_${review.companySlug}`;
        if (!reviewsByUser.has(key)) {
          reviewsByUser.set(key, {
            connUser,
            companySlug: review.companySlug,
            companyName: review.companyName,
            reviewCount: 0,
            totalRating: 0,
            relationshipType: review.relationshipType
          });
        }
        const data = reviewsByUser.get(key);
        data.reviewCount++;
        data.totalRating += review.rating || 0;
      }

      // 結果を生成
      for (const data of reviewsByUser.values()) {
        const company = connectedCompanyMap.get(data.companySlug) || connectedCompanyMap.get(data.companyName);
        const fullCompanyName = data.companyName || data.companySlug || "Unknown";
        const displayName = fullCompanyName.replace(/^株式会社/, '').trim();
        const slug = company?.slug || data.companySlug;
        const logoUrl = `/api/company-logo/${encodeURIComponent(slug)}`;

        connectedUsersCompanies.push({
          id: displayName,
          fullName: fullCompanyName,
          type: "org",
          imageUrl: logoUrl,
          reviewCount: data.reviewCount,
          strength: Math.round((data.totalRating / data.reviewCount) * 10) / 10,
          relationshipType: data.relationshipType ?? 0,
          reviewedBy: data.connUser.id,
          reviewedByName: data.connUser.name
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