import { Request, Response, NextFunction } from 'express';
import { contactService } from '../services/contact.service';
import { sendSuccess, sendError } from '../utils/api-response';

export class ContactController {
  sendOtp = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { contactType, contactValue, submissionRef } = req.body;
      const userId = req.user?.id;

      const result = await contactService.sendOtp(
        contactType,
        contactValue,
        userId,
        submissionRef
      );

      sendSuccess(res, result, result.message);
    } catch (err: any) {
      if (err.message?.includes('wait') || err.message?.includes('cooldown')) {
        sendError(res, err.message, 429);
        return;
      }
      next(err);
    }
  };

  verifyOtp = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { contactType, contactValue, otp, submissionRef } = req.body;
      const userId = req.user?.id;

      const result = await contactService.verifyOtp(
        contactType,
        contactValue,
        otp,
        userId,
        submissionRef
      );

      sendSuccess(res, result, result.message);
    } catch (err: any) {
      if (err.message?.includes('Invalid') || err.message?.includes('expired') || err.message?.includes('attempts')) {
        sendError(res, err.message, 400);
        return;
      }
      next(err);
    }
  };

  resendOtp = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { contactType, contactValue, submissionRef } = req.body;
      const userId = req.user?.id;

      const result = await contactService.resendOtp(
        contactType,
        contactValue,
        userId,
        submissionRef
      );

      sendSuccess(res, result, result.message);
    } catch (err: any) {
      if (err.message?.includes('wait') || err.message?.includes('cooldown')) {
        sendError(res, err.message, 429);
        return;
      }
      next(err);
    }
  };
}

export const contactController = new ContactController();

