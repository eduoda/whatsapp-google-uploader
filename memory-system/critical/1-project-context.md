# Project Context

## Current Project
**Name:** WhatsApp Google Uploader
**Type:** Node.js CLI Application with Library System
**Status:** Architecture & Design Phase
**Last Updated:** 2025-09-11

## Project Goals
1. Create a production-ready WhatsApp media uploader to Google Photos/Drive
2. Zero-copy architecture with direct file streaming
3. Enterprise-grade reliability with recovery and deduplication
4. Cross-platform support (Termux Android, Desktop)

## Current Sprint/Phase
**Sprint:** Architecture & Design (Phase 1)
**Focus:** System architecture definition and library boundaries
**Deadline:** Architecture approval before implementation

## Tech Stack Summary
- **Runtime:** Node.js 14+ with ES6+ features
- **CLI Framework:** Commander.js with inquirer for interactive prompts
- **APIs:** Google Photos API, Google Drive API, OAuth2
- **Storage:** Google Sheets for cloud-based progress/deduplication database
- **Streaming:** Node.js native streams for memory-efficient uploads
- **Cross-platform:** Path handling for Windows, macOS, Linux, Android/Termux

## Key Features
- Smart File Routing (Photos→Google Photos, Docs→Drive) - Status: Planned
- Auto-Resume System with progress persistence - Status: Planned
- SHA-256 Deduplication with Google Sheets database - Status: Planned
- Rate Limiting with exponential backoff - Status: Planned
- Zero-Copy Direct Upload Architecture - Status: Planned

## Active Development Areas
1. Library Architecture - Modular OAuth, Drive, Photos, Scanner, Proxy libraries
2. Interface Contracts - Clear APIs between all system components

## Important Conventions
- **Branch naming:** TASK-XXX-[agent]
- **Commit format:** type(ai-agent-task-XXX): description
- **Testing:** [Testing approach]
- **Code style:** [Style guide/linter]

## Recent Major Changes
- 2025-09-13 - **MAJOR: SQLite→Google Sheets Migration** - Migrated from local SQLite persistence to cloud-based Google Sheets database
- 2025-09-13 - Created sheets-database package replacing database package
- 2025-09-13 - Updated proxy package to use Google Sheets for all persistence operations

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