import { Router } from 'express';
import { adminController } from '../controllers/admin.controller';
import { reportController } from '../controllers/report.controller';
import { authenticate, requireRole } from '../middlewares/auth.middleware';
import { validateBody } from '../middlewares/validate.middleware';
import { moderationActionSchema, rejectEventSchema } from '../validators/admin.validator';
import { updateReportSchema } from '../validators/report.validator';
import { UserRole } from '@prisma/client';

const router = Router();

// Protect all admin routes
router.use(authenticate, requireRole(UserRole.ADMIN));

/**
 * Event Moderation Endpoints
 */
router.get('/events/pending', adminController.getPendingEvents);

router.patch(
  '/events/:id/approve',
  validateBody(moderationActionSchema),
  adminController.approveEvent
);

router.patch(
  '/events/:id/reject',
  validateBody(rejectEventSchema),
  adminController.rejectEvent
);

/**
 * Misinformation Reports Management
 */
router.get('/reports', reportController.getReports);

router.patch(
  '/reports/:id',
  validateBody(updateReportSchema),
  reportController.updateReport
);

export default router;

