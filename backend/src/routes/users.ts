import { Router } from 'express';
import { auth } from '../middleware/auth';
import { requireAdmin } from '../middleware/admin';
import {
  adminSetUserPasswordController,
  createUserController,
  getUsersController,
  updateUserController
} from '../controllers/users.controller';

const router = Router();

router.get('/', auth, requireAdmin, (req, res) => { void getUsersController(req, res); });
router.post('/', auth, requireAdmin, (req, res) => { void createUserController(req, res); });
router.put('/:userId', auth, requireAdmin, (req, res) => { void updateUserController(req, res); });
router.post('/:userId/password', auth, requireAdmin, (req, res) => { void adminSetUserPasswordController(req, res); });

export default router;