/**
 * AI SOLUTIONS STORE - PRODUCT DELIVERY EMAIL TEMPLATES
 *
 * Production email system for digital product delivery
 * Each template includes detailed setup instructions and support links
 *
 * Gospel V1.4.1 SURVIVAL MODE: 100% to verified pediatric charities
 * FOR THE KIDS. ALWAYS.
 */

const SUPPORT_EMAIL = 'support@ai-solutions.store';
const FOUNDER_EMAIL = 'admin@yourplatform.com';

// Email styling constants
const EMAIL_STYLES = {
  container: 'font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;',
  header: 'background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0;',
  h1: 'margin: 0; font-size: 28px; font-weight: 600;',
  h2: 'color: #667eea; font-size: 22px; margin-top: 30px; margin-bottom: 15px; border-bottom: 2px solid #667eea; padding-bottom: 8px;',
  h3: 'color: #764ba2; font-size: 18px; margin-top: 25px; margin-bottom: 12px;',
  section: 'background: #f8f9fa; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #667eea;',
  code: 'background: #1e1e1e; color: #d4d4d4; padding: 15px; border-radius: 4px; font-family: "Courier New", monospace; font-size: 13px; overflow-x: auto; display: block; margin: 10px 0;',
  inlineCode: 'background: #f0f0f0; color: #c7254e; padding: 2px 6px; border-radius: 3px; font-family: "Courier New", monospace; font-size: 12px;',
  list: 'margin: 10px 0; padding-left: 20px;',
  listItem: 'margin: 8px 0; line-height: 1.6;',
  link: 'color: #667eea; text-decoration: none; font-weight: 500;',
  button: 'display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 15px 0;',
  warning: 'background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 15px 0; border-radius: 4px;',
  success: 'background: #d4edda; border-left: 4px solid #28a745; padding: 15px; margin: 15px 0; border-radius: 4px;',
  footer: 'text-align: center; padding: 30px 20px; color: #666; font-size: 14px; border-top: 1px solid #ddd; margin-top: 40px;'
};

/**
 * TEMPLATE 1: CLAUDE DROID ($299)
 * AI Video Generator
 */
const claudeDroidTemplate = (customerInfo) => {
  const { name, email, orderId, orderDate } = customerInfo;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Claude Droid - Product Delivery</title>
</head>
<body style="${EMAIL_STYLES.container}">

  <div style="${EMAIL_STYLES.header}">
    <h1 style="${EMAIL_STYLES.h1}">Welcome to Claude Droid!</h1>
    <p style="margin: 10px 0 0 0; font-size: 16px;">AI Video Generation Made Simple</p>
  </div>

  <div style="padding: 30px 20px;">

    <p style="font-size: 16px; line-height: 1.6;">
      Hi ${name},
    </p>

    <p style="font-size: 16px; line-height: 1.6;">
      Thank you for purchasing <strong>Claude Droid</strong>! Your AI video generator is ready to deploy.
      This powerful tool uses Claude AI to create engaging video content automatically.
    </p>

    <div style="${EMAIL_STYLES.success}">
      <strong>Order Confirmed:</strong> ${orderId}<br>
      <strong>Purchase Date:</strong> ${orderDate}<br>
      <strong>Product:</strong> Claude Droid - AI Video Generator<br>
      <strong>Price:</strong> $299
    </div>

    <h2 style="${EMAIL_STYLES.h2}">🚀 Getting Started</h2>

    <h3 style="${EMAIL_STYLES.h3}">Step 1: Clone the Repository</h3>
    <div style="${EMAIL_STYLES.section}">
      <p>Access your private GitHub repository:</p>
      <p>
        <a href="https://github.com/Ai-Solutions-Store/claude-droid" style="${EMAIL_STYLES.button}">
          Open GitHub Repository
        </a>
      </p>
      <p>Clone to your local machine:</p>
      <pre style="${EMAIL_STYLES.code}">git clone https://github.com/Ai-Solutions-Store/claude-droid.git
cd claude-droid</pre>
    </div>

    <h3 style="${EMAIL_STYLES.h3}">Step 2: Install Dependencies</h3>
    <div style="${EMAIL_STYLES.section}">
      <p><strong>Prerequisites:</strong></p>
      <ul style="${EMAIL_STYLES.list}">
        <li style="${EMAIL_STYLES.listItem}">Node.js 18+ (<a href="https://nodejs.org" style="${EMAIL_STYLES.link}">Download</a>)</li>
        <li style="${EMAIL_STYLES.listItem}">FFmpeg (<a href="https://ffmpeg.org/download.html" style="${EMAIL_STYLES.link}">Download</a>)</li>
        <li style="${EMAIL_STYLES.listItem}">Git</li>
      </ul>
      <p><strong>Install Node packages:</strong></p>
      <pre style="${EMAIL_STYLES.code}">npm install</pre>
    </div>

    <h3 style="${EMAIL_STYLES.h3}">Step 3: Install FFmpeg</h3>
    <div style="${EMAIL_STYLES.section}">
      <p><strong>Windows:</strong></p>
      <pre style="${EMAIL_STYLES.code}">winget install ffmpeg
# OR download from https://ffmpeg.org/download.html</pre>

      <p><strong>macOS:</strong></p>
      <pre style="${EMAIL_STYLES.code}">brew install ffmpeg</pre>

      <p><strong>Linux:</strong></p>
      <pre style="${EMAIL_STYLES.code}">sudo apt-get update
sudo apt-get install ffmpeg</pre>

      <p><strong>Verify installation:</strong></p>
      <pre style="${EMAIL_STYLES.code}">ffmpeg -version</pre>
    </div>

    <h3 style="${EMAIL_STYLES.h3}">Step 4: Configure API Keys</h3>
    <div style="${EMAIL_STYLES.section}">
      <p>Create <code style="${EMAIL_STYLES.inlineCode}">.env</code> file in project root:</p>
      <pre style="${EMAIL_STYLES.code}"># Claude AI (Required)
ANTHROPIC_API_KEY=your_anthropic_key_here

# Optional: OpenAI for additional features
OPENAI_API_KEY=your_openai_key_here

# Optional: Azure OpenAI
AZURE_OPENAI_API_KEY=your_azure_key_here
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/
AZURE_OPENAI_DEPLOYMENT=your-deployment-name

# YouTube Upload (Optional - for auto-publishing)
YOUTUBE_CLIENT_ID=your_youtube_client_id
YOUTUBE_CLIENT_SECRET=your_youtube_client_secret
YOUTUBE_REFRESH_TOKEN=your_refresh_token</pre>

      <div style="${EMAIL_STYLES.warning}">
        <strong>⚠️ API Key Setup:</strong>
        <ul style="${EMAIL_STYLES.list}">
          <li style="${EMAIL_STYLES.listItem}"><strong>Anthropic:</strong> <a href="https://console.anthropic.com/" style="${EMAIL_STYLES.link}">Get API Key</a></li>
          <li style="${EMAIL_STYLES.listItem}"><strong>OpenAI:</strong> <a href="https://platform.openai.com/api-keys" style="${EMAIL_STYLES.link}">Get API Key</a></li>
          <li style="${EMAIL_STYLES.listItem}"><strong>Azure OpenAI:</strong> <a href="https://portal.azure.com/" style="${EMAIL_STYLES.link}">Azure Portal</a></li>
        </ul>
      </div>
    </div>

    <h3 style="${EMAIL_STYLES.h3}">Step 5: Generate Your First Video</h3>
    <div style="${EMAIL_STYLES.section}">
      <p><strong>Run the generator:</strong></p>
      <pre style="${EMAIL_STYLES.code}">npm start</pre>

      <p><strong>Or with custom topic:</strong></p>
      <pre style="${EMAIL_STYLES.code}">node index.js --topic "Your Video Topic Here"</pre>

      <p><strong>Example output:</strong></p>
      <pre style="${EMAIL_STYLES.code}">✓ Script generated by Claude AI
✓ Images downloaded
✓ Audio synthesized
✓ Video rendered: output/video_20251221_123456.mp4
✓ Duration: 3:45</pre>
    </div>

    <h2 style="${EMAIL_STYLES.h2}">📺 YouTube Upload Setup (Optional)</h2>

    <div style="${EMAIL_STYLES.section}">
      <p><strong>Enable YouTube API:</strong></p>
      <ol style="${EMAIL_STYLES.list}">
        <li style="${EMAIL_STYLES.listItem}">Go to <a href="https://console.cloud.google.com/" style="${EMAIL_STYLES.link}">Google Cloud Console</a></li>
        <li style="${EMAIL_STYLES.listItem}">Create a new project or select existing</li>
        <li style="${EMAIL_STYLES.listItem}">Enable YouTube Data API v3</li>
        <li style="${EMAIL_STYLES.listItem}">Create OAuth 2.0 credentials</li>
        <li style="${EMAIL_STYLES.listItem}">Download client credentials</li>
        <li style="${EMAIL_STYLES.listItem}">Run authentication flow: <code style="${EMAIL_STYLES.inlineCode}">npm run auth-youtube</code></li>
      </ol>

      <p><strong>Auto-upload videos:</strong></p>
      <pre style="${EMAIL_STYLES.code}">node index.js --topic "AI Revolution" --upload</pre>
    </div>

    <h2 style="${EMAIL_STYLES.h2}">⚙️ Configuration Options</h2>

    <div style="${EMAIL_STYLES.section}">
      <p>Edit <code style="${EMAIL_STYLES.inlineCode}">config.js</code> to customize:</p>
      <ul style="${EMAIL_STYLES.list}">
        <li style="${EMAIL_STYLES.listItem}"><strong>Video Resolution:</strong> 1080p, 720p, 480p</li>
        <li style="${EMAIL_STYLES.listItem}"><strong>Frame Rate:</strong> 24, 30, 60 fps</li>
        <li style="${EMAIL_STYLES.listItem}"><strong>Video Length:</strong> Target duration in seconds</li>
        <li style="${EMAIL_STYLES.listItem}"><strong>Voice:</strong> Text-to-speech voice selection</li>
        <li style="${EMAIL_STYLES.listItem}"><strong>Style:</strong> Visual theme and transitions</li>
      </ul>
    </div>

    <h2 style="${EMAIL_STYLES.h2}">📚 Documentation & Support</h2>

    <div style="${EMAIL_STYLES.section}">
      <ul style="${EMAIL_STYLES.list}">
        <li style="${EMAIL_STYLES.listItem}"><strong>Full Documentation:</strong> See <code style="${EMAIL_STYLES.inlineCode}">README.md</code> in repository</li>
        <li style="${EMAIL_STYLES.listItem}"><strong>Example Videos:</strong> Check <code style="${EMAIL_STYLES.inlineCode}">examples/</code> folder</li>
        <li style="${EMAIL_STYLES.listItem}"><strong>Troubleshooting:</strong> See <code style="${EMAIL_STYLES.inlineCode}">TROUBLESHOOTING.md</code></li>
        <li style="${EMAIL_STYLES.listItem}"><strong>Email Support:</strong> <a href="mailto:${SUPPORT_EMAIL}" style="${EMAIL_STYLES.link}">${SUPPORT_EMAIL}</a></li>
      </ul>
    </div>

    <div style="${EMAIL_STYLES.warning}">
      <strong>🔒 Important Notes:</strong>
      <ul style="${EMAIL_STYLES.list}">
        <li style="${EMAIL_STYLES.listItem}">Keep your API keys secure and never commit them to Git</li>
        <li style="${EMAIL_STYLES.listItem}">Monitor your API usage to avoid unexpected costs</li>
        <li style="${EMAIL_STYLES.listItem}">Review YouTube's community guidelines before uploading</li>
        <li style="${EMAIL_STYLES.listItem}">FFmpeg must be in your system PATH</li>
      </ul>
    </div>

    <div style="text-align: center; margin: 40px 0;">
      <p style="font-size: 18px; font-weight: 600; color: #667eea;">
        Need help? We're here for you!
      </p>
      <p>
        <a href="mailto:${SUPPORT_EMAIL}" style="${EMAIL_STYLES.button}">Contact Support</a>
      </p>
    </div>

  </div>

  <div style="${EMAIL_STYLES.footer}">
    <p><strong>AI Solutions Store</strong></p>
    <p>Building the future of automated content creation</p>
    <p style="font-size: 12px; margin-top: 15px;">
      Order ID: ${orderId} | ${email}
    </p>
  </div>

</body>
</html>
  `.trim();
};

/**
 * TEMPLATE 2: INCOME DROID ($499)
 * Video Monetization System
 */
const incomeDroidTemplate = (customerInfo) => {
  const { name, email, orderId, orderDate } = customerInfo;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Income Droid - Product Delivery</title>
</head>
<body style="${EMAIL_STYLES.container}">

  <div style="${EMAIL_STYLES.header}">
    <h1 style="${EMAIL_STYLES.h1}">Welcome to Income Droid!</h1>
    <p style="margin: 10px 0 0 0; font-size: 16px;">Automated Revenue from YouTube Videos</p>
  </div>

  <div style="padding: 30px 20px;">

    <p style="font-size: 16px; line-height: 1.6;">
      Hi ${name},
    </p>

    <p style="font-size: 16px; line-height: 1.6;">
      Thank you for purchasing <strong>Income Droid</strong>! Your automated video monetization system is ready to deploy.
      Generate 4 revenue-optimized videos daily and build a sustainable YouTube income stream.
    </p>

    <div style="${EMAIL_STYLES.success}">
      <strong>Order Confirmed:</strong> ${orderId}<br>
      <strong>Purchase Date:</strong> ${orderDate}<br>
      <strong>Product:</strong> Income Droid - Video Monetization System<br>
      <strong>Price:</strong> $499
    </div>

    <h2 style="${EMAIL_STYLES.h2}">🚀 Quick Start Guide</h2>

    <h3 style="${EMAIL_STYLES.h3}">Step 1: Clone Repository</h3>
    <div style="${EMAIL_STYLES.section}">
      <p>Access your private GitHub repository:</p>
      <p>
        <a href="https://github.com/Ai-Solutions-Store/income-droid" style="${EMAIL_STYLES.button}">
          Open GitHub Repository
        </a>
      </p>
      <pre style="${EMAIL_STYLES.code}">git clone https://github.com/Ai-Solutions-Store/income-droid.git
cd income-droid</pre>
    </div>

    <h3 style="${EMAIL_STYLES.h3}">Step 2: Install Dependencies</h3>
    <div style="${EMAIL_STYLES.section}">
      <p><strong>System Requirements:</strong></p>
      <ul style="${EMAIL_STYLES.list}">
        <li style="${EMAIL_STYLES.listItem}">Node.js 18+</li>
        <li style="${EMAIL_STYLES.listItem}">FFmpeg (video processing)</li>
        <li style="${EMAIL_STYLES.listItem}">PM2 (process management)</li>
        <li style="${EMAIL_STYLES.listItem}">SQLite (content database)</li>
      </ul>
      <pre style="${EMAIL_STYLES.code}">npm install
npm install -g pm2</pre>
    </div>

    <h3 style="${EMAIL_STYLES.h3}">Step 3: Configure Environment</h3>
    <div style="${EMAIL_STYLES.section}">
      <p>Create <code style="${EMAIL_STYLES.inlineCode}">.env</code> file:</p>
      <pre style="${EMAIL_STYLES.code}"># AI Services
ANTHROPIC_API_KEY=your_anthropic_key_here
OPENAI_API_KEY=your_openai_key_here

# YouTube API (Required for auto-upload)
YOUTUBE_CLIENT_ID=your_client_id
YOUTUBE_CLIENT_SECRET=your_client_secret
YOUTUBE_REFRESH_TOKEN=your_refresh_token
YOUTUBE_CHANNEL_ID=your_channel_id

# Scheduler Settings
VIDEOS_PER_DAY=4
UPLOAD_TIMES=06:00,12:00,18:00,00:00

# Monetization Settings
TARGET_WATCH_TIME=8  # minutes per video
TARGET_CPM=5.00      # estimated CPM in USD
MIN_VIEWS_TARGET=1000

# Database
DATABASE_PATH=./data/income-videos.db</pre>
    </div>

    <h3 style="${EMAIL_STYLES.h3}">Step 4: YouTube Monetization Setup</h3>
    <div style="${EMAIL_STYLES.section}">
      <p><strong>Prerequisites for YouTube monetization:</strong></p>
      <ul style="${EMAIL_STYLES.list}">
        <li style="${EMAIL_STYLES.listItem}">✓ 1,000 subscribers</li>
        <li style="${EMAIL_STYLES.listItem}">✓ 4,000 watch hours in past 12 months</li>
        <li style="${EMAIL_STYLES.listItem}">✓ AdSense account linked</li>
        <li style="${EMAIL_STYLES.listItem}">✓ Community Guidelines compliance</li>
      </ul>

      <div style="${EMAIL_STYLES.warning}">
        <strong>⚠️ Important:</strong> If your channel doesn't meet requirements yet, Income Droid will help you get there faster by maintaining consistent upload schedule and optimizing for watch time.
      </div>

      <p><strong>Enable YouTube API:</strong></p>
      <ol style="${EMAIL_STYLES.list}">
        <li style="${EMAIL_STYLES.listItem}">Go to <a href="https://console.cloud.google.com/" style="${EMAIL_STYLES.link}">Google Cloud Console</a></li>
        <li style="${EMAIL_STYLES.listItem}">Enable YouTube Data API v3</li>
        <li style="${EMAIL_STYLES.listItem}">Create OAuth 2.0 credentials</li>
        <li style="${EMAIL_STYLES.listItem}">Run: <code style="${EMAIL_STYLES.inlineCode}">npm run youtube-auth</code></li>
        <li style="${EMAIL_STYLES.listItem}">Complete browser authentication flow</li>
      </ol>
    </div>

    <h3 style="${EMAIL_STYLES.h3}">Step 5: Configure Content Strategy</h3>
    <div style="${EMAIL_STYLES.section}">
      <p>Edit <code style="${EMAIL_STYLES.inlineCode}">content-strategy.json</code>:</p>
      <pre style="${EMAIL_STYLES.code}">{
  "niches": [
    "AI Technology",
    "Business Automation",
    "Tech News",
    "Programming Tutorials"
  ],
  "targetAudience": "tech-savvy professionals",
  "videoStyle": "educational",
  "callToAction": "subscribe",
  "seoKeywords": [
    "AI",
    "automation",
    "technology",
    "productivity"
  ]
}</pre>
    </div>

    <h3 style="${EMAIL_STYLES.h3}">Step 6: Start the Income Droid</h3>
    <div style="${EMAIL_STYLES.section}">
      <p><strong>Test run (single video):</strong></p>
      <pre style="${EMAIL_STYLES.code}">npm run test-video</pre>

      <p><strong>Start automated scheduler:</strong></p>
      <pre style="${EMAIL_STYLES.code}">pm2 start ecosystem.config.js
pm2 save
pm2 startup</pre>

      <p><strong>Monitor status:</strong></p>
      <pre style="${EMAIL_STYLES.code}">pm2 status
pm2 logs income-droid</pre>

      <p><strong>View dashboard:</strong></p>
      <pre style="${EMAIL_STYLES.code}"># Dashboard runs on http://localhost:4006
npm run dashboard</pre>
    </div>

    <h2 style="${EMAIL_STYLES.h2}">📊 Revenue Optimization Features</h2>

    <div style="${EMAIL_STYLES.section}">
      <ul style="${EMAIL_STYLES.list}">
        <li style="${EMAIL_STYLES.listItem}"><strong>SEO Optimization:</strong> Auto-generates titles, descriptions, tags for maximum discoverability</li>
        <li style="${EMAIL_STYLES.listItem}"><strong>Watch Time Maximization:</strong> Creates engaging 8-12 minute videos (optimal for revenue)</li>
        <li style="${EMAIL_STYLES.listItem}"><strong>Thumbnail Generation:</strong> AI-designed eye-catching thumbnails</li>
        <li style="${EMAIL_STYLES.listItem}"><strong>Trending Topics:</strong> Monitors trends and creates timely content</li>
        <li style="${EMAIL_STYLES.listItem}"><strong>A/B Testing:</strong> Tests different formats to find what performs best</li>
        <li style="${EMAIL_STYLES.listItem}"><strong>Analytics Integration:</strong> Tracks performance and adjusts strategy</li>
      </ul>
    </div>

    <h2 style="${EMAIL_STYLES.h2}">⚙️ Scheduler Configuration</h2>

    <div style="${EMAIL_STYLES.section}">
      <p><strong>Default Schedule (4 videos/day):</strong></p>
      <ul style="${EMAIL_STYLES.list}">
        <li style="${EMAIL_STYLES.listItem}">06:00 - Morning upload (catches early viewers)</li>
        <li style="${EMAIL_STYLES.listItem}">12:00 - Lunch time upload (high engagement)</li>
        <li style="${EMAIL_STYLES.listItem}">18:00 - Evening upload (peak traffic)</li>
        <li style="${EMAIL_STYLES.listItem}">00:00 - Midnight upload (global audience)</li>
      </ul>

      <p><strong>Customize schedule:</strong></p>
      <pre style="${EMAIL_STYLES.code}"># Edit .env file
UPLOAD_TIMES=08:00,14:00,20:00,02:00
VIDEOS_PER_DAY=4</pre>
    </div>

    <h2 style="${EMAIL_STYLES.h2}">📈 Revenue Projections</h2>

    <div style="${EMAIL_STYLES.section}">
      <p><strong>Conservative estimates (US audience, $5 CPM):</strong></p>
      <ul style="${EMAIL_STYLES.list}">
        <li style="${EMAIL_STYLES.listItem}">1,000 views/video = $5/video × 4/day = $20/day = $600/month</li>
        <li style="${EMAIL_STYLES.listItem}">5,000 views/video = $25/video × 4/day = $100/day = $3,000/month</li>
        <li style="${EMAIL_STYLES.listItem}">10,000 views/video = $50/video × 4/day = $200/day = $6,000/month</li>
      </ul>

      <div style="${EMAIL_STYLES.warning}">
        <strong>Note:</strong> Actual revenue depends on niche, audience geography, watch time, and YouTube's algorithm. These are estimates based on industry averages.
      </div>
    </div>

    <h2 style="${EMAIL_STYLES.h2}">🔧 Troubleshooting</h2>

    <div style="${EMAIL_STYLES.section}">
      <p><strong>Common issues:</strong></p>
      <ul style="${EMAIL_STYLES.list}">
        <li style="${EMAIL_STYLES.listItem}"><strong>Upload fails:</strong> Check YouTube API quota (10,000 units/day)</li>
        <li style="${EMAIL_STYLES.listItem}"><strong>Low views:</strong> Adjust content strategy, improve SEO</li>
        <li style="${EMAIL_STYLES.listItem}"><strong>Scheduler not running:</strong> Check PM2 logs: <code style="${EMAIL_STYLES.inlineCode}">pm2 logs</code></li>
        <li style="${EMAIL_STYLES.listItem}"><strong>FFmpeg errors:</strong> Verify FFmpeg installation and PATH</li>
      </ul>
    </div>

    <h2 style="${EMAIL_STYLES.h2}">📚 Documentation</h2>

    <div style="${EMAIL_STYLES.section}">
      <ul style="${EMAIL_STYLES.list}">
        <li style="${EMAIL_STYLES.listItem}"><strong>Full Guide:</strong> <code style="${EMAIL_STYLES.inlineCode}">README.md</code></li>
        <li style="${EMAIL_STYLES.listItem}"><strong>API Reference:</strong> <code style="${EMAIL_STYLES.inlineCode}">docs/API.md</code></li>
        <li style="${EMAIL_STYLES.listItem}"><strong>Monetization Tips:</strong> <code style="${EMAIL_STYLES.inlineCode}">docs/MONETIZATION.md</code></li>
        <li style="${EMAIL_STYLES.listItem}"><strong>Support:</strong> <a href="mailto:${SUPPORT_EMAIL}" style="${EMAIL_STYLES.link}">${SUPPORT_EMAIL}</a></li>
      </ul>
    </div>

    <div style="text-align: center; margin: 40px 0;">
      <p style="font-size: 18px; font-weight: 600; color: #667eea;">
        Ready to build your YouTube income stream?
      </p>
      <p>
        <a href="mailto:${SUPPORT_EMAIL}" style="${EMAIL_STYLES.button}">Get Support</a>
      </p>
    </div>

  </div>

  <div style="${EMAIL_STYLES.footer}">
    <p><strong>AI Solutions Store</strong></p>
    <p>Automated revenue generation for content creators</p>
    <p style="font-size: 12px; margin-top: 15px;">
      Order ID: ${orderId} | ${email}
    </p>
  </div>

</body>
</html>
  `.trim();
};

/**
 * TEMPLATE 3: MARKETING ENGINE ($199)
 * Content Automation System
 */
const marketingEngineTemplate = (customerInfo) => {
  const { name, email, orderId, orderDate } = customerInfo;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Marketing Engine - Product Delivery</title>
</head>
<body style="${EMAIL_STYLES.container}">

  <div style="${EMAIL_STYLES.header}">
    <h1 style="${EMAIL_STYLES.h1}">Welcome to Marketing Engine!</h1>
    <p style="margin: 10px 0 0 0; font-size: 16px;">Automated Social Media Content</p>
  </div>

  <div style="padding: 30px 20px;">

    <p style="font-size: 16px; line-height: 1.6;">
      Hi ${name},
    </p>

    <p style="font-size: 16px; line-height: 1.6;">
      Thank you for purchasing <strong>Marketing Engine</strong>! Your social media automation system is ready.
      Generate and schedule professional content across Twitter, LinkedIn, and more.
    </p>

    <div style="${EMAIL_STYLES.success}">
      <strong>Order Confirmed:</strong> ${orderId}<br>
      <strong>Purchase Date:</strong> ${orderDate}<br>
      <strong>Product:</strong> Marketing Engine - Content Automation<br>
      <strong>Price:</strong> $199
    </div>

    <h2 style="${EMAIL_STYLES.h2}">🚀 Quick Start</h2>

    <h3 style="${EMAIL_STYLES.h3}">Step 1: Clone Repository</h3>
    <div style="${EMAIL_STYLES.section}">
      <p>
        <a href="https://github.com/Ai-Solutions-Store/marketing-engine" style="${EMAIL_STYLES.button}">
          Open GitHub Repository
        </a>
      </p>
      <pre style="${EMAIL_STYLES.code}">git clone https://github.com/Ai-Solutions-Store/marketing-engine.git
cd marketing-engine
npm install</pre>
    </div>

    <h3 style="${EMAIL_STYLES.h3}">Step 2: Configure Social Accounts</h3>
    <div style="${EMAIL_STYLES.section}">
      <p>Create <code style="${EMAIL_STYLES.inlineCode}">.env</code> file:</p>
      <pre style="${EMAIL_STYLES.code}"># AI Content Generation
OPENAI_API_KEY=your_openai_key_here
ANTHROPIC_API_KEY=your_anthropic_key_here

# Twitter/X API (OAuth 1.0a)
TWITTER_API_KEY=your_api_key
TWITTER_API_SECRET=your_api_secret
TWITTER_ACCESS_TOKEN=your_access_token
TWITTER_ACCESS_TOKEN_SECRET=your_token_secret

# LinkedIn API
LINKEDIN_CLIENT_ID=your_client_id
LINKEDIN_CLIENT_SECRET=your_client_secret
LINKEDIN_ACCESS_TOKEN=your_access_token

# Optional: Facebook, Instagram
FACEBOOK_ACCESS_TOKEN=your_token
INSTAGRAM_ACCESS_TOKEN=your_token

# Posting Schedule
POST_FREQUENCY=4h  # Every 4 hours
TIMEZONE=America/New_York</pre>
    </div>

    <h3 style="${EMAIL_STYLES.h3}">Step 3: Twitter/X API Setup</h3>
    <div style="${EMAIL_STYLES.section}">
      <ol style="${EMAIL_STYLES.list}">
        <li style="${EMAIL_STYLES.listItem}">Go to <a href="https://developer.twitter.com/en/portal/dashboard" style="${EMAIL_STYLES.link}">Twitter Developer Portal</a></li>
        <li style="${EMAIL_STYLES.listItem}">Create a new App (or use existing)</li>
        <li style="${EMAIL_STYLES.listItem}">Enable OAuth 1.0a with Read and Write permissions</li>
        <li style="${EMAIL_STYLES.listItem}">Generate API Key, API Secret, Access Token, and Access Token Secret</li>
        <li style="${EMAIL_STYLES.listItem}">Add credentials to <code style="${EMAIL_STYLES.inlineCode}">.env</code></li>
      </ol>

      <p><strong>Test Twitter connection:</strong></p>
      <pre style="${EMAIL_STYLES.code}">npm run test-twitter</pre>
    </div>

    <h3 style="${EMAIL_STYLES.h3}">Step 4: LinkedIn API Setup</h3>
    <div style="${EMAIL_STYLES.section}">
      <ol style="${EMAIL_STYLES.list}">
        <li style="${EMAIL_STYLES.listItem}">Go to <a href="https://www.linkedin.com/developers/apps" style="${EMAIL_STYLES.link}">LinkedIn Developers</a></li>
        <li style="${EMAIL_STYLES.listItem}">Create a new app</li>
        <li style="${EMAIL_STYLES.listItem}">Request access to "Sign In with LinkedIn" and "Share on LinkedIn"</li>
        <li style="${EMAIL_STYLES.listItem}">Add OAuth 2.0 redirect URL: <code style="${EMAIL_STYLES.inlineCode}">http://localhost:3000/auth/linkedin/callback</code></li>
        <li style="${EMAIL_STYLES.listItem}">Run authentication: <code style="${EMAIL_STYLES.inlineCode}">npm run linkedin-auth</code></li>
      </ol>

      <p><strong>Test LinkedIn connection:</strong></p>
      <pre style="${EMAIL_STYLES.code}">npm run test-linkedin</pre>
    </div>

    <h3 style="${EMAIL_STYLES.h3}">Step 5: Configure Content Strategy</h3>
    <div style="${EMAIL_STYLES.section}">
      <p>Edit <code style="${EMAIL_STYLES.inlineCode}">content-config.json</code>:</p>
      <pre style="${EMAIL_STYLES.code}">{
  "brand": {
    "name": "Your Brand",
    "voice": "professional and approachable",
    "industry": "technology",
    "targetAudience": "business professionals"
  },
  "contentTypes": [
    "industry insights",
    "tips and tricks",
    "news commentary",
    "thought leadership"
  ],
  "hashtags": {
    "twitter": ["#AI", "#TechNews", "#Innovation"],
    "linkedin": ["#Technology", "#Business", "#Leadership"]
  },
  "postingTimes": {
    "twitter": ["09:00", "13:00", "17:00", "21:00"],
    "linkedin": ["08:00", "12:00", "17:00"]
  }
}</pre>
    </div>

    <h3 style="${EMAIL_STYLES.h3}">Step 6: Start Marketing Engine</h3>
    <div style="${EMAIL_STYLES.section}">
      <p><strong>Generate content (no posting):</strong></p>
      <pre style="${EMAIL_STYLES.code}">npm run generate</pre>

      <p><strong>Post single item:</strong></p>
      <pre style="${EMAIL_STYLES.code}">npm run post -- --platform twitter --message "Your content here"</pre>

      <p><strong>Start automated scheduler:</strong></p>
      <pre style="${EMAIL_STYLES.code}">pm2 start ecosystem.config.js
pm2 save</pre>

      <p><strong>Monitor activity:</strong></p>
      <pre style="${EMAIL_STYLES.code}">pm2 logs marketing-engine</pre>
    </div>

    <h2 style="${EMAIL_STYLES.h2}">📝 Content Features</h2>

    <div style="${EMAIL_STYLES.section}">
      <ul style="${EMAIL_STYLES.list}">
        <li style="${EMAIL_STYLES.listItem}"><strong>AI-Generated Posts:</strong> Claude/GPT creates on-brand content</li>
        <li style="${EMAIL_STYLES.listItem}"><strong>Multi-Platform:</strong> Twitter, LinkedIn, Facebook, Instagram</li>
        <li style="${EMAIL_STYLES.listItem}"><strong>Smart Scheduling:</strong> Posts at optimal engagement times</li>
        <li style="${EMAIL_STYLES.listItem}"><strong>Hashtag Optimization:</strong> Platform-specific hashtag strategies</li>
        <li style="${EMAIL_STYLES.listItem}"><strong>Content Calendar:</strong> Plan weeks of content in advance</li>
        <li style="${EMAIL_STYLES.listItem}"><strong>Analytics:</strong> Track engagement and optimize</li>
      </ul>
    </div>

    <h2 style="${EMAIL_STYLES.h2}">🎯 Content Customization</h2>

    <div style="${EMAIL_STYLES.section}">
      <p><strong>Create custom templates:</strong></p>
      <pre style="${EMAIL_STYLES.code}">// templates/custom-template.js
module.exports = {
  name: "Product Launch",
  platforms: ["twitter", "linkedin"],
  generate: async (ai, context) => {
    return {
      twitter: "Exciting news! We just launched...",
      linkedin: "I'm thrilled to announce the launch of..."
    };
  }
};</pre>

      <p><strong>Use custom template:</strong></p>
      <pre style="${EMAIL_STYLES.code}">npm run generate -- --template product-launch</pre>
    </div>

    <h2 style="${EMAIL_STYLES.h2}">📊 Analytics Dashboard</h2>

    <div style="${EMAIL_STYLES.section}">
      <p><strong>Start dashboard:</strong></p>
      <pre style="${EMAIL_STYLES.code}">npm run dashboard
# Open http://localhost:3000</pre>

      <p><strong>View metrics:</strong></p>
      <ul style="${EMAIL_STYLES.list}">
        <li style="${EMAIL_STYLES.listItem}">Post performance (likes, shares, comments)</li>
        <li style="${EMAIL_STYLES.listItem}">Best posting times</li>
        <li style="${EMAIL_STYLES.listItem}">Engagement trends</li>
        <li style="${EMAIL_STYLES.listItem}">Follower growth</li>
      </ul>
    </div>

    <h2 style="${EMAIL_STYLES.h2}">🔧 Advanced Features</h2>

    <div style="${EMAIL_STYLES.section}">
      <p><strong>RSS Feed Integration:</strong></p>
      <pre style="${EMAIL_STYLES.code}"># Auto-share from RSS feeds
RSS_FEEDS=https://techcrunch.com/feed,https://blog.ai/feed
AUTO_SHARE_RSS=true</pre>

      <p><strong>Image Generation:</strong></p>
      <pre style="${EMAIL_STYLES.code}"># AI-generated images for posts
ENABLE_IMAGE_GEN=true
IMAGE_STYLE=professional</pre>

      <p><strong>A/B Testing:</strong></p>
      <pre style="${EMAIL_STYLES.code}"># Test different versions
npm run ab-test -- --variants 3</pre>
    </div>

    <h2 style="${EMAIL_STYLES.h2}">📚 Documentation</h2>

    <div style="${EMAIL_STYLES.section}">
      <ul style="${EMAIL_STYLES.list}">
        <li style="${EMAIL_STYLES.listItem}"><strong>Complete Guide:</strong> <code style="${EMAIL_STYLES.inlineCode}">README.md</code></li>
        <li style="${EMAIL_STYLES.listItem}"><strong>API Docs:</strong> <code style="${EMAIL_STYLES.inlineCode}">docs/API.md</code></li>
        <li style="${EMAIL_STYLES.listItem}"><strong>Templates:</strong> <code style="${EMAIL_STYLES.inlineCode}">docs/TEMPLATES.md</code></li>
        <li style="${EMAIL_STYLES.listItem}"><strong>Support:</strong> <a href="mailto:${SUPPORT_EMAIL}" style="${EMAIL_STYLES.link}">${SUPPORT_EMAIL}</a></li>
      </ul>
    </div>

    <div style="text-align: center; margin: 40px 0;">
      <p style="font-size: 18px; font-weight: 600; color: #667eea;">
        Automate your social media presence today!
      </p>
      <p>
        <a href="mailto:${SUPPORT_EMAIL}" style="${EMAIL_STYLES.button}">Get Support</a>
      </p>
    </div>

  </div>

  <div style="${EMAIL_STYLES.footer}">
    <p><strong>AI Solutions Store</strong></p>
    <p>Social media automation made simple</p>
    <p style="font-size: 12px; margin-top: 15px;">
      Order ID: ${orderId} | ${email}
    </p>
  </div>

</body>
</html>
  `.trim();
};

/**
 * TEMPLATE 4: JULES AI ($399)
 * Business Director AI
 */
const julesAiTemplate = (customerInfo) => {
  const { name, email, orderId, orderDate } = customerInfo;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Jules AI - Product Delivery</title>
</head>
<body style="${EMAIL_STYLES.container}">

  <div style="${EMAIL_STYLES.header}">
    <h1 style="${EMAIL_STYLES.h1}">Welcome to Jules AI!</h1>
    <p style="margin: 10px 0 0 0; font-size: 16px;">Your AI Business Director</p>
  </div>

  <div style="padding: 30px 20px;">

    <p style="font-size: 16px; line-height: 1.6;">
      Hi ${name},
    </p>

    <p style="font-size: 16px; line-height: 1.6;">
      Thank you for purchasing <strong>Jules AI</strong>! Your AI business director is ready to orchestrate
      your operations, manage Git workflows, and automate cloud infrastructure.
    </p>

    <div style="${EMAIL_STYLES.success}">
      <strong>Order Confirmed:</strong> ${orderId}<br>
      <strong>Purchase Date:</strong> ${orderDate}<br>
      <strong>Product:</strong> Jules AI - Business Director<br>
      <strong>Price:</strong> $399
    </div>

    <h2 style="${EMAIL_STYLES.h2}">🚀 Setup Guide</h2>

    <h3 style="${EMAIL_STYLES.h3}">Step 1: Clone Repository</h3>
    <div style="${EMAIL_STYLES.section}">
      <p>
        <a href="https://github.com/Ai-Solutions-Store/jules-ai" style="${EMAIL_STYLES.button}">
          Open GitHub Repository
        </a>
      </p>
      <pre style="${EMAIL_STYLES.code}">git clone https://github.com/Ai-Solutions-Store/jules-ai.git
cd jules-ai
npm install</pre>
    </div>

    <h3 style="${EMAIL_STYLES.h3}">Step 2: Gemini API Setup</h3>
    <div style="${EMAIL_STYLES.section}">
      <p><strong>Get Gemini API key:</strong></p>
      <ol style="${EMAIL_STYLES.list}">
        <li style="${EMAIL_STYLES.listItem}">Go to <a href="https://makersuite.google.com/app/apikey" style="${EMAIL_STYLES.link}">Google AI Studio</a></li>
        <li style="${EMAIL_STYLES.listItem}">Create a new API key</li>
        <li style="${EMAIL_STYLES.listItem}">Copy the key to your <code style="${EMAIL_STYLES.inlineCode}">.env</code> file</li>
      </ol>

      <p>Create <code style="${EMAIL_STYLES.inlineCode}">.env</code> file:</p>
      <pre style="${EMAIL_STYLES.code}"># Gemini AI (Primary)
GEMINI_API_KEY=your_gemini_api_key_here

# Optional: Backup AI providers
OPENAI_API_KEY=your_openai_key
ANTHROPIC_API_KEY=your_anthropic_key

# Git Integration
GITHUB_TOKEN=your_github_personal_access_token
GITHUB_ORG=your-org-name
GITHUB_REPOS=repo1,repo2,repo3

# Cloud Providers
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=us-east-1

GCP_PROJECT_ID=your_gcp_project_id
GCP_CREDENTIALS_PATH=./gcp-credentials.json

# Server
PORT=3000
NODE_ENV=production</pre>
    </div>

    <h3 style="${EMAIL_STYLES.h3}">Step 3: Git Integration</h3>
    <div style="${EMAIL_STYLES.section}">
      <p><strong>Create GitHub Personal Access Token:</strong></p>
      <ol style="${EMAIL_STYLES.list}">
        <li style="${EMAIL_STYLES.listItem}">Go to <a href="https://github.com/settings/tokens" style="${EMAIL_STYLES.link}">GitHub Settings → Tokens</a></li>
        <li style="${EMAIL_STYLES.listItem}">Generate new token (classic)</li>
        <li style="${EMAIL_STYLES.listItem}">Select scopes: <code style="${EMAIL_STYLES.inlineCode}">repo</code>, <code style="${EMAIL_STYLES.inlineCode}">workflow</code>, <code style="${EMAIL_STYLES.inlineCode}">admin:org</code></li>
        <li style="${EMAIL_STYLES.listItem}">Copy token to <code style="${EMAIL_STYLES.inlineCode}">.env</code></li>
      </ol>

      <p><strong>Configure monitored repositories:</strong></p>
      <pre style="${EMAIL_STYLES.code}"># In .env
GITHUB_REPOS=my-app,my-api,my-website

# Jules will monitor these repos for:
# - Pull requests
# - Issues
# - CI/CD failures
# - Security alerts</pre>
    </div>

    <h3 style="${EMAIL_STYLES.h3}">Step 4: Cloud Credentials</h3>
    <div style="${EMAIL_STYLES.section}">
      <p><strong>AWS Setup:</strong></p>
      <ol style="${EMAIL_STYLES.list}">
        <li style="${EMAIL_STYLES.listItem}">Go to <a href="https://console.aws.amazon.com/iam/" style="${EMAIL_STYLES.link}">AWS IAM Console</a></li>
        <li style="${EMAIL_STYLES.listItem}">Create new IAM user for Jules</li>
        <li style="${EMAIL_STYLES.listItem}">Attach policies: EC2, S3, Lambda, CloudWatch (based on needs)</li>
        <li style="${EMAIL_STYLES.listItem}">Generate access key and secret</li>
        <li style="${EMAIL_STYLES.listItem}">Add to <code style="${EMAIL_STYLES.inlineCode}">.env</code></li>
      </ol>

      <p><strong>GCP Setup:</strong></p>
      <ol style="${EMAIL_STYLES.list}">
        <li style="${EMAIL_STYLES.listItem}">Go to <a href="https://console.cloud.google.com/" style="${EMAIL_STYLES.link}">GCP Console</a></li>
        <li style="${EMAIL_STYLES.listItem}">Create service account for Jules</li>
        <li style="${EMAIL_STYLES.listItem}">Grant roles: Compute Admin, Storage Admin (based on needs)</li>
        <li style="${EMAIL_STYLES.listItem}">Download JSON credentials</li>
        <li style="${EMAIL_STYLES.listItem}">Save as <code style="${EMAIL_STYLES.inlineCode}">gcp-credentials.json</code></li>
      </ol>
    </div>

    <h3 style="${EMAIL_STYLES.h3}">Step 5: Start Jules AI</h3>
    <div style="${EMAIL_STYLES.section}">
      <p><strong>Development mode:</strong></p>
      <pre style="${EMAIL_STYLES.code}">npm run dev</pre>

      <p><strong>Production mode:</strong></p>
      <pre style="${EMAIL_STYLES.code}">npm start
# Or with PM2:
pm2 start ecosystem.config.js
pm2 save</pre>

      <p><strong>Access dashboard:</strong></p>
      <pre style="${EMAIL_STYLES.code}"># Open http://localhost:3000
# Default credentials: admin / jules123
# CHANGE PASSWORD IMMEDIATELY!</pre>
    </div>

    <h2 style="${EMAIL_STYLES.h2}">🎯 Core Features</h2>

    <div style="${EMAIL_STYLES.section}">
      <ul style="${EMAIL_STYLES.list}">
        <li style="${EMAIL_STYLES.listItem}"><strong>Git Orchestration:</strong> Auto-merge PRs, manage branches, resolve conflicts</li>
        <li style="${EMAIL_STYLES.listItem}"><strong>Cloud Automation:</strong> Deploy infrastructure, scale resources, monitor costs</li>
        <li style="${EMAIL_STYLES.listItem}"><strong>Business Intelligence:</strong> Analyze metrics, generate reports, predict trends</li>
        <li style="${EMAIL_STYLES.listItem}"><strong>Task Automation:</strong> Schedule jobs, run workflows, handle webhooks</li>
        <li style="${EMAIL_STYLES.listItem}"><strong>Alert Management:</strong> Monitor systems, respond to incidents, escalate issues</li>
      </ul>
    </div>

    <h2 style="${EMAIL_STYLES.h2}">💼 Business Director Capabilities</h2>

    <div style="${EMAIL_STYLES.section}">
      <p><strong>Example commands:</strong></p>
      <pre style="${EMAIL_STYLES.code}"># Chat interface
"Jules, review and merge PR #42"
"Deploy the latest version to production"
"Show me this week's user growth"
"Scale up EC2 instances for weekend traffic"
"Generate revenue report for last month"</pre>

      <p><strong>API endpoints:</strong></p>
      <pre style="${EMAIL_STYLES.code}"># RESTful API
POST /api/git/merge-pr
POST /api/cloud/deploy
GET /api/analytics/revenue
POST /api/automation/scale
GET /api/reports/generate</pre>
    </div>

    <h2 style="${EMAIL_STYLES.h2}">⚙️ Configuration</h2>

    <div style="${EMAIL_STYLES.section}">
      <p>Edit <code style="${EMAIL_STYLES.inlineCode}">jules-config.json</code>:</p>
      <pre style="${EMAIL_STYLES.code}">{
  "director": {
    "name": "Jules",
    "autonomy": "high",
    "decision_making": "auto-approve-low-risk"
  },
  "git": {
    "auto_merge": true,
    "require_tests": true,
    "branch_strategy": "gitflow"
  },
  "cloud": {
    "auto_scale": true,
    "cost_alerts": 1000,
    "backup_frequency": "daily"
  },
  "notifications": {
    "email": "${email}",
    "slack_webhook": "your_webhook_url",
    "sms": "your_phone_number"
  }
}</pre>
    </div>

    <h2 style="${EMAIL_STYLES.h2}">🔐 Security Best Practices</h2>

    <div style="${EMAIL_STYLES.section}">
      <ul style="${EMAIL_STYLES.list}">
        <li style="${EMAIL_STYLES.listItem}">Store credentials in <code style="${EMAIL_STYLES.inlineCode}">.env</code>, never commit to Git</li>
        <li style="${EMAIL_STYLES.listItem}">Use least-privilege IAM policies for cloud access</li>
        <li style="${EMAIL_STYLES.listItem}">Enable 2FA on GitHub and cloud accounts</li>
        <li style="${EMAIL_STYLES.listItem}">Rotate API keys regularly (every 90 days)</li>
        <li style="${EMAIL_STYLES.listItem}">Monitor Jules' actions via audit logs</li>
        <li style="${EMAIL_STYLES.listItem}">Set spending limits on cloud accounts</li>
      </ul>
    </div>

    <h2 style="${EMAIL_STYLES.h2}">📊 Dashboard Features</h2>

    <div style="${EMAIL_STYLES.section}">
      <ul style="${EMAIL_STYLES.list}">
        <li style="${EMAIL_STYLES.listItem}"><strong>Real-time monitoring:</strong> System health, deployments, alerts</li>
        <li style="${EMAIL_STYLES.listItem}"><strong>Git overview:</strong> PRs, commits, branches across all repos</li>
        <li style="${EMAIL_STYLES.listItem}"><strong>Cloud resources:</strong> EC2, S3, Lambda, costs</li>
        <li style="${EMAIL_STYLES.listItem}"><strong>Analytics:</strong> Business metrics, KPIs, trends</li>
        <li style="${EMAIL_STYLES.listItem}"><strong>Chat interface:</strong> Direct commands to Jules</li>
      </ul>
    </div>

    <h2 style="${EMAIL_STYLES.h2}">🔧 Troubleshooting</h2>

    <div style="${EMAIL_STYLES.section}">
      <p><strong>Common issues:</strong></p>
      <ul style="${EMAIL_STYLES.list}">
        <li style="${EMAIL_STYLES.listItem}"><strong>Gemini API errors:</strong> Check quota limits and billing</li>
        <li style="${EMAIL_STYLES.listItem}"><strong>GitHub auth fails:</strong> Verify token scopes and expiration</li>
        <li style="${EMAIL_STYLES.listItem}"><strong>Cloud access denied:</strong> Review IAM permissions</li>
        <li style="${EMAIL_STYLES.listItem}"><strong>Dashboard not loading:</strong> Check port 3000 availability</li>
      </ul>

      <p><strong>View logs:</strong></p>
      <pre style="${EMAIL_STYLES.code}">pm2 logs jules-ai
# Or direct: npm run logs</pre>
    </div>

    <h2 style="${EMAIL_STYLES.h2}">📚 Documentation</h2>

    <div style="${EMAIL_STYLES.section}">
      <ul style="${EMAIL_STYLES.list}">
        <li style="${EMAIL_STYLES.listItem}"><strong>Full Guide:</strong> <code style="${EMAIL_STYLES.inlineCode}">README.md</code></li>
        <li style="${EMAIL_STYLES.listItem}"><strong>API Reference:</strong> <code style="${EMAIL_STYLES.inlineCode}">docs/API.md</code></li>
        <li style="${EMAIL_STYLES.listItem}"><strong>Examples:</strong> <code style="${EMAIL_STYLES.inlineCode}">examples/</code> folder</li>
        <li style="${EMAIL_STYLES.listItem}"><strong>Support:</strong> <a href="mailto:${SUPPORT_EMAIL}" style="${EMAIL_STYLES.link}">${SUPPORT_EMAIL}</a></li>
      </ul>
    </div>

    <div style="text-align: center; margin: 40px 0;">
      <p style="font-size: 18px; font-weight: 600; color: #667eea;">
        Let Jules run your business operations!
      </p>
      <p>
        <a href="mailto:${SUPPORT_EMAIL}" style="${EMAIL_STYLES.button}">Get Support</a>
      </p>
    </div>

  </div>

  <div style="${EMAIL_STYLES.footer}">
    <p><strong>AI Solutions Store</strong></p>
    <p>Business automation powered by AI</p>
    <p style="font-size: 12px; margin-top: 15px;">
      Order ID: ${orderId} | ${email}
    </p>
  </div>

</body>
</html>
  `.trim();
};

/**
 * TEMPLATE 5: AFFILIATE SYSTEM ($599)
 * White-label Platform
 */
const affiliateSystemTemplate = (customerInfo) => {
  const { name, email, orderId, orderDate } = customerInfo;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Affiliate System - Product Delivery</title>
</head>
<body style="${EMAIL_STYLES.container}">

  <div style="${EMAIL_STYLES.header}">
    <h1 style="${EMAIL_STYLES.h1}">Welcome to Affiliate System!</h1>
    <p style="margin: 10px 0 0 0; font-size: 16px;">White-label Affiliate Platform</p>
  </div>

  <div style="padding: 30px 20px;">

    <p style="font-size: 16px; line-height: 1.6;">
      Hi ${name},
    </p>

    <p style="font-size: 16px; line-height: 1.6;">
      Thank you for purchasing the <strong>Affiliate System</strong>! Your white-label affiliate platform
      is ready to deploy. Build your own affiliate network with custom commission tiers and tracking.
    </p>

    <div style="${EMAIL_STYLES.success}">
      <strong>Order Confirmed:</strong> ${orderId}<br>
      <strong>Purchase Date:</strong> ${orderDate}<br>
      <strong>Product:</strong> Affiliate System - White-label Platform<br>
      <strong>Price:</strong> $599
    </div>

    <h2 style="${EMAIL_STYLES.h2}">🚀 Deployment Guide</h2>

    <h3 style="${EMAIL_STYLES.h3}">Step 1: Clone Repository</h3>
    <div style="${EMAIL_STYLES.section}">
      <p>
        <a href="https://github.com/Ai-Solutions-Store/affiliate-system" style="${EMAIL_STYLES.button}">
          Open GitHub Repository
        </a>
      </p>
      <pre style="${EMAIL_STYLES.code}">git clone https://github.com/Ai-Solutions-Store/affiliate-system.git
cd affiliate-system
npm install</pre>
    </div>

    <h3 style="${EMAIL_STYLES.h3}">Step 2: Database Setup (PostgreSQL)</h3>
    <div style="${EMAIL_STYLES.section}">
      <p><strong>Install PostgreSQL:</strong></p>
      <ul style="${EMAIL_STYLES.list}">
        <li style="${EMAIL_STYLES.listItem}"><strong>Local:</strong> <a href="https://www.postgresql.org/download/" style="${EMAIL_STYLES.link}">Download PostgreSQL</a></li>
        <li style="${EMAIL_STYLES.listItem}"><strong>Cloud:</strong> Use AWS RDS, Supabase, or Neon</li>
      </ul>

      <p><strong>Create database:</strong></p>
      <pre style="${EMAIL_STYLES.code}">createdb affiliate_system
# Or via psql:
psql -U postgres
CREATE DATABASE affiliate_system;</pre>

      <p><strong>Configure connection:</strong></p>
      <pre style="${EMAIL_STYLES.code}"># .env
DATABASE_URL=postgresql://username:password@localhost:5432/affiliate_system

# For cloud (example):
# DATABASE_URL=postgresql://user:pass@aws-rds-endpoint:5432/dbname</pre>

      <p><strong>Run migrations:</strong></p>
      <pre style="${EMAIL_STYLES.code}">npm run migrate</pre>
    </div>

    <h3 style="${EMAIL_STYLES.h3}">Step 3: Configure Commission Tiers</h3>
    <div style="${EMAIL_STYLES.section}">
      <p>Edit <code style="${EMAIL_STYLES.inlineCode}">config/commission-tiers.json</code>:</p>
      <pre style="${EMAIL_STYLES.code}">{
  "tiers": [
    {
      "name": "Bronze",
      "commission": 0.10,
      "minSales": 0,
      "color": "#CD7F32"
    },
    {
      "name": "Silver",
      "commission": 0.15,
      "minSales": 10,
      "color": "#C0C0C0"
    },
    {
      "name": "Gold",
      "commission": 0.20,
      "minSales": 50,
      "color": "#FFD700"
    },
    {
      "name": "Platinum",
      "commission": 0.25,
      "minSales": 100,
      "color": "#E5E4E2"
    }
  ],
  "cookieDuration": 30,
  "payoutThreshold": 50,
  "payoutSchedule": "monthly"
}</pre>
    </div>

    <h3 style="${EMAIL_STYLES.h3}">Step 4: Payment Integration</h3>
    <div style="${EMAIL_STYLES.section}">
      <p>Create <code style="${EMAIL_STYLES.inlineCode}">.env</code> file:</p>
      <pre style="${EMAIL_STYLES.code}"># Database
DATABASE_URL=postgresql://user:pass@host:5432/affiliate_system

# Payment Processors
STRIPE_SECRET_KEY=sk_test_your_stripe_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
PAYPAL_CLIENT_ID=your_paypal_client_id
PAYPAL_CLIENT_SECRET=your_paypal_secret

# Payout Settings
PAYOUT_METHOD=stripe  # or 'paypal'
PAYOUT_SCHEDULE=monthly  # or 'weekly', 'biweekly'
MIN_PAYOUT=50.00

# App Settings
PORT=3001
NODE_ENV=production
JWT_SECRET=your_secure_jwt_secret_here
ADMIN_EMAIL=${email}

# Email Service (for notifications)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password</pre>
    </div>

    <h3 style="${EMAIL_STYLES.h3}">Step 5: Stripe Connect Setup</h3>
    <div style="${EMAIL_STYLES.section}">
      <p><strong>For affiliate payouts via Stripe:</strong></p>
      <ol style="${EMAIL_STYLES.list}">
        <li style="${EMAIL_STYLES.listItem}">Go to <a href="https://dashboard.stripe.com/" style="${EMAIL_STYLES.link}">Stripe Dashboard</a></li>
        <li style="${EMAIL_STYLES.listItem}">Enable Stripe Connect</li>
        <li style="${EMAIL_STYLES.listItem}">Set up platform settings</li>
        <li style="${EMAIL_STYLES.listItem}">Configure payout schedule</li>
        <li style="${EMAIL_STYLES.listItem}">Add webhook endpoint: <code style="${EMAIL_STYLES.inlineCode}">https://yourdomain.com/webhooks/stripe</code></li>
      </ol>

      <div style="${EMAIL_STYLES.warning}">
        <strong>⚠️ Webhook Events to Listen For:</strong>
        <ul style="${EMAIL_STYLES.list}">
          <li style="${EMAIL_STYLES.listItem}"><code style="${EMAIL_STYLES.inlineCode}">payment_intent.succeeded</code></li>
          <li style="${EMAIL_STYLES.listItem}"><code style="${EMAIL_STYLES.inlineCode}">charge.refunded</code></li>
          <li style="${EMAIL_STYLES.listItem}"><code style="${EMAIL_STYLES.inlineCode}">account.updated</code></li>
        </ul>
      </div>
    </div>

    <h3 style="${EMAIL_STYLES.h3}">Step 6: Tracking Setup</h3>
    <div style="${EMAIL_STYLES.section}">
      <p><strong>Generate tracking code for your site:</strong></p>
      <pre style="${EMAIL_STYLES.code}">npm run generate-tracking-code</pre>

      <p><strong>Add to your website:</strong></p>
      <pre style="${EMAIL_STYLES.code}">&lt;!-- Place before closing &lt;/body&gt; tag --&gt;
&lt;script src="https://yourdomain.com/tracking.js"&gt;&lt;/script&gt;
&lt;script&gt;
  AffiliateTracker.init({
    domain: 'yourdomain.com',
    cookieDuration: 30
  });
&lt;/script&gt;</pre>

      <p><strong>Track conversions:</strong></p>
      <pre style="${EMAIL_STYLES.code}">&lt;!-- On purchase confirmation page --&gt;
&lt;script&gt;
  AffiliateTracker.conversion({
    orderId: '12345',
    amount: 99.99,
    currency: 'USD'
  });
&lt;/script&gt;</pre>
    </div>

    <h3 style="${EMAIL_STYLES.h3}">Step 7: Launch Platform</h3>
    <div style="${EMAIL_STYLES.section}">
      <p><strong>Development:</strong></p>
      <pre style="${EMAIL_STYLES.code}">npm run dev</pre>

      <p><strong>Production:</strong></p>
      <pre style="${EMAIL_STYLES.code}">npm run build
npm start
# Or with PM2:
pm2 start ecosystem.config.js
pm2 save</pre>

      <p><strong>Access admin panel:</strong></p>
      <pre style="${EMAIL_STYLES.code}"># http://localhost:3001/admin
# Default: admin@yourdomain.com / changeme123
# CHANGE PASSWORD IMMEDIATELY!</pre>
    </div>

    <h2 style="${EMAIL_STYLES.h2}">💰 Commission Structure</h2>

    <div style="${EMAIL_STYLES.section}">
      <ul style="${EMAIL_STYLES.list}">
        <li style="${EMAIL_STYLES.listItem}"><strong>Cookie Tracking:</strong> 30-day attribution window</li>
        <li style="${EMAIL_STYLES.listItem}"><strong>Auto-Tiering:</strong> Affiliates auto-upgrade based on sales</li>
        <li style="${EMAIL_STYLES.listItem}"><strong>Recurring Commissions:</strong> Support for subscription products</li>
        <li style="${EMAIL_STYLES.listItem}"><strong>Performance Bonuses:</strong> Configure milestone rewards</li>
        <li style="${EMAIL_STYLES.listItem}"><strong>Multi-Currency:</strong> Support for global affiliates</li>
      </ul>
    </div>

    <h2 style="${EMAIL_STYLES.h2}">📊 Dashboard Features</h2>

    <div style="${EMAIL_STYLES.section}">
      <p><strong>Admin Dashboard:</strong></p>
      <ul style="${EMAIL_STYLES.list}">
        <li style="${EMAIL_STYLES.listItem}">Affiliate management (approve, suspend, delete)</li>
        <li style="${EMAIL_STYLES.listItem}">Commission tracking and payouts</li>
        <li style="${EMAIL_STYLES.listItem}">Analytics and reporting</li>
        <li style="${EMAIL_STYLES.listItem}">Fraud detection alerts</li>
      </ul>

      <p><strong>Affiliate Dashboard:</strong></p>
      <ul style="${EMAIL_STYLES.list}">
        <li style="${EMAIL_STYLES.listItem}">Real-time earnings tracker</li>
        <li style="${EMAIL_STYLES.listItem}">Custom referral links</li>
        <li style="${EMAIL_STYLES.listItem}">Marketing materials download</li>
        <li style="${EMAIL_STYLES.listItem}">Payout history and requests</li>
      </ul>
    </div>

    <h2 style="${EMAIL_STYLES.h2}">🎨 White-label Customization</h2>

    <div style="${EMAIL_STYLES.section}">
      <p>Edit <code style="${EMAIL_STYLES.inlineCode}">config/branding.json</code>:</p>
      <pre style="${EMAIL_STYLES.code}">{
  "brandName": "Your Brand",
  "logo": "/assets/logo.png",
  "primaryColor": "#667eea",
  "secondaryColor": "#764ba2",
  "domain": "affiliates.yourdomain.com",
  "supportEmail": "affiliates@yourdomain.com",
  "termsUrl": "https://yourdomain.com/terms",
  "privacyUrl": "https://yourdomain.com/privacy"
}</pre>

      <p><strong>Custom domain setup:</strong></p>
      <pre style="${EMAIL_STYLES.code}"># Point DNS to your server:
# A Record: affiliates.yourdomain.com → your_server_ip

# Configure SSL:
sudo certbot --nginx -d affiliates.yourdomain.com</pre>
    </div>

    <h2 style="${EMAIL_STYLES.h2}">🔐 Security Features</h2>

    <div style="${EMAIL_STYLES.section}">
      <ul style="${EMAIL_STYLES.list}">
        <li style="${EMAIL_STYLES.listItem}"><strong>Fraud Detection:</strong> Monitors suspicious click patterns</li>
        <li style="${EMAIL_STYLES.listItem}"><strong>IP Tracking:</strong> Prevents self-referrals</li>
        <li style="${EMAIL_STYLES.listItem}"><strong>Rate Limiting:</strong> Protects against abuse</li>
        <li style="${EMAIL_STYLES.listItem}"><strong>2FA Support:</strong> Optional for affiliates</li>
        <li style="${EMAIL_STYLES.listItem}"><strong>Audit Logs:</strong> Track all admin actions</li>
      </ul>
    </div>

    <h2 style="${EMAIL_STYLES.h2}">📧 Email Notifications</h2>

    <div style="${EMAIL_STYLES.section}">
      <p><strong>Automated emails for:</strong></p>
      <ul style="${EMAIL_STYLES.list}">
        <li style="${EMAIL_STYLES.listItem}">Affiliate application (approval/rejection)</li>
        <li style="${EMAIL_STYLES.listItem}">First commission earned</li>
        <li style="${EMAIL_STYLES.listItem}">Tier upgrades</li>
        <li style="${EMAIL_STYLES.listItem}">Payout processed</li>
        <li style="${EMAIL_STYLES.listItem}">Monthly performance reports</li>
      </ul>

      <p>Customize templates in <code style="${EMAIL_STYLES.inlineCode}">templates/emails/</code></p>
    </div>

    <h2 style="${EMAIL_STYLES.h2}">🔧 Advanced Configuration</h2>

    <div style="${EMAIL_STYLES.section}">
      <p><strong>Multi-tier commissions:</strong></p>
      <pre style="${EMAIL_STYLES.code}">{
  "enableMLM": false,  // Multi-level marketing
  "maxLevels": 2,
  "level1Commission": 0.15,
  "level2Commission": 0.05
}</pre>

      <p><strong>Product-specific commissions:</strong></p>
      <pre style="${EMAIL_STYLES.code}">{
  "products": [
    { "id": "prod_1", "commission": 0.20 },
    { "id": "prod_2", "commission": 0.15 }
  ]
}</pre>
    </div>

    <h2 style="${EMAIL_STYLES.h2}">📚 Documentation</h2>

    <div style="${EMAIL_STYLES.section}">
      <ul style="${EMAIL_STYLES.list}">
        <li style="${EMAIL_STYLES.listItem}"><strong>Setup Guide:</strong> <code style="${EMAIL_STYLES.inlineCode}">README.md</code></li>
        <li style="${EMAIL_STYLES.listItem}"><strong>API Docs:</strong> <code style="${EMAIL_STYLES.inlineCode}">docs/API.md</code></li>
        <li style="${EMAIL_STYLES.listItem}"><strong>Database Schema:</strong> <code style="${EMAIL_STYLES.inlineCode}">docs/SCHEMA.md</code></li>
        <li style="${EMAIL_STYLES.listItem}"><strong>Customization:</strong> <code style="${EMAIL_STYLES.inlineCode}">docs/CUSTOMIZATION.md</code></li>
        <li style="${EMAIL_STYLES.listItem}"><strong>Support:</strong> <a href="mailto:${SUPPORT_EMAIL}" style="${EMAIL_STYLES.link}">${SUPPORT_EMAIL}</a></li>
      </ul>
    </div>

    <div style="text-align: center; margin: 40px 0;">
      <p style="font-size: 18px; font-weight: 600; color: #667eea;">
        Build your affiliate empire today!
      </p>
      <p>
        <a href="mailto:${SUPPORT_EMAIL}" style="${EMAIL_STYLES.button}">Get Support</a>
      </p>
    </div>

  </div>

  <div style="${EMAIL_STYLES.footer}">
    <p><strong>AI Solutions Store</strong></p>
    <p>White-label affiliate platform for your business</p>
    <p style="font-size: 12px; margin-top: 15px;">
      Order ID: ${orderId} | ${email}
    </p>
  </div>

</body>
</html>
  `.trim();
};

/**
 * TEMPLATE 6: DATING PLATFORM ($2,499)
 * YouAndINotAI - AI-Free Dating
 */
const datingPlatformTemplate = (customerInfo) => {
  const { name, email, orderId, orderDate } = customerInfo;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>YouAndINotAI - Product Delivery</title>
</head>
<body style="${EMAIL_STYLES.container}">

  <div style="${EMAIL_STYLES.header}">
    <h1 style="${EMAIL_STYLES.h1}">Welcome to YouAndINotAI!</h1>
    <p style="margin: 10px 0 0 0; font-size: 16px;">AI-Free Dating Platform</p>
  </div>

  <div style="padding: 30px 20px;">

    <p style="font-size: 16px; line-height: 1.6;">
      Hi ${name},
    </p>

    <p style="font-size: 16px; line-height: 1.6;">
      Thank you for purchasing <strong>YouAndINotAI</strong>! Your AI-free dating platform is ready to deploy.
      This complete white-label solution includes AI detection, verification systems, and payment integration.
    </p>

    <div style="${EMAIL_STYLES.success}">
      <strong>Order Confirmed:</strong> ${orderId}<br>
      <strong>Purchase Date:</strong> ${orderDate}<br>
      <strong>Product:</strong> YouAndINotAI - Dating Platform<br>
      <strong>Price:</strong> $2,499
    </div>

    <div style="${EMAIL_STYLES.warning}">
      <strong>⚠️ High-Risk Merchant Account Required</strong><br>
      Dating platforms require MCC 7273 merchant accounts. See deployment guide for approved processors.
    </div>

    <h2 style="${EMAIL_STYLES.h2}">🚀 Full Deployment Guide</h2>

    <h3 style="${EMAIL_STYLES.h3}">Step 1: Clone Repository</h3>
    <div style="${EMAIL_STYLES.section}">
      <p>
        <a href="https://github.com/Ai-Solutions-Store/youandinotai" style="${EMAIL_STYLES.button}">
          Open GitHub Repository
        </a>
      </p>
      <pre style="${EMAIL_STYLES.code}">git clone https://github.com/Ai-Solutions-Store/youandinotai.git
cd youandinotai
npm install</pre>
    </div>

    <h3 style="${EMAIL_STYLES.h3}">Step 2: Database Setup (PostgreSQL)</h3>
    <div style="${EMAIL_STYLES.section}">
      <p><strong>Recommended: Use managed PostgreSQL:</strong></p>
      <ul style="${EMAIL_STYLES.list}">
        <li style="${EMAIL_STYLES.listItem}"><strong>Supabase:</strong> <a href="https://supabase.com" style="${EMAIL_STYLES.link}">Free tier available</a></li>
        <li style="${EMAIL_STYLES.listItem}"><strong>Neon:</strong> <a href="https://neon.tech" style="${EMAIL_STYLES.link}">Serverless PostgreSQL</a></li>
        <li style="${EMAIL_STYLES.listItem}"><strong>AWS RDS:</strong> For production scale</li>
      </ul>

      <p><strong>Create database and run migrations:</strong></p>
      <pre style="${EMAIL_STYLES.code}">createdb youandinotai
npm run migrate
npm run seed  # Optional: Test data</pre>
    </div>

    <h3 style="${EMAIL_STYLES.h3}">Step 3: Environment Configuration</h3>
    <div style="${EMAIL_STYLES.section}">
      <p>Create <code style="${EMAIL_STYLES.inlineCode}">.env</code> file:</p>
      <pre style="${EMAIL_STYLES.code}"># Database
DATABASE_URL=postgresql://user:pass@host:5432/youandinotai

# App Settings
PORT=3003
NODE_ENV=production
SITE_URL=https://yourdomain.com
JWT_SECRET=your_secure_jwt_secret_here

# AI Detection (OpenAI Moderation API)
OPENAI_API_KEY=your_openai_key_here

# Payment (High-risk merchant required)
PAYMENT_PROCESSOR=stripe  # or 'ccbill', 'segpay'
STRIPE_SECRET_KEY=sk_live_your_key
STRIPE_WEBHOOK_SECRET=whsec_your_secret

# Alternative processors for high-risk:
# CCBILL_ACCOUNT_ID=your_account
# CCBILL_FORM_ID=your_form
# SEGPAY_ACCESS_KEY=your_key

# Subscription Tiers
BASIC_PRICE=9.99
PREMIUM_PRICE=19.99
ELITE_PRICE=29.99

# Storage (S3 for profile photos)
AWS_ACCESS_KEY_ID=your_aws_key
AWS_SECRET_ACCESS_KEY=your_aws_secret
AWS_S3_BUCKET=youandinotai-photos
AWS_REGION=us-east-1

# Email/SMS Verification
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
TWILIO_PHONE_NUMBER=+1234567890

SENDGRID_API_KEY=your_sendgrid_key
FROM_EMAIL=noreply@yourdomain.com

# Moderation
ENABLE_AUTO_MODERATION=true
MODERATOR_EMAILS=${email}</pre>
    </div>

    <h3 style="${EMAIL_STYLES.h3}">Step 4: AI Detection Setup</h3>
    <div style="${EMAIL_STYLES.section}">
      <p><strong>Photo verification system:</strong></p>
      <ul style="${EMAIL_STYLES.list}">
        <li style="${EMAIL_STYLES.listItem}">OpenAI Moderation API for content filtering</li>
        <li style="${EMAIL_STYLES.listItem}">EXIF data analysis for AI-generated images</li>
        <li style="${EMAIL_STYLES.listItem}">Reverse image search integration</li>
        <li style="${EMAIL_STYLES.listItem}">Manual review queue for flagged content</li>
      </ul>

      <p><strong>Configure AI detection thresholds:</strong></p>
      <pre style="${EMAIL_STYLES.code}"># config/moderation.json
{
  "aiDetection": {
    "enabled": true,
    "threshold": 0.7,
    "autoReject": false,
    "requireManualReview": true
  },
  "contentFilters": {
    "nudity": true,
    "violence": true,
    "hate": true,
    "selfHarm": true
  }
}</pre>
    </div>

    <h3 style="${EMAIL_STYLES.h3}">Step 5: Verification System</h3>
    <div style="${EMAIL_STYLES.section}">
      <p><strong>Multi-tier verification:</strong></p>
      <ol style="${EMAIL_STYLES.list}">
        <li style="${EMAIL_STYLES.listItem}"><strong>Email:</strong> Automated via SendGrid</li>
        <li style="${EMAIL_STYLES.listItem}"><strong>Phone:</strong> SMS via Twilio</li>
        <li style="${EMAIL_STYLES.listItem}"><strong>Photo:</strong> Selfie with pose verification</li>
        <li style="${EMAIL_STYLES.listItem}"><strong>ID (Premium):</strong> Government ID verification</li>
      </ol>

      <p><strong>Enable ID verification (optional):</strong></p>
      <pre style="${EMAIL_STYLES.code}"># Requires Stripe Identity or similar
ENABLE_ID_VERIFICATION=true
ID_PROVIDER=stripe  # or 'persona', 'onfido'
STRIPE_IDENTITY_SECRET=your_identity_key</pre>
    </div>

    <h3 style="${EMAIL_STYLES.h3}">Step 6: Payment Integration</h3>
    <div style="${EMAIL_STYLES.section}">
      <div style="${EMAIL_STYLES.warning}">
        <strong>⚠️ Dating Platform Payments (MCC 7273):</strong><br><br>
        <strong>Standard processors (Stripe, Square) often decline dating sites.</strong><br><br>
        <strong>Approved processors:</strong>
        <ul style="${EMAIL_STYLES.list}">
          <li style="${EMAIL_STYLES.listItem}"><strong>CCBill:</strong> Industry standard for dating</li>
          <li style="${EMAIL_STYLES.listItem}"><strong>SegPay:</strong> High-risk merchant specialist</li>
          <li style="${EMAIL_STYLES.listItem}"><strong>Epoch:</strong> Dating-friendly processor</li>
          <li style="${EMAIL_STYLES.listItem}"><strong>AWS Marketplace:</strong> Alternative billing route</li>
        </ul>
      </div>

      <p><strong>Configure subscription tiers:</strong></p>
      <pre style="${EMAIL_STYLES.code}"># config/subscriptions.json
{
  "tiers": [
    {
      "name": "Basic",
      "price": 9.99,
      "features": [
        "Browse profiles",
        "5 likes per day",
        "Basic matching"
      ]
    },
    {
      "name": "Premium",
      "price": 19.99,
      "features": [
        "Unlimited likes",
        "Advanced filters",
        "See who liked you",
        "Priority support"
      ]
    },
    {
      "name": "Elite",
      "price": 29.99,
      "features": [
        "All Premium features",
        "Profile boost",
        "ID verification badge",
        "Concierge matching"
      ]
    }
  ]
}</pre>
    </div>

    <h3 style="${EMAIL_STYLES.h3}">Step 7: Moderation Tools</h3>
    <div style="${EMAIL_STYLES.section}">
      <p><strong>Admin moderation dashboard:</strong></p>
      <pre style="${EMAIL_STYLES.code}"># Access at /admin/moderation
# Features:
# - Review flagged profiles
# - AI detection overrides
# - User reports queue
# - Ban/suspend users
# - Content approval</pre>

      <p><strong>Automated moderation rules:</strong></p>
      <pre style="${EMAIL_STYLES.code}">{
  "autoActions": {
    "suspendAfterReports": 3,
    "banAfterSuspensions": 2,
    "requireReviewForAI": true,
    "blockExplicitContent": true
  }
}</pre>
    </div>

    <h3 style="${EMAIL_STYLES.h3}">Step 8: Deploy Platform</h3>
    <div style="${EMAIL_STYLES.section}">
      <p><strong>Build and start:</strong></p>
      <pre style="${EMAIL_STYLES.code}">npm run build
npm start
# Or with PM2:
pm2 start ecosystem.config.js
pm2 save</pre>

      <p><strong>Access admin panel:</strong></p>
      <pre style="${EMAIL_STYLES.code}"># http://yourdomain.com/admin
# Default: admin@yourdomain.com / changeme123
# CHANGE PASSWORD IMMEDIATELY!</pre>
    </div>

    <h2 style="${EMAIL_STYLES.h2}">🎨 White-label Customization</h2>

    <div style="${EMAIL_STYLES.section}">
      <p>Edit <code style="${EMAIL_STYLES.inlineCode}">config/branding.json</code>:</p>
      <pre style="${EMAIL_STYLES.code}">{
  "siteName": "YourDatingSite",
  "logo": "/assets/logo.png",
  "tagline": "Find Real Love, Not AI",
  "primaryColor": "#e91e63",
  "secondaryColor": "#9c27b0",
  "domain": "yourdatingsite.com",
  "supportEmail": "support@yourdatingsite.com",
  "socialMedia": {
    "twitter": "@yourdatingsite",
    "instagram": "@yourdatingsite",
    "facebook": "yourdatingsite"
  }
}</pre>
    </div>

    <h2 style="${EMAIL_STYLES.h2}">📱 Features Included</h2>

    <div style="${EMAIL_STYLES.section}">
      <ul style="${EMAIL_STYLES.list}">
        <li style="${EMAIL_STYLES.listItem}"><strong>User Profiles:</strong> Bio, photos, interests, preferences</li>
        <li style="${EMAIL_STYLES.listItem}"><strong>Matching Algorithm:</strong> AI-free compatibility scoring</li>
        <li style="${EMAIL_STYLES.listItem}"><strong>Messaging:</strong> Real-time chat with encryption</li>
        <li style="${EMAIL_STYLES.listItem}"><strong>Photo Verification:</strong> Selfie pose matching</li>
        <li style="${EMAIL_STYLES.listItem}"><strong>Geolocation:</strong> Distance-based matching</li>
        <li style="${EMAIL_STYLES.listItem}"><strong>Reporting:</strong> Block, report, unmatch</li>
        <li style="${EMAIL_STYLES.listItem}"><strong>Premium Features:</strong> Boosts, super likes, filters</li>
        <li style="${EMAIL_STYLES.listItem}"><strong>Safety Center:</strong> Dating tips, resources</li>
      </ul>
    </div>

    <h2 style="${EMAIL_STYLES.h2}">🔐 Security & Privacy</h2>

    <div style="${EMAIL_STYLES.section}">
      <ul style="${EMAIL_STYLES.list}">
        <li style="${EMAIL_STYLES.listItem}"><strong>End-to-end encryption:</strong> Private messages</li>
        <li style="${EMAIL_STYLES.listItem}"><strong>Data privacy:</strong> GDPR/CCPA compliant</li>
        <li style="${EMAIL_STYLES.listItem}"><strong>Location blur:</strong> Approximate location only</li>
        <li style="${EMAIL_STYLES.listItem}"><strong>Photo control:</strong> Users control visibility</li>
        <li style="${EMAIL_STYLES.listItem}"><strong>Unmatch protection:</strong> Messages deleted on unmatch</li>
      </ul>
    </div>

    <h2 style="${EMAIL_STYLES.h2}">📄 Legal Requirements</h2>

    <div style="${EMAIL_STYLES.section}">
      <p><strong>Required policies (templates included):</strong></p>
      <ul style="${EMAIL_STYLES.list}">
        <li style="${EMAIL_STYLES.listItem}">Terms of Service (<code style="${EMAIL_STYLES.inlineCode}">templates/tos.html</code>)</li>
        <li style="${EMAIL_STYLES.listItem}">Privacy Policy (<code style="${EMAIL_STYLES.inlineCode}">templates/privacy.html</code>)</li>
        <li style="${EMAIL_STYLES.listItem}">Community Guidelines (<code style="${EMAIL_STYLES.inlineCode}">templates/guidelines.html</code>)</li>
        <li style="${EMAIL_STYLES.listItem}">Cookie Policy (<code style="${EMAIL_STYLES.inlineCode}">templates/cookies.html</code>)</li>
      </ul>

      <div style="${EMAIL_STYLES.warning}">
        <strong>⚠️ Important:</strong> Customize these templates with your business details and have them reviewed by a lawyer familiar with online dating regulations.
      </div>
    </div>

    <h2 style="${EMAIL_STYLES.h2}">📊 Analytics & Insights</h2>

    <div style="${EMAIL_STYLES.section}">
      <p><strong>Admin dashboard includes:</strong></p>
      <ul style="${EMAIL_STYLES.list}">
        <li style="${EMAIL_STYLES.listItem}">User growth metrics</li>
        <li style="${EMAIL_STYLES.listItem}">Match success rates</li>
        <li style="${EMAIL_STYLES.listItem}">Revenue tracking</li>
        <li style="${EMAIL_STYLES.listItem}">Subscription conversions</li>
        <li style="${EMAIL_STYLES.listItem}">Engagement analytics</li>
        <li style="${EMAIL_STYLES.listItem}">AI detection reports</li>
      </ul>
    </div>

    <h2 style="${EMAIL_STYLES.h2}">🔧 Troubleshooting</h2>

    <div style="${EMAIL_STYLES.section}">
      <p><strong>Common issues:</strong></p>
      <ul style="${EMAIL_STYLES.list}">
        <li style="${EMAIL_STYLES.listItem}"><strong>Payment declined:</strong> Verify high-risk merchant account setup</li>
        <li style="${EMAIL_STYLES.listItem}"><strong>AI detection fails:</strong> Check OpenAI API quota and billing</li>
        <li style="${EMAIL_STYLES.listItem}"><strong>SMS not sending:</strong> Verify Twilio account and phone number</li>
        <li style="${EMAIL_STYLES.listItem}"><strong>Image upload fails:</strong> Check S3 bucket permissions</li>
      </ul>
    </div>

    <h2 style="${EMAIL_STYLES.h2}">📚 Documentation</h2>

    <div style="${EMAIL_STYLES.section}">
      <ul style="${EMAIL_STYLES.list}">
        <li style="${EMAIL_STYLES.listItem}"><strong>Full Guide:</strong> <code style="${EMAIL_STYLES.inlineCode}">README.md</code></li>
        <li style="${EMAIL_STYLES.listItem}"><strong>Deployment:</strong> <code style="${EMAIL_STYLES.inlineCode}">docs/DEPLOYMENT.md</code></li>
        <li style="${EMAIL_STYLES.listItem}"><strong>Payment Setup:</strong> <code style="${EMAIL_STYLES.inlineCode}">docs/PAYMENTS.md</code></li>
        <li style="${EMAIL_STYLES.listItem}"><strong>Moderation:</strong> <code style="${EMAIL_STYLES.inlineCode}">docs/MODERATION.md</code></li>
        <li style="${EMAIL_STYLES.listItem}"><strong>API Reference:</strong> <code style="${EMAIL_STYLES.inlineCode}">docs/API.md</code></li>
        <li style="${EMAIL_STYLES.listItem}"><strong>Support:</strong> <a href="mailto:${SUPPORT_EMAIL}" style="${EMAIL_STYLES.link}">${SUPPORT_EMAIL}</a></li>
      </ul>
    </div>

    <div style="text-align: center; margin: 40px 0;">
      <p style="font-size: 18px; font-weight: 600; color: #667eea;">
        Launch your AI-free dating platform!
      </p>
      <p>
        <a href="mailto:${SUPPORT_EMAIL}" style="${EMAIL_STYLES.button}">Get Support</a>
      </p>
    </div>

  </div>

  <div style="${EMAIL_STYLES.footer}">
    <p><strong>AI Solutions Store</strong></p>
    <p>Real connections, AI-free dating</p>
    <p style="font-size: 12px; margin-top: 15px;">
      Order ID: ${orderId} | ${email}
    </p>
  </div>

</body>
</html>
  `.trim();
};

/**
 * TEMPLATE 7: CONSULTATION ($99)
 * 30-min Strategy Call
 */
const consultationTemplate = (customerInfo) => {
  const { name, email, orderId, orderDate } = customerInfo;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Consultation Booking - Confirmation</title>
</head>
<body style="${EMAIL_STYLES.container}">

  <div style="${EMAIL_STYLES.header}">
    <h1 style="${EMAIL_STYLES.h1}">Consultation Confirmed!</h1>
    <p style="margin: 10px 0 0 0; font-size: 16px;">30-Minute Strategy Call</p>
  </div>

  <div style="padding: 30px 20px;">

    <p style="font-size: 16px; line-height: 1.6;">
      Hi ${name},
    </p>

    <p style="font-size: 16px; line-height: 1.6;">
      Thank you for booking a <strong>30-minute consultation</strong> with AI Solutions Store!
      I'm excited to discuss your AI automation needs and help you find the right solutions.
    </p>

    <div style="${EMAIL_STYLES.success}">
      <strong>Order Confirmed:</strong> ${orderId}<br>
      <strong>Purchase Date:</strong> ${orderDate}<br>
      <strong>Product:</strong> 30-Minute Consultation<br>
      <strong>Price:</strong> $99
    </div>

    <h2 style="${EMAIL_STYLES.h2}">📅 Next Steps</h2>

    <div style="${EMAIL_STYLES.section}">
      <h3 style="${EMAIL_STYLES.h3}">Step 1: Schedule Your Call</h3>
      <p>Click the button below to choose your preferred time:</p>
      <p style="text-align: center;">
        <a href="https://calendly.com/your-booking-link" style="${EMAIL_STYLES.button}">
          Schedule on Calendly
        </a>
      </p>
      <p style="font-size: 14px; color: #666;">
        All times are shown in your local timezone. The calendar is updated in real-time.
      </p>
    </div>

    <div style="${EMAIL_STYLES.section}">
      <h3 style="${EMAIL_STYLES.h3}">Step 2: Prepare for the Call</h3>
      <p>To make the most of our time together, please consider these questions:</p>
      <ul style="${EMAIL_STYLES.list}">
        <li style="${EMAIL_STYLES.listItem}">What specific business processes do you want to automate?</li>
        <li style="${EMAIL_STYLES.listItem}">What's your current tech stack and infrastructure?</li>
        <li style="${EMAIL_STYLES.listItem}">What's your monthly budget for automation tools/services?</li>
        <li style="${EMAIL_STYLES.listItem}">What are your main pain points with current workflows?</li>
        <li style="${EMAIL_STYLES.listItem}">What does success look like for you in 6 months?</li>
      </ul>
    </div>

    <h2 style="${EMAIL_STYLES.h2}">💡 What We'll Cover</h2>

    <div style="${EMAIL_STYLES.section}">
      <ul style="${EMAIL_STYLES.list}">
        <li style="${EMAIL_STYLES.listItem}"><strong>Business Assessment:</strong> Review your current operations and identify automation opportunities</li>
        <li style="${EMAIL_STYLES.listItem}"><strong>Solution Matching:</strong> Recommend specific AI tools from our store that fit your needs</li>
        <li style="${EMAIL_STYLES.listItem}"><strong>Implementation Plan:</strong> Outline deployment strategy and timeline</li>
        <li style="${EMAIL_STYLES.listItem}"><strong>ROI Projection:</strong> Estimate time/money savings from automation</li>
        <li style="${EMAIL_STYLES.listItem}"><strong>Q&A:</strong> Answer any technical questions about our products</li>
      </ul>
    </div>

    <h2 style="${EMAIL_STYLES.h2}">📋 Consultation Format</h2>

    <div style="${EMAIL_STYLES.section}">
      <p><strong>Duration:</strong> 30 minutes</p>
      <p><strong>Format:</strong> Video call via Google Meet (link sent after scheduling)</p>
      <p><strong>Recording:</strong> Available upon request (for your reference)</p>
      <p><strong>Follow-up:</strong> You'll receive a written summary with recommendations</p>
    </div>

    <h2 style="${EMAIL_STYLES.h2}">🎁 What You'll Receive</h2>

    <div style="${EMAIL_STYLES.section}">
      <ol style="${EMAIL_STYLES.list}">
        <li style="${EMAIL_STYLES.listItem}"><strong>Custom Automation Roadmap:</strong> Tailored recommendations for your business</li>
        <li style="${EMAIL_STYLES.listItem}"><strong>Product Recommendations:</strong> Specific AI tools that match your needs</li>
        <li style="${EMAIL_STYLES.listItem}"><strong>Implementation Guide:</strong> Step-by-step deployment plan</li>
        <li style="${EMAIL_STYLES.listItem}"><strong>ROI Calculations:</strong> Projected savings and efficiency gains</li>
        <li style="${EMAIL_STYLES.listItem}"><strong>Priority Support:</strong> Direct email access for follow-up questions (7 days)</li>
      </ol>
    </div>

    <h2 style="${EMAIL_STYLES.h2}">💰 Special Offer</h2>

    <div style="${EMAIL_STYLES.success}">
      <strong>Exclusive Discount:</strong><br>
      If you purchase any product during or within 48 hours after our call,
      receive <strong>$99 off</strong> (your consultation fee applied as credit).
      <br><br>
      <em>Mention code: <strong>CONSULT99</strong></em>
    </div>

    <h2 style="${EMAIL_STYLES.h2}">📞 Meeting Details</h2>

    <div style="${EMAIL_STYLES.section}">
      <p>After scheduling on Calendly, you'll receive:</p>
      <ul style="${EMAIL_STYLES.list}">
        <li style="${EMAIL_STYLES.listItem}">Google Meet video link</li>
        <li style="${EMAIL_STYLES.listItem}">Calendar invite (.ics file)</li>
        <li style="${EMAIL_STYLES.listItem}">Pre-call questionnaire (optional but recommended)</li>
        <li style="${EMAIL_STYLES.listItem}">Reminder emails (24 hours and 1 hour before)</li>
      </ul>
    </div>

    <h2 style="${EMAIL_STYLES.h2}">🔄 Rescheduling Policy</h2>

    <div style="${EMAIL_STYLES.section}">
      <p>Need to reschedule? No problem!</p>
      <ul style="${EMAIL_STYLES.list}">
        <li style="${EMAIL_STYLES.listItem}">Free rescheduling up to 24 hours before the call</li>
        <li style="${EMAIL_STYLES.listItem}">Use the Calendly link in your confirmation email</li>
        <li style="${EMAIL_STYLES.listItem}">Late cancellations (< 24 hours) may require rebooking fee</li>
      </ul>
    </div>

    <h2 style="${EMAIL_STYLES.h2}">📚 Resources to Review</h2>

    <div style="${EMAIL_STYLES.section}">
      <p>While you wait for our call, check out these resources:</p>
      <ul style="${EMAIL_STYLES.list}">
        <li style="${EMAIL_STYLES.listItem}"><strong>Product Catalog:</strong> <a href="https://ai-solutions.store" style="${EMAIL_STYLES.link}">ai-solutions.store</a></li>
        <li style="${EMAIL_STYLES.listItem}"><strong>Case Studies:</strong> See how others use our tools</li>
        <li style="${EMAIL_STYLES.listItem}"><strong>Documentation:</strong> Explore technical details</li>
        <li style="${EMAIL_STYLES.listItem}"><strong>Demo Videos:</strong> Watch products in action</li>
      </ul>
    </div>

    <h2 style="${EMAIL_STYLES.h2}">❓ Questions Before Our Call?</h2>

    <div style="${EMAIL_STYLES.section}">
      <p>Feel free to reach out anytime:</p>
      <p>
        <strong>Email:</strong> <a href="mailto:${FOUNDER_EMAIL}" style="${EMAIL_STYLES.link}">${FOUNDER_EMAIL}</a><br>
        <strong>Support:</strong> <a href="mailto:${SUPPORT_EMAIL}" style="${EMAIL_STYLES.link}">${SUPPORT_EMAIL}</a>
      </p>
    </div>

    <div style="text-align: center; margin: 40px 0;">
      <p style="font-size: 18px; font-weight: 600; color: #667eea;">
        Ready to schedule your consultation?
      </p>
      <p>
        <a href="https://calendly.com/your-booking-link" style="${EMAIL_STYLES.button}">
          Book Your Time Slot
        </a>
      </p>
    </div>

  </div>

  <div style="${EMAIL_STYLES.footer}">
    <p><strong>AI Solutions Store</strong></p>
    <p>Expert guidance for your automation journey</p>
    <p style="font-size: 12px; margin-top: 15px;">
      Order ID: ${orderId} | ${email}
    </p>
  </div>

</body>
</html>
  `.trim();
};

/**
 * TEMPLATE 8: MERCHANDISE
 * Printful fulfillment confirmation
 */
const merchandiseTemplate = (customerInfo) => {
  const { name, email, orderId, orderDate, productName, shippingAddress } = customerInfo;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Order Confirmation - ${productName}</title>
</head>
<body style="${EMAIL_STYLES.container}">

  <div style="${EMAIL_STYLES.header}">
    <h1 style="${EMAIL_STYLES.h1}">Order Confirmed!</h1>
    <p style="margin: 10px 0 0 0; font-size: 16px;">Thank you for your purchase</p>
  </div>

  <div style="padding: 30px 20px;">

    <p style="font-size: 16px; line-height: 1.6;">
      Hi ${name},
    </p>

    <p style="font-size: 16px; line-height: 1.6;">
      Thank you for your order! We've received your purchase and our fulfillment partner
      <strong>Printful</strong> is preparing your item(s) for shipment.
    </p>

    <div style="${EMAIL_STYLES.success}">
      <strong>Order Number:</strong> ${orderId}<br>
      <strong>Order Date:</strong> ${orderDate}<br>
      <strong>Product:</strong> ${productName}
    </div>

    <h2 style="${EMAIL_STYLES.h2}">📦 What Happens Next</h2>

    <div style="${EMAIL_STYLES.section}">
      <ol style="${EMAIL_STYLES.list}">
        <li style="${EMAIL_STYLES.listItem}"><strong>Production:</strong> Your item is being printed/manufactured by Printful</li>
        <li style="${EMAIL_STYLES.listItem}"><strong>Quality Check:</strong> Each item is inspected before shipping</li>
        <li style="${EMAIL_STYLES.listItem}"><strong>Packaging:</strong> Carefully packaged for safe delivery</li>
        <li style="${EMAIL_STYLES.listItem}"><strong>Shipment:</strong> Shipped via standard carrier</li>
        <li style="${EMAIL_STYLES.listItem}"><strong>Delivery:</strong> Arrives at your door</li>
      </ol>
    </div>

    <h2 style="${EMAIL_STYLES.h2}">🚚 Shipping Information</h2>

    <div style="${EMAIL_STYLES.section}">
      <p><strong>Shipping To:</strong></p>
      <p style="margin: 10px 0; padding: 15px; background: white; border-radius: 4px; border: 1px solid #ddd;">
        ${shippingAddress ? shippingAddress.replace(/\n/g, '<br>') : 'Address on file'}
      </p>

      <p><strong>Estimated Delivery:</strong> 5-10 business days</p>
      <p><strong>Fulfillment Partner:</strong> Printful</p>
    </div>

    <h2 style="${EMAIL_STYLES.h2}">📧 Tracking Information</h2>

    <div style="${EMAIL_STYLES.section}">
      <p>
        You will receive a <strong>separate email from Printful</strong> with your tracking number
        once your order ships. This typically happens within 2-5 business days.
      </p>

      <div style="${EMAIL_STYLES.warning}">
        <strong>📌 Important:</strong><br>
        - Check your spam folder for Printful emails<br>
        - Tracking emails come from <strong>noreply@printful.com</strong><br>
        - You can track your order at <a href="https://www.printful.com/track" style="${EMAIL_STYLES.link}">printful.com/track</a>
      </div>
    </div>

    <h2 style="${EMAIL_STYLES.h2}">⏱️ Production Timeline</h2>

    <div style="${EMAIL_STYLES.section}">
      <ul style="${EMAIL_STYLES.list}">
        <li style="${EMAIL_STYLES.listItem}"><strong>Day 1-2:</strong> Production starts, item is printed/manufactured</li>
        <li style="${EMAIL_STYLES.listItem}"><strong>Day 2-3:</strong> Quality control and packaging</li>
        <li style="${EMAIL_STYLES.listItem}"><strong>Day 3-5:</strong> Shipment to carrier (tracking email sent)</li>
        <li style="${EMAIL_STYLES.listItem}"><strong>Day 5-10:</strong> In transit to your address</li>
      </ul>
      <p style="font-size: 14px; color: #666; margin-top: 10px;">
        <em>Timelines may vary based on product type and shipping destination.</em>
      </p>
    </div>

    <h2 style="${EMAIL_STYLES.h2}">💼 Product Details</h2>

    <div style="${EMAIL_STYLES.section}">
      <p><strong>Item:</strong> ${productName}</p>
      <p><strong>Print Quality:</strong> High-resolution direct-to-garment (DTG) or sublimation printing</p>
      <p><strong>Materials:</strong> Premium quality fabrics and materials</p>
      <p><strong>Care Instructions:</strong> Included with your order</p>
    </div>

    <h2 style="${EMAIL_STYLES.h2}">🔄 Returns & Exchanges</h2>

    <div style="${EMAIL_STYLES.section}">
      <p>
        We want you to love your purchase! If there's an issue with your order:
      </p>
      <ul style="${EMAIL_STYLES.list}">
        <li style="${EMAIL_STYLES.listItem}"><strong>Defects/Damage:</strong> Contact us within 30 days for replacement</li>
        <li style="${EMAIL_STYLES.listItem}"><strong>Wrong Size:</strong> Exchange available (return shipping may apply)</li>
        <li style="${EMAIL_STYLES.listItem}"><strong>Wrong Item:</strong> We'll send the correct item at no charge</li>
      </ul>

      <p>
        <strong>Contact for returns:</strong> <a href="mailto:${SUPPORT_EMAIL}" style="${EMAIL_STYLES.link}">${SUPPORT_EMAIL}</a>
      </p>

      <div style="${EMAIL_STYLES.warning}">
        <strong>Note:</strong> Custom printed items cannot be returned unless defective or incorrect.
      </div>
    </div>

    <h2 style="${EMAIL_STYLES.h2}">❓ Questions?</h2>

    <div style="${EMAIL_STYLES.section}">
      <p>We're here to help!</p>
      <p>
        <strong>Email Support:</strong> <a href="mailto:${SUPPORT_EMAIL}" style="${EMAIL_STYLES.link}">${SUPPORT_EMAIL}</a><br>
        <strong>Order Issues:</strong> Include order #${orderId} in your message<br>
        <strong>Printful Support:</strong> <a href="https://help.printful.com" style="${EMAIL_STYLES.link}">help.printful.com</a>
      </p>
    </div>

    <h2 style="${EMAIL_STYLES.h2}">🎁 Share Your Style!</h2>

    <div style="${EMAIL_STYLES.section}">
      <p>
        When your order arrives, we'd love to see it! Share photos on social media and tag us:
      </p>
      <p>
        <strong>Twitter:</strong> @AiCollab4Kids<br>
        <strong>Hashtag:</strong> #AIForTheKids
      </p>
    </div>

    <div style="text-align: center; margin: 40px 0;">
      <p style="font-size: 18px; font-weight: 600; color: #667eea;">
        Thank you for supporting AI Solutions Store!
      </p>
    </div>

  </div>

  <div style="${EMAIL_STYLES.footer}">
    <p><strong>AI Solutions Store</strong></p>
    <p>Quality merchandise, ethically produced</p>
    <p style="font-size: 12px; margin-top: 15px;">
      Order ID: ${orderId} | ${email}
    </p>
    <p style="font-size: 11px; color: #999; margin-top: 10px;">
      Fulfilled by Printful | <a href="https://www.printful.com" style="color: #999;">printful.com</a>
    </p>
  </div>

</body>
</html>
  `.trim();
};

/**
 * MAIN EXPORT: Get email template by product ID
 */
function getDeliveryEmail(productId, customerInfo) {
  // Normalize product ID (handle variations)
  const normalizedId = productId.toLowerCase().trim();

  // Product ID mapping
  const templates = {
    // Claude Droid ($299)
    'claude-droid': claudeDroidTemplate,
    'claude_droid': claudeDroidTemplate,
    'droid': claudeDroidTemplate,

    // Income Droid ($499)
    'income-droid': incomeDroidTemplate,
    'income_droid': incomeDroidTemplate,
    'income': incomeDroidTemplate,

    // Marketing Engine ($199)
    'marketing-engine': marketingEngineTemplate,
    'marketing_engine': marketingEngineTemplate,
    'marketing': marketingEngineTemplate,

    // Jules AI ($399)
    'jules-ai': julesAiTemplate,
    'jules_ai': julesAiTemplate,
    'jules': julesAiTemplate,

    // Affiliate System ($599)
    'affiliate-system': affiliateSystemTemplate,
    'affiliate_system': affiliateSystemTemplate,
    'affiliate': affiliateSystemTemplate,

    // Dating Platform ($2,499)
    'dating-platform': datingPlatformTemplate,
    'dating_platform': datingPlatformTemplate,
    'youandinotai': datingPlatformTemplate,
    'dating': datingPlatformTemplate,

    // Consultation ($99)
    'consultation': consultationTemplate,
    'consult': consultationTemplate,
    'call': consultationTemplate,

    // Merchandise (variable pricing)
    'merchandise': merchandiseTemplate,
    'merch': merchandiseTemplate,
    'tshirt': merchandiseTemplate,
    't-shirt': merchandiseTemplate,
    'hoodie': merchandiseTemplate,
    'mug': merchandiseTemplate,
    'sticker': merchandiseTemplate
  };

  const template = templates[normalizedId];

  if (!template) {
    throw new Error(`No template found for product: ${productId}`);
  }

  return template(customerInfo);
}

/**
 * Helper: Validate customer info
 */
function validateCustomerInfo(customerInfo) {
  const required = ['name', 'email', 'orderId', 'orderDate'];
  const missing = required.filter(field => !customerInfo[field]);

  if (missing.length > 0) {
    throw new Error(`Missing required fields: ${missing.join(', ')}`);
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(customerInfo.email)) {
    throw new Error(`Invalid email format: ${customerInfo.email}`);
  }

  return true;
}

/**
 * Helper: Send email (integration with email service)
 */
async function sendDeliveryEmail(productId, customerInfo, emailService = null) {
  validateCustomerInfo(customerInfo);

  const htmlContent = getDeliveryEmail(productId, customerInfo);

  // If email service provided, send the email
  if (emailService && emailService.send) {
    try {
      await emailService.send({
        to: customerInfo.email,
        from: SUPPORT_EMAIL,
        subject: `Your ${productId} is ready! - Order #${customerInfo.orderId}`,
        html: htmlContent
      });
      return { success: true, message: 'Email sent successfully' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Otherwise just return the HTML
  return htmlContent;
}

// Export all functions (ES modules)
export {
  getDeliveryEmail,
  sendDeliveryEmail,
  validateCustomerInfo,
  SUPPORT_EMAIL,
  FOUNDER_EMAIL
};

// Export individual templates for direct access
export const templates = {
  claudeDroid: claudeDroidTemplate,
  incomeDroid: incomeDroidTemplate,
  marketingEngine: marketingEngineTemplate,
  julesAi: julesAiTemplate,
  affiliateSystem: affiliateSystemTemplate,
  datingPlatform: datingPlatformTemplate,
  consultation: consultationTemplate,
  merchandise: merchandiseTemplate
};
