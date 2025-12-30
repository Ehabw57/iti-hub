import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../core/services/api.service';

export interface Community {
  id: string;
  name: string;
  description: string;
  members: number;
  createdAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class CommunityService {
  private apiService = inject(ApiService);

  getCommunities(): Observable<Community[]> {
    return this.apiService.get<Community[]>('communities');
  }

  createCommunity(data: Partial<Community>): Observable<any> {
    return this.apiService.post('communities', data);
  }

  deleteCommunity(id: string): Observable<any> {
    return this.apiService.delete(`communities/${id}`);
  }
}
