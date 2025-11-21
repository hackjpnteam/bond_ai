'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CheckCircle, XCircle, Loader2, Lock, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<'loading' | 'valid' | 'invalid' | 'success'>('loading');
  const [message, setMessage] = useState('');

  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const email = searchParams.get('email');

  useEffect(() => {
    if (!token || !email) {
      setStatus('invalid');
      setMessage('無効なパスワードリセットリンクです。');
      return;
    }

    verifyResetToken();
  }, [token, email]);

  const verifyResetToken = async () => {
    try {
      const response = await fetch('/api/auth/verify-reset-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, email }),
      });

      if (response.ok) {
        setStatus('valid');
        setMessage('新しいパスワードを設定してください。');
      } else {
        const data = await response.json();
        setStatus('invalid');
        setMessage(data.error || 'リセットトークンが無効または期限切れです。');
      }
    } catch (error) {
      setStatus('invalid');
      setMessage('トークン検証中にエラーが発生しました。');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error('パスワードが一致しません');
      return;
    }

    if (password.length < 6) {
      toast.error('パスワードは6文字以上で入力してください');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          email,
          password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setStatus('success');
        setMessage('パスワードが正常にリセットされました！');
        toast.success('パスワードがリセットされました');
        
        // 3秒後にログインページへリダイレクト
        setTimeout(() => {
          window.location.href = '/login?message=password-reset-success';
        }, 3000);
      } else {
        toast.error(data.error || 'パスワードリセットに失敗しました');
      }
    } catch (error) {
      console.error('Reset password error:', error);
      toast.error('パスワードリセット中にエラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'loading':
        return <Loader2 className="w-16 h-16 text-blue-500 animate-spin" />;
      case 'valid':
        return <Lock className="w-16 h-16 text-blue-500" />;
      case 'success':
        return <CheckCircle className="w-16 h-16 text-green-500" />;
      case 'invalid':
        return <XCircle className="w-16 h-16 text-red-500" />;
      default:
        return <Lock className="w-16 h-16 text-gray-500" />;
    }
  };

  const getStatusTitle = () => {
    switch (status) {
      case 'loading':
        return 'トークンを検証中...';
      case 'valid':
        return 'パスワードをリセット';
      case 'success':
        return 'リセット完了！';
      case 'invalid':
        return 'リンクが無効です';
      default:
        return 'パスワードリセット';
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Card>
            <CardContent className="p-8 text-center">
              {getStatusIcon()}
              <h2 className="text-xl font-semibold mt-4 mb-2">{getStatusTitle()}</h2>
              <p className="text-muted-foreground">しばらくお待ちください...</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (status === 'invalid') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <Link href="/" className="text-2xl font-bold text-blue-600 mb-4 block">
              Bond
            </Link>
          </div>

          <Card>
            <CardContent className="p-8 text-center">
              {getStatusIcon()}
              <h2 className="text-xl font-semibold mt-4 mb-2">{getStatusTitle()}</h2>
              <p className="text-muted-foreground mb-6">{message}</p>
              
              <div className="space-y-3">
                <Link href="/forgot-password">
                  <Button className="w-full">
                    パスワードリセットを再実行
                  </Button>
                </Link>
                <Link href="/login">
                  <Button variant="outline" className="w-full">
                    ログイン画面に戻る
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <Link href="/" className="text-2xl font-bold text-blue-600 mb-4 block">
              Bond
            </Link>
          </div>

          <Card>
            <CardContent className="p-8 text-center">
              {getStatusIcon()}
              <h2 className="text-xl font-semibold mt-4 mb-2">{getStatusTitle()}</h2>
              <p className="text-muted-foreground mb-4">{message}</p>
              <p className="text-sm text-green-600 mb-6">
                3秒後にログインページへ移動します...
              </p>
              
              <Link href="/login">
                <Button className="w-full bg-green-600 hover:bg-green-700">
                  今すぐログインページへ
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* ヘッダー */}
        <div className="text-center mb-8">
          <Link href="/" className="text-2xl font-bold text-blue-600 mb-4 block">
            Bond
          </Link>
          <p className="text-gray-600">
            新しいパスワードを設定
          </p>
        </div>

        {/* パスワードリセットフォーム */}
        <Card>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              {getStatusIcon()}
            </div>
            <CardTitle>{getStatusTitle()}</CardTitle>
            <CardDescription>
              {email && (
                <span className="block mt-2 text-sm">
                  アカウント: <span className="font-medium">{email}</span>
                </span>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="password">新しいパスワード</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="6文字以上"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <Label htmlFor="confirmPassword">パスワード確認</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="パスワードを再入力"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-10 pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* パスワード強度インジケーター */}
              <div className="space-y-2">
                <div className="text-xs text-muted-foreground">パスワード要件:</div>
                <div className="space-y-1 text-xs">
                  <div className={`flex items-center gap-2 ${password.length >= 6 ? 'text-green-600' : 'text-gray-400'}`}>
                    <div className={`w-2 h-2 rounded-full ${password.length >= 6 ? 'bg-green-600' : 'bg-gray-300'}`} />
                    6文字以上
                  </div>
                  <div className={`flex items-center gap-2 ${password === confirmPassword && password.length > 0 ? 'text-green-600' : 'text-gray-400'}`}>
                    <div className={`w-2 h-2 rounded-full ${password === confirmPassword && password.length > 0 ? 'bg-green-600' : 'bg-gray-300'}`} />
                    パスワードが一致
                  </div>
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full bg-blue-600 hover:bg-blue-700"
                disabled={isLoading || password.length < 6 || password !== confirmPassword}
              >
                {isLoading ? 'パスワードリセット中...' : 'パスワードをリセット'}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                パスワードを思い出しましたか？{' '}
                <Link href="/login" className="text-blue-600 hover:text-blue-800 font-medium">
                  ログイン
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}