import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthResponse, CommentsPage, Friendship, Post, ProfileDetails, UploadResponse, User, UserListItem } from './models';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private baseUrl = '';
  token = signal<string | null>(localStorage.getItem('token'));
  currentUser = signal<User | null>(JSON.parse(localStorage.getItem('user') || 'null'));

  constructor(private http: HttpClient) {}

  private authHeaders(): { headers?: HttpHeaders } {
    const token = this.token();
    return token ? { headers: new HttpHeaders({ Authorization: `Bearer ${token}` }) } : {};
  }

  setAuth(auth: AuthResponse) {
    this.token.set(auth.accessToken);
    this.currentUser.set(auth.user);
    localStorage.setItem('token', auth.accessToken);
    localStorage.setItem('user', JSON.stringify(auth.user));
  }

  logout() {
    this.token.set(null);
    this.currentUser.set(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }

  register(payload: { email: string; password: string; fullName: string }) {
    return this.http.post<AuthResponse>(`${this.baseUrl}/api/auth/register`, payload);
  }

  login(payload: { email: string; password: string }) {
    return this.http.post<AuthResponse>(`${this.baseUrl}/api/auth/login`, payload);
  }

  me(): Observable<User> {
    return this.http.get<User>(`${this.baseUrl}/api/auth/me`, this.authHeaders());
  }

  updateProfile(payload: { fullName?: string; bio?: string }) {
    return this.http.patch<User>(`${this.baseUrl}/api/users/me`, payload, this.authHeaders());
  }

  updateAvatar(payload: { avatarUrl: string }) {
    return this.http.post<User>(`${this.baseUrl}/api/users/me/avatar`, payload, this.authHeaders());
  }

  uploadImage(file: File) {
    const form = new FormData();
    form.append('file', file);
    return this.http.post<UploadResponse>(`${this.baseUrl}/api/uploads/image`, form, this.authHeaders());
  }

  getFeed() {
    return this.http.get<Post[]>(`${this.baseUrl}/api/posts/feed`, this.authHeaders());
  }

  createPost(payload: { content: string; imageUrls: string[] }) {
    return this.http.post<Post>(`${this.baseUrl}/api/posts`, payload, this.authHeaders());
  }

  toggleLike(postId: string) {
    return this.http.post<Post>(`${this.baseUrl}/api/posts/${postId}/likes/toggle`, {}, this.authHeaders());
  }

  addComment(postId: string, content: string, parentCommentId?: string | null) {
    return this.http.post<Post>(`${this.baseUrl}/api/posts/${postId}/comments`, { content, parentCommentId }, this.authHeaders());
  }

  getComments(postId: string, skip = 0, take = 5) {
    return this.http.get<CommentsPage>(`${this.baseUrl}/api/posts/${postId}/comments?skip=${skip}&take=${take}`, this.authHeaders());
  }

  searchUsers(q = '') {
    return this.http.get<UserListItem[]>(`${this.baseUrl}/api/users?q=${encodeURIComponent(q)}`, this.authHeaders());
  }

  sendFriendRequest(targetUserId: string) {
    return this.http.post<Friendship>(`${this.baseUrl}/api/friend-requests/${targetUserId}`, {}, this.authHeaders());
  }

  incomingRequests() {
    return this.http.get<Friendship[]>(`${this.baseUrl}/api/friend-requests/incoming`, this.authHeaders());
  }

  acceptRequest(requestId: string) {
    return this.http.post<Friendship>(`${this.baseUrl}/api/friend-requests/${requestId}/accept`, {}, this.authHeaders());
  }

  rejectRequest(requestId: string) {
    return this.http.post<Friendship>(`${this.baseUrl}/api/friend-requests/${requestId}/reject`, {}, this.authHeaders());
  }

  getFriends() {
    return this.http.get<User[]>(`${this.baseUrl}/api/friends`, this.authHeaders());
  }

  getProfile(userId: string) {
    return this.http.get<ProfileDetails>(`${this.baseUrl}/api/users/${userId}`, this.authHeaders());
  }
}
