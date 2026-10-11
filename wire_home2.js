const fs = require('fs');
let code = fs.readFileSync('client/src/pages/Home.jsx', 'utf8');

const projectsStart = code.indexOf('<div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch" id="projects-grid">');
if (projectsStart !== -1) {
  const secEnd = code.indexOf('</section>', projectsStart);
  if (secEnd !== -1) {
    const replacement = `<div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch" id="projects-grid">
  {(liveProjects?.length > 0 ? liveProjects : mockProjects.slice(0, 3)).map((project, idx) => (
    <div key={project.id || project.slug || idx} className="bg-white border border-border-neutral flex flex-col justify-between group overflow-hidden rounded-sm shadow-sm">
      <div className="relative overflow-hidden h-[300px]">
        <img alt={project.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" src={project.coverImage || project.image || '/placeholder.jpg'} />
        <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm border border-border-neutral px-2.5 py-1 rounded-sm">
          <span className="text-xs text-brand-blue font-bold uppercase">{project.category || 'Infrastructure'}</span>
        </div>
      </div>
      <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
        <div>
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="text-soft-grey uppercase font-medium">{project.client || 'Client'}</span>
            <span className="text-brand-blue font-bold">{project.location || 'Location'}</span>
          </div>
          <h3 className="font-display text-xl font-bold text-graphite uppercase">{project.title}</h3>
          <p className="text-xs text-soft-grey leading-relaxed mt-2">{project.shortDescription || (project.description ? project.description.substring(0, 100) + '...' : '')}</p>
        </div>
        <div className="pt-3 border-t border-border-neutral flex items-center justify-between text-xs">
          <span className="text-brand-green font-medium uppercase tracking-wider">{project.status || 'Completed'}</span>
          <Link className="uppercase font-bold text-brand-blue hover:text-brand-blue-hover inline-flex items-center gap-1 transition-colors" to={\`/projects/\${project.slug}\`}>
            <span>View Project</span>
            <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
          </Link>
        </div>
      </div>
    </div>
  ))}
</div></div>`;
    code = code.substring(0, projectsStart) + replacement + code.substring(secEnd);
    console.log('Projects grid updated.');
  }
}

const testimonialsStart = code.indexOf('<div className="relative mt-12 bg-white border border-border-neutral rounded-sm p-8 lg:p-12 shadow-sm">');
if (testimonialsStart !== -1) {
  const secEnd = code.indexOf('</section>', testimonialsStart);
  if (secEnd !== -1) {
    const replacement = `<div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
  {(liveTestimonials?.length > 0 ? liveTestimonials : mockTestimonials.slice(0, 3)).map((testimonial, idx) => (
    <div key={testimonial.id || idx} className="bg-white border border-border-neutral rounded-sm p-8 shadow-sm flex flex-col justify-between">
      <div>
        <div className="flex text-[#F5B041] mb-4">
          {[...Array(5)].map((_, i) => (
            <span key={i} className="material-symbols-outlined text-[18px]">star</span>
          ))}
        </div>
        <p className="text-sm text-graphite leading-relaxed font-medium mb-6">"{testimonial.content}"</p>
      </div>
      <div className="flex items-center gap-4 pt-4 border-t border-border-neutral">
        {testimonial.image && (
          <img src={testimonial.image} alt={testimonial.name} className="w-10 h-10 rounded-full object-cover border border-border-neutral" />
        )}
        <div>
          <h4 className="text-xs font-bold text-graphite uppercase">{testimonial.name}</h4>
          <p className="text-[10px] text-soft-grey uppercase font-semibold">{testimonial.role}, {testimonial.company}</p>
        </div>
      </div>
    </div>
  ))}
</div></div>`;
    code = code.substring(0, testimonialsStart) + replacement + code.substring(secEnd);
    console.log('Testimonials updated.');
  }
}

fs.writeFileSync('client/src/pages/Home.jsx', code);
