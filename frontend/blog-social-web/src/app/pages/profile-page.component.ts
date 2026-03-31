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
    <div *ngIf="profile as p">
      <div class="card profile-hero">
        <div class="profile-cover"></div>
        <div class="profile-body">
          <div class="profile-head">
            <img class="avatar-lg" [src]="p.user.avatarUrl || 'https://via.placeholder.com/160?text=U'" />
            <div>
              <h1 style="margin:0 0 6px;">{{ p.user.fullName }}</h1>
              <div class="muted">{{ p.user.email }}</div>
              <div style="margin-top:8px;">{{ p.user.bio || 'Chưa có giới thiệu.' }}</div>
            </div>
          </div>

          <div class="row" *ngIf="!isMe()">
            <span class="pill" *ngIf="p.areFriends">Đã là bạn bè</span>
            <span class="pill" *ngIf="!p.areFriends">Chưa là bạn bè</span>
          </div>
        </div>
      </div>

      <div class="layout-3col">
        <aside class="column sidebar-sticky">
          <div class="card">
            <div class="card-title">Giới thiệu</div>
            <div>{{ p.user.bio || 'Người này chưa cập nhật giới thiệu.' }}</div>
          </div>
        </aside>

        <section>
          <div *ngIf="isMe()" class="card column">
            <div class="card-title">Chỉnh sửa hồ sơ</div>
            <input [(ngModel)]="fullName" placeholder="Họ tên" />
            <textarea [(ngModel)]="bio" placeholder="Giới thiệu"></textarea>
            <input [(ngModel)]="avatarUrl" placeholder="Avatar URL" />
            <div class="row">
              <button class="primary" (click)="saveProfile()">Lưu hồ sơ</button>
              <button class="secondary" (click)="saveAvatar()">Lưu avatar</button>
            </div>
          </div>

          <div *ngIf="profile && !profile.areFriends && !isMe()" class="card empty-state">
            Bạn chưa là bạn bè với người này nên chưa xem được bài đăng của họ.
          </div>

          <div class="card post-card" *ngFor="let post of profile?.posts">
            <div class="post-header">
              <div class="post-author">
                <img class="avatar" [src]="post.authorAvatarUrl || 'https://via.placeholder.com/96?text=U'" />
                <div>
                  <div class="post-author-name">{{ post.authorName }}</div>
                  <div class="muted">{{ post.createdAt | date:'short' }}</div>
                </div>
              </div>
            </div>
            <div class="post-content">{{ post.content }}</div>
            <img *ngFor="let img of post.imageUrls" class="post-img" [src]="img" />
          </div>
        </section>

        <aside class="column sidebar-sticky">
          <div class="card">
            <div class="card-title">Thông tin</div>
            <div class="column muted">
              <div>Tham gia: {{ p.user.createdAt | date:'mediumDate' }}</div>
              <div>Quyền xem bài: {{ isMe() || p.areFriends ? 'Được phép' : 'Bạn bè mới xem được' }}</div>
            </div>
          </div>
        </aside>
      </div>
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
