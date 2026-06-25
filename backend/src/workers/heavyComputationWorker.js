/**
 * Heavy-computation worker entrypoint.
 *
 * Worker registration, retry/backoff, dead-letter routing and stalled-job
 * detection now live in the centralized BackgroundJobManager. This module is
 * kept as a thin compatibility shim: requiring it ensures the manager is
 * initialized (idempotent) so the `heavy-computation` worker is running.
 */
const backgroundJobManager = require('./backgroundJobManager');

backgroundJobManager.init().catch((err) =>
  console.error('Failed to initialize background jobs from heavyComputationWorker:', err.message)
);

module.exports = backgroundJobManager;
