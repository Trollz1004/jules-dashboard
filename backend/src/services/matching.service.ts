import { Gender, LookingFor } from '@prisma/client';
import prisma from '../utils/prisma';
import { calculateAge, calculateDistance } from '../utils/helpers';
import { MatchSuggestion, MatchingCriteria, UserWithProfile } from '../types';
import logger from '../utils/logger';

export class MatchingService {
  private static instance: MatchingService;

  public static getInstance(): MatchingService {
    if (!MatchingService.instance) {
      MatchingService.instance = new MatchingService();
    }
    return MatchingService.instance;
  }

  async getMatchSuggestions(
    userId: string,
    limit: number = 20
  ): Promise<MatchSuggestion[]> {
    try {
      // Get user with profile and preferences
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          profile: true,
          preferences: true,
          sentLikes: { select: { toUserId: true } },
          blockedUsers: { select: { blockedId: true } },
          blockedByUsers: { select: { blockerId: true } },
          matchesAsUser1: { select: { user2Id: true } },
          matchesAsUser2: { select: { user1Id: true } },
        },
      });

      if (!user || !user.profile) {
        return [];
      }

      // Build exclusion list
      const excludeIds = new Set([
        userId,
        ...user.sentLikes.map(l => l.toUserId),
        ...user.blockedUsers.map(b => b.blockedId),
        ...user.blockedByUsers.map(b => b.blockerId),
        ...user.matchesAsUser1.map(m => m.user2Id),
        ...user.matchesAsUser2.map(m => m.user1Id),
      ]);

      // Get matching criteria
      const criteria: MatchingCriteria = {
        userId,
        minAge: user.preferences?.minAge || 18,
        maxAge: user.preferences?.maxAge || 100,
        maxDistance: user.preferences?.maxDistance || 100,
        genderPreference: user.preferences?.genderPreference || [],
        lookingFor: user.preferences?.lookingFor || user.profile.lookingFor,
        location: user.profile.latitude && user.profile.longitude
          ? { latitude: user.profile.latitude, longitude: user.profile.longitude }
          : undefined,
      };

      // Calculate date range for age filter
      const today = new Date();
      const maxBirthDate = new Date(
        today.getFullYear() - criteria.minAge,
        today.getMonth(),
        today.getDate()
      );
      const minBirthDate = new Date(
        today.getFullYear() - criteria.maxAge - 1,
        today.getMonth(),
        today.getDate()
      );

      // Build where clause
      const whereClause: Record<string, unknown> = {
        id: { notIn: Array.from(excludeIds) },
        isActive: true,
        profile: {
          isVisible: true,
          birthDate: {
            gte: minBirthDate,
            lte: maxBirthDate,
          },
        },
      };

      // Add gender preference filter
      if (criteria.genderPreference.length > 0) {
        whereClause.profile = {
          ...whereClause.profile as Record<string, unknown>,
          gender: { in: criteria.genderPreference as Gender[] },
        };
      }

      // Fetch potential matches
      const potentialMatches = await prisma.user.findMany({
        where: whereClause,
        include: {
          profile: true,
          photos: {
            where: { isPrimary: true },
            take: 1,
          },
        },
        take: limit * 3, // Fetch more for filtering
      });

      // Score and filter matches
      const scoredMatches: MatchSuggestion[] = [];

      for (const candidate of potentialMatches) {
        if (!candidate.profile) continue;

        // Calculate distance if location available
        let distance: number | undefined;
        if (
          criteria.location &&
          candidate.profile.latitude &&
          candidate.profile.longitude
        ) {
          distance = calculateDistance(
            criteria.location.latitude,
            criteria.location.longitude,
            candidate.profile.latitude,
            candidate.profile.longitude
          );

          // Skip if too far
          if (distance > criteria.maxDistance) continue;
        }

        // Calculate compatibility score
        const score = this.calculateCompatibilityScore(
          user.profile,
          candidate.profile,
          distance
        );

        // Find common interests
        const commonInterests = this.findCommonInterests(
          user.profile.interests,
          candidate.profile.interests
        );

        scoredMatches.push({
          user: candidate as UserWithProfile,
          compatibilityScore: score,
          distance,
          commonInterests,
        });
      }

      // Sort by score and return top matches
      return scoredMatches
        .sort((a, b) => b.compatibilityScore - a.compatibilityScore)
        .slice(0, limit);
    } catch (error) {
      logger.error('Error getting match suggestions:', error);
      throw error;
    }
  }

  private calculateCompatibilityScore(
    userProfile: {
      interests: string[];
      lookingFor: LookingFor[];
      bio?: string | null;
    },
    candidateProfile: {
      interests: string[];
      lookingFor: LookingFor[];
      bio?: string | null;
    },
    distance?: number
  ): number {
    let score = 50; // Base score

    // Interest overlap (max 30 points)
    const commonInterests = this.findCommonInterests(
      userProfile.interests,
      candidateProfile.interests
    );
    const interestScore = Math.min(30, commonInterests.length * 6);
    score += interestScore;

    // Looking for compatibility (max 15 points)
    const lookingForOverlap = userProfile.lookingFor.filter(lf =>
      candidateProfile.lookingFor.includes(lf)
    );
    score += lookingForOverlap.length * 5;

    // Distance penalty (up to -20 points)
    if (distance !== undefined) {
      if (distance <= 10) {
        score += 10; // Bonus for very close
      } else if (distance <= 25) {
        score += 5;
      } else if (distance > 50) {
        score -= Math.min(20, Math.floor((distance - 50) / 5));
      }
    }

    // Bio completeness bonus (5 points)
    if (candidateProfile.bio && candidateProfile.bio.length > 50) {
      score += 5;
    }

    return Math.max(0, Math.min(100, score));
  }

  private findCommonInterests(
    interests1: string[],
    interests2: string[]
  ): string[] {
    const normalizedInterests1 = new Set(
      interests1.map(i => i.toLowerCase().trim())
    );
    return interests2.filter(i =>
      normalizedInterests1.has(i.toLowerCase().trim())
    );
  }

  async processLike(
    fromUserId: string,
    toUserId: string,
    isSuperLike: boolean = false
  ): Promise<{ matched: boolean; matchId?: string }> {
    try {
      // Check if already liked
      const existingLike = await prisma.like.findUnique({
        where: {
          fromUserId_toUserId: { fromUserId, toUserId },
        },
      });

      if (existingLike) {
        return { matched: false };
      }

      // Create like
      await prisma.like.create({
        data: {
          fromUserId,
          toUserId,
          isSuperLike,
        },
      });

      // Check for mutual like
      const mutualLike = await prisma.like.findUnique({
        where: {
          fromUserId_toUserId: { fromUserId: toUserId, toUserId: fromUserId },
        },
      });

      if (mutualLike) {
        // Create match
        const match = await prisma.match.create({
          data: {
            user1Id: fromUserId < toUserId ? fromUserId : toUserId,
            user2Id: fromUserId < toUserId ? toUserId : fromUserId,
            status: 'MATCHED',
            conversation: {
              create: {
                participants: {
                  createMany: {
                    data: [
                      { userId: fromUserId },
                      { userId: toUserId },
                    ],
                  },
                },
              },
            },
          },
        });

        return { matched: true, matchId: match.id };
      }

      return { matched: false };
    } catch (error) {
      logger.error('Error processing like:', error);
      throw error;
    }
  }

  async unmatch(userId: string, matchId: string): Promise<void> {
    try {
      const match = await prisma.match.findFirst({
        where: {
          id: matchId,
          OR: [{ user1Id: userId }, { user2Id: userId }],
        },
      });

      if (!match) {
        throw new Error('Match not found');
      }

      await prisma.match.update({
        where: { id: matchId },
        data: {
          status: 'UNMATCHED',
          unmatchedAt: new Date(),
          unmatchedBy: userId,
        },
      });
    } catch (error) {
      logger.error('Error unmatching:', error);
      throw error;
    }
  }
}

export default MatchingService.getInstance();
