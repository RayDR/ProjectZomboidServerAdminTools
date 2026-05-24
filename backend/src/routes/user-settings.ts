import { Router } from 'express';
import { auth } from '../middleware/auth';
import { getUserSettingsController, updateUserSettingsController } from '../controllers/user-settings.controller';

const router = Router();

router.get('/', auth, (req, res) => { void getUserSettingsController(req, res); });
router.put('/', auth, (req, res) => { void updateUserSettingsController(req, res); });

export default router;
