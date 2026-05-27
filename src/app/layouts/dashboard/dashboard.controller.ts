import { DestroyRef, Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AuthService } from '../../data/services/auth.service';
import { SearchService } from '../../data/services/search.service';

@Injectable()
export class DashboardController {
	private currentTabValue: 'campaigns' = 'campaigns';
	private showLogoutModalValue = false;
	private headerSearchValue = '';

	private readonly authService = inject(AuthService);
	private readonly router = inject(Router);
	private readonly searchService = inject(SearchService);

	readonly currentTab = () => this.currentTabValue;
	readonly showLogoutModal = () => this.showLogoutModalValue;
	readonly headerSearch = () => this.headerSearchValue;

	init(destroyRef: DestroyRef): void {
		if (!this.authService.isAuthenticated()) {
			this.router.navigate(['/login']);
			return;
		}

		this.searchService.getSearch().pipe(takeUntilDestroyed(destroyRef)).subscribe((keyword) => {
			this.headerSearchValue = keyword ?? '';
		});
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
}