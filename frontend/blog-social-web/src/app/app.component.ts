import { Component, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { ApiService } from './api.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  user = computed(() => this.api.currentUser());

  constructor(public api: ApiService, private router: Router) {}

  logout() {
    this.api.logout();
    this.router.navigateByUrl('/login');
  }
}
