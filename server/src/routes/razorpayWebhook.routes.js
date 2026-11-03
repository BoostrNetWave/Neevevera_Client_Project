/**
 * razorpayWebhook.routes.js
 *
 * This module is intentionally minimal. It exports a single Express handler
 * (not a router) that is mounted in app.js BEFORE express.json() so the raw
 * request body is preserved for HMAC-SHA256 signature validation.
 *
 * Mounting order in app.js (REQUIRED):
 *   1. app.post('/api/payments/razorpay/webhook', express.raw({ type: '*\/*' }), razorpayWebhookHandler)
 *   2. app.use(express.json(...))  ← global JSON body parser
 *   3. All other routes
 */

import { handleRazorpayWebhook } from '../controllers/siteInspection.controller.js';

export { handleRazorpayWebhook as razorpayWebhookHandler };
