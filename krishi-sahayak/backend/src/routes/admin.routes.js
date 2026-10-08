import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { adminUserIdSchema, adminUsersQuerySchema, createMarketerSchema, updateUserSchema } from '../validators/admin.validator.js';
import * as controller from '../controllers/admin.controller.js';

const router = Router();
router.use('/admin', authenticate, authorize('ADMIN'));
router.get('/admin/overview', controller.overview);
router.get('/admin/users', validate(adminUsersQuerySchema), controller.listUsers);
router.get('/admin/users/:id', validate(adminUserIdSchema), controller.getUser);
router.post('/admin/marketers', validate(createMarketerSchema), controller.createMarketer);
router.patch('/admin/users/:id', validate(updateUserSchema), controller.updateUser);
export default router;
