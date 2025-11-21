/**
 * Test script for User Profile API with new relationship system
 * Tests that the API correctly returns relationshipType and relationshipLabel
 */

async function testUserAPI() {
  console.log('🧪 Testing User Profile API with new relationship system\n');

  const testEmails = [
    'team@hackjpn.com',
    'tomura@hackjpn.com',
    'tomtysmile5017@gmail.com'
  ];

  for (const email of testEmails) {
    console.log(`📧 Testing user: ${email}`);

    try {
      const response = await fetch(`http://localhost:3002/api/users/${email}`);

      if (!response.ok) {
        console.log(`   ❌ Failed: ${response.status} ${response.statusText}\n`);
        continue;
      }

      const data = await response.json();

      if (!data.success) {
        console.log(`   ❌ API returned error: ${data.error}\n`);
        continue;
      }

      const user = data.user;
      console.log(`   ✅ User found: ${user.name}`);
      console.log(`   📊 Company relationships: ${user.companyRelationships?.length || 0}`);

      if (user.companyRelationships && user.companyRelationships.length > 0) {
        console.log('\n   📋 Relationship data structure:');
        const first = user.companyRelationships[0];
        console.log(`      - companyName: ${first.companyName}`);
        console.log(`      - relationshipType: ${first.relationshipType} (number)`);
        console.log(`      - relationshipLabel: ${first.relationshipLabel} (string)`);
        console.log(`      - relationshipSource: ${first.relationshipSource}`);

        // Verify new system fields
        const hasType = typeof first.relationshipType === 'number';
        const hasLabel = typeof first.relationshipLabel === 'string';

        if (hasType && hasLabel) {
          console.log(`   ✅ New relationship system verified!`);
        } else {
          console.log(`   ❌ Missing new system fields`);
        }

        // Check relationship type mapping
        const validTypes = [0, 1, 2, 3, 4];
        const validLabels = ['未設定', '知人', '取引先', '協業先', '投資家'];

        for (const rel of user.companyRelationships) {
          if (!validTypes.includes(rel.relationshipType)) {
            console.log(`   ⚠️  Invalid relationshipType: ${rel.relationshipType}`);
          }
          if (!validLabels.includes(rel.relationshipLabel)) {
            console.log(`   ⚠️  Invalid relationshipLabel: ${rel.relationshipLabel}`);
          }
        }
      }

      console.log('');

    } catch (error) {
      console.log(`   ❌ Error: ${error}\n`);
    }
  }

  console.log('✅ All tests completed!');
}

testUserAPI();
