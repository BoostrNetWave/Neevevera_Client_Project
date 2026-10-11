const fs = require('fs');

const originalBody = fs.readFileSync('home_body_jsx.txt', 'utf8');

const unwiredComponent = `import React from 'react';
import { Link } from 'react-router-dom';
import { SectorSpecialization } from '../components/SectorSpecialization';

const Home = () => {
  const handleFormSubmit = (e) => {
    e.preventDefault();
  };

  return (
    <main className="w-full flex-1">
      ${originalBody}
      <SectorSpecialization />
    </main>
  );
};

export default Home;
`;

fs.writeFileSync('client/src/pages/Home.jsx', unwiredComponent);
console.log('Fully restored Home.jsx to completely unwired state.');
