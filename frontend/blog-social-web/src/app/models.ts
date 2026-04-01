export interface User {
  id: string;
  email: string;
  fullName: string;
  bio: string;
  avatarUrl?: string | null;
  createdAt: string;
}

export interface AuthResponse {
  accessToken: string;
  user: User;
}

export interface PostCommentReply {
  id: string;
  postId: string;
  parentCommentId?: string | null;
  authorId: string;
  authorName: string;
  authorAvatarUrl?: string | null;
  content: string;
  createdAt: string;
}

export interface PostComment {
  id: string;
  postId: string;
  parentCommentId?: string | null;
  authorId: string;
  authorName: string;
  authorAvatarUrl?: string | null;
  content: string;
  createdAt: string;
  replies: PostCommentReply[];
}

export interface CommentsPage {
  items: PostComment[];
  totalCount: number;
  hasMore: boolean;
  skip: number;
  take: number;
}

export interface Post {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatarUrl?: string | null;
  content: string;
  imageUrls: string[];
  createdAt: string;
  likeCount: number;
  likedByMe: boolean;
  comments: PostComment[];
  commentCount: number;
}

export interface Friendship {
  id: string;
  requesterId: string;
  addresseeId: string;
  status: string;
  createdAt: string;
  respondedAt?: string | null;
}

export interface UserListItem extends User {
  relationshipStatus: string;
}

export interface ProfileDetails {
  user: User;
  areFriends: boolean;
  posts: Post[];
}

export interface UploadResponse {
  url: string;
  fileName: string;
}
