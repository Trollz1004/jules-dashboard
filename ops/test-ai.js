#!/usr/bin/env node
/**
 * ═══════════════════════════════════════════════════════════════════════════
 * AI Services Test Script - Dating Platform
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Tests the Ollama AI integration for the dating platform features:
 * - Bio generation
 * - Icebreaker generation
 * - Compatibility analysis
 *
 * Usage: node scripts/test-ai.js
 *
 * Requirements:
 * - Ollama running at http://localhost:11434
 * - llama3.2:3b model installed (run: ollama pull llama3.2:3b)
 * ═══════════════════════════════════════════════════════════════════════════
 */

const OLLAMA_BASE_URL = process.env.OLLAMA_HOST || 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3.2:3b';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('');
  log('═'.repeat(65), colors.blue);
  log(` ${title}`, colors.blue);
  log('═'.repeat(65), colors.blue);
  console.log('');
}

function logSuccess(message) {
  log(`✓ ${message}`, colors.green);
}

function logError(message) {
  log(`✗ ${message}`, colors.red);
}

function logInfo(message) {
  log(`→ ${message}`, colors.cyan);
}

/**
 * Make a request to the Ollama API
 */
async function ollamaGenerate(prompt, system, options = {}) {
  const response = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: OLLAMA_MODEL,
      prompt,
      system,
      stream: false,
      options: {
        temperature: options.temperature || 0.7,
        num_predict: options.maxTokens || 300,
        top_p: 0.9,
        repeat_penalty: 1.1,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Ollama API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return data;
}

/**
 * Test 1: Check Ollama Health
 */
async function testOllamaHealth() {
  logSection('Test 1: Ollama Health Check');

  try {
    logInfo(`Connecting to ${OLLAMA_BASE_URL}...`);

    const response = await fetch(`${OLLAMA_BASE_URL}/api/tags`);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    const models = data.models || [];

    logSuccess(`Ollama is running`);
    logInfo(`Installed models: ${models.length}`);

    models.forEach(model => {
      const sizeGB = (model.size / (1024 * 1024 * 1024)).toFixed(2);
      console.log(`   - ${model.name} (${sizeGB} GB)`);
    });

    // Check for required model
    const hasRequiredModel = models.some(m => m.name.includes('llama3'));

    if (hasRequiredModel) {
      logSuccess(`Required model (llama3) is available`);
    } else {
      logError(`Required model not found. Run: ollama pull llama3.2:3b`);
      return false;
    }

    return true;
  } catch (error) {
    logError(`Failed to connect to Ollama: ${error.message}`);
    logInfo('Make sure Ollama is running: ollama serve');
    return false;
  }
}

/**
 * Test 2: Bio Generation
 */
async function testBioGeneration() {
  logSection('Test 2: Bio Generation');

  const userInfo = {
    name: 'Alex',
    age: 28,
    interests: ['hiking', 'photography', 'coffee', 'travel'],
    occupation: 'Software Engineer',
    lookingFor: 'meaningful connection',
  };

  logInfo('Generating bio for test user:');
  console.log(`   Name: ${userInfo.name}`);
  console.log(`   Age: ${userInfo.age}`);
  console.log(`   Interests: ${userInfo.interests.join(', ')}`);
  console.log(`   Occupation: ${userInfo.occupation}`);
  console.log('');

  const prompt = `Generate a charming, authentic dating profile bio for:
Name: ${userInfo.name}
Age: ${userInfo.age}
Interests: ${userInfo.interests.join(', ')}
Occupation: ${userInfo.occupation}
Looking for: ${userInfo.lookingFor}

Create a bio that is:
- 2-3 sentences maximum
- Warm and approachable
- Shows personality without being cheesy
- Includes a subtle conversation starter

Bio:`;

  const system = `You are an expert dating profile writer. Create authentic, engaging bios that help people connect. Be concise and avoid cliches.`;

  try {
    const startTime = Date.now();
    const result = await ollamaGenerate(prompt, system, { temperature: 0.8 });
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    logSuccess(`Bio generated in ${duration}s`);
    console.log('');
    log('Generated Bio:', colors.yellow);
    console.log(`   "${result.response.trim()}"`);
    console.log('');
    logInfo(`Tokens: ${result.eval_count || 'N/A'} | Model: ${result.model}`);

    return true;
  } catch (error) {
    logError(`Bio generation failed: ${error.message}`);
    return false;
  }
}

/**
 * Test 3: Icebreaker Generation
 */
async function testIcebreakerGeneration() {
  logSection('Test 3: Icebreaker Generation');

  const profile1 = { name: 'Alex', interests: ['hiking', 'photography', 'coffee'] };
  const profile2 = { name: 'Jordan', interests: ['travel', 'coffee', 'music', 'hiking'] };

  const commonInterests = profile1.interests.filter(i =>
    profile2.interests.some(p2i =>
      p2i.toLowerCase().includes(i.toLowerCase()) ||
      i.toLowerCase().includes(p2i.toLowerCase())
    )
  );

  logInfo('Generating icebreakers for:');
  console.log(`   Sender: ${profile1.name} (${profile1.interests.join(', ')})`);
  console.log(`   Receiver: ${profile2.name} (${profile2.interests.join(', ')})`);
  console.log(`   Common interests: ${commonInterests.join(', ')}`);
  console.log('');

  const prompt = `Generate 3 creative, personalized icebreaker messages.

Person sending: ${profile1.name} (interests: ${profile1.interests.join(', ')})
Person receiving: ${profile2.name} (interests: ${profile2.interests.join(', ')})
Common interests: ${commonInterests.join(', ')}

Create icebreakers that are:
- Playful and engaging
- Reference shared interests when possible
- Ask a question to encourage response
- NOT generic pickup lines

Return exactly 3 icebreakers, one per line:`;

  const system = `You are a dating coach helping people start conversations. Be creative, friendly, and authentic.`;

  try {
    const startTime = Date.now();
    const result = await ollamaGenerate(prompt, system, { temperature: 0.9 });
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    const icebreakers = result.response.split('\n').filter(line => line.trim()).slice(0, 3);

    logSuccess(`Icebreakers generated in ${duration}s`);
    console.log('');
    log('Generated Icebreakers:', colors.yellow);
    icebreakers.forEach((ib, i) => {
      console.log(`   ${i + 1}. ${ib.trim()}`);
    });
    console.log('');
    logInfo(`Tokens: ${result.eval_count || 'N/A'}`);

    return true;
  } catch (error) {
    logError(`Icebreaker generation failed: ${error.message}`);
    return false;
  }
}

/**
 * Test 4: Compatibility Analysis
 */
async function testCompatibilityAnalysis() {
  logSection('Test 4: Compatibility Analysis');

  const profile1 = {
    age: 28,
    interests: ['hiking', 'photography', 'coffee', 'travel'],
    lookingFor: 'long-term relationship',
    location: 'Seattle',
  };

  const profile2 = {
    age: 26,
    interests: ['travel', 'coffee', 'yoga', 'reading'],
    lookingFor: 'meaningful connection',
    location: 'Seattle',
  };

  logInfo('Analyzing compatibility between:');
  console.log(`   Profile 1: Age ${profile1.age}, ${profile1.interests.join(', ')}`);
  console.log(`   Profile 2: Age ${profile2.age}, ${profile2.interests.join(', ')}`);
  console.log('');

  const prompt = `Analyze dating compatibility between two profiles:

Profile 1:
- Age: ${profile1.age}
- Interests: ${profile1.interests.join(', ')}
- Looking for: ${profile1.lookingFor}
- Location: ${profile1.location}

Profile 2:
- Age: ${profile2.age}
- Interests: ${profile2.interests.join(', ')}
- Looking for: ${profile2.lookingFor}
- Location: ${profile2.location}

Provide analysis in this exact format:
SCORE: [0-100]
REASONS:
- [reason 1]
- [reason 2]
- [reason 3]
TIPS:
- [conversation tip 1]
- [conversation tip 2]`;

  const system = `You are a relationship compatibility analyst. Be insightful but optimistic.`;

  try {
    const startTime = Date.now();
    const result = await ollamaGenerate(prompt, system, { temperature: 0.6 });
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    // Parse the response
    const response = result.response;
    const scoreMatch = response.match(/SCORE:\s*(\d+)/);
    const score = scoreMatch ? parseInt(scoreMatch[1]) : 'N/A';

    logSuccess(`Compatibility analyzed in ${duration}s`);
    console.log('');
    log('Compatibility Analysis:', colors.yellow);
    console.log(`   Score: ${score}/100`);
    console.log('');
    console.log('   Full Response:');
    response.split('\n').forEach(line => {
      if (line.trim()) console.log(`   ${line}`);
    });
    console.log('');
    logInfo(`Tokens: ${result.eval_count || 'N/A'}`);

    return true;
  } catch (error) {
    logError(`Compatibility analysis failed: ${error.message}`);
    return false;
  }
}

/**
 * Test 5: Performance Benchmark
 */
async function testPerformance() {
  logSection('Test 5: Performance Benchmark');

  logInfo('Running quick response test...');

  const prompt = 'Say "Hello from Ollama!" in exactly 5 words.';
  const system = 'Respond briefly.';

  try {
    const startTime = Date.now();
    const result = await ollamaGenerate(prompt, system, { maxTokens: 20, temperature: 0.1 });
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    const tokensPerSecond = result.eval_count
      ? (result.eval_count / (result.eval_duration / 1e9)).toFixed(2)
      : 'N/A';

    logSuccess(`Response received in ${duration}s`);
    console.log('');
    log('Performance Metrics:', colors.yellow);
    console.log(`   Response time: ${duration}s`);
    console.log(`   Tokens generated: ${result.eval_count || 'N/A'}`);
    console.log(`   Tokens/second: ${tokensPerSecond}`);
    console.log(`   Model load time: ${result.load_duration ? (result.load_duration / 1e9).toFixed(2) + 's' : 'N/A'}`);
    console.log('');

    // Performance recommendations
    if (parseFloat(duration) > 5) {
      logInfo('Tip: Response time is slow. Consider:');
      console.log('   - Using a smaller model (llama3.2:1b)');
      console.log('   - Reducing max_tokens in requests');
      console.log('   - Checking GPU utilization with nvidia-smi');
    } else {
      logSuccess('Performance looks good for production use!');
    }

    return true;
  } catch (error) {
    logError(`Performance test failed: ${error.message}`);
    return false;
  }
}

/**
 * Main test runner
 */
async function runAllTests() {
  console.log('');
  log('═'.repeat(65), colors.bright);
  log('       Dating Platform - AI Services Test Suite', colors.bright);
  log('═'.repeat(65), colors.bright);
  console.log('');
  logInfo(`Ollama URL: ${OLLAMA_BASE_URL}`);
  logInfo(`Model: ${OLLAMA_MODEL}`);

  const results = {
    health: false,
    bio: false,
    icebreaker: false,
    compatibility: false,
    performance: false,
  };

  // Run tests
  results.health = await testOllamaHealth();

  if (!results.health) {
    logSection('Tests Aborted');
    logError('Cannot proceed without Ollama connection.');
    logInfo('1. Install Ollama: https://ollama.ai');
    logInfo('2. Start Ollama: ollama serve');
    logInfo('3. Pull model: ollama pull llama3.2:3b');
    process.exit(1);
  }

  results.bio = await testBioGeneration();
  results.icebreaker = await testIcebreakerGeneration();
  results.compatibility = await testCompatibilityAnalysis();
  results.performance = await testPerformance();

  // Summary
  logSection('Test Summary');

  const tests = [
    ['Ollama Health', results.health],
    ['Bio Generation', results.bio],
    ['Icebreaker Generation', results.icebreaker],
    ['Compatibility Analysis', results.compatibility],
    ['Performance Benchmark', results.performance],
  ];

  let passed = 0;
  let failed = 0;

  tests.forEach(([name, result]) => {
    if (result) {
      logSuccess(name);
      passed++;
    } else {
      logError(name);
      failed++;
    }
  });

  console.log('');
  log('─'.repeat(65), colors.blue);
  console.log(`   Passed: ${passed}/${tests.length}`);
  console.log(`   Failed: ${failed}/${tests.length}`);
  log('─'.repeat(65), colors.blue);
  console.log('');

  if (failed === 0) {
    logSuccess('All tests passed! AI services are ready for production.');
  } else {
    logError(`${failed} test(s) failed. Check the errors above.`);
  }

  console.log('');
  process.exit(failed > 0 ? 1 : 0);
}

// Run the tests
runAllTests().catch(error => {
  logError(`Unexpected error: ${error.message}`);
  process.exit(1);
});
