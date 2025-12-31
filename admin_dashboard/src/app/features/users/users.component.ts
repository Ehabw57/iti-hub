import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService, User } from './user.service';
import { NotificationService } from '../../shared/components/notification/notification.service';
import { ModalComponent } from '../../shared/components/modal/modal.component';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent],
  template: `
    <div>
      <h1 class="text-3xl font-bold mb-6">User Management</h1>

      <!-- Search and Actions -->
      <div class="bg-white p-4 rounded-lg shadow mb-6">
        <div class="flex gap-4">
          <input 
            type="text" 
            [(ngModel)]="searchTerm"
            (ngModelChange)="onSearch()"
            placeholder="Search users..."
            class="flex-1 px-4 py-2 border rounded-lg">
          <button class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
            Export
          </button>
        </div>
      </div>

      <!-- Users Table -->
      <div class="bg-white rounded-lg shadow overflow-hidden">
        <table class="w-full">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200">
            <tr *ngFor="let user of filteredUsers">
              <td class="px-6 py-4">{{ user.name }}</td>
              <td class="px-6 py-4">{{ user.email }}</td>
              <td class="px-6 py-4">
                <span class="px-2 py-1 rounded text-sm"
                      [ngClass]="user.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'">
                  {{ user.status }}
                </span>
              </td>
              <td class="px-6 py-4">
                <button (click)="editUser(user)" class="text-blue-600 hover:text-blue-800 mr-3">Edit</button>
                <button (click)="toggleStatus(user)" class="text-orange-600 hover:text-orange-800 mr-3">
                  {{ user.status === 'active' ? 'Suspend' : 'Activate' }}
                </button>
                <button (click)="deleteUser(user)" class="text-red-600 hover:text-red-800">Delete</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div *ngIf="loading" class="text-center py-8">Loading...</div>

      <!-- Edit Modal -->
      <app-modal [isOpen]="showEditModal" [title]="'Edit User'" (closeModal)="showEditModal = false">
        <div *ngIf="selectedUser">
          <div class="mb-4">
            <label class="block text-gray-700 mb-2">Name</label>
            <input 
              type="text" 
              [(ngModel)]="selectedUser.name"
              class="w-full px-4 py-2 border rounded-lg">
          </div>
          <div class="mb-4">
            <label class="block text-gray-700 mb-2">Email</label>
            <input 
              type="email" 
              [(ngModel)]="selectedUser.email"
              class="w-full px-4 py-2 border rounded-lg">
          </div>
          <div class="flex justify-end gap-2">
            <button (click)="showEditModal = false" class="px-4 py-2 border rounded-lg">Cancel</button>
            <button (click)="saveUser()" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Save</button>
          </div>
        </div>
      </app-modal>
    </div>
  `,
  styles: []
})
export class UsersComponent implements OnInit {
  private userService = inject(UserService);
  private notificationService = inject(NotificationService);

  users: User[] = [];
  filteredUsers: User[] = [];
  searchTerm = '';
  loading = false;
  showEditModal = false;
  selectedUser: User | null = null;

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.loading = true;
    this.userService.getUsers().subscribe({
      next: (data) => {
        this.users = data;
        this.filteredUsers = data;
        this.loading = false;
      },
      error: () => {
        this.notificationService.error('Failed to load users');
        this.loading = false;
      }
    });
  }

  onSearch(): void {
    this.filteredUsers = this.users.filter(user =>
      user.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
  }

  editUser(user: User): void {
    this.selectedUser = { ...user };
    this.showEditModal = true;
  }

  saveUser(): void {
    if (this.selectedUser) {
      this.userService.updateUser(this.selectedUser.id, this.selectedUser).subscribe({
        next: () => {
          this.notificationService.success('User updated successfully');
          this.showEditModal = false;
          this.loadUsers();
        },
        error: () => {
          this.notificationService.error('Failed to update user');
        }
      });
    }
  }

  toggleStatus(user: User): void {
    const newStatus = user.status === 'active' ? 'suspended' : 'active';
    this.userService.updateUserStatus(user.id, newStatus).subscribe({
      next: () => {
        this.notificationService.success(`User ${newStatus}`);
        this.loadUsers();
      },
      error: () => {
        this.notificationService.error('Failed to update status');
      }
    });
  }

  deleteUser(user: User): void {
    if (confirm(`Delete user ${user.name}?`)) {
      this.userService.deleteUser(user.id).subscribe({
        next: () => {
          this.notificationService.success('User deleted');
          this.loadUsers();
        },
        error: () => {
          this.notificationService.error('Failed to delete user');
        }
      });
    }
  }
}
