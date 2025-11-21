'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Mail, CheckCircle, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      toast.error('メールアドレスを入力してください');
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await response.json();

      if (response.ok) {
        setIsSubmitted(true);
        toast.success(data.message || 'パスワードリセットメールを送信しました');
      } else {
        toast.error(data.error || 'メール送信に失敗しました');
      }
    } catch (error) {
      console.error('Forgot password error:', error);
      toast.error('処理中にエラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
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
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">メール送信完了</h2>
              <p className="text-muted-foreground mb-6 leading-relaxed">
                パスワードリセット用のメールを <strong>{email}</strong> に送信しました。
                <br />
                メール内のリンクをクリックして、新しいパスワードを設定してください。
              </p>
              
              <div className="space-y-3">
                <Link href="/login">
                  <Button className="w-full">
                    ログイン画面に戻る
                  </Button>
                </Link>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setIsSubmitted(false);
                    setEmail('');
                  }}
                  className="w-full"
                >
                  別のメールアドレスで試す
                </Button>
              </div>

              <div className="mt-6 p-4 bg-blue-50 rounded-lg text-left">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium mb-1">メールが届かない場合：</p>
                    <ul className="space-y-1 text-xs">
                      <li>• スパムフォルダを確認してください</li>
                      <li>• 10分程度お待ちください</li>
                      <li>• メールアドレスが正しいか確認してください</li>
                    </ul>
                  </div>
                </div>
              </div>
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
          <Link href="/login" className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-6">
            <ArrowLeft className="w-4 h-4" />
            ログイン画面に戻る
          </Link>
          <h1 className="text-3xl font-serif font-bold text-gray-900 mb-2">
            Bond
          </h1>
          <p className="text-gray-600">
            パスワードをリセット
          </p>
        </div>

        {/* パスワードリセットフォーム */}
        <Card>
          <CardHeader>
            <CardTitle>パスワードを忘れた方</CardTitle>
            <CardDescription>
              登録済みのメールアドレスを入力してください。パスワードリセット用のリンクをお送りします。
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="email">メールアドレス</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full bg-blue-600 hover:bg-blue-700"
                disabled={isLoading}
              >
                {isLoading ? 'メール送信中...' : 'リセットメールを送信'}
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

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                アカウントをお持ちでない方は{' '}
                <Link href="/signup" className="text-blue-600 hover:text-blue-800 font-medium">
                  新規登録
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}