const fs = require('fs');
let data = fs.readFileSync('client/src/data/mockData.js', 'utf8');

const newImgObj = `const IMG = {
  hero: '/images/hero_construction.jpg',
  building: 'https://images.unsplash.com/photo-1541888086225-ee8252277d7f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
  bridge: 'https://images.unsplash.com/photo-1590486803833-1c5dc8ddd4c8?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
  rebar: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
  commercial: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
  industrial: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
  residential: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
  pmc: 'https://images.unsplash.com/photo-1504307651254-35680f356f58?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
  repair: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
  coastal: 'https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
  warehouse: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
  highrise: 'https://images.unsplash.com/photo-1574360773950-89196b245a99?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
  road: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
  interior: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
  team1: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
  team2: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
  team3: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
  team4: 'https://images.unsplash.com/photo-1581092795360-fd1ca04f0952?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
}`;

data = data.replace(/const IMG = \{[\s\S]*?\}/, newImgObj);
fs.writeFileSync('client/src/data/mockData.js', data);
console.log('Updated image URLs in mockData.js');
