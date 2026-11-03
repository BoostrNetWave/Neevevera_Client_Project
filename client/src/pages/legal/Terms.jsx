import React from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';

export default function Terms() {
  return (
    <>
      <Helmet>
        <title>Terms of Service &amp; Website Use | Neevevera Private Limited</title>
        <meta
          name="description"
          content="Review the terms of service, commercial guidelines, and digital platform usage rules for Neevevera Private Limited."
        />
      </Helmet>

      <div className="bg-surface-white min-h-screen py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Breadcrumb / Top Tag */}
          <div className="flex items-center gap-2 text-xs text-soft-grey mb-4">
            <Link to="/" className="hover:text-brand-blue transition-colors">Home</Link>
            <span>/</span>
            <span className="text-graphite font-semibold">Terms of Service</span>
          </div>

          {/* Review Notice Banner */}
          <div className="mb-8 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs sm:text-sm leading-relaxed flex items-start gap-3">
            <span className="material-symbols-outlined text-amber-600 shrink-0 text-xl mt-0.5">policy</span>
            <div>
              <strong className="font-bold block uppercase tracking-wider text-[11px] text-amber-800 mb-0.5">
                [Draft for Legal &amp; Management Review]
              </strong>
              These Terms of Service outline the current operational standards and digital platform rules of Neevevera Private Limited. They are subject to ongoing legal review by corporate counsel. Formal commercial contracts, project tenders, and consultancy agreements take precedence over website terms.
            </div>
          </div>

          {/* Header */}
          <div className="border-b border-border-neutral pb-6 mb-8">
            <h1 className="text-3xl sm:text-4xl font-display font-extrabold text-graphite tracking-tight">
              Terms of Service &amp; Conditions
            </h1>
            <p className="mt-2 text-sm text-soft-grey">
              Effective Version: <strong>v1.0 (Draft)</strong> &bull; Last Revised: October 2026 &bull; Jurisdiction: Cuttack &amp; Bhubaneswar, Odisha, India
            </p>
          </div>

          {/* Content Sections */}
          <div className="space-y-8 text-sm text-graphite leading-relaxed">
            
            {/* 1. Introduction */}
            <section className="space-y-3">
              <h2 className="text-lg font-display font-bold text-graphite flex items-center gap-2">
                <span className="text-brand-blue font-mono text-base">01.</span>
                Acceptance of Terms
              </h2>
              <p>
                Welcome to <strong>Neevevera Private Limited</strong> (&ldquo;Company&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;, or &ldquo;our&rdquo;), a registered civil engineering, architectural design, marine infrastructure, and project execution enterprise headquartered at Sector 9, CDA Industrial Estate, Cuttack, Odisha – 753014.
              </p>
              <p>
                By accessing our website (<a href="https://www.neevevara.com" className="text-brand-blue font-semibold underline">www.neevevara.com</a>), requesting project estimates, booking site inspection appointments, or submitting vendor/career expressions of interest, you agree to be bound by these Terms of Service. If you do not agree, please discontinue website usage immediately.
              </p>
            </section>

            {/* 2. Estimator and Cost Projections */}
            <section className="space-y-3">
              <h2 className="text-lg font-display font-bold text-graphite flex items-center gap-2">
                <span className="text-brand-blue font-mono text-base">02.</span>
                Estimates &amp; Rate Analysis Disclaimers
              </h2>
              <p>
                Any preliminary project estimation tools, cost calculators, or CPWD Delhi Schedule of Rates (DSR) rates presented on this website (including the <Link to="/estimate" className="text-brand-blue underline font-semibold">Cost Estimator</Link>) are strictly indicative and non-binding.
              </p>
              <ul className="list-disc pl-5 space-y-1 text-soft-grey">
                <li>Material market rates, transportation costs, soil conditions, and municipal regulations vary significantly by district.</li>
                <li>Final construction contracts require on-site technical inspection, architectural drafting, structural load audits, and a formally signed Bill of Quantities (BOQ).</li>
                <li>Neevevera Private Limited reserves the right to modify estimated rates without prior public notice based on real-time market indices.</li>
              </ul>
            </section>

            {/* 3. Site Inspection Bookings */}
            <section className="space-y-3">
              <h2 className="text-lg font-display font-bold text-graphite flex items-center gap-2">
                <span className="text-brand-blue font-mono text-base">03.</span>
                Site Inspection Appointments &amp; Token
              </h2>
              <p>
                Field inspection visits booked via <Link to="/book-inspection" className="text-brand-blue underline font-semibold">Book Inspection</Link> are governed by our specific <Link to="/refund-policy" className="text-brand-blue underline font-semibold">Booking &amp; Refund Policy</Link>.
              </p>
              <p>
                Booking tokens confirm scheduled engineering field presence only. Scope of work, engineering drawings, and structural consultation reports are delivered according to formal work orders executed after the preliminary assessment.
              </p>
            </section>

            {/* 4. Intellectual Property */}
            <section className="space-y-3">
              <h2 className="text-lg font-display font-bold text-graphite flex items-center gap-2">
                <span className="text-brand-blue font-mono text-base">04.</span>
                Intellectual Property Rights
              </h2>
              <p>
                All project photographs, engineering drawings, architectural blueprints, 3D renderings, technical whitepapers, brand logos, codebases, and website editorial content belong exclusively to Neevevera Private Limited or are used under verified license. Unauthorized reproduction, web scraping, commercial republication, or hotlinking is strictly prohibited without prior written consent.
              </p>
            </section>

            {/* 5. Privacy & Phone Masking */}
            <section className="space-y-3">
              <h2 className="text-lg font-display font-bold text-graphite flex items-center gap-2">
                <span className="text-brand-blue font-mono text-base">05.</span>
                Data Protection &amp; Public Masking
              </h2>
              <p>
                We adhere to strict data privacy principles in accordance with Indian legislation. Customer telephone numbers are masked in public endpoints and tracking views (e.g. <code>+91 98••••••45</code>). For full information on how customer and partner data is handled, please review our comprehensive <Link to="/privacy" className="text-brand-blue underline font-semibold">Privacy Policy</Link>.
              </p>
            </section>

            {/* 6. Governing Law & Dispute Resolution */}
            <section className="space-y-3">
              <h2 className="text-lg font-display font-bold text-graphite flex items-center gap-2">
                <span className="text-brand-blue font-mono text-base">06.</span>
                Governing Law &amp; Jurisdiction
              </h2>
              <p>
                These Terms are governed by and construed in accordance with the laws of India. Any legal dispute, arbitration proceeding, or litigation arising out of website usage or preliminary digital inquiries shall fall under the exclusive jurisdiction of the competent courts in <strong>Cuttack and Bhubaneswar, Odisha, India</strong>, and the High Court of Orissa.
              </p>
            </section>

            {/* 7. Corporate Contact */}
            <section className="mt-10 p-6 rounded-2xl bg-surface-warm border border-border-neutral space-y-2">
              <h3 className="font-bold text-graphite text-base">Legal Inquiries &amp; Corporate Office</h3>
              <p className="text-xs text-soft-grey leading-relaxed">
                For contract verification, formal tender queries, or legal communications:
              </p>
              <div className="text-xs text-graphite space-y-1 font-medium pt-1">
                <p>Neevevera Private Limited &bull; CIN: Registered in Odisha</p>
                <p>Corporate Office: Sector 9, CDA Industrial Estate, Cuttack, Odisha – 753014</p>
                <p>Email: <a href="mailto:info@neevevara.com" className="text-brand-blue hover:underline">info@neevevara.com</a> &bull; Phone: +91 85969 11655 / +91 76840 78877</p>
              </div>
            </section>

          </div>
        </div>
      </div>
    </>
  );
}
