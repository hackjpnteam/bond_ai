// ユーザー表示名のマッピング関数
export function getUserDisplayName(userId: string | undefined | null): string {
  if (!userId) return '匿名ユーザー';
  
  // 特定のユーザーの実名マッピング
  const userNameMap: Record<string, string> = {
    'u_hikaru': 'Hikaru Tomura',
    'u_akira': 'Akira Sato',
    'u_mika': 'Mika Tanaka',
    'u_kim': 'Kim Lee',
    // 将来的に他のユーザーも追加可能
  };
  
  // マッピングされた名前があれば返す
  if (userNameMap[userId]) {
    return userNameMap[userId];
  }
  
  // user_ で始まる場合は匿名ユーザーとして扱う
  if (userId.includes('user_')) {
    return '匿名ユーザー';
  }
  
  // その他の場合はそのまま返す
  return userId;
}

// ユーザープロフィール画像を取得する関数
export function getUserProfileImage(userId: string | undefined | null): string {
  if (!userId) return '/avatar5.png';
  
  // 特定のユーザーのプロフィール画像マッピング
  const userImageMap: Record<string, string> = {
    'u_hikaru': '/uploads/profiles/6907dd732c1f7abff64f0667_1762234281780.png',
    'u_akira': '/avatar5.png',
    'u_mika': '/avatar5.png', 
    'u_kim': '/avatar5.png',
  };
  
  // マッピングされた画像があれば返す
  if (userImageMap[userId]) {
    return userImageMap[userId];
  }
  
  // デフォルトアバター
  return '/avatar5.png';
}

// 投稿が匿名かどうかを判定する関数
export function isAnonymousUser(userId: string | undefined | null): boolean {
  if (!userId) return true;
  
  // user_ で始まる場合は匿名
  if (userId.includes('user_')) {
    return true;
  }
  
  // 特定のユーザーマッピングがある場合は実名
  const userNameMap: Record<string, string> = {
    'u_hikaru': 'Hikaru Tomura',
    'u_akira': 'Akira Sato',
    'u_mika': 'Mika Tanaka',
    'u_kim': 'Kim Lee',
  };
  
  return !userNameMap[userId];
}