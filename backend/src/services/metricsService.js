const client = require('prom-client');

// Create a Registry which registers the metrics
const register = new client.Registry();

// Add a default label which is added to all metrics
register.setDefaultLabels({
  app: 'vesting-vault-backend'
});

// Enable the collection of default metrics
client.collectDefaultMetrics({ register });

// Custom metrics
const apiResponseTime = new client.Histogram({
  name: 'api_response_time_seconds',
  help: 'Response time of API endpoints in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.01, 0.05, 0.1, 0.3, 0.5, 0.7, 1, 3, 5, 10]
});

const activeDbConnections = new client.Gauge({
  name: 'active_db_connections',
  help: 'Total number of active database connections'
});

const totalIndexedBlocks = new client.Gauge({
  name: 'total_indexed_ledger_blocks',
  help: 'Total number of ledger blocks indexed'
});

// Database connection pool metrics
const dbPoolIdleConnections = new client.Gauge({
  name: 'db_pool_idle_connections',
  help: 'Number of idle (available) connections in the database pool'
});

const dbPoolWaitingRequests = new client.Gauge({
  name: 'db_pool_waiting_requests',
  help: 'Number of requests waiting to acquire a database connection'
});

const dbPoolUtilization = new client.Gauge({
  name: 'db_pool_utilization_ratio',
  help: 'Database pool utilization (active connections / max connections, 0..1)'
});

const dbPoolMaxConnections = new client.Gauge({
  name: 'db_pool_max_connections',
  help: 'Configured maximum size of the database connection pool'
});

const dbSlowQueriesTotal = new client.Counter({
  name: 'db_slow_queries_total',
  help: 'Total number of database queries exceeding the slow-query threshold',
  labelNames: ['operation']
});

// RPC Health Metrics
const rpcEndpointHealth = new client.Gauge({
  name: 'soroban_rpc_endpoint_health',
  help: 'Health status of Soroban RPC endpoints (1=healthy, 0=unhealthy)',
  labelNames: ['endpoint', 'state']
});

const rpcHealthCheckLatency = new client.Histogram({
  name: 'soroban_rpc_health_check_latency_ms',
  help: 'Latency of Soroban RPC health checks in milliseconds',
  labelNames: ['endpoint'],
  buckets: [10, 50, 100, 250, 500, 1000, 2500, 5000, 10000]
});

const rpcFailoverCount = new client.Counter({
  name: 'soroban_rpc_failover_total',
  help: 'Total number of Soroban RPC endpoint failover events',
  labelNames: ['from_endpoint', 'to_endpoint']
});

const rpcRetryCount = new client.Counter({
  name: 'soroban_rpc_retry_total',
  help: 'Total number of Soroban RPC retry attempts',
  labelNames: ['endpoint', 'method']
});

register.registerMetric(apiResponseTime);
register.registerMetric(activeDbConnections);
register.registerMetric(totalIndexedBlocks);
register.registerMetric(dbPoolIdleConnections);
register.registerMetric(dbPoolWaitingRequests);
register.registerMetric(dbPoolUtilization);
register.registerMetric(dbPoolMaxConnections);
register.registerMetric(dbSlowQueriesTotal);
register.registerMetric(rpcEndpointHealth);
register.registerMetric(rpcHealthCheckLatency);
register.registerMetric(rpcFailoverCount);
register.registerMetric(rpcRetryCount);

module.exports = {
  register,
  apiResponseTime,
  activeDbConnections,
  totalIndexedBlocks,
  dbPoolIdleConnections,
  dbPoolWaitingRequests,
  dbPoolUtilization,
  dbPoolMaxConnections,
  dbSlowQueriesTotal,
  rpcEndpointHealth,
  rpcHealthCheckLatency,
  rpcFailoverCount,
  rpcRetryCount
};
