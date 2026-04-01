import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { ApiService } from '../api.service';
import { CommentsPage, Post } from '../models';
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
              <div class="muted">{{ post.likeCount }} lượt thích</div>
              <div class="muted">{{ post.commentCount }} bình luận</div>
            </div>

            <div class="post-actions">
              <button class="post-action-btn" [class.active]="post.likedByMe" (click)="toggleLike(post.id)">👍 Thích</button>
              <button class="post-action-btn" (click)="toggleCommentBox(i, post.id)">💬 Bình luận</button>
            </div>

            <div class="comment-box" *ngIf="openCommentIndex === i">
              <div class="column" *ngIf="visibleComments[post.id]?.length">
                <div class="card" style="box-shadow:none; background:#f7f8fa; margin-bottom:0;" *ngFor="let comment of visibleComments[post.id]">
                  <div class="row" style="align-items:flex-start;">
                    <img class="avatar" [src]="comment.authorAvatarUrl || 'https://via.placeholder.com/96?text=U'" />
                    <div style="flex:1;">
                      <div class="post-author-name">{{ comment.authorName }}</div>
                      <div>{{ comment.content }}</div>
                      <div class="muted">{{ comment.createdAt | date:'short' }}</div>
                      <button class="post-action-btn" style="padding:0; min-height:auto;" (click)="toggleReplyBox(comment.id)">↩ Trả lời</button>

                      <div class="comment-box" *ngIf="openReplyForCommentId === comment.id">
                        <input [(ngModel)]="replyDrafts[comment.id]" placeholder="Viết phản hồi..." />
                        <div class="row" style="justify-content:flex-end;">
                          <button class="secondary" (click)="toggleReplyBox('')">Đóng</button>
                          <button class="primary" (click)="submitReply(post.id, comment.id)">Gửi reply</button>
                        </div>
                      </div>

                      <div class="column" *ngIf="comment.replies?.length" style="margin-top:8px; padding-left:12px; border-left:2px solid #e4e6eb;">
                        <div *ngFor="let reply of comment.replies">
                          <div class="post-author-name">{{ reply.authorName }}</div>
                          <div>{{ reply.content }}</div>
                          <div class="muted">{{ reply.createdAt | date:'short' }}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <button class="secondary" *ngIf="commentsHasMore[post.id]" (click)="loadMoreComments(post.id)">Xem thêm bình luận</button>

              <input [(ngModel)]="commentDrafts[post.id]" placeholder="Viết bình luận công khai với bạn bè..." />
              <div class="row" style="justify-content:flex-end;">
                <button class="secondary" (click)="toggleCommentBox(-1)">Đóng</button>
                <button class="primary" (click)="submitComment(post.id)">Gửi</button>
              </div>
            </div>
          </div>
        </section>

        <aside class="sidebar-sticky column">
          <div class="card">
            <div class="card-title">Gợi ý trải nghiệm</div>
            <div class="column muted">
              <div>• Feed đã có like/comment thật</div>
              <div>• Thread reply 1 cấp đã được thêm</div>
              <div>• Có nút xem thêm bình luận theo phân trang</div>
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
  commentDrafts: Record<string, string> = {};
  replyDrafts: Record<string, string> = {};
  openCommentIndex = -1;
  openReplyForCommentId = '';
  visibleComments: Record<string, CommentsPage['items']> = {};
  commentsSkip: Record<string, number> = {};
  commentsHasMore: Record<string, boolean> = {};

  constructor(
    public api: ApiService,
    private feedStore: FeedStoreFacade,
    private realtime: RealtimeService,
    private store: Store
  ) {
    this.store.select(feedFeature.selectPosts).subscribe(posts => {
      this.posts = posts;
    });
  }

  ngOnInit(): void {
    const me = this.api.currentUser();
    const token = this.api.token();
    if (me && token) {
      this.feedStore.loadCachedFeed();
      this.load();
      this.realtime.connect(token, {
        onFeedUpdated: () => this.load(),
        onPostEngagementUpdated: () => this.load()
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
      next: (res) => { this.uploadedImageUrl = res.url; this.uploading = false; },
      error: () => { this.uploading = false; alert('Upload ảnh thất bại'); }
    });
  }

  createPost() {
    const images = this.uploadedImageUrl ? [this.uploadedImageUrl] : [];
    this.api.createPost({ content: this.content, imageUrls: images }).subscribe({
      next: () => { this.content = ''; this.uploadedImageUrl = ''; this.load(); },
      error: () => alert('Đăng bài thất bại')
    });
  }

  toggleLike(postId: string) {
    this.api.toggleLike(postId).subscribe({ next: () => this.load(), error: () => alert('Thao tác like thất bại') });
  }

  toggleCommentBox(index: number, postId?: string) {
    this.openCommentIndex = this.openCommentIndex === index ? -1 : index;
    if (postId && this.openCommentIndex === index && !this.visibleComments[postId]) {
      this.commentsSkip[postId] = 0;
      this.loadComments(postId, true);
    }
  }

  loadComments(postId: string, reset = false) {
    const skip = reset ? 0 : (this.commentsSkip[postId] || 0);
    this.api.getComments(postId, skip, 5).subscribe({
      next: (page) => {
        this.visibleComments[postId] = reset ? page.items : [...(this.visibleComments[postId] || []), ...page.items];
        this.commentsSkip[postId] = skip + page.items.length;
        this.commentsHasMore[postId] = page.hasMore;
      }
    });
  }

  loadMoreComments(postId: string) {
    this.loadComments(postId, false);
  }

  submitComment(postId: string) {
    const content = (this.commentDrafts[postId] || '').trim();
    if (!content) return;
    this.api.addComment(postId, content).subscribe({
      next: () => { this.commentDrafts[postId] = ''; this.load(); this.loadComments(postId, true); },
      error: () => alert('Gửi bình luận thất bại')
    });
  }

  toggleReplyBox(commentId: string) {
    this.openReplyForCommentId = this.openReplyForCommentId === commentId ? '' : commentId;
  }

  submitReply(postId: string, parentCommentId: string) {
    const content = (this.replyDrafts[parentCommentId] || '').trim();
    if (!content) return;
    this.api.addComment(postId, content, parentCommentId).subscribe({
      next: () => {
        this.replyDrafts[parentCommentId] = '';
        this.openReplyForCommentId = '';
        this.load();
        this.loadComments(postId, true);
      },
      error: () => alert('Gửi reply thất bại')
    });
  }
}
