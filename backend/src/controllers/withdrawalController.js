import Withdrawal from '../models/Withdrawal.js';
import User from '../models/User.js';
import Transaction from '../models/Transaction.js';
import { sendEmail } from '../utils/email.js';

export const createWithdrawalRequest = async (req, res) => {
  try {
    const { amount, paymentMethod, accountNumber, password } = req.body;
    const userId = req.user._id;

    // Validate password is provided
    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Password is required to confirm withdrawal'
      });
    }

    // Validate minimum amount
    if (amount < 100) {
      return res.status(400).json({
        success: false,
        message: 'Minimum withdrawal amount is 100 AX coins'
      });
    }

    // Get user with password field
    const user = await User.findById(userId).select('+password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Verify password using the matchPassword method
    const isPasswordValid = await user.matchPassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid password. Please try again.'
      });
    }

    // Check sufficient balance
    if (user.coinBalance < amount) {
      return res.status(400).json({
        success: false,
        message: `Insufficient balance. You have ${user.coinBalance} AX coins`
      });
    }

    // Validate payment details
    if (!paymentMethod || !accountNumber) {
      return res.status(400).json({
        success: false,
        message: 'Payment method and account number are required'
      });
    }

    // Create withdrawal request
    const withdrawal = await Withdrawal.create({
      userId,
      amount,
      paymentMethod,
      accountNumber,
      status: 'pending'
    });

    // ✅ KEY CHANGE: DON'T deduct balance yet, just create PENDING transaction
    const balanceBefore = user.coinBalance;

    // Create transaction record with PENDING status
    await Transaction.create({
      userId,
      transactionType: 'debit',
      amount,
      balanceBefore: balanceBefore,
      balanceAfter: balanceBefore, // ✅ Balance stays same until approved
      category: 'withdrawal',
      description: `Withdrawal request - ${paymentMethod}`,
      paymentMethod,
      status: 'pending', // ✅ Set as pending
      relatedRequest: withdrawal._id, // ✅ Link to withdrawal
      requestModel: 'Withdrawal', // ✅ Link model type
      metadata: {
        accountNumber
      }
    });

    res.status(201).json({
      success: true,
      message: 'Withdrawal request submitted successfully. Pending admin approval.',
      withdrawal
    });

    // Send confirmation email asynchronously
    setImmediate(async () => {
      try {
        const emailSubject = 'ArenaX Withdrawal Request Received';
        const emailText = `Your withdrawal request has been received and is pending admin approval.\n\nAmount: ${amount} AX Coins\nPayment Method: ${paymentMethod}\nAccount: ${accountNumber}\n\nWe'll notify you once it's processed.`;
        const emailHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(180deg, #0B0B0F 0%, #1A1A2E 100%); color: #E5E7EB; padding: 30px; border-radius: 15px; border: 1px solid rgba(0, 229, 255, 0.3);">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #00E5FF; font-size: 36px; margin: 0;">ArenaX</h1>
              <p style="color: #9CA3AF; margin-top: 5px;">Gaming Platform</p>
            </div>
            
            <div style="background: linear-gradient(135deg, rgba(251, 191, 36, 0.15) 0%, rgba(245, 158, 11, 0.15) 100%); padding: 25px; border-radius: 12px; border: 1px solid rgba(251, 191, 36, 0.3); margin-bottom: 25px;">
              <h2 style="color: #FCD34D; margin-top: 0;">⏳ Withdrawal Request Received</h2>
              <p style="font-size: 16px; line-height: 1.6;">Dear <strong>${user.username}</strong>,</p>
              <p style="font-size: 16px; line-height: 1.6;">We've received your withdrawal request and it's now <strong style="color: #FCD34D;">pending admin approval</strong>.</p>
            </div>

            <div style="background: rgba(11, 11, 15, 0.6); padding: 20px; border-radius: 10px; border: 1px solid rgba(138, 43, 226, 0.3); margin-bottom: 25px;">
              <h3 style="color: #00E5FF; margin-top: 0;">Withdrawal Details</h3>
              <table style="width: 100%; color: #E5E7EB;">
                <tr>
                  <td style="padding: 8px 0;"><strong>Amount:</strong></td>
                  <td style="padding: 8px 0; text-align: right; color: #FCD34D; font-size: 18px; font-weight: bold;">${amount} AX Coins</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0;"><strong>Payment Method:</strong></td>
                  <td style="padding: 8px 0; text-align: right;">${paymentMethod}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0;"><strong>Account Number:</strong></td>
                  <td style="padding: 8px 0; text-align: right;">${accountNumber}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0;"><strong>Status:</strong></td>
                  <td style="padding: 8px 0; text-align: right; color: #FCD34D;">Pending Review</td>
                </tr>
              </table>
            </div>

            <div style="background: rgba(251, 191, 36, 0.1); padding: 18px; border-radius: 10px; border: 1px solid rgba(251, 191, 36, 0.3); margin-bottom: 25px;">
              <p style="margin: 0; color: #FCD34D; font-size: 14px;">
                <strong>⏰ Next Steps:</strong> Our admin team will review your request shortly. Once approved, we'll send the money to your ${paymentMethod} account and notify you via email.
              </p>
            </div>

            <p style="color: #9CA3AF; font-size: 14px; line-height: 1.6;">
              Your balance will remain unchanged until the request is approved. If rejected, you can resubmit another request.
            </p>

            <div style="border-top: 1px solid rgba(0, 229, 255, 0.2); margin-top: 30px; padding-top: 20px; text-align: center;">
              <p style="color: #6B7280; font-size: 12px; margin: 0;">© 2025 ArenaX. All rights reserved.</p>
              <p style="color: #4B5563; font-size: 11px; margin-top: 5px;">This is an automated message. Please do not reply.</p>
            </div>
          </div>
        `;
        await sendEmail(user.email, emailSubject, emailText, emailHtml);
      } catch (emailError) {
        console.error('Failed to send confirmation email:', emailError);
      }
    });

  } catch (error) {
    console.error('Withdrawal request error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const getUserWithdrawals = async (req, res) => {
  try {
    const userId = req.user._id;
    const { page = 1, limit = 20 } = req.query;

    const skip = (page - 1) * limit;

    const withdrawals = await Withdrawal.find({ userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Withdrawal.countDocuments({ userId });

    res.json({
      success: true,
      withdrawals,
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

export const getAllWithdrawals = async (req, res) => {
  try {
    const { status, page = 1, limit = 50 } = req.query;

    const query = {};
    if (status) query.status = status;

    const skip = (page - 1) * limit;

    const withdrawals = await Withdrawal.find(query)
      .populate('userId', 'username email phoneNumber coinBalance')
      .populate('processedBy', 'username')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Withdrawal.countDocuments(query);

    res.json({
      success: true,
      withdrawals,
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

export const updateWithdrawalStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminNote, transactionId } = req.body;
    const adminId = req.user._id;

    const withdrawal = await Withdrawal.findById(id).populate('userId', 'username email coinBalance');
    if (!withdrawal) {
      return res.status(404).json({
        success: false,
        message: 'Withdrawal request not found'
      });
    }

    if (withdrawal.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Cannot update withdrawal. Current status: ${withdrawal.status}`
      });
    }

    // ✅ Handle rejection - DON'T change balance (it was never deducted)
    if (status === 'rejected') {
      // Update withdrawal status
      withdrawal.status = status;
      withdrawal.adminNote = adminNote || '';
      withdrawal.processedBy = adminId;
      withdrawal.processedAt = new Date();
      await withdrawal.save();

      // ✅ Update transaction to rejected (balance stays same)
      await Transaction.findOneAndUpdate(
        { 
          relatedRequest: withdrawal._id,
          requestModel: 'Withdrawal'
        },
        { 
          status: 'rejected',
          processedBy: adminId,
          rejectionReason: adminNote || 'Withdrawal request rejected'
        }
      );

      res.json({
        success: true,
        message: `Withdrawal ${status} successfully`,
        withdrawal
      });

      // Send rejection email asynchronously
      setImmediate(async () => {
        try {
          const emailSubject = 'ArenaX Withdrawal Request Rejected';
          const emailText = `Your withdrawal request of ${withdrawal.amount} AX coins has been rejected.\n\nReason: ${adminNote || 'Please contact support for details.'}\n\nYour balance remains unchanged. You can submit a new request if needed.`;
          const emailHtml = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(180deg, #0B0B0F 0%, #1A1A2E 100%); color: #E5E7EB; padding: 30px; border-radius: 15px; border: 1px solid rgba(239, 68, 68, 0.3);">
              <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #00E5FF; font-size: 36px; margin: 0;">ArenaX</h1>
                <p style="color: #9CA3AF; margin-top: 5px;">Gaming Platform</p>
              </div>
              
              <div style="background: linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(220, 38, 38, 0.15) 100%); padding: 25px; border-radius: 12px; border: 1px solid rgba(239, 68, 68, 0.3); margin-bottom: 25px;">
                <h2 style="color: #EF4444; margin-top: 0;">❌ Withdrawal Request Rejected</h2>
                <p style="font-size: 16px; line-height: 1.6;">Dear <strong>${withdrawal.userId.username}</strong>,</p>
                <p style="font-size: 16px; line-height: 1.6;">We regret to inform you that your withdrawal request has been <strong style="color: #EF4444;">rejected</strong>.</p>
              </div>

              <div style="background: rgba(11, 11, 15, 0.6); padding: 20px; border-radius: 10px; border: 1px solid rgba(138, 43, 226, 0.3); margin-bottom: 25px;">
                <h3 style="color: #00E5FF; margin-top: 0;">Rejection Details</h3>
                <table style="width: 100%; color: #E5E7EB;">
                  <tr>
                    <td style="padding: 8px 0;"><strong>Amount:</strong></td>
                    <td style="padding: 8px 0; text-align: right; color: #EF4444; font-size: 18px; font-weight: bold;">${withdrawal.amount} AX Coins</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0;"><strong>Payment Method:</strong></td>
                    <td style="padding: 8px 0; text-align: right;">${withdrawal.paymentMethod}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0;"><strong>Account Number:</strong></td>
                    <td style="padding: 8px 0; text-align: right;">${withdrawal.accountNumber}</td>
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

              <div style="background: rgba(16, 185, 129, 0.1); padding: 18px; border-radius: 10px; border: 1px solid rgba(16, 185, 129, 0.3); margin-bottom: 25px;">
                <p style="margin: 0; color: #6EE7B7; font-size: 14px;">
                  <strong>💰 Your Balance:</strong> Your balance remains unchanged at ${withdrawal.userId.coinBalance} AX coins. You can submit a new withdrawal request if needed.
                </p>
              </div>

              <p style="color: #9CA3AF; font-size: 14px; line-height: 1.6;">
                If you have questions about this rejection, please contact our support team.
              </p>

              <div style="border-top: 1px solid rgba(0, 229, 255, 0.2); margin-top: 30px; padding-top: 20px; text-align: center;">
                <p style="color: #6B7280; font-size: 12px; margin: 0;">© 2025 ArenaX. All rights reserved.</p>
                <p style="color: #4B5563; font-size: 11px; margin-top: 5px;">This is an automated message. Please do not reply.</p>
              </div>
            </div>
          `;
          await sendEmail(withdrawal.userId.email, emailSubject, emailText, emailHtml);
        } catch (emailError) {
          console.error('Failed to send rejection email:', emailError);
        }
      });

      return;
    }

    // ✅ Handle approval - NOW we deduct the balance
    if (status === 'approved' || status === 'completed') {
      const user = await User.findById(withdrawal.userId._id);
      
      // Double-check balance before deducting
      if (user.coinBalance < withdrawal.amount) {
        return res.status(400).json({
          success: false,
          message: 'Insufficient balance to complete withdrawal'
        });
      }

      const balanceBefore = user.coinBalance;
      
      // ✅ NOW deduct the coins
      user.coinBalance -= withdrawal.amount;
      user.totalCoinsSpent = (user.totalCoinsSpent || 0) + withdrawal.amount;
      await user.save();

      // ✅ Update transaction to approved with new balance
      await Transaction.findOneAndUpdate(
        { 
          relatedRequest: withdrawal._id,
          requestModel: 'Withdrawal'
        },
        { 
          status: 'approved',
          balanceAfter: user.coinBalance, // ✅ NOW update to new balance
          processedBy: adminId,
          paymentReference: transactionId || withdrawal._id.toString()
        }
      );

      // Update withdrawal status
      withdrawal.status = status;
      withdrawal.adminNote = adminNote || '';
      withdrawal.transactionId = transactionId || '';
      withdrawal.processedBy = adminId;
      withdrawal.processedAt = new Date();
      await withdrawal.save();

      res.json({
        success: true,
        message: `Withdrawal ${status} successfully`,
        withdrawal
      });

      // Send approval email asynchronously
      setImmediate(async () => {
        try {
          const emailSubject = 'ArenaX Withdrawal Approved - Money Sent!';
          const emailText = `Great news! Your withdrawal request has been approved and processed.\n\nAmount: ${withdrawal.amount} AX Coins\nPayment Method: ${withdrawal.paymentMethod}\nAccount: ${withdrawal.accountNumber}${transactionId ? `\nTransaction ID: ${transactionId}` : ''}\n\nThe money has been sent to your account. Please check your ${withdrawal.paymentMethod} account.`;
          const emailHtml = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(180deg, #0B0B0F 0%, #1A1A2E 100%); color: #E5E7EB; padding: 30px; border-radius: 15px; border: 1px solid rgba(0, 229, 255, 0.3);">
              <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #00E5FF; font-size: 36px; margin: 0;">ArenaX</h1>
                <p style="color: #9CA3AF; margin-top: 5px;">Gaming Platform</p>
              </div>
              
              <div style="background: linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(5, 150, 105, 0.15) 100%); padding: 25px; border-radius: 12px; border: 1px solid rgba(16, 185, 129, 0.3); margin-bottom: 25px;">
                <h2 style="color: #10B981; margin-top: 0;">✅ Withdrawal Approved & Processed!</h2>
                <p style="font-size: 16px; line-height: 1.6;">Dear <strong>${withdrawal.userId.username}</strong>,</p>
                <p style="font-size: 16px; line-height: 1.6;">Congratulations! Your withdrawal request has been <strong style="color: #10B981;">approved and the money has been sent</strong> to your account.</p>
              </div>

              <div style="background: rgba(11, 11, 15, 0.6); padding: 20px; border-radius: 10px; border: 1px solid rgba(138, 43, 226, 0.3); margin-bottom: 25px;">
                <h3 style="color: #00E5FF; margin-top: 0;">Payment Details</h3>
                <table style="width: 100%; color: #E5E7EB;">
                  <tr>
                    <td style="padding: 8px 0;"><strong>Amount:</strong></td>
                    <td style="padding: 8px 0; text-align: right; color: #10B981; font-size: 18px; font-weight: bold;">${withdrawal.amount} AX Coins</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0;"><strong>Payment Method:</strong></td>
                    <td style="padding: 8px 0; text-align: right;">${withdrawal.paymentMethod}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0;"><strong>Account Number:</strong></td>
                    <td style="padding: 8px 0; text-align: right;">${withdrawal.accountNumber}</td>
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
                  <tr>
                    <td style="padding: 8px 0;"><strong>Status:</strong></td>
                    <td style="padding: 8px 0; text-align: right; color: #10B981;">✅ Money Sent</td>
                  </tr>
                </table>
              </div>

              <div style="background: rgba(16, 185, 129, 0.1); padding: 18px; border-radius: 10px; border: 1px solid rgba(16, 185, 129, 0.3); margin-bottom: 25px;">
                <p style="margin: 0; color: #6EE7B7; font-size: 14px;">
                  <strong>💰 Payment Sent:</strong> We have sent the money to your ${withdrawal.paymentMethod} account (${withdrawal.accountNumber}). Please check your account - the payment should be visible now or within a few minutes.
                </p>
              </div>

              ${adminNote ? `
              <div style="background: rgba(138, 43, 226, 0.1); padding: 15px; border-radius: 8px; border: 1px solid rgba(138, 43, 226, 0.3); margin-bottom: 25px;">
                <p style="margin: 0; color: #C4B5FD; font-size: 13px;"><strong>📝 Admin Note:</strong> ${adminNote}</p>
              </div>
              ` : ''}

              <p style="color: #9CA3AF; font-size: 14px; line-height: 1.6;">
                If you don't see the payment in your account within 24 hours, please contact our support team.
              </p>

              <div style="border-top: 1px solid rgba(0, 229, 255, 0.2); margin-top: 30px; padding-top: 20px; text-align: center;">
                <p style="color: #6B7280; font-size: 12px; margin: 0;">© 2025 ArenaX. All rights reserved.</p>
                <p style="color: #4B5563; font-size: 11px; margin-top: 5px;">This is an automated message. Please do not reply.</p>
              </div>
            </div>
          `;
          await sendEmail(withdrawal.userId.email, emailSubject, emailText, emailHtml);
        } catch (emailError) {
          console.error('Failed to send approval email:', emailError);
        }
      });

      return;
    }

  } catch (error) {
    console.error('Update withdrawal status error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};