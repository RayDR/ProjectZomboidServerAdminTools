import { Response } from 'express';
import { AuthenticatedRequest } from '../types/auth.types';
import { userSettingsRepository } from '../repositories/user-settings.repository';

const DEFAULT_SETTINGS = {
  theme: 'modern-horror',
  font: 'terminal',
  animations: true,
  customTitle: '',
  refreshRate: 5000
};

export const getUserSettingsController = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const userId = req.user?.id;
  if (!userId) {
    res.status(401).json({ success: false, message: 'Unauthorized' });
    return;
  }

  const stored = await userSettingsRepository.getByUserId(userId);
  const settings = {
    ...DEFAULT_SETTINGS,
    ...(stored.settings || {}),
    customTitle: typeof stored.settings?.customTitle === 'string' ? stored.settings.customTitle : ''
  };

  delete (settings as any).useServerName;

  res.json({
    success: true,
    data: {
      settings,
      customColors: stored.customColors || {}
    }
  });
};

export const updateUserSettingsController = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const userId = req.user?.id;
  if (!userId) {
    res.status(401).json({ success: false, message: 'Unauthorized' });
    return;
  }

  const incomingSettings = req.body?.settings && typeof req.body.settings === 'object' ? req.body.settings : {};
  const incomingColors = req.body?.customColors && typeof req.body.customColors === 'object' ? req.body.customColors : {};

  const normalizedSettings = {
    ...DEFAULT_SETTINGS,
    ...incomingSettings
  };

  delete (normalizedSettings as any).useServerName;
  normalizedSettings.customTitle = typeof normalizedSettings.customTitle === 'string' ? normalizedSettings.customTitle.trim() : '';

  await userSettingsRepository.saveByUserId(userId, {
    settings: normalizedSettings,
    customColors: incomingColors
  });

  res.json({
    success: true,
    data: {
      settings: normalizedSettings,
      customColors: incomingColors
    },
    message: 'Settings saved successfully'
  });
};
