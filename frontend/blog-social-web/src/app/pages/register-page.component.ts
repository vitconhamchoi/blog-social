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
      <h2>Đăng ký</h2>
      <input [(ngModel)]="fullName" placeholder="Họ tên" />
      <input [(ngModel)]="email" placeholder="Email" />
      <input [(ngModel)]="password" type="password" placeholder="Mật khẩu" />
      <button class="primary" (click)="submit()">Tạo tài khoản</button>
      <p class="muted">Đã có tài khoản? <a routerLink="/login">Đăng nhập</a></p>
    </div>
  `
})
export class RegisterPageComponent {
  fullName = '';
  email = '';
  password = '';
  constructor(private api: ApiService, private router: Router) {}
  submit() {
    this.api.register({ email: this.email, password: this.password, fullName: this.fullName }).subscribe({
      next: (res) => { this.api.setAuth(res); this.router.navigateByUrl('/'); },
      error: () => alert('Đăng ký thất bại')
    });
  }
}
