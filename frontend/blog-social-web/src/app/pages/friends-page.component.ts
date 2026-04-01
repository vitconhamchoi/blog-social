import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../api.service';
import { Friendship, User, UserListItem } from '../models';
import { RealtimeService } from '../realtime.service';

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="layout-3col">
      <aside class="column sidebar-sticky">
        <div class="card">
          <div class="card-title">Bộ lọc</div>
          <input [(ngModel)]="query" placeholder="Tìm theo tên hoặc email" />
          <button class="primary" (click)="search()">Tìm kiếm</button>
        </div>
      </aside>

      <section class="column">
        <div class="card">
          <div class="card-title">Khám phá mọi người</div>
          <div *ngFor="let user of users" class="list-item">
            <div class="row" style="align-items:center;">
              <img class="avatar" [src]="user.avatarUrl || 'https://via.placeholder.com/96?text=U'" />
              <div>
                <a [routerLink]="['/u', user.id]" class="post-author-name">{{ user.fullName }}</a>
                <div class="muted">{{ user.email }}</div>
                <div class="muted">{{ user.relationshipStatus }}</div>
              </div>
            </div>
            <button class="secondary" *ngIf="user.relationshipStatus === 'none'" (click)="sendRequest(user.id)">Kết bạn</button>
          </div>
        </div>

        <div class="card">
          <div class="card-title">Lời mời kết bạn đến</div>
          <div *ngIf="!incoming.length" class="empty-state">Hiện chưa có lời mời nào.</div>
          <div *ngFor="let req of incoming" class="list-item">
            <div>
              <div class="post-author-name">Request ID: {{ req.id }}</div>
              <div class="muted">Từ user: {{ req.requesterId }}</div>
            </div>
            <div class="row">
              <button class="primary" (click)="accept(req.id)">Đồng ý</button>
              <button class="secondary" (click)="reject(req.id)">Từ chối</button>
            </div>
          </div>
        </div>
      </section>

      <aside class="column sidebar-sticky">
        <div class="card">
          <div class="card-title">Bạn bè</div>
          <div *ngIf="!friends.length" class="empty-state">Chưa có bạn bè nào.</div>
          <div *ngFor="let friend of friends" class="list-item">
            <div class="row" style="align-items:center;">
              <img class="avatar" [src]="friend.avatarUrl || 'https://via.placeholder.com/96?text=U'" />
              <div>
                <a [routerLink]="['/u', friend.id]" class="post-author-name">{{ friend.fullName }}</a>
                <div class="muted">{{ friend.email }}</div>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </div>
  `
})
export class FriendsPageComponent implements OnInit {
  query = '';
  users: UserListItem[] = [];
  incoming: Friendship[] = [];
  friends: User[] = [];

  constructor(private api: ApiService, private realtime: RealtimeService) {}

  ngOnInit(): void {
    this.search();
    this.loadIncoming();
    this.loadFriends();

    const userId = this.api.currentUser()?.id;
    if (userId) {
      this.realtime.connect(userId, {
        onFriendRequestReceived: () => this.loadIncoming(),
        onFriendRequestAccepted: () => { this.loadFriends(); this.search(); },
        onFriendsUpdated: () => { this.loadFriends(); this.search(); }
      });
    }
  }

  search() { this.api.searchUsers(this.query).subscribe(x => this.users = x); }
  loadIncoming() { this.api.incomingRequests().subscribe(x => this.incoming = x); }
  loadFriends() { this.api.getFriends().subscribe(x => this.friends = x); }
  sendRequest(id: string) { this.api.sendFriendRequest(id).subscribe({ next: () => this.search(), error: () => alert('Gửi lời mời thất bại') }); }
  accept(id: string) { this.api.acceptRequest(id).subscribe(() => { this.loadIncoming(); this.loadFriends(); this.search(); }); }
  reject(id: string) { this.api.rejectRequest(id).subscribe(() => this.loadIncoming()); }
}
