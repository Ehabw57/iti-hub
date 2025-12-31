import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService, AdminPost, Pagination, PostQueryParams } from '../../core/services/admin.service';
import { I18nService } from '../../core/services/i18n.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-posts',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './posts.component.html',
  styleUrl: './posts.component.scss'
})
export class PostsComponent implements OnInit {
  private adminService = inject(AdminService);
  i18n = inject(I18nService);
  
  readonly userClientUrl = environment.userClientUrl;

  posts = signal<AdminPost[]>([]);
  pagination = signal<Pagination | null>(null);

  search = '';
  authorFilter = '';
  communityFilter = '';
  currentPage = 1;
  itemsPerPage = 20;

  isLoading = signal(true);
  actionLoading = signal<string | null>(null);
  showConfirmModal = signal(false);
  postToDelete = signal<AdminPost | null>(null);
  successMessage = signal<string | null>(null);

  ngOnInit(): void {
    this.loadPosts();
  }

  loadPosts(): void {
    this.isLoading.set(true);
    
    const params: PostQueryParams = {
      page: this.currentPage,
      limit: this.itemsPerPage
    };
    
    if (this.search) params.search = this.search;
    if (this.authorFilter) params.author = this.authorFilter;
    if (this.communityFilter) params.community = this.communityFilter;

    this.adminService.getPosts(params).subscribe({
      next: (response) => {
        if (response.success) {
          this.posts.set(response.data.posts);
          this.pagination.set(response.data.pagination);
        }
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error loading posts:', err);
        this.isLoading.set(false);
      }
    });
  }

  onSearch(): void {
    this.currentPage = 1;
    this.loadPosts();
  }

  goToPage(page: number): void {
    this.currentPage = page;
    this.loadPosts();
  }

  confirmDelete(post: AdminPost): void {
    this.postToDelete.set(post);
    this.showConfirmModal.set(true);
  }

  executeDelete(): void {
    const post = this.postToDelete();
    if (!post) return;

    this.actionLoading.set(post._id);
    this.showConfirmModal.set(false);

    this.adminService.deletePost(post._id).subscribe({
      next: () => {
        this.successMessage.set(this.i18n.t('posts.postDeleted'));
        this.actionLoading.set(null);
        this.postToDelete.set(null);
        this.loadPosts();
        setTimeout(() => this.successMessage.set(null), 3000);
      },
      error: (err) => {
        console.error('Error deleting post:', err);
        this.actionLoading.set(null);
      }
    });
  }

  cancelDelete(): void {
    this.showConfirmModal.set(false);
    this.postToDelete.set(null);
  }

  truncateContent(content: string, maxLength: number = 100): string {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString(this.i18n.currentLang(), {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  viewPost(postId: string): void {
    window.open(`${this.userClientUrl}/posts/${postId}`, '_blank');
  }

  viewUserProfile(username: string): void {
    window.open(`${this.userClientUrl}/profile/${username}`, '_blank');
  }

  protected Math = Math;
}
