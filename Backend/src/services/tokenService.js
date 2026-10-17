/**
 * Refresh token service. Access tokens are short-lived JWTs; refresh tokens are
 * opaque random strings stored only as hashes. Rotation revokes the old token on
 * every use, and replaying a revoked token revokes the user's whole session set.
 */
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import 'dotenv/config';
import RefreshToken from '../models/RefreshToken.js';

const accessSecret = process.env.JWT_ACCESS_SECRET || 'dev-access-secret-change-me';
const refreshTtl = process.env.JWT_REFRESH_TTL || '7d';

function signAccessToken(user) {
  return jwt.sign(
    { sub: String(user._id), isSuperAdmin: Boolean(user.isSuperAdmin) },
    accessSecret,
    { expiresIn: process.env.JWT_ACCESS_TTL || '30m' },
  );
}

function verifyAccessToken(token) {
  return jwt.verify(token, accessSecret);
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
  const expiresAt = new Date(Date.now() + parseDuration(refreshTtl));

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

export { signAccessToken, verifyAccessToken, issueRefreshToken, rotateRefreshToken, revokeRefreshToken, revokeAllForUser, hashToken, parseDuration };
