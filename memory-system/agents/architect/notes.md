# Personal Notes - architect

## Session Notes

### 2025-09-11 - Architecture Design Session
**Project**: WhatsApp Google Uploader - Production-ready Node.js CLI application

**Key Architectural Insights**:
- **Zero-copy streaming is critical**: Traditional architectures copy files to temp storage, but with potentially 10GB+ WhatsApp archives, this wastes disk space and reduces performance
- **Modular library approach provides clean separation**: 5 libraries (OAuth, Drive, Photos, Proxy, Scanner) with clear responsibilities
- **Proxy library is the orchestrator**: Centralizes rate limiting, deduplication, error handling, and recovery across all upload services
- **SQLite perfect for persistence**: Zero-configuration, ACID compliance, handles progress tracking and SHA-256 deduplication database
- **Cross-platform complexity**: Android/Termux has different paths and permissions than desktop platforms

**Technical Decisions Made**:
- Stream-based uploads with Node.js native streams (memory-efficient for large video files)
- SHA-256 hashing for deduplication (prevents duplicate uploads across sessions)
- SQLite schema for progress state, file hashes, error tracking, configuration
- Commander.js for comprehensive CLI with scan/upload/setup/check/logs commands
- Exponential backoff for Google API rate limiting (1s, 2s, 4s, 8s, 16s, 30s max)

**Implementation Phases Defined**:
1. **Foundation Libraries** (Weeks 1-2): OAuth, basic Drive/Photos APIs, database schema
2. **Core Features** (Weeks 3-4): Scanner, Proxy orchestration, deduplication, progress tracking
3. **Advanced Features** (Weeks 5-6): Rate limiting, batch processing, comprehensive error handling
4. **CLI & UX** (Week 7): Complete CLI interface with all commands
5. **Testing & Hardening** (Week 8): Full test suite, security audit, documentation

**Next Required Actions**:
- **USER APPROVAL REQUIRED**: Must get architecture approval before proceeding to Phase 2 (Test Definition)
- Complete library interface contracts in api-contracts.md
- Create task specifications for each agent (dwarf for libraries, seer for testing)
- Prepare consolidated development plan for user review

**Considerations for Next Session**:
- Google API quotas and limits need investigation (Photos API has different limits than Drive API)
- Android/Termux file permission handling requires special attention
- Recovery system must handle all interruption scenarios (Ctrl+C, network loss, API errors, system crash)
- Performance benchmarks needed (target: process 1000 files without memory growth)

---

### 2025-09-12 - TASK-003 Google Drive Library Orchestration

**Task Created**: TASK-003-dwarf-spec.md - Complete specification for Google Drive library implementation

**Key Insights from Analysis**:
- **Comprehensive test suite exists**: 569 test assertions in drive-manager.test.ts provide complete functional specification
- **OAuth integration ready**: TokenManager from TASK-002 provides secure authentication foundation
- **Architecture patterns established**: Clear interfaces defined in architecture.md for Drive library
- **Mock infrastructure complete**: Robust Google API mocks available for testing

**Technical Specifications Defined**:
- **Drive API v3 integration** with resumable uploads for files ≥5MB (Google's 256KB chunk size)
- **Four-phase implementation**: Core structure → Upload functionality → Advanced features → Testing/polish
- **Performance requirements**: <256MB memory usage regardless of file size, >1MB/s upload speed
- **Security patterns**: TokenManager integration, secure file path validation, no sensitive data logging

**Implementation Strategy**:
- **Test-driven development**: All 569 test assertions must pass (comprehensive coverage)
- **Stream-based processing**: Maintain zero-copy architecture throughout
- **Error classification**: Permanent (400,401,403) vs Transient (429,≥500) with appropriate retry logic
- **Progress callbacks**: Real-time upload progress for UI integration

**Dependencies and Integration**:
- ✅ **OAuth TokenManager**: Completed and tested (TASK-002)
- ✅ **Project structure**: Complete TypeScript setup (TASK-010) 
- ✅ **Architecture contracts**: All interfaces defined in architecture.md
- ✅ **Test infrastructure**: Jest, fast-check, comprehensive mocks ready

**Quality Standards Established**:
- All TypeScript strict mode compliance
- Property-based testing with fast-check
- Comprehensive error handling with exponential backoff
- Full JSDoc documentation and AIDEV comments
- Cross-platform compatibility (Android/Termux + Desktop)

**Next Actions for Dwarf Agent**:
1. Begin with Phase 1 - implement api-client.ts with OAuth integration
2. Create comprehensive drive-types.ts with all required interfaces
3. Build upload-handler.ts with small file support first
4. Progress through resumable uploads and folder management
5. Ensure all 569 test assertions pass before completion

**Architect Notes**:
- Google Drive library is foundational for the entire upload system
- Success here enables Photos library (TASK-004) and Proxy orchestrator (TASK-006)
- Test suite provides excellent specification - dwarf should implement to make tests pass
- OAuth integration patterns from TASK-002 should be followed consistently

