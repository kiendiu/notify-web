import { Routes } from '@angular/router';
import { LoginComponent } from '../layouts/login/login.component';
import { DashboardComponent } from '../layouts/dashboard/dashboard.component';
import { CampaignComponent } from '../layouts/campaign/campaign.component';
import { authGuard } from '../services/auth.guard';

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
    component: CampaignComponent,
    canActivate: [authGuard]
  },
  {
    path: '**',
    redirectTo: '/login'
  }
];
