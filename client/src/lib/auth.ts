import { apiRequest } from "./queryClient";

export interface User {
  id: string;
  username: string;
  email: string;
  role: 'super_admin' | 'restaurant_owner';
  restaurantId?: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export class AuthService {
  private static readonly TOKEN_KEY = 'auth_token';
  private static readonly USER_KEY = 'auth_user';

  static getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  static getUser(): User | null {
    const userStr = localStorage.getItem(this.USER_KEY);
    return userStr ? JSON.parse(userStr) : null;
  }

  static setAuth(token: string, user: User): void {
    localStorage.setItem(this.TOKEN_KEY, token);
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
  }

  static clearAuth(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
  }

  static isAuthenticated(): boolean {
    return !!this.getToken();
  }

  static async login(username: string, password: string): Promise<LoginResponse> {
    const response = await apiRequest('POST', '/api/auth/login', { username, password });
    const data = await response.json();
    
    this.setAuth(data.token, data.user);
    return data;
  }

  static async logout(): Promise<void> {
    this.clearAuth();
  }

  static async getCurrentUser(): Promise<User> {
    const response = await apiRequest('GET', '/api/auth/me');
    return response.json();
  }

  static getAuthHeaders(): Record<string, string> {
    const token = this.getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }
}
