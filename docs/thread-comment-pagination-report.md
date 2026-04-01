# Thread Comment + Pagination Report

## Implemented
### Backend
- `PostCommentEntity` now supports `ParentCommentId`
- Added 1-level threaded replies
- Added endpoint:
  - `GET /api/posts/{postId}/comments?skip=0&take=5`
- Feed preview still returns a small root-comment preview
- Full comment loading per post now uses paginated API

### Frontend
- Comment panel loads paginated comments when opening a post comment section
- Added `Xem thêm bình luận`
- Added reply flow per root comment
- Replies render nested under parent comment

## Scope choice
This phase supports:
- root comments
- single-level replies
- incremental comment loading

It does not yet support:
- infinite-depth threading
- comment edit/delete
- comment reactions
- highly optimized partial refresh for large engagement storms
