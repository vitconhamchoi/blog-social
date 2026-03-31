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
3. SignalR realtime fanout end-to-end
4. Like/comment real data model and API
5. Feed polish and comment UX polish
6. Test/audit/reporting docs

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
