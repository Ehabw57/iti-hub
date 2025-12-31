/**
 * HTTP Interceptor
 * Adds auth token and handles errors globally
 */
import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const token = authService.getToken();

  // Clone request and add auth header if token exists
  if (token) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // Handle 401 - Unauthorized
      // Don't logout if we're currently validating the token (to avoid race condition)
      if (error.status === 401 && !authService.isValidatingToken) {
        authService.logout();
        router.navigate(['/login']);
      }
      
      // Handle 403 - Forbidden
      if (error.status === 403 && !authService.isValidatingToken) {
        router.navigate(['/unauthorized']);
      }

      return throwError(() => error);
    })
  );
};
