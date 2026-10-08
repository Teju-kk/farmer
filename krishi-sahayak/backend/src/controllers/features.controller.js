import { success } from '../utils/apiResponse.js';
import * as service from '../services/features.service.js';

export const weather = async (req, res, next) => { try { success(res, await service.weather(req.query.location)); } catch (error) { next(error); } };
export const schemes = async (req, res, next) => { try { success(res, await service.listSchemes(req.user.sub)); } catch (error) { next(error); } };
export const createScheme = async (req, res, next) => { try { success(res, await service.createScheme(req.user.sub, req.validated.body), 201); } catch (error) { next(error); } };
export const updateScheme = async (req, res, next) => { try { success(res, await service.updateScheme(req.user.sub, req.params.id, req.validated.body)); } catch (error) { next(error); } };
export const deleteScheme = async (req, res, next) => { try { success(res, await service.deleteScheme(req.user.sub, req.params.id)); } catch (error) { next(error); } };
export const notifications = async (req, res, next) => { try { success(res, await service.listNotifications(req.user.sub)); } catch (error) { next(error); } };
export const readNotification = async (req, res, next) => { try { success(res, await service.markNotificationRead(req.user.sub, req.params.id)); } catch (error) { next(error); } };
export const assistant = async (req, res, next) => { try { success(res, await service.askAssistant(req.user.sub, req.validated.body.question, req.validated.body.locale)); } catch (error) { next(error); } };
export const bills = async (req, res, next) => { try { success(res, await service.listBills(req.user.sub)); } catch (error) { next(error); } };
export const uploadBill = async (req, res, next) => { try { success(res, await service.uploadBill(req.user.sub, req.validated.body), 201); } catch (error) { next(error); } };
export const billFile = async (req, res, next) => { try { const file = await service.getBillFile(req.user.sub, req.params.id); res.setHeader('X-Content-Type-Options', 'nosniff'); res.setHeader('Content-Disposition', `attachment; filename="bill-${String(req.params.id).replace(/[^A-Za-z0-9_-]/g, '')}"`); res.type(file.mime).send(file.bytes); } catch (error) { next(error); } };
export const deleteBill = async (req, res, next) => { try { success(res, await service.deleteBill(req.user.sub, req.params.id)); } catch (error) { next(error); } };
export const contact = async (req, res, next) => { try { success(res, await service.submitContact(req.validated.body), 201); } catch (error) { next(error); } };
