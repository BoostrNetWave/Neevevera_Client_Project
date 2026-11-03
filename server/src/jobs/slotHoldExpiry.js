import cron from 'node-cron';
import SiteInspectionBooking from '../models/SiteInspectionBooking.js';
import InspectionSlot from '../models/InspectionSlot.js';

/**
 * slotHoldExpiry.js
 *
 * Background job to release expired slot holds.
 * When a user begins booking, `reservedCount` on InspectionSlot is incremented
 * and SiteInspectionBooking is set to `hold_placed` with a `holdExpiresAt` timestamp.
 * If payment is not completed before `holdExpiresAt`, this job:
 *   1. Updates bookingStatus to 'expired'
 *   2. Decrements reservedCount on the associated InspectionSlot
 *   3. Appends an audit transition entry
 *
 * Runs every 2 minutes.
 */

export function startSlotHoldExpiryJob() {
  console.log('⏰ Initializing Slot Hold Expiry Job (Every 2 minutes)');

  cron.schedule('*/2 * * * *', async () => {
    try {
      const now = new Date();
      const expiredBookings = await SiteInspectionBooking.find({
        bookingStatus: 'hold_placed',
        holdExpiresAt: { $lt: now },
      }).select('+statusHistory');

      if (!expiredBookings.length) return;

      console.log(`[SlotHoldExpiry] Found ${expiredBookings.length} expired slot hold(s) to release.`);

      for (const booking of expiredBookings) {
        try {
          const fromStatus = booking.bookingStatus;
          booking.bookingStatus = 'expired';
          booking.statusHistory.push({
            fromBookingStatus: fromStatus,
            toBookingStatus: 'expired',
            fromPaymentStatus: booking.paymentStatus,
            toPaymentStatus: booking.paymentStatus,
            changedByRole: 'system',
            note: 'Slot hold window expired without completed payment.',
            timestamp: now,
          });
          await booking.save();

          if (booking.slotId) {
            await InspectionSlot.updateOne(
              { _id: booking.slotId, reservedCount: { $gt: 0 } },
              { $inc: { reservedCount: -1 } }
            );
          }
        } catch (itemErr) {
          console.error(`[SlotHoldExpiry] Error expiring booking ${booking.bookingRef}:`, itemErr.message);
        }
      }
    } catch (err) {
      console.error('[SlotHoldExpiry] Error during slot expiry run:', err.message);
    }
  });
}
