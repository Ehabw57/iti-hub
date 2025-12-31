import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AnalyticsService, AnalyticsData } from '../../services/analytics.service';
import { NotificationService } from '../../shared/components/notification/notification.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  analytics: AnalyticsData | null = null;
  isLoading = true;

  constructor(
    private analyticsService: AnalyticsService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.loadAnalytics();
  }

  loadAnalytics(): void {
    this.isLoading = true;
    this.analyticsService.getAnalytics().subscribe({
      next: (data) => {
        this.analytics = data;
        this.isLoading = false;
      },
      error: (error) => {
        this.notificationService.error('Failed to load analytics data');
        this.isLoading = false;
        console.error('Error loading analytics:', error);
      }
    });
  }

  refresh(): void {
    this.loadAnalytics();
  }
}
