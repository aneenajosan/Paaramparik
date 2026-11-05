import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service';
import { sendSuccess, sendError } from '../utils/api-response';

export class AuthController {
  register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { email, password, name } = req.body;
      const result = await authService.register(email, password, name);
      sendSuccess(res, result, 'User registered successfully', 201);
    } catch (err: any) {
      if (err.message?.includes('already exists')) {
        sendError(res, err.message, 409);
        return;
      }
      next(err);
    }
  };

  login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { email, password } = req.body;
      const result = await authService.login(email, password);
      sendSuccess(res, result, 'Logged in successfully');
    } catch (err: any) {
      if (err.message?.includes('Invalid email or password')) {
        sendError(res, err.message, 401);
        return;
      }
      next(err);
    }
  };

  me = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      sendSuccess(res, { user: req.user }, 'Current user profile');
    } catch (err) {
      next(err);
    }
  };
}

export const authController = new AuthController();

