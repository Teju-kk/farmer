import { success } from '../utils/apiResponse.js';
import * as service from '../services/account.service.js';

export const exportAccount = async (req, res, next) => {
  try { const data = await service.exportAccount(req.user.sub); res.setHeader('Content-Disposition', 'attachment; filename="krishi-sahayak-data.json"'); res.type('application/json').send(JSON.stringify(data, null, 2)); } catch (error) { next(error); }
};
export const deleteAccount = async (req, res, next) => { try { await service.deleteAccount(req.user.sub, req.validated.body.password); success(res, { message: 'Account and associated personal data were deleted.' }); } catch (error) { next(error); } };
export const updateProfile = async (req, res, next) => { try { success(res, await service.updateProfile(req.user.sub, req.validated.body)); } catch (error) { next(error); } };
