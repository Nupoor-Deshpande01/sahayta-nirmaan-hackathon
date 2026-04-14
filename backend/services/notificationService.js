/**
 * Mock Twilio Notification Service
 */

exports.sendSMS = async (to, message) => {
  // In a real app, integrate twilio client
  // const client = require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  
  console.log(`\n[SMS SENT TO ${to}]`);
  console.log(`MESSAGE: ${message}\n`);
  
  return Promise.resolve({ success: true, messageId: 'SM' + Math.random().toString(36).substring(7) });
};
