# Progress Log

## 2026-03-31 23:27 ICT

### Done
- Researched architecture from todolist-backend and todolist-frontend
- Created social-blog monorepo scaffold
- Pushed repo to GitHub
- Implemented runnable backend/frontend phase-1 skeleton
- Redesigned social feed UI to a more polished social-style layout
- Added UI/UX design report: `docs/ui-ux-design-report.md`
- Added frontend foundations:
  - NgRx store foundation
  - Dexie local cache foundation
  - SignalR client foundation
- Added Docker Compose for PostgreSQL
- Added Like/Comment UI in feed

### In progress
1. Backend migration to PostgreSQL + EF Core runtime
2. Real JWT auth wiring
3. Like/comment real data model and API
4. Feed polish and comment UX polish
5. Test/audit/reporting docs

### Newly completed
- Realtime phase-1 wired with SignalR on .NET 8 + Angular 17
- Feed auto-refresh event when a friend creates a post
- Friend request received event
- Friend request accepted event
- Friends list refresh event
- Frontend SignalR client now joins user-specific realtime channel using userId
- Backend PostgreSQL phase-1 integration coded with EF Core DbContext/entities
- API routes refactored from in-memory store to DbContext-backed queries/writes
- Database schema auto-create path added with `EnsureCreated()`

### Current reality
- Frontend is visually improved and runnable
- Backend is runnable but not yet production-grade
- Realtime is not fully wired yet
- Like/comment UI exists but data is not real yet
- PostgreSQL direction is prepared, not completed

### Next milestones
- M1: Postgres entities + DbContext + migrations path
- M2: JWT auth + protected SignalR groups
- M3: PostLike + Comment APIs + UI binding
- M4: realtime feed/request updates
- M5: test/audit reports
