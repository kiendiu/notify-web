import { Component, AfterViewInit, ChangeDetectorRef, DestroyRef, OnInit, Type } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AuthService } from '../../data/services/auth.service';
import { SearchService } from '../../data/services/search.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  providers: [SearchService],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})
export class DashboardComponent implements OnInit, AfterViewInit {
  constructor(
    private readonly destroyRef: DestroyRef,
    private readonly cdr: ChangeDetectorRef,
    private readonly authService: AuthService,
    private readonly router: Router,
    private readonly searchService: SearchService,
  ) {}

  private currentTabValue: 'campaigns' = 'campaigns';
  private showLogoutModalValue = false;
  private headerSearchValue = '';

  campaignsComponent: Type<unknown> | null = null;

  readonly currentTab = () => this.currentTabValue;
  readonly showLogoutModal = () => this.showLogoutModalValue;
  readonly headerSearch = () => this.headerSearchValue;

  ngOnInit(): void {
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login']);
      return;
    }

    void import('../campaign/campaigns.component').then((module) => {
      this.campaignsComponent = module.CampaignsComponent;
      this.cdr.markForCheck();
    });

    this.searchService.getSearch().pipe(takeUntilDestroyed(this.destroyRef)).subscribe((keyword) => {
      this.headerSearchValue = keyword ?? '';
    });
  }

  ngAfterViewInit(): void {
    this.selectTab('campaigns');
  }

  selectTab(tab: 'campaigns'): void {
    this.currentTabValue = tab;
  }

  goHome(): void {
    this.selectTab('campaigns');
  }

  openLogoutModal(): void {
    this.showLogoutModalValue = true;
  }

  closeLogoutModal(): void {
    this.showLogoutModalValue = false;
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  onHeaderSearch(keyword: string): void {
    this.headerSearchValue = keyword ?? '';
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
