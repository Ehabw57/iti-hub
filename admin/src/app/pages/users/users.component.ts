import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService, AdminUser, Pagination, UserQueryParams } from '../../core/services/admin.service';
import { StructureService, Branch } from '../../core/services/structure.service';
import { AuthService } from '../../core/services/auth.service';
import { I18nService } from '../../core/services/i18n.service';
import { environment } from '../../../environments/environment';

/** Roles assignable from the Users page (full role set — role-fix doc §1) */
export type AssignableRole = 'student' | 'instructor' | 'branch_admin' | 'super_admin';

/** Legacy role values map onto the new set (no one silently loses access) */
const LEGACY_ROLE_MAP: Record<string, AssignableRole> = {
  user: 'student',
  admin: 'super_admin',
};

/** Roles only a Super Admin may assign (role-fix doc §5) */
const SUPER_ADMIN_ONLY_ROLES: string[] = ['branch_admin', 'super_admin'];

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './users.component.html',
  styleUrl: './users.component.scss'
})
export class UsersComponent implements OnInit {
  private adminService = inject(AdminService);
  private structureService = inject(StructureService);
  private authService = inject(AuthService);
  i18n = inject(I18nService);

  // Client URL from environment
  readonly userClientUrl = environment.userClientUrl;

  // Role configuration
  readonly superAdminOnlyRoles = SUPER_ADMIN_ONLY_ROLES;

  // Data
  users = signal<AdminUser[]>([]);
  pagination = signal<Pagination | null>(null);
  branches = signal<Branch[]>([]);

  // Filters
  search = '';
  roleFilter = '';
  statusFilter = '';
  currentPage = 1;
  itemsPerPage = 20;

  // Role-assignment state (per-row editor; branch select opens on branch_admin)
  roleEditingUserId = signal<string | null>(null);
  roleDraft = signal<string>('');
  branchDraft = signal<string>('');

  // State
  isLoading = signal(true);
  actionLoading = signal<string | null>(null);
  showConfirmModal = signal(false);
  confirmAction = signal<{ type: string; user: AdminUser | null }>({ type: '', user: null });
  successMessage = signal<string | null>(null);
  roleError = signal<string | null>(null);

  // Math for template
  protected Math = Math;

  ngOnInit(): void {
    this.loadUsers();
    this.loadBranches();
  }

  /** Signed-in admin's platform-level flag */
  get isSuperAdmin(): boolean {
    const role = this.authService.user()?.role;
    return role === 'super_admin' || role === 'admin';
  }

  /** Roles this admin is allowed to offer in the selector */
  get allowedRoleOptions(): string[] {
    const all: string[] = ['student', 'instructor', 'branch_admin', 'super_admin'];
    if (this.isSuperAdmin) return all;
    return all.filter((r) => !this.superAdminOnlyRoles.includes(r));
  }

  /** Map legacy stored roles onto the new set for display (role-fix doc §1) */
  displayRole(role: string): string {
    return LEGACY_ROLE_MAP[role] ?? role;
  }

  /** The localized label for a (possibly legacy) role value */
  roleLabel(role: string): string {
    return this.i18n.t(`users.role_${this.displayRole(role)}`);
  }

  /** Whether a role requires a branch selection (role-fix doc §2) */
  roleRequiresBranch(role: string): boolean {
    return this.displayRole(role) === 'branch_admin';
  }

  /** Only super admins can assign branch_admin / super_admin (role-fix doc §5) */
  canAssignRole(role: string): boolean {
    if (this.superAdminOnlyRoles.includes(this.displayRole(role))) {
      return this.isSuperAdmin;
    }
    return true;
  }

  loadBranches(): void {
    this.structureService.getBranches(200).subscribe({
      next: (response) => {
        if (response.success) {
          this.branches.set(response.data.branches);
        }
      },
      error: (err) => console.error('Error loading branches:', err)
    });
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

  // ---------------------------------------------------------------
  // Role assignment (role-fix doc): open inline editor → pick role →
  // branch_admin additionally requires a branch → save.
  // ---------------------------------------------------------------

  openRoleEditor(user: AdminUser): void {
    this.roleError.set(null);
    this.roleEditingUserId.set(user._id);
    this.roleDraft.set(this.displayRole(user.role));
    // Pre-select the user's existing branch when they have one
    this.branchDraft.set((user as AdminUser & { branchId?: string }).branchId || '');
  }

  cancelRoleEdit(): void {
    this.roleError.set(null);
    this.roleEditingUserId.set(null);
    this.roleDraft.set('');
    this.branchDraft.set('');
  }

  /** Instructor is the base role here — teaching assignment stays on the
   *  Track Members panel (role-fix doc §3; hint shown in the template). */
  saveRole(user: AdminUser): void {
    const role = this.roleDraft();
    if (!role) return;

    if (!this.canAssignRole(role)) {
      this.roleError.set(this.i18n.t('users.rolePermissionDenied'));
      return;
    }

    if (this.roleRequiresBranch(role) && !this.branchDraft()) {
      this.roleError.set(this.i18n.t('users.branchRequired'));
      return;
    }

    this.actionLoading.set(user._id);

    this.adminService
      .updateUserRole(user._id, role, this.branchDraft() || undefined)
      .subscribe({
        next: () => {
          this.showSuccess(this.i18n.t('users.roleUpdated'));
          this.cancelRoleEdit();
          this.loadUsers();
        },
        error: (err) => {
          console.error('Error updating role:', err);
          this.roleError.set(
            err?.error?.error?.message || this.i18n.t('users.roleUpdateFailed')
          );
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
