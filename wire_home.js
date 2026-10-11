const fs = require('fs');

let code = fs.readFileSync('client/src/pages/Home.jsx', 'utf8');

if (!code.includes('mockServices')) {
  code = code.replace(
    `import axios from 'axios';`, 
    `import axios from 'axios';\nimport { services as mockServices, projects as mockProjects, testimonials as mockTestimonials } from '../data/mockData';`
  );
}

// 1. SERVICES REPLACEMENT
const servicesStart = code.indexOf('<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">');
const servicesEnd = code.indexOf('</div></div></section><section className="w-full bg-surface-white border-b border-border-neutral px-6 lg:px-10 py-16 lg:py-24" id="portfolio">');
if (servicesStart === -1) {
    console.log("Services start not found");
}
if (servicesStart !== -1) {
  // Let's just find the closing tags of the grid. It's followed by </section>
  const secEnd = code.indexOf('</section>', servicesStart);
  
  if (secEnd !== -1) {
    const replacement = `<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {(liveServices?.length > 0 ? liveServices : mockServices.slice(0, 6)).map((service, idx) => (
    <div key={service.id || service.slug || idx} className="bg-surface-warm border border-border-neutral rounded-sm flex flex-col justify-between overflow-hidden shadow-sm hover:border-brand-blue transition-colors">
      <div className="h-44 overflow-hidden relative">
        <img alt={service.title} className="w-full h-full object-cover" src={service.image || service.coverImage || '/placeholder.jpg'} />
        <div className="absolute top-2 left-2 bg-white/90 px-2 py-0.5 text-[11px] font-bold text-brand-blue uppercase rounded-sm">
          Service {String(idx + 1).padStart(2, '0')}
        </div>
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
        <Link className="pt-3 border-t border-border-neutral text-xs font-bold text-brand-blue hover:text-brand-blue-hover uppercase inline-flex items-center justify-between" to={\`/services/\${service.slug}\`}>
          <span>Enquire About This Service</span><span>→</span>
        </Link>
      </div>
    </div>
  ))}
</div></div>`;
    code = code.substring(0, servicesStart) + replacement + code.substring(secEnd);
  }
}

fs.writeFileSync('client/src/pages/Home.jsx', code);
console.log('Services updated successfully.');
