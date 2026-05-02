import 'dotenv/config';
import { createApp } from './app';
import { prisma } from './lib/prisma';
import { execSync } from 'child_process';

const REQUIRED_ENV = ['DATABASE_URL', 'JWT_SECRET'] as const;

for (const key of REQUIRED_ENV) {
  if (!process.env[key]) {
    console.error(`[startup] Missing required environment variable: ${key}`);
    process.exit(1);
  }
}

const PORT = parseInt(process.env.PORT ?? '3000', 10);

async function main() {
  // Run migrations on startup
  try {
    console.log('[startup] Running database migrations...');
    const schemaPath = require('path').join(__dirname, '../prisma/schema.prisma');
    execSync(`npx prisma migrate deploy --schema=${schemaPath}`, { stdio: 'inherit' });
    console.log('[startup] Migrations complete.');
  } catch (err) {
    console.error('[startup] Migration failed:', err);
    process.exit(1);
  }

  const app = createApp();

  app.listen(PORT, () => {
    console.log(`[server] Running on port ${PORT}`);
  });

  process.on('SIGTERM', async () => {
    console.log('[server] SIGTERM received, shutting down...');
    await prisma.$disconnect();
    process.exit(0);
  });
}

main().catch((err) => {
  console.error('[startup] Fatal error:', err);
  process.exit(1);
});
