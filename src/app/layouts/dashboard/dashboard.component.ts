import { Component, AfterViewInit, OnInit, DestroyRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardController } from './dashboard.controller';
import { CampaignsComponent } from '../campaign/campaigns.component';
import { SearchService } from '../../data/services/search.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, CampaignsComponent],
  providers: [DashboardController, SearchService],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})
export class DashboardComponent implements OnInit, AfterViewInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly dashboardController = inject(DashboardController);

  readonly currentTab = this.dashboardController.currentTab;
  readonly showLogoutModal = this.dashboardController.showLogoutModal;
  readonly headerSearch = this.dashboardController.headerSearch;

  ngOnInit(): void {
    this.dashboardController.init(this.destroyRef);
  }

  ngAfterViewInit(): void {
    this.dashboardController.selectTab('campaigns');
  }

  selectTab(tab: 'campaigns'): void {
    this.dashboardController.selectTab(tab);
  }

  goHome(): void {
    this.dashboardController.goHome();
  }

  openLogoutModal(): void {
    this.dashboardController.openLogoutModal();
  }

  closeLogoutModal(): void {
    this.dashboardController.closeLogoutModal();
  }

  logout(): void {
    this.dashboardController.logout();
  }

  onHeaderSearch(keyword: string): void {
    this.dashboardController.onHeaderSearch(keyword);
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
