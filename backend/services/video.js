/**
 * Video Service - FFmpeg video rendering for Claude Droid
 * FOR THE KIDS - 100% to verified pediatric charities
 *
 * Combines TTS audio + background images into YouTube Shorts
 */

import ffmpeg from 'fluent-ffmpeg';
import ffmpegStatic from 'ffmpeg-static';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// INPUT SANITIZATION (Task #064 - Dec 8, 2025)
// Prevents command injection in FFmpeg calls
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * Sanitize text input for FFmpeg filters
 * Removes shell metacharacters and limits length
 */
function sanitizeText(input) {
    if (!input || typeof input !== 'string') return '';
    return input
        .replace(/[;&|`$(){}[\]<>\\'"]/g, '')
        .substring(0, 500);
}

/**
 * Sanitize file paths for FFmpeg
 * Prevents directory traversal and removes dangerous characters
 * Preserves Windows drive letters (e.g., C:\)
 */
function sanitizePath(input) {
    if (!input || typeof input !== 'string') return '';

    // Extract Windows drive letter if present (e.g., "C:")
    const driveMatch = input.match(/^([a-zA-Z]:)/);
    const driveLetter = driveMatch ? driveMatch[1] : '';
    const pathWithoutDrive = driveMatch ? input.slice(2) : input;

    // Sanitize the rest of the path (excluding drive letter)
    const sanitized = pathWithoutDrive
        .replace(/\.\./g, '')
        .replace(/[<>:"|?*]/g, '')
        .replace(/\\/g, '/');

    // Rejoin drive letter with sanitized path
    return driveLetter + sanitized;
}

// Set FFmpeg path to use the npm-installed binary
ffmpeg.setFfmpegPath(ffmpegStatic);
const FFMPEG_PATH = ffmpegStatic;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Output directories
const OUTPUT_DIR = path.join(__dirname, '../../output/video');
const ASSETS_DIR = path.join(__dirname, '../../assets');

// Video settings for YouTube Shorts (9:16 vertical)
const VIDEO_CONFIG = {
    width: 1080,
    height: 1920,
    fps: 30,
    audioBitrate: '192k',
    videoBitrate: '4000k',
    format: 'mp4',
    codec: 'libx264',
    audioCodec: 'aac',
    // NVENC GPU acceleration settings
    useNVENC: process.env.USE_NVENC === 'true',
    nvencEncoder: 'h264_nvenc',
    nvencPreset: 'p4', // NVENC preset (p1-p7, p4 is balanced)
    nvencBitrate: '6000k' // Higher bitrate for GPU encoding
};

/**
 * Check NVENC (NVIDIA GPU) encoder availability
 * @returns {Promise<Object>} NVENC status and recommended encoder
 */
export async function checkNVENC() {
    return new Promise((resolve) => {
        const proc = spawn('ffmpeg', ['-encoders']);
        let stdout = '';

        proc.stdout.on('data', (data) => {
            stdout += data.toString();
        });

        proc.on('close', () => {
            const hasNVENC = stdout.includes('h264_nvenc');
            console.log(`[VIDEO] NVENC availability: ${hasNVENC ? 'YES' : 'NO'}`);

            resolve({
                available: hasNVENC,
                encoder: hasNVENC ? 'h264_nvenc' : 'libx264',
                message: hasNVENC
                    ? 'NVIDIA GPU encoder available - 10-20x faster encoding'
                    : 'Using CPU encoder (libx264) - consider NVIDIA GPU for faster renders',
                preset: hasNVENC ? 'p4' : 'medium'
            });
        });

        proc.on('error', () => {
            resolve({
                available: false,
                encoder: 'libx264',
                message: 'FFmpeg error - using CPU encoder',
                preset: 'medium'
            });
        });
    });
}

// Ensure directories exist
function ensureDirectories() {
    if (!fs.existsSync(OUTPUT_DIR)) {
        fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }
    if (!fs.existsSync(ASSETS_DIR)) {
        fs.mkdirSync(ASSETS_DIR, { recursive: true });
    }
}

/**
 * Create a solid color background image if none provided
 * @param {string} color - Hex color (e.g., '#1a1a2e')
 * @param {string} outputPath - Path to save image
 */
async function createBackgroundImage(color = '#1a1a2e', outputPath) {
    return new Promise((resolve, reject) => {
        // Sanitize color input (hex color format)
        const sanitizedColor = sanitizeText(color).replace(/[^0-9a-fA-F#]/g, '');
        const sanitizedOutputPath = sanitizePath(outputPath);

        // Use FFmpeg to create a solid color image
        const args = [
            '-f', 'lavfi',
            '-i', `color=c=${sanitizedColor.replace('#', '0x')}:s=${VIDEO_CONFIG.width}x${VIDEO_CONFIG.height}:d=1`,
            '-frames:v', '1',
            '-y',
            sanitizedOutputPath
        ];

        const proc = spawn(FFMPEG_PATH, args);
        let stderr = '';

        proc.stderr.on('data', (data) => {
            stderr += data.toString();
        });

        proc.on('close', (code) => {
            if (code === 0) {
                resolve(outputPath);
            } else {
                reject(new Error(`Failed to create background: ${stderr}`));
            }
        });

        proc.on('error', (err) => {
            reject(err);
        });
    });
}

/**
 * Render video from audio + background image
 * @param {Object} options - Render options
 * @param {string} options.audioPath - Path to audio file (MP3)
 * @param {string} options.imagePath - Path to background image (optional)
 * @param {string} options.outputFilename - Output filename (optional)
 * @param {string} options.category - News category for filename
 * @param {number} options.duration - Video duration in seconds (default: auto from audio)
 * @returns {Promise<Object>} Result with file info
 */
export async function renderVideo(options = {}) {
    ensureDirectories();

    const {
        audioPath,
        imagePath,
        outputFilename,
        category = 'news',
        duration
    } = options;

    // Sanitize inputs (Task #064)
    const sanitizedAudioPath = sanitizePath(audioPath);
    const sanitizedImagePath = imagePath ? sanitizePath(imagePath) : null;

    // Validate audio file
    if (!sanitizedAudioPath || !fs.existsSync(sanitizedAudioPath)) {
        return {
            success: false,
            error: 'Audio file not found',
            audioPath: sanitizedAudioPath
        };
    }

    // Generate output filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = outputFilename || `droid_${category}_${timestamp}.mp4`;
    const outputPath = path.join(OUTPUT_DIR, filename);

    // Use provided image or create default background
    let bgImagePath = sanitizedImagePath;
    if (!bgImagePath || !fs.existsSync(bgImagePath)) {
        // Create a default dark background
        bgImagePath = path.join(ASSETS_DIR, 'default_bg.png');
        if (!fs.existsSync(bgImagePath)) {
            try {
                await createBackgroundImage('#1a1a2e', bgImagePath);
            } catch (err) {
                console.error('[VIDEO] Failed to create background:', err.message);
                return {
                    success: false,
                    error: 'Failed to create background image',
                    details: err.message
                };
            }
        }
    }

    console.log(`[VIDEO] Rendering: ${sanitizedAudioPath} + ${bgImagePath} → ${filename}`);

    return new Promise(async (resolve, reject) => {
        // Check for NVENC GPU acceleration
        const nvencStatus = await checkNVENC();
        const useNVENC = VIDEO_CONFIG.useNVENC && nvencStatus.available;
        const videoCodec = useNVENC ? VIDEO_CONFIG.nvencEncoder : VIDEO_CONFIG.codec;
        const videoBitrate = useNVENC ? VIDEO_CONFIG.nvencBitrate : VIDEO_CONFIG.videoBitrate;

        console.log(`[VIDEO] Encoder: ${videoCodec} (GPU: ${useNVENC ? 'YES' : 'NO'})`);
        console.log(`[VIDEO] Bitrate: ${videoBitrate}`);

        // Build FFmpeg command (using sanitized paths - Task #064)
        // -loop 1: loop image
        // -i image: input image
        // -i audio: input audio
        // -c:v h264_nvenc/libx264: video codec (GPU or CPU)
        // -preset p4/medium: encoding preset
        // -c:a aac: audio codec
        // -shortest: stop when shortest input ends (audio)
        // -pix_fmt yuv420p: pixel format for compatibility

        const outputOpts = [
            '-c:v', videoCodec,
            '-c:a', VIDEO_CONFIG.audioCodec,
            '-b:a', VIDEO_CONFIG.audioBitrate,
            '-b:v', videoBitrate,
            '-pix_fmt', 'yuv420p',
            '-shortest',
            '-movflags', '+faststart'
        ];

        // Add encoder-specific options
        if (useNVENC) {
            // NVENC GPU options
            outputOpts.push('-preset', VIDEO_CONFIG.nvencPreset);
            outputOpts.push('-rc', 'vbr'); // Variable bitrate
            outputOpts.push('-cq', '23'); // Quality level (0-51, lower is better)
        } else {
            // CPU libx264 options
            outputOpts.push('-tune', 'stillimage');
            outputOpts.push('-preset', 'medium');
        }

        const command = ffmpeg()
            .input(bgImagePath)
            .inputOptions(['-loop', '1'])
            .input(sanitizedAudioPath)
            .outputOptions(outputOpts)
            .size(`${VIDEO_CONFIG.width}x${VIDEO_CONFIG.height}`)
            .fps(VIDEO_CONFIG.fps)
            .output(outputPath);

        // Add duration if specified
        if (duration) {
            command.duration(duration);
        }

        command
            .on('start', (cmd) => {
                console.log('[VIDEO] FFmpeg started:', cmd);
            })
            .on('progress', (progress) => {
                if (progress.percent) {
                    console.log(`[VIDEO] Progress: ${progress.percent.toFixed(1)}%`);
                }
            })
            .on('end', () => {
                // Get file stats
                const stats = fs.statSync(outputPath);

                console.log(`[VIDEO] Render complete: ${filename} (${(stats.size / 1024 / 1024).toFixed(2)} MB)`);

                resolve({
                    success: true,
                    filePath: outputPath,
                    filename,
                    size: stats.size,
                    sizeMB: (stats.size / 1024 / 1024).toFixed(2),
                    format: VIDEO_CONFIG.format,
                    resolution: `${VIDEO_CONFIG.width}x${VIDEO_CONFIG.height}`,
                    mission: 'FOR THE KIDS!'
                });
            })
            .on('error', (err, stdout, stderr) => {
                console.error('[VIDEO] FFmpeg error:', err.message);
                console.error('[VIDEO] stderr:', stderr);

                resolve({
                    success: false,
                    error: err.message,
                    stderr
                });
            })
            .run();
    });
}

/**
 * Render video with text overlay
 * @param {Object} options - Render options
 * @param {string} options.audioPath - Path to audio file
 * @param {string} options.text - Text to overlay (e.g., headline)
 * @param {string} options.category - News category
 * @returns {Promise<Object>} Result with file info
 */
export async function renderVideoWithText(options = {}) {
    ensureDirectories();

    const {
        audioPath,
        text = '',
        category = 'news',
        backgroundColor = '#1a1a2e',
        textColor = 'white',
        fontSize = 48
    } = options;

    // Sanitize inputs (Task #064)
    const sanitizedAudioPath = sanitizePath(audioPath);

    // Validate audio file
    if (!sanitizedAudioPath || !fs.existsSync(sanitizedAudioPath)) {
        return {
            success: false,
            error: 'Audio file not found',
            audioPath: sanitizedAudioPath
        };
    }

    // Generate output filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `droid_${category}_text_${timestamp}.mp4`;
    const outputPath = path.join(OUTPUT_DIR, filename);

    // Sanitize and escape text for FFmpeg filter (Task #064 - prevents injection)
    const sanitizedText = sanitizeText(text);
    const escapedText = sanitizedText
        .replace(/'/g, "'\\''")
        .replace(/:/g, '\\:')
        .substring(0, 200); // Limit text length

    console.log(`[VIDEO] Rendering with text overlay: ${filename}`);

    return new Promise(async (resolve, reject) => {
        // Check for NVENC GPU acceleration
        const nvencStatus = await checkNVENC();
        const useNVENC = VIDEO_CONFIG.useNVENC && nvencStatus.available;
        const videoCodec = useNVENC ? VIDEO_CONFIG.nvencEncoder : VIDEO_CONFIG.codec;
        const videoBitrate = useNVENC ? VIDEO_CONFIG.nvencBitrate : VIDEO_CONFIG.videoBitrate;

        console.log(`[VIDEO] Text overlay encoder: ${videoCodec} (GPU: ${useNVENC ? 'YES' : 'NO'})`);

        // Sanitize backgroundColor (Task #064)
        const sanitizedBgColor = sanitizeText(backgroundColor).replace(/[^0-9a-fA-F#]/g, '');
        const sanitizedTextColor = sanitizeText(textColor).replace(/[^a-zA-Z0-9#]/g, '');

        // Complex filter: create background + add text + AI disclosure
        // AI disclosure added for FTC/CA SB 1001/EU AI Act compliance
        const filterComplex = [
            `color=c=${sanitizedBgColor.replace('#', '0x')}:s=${VIDEO_CONFIG.width}x${VIDEO_CONFIG.height}`,
            `drawtext=text='${escapedText}':fontcolor=${sanitizedTextColor}:fontsize=${fontSize}:x=(w-text_w)/2:y=(h-text_h)/2:font=Arial`,
            `drawtext=text='AI-Generated Content':fontcolor=white:fontsize=24:x=20:y=20:font=Arial:box=1:boxcolor=black@0.5:boxborderw=5`
        ].join(',');

        const args = [
            '-f', 'lavfi',
            '-i', filterComplex,
            '-i', sanitizedAudioPath,
            '-c:v', videoCodec,
            '-c:a', VIDEO_CONFIG.audioCodec,
            '-b:a', VIDEO_CONFIG.audioBitrate,
            '-b:v', videoBitrate,
            '-pix_fmt', 'yuv420p',
            '-shortest',
            '-movflags', '+faststart',
            '-y',
            outputPath
        ];

        // Add encoder-specific options
        if (useNVENC) {
            // NVENC GPU options (insert before -y flag)
            args.splice(args.indexOf('-y'), 0, '-preset', VIDEO_CONFIG.nvencPreset);
            args.splice(args.indexOf('-y'), 0, '-rc', 'vbr');
            args.splice(args.indexOf('-y'), 0, '-cq', '23');
        } else {
            // CPU preset
            args.splice(args.indexOf('-y'), 0, '-preset', 'medium');
        }

        const proc = spawn(FFMPEG_PATH, args);
        let stderr = '';

        proc.stderr.on('data', (data) => {
            stderr += data.toString();
            // Log progress
            const match = data.toString().match(/time=(\d{2}:\d{2}:\d{2})/);
            if (match) {
                console.log(`[VIDEO] Progress: ${match[1]}`);
            }
        });

        proc.on('close', (code) => {
            if (code === 0 && fs.existsSync(outputPath)) {
                const stats = fs.statSync(outputPath);
                console.log(`[VIDEO] Render complete: ${filename}`);

                resolve({
                    success: true,
                    filePath: outputPath,
                    filename,
                    size: stats.size,
                    sizeMB: (stats.size / 1024 / 1024).toFixed(2),
                    format: VIDEO_CONFIG.format,
                    resolution: `${VIDEO_CONFIG.width}x${VIDEO_CONFIG.height}`,
                    hasText: true,
                    mission: 'FOR THE KIDS!'
                });
            } else {
                resolve({
                    success: false,
                    error: `FFmpeg exited with code ${code}`,
                    stderr
                });
            }
        });

        proc.on('error', (err) => {
            resolve({
                success: false,
                error: err.message
            });
        });
    });
}

/**
 * Check if FFmpeg is available
 * @returns {Promise<Object>} FFmpeg status
 */
export async function checkFFmpeg() {
    return new Promise((resolve) => {
        const proc = spawn('ffmpeg', ['-version']);
        let stdout = '';

        proc.stdout.on('data', (data) => {
            stdout += data.toString();
        });

        proc.on('close', (code) => {
            if (code === 0) {
                // Extract version from first line
                const versionMatch = stdout.match(/ffmpeg version ([^\s]+)/);
                resolve({
                    available: true,
                    version: versionMatch ? versionMatch[1] : 'unknown',
                    message: 'FFmpeg is available'
                });
            } else {
                resolve({
                    available: false,
                    error: 'FFmpeg not found in PATH',
                    install: 'Download from https://ffmpeg.org/download.html'
                });
            }
        });

        proc.on('error', () => {
            resolve({
                available: false,
                error: 'FFmpeg not installed',
                install: 'Download from https://ffmpeg.org/download.html'
            });
        });
    });
}

/**
 * Get video configuration
 * @returns {Object} Video settings
 */
export function getVideoConfig() {
    return {
        ...VIDEO_CONFIG,
        outputDir: OUTPUT_DIR,
        assetsDir: ASSETS_DIR
    };
}

// Export for ES modules
export default {
    renderVideo,
    renderVideoWithText,
    checkFFmpeg,
    checkNVENC,
    getVideoConfig,
    VIDEO_CONFIG,
    OUTPUT_DIR
};
