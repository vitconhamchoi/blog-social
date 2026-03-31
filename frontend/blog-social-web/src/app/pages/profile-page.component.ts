import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { ApiService } from '../api.service';
import { ProfileDetails } from '../models';

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="card column" *ngIf="profile as p">
      <div class="row" style="align-items:center;">
        <img class="avatar" [src]="p.user.avatarUrl || 'https://via.placeholder.com/96?text=U'" />
        <div>
          <h2>{{ p.user.fullName }}</h2>
          <div class="muted">{{ p.user.email }}</div>
          <div>{{ p.user.bio }}</div>
        </div>
      </div>

      <div *ngIf="isMe()" class="column">
        <h3>Chỉnh sửa hồ sơ</h3>
        <input [(ngModel)]="fullName" placeholder="Họ tên" />
        <textarea [(ngModel)]="bio" placeholder="Giới thiệu"></textarea>
        <input [(ngModel)]="avatarUrl" placeholder="Avatar URL" />
        <div class="row">
          <button class="primary" (click)="saveProfile()">Lưu hồ sơ</button>
          <button class="secondary" (click)="saveAvatar()">Lưu avatar</button>
        </div>
      </div>
    </div>

    <div *ngIf="profile && !profile.areFriends && !isMe()" class="card">
      Bạn chưa là bạn bè với người này nên không xem được bài đăng của họ.
    </div>

    <div class="card" *ngFor="let post of profile?.posts">
      <div>{{ post.content }}</div>
      <img *ngFor="let img of post.imageUrls" class="post-img" [src]="img" />
      <div class="muted" style="margin-top:8px;">{{ post.createdAt | date:'short' }}</div>
    </div>
  `
})
export class ProfilePageComponent implements OnInit {
  profile?: ProfileDetails;
  fullName = '';
  bio = '';
  avatarUrl = '';

  constructor(private route: ActivatedRoute, public api: ApiService) {}

  ngOnInit(): void { this.load(); }

  isMe() {
    return this.profile?.user.id === this.api.currentUser()?.id;
  }

  load() {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.api.getProfile(id).subscribe({
      next: (p) => {
        this.profile = p;
        this.fullName = p.user.fullName;
        this.bio = p.user.bio;
        this.avatarUrl = p.user.avatarUrl || '';
      },
      error: () => alert('Không tải được profile')
    });
  }

  saveProfile() {
    this.api.updateProfile({ fullName: this.fullName, bio: this.bio }).subscribe(() => this.load());
  }

  saveAvatar() {
    this.api.updateAvatar({ avatarUrl: this.avatarUrl }).subscribe(() => this.load());
  }
}
