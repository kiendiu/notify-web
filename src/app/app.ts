import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NotificationToastComponent } from './core/components/notification-toast/notification-toast.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NotificationToastComponent],
  template: '<router-outlet></router-outlet><app-notification-toast />',
  styles: []
})
export class App {}
