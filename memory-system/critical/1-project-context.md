# Project Context

## Current Project
**Name:** WhatsApp Google Uploader
**Type:** Node.js CLI Application with Library System
**Status:** MVP Implementation Phase (Post-Refactoring)
**Last Updated:** 2025-09-13

## Project Goals
1. Create a production-ready WhatsApp media uploader to Google Photos/Drive
2. Zero-copy architecture with direct file streaming
3. Enterprise-grade reliability with recovery and deduplication
4. Cross-platform support (Termux Android, Desktop)

## Current Sprint/Phase
**Sprint:** MVP CLI Implementation (Post-Refactoring)
**Focus:** Complete minimal viable product with `scan` and `upload` CLI commands
**Deadline:** Deliver working WhatsApp backup solution

## Tech Stack Summary
- **Runtime:** Node.js 14+ with ES6+ features
- **CLI Framework:** Commander.js with inquirer for interactive prompts
- **APIs:** Google Photos API, Google Drive API, OAuth2
- **Storage:** Google Sheets for cloud-based progress/deduplication database
- **Streaming:** Node.js native streams for memory-efficient uploads
- **Cross-platform:** Path handling for Windows, macOS, Linux, Android/Termux

## Key Features
- Smart File Routing (Photos→Google Photos, Docs→Drive) - Status: ✅ IMPLEMENTED
- Auto-Resume System with progress persistence - Status: ✅ IMPLEMENTED (Google Sheets)
- SHA-256 Deduplication with Google Sheets database - Status: ✅ IMPLEMENTED
- Zero-Copy Direct Upload Architecture - Status: ✅ IMPLEMENTED
- CLI Commands: auth, setup, check - Status: ✅ IMPLEMENTED

## Active Development Areas
1. **CLI Commands** - Only `scan` and `upload` commands missing for MVP
2. **Testing** - Add CLI command tests to existing test suite

## Important Conventions
- **Branch naming:** TASK-XXX-[agent]
- **Commit format:** type(ai-agent-task-XXX): description
- **Testing:** [Testing approach]
- **Code style:** [Style guide/linter]

## Recent Major Changes
- 2025-09-13 - **MAJOR REFACTORING** - Applied KISS/YAGNI/DRY principles, reduced from ~11K to ~1.9K lines
- 2025-09-13 - **Unified GoogleApis Class** - Consolidated separate Auth/Drive/Photos into single class
- 2025-09-13 - **Working Upload System** - Real uploads to Google Drive/Photos implemented and tested
- 2025-09-13 - **Google Sheets Persistence** - Cloud-based progress tracking and deduplication
- 2025-09-13 - **CLI Commands Working** - auth, setup, check commands fully functional

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