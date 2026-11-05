import { app } from './app';
import { env } from './config/env';
import { disconnectPrisma } from './config/database';

const server = app.listen(env.PORT, () => {
  console.log(`=======================================================`);
  console.log(` The Living Culture Map - Backend API Server`);
  console.log(` Server running on: http://localhost:${env.PORT}`);
  console.log(` Health check:      http://localhost:${env.PORT}/api/health`);
  console.log(` Event Filters:     http://localhost:${env.PORT}/api/events/filter`);
  console.log(` Filter Options:    http://localhost:${env.PORT}/api/events/filter-options`);
  console.log(` Environment:       ${env.NODE_ENV}`);
  console.log(`=======================================================`);
});

// Graceful shutdown
const gracefulShutdown = async (signal: string) => {
  console.log(`\nReceived ${signal}. Shutting down gracefully...`);
  server.close(async () => {
    await disconnectPrisma();
    console.log('HTTP server closed and database disconnected.');
    process.exit(0);
  });

  setTimeout(() => {
    console.error('Forcefully terminating server after timeout.');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

