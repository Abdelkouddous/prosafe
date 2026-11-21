import { tmpdir } from 'os';
import { join } from 'path';

// Use a dedicated database for e2e runs (override with POSTGRES_DB_TEST). Loaded before AppModule is imported.
process.env.POSTGRES_DB = process.env.POSTGRES_DB_TEST ?? 'prosafe_test';
// The suites make many requests from one IP: do not let the global throttler interfere.
process.env.THROTTLE_LIMIT = '100000';
// Keep uploaded test files out of the working tree.
process.env.UPLOADS_DIR = process.env.UPLOADS_DIR_TEST ?? join(tmpdir(), 'prosafe-e2e-uploads');
