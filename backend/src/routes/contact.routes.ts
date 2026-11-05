import { Router } from 'express';
import { contactController } from '../controllers/contact.controller';
import { validateBody } from '../middlewares/validate.middleware';
import { sendOtpSchema, verifyOtpSchema, resendOtpSchema } from '../validators/contact.validator';
import { optionalAuthenticate } from '../middlewares/auth.middleware';

const router = Router();

/**
 * @route   POST /api/contact/send-otp
 * @desc    Generate and send SMS / Email verification OTP
 * @access  Public / Authenticated
 */
router.post(
  '/send-otp',
  optionalAuthenticate,
  validateBody(sendOtpSchema),
  contactController.sendOtp
);

/**
 * @route   POST /api/contact/verify-otp
 * @desc    Validate 6-digit OTP and mark contact as verified
 * @access  Public / Authenticated
 */
router.post(
  '/verify-otp',
  optionalAuthenticate,
  validateBody(verifyOtpSchema),
  contactController.verifyOtp
);

/**
 * @route   POST /api/contact/resend-otp
 * @desc    Resend OTP respecting cooldown
 * @access  Public / Authenticated
 */
router.post(
  '/resend-otp',
  optionalAuthenticate,
  validateBody(resendOtpSchema),
  contactController.resendOtp
);

export default router;

