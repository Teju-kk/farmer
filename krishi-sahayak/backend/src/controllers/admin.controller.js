import { success } from '../utils/apiResponse.js';
import * as service from '../services/admin.service.js';

export const overview = async (_req, res, next) => { try { success(res, await service.overview()); } catch (error) { next(error); } };
export const listUsers = async (req, res, next) => { try { success(res, await service.listUsers(req.validated.query)); } catch (error) { next(error); } };
export const getUser = async (req, res, next) => { try { success(res, await service.getUser(req.validated.params.id)); } catch (error) { next(error); } };
export const createMarketer = async (req, res, next) => { try { success(res, await service.createMarketer(req.validated.body), 201); } catch (error) { next(error); } };
export const updateUser = async (req, res, next) => { try { success(res, await service.updateUser(req.validated.params.id, req.validated.body)); } catch (error) { next(error); } };
