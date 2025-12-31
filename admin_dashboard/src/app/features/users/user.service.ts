import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../core/services/api.service';

export interface User {
  id: string;
  name: string;
  email: string;
  status: string;
  role: string;
  createdAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiService = inject(ApiService);

  getUsers(): Observable<User[]> {
    return this.apiService.get<User[]>('users');
  }

  getUser(id: string): Observable<User> {
    return this.apiService.get<User>(`users/${id}`);
  }

  updateUser(id: string, data: Partial<User>): Observable<any> {
    return this.apiService.put(`users/${id}`, data);
  }

  updateUserStatus(id: string, status: string): Observable<any> {
    return this.apiService.patch(`users/${id}`, { status });
  }

  deleteUser(id: string): Observable<any> {
    return this.apiService.delete(`users/${id}`);
  }
}
