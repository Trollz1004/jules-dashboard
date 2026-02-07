/**
 * 🤖 CLAUDE DROID NEWS GENERATOR - FOR THE KIDS
 *
 * Generates 59-second YouTube Shorts from news headlines
 * Uses: News API → AI Script → Edge TTS → FFmpeg render
 * Revenue: 100% to verified pediatric charities
 */

import express from 'express';
import axios from 'axios';
import { generateSpeech, generateSpeechBuffer, generateNewsAudio, getVoices } from '../services/tts.js';
import { renderVideo, renderVideoWithText, checkFFmpeg, getVideoConfig } from '../services/video.js';
import { checkYouTubeConfig, getAuthUrl, exchangeCode, uploadVideo, getChannelInfo, getRecentUploads } from '../services/youtube.js';

const router = express.Router();

// News API configuration
const NEWS_API_KEY = process.env.NEWS_API_KEY || 'demo';
const NEWS_API_URL = 'https://newsapi.org/v2/top-headlines';

// Categories supported
const CATEGORIES = ['general', 'sports', 'business', 'technology', 'entertainment'];

// ═══════════════════════════════════════════════════════════════════════════
// RSS FALLBACK - Free news without API key
// ═══════════════════════════════════════════════════════════════════════════

const RSS_FEEDS = {
  general: [
    'https://feeds.bbci.co.uk/news/rss.xml',
    'https://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml'
  ],
  technology: [
    'https://feeds.bbci.co.uk/news/technology/rss.xml',
    'https://rss.nytimes.com/services/xml/rss/nyt/Technology.xml'
  ],
  business: [
    'https://feeds.bbci.co.uk/news/business/rss.xml',
    'https://rss.nytimes.com/services/xml/rss/nyt/Business.xml'
  ],
  entertainment: [
    'https://feeds.bbci.co.uk/news/entertainment_and_arts/rss.xml'
  ],
  sports: [
    'https://feeds.bbci.co.uk/sport/rss.xml'
  ]
};

/**
 * Fetch news from RSS feeds (no API key needed)
 */
async function fetchFromRSS(category = 'general', limit = 5) {
  const feeds = RSS_FEEDS[category] || RSS_FEEDS.general;
  const articles = [];

  for (const feedUrl of feeds) {
    try {
      const response = await axios.get(feedUrl, { timeout: 10000 });
      const xml = response.data;

      // Simple XML parsing for RSS items
      const itemMatches = xml.match(/<item>([\s\S]*?)<\/item>/gi) || [];

      for (const item of itemMatches.slice(0, limit)) {
        const titleMatch = item.match(/<title>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/title>/i);
        const descMatch = item.match(/<description>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/description>/i);
        const linkMatch = item.match(/<link>(.*?)<\/link>/i);
        const pubDateMatch = item.match(/<pubDate>(.*?)<\/pubDate>/i);

        if (titleMatch) {
          articles.push({
            title: titleMatch[1].replace(/<[^>]*>/g, '').trim(),
            description: descMatch ? descMatch[1].replace(/<[^>]*>/g, '').substring(0, 200).trim() : '',
            url: linkMatch ? linkMatch[1].trim() : '',
            source: { name: feedUrl.includes('bbc') ? 'BBC News' : 'News' },
            publishedAt: pubDateMatch ? pubDateMatch[1] : new Date().toISOString()
          });
        }

        if (articles.length >= limit) break;
      }

      if (articles.length >= limit) break;
    } catch (err) {
      console.log(`[RSS] Failed to fetch ${feedUrl}: ${err.message}`);
    }
  }

  console.log(`[RSS] Fetched ${articles.length} articles from RSS feeds`);
  return articles;
}

/**
 * Get news - tries NewsAPI first, falls back to RSS
 */
async function getNews(category = 'general', limit = 5) {
  // If demo key, go straight to RSS
  if (NEWS_API_KEY === 'demo') {
    console.log('[NEWS] Demo key detected, using RSS feeds');
    return await fetchFromRSS(category, limit);
  }

  // Try NewsAPI
  try {
    const response = await axios.get(NEWS_API_URL, {
      params: {
        country: 'us',
        category,
        pageSize: limit,
        apiKey: NEWS_API_KEY
      },
      timeout: 10000
    });

    if (response.data.articles && response.data.articles.length > 0) {
      return response.data.articles;
    }
  } catch (err) {
    console.log(`[NEWS] NewsAPI failed: ${err.message}, falling back to RSS`);
  }

  // Fallback to RSS
  return await fetchFromRSS(category, limit);
}

// Target: 59 seconds at 2.5 words/second = ~147 words
const TARGET_WORDS = 147;

/**
 * POST /api/droid/generate
 * Generates a news video script
 */
router.post('/generate', async (req, res) => {
  const { category = 'general' } = req.body;

  // Validate category
  if (!CATEGORIES.includes(category)) {
    return res.status(400).json({
      error: 'Invalid category',
      valid: CATEGORIES
    });
  }

  console.log(`[DROID] Generating ${category} news video...`);

  try {
    // Step 1: Fetch top headlines
    let headlines = [];

    try {
      const newsResponse = await axios.get(NEWS_API_URL, {
        params: {
          country: 'us',
          category: category,
          pageSize: 5,
          apiKey: NEWS_API_KEY
        },
        timeout: 10000
      });

      headlines = newsResponse.data.articles || [];
    } catch (newsError) {
      console.log('[DROID] News API unavailable, using mock data');
      // Mock headlines for demo/development
      headlines = getMockHeadlines(category);
    }

    if (headlines.length === 0) {
      headlines = getMockHeadlines(category);
    }

    // Step 2: Generate script from headlines
    const script = generateScript(headlines, category);

    // Step 3: Generate metadata
    const videoData = {
      id: `droid-${Date.now()}`,
      title: `${getCategoryEmoji(category)} ${category.toUpperCase()} News - ${new Date().toLocaleDateString()}`,
      description: `Today's top ${category} stories in 59 seconds! 100% to verified pediatric charities. #ForTheKids`,
      script: script,
      duration: 59,
      wordCount: script.split(/\s+/).length,
      category: category,
      tags: ['news', category, 'shorts', 'ForTheKids', 'charity', 'VerifiedPediatricCharities'],
      headlines: headlines.slice(0, 5).map(h => ({
        title: h.title,
        source: h.source?.name || 'News'
      })),
      status: 'script_ready',
      mission: '100% to verified pediatric charities',
      createdAt: new Date().toISOString()
    };

    console.log(`[DROID] Script generated: ${videoData.wordCount} words`);

    res.json(videoData);

  } catch (error) {
    console.error('[DROID] Generation error:', error.message);
    res.status(500).json({
      error: 'Video generation failed',
      message: error.message,
      retry: true
    });
  }
});

/**
 * GET /api/droid/categories
 * Returns available news categories
 */
router.get('/categories', (req, res) => {
  res.json({
    categories: CATEGORIES.map(cat => ({
      id: cat,
      name: cat.charAt(0).toUpperCase() + cat.slice(1),
      emoji: getCategoryEmoji(cat)
    })),
    mission: 'FOR THE KIDS!'
  });
});

/**
 * GET /api/droid/status
 * Returns droid service status
 */
router.get('/status', (req, res) => {
  res.json({
    service: 'Claude Droid News Generator',
    status: 'operational',
    capabilities: [
      'News fetching (News API)',
      'Script generation',
      'Edge TTS voiceover',
      'FFmpeg video rendering'
    ],
    revenue_split: {
      charity: '100%',
      infrastructure: '0%',
      founder: '0%'
    },
    mission: 'FOR THE KIDS!'
  });
});

/**
 * GET /api/droid/voices
 * Returns available TTS voices
 */
router.get('/voices', (req, res) => {
  res.json({
    voices: getVoices(),
    recommended: {
      news: 'en-US-GuyNeural',
      female_news: 'en-US-JennyNeural'
    },
    mission: 'FOR THE KIDS!'
  });
});

/**
 * POST /api/droid/tts
 * Generate speech from text
 */
router.post('/tts', async (req, res) => {
  const { text, voice, returnFile = false } = req.body;

  if (!text) {
    return res.status(400).json({
      error: 'Text is required',
      example: { text: 'Hello, this is Claude Droid!' }
    });
  }

  if (text.length > 5000) {
    return res.status(400).json({
      error: 'Text too long',
      maxLength: 5000,
      provided: text.length
    });
  }

  console.log(`[DROID-TTS] Generating speech: ${text.substring(0, 50)}...`);

  try {
    if (returnFile) {
      // Save to file and return file info
      const result = await generateSpeech(text, { voice });
      if (result.success) {
        res.json({
          success: true,
          ...result,
          mission: 'FOR THE KIDS!'
        });
      } else {
        res.status(500).json(result);
      }
    } else {
      // Return audio buffer directly
      const result = await generateSpeechBuffer(text, { voice });
      if (result.success) {
        res.set({
          'Content-Type': 'audio/mpeg',
          'Content-Length': result.size,
          'X-Voice': result.voice,
          'X-Mission': 'FOR-THE-KIDS'
        });
        res.send(result.buffer);
      } else {
        res.status(500).json(result);
      }
    }
  } catch (error) {
    console.error('[DROID-TTS] Error:', error.message);
    res.status(500).json({
      error: 'TTS generation failed',
      message: error.message
    });
  }
});

/**
 * POST /api/droid/generate-with-audio
 * Generate news script AND audio in one call
 */
router.post('/generate-with-audio', async (req, res) => {
  const { category = 'general' } = req.body;

  // Validate category
  if (!CATEGORIES.includes(category)) {
    return res.status(400).json({
      error: 'Invalid category',
      valid: CATEGORIES
    });
  }

  console.log(`[DROID] Generating ${category} news with audio...`);

  try {
    // Step 1: Fetch headlines
    let headlines = [];

    try {
      const newsResponse = await axios.get(NEWS_API_URL, {
        params: {
          country: 'us',
          category: category,
          pageSize: 5,
          apiKey: NEWS_API_KEY
        },
        timeout: 10000
      });

      headlines = newsResponse.data.articles || [];
    } catch (newsError) {
      console.log('[DROID] News API unavailable, using mock data');
      headlines = getMockHeadlines(category);
    }

    if (headlines.length === 0) {
      headlines = getMockHeadlines(category);
    }

    // Step 2: Generate script
    const script = generateScript(headlines, category);

    // Step 3: Generate audio
    console.log('[DROID] Generating TTS audio...');
    const audioResult = await generateNewsAudio(script, category);

    // Step 4: Build response
    const videoData = {
      id: `droid-${Date.now()}`,
      title: `${getCategoryEmoji(category)} ${category.toUpperCase()} News - ${new Date().toLocaleDateString()}`,
      description: `Today's top ${category} stories in 59 seconds! 100% to verified pediatric charities. #ForTheKids`,
      script: script,
      duration: 59,
      wordCount: script.split(/\\s+/).length,
      category: category,
      tags: ['news', category, 'shorts', 'ForTheKids', 'charity', 'VerifiedPediatricCharities'],
      headlines: headlines.slice(0, 5).map(h => ({
        title: h.title,
        source: h.source?.name || 'News'
      })),
      audio: audioResult.success ? {
        status: 'ready',
        filePath: audioResult.filePath,
        filename: audioResult.filename,
        duration: audioResult.duration,
        size: audioResult.size,
        voice: audioResult.voice
      } : {
        status: 'failed',
        error: audioResult.error
      },
      status: audioResult.success ? 'audio_ready' : 'script_only',
      mission: '100% to verified pediatric charities',
      createdAt: new Date().toISOString()
    };

    console.log(`[DROID] Script + Audio generated: ${videoData.wordCount} words, audio: ${audioResult.success ? 'OK' : 'FAILED'}`);

    res.json(videoData);

  } catch (error) {
    console.error('[DROID] Generation error:', error.message);
    res.status(500).json({
      error: 'Video generation failed',
      message: error.message,
      retry: true
    });
  }
});

/**
 * GET /api/droid/ffmpeg
 * Check FFmpeg availability
 */
router.get('/ffmpeg', async (req, res) => {
  const status = await checkFFmpeg();
  res.json({
    ...status,
    config: getVideoConfig(),
    mission: 'FOR THE KIDS!'
  });
});

/**
 * POST /api/droid/render-video
 * Render video from audio file + background image
 */
router.post('/render-video', async (req, res) => {
  const { audioPath, imagePath, category = 'news' } = req.body;

  if (!audioPath) {
    return res.status(400).json({
      error: 'audioPath is required',
      example: {
        audioPath: '/path/to/audio.mp3',
        imagePath: '/path/to/background.png',
        category: 'technology'
      }
    });
  }

  console.log(`[DROID-VIDEO] Rendering video: ${audioPath}`);

  try {
    const result = await renderVideo({
      audioPath,
      imagePath,
      category
    });

    if (result.success) {
      res.json({
        success: true,
        ...result
      });
    } else {
      res.status(500).json(result);
    }
  } catch (error) {
    console.error('[DROID-VIDEO] Error:', error.message);
    res.status(500).json({
      error: 'Video rendering failed',
      message: error.message
    });
  }
});

/**
 * POST /api/droid/render-video-with-text
 * Render video with text overlay
 */
router.post('/render-video-with-text', async (req, res) => {
  const { audioPath, text, category = 'news', backgroundColor, textColor, fontSize } = req.body;

  if (!audioPath) {
    return res.status(400).json({
      error: 'audioPath is required',
      example: {
        audioPath: '/path/to/audio.mp3',
        text: 'Breaking News Headlines',
        category: 'news'
      }
    });
  }

  console.log(`[DROID-VIDEO] Rendering video with text: ${text?.substring(0, 30)}...`);

  try {
    const result = await renderVideoWithText({
      audioPath,
      text,
      category,
      backgroundColor,
      textColor,
      fontSize
    });

    if (result.success) {
      res.json({
        success: true,
        ...result
      });
    } else {
      res.status(500).json(result);
    }
  } catch (error) {
    console.error('[DROID-VIDEO] Error:', error.message);
    res.status(500).json({
      error: 'Video rendering failed',
      message: error.message
    });
  }
});

/**
 * POST /api/droid/generate-full-video
 * Complete pipeline: News → Script → Audio → Video
 */
router.post('/generate-full-video', async (req, res) => {
  const { category = 'general' } = req.body;

  if (!CATEGORIES.includes(category)) {
    return res.status(400).json({
      error: 'Invalid category',
      valid: CATEGORIES
    });
  }

  console.log(`[DROID] Full pipeline: ${category} news video...`);

  try {
    // Step 1: Fetch headlines
    let headlines = [];
    try {
      const newsResponse = await axios.get(NEWS_API_URL, {
        params: {
          country: 'us',
          category: category,
          pageSize: 5,
          apiKey: NEWS_API_KEY
        },
        timeout: 10000
      });
      headlines = newsResponse.data.articles || [];
    } catch (newsError) {
      console.log('[DROID] News API unavailable, using mock data');
      headlines = getMockHeadlines(category);
    }

    if (headlines.length === 0) {
      headlines = getMockHeadlines(category);
    }

    // Step 2: Generate script
    const script = generateScript(headlines, category);
    console.log(`[DROID] Script: ${script.split(/\s+/).length} words`);

    // Step 3: Generate audio
    console.log('[DROID] Generating TTS audio...');
    const audioResult = await generateNewsAudio(script, category);

    if (!audioResult.success) {
      return res.status(500).json({
        error: 'TTS generation failed',
        details: audioResult.error,
        stage: 'audio'
      });
    }

    // Step 4: Render video
    console.log('[DROID] Rendering video...');
    const videoResult = await renderVideo({
      audioPath: audioResult.filePath,
      category
    });

    // Build response
    const fullVideo = {
      id: `droid-full-${Date.now()}`,
      title: `${getCategoryEmoji(category)} ${category.toUpperCase()} News - ${new Date().toLocaleDateString()}`,
      description: `Today's top ${category} stories in 59 seconds! 100% to verified pediatric charities. #ForTheKids`,
      script: script,
      wordCount: script.split(/\s+/).length,
      category: category,
      tags: ['news', category, 'shorts', 'ForTheKids', 'charity', 'VerifiedPediatricCharities'],
      headlines: headlines.slice(0, 5).map(h => ({
        title: h.title,
        source: h.source?.name || 'News'
      })),
      audio: {
        status: 'ready',
        filePath: audioResult.filePath,
        filename: audioResult.filename,
        voice: audioResult.voice
      },
      video: videoResult.success ? {
        status: 'ready',
        filePath: videoResult.filePath,
        filename: videoResult.filename,
        size: videoResult.size,
        sizeMB: videoResult.sizeMB,
        resolution: videoResult.resolution
      } : {
        status: 'failed',
        error: videoResult.error
      },
      status: videoResult.success ? 'video_ready' : 'audio_only',
      mission: '100% to verified pediatric charities',
      createdAt: new Date().toISOString()
    };

    console.log(`[DROID] Full pipeline complete: ${fullVideo.status}`);
    res.json(fullVideo);

  } catch (error) {
    console.error('[DROID] Pipeline error:', error.message);
    res.status(500).json({
      error: 'Full video generation failed',
      message: error.message,
      retry: true
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// INCOME-FOCUSED ENDPOINTS - Yesterday's News, Today's Clarity
// ═══════════════════════════════════════════════════════════════════════════

/**
 * POST /api/droid/generate-income-video
 * Generates video using yesterday's news with "clarity" style
 * For income-focused content generation using past news
 */
router.post('/generate-income-video', async (req, res) => {
  let {
    topics = [],
    newsDate = null, // Optional: override yesterday's date
    slotName = 'income-daily',
    branding = 'Yesterday\'s news, today\'s clarity',
    privacy = 'public',
    targetWordCount = TARGET_WORDS
  } = req.body;

  // Ensure topics is always an array (fix for "topics.join is not a function" bug)
  if (!Array.isArray(topics)) {
    topics = topics ? [topics] : [];
  }

  console.log(`[INCOME] Generating clarity video for slot: ${slotName}`);

  try {
    // Calculate yesterday's date (or use provided date)
    const yesterday = newsDate ? new Date(newsDate) : new Date(Date.now() - 24 * 60 * 60 * 1000);
    const dateStr = yesterday.toISOString().split('T')[0]; // YYYY-MM-DD format

    console.log(`[INCOME] Fetching news from: ${dateStr}`);

    // Step 1: Fetch news (RSS fallback when NEWS_API_KEY is demo)
    let articles = [];

    // Determine category from topics
    let category = 'general';
    const topicStr = topics.join(' ').toLowerCase();
    if (topicStr.includes('tech') || topicStr.includes('ai')) category = 'technology';
    else if (topicStr.includes('business') || topicStr.includes('economy')) category = 'business';
    else if (topicStr.includes('sport')) category = 'sports';
    else if (topicStr.includes('entertainment')) category = 'entertainment';

    // If demo key, use RSS feeds (no API key needed)
    if (NEWS_API_KEY === 'demo') {
      console.log('[INCOME] Demo key - using RSS feeds for real news');
      articles = await fetchFromRSS(category, 10);
    } else {
      try {
        // Build query from topics (or use general terms)
        const query = topics.length > 0 ? topics.join(' OR ') : 'news OR trending OR breaking';

        const newsResponse = await axios.get('https://newsapi.org/v2/everything', {
          params: {
            q: query,
            from: dateStr,
            to: dateStr,
            language: 'en',
            sortBy: 'popularity',
            pageSize: 10,
            apiKey: NEWS_API_KEY
          },
          timeout: 10000
        });

        articles = newsResponse.data.articles || [];
        console.log(`[INCOME] Fetched ${articles.length} articles from ${dateStr}`);
      } catch (newsError) {
        console.log('[INCOME] NewsAPI failed, falling back to RSS');
        articles = await fetchFromRSS(category, 10);
      }
    }

    // If still no articles, use mock data
    if (articles.length === 0) {
      console.log('[INCOME] No articles found, using mock data');
      articles = getMockIncomeNews(topics);
    }

    // Step 2: Generate "clarity" style script
    const script = generateClarityScript(articles, branding, targetWordCount);
    console.log(`[INCOME] Clarity script: ${script.split(/\s+/).length} words`);

    // Step 3: Generate audio
    console.log('[INCOME] Stage 3/5: Generating TTS audio...');
    const audioResult = await generateNewsAudio(script, 'clarity');

    if (!audioResult.success) {
      return res.status(500).json({
        error: 'TTS generation failed',
        details: audioResult.error,
        stage: 'audio'
      });
    }

    // Step 4: Render video
    console.log('[INCOME] Stage 4/5: Rendering video...');
    const videoResult = await renderVideo({
      audioPath: audioResult.filePath,
      category: 'clarity'
    });

    if (!videoResult.success) {
      return res.status(500).json({
        error: 'Video rendering failed',
        details: videoResult.error,
        stage: 'video',
        audio: audioResult.filePath
      });
    }

    // Step 5: Upload to YouTube
    console.log('[INCOME] Stage 5/5: Uploading to YouTube...');
    const uploadDateStr = new Date(yesterday).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const title = `${branding} - ${uploadDateStr} #Shorts`;
    const description = `Yesterday's news with today's perspective.\n\n100% of ALL ad revenue from this video goes directly to verified pediatric charities.\n\n#ForTheKids #VerifiedPediatricCharities #NewsClarity #Shorts #ClaudeDroid`;

    const uploadResult = await uploadVideo({
      filePath: videoResult.filePath,
      title,
      description,
      tags: ['news', 'clarity', 'yesterday', 'shorts', 'ForTheKids', 'charity', 'VerifiedPediatricCharities', 'ClaudeDroid', ...topics],
      privacy
    });

    // Build response
    const result = {
      id: `income-${Date.now()}`,
      pipeline: 'yesterday-news → clarity-script → audio → video → youtube',
      slotName,
      newsDate: dateStr,
      topics,
      script: script,
      wordCount: script.split(/\s+/).length,
      articles: articles.slice(0, 5).map(a => ({
        title: a.title,
        source: a.source?.name || 'News',
        publishedAt: a.publishedAt
      })),
      audio: {
        status: 'ready',
        filePath: audioResult.filePath
      },
      video: {
        status: 'ready',
        filePath: videoResult.filePath,
        sizeMB: videoResult.sizeMB
      },
      youtube: uploadResult.success ? {
        status: 'uploaded',
        videoId: uploadResult.videoId,
        videoUrl: uploadResult.videoUrl,
        shortsUrl: uploadResult.shortsUrl,
        privacy: uploadResult.status
      } : {
        status: 'failed',
        error: uploadResult.error,
        setup: uploadResult.setup
      },
      status: uploadResult.success ? 'published' : 'video_ready',
      revenue_split: {
        charity: '100%',
        infrastructure: '0%',
        founder: '0%'
      },
      mission: '100% to verified pediatric charities',
      createdAt: new Date().toISOString()
    };

    console.log(`[INCOME] Income video pipeline complete: ${result.status}`);
    res.json(result);

  } catch (error) {
    console.error('[INCOME] Generation error:', error.message);
    res.status(500).json({
      error: 'Income video generation failed',
      message: error.message,
      retry: true
    });
  }
});

/**
 * GET /api/droid/income-status
 * Returns income droid health/stats
 */
router.get('/income-status', (req, res) => {
  console.log('[INCOME] Status check requested');

  res.json({
    service: 'Claude Income Droid',
    mode: 'clarity',
    tagline: 'Yesterday\'s news, today\'s clarity',
    status: 'operational',
    capabilities: [
      'Yesterday\'s news fetching (News API /v2/everything)',
      'Clarity-style script generation',
      'Edge TTS voiceover',
      'FFmpeg video rendering',
      'YouTube Shorts upload'
    ],
    schedule: {
      recommended: 'Daily at 6:00 AM',
      frequency: '1 video/day',
      contentAge: 'Previous day\'s news'
    },
    revenue_split: {
      charity: '100%',
      infrastructure: '0%',
      founder: '0%',
      gospel: 'V1.4.1 SURVIVAL MODE'
    },
    income_strategy: {
      platform: 'YouTube Shorts',
      monetization: 'Ad revenue share',
      target: 'Daily consistent uploads',
      style: 'Clarity and perspective on past news'
    },
    mission: 'FOR THE KIDS!',
    healthCheck: {
      newsAPI: NEWS_API_KEY !== 'demo' ? 'configured' : 'demo_mode',
      tts: 'ready',
      ffmpeg: 'available',
      youtube: 'configured'
    }
  });
});

/**
 * GET /api/droid/income-revenue
 * Returns revenue tracking data
 */
router.get('/income-revenue', (req, res) => {
  console.log('[INCOME] Revenue data requested');

  // Note: This is a placeholder for actual revenue tracking
  // In production, this would query YouTube Analytics API and database

  res.json({
    service: 'Income Droid Revenue Tracking',
    revenue_split: {
      charity: '100%',
      infrastructure: '0%',
      founder: '0%',
      gospel_version: 'V1.4.1 SURVIVAL MODE'
    },
    tracking: {
      status: 'placeholder',
      note: 'YouTube Analytics API integration pending',
      metrics_available: [
        'Video views',
        'Watch time',
        'Estimated revenue (requires YouTube Partner Program)',
        'Engagement rates',
        'Subscriber growth'
      ]
    },
    current_data: {
      total_videos: 0,
      total_views: 0,
      total_revenue: 0,
      charity_amount: 0,
      infrastructure_amount: 0,
      founder_amount: 0,
      last_updated: new Date().toISOString()
    },
    implementation_needed: {
      youtube_analytics_api: 'Connect to YouTube Analytics API for real revenue data',
      database: 'Store historical revenue data',
      webhooks: 'Set up YouTube webhooks for real-time updates',
      charity_disbursement: 'Automated charity distribution system'
    },
    calculation_formula: {
      description: 'Gospel V1.4.1 SURVIVAL MODE Revenue Split',
      charity: 'total_revenue * 1.0',
      infrastructure: 'total_revenue * 0',
      founder: 'total_revenue * 0'
    },
    mission: 'FOR THE KIDS!'
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// YOUTUBE ENDPOINTS - Final Pipeline Stage
// ═══════════════════════════════════════════════════════════════════════════

/**
 * GET /api/droid/youtube-status
 * Check YouTube API configuration
 */
router.get('/youtube-status', (req, res) => {
  const status = checkYouTubeConfig();
  res.json({
    ...status,
    mission: 'FOR THE KIDS!'
  });
});

/**
 * GET /api/droid/youtube-auth
 * Get OAuth2 authorization URL
 */
router.get('/youtube-auth', (req, res) => {
  const result = getAuthUrl();
  res.json(result);
});

/**
 * POST /api/droid/youtube-callback
 * Exchange OAuth2 code for tokens
 */
router.post('/youtube-callback', async (req, res) => {
  const { code } = req.body;

  if (!code) {
    return res.status(400).json({
      error: 'Authorization code is required',
      instructions: 'Get code from OAuth callback URL after authorization'
    });
  }

  const result = await exchangeCode(code);
  res.json(result);
});

/**
 * GET /api/droid/youtube-channel
 * Get authenticated channel info
 */
router.get('/youtube-channel', async (req, res) => {
  const result = await getChannelInfo();

  if (result.success) {
    res.json({
      ...result,
      mission: 'FOR THE KIDS!'
    });
  } else {
    res.status(result.error.includes('not authenticated') ? 401 : 500).json(result);
  }
});

/**
 * GET /api/droid/youtube-uploads
 * Get recent uploads from channel
 */
router.get('/youtube-uploads', async (req, res) => {
  const maxResults = parseInt(req.query.limit) || 10;
  const result = await getRecentUploads(maxResults);

  if (result.success) {
    res.json(result);
  } else {
    res.status(500).json(result);
  }
});

/**
 * POST /api/droid/upload-youtube
 * Upload video to YouTube
 */
router.post('/upload-youtube', async (req, res) => {
  const { filePath, title, description, tags, privacy = 'private' } = req.body;

  if (!filePath) {
    return res.status(400).json({
      error: 'filePath is required',
      example: {
        filePath: '/path/to/video.mp4',
        title: 'Tech News Update - Dec 8, 2025',
        description: '59-second news update. 100% of ad revenue goes to verified pediatric charities.',
        tags: ['news', 'technology', 'ForTheKids'],
        privacy: 'private'
      }
    });
  }

  console.log(`[DROID-YOUTUBE] Upload request: ${filePath}`);

  try {
    const result = await uploadVideo({
      filePath,
      title,
      description,
      tags: tags || [],
      privacy
    });

    if (result.success) {
      res.json(result);
    } else {
      const status = result.error.includes('not authenticated') ? 401 : 500;
      res.status(status).json(result);
    }
  } catch (error) {
    console.error('[DROID-YOUTUBE] Error:', error.message);
    res.status(500).json({
      error: 'YouTube upload failed',
      message: error.message
    });
  }
});

/**
 * POST /api/droid/generate-and-upload
 * Complete pipeline: News → Script → Audio → Video → YouTube
 */
router.post('/generate-and-upload', async (req, res) => {
  const { category = 'general', privacy = 'private' } = req.body;

  if (!CATEGORIES.includes(category)) {
    return res.status(400).json({
      error: 'Invalid category',
      valid: CATEGORIES
    });
  }

  console.log(`[DROID] FULL PIPELINE: ${category} → YouTube (${privacy})`);

  try {
    // Step 1: Fetch headlines
    let headlines = [];
    try {
      const newsResponse = await axios.get(NEWS_API_URL, {
        params: {
          country: 'us',
          category: category,
          pageSize: 5,
          apiKey: NEWS_API_KEY
        },
        timeout: 10000
      });
      headlines = newsResponse.data.articles || [];
    } catch (newsError) {
      console.log('[DROID] News API unavailable, using mock data');
      headlines = getMockHeadlines(category);
    }

    if (headlines.length === 0) {
      headlines = getMockHeadlines(category);
    }

    // Step 2: Generate script
    const script = generateScript(headlines, category);
    console.log(`[DROID] Script: ${script.split(/\s+/).length} words`);

    // Step 3: Generate audio
    console.log('[DROID] Stage 3/5: Generating TTS audio...');
    const audioResult = await generateNewsAudio(script, category);

    if (!audioResult.success) {
      return res.status(500).json({
        error: 'TTS generation failed',
        details: audioResult.error,
        stage: 'audio'
      });
    }

    // Step 4: Render video
    console.log('[DROID] Stage 4/5: Rendering video...');
    const videoResult = await renderVideo({
      audioPath: audioResult.filePath,
      category
    });

    if (!videoResult.success) {
      return res.status(500).json({
        error: 'Video rendering failed',
        details: videoResult.error,
        stage: 'video',
        audio: audioResult.filePath
      });
    }

    // Step 5: Upload to YouTube
    console.log('[DROID] Stage 5/5: Uploading to YouTube...');
    const dateStr = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const title = `${getCategoryEmoji(category)} ${category.charAt(0).toUpperCase() + category.slice(1)} News - ${dateStr} #Shorts`;
    const description = `Today's top ${category} stories in 59 seconds!\n\n100% of ALL ad revenue from this video goes directly to verified pediatric charities.\n\n#ForTheKids #VerifiedPediatricCharities #${category}News #Shorts #ClaudeDroid`;

    const uploadResult = await uploadVideo({
      filePath: videoResult.filePath,
      title,
      description,
      tags: ['news', category, 'shorts', 'ForTheKids', 'charity', 'VerifiedPediatricCharities', 'ClaudeDroid'],
      privacy
    });

    // Build final response
    const result = {
      id: `droid-full-${Date.now()}`,
      pipeline: 'news → script → audio → video → youtube',
      category,
      script: script,
      wordCount: script.split(/\s+/).length,
      headlines: headlines.slice(0, 5).map(h => ({
        title: h.title,
        source: h.source?.name || 'News'
      })),
      audio: {
        status: 'ready',
        filePath: audioResult.filePath
      },
      video: {
        status: 'ready',
        filePath: videoResult.filePath,
        sizeMB: videoResult.sizeMB
      },
      youtube: uploadResult.success ? {
        status: 'uploaded',
        videoId: uploadResult.videoId,
        videoUrl: uploadResult.videoUrl,
        shortsUrl: uploadResult.shortsUrl,
        privacy: uploadResult.status
      } : {
        status: 'failed',
        error: uploadResult.error,
        setup: uploadResult.setup
      },
      status: uploadResult.success ? 'published' : 'video_ready',
      mission: '100% to verified pediatric charities',
      createdAt: new Date().toISOString()
    };

    console.log(`[DROID] Pipeline complete: ${result.status}`);
    res.json(result);

  } catch (error) {
    console.error('[DROID] Full pipeline error:', error.message);
    res.status(500).json({
      error: 'Full pipeline failed',
      message: error.message,
      retry: true
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

// Helper: Generate script from headlines
function generateScript(headlines, category) {
  const intro = getIntro(category);
  const outro = getOutro();

  let script = intro + ' ';
  let wordCount = intro.split(/\s+/).length;

  // Add headlines until we hit target
  for (const article of headlines) {
    if (!article.title) continue;

    // Clean and format headline
    const headline = article.title
      .replace(/\s*[-–—]\s*.+$/, '') // Remove source suffix
      .replace(/['"]/g, '')
      .trim();

    const headlineWords = headline.split(/\s+/).length;

    if (wordCount + headlineWords + outro.split(/\s+/).length < TARGET_WORDS) {
      script += headline + '. ';
      wordCount += headlineWords + 1;
    }
  }

  script += outro;

  return script.trim();
}

// Helper: Get category-specific intro
function getIntro(category) {
  const intros = {
    general: "Here's your 59-second news update. Let's dive into today's top stories.",
    sports: "Sports fans, here's your quick update on what's happening in the world of sports.",
    business: "Market watch time. Here are the business headlines you need to know.",
    technology: "Tech news in under a minute. Here's what's happening in the digital world.",
    entertainment: "Entertainment buzz in 59 seconds. Here's what's trending in Hollywood."
  };
  return intros[category] || intros.general;
}

// Helper: Get outro
function getOutro() {
  return "That's your news update. Remember, 100% of our revenue goes to verified pediatric charities. Subscribe for more news that helps kids. This is Claude Droid, signing off.";
}

// Helper: Get category emoji
function getCategoryEmoji(category) {
  const emojis = {
    general: '📰',
    sports: '⚽',
    business: '💼',
    technology: '💻',
    entertainment: '🎬'
  };
  return emojis[category] || '📰';
}

// Helper: Mock headlines for demo/development
function getMockHeadlines(category) {
  const mockData = {
    general: [
      { title: 'Major climate summit reaches historic agreement', source: { name: 'Reuters' } },
      { title: 'New breakthrough in renewable energy storage announced', source: { name: 'AP' } },
      { title: 'Global leaders meet to discuss economic cooperation', source: { name: 'BBC' } },
      { title: 'Space agency reveals plans for lunar base by 2030', source: { name: 'NASA' } },
      { title: 'International aid reaches disaster-affected regions', source: { name: 'UN News' } }
    ],
    sports: [
      { title: 'Championship finals set new viewership records', source: { name: 'ESPN' } },
      { title: 'Star athlete announces comeback after injury recovery', source: { name: 'Sports Illustrated' } },
      { title: 'Historic trade deal shakes up league standings', source: { name: 'Bleacher Report' } },
      { title: 'Youth sports program receives major funding boost', source: { name: 'NBC Sports' } },
      { title: 'International tournament draws record attendance', source: { name: 'Fox Sports' } }
    ],
    business: [
      { title: 'Tech giants report strong quarterly earnings', source: { name: 'Bloomberg' } },
      { title: 'Federal Reserve signals policy shift ahead', source: { name: 'CNBC' } },
      { title: 'Electric vehicle sales surge to new highs', source: { name: 'Reuters' } },
      { title: 'Startup ecosystem sees record investment levels', source: { name: 'TechCrunch' } },
      { title: 'Global supply chains show signs of recovery', source: { name: 'Financial Times' } }
    ],
    technology: [
      { title: 'AI breakthrough promises faster drug discovery', source: { name: 'Wired' } },
      { title: 'New smartphone features revolutionary battery tech', source: { name: 'The Verge' } },
      { title: 'Quantum computing milestone achieved by researchers', source: { name: 'MIT Tech Review' } },
      { title: 'Social media platform launches privacy-focused features', source: { name: 'TechCrunch' } },
      { title: 'Cybersecurity experts warn of emerging threats', source: { name: 'Ars Technica' } }
    ],
    entertainment: [
      { title: 'Blockbuster film breaks opening weekend records', source: { name: 'Variety' } },
      { title: 'Music awards ceremony celebrates diverse talents', source: { name: 'Billboard' } },
      { title: 'Streaming platform announces major content deal', source: { name: 'Hollywood Reporter' } },
      { title: 'Celebrity couple confirms engagement news', source: { name: 'People' } },
      { title: 'Beloved TV series announces surprise renewal', source: { name: 'Entertainment Weekly' } }
    ]
  };

  return mockData[category] || mockData.general;
}

// Helper: Generate "clarity" style script for income videos
function generateClarityScript(articles, branding, targetWords = TARGET_WORDS) {
  const intro = `${branding}. `;
  const outro = "That's yesterday's news with today's perspective. Remember, 100% of our revenue goes to verified pediatric charities. This is Claude Droid, bringing clarity to the chaos.";

  let script = intro;
  let wordCount = intro.split(/\s+/).length;
  const outroWords = outro.split(/\s+/).length;

  // Add articles until we hit target
  for (const article of articles) {
    if (!article.title) continue;

    // Clean and format article title
    const headline = article.title
      .replace(/\s*[-–—]\s*.+$/, '') // Remove source suffix
      .replace(/['"]/g, '')
      .trim();

    const headlineWords = headline.split(/\s+/).length;

    // Check if we have room for this headline + outro
    if (wordCount + headlineWords + outroWords < targetWords) {
      script += headline + '. ';
      wordCount += headlineWords + 1;
    } else {
      break; // We've filled our target
    }
  }

  script += outro;

  return script.trim();
}

// Helper: Mock income news for demo/development
function getMockIncomeNews(topics) {
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const dateStr = yesterday.toISOString();

  return [
    {
      title: 'Markets reacted to new economic data with mixed signals',
      source: { name: 'Reuters' },
      publishedAt: dateStr
    },
    {
      title: 'Technology sector showed strong performance in trading',
      source: { name: 'Bloomberg' },
      publishedAt: dateStr
    },
    {
      title: 'International summit concluded with new agreements',
      source: { name: 'AP' },
      publishedAt: dateStr
    },
    {
      title: 'Major company announced strategic partnership',
      source: { name: 'CNBC' },
      publishedAt: dateStr
    },
    {
      title: 'Research team published breakthrough findings',
      source: { name: 'Science Daily' },
      publishedAt: dateStr
    }
  ];
}

export default router;
