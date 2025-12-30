import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ContentService, Comment } from '../posts/content.service';
import { NotificationService } from '../../shared/components/notification/notification.service';

@Component({
  selector: 'app-comments',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div>
      <h1 class="text-3xl font-bold mb-6">Comments Management</h1>

      <div class="bg-white rounded-lg shadow overflow-hidden">
        <table class="w-full">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Content</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Author</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200">
            <tr *ngFor="let comment of comments">
              <td class="px-6 py-4">{{ comment.content }}</td>
              <td class="px-6 py-4">{{ comment.authorName }}</td>
              <td class="px-6 py-4">{{ comment.createdAt | date:'short' }}</td>
              <td class="px-6 py-4">
                <button (click)="deleteComment(comment)" class="text-red-600 hover:text-red-800">Delete</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div *ngIf="loading" class="text-center py-8">Loading...</div>
    </div>
  `,
  styles: []
})
export class CommentsComponent implements OnInit {
  private contentService = inject(ContentService);
  private notificationService = inject(NotificationService);

  comments: Comment[] = [];
  loading = false;

  ngOnInit(): void {
    this.loadComments();
  }

  loadComments(): void {
    this.loading = true;
    this.contentService.getComments().subscribe({
      next: (data) => {
        this.comments = data;
        this.loading = false;
      },
      error: () => {
        this.notificationService.error('Failed to load comments');
        this.loading = false;
      }
    });
  }

  deleteComment(comment: Comment): void {
    if (confirm(`Delete this comment?`)) {
      this.contentService.deleteComment(comment.id).subscribe({
        next: () => {
          this.notificationService.success('Comment deleted');
          this.loadComments();
        },
        error: () => {
          this.notificationService.error('Failed to delete comment');
        }
      });
    }
  }
}
