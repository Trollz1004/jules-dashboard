import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import prisma from '../utils/prisma';
import { TokenPair, JWTPayload } from '../types';
import logger from '../utils/logger';

export class AuthService {
  private static instance: AuthService;

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 12);
  }

  async comparePasswords(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

  generateTokens(userId: string, email: string): TokenPair {
    const accessToken = jwt.sign(
      { userId, email } as JWTPayload,
      process.env.JWT_SECRET || 'default-secret',
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    const refreshToken = jwt.sign(
      { userId, email, tokenId: uuidv4() } as JWTPayload & { tokenId: string },
      process.env.JWT_REFRESH_SECRET || 'refresh-secret',
      { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d' }
    );

    return { accessToken, refreshToken };
  }

  async saveRefreshToken(userId: string, token: string): Promise<void> {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    await prisma.refreshToken.create({
      data: {
        userId,
        token,
        expiresAt,
      },
    });

    // Clean up old tokens (keep last 5)
    const tokens = await prisma.refreshToken.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    if (tokens.length > 5) {
      const tokensToDelete = tokens.slice(5).map(t => t.id);
      await prisma.refreshToken.deleteMany({
        where: { id: { in: tokensToDelete } },
      });
    }
  }

  async validateRefreshToken(token: string): Promise<{ userId: string; email: string } | null> {
    try {
      const decoded = jwt.verify(
        token,
        process.env.JWT_REFRESH_SECRET || 'refresh-secret'
      ) as JWTPayload & { tokenId: string };

      const storedToken = await prisma.refreshToken.findUnique({
        where: { token },
        include: { user: true },
      });

      if (!storedToken || storedToken.revokedAt || storedToken.expiresAt < new Date()) {
        return null;
      }

      if (!storedToken.user.isActive) {
        return null;
      }

      return { userId: decoded.userId, email: decoded.email };
    } catch {
      return null;
    }
  }

  async revokeRefreshToken(token: string): Promise<void> {
    await prisma.refreshToken.update({
      where: { token },
      data: { revokedAt: new Date() },
    });
  }

  async revokeAllUserTokens(userId: string): Promise<void> {
    await prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async register(data: {
    email: string;
    password: string;
    firstName: string;
    birthDate: Date;
    gender: 'MALE' | 'FEMALE' | 'NON_BINARY' | 'OTHER';
  }): Promise<{ user: { id: string; email: string }; tokens: TokenPair }> {
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email.toLowerCase() },
    });

    if (existingUser) {
      throw new Error('Email already registered');
    }

    const hashedPassword = await this.hashPassword(data.password);

    const user = await prisma.user.create({
      data: {
        email: data.email.toLowerCase(),
        password: hashedPassword,
        profile: {
          create: {
            firstName: data.firstName,
            birthDate: data.birthDate,
            gender: data.gender,
            lookingFor: [],
            interests: [],
          },
        },
        preferences: {
          create: {
            minAge: 18,
            maxAge: 100,
            maxDistance: 100,
            genderPreference: [],
            lookingFor: [],
          },
        },
      },
      select: {
        id: true,
        email: true,
      },
    });

    const tokens = this.generateTokens(user.id, user.email);
    await this.saveRefreshToken(user.id, tokens.refreshToken);

    logger.info(`User registered: ${user.email}`);

    return { user, tokens };
  }

  async login(email: string, password: string): Promise<{ user: { id: string; email: string }; tokens: TokenPair }> {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      throw new Error('Invalid credentials');
    }

    if (!user.isActive) {
      throw new Error('Account is deactivated');
    }

    const isPasswordValid = await this.comparePasswords(password, user.password);
    if (!isPasswordValid) {
      throw new Error('Invalid credentials');
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const tokens = this.generateTokens(user.id, user.email);
    await this.saveRefreshToken(user.id, tokens.refreshToken);

    logger.info(`User logged in: ${user.email}`);

    return {
      user: { id: user.id, email: user.email },
      tokens,
    };
  }

  async refreshTokens(refreshToken: string): Promise<TokenPair | null> {
    const payload = await this.validateRefreshToken(refreshToken);
    if (!payload) {
      return null;
    }

    // Revoke old token
    await this.revokeRefreshToken(refreshToken);

    // Generate new tokens
    const tokens = this.generateTokens(payload.userId, payload.email);
    await this.saveRefreshToken(payload.userId, tokens.refreshToken);

    return tokens;
  }

  async logout(refreshToken: string): Promise<void> {
    await this.revokeRefreshToken(refreshToken);
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error('User not found');
    }

    const isPasswordValid = await this.comparePasswords(currentPassword, user.password);
    if (!isPasswordValid) {
      throw new Error('Current password is incorrect');
    }

    const hashedPassword = await this.hashPassword(newPassword);
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    // Revoke all refresh tokens
    await this.revokeAllUserTokens(userId);

    logger.info(`Password changed for user: ${user.email}`);
  }
}

export default AuthService.getInstance();
