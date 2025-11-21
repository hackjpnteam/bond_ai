type Props = { params: { id: string } };

export default async function CompanyPage({ params }: Props) {
  const name = decodeURIComponent(params.id);
  // TODO: name から companies を検索して詳細を出す
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">{name}</h1>
      {/* 会社の評価カードやレビュー一覧をここに */}
      <div className="mt-4 p-4 bg-gray-50 rounded">
        <p className="text-gray-600">会社詳細ページの実装は今後予定されています。</p>
        <p className="text-sm text-gray-500 mt-2">
          会社名: {name}
        </p>
      </div>
    </div>
  );
}