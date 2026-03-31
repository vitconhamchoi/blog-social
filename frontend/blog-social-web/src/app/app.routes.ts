import { Routes } from '@angular/router';
import { FeedPageComponent } from './pages/feed-page.component';
import { LoginPageComponent } from './pages/login-page.component';
import { RegisterPageComponent } from './pages/register-page.component';
import { FriendsPageComponent } from './pages/friends-page.component';
import { ProfilePageComponent } from './pages/profile-page.component';

export const routes: Routes = [
  { path: 'login', component: LoginPageComponent },
  { path: 'register', component: RegisterPageComponent },
  { path: 'friends', component: FriendsPageComponent },
  { path: 'u/:id', component: ProfilePageComponent },
  { path: '', component: FeedPageComponent },
];
