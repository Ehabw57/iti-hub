import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CommunityService, Community } from './community.service';
import { NotificationService } from '../../shared/components/notification/notification.service';
import { ModalComponent } from '../../shared/components/modal/modal.component';

@Component({
  selector: 'app-communities',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent],
  template: `
    <div>
      <div class="flex justify-between items-center mb-6">
        <h1 class="text-3xl font-bold">Communities Management</h1>
        <button (click)="showCreateModal = true" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          Create Community
        </button>
      </div>

      <div class="bg-white rounded-lg shadow overflow-hidden">
        <table class="w-full">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Members</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200">
            <tr *ngFor="let community of communities">
              <td class="px-6 py-4 font-medium">{{ community.name }}</td>
              <td class="px-6 py-4">{{ community.description }}</td>
              <td class="px-6 py-4">{{ community.members }}</td>
              <td class="px-6 py-4">
                <button (click)="deleteCommunity(community)" class="text-red-600 hover:text-red-800">Delete</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div *ngIf="loading" class="text-center py-8">Loading...</div>

      <!-- Create Modal -->
      <app-modal [isOpen]="showCreateModal" [title]="'Create Community'" (closeModal)="showCreateModal = false">
        <div>
          <div class="mb-4">
            <label class="block text-gray-700 mb-2">Name</label>
            <input 
              type="text" 
              [(ngModel)]="newCommunity.name"
              class="w-full px-4 py-2 border rounded-lg">
          </div>
          <div class="mb-4">
            <label class="block text-gray-700 mb-2">Description</label>
            <textarea 
              [(ngModel)]="newCommunity.description"
              class="w-full px-4 py-2 border rounded-lg"
              rows="3"></textarea>
          </div>
          <div class="flex justify-end gap-2">
            <button (click)="showCreateModal = false" class="px-4 py-2 border rounded-lg">Cancel</button>
            <button (click)="createCommunity()" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Create</button>
          </div>
        </div>
      </app-modal>
    </div>
  `,
  styles: []
})
export class CommunitiesComponent implements OnInit {
  private communityService = inject(CommunityService);
  private notificationService = inject(NotificationService);

  communities: Community[] = [];
  loading = false;
  showCreateModal = false;
  newCommunity: Partial<Community> = { name: '', description: '' };

  ngOnInit(): void {
    this.loadCommunities();
  }

  loadCommunities(): void {
    this.loading = true;
    this.communityService.getCommunities().subscribe({
      next: (data) => {
        this.communities = data;
        this.loading = false;
      },
      error: () => {
        this.notificationService.error('Failed to load communities');
        this.loading = false;
      }
    });
  }

  createCommunity(): void {
    this.communityService.createCommunity(this.newCommunity).subscribe({
      next: () => {
        this.notificationService.success('Community created');
        this.showCreateModal = false;
        this.newCommunity = { name: '', description: '' };
        this.loadCommunities();
      },
      error: () => {
        this.notificationService.error('Failed to create community');
      }
    });
  }

  deleteCommunity(community: Community): void {
    if (confirm(`Delete community "${community.name}"?`)) {
      this.communityService.deleteCommunity(community.id).subscribe({
        next: () => {
          this.notificationService.success('Community deleted');
          this.loadCommunities();
        },
        error: () => {
          this.notificationService.error('Failed to delete community');
        }
      });
    }
  }
}
