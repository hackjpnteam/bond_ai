/**
 * ロゴ画像パスのフォールバック機能をテスト
 */

import { existsSync } from 'fs';
import { join } from 'path';

// APIで使用する関数と同じロジック
function getCompanyLogoUrl(companySlug: string): string {
  const logoPath = `/logos/${companySlug}.png`;
  const fullPath = join(process.cwd(), 'public', logoPath);

  if (existsSync(fullPath)) {
    return logoPath;
  }

  return '/default-company.png';
}

console.log('🧪 ロゴ画像パスのフォールバックテスト\n');

const testCases = [
  'hackjpn',       // 存在する
  'sopital',       // 存在する
  'ギグー',        // 存在する
  'nvidia',        // 存在しない
  'pokemon',       // 存在しない
  '戸村商店',      // 存在しない
  '戸村光',        // 存在しない
];

console.log('テスト対象のロゴ:\n');

testCases.forEach(slug => {
  const result = getCompanyLogoUrl(slug);
  const exists = result !== '/default-company.png';
  const icon = exists ? '✅' : '🔄';

  console.log(`${icon} ${slug.padEnd(15)} → ${result}`);
});

console.log('\n📁 public/logos/ の実際のファイル:\n');
const logosDir = join(process.cwd(), 'public', 'logos');
if (existsSync(logosDir)) {
  const fs = require('fs');
  const files = fs.readdirSync(logosDir);
  files.forEach((file: string) => {
    console.log(`   - ${file}`);
  });
}

console.log('\n✅ テスト完了！');
console.log('存在しないロゴは /default-company.png にフォールバックされます。');
