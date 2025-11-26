import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/auth-middleware';
import connectDB from '@/lib/mongodb';
import UserProfile from '@/models/UserProfile';
import User from '@/models/User';

// GET /api/profile - プロフィール情報を取得
export const GET = requireAuth(async (request: NextRequest, user) => {
  try {
    await connectDB();
    
    const userProfile = await UserProfile.findOne({ userId: user.id });
    const userInfo = await User.findById(user.id).select('-password');
    
    return new Response(
      JSON.stringify({
        success: true,
        profile: {
          user: userInfo,
          profile: userProfile
        }
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
    
  } catch (error) {
    console.error('Get profile error:', error);
    return new Response(
      JSON.stringify({ error: 'プロフィール情報の取得に失敗しました' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
});

// PUT /api/profile - プロフィール情報を更新
export const PUT = requireAuth(async (request: NextRequest, user) => {
  try {
    await connectDB();

    console.log('Profile update request for user:', {
      id: user.id,
      email: user.email,
      name: user.name
    });

    const body = await request.json();
    console.log('Update request body:', body);

    const { bio, website, linkedin, twitter, location, skills, interests, profileImage, username, name } = body;

    // username更新の処理
    if (username !== undefined) {
      // usernameのバリデーション
      const usernameRegex = /^[a-z0-9_]{3,30}$/;
      if (!usernameRegex.test(username)) {
        return new Response(
          JSON.stringify({
            error: 'ユーザーIDは3〜30文字の英小文字、数字、アンダースコアのみ使用できます'
          }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // 重複チェック
      const existingUser = await User.findOne({
        username: username,
        _id: { $ne: user.id }
      });

      if (existingUser) {
        return new Response(
          JSON.stringify({ error: 'このユーザーIDは既に使用されています' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // Userモデルのusernameを更新
      await User.findByIdAndUpdate(user.id, { username });
      console.log('Username updated to:', username);
    }

    // name更新の処理
    if (name !== undefined && name.trim()) {
      await User.findByIdAndUpdate(user.id, { name: name.trim() });
      console.log('Name updated to:', name);
    }
    
    let userProfile = await UserProfile.findOne({ userId: user.id });
    console.log('Existing user profile found:', !!userProfile);
    
    if (!userProfile) {
      console.log('Creating new user profile for user:', user.id);
      userProfile = new UserProfile({
        userId: user.id,
        bio,
        website,
        linkedin,
        twitter,
        location,
        skills: skills || [],
        interests: interests || [],
        profileImage
      });
    } else {
      console.log('Updating existing user profile');
      if (bio !== undefined) userProfile.bio = bio;
      if (website !== undefined) userProfile.website = website;
      if (linkedin !== undefined) userProfile.linkedin = linkedin;
      if (twitter !== undefined) userProfile.twitter = twitter;
      if (location !== undefined) userProfile.location = location;
      if (skills !== undefined) userProfile.skills = skills;
      if (interests !== undefined) userProfile.interests = interests;
      if (profileImage !== undefined) userProfile.profileImage = profileImage;
    }
    
    const savedProfile = await userProfile.save();
    console.log('Profile saved successfully:', savedProfile._id);
    
    return new Response(
      JSON.stringify({
        success: true,
        message: 'プロフィールを更新しました',
        profile: userProfile
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
    
  } catch (error) {
    console.error('Update profile error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'プロフィールの更新に失敗しました',
        details: error.message 
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
});