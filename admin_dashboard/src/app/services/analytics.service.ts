import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

export interface AnalyticsData {
  totalUsers: number;
  totalPosts: number;
  activity: ActivityData[];
}

export interface ActivityData {
  date: string;
  posts: number;
  users: number;
}

@Injectable({
  providedIn: 'root'
})
export class AnalyticsService {
  constructor(private apiService: ApiService) {}

  getAnalytics(): Observable<AnalyticsData> {
    return this.apiService.get<AnalyticsData>('/admin/analytics');
  }
}
