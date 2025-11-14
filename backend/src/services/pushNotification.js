import axios from 'axios';

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';
const BATCH_SIZE = 100;

/**
 * Validate if a token is a valid Expo push token
 */
export const isValidExpoPushToken = (token) => {
  return token && 
         typeof token === 'string' && 
         token.startsWith('ExponentPushToken[') &&
         token.endsWith(']');
};

/**
 * Send push notifications via Expo Push API
 */
export const sendPushNotifications = async (pushTokens, notification) => {
  try {
    console.log('\n📤 Sending Push Notifications');
    console.log(`Total tokens: ${pushTokens.length}`);

    // Filter valid tokens
    const validTokens = pushTokens.filter(isValidExpoPushToken);
    console.log(`✅ Valid tokens: ${validTokens.length}/${pushTokens.length}`);

    if (validTokens.length === 0) {
      return { 
        success: false, 
        message: 'No valid tokens',
        sentCount: 0,
        errors: []
      };
    }

    const allResults = [];
    const allErrors = [];
    let totalSent = 0;

    // Send in batches of 100
    for (let i = 0; i < validTokens.length; i += BATCH_SIZE) {
      const batch = validTokens.slice(i, i + BATCH_SIZE);
      console.log(`  Sending batch ${Math.floor(i/BATCH_SIZE) + 1}: ${batch.length} tokens`);
      
      try {
        // Prepare messages
        const messages = batch.map(token => ({
          to: token,
          sound: 'default',
          title: notification.title,
          body: notification.body,
          data: notification.data || {},
          priority: 'high',
          channelId: 'default',
          badge: notification.badge || 0,
        }));

        // Send batch
        const response = await axios.post(EXPO_PUSH_URL, messages, {
          headers: {
            'Accept': 'application/json',
            'Accept-Encoding': 'gzip, deflate',
            'Content-Type': 'application/json',
          },
        });

        console.log(`  ✅ Batch sent. Status: ${response.status}`);
        
        // Process response
        if (response.data && response.data.data) {
          response.data.data.forEach((item, index) => {
            if (item.status === 'ok') {
              totalSent++;
              allResults.push(item);
            } else if (item.status === 'error') {
              console.error(`  ❌ Error for token ${index}:`, item.message);
              allErrors.push({
                token: batch[index],
                error: item.message,
                details: item.details
              });
            }
          });
        }
        
      } catch (error) {
        console.error(`❌ Error sending batch:`, error.response?.data || error.message);
        allErrors.push({
          batch: Math.floor(i/BATCH_SIZE) + 1,
          error: error.message,
          details: error.response?.data
        });
      }
    }

    console.log(`\n📊 Summary: ${totalSent}/${validTokens.length} sent, ${allErrors.length} errors\n`);

    return {
      success: totalSent > 0,
      sentCount: totalSent,
      totalTokens: validTokens.length,
      errors: allErrors,
      results: allResults
    };

  } catch (error) {
    console.error('\n❌ Fatal Error:', error.message);
    throw new Error(`Failed to send push notifications: ${error.message}`);
  }
};

export const sendSinglePushNotification = async (pushToken, notification) => {
  if (!isValidExpoPushToken(pushToken)) {
    throw new Error('Invalid Expo push token format');
  }
  return sendPushNotifications([pushToken], notification);
};

export const validatePushTokens = (pushTokens) => {
  const valid = [];
  const invalid = [];
  
  pushTokens.forEach(token => {
    if (isValidExpoPushToken(token)) {
      valid.push(token);
    } else {
      invalid.push(token);
    }
  });
  
  return {
    valid,
    invalid,
    validCount: valid.length,
    invalidCount: invalid.length,
    totalCount: pushTokens.length
  };
};

export default {
  sendPushNotifications,
  sendSinglePushNotification,
  isValidExpoPushToken,
  validatePushTokens
};