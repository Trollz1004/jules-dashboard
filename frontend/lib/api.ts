import axios, { AxiosError, AxiosInstance, AxiosRequestConfig } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export interface ApiError {
  message: string;
  status: number;
  errors?: Record<string, string[]>;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

class ApiClient {
  private client: AxiosInstance;
  private accessToken: string | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: API_URL,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        if (this.accessToken) {
          config.headers.Authorization = `Bearer ${this.accessToken}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError<ApiError>) => {
        const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

        // Handle 401 errors (token expired)
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            const refreshToken = this.getRefreshToken();
            if (refreshToken) {
              const response = await this.refreshAccessToken(refreshToken);
              this.setAccessToken(response.accessToken);

              if (originalRequest.headers) {
                originalRequest.headers.Authorization = `Bearer ${response.accessToken}`;
              }

              return this.client(originalRequest);
            }
          } catch (refreshError) {
            this.clearTokens();
            if (typeof window !== 'undefined') {
              window.location.href = '/login';
            }
          }
        }

        return Promise.reject(this.formatError(error));
      }
    );
  }

  private formatError(error: AxiosError<ApiError>): ApiError {
    if (error.response?.data) {
      return {
        message: error.response.data.message || 'An error occurred',
        status: error.response.status,
        errors: error.response.data.errors,
      };
    }

    return {
      message: error.message || 'Network error',
      status: 0,
    };
  }

  private getRefreshToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('refreshToken');
    }
    return null;
  }

  setAccessToken(token: string) {
    this.accessToken = token;
    if (typeof window !== 'undefined') {
      localStorage.setItem('accessToken', token);
    }
  }

  setRefreshToken(token: string) {
    if (typeof window !== 'undefined') {
      localStorage.setItem('refreshToken', token);
    }
  }

  clearTokens() {
    this.accessToken = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    }
  }

  loadTokenFromStorage() {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('accessToken');
      if (token) {
        this.accessToken = token;
      }
    }
  }

  // Auth endpoints
  async register(data: {
    email: string;
    password: string;
    name: string;
    birthday: string;
  }) {
    const response = await this.client.post<ApiResponse<{ user: User; accessToken: string; refreshToken: string }>>('/auth/register', data);
    return response.data.data;
  }

  async login(email: string, password: string) {
    const response = await this.client.post<ApiResponse<{ user: User; accessToken: string; refreshToken: string }>>('/auth/login', { email, password });
    return response.data.data;
  }

  async logout() {
    await this.client.post('/auth/logout');
    this.clearTokens();
  }

  async refreshAccessToken(refreshToken: string) {
    const response = await this.client.post<ApiResponse<{ accessToken: string; refreshToken: string }>>('/auth/refresh', { refreshToken });
    return response.data.data;
  }

  async forgotPassword(email: string) {
    const response = await this.client.post<ApiResponse<null>>('/auth/forgot-password', { email });
    return response.data;
  }

  async resetPassword(token: string, password: string) {
    const response = await this.client.post<ApiResponse<null>>('/auth/reset-password', { token, password });
    return response.data;
  }

  // User endpoints
  async getCurrentUser() {
    const response = await this.client.get<ApiResponse<User>>('/users/me');
    return response.data.data;
  }

  async updateProfile(data: Partial<UserProfile>) {
    const response = await this.client.patch<ApiResponse<User>>('/users/me', data);
    return response.data.data;
  }

  async uploadPhoto(file: File, position: number) {
    const formData = new FormData();
    formData.append('photo', file);
    formData.append('position', position.toString());

    const response = await this.client.post<ApiResponse<{ url: string }>>('/users/me/photos', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data.data;
  }

  async deletePhoto(photoId: string) {
    await this.client.delete(`/users/me/photos/${photoId}`);
  }

  async reorderPhotos(photoIds: string[]) {
    const response = await this.client.put<ApiResponse<User>>('/users/me/photos/reorder', { photoIds });
    return response.data.data;
  }

  async updateSettings(settings: UserSettings) {
    const response = await this.client.patch<ApiResponse<User>>('/users/me/settings', settings);
    return response.data.data;
  }

  async deleteAccount() {
    await this.client.delete('/users/me');
    this.clearTokens();
  }

  // Discovery endpoints
  async getProfiles(params?: { limit?: number; offset?: number }) {
    const response = await this.client.get<ApiResponse<DiscoverProfile[]>>('/discover', { params });
    return response.data.data;
  }

  async likeProfile(userId: string) {
    const response = await this.client.post<ApiResponse<{ matched: boolean; match?: Match }>>(`/discover/${userId}/like`);
    return response.data.data;
  }

  async passProfile(userId: string) {
    await this.client.post(`/discover/${userId}/pass`);
  }

  async superLikeProfile(userId: string) {
    const response = await this.client.post<ApiResponse<{ matched: boolean; match?: Match }>>(`/discover/${userId}/super-like`);
    return response.data.data;
  }

  async undoSwipe() {
    const response = await this.client.post<ApiResponse<DiscoverProfile>>('/discover/undo');
    return response.data.data;
  }

  // Matches endpoints
  async getMatches() {
    const response = await this.client.get<ApiResponse<Match[]>>('/matches');
    return response.data.data;
  }

  async getMatch(matchId: string) {
    const response = await this.client.get<ApiResponse<Match>>(`/matches/${matchId}`);
    return response.data.data;
  }

  async unmatch(matchId: string) {
    await this.client.delete(`/matches/${matchId}`);
  }

  async reportUser(userId: string, reason: string, details?: string) {
    await this.client.post(`/users/${userId}/report`, { reason, details });
  }

  async blockUser(userId: string) {
    await this.client.post(`/users/${userId}/block`);
  }

  // Messages endpoints
  async getMessages(matchId: string, params?: { before?: string; limit?: number }) {
    const response = await this.client.get<ApiResponse<Message[]>>(`/matches/${matchId}/messages`, { params });
    return response.data.data;
  }

  async sendMessage(matchId: string, content: string, type: 'text' | 'image' | 'gif' = 'text') {
    const response = await this.client.post<ApiResponse<Message>>(`/matches/${matchId}/messages`, { content, type });
    return response.data.data;
  }

  async markMessagesRead(matchId: string) {
    await this.client.post(`/matches/${matchId}/messages/read`);
  }

  // Likes received (premium feature)
  async getLikesReceived() {
    const response = await this.client.get<ApiResponse<LikeReceived[]>>('/likes/received');
    return response.data.data;
  }
}

// Types
export interface User {
  id: string;
  email: string;
  name: string;
  birthday: string;
  gender?: string;
  bio?: string;
  photos: Photo[];
  interests: string[];
  location?: {
    latitude: number;
    longitude: number;
    city?: string;
  };
  settings: UserSettings;
  isPremium: boolean;
  createdAt: string;
  lastActive: string;
}

export interface Photo {
  id: string;
  url: string;
  position: number;
}

export interface UserProfile {
  name?: string;
  birthday?: string;
  gender?: string;
  bio?: string;
  interests?: string[];
  jobTitle?: string;
  company?: string;
  school?: string;
  city?: string;
  height?: number;
  relationshipGoal?: string;
}

export interface UserSettings {
  showMe: 'men' | 'women' | 'everyone';
  ageRange: { min: number; max: number };
  maxDistance: number;
  showDistance: boolean;
  showAge: boolean;
  notifications: {
    matches: boolean;
    messages: boolean;
    likes: boolean;
  };
}

export interface DiscoverProfile {
  id: string;
  name: string;
  age: number;
  bio?: string;
  photos: Photo[];
  interests: string[];
  distance?: number;
  jobTitle?: string;
  company?: string;
  school?: string;
  city?: string;
  relationshipGoal?: string;
}

export interface Match {
  id: string;
  user: {
    id: string;
    name: string;
    photos: Photo[];
    lastActive: string;
  };
  lastMessage?: {
    content: string;
    createdAt: string;
    senderId: string;
  };
  unreadCount: number;
  createdAt: string;
}

export interface Message {
  id: string;
  matchId: string;
  senderId: string;
  content: string;
  type: 'text' | 'image' | 'gif';
  createdAt: string;
  readAt?: string;
}

export interface LikeReceived {
  id: string;
  user: {
    id: string;
    name: string;
    age: number;
    photos: Photo[];
  };
  createdAt: string;
  isSuperLike: boolean;
}

export const api = new ApiClient();
export default api;
