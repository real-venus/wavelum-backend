/**
 * Centralized PostgreSQL connection-pool configuration for Sequelize.
 *
 * Sequelize manages connections through an internal `sequelize-pool` instance.
 * This module derives a tuned pool configuration plus the dialect-level
 * statement / transaction timeouts from environment variables, with defaults
 * sized for the workload described in issue #8 (bursty vesting retrievals and
 * real-time TVL calculations).
 *
 * Defaults are intentionally higher than Sequelize's stock `max: 5` to avoid
 * connection-pool exhaustion under high-concurrency vesting operations, while
 * `statement_timeout` / `idle_in_transaction_session_timeout` prevent a single
 * runaway query or abandoned transaction from holding a pooled connection
 * hostage.
 */

function toInt(value, fallback) {
  const n = parseInt(value, 10);
  return Number.isFinite(n) ? n : fallback;
}

/**
 * Build the Sequelize `pool` options.
 * @param {Object} [env=process.env]
 * @returns {{max:number,min:number,acquire:number,idle:number,evict:number}}
 */
function buildPoolOptions(env = process.env) {
  return {
    // Maximum number of connections the pool will create.
    max: toInt(env.DB_POOL_MAX, 20),
    // Minimum number of idle connections kept warm to absorb bursts.
    min: toInt(env.DB_POOL_MIN, 2),
    // Max time (ms) to wait for a connection before throwing — fail fast
    // rather than letting requests pile up indefinitely.
    acquire: toInt(env.DB_POOL_ACQUIRE_MS, 30000),
    // Time (ms) a connection can sit idle before being released.
    idle: toInt(env.DB_POOL_IDLE_MS, 10000),
    // How often (ms) the pool checks for idle connections to evict.
    evict: toInt(env.DB_POOL_EVICT_MS, 5000),
  };
}

/**
 * Build Postgres dialect options that guard the pool against long-running
 * queries and abandoned transactions.
 * @param {Object} [env=process.env]
 * @returns {Object} dialectOptions fragment
 */
function buildTimeoutDialectOptions(env = process.env) {
  return {
    // Abort any single statement that runs longer than this (ms).
    statement_timeout: toInt(env.DB_STATEMENT_TIMEOUT_MS, 30000),
    // Abort sessions that hold a transaction open and idle for too long (ms).
    idle_in_transaction_session_timeout: toInt(
      env.DB_IDLE_IN_TX_TIMEOUT_MS,
      60000
    ),
  };
}

/**
 * Adaptive-sizing bounds and thresholds. The connection pool monitor uses these
 * to grow/shrink the recommended pool size based on observed utilization.
 * @param {Object} [env=process.env]
 */
function buildAdaptiveConfig(env = process.env) {
  const floor = toInt(env.DB_POOL_MIN, 2);
  const ceiling = toInt(env.DB_POOL_ADAPTIVE_MAX, 50);
  return {
    floor: Math.max(1, floor),
    ceiling: Math.max(floor + 1, ceiling),
    // Sliding-window length (number of samples) used to smooth decisions.
    windowSize: toInt(env.DB_POOL_ADAPTIVE_WINDOW, 12),
    // Grow when smoothed utilization exceeds this fraction (0..1).
    highWatermark: Number(env.DB_POOL_HIGH_WATERMARK || 0.8),
    // Shrink when smoothed utilization drops below this fraction (0..1).
    lowWatermark: Number(env.DB_POOL_LOW_WATERMARK || 0.3),
    // How many connections to add/remove per adjustment.
    step: toInt(env.DB_POOL_ADAPTIVE_STEP, 2),
  };
}

/**
 * Convenience: complete Sequelize options fragment ({ pool, dialectOptions }),
 * merging any caller-supplied dialect options (e.g. SSL).
 * @param {Object} [extraDialectOptions={}]
 * @param {Object} [env=process.env]
 */
function buildSequelizePoolConfig(extraDialectOptions = {}, env = process.env) {
  return {
    pool: buildPoolOptions(env),
    dialectOptions: {
      ...extraDialectOptions,
      ...buildTimeoutDialectOptions(env),
    },
  };
}

module.exports = {
  buildPoolOptions,
  buildTimeoutDialectOptions,
  buildAdaptiveConfig,
  buildSequelizePoolConfig,
};
