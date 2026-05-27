import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NotificationToastComponent } from './layouts/components/notification-toast/notification-toast.component';
import { NotificationService } from './layouts/components/notification-toast/notification-toast.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NotificationToastComponent],
  providers: [NotificationService],
  template: '<router-outlet></router-outlet><app-notification-toast />',
  styles: []
})
export class App {}
