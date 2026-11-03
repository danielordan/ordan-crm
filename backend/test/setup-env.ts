// Test-only settings, loaded before AppModule is imported (ConfigModule validates on import)
process.env.BACKEND_API_KEY = 'e2e-test-api-key-0123456789';
process.env.LOG_LEVEL = 'silent';
process.env.NODE_ENV = 'test';
