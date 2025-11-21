'use client'

import React from "react";
import { Star, Send } from "lucide-react";
import Link from "next/link";

// サンプル評価データ（チャット形式）
const chatMessages = [
  {
    id: "1",
    type: "system",
    message: "Bond評価",
    timestamp: ""
  },
  {
    id: "2",
    type: "user",
    userName: "田中 博史",
    userRole: "スタートアップ創業者",
    userAvatar: "https://i.pravatar.cc/150?img=12",
    rating: 5,
    message: "Bondを通じて素晴らしい投資家の方々とつながることができました。透明性の高い評価システムのおかげで、信頼関係を築きやすく、事業の成長に大きく貢献しています。",
    timestamp: "2024年10月20日 14:30"
  },
  {
    id: "3",
    type: "assistant",
    message: "ありがとうございます！投資家とのマッチングがうまくいったようで何よりです。他にサポートが必要な点はありますか？",
    timestamp: "2024年10月20日 14:32"
  },
  {
    id: "4",
    type: "user",
    userName: "佐藤 美香",
    userRole: "エンジェル投資家",
    userAvatar: "https://i.pravatar.cc/150?img=45",
    rating: 5,
    message: "これまで多くのプラットフォームを使ってきましたが、Bondは特にマッチングの質が高いです。事前の評価システムにより、お互いの期待値を合わせやすく、効率的な投資判断ができています。",
    timestamp: "2024年10月18日 10:15"
  },
  {
    id: "5",
    type: "user",
    userName: "山田 克彦",
    userRole: "メンター",
    userAvatar: "https://i.pravatar.cc/150?img=33",
    rating: 4,
    message: "メンタリング機能が非常に使いやすく、起業家との関係構築がスムーズです。評価の可視化により、適切なアドバイスを提供しやすくなりました。",
    timestamp: "2024年10月15日 16:45"
  },
  {
    id: "6",
    type: "assistant",
    message: "メンタリング機能をご活用いただきありがとうございます。より良い機能改善のため、フィードバックがありましたらぜひお聞かせください。",
    timestamp: "2024年10月15日 16:50"
  },
  {
    id: "7",
    type: "user",
    userName: "李 美智子",
    userRole: "VC パートナー",
    userAvatar: "https://i.pravatar.cc/150?img=47",
    rating: 5,
    message: "Bondの分析機能により、データに基づいた投資判断ができるようになりました。市場トレンドと企業評価の組み合わせが特に価値があります。",
    timestamp: "2024年10月12日 11:20"
  },
  {
    id: "8",
    type: "user",
    userName: "王 明華",
    userRole: "起業家",
    userAvatar: "https://i.pravatar.cc/150?img=23",
    rating: 4,
    message: "Bondのネットワーキング機能のおかげで、業界のキーパーソンとのつながりが大幅に増えました。信頼スコアシステムにより、質の高い関係を築けています。",
    timestamp: "2024年10月10日 09:30"
  }
];

export default function BondEvaluationPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Chat Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-gray-500 hover:text-gray-700">
            ←
          </Link>
          <div className="text-xs text-gray-500">Bond評価</div>
        </div>
      </div>

      {/* Chat Messages Container */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto py-4 px-4">
          <div className="space-y-4">
            {chatMessages.map((msg) => {
              if (msg.type === 'system') {
                return (
                  <div key={msg.id} className="text-center py-2">
                    <div className="text-xs text-gray-500">{msg.message}</div>
                  </div>
                );
              }

              if (msg.type === 'user') {
                return (
                  <div key={msg.id} className="flex justify-end">
                    <div className="max-w-[70%]">
                      <div className="flex items-end gap-2">
                        <div className="flex flex-col items-end">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs text-gray-500">{msg.userName}</span>
                            <span className="text-xs text-gray-400">{msg.userRole}</span>
                          </div>
                          <div className="bg-blue-500 text-white rounded-2xl rounded-br-sm px-4 py-2">
                            <p className="text-sm">{msg.message}</p>
                            {msg.rating && (
                              <div className="flex items-center gap-1 mt-2">
                                {[...Array(5)].map((_, i) => (
                                  <Star 
                                    key={i} 
                                    className={`w-3 h-3 ${i < msg.rating ? 'fill-yellow-300 text-yellow-300' : 'text-blue-300'}`}
                                  />
                                ))}
                              </div>
                            )}
                          </div>
                          <span className="text-xs text-gray-400 mt-1">{msg.timestamp}</span>
                        </div>
                        {msg.userAvatar && (
                          <img
                            src={msg.userAvatar}
                            alt={msg.userName}
                            className="w-8 h-8 rounded-full"
                          />
                        )}
                      </div>
                    </div>
                  </div>
                );
              }

              if (msg.type === 'assistant') {
                return (
                  <div key={msg.id} className="flex justify-start">
                    <div className="max-w-[70%]">
                      <div className="flex items-end gap-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs font-semibold">B</span>
                        </div>
                        <div className="flex flex-col">
                          <div className="bg-gray-100 rounded-2xl rounded-bl-sm px-4 py-2">
                            <p className="text-sm text-gray-800">{msg.message}</p>
                          </div>
                          <span className="text-xs text-gray-400 mt-1">{msg.timestamp}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              }

              return null;
            })}
          </div>
        </div>
      </div>

      {/* Input Area */}
      <div className="bg-white border-t border-gray-200 px-4 py-3">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="メッセージを入力..."
              className="flex-1 bg-gray-100 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button className="p-2 rounded-full hover:bg-gray-100 transition-colors">
              <Send className="w-5 h-5 text-blue-500" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}