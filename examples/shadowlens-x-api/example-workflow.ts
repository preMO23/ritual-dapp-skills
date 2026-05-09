import {
  createPublicClient,
  createWalletClient,
  http,
  parseAbi,
  getEventLog,
  waitForTransactionReceipt,
} from 'viem';
import axios from 'axios';
import * as dotenv from 'dotenv';
import {
  submitXApiAnalysisRequest,
  getHttpExecutorAddress,
  ritualChain,
  SHADOWLENS_ABI,
} from './shadowlens-http-precompile.js';
import type { Address, Hex } from 'viem';

dotenv.config();

interface XUserMetrics {
  public_metrics: {
    followers_count: number;
    following_count: number;
    tweet_count: number;
    like_count: number;
  };
  created_at: string;
  verified: boolean;
  protected: boolean;
}

interface ShadowLensAnalysis {
  riskLevel: 0 | 1 | 2 | 3; // 0 = Unknown, 1 = Low, 2 = Medium, 3 = High
  engagementHealth: string;
  postingPattern: string;
  contentRisk: string;
  suggestedFixes: string;
}

/**
 * Analyze an X handle to determine shadow ban risk and engagement health.
 *
 * This is a backend function that:
 * 1. Fetches X API user metrics
 * 2. Analyzes engagement ratios
 * 3. Detects shadow ban indicators
 * 4. Generates suggested fixes
 */
export async function analyzeXHandle(
  xHandle: string,
  bearerToken: string
): Promise<ShadowLensAnalysis> {
  try {
    // Fetch user data from X API
    const userResponse = await axios.get(
      `https://api.twitter.com/2/users/by/username/${xHandle}?user.fields=public_metrics,created_at,verified,protected`,
      {
        headers: {
          Authorization: `Bearer ${bearerToken}`,
        },
      }
    );

    const userData: XUserMetrics = userResponse.data.data;
    const metrics = userData.public_metrics;

    // Analyze metrics for risk assessment
    const riskLevel = assessShadowBanRisk(metrics);
    const engagementHealth = analyzeEngagement(metrics);
    const postingPattern = analyzePostingPattern(userData);
    const contentRisk = detectContentRisk(xHandle); // Placeholder
    const suggestedFixes = generateSuggestions(riskLevel, metrics);

    return {
      riskLevel,
      engagementHealth,
      postingPattern,
      contentRisk,
      suggestedFixes,
    };
  } catch (error) {
    console.error('Error analyzing X handle:', error);
    throw error;
  }
}

/**
 * Assess shadow ban risk based on engagement metrics.
 *
 * Indicators:
 * - Low engagement ratio (likes / tweets < 0.1)
 * - Zero impressions on recent tweets
 * - Replies showing filtered/limited visibility
 */
function assessShadowBanRisk(metrics: XUserMetrics['public_metrics']): 0 | 1 | 2 | 3 {
  // Risk scoring logic
  const engagementRatio = metrics.like_count / Math.max(metrics.tweet_count, 1);

  if (metrics.followers_count === 0) {
    return 3; // High: no followers
  }

  if (engagementRatio < 0.05) {
    return 3; // High: very low engagement
  }

  if (engagementRatio < 0.1) {
    return 2; // Medium: low engagement
  }

  if (engagementRatio < 0.2) {
    return 1; // Low: moderate engagement
  }

  return 1; // Low: good engagement
}

/**
 * Analyze engagement health (tweet velocity, like ratios, reply patterns).
 */
function analyzeEngagement(metrics: XUserMetrics['public_metrics']): string {
  const engagementRatio = metrics.like_count / Math.max(metrics.tweet_count, 1);
  const followerEngagementRatio = metrics.like_count / Math.max(metrics.followers_count, 1);

  const parts = [];
  parts.push(`Followers: ${metrics.followers_count}`);
  parts.push(`Tweets: ${metrics.tweet_count}`);
  parts.push(`Avg likes per tweet: ${engagementRatio.toFixed(2)}`);
  parts.push(`Follower engagement ratio: ${followerEngagementRatio.toFixed(4)}`);

  if (followerEngagementRatio < 0.001) {
    parts.push('⚠️ Low engagement relative to followers');
  }

  return parts.join(' | ');
}

/**
 * Analyze posting pattern (frequency, typical times, content types).
 */
function analyzePostingPattern(userData: XUserMetrics): string {
  const accountAge = new Date().getTime() - new Date(userData.created_at).getTime();
  const daysSinceCreated = Math.floor(accountAge / (1000 * 60 * 60 * 24));
  const tweetsPerDay = userData.public_metrics.tweet_count / Math.max(daysSinceCreated, 1);

  return `Account age: ${daysSinceCreated} days | Tweets/day: ${tweetsPerDay.toFixed(2)} | Verified: ${userData.verified} | Protected: ${userData.protected}`;
}

/**
 * Detect content risk (flagged topics, automated rules violations).
 */
function detectContentRisk(xHandle: string): string {
  // Placeholder: in production, fetch recent tweets and scan content
  return 'No flagged content detected (placeholder)';
}

/**
 * Generate suggested fixes based on risk level.
 */
function generateSuggestions(riskLevel: 0 | 1 | 2 | 3, metrics: XUserMetrics['public_metrics']): string {
  const suggestions = [];

  if (riskLevel >= 3) {
    suggestions.push('1. Increase tweet frequency to improve visibility');
    suggestions.push('2. Engage with trending topics in your niche');
    suggestions.push('3. Respond to comments quickly to boost algorithmic reach');
    suggestions.push('4. Verify account if eligible');
  } else if (riskLevel === 2) {
    suggestions.push('1. Post more consistently (aim for daily activity)');
    suggestions.push('2. Use relevant hashtags and mentions');
    suggestions.push('3. Engage with similar accounts in your space');
  } else {
    suggestions.push('1. Continue current posting strategy');
    suggestions.push('2. Monitor engagement trends weekly');
  }

  return suggestions.join(' | ');
}

/**
 * Submit analysis to ShadowLens contract via fulfillAnalysis or oracle update.
 */
export async function fulfillShadowLensAnalysis(
  requestId: Hex,
  analysis: ShadowLensAnalysis,
  contractAddress: Address
): Promise<Hex> {
  const publicClient = createPublicClient({
    chain: ritualChain,
    transport: http(),
  });

  const walletClient = createWalletClient({
    chain: ritualChain,
    transport: http(),
    account: {
      address: (process.env.RITUAL_ADDRESS as Address) || '0x0000000000000000000000000000000000000000',
      type: 'privateKey',
      key: (process.env.RITUAL_PRIVATE_KEY || '0x0') as Hex,
    },
  });

  // TODO: Implement fulfillAnalysis call
  // For now, return a placeholder transaction hash
  const txHash = await walletClient.sendTransaction({
    to: contractAddress,
    data: '0x', // Placeholder
    gas: 300_000n,
    account: walletClient.account!,
  });

  return txHash;
}

/**
 * Example end-to-end workflow:
 * 1. User requests analysis via requestAnalysisWithHttp()
 * 2. Executor fetches X API data
 * 3. Backend listener watches for event
 * 4. Backend fetches result and analyzes it
 * 5. Backend calls fulfillAnalysis() with structured analysis
 */
export async function runShadowLensWorkflow() {
  const xHandle = process.argv[2] || 'elonmusk';
  const weeklyMonitor = process.argv[3] === '--monitor';

  console.log(`\n🔍 Starting ShadowLens analysis for @${xHandle}...`);
  console.log(`📅 Weekly monitoring: ${weeklyMonitor ? 'enabled' : 'disabled'}\n`);

  const publicClient = createPublicClient({
    chain: ritualChain,
    transport: http(),
  });

  const walletClient = createWalletClient({
    chain: ritualChain,
    transport: http(),
    account: {
      address: (process.env.RITUAL_ADDRESS as Address) || '0x0000000000000000000000000000000000000000',
      type: 'privateKey',
      key: (process.env.RITUAL_PRIVATE_KEY || '0x0') as Hex,
    },
  });

  try {
    // Step 1: Get executor
    console.log('📍 Fetching HTTP executor from TEEServiceRegistry...');
    const executorAddress = await getHttpExecutorAddress(publicClient);
    console.log(`✅ Executor: ${executorAddress}\n`);

    // Step 2: Submit request
    console.log('🚀 Submitting X API analysis request to ShadowLens...');
    const contractAddress = (process.env.SHADOWLENS_CONTRACT_ADDRESS as Address) || '';
    const bearerToken = process.env.X_API_BEARER_TOKEN || '';

    const txHash = await submitXApiAnalysisRequest(
      { handle: xHandle, weeklyMonitor },
      contractAddress,
      walletClient,
      executorAddress,
      bearerToken
    );
    console.log(`✅ Transaction submitted: ${txHash}\n`);

    // Step 3: Wait for settlement
    console.log('⏳ Waiting for transaction to settle...');
    const receipt = await waitForTransactionReceipt(publicClient, { hash: txHash });
    console.log(`✅ Transaction confirmed in block ${receipt.blockNumber}\n`);

    // Step 4: Analyze X API response
    console.log('📊 Analyzing X metrics...');
    const analysis = await analyzeXHandle(xHandle, bearerToken);
    console.log('✅ Analysis complete:\n');
    console.log(`  Risk Level: ${['Unknown', 'Low', 'Medium', 'High'][analysis.riskLevel]}`);
    console.log(`  Engagement: ${analysis.engagementHealth}`);
    console.log(`  Posting Pattern: ${analysis.postingPattern}`);
    console.log(`  Content Risk: ${analysis.contentRisk}`);
    console.log(`  Suggestions: ${analysis.suggestedFixes}\n`);

    console.log('✅ ShadowLens workflow complete!');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runShadowLensWorkflow();
}
