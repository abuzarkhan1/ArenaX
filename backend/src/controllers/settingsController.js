import Settings from '../models/Settings.js';
import logger from '../config/logger.js';

export const getAllSettings = async (req, res) => {
  try {
    const { category } = req.query;
    const query = category ? { category } : {};

    const settings = await Settings.find(query)
      .populate('lastModifiedBy', 'username')
      .sort({ category: 1, settingKey: 1 });

    res.json({ success: true, settings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getSetting = async (req, res) => {
  try {
    const setting = await Settings.findOne({ settingKey: req.params.key })
      .populate('lastModifiedBy', 'username');

    if (!setting) {
      return res.status(404).json({ success: false, message: 'Setting not found' });
    }

    res.json({ success: true, setting });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateSetting = async (req, res) => {
  try {
    const { settingValue, description } = req.body;

    let setting = await Settings.findOne({ settingKey: req.params.key });

    if (setting) {
      setting.settingValue = settingValue;
      if (description) setting.description = description;
      setting.lastModifiedBy = req.user._id;
      await setting.save();
    } else {
      setting = await Settings.create({
        settingKey: req.params.key,
        settingValue,
        description,
        lastModifiedBy: req.user._id
      });
    }

    res.json({
      success: true,
      message: 'Setting updated successfully',
      setting
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createSetting = async (req, res) => {
  try {
    const { settingKey, settingValue, description, category } = req.body;

    const existingSetting = await Settings.findOne({ settingKey });
    if (existingSetting) {
      return res.status(400).json({ success: false, message: 'Setting already exists' });
    }

    const setting = await Settings.create({
      settingKey,
      settingValue,
      description,
      category,
      lastModifiedBy: req.user._id
    });

    res.status(201).json({
      success: true,
      message: 'Setting created successfully',
      setting
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteSetting = async (req, res) => {
  try {
    const setting = await Settings.findOne({ settingKey: req.params.key });

    if (!setting) {
      return res.status(404).json({ success: false, message: 'Setting not found' });
    }

    await setting.deleteOne();

    res.json({
      success: true,
      message: 'Setting deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getSettingsByCategory = async (req, res) => {
  try {
    const settings = await Settings.find()
      .populate('lastModifiedBy', 'username')
      .sort({ category: 1, settingKey: 1 });

    // Group settings by category
    const grouped = settings.reduce((acc, setting) => {
      const category = setting.category || 'general';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(setting);
      return acc;
    }, {});

    res.json({ success: true, settings: grouped });
  } catch (error) {
    logger.error('Error in getSettingsByCategory:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const bulkUpdateSettings = async (req, res) => {
  try {
    const { settings } = req.body; // Array of { settingKey, settingValue }

    if (!Array.isArray(settings)) {
      return res.status(400).json({ success: false, message: 'Settings must be an array' });
    }

    const updatePromises = settings.map(async ({ settingKey, settingValue }) => {
      try {
        const setting = await Settings.findOne({ settingKey });
        if (setting) {
          setting.settingValue = settingValue;
          setting.lastModifiedBy = req.user._id;
          await setting.save();
          return { success: true, settingKey };
        } else {
          logger.warn(`Setting not found: ${settingKey}`);
          return { success: false, settingKey, error: 'Setting not found' };
        }
      } catch (error) {
        logger.error(`Error updating setting ${settingKey}:`, error);
        return { success: false, settingKey, error: error.message };
      }
    });

    const results = await Promise.all(updatePromises);
    const failed = results.filter(r => !r.success);

    if (failed.length > 0) {
      logger.warn('Some settings failed to update:', failed);
    }

    res.json({
      success: true,
      message: 'Settings updated successfully',
      results
    });
  } catch (error) {
    logger.error('Bulk update error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
