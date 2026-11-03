import React from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';

export default function RefundPolicy() {
  return (
    <>
      <Helmet>
        <title>Booking &amp; Refund Policy | Neevevera Private Limited</title>
        <meta
          name="description"
          content="Review Neevevera's official site inspection token policy, rescheduling terms, contract credit, and cancellation guidelines."
        />
      </Helmet>

      <div className="bg-surface-white min-h-screen py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Breadcrumb / Top Tag */}
          <div className="flex items-center gap-2 text-xs text-soft-grey mb-4">
            <Link to="/" className="hover:text-brand-blue transition-colors">Home</Link>
            <span>/</span>
            <span className="text-graphite font-semibold">Booking &amp; Refund Policy</span>
          </div>

          {/* Review Notice Banner */}
          <div className="mb-8 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs sm:text-sm leading-relaxed flex items-start gap-3">
            <span className="material-symbols-outlined text-amber-600 shrink-0 text-xl mt-0.5">currency_rupee</span>
            <div>
              <strong className="font-bold block uppercase tracking-wider text-[11px] text-amber-800 mb-0.5">
                [Draft for Legal &amp; Management Review]
              </strong>
              This policy documents the commercial and operational rules governing site inspection tokens, appointment rescheduling, and contract adjustment. All policies reflect approved system snapshots (Policy Snapshot v1.0).
            </div>
          </div>

          {/* Header */}
          <div className="border-b border-border-neutral pb-6 mb-8">
            <h1 className="text-3xl sm:text-4xl font-display font-extrabold text-graphite tracking-tight">
              Site Inspection Token &amp; Refund Policy
            </h1>
            <p className="mt-2 text-sm text-soft-grey">
              Authoritative Policy Version: <strong>v1.0 (Active Snapshot)</strong> &bull; Token Amount: <strong>₹1,000 (Inclusive of Taxes)</strong>
            </p>
          </div>

          {/* Content Sections */}
          <div className="space-y-8 text-sm text-graphite leading-relaxed">
            
            {/* 1. Purpose of Booking Token */}
            <section className="space-y-3">
              <h2 className="text-lg font-display font-bold text-graphite flex items-center gap-2">
                <span className="text-brand-blue font-mono text-base">01.</span>
                Purpose of the Inspection Token
              </h2>
              <p>
                To provide rigorous, high-quality civil engineering and architectural advice, <strong>Neevevera Private Limited</strong> dispatches certified structural engineers and site supervisors to client plots.
              </p>
              <p>
                The <strong>₹1,000 booking token</strong> (or prevailing approved setting amount) serves to reserve dedicated engineering time, plan route logistics, and ensure genuine appointment requests. The token amount is all-inclusive of applicable GST.
              </p>
            </section>

            {/* 2. 100% Contract Credit Adjustment */}
            <section className="space-y-3">
              <h2 className="text-lg font-display font-bold text-graphite flex items-center gap-2">
                <span className="text-brand-blue font-mono text-base">02.</span>
                100% Credit Against Project Contract
              </h2>
              <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900">
                <h3 className="font-bold text-emerald-950 text-base mb-1.5 flex items-center gap-2">
                  <span className="material-symbols-outlined text-emerald-700">redeem</span>
                  Full Deduction Guarantee
                </h3>
                <p className="text-xs sm:text-sm leading-relaxed">
                  The entire booking token amount paid is <strong>100% deductible</strong> from your first milestone invoice when you enter into a construction execution, architectural planning, or structural consultancy contract with Neevevera Private Limited.
                </p>
              </div>
            </section>

            {/* 3. Non-Refundability & Contract Credit Distinction */}
            <section className="space-y-3">
              <h2 className="text-lg font-display font-bold text-graphite flex items-center gap-2">
                <span className="text-brand-blue font-mono text-base">03.</span>
                Direct Refund Terms &amp; Contract Credit Distinction
              </h2>
              <p>
                As codified in our official system policy snapshot:
              </p>
              <blockquote className="p-4 rounded-xl bg-surface-warm border-l-4 border-brand-blue text-graphite italic text-sm">
                &ldquo;The booking token is non-refundable. It may be adjusted against confirmed construction or consultancy work at Neevevera&rsquo;s discretion.&rdquo;
              </blockquote>
              <div className="p-4 rounded-xl bg-surface-warm border border-border-neutral space-y-2 text-xs text-soft-grey leading-relaxed">
                <strong className="text-graphite font-semibold block uppercase tracking-wider text-[11px]">
                  Important Legal Distinction: Contract Credit vs. Cash Refund
                </strong>
                <p>
                  A <strong>contract credit</strong> is not a liquid cash refund. The token represents an advance fee that compensates Neevevera for certified engineer site mobilization, fuel, route reservation, and on-site technical diagnostic time.
                </p>
                <p>
                  <strong>Customer Decision Not to Proceed:</strong> If, following the completion of the preliminary site visit and delivery of our observations, you decide not to enter into a subsequent construction, architectural, or consultancy contract with Neevevera, the booking token is considered fully earned and consumed by the completed field assessment. It is <em>not refundable in cash, UPI transfer, or bank credit</em>.
                </p>
              </div>
            </section>

            {/* 4. Rescheduling Window */}
            <section className="space-y-3">
              <h2 className="text-lg font-display font-bold text-graphite flex items-center gap-2">
                <span className="text-brand-blue font-mono text-base">04.</span>
                Free Rescheduling Guidelines
              </h2>
              <p>
                We understand that unexpected schedule changes happen. You are entitled to <strong>free rescheduling</strong> under the following conditions:
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-soft-grey">
                <li>
                  <strong>24-Hour Horizon:</strong> Rescheduling requests must be initiated at least <strong>24 hours prior</strong> to the scheduled slot start time.
                </li>
                <li>
                  <strong>Process:</strong> Visit your <Link to="/book-inspection/status" className="text-brand-blue underline font-semibold">Appointment Tracking Page</Link> with your Booking Reference (SIB-XXXX) or contact our operations desk at <a href="tel:+917684078877" className="text-brand-blue font-semibold hover:underline">+91 76840 78877</a>.
                </li>
                <li>
                  <strong>No Additional Fee:</strong> Your existing token and policy acceptance snapshot will be seamlessly reassigned to the new available slot.
                </li>
              </ul>
            </section>

            {/* 5. Same-Day Cancellations & No-Shows */}
            <section className="space-y-3">
              <h2 className="text-lg font-display font-bold text-graphite flex items-center gap-2">
                <span className="text-brand-blue font-mono text-base">05.</span>
                Late Cancellations &amp; No-Shows
              </h2>
              <p>
                If an appointment is cancelled within 24 hours of the slot start time, or if our engineering team arrives on-site during the scheduled window and is denied physical access or contact cannot be established:
              </p>
              <ul className="list-disc pl-5 space-y-1 text-soft-grey">
                <li>The booking token is forfeited to offset engineer mobilization and transport expenses.</li>
                <li>Any subsequent visit request will require booking a new slot and paying a fresh token.</li>
              </ul>
            </section>

            {/* 6. Service Area Exclusions & Administrative Review */}
            <section className="space-y-3">
              <h2 className="text-lg font-display font-bold text-graphite flex items-center gap-2">
                <span className="text-brand-blue font-mono text-base">06.</span>
                Service Area Coverage Exceptions
              </h2>
              <p>
                Our booking engine validates customer PIN codes before reserving appointments. In the exceptional event that an appointment is confirmed for an unserviceable remote location due to a data or geocoding discrepancy, Neevevera management will contact the customer to either:
              </p>
              <ol className="list-decimal pl-5 space-y-1 text-soft-grey">
                <li>Mutually schedule a customized remote feasibility consultation; or</li>
                <li>Process an administrative 100% refund of the token to the original payment source within 5–7 banking days.</li>
              </ol>
            </section>

            {/* Quick Actions Card */}
            <section className="mt-8 p-6 rounded-2xl bg-surface-warm border border-border-neutral flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-bold text-graphite text-base">Need to track or manage your booking?</h3>
                <p className="text-xs text-soft-grey mt-0.5">
                  Have your Booking Reference ready (e.g. NV-VIS-XXXXXXXX or SIB-XXXXXXXX).
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Link
                  to="/book-inspection/status"
                  className="px-4 py-2 rounded-xl bg-brand-blue text-white text-xs font-semibold hover:bg-brand-blue-hover transition-colors flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-sm">track_changes</span>
                  Track Appointment
                </Link>
                <Link
                  to="/book-inspection"
                  className="px-4 py-2 rounded-xl bg-white border border-border-neutral text-graphite text-xs font-semibold hover:bg-gray-50 transition-colors"
                >
                  Book New Slot
                </Link>
              </div>
            </section>

          </div>
        </div>
      </div>
    </>
  );
}
