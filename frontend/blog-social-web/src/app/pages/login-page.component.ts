import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ApiService } from '../api.service';

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="card column">
      <h2>Đăng nhập</h2>
      <input [(ngModel)]="email" placeholder="Email" />
      <input [(ngModel)]="password" type="password" placeholder="Mật khẩu" />
      <button class="primary" (click)="submit()">Đăng nhập</button>
      <p class="muted">Chưa có tài khoản? <a routerLink="/register">Đăng ký</a></p>
    </div>
  `
})
export class LoginPageComponent {
  email = '';
  password = '';
  constructor(private api: ApiService, private router: Router) {}
  submit() {
    this.api.login({ email: this.email, password: this.password }).subscribe({
      next: (res) => { this.api.setAuth(res); this.router.navigateByUrl('/'); },
      error: () => alert('Đăng nhập thất bại')
    });
  }
}
