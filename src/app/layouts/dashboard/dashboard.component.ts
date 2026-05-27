import { Component, AfterViewInit, OnInit, ViewChild, signal, inject } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../data/services/auth.service';
import { SearchService } from '../../data/services/search.service';
import { CampaignsComponent } from '../campaign/campaigns.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, CampaignsComponent],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})
export class DashboardComponent implements OnInit, AfterViewInit {
  readonly currentTab = signal<'campaigns'>('campaigns');
  readonly showLogoutModal = signal(false);

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  private readonly searchService = inject(SearchService);

  ngOnInit(): void {
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login']);
      return;
    }

    // recent activities removed
  }

  ngAfterViewInit(): void {
    this.currentTab.set('campaigns');
  }

  selectTab(tab: 'campaigns'): void {
    this.currentTab.set(tab);
  }

  goHome(): void {
    this.selectTab('campaigns');
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

  private formatActivityTime(timestamp: number): string {
    return new Intl.DateTimeFormat('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(new Date(timestamp));
  }
}
