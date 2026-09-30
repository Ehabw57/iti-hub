/**
 * Auth Guard
 * Protects routes requiring authentication
 */
import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    return true;
  }

  router.navigate(['/login']);
  return false;
};

/**
 * Guest Guard
 * Redirects authenticated users away from login
 */
export const guestGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isAuthenticated()) {
    return true;
  }

  router.navigate(['/dashboard']);
  return false;
};

/**
 * Platform Admin Guard
 * Only legacy "admin" / "super_admin" may access platform-wide pages
 * (dashboard stats, users, posts, comments, communities).
 * Branch admins are redirected to their branches section.
 */
export const platformAdminGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isPlatformAdmin()) {
    return true;
  }

  router.navigate(['/branches']);
  return false;
};
