/**
 * siteInspection.controller.js
 *
 * Implements the full Site Inspection Booking + Razorpay payment flow.
 *
 * SECURITY INVARIANTS (enforced throughout):
 *  1. Token amount is ALWAYS loaded from server-side settings. Client-submitted amounts are ignored.
 *  2. Razorpay Key Secret and Webhook Secret are NEVER returned to the client.
 *  3. Public serializers explicitly omit admin-only fields (adminNotes, assignedStaffId, ipAddress, statusHistory).
 *  4. A payment is confirmed ONLY when: signature verified + amount/currency match + Razorpay status is 'captured'.
 *  5. A failure event must NEVER downgrade a payment that is already 'captured'.
 *  6. Duplicate webhook events are silently deduplicated; duplicate captures are flagged for manual review.
 *  7. Notification failures do NOT undo a confirmed booking.
 *  8. Feature flags (bookingEnabled, paymentsEnabled) default to false — fail-closed.
 */

import crypto from 'crypto';
import Razorpay from 'razorpay';
import mongoose from 'mongoose';
import SiteInspectionSettings from '../models/SiteInspectionSettings.js';
import InspectionSlot          from '../models/InspectionSlot.js';
import SiteInspectionBooking   from '../models/SiteInspectionBooking.js';
import PaymentAttempt          from '../models/PaymentAttempt.js';
import RazorpayWebhookEvent    from '../models/RazorpayWebhookEvent.js';
import ServiceArea             from '../models/ServiceArea.js';
import { maskPhone, maskEmail }  from '../utils/masking.js';
import sendEmail               from '../utils/mailer.js';

// ─── Razorpay client (lazy-initialised; only used when credentials exist) ───────
function getRazorpayClient() {
  const keyId     = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) {
    throw new Error('Razorpay credentials are not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in server environment.');
  }
  return new Razorpay({ key_id: keyId, key_secret: keySecret });
}

// ─── Settings helper ─────────────────────────────────────────────────────────────
async function getOrCreateSettings() {
  let settings = await SiteInspectionSettings.findOne({ key: 'global_site_inspection_settings' });
  if (!settings) {
    settings = await SiteInspectionSettings.create({ key: 'global_site_inspection_settings' });
  }
  return settings;
}

// ─── Public serializer — never exposes private/admin fields ──────────────────────
export function serializeBookingPublic(booking, accessToken = null) {
  const obj = {
    bookingRef:      booking.bookingRef,
    customerName:    booking.customerName,
    customerPhone:   maskPhone(booking.customerPhone),
    customerEmail:   maskEmail(booking.customerEmail),
    district:        booking.district,
    state:           booking.state,
    visitType:       booking.visitType,
    bookingStatus:   booking.bookingStatus,
    paymentStatus:   booking.paymentStatus,
    amountPaise:     booking.amountPaise,
    currency:        booking.currency,
    visitStartTime:  booking.visitStartTime,
    visitEndTime:    booking.visitEndTime,
    policyVersionSnapshot: booking.policyVersionSnapshot,
    termsSnapshot:   booking.termsSnapshot,
    holdExpiresAt:   booking.holdExpiresAt,
    createdAt:       booking.createdAt,
  };
  // Only include the cleartext access token on initial creation (delivered once)
  if (accessToken) obj.accessToken = accessToken;
  return obj;
}

// ─── Admin serializer — includes protected fields for authorised staff ────────────
export function serializeBookingAdmin(booking) {
  return {
    _id:               booking._id,
    bookingRef:        booking.bookingRef,
    customerName:      booking.customerName,
    customerPhone:     booking.customerPhone,
    customerEmail:     booking.customerEmail,
    siteAddress:       booking.siteAddress,
    pinCode:           booking.pinCode,
    district:          booking.district,
    state:             booking.state,
    visitType:         booking.visitType,
    projectNote:       booking.projectNote,
    slotId:            booking.slotId,
    visitStartTime:    booking.visitStartTime,
    visitEndTime:      booking.visitEndTime,
    bookingStatus:     booking.bookingStatus,
    paymentStatus:     booking.paymentStatus,
    amountPaise:       booking.amountPaise,
    currency:          booking.currency,
    holdExpiresAt:     booking.holdExpiresAt,
    assignedStaffId:   booking.assignedStaffId,
    adminNotes:        booking.adminNotes,
    cancellationReason:  booking.cancellationReason,
    policyAccepted:    booking.policyAccepted,
    policyAcceptedAt:  booking.policyAcceptedAt,
    statusHistory:     booking.statusHistory,
    createdAt:         booking.createdAt,
    updatedAt:         booking.updatedAt,
  };
}

// ─── State transition helper ──────────────────────────────────────────────────────
function recordTransition(booking, toBookingStatus, toPaymentStatus, opts = {}) {
  const entry = {
    fromBookingStatus: booking.bookingStatus,
    toBookingStatus:   toBookingStatus ?? booking.bookingStatus,
    fromPaymentStatus: booking.paymentStatus,
    toPaymentStatus:   toPaymentStatus ?? booking.paymentStatus,
    changedBy:         opts.changedBy || null,
    note:              opts.note || '',
    timestamp:         new Date(),
  };
  if (!booking.statusHistory) booking.statusHistory = [];
  booking.statusHistory.push(entry);
  if (toBookingStatus) booking.bookingStatus = toBookingStatus;
  if (toPaymentStatus) booking.paymentStatus = toPaymentStatus;
}

// ─────────────────────────────────────────────────────────────────────────────────
//  PUBLIC ENDPOINTS
// ─────────────────────────────────────────────────────────────────────────────────

/**
 * GET /api/site-inspections/config
 * Returns public booking configuration — no secrets, no raw amounts if disabled.
 */
export async function getConfig(req, res) {
  try {
    const settings = await getOrCreateSettings();
    return res.json({
      success: true,
      data: {
        bookingEnabled:     settings.bookingEnabled,
        paymentsEnabled:    settings.paymentsEnabled,
        currency:           settings.currency,
        tokenAmountPaise:   settings.paymentsEnabled ? settings.tokenAmountPaise : null,
        visitDurationMinutes: settings.visitDurationMinutes,
        policyVersion:      settings.policyVersion,
        refundPolicy:       settings.refundPolicy,
        disclaimerText:     settings.disclaimerText,
        taxNotice:          settings.taxNotice,
        visitTypes:         settings.visitTypes,
        holdDurationSeconds: settings.holdDurationSeconds,
        bookingHorizonDays: settings.bookingHorizonDays,
        cancellationWindowHours: settings.cancellationWindowHours,
        isRefundable:       settings.isRefundable,
      },
    });
  } catch (err) {
    console.error('[SiteInspection] getConfig error:', err.message);
    return res.status(500).json({ success: false, error: 'Failed to load booking configuration.' });
  }
}

/**
 * GET /api/site-inspections/check-coverage?pinCode=XXXXXX
 * Validates service area coverage. Returns coverage status and district.
 */
export async function checkCoverage(req, res) {
  const { pinCode } = req.query;
  if (!pinCode || !/^[1-9][0-9]{5}$/.test(pinCode)) {
    return res.status(400).json({ success: false, error: 'Please enter a valid 6-digit PIN code.' });
  }
  try {
    const area = await ServiceArea.findOne({ pincode: pinCode.trim(), isActive: true });
    if (!area) {
      return res.json({
        success: true,
        covered: false,
        pinCode: pinCode.trim(),
        message: 'This PIN code is currently outside our service coverage. Submit an enquiry for out-of-coverage requests.',
      });
    }
    return res.json({
      success: true,
      covered: area.status === 'covered',
      pinCode: pinCode.trim(),
      district: area.district,
      state:    area.state,
      message:  area.status === 'covered'
        ? `We serve ${area.district}, ${area.state}. Available slots are shown below.`
        : 'This area is coming soon to our service network.',
    });
  } catch (err) {
    console.error('[SiteInspection] checkCoverage error:', err.message);
    return res.status(500).json({ success: false, error: 'Coverage check failed. Please try again.' });
  }
}

/**
 * GET /api/site-inspections/slots?pinCode=...&from=...&to=...
 * Returns available slots (open, future, has capacity) after coverage validation.
 */
export async function getAvailableSlots(req, res) {
  const settings = await getOrCreateSettings();
  if (!settings.bookingEnabled) {
    return res.status(503).json({ success: false, error: 'Online booking is not currently available. Please contact us directly.' });
  }

  const { pinCode, from, to } = req.query;

  // Coverage check
  if (pinCode) {
    const area = await ServiceArea.findOne({ pincode: pinCode.trim(), isActive: true, status: 'covered' });
    if (!area) {
      return res.status(400).json({ success: false, error: 'Booking is not available for this PIN code.' });
    }
  }

  const now    = new Date();
  const fromDate = from ? new Date(from) : now;
  const toDate   = to ? new Date(to) : new Date(now.getTime() + settings.bookingHorizonDays * 86400000);

  // Clamp to booking horizon
  const horizonLimit = new Date(now.getTime() + settings.bookingHorizonDays * 86400000);
  const effectiveTo  = toDate > horizonLimit ? horizonLimit : toDate;

  try {
    const slots = await InspectionSlot.find({
      startTime: { $gte: fromDate > now ? fromDate : now, $lte: effectiveTo },
      isBlocked: false,
    }).sort({ startTime: 1 });

    // Filter slots that have remaining capacity
    const available = slots
      .filter(s => (s.capacity - s.bookedCount - s.reservedCount) > 0)
      .map(s => ({
        _id:           s._id,
        id:            s._id,
        startTime:     s.startTime,
        endTime:       s.endTime,
        label:         s.label,
        availableCount: s.capacity - s.bookedCount - s.reservedCount,
        // Never expose: capacity, bookedCount, reservedCount, assignedStaffId
      }));

    return res.json({ success: true, data: available });
  } catch (err) {
    console.error('[SiteInspection] getAvailableSlots error:', err.message);
    return res.status(500).json({ success: false, error: 'Failed to load available slots.' });
  }
}

/**
 * POST /api/site-inspections/bookings
 * Creates a booking with atomic slot hold + Razorpay order.
 *
 * Idempotency: `Idempotency-Key` header prevents duplicate bookings on retry.
 * Slot hold: MongoDB transaction atomically increments reservedCount.
 * Razorpay order: Created AFTER the DB transaction commits.
 * On provider failure: hold is released; client receives a retryable error.
 */
export async function createBooking(req, res) {
  const settings = await getOrCreateSettings();
  if (!settings.bookingEnabled) {
    return res.status(503).json({ success: false, error: 'Online booking is not currently available.' });
  }

  const idempotencyKey = req.headers['idempotency-key'] || req.body.idempotencyKey;

  // Idempotency: return existing booking if key was already used
  if (idempotencyKey) {
    const existing = await SiteInspectionBooking.findOne({ idempotencyKey });
    if (existing) {
      const attempt = await PaymentAttempt.findOne({ bookingRef: existing.bookingRef }).sort({ createdAt: -1 });
      return res.status(200).json({
        success: true,
        idempotent: true,
        data: serializeBookingPublic(existing),
        razorpayOrderId: attempt?.razorpayOrderId || null,
        razorpayKeyId:   settings.paymentsEnabled ? process.env.RAZORPAY_KEY_ID : null,
      });
    }
  }

  const {
    customerName, customerPhone, customerEmail,
    siteAddress, pinCode, district, state,
    visitType, projectNote,
    slotId, policyAccepted,
  } = req.body;

  // ── Input validation ──────────────────────────────────────────
  if (!customerName?.trim())  return res.status(400).json({ success: false, error: 'Full name is required.' });
  if (!customerPhone?.trim()) return res.status(400).json({ success: false, error: 'Mobile number is required.' });
  if (!/^[6-9]\d{9}$/.test(customerPhone.replace(/\s+/g, ''))) {
    return res.status(400).json({ success: false, error: 'Please enter a valid 10-digit Indian mobile number.' });
  }
  if (!siteAddress?.trim()) return res.status(400).json({ success: false, error: 'Site address is required.' });
  if (!pinCode || !/^[1-9][0-9]{5}$/.test(pinCode)) {
    return res.status(400).json({ success: false, error: 'Valid 6-digit PIN code is required.' });
  }
  if (!district?.trim()) return res.status(400).json({ success: false, error: 'District is required.' });
  if (!visitType?.trim())  return res.status(400).json({ success: false, error: 'Visit type is required.' });
  if (!slotId)           return res.status(400).json({ success: false, error: 'Please select an appointment slot.' });
  if (!policyAccepted)   return res.status(400).json({ success: false, error: 'You must accept the booking policy to proceed.' });

  // ── Service coverage check ────────────────────────────────────
  const area = await ServiceArea.findOne({ pincode: pinCode.trim(), isActive: true, status: 'covered' });
  if (!area) {
    return res.status(400).json({
      success: false,
      error: 'Site inspection booking is not available for this PIN code. Please submit a coverage enquiry instead.',
    });
  }

  // ── Atomic slot reservation ──────────────────────────────────
  const executeReservation = async (session) => {
    const slotQuery = InspectionSlot.findById(slotId);
    if (session) slotQuery.session(session);
    const slot = await slotQuery;

    if (!slot) throw Object.assign(new Error('Selected slot not found.'), { statusCode: 404 });
    if (slot.isBlocked) throw Object.assign(new Error('Selected slot is no longer available.'), { statusCode: 409 });
    if (slot.startTime <= new Date()) throw Object.assign(new Error('Selected slot is in the past.'), { statusCode: 409 });

    const available = slot.capacity - slot.bookedCount - slot.reservedCount;
    if (available < 1) throw Object.assign(new Error('This slot is fully booked. Please select another slot.'), { statusCode: 409 });

    const updateOptions = session ? { session } : {};
    const updateRes = await InspectionSlot.updateOne(
      { _id: slot._id, reservedCount: slot.reservedCount },
      { $inc: { reservedCount: 1 } },
      updateOptions
    );
    if (updateRes.matchedCount === 0) {
      throw Object.assign(new Error('Slot was updated concurrently. Please try again.'), { statusCode: 409 });
    }

    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const holdExpiresAt = new Date(Date.now() + settings.holdDurationSeconds * 1000);

    const created = await SiteInspectionBooking.create(
      [
        {
          idempotencyKey:        idempotencyKey || undefined,
          accessTokenHash:       tokenHash,
          accessTokenExpiresAt:  new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
          customerName:          customerName.trim(),
          customerPhone:         customerPhone.replace(/\s+/g, '').trim(),
          customerEmail:         customerEmail?.trim()?.toLowerCase() || undefined,
          siteAddress:           siteAddress.trim(),
          pinCode:               pinCode.trim(),
          district:              area.district,
          state:                 area.state,
          visitType:             visitType.trim(),
          projectNote:           projectNote?.trim() || undefined,
          slotId:                slot._id,
          visitStartTime:        slot.startTime,
          visitEndTime:          slot.endTime,
          amountPaise:           settings.tokenAmountPaise,
          currency:              settings.currency,
          policyVersionSnapshot: settings.policyVersion,
          termsSnapshot:         settings.refundPolicy,
          holdExpiresAt,
          policyAccepted:        true,
          policyAcceptedAt:      new Date(),
          source:                'website',
          ipAddress:             req.ip,
        },
      ],
      updateOptions
    );

    const b = created[0];
    b._rawAccessToken = rawToken;
    return b;
  };

  let booking = null;
  const dbSession = await mongoose.startSession();
  try {
    await dbSession.withTransaction(async () => {
      booking = await executeReservation(dbSession);
    });
  } catch (txError) {
    if (txError.message?.includes('Transaction numbers are only allowed on a replica set member')) {
      // Standalone MongoDB fallback (tests/standalone instances)
      try {
        booking = await executeReservation(null);
      } catch (fallbackErr) {
        await dbSession.endSession();
        const statusCode = fallbackErr.statusCode || 500;
        return res.status(statusCode).json({ success: false, error: fallbackErr.message });
      }
    } else {
      await dbSession.endSession();
      const statusCode = txError.statusCode || 500;
      const msg = statusCode < 500 ? txError.message : 'Booking could not be created. Please try again.';
      if (statusCode >= 500) console.error('[SiteInspection] createBooking tx error:', txError.message);
      return res.status(statusCode).json({ success: false, error: msg });
    }
  }
  await dbSession.endSession();

  // ── Create Razorpay order (OUTSIDE transaction) ───────────────
  let razorpayOrderId  = null;
  let razorpayKeyId    = null;

  if (settings.paymentsEnabled) {
    try {
      const rzp = getRazorpayClient();
      const receipt = `SIB-${booking.bookingRef.slice(-8)}`;
      const order = await rzp.orders.create({
        amount:   settings.tokenAmountPaise,
        currency: settings.currency,
        receipt,
        notes: { bookingRef: booking.bookingRef },
      });

      // Persist the Razorpay order ID on the booking
      await SiteInspectionBooking.findByIdAndUpdate(booking._id, { paymentStatus: 'order_created' });

      // Create PaymentAttempt record
      await PaymentAttempt.create({
        bookingRef:          booking.bookingRef,
        bookingId:           booking._id,
        attemptNumber:       1,
        localIdempotencyKey: idempotencyKey ? `rzp-${idempotencyKey}` : undefined,
        razorpayOrderId:     order.id,
        expectedAmountPaise: settings.tokenAmountPaise,
        expectedCurrency:    settings.currency,
        status:              'order_created',
        orderCreatedAt:      new Date(),
      });

      booking.paymentStatus = 'order_created';
      razorpayOrderId = order.id;
      razorpayKeyId   = process.env.RAZORPAY_KEY_ID;
    } catch (rzpErr) {
      console.error('[SiteInspection] Razorpay order creation failed:', rzpErr.message);
      // Release the hold — provider failure must not ghost the customer
      await InspectionSlot.updateOne({ _id: booking.slotId }, { $inc: { reservedCount: -1 } });
      await SiteInspectionBooking.findByIdAndUpdate(booking._id, {
        bookingStatus: 'expired',
        paymentStatus: 'failed',
        holdExpiresAt: new Date(),
      });
      return res.status(502).json({
        success: false,
        error: 'Payment gateway is temporarily unavailable. Your slot hold has been released. Please try again in a few minutes.',
      });
    }
  }

  // ── Send booking acknowledgment email ─────────────────────────
  try {
    const visitDate = new Date(booking.visitStartTime).toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata', dateStyle: 'full', timeStyle: 'short',
    });
    if (booking.customerEmail) {
      await sendEmail({
        to: booking.customerEmail,
        subject: `Site Visit Request — ${booking.bookingRef} | Neevevera Pvt. Ltd.`,
        html: `
          <p>Dear ${booking.customerName},</p>
          <p>Your site inspection request has been received.</p>
          <table border="0" cellpadding="4">
            <tr><td><strong>Booking Ref:</strong></td><td>${booking.bookingRef}</td></tr>
            <tr><td><strong>Visit Date:</strong></td><td>${visitDate} (IST)</td></tr>
            <tr><td><strong>Site:</strong></td><td>${booking.siteAddress}, ${booking.district}</td></tr>
            <tr><td><strong>Token Amount:</strong></td><td>₹${settings.tokenAmountPaise / 100}</td></tr>
            <tr><td><strong>Status:</strong></td><td>${settings.paymentsEnabled ? 'Awaiting Payment' : 'Received (Payment offline)'}</td></tr>
          </table>
          <p>${settings.disclaimerText}</p>
          <p>Thank you,<br/>Neevevera Private Limited</p>
        `,
      });
    }
    // Notify admin
    await sendEmail({
      to: process.env.ADMIN_EMAIL || process.env.NODEMAILER_USER,
      subject: `[BOOKING] New Site Inspection — ${booking.bookingRef}`,
      html: `
        <p>New site inspection booking received.</p>
        <table border="0" cellpadding="4">
          <tr><td><strong>Ref:</strong></td><td>${booking.bookingRef}</td></tr>
          <tr><td><strong>Name:</strong></td><td>${booking.customerName}</td></tr>
          <tr><td><strong>Phone:</strong></td><td>${booking.customerPhone}</td></tr>
          <tr><td><strong>PIN:</strong></td><td>${booking.pinCode} — ${booking.district}</td></tr>
          <tr><td><strong>Visit:</strong></td><td>${visitDate} (IST)</td></tr>
          <tr><td><strong>Type:</strong></td><td>${booking.visitType}</td></tr>
        </table>
      `,
    });
  } catch (mailErr) {
    // Email failure MUST NOT reverse the booking
    console.error('[SiteInspection] Email notification error (non-fatal):', mailErr.message);
  }

  const serialized = serializeBookingPublic(booking, booking._rawAccessToken);
  return res.status(201).json({
    success: true,
    data: serialized,
    booking: serialized,
    accessToken: booking._rawAccessToken,
    razorpayOrderId,
    razorpayKeyId,
    prefill: {
      name:  booking.customerName,
      email: booking.customerEmail || '',
      contact: booking.customerPhone,
    },
  });
}

/**
 * POST /api/site-inspections/bookings/:bookingRef/verify-payment
 * Verifies the Razorpay checkout callback.
 *
 * Security:
 *  - HMAC-SHA256 over `orderId|paymentId` using RAZORPAY_KEY_SECRET.
 *  - Loaded order ID comes from our database — never from the client request.
 *  - Payment state is fetched from Razorpay API to confirm 'captured' status.
 *  - Idempotent — repeated calls on a confirmed booking return the same result.
 */
export async function verifyPayment(req, res) {
  const { bookingRef } = req.params;
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
  const rawAccessToken = req.headers['x-booking-token'] || req.body.accessToken;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return res.status(400).json({ success: false, error: 'Incomplete payment verification data.' });
  }

  // Authenticate the customer via access token
  const booking = await SiteInspectionBooking.findOne({ bookingRef })
    .select('+adminNotes +assignedStaffId +statusHistory +ipAddress +cancellationReason');

  if (!booking) return res.status(404).json({ success: false, error: 'Booking not found.' });

  if (rawAccessToken) {
    const tokenHash = crypto.createHash('sha256').update(rawAccessToken).digest('hex');
    if (tokenHash !== booking.accessTokenHash || new Date() > booking.accessTokenExpiresAt) {
      return res.status(403).json({ success: false, error: 'Invalid or expired access token.' });
    }
  }

  // Idempotency — already confirmed
  if (booking.paymentStatus === 'captured' && booking.bookingStatus === 'confirmed') {
    return res.json({ success: true, confirmed: true, data: serializeBookingPublic(booking) });
  }

  // Load the PaymentAttempt by the ORDER ID we stored (never trust client's order ID alone)
  const attempt = await PaymentAttempt.findOne({ razorpayOrderId: razorpay_order_id, bookingRef });
  if (!attempt) {
    return res.status(400).json({ success: false, error: 'No matching payment order found for this booking.' });
  }

  // Verify HMAC-SHA256 signature
  const expectedSig = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '')
    .update(`${attempt.razorpayOrderId}|${razorpay_payment_id}`)
    .digest('hex');

  let sigValid = false;
  try {
    const expectedBuf = Buffer.from(expectedSig, 'hex');
    const actualBuf   = Buffer.from(razorpay_signature || '', 'hex');
    if (expectedBuf.length === actualBuf.length) {
      sigValid = crypto.timingSafeEqual(expectedBuf, actualBuf);
    }
  } catch {
    sigValid = false;
  }

  if (!sigValid) {
    attempt.status = 'failed';
    attempt.failureCode = 'SIGNATURE_MISMATCH';
    attempt.failureDescription = 'Checkout signature verification failed.';
    await attempt.save();
    return res.status(400).json({ success: false, error: 'Payment signature verification failed.' });
  }

  attempt.razorpayPaymentId = razorpay_payment_id;
  attempt.signatureVerified = true;
  attempt.status = 'signature_verified';
  await attempt.save();

  // Fetch payment state from Razorpay API (server-to-server — authoritative)
  try {
    const rzp     = getRazorpayClient();
    const payment = await rzp.payments.fetch(razorpay_payment_id);

    attempt.reportedAmountPaise = payment.amount;
    attempt.reportedCurrency    = payment.currency?.toUpperCase();
    attempt.reportedStatus      = payment.status;
    attempt.amountVerified =
      payment.amount === attempt.expectedAmountPaise &&
      payment.currency?.toUpperCase() === attempt.expectedCurrency?.toUpperCase();

    const isCaptured = payment.status === 'captured';
    attempt.captureVerified = isCaptured;

    if (!attempt.amountVerified) {
      attempt.reconciliationStatus = 'mismatch';
      await attempt.save();
      console.warn('[SiteInspection] Amount mismatch on payment', razorpay_payment_id);
      return res.status(400).json({ success: false, error: 'Payment amount mismatch. Please contact support.' });
    }

    if (!isCaptured) {
      attempt.status = 'payment_attempted';
      booking.paymentStatus = 'authorized';
      await attempt.save();
      await booking.save();
      return res.json({
        success: true,
        confirmed: false,
        message: 'Payment authorised but not yet captured. Your booking will be confirmed shortly.',
        data: serializeBookingPublic(booking),
      });
    }

    // Payment captured + slot still reserved → CONFIRM
    attempt.status = 'captured';
    attempt.paymentCapturedAt = new Date();
    await attempt.save();

    // Atomically promote slot hold to confirmed booking
    await InspectionSlot.updateOne(
      { _id: booking.slotId },
      { $inc: { reservedCount: -1, bookedCount: 1 } }
    );

    recordTransition(booking, 'confirmed', 'captured', { note: 'Payment captured and verified.' });
    booking.holdExpiresAt = null;
    await booking.save();

    // Confirmation email
    try {
      const visitDate = new Date(booking.visitStartTime).toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata', dateStyle: 'full', timeStyle: 'short',
      });
      if (booking.customerEmail) {
        await sendEmail({
          to: booking.customerEmail,
          subject: `Booking Confirmed — ${booking.bookingRef} | Neevevera Pvt. Ltd.`,
          html: `
            <p>Dear ${booking.customerName},</p>
            <p>Your site inspection has been <strong>confirmed</strong>.</p>
            <table border="0" cellpadding="4">
              <tr><td><strong>Booking Ref:</strong></td><td>${booking.bookingRef}</td></tr>
              <tr><td><strong>Visit Date:</strong></td><td>${visitDate} (IST)</td></tr>
              <tr><td><strong>Site:</strong></td><td>${booking.siteAddress}</td></tr>
              <tr><td><strong>Token Paid:</strong></td><td>₹${booking.amountPaise / 100} ${booking.currency}</td></tr>
              <tr><td><strong>Payment Ref:</strong></td><td>${razorpay_payment_id}</td></tr>
            </table>
            <p>Our team will contact you before the visit. Please keep this reference handy.</p>
            <p>Thank you,<br/>Neevevera Private Limited</p>
          `,
        });
      }
    } catch (mailErr) {
      console.error('[SiteInspection] Confirmation email error (non-fatal):', mailErr.message);
    }

    return res.json({
      success: true,
      confirmed: true,
      data: serializeBookingPublic(booking),
    });

  } catch (rzpErr) {
    console.error('[SiteInspection] Razorpay payment fetch error:', rzpErr.message);
    attempt.status = 'payment_attempted';
    await attempt.save();
    return res.json({
      success: true,
      confirmed: false,
      message: 'Payment status is being verified. Please check your booking status in a few minutes.',
      data: serializeBookingPublic(booking),
    });
  }
}

/**
 * GET /api/site-inspections/bookings/:bookingRef/status
 * Anonymous status check — requires access token in X-Booking-Token header.
 */
export async function getBookingStatus(req, res) {
  const { bookingRef } = req.params;
  const rawAccessToken = req.headers['x-booking-token'] || req.query.token;
  const customerPhone = req.query.customerPhone;

  if (!rawAccessToken && !customerPhone) {
    return res.status(401).json({
      success: false,
      error: 'Access token (in X-Booking-Token header or ?token=) or registered phone number is required.',
    });
  }

  let booking = null;

  if (rawAccessToken) {
    const tokenHash = crypto.createHash('sha256').update(rawAccessToken).digest('hex');
    booking = await SiteInspectionBooking.findOne({ bookingRef, accessTokenHash: tokenHash });
    if (booking && new Date() > booking.accessTokenExpiresAt) {
      return res.status(403).json({ success: false, error: 'Access token has expired. Please contact support with your booking reference.' });
    }
  } else if (customerPhone) {
    const cleanPhone = customerPhone.replace(/\s+/g, '').slice(-10);
    const candidate = await SiteInspectionBooking.findOne({ bookingRef });
    if (candidate && candidate.customerPhone.replace(/\s+/g, '').slice(-10) === cleanPhone) {
      booking = candidate;
    }
  }

  if (!booking) {
    return res.status(404).json({ success: false, error: 'Booking not found or verification failed. Please check your reference and phone number.' });
  }

  // Only provide paymentRef if authenticated with cryptographic access token (not plain phone lookup)
  const isTokenAuth = Boolean(rawAccessToken);
  const attempt = isTokenAuth ? await PaymentAttempt.findOne({ bookingRef }).sort({ createdAt: -1 }) : null;

  return res.json({
    success: true,
    data: {
      ...serializeBookingPublic(booking),
      paymentRef: isTokenAuth ? (attempt?.razorpayPaymentId || null) : null,
    },
  });
}

// ─────────────────────────────────────────────────────────────────────────────────
//  RAZORPAY WEBHOOK
// ─────────────────────────────────────────────────────────────────────────────────

/**
 * POST /api/payments/razorpay/webhook
 * Raw-body route. Signature is validated BEFORE any processing.
 *
 * Handlers are idempotent. Webhook and checkout callback may arrive in any order.
 * This handler converges to the same final state as verifyPayment().
 */
export async function handleRazorpayWebhook(req, res) {
  const signature      = req.headers['x-razorpay-signature'];
  const webhookSecret  = process.env.RAZORPAY_WEBHOOK_SECRET;
  const razorpayEventId = req.headers['x-razorpay-event-id'];

  // Respond immediately to avoid retries on our delay; processing is async-safe
  if (!webhookSecret) {
    console.error('[Webhook] RAZORPAY_WEBHOOK_SECRET is not set — rejecting webhook.');
    return res.status(500).json({ error: 'Webhook not configured.' });
  }

  // Validate signature against raw body
  const bodyBuffer = Buffer.isBuffer(req.body)
    ? req.body
    : typeof req.body === 'string'
    ? Buffer.from(req.body, 'utf8')
    : Buffer.from(JSON.stringify(req.body || {}), 'utf8');

  const expectedSig = crypto
    .createHmac('sha256', webhookSecret)
    .update(bodyBuffer)
    .digest('hex');

  let sigValid = false;
  try {
    const expectedBuf = Buffer.from(expectedSig, 'utf8');
    const actualBuf   = Buffer.from(signature || '', 'utf8');
    if (expectedBuf.length === actualBuf.length) {
      sigValid = crypto.timingSafeEqual(expectedBuf, actualBuf);
    }
  } catch {
    sigValid = false;
  }

  if (!sigValid) {
    console.warn('[Webhook] Invalid signature — rejecting event.');
    // Create a record for audit even if rejected
    await RazorpayWebhookEvent.create({
      razorpayEventId: razorpayEventId || null,
      eventName:       'unknown',
      signatureValid:  false,
      processingStatus: 'failed',
      lastError: 'Signature validation failed.',
    }).catch(() => {});
    return res.status(400).json({ error: 'Invalid webhook signature.' });
  }

  let payload;
  try {
    payload = JSON.parse(bodyBuffer.toString('utf8'));
  } catch {
    return res.status(400).json({ error: 'Invalid JSON body.' });
  }

  const eventName   = payload.event;
  const paymentData = payload.payload?.payment?.entity;
  const orderId     = paymentData?.order_id;
  const paymentId   = paymentData?.id;
  const amountPaise = paymentData?.amount;
  const currency    = paymentData?.currency?.toUpperCase();

  // Deduplicate by Razorpay event ID
  if (razorpayEventId) {
    const dup = await RazorpayWebhookEvent.findOne({ razorpayEventId });
    if (dup) {
      // Event already processed or in-flight
      return res.status(200).json({ received: true, duplicate: true });
    }
  }

  // Persist event record (before processing — so we have a record even if handler throws)
  const eventRecord = await RazorpayWebhookEvent.create({
    razorpayEventId:   razorpayEventId || undefined,
    eventName,
    signatureValid:    true,
    processingStatus:  'processing',
    razorpayOrderId:   orderId,
    razorpayPaymentId: paymentId,
    eventAmountPaise:  amountPaise,
    eventCurrency:     currency,
  });

  // Respond 200 quickly — Razorpay will retry on timeout
  res.status(200).json({ received: true });

  // Process asynchronously
  setImmediate(async () => {
    try {
      eventRecord.processingAttempts += 1;

      if (eventName === 'payment.captured') {
        await _handlePaymentCaptured({ orderId, paymentId, amountPaise, currency, eventRecord });
      } else if (eventName === 'payment.failed') {
        await _handlePaymentFailed({ orderId, paymentId, eventRecord });
      } else if (eventName === 'refund.processed') {
        await _handleRefundProcessed({ payload, eventRecord });
      } else {
        eventRecord.processingStatus = 'processed'; // acknowledged unknown event
      }

      eventRecord.processingStatus = 'processed';
      await eventRecord.save();
    } catch (err) {
      console.error('[Webhook] Handler error:', err.message);
      eventRecord.processingStatus = 'failed';
      eventRecord.lastError = err.message;
      await eventRecord.save().catch(() => {});
    }
  });
}

async function _handlePaymentCaptured({ orderId, paymentId, amountPaise, currency, eventRecord }) {
  const attempt = await PaymentAttempt.findOne({ razorpayOrderId: orderId });
  if (!attempt) {
    console.warn('[Webhook] payment.captured: No PaymentAttempt for orderId', orderId);
    return;
  }

  // Set eventRecord context
  eventRecord.bookingRef = attempt.bookingRef;

  // Guard: a failure event must NOT downgrade a captured payment
  if (attempt.status === 'captured') {
    eventRecord.processingStatus = 'skipped_duplicate';
    return;
  }

  // Detect duplicate capture
  const alreadyCaptured = await PaymentAttempt.findOne({
    bookingRef: attempt.bookingRef,
    status: 'captured',
    _id: { $ne: attempt._id },
  });
  if (alreadyCaptured) {
    attempt.status = 'duplicate_flagged';
    attempt.reconciliationStatus = 'manual_review';
    await attempt.save();
    console.error('[Webhook] DUPLICATE CAPTURE detected for booking', attempt.bookingRef, '— flagged for manual review.');
    // Alert admin
    await sendEmail({
      to: process.env.ADMIN_EMAIL || process.env.NODEMAILER_USER,
      subject: `[URGENT] Duplicate payment captured — ${attempt.bookingRef}`,
      html: `<p>A second payment has been captured for booking <strong>${attempt.bookingRef}</strong>. Razorpay Payment ID: ${paymentId}. Manual review and refund required.</p>`,
    }).catch(() => {});
    return;
  }

  // Verify amount match
  if (amountPaise !== attempt.expectedAmountPaise || currency !== attempt.expectedCurrency) {
    attempt.reconciliationStatus = 'mismatch';
    attempt.reportedAmountPaise  = amountPaise;
    attempt.reportedCurrency     = currency;
    await attempt.save();
    console.error('[Webhook] Amount mismatch for booking', attempt.bookingRef);
    return;
  }

  attempt.razorpayPaymentId  = paymentId;
  attempt.reportedAmountPaise = amountPaise;
  attempt.reportedCurrency    = currency;
  attempt.reportedStatus      = 'captured';
  attempt.signatureVerified   = true;
  attempt.amountVerified      = true;
  attempt.captureVerified     = true;
  attempt.status              = 'captured';
  attempt.paymentCapturedAt   = new Date();
  await attempt.save();

  const booking = await SiteInspectionBooking.findOne({ bookingRef: attempt.bookingRef })
    .select('+statusHistory');
  if (!booking) return;

  // Only confirm if not already confirmed
  if (booking.bookingStatus !== 'confirmed') {
    await InspectionSlot.updateOne(
      { _id: booking.slotId },
      { $inc: { reservedCount: -1, bookedCount: 1 } }
    );
    recordTransition(booking, 'confirmed', 'captured', { note: 'Confirmed via webhook payment.captured.' });
    booking.holdExpiresAt = null;
    await booking.save();
  }
}

async function _handlePaymentFailed({ orderId, paymentId, eventRecord }) {
  const attempt = await PaymentAttempt.findOne({ razorpayOrderId: orderId });
  if (!attempt) return;

  eventRecord.bookingRef = attempt.bookingRef;

  // INVARIANT: never downgrade a captured payment
  if (['captured', 'refunded'].includes(attempt.status)) {
    eventRecord.processingStatus = 'skipped_duplicate';
    return;
  }

  attempt.status             = 'failed';
  attempt.razorpayPaymentId  = paymentId;
  await attempt.save();

  const booking = await SiteInspectionBooking.findOne({ bookingRef: attempt.bookingRef })
    .select('+statusHistory');
  if (!booking) return;

  if (!['confirmed', 'captured'].includes(booking.paymentStatus)) {
    booking.paymentStatus = 'failed';
    await booking.save();
  }
}

async function _handleRefundProcessed({ payload, eventRecord }) {
  const refundEntity = payload.payload?.refund?.entity;
  if (!refundEntity) return;

  const paymentId = refundEntity.payment_id;
  const attempt   = await PaymentAttempt.findOne({ razorpayPaymentId: paymentId });
  if (!attempt) return;

  eventRecord.bookingRef     = attempt.bookingRef;
  attempt.refundId           = refundEntity.id;
  attempt.refundAmountPaise  = refundEntity.amount;
  attempt.refundStatus       = 'processed';
  attempt.status             = 'refunded';
  await attempt.save();

  const booking = await SiteInspectionBooking.findOne({ bookingRef: attempt.bookingRef })
    .select('+statusHistory');
  if (!booking) return;

  recordTransition(booking, null, 'refunded', { note: 'Refund processed via webhook refund.processed.' });
  await booking.save();
}

// ─────────────────────────────────────────────────────────────────────────────────
//  ADMIN ENDPOINTS
// ─────────────────────────────────────────────────────────────────────────────────

export async function adminGetSettings(req, res) {
  try {
    const settings = await getOrCreateSettings();
    return res.json({ success: true, data: settings });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

export async function adminUpdateSettings(req, res) {
  try {
    const allowed = [
      'bookingEnabled', 'paymentsEnabled', 'tokenAmountPaise', 'holdDurationSeconds',
      'operatingDays', 'startHourIST', 'endHourIST', 'visitDurationMinutes',
      'maxBookingsPerSlot', 'bookingHorizonDays', 'policyVersion',
      'cancellationWindowHours', 'isRefundable', 'refundPolicy',
      'disclaimerText', 'taxNotice', 'visitTypes',
    ];
    const updates = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }
    updates.updatedBy = req.user._id;

    const settings = await SiteInspectionSettings.findOneAndUpdate(
      { key: 'global_site_inspection_settings' },
      updates,
      { new: true, upsert: true, runValidators: true }
    );
    return res.json({ success: true, data: settings });
  } catch (err) {
    return res.status(400).json({ success: false, error: err.message });
  }
}

// ── Slot management ──────────────────────────────────────────────────────────────

export async function adminGetSlots(req, res) {
  const { from, to } = req.query;
  const query = {};
  if (from) query.startTime = { $gte: new Date(from) };
  if (to) query.startTime = { ...query.startTime, $lte: new Date(to) };

  const slots = await InspectionSlot.find(query)
    .sort({ startTime: 1 })
    .populate('assignedStaffId', 'name email')
    .populate('createdBy', 'name');
  return res.json({ success: true, data: slots });
}

export async function adminCreateSlot(req, res) {
  try {
    const { startTime, endTime, capacity } = req.body;
    if (!startTime || !endTime) return res.status(400).json({ success: false, error: 'startTime and endTime are required.' });
    if (new Date(startTime) <= new Date()) return res.status(400).json({ success: false, error: 'Slot must be in the future.' });

    const slot = await InspectionSlot.create({
      startTime: new Date(startTime),
      endTime:   new Date(endTime),
      capacity:  capacity || 2,
      createdBy: req.user._id,
    });
    return res.status(201).json({ success: true, data: slot });
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ success: false, error: 'A slot already exists at this start time.' });
    return res.status(400).json({ success: false, error: err.message });
  }
}

export async function adminUpdateSlot(req, res) {
  try {
    const { id } = req.params;
    const allowed = ['endTime', 'capacity', 'isBlocked', 'blockReason', 'assignedStaffId'];
    const updates = {};
    for (const k of allowed) if (req.body[k] !== undefined) updates[k] = req.body[k];
    const slot = await InspectionSlot.findByIdAndUpdate(id, updates, { new: true, runValidators: true });
    if (!slot) return res.status(404).json({ success: false, error: 'Slot not found.' });
    return res.json({ success: true, data: slot });
  } catch (err) {
    return res.status(400).json({ success: false, error: err.message });
  }
}

export async function adminDeleteSlot(req, res) {
  const { id } = req.params;
  const hasBookings = await SiteInspectionBooking.exists({ slotId: id, bookingStatus: { $in: ['pending_payment', 'confirmed', 'assigned'] } });
  if (hasBookings) return res.status(409).json({ success: false, error: 'Cannot delete a slot with active bookings.' });
  await InspectionSlot.findByIdAndDelete(id);
  return res.json({ success: true, message: 'Slot deleted.' });
}

// ── Booking management ───────────────────────────────────────────────────────────

export async function adminGetBookings(req, res) {
  const { bookingStatus, paymentStatus, from, to, page = 1, limit = 30 } = req.query;
  const query = {};
  if (bookingStatus) query.bookingStatus = bookingStatus;
  if (paymentStatus)  query.paymentStatus  = paymentStatus;
  if (from || to) {
    query.createdAt = {};
    if (from) query.createdAt.$gte = new Date(from);
    if (to)   query.createdAt.$lte = new Date(to);
  }

  const skip  = (Number(page) - 1) * Number(limit);
  const total = await SiteInspectionBooking.countDocuments(query);
  const bookings = await SiteInspectionBooking.find(query)
    .select('+assignedStaffId')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(Number(limit))
    .populate('assignedStaffId', 'name email');

  return res.json({
    success: true,
    data: bookings.map(serializeBookingAdmin),
    pagination: { total, page: Number(page), limit: Number(limit) },
  });
}

export async function adminGetBooking(req, res) {
  const { id } = req.params;
  const booking = await SiteInspectionBooking.findById(id)
    .select('+assignedStaffId +adminNotes +statusHistory +cancellationReason +ipAddress +rescheduledFromSlotId')
    .populate('assignedStaffId', 'name email')
    .populate('rescheduledFromSlotId');

  if (!booking) return res.status(404).json({ success: false, error: 'Booking not found.' });

  const attempts = await PaymentAttempt.find({ bookingRef: booking.bookingRef }).sort({ createdAt: -1 });
  return res.json({ success: true, data: { ...serializeBookingAdmin(booking), paymentAttempts: attempts } });
}

export async function adminAssignStaff(req, res) {
  const { id } = req.params;
  const { staffId } = req.body;
  const booking = await SiteInspectionBooking.findByIdAndUpdate(
    id,
    { assignedStaffId: staffId || null, bookingStatus: staffId ? 'assigned' : 'confirmed' },
    { new: true }
  ).select('+assignedStaffId');
  if (!booking) return res.status(404).json({ success: false, error: 'Booking not found.' });
  return res.json({ success: true, data: serializeBookingAdmin(booking) });
}

export async function adminAddNote(req, res) {
  const { id } = req.params;
  const { note } = req.body;
  const booking = await SiteInspectionBooking.findByIdAndUpdate(id, { adminNotes: note }, { new: true })
    .select('+adminNotes');
  if (!booking) return res.status(404).json({ success: false, error: 'Booking not found.' });
  return res.json({ success: true });
}

export async function adminReschedule(req, res) {
  const { id } = req.params;
  const { newSlotId, reason } = req.body;
  if (!newSlotId) return res.status(400).json({ success: false, error: 'newSlotId is required.' });

  const booking = await SiteInspectionBooking.findById(id).select('+statusHistory +cancellationReason');
  if (!booking) return res.status(404).json({ success: false, error: 'Booking not found.' });
  if (!['confirmed', 'assigned', 'reschedule_required'].includes(booking.bookingStatus)) {
    return res.status(400).json({ success: false, error: 'Only confirmed or reschedule_required bookings can be rescheduled.' });
  }

  const newSlot = await InspectionSlot.findById(newSlotId);
  if (!newSlot || newSlot.isBlocked) return res.status(404).json({ success: false, error: 'New slot not found or is blocked.' });
  if ((newSlot.capacity - newSlot.bookedCount - newSlot.reservedCount) < 1) {
    return res.status(409).json({ success: false, error: 'New slot has no available capacity.' });
  }

  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      // Release old slot
      await InspectionSlot.updateOne({ _id: booking.slotId }, { $inc: { bookedCount: -1 } }, { session });
      // Claim new slot
      await InspectionSlot.updateOne({ _id: newSlot._id }, { $inc: { bookedCount: 1 } }, { session });

      booking.rescheduledFromSlotId = booking.slotId;
      booking.slotId       = newSlot._id;
      booking.visitStartTime = newSlot.startTime;
      booking.visitEndTime   = newSlot.endTime;
      recordTransition(booking, 'confirmed', null, { changedBy: req.user._id, note: reason || 'Rescheduled by admin.' });
      await booking.save({ session });
    });
  } finally {
    await session.endSession();
  }

  return res.json({ success: true, data: serializeBookingAdmin(booking) });
}

export async function adminCancelBooking(req, res) {
  const { id } = req.params;
  const { reason } = req.body;
  const booking = await SiteInspectionBooking.findById(id).select('+statusHistory +cancellationReason');
  if (!booking) return res.status(404).json({ success: false, error: 'Booking not found.' });
  if (['cancelled', 'completed'].includes(booking.bookingStatus)) {
    return res.status(400).json({ success: false, error: `Booking is already ${booking.bookingStatus}.` });
  }

  // Release slot if it was confirmed
  if (['confirmed', 'assigned', 'reschedule_required'].includes(booking.bookingStatus)) {
    await InspectionSlot.updateOne({ _id: booking.slotId }, { $inc: { bookedCount: -1 } });
  } else if (booking.bookingStatus === 'pending_payment') {
    await InspectionSlot.updateOne({ _id: booking.slotId }, { $inc: { reservedCount: -1 } });
  }

  booking.cancellationReason = reason || 'Cancelled by admin.';
  recordTransition(booking, 'cancelled', null, { changedBy: req.user._id, note: reason });
  await booking.save();
  return res.json({ success: true, message: 'Booking cancelled.' });
}

export async function adminRequestRefund(req, res) {
  const { id } = req.params;
  const { reason, amountPaise } = req.body;
  if (!reason) return res.status(400).json({ success: false, error: 'Refund reason is required.' });

  const booking = await SiteInspectionBooking.findById(id).select('+statusHistory');
  if (!booking) return res.status(404).json({ success: false, error: 'Booking not found.' });

  const attempt = await PaymentAttempt.findOne({ bookingRef: booking.bookingRef, status: 'captured' });
  if (!attempt || !attempt.razorpayPaymentId) {
    return res.status(400).json({ success: false, error: 'No captured payment found for this booking.' });
  }
  if (attempt.refundId) {
    return res.status(409).json({ success: false, error: 'A refund has already been initiated for this payment.' });
  }

  const refundAmount = amountPaise && amountPaise > 0 ? amountPaise : attempt.expectedAmountPaise;

  try {
    const rzp = getRazorpayClient();
    const refund = await rzp.payments.refund(attempt.razorpayPaymentId, {
      amount: refundAmount,
      notes: { reason, bookingRef: booking.bookingRef, initiatedBy: req.user._id.toString() },
    });

    attempt.refundId          = refund.id;
    attempt.refundAmountPaise = refund.amount;
    attempt.refundStatus      = refund.status;
    attempt.refundReason      = reason;
    attempt.refundInitiatedBy = req.user._id;
    attempt.refundInitiatedAt = new Date();
    attempt.status            = 'refunded';
    await attempt.save();

    recordTransition(booking, null, 'refund_pending', { changedBy: req.user._id, note: `Refund initiated: ${reason}` });
    await booking.save();

    return res.json({ success: true, refundId: refund.id, refundStatus: refund.status });
  } catch (rzpErr) {
    console.error('[SiteInspection] Refund error:', rzpErr.message);
    return res.status(502).json({ success: false, error: 'Refund request failed. Please try again or process via Razorpay Dashboard.' });
  }
}

export async function adminMarkVisitComplete(req, res) {
  const { id } = req.params;
  const booking = await SiteInspectionBooking.findById(id).select('+statusHistory');
  if (!booking) return res.status(404).json({ success: false, error: 'Booking not found.' });
  if (!['assigned', 'confirmed', 'visit_in_progress'].includes(booking.bookingStatus)) {
    return res.status(400).json({ success: false, error: 'Booking is not in an active visit state.' });
  }
  recordTransition(booking, 'completed', null, { changedBy: req.user._id, note: 'Visit completed.' });
  await booking.save();
  return res.json({ success: true });
}

export async function adminGetPaymentAttempts(req, res) {
  const { bookingRef } = req.params;
  const attempts = await PaymentAttempt.find({ bookingRef }).sort({ createdAt: -1 });
  return res.json({ success: true, data: attempts });
}


// ── FIELD STAFF MOBILE WORKFLOW ───────────────────────────────────

/**
 * GET /api/site-inspections/staff/my-visits
 * Returns assigned inspections for the authenticated field staff member.
 * If admin/superadmin, returns all active visits.
 * Field staff can NEVER see visits assigned to other engineers.
 */
export async function staffGetMyVisits(req, res) {
  const query = {};
  if (req.user.role === 'field_staff') {
    query.assignedStaffId = req.user._id;
  }
  const visits = await SiteInspectionBooking.find(query)
    .select('+assignedStaffId +adminNotes +inspectionFindings')
    .sort({ visitStartTime: 1 })
    .lean();

  return res.json({ success: true, count: visits.length, data: visits });
}

/**
 * PATCH /api/site-inspections/staff/visits/:id/status
 * Allows assigned field staff to update visit status:
 * 'assigned' -> 'visit_in_progress' -> 'completed'.
 */
export async function staffUpdateVisitStatus(req, res) {
  const { id } = req.params;
  const { status, note } = req.body;
  const ALLOWED_STAFF_STATUS = ['assigned', 'visit_in_progress', 'completed'];

  if (!ALLOWED_STAFF_STATUS.includes(status)) {
    return res.status(400).json({
      success: false,
      error: `Status must be one of: ${ALLOWED_STAFF_STATUS.join(', ')}`,
    });
  }

  const query = { _id: id };
  if (req.user.role === 'field_staff') {
    query.assignedStaffId = req.user._id;
  }

  const booking = await SiteInspectionBooking.findOne(query).select('+statusHistory');
  if (!booking) {
    return res.status(404).json({ success: false, error: 'Inspection visit not found or not assigned to you.' });
  }

  recordTransition(booking, status, null, {
    changedBy: req.user._id,
    note: note || `Status changed to ${status} by field staff ${req.user.name}`,
  });
  booking.bookingStatus = status;
  await booking.save();

  return res.json({ success: true, message: `Visit status updated to ${status}.`, data: booking });
}

/**
 * POST /api/site-inspections/staff/visits/:id/report
 * Field staff submits final inspection findings, structural observations,
 * recommendations, and on-site photos.
 */
export async function staffSubmitVisitReport(req, res) {
  const { id } = req.params;
  const { soilCondition, structuralObservations, recommendations, sitePhotos, fieldNotes } = req.body;

  const query = { _id: id };
  if (req.user.role === 'field_staff') {
    query.assignedStaffId = req.user._id;
  }

  const booking = await SiteInspectionBooking.findOne(query).select('+adminNotes +statusHistory +inspectionFindings');
  if (!booking) {
    return res.status(404).json({ success: false, error: 'Inspection visit not found or not assigned to you.' });
  }

  booking.inspectionFindings = {
    soilCondition: soilCondition || '',
    structuralObservations: structuralObservations || '',
    recommendations: recommendations || '',
    sitePhotos: Array.isArray(sitePhotos) ? sitePhotos : [],
    completedAt: new Date(),
  };

  if (fieldNotes) {
    const timestampStr = new Date().toISOString();
    const existing = booking.adminNotes ? (booking.adminNotes + '\n') : '';
    booking.adminNotes = existing + `[Field Note by ${req.user.name} (${timestampStr})]: ${fieldNotes}`;
  }

  recordTransition(booking, 'completed', null, {
    changedBy: req.user._id,
    note: `Field inspection report submitted by ${req.user.name}`,
  });
  booking.bookingStatus = 'completed';
  await booking.save();

  return res.json({
    success: true,
    message: 'Inspection report submitted and visit marked completed.',
    data: booking,
  });
}
