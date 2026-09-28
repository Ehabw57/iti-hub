import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { StructureService, Branch, Round } from '../../core/services/structure.service';
import { AuthService } from '../../core/services/auth.service';
import { I18nService } from '../../core/services/i18n.service';

@Component({
  selector: 'app-branch-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './branch-detail.component.html',
  styleUrl: './branch-detail.component.scss'
})
export class BranchDetailComponent implements OnInit {
  private structureService = inject(StructureService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  authService = inject(AuthService);
  i18n = inject(I18nService);

  branchId = '';
  branch = signal<Branch | null>(null);
  rounds = signal<Round[]>([]);
  isLoading = signal(true);
  actionLoading = signal<string | null>(null);
  successMessage = signal<string | null>(null);
  errorMessage = signal<string | null>(null);

  // Create/Edit round modal
  showFormModal = signal(false);
  editingRound = signal<Round | null>(null);
  formName = '';
  formIsActive = true;

  // Delete confirm
  showConfirmModal = signal(false);
  roundToDelete = signal<Round | null>(null);

  ngOnInit(): void {
    this.branchId = this.route.snapshot.paramMap.get('branchId') || '';

    // Branch admins may only open their own branch
    const me = this.authService.user();
    if (this.authService.isBranchAdmin() && me?.branchId && me.branchId !== this.branchId) {
      this.router.navigate(['/branches']);
      return;
    }

    this.load();
  }

  load(): void {
    this.isLoading.set(true);
    this.structureService.getBranch(this.branchId).subscribe({
      next: (res) => {
        this.branch.set(res.data.branch);
        this.loadRounds();
      },
      error: (err) => {
        this.showError(this.extractError(err));
        this.isLoading.set(false);
      }
    });
  }

  loadRounds(): void {
    this.structureService.getBranchRounds(this.branchId).subscribe({
      next: (res) => {
        this.rounds.set(res.data.rounds);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.showError(this.extractError(err));
        this.isLoading.set(false);
      }
    });
  }

  openRound(round: Round): void {
    this.router.navigate(['/branches', this.branchId, 'rounds', round._id]);
  }

  // ---- Create / Edit round ----

  openCreateModal(): void {
    this.editingRound.set(null);
    this.formName = '';
    this.formIsActive = true;
    this.showFormModal.set(true);
  }

  openEditModal(round: Round, event: Event): void {
    event.stopPropagation();
    this.editingRound.set(round);
    this.formName = round.name;
    this.formIsActive = round.isActive;
    this.showFormModal.set(true);
  }

  closeFormModal(): void {
    this.showFormModal.set(false);
    this.editingRound.set(null);
  }

  submitForm(): void {
    const name = this.formName.trim();
    if (!name) return;

    const editing = this.editingRound();
    if (editing) {
      this.structureService.updateRound(editing._id, { name, isActive: this.formIsActive }).subscribe({
        next: () => {
          this.showSuccess(this.i18n.t('structure.roundUpdated'));
          this.closeFormModal();
          this.loadRounds();
        },
        error: (err) => this.showError(this.extractError(err))
      });
    } else {
      this.structureService.createRound(this.branchId, { name, isActive: this.formIsActive }).subscribe({
        next: () => {
          this.showSuccess(this.i18n.t('structure.roundCreated'));
          this.closeFormModal();
          this.loadRounds();
        },
        error: (err) => this.showError(this.extractError(err))
      });
    }
  }

  /** Quick action: close or reopen a round */
  toggleRoundActive(round: Round, event: Event): void {
    event.stopPropagation();
    this.actionLoading.set(round._id);
    this.structureService.updateRound(round._id, { isActive: !round.isActive }).subscribe({
      next: () => {
        this.showSuccess(this.i18n.t('structure.roundUpdated'));
        this.actionLoading.set(null);
        this.loadRounds();
      },
      error: (err) => {
        this.showError(this.extractError(err));
        this.actionLoading.set(null);
      }
    });
  }

  // ---- Delete round ----

  confirmDelete(round: Round, event: Event): void {
    event.stopPropagation();
    this.roundToDelete.set(round);
    this.showConfirmModal.set(true);
  }

  cancelDelete(): void {
    this.showConfirmModal.set(false);
    this.roundToDelete.set(null);
  }

  executeDelete(): void {
    const round = this.roundToDelete();
    if (!round) return;

    this.actionLoading.set(round._id);
    this.showConfirmModal.set(false);

    this.structureService.deleteRound(round._id).subscribe({
      next: () => {
        this.showSuccess(this.i18n.t('structure.roundDeleted'));
        this.actionLoading.set(null);
        this.roundToDelete.set(null);
        this.loadRounds();
      },
      error: (err) => {
        // Server blocks deletion while tracks still exist (409)
        this.showError(this.extractError(err));
        this.actionLoading.set(null);
        this.roundToDelete.set(null);
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
