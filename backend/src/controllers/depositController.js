import Deposit from '../models/Deposit.js';
import User from '../models/User.js';
import Transaction from '../models/Transaction.js';
import { sendEmail } from '../utils/email.js';
import { createAdminNotification } from './adminNotificationController.js';

const ADMIN_EMAIL = 'abuzarkhan1242@gmail.com';

const sendDepositEmails = async (deposit, user) => {
  try {
    // User notification email
    const userEmailSubject = 'ArenaX Deposit Request Received';
    const userEmailText = `Your deposit request has been received and is pending admin approval.\n\nAmount: ${deposit.amount} AX Coins\nPayment Method: ${deposit.paymentMethod}\nAccount: ${deposit.accountNumber}\n\nWe'll notify you once it's processed.`;
    const userEmailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(180deg, #0B0B0F 0%, #1A1A2E 100%); color: #E5E7EB; padding: 30px; border-radius: 15px; border: 1px solid rgba(0, 229, 255, 0.3);">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #00E5FF; font-size: 36px; margin: 0;">ArenaX</h1>
          <p style="color: #9CA3AF; margin-top: 5px;">Gaming Platform</p>
        </div>
        
        <div style="background: linear-gradient(135deg, rgba(251, 191, 36, 0.15) 0%, rgba(245, 158, 11, 0.15) 100%); padding: 25px; border-radius: 12px; border: 1px solid rgba(251, 191, 36, 0.3); margin-bottom: 25px;">
          <h2 style="color: #FCD34D; margin-top: 0;">⏳ Deposit Request Received</h2>
          <p style="font-size: 16px; line-height: 1.6;">Dear <strong>${user.username}</strong>,</p>
          <p style="font-size: 16px; line-height: 1.6;">We've received your deposit request and it's now <strong style="color: #FCD34D;">pending admin verification</strong>.</p>
        </div>

        <div style="background: rgba(11, 11, 15, 0.6); padding: 20px; border-radius: 10px; border: 1px solid rgba(138, 43, 226, 0.3); margin-bottom: 25px;">
          <h3 style="color: #00E5FF; margin-top: 0;">Deposit Details</h3>
          <table style="width: 100%; color: #E5E7EB;">
            <tr>
              <td style="padding: 8px 0;"><strong>Amount:</strong></td>
              <td style="padding: 8px 0; text-align: right; color: #FCD34D; font-size: 18px; font-weight: bold;">${deposit.amount} AX Coins</td>
            </tr>
            <tr>
              <td style="padding: 8px 0;"><strong>Payment Method:</strong></td>
              <td style="padding: 8px 0; text-align: right;">${deposit.paymentMethod}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0;"><strong>From Account:</strong></td>
              <td style="padding: 8px 0; text-align: right;">${deposit.accountNumber}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0;"><strong>Status:</strong></td>
              <td style="padding: 8px 0; text-align: right; color: #FCD34D;">Pending Verification</td>
            </tr>
          </table>
        </div>

        <div style="background: rgba(251, 191, 36, 0.1); padding: 18px; border-radius: 10px; border: 1px solid rgba(251, 191, 36, 0.3); margin-bottom: 25px;">
          <p style="margin: 0; color: #FCD34D; font-size: 14px;">
            <strong>⏰ Next Steps:</strong> Our admin team will verify your payment screenshot and approve your deposit. Once verified, the coins will be added to your account and you'll receive a confirmation email.
          </p>
        </div>

        <p style="color: #9CA3AF; font-size: 14px; line-height: 1.6;">
          This usually takes a few minutes to a few hours. Thank you for your patience!
        </p>

        <div style="border-top: 1px solid rgba(0, 229, 255, 0.2); margin-top: 30px; padding-top: 20px; text-align: center;">
          <p style="color: #6B7280; font-size: 12px; margin: 0;">© 2025 ArenaX. All rights reserved.</p>
          <p style="color: #4B5563; font-size: 11px; margin-top: 5px;">This is an automated message. Please do not reply.</p>
        </div>
      </div>
    `;

    // Admin notification email
    const adminEmailSubject = '🔔 New Deposit Request - ArenaX';
    const adminEmailText = `New deposit request received!\n\nUser: ${user.username} (${user.email})\nAmount: ${deposit.amount} AX Coins\nPayment Method: ${deposit.paymentMethod}\nAccount Number: ${deposit.accountNumber}\n\nPlease log in to the admin panel to review and process this request.`;
    const adminEmailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(180deg, #0B0B0F 0%, #1A1A2E 100%); color: #E5E7EB; padding: 30px; border-radius: 15px; border: 1px solid rgba(0, 229, 255, 0.3);">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #00E5FF; font-size: 36px; margin: 0;">ArenaX Admin</h1>
          <p style="color: #9CA3AF; margin-top: 5px;">New Deposit Request</p>
        </div>
        
        <div style="background: linear-gradient(135deg, rgba(0, 229, 255, 0.15) 0%, rgba(13, 89, 242, 0.15) 100%); padding: 25px; border-radius: 12px; border: 1px solid rgba(0, 229, 255, 0.3); margin-bottom: 25px;">
          <h2 style="color: #00E5FF; margin-top: 0;">🔔 Action Required</h2>
          <p style="font-size: 16px; line-height: 1.6;">A new deposit request has been submitted and requires your review.</p>
        </div>

        <div style="background: rgba(11, 11, 15, 0.6); padding: 20px; border-radius: 10px; border: 1px solid rgba(138, 43, 226, 0.3); margin-bottom: 25px;">
          <h3 style="color: #00E5FF; margin-top: 0;">User Information</h3>
          <table style="width: 100%; color: #E5E7EB;">
            <tr>
              <td style="padding: 8px 0;"><strong>Username:</strong></td>
              <td style="padding: 8px 0; text-align: right;">${user.username}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0;"><strong>Email:</strong></td>
              <td style="padding: 8px 0; text-align: right;">${user.email}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0;"><strong>Current Balance:</strong></td>
              <td style="padding: 8px 0; text-align: right;">${user.coinBalance} AX Coins</td>
            </tr>
          </table>
        </div>

        <div style="background: rgba(11, 11, 15, 0.6); padding: 20px; border-radius: 10px; border: 1px solid rgba(251, 191, 36, 0.3); margin-bottom: 25px;">
          <h3 style="color: #FCD34D; margin-top: 0;">Deposit Details</h3>
          <table style="width: 100%; color: #E5E7EB;">
            <tr>
              <td style="padding: 8px 0;"><strong>Amount:</strong></td>
              <td style="padding: 8px 0; text-align: right; color: #FCD34D; font-size: 18px; font-weight: bold;">${deposit.amount} AX Coins</td>
            </tr>
            <tr>
              <td style="padding: 8px 0;"><strong>Payment Method:</strong></td>
              <td style="padding: 8px 0; text-align: right;">${deposit.paymentMethod}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0;"><strong>From Account:</strong></td>
              <td style="padding: 8px 0; text-align: right;">${deposit.accountNumber}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0;"><strong>Request ID:</strong></td>
              <td style="padding: 8px 0; text-align: right; font-family: monospace;">${deposit._id}</td>
            </tr>
          </table>
        </div>

        <div style="text-align: center; margin-top: 25px;">
          <a href="${process.env.ADMIN_URL || 'http://localhost:5173/admin'}/deposits" style="display: inline-block; background: linear-gradient(135deg, #00E5FF 0%, #0d59f2 100%); color: white; text-decoration: none; padding: 15px 40px; border-radius: 10px; font-weight: bold; font-size: 16px;">Review Deposit Request</a>
        </div>

        <div style="border-top: 1px solid rgba(0, 229, 255, 0.2); margin-top: 30px; padding-top: 20px; text-align: center;">
          <p style="color: #6B7280; font-size: 12px; margin: 0;">© 2025 ArenaX. All rights reserved.</p>
          <p style="color: #4B5563; font-size: 11px; margin-top: 5px;">This is an automated admin notification.</p>
        </div>
      </div>
    `;

    // Send both emails in parallel
    await Promise.allSettled([
      sendEmail(user.email, userEmailSubject, userEmailText, userEmailHtml),
      sendEmail(ADMIN_EMAIL, adminEmailSubject, adminEmailText, adminEmailHtml)
    ]);

  } catch (error) {
    console.error('Failed to send deposit notification emails:', error);
    // Don't throw - emails are non-critical
  }
};

export const createDepositRequest = async (req, res) => {
  try {
    const { amount, paymentMethod, accountNumber, screenshot } = req.body;
    const userId = req.user._id;

    // Validation
    if (amount < 50) {
      return res.status(400).json({
        success: false,
        message: 'Minimum deposit amount is 50 AX coins'
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (!paymentMethod || !accountNumber) {
      return res.status(400).json({
        success: false,
        message: 'Payment method and account number are required'
      });
    }

    if (!screenshot) {
      return res.status(400).json({
        success: false,
        message: 'Payment screenshot is required'
      });
    }

    // Normalize screenshot format
    let screenshotData = screenshot;
    if (!screenshot.startsWith('data:image')) {
      screenshotData = `data:image/jpeg;base64,${screenshot}`;
    }

    // Create deposit record
    const deposit = await Deposit.create({
      userId,
      amount,
      paymentMethod,
      accountNumber,
      screenshot: screenshotData,
      status: 'pending'
    });

    // ✅ KEY CHANGE: Create PENDING transaction (don't change balance yet)
    await Transaction.create({
      userId,
      transactionType: 'credit',
      amount,
      balanceBefore: user.coinBalance,
      balanceAfter: user.coinBalance, // ✅ Balance stays same until approved
      category: 'deposit', // ✅ Changed from 'purchase' to 'deposit'
      description: `Deposit request - ${paymentMethod}`,
      paymentMethod,
      status: 'pending', // ✅ Set as pending
      relatedRequest: deposit._id, // ✅ Link to deposit
      requestModel: 'Deposit', // ✅ Link model type
      metadata: {
        accountNumber,
        hasScreenshot: true
      }
    });

    // 🎯 RESPOND IMMEDIATELY
    res.status(201).json({
      success: true,
      message: 'Deposit request submitted successfully. Pending admin verification.',
      deposit
    });

    // 🔥 Send emails asynchronously in the background
    sendDepositEmails(deposit, user).catch(err => {
      console.error('Background email error:', err);
    });

    // Create admin notification asynchronously
    setImmediate(async () => {
      try {
        const notification = await createAdminNotification(
          'deposit_created',
          'New Deposit Request',
          `${user.username} requested deposit of ${amount} AX coins via ${paymentMethod}`,
          user._id,
          { id: deposit._id, model: 'Deposit' },
          { amount, paymentMethod, accountNumber }
        );

        // Emit socket event for real-time notification
        if (req.io) {
          req.io.emit('admin_notification', {
            id: notification._id,
            type: notification.type,
            title: notification.title,
            message: notification.message,
            relatedUser: {
              _id: user._id,
              username: user.username,
              email: user.email
            },
            relatedEntity: {
              id: deposit._id,
              amount: deposit.amount,
              paymentMethod: deposit.paymentMethod
            },
            createdAt: notification.createdAt
          });
        }
      } catch (error) {
        console.error('Failed to create admin notification:', error);
      }
    });

  } catch (error) {
    console.error('Deposit request error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const getUserDeposits = async (req, res) => {
  try {
    const userId = req.user._id;
    const { page = 1, limit = 5 } = req.query;

    const skip = (page - 1) * limit;

    const deposits = await Deposit.find({ userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Deposit.countDocuments({ userId });

    res.json({
      success: true,
      deposits,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const getAllDeposits = async (req, res) => {
  try {
    const { status, page = 1, limit = 50 } = req.query;

    const query = {};
    if (status) query.status = status;

    const skip = (page - 1) * limit;

    const deposits = await Deposit.find(query)
      .populate('userId', 'username email phoneNumber coinBalance')
      .populate('processedBy', 'username')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Deposit.countDocuments(query);

    res.json({
      success: true,
      deposits,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const updateDepositStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminNote, transactionId } = req.body;
    const adminId = req.user._id;

    const deposit = await Deposit.findById(id).populate('userId', 'username email coinBalance');
    if (!deposit) {
      return res.status(404).json({
        success: false,
        message: 'Deposit request not found'
      });
    }

    if (deposit.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Cannot update deposit. Current status: ${deposit.status}`
      });
    }

    // ✅ Handle rejection
    if (status === 'rejected') {
      // Update deposit status
      deposit.status = status;
      deposit.adminNote = adminNote || '';
      deposit.processedBy = adminId;
      deposit.processedAt = new Date();
      await deposit.save();

      // ✅ Update transaction to rejected (don't change balance)
      await Transaction.findOneAndUpdate(
        { 
          relatedRequest: deposit._id,
          requestModel: 'Deposit'
        },
        { 
          status: 'rejected',
          processedBy: adminId,
          rejectionReason: adminNote || 'Deposit request rejected'
        }
      );

      // Respond immediately
      res.json({
        success: true,
        message: `Deposit ${status} successfully`,
        deposit
      });

      // Send rejection email asynchronously
      setImmediate(async () => {
        try {
          const emailSubject = 'ArenaX Deposit Request Rejected';
          const emailText = `Your deposit request of ${deposit.amount} AX coins has been rejected.\n\nReason: ${adminNote || 'Payment verification failed. Please contact support for details.'}\n\nPlease try again or contact support if you believe this is an error.`;
          const emailHtml = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(180deg, #0B0B0F 0%, #1A1A2E 100%); color: #E5E7EB; padding: 30px; border-radius: 15px; border: 1px solid rgba(239, 68, 68, 0.3);">
              <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #00E5FF; font-size: 36px; margin: 0;">ArenaX</h1>
                <p style="color: #9CA3AF; margin-top: 5px;">Gaming Platform</p>
              </div>
              
              <div style="background: linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(220, 38, 38, 0.15) 100%); padding: 25px; border-radius: 12px; border: 1px solid rgba(239, 68, 68, 0.3); margin-bottom: 25px;">
                <h2 style="color: #EF4444; margin-top: 0;">❌ Deposit Request Rejected</h2>
                <p style="font-size: 16px; line-height: 1.6;">Dear <strong>${deposit.userId.username}</strong>,</p>
                <p style="font-size: 16px; line-height: 1.6;">We regret to inform you that your deposit request has been <strong style="color: #EF4444;">rejected</strong>.</p>
              </div>

              <div style="background: rgba(11, 11, 15, 0.6); padding: 20px; border-radius: 10px; border: 1px solid rgba(138, 43, 226, 0.3); margin-bottom: 25px;">
                <h3 style="color: #00E5FF; margin-top: 0;">Rejection Details</h3>
                <table style="width: 100%; color: #E5E7EB;">
                  <tr>
                    <td style="padding: 8px 0;"><strong>Amount:</strong></td>
                    <td style="padding: 8px 0; text-align: right; color: #EF4444; font-size: 18px; font-weight: bold;">${deposit.amount} AX Coins</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0;"><strong>Payment Method:</strong></td>
                    <td style="padding: 8px 0; text-align: right;">${deposit.paymentMethod}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0;"><strong>From Account:</strong></td>
                    <td style="padding: 8px 0; text-align: right;">${deposit.accountNumber}</td>
                  </tr>
                </table>
              </div>

              ${adminNote ? `
              <div style="background: rgba(239, 68, 68, 0.1); padding: 18px; border-radius: 10px; border: 1px solid rgba(239, 68, 68, 0.3); margin-bottom: 25px;">
                <p style="margin: 0; color: #FCA5A5; font-size: 14px;">
                  <strong>📝 Reason:</strong> ${adminNote}
                </p>
              </div>
              ` : ''}

              <p style="color: #9CA3AF; font-size: 14px; line-height: 1.6;">
                If you believe this is an error or have questions, please contact our support team with your deposit details.
              </p>

              <div style="border-top: 1px solid rgba(0, 229, 255, 0.2); margin-top: 30px; padding-top: 20px; text-align: center;">
                <p style="color: #6B7280; font-size: 12px; margin: 0;">© 2025 ArenaX. All rights reserved.</p>
                <p style="color: #4B5563; font-size: 11px; margin-top: 5px;">This is an automated message. Please do not reply.</p>
              </div>
            </div>
          `;
          await sendEmail(deposit.userId.email, emailSubject, emailText, emailHtml);
        } catch (emailError) {
          console.error('Failed to send rejection email:', emailError);
        }
      });

      return;
    }

    // ✅ Handle approval - NOW we update the balance
    if (status === 'approved' || status === 'completed') {
      const user = await User.findById(deposit.userId._id);
      const balanceBefore = user.coinBalance;
      
      // ✅ NOW add the coins
      user.coinBalance += deposit.amount;
      user.totalCoinsEarned += deposit.amount;
      await user.save();

      // ✅ Update transaction to approved with new balance
      await Transaction.findOneAndUpdate(
        { 
          relatedRequest: deposit._id,
          requestModel: 'Deposit'
        },
        { 
          status: 'approved',
          balanceAfter: user.coinBalance, // ✅ NOW update balance
          processedBy: adminId,
          paymentReference: transactionId || deposit._id.toString()
        }
      );

      // Update deposit status
      deposit.status = status;
      deposit.adminNote = adminNote || '';
      deposit.transactionId = transactionId || '';
      deposit.processedBy = adminId;
      deposit.processedAt = new Date();
      await deposit.save();

      // Respond immediately
      res.json({
        success: true,
        message: `Deposit ${status} successfully`,
        deposit
      });

      // Send approval email asynchronously
      setImmediate(async () => {
        try {
          const emailSubject = 'ArenaX Deposit Approved - Coins Added!';
          const emailText = `Great news! Your deposit has been approved and coins have been added to your account.\n\nAmount: ${deposit.amount} AX Coins\nPayment Method: ${deposit.paymentMethod}\n${transactionId ? `Transaction ID: ${transactionId}\n` : ''}New Balance: ${user.coinBalance} AX Coins\n\nStart playing now!`;
          const emailHtml = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(180deg, #0B0B0F 0%, #1A1A2E 100%); color: #E5E7EB; padding: 30px; border-radius: 15px; border: 1px solid rgba(0, 229, 255, 0.3);">
              <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #00E5FF; font-size: 36px; margin: 0;">ArenaX</h1>
                <p style="color: #9CA3AF; margin-top: 5px;">Gaming Platform</p>
              </div>
              
              <div style="background: linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(5, 150, 105, 0.15) 100%); padding: 25px; border-radius: 12px; border: 1px solid rgba(16, 185, 129, 0.3); margin-bottom: 25px;">
                <h2 style="color: #10B981; margin-top: 0;">✅ Deposit Approved - Coins Added!</h2>
                <p style="font-size: 16px; line-height: 1.6;">Dear <strong>${deposit.userId.username}</strong>,</p>
                <p style="font-size: 16px; line-height: 1.6;">Congratulations! Your deposit has been <strong style="color: #10B981;">verified and approved</strong>. The coins have been added to your account.</p>
              </div>

              <div style="background: rgba(11, 11, 15, 0.6); padding: 20px; border-radius: 10px; border: 1px solid rgba(138, 43, 226, 0.3); margin-bottom: 25px;">
                <h3 style="color: #00E5FF; margin-top: 0;">Deposit Details</h3>
                <table style="width: 100%; color: #E5E7EB;">
                  <tr>
                    <td style="padding: 8px 0;"><strong>Amount:</strong></td>
                    <td style="padding: 8px 0; text-align: right; color: #10B981; font-size: 18px; font-weight: bold;">+${deposit.amount} AX Coins</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0;"><strong>Payment Method:</strong></td>
                    <td style="padding: 8px 0; text-align: right;">${deposit.paymentMethod}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0;"><strong>From Account:</strong></td>
                    <td style="padding: 8px 0; text-align: right;">${deposit.accountNumber}</td>
                  </tr>
                  ${transactionId ? `
                  <tr>
                    <td style="padding: 8px 0;"><strong>Transaction ID:</strong></td>
                    <td style="padding: 8px 0; text-align: right; color: #00E5FF; font-family: monospace;">${transactionId}</td>
                  </tr>
                  ` : ''}
                  <tr>
                    <td style="padding: 8px 0;"><strong>New Balance:</strong></td>
                    <td style="padding: 8px 0; text-align: right; color: #FCD34D; font-size: 18px; font-weight: bold;">${user.coinBalance} AX Coins</td>
                  </tr>
                </table>
              </div>

              <div style="background: rgba(16, 185, 129, 0.1); padding: 18px; border-radius: 10px; border: 1px solid rgba(16, 185, 129, 0.3); margin-bottom: 25px;">
                <p style="margin: 0; color: #6EE7B7; font-size: 14px;">
                  <strong>🎮 Ready to Play:</strong> Your coins are now available in your account. You can join tournaments and start competing now!
                </p>
              </div>

              ${adminNote ? `
              <div style="background: rgba(138, 43, 226, 0.1); padding: 15px; border-radius: 8px; border: 1px solid rgba(138, 43, 226, 0.3); margin-bottom: 25px;">
                <p style="margin: 0; color: #C4B5FD; font-size: 13px;"><strong>📝 Admin Note:</strong> ${adminNote}</p>
              </div>
              ` : ''}

              <div style="border-top: 1px solid rgba(0, 229, 255, 0.2); margin-top: 30px; padding-top: 20px; text-align: center;">
                <p style="color: #6B7280; font-size: 12px; margin: 0;">© 2025 ArenaX. All rights reserved.</p>
                <p style="color: #4B5563; font-size: 11px; margin-top: 5px;">This is an automated message. Please do not reply.</p>
              </div>
            </div>
          `;
          await sendEmail(deposit.userId.email, emailSubject, emailText, emailHtml);
        } catch (emailError) {
          console.error('Failed to send approval email:', emailError);
        }
      });

      return;
    }

  } catch (error) {
    console.error('Update deposit status error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};