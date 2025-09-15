# Project Context

## Current Project
**Name:** WhatsApp Google Uploader
**Type:** Node.js CLI Application with Library System
**Status:** Production-Ready (Post-Major Refactoring)
**Last Updated:** 2025-09-15

## Project Goals ✅ ACHIEVED
1. ✅ Create a production-ready WhatsApp media uploader to Google Photos/Drive
2. ✅ Zero-copy architecture with direct file streaming
3. ✅ Enterprise-grade reliability with recovery and deduplication
4. ✅ Cross-platform support (Termux Android, Desktop)

## Current Sprint/Phase
**Sprint:** PRODUCTION MAINTENANCE
**Focus:** No active development - system is production-ready and complete
**Status:** All core functionality implemented and working in production

## Tech Stack Summary
- **Runtime:** Node.js 14+ with ES6+ features
- **CLI Framework:** Commander.js with inquirer for interactive prompts
- **APIs:** Google Photos API, Google Drive API, OAuth2
- **Storage:** Google Sheets for cloud-based progress/deduplication database
- **Streaming:** Node.js native streams for memory-efficient uploads
- **Cross-platform:** Path handling for Windows, macOS, Linux, Android/Termux

## Key Features ✅ ALL IMPLEMENTED
- ✅ Smart File Routing (Photos→Google Photos, Docs→Drive)
- ✅ Auto-Resume System with progress persistence (Google Sheets)
- ✅ SHA-256 Deduplication with content-based detection
- ✅ Zero-Copy Direct Upload Architecture
- ✅ Complete CLI Interface: auth, setup, check, scan, upload, decrypt
- ✅ Per-Chat Google Sheets Integration with JID-based lookups
- ✅ Manual Chat Name Editing (preserved across scans)
- ✅ Graceful Shutdown with state persistence
- ✅ Adaptive Quota Management with exponential backoff
- ✅ WhatsApp Database Decryption (.crypt15 → .db)

## System Status - Production Ready
1. **Core Functionality** - ✅ Complete and working
2. **User Interface** - ✅ Comprehensive CLI with all essential commands
3. **Data Integrity** - ✅ SHA-256 deduplication and JID-based lookups
4. **Error Handling** - ✅ Graceful shutdown, quota management, retry logic
5. **Documentation** - ✅ Clean README following KISS/YAGNI/DRY principles

## Important Conventions
- **Branch naming:** TASK-XXX-[agent]
- **Commit format:** type(ai-agent-task-XXX): description
- **Testing:** [Testing approach]
- **Code style:** [Style guide/linter]

## Recent Major Changes (Sept 2025)
- 2025-09-15 - **README Cleanup** - Normalized commands, added manual editing docs
- 2025-09-15 - **JID-Based Lookups** - Google Sheets rows can be safely reordered
- 2025-09-15 - **Manual Chat Name Editing** - User edits preserved across scans
- 2025-09-15 - **Quota Management** - Adaptive rate limiting with exponential backoff
- 2025-09-14 - **SHA-256 Deduplication** - Content-based duplicate detection
- 2025-09-14 - **Per-Chat Features** - Individual sheets and targeted uploads
- 2025-09-14 - **WhatsApp Decryption** - .crypt15 database decryption support
- 2025-09-13 - **MAJOR REFACTORING** - Applied KISS/YAGNI/DRY, ~85% code reduction
- 2025-09-13 - **Production Upload System** - Real Google APIs integration working

## Team/Agent Assignments
- **Architect:** Overall architecture, task assignment
- **Gnome:** Frontend development
- **Dwarf:** Backend development
- **Elf:** UI/UX implementation
- **Seer:** Testing and QA
- **DevOps:** Infrastructure and deployment
- **API:** API design and implementation
- **Security:** Security analysis and implementation
- **Database:** Database design and optimization

---
*This file should be kept concise (under 10KB). Move detailed information to reference files.*