# JWT Phase 1 Report

## Implemented
### Backend
- Added JWT bearer authentication middleware
- Added `JwtTokenService`
- Register/login now return real JWT access token
- Protected API routes with `.RequireAuthorization()`
- SignalR hub now authenticates via JWT bearer token
- Hub group assignment now uses user id from claims instead of query `userId`

### Frontend
- SignalR client now passes bearer token via `accessTokenFactory`
- Feed/Friends realtime wiring updated to use token instead of plain userId

## Security improvement over previous phase
Previous phase used transitional bearer token = raw user id string.
This phase now issues signed JWT access tokens.

## Still not finished
- No refresh token yet
- No token rotation yet
- No logout/revoke session store yet
- Token lifetime currently simple fixed expiration
