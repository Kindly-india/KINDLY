import './instrument';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { SentryExceptionFilter } from './filters/sentry-exception.filter';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const compression = require('compression');

async function bootstrap() {
  const requiredEnvVars = [
    'SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
    'SENTRY_DSN',
  ];
  for (const key of requiredEnvVars) {
    if (!process.env[key]) {
      throw new Error(`Missing required environment variable: ${key}`);
    }
  }
  const app = await NestFactory.create(AppModule);
  app.use(compression());

  // Behind Render's proxy the real client IP is in X-Forwarded-For. Without
  // this, req.ip is the proxy's (constant) IP, which would make the rate
  // limiter key every request to one bucket. `1` trusts exactly one proxy hop
  // (Render's LB) so clients can't spoof the header — bump to 2 if you later
  // put Cloudflare (or another proxy) in front.
  app.getHttpAdapter().getInstance().set('trust proxy', 1);

  // Enable CORS for frontend
  app.enableCors({
    origin: (origin, callback) => {
      const allowedOrigins = [
        'https://www.kindly.co.in',
        'https://kindly-sigma.vercel.app',
        ...(process.env.NODE_ENV !== 'production' ? ['http://localhost:3000'] : []),
      ];

      // Allow server-to-server / Postman / Render health checks
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'x-admin-secret',
    ],
  });

  app.useGlobalPipes(new ValidationPipe());
  app.useGlobalFilters(new SentryExceptionFilter());

  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`Backend running on http://localhost:${port}`);

  process.on('SIGTERM', async () => {
    console.log('SIGTERM received — closing server gracefully');
    await app.close();
    process.exit(0);
  });
}
bootstrap();