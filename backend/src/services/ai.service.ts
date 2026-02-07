import OpenAI from 'openai';
import logger from '../utils/logger';
import { AIMatchingContext } from '../types';

export class AIService {
  private static instance: AIService;
  private openai: OpenAI | null = null;

  private constructor() {
    if (process.env.OPENAI_API_KEY) {
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
    }
  }

  public static getInstance(): AIService {
    if (!AIService.instance) {
      AIService.instance = new AIService();
    }
    return AIService.instance;
  }

  async analyzeCompatibility(context: AIMatchingContext): Promise<{
    score: number;
    insights: string[];
    conversationStarters: string[];
  }> {
    if (!this.openai) {
      // Fallback when OpenAI is not configured
      return this.fallbackCompatibilityAnalysis(context);
    }

    try {
      const prompt = `Analyze the compatibility between two dating app users based on their profiles.

User 1:
Bio: ${context.userBio || 'Not provided'}
Interests: ${context.userInterests.join(', ') || 'Not provided'}

User 2:
Bio: ${context.candidateBio || 'Not provided'}
Interests: ${context.candidateInterests.join(', ') || 'Not provided'}

Provide a JSON response with:
1. "score": A compatibility score from 0-100
2. "insights": An array of 2-3 brief insights about why they might be compatible
3. "conversationStarters": An array of 3 conversation starter suggestions based on common interests

Respond only with valid JSON, no markdown formatting.`;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a dating app compatibility analyst. Provide helpful, positive insights while being realistic. Always respond with valid JSON only.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: 500,
        temperature: 0.7,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response from AI');
      }

      const parsed = JSON.parse(content);
      return {
        score: Math.min(100, Math.max(0, parsed.score || 50)),
        insights: parsed.insights || [],
        conversationStarters: parsed.conversationStarters || [],
      };
    } catch (error) {
      logger.error('AI compatibility analysis error:', error);
      return this.fallbackCompatibilityAnalysis(context);
    }
  }

  private fallbackCompatibilityAnalysis(context: AIMatchingContext): {
    score: number;
    insights: string[];
    conversationStarters: string[];
  } {
    // Simple fallback algorithm
    const commonInterests = context.userInterests.filter(interest =>
      context.candidateInterests.some(
        ci => ci.toLowerCase() === interest.toLowerCase()
      )
    );

    const score = Math.min(100, 40 + commonInterests.length * 10);

    const insights: string[] = [];
    if (commonInterests.length > 0) {
      insights.push(`You share ${commonInterests.length} common interest(s)`);
    }
    if (context.candidateBio && context.candidateBio.length > 50) {
      insights.push('They have a detailed profile which shows genuine interest');
    }

    const conversationStarters: string[] = [];
    if (commonInterests.length > 0) {
      conversationStarters.push(
        `I noticed we both enjoy ${commonInterests[0]}! What got you into it?`
      );
    }
    conversationStarters.push("What's something you're passionate about that most people don't know?");
    conversationStarters.push("If you could travel anywhere tomorrow, where would you go?");

    return { score, insights, conversationStarters };
  }

  async generateIcebreaker(
    userInterests: string[],
    candidateInterests: string[]
  ): Promise<string> {
    const commonInterests = userInterests.filter(interest =>
      candidateInterests.some(
        ci => ci.toLowerCase() === interest.toLowerCase()
      )
    );

    if (!this.openai) {
      if (commonInterests.length > 0) {
        return `I see you're into ${commonInterests[0]} too! What's your favorite thing about it?`;
      }
      return "Hey! I'd love to get to know you better. What's something exciting happening in your life right now?";
    }

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a friendly dating app assistant. Generate casual, engaging icebreaker messages. Keep them short (1-2 sentences), friendly, and not too forward.',
          },
          {
            role: 'user',
            content: `Generate a friendly icebreaker message for someone on a dating app.
Common interests: ${commonInterests.join(', ') || 'None found'}
Their interests: ${candidateInterests.join(', ') || 'Not provided'}
Keep it casual and friendly.`,
          },
        ],
        max_tokens: 100,
        temperature: 0.8,
      });

      return response.choices[0]?.message?.content ||
        "Hey! I'd love to get to know you better. What's something exciting happening in your life right now?";
    } catch (error) {
      logger.error('AI icebreaker generation error:', error);
      if (commonInterests.length > 0) {
        return `I see you're into ${commonInterests[0]} too! What's your favorite thing about it?`;
      }
      return "Hey! I'd love to get to know you better. What's something exciting happening in your life right now?";
    }
  }

  async moderateContent(content: string): Promise<{
    isAppropriate: boolean;
    flaggedCategories: string[];
  }> {
    if (!this.openai) {
      // Basic content moderation fallback
      const inappropriatePatterns = [
        /\b(spam|scam|bitcoin|crypto wallet)\b/i,
        /\b(venmo|cashapp|paypal|send money)\b/i,
      ];

      const flagged = inappropriatePatterns.some(pattern => pattern.test(content));
      return {
        isAppropriate: !flagged,
        flaggedCategories: flagged ? ['potential_spam'] : [],
      };
    }

    try {
      const moderation = await this.openai.moderations.create({
        input: content,
      });

      const result = moderation.results[0];
      const flaggedCategories: string[] = [];

      if (result.flagged) {
        for (const [category, flagged] of Object.entries(result.categories)) {
          if (flagged) {
            flaggedCategories.push(category);
          }
        }
      }

      return {
        isAppropriate: !result.flagged,
        flaggedCategories,
      };
    } catch (error) {
      logger.error('AI content moderation error:', error);
      return { isAppropriate: true, flaggedCategories: [] };
    }
  }

  async enhanceBio(bio: string): Promise<string> {
    if (!this.openai) {
      return bio;
    }

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a dating profile assistant. Help improve dating bios to be more engaging while keeping the person\'s voice and authenticity. Make minor improvements only.',
          },
          {
            role: 'user',
            content: `Slightly improve this dating bio while keeping it authentic and true to the original message:\n\n"${bio}"\n\nProvide only the improved bio, no explanations.`,
          },
        ],
        max_tokens: 300,
        temperature: 0.6,
      });

      return response.choices[0]?.message?.content || bio;
    } catch (error) {
      logger.error('AI bio enhancement error:', error);
      return bio;
    }
  }
}

export default AIService.getInstance();
