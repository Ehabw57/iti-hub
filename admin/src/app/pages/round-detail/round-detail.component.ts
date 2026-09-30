import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  StructureService,
  Branch,
  Round,
  Track,
  TrackCategory,
  TRACK_CATEGORIES,
  TrackMemberUser
} from '../../core/services/structure.service';
import { AuthService } from '../../core/services/auth.service';
import { I18nService } from '../../core/services/i18n.service';

@Component({
  selector: 'app-round-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './round-detail.component.html',
  styleUrl: './round-detail.component.scss'
})
export class RoundDetailComponent implements OnInit {
  private structureService = inject(StructureService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  authService = inject(AuthService);
  i18n = inject(I18nService);

  branchId = '';
  roundId = '';

  branch = signal<Branch | null>(null);
  round = signal<Round | null>(null);
  tracks = signal<Track[]>([]);
  isLoading = signal(true);
  actionLoading = signal<string | null>(null);
  successMessage = signal<string | null>(null);
  errorMessage = signal<string | null>(null);

  // Create/Edit track modal
  showFormModal = signal(false);
  editingTrack = signal<Track | null>(null);
  formName = '';
  formDescription = '';
  formCategory: TrackCategory = 'Others';

  /** Category options for the track form (mirrors the Track model enum) */
  trackCategories = TRACK_CATEGORIES;

  // Delete confirm
  showConfirmModal = signal(false);
  trackToDelete = signal<Track | null>(null);

  // Members modal
  showMembersModal = signal(false);
  membersTrack = signal<Track | null>(null);
  membersLoading = signal(false);
  instructors = signal<TrackMemberUser[]>([]);
  students = signal<TrackMemberUser[]>([]);
  memberSearchRole: 'instructor' | 'student' = 'instructor';
  memberSearchQuery = '';
  searchResults = signal<TrackMemberUser[]>([]);
  searching = signal(false);
  /** True once a search completed — used to show the empty-state hint */
  hasSearched = signal(false);

  ngOnInit(): void {
    this.branchId = this.route.snapshot.paramMap.get('branchId') || '';
    this.roundId = this.route.snapshot.paramMap.get('roundId') || '';

    // Branch admins may only manage rounds of their own branch
    const me = this.authService.user();
    if (this.authService.isBranchAdmin() && me?.branchId && me.branchId !== this.branchId) {
      this.router.navigate(['/branches']);
      return;
    }

    this.structureService.getBranch(this.branchId).subscribe({
      next: (res) => this.branch.set(res.data.branch),
      error: () => {}
    });
    this.loadTracks();
  }

  loadTracks(): void {
    this.isLoading.set(true);
    this.structureService.getRoundTracks(this.roundId).subscribe({
      next: (res) => {
        this.round.set(res.data.round);
        this.tracks.set(res.data.tracks);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.showError(this.extractError(err));
        this.isLoading.set(false);
      }
    });
  }

  instructorNames(track: Track): string {
    return (track.instructorIds || []).map(i => i.fullName).join(', ') || '—';
  }

  /** CSS modifier class for a track's category Tag (see component SCSS) */
  categoryClass(category: TrackCategory | undefined): string {
    switch (category) {
      case 'Software Development': return 'cat-software';
      case 'Web Development': return 'cat-web';
      case 'Information Systems': return 'cat-systems';
      case 'Infrastructure & Networks': return 'cat-networks';
      case 'Digital Arts': return 'cat-arts';
      default: return 'cat-other';
    }
  }

  /** Localized label for a track category (structure.category* i18n keys) */
  categoryLabel(category: TrackCategory | undefined): string {
    const suffix = category ? category.replace(/[^a-zA-Z]/g, '') : 'Others';
    return this.i18n.t(`structure.category${suffix}`);
  }

  // ---- Create / Edit track ----

  openCreateModal(): void {
    this.editingTrack.set(null);
    this.formName = '';
    this.formDescription = '';
    this.formCategory = 'Others';
    this.showFormModal.set(true);
  }

  openEditModal(track: Track): void {
    this.editingTrack.set(track);
    this.formName = track.name;
    this.formDescription = track.description;
    this.formCategory = TRACK_CATEGORIES.includes(track.category as TrackCategory)
      ? (track.category as TrackCategory)
      : 'Others';
    this.showFormModal.set(true);
  }

  closeFormModal(): void {
    this.showFormModal.set(false);
    this.editingTrack.set(null);
  }

  submitForm(): void {
    const name = this.formName.trim();
    if (!name) return;

    const editing = this.editingTrack();
    if (editing) {
      this.structureService
        .updateTrack(editing._id, {
          name,
          description: this.formDescription.trim(),
          category: this.formCategory
        })
        .subscribe({
          next: () => {
            this.showSuccess(this.i18n.t('structure.trackUpdated'));
            this.closeFormModal();
            this.loadTracks();
          },
          error: (err) => this.showError(this.extractError(err))
        });
    } else {
      this.structureService
        .createTrack(this.roundId, {
          name,
          description: this.formDescription.trim(),
          category: this.formCategory
        })
        .subscribe({
          next: () => {
            this.showSuccess(this.i18n.t('structure.trackCreated'));
            this.closeFormModal();
            this.loadTracks();
          },
          error: (err) => this.showError(this.extractError(err))
        });
    }
  }

  // ---- Delete track ----

  confirmDelete(track: Track): void {
    this.trackToDelete.set(track);
    this.showConfirmModal.set(true);
  }

  cancelDelete(): void {
    this.showConfirmModal.set(false);
    this.trackToDelete.set(null);
  }

  executeDelete(): void {
    const track = this.trackToDelete();
    if (!track) return;

    this.actionLoading.set(track._id);
    this.showConfirmModal.set(false);

    this.structureService.deleteTrack(track._id).subscribe({
      next: () => {
        this.showSuccess(this.i18n.t('structure.trackDeleted'));
        this.actionLoading.set(null);
        this.trackToDelete.set(null);
        this.loadTracks();
      },
      error: (err) => {
        this.showError(this.extractError(err));
        this.actionLoading.set(null);
        this.trackToDelete.set(null);
      }
    });
  }

  // ---- Members modal ----

  openMembersModal(track: Track): void {
    this.membersTrack.set(track);
    this.showMembersModal.set(true);
    this.memberSearchQuery = '';
    this.searchResults.set([]);
    this.hasSearched.set(false);
    this.loadMembers(track._id);
  }

  closeMembersModal(): void {
    this.showMembersModal.set(false);
    this.membersTrack.set(null);
  }

  loadMembers(trackId: string): void {
    this.membersLoading.set(true);
    this.structureService.getTrackMembers(trackId).subscribe({
      next: (res) => {
        this.instructors.set(res.data.instructors);
        this.students.set(res.data.students);
        this.membersLoading.set(false);
      },
      error: (err) => {
        this.showError(this.extractError(err));
        this.membersLoading.set(false);
      }
    });
  }

  searchUsers(): void {
    const track = this.membersTrack();
    if (!track) return;

    this.searching.set(true);
    this.structureService
      .searchAssignableUsers(this.memberSearchRole, this.memberSearchQuery.trim(), this.branchId)
      .subscribe({
        next: (res) => {
          // Exclude users already assigned to this track
          const existing = new Set([
            ...this.instructors().map(u => u._id),
            ...this.students().map(u => u._id)
          ]);
          this.searchResults.set(res.data.users.filter(u => !existing.has(u._id)));
          this.hasSearched.set(true);
          this.searching.set(false);
        },
        error: (err) => {
          this.showError(this.extractError(err));
          this.searching.set(false);
        }
      });
  }

  assignUser(user: TrackMemberUser): void {
    const track = this.membersTrack();
    if (!track) return;

    const patch =
      this.memberSearchRole === 'instructor'
        ? { addInstructors: [user._id] }
        : { addStudents: [user._id] };

    this.structureService.updateTrackMembers(track._id, patch).subscribe({
      next: () => {
        this.showSuccess(this.i18n.t('structure.membersUpdated'));
        this.searchResults.set(this.searchResults().filter(u => u._id !== user._id));
        // Keep the empty-state hint hidden when results only cleared because
        // the user was just assigned
        this.hasSearched.set(this.searchResults().length > 0);
        this.loadMembers(track._id);
        this.loadTracks();
      },
      error: (err) => this.showError(this.extractError(err))
    });
  }

  removeMember(user: TrackMemberUser, role: 'instructor' | 'student'): void {
    const track = this.membersTrack();
    if (!track) return;

    const patch =
      role === 'instructor'
        ? { removeInstructors: [user._id] }
        : { removeStudents: [user._id] };

    this.structureService.updateTrackMembers(track._id, patch).subscribe({
      next: () => {
        this.showSuccess(this.i18n.t('structure.membersUpdated'));
        this.loadMembers(track._id);
        this.loadTracks();
      },
      error: (err) => this.showError(this.extractError(err))
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
