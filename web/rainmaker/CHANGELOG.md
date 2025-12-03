# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Changed - Session-Based Authentication Migration

**Date:** 2025-12-03

#### Overview
Migrated from token-based authentication (storing access tokens in localStorage) to session-based authentication (using HttpOnly cookies managed by the server). This change improves security by:
- Removing token storage from client-side localStorage
- Using HttpOnly cookies that are not accessible via JavaScript
- Passing session ID in request headers instead of request body

#### Breaking Changes

1. **Token Storage Removed**
   - `setAccessToken()` and `setRefreshToken()` are now no-op functions (they log warnings)
   - Tokens are no longer stored in localStorage
   - Session is managed via HttpOnly cookies set by the server

2. **API Request Format Changed**
   - `authToken` field removed from `RequestInfo` object in request body
   - Session ID now passed in `Session-Id` HTTP header
   - All axios instances configured with `withCredentials: true` for cookie support

3. **Redux State Changes**
   - `token` field removed from auth reducer state
   - Authentication state now relies on `hasValidSession()` instead of checking for access token

#### Files Modified

**Core Authentication Utilities:**
- `dev-packages/egov-ui-kit-dev/src/utils/localStorageUtils/index.js`
  - Added `getSessionId()` - reads session from cookies
  - Added `hasValidSession()` - checks for valid session
  - Modified `getAccessToken()` - now returns session ID for backward compatibility
  - Modified `setAccessToken()` and `setRefreshToken()` - now no-op with warnings
  - Modified `clearUserDetails()` - now also clears session cookies

**API Request Wrappers:**
- `dev-packages/egov-ui-kit-dev/src/utils/api.js`
  - Added `getSessionHeaders()` helper
  - Added axios request interceptor to inject Session-Id header
  - Modified `wrapRequestBody()` - removed authToken from RequestInfo
  - Modified `loginRequest()` - added `withCredentials: true`
  - Modified `uploadFile()` - added session headers and credentials
  - Modified `commonApiPost()` - removed authToken handling
  - Changed error type from `INVALID_TOKEN` to `SESSION_EXPIRED`

- `packages/citizen/src/ui-utils/api.js`
  - Added session header management
  - Removed authToken from RequestInfo

- `dev-packages/egov-ui-framework-core/src/ui-utils/api.js`
  - Added session header management
  - Removed authToken from RequestInfo

**Redux Auth Module:**
- `dev-packages/egov-ui-kit-dev/src/redux/auth/actions.js`
  - Modified `authenticated()` - no longer stores tokens
  - Modified `refreshTokenRequest()` - now triggers logout (deprecated)
  - Modified `logout()` - simplified to clear session and redirect

- `dev-packages/egov-ui-kit-dev/src/redux/auth/reducer.js`
  - Removed `token` from initial state and action handlers
  - Now uses `hasValidSession()` for initial auth check

- `dev-packages/egov-ui-kit-dev/src/redux/auth/middleware.js`
  - Removed authToken from RequestInfo objects
  - Changed to trigger logout on SESSION_EXPIRED error

**Utility Functions:**
- `dev-packages/egov-ui-kit-dev/src/utils/commons.js`
  - Added `hasSessionExpired()` function
  - Modified `hasTokenExpired()` to call `hasSessionExpired()` for backward compatibility
  - Updated imports to use `getSessionId`

**Higher-Order Components:**
- `dev-packages/egov-ui-kit-dev/src/hocs/withData.js`
  - Changed to use `hasValidSession()` instead of `getAccessToken()`

**Trade Licence Module:**
- `dev-packages/egov-tradelicence-dev/src/ui-config/screens/specs/utils/localStorageUtils/index.js`
  - Added session-based authentication functions (mirrors main localStorageUtils)

#### Migration Notes

1. **Backend Requirements**
   - Server must set session cookie on successful login (primary: `SESSION_ID`, alternatives: `sessionId`, `JSESSIONID`, `session-id`)
   - Server must validate `Session-Id` header on API requests
   - Server must handle logout by invalidating session and clearing cookie
   - Cookies should be set with `HttpOnly`, `Secure`, and `SameSite` attributes

2. **CORS Configuration**
   - Server must allow credentials in CORS configuration
   - `Access-Control-Allow-Credentials: true`
   - `Access-Control-Allow-Origin` must be specific origin (not `*`)

3. **Backward Compatibility**
   - `getAccessToken()` still works but returns session ID
   - `setAccessToken()` and `setRefreshToken()` log deprecation warnings
   - `hasTokenExpired()` still works but calls `hasSessionExpired()`

#### Security Improvements

- **XSS Protection:** Tokens no longer accessible via `localStorage` or JavaScript
- **CSRF Protection:** Session cookies can be configured with `SameSite` attribute
- **Token Theft Prevention:** HttpOnly cookies cannot be stolen via XSS attacks
