/**
 * 新しい関係性システムのテスト
 *
 * 実行方法: npx tsx scripts/test-relationship-system.ts
 */

import { getRelationshipLabel, getRelationshipColor, RELATIONSHIP_OPTIONS, RELATIONSHIP_TYPES } from '../lib/relationship';

console.log('=== 新しい関係性システムのテスト ===\n');

// テスト1: 全ての関係性タイプ
console.log('テスト1: 全ての関係性タイプ');
console.log('────────────────────────────');
for (const option of RELATIONSHIP_OPTIONS) {
  const label = getRelationshipLabel(option.value);
  const color = getRelationshipColor(option.value);
  console.log(`値: ${option.value} → ラベル: ${label} (期待値: ${option.label})`);
  console.log(`  カラー: ${color}`);
  console.log(`  一致: ${label === option.label ? '✅' : '❌'}`);
  console.log();
}

// テスト2: エッジケース
console.log('\nテスト2: エッジケース');
console.log('────────────────────────────');
console.log('null:', getRelationshipLabel(null));
console.log('undefined:', getRelationshipLabel(undefined));
console.log('範囲外の値 (-1):', getRelationshipLabel(-1));
console.log('範囲外の値 (999):', getRelationshipLabel(999));
console.log();

// テスト3: 定数の確認
console.log('\nテスト3: 定数の確認');
console.log('────────────────────────────');
console.log('RELATIONSHIP_TYPES:', RELATIONSHIP_TYPES);
console.log();

// テスト4: フォーム選択肢
console.log('\nテスト4: フォーム選択肢');
console.log('────────────────────────────');
RELATIONSHIP_OPTIONS.forEach(option => {
  console.log(`<option value="${option.value}">${option.label}</option>`);
});
console.log();

// テスト5: API レスポンス形式のシミュレーション
console.log('\nテスト5: API レスポンスシミュレーション');
console.log('────────────────────────────');
const mockEvaluation = {
  relationshipType: 4,
  relationshipLabel: getRelationshipLabel(4)
};
console.log('評価オブジェクト:', mockEvaluation);
console.log('表示ラベル:', mockEvaluation.relationshipLabel);
console.log('期待値: 投資家');
console.log(`結果: ${mockEvaluation.relationshipLabel === '投資家' ? '✅ PASS' : '❌ FAIL'}`);
console.log();

// 全てのテストケース
const testCases = [
  { input: 0, expected: '未設定' },
  { input: 1, expected: '知人' },
  { input: 2, expected: '取引先' },
  { input: 3, expected: '協業先' },
  { input: 4, expected: '投資家' },
  { input: null, expected: '未設定' },
  { input: undefined, expected: '未設定' }
];

console.log('\nテスト6: 全テストケース');
console.log('────────────────────────────');
let passCount = 0;
let failCount = 0;

testCases.forEach(test => {
  const result = getRelationshipLabel(test.input as any);
  const pass = result === test.expected;

  if (pass) passCount++;
  else failCount++;

  const inputStr = String(test.input).padEnd(10);
  const resultStr = result.padEnd(10);
  const status = pass ? '✅' : '❌';

  console.log(`${status} 入力: ${inputStr} → 結果: ${resultStr} (期待値: ${test.expected})`);
});

console.log();
console.log('────────────────────────────');
console.log(`成功: ${passCount}/${testCases.length}`);
console.log(`失敗: ${failCount}/${testCases.length}`);
console.log();

if (failCount === 0) {
  console.log('🎉 全てのテストが成功しました！');
} else {
  console.log('⚠️  いくつかのテストが失敗しました');
  process.exit(1);
}
