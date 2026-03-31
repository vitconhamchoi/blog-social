import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { ApiService } from './api.service';
import { AppDbService } from './infrastructure/app-db.service';
import { feedLoad, feedLoadSuccess } from './state/app.state';

@Injectable({ providedIn: 'root' })
export class FeedStoreFacade {
  constructor(private store: Store, private api: ApiService, private db: AppDbService) {}

  async loadFeed() {
    this.store.dispatch(feedLoad());
    this.api.getFeed().subscribe(async posts => {
      this.store.dispatch(feedLoadSuccess({ posts }));
      await this.db.cachedFeedPosts.clear();
      await this.db.cachedFeedPosts.bulkPut(posts.map(p => ({ ...p, cachedAt: new Date().toISOString() })));
    });
  }

  async loadCachedFeed() {
    const posts = await this.db.cachedFeedPosts.orderBy('createdAt').reverse().toArray();
    this.store.dispatch(feedLoadSuccess({ posts }));
  }
}
