import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService, AdminUser, Pagination, UserQueryParams } from '../../core/services/admin.service';
import { I18nService } from '../../core/services/i18n.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './users.component.html',
  styleUrl: './users.component.scss'
})
export class UsersComponent implements OnInit {
  private adminService = inject(AdminService);
  i18n = inject(I18nService);
  
  // Client URL from environment
  readonly userClientUrl = environment.userClientUrl;

  // Data
  users = signal<AdminUser[]>([]);
  pagination = signal<Pagination | null>(null);

  // Filters
  search = '';
  roleFilter = '';
  statusFilter = '';
  currentPage = 1;
  itemsPerPage = 20;

  // State
  isLoading = signal(true);
  actionLoading = signal<string | null>(null);
  showConfirmModal = signal(false);
  confirmAction = signal<{ type: string; user: AdminUser | null }>({ type: '', user: null });
  successMessage = signal<string | null>(null);

  // Math for template
  protected Math = Math;

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.isLoading.set(true);
    
    const params: UserQueryParams = {
      page: this.currentPage,
      limit: this.itemsPerPage
    };
    
    if (this.search) params.search = this.search;
    if (this.roleFilter) params.role = this.roleFilter;
    if (this.statusFilter) params.isBlocked = this.statusFilter;

    this.adminService.getUsers(params).subscribe({
      next: (response) => {
        if (response.success) {
          this.users.set(response.data.users);
          this.pagination.set(response.data.pagination);
        }
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error loading users:', err);
        this.isLoading.set(false);
      }
    });
  }

  onSearch(): void {
    this.currentPage = 1;
    this.loadUsers();
  }

  onFilterChange(): void {
    this.currentPage = 1;
    this.loadUsers();
  }

  goToPage(page: number): void {
    this.currentPage = page;
    this.loadUsers();
  }

  // Actions
  confirmBlockUser(user: AdminUser): void {
    this.confirmAction.set({ type: 'block', user });
    this.showConfirmModal.set(true);
  }

  confirmUnblockUser(user: AdminUser): void {
    this.confirmAction.set({ type: 'unblock', user });
    this.showConfirmModal.set(true);
  }

  confirmDeleteUser(user: AdminUser): void {
    this.confirmAction.set({ type: 'delete', user });
    this.showConfirmModal.set(true);
  }

  executeAction(): void {
    const action = this.confirmAction();
    if (!action.user) return;

    this.actionLoading.set(action.user._id);
    this.showConfirmModal.set(false);

    switch (action.type) {
      case 'block':
        this.adminService.blockUser(action.user._id).subscribe({
          next: () => {
            this.showSuccess(this.i18n.t('users.userBlocked'));
            this.loadUsers();
          },
          error: (err) => {
            console.error('Error blocking user:', err);
            this.actionLoading.set(null);
          }
        });
        break;
      case 'unblock':
        this.adminService.unblockUser(action.user._id).subscribe({
          next: () => {
            this.showSuccess(this.i18n.t('users.userUnblocked'));
            this.loadUsers();
          },
          error: (err) => {
            console.error('Error unblocking user:', err);
            this.actionLoading.set(null);
          }
        });
        break;
      case 'delete':
        this.adminService.deleteUser(action.user._id).subscribe({
          next: () => {
            this.showSuccess(this.i18n.t('users.userDeleted'));
            this.loadUsers();
          },
          error: (err) => {
            console.error('Error deleting user:', err);
            this.actionLoading.set(null);
          }
        });
        break;
    }
  }

  cancelAction(): void {
    this.showConfirmModal.set(false);
    this.confirmAction.set({ type: '', user: null });
  }

  changeRole(user: AdminUser, newRole: string): void {
    this.actionLoading.set(user._id);
    
    this.adminService.updateUserRole(user._id, newRole).subscribe({
      next: () => {
        this.showSuccess(this.i18n.t('users.roleUpdated'));
        this.loadUsers();
      },
      error: (err) => {
        console.error('Error updating role:', err);
        this.actionLoading.set(null);
      }
    });
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

  viewUserProfile(username: string): void {
    window.open(`${this.userClientUrl}/profile/${username}`, '_blank');
  }
}
