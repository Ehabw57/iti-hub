import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../core/services/api.service';

export interface Post {
  id: string;
  content: string;
  author: string;
  authorName: string;
  createdAt: string;
  likes: number;
}

export interface Comment {
  id: string;
  content: string;
  author: string;
  authorName: string;
  postId: string;
  createdAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class ContentService {
  private apiService = inject(ApiService);

  getPosts(): Observable<Post[]> {
    return this.apiService.get<Post[]>('posts');
  }

  deletePost(id: string): Observable<any> {
    return this.apiService.delete(`posts/${id}`);
  }

  getComments(): Observable<Comment[]> {
    return this.apiService.get<Comment[]>('comments');
  }

  deleteComment(id: string): Observable<any> {
    return this.apiService.delete(`comments/${id}`);
  }
}
