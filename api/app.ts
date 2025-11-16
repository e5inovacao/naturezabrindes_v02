/**
 * This is a API server
 */

import express, { type Request, type Response, type NextFunction }  from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import authRoutes from './routes/auth.ts';
import productsRoutes from './routes/products.ts';
import quotesRoutes from './routes/quotes.ts';
import proxyRoutes from './routes/proxy.ts';
import emailOutboxRoutes from './routes/emailOutbox.ts';
import emailTestRoutes from './routes/emailTest.ts';

// for esm mode
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// load env
dotenv.config({ path: path.join(__dirname, '..', '.env') });


const app: express.Application = express();

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Cross-Origin-Embedder-Policy', 'Cross-Origin-Resource-Policy'],
  exposedHeaders: ['Content-Length', 'Content-Type', 'Cross-Origin-Resource-Policy'],
  credentials: false
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

/**
 * API Routes
 */
app.use('/api/auth', authRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/quotes', quotesRoutes);
app.use('/api/proxy', proxyRoutes);
app.use('/api/emails/outbox', emailOutboxRoutes);
app.use('/api/email/test', emailTestRoutes);

/**
 * health
 */
app.use('/api/health', (req: Request, res: Response, next: NextFunction): void => {
  res.status(200).json({
    success: true,
    message: 'ok'
  });
});

/**
 * error handler middleware
 */
app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
  res.status(500).json({
    success: false,
    error: 'Server internal error'
  });
});

/**
 * 404 handler
 */
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'API not found'
  });
});

export default app;