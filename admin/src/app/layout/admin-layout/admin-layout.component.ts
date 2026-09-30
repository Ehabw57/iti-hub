import { Component, inject, computed } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { LucideAngularModule, LayoutDashboard, Users, FileText, MessageSquare, Home, LogOut, Menu, Building2, ClipboardList, Briefcase, CalendarDays } from 'lucide-angular';
import { AuthService } from '../../core/services/auth.service';
import { I18nService } from '../../core/services/i18n.service';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, LucideAngularModule],
  templateUrl: './admin-layout.component.html',
  styleUrl: './admin-layout.component.scss'
})
export class AdminLayoutComponent {
  authService = inject(AuthService);
  i18n = inject(I18nService);
  
  sidebarCollapsed = false;
  
  // Lucide icons
  readonly LayoutDashboardIcon = LayoutDashboard;
  readonly UsersIcon = Users;
  readonly FileTextIcon = FileText;
  readonly MessageSquareIcon = MessageSquare;
  readonly HomeIcon = Home;
  readonly Building2Icon = Building2;
  readonly ClipboardListIcon = ClipboardList;
  readonly BriefcaseIcon = Briefcase;
  readonly CalendarDaysIcon = CalendarDays;
  readonly LogOutIcon = LogOut;
  readonly MenuIcon = Menu;
  
  private allNavItems = [
    { path: '/dashboard', icon: 'dashboard', labelKey: 'nav.dashboard', iconComponent: LayoutDashboard, platformOnly: true },
    { path: '/branches', icon: 'branches', labelKey: 'nav.branches', iconComponent: Building2, platformOnly: false },
    { path: '/enrollment-requests', icon: 'enrollment', labelKey: 'nav.enrollmentRequests', iconComponent: ClipboardList, platformOnly: false },
    { path: '/jobs', icon: 'jobs', labelKey: 'nav.jobs', iconComponent: Briefcase, platformOnly: false },
    { path: '/events', icon: 'events', labelKey: 'nav.events', iconComponent: CalendarDays, platformOnly: false },
    { path: '/users', icon: 'users', labelKey: 'nav.users', iconComponent: Users, platformOnly: true },
    { path: '/posts', icon: 'posts', labelKey: 'nav.posts', iconComponent: FileText, platformOnly: true },
    { path: '/comments', icon: 'comments', labelKey: 'nav.comments', iconComponent: MessageSquare, platformOnly: true },
    { path: '/communities', icon: 'communities', labelKey: 'nav.communities', iconComponent: Home, platformOnly: true }
  ];

  /** Branch admins (and instructors) see the non-platform sections only */
  navItems = computed(() =>
    this.allNavItems.filter(item => !item.platformOnly || this.authService.isPlatformAdmin())
  );

  toggleSidebar(): void {
    this.sidebarCollapsed = !this.sidebarCollapsed;
  }

  logout(): void {
    this.authService.logout();
  }
}
