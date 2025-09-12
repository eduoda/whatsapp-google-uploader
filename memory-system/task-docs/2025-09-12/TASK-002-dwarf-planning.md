# TASK-002 OAuth Library Development - Planning

## Task Overview
**Agent:** dwarf  
**Priority:** 2  
**Started:** 2025-09-12 19:15
**Branch:** TASK-002-dwarf

## Objective
Implement a production-ready Google OAuth2 authentication library with secure token management following TDD approach. All existing tests must pass without modification.

## Implementation Strategy

### Phase 1: TokenManager Core Implementation
**Priority:** Critical Foundation
**Files:** packages/oauth/src/token-manager.ts

#### 1.1 Encryption Implementation
- [ ] AES-256-GCM encryption with crypto module
- [ ] Random IV generation for each operation
- [ ] Authentication tag handling for tampering detection
- [ ] Encryption key validation (≥32 characters)
- [ ] Secure error handling without information leakage

#### 1.2 Secure File Storage
- [ ] Cross-platform file operations with fs/promises
- [ ] Secure file permissions (0o600)
- [ ] Directory creation with proper permissions
- [ ] File path validation and sanitization
- [ ] Graceful error handling for file operations

#### 1.3 Token Management
- [ ] storeTokens() - encrypted storage with proper serialization
- [ ] loadTokens() - decryption with error handling
- [ ] clearTokens() - secure file removal
- [ ] hasValidTokens() - expiry validation with 5-minute buffer
- [ ] Token format validation

### Phase 2: OAuthManager Integration
**Priority:** High
**Files:** packages/oauth/src/oauth-manager.ts

#### 2.1 Constructor and Dependencies
- [ ] Fix TokenManager initialization with proper config
- [ ] Encryption key configuration
- [ ] Dependency injection setup

#### 2.2 Missing Methods Implementation
- [ ] isTokenValid() - token validation logic
- [ ] validateTokenFormat() - OAuth token structure validation
- [ ] isAuthError() - authentication error categorization
- [ ] isNetworkError() - network error detection
- [ ] isQuotaError() - quota/rate limit error detection
- [ ] Retry logic with exponential backoff

#### 2.3 Integration Points
- [ ] TokenManager integration
- [ ] Google OAuth2Client integration
- [ ] Error handling and propagation

### Phase 3: Supporting Classes
**Priority:** Medium
**Files:** flow-manager.ts, scope-validator.ts

#### 3.1 FlowManager Implementation
- [ ] startInteractiveFlow() - OAuth URL generation and flow
- [ ] promptForCode() - user input handling with inquirer
- [ ] Token exchange implementation

#### 3.2 ScopeValidator Implementation
- [ ] validateScopes() - Google API scope validation
- [ ] isValidScope() - individual scope checking
- [ ] Minimum required scopes enforcement

## Test Strategy

### Test Execution Plan
```bash
# Primary test files to pass
npm test -- --testPathPattern="oauth/token-manager.test.ts"
npm test -- --testPathPattern="oauth/oauth-manager.test.ts"

# All OAuth tests
npm test -- --testPathPattern="oauth"
```

### Test Requirements
- 45+ test cases in oauth-manager.test.ts must pass
- 35+ test cases in token-manager.test.ts must pass
- Property-based tests must pass consistently
- No test files can be modified
- All encryption round-trip tests must pass

## Security Checklist

### Encryption Security
- [ ] AES-256-GCM algorithm implementation
- [ ] Random IV for each encryption
- [ ] Authentication tag verification
- [ ] Key strength validation
- [ ] Secure error handling

### File Security
- [ ] 0o600 file permissions
- [ ] Secure directory creation
- [ ] Path traversal prevention
- [ ] Error handling without information leakage

### Token Security
- [ ] 5-minute expiry buffer
- [ ] Format validation
- [ ] Secure cleanup on revocation
- [ ] Refresh token handling

## Dependencies Required
- google-auth-library (installed)
- inquirer (for interactive prompts)
- Node.js crypto module
- Node.js fs/promises module
- Node.js path module

## Risk Mitigation

### High-Risk Areas
1. **Encryption Implementation**: Critical security foundation
2. **Cross-platform Compatibility**: File operations must work everywhere
3. **OAuth Integration**: Must handle all Google API edge cases

### Mitigation Strategy
- Follow existing test requirements exactly
- Use Node.js standard crypto module only
- Test encryption round-trips thoroughly
- Handle all error cases from tests

## Success Criteria
- [ ] All TokenManager tests pass
- [ ] All OAuthManager tests pass
- [ ] No compilation errors
- [ ] ESLint passes
- [ ] Security requirements met
- [ ] Cross-platform file operations work

## Implementation Order
1. TokenManager encryption core
2. TokenManager file operations
3. TokenManager token validation
4. OAuthManager missing methods
5. OAuthManager integration fixes
6. FlowManager implementation
7. ScopeValidator implementation
8. Final integration testing

## Commit Strategy
```bash
feat(ai-dwarf-task-002): implement TokenManager encryption core
feat(ai-dwarf-task-002): add secure file storage operations
feat(ai-dwarf-task-002): complete token validation logic
feat(ai-dwarf-task-002): fix OAuthManager missing methods
feat(ai-dwarf-task-002): integrate TokenManager with OAuthManager
feat(ai-dwarf-task-002): implement FlowManager interactive flow
feat(ai-dwarf-task-002): add ScopeValidator implementation
feat(ai-dwarf-task-002): complete OAuth library integration
```

---
**Next Action:** Start with TokenManager encryption implementation and work through tests systematically.