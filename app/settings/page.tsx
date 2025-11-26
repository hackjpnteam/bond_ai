'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ArrowLeft, User, Bell, Shield, Palette, Globe, Save, X } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { useAuth } from '@/lib/auth'
import ProfileImageUpload from '@/components/ProfileImageUpload'

export default function SettingsPage() {
  const { user } = useAuth()
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [pushNotifications, setPushNotifications] = useState(false)
  const [marketingEmails, setMarketingEmails] = useState(false)
  const [profileVisibility, setProfileVisibility] = useState('public')
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [language, setLanguage] = useState('ja')
  const [timezone, setTimezone] = useState('JST')
  
  // Form states for user profile
  const [name, setName] = useState('')
  const [username, setUsername] = useState('')
  const [usernameError, setUsernameError] = useState('')
  const [email, setEmail] = useState('')
  const [bio, setBio] = useState('')
  const [company, setCompany] = useState('')
  const [position, setPosition] = useState('')
  const [profileImage, setProfileImage] = useState('')
  const [interests, setInterests] = useState<string[]>([])
  const [skills, setSkills] = useState<string[]>([])
  const [interestInput, setInterestInput] = useState('')
  const [skillInput, setSkillInput] = useState('')
  const [loading, setLoading] = useState(false)

  // Load user data when component mounts
  useEffect(() => {
    if (user) {
      console.log('Settings page user data:', user); // デバッグログ
      setName(user.name || '')
      setUsername(user.username || '')
      setEmail(user.email || '')
      setCompany(user.company || '')
      // Set position based on role
      setPosition(user.role === 'founder' ? 'Founder' : 
                 user.role === 'investor' ? 'Investor' : 
                 user.role === 'employee' ? 'Employee' : 
                 user.role === 'advisor' ? 'Advisor' : 'Other')
      
      // Load profile data including image
      loadProfileData()
    } else {
      // デフォルトユーザー（認証されていない場合）
      setName('hackjpn')
      setEmail('hackjpn@example.com')
      setCompany('HackJPN')
      setPosition('Developer')
    }
  }, [user])

  const loadProfileData = async () => {
    try {
      const response = await fetch('/api/profile', {
        credentials: 'include'
      })

      if (response.ok) {
        const data = await response.json()
        // ユーザー情報からusernameを取得
        if (data.success && data.profile.user) {
          const userData = data.profile.user
          if (userData.username) {
            setUsername(userData.username)
          }
          if (userData.name) {
            setName(userData.name)
          }
        }
        // プロフィール情報を取得
        if (data.success && data.profile.profile) {
          const profile = data.profile.profile
          setBio(profile.bio || '')
          setProfileImage(profile.profileImage || '')
          setInterests(profile.interests || [])
          setSkills(profile.skills || [])
        }
      }
    } catch (error) {
      console.error('Failed to load profile data:', error)
    }
  }

  const addInterest = () => {
    const value = interestInput.trim()
    if (!value) return
    if (interests.includes(value)) {
      setInterestInput('')
      return
    }
    setInterests(prev => [...prev, value])
    setInterestInput('')
  }

  const removeInterest = (value: string) => {
    setInterests(prev => prev.filter(item => item !== value))
  }

  const addSkill = () => {
    const value = skillInput.trim()
    if (!value) return
    if (skills.includes(value)) {
      setSkillInput('')
      return
    }
    setSkills(prev => [...prev, value])
    setSkillInput('')
  }

  const removeSkill = (value: string) => {
    setSkills(prev => prev.filter(item => item !== value))
  }

  const validateUsername = (value: string) => {
    if (!value) {
      setUsernameError('ユーザーIDは必須です')
      return false
    }
    if (value.length < 3) {
      setUsernameError('3文字以上で入力してください')
      return false
    }
    if (value.length > 30) {
      setUsernameError('30文字以下で入力してください')
      return false
    }
    if (!/^[a-z0-9_]+$/.test(value)) {
      setUsernameError('英小文字、数字、アンダースコアのみ使用できます')
      return false
    }
    setUsernameError('')
    return true
  }

  const handleUsernameChange = (value: string) => {
    const normalized = value.toLowerCase().replace(/[^a-z0-9_]/g, '')
    setUsername(normalized)
    if (normalized) {
      validateUsername(normalized)
    } else {
      setUsernameError('')
    }
  }

  const handleSaveProfile = async () => {
    // usernameのバリデーション
    if (username && !validateUsername(username)) {
      toast.error(usernameError || 'ユーザーIDが無効です')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          name,
          username,
          bio,
          profileImage,
          interests,
          skills
        })
      })

      if (response.ok) {
        toast.success('プロフィール設定を保存しました')
      } else {
        const data = await response.json()
        toast.error(data.error || '保存に失敗しました')
      }
    } catch (error) {
      console.error('Save profile error:', error)
      toast.error('保存中にエラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  const handleImageUpdate = (newImageUrl: string) => {
    setProfileImage(newImageUrl)
    toast.success('プロフィール画像を更新しました')
  }

  const handleSaveNotifications = () => {
    toast.success('通知設定を保存しました')
  }

  const handleSavePrivacy = () => {
    toast.success('プライバシー設定を保存しました')
  }

  const handleSaveAppearance = () => {
    // ダークモードの適用
    if (isDarkMode) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('darkMode', 'true')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('darkMode', 'false')
    }
    
    // 言語設定の保存
    localStorage.setItem('language', language)
    
    // タイムゾーン設定の保存
    localStorage.setItem('timezone', timezone)
    
    toast.success('外観設定を保存しました')
  }

  // 初期化時に保存された設定を読み込む
  useEffect(() => {
    const savedDarkMode = localStorage.getItem('darkMode') === 'true'
    const savedLanguage = localStorage.getItem('language') || 'ja'
    const savedTimezone = localStorage.getItem('timezone') || 'JST'
    
    setIsDarkMode(savedDarkMode)
    setLanguage(savedLanguage)
    setTimezone(savedTimezone)
    
    // ダークモードの適用
    if (savedDarkMode) {
      document.documentElement.classList.add('dark')
    }
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-ash-surface/30">
      {/* Header */}
      <div className="bg-white border-b border-ash-line">
        <div className="container-narrow mx-auto px-4 py-6">
          <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-4">
            <ArrowLeft className="w-4 h-4" />
            マイページに戻る
          </Link>
          <h1 className="text-3xl font-serif font-bold text-gray-900 mb-2">
            設定
          </h1>
          <p className="text-gray-600">
            アカウントとアプリケーションの設定を管理
          </p>
        </div>
      </div>

      <div className="container-narrow mx-auto px-4 py-8">
        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="profile">プロフィール</TabsTrigger>
            <TabsTrigger value="notifications">通知</TabsTrigger>
            <TabsTrigger value="privacy">プライバシー</TabsTrigger>
            <TabsTrigger value="appearance">外観</TabsTrigger>
          </TabsList>

          {/* プロフィール設定 */}
          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  プロフィール設定
                </CardTitle>
                <CardDescription>
                  公開プロフィール情報を編集します
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Profile Image Upload */}
                <div className="flex flex-col items-center gap-4 p-6 border rounded-lg bg-gray-50">
                  <ProfileImageUpload 
                    currentImage={profileImage}
                    onImageUpdate={handleImageUpdate}
                    size="lg"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">表示名</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="表示名を入力"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="username">ユーザーID</Label>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">@</span>
                    <Input
                      id="username"
                      value={username}
                      onChange={(e) => handleUsernameChange(e.target.value)}
                      placeholder="username"
                      className={usernameError ? 'border-red-500' : ''}
                    />
                  </div>
                  {usernameError && (
                    <p className="text-sm text-red-500">{usernameError}</p>
                  )}
                  <p className="text-xs text-gray-500">
                    プロフィールURL: bond.giving/users/{username || 'username'}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">メールアドレス</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="メールアドレス"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bio">自己紹介</Label>
                  <textarea 
                    id="bio" 
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md min-h-[100px]"
                    placeholder="あなたについて教えてください..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company">所属企業</Label>
                  <Input 
                    id="company" 
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    placeholder="企業名" 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="position">役職</Label>
                  <Input 
                    id="position" 
                    value={position}
                    onChange={(e) => setPosition(e.target.value)}
                    placeholder="役職" 
                  />
                </div>
                <div className="space-y-2">
                  <Label>興味分野</Label>
                  <div className="flex flex-wrap gap-2">
                    {interests.length === 0 && (
                      <span className="text-xs text-muted-foreground">まだ追加されていません</span>
                    )}
                    {interests.map((interest) => (
                      <span
                        key={interest}
                        className="inline-flex items-center gap-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 px-3 py-1 text-xs"
                      >
                        {interest}
                        <button
                          type="button"
                          className="text-blue-500 hover:text-blue-700"
                          onClick={() => removeInterest(interest)}
                          aria-label={`${interest}を削除`}
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      value={interestInput}
                      onChange={(e) => setInterestInput(e.target.value)}
                      placeholder="例: スタートアップ"
                    />
                    <Button type="button" variant="outline" onClick={addInterest}>
                      追加
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>得意分野 / スキル</Label>
                  <div className="flex flex-wrap gap-2">
                    {skills.length === 0 && (
                      <span className="text-xs text-muted-foreground">まだ追加されていません</span>
                    )}
                    {skills.map((skill) => (
                      <span
                        key={skill}
                        className="inline-flex items-center gap-1 rounded-full bg-purple-50 text-purple-700 border border-purple-200 px-3 py-1 text-xs"
                      >
                        {skill}
                        <button
                          type="button"
                          className="text-purple-500 hover:text-purple-700"
                          onClick={() => removeSkill(skill)}
                          aria-label={`${skill}を削除`}
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      value={skillInput}
                      onChange={(e) => setSkillInput(e.target.value)}
                      placeholder="例: ファンドレイズ"
                    />
                    <Button type="button" variant="outline" onClick={addSkill}>
                      追加
                    </Button>
                  </div>
                </div>
                <Button onClick={handleSaveProfile} className="w-full" disabled={loading}>
                  <Save className="w-4 h-4 mr-2" />
                  {loading ? '保存中...' : '保存'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 通知設定 */}
          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="w-5 h-5" />
                  通知設定
                </CardTitle>
                <CardDescription>
                  通知の受信方法をカスタマイズします
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">メール通知</p>
                    <p className="text-sm text-gray-500">重要な更新をメールで受け取る</p>
                  </div>
                  <input 
                    type="checkbox"
                    checked={emailNotifications}
                    onChange={(e) => setEmailNotifications(e.target.checked)}
                    className="h-4 w-4"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">プッシュ通知</p>
                    <p className="text-sm text-gray-500">ブラウザのプッシュ通知を有効にする</p>
                  </div>
                  <input 
                    type="checkbox"
                    checked={pushNotifications}
                    onChange={(e) => setPushNotifications(e.target.checked)}
                    className="h-4 w-4"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">マーケティングメール</p>
                    <p className="text-sm text-gray-500">新機能やプロモーションの情報を受け取る</p>
                  </div>
                  <input 
                    type="checkbox"
                    checked={marketingEmails}
                    onChange={(e) => setMarketingEmails(e.target.checked)}
                    className="h-4 w-4"
                  />
                </div>
                <div className="border-t pt-4">
                  <h4 className="font-medium mb-3">通知を受け取るイベント</h4>
                  <div className="space-y-3">
                    <label className="flex items-center">
                      <input type="checkbox" defaultChecked className="mr-2" />
                      新しいレビューが投稿されたとき
                    </label>
                    <label className="flex items-center">
                      <input type="checkbox" defaultChecked className="mr-2" />
                      評価した企業に更新があったとき
                    </label>
                    <label className="flex items-center">
                      <input type="checkbox" className="mr-2" />
                      フォローされたとき
                    </label>
                    <label className="flex items-center">
                      <input type="checkbox" defaultChecked className="mr-2" />
                      バッジを獲得したとき
                    </label>
                  </div>
                </div>
                <Button onClick={handleSaveNotifications} className="w-full">
                  <Save className="w-4 h-4 mr-2" />
                  保存
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* プライバシー設定 */}
          <TabsContent value="privacy">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  プライバシー設定
                </CardTitle>
                <CardDescription>
                  プロフィールの公開範囲を管理します
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label className="mb-3 block">プロフィールの公開範囲</Label>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input 
                        type="radio" 
                        name="visibility" 
                        value="public"
                        checked={profileVisibility === 'public'}
                        onChange={(e) => setProfileVisibility(e.target.value)}
                        className="mr-2" 
                      />
                      <div>
                        <p className="font-medium">公開</p>
                        <p className="text-sm text-gray-500">誰でもプロフィールを閲覧できます</p>
                      </div>
                    </label>
                    <label className="flex items-center">
                      <input 
                        type="radio" 
                        name="visibility" 
                        value="connections"
                        checked={profileVisibility === 'connections'}
                        onChange={(e) => setProfileVisibility(e.target.value)}
                        className="mr-2" 
                      />
                      <div>
                        <p className="font-medium">接続済みユーザーのみ</p>
                        <p className="text-sm text-gray-500">接続したユーザーのみ閲覧可能</p>
                      </div>
                    </label>
                    <label className="flex items-center">
                      <input 
                        type="radio" 
                        name="visibility" 
                        value="private"
                        checked={profileVisibility === 'private'}
                        onChange={(e) => setProfileVisibility(e.target.value)}
                        className="mr-2" 
                      />
                      <div>
                        <p className="font-medium">非公開</p>
                        <p className="text-sm text-gray-500">自分のみ閲覧可能</p>
                      </div>
                    </label>
                  </div>
                </div>
                <div className="border-t pt-4">
                  <h4 className="font-medium mb-3">データ管理</h4>
                  <div className="space-y-3">
                    <Button variant="outline" className="w-full">
                      データをエクスポート
                    </Button>
                    <Button variant="outline" className="w-full text-red-600 hover:text-red-700">
                      アカウントを削除
                    </Button>
                  </div>
                </div>
                <Button onClick={handleSavePrivacy} className="w-full">
                  <Save className="w-4 h-4 mr-2" />
                  保存
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 外観設定 */}
          <TabsContent value="appearance">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="w-5 h-5" />
                  外観設定
                </CardTitle>
                <CardDescription>
                  アプリケーションの見た目をカスタマイズします
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">ダークモード</p>
                    <p className="text-sm text-gray-500">暗いテーマを使用する</p>
                  </div>
                  <input 
                    type="checkbox"
                    checked={isDarkMode}
                    onChange={(e) => setIsDarkMode(e.target.checked)}
                    className="h-4 w-4"
                  />
                </div>
                <div>
                  <Label className="mb-3 block">言語</Label>
                  <select 
                    className="w-full px-3 py-2 border rounded-md"
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                  >
                    <option value="ja">日本語</option>
                    <option value="en">English</option>
                    <option value="zh">中文</option>
                    <option value="ko">한국어</option>
                  </select>
                </div>
                <div>
                  <Label className="mb-3 block">タイムゾーン</Label>
                  <select 
                    className="w-full px-3 py-2 border rounded-md"
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                  >
                    <option value="JST">日本標準時 (JST)</option>
                    <option value="UTC">協定世界時 (UTC)</option>
                    <option value="PST">太平洋標準時 (PST)</option>
                    <option value="EST">東部標準時 (EST)</option>
                  </select>
                </div>
                <Button onClick={handleSaveAppearance} className="w-full">
                  <Save className="w-4 h-4 mr-2" />
                  保存
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
