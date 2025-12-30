import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AnalyticsService, Analytics } from './analytics.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div>
      <h1 class="text-3xl font-bold mb-6">Dashboard Analytics</h1>

      <div *ngIf="analytics" class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <!-- Total Users Card -->
        <div class="bg-white p-6 rounded-lg shadow">
          <h3 class="text-gray-500 text-sm font-medium">Total Users</h3>
          <p class="text-3xl font-bold text-blue-600 mt-2">{{ analytics.totalUsers }}</p>
        </div>

        <!-- Total Posts Card -->
        <div class="bg-white p-6 rounded-lg shadow">
          <h3 class="text-gray-500 text-sm font-medium">Total Posts</h3>
          <p class="text-3xl font-bold text-green-600 mt-2">{{ analytics.totalPosts }}</p>
        </div>
      </div>

      <!-- Activity Chart (Simple Table) -->
      <div *ngIf="analytics" class="bg-white p-6 rounded-lg shadow">
        <h3 class="text-xl font-semibold mb-4">Recent Activity</h3>
        <table class="w-full">
          <thead>
            <tr class="border-b">
              <th class="text-left py-2">Date</th>
              <th class="text-left py-2">Posts</th>
              <th class="text-left py-2">Users</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let item of analytics.activity" class="border-b">
              <td class="py-2">{{ item.date }}</td>
              <td class="py-2">{{ item.posts }}</td>
              <td class="py-2">{{ item.users }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div *ngIf="loading" class="text-center py-8">
        <p>Loading...</p>
      </div>

      <div *ngIf="error" class="bg-red-100 text-red-700 p-4 rounded-lg">
        {{ error }}
      </div>
    </div>
  `,
  styles: []
})
export class DashboardComponent implements OnInit {
  private analyticsService = inject(AnalyticsService);
  
  analytics: Analytics | null = null;
  loading = false;
  error = '';

  ngOnInit(): void {
    this.loadAnalytics();
  }

  loadAnalytics(): void {
    this.loading = true;
    this.analyticsService.getAnalytics().subscribe({
      next: (data) => {
        this.analytics = data;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to load analytics';
        this.loading = false;
      }
    });
  }
}
