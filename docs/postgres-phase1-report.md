# PostgreSQL Phase 1 Report

## What was added
- EF Core DbContext (`AppDbContext`)
- PostgreSQL provider via `Npgsql.EntityFrameworkCore.PostgreSQL`
- Entities:
  - `UserEntity`
  - `FriendshipEntity`
  - `PostEntity`
- Refactor of API handlers to use DbContext instead of in-memory dictionaries
- `EnsureCreated()` boot path for quick schema creation
- Password hashing switched to BCrypt package

## Important note
This phase is code-complete enough to build, but runtime verification depends on a live PostgreSQL instance.

## Current blocker for full runtime verification on this machine
Docker daemon was not available at the time of implementation:
- `Cannot connect to the Docker daemon ... Is the docker daemon running?`

## What should happen once Postgres is available
1. Start Docker Desktop or local PostgreSQL
2. `docker compose up -d postgres`
3. `dotnet run` in backend
4. App auto-creates schema on startup
5. Frontend should keep working against the same API surface

## Security status
- Token is still transitional (userId string as bearer token)
- Real JWT wiring is still the next backend step

## Next backend step
- Replace transitional bearer token with real JWT
- Add likes/comments tables and endpoints
- Add migrations instead of only `EnsureCreated()`
