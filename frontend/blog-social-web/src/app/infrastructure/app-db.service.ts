import Dexie, { Table } from 'dexie';
import { Injectable } from '@angular/core';
import { Post } from '../models';

export interface CachedFeedPost extends Post {
  cachedAt: string;
}

@Injectable({ providedIn: 'root' })
export class AppDbService extends Dexie {
  cachedFeedPosts!: Table<CachedFeedPost, string>;

  constructor() {
    super('blogSocialDb');
    this.version(1).stores({
      cachedFeedPosts: 'id, authorId, createdAt, cachedAt'
    });
  }
}
