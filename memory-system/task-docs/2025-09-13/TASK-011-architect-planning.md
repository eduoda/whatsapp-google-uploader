# TASK-011-architect-planning.md

## Task: SQLite3 to better-sqlite3 Migration

### Executive Summary
Migrate the WhatsApp Google Uploader project from sqlite3 to better-sqlite3 to resolve Termux/Android ARM compilation issues and improve performance.

### Problem Analysis

#### Current Issues with sqlite3:
1. **Termux Compilation Problems**: sqlite3 requires native compilation with Python 2.7 and build tools that are problematic on Android/Termux
2. **ARM Architecture Issues**: sqlite3 has known issues with ARM compilation on mobile platforms
3. **Async Overhead**: sqlite3 uses callback-based async operations that add unnecessary overhead for our use case
4. **Optional Dependencies**: Currently in optionalDependencies, making it harder to ensure consistent database behavior

#### Better-sqlite3 Advantages:
1. **Termux Compatible**: better-sqlite3 has better ARM support and simpler compilation requirements
2. **Synchronous Operations**: Faster for our use case since we don't need async database operations
3. **Better Performance**: Lower overhead, more efficient than sqlite3
4. **Simpler API**: More straightforward API that's easier to work with
5. **Better Node.js Integration**: Better integration with modern Node.js features

### Architecture Impact Analysis

#### Current Database Usage:
1. **Mock Database Tests**: `/tests/__mocks__/database.ts` - contains schema definition
2. **Proxy Package**: `/packages/proxy/package.json` - has sqlite3 as peer dependency
3. **Root Package**: `/package.json` - has sqlite3 as optional dependency

#### Database Schema (from mock):
- `upload_sessions` - Track upload session progress
- `file_hashes` - Deduplication through SHA-256 hashes  
- `upload_errors` - Error tracking and retry logic
- `config` - Application configuration storage

### Migration Plan

#### Phase 1: Dependency Migration
1. **Remove sqlite3**:
   - Remove from root `package.json` optionalDependencies
   - Remove from `packages/proxy/package.json` peerDependencies
   
2. **Add better-sqlite3**:
   - Add to root `package.json` dependencies (not optional)
   - Add to `packages/proxy/package.json` peerDependencies
   - Update Termux setup script to remove sqlite3 warnings

#### Phase 2: Update Documentation & Configuration
1. **Update tech-stack.md**: Change database technology reference
2. **Update architecture documentation**: Reflect better-sqlite3 usage
3. **Update package scripts**: Remove sqlite3-specific workarounds
4. **Update CI/CD**: Ensure better-sqlite3 builds correctly on all platforms

#### Phase 3: Database Interface Definition
1. **Create database interface**: Define TypeScript interfaces for database operations
2. **Create better-sqlite3 implementation**: Implement the database layer
3. **Update mock database**: Ensure test compatibility
4. **Update TASK-008 specification**: Provide clear implementation requirements

#### Phase 4: Integration & Testing
1. **Update proxy library**: Use new database interface
2. **Update tests**: Ensure all tests work with better-sqlite3
3. **Cross-platform testing**: Verify Termux compatibility
4. **Performance validation**: Confirm performance improvements

### Implementation Details

#### New Database Interface (TypeScript):
```typescript
// packages/database/src/types.ts
export interface DatabaseConnection {
  run(sql: string, params?: any[]): { lastInsertRowid: number; changes: number };
  get<T = any>(sql: string, params?: any[]): T | undefined;
  all<T = any>(sql: string, params?: any[]): T[];
  prepare(sql: string): PreparedStatement;
  transaction<T>(fn: () => T): T;
  close(): void;
}

export interface PreparedStatement {
  run(params?: any[]): { lastInsertRowid: number; changes: number };
  get<T = any>(params?: any[]): T | undefined;
  all<T = any>(params?: any[]): T[];
}
```

#### Package.json Updates:
```json
{
  "dependencies": {
    "better-sqlite3": "^9.0.0"
  }
}
```

### Risk Assessment

#### Low Risk:
- Database schema unchanged - no data migration needed
- Interface-driven approach maintains compatibility
- Better-sqlite3 API is simpler and more predictable

#### Medium Risk:
- Synchronous operations require code pattern changes
- Need to ensure all platforms support better-sqlite3 compilation

#### Mitigation Strategies:
- Keep database interface abstract to allow future migrations
- Comprehensive testing on all target platforms
- Gradual rollout with fallback options

### Success Criteria

1. **Termux Compatibility**: Project installs and runs without compilation errors on Termux
2. **Performance**: Database operations perform at least as well as sqlite3
3. **Test Coverage**: All existing tests pass with new database implementation
4. **Cross-Platform**: Works on Windows, macOS, Linux, and Android/Termux
5. **Documentation**: All documentation updated to reflect changes

### Dependencies & Conflicts

#### Dependencies:
- Current project structure (TASK-010 completed)
- Existing database schema design (from mock tests)

#### Conflicts:
- **TASK-008**: Database implementation will need to use better-sqlite3 instead of sqlite3
- **TASK-006**: Proxy library will need updated database interface

### Next Steps

1. Create migration branch: `TASK-011-architect`
2. Update package.json files to use better-sqlite3
3. Update documentation and scripts
4. Create database interface specification for TASK-008
5. Test Termux compatibility
6. Update memory system with new architecture decisions

### Acceptance Criteria

- [ ] sqlite3 completely removed from all package.json files
- [ ] better-sqlite3 added as production dependency
- [ ] Termux setup script updated and tested
- [ ] Tech stack documentation updated
- [ ] Database interface defined for implementation
- [ ] TASK-008 specification updated with better-sqlite3 requirements
- [ ] All existing tests still pass
- [ ] Cross-platform compatibility verified

### Estimated Effort: 4-6 hours
- Analysis and planning: 1 hour ✓
- Dependency migration: 1 hour  
- Documentation updates: 1 hour
- Interface design: 1 hour
- Testing and validation: 1-2 hours

---
*Created: 2025-09-13 14:30*  
*Agent: architect*  
*Task: TASK-011*