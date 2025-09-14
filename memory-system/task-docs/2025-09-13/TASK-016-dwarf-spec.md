# TASK-016 Specification: Implement CLI `scan` Command

## Assignment
**Agent:** dwarf
**Priority:** 1 (Highest - MVP Essential)
**Phase:** MVP CLI Implementation

## Task Description
Add a `scan` command to the existing CLI application that lists WhatsApp media files using the existing Scanner class. This is a simple integration task - the Scanner class is already implemented and working.

## Current State Analysis
✅ **Scanner class exists** - `src/scanner/index.ts` with full functionality:
- `WhatsAppScanner` class with `scan()`, `scanAll()`, `findFiles()` methods
- Auto-detects WhatsApp path across platforms
- Categorizes files by type (photo/video/document/audio)
- Provides file metadata (path, name, size, timestamp, mimeType)

✅ **CLI structure exists** - `src/cli/cli-application.ts` with working commands:
- `auth`, `setup`, `check` commands already implemented
- Uses Commander.js framework
- Follows consistent pattern for command implementation

## Acceptance Criteria

### Must Have (MVP)
- [ ] `whatsapp-uploader scan` command works
- [ ] Lists all WhatsApp media files with counts by type (photo/video/document/audio)
- [ ] Shows basic file information: name, type, size
- [ ] Uses existing Scanner class (no new functionality needed)
- [ ] Supports optional path parameter: `scan /custom/whatsapp/path`
- [ ] KISS: Simple table/list output, no fancy formatting

### Should Have
- [ ] Shows summary statistics (total files, total size by type)
- [ ] Handles errors gracefully (no WhatsApp directory found, etc.)
- [ ] Consistent with existing CLI command patterns

### Won't Have (YAGNI)
- Complex filtering options
- Export functionality
- Detailed metadata display
- Progress bars for scanning

## Technical Implementation

### File to Modify
`src/cli/cli-application.ts` - Add scan command following existing patterns

### Integration Pattern
```javascript
// Add this to setupProgram() method around line 316
this.program
  .command('scan')
  .description('Scan WhatsApp directory for media files')
  .argument('[path]', 'Custom WhatsApp path (optional)')
  .action(async (customPath) => {
    try {
      const { WhatsAppScanner } = require('../scanner');

      // Create scanner with optional custom path
      const scanner = new WhatsAppScanner({
        whatsappPath: customPath
      });

      console.log('Scanning WhatsApp media files...\n');

      // Use existing Scanner API
      const files = customPath ?
        await scanner.scan(customPath) :
        await scanner.findFiles();

      // Group by type and display
      const grouped = files.reduce((acc, file) => {
        acc[file.type] = acc[file.type] || [];
        acc[file.type].push(file);
        return acc;
      }, {});

      // Display results (simple format)
      console.log('WhatsApp Media Files:\n');

      for (const [type, typeFiles] of Object.entries(grouped)) {
        console.log(`${type.toUpperCase()}: ${typeFiles.length} files`);
        // Show first few files as examples
        typeFiles.slice(0, 3).forEach(file => {
          console.log(`  - ${file.name} (${(file.size / 1024 / 1024).toFixed(1)} MB)`);
        });
        if (typeFiles.length > 3) {
          console.log(`  ... and ${typeFiles.length - 3} more`);
        }
        console.log();
      }

      // Summary
      const totalSize = files.reduce((sum, f) => sum + f.size, 0);
      console.log(`Total: ${files.length} files, ${(totalSize / 1024 / 1024).toFixed(1)} MB`);

    } catch (error) {
      console.error('Scan failed:', error.message);
      if (error.message.includes('not found')) {
        console.log('\nTips:');
        console.log('- Make sure WhatsApp is installed');
        console.log('- Try specifying custom path: scan /path/to/whatsapp');
        console.log('- Use "whatsapp-uploader check" to verify configuration');
      }
      process.exit(1);
    }
  });
```

### Error Handling Requirements
- Handle case where WhatsApp directory not found
- Handle case where no media files found
- Provide helpful error messages with tips
- Use consistent error exit codes (1 for failure)

### Output Format (KISS Principle)
```
Scanning WhatsApp media files...

WhatsApp Media Files:

PHOTO: 245 files
  - IMG-20240315-WA0001.jpg (2.1 MB)
  - IMG-20240315-WA0002.jpg (1.8 MB)
  - IMG-20240315-WA0003.jpg (3.2 MB)
  ... and 242 more

VIDEO: 12 files
  - VID-20240315-WA0001.mp4 (15.6 MB)
  - VID-20240315-WA0002.mp4 (8.3 MB)
  ... and 10 more

Total: 257 files, 1,234.5 MB
```

## Dependencies
✅ **All dependencies are ready:**
- Scanner class: `src/scanner/index.ts` - IMPLEMENTED
- CLI framework: Commander.js - INSTALLED
- File system access: Node.js fs - AVAILABLE

## Testing Requirements
- Must integrate with existing `tests/test.js`
- Test with real WhatsApp directory structure (existing mock in tests/)
- Verify Scanner integration works correctly
- No mocks - test real functionality following INTEGRITY-RULES.md

## Implementation Constraints
- **KISS**: Keep the implementation simple - just integrate Scanner with CLI
- **YAGNI**: Don't add features not in acceptance criteria
- **DRY**: Reuse existing Scanner API, don't duplicate functionality
- **Follow existing patterns**: Use same structure as auth/setup/check commands
- **No workarounds**: If Scanner API doesn't work, fix Scanner, don't work around

## Definition of Done
- [ ] Command implemented in `src/cli/cli-application.ts`
- [ ] Integration with existing Scanner class works
- [ ] Error handling implemented with helpful messages
- [ ] Manual testing with real/mock WhatsApp directory
- [ ] Code follows existing CLI command patterns
- [ ] No workarounds or hacks used
- [ ] Ready for seer agent testing integration

## Branch Information
- **Branch:** TASK-016-dwarf
- **Base:** main (current state with working Scanner)
- **Files to modify:** `src/cli/cli-application.ts` (add scan command)
- **Estimated effort:** 1-2 hours (simple integration task)

## Notes for Implementation
- The Scanner class is already battle-tested and handles cross-platform paths
- Just need to wire the Scanner to CLI command following existing patterns
- Keep output format simple but informative
- Focus on user experience - helpful error messages when things go wrong
- This is the last CLI command needed for MVP (upload command is separate task)