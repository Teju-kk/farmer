import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.js'; import { validate } from '../middleware/validate.js'; import * as c from '../controllers/resource.controller.js'; import { activitySchema, cropSchema, cropUpdateSchema, expenseSchema, farmSchema, farmUpdateSchema, incomeSchema } from '../validators/resource.validator.js';
const router = Router();
const farmer = (method, path, ...handlers) => router[method](path, authenticate, authorize('FARMER'), ...handlers);
farmer('get', '/farms', c.listFarms); farmer('post', '/farms', validate(farmSchema), c.createFarm); farmer('get', '/farms/:id', c.getFarm); farmer('patch', '/farms/:id', validate(farmUpdateSchema), c.updateFarm); farmer('delete', '/farms/:id', c.deleteFarm);
farmer('get', '/crops', c.listCrops); farmer('post', '/crops', validate(cropSchema), c.createCrop); farmer('get', '/crops/:id', c.getCrop); farmer('patch', '/crops/:id', validate(cropUpdateSchema), c.updateCrop); farmer('delete', '/crops/:id', c.deleteCrop); farmer('post', '/crops/:id/activities', validate(activitySchema), c.createActivity);
farmer('get', '/finance/summary', c.financeSummary); farmer('get', '/income', c.listIncome); farmer('post', '/income', validate(incomeSchema), c.createIncome); farmer('get', '/expenses', c.listExpenses); farmer('post', '/expenses', validate(expenseSchema), c.createExpense);
export default router;
