import React from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';

export default function PartnerTerms() {
  return (
    <>
      <Helmet>
        <title>Partner &amp; Associate Terms | Neevevera Private Limited</title>
        <meta
          name="description"
          content="Review the terms and engagement principles for marketing associates, technical partners, and channel affiliates of Neevevera Private Limited."
        />
      </Helmet>

      <div className="bg-surface-white min-h-screen py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Breadcrumb / Top Tag */}
          <div className="flex items-center gap-2 text-xs text-soft-grey mb-4">
            <Link to="/" className="hover:text-brand-blue transition-colors">Home</Link>
            <span>/</span>
            <span className="text-graphite font-semibold">Partner &amp; Associate Terms</span>
          </div>

          {/* Review Notice Banner */}
          <div className="mb-8 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs sm:text-sm leading-relaxed flex items-start gap-3">
            <span className="material-symbols-outlined text-amber-600 shrink-0 text-xl mt-0.5">handshake</span>
            <div>
              <strong className="font-bold block uppercase tracking-wider text-[11px] text-amber-800 mb-0.5">
                [Draft for Legal &amp; Management Review]
              </strong>
              These Associate Terms outline the relationship framework between Neevevera Private Limited and external business partners, referral associates, and freelance technical professionals. This document is under active corporate counsel review.
            </div>
          </div>

          {/* CRITICAL INACTIVE INCENTIVES CALLOUT */}
          <div className="mb-8 p-5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs sm:text-sm leading-relaxed">
            <div className="flex items-center gap-2 text-rose-800 font-bold uppercase tracking-wider text-xs mb-1">
              <span className="material-symbols-outlined text-base">warning</span>
              Notice Regarding Incentive &amp; Payout Schedules
            </div>
            <p className="mt-1">
              <strong>Please Note:</strong> All partner referral fee percentages, incentive ledgers, and automated payout mechanisms are currently <strong>INACTIVE</strong> and undergoing statutory, tax (TDS), and executive board evaluation. Submitting an expression of interest or registering as an associate does <em>not</em> establish an entitlement to automatic financial remuneration or create an agency agreement.
            </p>
          </div>

          {/* Header */}
          <div className="border-b border-border-neutral pb-6 mb-8">
            <h1 className="text-3xl sm:text-4xl font-display font-extrabold text-graphite tracking-tight">
              Partner &amp; Associate Code of Engagement
            </h1>
            <p className="mt-2 text-sm text-soft-grey">
              Draft Version: <strong>v1.0 (Draft)</strong> &bull; Effective Scope: Marketing Partners, Channel Associates &amp; Freelance Technical Collaborators
            </p>
          </div>

          {/* Content Sections */}
          <div className="space-y-8 text-sm text-graphite leading-relaxed">
            
            {/* 1. Nature of Relationship */}
            <section className="space-y-3">
              <h2 className="text-lg font-display font-bold text-graphite flex items-center gap-2">
                <span className="text-brand-blue font-mono text-base">01.</span>
                Nature of the Relationship
              </h2>
              <p>
                The relationship between <strong>Neevevera Private Limited</strong> and any registered marketing partner, channel associate, or freelance professional is strictly that of an <strong>independent principal-to-principal contractor</strong>.
              </p>
              <ul className="list-disc pl-5 space-y-1 text-soft-grey">
                <li>No partnership, joint venture, employment, or employer-employee relationship is created.</li>
                <li>Partners are not eligible for statutory employee benefits, insurance, or company retiral schemes.</li>
                <li>Partners must never describe themselves as employees, corporate executives, or authorized signing authorities of Neevevera.</li>
              </ul>
            </section>

            {/* 2. Authority Restrictions */}
            <section className="space-y-3">
              <h2 className="text-lg font-display font-bold text-graphite flex items-center gap-2">
                <span className="text-brand-blue font-mono text-base">02.</span>
                Authority Limitations &amp; No Cash Handling
              </h2>
              <div className="p-4 rounded-xl bg-surface-warm border border-border-neutral space-y-2">
                <p className="font-semibold text-graphite text-xs uppercase tracking-wider">
                  Strict Limitations of Authority:
                </p>
                <ul className="list-disc pl-5 space-y-1 text-xs text-soft-grey">
                  <li>
                    <strong>No Contractual Commitment:</strong> Partners possess no authority to enter into agreements, sign construction bids, issue price guarantees, or waive contractual conditions on behalf of Neevevera.
                  </li>
                  <li>
                    <strong>Strictly Zero Cash Handling:</strong> Partners are strictly prohibited from receiving cash, un-crossed cheques, or personal account transfers from prospective clients. All project payments and booking tokens must be paid directly to Neevevera Private Limited&rsquo;s official bank accounts or authorized Razorpay gateway.
                  </li>
                </ul>
              </div>
            </section>

            {/* 3. Inactive Incentive Schedules */}
            <section className="space-y-3">
              <h2 className="text-lg font-display font-bold text-graphite flex items-center gap-2">
                <span className="text-brand-blue font-mono text-base">03.</span>
                Referral Ledgers &amp; Remuneration Inactivity
              </h2>
              <p>
                Any future commission, incentive rate, or referral allowance will take effect only upon:
              </p>
              <ol className="list-decimal pl-5 space-y-1.5 text-soft-grey">
                <li>Formal written agreement executed between Neevevera Private Limited and the partner.</li>
                <li>Submission and verification of valid Indian tax credentials (Permanent Account Number - PAN, GSTIN if applicable).</li>
                <li>Statutory compliance with Tax Deducted at Source (TDS) under Section 194H / 194J of the Income Tax Act, 1961.</li>
                <li>Actual realization of milestones and contract clearance by the client.</li>
              </ol>
              <p className="text-xs text-soft-grey italic">
                Neevevera reserves the absolute discretion to approve, adjust, or reject referral submissions based on company lead qualification criteria.
              </p>
            </section>

            {/* 4. Ethics, Anti-Bribery & Non-Circumvention */}
            <section className="space-y-3">
              <h2 className="text-lg font-display font-bold text-graphite flex items-center gap-2">
                <span className="text-brand-blue font-mono text-base">04.</span>
                Ethical Standards, Anti-Bribery &amp; Compliance
              </h2>
              <p>
                Partners must conduct all promotional and referral activities in accordance with the highest standards of professional integrity:
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-soft-grey">
                <li>
                  <strong>Anti-Bribery:</strong> Partners shall not offer, promise, or give any bribe, kickback, or unlawful inducement to any government official, public authority, or client representative.
                </li>
                <li>
                  <strong>Accurate Representation:</strong> Partners must not misrepresent project capabilities, statutory licenses, engineering certifications, or delivery timelines.
                </li>
                <li>
                  <strong>Confidentiality &amp; Non-Circumvention:</strong> Technical drawings, pricing schedules, and proprietary CPWD DSR rate models shared during collaboration remain confidential and may not be diverted to competing builders.
                </li>
              </ul>
            </section>

            {/* 5. Termination & Dispute Jurisdiction */}
            <section className="space-y-3">
              <h2 className="text-lg font-display font-bold text-graphite flex items-center gap-2">
                <span className="text-brand-blue font-mono text-base">05.</span>
                Termination &amp; Legal Jurisdiction
              </h2>
              <p>
                Neevevera Private Limited reserves the unilateral right to revoke partner accreditation or terminate technical collaborations immediately in the event of ethical breaches, unauthorized financial collections, or misrepresentation.
              </p>
              <p>
                These terms are governed exclusively by the laws of India and subject to the jurisdiction of the competent courts in <strong>Cuttack and Bhubaneswar, Odisha</strong>.
              </p>
            </section>

            {/* Contact Support */}
            <section className="mt-8 p-6 rounded-2xl bg-surface-warm border border-border-neutral text-xs text-soft-grey space-y-1">
              <h3 className="font-bold text-graphite text-sm">Channel Partner &amp; Corporate Collaborations Desk</h3>
              <p>Email: <a href="mailto:partners@neevevara.com" className="text-brand-blue hover:underline">partners@neevevara.com</a> &bull; General Office: <a href="mailto:info@neevevara.com" className="text-brand-blue hover:underline">info@neevevara.com</a></p>
              <p>Headquarters: Sector 9, CDA Industrial Estate, Cuttack, Odisha – 753014</p>
            </section>

          </div>
        </div>
      </div>
    </>
  );
}
