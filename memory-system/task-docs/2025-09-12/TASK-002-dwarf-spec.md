# TASK-002 OAuth Library Development - Specification

## Task Overview
**Agent:** dwarf  
**Priority:** 2  
**Phase:** Phase 1 - Foundation Libraries  
**Estimated Duration:** 2-3 days  
**Created:** 2025-09-12  

## Objective
Implement a production-ready Google OAuth2 authentication library with secure token management, automatic refresh, and cross-platform storage support. This is a critical foundation library that all other libraries (Drive, Photos, Proxy) will depend on for authentication.

## Architecture Context
The OAuth library is the authentication foundation of the entire WhatsApp Google Uploader system. It must provide:
- Secure token storage with encryption
- Automatic token refresh mechanisms
- Interactive OAuth2 flow handling
- Cross-platform compatibility
- Enterprise-grade security practices

**Referenced Architecture Sections:**
- OAuth Library Interface (Lines 182-199 in architecture.md)
- Security Architecture (Lines 485-521 in architecture.md)
- Error Handling Strategy (Lines 522-548 in architecture.md)

## Technical Requirements

### 1. Core Classes to Implement

#### 1.1 TokenManager (PRIMARY FOCUS)
**File:** `packages/oauth/src/token-manager.ts`
**Status:** Skeleton exists, needs full implementation

**Required Methods:**
```typescript
class TokenManager {
  constructor(config: { tokenPath: string, encryptionKey: string })
  
  async storeTokens(tokens: StoredTokens): Promise<void>
  async loadTokens(): Promise<StoredTokens | null>
  async clearTokens(): Promise<void>
  async hasValidTokens(): Promise<boolean>
  encrypt(data: string): string
  decrypt(data: string): string
}
```

**Security Requirements:**
- AES-256-GCM encryption for all stored tokens
- Secure file permissions (0o600) for token files
- Proper IV generation for each encryption
- Authentication tag verification for tampering detection
- Validate encryption key strength (minimum 32 characters)

#### 1.2 OAuthManager Updates
**File:** `packages/oauth/src/oauth-manager.ts`
**Status:** Partial implementation exists

**Required Updates:**
- Fix constructor to properly initialize TokenManager with encryption key
- Add proper error handling and retry logic
- Implement missing private methods referenced in tests
- Add token validation methods (isTokenValid, validateTokenFormat)
- Implement error categorization methods

#### 1.3 FlowManager (IMPLEMENT STUBS)
**File:** `packages/oauth/src/flow-manager.ts`
**Status:** Likely skeleton

**Required Methods:**
```typescript
class FlowManager {
  constructor(oauth2Client: OAuth2Client)
  async startInteractiveFlow(scopes: string[]): Promise<StoredTokens>
  async promptForCode(): Promise<{ code: string }>
}
```

#### 1.4 ScopeValidator (IMPLEMENT STUBS)
**File:** `packages/oauth/src/scope-validator.ts`  
**Status:** Likely skeleton

**Required Methods:**
```typescript
class ScopeValidator {
  validateScopes(scopes: string[]): void
  isValidScope(scope: string): boolean
}
```

### 2. Test Files to Pass

#### 2.1 Primary Test: OAuth Manager
**File:** `tests/unit/oauth/oauth-manager.test.ts`
**Coverage:** 360 lines of comprehensive tests

**Key Test Categories:**
- `authenticate()` - OAuth flow completion, error handling, scope validation
- `getValidToken()` - Valid token retrieval, token refresh, error scenarios
- `revokeAccess()` - Token revocation and cleanup
- `isAuthenticated()` - Authentication status checks
- Token validation logic
- Error categorization and retry logic

#### 2.2 Primary Test: Token Manager  
**File:** `tests/unit/oauth/token-manager.test.ts`
**Coverage:** 393 lines of comprehensive tests

**Key Test Categories:**
- `storeTokens()` - Secure storage with encryption, file permissions
- `loadTokens()` - Decryption, error handling, corrupted data
- `clearTokens()` - File removal, error handling
- `hasValidTokens()` - Token validation, expiry checks
- Encryption/decryption security
- Property-based testing for round-trip data integrity

### 3. Implementation Strategy

#### Phase 1: TokenManager Core (Day 1)
1. **Encryption Implementation**
   - Implement AES-256-GCM encryption with proper IV generation
   - Add authentication tag handling for tampering detection
   - Validate encryption key requirements

2. **Storage Operations**
   - Implement secure file storage with proper permissions
   - Add cross-platform path handling
   - Handle directory creation and file operations

3. **Token Validation**
   - Implement token expiry checking (5-minute buffer)
   - Add token format validation
   - Handle different OAuth token formats

#### Phase 2: OAuthManager Integration (Day 2)
1. **Fix Constructor and Dependencies**
   - Properly initialize TokenManager with encryption configuration
   - Set up proper dependency injection

2. **Complete Missing Methods**
   - Implement token validation helpers (isTokenValid, validateTokenFormat)
   - Add error categorization methods (isAuthError, isNetworkError, isQuotaError)
   - Implement retry logic for transient errors

3. **OAuth Flow Integration**
   - Ensure proper integration with TokenManager
   - Add comprehensive error handling

#### Phase 3: Supporting Classes (Day 2-3)
1. **FlowManager Implementation**
   - Interactive OAuth flow with proper URL generation
   - User prompt handling for authorization codes
   - Token exchange implementation

2. **ScopeValidator Implementation**
   - Validate Google API scopes
   - Ensure minimal required scopes are met
   - Prevent privilege escalation

## Test-Driven Development Approach

### Test Execution Strategy
```bash
# Run OAuth tests only
npm run test -- tests/unit/oauth/

# Run specific test file
npm run test -- tests/unit/oauth/token-manager.test.ts
npm run test -- tests/unit/oauth/oauth-manager.test.ts
```

### Success Criteria
- All 45+ test cases in oauth-manager.test.ts must pass
- All 35+ test cases in token-manager.test.ts must pass
- No test files should be modified to make tests pass
- All property-based tests must pass consistently

## Security Implementation Checklist

### Encryption Security
- [ ] Use AES-256-GCM for token encryption
- [ ] Generate random IV for each encryption operation
- [ ] Validate encryption key strength (≥32 chars)
- [ ] Implement authentication tag verification
- [ ] Handle encryption/decryption errors securely

### File Security
- [ ] Set secure file permissions (0o600)
- [ ] Use secure directory creation (recursive with proper permissions)
- [ ] Validate file paths to prevent directory traversal
- [ ] Handle file system errors gracefully

### Token Security
- [ ] Implement 5-minute expiry buffer for tokens
- [ ] Validate token format and structure
- [ ] Secure token cleanup on revocation
- [ ] Handle token refresh with proper error handling

## Error Handling Requirements

### Error Categories (from tests)
```typescript
// These methods must be implemented in OAuthManager
isAuthError(error: Error): boolean     // Invalid credentials, auth failures
isNetworkError(error: Error): boolean  // ENOTFOUND, connection errors
isQuotaError(error: Error): boolean    // Rate limits, quota exceeded
```

### Retry Logic
- Implement exponential backoff for transient errors
- Maximum 3 retries for recoverable errors
- Different strategies for different error types
- Proper error propagation for non-recoverable errors

## Dependencies and Configuration

### Required NPM Dependencies
- `google-auth-library` (already installed)
- `inquirer` (for interactive prompts)
- Node.js built-in: `crypto`, `fs/promises`, `path`

### Environment Configuration
```typescript
interface TokenManagerConfig {
  tokenPath: string;           // Secure storage path
  encryptionKey: string;       // 32+ character encryption key
}

interface OAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  tokenStoragePath: string;
}
```

## Integration Points

### Internal Library Interfaces
- **TokenManager**: Core token operations used by OAuthManager
- **FlowManager**: Interactive OAuth flow handling
- **ScopeValidator**: OAuth scope validation and security

### External API Dependencies
- **Google OAuth2**: Token exchange, refresh, revocation
- **File System**: Secure token storage with encryption
- **User Input**: Interactive authorization code entry

## Quality Gates

### Code Quality
- All TypeScript compilation must pass without errors
- ESLint rules must pass without warnings
- All AIDEV- comments must be preserved and updated appropriately

### Test Coverage
- All existing test files must pass without modification
- No test cases should be disabled or modified
- Property-based tests must pass consistently

### Security Review
- Encryption implementation must use industry-standard algorithms
- File permissions must follow security best practices
- Error handling must not leak sensitive information

## Git Workflow

### Branch Strategy
```bash
# Create and switch to task branch
git checkout -b TASK-002-dwarf

# Regular commits as development progresses
git commit -m "feat(ai-dwarf-task-002): implement TokenManager encryption core"
git commit -m "feat(ai-dwarf-task-002): add secure file storage operations"
git commit -m "feat(ai-dwarf-task-002): complete OAuthManager integration"

# Push branch for architect review
git push origin TASK-002-dwarf
```

### Commit Message Format
`feat(ai-dwarf-task-002): <description>`

## Success Metrics

### Functional Metrics
- [ ] All OAuth unit tests pass (100% success rate)
- [ ] Token encryption/decryption works correctly
- [ ] OAuth flow completes successfully
- [ ] Token refresh mechanism works
- [ ] Cross-platform file operations work

### Performance Metrics
- Token operations complete within 100ms
- Encryption/decryption performance acceptable for CLI usage
- Memory usage remains constant during operations

### Security Metrics
- No plaintext tokens stored on disk
- File permissions properly set and verified
- Encryption algorithms verified secure

## Next Steps After Completion

1. **Report Creation**: Create comprehensive completion report
2. **Branch Push**: Push TASK-002-dwarf branch for architect review
3. **Integration Preparation**: Prepare library for Drive/Photos library integration
4. **Documentation Updates**: Update any inline documentation as needed

## Risk Mitigation

### High-Risk Areas
1. **Encryption Implementation**: Critical for security - follow test requirements exactly
2. **Cross-Platform File Operations**: Must work on Windows, macOS, Linux, Android
3. **Google API Integration**: Must handle all OAuth edge cases properly

### Mitigation Strategies
- Follow TDD strictly - implement only what's needed to pass tests
- Test on multiple platforms if possible
- Use established Node.js patterns for file operations
- Leverage Google's official auth library appropriately

---

**Critical Success Factor**: This library must be bulletproof as it's the security foundation for the entire system. Every security requirement in the tests must be implemented correctly.