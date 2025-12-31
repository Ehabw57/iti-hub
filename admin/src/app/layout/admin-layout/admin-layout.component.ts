import { Component, inject } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { LucideAngularModule, LayoutDashboard, Users, FileText, MessageSquare, Home, LogOut, Menu } from 'lucide-angular';
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
  readonly LogOutIcon = LogOut;
  readonly MenuIcon = Menu;
  
  navItems = [
    { path: '/dashboard', icon: 'dashboard', labelKey: 'nav.dashboard', iconComponent: LayoutDashboard },
    { path: '/users', icon: 'users', labelKey: 'nav.users', iconComponent: Users },
    { path: '/posts', icon: 'posts', labelKey: 'nav.posts', iconComponent: FileText },
    { path: '/comments', icon: 'comments', labelKey: 'nav.comments', iconComponent: MessageSquare },
    { path: '/communities', icon: 'communities', labelKey: 'nav.communities', iconComponent: Home }
  ];

  toggleSidebar(): void {
    this.sidebarCollapsed = !this.sidebarCollapsed;
  }

  logout(): void {
    this.authService.logout();
  }
}
