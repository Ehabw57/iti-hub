import { Component, inject, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { interval, Subscription } from 'rxjs';
import { AdminService, AdminEnrollmentRequest } from '../../core/services/admin.service';
import { I18nService } from '../../core/services/i18n.service';

@Component({
  selector: 'app-enrollment-requests',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './enrollment-requests.component.html',
  styleUrl: './enrollment-requests.component.scss'
})
export class EnrollmentRequestsComponent implements OnInit, OnDestroy {
  private adminService = inject(AdminService);
  i18n = inject(I18nService);

  // Data
  requests = signal<AdminEnrollmentRequest[]>([]);

  // Filters
  statusFilter = 'pending';

  // State
  isLoading = signal(true);
  actionLoading = signal<string | null>(null);
  showConfirmModal = signal(false);
  confirmAction = signal<{ type: 'approve' | 'reject' | ''; request: AdminEnrollmentRequest | null }>({
    type: '',
    request: null
  });
  successMessage = signal<string | null>(null);

  private pollSubscription?: Subscription;

  ngOnInit(): void {
    this.loadRequests();
    // Poll so requests submitted by students while the panel is open surface
    // without a manual refresh.
    this.pollSubscription = interval(15000).subscribe(() => this.loadRequests(true));
  }

  ngOnDestroy(): void {
    this.pollSubscription?.unsubscribe();
  }

  loadRequests(isPoll = false): void {
    if (!isPoll) this.isLoading.set(true);

    this.adminService.getEnrollmentRequests({ status: this.statusFilter }).subscribe({
      next: (response) => {
        if (response.success) {
          this.requests.set(response.data.requests);
        }
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error loading enrollment requests:', err);
        this.isLoading.set(false);
      }
    });
  }

  onFilterChange(): void {
    this.loadRequests();
  }

  refresh(): void {
    this.loadRequests();
  }

  // Actions
  confirmApprove(request: AdminEnrollmentRequest): void {
    this.confirmAction.set({ type: 'approve', request });
    this.showConfirmModal.set(true);
  }

  confirmReject(request: AdminEnrollmentRequest): void {
    this.confirmAction.set({ type: 'reject', request });
    this.showConfirmModal.set(true);
  }

  executeAction(): void {
    const action = this.confirmAction();
    if (!action.request || !action.type) return;

    this.actionLoading.set(action.request._id);
    this.showConfirmModal.set(false);

    const decision: 'approved' | 'rejected' = action.type === 'approve' ? 'approved' : 'rejected';

    this.adminService.decideEnrollmentRequest(action.request._id, decision).subscribe({
      next: () => {
        this.showSuccess(
          action.type === 'approve'
            ? this.i18n.t('enrollmentRequests.requestApproved')
            : this.i18n.t('enrollmentRequests.requestRejected')
        );
        this.loadRequests();
      },
      error: (err) => {
        console.error('Error deciding enrollment request:', err);
        this.actionLoading.set(null);
      }
    });
  }

  cancelAction(): void {
    this.showConfirmModal.set(false);
    this.confirmAction.set({ type: '', request: null });
  }

  statusLabel(status: string): string {
    if (status === 'approved') return this.i18n.t('enrollmentRequests.approved');
    if (status === 'rejected') return this.i18n.t('enrollmentRequests.rejected');
    return this.i18n.t('enrollmentRequests.pending');
  }

  private showSuccess(message: string): void {
    this.successMessage.set(message);
    this.actionLoading.set(null);
    setTimeout(() => this.successMessage.set(null), 3000);
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString(this.i18n.currentLang(), {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }
}
