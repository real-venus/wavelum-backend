const { Sequelize } = require('sequelize');
const secretsService = require('../services/secretsService');
const { buildPoolOptions, buildTimeoutDialectOptions } = require('./poolConfig');
const queryPerformanceMonitor = require('./queryPerformanceMonitor');

let sequelize;

/**
 * Sequelize logging callback that feeds the query performance monitor while
 * preserving console logging in development. Used with `benchmark: true` so the
 * elapsed time (ms) is passed as the second argument.
 */
const queryLogger = queryPerformanceMonitor.createSequelizeLogger(
  process.env.NODE_ENV === 'development' ? console.log : null
);

/**
 * Initialize database connection with dynamic credentials from Vault/Secrets Manager
 */
const initializeDatabase = async () => {
  if (process.env.NODE_ENV === 'test') {
    // Use SQLite in-memory for tests — no Postgres required
    sequelize = new Sequelize({
      dialect: 'sqlite',
      storage: ':memory:',
      // Instrument queries even in tests so the performance monitor is exercised.
      benchmark: true,
      logging: queryLogger,
    });
  } else {
    // Get database credentials dynamically from secrets service
    try {
      const dbConfig = await secretsService.getDatabaseCredentials();
      
      sequelize = new Sequelize(
        dbConfig.database,
        dbConfig.username,
        dbConfig.password,
        {
          host: dbConfig.host,
          port: dbConfig.port,
          dialect: 'postgres',
          benchmark: true,
          logging: queryLogger,
          ssl: dbConfig.ssl,
          pool: buildPoolOptions(),
          dialectOptions: {
            ...(dbConfig.ssl ? { sslmode: 'require', rejectUnauthorized: true } : {}),
            ...buildTimeoutDialectOptions(),
          },
        }
      );

      console.log('Database connection initialized with dynamic credentials and tuned pool', buildPoolOptions());
    } catch (error) {
      console.error('Failed to initialize database with dynamic credentials, falling back to environment variables:', error);
      
      // Fallback to environment variables if secrets service fails
      sequelize = new Sequelize(
        process.env.DB_NAME || 'vesting_vault',
        process.env.DB_USER || 'postgres',
        process.env.DB_PASSWORD || 'password',
        {
          host: process.env.DB_HOST || 'localhost',
          port: process.env.DB_PORT || 5432,
          dialect: 'postgres',
          benchmark: true,
          logging: queryLogger,
          pool: buildPoolOptions(),
          dialectOptions: {
            ...(process.env.DB_SSL === 'true'
              ? { sslmode: 'require', rejectUnauthorized: true }
              : {}),
            ...buildTimeoutDialectOptions(),
          },
        }
      );
    }
  }
  
  return sequelize;
};

// Initialize immediately for backward compatibility
let initPromise = initializeDatabase();

// Export a promise that resolves to the initialized sequelize instance
module.exports = { 
  sequelize: sequelize,
  initializeDatabase,
  getSequelize: async () => {
    await initPromise;
    return sequelize;
  }
};
