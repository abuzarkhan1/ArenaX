import Settings from '../models/Settings.js';
import logger from '../config/logger.js';

// Default settings configuration
const defaultSettings = [
  // Economy Settings
  { settingKey: 'coin_conversion_rate', settingValue: 1, description: '1 AX Coin = PKR conversion rate', category: 'economy' },
  { settingKey: 'minimum_deposit_amount', settingValue: 50, description: 'Minimum deposit amount in PKR', category: 'economy' },
  { settingKey: 'minimum_withdrawal_amount', settingValue: 100, description: 'Minimum withdrawal amount in PKR', category: 'economy' },
  { settingKey: 'withdrawal_fee_percentage', settingValue: 0, description: 'Withdrawal fee percentage (0-100)', category: 'economy' },
  { settingKey: 'new_user_bonus_coins', settingValue: 100, description: 'Bonus coins for new user registration', category: 'economy' },
  { settingKey: 'referral_bonus_coins', settingValue: 50, description: 'Bonus coins for successful referral', category: 'economy' },

  // Platform Settings
  { settingKey: 'platform_name', settingValue: 'ArenaX', description: 'Platform name', category: 'platform' },
  { settingKey: 'platform_tagline', settingValue: 'Ultimate Gaming Tournament Platform', description: 'Platform tagline/description', category: 'platform' },
  { settingKey: 'support_email', settingValue: 'support@arenax.com', description: 'Support email address', category: 'platform' },
  { settingKey: 'support_phone', settingValue: '+92-300-0000000', description: 'Support phone number', category: 'platform' },
  { settingKey: 'maintenance_mode', settingValue: false, description: 'Platform maintenance mode', category: 'platform' },
  { settingKey: 'registration_enabled', settingValue: true, description: 'User registration enabled', category: 'platform' },
  { settingKey: 'max_tournament_participants', settingValue: 100, description: 'Maximum tournament participants limit', category: 'platform' },

  // Payment Settings
  { settingKey: 'easypaisa_account', settingValue: '03001234567', description: 'Easypaisa account number', category: 'payment' },
  { settingKey: 'jazzcash_account', settingValue: '03001234567', description: 'JazzCash account number', category: 'payment' },
  { settingKey: 'bank_account_details', settingValue: 'Bank: HBL, Account: 1234567890, Title: ArenaX', description: 'Bank account details', category: 'payment' },
  { settingKey: 'payment_processing_time', settingValue: 24, description: 'Payment processing time in hours', category: 'payment' },
  { settingKey: 'auto_approve_deposits', settingValue: false, description: 'Auto-approve deposit requests', category: 'payment' },
  { settingKey: 'auto_approve_withdrawals', settingValue: false, description: 'Auto-approve withdrawal requests', category: 'payment' },

  // Tournament Settings
  { settingKey: 'min_tournament_entry_fee', settingValue: 10, description: 'Minimum tournament entry fee in coins', category: 'general' },
  { settingKey: 'max_tournament_entry_fee', settingValue: 10000, description: 'Maximum tournament entry fee in coins', category: 'general' },
  { settingKey: 'tournament_approval_required', settingValue: true, description: 'Tournament approval required', category: 'general' },
  { settingKey: 'auto_start_tournaments', settingValue: false, description: 'Auto-start tournaments when full', category: 'general' },
  { settingKey: 'tournament_cancellation_refund', settingValue: 100, description: 'Tournament cancellation refund percentage', category: 'general' },

  // Notification Settings
  { settingKey: 'email_notifications_enabled', settingValue: true, description: 'Email notifications enabled', category: 'general' },
  { settingKey: 'push_notifications_enabled', settingValue: true, description: 'Push notifications enabled', category: 'general' },
  { settingKey: 'sms_notifications_enabled', settingValue: false, description: 'SMS notifications enabled', category: 'general' },
  { settingKey: 'notification_retention_days', settingValue: 30, description: 'Notification retention days', category: 'general' },
];

export const initializeDefaultSettings = async () => {
  try {
    // Check if any settings exist
    const existingCount = await Settings.countDocuments();
    
    if (existingCount > 0) {
      logger.info(`Settings already initialized (${existingCount} settings found)`);
      return;
    }
    
    logger.info('Initializing default settings...');
    
    for (const setting of defaultSettings) {
      await Settings.create(setting);
      logger.info(`Created setting: ${setting.settingKey}`);
    }
    
    logger.info('Default settings initialized successfully');
  } catch (error) {
    logger.error('Error initializing default settings:', error);
  }
};

// Run initialization if this file is executed directly
if (import.meta.url === `file://${process.argv[1].replace(/\\/g, '/')}`) {
  import('dotenv').then((dotenv) => {
    dotenv.default.config({ path: '../.env' });
    
    import('../config/database.js').then(({ default: connectDB }) => {
      connectDB().then(() => {
        initializeDefaultSettings().then(() => {
          console.log('Settings seeder completed');
          process.exit(0);
        }).catch((error) => {
          console.error('Seeder error:', error);
          process.exit(1);
        });
      }).catch((error) => {
        console.error('Database connection error:', error);
        process.exit(1);
      });
    });
  });
}
