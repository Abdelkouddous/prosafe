// Use a dedicated database for e2e runs (override with POSTGRES_DB_TEST). Loaded before AppModule is imported.
process.env.POSTGRES_DB = process.env.POSTGRES_DB_TEST ?? 'prosafe_test';
