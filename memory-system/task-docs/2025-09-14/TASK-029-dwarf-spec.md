# TASK-029-dwarf-spec.md

## Task: Fix Upload Organization Structure

### Priority: 1 (Critical - Organization Fix)

### Background
TASK-027 successfully implemented the upload command, but the organization structure needs to be corrected per user requirements. The current implementation may not be using the correct folder/album naming convention.

### User Requirements (Clarified)

**Google Photos (Photos/Videos):**
- Album name format: `WA_[chat_name]_[JID]`
- Only photos and videos go here
- Examples:
  - `WA_Family Chat_1234567890-1609459200@g.us`
  - `WA_Work Group_9876543210-1609459200@g.us`

**Google Drive (Documents/Audio/Other):**
- Folder path format: `/WhatsApp Google Uploader/[chat_name]_[JID]/`
- All non-photo/video files go here
- Examples:
  - `/WhatsApp Google Uploader/Family Chat_1234567890-1609459200@g.us/`
  - `/WhatsApp Google Uploader/Work Group_9876543210-1609459200@g.us/`

### Current Implementation Analysis Needed

**Files to examine:**
- `src/uploader/uploader-manager.ts` - Main upload logic
- `src/google-apis/index.ts` - Google APIs integration
- `src/chat-metadata/types.ts` - Type definitions
- Test files for upload functionality

**Key questions to answer:**
1. What is the current folder/album naming convention?
2. How are photos/videos vs documents routed?
3. Where are the naming conventions defined?
4. What Google Sheets columns track folder/album names?

### Required Changes

#### 1. Update Album/Folder Naming
- **Photos/Videos**: Album name should be `WA_[chat_name]_[JID]`
- **Documents/Audio**: Folder path should be `/WhatsApp Google Uploader/[chat_name]_[JID]/`

#### 2. Update Google Sheets Tracking
Ensure these columns reflect the correct naming:
- `nome do album do google photos` (Photos album name)
- `link para album do google photos` (Photos album link)
- `nome do diretorio do google drive` (Drive directory name)
- `link para diretorio do google drive` (Drive directory link)

#### 3. Maintain File Type Routing
Ensure correct routing logic:
- Photos (.jpg, .jpeg, .png, .gif, .bmp, .webp) → Google Photos
- Videos (.mp4, .avi, .mov, .mkv, .webm, .3gp) → Google Photos
- Everything else (documents, audio, etc.) → Google Drive

### Implementation Guidelines

#### KISS Principle
- Make minimal changes to existing upload logic
- Don't over-engineer the solution
- Focus only on the naming convention fix

#### DRY Principle
- Create a single function for generating album/folder names
- Reuse naming logic across upload and sheets update functions

#### YAGNI Principle
- Don't add complex folder structure features
- Don't add unnecessary configuration options
- Keep the naming format simple and consistent

### Acceptance Criteria

1. **Correct Album Naming**
   - [ ] Photos/videos uploaded to album `WA_[chat_name]_[JID]`
   - [ ] Album names visible in Google Photos match format

2. **Correct Folder Naming**
   - [ ] Documents/audio uploaded to folder `/WhatsApp Google Uploader/[chat_name]_[JID]/`
   - [ ] Folder paths visible in Google Drive match format

3. **Google Sheets Integration**
   - [ ] Google Sheets columns show correct album/folder names
   - [ ] Links to albums/folders work correctly
   - [ ] Per-chat spreadsheets track the right locations

4. **File Type Routing**
   - [ ] Photos/videos still go to Google Photos (not Drive)
   - [ ] Documents/audio still go to Google Drive (not Photos)
   - [ ] No files uploaded to wrong service

5. **Testing**
   - [ ] Existing tests updated to reflect new naming
   - [ ] Upload functionality still works end-to-end
   - [ ] No regression in upload reliability

6. **Error Handling**
   - [ ] Invalid chat names handled gracefully
   - [ ] Special characters in chat names don't break uploads
   - [ ] Missing chat metadata doesn't cause crashes

### Test Scenarios

1. **Standard Chat Upload**
   - Chat name: "Family Chat"
   - JID: "1234567890-1609459200@g.us"
   - Expected Photos album: `WA_Family Chat_1234567890-1609459200@g.us`
   - Expected Drive folder: `/WhatsApp Google Uploader/Family Chat_1234567890-1609459200@g.us/`

2. **Group Chat with Special Characters**
   - Chat name: "Work & Friends 😊"
   - JID: "9876543210-1609459200@g.us"
   - Should handle special characters appropriately

3. **Individual Chat**
   - Chat name: "John Doe"
   - JID: "1122334455@s.whatsapp.net"
   - Should work for individual chats (not just groups)

### Dependencies

- TASK-027 ✅ (upload command working)
- Working Google Photos API integration ✅
- Working Google Drive API integration ✅
- Working Google Sheets integration ✅

### Files Likely to Change

- `src/uploader/uploader-manager.ts` - Update naming logic
- `src/google-apis/index.ts` - Possibly update API calls
- `src/chat-metadata/types.ts` - Add naming helper functions
- Test files - Update expected values

### Expected Effort

**Low to Medium** - This should be a straightforward naming convention update, not a major architectural change.

### Success Metrics

- Upload command continues to work reliably
- Files appear in correctly named albums/folders
- Google Sheets track correct locations
- No breaking changes to existing functionality

---

**Note**: This is a correction/enhancement task, not a new feature. Focus on fixing the organization structure while maintaining all existing functionality.