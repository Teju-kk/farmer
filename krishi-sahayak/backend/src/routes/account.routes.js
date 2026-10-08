import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { deleteAccountSchema, profileSchema } from '../validators/account.validator.js';
import * as controller from '../controllers/account.controller.js';

const router = Router();
router.use(authenticate);
router.get('/export', controller.exportAccount);
router.patch('/profile', validate(profileSchema), controller.updateProfile);
router.delete('/', validate(deleteAccountSchema), controller.deleteAccount);
export default router;
