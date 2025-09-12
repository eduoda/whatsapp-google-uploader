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

