/**
 * SQLite Database Schema for WhatsApp Google Uploader
 * AIDEV-NOTE: database-schema; matches architecture specification exactly
 * 
 * This schema implements the data architecture from ARCHITECTURE.md
 * for progress tracking, deduplication, and error handling.
 */

-- Enable foreign key support
PRAGMA foreign_keys = ON;

-- Progress tracking table
CREATE TABLE IF NOT EXISTS upload_sessions (
  id TEXT PRIMARY KEY,
  chat_id TEXT NOT NULL,
  chat_name TEXT NOT NULL,
  start_time TIMESTAMP NOT NULL,
  last_update TIMESTAMP NOT NULL,
  total_files INTEGER NOT NULL,
  processed_files INTEGER DEFAULT 0,
  success_count INTEGER DEFAULT 0,
  error_count INTEGER DEFAULT 0,
  duplicate_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'running' CHECK (status IN ('running', 'completed', 'interrupted', 'error')),
  last_processed_file TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- File deduplication table
CREATE TABLE IF NOT EXISTS file_hashes (
  hash TEXT PRIMARY KEY,
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  mime_type TEXT NOT NULL,
  upload_service TEXT NOT NULL CHECK (upload_service IN ('drive', 'photos')),
  upload_id TEXT,              -- External service ID
  chat_id TEXT NOT NULL,
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Error tracking table
CREATE TABLE IF NOT EXISTS upload_errors (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT NOT NULL,
  file_path TEXT NOT NULL,
  error_type TEXT NOT NULL,
  error_message TEXT NOT NULL,
  retry_count INTEGER DEFAULT 0,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (session_id) REFERENCES upload_sessions(id) ON DELETE CASCADE
);

-- Configuration table
CREATE TABLE IF NOT EXISTS config (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_upload_sessions_chat_id ON upload_sessions(chat_id);
CREATE INDEX IF NOT EXISTS idx_upload_sessions_status ON upload_sessions(status);
CREATE INDEX IF NOT EXISTS idx_upload_sessions_start_time ON upload_sessions(start_time);

CREATE INDEX IF NOT EXISTS idx_file_hashes_chat_id ON file_hashes(chat_id);
CREATE INDEX IF NOT EXISTS idx_file_hashes_upload_service ON file_hashes(upload_service);
CREATE INDEX IF NOT EXISTS idx_file_hashes_uploaded_at ON file_hashes(uploaded_at);

CREATE INDEX IF NOT EXISTS idx_upload_errors_session_id ON upload_errors(session_id);
CREATE INDEX IF NOT EXISTS idx_upload_errors_error_type ON upload_errors(error_type);
CREATE INDEX IF NOT EXISTS idx_upload_errors_timestamp ON upload_errors(timestamp);

-- Insert default configuration values
INSERT OR IGNORE INTO config (key, value) VALUES 
  ('schema_version', '1.0.0'),
  ('created_at', datetime('now')),
  ('default_batch_size', '10'),
  ('default_concurrent_uploads', '3'),
  ('max_retry_attempts', '3');

-- Create views for common queries
CREATE VIEW IF NOT EXISTS session_summary AS
SELECT 
  s.id,
  s.chat_id,
  s.chat_name,
  s.start_time,
  s.last_update,
  s.total_files,
  s.processed_files,
  s.success_count,
  s.error_count,
  s.duplicate_count,
  s.status,
  ROUND((s.processed_files * 100.0) / s.total_files, 2) as progress_percentage,
  (strftime('%s', s.last_update) - strftime('%s', s.start_time)) as duration_seconds
FROM upload_sessions s;

CREATE VIEW IF NOT EXISTS recent_errors AS
SELECT 
  e.id,
  e.session_id,
  s.chat_name,
  e.file_path,
  e.error_type,
  e.error_message,
  e.retry_count,
  e.timestamp
FROM upload_errors e
JOIN upload_sessions s ON e.session_id = s.id
ORDER BY e.timestamp DESC
LIMIT 100;