import Settings from '../models/Settings.js';

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
      setting.lastModifiedBy = req.admin._id;
      await setting.save();
    } else {
      setting = await Settings.create({
        settingKey: req.params.key,
        settingValue,
        description,
        lastModifiedBy: req.admin._id
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
      lastModifiedBy: req.admin._id
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
