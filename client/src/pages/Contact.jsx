import React, { useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { FiPhone, FiMail, FiMapPin, FiSend, FiCheckCircle, FiClock, FiShield, FiAlertCircle, FiLoader } from 'react-icons/fi'
import { useFormSubmit } from '../hooks/useFormSubmit'
import { submitEnquiry } from '../services/enquiry.api'

const Contact = () => {
  const { submit, status, errorMsg, reset } = useFormSubmit(submitEnquiry)
  const [form, setForm] = useState({
    name: '',
    organization: '',
    email: '',
    phone: '',
    serviceCategory: 'Tender / RFQ Submission',
    vendorRegion: 'Odisha HQ Corridor',
    projectScope: '',
    type: 'contact',
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    await submit(form)
  }

  return (
    <div className="w-full bg-[#FAF9F6] text-[#171717]">
      <Helmet>
        <title>Contact & Procurement | Neevevera Private Limited</title>
        <meta name="description" content="Submit tenders, RFQs and general inquiries to Neevevera's three regional offices across Odisha, Andaman Islands and Kolkata." />
        <meta property="og:title" content="Contact & Procurement | Neevevera" />
        <meta property="og:description" content="Direct communication channels for government authorities, institutional clients, sub-contractors and vendor registration." />
      </Helmet>
      {/* ── Header ── */}
      <section className="border-b border-[#D8D8D2] pt-10 pb-12 bg-gradient-to-b from-[#F2EFE9]/70 to-[#FAF9F6]">
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <div className="text-[11px] font-medium tracking-widest uppercase text-[#07558F] font-bold mb-2">
            17 // ENGAGEMENT DESK
          </div>
          <h1 className="font-display text-4xl sm:text-5xl font-extrabold text-[#111822] tracking-tight">
            Procurement &amp; Contact Directorate
          </h1>
          <p className="text-sm sm:text-base text-[#444440] mt-3 max-w-2xl font-light">
            Direct communication channels for government tender authorities, institutional clients, sub-contractors, and vendor registration across our three regional offices.
          </p>
        </div>
      </section>

      {/* ── Three Regional Directorate Hubs ── */}
      <section className="py-12 border-b border-[#D8D8D2] bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

            {/* Hub 1 */}
            <div className="border border-[#D8D8D2] bg-[#FAF9F6] p-6 space-y-3">
              <div className="text-[10px] font-medium font-bold tracking-widest uppercase text-[#07558F]">
                CENTRAL HEADQUARTERS
              </div>
              <h3 className="font-display text-lg font-bold text-[#111822]">
                Odisha Civil Engineering Directorate
              </h3>
              <div className="text-xs text-[#444440] font-medium space-y-1">
                <div>Sector 9, CDA Industrial Estate</div>
                <div>Cuttack, Odisha - 753014</div>
              </div>
              <div className="pt-2 border-t border-[#E5E3DC] space-y-1 text-xs font-medium">
                <div><span className="text-[#6B6B67]">Phone:</span> <a href="tel:+918596911655" className="font-bold text-[#111822] hover:underline">+91 8596911655</a></div>
                <div><span className="text-[#6B6B67]">Email:</span> <a href="mailto:odisha.hq@neevevara.com" className="font-bold text-[#07558F] hover:underline">odisha.hq@neevevara.com</a></div>
              </div>
            </div>

            {/* Hub 2 */}
            <div className="border border-[#D8D8D2] bg-[#FAF9F6] p-6 space-y-3">
              <div className="text-[10px] font-medium font-bold tracking-widest uppercase text-[#075638]">
                ANDAMAN REGIONAL CELL
              </div>
              <h3 className="font-display text-lg font-bold text-[#111822]">
                Marine &amp; Coastal Directorate
              </h3>
              <div className="text-xs text-[#444440] font-medium space-y-1">
                <div>Haddo Maritime Corridor</div>
                <div>Port Blair, A&amp;N Islands - 744102</div>
              </div>
              <div className="pt-2 border-t border-[#E5E3DC] space-y-1 text-xs font-medium">
                <div><span className="text-[#6B6B67]">Phone:</span> <a href="tel:+918596911656" className="font-bold text-[#111822] hover:underline">+91 8596911656</a></div>
                <div><span className="text-[#6B6B67]">Email:</span> <a href="mailto:andaman@neevevara.com" className="font-bold text-[#07558F] hover:underline">andaman@neevevara.com</a></div>
              </div>
            </div>

            {/* Hub 3 */}
            <div className="border border-[#D8D8D2] bg-[#FAF9F6] p-6 space-y-3">
              <div className="text-[10px] font-medium font-bold tracking-widest uppercase text-[#B9923B]">
                BENGAL COMMERCIAL CELL
              </div>
              <h3 className="font-display text-lg font-bold text-[#111822]">
                Kolkata Regional Office
              </h3>
              <div className="text-xs text-[#444440] font-medium space-y-1">
                <div>Sector V, Salt Lake City</div>
                <div>Kolkata, West Bengal - 700091</div>
              </div>
              <div className="pt-2 border-t border-[#E5E3DC] space-y-1 text-xs font-medium">
                <div><span className="text-[#6B6B67]">Phone:</span> <a href="tel:+913329551040" className="font-bold text-[#111822] hover:underline">+91 33 2955 1040</a></div>
                <div><span className="text-[#6B6B67]">Email:</span> <a href="mailto:kolkata@neevevara.com" className="font-bold text-[#07558F] hover:underline">kolkata@neevevara.com</a></div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── Direct Inquiry & RFQ Form ── */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-6">
          <div className="border border-[#D8D8D2] bg-white p-8 sm:p-10 shadow-sm">
            <div className="pb-6 border-b border-[#E5E3DC] mb-6">
              <h2 className="font-display text-2xl font-bold text-[#111822]">
                Submit Tender Document, RFQ or General Inquiry
              </h2>
              <p className="text-xs text-[#6B6B67] font-medium mt-1">
                Submissions are logged directly into our central estimating desk and acknowledged with a reference tracking ID.
              </p>
            </div>

            {status === 'success' ? (
              <div className="py-12 text-center bg-emerald-50 border border-emerald-200">
                <FiCheckCircle className="mx-auto text-[#075638] mb-3" size={48} />
                <h3 className="font-display text-2xl font-bold text-[#075638]">
                  Inquiry Dispatched to Engineering Cell
                </h3>
                <p className="text-xs font-medium text-emerald-950 mt-2 max-w-md mx-auto">
                  Our procurement officer will review your submission and contact you within 24 working hours.
                </p>
                <button
                  onClick={reset}
                  className="mt-6 px-6 py-2.5 bg-[#07558F] text-white text-xs font-medium font-bold uppercase"
                >
                  Send Another Inquiry
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Error banner — form stays intact so nothing typed is lost */}
                {status === 'error' && (
                  <div className="flex items-start gap-2.5 p-3.5 bg-red-50 border border-red-200 text-xs font-medium text-red-800">
                    <FiAlertCircle size={15} className="shrink-0 mt-0.5" />
                    <span>{errorMsg}</span>
                  </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium uppercase text-[#6B6B67] mb-1 font-semibold">
                      Full Name *
                    </label>
                    <input
                      required
                      type="text"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      disabled={status === 'loading'}
                      placeholder="e.g. Er. Devendra Das"
                      className="w-full text-xs font-medium px-3 py-2.5 bg-[#FAF9F6] border border-[#D8D8D2] focus:outline-none focus:border-[#07558F]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium uppercase text-[#6B6B67] mb-1 font-semibold">
                      Company / Organization Name
                    </label>
                    <input
                      type="text"
                      value={form.organization}
                      onChange={(e) => setForm({ ...form, organization: e.target.value })}
                      disabled={status === 'loading'}
                      placeholder="e.g. Apex Industrial Parks Ltd."
                      className="w-full text-xs font-medium px-3 py-2.5 bg-[#FAF9F6] border border-[#D8D8D2] focus:outline-none focus:border-[#07558F]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium uppercase text-[#6B6B67] mb-1 font-semibold">
                      Official Email *
                    </label>
                    <input
                      required
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      disabled={status === 'loading'}
                      placeholder="devendra@domain.com"
                      className="w-full text-xs font-medium px-3 py-2.5 bg-[#FAF9F6] border border-[#D8D8D2] focus:outline-none focus:border-[#07558F]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium uppercase text-[#6B6B67] mb-1 font-semibold">
                      Phone Number *
                    </label>
                    <input
                      required
                      type="tel"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      disabled={status === 'loading'}
                      placeholder="+91 94370 00000"
                      className="w-full text-xs font-medium px-3 py-2.5 bg-[#FAF9F6] border border-[#D8D8D2] focus:outline-none focus:border-[#07558F]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium uppercase text-[#6B6B67] mb-1 font-semibold">
                      Inquiry Classification
                    </label>
                    <select
                      value={form.serviceCategory}
                      onChange={(e) => setForm({ ...form, serviceCategory: e.target.value })}
                      disabled={status === 'loading'}
                      className="w-full text-xs font-medium px-3 py-2.5 bg-[#FAF9F6] border border-[#D8D8D2] focus:outline-none focus:border-[#07558F]"
                    >
                      <option>Tender / RFQ Submission</option>
                      <option>Turnkey Commercial Construction</option>
                      <option>Industrial Facility &amp; PEB</option>
                      <option>Coastal / Maritime Works</option>
                      <option>Material Vendor Registration</option>
                      <option>Subcontractor Partnership</option>
                      <option>General Administration</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium uppercase text-[#6B6B67] mb-1 font-semibold">
                      Designated Regional Corridor
                    </label>
                    <select
                      value={form.vendorRegion}
                      onChange={(e) => setForm({ ...form, vendorRegion: e.target.value })}
                      disabled={status === 'loading'}
                      className="w-full text-xs font-medium px-3 py-2.5 bg-[#FAF9F6] border border-[#D8D8D2] focus:outline-none focus:border-[#07558F]"
                    >
                      <option>Odisha HQ Corridor</option>
                      <option>Andaman &amp; Nicobar Islands</option>
                      <option>Kolkata &amp; Bengal Zone</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium uppercase text-[#6B6B67] mb-1 font-semibold">
                    Detailed Scope, BOQ Summary or Requirements
                  </label>
                  <textarea
                    rows={4}
                    value={form.projectScope}
                    onChange={(e) => setForm({ ...form, projectScope: e.target.value })}
                    placeholder="Provide site location, proposed built area, tentative commencement date, foundation requirements..."
                    disabled={status === 'loading'}
                    className="w-full text-xs font-medium px-3 py-2.5 bg-[#FAF9F6] border border-[#D8D8D2] focus:outline-none focus:border-[#07558F]"
                  ></textarea>
                </div>

                <button
                  type="submit"
                  disabled={status === 'loading'}
                  className="w-full py-3.5 bg-[#07558F] hover:bg-[#054373] disabled:opacity-60 disabled:cursor-not-allowed text-white text-xs font-medium font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2 shadow-xs"
                >
                  {status === 'loading' ? (
                    <>
                      <svg className="animate-spin" width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="10" strokeOpacity="0.25" /><path d="M12 2a10 10 0 0 1 10 10" /></svg>
                      <span>Dispatching...</span>
                    </>
                  ) : (
                    <>
                      <FiSend size={14} />
                      <span>Dispatch Message to Central Procurement</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* ── Google Maps — Odisha HQ ── */}
      <section className="border-t border-[#D8D8D2]">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 py-10">
          <div className="text-[11px] font-bold tracking-widest uppercase text-[#07558F] mb-4">LOCATION // ODISHA HEADQUARTERS</div>
          <div className="border border-[#D8D8D2] overflow-hidden">
            <iframe
              title="Neevevera Odisha HQ Location"
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3743.0!2d85.8830!3d20.4625!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3a190909d6d38d35%3A0x2b3e2e2ef8e11e8b!2sCuttack%2C%20Odisha!5e0!3m2!1sen!2sin!4v1700000000000!5m2!1sen!2sin"
              width="100%"
              height="320"
              style={{ border: 0, display: 'block' }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
          <p className="text-[10px] text-[#6B6B67] font-medium mt-2">
            ⚠️ Exact pin to be updated by client — replace the embed src with the Maps Share → Embed URL for the verified office address.
          </p>
        </div>
      </section>
    </div>
  )
}

export default Contact
