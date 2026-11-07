const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const { verifyAccountOwnership, checkTransactionLimit, rateLimit } = require('../middleware/accountSecurity');
const Account = require('../models/Account');

// Apply auth middleware to all banking routes
router.use(authMiddleware);

// Get account balance
router.get('/balance/:accountNumber', verifyAccountOwnership, async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        accountNumber: req.account.accountNumber,
        balance: req.account.balance,
        currency: req.account.currency,
        accountType: req.account.accountType
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// Deposit money
router.post('/deposit/:accountNumber', 
  verifyAccountOwnership,
  rateLimit(3, 60000),
  async (req, res) => {
    try {
      const { amount, description = 'Deposit' } = req.body;
      
      if (!amount || amount <= 0) {
        return res.status(400).json({ 
          success: false,
          error: 'Valid amount is required' 
        });
      }

      req.account.balance += amount;
      await req.account.save();

      res.json({
        success: true,
        message: 'Deposit successful',
        data: {
          accountNumber: req.account.accountNumber,
          amount: amount,
          newBalance: req.account.balance,
          description,
          transactionDate: new Date()
        }
      });
    } catch (error) {
      res.status(500).json({ 
        success: false,
        error: error.message 
      });
    }
  }
);

// Withdraw money
router.post('/withdraw/:accountNumber',
  verifyAccountOwnership,
  checkTransactionLimit(10000),
  rateLimit(3, 60000),
  async (req, res) => {
    try {
      const { amount, description = 'Withdrawal' } = req.body;
      
      if (!amount || amount <= 0) {
        return res.status(400).json({ 
          success: false,
          error: 'Valid amount is required' 
        });
      }

      req.account.balance -= amount;
      await req.account.save();

      res.json({
        success: true,
        message: 'Withdrawal successful',
        data: {
          accountNumber: req.account.accountNumber,
          amount: amount,
          newBalance: req.account.balance,
          description,
          transactionDate: new Date()
        }
      });
    } catch (error) {
      res.status(500).json({ 
        success: false,
        error: error.message 
      });
    }
  }
);

// Transfer money
router.post('/transfer/:fromAccount',
  verifyAccountOwnership,
  checkTransactionLimit(5000),
  rateLimit(5, 60000),
  async (req, res) => {
    try {
      const { toAccount, amount, description = 'Transfer' } = req.body;
      
      if (!amount || amount <= 0) {
        return res.status(400).json({ 
          success: false,
          error: 'Valid amount is required' 
        });
      }

      if (!toAccount) {
        return res.status(400).json({ 
          success: false,
          error: 'Destination account is required' 
        });
      }

      // Find destination account
      const destinationAccount = await Account.findOne({ accountNumber: toAccount });
      
      if (!destinationAccount) {
        return res.status(404).json({ 
          success: false,
          error: 'Destination account not found' 
        });
      }

      // Perform transfer
      req.account.balance -= amount;
      destinationAccount.balance += amount;
      
      await req.account.save();
      await destinationAccount.save();

      res.json({
        success: true,
        message: 'Transfer successful',
        data: {
          fromAccount: req.account.accountNumber,
          toAccount: toAccount,
          amount: amount,
          remainingBalance: req.account.balance,
          description,
          transactionDate: new Date()
        }
      });
    } catch (error) {
      res.status(500).json({ 
        success: false,
        error: error.message 
      });
    }
  }
);

// Get account statement
router.get('/history/:accountNumber', verifyAccountOwnership, async (req, res) => {
  try {
    res.json({
      success: true,
      message: 'Transaction history',
      data: {
        accountNumber: req.account.accountNumber,
        accountType: req.account.accountType,
        currentBalance: req.account.balance,
        currency: req.account.currency,
        message: 'Full transaction history requires Transaction model implementation'
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

module.exports = router;