# TASK-020-dwarf-spec.md - WhatsApp Database Decryption Implementation

**Agent**: Dwarf
**Task**: TASK-020 - WhatsApp Database Decryption Implementation (Phase 1)
**Phase**: Decryption Infrastructure
**Priority**: 1 (Critical - Core Feature)
**Depends On**: Python wa-crypt-tools installation

## Objective

Implement `npm run decrypt` command that decrypts WhatsApp .crypt15 backup files using the wa-crypt-tools Python library, enabling access to the msgstore.db for chat information extraction.

## Requirements

### Functional Requirements
1. **CLI Command**: Add `decrypt` command to existing CLI application
2. **Python Integration**: Execute wa-crypt-tools via subprocess
3. **Key Management**: Read 64-character backup key from .env file
4. **File Processing**: Handle multiple .crypt15 files in WhatsApp directory
5. **Output Organization**: Create organized output structure in decrypted/ folder

### Non-Functional Requirements
- **KISS**: Minimal implementation, no over-engineering
- **YAGNI**: Only implement what's immediately needed
- **Error Handling**: Clear, user-friendly error messages
- **Security**: Never log backup keys or sensitive data
- **Cross-Platform**: Work on Linux/Termux (primary target)

## Technical Specifications

### Environment Configuration
Add to `.env.example` and update validation:
```env
# WhatsApp Database Decryption
WHATSAPP_BACKUP_KEY=your_64_character_hex_key_here

# Optional paths (auto-detect if not specified)
WHATSAPP_DATABASES_PATH=
DECRYPTED_OUTPUT_PATH=./decrypted/
```

### CLI Command Interface
```bash
# Basic usage - auto-detect paths
npm run decrypt
whatsapp-uploader decrypt

# With custom database path
whatsapp-uploader decrypt --path /custom/path/to/WhatsApp\ Databases

# With specific output directory
whatsapp-uploader decrypt --output ./my-decrypted-files

# Verbose mode for debugging
whatsapp-uploader decrypt --verbose
```

### Implementation Architecture

#### 1. DecryptCommand Class
```typescript
// src/decryption/decrypt-command.ts
export class DecryptCommand {
  constructor(private config: DecryptConfig) {}

  async execute(options: DecryptOptions): Promise<void> {
    // 1. Validate backup key format
    // 2. Find .crypt15 files
    // 3. Create output directory
    // 4. Process each file
    // 5. Validate results
  }
}
```

#### 2. CryptDecryptor Class
```typescript
// src/decryption/crypt-decryptor.ts
export class CryptDecryptor {
  async decryptFile(
    inputPath: string,
    outputPath: string,
    backupKey: string
  ): Promise<void> {
    // Execute: wa-crypt-tools decrypt inputPath outputPath backupKey
    // Handle subprocess execution and error cases
  }

  async validateWaCryptTools(): Promise<boolean> {
    // Check if wa-crypt-tools is available in PATH
  }
}
```

#### 3. BackupKeyValidator Class
```typescript
// src/decryption/backup-key-validator.ts
export class BackupKeyValidator {
  static validate(key: string): ValidationResult {
    // Validate 64 hex characters
    // No spaces, proper format
    // Return detailed error for common mistakes
  }
}
```

### File Structure
```
src/decryption/
├── index.ts                    // Main exports
├── decrypt-command.ts          // CLI command handler
├── crypt-decryptor.ts         // Python subprocess bridge
├── backup-key-validator.ts    // Key format validation
└── types.ts                   // TypeScript interfaces
```

### Expected Output Structure
```
decrypted/
├── msgstore.db                 // Main message database
├── msgstore-YYYY-MM-DD.1.db    // Backup databases
├── wa.db                       // WhatsApp app database
└── logs/
    ├── decrypt-log.txt         // Processing log
    └── error-log.txt           // Any errors encountered
```

## Implementation Details

### 1. Environment Integration
Update `src/config/index.ts`:
```typescript
export const config = {
  // ... existing config
  whatsapp: {
    backupKey: process.env.WHATSAPP_BACKUP_KEY || '',
    databasesPath: process.env.WHATSAPP_DATABASES_PATH || '',
    decryptedPath: process.env.DECRYPTED_OUTPUT_PATH || './decrypted/'
  }
};
```

### 2. CLI Integration
Update `src/cli/cli-application.ts`:
```typescript
// Add decrypt command
this.program
  .command('decrypt')
  .description('Decrypt WhatsApp backup files (.crypt15)')
  .option('--path <path>', 'Custom WhatsApp Databases path')
  .option('--output <path>', 'Custom output directory', './decrypted/')
  .option('--verbose', 'Verbose output')
  .action(async (options) => {
    // Implementation here
  });
```

### 3. Python Integration Pattern
```typescript
// Execute wa-crypt-tools safely
import { spawn } from 'child_process';

private async executePythonCommand(args: string[]): Promise<string> {
  return new Promise((resolve, reject) => {
    const process = spawn('wa-crypt-tools', args, {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env }  // Don't pass backup key via env
    });

    // Handle stdout, stderr, and exit codes
    // Implement timeout protection
    // Log safely (no sensitive data)
  });
}
```

### 4. Error Handling Strategy
```typescript
interface DecryptError {
  type: 'MISSING_KEY' | 'INVALID_KEY' | 'MISSING_PYTHON' | 'FILE_NOT_FOUND' | 'DECRYPT_FAILED';
  message: string;
  suggestion: string;
}

// Examples:
// MISSING_KEY -> "Add WHATSAPP_BACKUP_KEY to .env file"
// INVALID_KEY -> "Backup key must be exactly 64 hexadecimal characters"
// MISSING_PYTHON -> "Install wa-crypt-tools: pip install wa-crypt-tools"
```

## Acceptance Criteria

### Must Pass Tests
- [ ] **Command Registration**: `whatsapp-uploader decrypt --help` shows usage
- [ ] **Key Validation**: Rejects invalid backup keys with clear errors
- [ ] **Python Check**: Detects missing wa-crypt-tools installation
- [ ] **File Discovery**: Finds .crypt15 files in WhatsApp Databases directory
- [ ] **Decryption Process**: Successfully decrypts test .crypt15 file
- [ ] **Output Organization**: Creates proper directory structure
- [ ] **Error Messages**: Provides helpful guidance for common issues
- [ ] **Security**: Never logs backup key or sensitive data
- [ ] **Idempotent**: Can run multiple times safely

### Integration Requirements
- [ ] Works with existing CLI structure
- [ ] Follows established error handling patterns
- [ ] Uses existing configuration system
- [ ] Compatible with existing file path handling

## Testing Strategy

### Unit Tests
```typescript
// tests/decryption.test.js
describe('DecryptCommand', () => {
  it('validates backup key format correctly');
  it('rejects invalid keys with helpful messages');
  it('finds crypt files in directory');
  it('creates output directory structure');
  it('handles missing wa-crypt-tools gracefully');
});
```

### Integration Tests
```typescript
describe('CLI decrypt command', () => {
  it('executes decrypt command with valid parameters');
  it('shows appropriate error for missing key');
  it('handles non-existent database path');
});
```

### Test Data Requirements
- Sample .crypt15 file (small, for testing)
- Valid test backup key
- Mock WhatsApp Databases directory structure

## Dependencies

### Python Requirements
```bash
# User must install before using decrypt command
pip install wa-crypt-tools
```

### Node.js Dependencies
No new npm dependencies required - use existing:
- `child_process` (built-in)
- `fs/promises` (existing)
- `path` (existing)

## Security Considerations

### Backup Key Handling
- ✅ Read from environment variables only
- ✅ Never log or console.log the key
- ✅ Never pass via command line arguments (visible in process list)
- ✅ Clear from memory after use if possible
- ❌ Don't store in temporary files
- ❌ Don't transmit over network

### File System Security
- Create output directory with restricted permissions (750)
- Validate all file paths to prevent directory traversal
- Clean up temporary files on error

## Error Recovery

### Common Issues & Solutions
1. **wa-crypt-tools not found**
   - Error: "wa-crypt-tools not found in PATH"
   - Solution: "Install with: pip install wa-crypt-tools"

2. **Invalid backup key**
   - Error: "Backup key must be 64 hexadecimal characters"
   - Solution: "Check your .env file for WHATSAPP_BACKUP_KEY"

3. **No .crypt15 files found**
   - Error: "No WhatsApp backup files found"
   - Solution: "Check WhatsApp Databases directory path"

4. **Decryption failed**
   - Error: "Failed to decrypt [filename]: wrong backup key"
   - Solution: "Verify your backup key is correct"

## Performance Expectations

### Benchmarks
- Small file (1MB): < 5 seconds
- Medium file (100MB): < 30 seconds
- Large file (1GB): < 5 minutes

### Resource Usage
- Memory: Minimal (streaming approach)
- Disk: 2x backup file size during processing
- CPU: Moderate during decryption phase

## Documentation Updates

### README.md Section
```markdown
## WhatsApp Database Decryption

To enable chat-specific features, decrypt your WhatsApp backups:

1. Install wa-crypt-tools:
   ```bash
   pip install wa-crypt-tools
   ```

2. Add your backup key to .env:
   ```env
   WHATSAPP_BACKUP_KEY=your_64_character_hex_key_here
   ```

3. Run decryption:
   ```bash
   npm run decrypt
   # or
   whatsapp-uploader decrypt
   ```
```

### .env.example Update
Add new environment variables with clear documentation.

## Success Metrics

- ✅ **Functional**: Successfully decrypts real WhatsApp .crypt15 files
- ✅ **Usable**: Clear error messages guide users through common issues
- ✅ **Secure**: No sensitive data exposure in logs or error messages
- ✅ **Reliable**: Handles edge cases (missing files, invalid keys, etc.)
- ✅ **Maintainable**: Clean, well-documented code following project patterns

---

**Next Steps**: Implement this specification, test with real WhatsApp backup files, then proceed to TASK-021 for chat scanner enhancement.