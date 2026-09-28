import { Routes } from '@angular/router';
import { authGuard, guestGuard, platformAdminGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  },
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.component').then(m => m.LoginComponent),
    canActivate: [guestGuard]
  },
  {
    path: '',
    loadComponent: () => import('./layout/admin-layout/admin-layout.component').then(m => m.AdminLayoutComponent),
    canActivate: [authGuard],
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent),
        canActivate: [platformAdminGuard]
      },
      {
        path: 'users',
        loadComponent: () => import('./pages/users/users.component').then(m => m.UsersComponent),
        canActivate: [platformAdminGuard]
      },
      {
        path: 'posts',
        loadComponent: () => import('./pages/posts/posts.component').then(m => m.PostsComponent),
        canActivate: [platformAdminGuard]
      },
      {
        path: 'comments',
        loadComponent: () => import('./pages/comments/comments.component').then(m => m.CommentsComponent),
        canActivate: [platformAdminGuard]
      },
      {
        path: 'communities',
        loadComponent: () => import('./pages/communities/communities.component').then(m => m.CommunitiesComponent),
        canActivate: [platformAdminGuard]
      },
      {
        path: 'branches',
        loadComponent: () => import('./pages/branches/branches.component').then(m => m.BranchesComponent)
      },
      {
        path: 'branches/:branchId',
        loadComponent: () => import('./pages/branch-detail/branch-detail.component').then(m => m.BranchDetailComponent)
      },
      {
        path: 'branches/:branchId/rounds/:roundId',
        loadComponent: () => import('./pages/round-detail/round-detail.component').then(m => m.RoundDetailComponent)
      },
      {
        path: 'enrollment-requests',
        loadComponent: () => import('./pages/enrollment-requests/enrollment-requests.component').then(m => m.EnrollmentRequestsComponent)
      },
      {
        path: 'jobs',
        loadComponent: () => import('./pages/jobs/jobs.component').then(m => m.JobsComponent)
      },
      {
        path: 'events',
        loadComponent: () => import('./pages/events/events.component').then(m => m.EventsComponent)
      }
    ]
  },
  {
    path: '**',
    redirectTo: 'dashboard'
  }
];
