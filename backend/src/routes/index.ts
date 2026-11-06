import { Router } from 'express';
import eventRoutes from './event.routes';
import authRoutes from './auth.routes';
import contactRoutes from './contact.routes';
import adminRoutes from './admin.routes';

const router = Router();

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'Paaramparik Backend API',
  });
});

// Event routes
router.use('/events', eventRoutes);

// Auth routes
router.use('/auth', authRoutes);

// Contact verification routes
router.use('/contact', contactRoutes);

// Admin moderation & reports routes
router.use('/admin', adminRoutes);

export default router;
