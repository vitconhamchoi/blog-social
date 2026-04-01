import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { ApiService } from '../api.service';
import { Post } from '../models';
import { FeedStoreFacade } from '../feed.store';
import { RealtimeService } from '../realtime.service';
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
                <input type="file" accept="image/*" (change)="onFileSelected($event)" />
                <div *ngIf="uploading" class="muted">Đang upload ảnh...</div>
                <img *ngIf="uploadedImageUrl" [src]="uploadedImageUrl" class="post-img" style="max-height:240px; border-radius:12px;" />
                <div class="row-between">
                  <span class="muted">Bài viết của bạn chỉ bạn bè mới xem được.</span>
                  <button class="primary" (click)="createPost()">Đăng</button>
                </div>
              </div>
            </div>
          </div>

          <div class="card post-card" *ngFor="let post of posts; let i = index">
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

            <div class="post-social-summary">
              <div class="muted">{{ likeCounts[i] }} lượt thích</div>
              <div class="muted">{{ commentDrafts[i] ? 1 : 0 }} bình luận xem trước</div>
            </div>

            <div class="post-actions">
              <button class="post-action-btn" [class.active]="liked[i]" (click)="toggleLike(i)">👍 Thích</button>
              <button class="post-action-btn" (click)="toggleCommentBox(i)">💬 Bình luận</button>
            </div>

            <div class="comment-box" *ngIf="openCommentIndex === i">
              <input [(ngModel)]="commentDrafts[i]" placeholder="Viết bình luận công khai với bạn bè..." />
              <div class="row" style="justify-content:flex-end;">
                <button class="secondary" (click)="toggleCommentBox(-1)">Đóng</button>
                <button class="primary">Gửi</button>
              </div>
            </div>
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
              <div>• Feed đã có realtime phase 1</div>
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
  uploadedImageUrl = '';
  uploading = false;
  liked: Record<number, boolean> = {};
  likeCounts: Record<number, number> = {};
  commentDrafts: Record<number, string> = {};
  openCommentIndex = -1;

  constructor(
    public api: ApiService,
    private feedStore: FeedStoreFacade,
    private realtime: RealtimeService,
    private store: Store
  ) {
    this.store.select(feedFeature.selectPosts).subscribe(posts => {
      this.posts = posts;
      posts.forEach((_, i) => {
        if (this.likeCounts[i] == null) this.likeCounts[i] = Math.floor(Math.random() * 20);
      });
    });
  }

  ngOnInit(): void {
    const me = this.api.currentUser();
    if (me) {
      this.feedStore.loadCachedFeed();
      this.load();
      this.realtime.connect(me.id, {
        onFeedUpdated: () => this.load()
      });
    }
  }

  load() {
    this.feedStore.loadFeed();
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.uploading = true;
    this.api.uploadImage(file).subscribe({
      next: (res) => {
        this.uploadedImageUrl = res.url;
        this.uploading = false;
      },
      error: () => {
        this.uploading = false;
        alert('Upload ảnh thất bại');
      }
    });
  }

  createPost() {
    const images = this.uploadedImageUrl ? [this.uploadedImageUrl] : [];
    this.api.createPost({ content: this.content, imageUrls: images }).subscribe({
      next: () => {
        this.content = '';
        this.uploadedImageUrl = '';
        this.load();
      },
      error: () => alert('Đăng bài thất bại')
    });
  }

  toggleLike(index: number) {
    this.liked[index] = !this.liked[index];
    this.likeCounts[index] = (this.likeCounts[index] || 0) + (this.liked[index] ? 1 : -1);
  }

  toggleCommentBox(index: number) {
    this.openCommentIndex = this.openCommentIndex === index ? -1 : index;
  }
}
