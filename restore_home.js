const fs = require('fs');

let current = fs.readFileSync('client/src/pages/Home.jsx', 'utf8');
const original = fs.readFileSync('home_body_jsx.txt', 'utf8');

// Restore top block
const originalTop = `import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { SectorSpecialization } from '../components/SectorSpecialization';
import axios from 'axios';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const Home = () => {
  const [homeData, setHomeData] = useState(null);
  
  useEffect(() => {
    window.scrollTo(0, 0);
    const fetchHomeData = async () => {
      try {
        const res = await axios.get(\`\${API}/home\`);
        if (res.data.success && res.data.data) {
          setHomeData(res.data.data);
        }
      } catch (err) {
        console.error("Failed to load home content:", err);
      }
    };
    fetchHomeData();
  }, []);

   const [realData, setRealData] = useState(null);
  
  useEffect(() => {
    window.scrollTo(0, 0);
    const fetchRealData = async () => {
      try {
        const res = await axios.get(\`\${API}/home\`);
        console.log(res);
        
        // setRealData(res.data.data);
      } catch (err) {
        console.error("Failed to load content:", err);
      }
    };
    fetchRealData();
  }, []);

  const handleFormSubmit = (e) => {
    e.preventDefault();
  };`;

const topEnd = current.indexOf('  return (');
if (topEnd !== -1) {
  current = originalTop + '\n\n' + current.substring(topEnd);
}

// Extract original sections
const sStart = original.indexOf('<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">');
const sEnd = original.indexOf('</div></div></section><section className="w-full bg-surface-white border-b border-border-neutral px-6 lg:px-10 py-16 lg:py-24" id="portfolio">');
if (sStart !== -1 && sEnd !== -1) {
  const originalServices = original.substring(sStart, sEnd);
  const curStart = current.indexOf('<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">');
  const curEnd = current.indexOf('</div></div></section><section className="w-full bg-surface-white border-b border-border-neutral px-6 lg:px-10 py-16 lg:py-24" id="portfolio">');
  if (curStart !== -1 && curEnd !== -1) {
    current = current.substring(0, curStart) + originalServices + current.substring(curEnd);
  }
}

const pStart = original.indexOf('<div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch" id="projects-grid">');
const pEnd = original.indexOf('</section>', pStart);
if (pStart !== -1 && pEnd !== -1) {
  const originalProjects = original.substring(pStart, pEnd);
  const curStart = current.indexOf('<div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch" id="projects-grid">');
  const curEnd = current.indexOf('</section>', curStart);
  if (curStart !== -1 && curEnd !== -1) {
    current = current.substring(0, curStart) + originalProjects + current.substring(curEnd);
  }
}

const tStart = original.indexOf('<div className="relative mt-12 bg-white border border-border-neutral rounded-sm p-8 lg:p-12 shadow-sm">');
const tEnd = original.indexOf('</section>', tStart);
if (tStart !== -1 && tEnd !== -1) {
  const originalTestimonials = original.substring(tStart, tEnd);
  const curStart = current.indexOf('<div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">');
  const curEnd = current.indexOf('</section>', curStart);
  if (curStart !== -1 && curEnd !== -1) {
    current = current.substring(0, curStart) + originalTestimonials + current.substring(curEnd);
  }
}

fs.writeFileSync('client/src/pages/Home.jsx', current);
console.log('Restored Home.jsx successfully');
