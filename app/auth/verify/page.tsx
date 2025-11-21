'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Loader2, Mail } from 'lucide-react';
import Link from 'next/link';

export default function VerifyPage() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'expired'>('loading');
  const [message, setMessage] = useState('');
  const searchParams = useSearchParams();
  
  const token = searchParams.get('token');
  const email = searchParams.get('email');

  useEffect(() => {
    if (!token || !email) {
      setStatus('error');
      setMessage('認証リンクが無効です。');
      return;
    }

    verifyEmail(token, email);
  }, [token, email]);

  const verifyEmail = async (token: string, email: string) => {
    try {
      const response = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, email }),
      });

      const data = await response.json();

      if (response.ok) {
        setStatus('success');
        setMessage(data.message || 'メールアドレスが正常に認証されました！');
        
        // 認証成功後、3秒後にダッシュボードへリダイレクト
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 3000);
      } else {
        if (data.error === 'expired') {
          setStatus('expired');
          setMessage('認証リンクの有効期限が切れています。');
        } else {
          setStatus('error');
          setMessage(data.error || '認証に失敗しました。');
        }
      }
    } catch (error) {
      setStatus('error');
      setMessage('認証処理中にエラーが発生しました。');
    }
  };

  const resendVerificationEmail = async () => {
    if (!email) return;

    try {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      if (response.ok) {
        setMessage('認証メールを再送信しました。メールをご確認ください。');
      } else {
        setMessage('メール再送信に失敗しました。');
      }
    } catch (error) {
      setMessage('メール再送信中にエラーが発生しました。');
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'loading':
        return <Loader2 className="w-16 h-16 text-blue-500 animate-spin" />;
      case 'success':
        return <CheckCircle className="w-16 h-16 text-green-500" />;
      case 'error':
      case 'expired':
        return <XCircle className="w-16 h-16 text-red-500" />;
      default:
        return <Mail className="w-16 h-16 text-gray-500" />;
    }
  };

  const getStatusTitle = () => {
    switch (status) {
      case 'loading':
        return 'メールアドレスを認証中...';
      case 'success':
        return '認証完了！';
      case 'error':
        return '認証に失敗しました';
      case 'expired':
        return '認証リンクの期限切れ';
      default:
        return 'メール認証';
    }
  };

  const getActionButton = () => {
    switch (status) {
      case 'success':
        return (
          <div className="space-y-3">
            <p className="text-sm text-green-600 text-center">
              3秒後にダッシュボードへ移動します...
            </p>
            <Link href="/dashboard">
              <Button className="w-full bg-green-600 hover:bg-green-700">
                今すぐダッシュボードへ
              </Button>
            </Link>
          </div>
        );
      case 'expired':
        return (
          <div className="space-y-3">
            <Button 
              onClick={resendVerificationEmail} 
              className="w-full"
              disabled={!email}
            >
              認証メールを再送信
            </Button>
            <Link href="/signup">
              <Button variant="outline" className="w-full">
                新規登録画面に戻る
              </Button>
            </Link>
          </div>
        );
      case 'error':
        return (
          <div className="space-y-3">
            <Link href="/signup">
              <Button className="w-full">
                新規登録画面に戻る
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" className="w-full">
                ログイン画面へ
              </Button>
            </Link>
          </div>
        );
      case 'loading':
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* ヘッダー */}
        <div className="text-center mb-8">
          <Link href="/" className="text-2xl font-bold text-blue-600 mb-4 block">
            Bond
          </Link>
          <p className="text-gray-600">
            スタートアップエコシステムプラットフォーム
          </p>
        </div>

        {/* メイン認証カード */}
        <Card>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              {getStatusIcon()}
            </div>
            <CardTitle className="text-xl">
              {getStatusTitle()}
            </CardTitle>
            <CardDescription>
              {email && (
                <span className="block mt-2 text-sm">
                  メールアドレス: <span className="font-medium">{email}</span>
                </span>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center space-y-4">
              <p className="text-gray-600">
                {message}
              </p>
              
              {getActionButton()}
            </div>
          </CardContent>
        </Card>

        {/* フッター情報 */}
        <div className="mt-6 text-center text-xs text-gray-500">
          <p>
            問題が解決しない場合は、
            <a href="mailto:support@bond.ai" className="text-blue-600 hover:underline">
              サポート
            </a>
            までお問い合わせください。
          </p>
        </div>
      </div>
    </div>
  );
}