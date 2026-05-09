/**
 * test-shadowlens.ts
 *
 * Quick test of ShadowLens HTTP precompile encoding and X API integration.
 * Run with: npm run test:shadowlens
 */

import {
  encodeHttpCallRequest,
  buildXApiRequest,
  getHttpExecutorAddress,
  ritualChain,
} from './shadowlens-http-precompile.js';
import { analyzeXHandle } from './example-workflow.js';
import { createPublicClient, http } from 'viem';
import * as dotenv from 'dotenv';

dotenv.config();

async function testHttpPrecompileEncoding() {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🧪 Test 1: HTTP Precompile Request Encoding');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  try {
    const executorAddress = '0x1234567890123456789012345678901234567890';
    const xApiRequest = buildXApiRequest('elonmusk', 'Bearer test_token', executorAddress);

    console.log('📋 X API Request Built:');
    console.log(`   URL: ${xApiRequest.url}`);
    console.log(`   Method: ${xApiRequest.method === 0 ? 'GET' : 'POST'}`);
    console.log(`   Headers: ${xApiRequest.headers.length} headers`);
    console.log(`   Executor: ${xApiRequest.executor}`);
    console.log(`   Timeout: ${xApiRequest.timeout}s\n`);

    const encoded = encodeHttpCallRequest(xApiRequest);
    console.log(`✅ Encoded Request (hex): ${encoded.slice(0, 100)}...`);
    console.log(`   Length: ${(encoded.length - 2) / 2} bytes\n`);
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

async function testExecutorDiscovery() {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🧪 Test 2: Executor Discovery from TEEServiceRegistry');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  try {
    const publicClient = createPublicClient({
      chain: ritualChain,
      transport: http(),
    });

    console.log('🔍 Querying TEEServiceRegistry for HTTP executors...\n');
    const executorAddress = await getHttpExecutorAddress(publicClient);

    console.log(`✅ Found HTTP Executor: ${executorAddress}\n`);
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

async function testXApiAnalysis() {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🧪 Test 3: X API Analysis (Requires X API Token)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const bearerToken = process.env.X_API_BEARER_TOKEN;
  if (!bearerToken) {
    console.warn('⚠️  Skipping: X_API_BEARER_TOKEN not set in .env\n');
    return;
  }

  try {
    const handle = 'elonmusk';
    console.log(`📊 Analyzing @${handle}...\n`);

    const analysis = await analyzeXHandle(handle, bearerToken);

    console.log('✅ Analysis Results:');
    console.log(`   Risk Level: ${['Unknown', 'Low', 'Medium', 'High'][analysis.riskLevel]}`);
    console.log(`   Engagement: ${analysis.engagementHealth}`);
    console.log(`   Posting Pattern: ${analysis.postingPattern}`);
    console.log(`   Content Risk: ${analysis.contentRisk}`);
    console.log(`   Suggestions: ${analysis.suggestedFixes}\n`);
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

async function runTests() {
  console.log('\n╔═══════════════════════════════════════════════════╗');
  console.log('║    ShadowLens X API Integration Test Suite        ║');
  console.log('╚═══════════════════════════════════════════════════╝');

  await testHttpPrecompileEncoding();
  await testExecutorDiscovery();
  await testXApiAnalysis();

  console.log('\n╔═══════════════════════════════════════════════════╗');
  console.log('║          All tests completed                       ║');
  console.log('╚═══════════════════════════════════════════════════╝\n');
}

runTests().catch(console.error);
