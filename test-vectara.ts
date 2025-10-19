/**
 * Test script to verify Vectara connection and data retrieval
 * Run with: node --loader ts-node/esm test-vectara.ts
 * Or: tsx test-vectara.ts
 */

const VECTARA_CUSTOMER_ID = '242722897';
const VECTARA_CORPUS_ID = '4';
const VECTARA_API_KEY = 'zwt_DneoUYT5gi2dtXegYR9QEWkS4WJ3jEcHd5UnqQ';

async function testVectaraSearch(query: string) {
  console.log('\n🔍 Testing Vectara Search');
  console.log('========================');
  console.log('Query:', query);
  console.log('Customer ID:', VECTARA_CUSTOMER_ID);
  console.log('Corpus ID:', VECTARA_CORPUS_ID);
  console.log('API Key:', VECTARA_API_KEY.substring(0, 20) + '...');

  const baseURL = 'https://api.vectara.io/v1/query';

  const payload = {
    query: [
      {
        query: query,
        num_results: 5, // Get 5 results for testing
        corpus_key: [
          {
            customer_id: VECTARA_CUSTOMER_ID,
            corpus_id: VECTARA_CORPUS_ID
          }
        ]
      }
    ]
  };

  console.log('\n📤 Sending request to:', baseURL);
  console.log('Payload:', JSON.stringify(payload, null, 2));

  try {
    const response = await fetch(baseURL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': VECTARA_API_KEY
      },
      body: JSON.stringify(payload)
    });

    console.log('\n📥 Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Error response:', errorText);
      throw new Error(`Vectara API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('\n✅ Raw Response:', JSON.stringify(data, null, 2));

    // Parse results
    if (data.responseSet && data.responseSet.length > 0) {
      const responseSet = data.responseSet[0];

      console.log('\n📊 Search Results:');
      console.log('==================');

      if (responseSet.response && responseSet.response.length > 0) {
        console.log(`Found ${responseSet.response.length} documents\n`);

        responseSet.response.forEach((result: any, index: number) => {
          console.log(`\n--- Result ${index + 1} ---`);
          console.log('Score:', result.score);
          console.log('Text:', result.text ? result.text.substring(0, 200) + '...' : 'No text');
          console.log('Metadata:', result.metadata || 'None');
          console.log('Document Index:', result.documentIndex || 'N/A');
        });

        return responseSet.response;
      } else {
        console.log('⚠️ No results found in response');
        return [];
      }
    } else {
      console.log('⚠️ No responseSet in data');
      return [];
    }

  } catch (error) {
    console.error('\n❌ Error:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    throw error;
  }
}

// Run tests
async function runTests() {
  console.log('🚀 Starting Vectara Connection Tests\n');

  const testQueries = [
    'What is machine learning?',
    'Tell me about AI',
    'Explain neural networks'
  ];

  for (const query of testQueries) {
    try {
      await testVectaraSearch(query);
      console.log('\n✅ Test passed for query:', query);
    } catch (error) {
      console.error('\n❌ Test failed for query:', query);
    }
    console.log('\n' + '='.repeat(80) + '\n');
  }
}

// Execute
runTests().then(() => {
  console.log('\n🏁 All tests completed');
}).catch((error) => {
  console.error('\n💥 Tests failed:', error);
  process.exit(1);
});
