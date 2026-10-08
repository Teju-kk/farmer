import { success } from '../utils/apiResponse.js';
import * as authService from '../services/auth.service.js';
export const register = async (req, res, next) => { try { success(res, await authService.register(req.validated.body), 201); } catch (error) { next(error); } };
export const login = async (req, res, next) => { try { success(res, await authService.login(req.validated.body)); } catch (error) { next(error); } };
export const me = async (req, res, next) => { try { success(res, { user: await authService.getCurrentUser(req.user.sub) }); } catch (error) { next(error); } };
export const forgotPassword = async (req, res, next) => { try { await authService.requestPasswordReset(req.validated.body.email); success(res, { message: 'If an active account exists and email delivery is available, a reset link will be sent.' }, 202); } catch (error) { next(error); } };
export const resetPassword = async (req, res, next) => { try { await authService.resetPassword(req.validated.body.token, req.validated.body.password); success(res, { message: 'Password updated. Sign in with your new password.' }); } catch (error) { next(error); } };
export const changePassword = async (req, res, next) => { try { await authService.changePassword(req.user.sub, req.validated.body.currentPassword, req.validated.body.password); success(res, { message: 'Password updated. Sign in again.' }); } catch (error) { next(error); } };
