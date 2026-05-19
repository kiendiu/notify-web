import { Component, OnInit, signal, inject } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { SearchService } from '../../services/search.service';
import { CampaignComponent } from '../campaign/campaign.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, CampaignComponent],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})
export class DashboardComponent implements OnInit {
  currentTab = signal<'dashboard' | 'campaigns' | 'notification' | 'settings'>('dashboard');
  showLogoutModal = signal(false);
  userEmail = signal('user@example.com');

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  private readonly searchService = inject(SearchService);

  ngOnInit(): void {
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login']);
    }
  }

  selectTab(tab: 'dashboard' | 'campaigns' | 'notification' | 'settings'): void {
    this.currentTab.set(tab);
  }

  openLogoutModal(): void {
    this.showLogoutModal.set(true);
  }

  closeLogoutModal(): void {
    this.showLogoutModal.set(false);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  onHeaderSearch(keyword: string): void {
    this.searchService.setSearch(keyword ?? '');
  }
}
