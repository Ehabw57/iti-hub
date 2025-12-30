import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ContentService, Post } from './content.service';
import { NotificationService } from '../../shared/components/notification/notification.service';

@Component({
  selector: 'app-posts',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div>
      <h1 class="text-3xl font-bold mb-6">Posts Management</h1>

      <div class="bg-white rounded-lg shadow overflow-hidden">
        <table class="w-full">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Content</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Author</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Likes</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200">
            <tr *ngFor="let post of posts">
              <td class="px-6 py-4">{{ post.content.substring(0, 100) }}...</td>
              <td class="px-6 py-4">{{ post.authorName }}</td>
              <td class="px-6 py-4">{{ post.likes }}</td>
              <td class="px-6 py-4">
                <button (click)="deletePost(post)" class="text-red-600 hover:text-red-800">Delete</button>
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
export class PostsComponent implements OnInit {
  private contentService = inject(ContentService);
  private notificationService = inject(NotificationService);

  posts: Post[] = [];
  loading = false;

  ngOnInit(): void {
    this.loadPosts();
  }

  loadPosts(): void {
    this.loading = true;
    this.contentService.getPosts().subscribe({
      next: (data) => {
        this.posts = data;
        this.loading = false;
      },
      error: () => {
        this.notificationService.error('Failed to load posts');
        this.loading = false;
      }
    });
  }

  deletePost(post: Post): void {
    if (confirm(`Delete this post?`)) {
      this.contentService.deletePost(post.id).subscribe({
        next: () => {
          this.notificationService.success('Post deleted');
          this.loadPosts();
        },
        error: () => {
          this.notificationService.error('Failed to delete post');
        }
      });
    }
  }
}
