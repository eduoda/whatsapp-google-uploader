# TASK-013 Planning: Package Consolidation and Structure Simplification

## 📋 Task Information
- **Task ID**: TASK-013
- **Date**: 2025-09-13 (current session)
- **Agent**: Gnome
- **Priority**: 1 (Critical - blocks all subsequent simplification)
- **Estimated Time**: 4-6 hours
- **Branch**: TASK-013-gnome

## 🎯 Task Description
Consolidate 6 separate packages (oauth, google-drive, google-photos, scanner, proxy, sheets-database) into a single-package structure. Remove Lerna and npm workspaces complexity. Create simplified build system while preserving ALL existing functionality.

## 🔍 Root Cause Analysis
- **Symptom**: Over-engineered system with 6 packages for a personal backup tool
- **Root Cause**: Premature abstraction and enterprise-level architecture for simple use case
- **Proper Fix**: Consolidate into single package, maintain logical directory structure, eliminate build complexity

## 📊 Current State Analysis

### What Currently Exists
- **6 packages** with individual package.json files
- **Lerna workspace** management with complex build scripts
- **Working functionality** in all packages (oauth, drive, photos, scanner, sheets-database)
- **20% complete proxy** orchestrator
- **Comprehensive test suite** that passes

### Dependencies
- **External**: Node.js, TypeScript, existing npm dependencies
- **Internal**: Must preserve all working code during migration
- **Tools**: Git branching for safe migration

## 🏗️ Detailed Plan

### Step 1: Setup and Analysis
**Objective**: Create migration branch and analyze current structure
**Actions**:
1. Create TASK-013-gnome branch
2. Analyze all package.json files to collect dependencies
3. Map import/export relationships between packages
4. Document current test structure
**Files to Review**:
- `lerna.json`
- `package.json` (root)
- `packages/*/package.json` (all 6 packages)
- `packages/*/src/**/*.ts` (import patterns)
**Estimated Time**: 30 minutes

### Step 2: Dependency Consolidation
**Objective**: Create unified package.json with all dependencies
**Actions**:
1. Merge all dependencies from 6 packages into root
2. Deduplicate versions (use latest compatible)
3. Remove workspace configuration
4. Remove Lerna dependencies
**Files to Modify**:
- `package.json` - Consolidate all deps, remove workspaces
**Estimated Time**: 45 minutes

### Step 3: Source Code Migration (Package by Package)
**Objective**: Move all source code to new src/ structure
**Actions**:
1. Create new src/ directory structure
2. Migrate packages/oauth → src/auth/
3. Migrate packages/google-drive → src/google-apis/drive/
4. Migrate packages/google-photos → src/google-apis/photos/
5. Migrate packages/scanner → src/scanner/
6. Migrate packages/proxy → src/uploader/
7. Migrate packages/sheets-database → src/database/
**Files to Create**:
- `src/auth/` - OAuth and token management
- `src/google-apis/drive/` - Google Drive API wrapper
- `src/google-apis/photos/` - Google Photos API wrapper  
- `src/scanner/` - WhatsApp file scanning
- `src/uploader/` - Main orchestrator (from proxy)
- `src/database/` - Google Sheets persistence
- `src/types/` - Consolidated type definitions
**Estimated Time**: 90 minutes

### Step 4: Import Path Updates
**Objective**: Replace package imports with relative imports
**Actions**:
1. Find all import statements using package names (@whatsapp-uploader/*)
2. Replace with relative imports (../auth/, ../google-apis/, etc.)
3. Update export patterns to work with new structure
4. Ensure no circular dependencies
**Files to Modify**:
- All TypeScript files in src/ - Update import statements
**Estimated Time**: 60 minutes

### Step 5: Build System Simplification
**Objective**: Create single TypeScript build system
**Actions**:
1. Create unified tsconfig.json
2. Update package.json scripts (build, dev, test, lint)
3. Remove Lerna configuration
4. Test build process
**Files to Create/Modify**:
- `tsconfig.json` - Single TypeScript configuration
- `package.json` - Simplified build scripts
**Files to Delete**:
- `lerna.json`
- `packages/*/package.json` (all 6)
- `packages/*/tsconfig.json` (all 6)
**Estimated Time**: 45 minutes

### Step 6: Test Migration and Validation
**Objective**: Migrate tests and ensure everything works
**Actions**:
1. Move all test files to tests/ directory
2. Update test imports to use new paths
3. Run full test suite
4. Fix any import issues discovered by tests
**Files to Modify**:
- `tests/` - All test files with updated imports
- Test configuration files
**Estimated Time**: 60 minutes

### Step 7: Final Cleanup and Validation
**Objective**: Complete migration and validate success
**Actions**:
1. Delete packages/ directory
2. Run npm install to verify dependencies
3. Run npm run build to verify compilation
4. Run npm test to verify all tests pass
5. Verify no broken imports remain
**Files to Delete**:
- `packages/` directory (entire folder)
**Estimated Time**: 30 minutes

## ✅ Success Criteria
- [ ] **Single package.json**: No sub-package.json files remain
- [ ] **No Lerna**: lerna.json deleted, no Lerna references in scripts
- [ ] **Working build**: `npm run build` produces correct dist/ output
- [ ] **All tests pass**: Every existing test passes with new structure
- [ ] **All imports resolved**: No broken import paths after migration
- [ ] **Clean src/ structure**: All code organized under src/ with logical directories
- [ ] **Dependency integrity**: All required dependencies available at root level
- [ ] **TypeScript compilation**: Compiles without errors
- [ ] **Functionality preserved**: All current functionality maintained

## 🔄 Rollback Plan
If migration fails:
1. `git checkout main` - Return to original state
2. `git branch -D TASK-013-gnome` - Delete broken branch
3. Document issues encountered
4. Re-plan with lessons learned

## 📝 Critical Implementation Notes

### Import Pattern Migration
```typescript
// OLD (package imports - TO BE REPLACED)
import { TokenManager } from '@whatsapp-uploader/oauth';
import { DriveUploader } from '@whatsapp-uploader/google-drive';
import { PhotosUploader } from '@whatsapp-uploader/google-photos';

// NEW (relative imports - TARGET)
import { TokenManager } from '../auth/token-manager';
import { DriveUploader } from '../google-apis/drive/uploader';
import { PhotosUploader } from '../google-apis/photos/uploader';
```

### Target Directory Structure
```
src/
├── auth/                  # From packages/oauth
│   ├── token-manager.ts
│   └── types.ts
├── google-apis/           # Merged APIs
│   ├── drive/             # From packages/google-drive
│   └── photos/            # From packages/google-photos
├── scanner/               # From packages/scanner
├── uploader/              # From packages/proxy
├── database/              # From packages/sheets-database
└── types/                 # Consolidated types
```

### Risk Mitigation
- **Test after each package migration** - Don't migrate all at once
- **Use TypeScript compiler** to catch broken imports immediately
- **Preserve exact file contents** during migration - only change imports
- **Document any unexpected issues** for Phase 2 planning

## 🔗 References
- TASK-013-gnome-spec.md - Detailed requirements and acceptance criteria
- Current packages/ directory - Source material for migration
- Phase 2 planning - TASK-014 and TASK-015 depend on this completion

---
**Planning Completed**: 2025-09-13 (current session)
**Ready to Execute**: YES - All requirements clear, dependencies satisfied, plan validated