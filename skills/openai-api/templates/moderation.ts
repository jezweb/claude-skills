/**
 * OpenAI Moderation API - Content Safety Examples
 *
 * This template demonstrates:
 * - Basic content moderation
 * - All 11 safety categories
 * - Category scoring and thresholds
 * - Batch moderation
 * - Production patterns for UGC
 */

import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// =============================================================================
// BASIC MODERATION
// =============================================================================

async function basicModeration() {
  const moderation = await openai.moderations.create({
    model: 'omni-moderation-latest',
    input: 'I want to hurt someone.',
  });

  const result = moderation.results[0];

  console.log('Flagged:', result.flagged);
  console.log('Categories flagged:');
  Object.entries(result.categories).forEach(([category, flagged]) => {
    if (flagged) {
      console.log(`  - ${category}: ${result.category_scores[category].toFixed(4)}`);
    }
  });

  return result;
}

// =============================================================================
// ALL SAFETY CATEGORIES
// =============================================================================

async function allCategories() {
  const examples = {
    sexual: 'Explicit sexual content example',
    hate: 'Hateful speech based on identity',
    harassment: 'Bullying and intimidation example',
    'self-harm': 'Content promoting self-harm',
    'sexual/minors': 'Any sexualization of minors',
    'hate/threatening': 'Violent threats based on identity',
    'violence/graphic': 'Graphic violence description',
    'self-harm/intent': 'Active suicidal ideation',
    'self-harm/instructions': 'How to self-harm instructions',
    'harassment/threatening': 'Violent threat toward individual',
    violence: 'General violent content',
  };

  console.log('Safety Categories:\n');

  for (const [category, description] of Object.entries(examples)) {
    console.log(`${category}:`);
    console.log(`  Description: ${description}`);
  }

  console.log('\nNote: Use actual content for real moderation, not descriptions');
}

// =============================================================================
// CATEGORY SCORES AND THRESHOLDS
// =============================================================================

interface Thresholds {
  [key: string]: number;
}

const recommendedThresholds: Thresholds = {
  sexual: 0.5,
  hate: 0.4,
  harassment: 0.5,
  'self-harm': 0.3,
  'sexual/minors': 0.1, // Lower threshold for child safety
  'hate/threatening': 0.3,
  'violence/graphic': 0.5,
  'self-harm/intent': 0.2,
  'self-harm/instructions': 0.2,
  'harassment/threatening': 0.3,
  violence: 0.5,
};

function checkThresholds(result: any, thresholds: Thresholds): boolean {
  return Object.entries(result.category_scores).some(
    ([category, score]) => score > (thresholds[category] || 0.5)
  );
}

async function withCustomThresholds(text: string) {
  const moderation = await openai.moderations.create({
    model: 'omni-moderation-latest',
    input: text,
  });

  const result = moderation.results[0];

  const isFlagged = checkThresholds(result, recommendedThresholds);

  console.log('Content:', text);
  console.log('API flagged:', result.flagged);
  console.log('Custom thresholds flagged:', isFlagged);

  if (isFlagged) {
    console.log('Flagged categories:');
    Object.entries(result.category_scores).forEach(([category, score]) => {
      const threshold = recommendedThresholds[category] || 0.5;
      if (score > threshold) {
        console.log(`  - ${category}: ${score.toFixed(4)} (threshold: ${threshold})`);
      }
    });
  }

  return { result, isFlagged };
}

// =============================================================================
// BATCH MODERATION
// =============================================================================

async function batchModeration() {
  const texts = [
    'This is a normal, safe comment',
    'Potentially harmful content example',
    'Another safe piece of text',
  ];

  const moderation = await openai.moderations.create({
    model: 'omni-moderation-latest',
    input: texts,
  });

  moderation.results.forEach((result, index) => {
    console.log(`\nInput ${index + 1}: "${texts[index]}"`);
    console.log('Flagged:', result.flagged);

    if (result.flagged) {
      const flaggedCategories = Object.keys(result.categories).filter(
        cat => result.categories[cat]
      );
      console.log('Categories:', flaggedCategories.join(', '));
    }
  });

  return moderation.results;
}

// =============================================================================
// PRODUCTION PATTERN - UGC MODERATION
// =============================================================================

interface ModerationDecision {
  allowed: boolean;
  reason?: string;
  severity?: 'low' | 'medium' | 'high' | 'error';
  scores?: any;
}

async function moderateUserContent(userInput: string): Promise<ModerationDecision> {
  try {
    const moderation = await openai.moderations.create({
      model: 'omni-moderation-latest',
      input: userInput,
    });

    const result = moderation.results[0];

    // Immediate block for severe categories
    const severeCategories = [
      'sexual/minors',
      'self-harm/intent',
      'hate/threatening',
      'harassment/threatening',
    ];

    for (const category of severeCategories) {
      if (result.categories[category]) {
        return {
          allowed: false,
          reason: `Content violates policy: ${category}`,
          severity: 'high',
        };
      }
    }

    // High-confidence violence check
    if (result.category_scores.violence > 0.8) {
      return {
        allowed: false,
        reason: 'High-confidence violence detected',
        severity: 'medium',
      };
    }

    // Self-harm content requires human review
    if (result.categories['self-harm']) {
      return {
        allowed: false,
        reason: 'Content flagged for human review',
        severity: 'medium',
      };
    }

    // Allow content
    return {
      allowed: true,
      scores: result.category_scores,
    };
  } catch (error: any) {
    console.error('Moderation error:', error);

    // Fail closed: block on error
    return {
      allowed: false,
      reason: 'Moderation service unavailable',
      severity: 'error',
    };
  }
}

// =============================================================================
// CATEGORY-SPECIFIC FILTERING
// =============================================================================

async function filterByCategory(text: string, categoriesToCheck: string[]) {
  const moderation = await openai.moderations.create({
    model: 'omni-moderation-latest',
    input: text,
  });

  const result = moderation.results[0];

  const violations = categoriesToCheck.filter(
    category => result.categories[category]
  );

  if (violations.length > 0) {
    console.log('Content violates:', violations.join(', '));
    return false;
  }

  console.log('Content passed specified category checks');
  return true;
}

// =============================================================================
// LOGGING AND AUDIT TRAIL
// =============================================================================

interface ModerationLog {
  timestamp: string;
  content: string;
  flagged: boolean;
  categories: string[];
  scores: any;
  action: 'allowed' | 'blocked' | 'review';
}

async function moderateWithLogging(content: string): Promise<ModerationLog> {
  const moderation = await openai.moderations.create({
    model: 'omni-moderation-latest',
    input: content,
  });

  const result = moderation.results[0];

  const flaggedCategories = Object.keys(result.categories).filter(
    cat => result.categories[cat]
  );

  const log: ModerationLog = {
    timestamp: new Date().toISOString(),
    content: content.substring(0, 100), // Truncate for logging
    flagged: result.flagged,
    categories: flaggedCategories,
    scores: result.category_scores,
    action: result.flagged ? 'blocked' : 'allowed',
  };

  // In production: save to database or logging service
  console.log('Moderation log:', JSON.stringify(log, null, 2));

  return log;
}

// =============================================================================
// USER FEEDBACK PATTERN
// =============================================================================

function getUserFriendlyMessage(result: any): string {
  if (!result.flagged) {
    return 'Content approved';
  }

  const flaggedCategories = Object.keys(result.categories).filter(
    cat => result.categories[cat]
  );

  // Don't reveal exact detection details
  if (flaggedCategories.some(cat => cat.includes('harm'))) {
    return 'Your content appears to contain concerning material. Please review our community guidelines.';
  }

  if (flaggedCategories.includes('harassment') || flaggedCategories.includes('hate')) {
    return 'Your content may be disrespectful or harmful to others. Please rephrase.';
  }

  if (flaggedCategories.includes('violence')) {
    return 'Your content contains violent themes that violate our policies.';
  }

  return 'Your content doesn\'t meet our community guidelines. Please revise and try again.';
}

// =============================================================================
// ERROR HANDLING
// =============================================================================

async function withErrorHandling(text: string) {
  try {
    const moderation = await openai.moderations.create({
      model: 'omni-moderation-latest',
      input: text,
    });

    return moderation.results[0];
  } catch (error: any) {
    if (error.status === 401) {
      console.error('Invalid API key');
    } else if (error.status === 429) {
      console.error('Rate limit exceeded - implement retry logic');
    } else if (error.status === 500) {
      console.error('OpenAI service error - fail closed and block content');
    } else {
      console.error('Unexpected error:', error.message);
    }

    throw error;
  }
}

// =============================================================================
// MAIN EXECUTION
// =============================================================================

async function main() {
  console.log('=== OpenAI Moderation API Examples ===\n');

  // Example 1: Basic moderation
  console.log('1. Basic Moderation:');
  await basicModeration();
  console.log();

  // Example 2: All categories
  console.log('2. All Safety Categories:');
  allCategories();
  console.log();

  // Example 3: Custom thresholds
  console.log('3. Custom Thresholds:');
  await withCustomThresholds('This is a test message');
  console.log();

  // Example 4: Batch moderation
  console.log('4. Batch Moderation:');
  await batchModeration();
  console.log();

  // Example 5: Production pattern
  console.log('5. Production UGC Moderation:');
  const decision = await moderateUserContent('Safe user comment');
  console.log('Decision:', decision);
  console.log();
}

// Run if executed directly
if (require.main === module) {
  main().catch(console.error);
}

export {
  basicModeration,
  allCategories,
  withCustomThresholds,
  batchModeration,
  moderateUserContent,
  filterByCategory,
  moderateWithLogging,
  getUserFriendlyMessage,
  withErrorHandling,
};
