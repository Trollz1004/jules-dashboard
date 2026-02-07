/**
 * ===============================================================================
 * PROFILE TESTS
 * ===============================================================================
 *
 * Comprehensive test suite for profile functionality:
 * - Create profile
 * - Update profile
 * - Get profile by ID
 * - Search profiles
 * - Upload photos (mock)
 *
 * ===============================================================================
 */

import { jest, describe, test, expect, beforeEach, afterEach } from '@jest/globals';

import {
  mockDb,
  mockRedis,
  createMockRequest,
  createMockResponse,
  createMockNext,
  createTestUser,
  createTestProfile,
  createMockFile,
  randomEmail,
  randomString
} from './setup.js';

// ===============================================================================
// MOCK PROFILE SERVICE IMPLEMENTATION (For Testing)
// ===============================================================================

// Photo upload configuration
const MAX_PHOTOS = 6;
const MAX_PHOTO_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

// Profile service functions
async function createProfile(userId, profileData) {
  // Check if user exists
  const user = await mockDb.findUserById(userId);
  if (!user) {
    throw new Error('User not found');
  }

  // Check if profile already exists
  const existingProfile = await mockDb.findProfileByUserId(userId);
  if (existingProfile) {
    throw new Error('Profile already exists');
  }

  // Validate required fields
  if (!profileData.displayName || profileData.displayName.trim().length === 0) {
    throw new Error('Display name is required');
  }

  if (profileData.displayName.length > 50) {
    throw new Error('Display name must be 50 characters or less');
  }

  // Validate bio length
  if (profileData.bio && profileData.bio.length > 500) {
    throw new Error('Bio must be 500 characters or less');
  }

  // Validate age range
  const ageRangeMin = profileData.ageRangeMin || 18;
  const ageRangeMax = profileData.ageRangeMax || 99;

  if (ageRangeMin < 18) {
    throw new Error('Minimum age cannot be less than 18');
  }

  if (ageRangeMax > 120) {
    throw new Error('Maximum age cannot be greater than 120');
  }

  if (ageRangeMin > ageRangeMax) {
    throw new Error('Minimum age cannot be greater than maximum age');
  }

  // Validate distance
  const maxDistance = profileData.maxDistance || 50;
  if (maxDistance < 1 || maxDistance > 500) {
    throw new Error('Maximum distance must be between 1 and 500 km');
  }

  const profile = await mockDb.createProfile({
    userId,
    displayName: profileData.displayName.trim(),
    bio: profileData.bio?.trim() || '',
    gender: profileData.gender || null,
    lookingFor: profileData.lookingFor || [],
    location: profileData.location || null,
    ageRangeMin,
    ageRangeMax,
    maxDistance,
    photoUrls: [],
    primaryPhoto: null,
    isHumanVerified: user.humanVerified || false,
    isFoundingMember: user.isFoundingMember || false
  });

  return { success: true, profile };
}

async function updateProfile(userId, updates) {
  const profile = await mockDb.findProfileByUserId(userId);
  if (!profile) {
    throw new Error('Profile not found');
  }

  // Validate updates
  if (updates.displayName !== undefined) {
    if (!updates.displayName || updates.displayName.trim().length === 0) {
      throw new Error('Display name cannot be empty');
    }
    if (updates.displayName.length > 50) {
      throw new Error('Display name must be 50 characters or less');
    }
    updates.displayName = updates.displayName.trim();
  }

  if (updates.bio !== undefined && updates.bio.length > 500) {
    throw new Error('Bio must be 500 characters or less');
  }

  if (updates.ageRangeMin !== undefined || updates.ageRangeMax !== undefined) {
    const min = updates.ageRangeMin ?? profile.ageRangeMin;
    const max = updates.ageRangeMax ?? profile.ageRangeMax;

    if (min < 18) {
      throw new Error('Minimum age cannot be less than 18');
    }
    if (max > 120) {
      throw new Error('Maximum age cannot be greater than 120');
    }
    if (min > max) {
      throw new Error('Minimum age cannot be greater than maximum age');
    }
  }

  if (updates.maxDistance !== undefined) {
    if (updates.maxDistance < 1 || updates.maxDistance > 500) {
      throw new Error('Maximum distance must be between 1 and 500 km');
    }
  }

  const updatedProfile = await mockDb.updateProfile(userId, updates);
  return { success: true, profile: updatedProfile };
}

async function getProfileById(userId) {
  const profile = await mockDb.findProfileByUserId(userId);
  if (!profile) {
    return { success: true, profile: null };
  }
  return { success: true, profile };
}

async function searchProfiles(userId, criteria) {
  // Get searcher's profile for defaults
  const myProfile = await mockDb.findProfileByUserId(userId);

  const searchCriteria = {
    excludeUserId: userId,
    gender: criteria.gender,
    isHumanVerified: criteria.humanVerifiedOnly ? true : undefined,
    minAge: criteria.minAge || myProfile?.ageRangeMin || 18,
    maxAge: criteria.maxAge || myProfile?.ageRangeMax || 99,
    limit: criteria.limit || 10
  };

  const profiles = await mockDb.searchProfiles(searchCriteria);

  // Filter by distance if location provided
  let filteredProfiles = profiles;
  if (criteria.location && myProfile?.location) {
    filteredProfiles = profiles.filter(p => {
      if (!p.location) return true;
      const distance = calculateDistance(
        myProfile.location.lat, myProfile.location.lng,
        p.location.lat, p.location.lng
      );
      return distance <= (criteria.maxDistance || myProfile.maxDistance || 50);
    });
  }

  return {
    success: true,
    profiles: filteredProfiles,
    count: filteredProfiles.length
  };
}

// Mock photo upload
async function uploadPhoto(userId, file) {
  const profile = await mockDb.findProfileByUserId(userId);
  if (!profile) {
    throw new Error('Profile not found');
  }

  // Validate file
  if (!file) {
    throw new Error('No file provided');
  }

  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    throw new Error('Invalid file type. Allowed: JPEG, PNG, WebP');
  }

  if (file.size > MAX_PHOTO_SIZE) {
    throw new Error('File too large. Maximum size: 10MB');
  }

  if (profile.photoUrls.length >= MAX_PHOTOS) {
    throw new Error(`Maximum ${MAX_PHOTOS} photos allowed`);
  }

  // Mock S3 upload - generate fake URL
  const photoId = `photo-${Date.now()}-${randomString(8)}`;
  const photoUrl = `https://mock-s3.example.com/photos/${userId}/${photoId}.jpg`;

  const updatedPhotoUrls = [...profile.photoUrls, photoUrl];
  const primaryPhoto = profile.primaryPhoto || photoUrl;

  await mockDb.updateProfile(userId, {
    photoUrls: updatedPhotoUrls,
    primaryPhoto
  });

  return {
    success: true,
    photoUrl,
    photoCount: updatedPhotoUrls.length
  };
}

async function deletePhoto(userId, photoUrl) {
  const profile = await mockDb.findProfileByUserId(userId);
  if (!profile) {
    throw new Error('Profile not found');
  }

  if (!profile.photoUrls.includes(photoUrl)) {
    throw new Error('Photo not found');
  }

  const updatedPhotoUrls = profile.photoUrls.filter(url => url !== photoUrl);
  let primaryPhoto = profile.primaryPhoto;

  // If deleted photo was primary, set new primary
  if (primaryPhoto === photoUrl) {
    primaryPhoto = updatedPhotoUrls[0] || null;
  }

  await mockDb.updateProfile(userId, {
    photoUrls: updatedPhotoUrls,
    primaryPhoto
  });

  return {
    success: true,
    photoCount: updatedPhotoUrls.length
  };
}

async function setPrimaryPhoto(userId, photoUrl) {
  const profile = await mockDb.findProfileByUserId(userId);
  if (!profile) {
    throw new Error('Profile not found');
  }

  if (!profile.photoUrls.includes(photoUrl)) {
    throw new Error('Photo not found');
  }

  await mockDb.updateProfile(userId, { primaryPhoto: photoUrl });

  return { success: true, primaryPhoto: photoUrl };
}

// Helper function for distance calculation (Haversine formula)
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// ===============================================================================
// TEST SUITES
// ===============================================================================

describe('Profile Tests', () => {
  let testUser;

  beforeEach(async () => {
    jest.clearAllMocks();
    mockDb.clear();
    mockRedis.clear();

    // Create a test user for profile operations
    testUser = await mockDb.createUser({
      email: 'profiletest@example.com',
      passwordHash: 'hashed_password',
      displayName: 'Profile Test User',
      status: 'ACTIVE',
      ageVerified: true,
      humanVerified: true,
      isPremium: false,
      isFoundingMember: false
    });
  });

  afterEach(() => {
    mockDb.clear();
    mockRedis.clear();
  });

  // ===========================================================================
  // CREATE PROFILE TESTS
  // ===========================================================================

  describe('Create Profile', () => {
    describe('Valid Profile Creation', () => {
      test('should create a basic profile', async () => {
        const result = await createProfile(testUser.id, {
          displayName: 'John Doe'
        });

        expect(result.success).toBe(true);
        expect(result.profile.displayName).toBe('John Doe');
        expect(result.profile.userId).toBe(testUser.id);
      });

      test('should create profile with all fields', async () => {
        const profileData = {
          displayName: 'Jane Smith',
          bio: 'I love hiking and reading.',
          gender: 'female',
          lookingFor: ['male', 'other'],
          location: { city: 'New York', country: 'USA', lat: 40.7128, lng: -74.0060 },
          ageRangeMin: 25,
          ageRangeMax: 40,
          maxDistance: 100
        };

        const result = await createProfile(testUser.id, profileData);

        expect(result.success).toBe(true);
        expect(result.profile.displayName).toBe('Jane Smith');
        expect(result.profile.bio).toBe('I love hiking and reading.');
        expect(result.profile.gender).toBe('female');
        expect(result.profile.lookingFor).toEqual(['male', 'other']);
        expect(result.profile.location.city).toBe('New York');
        expect(result.profile.ageRangeMin).toBe(25);
        expect(result.profile.ageRangeMax).toBe(40);
        expect(result.profile.maxDistance).toBe(100);
      });

      test('should set default values for optional fields', async () => {
        const result = await createProfile(testUser.id, {
          displayName: 'Default User'
        });

        expect(result.profile.bio).toBe('');
        expect(result.profile.gender).toBeNull();
        expect(result.profile.lookingFor).toEqual([]);
        expect(result.profile.ageRangeMin).toBe(18);
        expect(result.profile.ageRangeMax).toBe(99);
        expect(result.profile.maxDistance).toBe(50);
        expect(result.profile.photoUrls).toEqual([]);
        expect(result.profile.primaryPhoto).toBeNull();
      });

      test('should trim whitespace from display name', async () => {
        const result = await createProfile(testUser.id, {
          displayName: '  Trimmed Name  '
        });

        expect(result.profile.displayName).toBe('Trimmed Name');
      });

      test('should inherit human verification status from user', async () => {
        const result = await createProfile(testUser.id, {
          displayName: 'Verified User'
        });

        expect(result.profile.isHumanVerified).toBe(true);
      });

      test('should inherit founding member status from user', async () => {
        const founderUser = await mockDb.createUser({
          email: 'founder@example.com',
          passwordHash: 'hashed',
          isFoundingMember: true,
          humanVerified: true
        });

        const result = await createProfile(founderUser.id, {
          displayName: 'Founding Member'
        });

        expect(result.profile.isFoundingMember).toBe(true);
      });
    });

    describe('Invalid Profile Creation', () => {
      test('should reject profile for non-existent user', async () => {
        await expect(createProfile('non-existent-id', {
          displayName: 'Ghost User'
        })).rejects.toThrow('User not found');
      });

      test('should reject duplicate profile', async () => {
        await createProfile(testUser.id, { displayName: 'First Profile' });

        await expect(createProfile(testUser.id, {
          displayName: 'Second Profile'
        })).rejects.toThrow('Profile already exists');
      });

      test('should reject missing display name', async () => {
        await expect(createProfile(testUser.id, {}))
          .rejects.toThrow('Display name is required');
      });

      test('should reject empty display name', async () => {
        await expect(createProfile(testUser.id, {
          displayName: ''
        })).rejects.toThrow('Display name is required');
      });

      test('should reject whitespace-only display name', async () => {
        await expect(createProfile(testUser.id, {
          displayName: '   '
        })).rejects.toThrow('Display name is required');
      });

      test('should reject display name over 50 characters', async () => {
        await expect(createProfile(testUser.id, {
          displayName: 'A'.repeat(51)
        })).rejects.toThrow('Display name must be 50 characters or less');
      });

      test('should reject bio over 500 characters', async () => {
        await expect(createProfile(testUser.id, {
          displayName: 'Valid Name',
          bio: 'A'.repeat(501)
        })).rejects.toThrow('Bio must be 500 characters or less');
      });

      test('should reject age range minimum below 18', async () => {
        await expect(createProfile(testUser.id, {
          displayName: 'Valid Name',
          ageRangeMin: 16
        })).rejects.toThrow('Minimum age cannot be less than 18');
      });

      test('should reject age range maximum over 120', async () => {
        await expect(createProfile(testUser.id, {
          displayName: 'Valid Name',
          ageRangeMax: 150
        })).rejects.toThrow('Maximum age cannot be greater than 120');
      });

      test('should reject inverted age range', async () => {
        await expect(createProfile(testUser.id, {
          displayName: 'Valid Name',
          ageRangeMin: 40,
          ageRangeMax: 30
        })).rejects.toThrow('Minimum age cannot be greater than maximum age');
      });

      test('should reject distance below 1km', async () => {
        await expect(createProfile(testUser.id, {
          displayName: 'Valid Name',
          maxDistance: 0
        })).rejects.toThrow('Maximum distance must be between 1 and 500 km');
      });

      test('should reject distance above 500km', async () => {
        await expect(createProfile(testUser.id, {
          displayName: 'Valid Name',
          maxDistance: 1000
        })).rejects.toThrow('Maximum distance must be between 1 and 500 km');
      });
    });
  });

  // ===========================================================================
  // UPDATE PROFILE TESTS
  // ===========================================================================

  describe('Update Profile', () => {
    beforeEach(async () => {
      await createProfile(testUser.id, {
        displayName: 'Original Name',
        bio: 'Original bio',
        gender: 'male',
        ageRangeMin: 20,
        ageRangeMax: 40
      });
    });

    describe('Valid Updates', () => {
      test('should update display name', async () => {
        const result = await updateProfile(testUser.id, {
          displayName: 'New Name'
        });

        expect(result.success).toBe(true);
        expect(result.profile.displayName).toBe('New Name');
      });

      test('should update bio', async () => {
        const result = await updateProfile(testUser.id, {
          bio: 'Updated bio text'
        });

        expect(result.profile.bio).toBe('Updated bio text');
      });

      test('should update multiple fields', async () => {
        const result = await updateProfile(testUser.id, {
          displayName: 'Multi Update',
          bio: 'New bio',
          gender: 'female',
          maxDistance: 75
        });

        expect(result.profile.displayName).toBe('Multi Update');
        expect(result.profile.bio).toBe('New bio');
        expect(result.profile.gender).toBe('female');
        expect(result.profile.maxDistance).toBe(75);
      });

      test('should update age range', async () => {
        const result = await updateProfile(testUser.id, {
          ageRangeMin: 25,
          ageRangeMax: 50
        });

        expect(result.profile.ageRangeMin).toBe(25);
        expect(result.profile.ageRangeMax).toBe(50);
      });

      test('should update location', async () => {
        const result = await updateProfile(testUser.id, {
          location: { city: 'Los Angeles', country: 'USA', lat: 34.0522, lng: -118.2437 }
        });

        expect(result.profile.location.city).toBe('Los Angeles');
      });

      test('should update lookingFor preferences', async () => {
        const result = await updateProfile(testUser.id, {
          lookingFor: ['female', 'non-binary']
        });

        expect(result.profile.lookingFor).toEqual(['female', 'non-binary']);
      });

      test('should preserve unchanged fields', async () => {
        const original = await getProfileById(testUser.id);

        await updateProfile(testUser.id, {
          displayName: 'Only Name Changed'
        });

        const updated = await getProfileById(testUser.id);

        expect(updated.profile.displayName).toBe('Only Name Changed');
        expect(updated.profile.bio).toBe(original.profile.bio);
        expect(updated.profile.gender).toBe(original.profile.gender);
      });
    });

    describe('Invalid Updates', () => {
      test('should reject update for non-existent profile', async () => {
        await expect(updateProfile('non-existent-id', {
          displayName: 'New Name'
        })).rejects.toThrow('Profile not found');
      });

      test('should reject empty display name', async () => {
        await expect(updateProfile(testUser.id, {
          displayName: ''
        })).rejects.toThrow('Display name cannot be empty');
      });

      test('should reject display name over 50 characters', async () => {
        await expect(updateProfile(testUser.id, {
          displayName: 'A'.repeat(51)
        })).rejects.toThrow('Display name must be 50 characters or less');
      });

      test('should reject bio over 500 characters', async () => {
        await expect(updateProfile(testUser.id, {
          bio: 'A'.repeat(501)
        })).rejects.toThrow('Bio must be 500 characters or less');
      });

      test('should reject invalid age range in update', async () => {
        await expect(updateProfile(testUser.id, {
          ageRangeMin: 50,
          ageRangeMax: 30
        })).rejects.toThrow('Minimum age cannot be greater than maximum age');
      });

      test('should validate against existing age range when updating only min', async () => {
        // Profile has max of 40
        await expect(updateProfile(testUser.id, {
          ageRangeMin: 45
        })).rejects.toThrow('Minimum age cannot be greater than maximum age');
      });
    });
  });

  // ===========================================================================
  // GET PROFILE BY ID TESTS
  // ===========================================================================

  describe('Get Profile by ID', () => {
    test('should return profile for existing user', async () => {
      await createProfile(testUser.id, {
        displayName: 'Get Test',
        bio: 'Testing get'
      });

      const result = await getProfileById(testUser.id);

      expect(result.success).toBe(true);
      expect(result.profile).toBeDefined();
      expect(result.profile.displayName).toBe('Get Test');
    });

    test('should return null for user without profile', async () => {
      const result = await getProfileById(testUser.id);

      expect(result.success).toBe(true);
      expect(result.profile).toBeNull();
    });

    test('should return null for non-existent user', async () => {
      const result = await getProfileById('non-existent-id');

      expect(result.success).toBe(true);
      expect(result.profile).toBeNull();
    });

    test('should return complete profile data', async () => {
      await createProfile(testUser.id, {
        displayName: 'Complete Profile',
        bio: 'Full data test',
        gender: 'other',
        lookingFor: ['any'],
        ageRangeMin: 21,
        ageRangeMax: 45,
        maxDistance: 100
      });

      const result = await getProfileById(testUser.id);

      expect(result.profile).toMatchObject({
        userId: testUser.id,
        displayName: 'Complete Profile',
        bio: 'Full data test',
        gender: 'other',
        lookingFor: ['any'],
        ageRangeMin: 21,
        ageRangeMax: 45,
        maxDistance: 100
      });
    });
  });

  // ===========================================================================
  // SEARCH PROFILES TESTS
  // ===========================================================================

  describe('Search Profiles', () => {
    let user1, user2, user3, user4;

    beforeEach(async () => {
      // Create multiple users and profiles for search testing
      user1 = await mockDb.createUser({
        email: 'user1@example.com',
        passwordHash: 'hashed',
        humanVerified: true
      });

      user2 = await mockDb.createUser({
        email: 'user2@example.com',
        passwordHash: 'hashed',
        humanVerified: true
      });

      user3 = await mockDb.createUser({
        email: 'user3@example.com',
        passwordHash: 'hashed',
        humanVerified: false
      });

      user4 = await mockDb.createUser({
        email: 'user4@example.com',
        passwordHash: 'hashed',
        humanVerified: true
      });

      // Create my profile
      await createProfile(testUser.id, {
        displayName: 'Me',
        gender: 'male',
        lookingFor: ['female'],
        location: { city: 'NYC', lat: 40.7128, lng: -74.0060 },
        ageRangeMin: 25,
        ageRangeMax: 35
      });

      // Create other profiles
      await mockDb.createProfile({
        userId: user1.id,
        displayName: 'User One',
        gender: 'female',
        age: 28,
        isHumanVerified: true
      });

      await mockDb.createProfile({
        userId: user2.id,
        displayName: 'User Two',
        gender: 'female',
        age: 30,
        isHumanVerified: true
      });

      await mockDb.createProfile({
        userId: user3.id,
        displayName: 'User Three',
        gender: 'female',
        age: 25,
        isHumanVerified: false
      });

      await mockDb.createProfile({
        userId: user4.id,
        displayName: 'User Four',
        gender: 'male',
        age: 32,
        isHumanVerified: true
      });
    });

    test('should return profiles excluding self', async () => {
      const result = await searchProfiles(testUser.id, {});

      expect(result.success).toBe(true);
      const userIds = result.profiles.map(p => p.userId);
      expect(userIds).not.toContain(testUser.id);
    });

    test('should filter by gender', async () => {
      const result = await searchProfiles(testUser.id, {
        gender: 'female'
      });

      expect(result.profiles.every(p => p.gender === 'female')).toBe(true);
    });

    test('should filter by human verification status', async () => {
      const result = await searchProfiles(testUser.id, {
        humanVerifiedOnly: true
      });

      expect(result.profiles.every(p => p.isHumanVerified === true)).toBe(true);
    });

    test('should limit results', async () => {
      const result = await searchProfiles(testUser.id, {
        limit: 2
      });

      expect(result.profiles.length).toBeLessThanOrEqual(2);
    });

    test('should return count with results', async () => {
      const result = await searchProfiles(testUser.id, {});

      expect(result.count).toBe(result.profiles.length);
    });

    test('should apply multiple filters', async () => {
      const result = await searchProfiles(testUser.id, {
        gender: 'female',
        humanVerifiedOnly: true
      });

      expect(result.profiles.every(p =>
        p.gender === 'female' && p.isHumanVerified === true
      )).toBe(true);
    });

    test('should return empty array when no matches', async () => {
      const result = await searchProfiles(testUser.id, {
        gender: 'non-existent-gender'
      });

      expect(result.success).toBe(true);
      expect(result.profiles).toEqual([]);
      expect(result.count).toBe(0);
    });
  });

  // ===========================================================================
  // PHOTO UPLOAD TESTS
  // ===========================================================================

  describe('Photo Upload', () => {
    beforeEach(async () => {
      await createProfile(testUser.id, {
        displayName: 'Photo Test User'
      });
    });

    describe('Valid Uploads', () => {
      test('should upload a JPEG photo', async () => {
        const file = createMockFile({
          mimetype: 'image/jpeg',
          size: 1024 * 1024 // 1MB
        });

        const result = await uploadPhoto(testUser.id, file);

        expect(result.success).toBe(true);
        expect(result.photoUrl).toContain('https://');
        expect(result.photoCount).toBe(1);
      });

      test('should upload a PNG photo', async () => {
        const file = createMockFile({
          mimetype: 'image/png'
        });

        const result = await uploadPhoto(testUser.id, file);

        expect(result.success).toBe(true);
      });

      test('should upload a WebP photo', async () => {
        const file = createMockFile({
          mimetype: 'image/webp'
        });

        const result = await uploadPhoto(testUser.id, file);

        expect(result.success).toBe(true);
      });

      test('should set first photo as primary', async () => {
        const file = createMockFile();

        await uploadPhoto(testUser.id, file);

        const profile = await getProfileById(testUser.id);
        expect(profile.profile.primaryPhoto).toBeDefined();
        expect(profile.profile.primaryPhoto).toBe(profile.profile.photoUrls[0]);
      });

      test('should allow uploading multiple photos', async () => {
        for (let i = 0; i < 3; i++) {
          await uploadPhoto(testUser.id, createMockFile());
        }

        const profile = await getProfileById(testUser.id);
        expect(profile.profile.photoUrls.length).toBe(3);
      });

      test('should increment photo count correctly', async () => {
        const result1 = await uploadPhoto(testUser.id, createMockFile());
        expect(result1.photoCount).toBe(1);

        const result2 = await uploadPhoto(testUser.id, createMockFile());
        expect(result2.photoCount).toBe(2);
      });
    });

    describe('Invalid Uploads', () => {
      test('should reject upload for non-existent profile', async () => {
        await expect(uploadPhoto('non-existent-id', createMockFile()))
          .rejects.toThrow('Profile not found');
      });

      test('should reject missing file', async () => {
        await expect(uploadPhoto(testUser.id, null))
          .rejects.toThrow('No file provided');
      });

      test('should reject invalid file type', async () => {
        const file = createMockFile({
          mimetype: 'application/pdf'
        });

        await expect(uploadPhoto(testUser.id, file))
          .rejects.toThrow('Invalid file type');
      });

      test('should reject GIF files', async () => {
        const file = createMockFile({
          mimetype: 'image/gif'
        });

        await expect(uploadPhoto(testUser.id, file))
          .rejects.toThrow('Invalid file type');
      });

      test('should reject file over 10MB', async () => {
        const file = createMockFile({
          size: 11 * 1024 * 1024 // 11MB
        });

        await expect(uploadPhoto(testUser.id, file))
          .rejects.toThrow('File too large');
      });

      test('should reject upload beyond 6 photos', async () => {
        // Upload 6 photos
        for (let i = 0; i < 6; i++) {
          await uploadPhoto(testUser.id, createMockFile());
        }

        // Try to upload 7th
        await expect(uploadPhoto(testUser.id, createMockFile()))
          .rejects.toThrow('Maximum 6 photos allowed');
      });
    });

    describe('Photo Management', () => {
      test('should delete a photo', async () => {
        const { photoUrl } = await uploadPhoto(testUser.id, createMockFile());

        const result = await deletePhoto(testUser.id, photoUrl);

        expect(result.success).toBe(true);
        expect(result.photoCount).toBe(0);

        const profile = await getProfileById(testUser.id);
        expect(profile.profile.photoUrls).not.toContain(photoUrl);
      });

      test('should update primary when deleting primary photo', async () => {
        const { photoUrl: photo1 } = await uploadPhoto(testUser.id, createMockFile());
        const { photoUrl: photo2 } = await uploadPhoto(testUser.id, createMockFile());

        // photo1 should be primary
        let profile = await getProfileById(testUser.id);
        expect(profile.profile.primaryPhoto).toBe(photo1);

        // Delete primary
        await deletePhoto(testUser.id, photo1);

        // photo2 should now be primary
        profile = await getProfileById(testUser.id);
        expect(profile.profile.primaryPhoto).toBe(photo2);
      });

      test('should set primary to null when deleting last photo', async () => {
        const { photoUrl } = await uploadPhoto(testUser.id, createMockFile());

        await deletePhoto(testUser.id, photoUrl);

        const profile = await getProfileById(testUser.id);
        expect(profile.profile.primaryPhoto).toBeNull();
      });

      test('should reject deleting non-existent photo', async () => {
        await expect(deletePhoto(testUser.id, 'https://fake-url.com/photo.jpg'))
          .rejects.toThrow('Photo not found');
      });

      test('should set primary photo', async () => {
        await uploadPhoto(testUser.id, createMockFile());
        const { photoUrl: photo2 } = await uploadPhoto(testUser.id, createMockFile());

        const result = await setPrimaryPhoto(testUser.id, photo2);

        expect(result.success).toBe(true);
        expect(result.primaryPhoto).toBe(photo2);
      });

      test('should reject setting non-existent photo as primary', async () => {
        await expect(setPrimaryPhoto(testUser.id, 'https://fake.com/photo.jpg'))
          .rejects.toThrow('Photo not found');
      });
    });
  });

  // ===========================================================================
  // EDGE CASES
  // ===========================================================================

  describe('Edge Cases', () => {
    test('should handle special characters in display name', async () => {
      const result = await createProfile(testUser.id, {
        displayName: "O'Connor-Smith"
      });

      expect(result.profile.displayName).toBe("O'Connor-Smith");
    });

    test('should handle unicode in bio', async () => {
      const result = await createProfile(testUser.id, {
        displayName: 'Unicode Test',
        bio: 'I love hiking! Nature is beautiful.'
      });

      expect(result.profile.bio).toContain('hiking');
    });

    test('should handle empty lookingFor array', async () => {
      const result = await createProfile(testUser.id, {
        displayName: 'Empty Prefs',
        lookingFor: []
      });

      expect(result.profile.lookingFor).toEqual([]);
    });

    test('should handle null location', async () => {
      const result = await createProfile(testUser.id, {
        displayName: 'No Location',
        location: null
      });

      expect(result.profile.location).toBeNull();
    });

    test('should handle bio with only whitespace', async () => {
      const result = await createProfile(testUser.id, {
        displayName: 'Whitespace Bio',
        bio: '   '
      });

      // Should trim to empty string
      expect(result.profile.bio).toBe('');
    });

    test('should handle exactly 50 character display name', async () => {
      const result = await createProfile(testUser.id, {
        displayName: 'A'.repeat(50)
      });

      expect(result.profile.displayName.length).toBe(50);
    });

    test('should handle exactly 500 character bio', async () => {
      const result = await createProfile(testUser.id, {
        displayName: 'Long Bio',
        bio: 'A'.repeat(500)
      });

      expect(result.profile.bio.length).toBe(500);
    });
  });
});
