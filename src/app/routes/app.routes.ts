import { Routes } from '@angular/router';
import { LoginComponent } from '../layouts/login/login.component';
import { DashboardComponent } from '../layouts/dashboard/dashboard.component';
import { CampaignsComponent } from '../layouts/campaign/campaigns.component';
import { authGuard } from '../core/auth/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/login',
    pathMatch: 'full'
  },
  {
    path: 'login',
    component: LoginComponent
  },
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [authGuard]
  },
  {
    path: 'campaigns',
    component: CampaignsComponent,
    canActivate: [authGuard]
  },
  {
    path: '**',
    redirectTo: '/login'
  }
];
