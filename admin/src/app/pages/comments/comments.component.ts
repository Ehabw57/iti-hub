import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService, AdminComment, Pagination, CommentQueryParams } from '../../core/services/admin.service';
import { I18nService } from '../../core/services/i18n.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-comments',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './comments.component.html',
  styleUrl: './comments.component.scss'
})
export class CommentsComponent implements OnInit {
  private adminService = inject(AdminService);
  i18n = inject(I18nService);
  
  readonly userClientUrl = environment.userClientUrl;

  comments = signal<AdminComment[]>([]);
  pagination = signal<Pagination | null>(null);

  search = '';
  authorFilter = '';
  currentPage = 1;
  itemsPerPage = 20;

  isLoading = signal(true);
  actionLoading = signal<string | null>(null);
  showConfirmModal = signal(false);
  commentToDelete = signal<AdminComment | null>(null);
  successMessage = signal<string | null>(null);

  ngOnInit(): void {
    this.loadComments();
  }

  loadComments(): void {
    this.isLoading.set(true);
    
    const params: CommentQueryParams = {
      page: this.currentPage,
      limit: this.itemsPerPage
    };
    
    if (this.search) params.search = this.search;
    if (this.authorFilter) params.author = this.authorFilter;

    this.adminService.getComments(params).subscribe({
      next: (response) => {
        if (response.success) {
          this.comments.set(response.data.comments);
          this.pagination.set(response.data.pagination);
        }
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error loading comments:', err);
        this.isLoading.set(false);
      }
    });
  }

  onSearch(): void {
    this.currentPage = 1;
    this.loadComments();
  }

  goToPage(page: number): void {
    this.currentPage = page;
    this.loadComments();
  }

  confirmDelete(comment: AdminComment): void {
    this.commentToDelete.set(comment);
    this.showConfirmModal.set(true);
  }

  executeDelete(): void {
    const comment = this.commentToDelete();
    if (!comment) return;

    this.actionLoading.set(comment._id);
    this.showConfirmModal.set(false);

    this.adminService.deleteComment(comment._id).subscribe({
      next: () => {
        this.successMessage.set(this.i18n.t('comments.commentDeleted'));
        this.actionLoading.set(null);
        this.commentToDelete.set(null);
        this.loadComments();
        setTimeout(() => this.successMessage.set(null), 3000);
      },
      error: (err) => {
        console.error('Error deleting comment:', err);
        this.actionLoading.set(null);
      }
    });
  }

  cancelDelete(): void {
    this.showConfirmModal.set(false);
    this.commentToDelete.set(null);
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

  viewComment(postId: string, commentId: string): void {
    window.open(`${this.userClientUrl}/posts/${postId}#comment-${commentId}`, '_blank');
  }

  viewUserProfile(username: string): void {
    window.open(`${this.userClientUrl}/profile/${username}`, '_blank');
  }

  protected Math = Math;
}
