import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../api.service';
import { Post } from '../models';
import { FeedStoreFacade } from '../feed.store';
import { RealtimeService } from '../realtime.service';
import { Store } from '@ngrx/store';
import { feedFeature } from '../state/app.state';

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <ng-container *ngIf="api.currentUser() as me; else guest">
      <div class="layout-3col">
        <aside class="sidebar-sticky column">
          <div class="card">
            <div class="row" style="align-items:center;">
              <img class="avatar-lg" [src]="me.avatarUrl || 'https://via.placeholder.com/160?text=U'" />
              <div>
                <div class="card-title" style="margin-bottom:4px;">{{ me.fullName }}</div>
                <div class="muted">{{ me.email }}</div>
                <a [routerLink]="['/u', me.id]">Xem trang cá nhân</a>
              </div>
            </div>
          </div>

          <div class="card">
            <div class="card-title">Lối tắt</div>
            <div class="column muted">
              <a routerLink="/">Bảng tin</a>
              <a routerLink="/friends">Bạn bè</a>
              <a [routerLink]="['/u', me.id]">Hồ sơ của tôi</a>
            </div>
          </div>
        </aside>

        <section>
          <div class="card">
            <div class="composer-top">
              <img class="avatar" [src]="me.avatarUrl || 'https://via.placeholder.com/96?text=U'" />
              <div class="column" style="flex:1;">
                <textarea class="composer-input" rows="4" [(ngModel)]="content" placeholder="Bạn đang nghĩ gì?"></textarea>
                <input [(ngModel)]="imageUrl" placeholder="Dán URL ảnh cho bài viết (demo phase 1)" />
                <div class="row-between">
                  <span class="muted">Bài viết của bạn chỉ bạn bè mới xem được.</span>
                  <button class="primary" (click)="createPost()">Đăng</button>
                </div>
              </div>
            </div>
          </div>

          <div class="card post-card" *ngFor="let post of posts">
            <div class="post-header">
              <div class="post-author">
                <img class="avatar" [src]="post.authorAvatarUrl || 'https://via.placeholder.com/96?text=U'" />
                <div>
                  <div class="post-author-name">
                    <a [routerLink]="['/u', post.authorId]">{{ post.authorName }}</a>
                  </div>
                  <div class="muted">{{ post.createdAt | date:'short' }} · Bạn bè</div>
                </div>
              </div>
              <div class="pill">Bài viết</div>
            </div>

            <div class="post-content">{{ post.content }}</div>
            <img *ngFor="let img of post.imageUrls" class="post-img" [src]="img" />
          </div>

          <div *ngIf="!posts.length" class="card empty-state">
            Chưa có bài viết nào trong feed. Kết bạn rồi đăng thử một bài xem.
          </div>
        </section>

        <aside class="sidebar-sticky column">
          <div class="card">
            <div class="card-title">Gợi ý trải nghiệm</div>
            <div class="column muted">
              <div>• Tạo 2 tài khoản để test kết bạn</div>
              <div>• Đồng ý lời mời rồi đăng bài</div>
              <div>• Vào profile nhau để kiểm tra quyền xem bài</div>
            </div>
          </div>
        </aside>
      </div>
    </ng-container>

    <ng-template #guest>
      <div class="layout-3col">
        <div></div>
        <div class="card empty-state">
          <h2 style="margin-top:0;">Chào mừng đến Blog Social</h2>
          <p>Đăng nhập để xem bảng tin, kết bạn và chia sẻ trạng thái cá nhân.</p>
          <div class="row" style="justify-content:center;">
            <a routerLink="/login"><button class="primary">Đăng nhập</button></a>
            <a routerLink="/register"><button class="secondary">Đăng ký</button></a>
          </div>
        </div>
        <div></div>
      </div>
    </ng-template>
  `
})
export class FeedPageComponent implements OnInit {
  posts: Post[] = [];
  content = '';
  imageUrl = '';

  constructor(
    public api: ApiService,
    private feedStore: FeedStoreFacade,
    private realtime: RealtimeService,
    private store: Store
  ) {
    this.store.select(feedFeature.selectPosts).subscribe(posts => this.posts = posts);
  }

  ngOnInit(): void {
    if (this.api.currentUser()) {
      this.feedStore.loadCachedFeed();
      this.load();
      this.realtime.connect(() => this.load());
    }
  }

  load() {
    this.feedStore.loadFeed();
  }

  createPost() {
    const images = this.imageUrl.trim() ? [this.imageUrl.trim()] : [];
    this.api.createPost({ content: this.content, imageUrls: images }).subscribe({
      next: () => {
        this.content = '';
        this.imageUrl = '';
        this.load();
      },
      error: () => alert('Đăng bài thất bại')
    });
  }
}
