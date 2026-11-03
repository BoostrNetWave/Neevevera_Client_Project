import React from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';

export default function Privacy() {
  return (
    <>
      <Helmet>
        <title>Privacy Policy &amp; Data Protection | Neevevera Private Limited</title>
        <meta
          name="description"
          content="Learn how Neevevera Private Limited collects, safeguards, and masks personal and corporate information under Indian data protection standards."
        />
      </Helmet>

      <div className="bg-surface-white min-h-screen py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Breadcrumb / Top Tag */}
          <div className="flex items-center gap-2 text-xs text-soft-grey mb-4">
            <Link to="/" className="hover:text-brand-blue transition-colors">Home</Link>
            <span>/</span>
            <span className="text-graphite font-semibold">Privacy Policy</span>
          </div>

          {/* Review Notice Banner */}
          <div className="mb-8 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs sm:text-sm leading-relaxed flex items-start gap-3">
            <span className="material-symbols-outlined text-amber-600 shrink-0 text-xl mt-0.5">verified_user</span>
            <div>
              <strong className="font-bold block uppercase tracking-wider text-[11px] text-amber-800 mb-0.5">
                [Draft for Legal &amp; Management Review]
              </strong>
              This Privacy Policy details the data protection practices adopted across Neevevera Private Limited&rsquo;s digital systems. Our operational standards are structured to align progressively with the principles of the Digital Personal Data Protection (DPDP) Act, 2023 and the phased transition timeline established under the notified DPDP Rules. This draft is under active corporate counsel review.
            </div>
          </div>

          {/* Header */}
          <div className="border-b border-border-neutral pb-6 mb-8">
            <h1 className="text-3xl sm:text-4xl font-display font-extrabold text-graphite tracking-tight">
              Privacy Policy &amp; Information Protection
            </h1>
            <p className="mt-2 text-sm text-soft-grey">
              Effective Version: <strong>v1.0 (Draft)</strong> &bull; Last Revised: October 2026 &bull; Data Protection Office: Cuttack, Odisha
            </p>
          </div>

          {/* Content Sections */}
          <div className="space-y-8 text-sm text-graphite leading-relaxed">
            
            {/* 1. Commitment */}
            <section className="space-y-3">
              <h2 className="text-lg font-display font-bold text-graphite flex items-center gap-2">
                <span className="text-brand-blue font-mono text-base">01.</span>
                Our Commitment to Privacy
              </h2>
              <p>
                <strong>Neevevera Private Limited</strong> respects your right to privacy. We collect only the minimum necessary information required to deliver civil engineering consultations, conduct site feasibility visits, process vendor registrations, and evaluate employment applications.
              </p>
              <p>
                We do <strong>not</strong> sell, lease, or monetize customer or contractor personal data to third-party marketing brokers or ad networks.
              </p>
            </section>

            {/* 2. Information Collected */}
            <section className="space-y-3">
              <h2 className="text-lg font-display font-bold text-graphite flex items-center gap-2">
                <span className="text-brand-blue font-mono text-base">02.</span>
                Information We Collect
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="p-4 rounded-xl bg-surface-warm border border-border-neutral space-y-1.5">
                  <h3 className="font-bold text-graphite text-xs uppercase tracking-wider text-brand-blue">
                    Site Inspection Bookings
                  </h3>
                  <p className="text-xs text-soft-grey">
                    Customer full name, 10-digit mobile number, email address, physical plot/building address, postal PIN code, and project scope notes.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-surface-warm border border-border-neutral space-y-1.5">
                  <h3 className="font-bold text-graphite text-xs uppercase tracking-wider text-brand-blue">
                    Project Cost Estimator
                  </h3>
                  <p className="text-xs text-soft-grey">
                    Contact name, email address, phone number, organization name, district, and requested CPWD DSR line-item selections.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-surface-warm border border-border-neutral space-y-1.5">
                  <h3 className="font-bold text-graphite text-xs uppercase tracking-wider text-brand-blue">
                    Vendor &amp; Subcontractor Records
                  </h3>
                  <p className="text-xs text-soft-grey">
                    Company legal entity, trade classification, GSTIN, technical certificates, representative contact, and operational territory.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-surface-warm border border-border-neutral space-y-1.5">
                  <h3 className="font-bold text-graphite text-xs uppercase tracking-wider text-brand-blue">
                    Career Applications
                  </h3>
                  <p className="text-xs text-soft-grey">
                    Applicant curriculum vitae (CV/resume), educational credentials, civil/structural portfolio documents, and employment history.
                  </p>
                </div>
              </div>
            </section>

            {/* 3. Telephone Masking Protocol */}
            <section className="space-y-3">
              <h2 className="text-lg font-display font-bold text-graphite flex items-center gap-2">
                <span className="text-brand-blue font-mono text-base">03.</span>
                Server-Side Telephone Number Masking
              </h2>
              <p>
                To protect our clients and contractors against automated web scraping, identity harvesting, and spam solicitation, Neevevera enforces <strong>server-side telephone masking</strong> on public API endpoints:
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-soft-grey">
                <li>
                  Public booking tracking responses and status endpoints display phone numbers in redacted format only (e.g. <code>+91 98••••••45</code>).
                </li>
                <li>
                  Full, unmasked telephone numbers are accessible solely to authenticated, role-authorized administrative personnel on encrypted, protected channels.
                </li>
                <li>
                  Masked representations are used exclusively for display privacy and are never utilized as standalone proof of identity or geographic location.
                </li>
              </ul>
            </section>

            {/* 4. Payment Data & Razorpay Security */}
            <section className="space-y-3">
              <h2 className="text-lg font-display font-bold text-graphite flex items-center gap-2">
                <span className="text-brand-blue font-mono text-base">04.</span>
                Payment Processing &amp; Financial Security
              </h2>
              <p>
                All electronic transactions for site inspection booking tokens are processed directly through <strong>Razorpay Software Private Limited</strong>. Razorpay maintains PCI-DSS v4.0 Level 1 Service Provider compliance for its secure payment gateway platform.
              </p>
              <p>
                Neevevera Private Limited does <strong>never</strong> collect, handle, or store full credit/debit card numbers, CVVs, or net banking credentials on our servers, and does not claim independent entity-level PCI-DSS certification. We store only authorized payment identifiers (Razorpay Order ID, Payment ID) for transaction accounting and booking confirmation.
              </p>
            </section>

            {/* 5. Cookie & Session Policy */}
            <section className="space-y-3">
              <h2 className="text-lg font-display font-bold text-graphite flex items-center gap-2">
                <span className="text-brand-blue font-mono text-base">05.</span>
                Cookie &amp; Local Storage Policy
              </h2>
              <p>
                Our website utilizes minimal technical cookies and local storage tokens strictly required for site operation:
              </p>
              <ul className="list-disc pl-5 space-y-1 text-soft-grey">
                <li><strong>Language Preference:</strong> Preserves your selected dialect (English, Hindi, Odia, or Bengali).</li>
                <li><strong>Admin CMS Authentication:</strong> Uses secured, HttpOnly authentication tokens.</li>
                <li>We do not utilize third-party cross-site advertising trackers or analytics cookies that compromise personal browsing history.</li>
              </ul>
            </section>

            {/* 6. User Rights & Contact */}
            <section className="space-y-3">
              <h2 className="text-lg font-display font-bold text-graphite flex items-center gap-2">
                <span className="text-brand-blue font-mono text-base">06.</span>
                Your Rights &amp; Data Deletion Requests
              </h2>
              <p>
                You have the right to request a summary of the personal information stored in relation to your inquiries, rectify inaccurate records, or request complete erasure of your contact details upon conclusion of our service obligations.
              </p>
              <p>
                To exercise these rights, please write to our Data Privacy Officer at:
              </p>
              <div className="p-4 rounded-xl bg-surface-warm border border-border-neutral text-xs text-graphite space-y-1">
                <p><strong>Neevevera Private Limited — Data Privacy Desk</strong></p>
                <p>Email: <a href="mailto:info@neevevara.com" className="text-brand-blue hover:underline">info@neevevara.com</a> / <a href="mailto:contact@neevevara.com" className="text-brand-blue hover:underline">contact@neevevara.com</a> &bull; Desk: <a href="mailto:privacy@neevevara.com" className="text-brand-blue hover:underline">privacy@neevevara.com</a></p>
                <p>Office: Sector 9, CDA Industrial Estate, Cuttack, Odisha – 753014, India</p>
              </div>
            </section>

          </div>
        </div>
      </div>
    </>
  );
}
