import { Request } from 'express';
import { User, Profile } from '@prisma/client';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
  };
}

export interface JWTPayload {
  userId: string;
  email: string;
  iat?: number;
  exp?: number;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface PaginationParams {
  page: number;
  limit: number;
  skip: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
}

export interface UserWithProfile extends User {
  profile: Profile | null;
}

export interface MatchSuggestion {
  user: UserWithProfile;
  compatibilityScore: number;
  distance?: number;
  commonInterests: string[];
}

export interface SocketUser {
  id: string;
  socketId: string;
  rooms: string[];
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  receiverId: string;
  content: string;
  createdAt: Date;
}

export interface TypingEvent {
  conversationId: string;
  userId: string;
  isTyping: boolean;
}

export interface OnlineStatusEvent {
  userId: string;
  isOnline: boolean;
  lastActiveAt?: Date;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  errors?: ValidationError[];
}

export interface ValidationError {
  field: string;
  message: string;
}

export interface LocationCoordinates {
  latitude: number;
  longitude: number;
}

export interface MatchingCriteria {
  userId: string;
  minAge: number;
  maxAge: number;
  maxDistance: number;
  genderPreference: string[];
  lookingFor: string[];
  location?: LocationCoordinates;
}

export interface AIMatchingContext {
  userBio: string;
  userInterests: string[];
  candidateBio: string;
  candidateInterests: string[];
}
