const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const env = require('../config/env');
const RefreshToken = require('../models/RefreshToken');

function signAccessToken(user) {
  return jwt.sign(
    { sub: String(user._id), isSuperAdmin: Boolean(user.isSuperAdmin) },
    env.jwt.accessSecret,
    { expiresIn: env.jwt.accessTtl },
  );
}

function verifyAccessToken(token) {
  return jwt.verify(token, env.jwt.accessSecret);
}

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/** Parses "15m", "7d", "12h", "30s" or a raw millisecond count. */
function parseDuration(value) {
  const match = /^(\d+)\s*(ms|[smhd])?$/.exec(String(value).trim());
  if (!match) throw new Error(`Invalid duration: ${value}`);
  const amount = Number(match[1]);
  const unit = match[2] || 'ms';
  const multipliers = { ms: 1, s: 1000, m: 60 * 1000, h: 60 * 60 * 1000, d: 24 * 60 * 60 * 1000 };
  return amount * multipliers[unit];
}

/**
 * Issues a refresh token. Only the SHA-256 hash is persisted, so a database
 * leak cannot be replayed as a valid session.
 */
async function issueRefreshToken(userId, { userAgent = '', ipAddress = '' } = {}) {
  const raw = crypto.randomBytes(48).toString('hex');
  const expiresAt = new Date(Date.now() + parseDuration(env.jwt.refreshTtl));

  await RefreshToken.create({
    user: userId,
    tokenHash: hashToken(raw),
    expiresAt,
    userAgent,
    ipAddress,
  });

  return { token: raw, expiresAt };
}

async function rotateRefreshToken(rawToken, context = {}) {
  const tokenHash = hashToken(rawToken);
  const existing = await RefreshToken.findOne({ tokenHash });

  if (!existing) return { error: 'invalid' };
  if (existing.revokedAt) {
    // Reuse of a revoked token signals theft: drop every session for that user.
    await RefreshToken.updateMany({ user: existing.user, revokedAt: null }, { revokedAt: new Date() });
    return { error: 'reused' };
  }
  if (existing.expiresAt <= new Date()) return { error: 'expired' };

  const issued = await issueRefreshToken(existing.user, context);
  existing.revokedAt = new Date();
  existing.replacedByHash = hashToken(issued.token);
  await existing.save();

  return { userId: existing.user, ...issued };
}

async function revokeRefreshToken(rawToken) {
  const tokenHash = hashToken(rawToken);
  const result = await RefreshToken.updateOne({ tokenHash, revokedAt: null }, { revokedAt: new Date() });
  return result.modifiedCount > 0;
}

async function revokeAllForUser(userId) {
  await RefreshToken.updateMany({ user: userId, revokedAt: null }, { revokedAt: new Date() });
}

module.exports = {
  signAccessToken,
  verifyAccessToken,
  issueRefreshToken,
  rotateRefreshToken,
  revokeRefreshToken,
  revokeAllForUser,
  hashToken,
  parseDuration,
};
