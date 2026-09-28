/**
 * Structure API Service
 * Centralized service for managing the ITI hierarchy:
 * Branches → Rounds → Tracks (+ track member assignment).
 * Backed by the top-level /branches, /rounds, /tracks server routes.
 */
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, Pagination } from './admin.service';

export type BranchType = 'core' | 'extension';

/** Track categories — mirrors the Track model enum (server/models/Track.js) */
export type TrackCategory =
  | 'Software Development'
  | 'Web Development'
  | 'Information Systems'
  | 'Infrastructure & Networks'
  | 'Digital Arts'
  | 'Others';

/** All track categories, in Track model enum order ('Others' is the default) */
export const TRACK_CATEGORIES: TrackCategory[] = [
  'Software Development',
  'Web Development',
  'Information Systems',
  'Infrastructure & Networks',
  'Digital Arts',
  'Others'
];

export interface Branch {
  _id: string;
  name: string;
  location: string;
  type: BranchType;
  logo?: string | null;
  coverImage?: string | null;
  createdAt?: string;
}

export interface Round {
  _id: string;
  branchId: string;
  name: string;
  startDate?: string | null;
  endDate?: string | null;
  isActive: boolean;
  trackCount?: number;
  createdAt?: string;
}

export interface TrackMemberUser {
  _id: string;
  username: string;
  fullName: string;
  role: string;
  profilePicture?: string | null;
}

export interface Track {
  _id: string;
  roundId: string;
  branchId: string;
  name: string;
  description: string;
  category?: TrackCategory;
  instructorIds: TrackMemberUser[];
  studentCount?: number;
  adminId?: TrackMemberUser | null;
  createdAt?: string;
}

export interface TrackMembers {
  instructors: TrackMemberUser[];
  students: TrackMemberUser[];
  admin: TrackMemberUser | null;
}

export interface BranchListData {
  branches: Branch[];
  pagination: Pagination;
}

export interface RoundListData {
  rounds: Round[];
}

export interface TrackListData {
  round: Round;
  tracks: Track[];
}

export interface TrackMemberPatch {
  addInstructors?: string[];
  removeInstructors?: string[];
  addStudents?: string[];
  removeStudents?: string[];
}

@Injectable({
  providedIn: 'root'
})
export class StructureService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  // =========================================================================
  // BRANCHES
  // =========================================================================

  getBranches(limit = 100): Observable<ApiResponse<BranchListData>> {
    const params = new HttpParams().set('limit', limit.toString());
    return this.http.get<ApiResponse<BranchListData>>(`${this.apiUrl}/branches`, { params });
  }

  getBranch(id: string): Observable<ApiResponse<{ branch: Branch }>> {
    return this.http.get<ApiResponse<{ branch: Branch }>>(`${this.apiUrl}/branches/${id}`);
  }

  createBranch(payload: { name: string; location: string; type: BranchType }): Observable<ApiResponse<{ branch: Branch }>> {
    return this.http.post<ApiResponse<{ branch: Branch }>>(`${this.apiUrl}/branches`, payload);
  }

  updateBranch(
    id: string,
    payload: { name?: string; location?: string; type?: BranchType }
  ): Observable<ApiResponse<{ branch: Branch }>> {
    return this.http.patch<ApiResponse<{ branch: Branch }>>(`${this.apiUrl}/branches/${id}`, payload);
  }

  deleteBranch(id: string): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(`${this.apiUrl}/branches/${id}`);
  }

  // =========================================================================
  // ROUNDS
  // =========================================================================

  getBranchRounds(branchId: string): Observable<ApiResponse<RoundListData>> {
    return this.http.get<ApiResponse<RoundListData>>(`${this.apiUrl}/branches/${branchId}/rounds`);
  }

  createRound(
    branchId: string,
    payload: { name: string; isActive: boolean; startDate?: string | null; endDate?: string | null }
  ): Observable<ApiResponse<{ round: Round }>> {
    return this.http.post<ApiResponse<{ round: Round }>>(`${this.apiUrl}/branches/${branchId}/rounds`, payload);
  }

  updateRound(
    id: string,
    payload: { name?: string; isActive?: boolean; startDate?: string | null; endDate?: string | null }
  ): Observable<ApiResponse<{ round: Round }>> {
    return this.http.patch<ApiResponse<{ round: Round }>>(`${this.apiUrl}/rounds/${id}`, payload);
  }

  deleteRound(id: string): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(`${this.apiUrl}/rounds/${id}`);
  }

  // =========================================================================
  // TRACKS
  // =========================================================================

  getRoundTracks(roundId: string): Observable<ApiResponse<TrackListData>> {
    return this.http.get<ApiResponse<TrackListData>>(`${this.apiUrl}/rounds/${roundId}/tracks`);
  }

  createTrack(
    roundId: string,
    payload: { name: string; description: string; category?: TrackCategory }
  ): Observable<ApiResponse<{ track: Track }>> {
    return this.http.post<ApiResponse<{ track: Track }>>(`${this.apiUrl}/rounds/${roundId}/tracks`, payload);
  }

  updateTrack(
    id: string,
    payload: { name?: string; description?: string; category?: TrackCategory }
  ): Observable<ApiResponse<{ track: Track }>> {
    return this.http.patch<ApiResponse<{ track: Track }>>(`${this.apiUrl}/tracks/${id}`, payload);
  }

  deleteTrack(id: string): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(`${this.apiUrl}/tracks/${id}`);
  }

  // =========================================================================
  // TRACK MEMBERS
  // =========================================================================

  getTrackMembers(trackId: string): Observable<ApiResponse<TrackMembers>> {
    return this.http.get<ApiResponse<TrackMembers>>(`${this.apiUrl}/tracks/${trackId}/members`);
  }

  updateTrackMembers(trackId: string, patch: TrackMemberPatch): Observable<ApiResponse<{ track: Track }>> {
    return this.http.patch<ApiResponse<{ track: Track }>>(`${this.apiUrl}/tracks/${trackId}/members`, patch);
  }

  /** Search instructors/students for the assignment dropdowns */
  searchAssignableUsers(
    role: 'instructor' | 'student',
    q = '',
    branchId?: string
  ): Observable<ApiResponse<{ users: TrackMemberUser[] }>> {
    let params = new HttpParams().set('role', role);
    if (q) params = params.set('q', q);
    if (branchId) params = params.set('branchId', branchId);
    return this.http.get<ApiResponse<{ users: TrackMemberUser[] }>>(`${this.apiUrl}/tracks/users/search`, { params });
  }
}
