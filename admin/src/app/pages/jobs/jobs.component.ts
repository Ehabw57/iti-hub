import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService, AdminJob, CreateJobPayload } from '../../core/services/admin.service';
import { AuthService } from '../../core/services/auth.service';
import { I18nService } from '../../core/services/i18n.service';

@Component({
  selector: 'app-jobs',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './jobs.component.html',
  styleUrl: './jobs.component.scss'
})
export class JobsComponent implements OnInit {
  private adminService = inject(AdminService);
  authService = inject(AuthService);
  i18n = inject(I18nService);

  // Data
  jobs = signal<AdminJob[]>([]);

  // Create form
  showForm = signal(false);
  formTitle = '';
  formCompany = '';
  formLocation = '';
  formDescription = '';
  formTags = '';
  formApplyUrl = '';

  // State
  isLoading = signal(true);
  saving = signal(false);
  actionLoading = signal<string | null>(null);
  showConfirmModal = signal(false);
  jobToDelete = signal<AdminJob | null>(null);
  successMessage = signal<string | null>(null);
  errorMessage = signal<string | null>(null);

  ngOnInit(): void {
    this.loadJobs();
  }

  loadJobs(): void {
    this.isLoading.set(true);
    this.adminService.getJobs().subscribe({
      next: (response) => {
        if (response.success) {
          this.jobs.set(response.data.jobs);
        }
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error loading jobs:', err);
        this.isLoading.set(false);
      }
    });
  }

  toggleForm(): void {
    this.showForm.set(!this.showForm());
    this.errorMessage.set(null);
  }

  createJob(): void {
    if (!this.formTitle.trim() || !this.formCompany.trim() || !this.formApplyUrl.trim()) return;

    this.saving.set(true);
    const payload: CreateJobPayload = {
      title: this.formTitle.trim(),
      company: this.formCompany.trim(),
      location: this.formLocation.trim(),
      description: this.formDescription.trim(),
      tags: this.formTags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
      applyUrl: this.formApplyUrl.trim()
    };

    this.adminService.createJob(payload).subscribe({
      next: () => {
        this.showSuccess(this.i18n.t('jobs.jobCreated'));
        this.resetForm();
        this.showForm.set(false);
        this.saving.set(false);
        this.loadJobs();
      },
      error: (err) => {
        this.showError(this.extractError(err) || this.i18n.t('jobs.jobError'));
        this.saving.set(false);
      }
    });
  }

  confirmDelete(job: AdminJob): void {
    this.jobToDelete.set(job);
    this.showConfirmModal.set(true);
  }

  deleteJob(): void {
    const job = this.jobToDelete();
    if (!job) return;

    this.actionLoading.set(job._id);
    this.showConfirmModal.set(false);

    this.adminService.deleteJob(job._id).subscribe({
      next: () => {
        this.showSuccess(this.i18n.t('jobs.jobDeleted'));
        this.actionLoading.set(null);
        this.loadJobs();
      },
      error: (err) => {
        this.showError(this.extractError(err));
        this.actionLoading.set(null);
      }
    });
  }

  cancelDelete(): void {
    this.showConfirmModal.set(false);
    this.jobToDelete.set(null);
  }

  private resetForm(): void {
    this.formTitle = '';
    this.formCompany = '';
    this.formLocation = '';
    this.formDescription = '';
    this.formTags = '';
    this.formApplyUrl = '';
  }

  private extractError(err: unknown): string {
    const e = err as { error?: { error?: { message?: string }; message?: string }; message?: string };
    return e?.error?.error?.message || e?.error?.message || e?.message || '';
  }

  private showSuccess(message: string): void {
    this.successMessage.set(message);
    this.errorMessage.set(null);
    setTimeout(() => this.successMessage.set(null), 3000);
  }

  private showError(message: string): void {
    this.errorMessage.set(message);
    setTimeout(() => this.errorMessage.set(null), 6000);
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString(this.i18n.currentLang(), {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }
}
