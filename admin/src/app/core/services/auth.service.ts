/**
 * Auth Service
 * Handles admin authentication with JWT tokens
 */
import { Injectable, signal, computed } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, catchError, of } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface User {
  _id: string;
  username: string;
  email: string;
  fullName: string;
  role: 'user' | 'admin';
  profilePicture?: string;
}

export interface LoginResponse {
  success: boolean;
  data: {
    token: string;
    user: User;
  };
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly TOKEN_KEY = 'admin_token';
  private readonly USER_KEY = 'admin_user';
  
  // Flag to prevent multiple logout calls
  private isValidating = false;
  
  // Signals for reactive state
  private userSignal = signal<User | null>(this.getStoredUser());
  private isLoadingSignal = signal<boolean>(false);
  
  // Computed values
  user = computed(() => this.userSignal());
  isAuthenticated = computed(() => !!this.userSignal() && this.userSignal()?.role === 'admin');
  isLoading = computed(() => this.isLoadingSignal());
  
  // Flag to check if validation is in progress (for interceptor)
  get isValidatingToken(): boolean {
    return this.isValidating;
  }

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    // Validate stored token on init (silent validation)
    this.validateToken();
  }

  /**
   * Login with credentials
   */
  login(email: string, password: string): Observable<LoginResponse> {
    this.isLoadingSignal.set(true);
    
    return this.http.post<LoginResponse>(`${environment.apiUrl}/auth/login`, {
      email,
      password
    }).pipe(
      tap(response => {
        if (response.success && response.data.user.role === 'admin') {
          this.setSession(response.data.token, response.data.user);
        } else if (response.data.user.role !== 'admin') {
          throw new Error('Access denied. Admin role required.');
        }
        this.isLoadingSignal.set(false);
      }),
      catchError(error => {
        this.isLoadingSignal.set(false);
        throw error;
      })
    );
  }

  /**
   * Logout and clear session
   */
  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.userSignal.set(null);
    this.router.navigate(['/login']);
  }

  /**
   * Get stored token
   */
  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  /**
   * Set session data
   */
  private setSession(token: string, user: User): void {
    localStorage.setItem(this.TOKEN_KEY, token);
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    this.userSignal.set(user);
  }

  /**
   * Get stored user
   */
  private getStoredUser(): User | null {
    const userJson = localStorage.getItem(this.USER_KEY);
    if (userJson) {
      try {
        return JSON.parse(userJson);
      } catch {
        return null;
      }
    }
    return null;
  }

  /**
   * Validate stored token by fetching current user
   * This is a silent validation that doesn't logout on network errors
   * Only logs out if the token is explicitly rejected (401/403)
   */
  private validateToken(): void {
    const token = this.getToken();
    const storedUser = this.getStoredUser();
    
    // If no token, nothing to validate
    if (!token) {
      return;
    }
    
    // If we have a stored user with admin role, trust it initially
    // The interceptor will handle 401s during actual API calls
    if (storedUser && storedUser.role === 'admin') {
      this.userSignal.set(storedUser);
    }

    this.isValidating = true;
    
    this.http.get<{ success: boolean; _id: string; username: string; email: string; fullName: string; role: string; profilePicture?: string }>(
      `${environment.apiUrl}/users/me`
    ).pipe(
      catchError((error: HttpErrorResponse) => {
        this.isValidating = false;
        // Only logout on authentication errors (401, 403)
        // Don't logout on network errors or server errors
        if (error.status === 401 || error.status === 403) {
          this.clearSession();
        }
        return of(null);
      })
    ).subscribe(response => {
      this.isValidating = false;
      if (response && response.role === 'admin') {
        const user: User = {
          _id: response._id,
          username: response.username,
          email: response.email,
          fullName: response.fullName,
          role: response.role as 'admin',
          profilePicture: response.profilePicture
        };
        this.userSignal.set(user);
        localStorage.setItem(this.USER_KEY, JSON.stringify(user));
      } else if (response && response.role !== 'admin') {
        // User exists but not admin - clear session
        this.clearSession();
      }
      // If response is null (from catchError), we already handled it
    });
  }
  
  /**
   * Clear session without navigating (used internally)
   */
  private clearSession(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.userSignal.set(null);
  }
}
