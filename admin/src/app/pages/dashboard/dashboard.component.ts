import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgxChartsModule, Color, ScaleType } from '@swimlane/ngx-charts';
import { LucideAngularModule, Users, FileText, MessageSquare, Home, Activity, TrendingUp, Hash, Circle } from 'lucide-angular';
import { 
  AdminService, 
  OverviewStats, 
  TagStat, 
  ActiveUser, 
  ActiveCommunity,
  OnlineUser,
  RegistrationStat,
  GrowthStats
} from '../../core/services/admin.service';
import { I18nService } from '../../core/services/i18n.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, NgxChartsModule, LucideAngularModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {
  private adminService = inject(AdminService);
  i18n = inject(I18nService);
  
  // Lucide icons
  readonly UsersIcon = Users;
  readonly FileTextIcon = FileText;
  readonly MessageSquareIcon = MessageSquare;
  readonly HomeIcon = Home;
  readonly ActivityIcon = Activity;
  readonly TrendingUpIcon = TrendingUp;
  readonly HashIcon = Hash;
  readonly CircleIcon = Circle;
  
  // Data signals
  stats = signal<OverviewStats | null>(null);
  topTags = signal<TagStat[]>([]);
  activeUsers = signal<ActiveUser[]>([]);
  activeCommunities = signal<ActiveCommunity[]>([]);
  onlineUsers = signal<OnlineUser[]>([]);
  totalOnline = signal<number>(0);
  registrationData = signal<any[]>([]);
  growthData = signal<any[]>([]);
  
  // Filter state
  selectedInterval = 'day';
  selectedTimeRange = '30'; // days
  intervals = ['day', 'week', 'month'];
  timeRanges = ['7', '30', '90', '365'];
  
  // Chart configuration
  colorScheme: Color = {
    name: 'custom',
    selectable: true,
    group: ScaleType.Ordinal,
    domain: ['#DC2626', '#2563EB', '#16A34A', '#CA8A04', '#9333EA']
  };
  
  // Loading state
  isLoading = signal(true);

  ngOnInit(): void {
    this.loadDashboardData();
  }

  private loadDashboardData(): void {
    const endDate = new Date().toISOString();
    const startDate = new Date(Date.now() - parseInt(this.selectedTimeRange) * 24 * 60 * 60 * 1000).toISOString();
    
    // Load overview stats
    this.adminService.getOverviewStats().subscribe({
      next: (response) => {
        if (response.success) {
          this.stats.set(response.data);
        }
      },
      error: (err) => console.error('Error loading stats:', err)
    });

    // Load registrations for chart
    this.adminService.getRegistrationStats({ 
      startDate, 
      endDate, 
      interval: this.selectedInterval 
    }).subscribe({
      next: (response) => {
        if (response.success) {
          this.registrationData.set([{
            name: this.i18n.t('dashboard.registrations'),
            series: response.data.registrations.map(r => ({
              name: r.date,
              value: r.count
            }))
          }]);
        }
      },
      error: (err) => console.error('Error loading registrations:', err)
    });

    // Load growth stats for chart
    this.adminService.getGrowthStats({ 
      startDate, 
      endDate, 
      interval: this.selectedInterval 
    }).subscribe({
      next: (response) => {
        if (response.success) {
          const data = response.data;
          this.growthData.set([
            {
              name: this.i18n.t('dashboard.users'),
              series: data.users.map(u => ({ name: u.date, value: u.count }))
            },
            {
              name: this.i18n.t('dashboard.posts'),
              series: data.posts.map(p => ({ name: p.date, value: p.count }))
            },
            {
              name: this.i18n.t('dashboard.communities'),
              series: data.communities.map(c => ({ name: c.date, value: c.count }))
            }
          ]);
        }
      },
      error: (err) => console.error('Error loading growth:', err)
    });

    // Load top tags
    this.adminService.getTagStats(10).subscribe({
      next: (response) => {
        if (response.success) {
          this.topTags.set(response.data.tags);
        }
      },
      error: (err) => console.error('Error loading tags:', err)
    });

    // Load active users
    this.adminService.getActiveUsers({ limit: 5 }).subscribe({
      next: (response) => {
        if (response.success) {
          this.activeUsers.set(response.data.users);
        }
      },
      error: (err) => console.error('Error loading active users:', err)
    });

    // Load active communities
    this.adminService.getActiveCommunities(5).subscribe({
      next: (response) => {
        if (response.success) {
          this.activeCommunities.set(response.data.communities);
        }
      },
      error: (err) => console.error('Error loading communities:', err)
    });

    // Load online users
    this.adminService.getOnlineUsers(10).subscribe({
      next: (response) => {
        if (response.success) {
          this.onlineUsers.set(response.data.onlineUsers);
          this.totalOnline.set(response.data.totalOnline);
          this.isLoading.set(false);
        }
      },
      error: (err) => {
        console.error('Error loading online users:', err);
        this.isLoading.set(false);
      }
    });
  }

  onFilterChange(): void {
    this.isLoading.set(true);
    this.loadDashboardData();
  }

  // Helper for tags pie chart
  getTagsChartData(): any[] {
    return this.topTags().map(tag => ({
      name: tag.tag,
      value: tag.count
    }));
  }
}
