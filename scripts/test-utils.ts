import axios from 'axios';
import { ethers } from 'hardhat';

/**
 * Integration Test Utilities for ShadowLens
 */

export interface MockAnalysisRequest {
  handle: string;
  weeklyMonitor: boolean;
  expectedRiskLevel: 0 | 1 | 2 | 3;
}

export interface MockX API Response {
  public_metrics: {
    followers_count: number;
    tweet_count: number;
    like_count: number;
    retweet_count: number;
  };
  created_at: string;
  verified: boolean;
}

export class ShadowLensTestUtils {
  /**
   * Generate mock X API response
   */
  static generateMockXResponse(handle: string): MockXAPIResponse {
    const mockData: { [key: string]: any } = {
      twitter: {
        public_metrics: {
          followers_count: 100000,
          tweet_count: 50000,
          like_count: 500000,
          retweet_count: 50000,
        },
        created_at: '2009-07-15T16:13:20.000Z',
        verified: true,
      },
      elonmusk: {
        public_metrics: {
          followers_count: 200000000,
          tweet_count: 100000,
          like_count: 5000000,
          retweet_count: 1000000,
        },
        created_at: '2009-06-17T02:15:50.000Z',
        verified: true,
      },
    };

    return (
      mockData[handle] || {
        public_metrics: {
          followers_count: 0,
          tweet_count: 0,
          like_count: 0,
          retweet_count: 0,
        },
        created_at: new Date().toISOString(),
        verified: false,
      }
    );
  }

  /**
   * Analyze mock X data and return risk level
   */
  static analyzeRiskLevel(data: MockXAPIResponse): 0 | 1 | 2 | 3 {
    const metrics = data.public_metrics;

    if (metrics.followers_count === 0) {
      return 0; // Unknown
    }

    // Calculate engagement ratio
    const engagementRatio =
      (metrics.like_count + metrics.retweet_count) / metrics.followers_count;

    // Risk assessment based on engagement
    if (engagementRatio > 0.05) {
      return 1; // Low risk - good engagement
    } else if (engagementRatio > 0.01) {
      return 2; // Medium risk - moderate engagement
    } else {
      return 3; // High risk - low engagement (possible shadow ban)
    }
  }

  /**
   * Generate engagement health string
   */
  static generateEngagementHealth(data: MockXAPIResponse): string {
    const metrics = data.public_metrics;
    return `Followers: ${metrics.followers_count.toLocaleString()} | Tweets: ${metrics.tweet_count.toLocaleString()} | Avg Likes: ${(metrics.like_count / Math.max(metrics.tweet_count, 1)).toFixed(0)}`;
  }

  /**
   * Generate posting pattern analysis
   */
  static generatePostingPattern(data: MockXAPIResponse): string {
    const createdDate = new Date(data.created_at);
    const accountAgeDays = Math.floor(
      (Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    const tweetsPerDay = (
      data.public_metrics.tweet_count / accountAgeDays
    ).toFixed(2);

    return `Account age: ${accountAgeDays} days | Tweets/day: ${tweetsPerDay}`;
  }

  /**
   * Encode HTTP call request for testing
   */
  static encodeHTTPCallRequest(
    url: string,
    method: number = 0,
    headers: string[] = [],
    body: string = '',
    executor: string = ethers.ZeroAddress,
    timeout: number = 30
  ): string {
    return ethers.AbiCoder.defaultAbiCoder().encode(
      ['string', 'uint8', 'string[]', 'string', 'address', 'uint32'],
      [url, method, headers, body, executor, timeout]
    );
  }

  /**
   * Wait for transaction with timeout
   */
  static async waitForTransaction(
    txHash: string,
    timeout: number = 30000
  ): Promise<any> {
    const provider = ethers.provider;
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      const receipt = await provider.getTransactionReceipt(txHash);
      if (receipt) {
        return receipt;
      }
      await new Promise((r) => setTimeout(r, 1000));
    }

    throw new Error(`Transaction ${txHash} not confirmed within ${timeout}ms`);
  }

  /**
   * Get contract events within a block range
   */
  static async getContractEvents(
    contract: any,
    eventName: string,
    fromBlock: number = 0,
    toBlock: number | string = 'latest'
  ): Promise<any[]> {
    const filter = contract.filters[eventName]?.();
    if (!filter) {
      throw new Error(`Event ${eventName} not found`);
    }

    return contract.queryFilter(filter, fromBlock, toBlock);
  }

  /**
   * Create mock analysis data
   */
  static createMockAnalysis(handle: string, riskLevel: 0 | 1 | 2 | 3): any {
    const xData = this.generateMockXResponse(handle);

    return {
      handle,
      riskLevel,
      engagementHealth: this.generateEngagementHealth(xData),
      postingPattern: this.generatePostingPattern(xData),
      contentRisk:
        riskLevel === 3
          ? 'Possible shadow ban indicators'
          : 'No significant content risk',
      suggestedFixes:
        riskLevel === 3
          ? [
              'Increase engagement with original content',
              'Post more frequently',
              'Use relevant hashtags',
            ]
          : [],
    };
  }

  /**
   * Format contract call for logging
   */
  static formatContractCall(
    functionName: string,
    args: any[],
    result?: any
  ): string {
    const argsStr = args
      .map((a) => {
        if (typeof a === 'string' && a.startsWith('0x')) {
          return `${a.substring(0, 6)}...${a.substring(a.length - 4)}`;
        }
        return JSON.stringify(a).substring(0, 30);
      })
      .join(', ');

    const resultStr = result ? ` → ${JSON.stringify(result).substring(0, 30)}` : '';
    return `${functionName}(${argsStr})${resultStr}`;
  }

  /**
   * Simulate backend listener
   */
  static async simulateBackendListener(
    contract: any,
    fromBlock: number = 0
  ): Promise<void> {
    console.log('🎧 Simulating Backend Listener');
    console.log('-'.repeat(60));

    const events = await this.getContractEvents(
      contract,
      'AnalysisRequested',
      fromBlock
    );

    console.log(`📨 Found ${events.length} AnalysisRequested events\n`);

    for (const event of events) {
      const [requestId, requester, handle, weeklyMonitor] = event.args;

      console.log(`Processing request for @${handle}...`);

      // Generate mock analysis
      const riskLevel = Math.floor(Math.random() * 4) as 0 | 1 | 2 | 3;
      const analysis = this.createMockAnalysis(handle, riskLevel);

      console.log(`✅ Analysis complete: Risk Level = ${riskLevel}`);
      console.log(
        `   Engagement: ${analysis.engagementHealth.substring(0, 50)}...`
      );
    }
  }

  /**
   * Validate contract state
   */
  static async validateContractState(contract: any): Promise<boolean> {
    try {
      const owner = await contract.owner();
      const sovereignAgent = await contract.SOVEREIGN_AGENT();
      const httpPrecompile = await contract.HTTP_PRECOMPILE();
      const asyncDelivery = await contract.ASYNC_DELIVERY();

      console.log('📋 Contract State Validation');
      console.log('-'.repeat(60));
      console.log(`Owner: ${owner.substring(0, 10)}...`);
      console.log(`Sovereign Agent: ${sovereignAgent}`);
      console.log(`HTTP Precompile: ${httpPrecompile}`);
      console.log(`AsyncDelivery: ${asyncDelivery.substring(0, 10)}...`);

      return true;
    } catch (error) {
      console.error('Failed to validate contract state:', error);
      return false;
    }
  }

  /**
   * Generate test report
   */
  static generateTestReport(
    testName: string,
    results: Array<{ name: string; passed: boolean; duration: number }>
  ): void {
    const passed = results.filter((r) => r.passed).length;
    const failed = results.filter((r) => !r.passed).length;
    const totalTime = results.reduce((sum, r) => sum + r.duration, 0);

    console.log('\n' + '='.repeat(60));
    console.log(`📊 ${testName} Report`);
    console.log('='.repeat(60));
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`⏱️  Total Time: ${totalTime}ms`);
    console.log(`📈 Pass Rate: ${((passed / results.length) * 100).toFixed(1)}%`);
    console.log('='.repeat(60) + '\n');
  }
}

export default ShadowLensTestUtils;
