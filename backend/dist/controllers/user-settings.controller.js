"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateUserSettingsController = exports.getUserSettingsController = void 0;
const user_settings_repository_1 = require("../repositories/user-settings.repository");
const DEFAULT_SETTINGS = {
    theme: 'modern-horror',
    font: 'terminal',
    animations: true,
    customTitle: '',
    refreshRate: 5000
};
const getUserSettingsController = async (req, res) => {
    const userId = req.user?.id;
    if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
    }
    const stored = await user_settings_repository_1.userSettingsRepository.getByUserId(userId);
    const settings = {
        ...DEFAULT_SETTINGS,
        ...(stored.settings || {}),
        customTitle: typeof stored.settings?.customTitle === 'string' ? stored.settings.customTitle : ''
    };
    delete settings.useServerName;
    res.json({
        success: true,
        data: {
            settings,
            customColors: stored.customColors || {}
        }
    });
};
exports.getUserSettingsController = getUserSettingsController;
const updateUserSettingsController = async (req, res) => {
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
    delete normalizedSettings.useServerName;
    normalizedSettings.customTitle = typeof normalizedSettings.customTitle === 'string' ? normalizedSettings.customTitle.trim() : '';
    await user_settings_repository_1.userSettingsRepository.saveByUserId(userId, {
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
exports.updateUserSettingsController = updateUserSettingsController;
