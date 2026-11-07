const Account = require('../models/Account');

// Verify account ownership
const verifyAccountOwnership = async (req, res, next) => {
  try {
    const { accountNumber } = req.params;
    const userId = req.userId;

    const account = await Account.findOne({ accountNumber, userId });
    
    if (!account) {
      return res.status(403).json({ 
        success: false,
        error: 'You do not have access to this account' 
      });
    }

    req.account = account;
    next();
  } catch (error) {
    res.status(500).json({ 
      success: false,
      error: 'Error verifying account ownership' 
    });
  }
};

// Check transaction limit
const checkTransactionLimit = (limit) => {
  return async (req, res, next) => {
    const { amount } = req.body;
    const { account } = req;

    if (amount > limit) {
      return res.status(400).json({ 
        success: false,
        error: `Transaction amount exceeds limit of ${limit}` 
      });
    }

    if (amount > account.balance) {
      return res.status(400).json({ 
        success: false,
        error: 'Insufficient balance' 
      });
    }

    next();
  };
};

// Rate limiting for sensitive operations
const rateLimiter = new Map();

const rateLimit = (maxRequests, timeWindow) => {
  return (req, res, next) => {
    const userId = req.userId;
    const now = Date.now();
    const key = `${userId}:${req.path}`;
    
    if (!rateLimiter.has(key)) {
      rateLimiter.set(key, []);
    }
    
    const requests = rateLimiter.get(key).filter(time => now - time < timeWindow);
    
    if (requests.length >= maxRequests) {
      return res.status(429).json({ 
        success: false,
        error: 'Too many requests. Please try again later.' 
      });
    }
    
    requests.push(now);
    rateLimiter.set(key, requests);
    next();
  };
};

module.exports = { verifyAccountOwnership, checkTransactionLimit, rateLimit };