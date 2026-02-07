/**
 * TTS Service - Text-to-Speech using Microsoft Edge TTS
 * FOR THE KIDS - Claude Droid News Automation
 *
 * Uses msedge-tts package (free, no API key required)
 */

import { MsEdgeTTS, OUTPUT_FORMAT } from 'msedge-tts';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// INPUT SANITIZATION (Task #064 - Dec 8, 2025)
// Prevents potential injection in TTS text processing
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * Sanitize text input for TTS
 * Removes shell metacharacters and limits length
 */
function sanitizeText(input) {
    if (!input || typeof input !== 'string') return '';
    return input
        .replace(/[;&|`$(){}[\]<>\\'"]/g, '')
        .substring(0, 5000); // Longer limit for TTS scripts
}

// Voice configurations for news reading
const VOICES = {
    male: {
        us: 'en-US-GuyNeural',
        uk: 'en-GB-RyanNeural',
        au: 'en-AU-WilliamNeural'
    },
    female: {
        us: 'en-US-JennyNeural',
        uk: 'en-GB-SoniaNeural',
        au: 'en-AU-NatashaNeural'
    },
    news: 'en-US-GuyNeural'  // Default news anchor voice
};

// Output directory for generated audio
const OUTPUT_DIR = path.join(__dirname, '../../output/audio');

// Ensure output directory exists
function ensureOutputDir() {
    if (!fs.existsSync(OUTPUT_DIR)) {
        fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }
}

/**
 * Add AI disclosure to script text for FTC/CA SB 1001/EU AI Act compliance
 * @param {string} text - Original script text
 * @param {boolean} addDisclosure - Whether to add disclosure (default: true)
 * @returns {string} Text with AI disclosure
 */
function addAIDisclosure(text, addDisclosure = true) {
    if (!addDisclosure) return text;
    // Add verbal disclosure at end of script
    return `${text} This AI-generated update brought to you by Team Claude For The Kids.`;
}

/**
 * Generate speech from text and save to file
 * @param {string} text - Text to convert to speech
 * @param {Object} options - TTS options
 * @param {string} options.voice - Voice name (default: news anchor)
 * @param {string} options.outputFormat - Output format (default: audio-24khz-96kbitrate-mono-mp3)
 * @param {string} options.filename - Output filename (default: auto-generated)
 * @param {boolean} options.addAIDisclosure - Add AI disclosure to speech (default: true for compliance)
 * @returns {Promise<{success: boolean, filePath?: string, duration?: number, error?: string}>}
 */
export async function generateSpeech(text, options = {}) {
    try {
        ensureOutputDir();

        // Sanitize text input (Task #064)
        const sanitizedText = sanitizeText(text);

        const voice = options.voice || VOICES.news;
        const outputFormat = options.outputFormat || OUTPUT_FORMAT.AUDIO_24KHZ_96KBITRATE_MONO_MP3;
        const filename = options.filename || `tts_${Date.now()}.mp3`;
        const filePath = path.join(OUTPUT_DIR, filename);

        // Add AI disclosure for legal compliance (FTC/CA SB 1001/EU AI Act)
        const disclosedText = addAIDisclosure(sanitizedText, options.addAIDisclosure !== false);

        const tts = new MsEdgeTTS();
        await tts.setMetadata(voice, outputFormat);

        // msedge-tts toFile() expects a DIRECTORY path and creates audio.mp3 inside
        // Create a unique temp directory for this TTS generation
        const tempDir = path.join(OUTPUT_DIR, `temp_${Date.now()}`);
        fs.mkdirSync(tempDir, { recursive: true });

        // Generate audio with AI disclosure - library creates audio.mp3 inside tempDir
        await tts.toFile(tempDir, disclosedText);

        // Move the generated audio.mp3 to our desired filename
        const generatedFile = path.join(tempDir, 'audio.mp3');
        fs.renameSync(generatedFile, filePath);

        // Clean up temp directory
        fs.rmdirSync(tempDir);

        // Get file stats
        const stats = fs.statSync(filePath);

        // Estimate duration (rough calculation for MP3)
        const durationSeconds = Math.ceil(sanitizedText.split(' ').length / 2.5);

        return {
            success: true,
            filePath,
            filename,
            size: stats.size,
            duration: durationSeconds,
            voice,
            format: 'mp3'
        };
    } catch (error) {
        console.error('TTS Error:', error.message);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Generate speech and return as buffer (for streaming/API response)
 * @param {string} text - Text to convert to speech
 * @param {Object} options - TTS options
 * @returns {Promise<{success: boolean, buffer?: Buffer, error?: string}>}
 */
export async function generateSpeechBuffer(text, options = {}) {
    try {
        // Sanitize text input (Task #064)
        const sanitizedText = sanitizeText(text);

        const voice = options.voice || VOICES.news;
        const outputFormat = options.outputFormat || OUTPUT_FORMAT.AUDIO_24KHZ_96KBITRATE_MONO_MP3;

        const tts = new MsEdgeTTS();
        await tts.setMetadata(voice, outputFormat);

        const readable = tts.toStream(sanitizedText);
        const chunks = [];

        return new Promise((resolve, reject) => {
            readable.on('data', (chunk) => chunks.push(chunk));
            readable.on('end', () => {
                const audioBuffer = Buffer.concat(chunks);
                resolve({
                    success: true,
                    buffer: audioBuffer,
                    size: audioBuffer.length,
                    contentType: 'audio/mpeg',
                    voice
                });
            });
            readable.on('error', (err) => {
                reject(err);
            });
        });
    } catch (error) {
        console.error('TTS Buffer Error:', error.message);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Get list of available voices
 * @returns {Object} Available voices by category
 */
export function getVoices() {
    return VOICES;
}

/**
 * Generate news script audio (optimized for 59-second clips)
 * @param {string} script - News script text
 * @param {string} category - News category for filename
 * @returns {Promise<Object>} Result with file info
 */
export async function generateNewsAudio(script, category = 'news') {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `droid_${category}_${timestamp}.mp3`;

    return generateSpeech(script, {
        voice: VOICES.news,
        filename
    });
}

// Export constants
export { VOICES, OUTPUT_DIR, OUTPUT_FORMAT };

export default {
    generateSpeech,
    generateSpeechBuffer,
    generateNewsAudio,
    getVoices,
    VOICES,
    OUTPUT_DIR
};
