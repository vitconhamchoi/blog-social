import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../api.service';
import { Friendship, User, UserListItem } from '../models';

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="card column">
      <h2>Tìm người dùng</h2>
      <input [(ngModel)]="query" placeholder="Nhập tên hoặc email" />
      <button class="primary" (click)="search()">Tìm</button>
      <div *ngFor="let user of users" class="row" style="justify-content:space-between; align-items:center; padding:8px 0; border-top:1px solid #eee;">
        <div>
          <a [routerLink]="['/u', user.id]">{{ user.fullName }}</a>
          <div class="muted">{{ user.email }} · {{ user.relationshipStatus }}</div>
        </div>
        <button class="secondary" *ngIf="user.relationshipStatus === 'none'" (click)="sendRequest(user.id)">Kết bạn</button>
      </div>
    </div>

    <div class="card column">
      <h2>Lời mời kết bạn đến</h2>
      <div *ngFor="let req of incoming" class="row" style="justify-content:space-between; align-items:center;">
        <div>{{ req.requesterId }}</div>
        <div class="row">
          <button class="primary" (click)="accept(req.id)">Đồng ý</button>
          <button class="secondary" (click)="reject(req.id)">Từ chối</button>
        </div>
      </div>
    </div>

    <div class="card column">
      <h2>Bạn bè</h2>
      <div *ngFor="let friend of friends">
        <a [routerLink]="['/u', friend.id]">{{ friend.fullName }}</a>
      </div>
    </div>
  `
})
export class FriendsPageComponent implements OnInit {
  query = '';
  users: UserListItem[] = [];
  incoming: Friendship[] = [];
  friends: User[] = [];

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.search();
    this.loadIncoming();
    this.loadFriends();
  }

  search() { this.api.searchUsers(this.query).subscribe(x => this.users = x); }
  loadIncoming() { this.api.incomingRequests().subscribe(x => this.incoming = x); }
  loadFriends() { this.api.getFriends().subscribe(x => this.friends = x); }
  sendRequest(id: string) { this.api.sendFriendRequest(id).subscribe({ next: () => this.search(), error: () => alert('Gửi lời mời thất bại') }); }
  accept(id: string) { this.api.acceptRequest(id).subscribe(() => { this.loadIncoming(); this.loadFriends(); this.search(); }); }
  reject(id: string) { this.api.rejectRequest(id).subscribe(() => this.loadIncoming()); }
}
