const fs = require('fs');

// ────────────────────────────────────────────────────────
// 1. FIX mockData.js — use verified Pexels CDN images
//    (Pexels images are free for commercial use, CC0)
// ────────────────────────────────────────────────────────
const IMG_BLOCK = `/* ── Image helpers — Pexels CC0 / Unsplash license (free commercial use) ── */
const IMG = {
  hero:        'https://images.pexels.com/photos/1159548/pexels-photo-1159548.jpeg?auto=compress&cs=tinysrgb&w=1400',
  building:    'https://images.pexels.com/photos/323780/pexels-photo-323780.jpeg?auto=compress&cs=tinysrgb&w=900',
  bridge:      'https://images.pexels.com/photos/210182/pexels-photo-210182.jpeg?auto=compress&cs=tinysrgb&w=900',
  rebar:       'https://images.pexels.com/photos/1078884/pexels-photo-1078884.jpeg?auto=compress&cs=tinysrgb&w=900',
  commercial:  'https://images.pexels.com/photos/1486785/pexels-photo-1486785.jpeg?auto=compress&cs=tinysrgb&w=900',
  industrial:  'https://images.pexels.com/photos/1216589/pexels-photo-1216589.jpeg?auto=compress&cs=tinysrgb&w=900',
  residential: 'https://images.pexels.com/photos/259588/pexels-photo-259588.jpeg?auto=compress&cs=tinysrgb&w=900',
  pmc:         'https://images.pexels.com/photos/416405/pexels-photo-416405.jpeg?auto=compress&cs=tinysrgb&w=900',
  repair:      'https://images.pexels.com/photos/1094770/pexels-photo-1094770.jpeg?auto=compress&cs=tinysrgb&w=900',
  coastal:     'https://images.pexels.com/photos/221012/pexels-photo-221012.jpeg?auto=compress&cs=tinysrgb&w=900',
  warehouse:   'https://images.pexels.com/photos/236698/pexels-photo-236698.jpeg?auto=compress&cs=tinysrgb&w=900',
  highrise:    'https://images.pexels.com/photos/1134166/pexels-photo-1134166.jpeg?auto=compress&cs=tinysrgb&w=900',
  road:        'https://images.pexels.com/photos/1020016/pexels-photo-1020016.jpeg?auto=compress&cs=tinysrgb&w=900',
  interior:    'https://images.pexels.com/photos/1643383/pexels-photo-1643383.jpeg?auto=compress&cs=tinysrgb&w=900',
  team1:       'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=400',
  team2:       'https://images.pexels.com/photos/1516680/pexels-photo-1516680.jpeg?auto=compress&cs=tinysrgb&w=400',
  team3:       'https://images.pexels.com/photos/3756679/pexels-photo-3756679.jpeg?auto=compress&cs=tinysrgb&w=400',
  team4:       'https://images.pexels.com/photos/2182970/pexels-photo-2182970.jpeg?auto=compress&cs=tinysrgb&w=400',
}`;

let mockData = fs.readFileSync('client/src/data/mockData.js', 'utf8');

// Replace the IMG block (first occurrence - a single const IMG = { ... })
mockData = mockData.replace(/\/\* ── Image helpers[\s\S]*?}\s*\n/, IMG_BLOCK + '\n');

// Also patch gallery items that might have wrong images
// Fix gallery specifically:
mockData = mockData.replace(
  /\{ id: 3, image: IMG\.coastal[\s\S]*?'Infrastructure'\s*,\s*tagColor: 'brand-gold'\s*\}/,
  `{ id: 3, image: IMG.bridge,    caption: 'Girder Launching Operations',    tag: 'Infrastructure',  tagColor: 'brand-gold'  }`
);

fs.writeFileSync('client/src/data/mockData.js', mockData, 'utf8');
console.log('✅ mockData images patched with Pexels CC0 URLs');

// ────────────────────────────────────────────────────────
// 2. FIX Home.jsx — replace all old Unsplash URLs with Pexels
// ────────────────────────────────────────────────────────
let home = fs.readFileSync('client/src/pages/Home.jsx', 'utf8');

const unsplashToPexels = {
  'photo-1504307651254-35680f356dfd': { pexels: '1159548', type: 'construction site' },
  'photo-1486325212027-8081e485255e': { pexels: '323780',  type: 'building' },
  'photo-1486406146926-c627a92ad1ab': { pexels: '323780',  type: 'building' },
  'photo-1531834685032-c9002d40900b': { pexels: '210182',  type: 'bridge' },
  'photo-1587293852726-70cdb56c2866': { pexels: '1216589', type: 'industrial' },
  'photo-1503387762-592deb58ef4e':   { pexels: '416405',  type: 'pmc' },
};

// Replace Unsplash image URLs in Home.jsx
home = home.replace(
  /https:\/\/images\.unsplash\.com\/photo-1504307651254-35680f356dfd[^"']*/g,
  'https://images.pexels.com/photos/1159548/pexels-photo-1159548.jpeg?auto=compress&cs=tinysrgb&w=1200'
);
home = home.replace(
  /https:\/\/images\.unsplash\.com\/photo-1486325212027-8081e485255e[^"']*/g,
  'https://images.pexels.com/photos/323780/pexels-photo-323780.jpeg?auto=compress&cs=tinysrgb&w=1200'
);
home = home.replace(
  /https:\/\/images\.unsplash\.com\/photo-1486406146926-c627a92ad1ab[^"']*/g,
  'https://images.pexels.com/photos/323780/pexels-photo-323780.jpeg?auto=compress&cs=tinysrgb&w=900'
);
home = home.replace(
  /https:\/\/images\.unsplash\.com\/photo-1531834685032-c9002d40900b[^"']*/g,
  'https://images.pexels.com/photos/210182/pexels-photo-210182.jpeg?auto=compress&cs=tinysrgb&w=1000'
);
home = home.replace(
  /https:\/\/images\.unsplash\.com\/photo-1587293852726-70cdb56c2866[^"']*/g,
  'https://images.pexels.com/photos/1216589/pexels-photo-1216589.jpeg?auto=compress&cs=tinysrgb&w=900'
);
home = home.replace(
  /https:\/\/images\.unsplash\.com\/photo-1503387762-592deb58ef4e[^"']*/g,
  'https://images.pexels.com/photos/416405/pexels-photo-416405.jpeg?auto=compress&cs=tinysrgb&w=900'
);
// Catch any remaining unsplash URLs
home = home.replace(
  /https:\/\/images\.unsplash\.com\/[^"']*/g,
  'https://images.pexels.com/photos/1159548/pexels-photo-1159548.jpeg?auto=compress&cs=tinysrgb&w=1200'
);

fs.writeFileSync('client/src/pages/Home.jsx', home, 'utf8');
console.log('✅ Home.jsx images patched');

// ────────────────────────────────────────────────────────
// 3. FIX all other pages Unsplash → Pexels
// ────────────────────────────────────────────────────────
const pages = [
  'client/src/pages/Projects.jsx',
  'client/src/pages/Services.jsx',
  'client/src/pages/ServiceDetail.jsx',
  'client/src/pages/ProjectDetail.jsx',
  'client/src/pages/Gallery.jsx',
  'client/src/pages/About.jsx',
  'client/src/pages/Team.jsx',
];

pages.forEach(p => {
  if (!fs.existsSync(p)) return;
  let c = fs.readFileSync(p, 'utf8');
  if (c.includes('unsplash.com')) {
    c = c.replace(/https:\/\/images\.unsplash\.com\/[^"']*/g,
      'https://images.pexels.com/photos/1159548/pexels-photo-1159548.jpeg?auto=compress&cs=tinysrgb&w=1200');
    fs.writeFileSync(p, c, 'utf8');
    console.log('✅ Patched:', p);
  }
});

console.log('\n✅ All image URLs patched to Pexels CC0 (free for commercial use)');
