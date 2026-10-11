const fs = require('fs');
const jsxContent = fs.readFileSync('d:/Neevpvt/home_body_jsx.txt', 'utf8');
const template = `import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';

const Home = () => {
  const handleFormSubmit = (e) => {
    e.preventDefault();
  };

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <main className="w-full flex-1">
      ${jsxContent}
    </main>
  );
};

export default Home;
`;
fs.writeFileSync('d:/Neevpvt/client/src/pages/Home.jsx', template, 'utf8');
console.log('Home.jsx updated');
