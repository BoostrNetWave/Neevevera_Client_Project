const fs = require('fs');
let code = fs.readFileSync('client/src/pages/Home.jsx', 'utf8');

const AFTER = '</div></section>\r\n{/* 04 CAPABILITIES (8 Core PRD Divisions) */}';

const TESTIMONIALS_SECTION = `</div></section>
{/* 03b CLIENT TESTIMONIALS */}
<section className="w-full bg-surface-warm border-b border-border-neutral px-6 lg:px-10 py-16 lg:py-24" id="testimonials">
<div className="max-w-7xl mx-auto space-y-8">
  <div className="flex flex-col md:flex-row justify-between md:items-end gap-3 border-b border-border-neutral pb-4">
    <div>
      <span className="text-xs text-brand-blue uppercase font-bold tracking-wider">CLIENT TESTIMONIALS</span>
      <h2 className="font-display text-3xl lg:text-4xl font-extrabold text-graphite uppercase">WHAT OUR CLIENTS SAY</h2>
    </div>
  </div>
  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
  </div>
</div>
</section>
{/* 04 CAPABILITIES (8 Core PRD Divisions) */}`;

const idx = code.indexOf(AFTER);
if (idx === -1) {
  // Try with \n only
  const AFTER2 = '</div></section>\n{/* 04 CAPABILITIES (8 Core PRD Divisions) */}';
  const idx2 = code.indexOf(AFTER2);
  if (idx2 === -1) { console.error('Cannot find anchor'); process.exit(1); }
  code = code.substring(0, idx2) + TESTIMONIALS_SECTION + code.substring(idx2 + AFTER2.length);
} else {
  code = code.substring(0, idx) + TESTIMONIALS_SECTION + code.substring(idx + AFTER.length);
}

fs.writeFileSync('client/src/pages/Home.jsx', code);
console.log('Testimonials section inserted. New lines:', code.split('\n').length);
