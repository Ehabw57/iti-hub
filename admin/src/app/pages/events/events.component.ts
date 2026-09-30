import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  AdminService,
  AdminEvent,
  CreateEventPayload,
} from '../../core/services/admin.service';
import { StructureService, Branch } from '../../core/services/structure.service';
import { AuthService } from '../../core/services/auth.service';
import { I18nService } from '../../core/services/i18n.service';

@Component({
  selector: 'app-events',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './events.component.html',
  styleUrl: './events.component.scss'
})
export class EventsComponent implements OnInit {
  private adminService = inject(AdminService);
  private structureService = inject(StructureService);
  authService = inject(AuthService);
  i18n = inject(I18nService);

  // Data
  events = signal<AdminEvent[]>([]);
  branches = signal<Branch[]>([]);

  // Create form
  showForm = signal(false);
  formTitle = '';
  formDescription = '';
  formDate = '';
  formEndDate = '';
  formLocation = '';
  formRegisterUrl = '';
  formBranchIds: string[] = [];

  // State
  isLoading = signal(true);
  saving = signal(false);
  actionLoading = signal<string | null>(null);
  showConfirmModal = signal(false);
  eventToDelete = signal<AdminEvent | null>(null);
  successMessage = signal<string | null>(null);
  errorMessage = signal<string | null>(null);

  ngOnInit(): void {
    this.loadEvents();
    this.loadBranches();
  }

  /** Branch admins create events for their own branch only — preselect it. */
  private loadBranches(): void {
    this.structureService.getBranches().subscribe({
      next: (res) => {
        this.branches.set(res.data.branches);
        const me = this.authService.user();
        if (me?.role === 'branch_admin' && me.branchId) {
          this.formBranchIds = [me.branchId];
        }
      },
      error: () => {}
    });
  }

  loadEvents(): void {
    this.isLoading.set(true);
    this.adminService.getEvents().subscribe({
      next: (response) => {
        if (response.success) {
          this.events.set(response.data.events);
        }
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error loading events:', err);
        this.isLoading.set(false);
      }
    });
  }

  toggleForm(): void {
    this.showForm.set(!this.showForm());
    this.errorMessage.set(null);
  }

  onBranchToggle(branchId: string, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    if (checked) {
      if (!this.formBranchIds.includes(branchId)) this.formBranchIds.push(branchId);
    } else {
      this.formBranchIds = this.formBranchIds.filter((id) => id !== branchId);
    }
  }

  isBranchSelected(branchId: string): boolean {
    return this.formBranchIds.includes(branchId);
  }

  createEvent(): void {
    if (!this.formTitle.trim() || !this.formDate) return;

    this.saving.set(true);
    const payload: CreateEventPayload = {
      title: this.formTitle.trim(),
      description: this.formDescription.trim(),
      // datetime-local → ISO (Z suffix so the server stores a real instant)
      date: new Date(this.formDate).toISOString(),
      endDate: this.formEndDate ? new Date(this.formEndDate).toISOString() : null,
      location: this.formLocation.trim(),
      branchIds: [...this.formBranchIds],
      registerUrl: this.formRegisterUrl.trim() || null
    };

    this.adminService.createEvent(payload).subscribe({
      next: () => {
        this.showSuccess(this.i18n.t('events.eventCreated'));
        this.resetForm();
        this.showForm.set(false);
        this.saving.set(false);
        this.loadEvents();
      },
      error: (err) => {
        this.showError(this.extractError(err) || this.i18n.t('events.eventError'));
        this.saving.set(false);
      }
    });
  }

  confirmDelete(event: AdminEvent): void {
    this.eventToDelete.set(event);
    this.showConfirmModal.set(true);
  }

  deleteEvent(): void {
    const ev = this.eventToDelete();
    if (!ev) return;

    this.actionLoading.set(ev._id);
    this.showConfirmModal.set(false);

    this.adminService.deleteEvent(ev._id).subscribe({
      next: () => {
        this.showSuccess(this.i18n.t('events.eventDeleted'));
        this.actionLoading.set(null);
        this.loadEvents();
      },
      error: (err) => {
        this.showError(this.extractError(err));
        this.actionLoading.set(null);
      }
    });
  }

  cancelDelete(): void {
    this.showConfirmModal.set(false);
    this.eventToDelete.set(null);
  }

  isUpcoming(event: AdminEvent): boolean {
    return new Date(event.date).getTime() >= Date.now();
  }

  private resetForm(): void {
    this.formTitle = '';
    this.formDescription = '';
    this.formDate = '';
    this.formEndDate = '';
    this.formLocation = '';
    this.formRegisterUrl = '';
    const me = this.authService.user();
    this.formBranchIds =
      me?.role === 'branch_admin' && me.branchId ? [me.branchId] : [];
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
