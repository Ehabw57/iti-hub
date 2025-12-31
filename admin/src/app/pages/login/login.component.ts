import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { I18nService } from '../../core/services/i18n.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  private authService = inject(AuthService);
  private router = inject(Router);
  i18n = inject(I18nService);
  
  email = '';
  password = '';
  error = signal<string | null>(null);
  isLoading = signal(false);
  
  onSubmit(): void {
    if (!this.email || !this.password) {
      return;
    }
    
    this.error.set(null);
    this.isLoading.set(true);
    
    this.authService.login(this.email, this.password).subscribe({
      next: () => {
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.isLoading.set(false);
        if (err.message === 'Access denied. Admin role required.') {
          this.error.set(this.i18n.t('auth.accessDenied'));
        } else {
          this.error.set(this.i18n.t('auth.invalidCredentials'));
        }
      }
    });
  }
}
