/**
 * YouTube Service - Video upload for Claude Droid
 * FOR THE KIDS - 100% to verified pediatric charities
 *
 * Uses YouTube Data API v3 for uploading videos
 * Requires OAuth2 credentials from Google Cloud Console
 */

import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// YouTube API configuration
const YOUTUBE_CONFIG = {
    apiVersion: 'v3',
    scopes: [
        'https://www.googleapis.com/auth/youtube.upload',
        'https://www.googleapis.com/auth/youtube'
    ],
    // Default category: News & Politics
    categoryId: '25',
    // Privacy status options: private, unlisted, public
    defaultPrivacy: 'private'
};

// Token storage path
const TOKEN_PATH = path.join(__dirname, '../../.youtube-tokens.json');

/**
 * Check if YouTube credentials are configured
 * @returns {Object} Configuration status
 */
export function checkYouTubeConfig() {
    const clientId = process.env.YOUTUBE_CLIENT_ID;
    const clientSecret = process.env.YOUTUBE_CLIENT_SECRET;
    const apiKey = process.env.YOUTUBE_API_KEY;
    const refreshToken = process.env.YOUTUBE_REFRESH_TOKEN;

    const hasOAuth = clientId && clientSecret;
    const hasApiKey = !!apiKey;
    const hasRefreshToken = !!refreshToken;

    return {
        configured: hasOAuth || hasApiKey,
        oauth: {
            hasClientId: !!clientId,
            hasClientSecret: !!clientSecret,
            hasRefreshToken: hasRefreshToken,
            ready: hasOAuth && hasRefreshToken
        },
        apiKey: {
            configured: hasApiKey
        },
        uploadReady: hasOAuth && hasRefreshToken,
        message: hasOAuth && hasRefreshToken
            ? 'YouTube upload ready'
            : 'YouTube credentials not configured - see YOUTUBE-SETUP.md'
    };
}

/**
 * Create OAuth2 client
 * @returns {OAuth2Client|null} OAuth2 client or null if not configured
 */
function createOAuth2Client() {
    const clientId = process.env.YOUTUBE_CLIENT_ID;
    const clientSecret = process.env.YOUTUBE_CLIENT_SECRET;
    const redirectUri = process.env.YOUTUBE_REDIRECT_URI || 'http://localhost:3000/api/youtube/callback';

    if (!clientId || !clientSecret) {
        return null;
    }

    return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
}

/**
 * Get authorization URL for OAuth2 flow
 * @returns {Object} Auth URL and status
 */
export function getAuthUrl() {
    const oauth2Client = createOAuth2Client();

    if (!oauth2Client) {
        return {
            success: false,
            error: 'OAuth2 not configured',
            setup: 'Set YOUTUBE_CLIENT_ID and YOUTUBE_CLIENT_SECRET in .env'
        };
    }

    const authUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: YOUTUBE_CONFIG.scopes,
        prompt: 'consent'
    });

    return {
        success: true,
        authUrl,
        instructions: [
            '1. Visit the auth URL in a browser',
            '2. Sign in with the YouTube channel account',
            '3. Authorize the application',
            '4. Copy the code from the redirect URL',
            '5. Call POST /api/droid/youtube-callback with the code'
        ]
    };
}

/**
 * Exchange auth code for tokens
 * @param {string} code - Authorization code from OAuth callback
 * @returns {Promise<Object>} Token info
 */
export async function exchangeCode(code) {
    const oauth2Client = createOAuth2Client();

    if (!oauth2Client) {
        return {
            success: false,
            error: 'OAuth2 not configured'
        };
    }

    try {
        const { tokens } = await oauth2Client.getToken(code);

        // Save refresh token for future use
        if (tokens.refresh_token) {
            console.log('[YOUTUBE] Refresh token received - check secure logs or use token directly');
            // Token value intentionally not logged for security - Gospel V1.4.1

            // Also save to file as backup
            fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens, null, 2));
        }

        return {
            success: true,
            tokens: {
                hasAccessToken: !!tokens.access_token,
                hasRefreshToken: !!tokens.refresh_token,
                expiresIn: tokens.expiry_date
            },
            message: 'Save refresh_token to .env as YOUTUBE_REFRESH_TOKEN',
            refreshToken: tokens.refresh_token
        };
    } catch (error) {
        console.error('[YOUTUBE] Token exchange error:', error.message);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Get authenticated YouTube client
 * @returns {Promise<Object|null>} YouTube API client
 */
async function getYouTubeClient() {
    const oauth2Client = createOAuth2Client();

    if (!oauth2Client) {
        return null;
    }

    const refreshToken = process.env.YOUTUBE_REFRESH_TOKEN;

    if (!refreshToken) {
        // Try loading from file
        if (fs.existsSync(TOKEN_PATH)) {
            const tokens = JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf8'));
            if (tokens.refresh_token) {
                oauth2Client.setCredentials(tokens);
            } else {
                return null;
            }
        } else {
            return null;
        }
    } else {
        oauth2Client.setCredentials({
            refresh_token: refreshToken
        });
    }

    return google.youtube({
        version: YOUTUBE_CONFIG.apiVersion,
        auth: oauth2Client
    });
}

/**
 * Upload video to YouTube
 * @param {Object} options - Upload options
 * @param {string} options.filePath - Path to video file
 * @param {string} options.title - Video title
 * @param {string} options.description - Video description
 * @param {string[]} options.tags - Video tags
 * @param {string} options.categoryId - YouTube category ID
 * @param {string} options.privacy - Privacy status (private, unlisted, public)
 * @returns {Promise<Object>} Upload result
 */
export async function uploadVideo(options = {}) {
    const {
        filePath,
        title,
        description,
        tags = [],
        categoryId = YOUTUBE_CONFIG.categoryId,
        privacy = YOUTUBE_CONFIG.defaultPrivacy
    } = options;

    // Validate file exists
    if (!filePath || !fs.existsSync(filePath)) {
        return {
            success: false,
            error: 'Video file not found',
            filePath
        };
    }

    // Get authenticated client
    const youtube = await getYouTubeClient();

    if (!youtube) {
        return {
            success: false,
            error: 'YouTube not authenticated',
            setup: 'Complete OAuth2 flow first - call GET /api/droid/youtube-auth'
        };
    }

    console.log(`[YOUTUBE] Uploading: ${path.basename(filePath)}`);
    console.log(`[YOUTUBE] Title: ${title}`);

    try {
        const fileSize = fs.statSync(filePath).size;

        const response = await youtube.videos.insert({
            part: ['snippet', 'status'],
            requestBody: {
                snippet: {
                    title: title || 'Claude Droid News Update',
                    description: description || 'News update by Claude Droid. 100% of ad revenue goes to verified pediatric charities. #ForTheKids',
                    tags: [...tags, 'ForTheKids', 'VerifiedPediatricCharities', 'ClaudeDroid', 'AINews'],
                    categoryId: categoryId
                },
                status: {
                    privacyStatus: privacy,
                    selfDeclaredMadeForKids: false,
                    // Enable monetization if available
                    license: 'youtube'
                }
            },
            media: {
                body: fs.createReadStream(filePath)
            }
        }, {
            // Upload progress callback
            onUploadProgress: (evt) => {
                const progress = (evt.bytesRead / fileSize) * 100;
                console.log(`[YOUTUBE] Upload progress: ${progress.toFixed(1)}%`);
            }
        });

        const videoId = response.data.id;
        const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
        const shortsUrl = `https://www.youtube.com/shorts/${videoId}`;

        console.log(`[YOUTUBE] Upload complete: ${videoUrl}`);

        return {
            success: true,
            videoId,
            videoUrl,
            shortsUrl,
            title: response.data.snippet.title,
            status: response.data.status.privacyStatus,
            uploadStatus: response.data.status.uploadStatus,
            mission: 'FOR THE KIDS!'
        };

    } catch (error) {
        console.error('[YOUTUBE] Upload error:', error.message);

        // Check for common errors
        if (error.code === 403) {
            return {
                success: false,
                error: 'YouTube API quota exceeded or access denied',
                details: error.message,
                retry: true
            };
        }

        if (error.code === 401) {
            return {
                success: false,
                error: 'YouTube authentication expired',
                action: 'Re-authenticate via /api/droid/youtube-auth'
            };
        }

        return {
            success: false,
            error: error.message,
            code: error.code
        };
    }
}

/**
 * Get channel info for authenticated account
 * @returns {Promise<Object>} Channel info
 */
export async function getChannelInfo() {
    const youtube = await getYouTubeClient();

    if (!youtube) {
        return {
            success: false,
            error: 'YouTube not authenticated'
        };
    }

    try {
        const response = await youtube.channels.list({
            part: ['snippet', 'statistics'],
            mine: true
        });

        const channel = response.data.items?.[0];

        if (!channel) {
            return {
                success: false,
                error: 'No channel found for this account'
            };
        }

        return {
            success: true,
            channel: {
                id: channel.id,
                title: channel.snippet.title,
                description: channel.snippet.description?.substring(0, 200),
                thumbnailUrl: channel.snippet.thumbnails?.default?.url,
                subscriberCount: channel.statistics.subscriberCount,
                videoCount: channel.statistics.videoCount,
                viewCount: channel.statistics.viewCount
            }
        };

    } catch (error) {
        console.error('[YOUTUBE] Channel info error:', error.message);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Get list of recent uploads
 * @param {number} maxResults - Maximum videos to return
 * @returns {Promise<Object>} Video list
 */
export async function getRecentUploads(maxResults = 10) {
    const youtube = await getYouTubeClient();

    if (!youtube) {
        return {
            success: false,
            error: 'YouTube not authenticated'
        };
    }

    try {
        // First get the uploads playlist ID
        const channelResponse = await youtube.channels.list({
            part: ['contentDetails'],
            mine: true
        });

        const uploadsPlaylistId = channelResponse.data.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;

        if (!uploadsPlaylistId) {
            return {
                success: false,
                error: 'Could not find uploads playlist'
            };
        }

        // Get videos from uploads playlist
        const videosResponse = await youtube.playlistItems.list({
            part: ['snippet', 'status'],
            playlistId: uploadsPlaylistId,
            maxResults
        });

        const videos = videosResponse.data.items?.map(item => ({
            videoId: item.snippet.resourceId.videoId,
            title: item.snippet.title,
            description: item.snippet.description?.substring(0, 100),
            publishedAt: item.snippet.publishedAt,
            thumbnailUrl: item.snippet.thumbnails?.medium?.url,
            url: `https://www.youtube.com/watch?v=${item.snippet.resourceId.videoId}`
        })) || [];

        return {
            success: true,
            count: videos.length,
            videos
        };

    } catch (error) {
        console.error('[YOUTUBE] Get uploads error:', error.message);
        return {
            success: false,
            error: error.message
        };
    }
}

// Export configuration
export { YOUTUBE_CONFIG };

export default {
    checkYouTubeConfig,
    getAuthUrl,
    exchangeCode,
    uploadVideo,
    getChannelInfo,
    getRecentUploads,
    YOUTUBE_CONFIG
};
