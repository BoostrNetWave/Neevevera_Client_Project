const fs = require('fs');

const sectorComponent = `
import React, { useState } from 'react';

const sectorData = {
  residential: {
    title: 'Residential Developments & Gated Communities',
    desc: 'Engineered high-rise and multi-family structures meeting IS 1893 seismic standards.',
    img: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=80'
  },
  commercial: {
    title: 'Commercial Towers & IT Park Campuses',
    desc: 'Post-tensioned clear floor spans, high-efficiency MEP shafts, and premium facade structural frameworks.',
    img: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=800&q=80'
  },
  industrial: {
    title: 'Heavy Industrial Facilities & Logistics PEB',
    desc: 'Abrasion-resistant superflat FM2 laser-screed floors, vibration-damped machinery foundations.',
    img: 'https://images.unsplash.com/photo-1587293852726-70cdb56c2866?auto=format&fit=crop&w=800&q=80'
  },
  infrastructure: {
    title: 'Marine, Bridges & Regional Highway Viaducts',
    desc: 'Coastal seawalls, reinforced concrete viaducts, deep bored pile foundations.',
    img: 'https://images.unsplash.com/photo-1531834685032-c9002d40900b?auto=format&fit=crop&w=800&q=80'
  },
  government: {
    title: 'Public Works & Institutional Development',
    desc: 'Hospitals, administrative blocks, and public utility infrastructure executed to PWD standards.',
    img: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=800&q=80'
  }
};

export const SectorSpecialization = () => {
  const [activeTab, setActiveTab] = useState('residential');
  const data = sectorData[activeTab];

  return (
    <section className="w-full bg-surface-white border-b border-border-neutral px-6 lg:px-10 py-16 lg:py-24">
      <div className="max-w-7xl mx-auto space-y-10">
        <div className="space-y-3">
          <span className="text-xs text-brand-blue uppercase font-bold tracking-wider">06 SECTORS</span>
          <h2 className="font-display text-3xl font-extrabold text-graphite uppercase">SECTOR SPECIALIZATION</h2>
        </div>
        <div className="flex flex-wrap gap-2 border-b border-border-neutral pb-2">
          {Object.keys(sectorData).map(key => (
            <button 
              key={key}
              onClick={() => setActiveTab(key)} 
              className={\`px-4 py-2 text-xs uppercase transition-colors rounded-sm \${activeTab === key ? 'font-bold bg-brand-blue text-white' : 'font-medium text-soft-grey hover:text-graphite'}\`}
            >
              {key}
            </button>
          ))}
        </div>
        <div className="bg-surface-warm border border-border-neutral p-6 lg:p-10 rounded-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="space-y-4">
              <h3 className="font-display text-2xl font-bold text-graphite">{data.title}</h3>
              <p className="text-sm text-soft-grey leading-relaxed">{data.desc}</p>
            </div>
            <div className="h-48 overflow-hidden rounded-sm">
              <img src={data.img} alt={data.title} className="w-full h-full object-cover" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
`;

fs.writeFileSync('client/src/components/SectorSpecialization.jsx', sectorComponent, 'utf8');

// Now replace the static section in Home.jsx
let home = fs.readFileSync('client/src/pages/Home.jsx', 'utf8');

// Insert import at the top
if (!home.includes('SectorSpecialization')) {
  home = home.replace("import { Link } from 'react-router-dom';", "import { Link } from 'react-router-dom';\nimport { SectorSpecialization } from '../components/SectorSpecialization';");
}

// Regex to replace the whole section
const startComment = '{/* 06 SECTORS (Interactive Specialization Tabs) */}';
const endComment = '{/* 07 RESOURCE NETWORK & PIN CODE AUDITOR */}';
const startIndex = home.indexOf(startComment);
const endIndex = home.indexOf(endComment);

if (startIndex !== -1 && endIndex !== -1) {
  const before = home.substring(0, startIndex);
  const after = home.substring(endIndex);
  home = before + startComment + '\n<SectorSpecialization />\n' + after;
  fs.writeFileSync('client/src/pages/Home.jsx', home, 'utf8');
  console.log('Replaced sector section in Home.jsx');
} else {
  console.log('Could not find sector section boundaries.');
}
