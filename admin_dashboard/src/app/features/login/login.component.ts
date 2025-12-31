import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../shared/components/notification/notification.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-gray-100">
      <div class="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
        <h2 class="text-2xl font-bold mb-6 text-center">Admin Login</h2>
        <form (ngSubmit)="onSubmit()">
          <div class="mb-4">
            <label class="block text-gray-700 mb-2">Email</label>
            <input 
              type="email" 
              [(ngModel)]="email" 
              name="email"
              class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required>
          </div>
          <div class="mb-6">
            <label class="block text-gray-700 mb-2">Password</label>
            <input 
              type="password" 
              [(ngModel)]="password" 
              name="password"
              class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required>
          </div>
          <button 
            type="submit"
            class="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition">
            Login
          </button>
        </form>
        <p class="mt-4 text-sm text-gray-600 text-center">
          Demo: admin@example.com / admin123
        </p>
      </div>
    </div>
  `,
  styles: []
})
export class LoginComponent {
  private authService = inject(AuthService);
  private router = inject(Router);
  private notificationService = inject(NotificationService);

  email = '';
  password = '';

  onSubmit(): void {
    if (this.authService.login(this.email, this.password)) {
      this.notificationService.success('Login successful!');
      this.router.navigate(['/dashboard']);
    } else {
      this.notificationService.error('Invalid credentials');
    }
  }
}
