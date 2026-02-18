import { Router } from 'express';
import * as authController from '../controllers/auth.controller';

const router = Router();

router.post('/login', authController.login);
router.post('/register', authController.register);

// Password reset
router.post('/request-reset', authController.requestPasswordReset);
router.get('/validate-reset/:token', authController.validateResetToken);
router.post('/reset-password', authController.resetPassword);

export default router;
