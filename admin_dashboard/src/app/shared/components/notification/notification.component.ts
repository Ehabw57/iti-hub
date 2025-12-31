import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { NotificationService, Notification } from './notification.service';

@Component({
  selector: 'app-notification',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notification.component.html',
  styleUrls: ['./notification.component.css']
})
export class NotificationComponent implements OnInit, OnDestroy {
  notifications: Notification[] = [];
  private subscription?: Subscription;

  constructor(private notificationService: NotificationService) {}

  ngOnInit(): void {
    this.subscription = this.notificationService.notifications$.subscribe(
      notification => {
        this.notifications.push(notification);
        
        setTimeout(() => {
          this.removeNotification(notification);
        }, notification.duration || 3000);
      }
    );
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  removeNotification(notification: Notification): void {
    this.notifications = this.notifications.filter(n => n !== notification);
  }

  getNotificationClass(type: string): string {
    const baseClasses = 'px-6 py-4 rounded-lg shadow-lg mb-4 transition-all';
    const typeClasses = {
      success: 'bg-green-500 text-white',
      error: 'bg-red-500 text-white',
      info: 'bg-blue-500 text-white',
      warning: 'bg-yellow-500 text-white'
    };
    return `${baseClasses} ${typeClasses[type as keyof typeof typeClasses]}`;
  }
}
