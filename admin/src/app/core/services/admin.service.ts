/**
 * Admin API Service
 * Centralized service for all admin API calls
 */
import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

// Response interfaces
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface PaginatedData<T> {
  items: T[];
  pagination: Pagination;
}

export interface Pagination {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

// Statistics interfaces
export interface OverviewStats {
  users: {
    total: number;
    active: number;
    blocked: number;
    admins: number;
  };
  communities: {
    total: number;
  };
  posts: {
    total: number;
  };
  comments: {
    total: number;
  };
}

export interface RegistrationStat {
  date: string;
  count: number;
}

export interface GrowthStat {
  date: string;
  count: number;
}

export interface GrowthStats {
  users: GrowthStat[];
  posts: GrowthStat[];
  communities: GrowthStat[];
}

export interface TagStat {
  tag: string;
  count: number;
}

export interface ActiveUser {
  _id: string;
  username: string;
  fullName: string;
  profilePicture?: string;
  postsCount: number;
  commentsCount: number;
}

export interface ActiveCommunity {
  _id: string;
  name: string;
  profilePicture?: string;
  memberCount: number;
  postCount: number;
  createdAt: string;
}

export interface OnlineUser {
  _id: string;
  username: string;
  fullName: string;
  profilePicture?: string;
  lastSeen: string;
}

// User interfaces
export interface AdminUser {
  _id: string;
  username: string;
  email: string;
  fullName: string;
  role: string;
  branchId?: string | null;
  isBlocked: boolean;
  createdAt: string;
  lastSeen?: string;
  profilePicture?: string;
  postsCount: number;
  followersCount: number;
  followingCount: number;
}

// Post interfaces
export interface AdminPost {
  _id: string;
  content: string;
  author: {
    _id: string;
    username: string;
    fullName: string;
    profilePicture?: string;
  };
  community?: {
    _id: string;
    name: string;
  };
  images: string[];
  tags: string[];
  likesCount: number;
  commentsCount: number;
  repostsCount: number;
  createdAt: string;
}

// Comment interfaces
export interface AdminComment {
  _id: string;
  content: string;
  author: {
    _id: string;
    username: string;
    fullName: string;
    profilePicture?: string;
  };
  post: {
    _id: string;
    content: string;
  };
  likes: number;
  createdAt: string;
}

// Community interfaces
export interface AdminCommunity {
  _id: string;
  name: string;
  description?: string;
  owners: {
    _id: string;
    username: string;
    fullName: string;
    profilePicture?: string;
  }[];
  memberCount: number;
  createdAt: string;
}

// Enrollment request interfaces (tracks system — role-scoped review queue;
// served by /tracks endpoints, NOT under /admin)
export interface AdminEnrollmentRequest {
  _id: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  decidedAt?: string | null;
  user_id: {
    _id: string;
    username: string;
    fullName: string;
    profilePicture?: string;
  } | null;
  track_id: {
    _id: string;
    name: string;
    category?: string;
  } | null;
  branch_id: {
    _id: string;
    name: string;
    location?: string;
  } | null;
}

export interface EnrollmentRequestQueryParams {
  status?: string;
}

// Job board interfaces (work order §4 — /jobs endpoints)
export interface AdminJob {
  _id: string;
  title: string;
  company: string;
  companyLogo?: string | null;
  location?: string;
  description?: string;
  tags?: string[];
  applyUrl: string;
  isActive?: boolean;
  createdAt: string;
  postedBy?: {
    _id: string;
    username: string;
    fullName: string;
    profilePicture?: string;
  } | null;
}

export interface CreateJobPayload {
  title: string;
  company: string;
  location?: string;
  description?: string;
  tags?: string[];
  applyUrl: string;
}

// Events interfaces (work order §1 — /events endpoints)
export interface AdminEvent {
  _id: string;
  title: string;
  description?: string;
  date: string;
  endDate?: string | null;
  location?: string;
  branchIds?: { _id: string; name: string }[] | string[];
  registerUrl?: string | null;
  attendeeCount?: number;
  isRegistered?: boolean;
  createdAt: string;
  createdBy?: {
    _id: string;
    username: string;
    fullName: string;
    profilePicture?: string;
  } | null;
}

export interface CreateEventPayload {
  title: string;
  description?: string;
  date: string;
  endDate?: string | null;
  location?: string;
  branchIds?: string[];
  registerUrl?: string | null;
}

// Query params interfaces
export interface UserQueryParams {
  search?: string;
  role?: string;
  isBlocked?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface PostQueryParams {
  search?: string;
  author?: string;
  community?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface CommentQueryParams {
  search?: string;
  author?: string;
  post?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface CommunityQueryParams {
  search?: string;
  owner?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private readonly apiUrl = `${environment.apiUrl}/admin`;
  
  // Loading states
  isLoading = signal<boolean>(false);

  constructor(private http: HttpClient) {}

  // =========================================================================
  // STATISTICS
  // =========================================================================

  getOverviewStats(): Observable<ApiResponse<OverviewStats>> {
    return this.http.get<ApiResponse<OverviewStats>>(`${this.apiUrl}/statistics/overview`);
  }

  getRegistrationStats(params?: { startDate?: string; endDate?: string; interval?: string }): Observable<ApiResponse<{ registrations: RegistrationStat[] }>> {
    let httpParams = new HttpParams();
    if (params?.startDate) httpParams = httpParams.set('startDate', params.startDate);
    if (params?.endDate) httpParams = httpParams.set('endDate', params.endDate);
    if (params?.interval) httpParams = httpParams.set('interval', params.interval);
    
    return this.http.get<ApiResponse<{ registrations: RegistrationStat[] }>>(`${this.apiUrl}/statistics/registrations`, { params: httpParams });
  }

  getGrowthStats(params?: { startDate?: string; endDate?: string; interval?: string }): Observable<ApiResponse<GrowthStats>> {
    let httpParams = new HttpParams();
    if (params?.startDate) httpParams = httpParams.set('startDate', params.startDate);
    if (params?.endDate) httpParams = httpParams.set('endDate', params.endDate);
    if (params?.interval) httpParams = httpParams.set('interval', params.interval);
    
    return this.http.get<ApiResponse<GrowthStats>>(`${this.apiUrl}/statistics/growth`, { params: httpParams });
  }

  getTagStats(limit?: number): Observable<ApiResponse<{ tags: TagStat[] }>> {
    let httpParams = new HttpParams();
    if (limit) httpParams = httpParams.set('limit', limit.toString());
    
    return this.http.get<ApiResponse<{ tags: TagStat[] }>>(`${this.apiUrl}/statistics/tags`, { params: httpParams });
  }

  getActiveUsers(params?: { limit?: number; startDate?: string; endDate?: string }): Observable<ApiResponse<{ users: ActiveUser[] }>> {
    let httpParams = new HttpParams();
    if (params?.limit) httpParams = httpParams.set('limit', params.limit.toString());
    if (params?.startDate) httpParams = httpParams.set('startDate', params.startDate);
    if (params?.endDate) httpParams = httpParams.set('endDate', params.endDate);
    
    return this.http.get<ApiResponse<{ users: ActiveUser[] }>>(`${this.apiUrl}/statistics/active-users`, { params: httpParams });
  }

  getActiveCommunities(limit?: number): Observable<ApiResponse<{ communities: ActiveCommunity[] }>> {
    let httpParams = new HttpParams();
    if (limit) httpParams = httpParams.set('limit', limit.toString());
    
    return this.http.get<ApiResponse<{ communities: ActiveCommunity[] }>>(`${this.apiUrl}/statistics/active-communities`, { params: httpParams });
  }

  getOnlineUsers(limit?: number): Observable<ApiResponse<{ onlineUsers: OnlineUser[]; totalOnline: number }>> {
    let httpParams = new HttpParams();
    if (limit) httpParams = httpParams.set('limit', limit.toString());
    
    return this.http.get<ApiResponse<{ onlineUsers: OnlineUser[]; totalOnline: number }>>(`${this.apiUrl}/statistics/online-users`, { params: httpParams });
  }

  // =========================================================================
  // USER MANAGEMENT
  // =========================================================================

  getUsers(params?: UserQueryParams): Observable<ApiResponse<{ users: AdminUser[]; pagination: Pagination }>> {
    let httpParams = new HttpParams();
    if (params?.search) httpParams = httpParams.set('search', params.search);
    if (params?.role) httpParams = httpParams.set('role', params.role);
    if (params?.isBlocked) httpParams = httpParams.set('isBlocked', params.isBlocked);
    if (params?.startDate) httpParams = httpParams.set('startDate', params.startDate);
    if (params?.endDate) httpParams = httpParams.set('endDate', params.endDate);
    if (params?.page) httpParams = httpParams.set('page', params.page.toString());
    if (params?.limit) httpParams = httpParams.set('limit', params.limit.toString());
    
    return this.http.get<ApiResponse<{ users: AdminUser[]; pagination: Pagination }>>(`${this.apiUrl}/users`, { params: httpParams });
  }

  getUserById(userId: string): Observable<ApiResponse<{ user: AdminUser }>> {
    return this.http.get<ApiResponse<{ user: AdminUser }>>(`${this.apiUrl}/users/${userId}`);
  }

  blockUser(userId: string): Observable<ApiResponse<{ user: AdminUser }>> {
    return this.http.patch<ApiResponse<{ user: AdminUser }>>(`${this.apiUrl}/users/${userId}/block`, {});
  }

  unblockUser(userId: string): Observable<ApiResponse<{ user: AdminUser }>> {
    return this.http.patch<ApiResponse<{ user: AdminUser }>>(`${this.apiUrl}/users/${userId}/unblock`, {});
  }

  deleteUser(userId: string): Observable<ApiResponse<{ deletedUser: string }>> {
    return this.http.delete<ApiResponse<{ deletedUser: string }>>(`${this.apiUrl}/users/${userId}`);
  }

  updateUserRole(
    userId: string,
    role: string,
    branchId?: string
  ): Observable<ApiResponse<{ user: AdminUser }>> {
    return this.http.patch<ApiResponse<{ user: AdminUser }>>(
      `${this.apiUrl}/users/${userId}/role`,
      { role, ...(branchId ? { branchId } : {}) }
    );
  }

  // =========================================================================
  // POST MANAGEMENT
  // =========================================================================

  getPosts(params?: PostQueryParams): Observable<ApiResponse<{ posts: AdminPost[]; pagination: Pagination }>> {
    let httpParams = new HttpParams();
    if (params?.search) httpParams = httpParams.set('search', params.search);
    if (params?.author) httpParams = httpParams.set('author', params.author);
    if (params?.community) httpParams = httpParams.set('community', params.community);
    if (params?.startDate) httpParams = httpParams.set('startDate', params.startDate);
    if (params?.endDate) httpParams = httpParams.set('endDate', params.endDate);
    if (params?.page) httpParams = httpParams.set('page', params.page.toString());
    if (params?.limit) httpParams = httpParams.set('limit', params.limit.toString());
    
    return this.http.get<ApiResponse<{ posts: AdminPost[]; pagination: Pagination }>>(`${this.apiUrl}/posts`, { params: httpParams });
  }

  deletePost(postId: string): Observable<ApiResponse<{ deletedPost: string }>> {
    return this.http.delete<ApiResponse<{ deletedPost: string }>>(`${this.apiUrl}/posts/${postId}`);
  }

  // =========================================================================
  // COMMENT MANAGEMENT
  // =========================================================================

  getComments(params?: CommentQueryParams): Observable<ApiResponse<{ comments: AdminComment[]; pagination: Pagination }>> {
    let httpParams = new HttpParams();
    if (params?.search) httpParams = httpParams.set('search', params.search);
    if (params?.author) httpParams = httpParams.set('author', params.author);
    if (params?.post) httpParams = httpParams.set('post', params.post);
    if (params?.startDate) httpParams = httpParams.set('startDate', params.startDate);
    if (params?.endDate) httpParams = httpParams.set('endDate', params.endDate);
    if (params?.page) httpParams = httpParams.set('page', params.page.toString());
    if (params?.limit) httpParams = httpParams.set('limit', params.limit.toString());
    
    return this.http.get<ApiResponse<{ comments: AdminComment[]; pagination: Pagination }>>(`${this.apiUrl}/comments`, { params: httpParams });
  }

  deleteComment(commentId: string): Observable<ApiResponse<{ deletedComment: string }>> {
    return this.http.delete<ApiResponse<{ deletedComment: string }>>(`${this.apiUrl}/comments/${commentId}`);
  }

  // =========================================================================
  // COMMUNITY MANAGEMENT
  // =========================================================================

  getCommunities(params?: CommunityQueryParams): Observable<ApiResponse<{ communities: AdminCommunity[]; pagination: Pagination }>> {
    let httpParams = new HttpParams();
    if (params?.search) httpParams = httpParams.set('search', params.search);
    if (params?.owner) httpParams = httpParams.set('owner', params.owner);
    if (params?.startDate) httpParams = httpParams.set('startDate', params.startDate);
    if (params?.endDate) httpParams = httpParams.set('endDate', params.endDate);
    if (params?.page) httpParams = httpParams.set('page', params.page.toString());
    if (params?.limit) httpParams = httpParams.set('limit', params.limit.toString());
    
    return this.http.get<ApiResponse<{ communities: AdminCommunity[]; pagination: Pagination }>>(`${this.apiUrl}/communities`, { params: httpParams });
  }

  deleteCommunity(communityId: string): Observable<ApiResponse<{ deletedCommunity: string }>> {
    return this.http.delete<ApiResponse<{ deletedCommunity: string }>>(`${this.apiUrl}/communities/${communityId}`);
  }

  // =========================================================================
  // ENROLLMENT REQUESTS (tracks system — role-scoped by the server:
  // super admin sees all, branch admin their branch, instructors their tracks)
  // =========================================================================

  getEnrollmentRequests(params?: EnrollmentRequestQueryParams): Observable<ApiResponse<{ requests: AdminEnrollmentRequest[] }>> {
    let httpParams = new HttpParams();
    if (params?.status) httpParams = httpParams.set('status', params.status);

    return this.http.get<ApiResponse<{ requests: AdminEnrollmentRequest[] }>>(
      `${environment.apiUrl}/tracks/enroll-requests`,
      { params: httpParams }
    );
  }

  decideEnrollmentRequest(
    requestId: string,
    decision: 'approved' | 'rejected'
  ): Observable<ApiResponse<{ request: { _id: string; status: string } }>> {
    return this.http.patch<ApiResponse<{ request: { _id: string; status: string } }>>(
      `${environment.apiUrl}/tracks/enroll-requests/${requestId}/decision`,
      { decision }
    );
  }

  // =========================================================================
  // JOBS (work order §4 — /jobs endpoints; creation is server-gated to
  // super admin / branch admin / instructor)
  // =========================================================================

  getJobs(): Observable<ApiResponse<{ jobs: AdminJob[] }>> {
    return this.http.get<ApiResponse<{ jobs: AdminJob[] }>>(`${environment.apiUrl}/jobs`);
  }

  createJob(payload: CreateJobPayload): Observable<ApiResponse<{ job: AdminJob }>> {
    return this.http.post<ApiResponse<{ job: AdminJob }>>(`${environment.apiUrl}/jobs`, payload);
  }

  deleteJob(jobId: string): Observable<void> {
    return this.http.delete<void>(`${environment.apiUrl}/jobs/${jobId}`);
  }

  // =========================================================================
  // EVENTS (work order §1 — /events endpoints)
  // =========================================================================

  getEvents(): Observable<ApiResponse<{ events: AdminEvent[] }>> {
    return this.http.get<ApiResponse<{ events: AdminEvent[] }>>(`${environment.apiUrl}/events`);
  }

  createEvent(payload: CreateEventPayload): Observable<ApiResponse<{ event: AdminEvent }>> {
    return this.http.post<ApiResponse<{ event: AdminEvent }>>(`${environment.apiUrl}/events`, payload);
  }

  deleteEvent(eventId: string): Observable<void> {
    return this.http.delete<void>(`${environment.apiUrl}/events/${eventId}`);
  }
}
