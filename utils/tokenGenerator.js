const jwt = require('jsonwebtoken');

const generateTokens = (userId, email) => {
  // Generate access token (short-lived)
  const accessToken = jwt.sign(
    { userId, email },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN }
  );

  // Generate refresh token (long-lived)
  const refreshToken = jwt.sign(
    { userId, email },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN }
  );

  return { accessToken, refreshToken };
};

const verifyRefreshToken = (refreshToken) => {
  try {
    return jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
  } catch (error) {
    return null;
  }
};

module.exports = { generateTokens, verifyRefreshToken };