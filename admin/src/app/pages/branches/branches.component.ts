import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { StructureService, Branch, BranchType } from '../../core/services/structure.service';
import { AuthService } from '../../core/services/auth.service';
import { I18nService } from '../../core/services/i18n.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-branches',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './branches.component.html',
  styleUrl: './branches.component.scss'
})
export class BranchesComponent implements OnInit {
  private structureService = inject(StructureService);
  private router = inject(Router);
  authService = inject(AuthService);
  i18n = inject(I18nService);

  readonly userClientUrl = environment.userClientUrl;

  // Data
  branches = signal<Branch[]>([]);
  isLoading = signal(true);
  actionLoading = signal<string | null>(null);
  successMessage = signal<string | null>(null);
  errorMessage = signal<string | null>(null);

  // Create/Edit modal state
  showFormModal = signal(false);
  editingBranch = signal<Branch | null>(null);
  formName = '';
  formLocation = '';
  formType: BranchType = 'core';

  // Delete confirm state
  showConfirmModal = signal(false);
  branchToDelete = signal<Branch | null>(null);

  ngOnInit(): void {
    this.loadBranches();
  }

  loadBranches(): void {
    this.isLoading.set(true);
    this.structureService.getBranches().subscribe({
      next: (response) => {
        if (response.success) {
          let list = response.data.branches;
          // Branch admins only ever see their own branch
          const me = this.authService.user();
          if (this.authService.isBranchAdmin() && me?.branchId) {
            list = list.filter(b => b._id === me.branchId);
          }
          // Core branches first, then extension, alphabetical within group
          this.branches.set(
            [...list].sort((a, b) =>
              a.type === b.type
                ? a.name.localeCompare(b.name)
                : a.type === 'core' ? -1 : 1
            )
          );
        }
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error loading branches:', err);
        this.showError(this.extractError(err));
        this.isLoading.set(false);
      }
    });
  }

  openBranch(branch: Branch): void {
    this.router.navigate(['/branches', branch._id]);
  }

  viewPublicBranches(): void {
    window.open(`${this.userClientUrl}/branches`, '_blank');
  }

  // ---- Create / Edit ----

  openCreateModal(): void {
    this.editingBranch.set(null);
    this.formName = '';
    this.formLocation = '';
    this.formType = 'core';
    this.showFormModal.set(true);
  }

  openEditModal(branch: Branch, event: Event): void {
    event.stopPropagation();
    this.editingBranch.set(branch);
    this.formName = branch.name;
    this.formLocation = branch.location;
    this.formType = branch.type || 'core';
    this.showFormModal.set(true);
  }

  closeFormModal(): void {
    this.showFormModal.set(false);
    this.editingBranch.set(null);
  }

  submitForm(): void {
    const name = this.formName.trim();
    if (!name) return;

    const editing = this.editingBranch();
    if (editing) {
      this.structureService
        .updateBranch(editing._id, { name, location: this.formLocation.trim(), type: this.formType })
        .subscribe({
          next: () => {
            this.showSuccess(this.i18n.t('structure.branchUpdated'));
            this.closeFormModal();
            this.loadBranches();
          },
          error: (err) => this.showError(this.extractError(err))
        });
    } else {
      this.structureService
        .createBranch({ name, location: this.formLocation.trim(), type: this.formType })
        .subscribe({
          next: () => {
            this.showSuccess(this.i18n.t('structure.branchCreated'));
            this.closeFormModal();
            this.loadBranches();
          },
          error: (err) => this.showError(this.extractError(err))
        });
    }
  }

  // ---- Delete ----

  confirmDelete(branch: Branch, event: Event): void {
    event.stopPropagation();
    this.branchToDelete.set(branch);
    this.showConfirmModal.set(true);
  }

  cancelDelete(): void {
    this.showConfirmModal.set(false);
    this.branchToDelete.set(null);
  }

  executeDelete(): void {
    const branch = this.branchToDelete();
    if (!branch) return;

    this.actionLoading.set(branch._id);
    this.showConfirmModal.set(false);

    this.structureService.deleteBranch(branch._id).subscribe({
      next: () => {
        this.showSuccess(this.i18n.t('structure.branchDeleted'));
        this.actionLoading.set(null);
        this.branchToDelete.set(null);
        this.loadBranches();
      },
      error: (err) => {
        // Server blocks deletion while rounds still exist (409)
        this.showError(this.extractError(err));
        this.actionLoading.set(null);
        this.branchToDelete.set(null);
      }
    });
  }

  // ---- Helpers ----

  private extractError(err: unknown): string {
    const e = err as { error?: { error?: { message?: string }; message?: string }; message?: string };
    return e?.error?.error?.message || e?.error?.message || e?.message || 'Unexpected error';
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
}
