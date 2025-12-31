import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService, AdminCommunity, Pagination, CommunityQueryParams } from '../../core/services/admin.service';
import { I18nService } from '../../core/services/i18n.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-communities',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './communities.component.html',
  styleUrl: './communities.component.scss'
})
export class CommunitiesComponent implements OnInit {
  private adminService = inject(AdminService);
  i18n = inject(I18nService);
  
  readonly userClientUrl = environment.userClientUrl;

  communities = signal<AdminCommunity[]>([]);
  pagination = signal<Pagination | null>(null);

  search = '';
  ownerFilter = '';
  currentPage = 1;
  itemsPerPage = 20;

  isLoading = signal(true);
  actionLoading = signal<string | null>(null);
  showConfirmModal = signal(false);
  communityToDelete = signal<AdminCommunity | null>(null);
  successMessage = signal<string | null>(null);

  ngOnInit(): void {
    this.loadCommunities();
  }

  loadCommunities(): void {
    this.isLoading.set(true);
    
    const params: CommunityQueryParams = {
      page: this.currentPage,
      limit: this.itemsPerPage
    };
    
    if (this.search) params.search = this.search;
    if (this.ownerFilter) params.owner = this.ownerFilter;

    this.adminService.getCommunities(params).subscribe({
      next: (response) => {
        if (response.success) {
          this.communities.set(response.data.communities);
          this.pagination.set(response.data.pagination);
        }
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error loading communities:', err);
        this.isLoading.set(false);
      }
    });
  }

  onSearch(): void {
    this.currentPage = 1;
    this.loadCommunities();
  }

  goToPage(page: number): void {
    this.currentPage = page;
    this.loadCommunities();
  }

  confirmDelete(community: AdminCommunity): void {
    this.communityToDelete.set(community);
    this.showConfirmModal.set(true);
  }

  executeDelete(): void {
    const community = this.communityToDelete();
    if (!community) return;

    this.actionLoading.set(community._id);
    this.showConfirmModal.set(false);

    this.adminService.deleteCommunity(community._id).subscribe({
      next: () => {
        this.successMessage.set(this.i18n.t('communities.communityDeleted'));
        this.actionLoading.set(null);
        this.communityToDelete.set(null);
        this.loadCommunities();
        setTimeout(() => this.successMessage.set(null), 3000);
      },
      error: (err) => {
        console.error('Error deleting community:', err);
        this.actionLoading.set(null);
      }
    });
  }

  cancelDelete(): void {
    this.showConfirmModal.set(false);
    this.communityToDelete.set(null);
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString(this.i18n.currentLang(), {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  viewCommunity(communityId: string): void {
    window.open(`${this.userClientUrl}/community/${communityId}`, '_blank');
  }

  viewUserProfile(username: string): void {
    window.open(`${this.userClientUrl}/profile/${username}`, '_blank');
  }

  protected Math = Math;
}
