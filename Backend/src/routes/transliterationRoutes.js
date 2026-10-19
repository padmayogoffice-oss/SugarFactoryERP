/**
 * POST /api/transliterate  { text } -> { text, source }
 *
 * Available to any authenticated user because it only converts the text it is
 * sent and touches no stored data. A small in-memory per-user limiter protects
 * the upstream provider from abuse.
 */
import express from 'express';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import { ok } from '../utils/apiResponse.js';
import { authenticate } from '../middleware/auth.js';
import { transliterate, TransliterationError } from '../services/transliterationService.js';

const router = express.Router();

const WINDOW_MS = 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = Number(process.env.TRANSLITERATION_RATE_LIMIT) || 240;
const hits = new Map(); // userId -> { count, resetAt }

function rateLimit(req, _res, next) {
  const key = String(req.user?._id || req.ip);
  const now = Date.now();
  const entry = hits.get(key);
  if (!entry || entry.resetAt <= now) {
    hits.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return next();
  }
  entry.count += 1;
  if (entry.count > MAX_REQUESTS_PER_WINDOW) {
    return next(new ApiError(429, 'Too many transliteration requests. Please slow down.'));
  }
  return next();
}

router.post(
  '/',
  authenticate,
  rateLimit,
  asyncHandler(async (req, res) => {
    try {
      const result = await transliterate(req.body?.text);
      return ok(res, result);
    } catch (error) {
      if (error instanceof TransliterationError) throw new ApiError(error.statusCode, error.message);
      throw error;
    }
  }),
);

export default router;
