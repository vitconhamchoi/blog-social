import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../api.service';
import { Post } from '../models';

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <ng-container *ngIf="api.currentUser(); else guest">
      <div class="card column">
        <h2>Tạo trạng thái mới</h2>
        <textarea rows="4" [(ngModel)]="content" placeholder="Hôm nay bạn đang nghĩ gì?"></textarea>
        <input [(ngModel)]="imageUrl" placeholder="Dán URL ảnh (phase 1 demo)" />
        <button class="primary" (click)="createPost()">Đăng bài</button>
      </div>

      <div class="card" *ngFor="let post of posts">
        <div class="row" style="align-items:center; margin-bottom: 12px;">
          <img class="avatar" [src]="post.authorAvatarUrl || 'https://via.placeholder.com/96?text=U'" />
          <div>
            <div><a [routerLink]="['/u', post.authorId]">{{ post.authorName }}</a></div>
            <div class="muted">{{ post.createdAt | date:'short' }}</div>
          </div>
        </div>
        <div>{{ post.content }}</div>
        <img *ngFor="let img of post.imageUrls" class="post-img" [src]="img" />
      </div>
    </ng-container>

    <ng-template #guest>
      <div class="card">Mời đăng nhập để xem news feed.</div>
    </ng-template>
  `
})
export class FeedPageComponent implements OnInit {
  posts: Post[] = [];
  content = '';
  imageUrl = '';

  constructor(public api: ApiService) {}

  ngOnInit(): void {
    if (this.api.currentUser()) this.load();
  }

  load() {
    this.api.getFeed().subscribe(posts => this.posts = posts);
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
