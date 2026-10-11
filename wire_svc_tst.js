const fs = require('fs');
let code = fs.readFileSync('client/src/pages/Home.jsx', 'utf8');

// ── 1. Replace Services grid (minified hardcoded cards) ───────────────────────
// Find the services grid opening and replace through to </section>
const SVC_GRID_OPEN = '<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"><div className="bg-surface-warm border border-border-neutral rounded-sm flex flex-col justify-between overflow-hidden shadow-sm hover:border-brand-blue transition-colors"><div className="h-44 overflow-hidden relative"><img alt="Building';
const SVC_GRID_CLOSE = '</div></div></section><section className="w-full bg-surface-white border-b border-border-neutral px-6 lg:px-10 py-16 lg:py-24">';

const svcStart = code.indexOf(SVC_GRID_OPEN);
const svcEnd   = code.indexOf(SVC_GRID_CLOSE);

if (svcStart === -1) { console.error('SVC_GRID_OPEN not found'); process.exit(1); }
if (svcEnd === -1)   { console.error('SVC_GRID_CLOSE not found'); process.exit(1); }

const SERVICES_DYNAMIC = `<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {(liveServices.length > 0 ? liveServices : mockServices).slice(0, 6).map((service, idx) => (
    <div key={service._id || idx} className="bg-surface-warm border border-border-neutral rounded-sm flex flex-col justify-between overflow-hidden shadow-sm hover:border-brand-blue transition-colors">
      <div className="h-44 overflow-hidden relative">
        <img alt={service.title} className="w-full h-full object-cover" src={service.image || service.coverImage || 'https://images.unsplash.com/photo-1541888946425-d0fbb186c5f8?auto=format&fit=crop&w=1200&q=80'} />
        <div className="absolute top-2 left-2 bg-white/90 px-2 py-0.5 text-[11px] font-bold text-brand-blue uppercase rounded-sm">Service {String(idx + 1).padStart(2, '0')}</div>
      </div>
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        <div>
          <h3 className="font-display text-lg font-bold text-graphite uppercase">{service.title}</h3>
          <p className="text-xs text-soft-grey leading-relaxed pt-1">{service.shortDescription || (service.description ? service.description.substring(0, 100) + '...' : '')}</p>
          <ul className="mt-3 space-y-1.5 text-xs text-graphite border-t border-border-neutral pt-2.5">
            {(service.features || []).slice(0, 3).map((f, i) => (
              <li key={i} className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-brand-blue"></span>{f}</li>
            ))}
          </ul>
        </div>
        <Link className="pt-3 border-t border-border-neutral text-xs font-bold text-brand-blue hover:text-brand-blue-hover uppercase inline-flex items-center justify-between" to={service.slug ? '/services/' + service.slug : '#contact'}>
          <span>Enquire About This Service</span><span>&#8594;</span>
        </Link>
      </div>
    </div>
  ))}
</div></div>`;

code = code.substring(0, svcStart) + SERVICES_DYNAMIC + code.substring(svcEnd);
console.log('Services grid wired. New length:', code.length);

// ── 2. Replace Testimonials section ──────────────────────────────────────────
const TST_OPEN  = '<div className="relative mt-12 bg-white border border-border-neutral rounded-sm p-8 lg:p-12 shadow-sm">';
const tstStart  = code.indexOf(TST_OPEN);
const tstEnd    = code.indexOf('</section>', tstStart);

if (tstStart === -1) { console.log('TST_OPEN not found, trying alternative...'); }
else {
  const TESTIMONIALS_DYNAMIC = `<div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
  {(liveTestimonials.length > 0 ? liveTestimonials : mockTestimonials).slice(0, 3).map((t, idx) => (
    <div key={t._id || idx} className="bg-white border border-border-neutral rounded-sm p-8 shadow-sm flex flex-col justify-between">
      <div>
        <div className="flex text-[#F5B041] mb-4">
          {[...Array(5)].map((_, i) => <span key={i} className="material-symbols-outlined text-[18px]">star</span>)}
        </div>
        <p className="text-sm text-graphite leading-relaxed font-medium mb-6">"{(t.content || '').substring(0, 200)}"</p>
      </div>
      <div className="flex items-center gap-4 pt-4 border-t border-border-neutral">
        {(t.image || t.avatar) && <img src={t.image || t.avatar} alt={t.name} className="w-10 h-10 rounded-full object-cover border border-border-neutral" />}
        <div>
          <h4 className="text-xs font-bold text-graphite uppercase">{t.name}</h4>
          <p className="text-[10px] text-soft-grey uppercase font-semibold">{t.role}{t.company ? ', ' + t.company : ''}</p>
        </div>
      </div>
    </div>
  ))}
</div>`;
  code = code.substring(0, tstStart) + TESTIMONIALS_DYNAMIC + code.substring(tstEnd);
  console.log('Testimonials wired.');
}

fs.writeFileSync('client/src/pages/Home.jsx', code);
console.log('DONE. File written successfully.');
