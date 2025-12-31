import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../core/services/api.service';

export interface Analytics {
  totalUsers: number;
  totalPosts: number;
  activity: Array<{ date: string; posts: number; users: number }>;
}

@Injectable({
  providedIn: 'root'
})
export class AnalyticsService {
  private apiService = inject(ApiService);

  getAnalytics(): Observable<Analytics> {
    return this.apiService.get<Analytics>('analytics');
  }
}
