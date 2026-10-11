import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'

// Layout
import Layout from './components/layout/Layout'
import AdminLayout from './components/admin/AdminLayout'

// Phase 1 — Public Pages
import Home from './pages/Home'
import About from './pages/About'
import Services from './pages/Services'
import ServiceDetail from './pages/ServiceDetail'
import Projects from './pages/Projects'
import ProjectDetail from './pages/ProjectDetail'
import Gallery from './pages/Gallery'
import Team from './pages/Team'
import Testimonials from './pages/Testimonials'
import Careers from './pages/Careers'
import JobDetail from './pages/JobDetail'
import Application from './pages/Application'
import Insights from './pages/Insights'
import ArticleDetail from './pages/ArticleDetail'
import Newsletter from './pages/Newsletter'
import Podcast from './pages/Podcast'
import Contact from './pages/Contact'
import Search from './pages/Search'
import Vendors from './pages/Vendors'
import NotFound from './pages/NotFound'

// Phase 3 — Admin Pages
import AdminLogin        from './pages/admin/Login'
import AdminDashboard    from './pages/admin/Dashboard'
import AdminHome         from './pages/admin/Home'
import AdminCompany      from './pages/admin/Company'
import AdminServices     from './pages/admin/Services'
import AdminProjects     from './pages/admin/Projects'
import AdminGallery      from './pages/admin/Gallery'
import AdminTeam         from './pages/admin/Team'
import AdminTestimonials from './pages/admin/Testimonials'
import AdminCareers      from './pages/admin/Careers'
import AdminBlog         from './pages/admin/Insights'   // file is Insights.jsx, route is /admin/blog
import AdminPodcast      from './pages/admin/Podcast'
import AdminMedia        from './pages/admin/Media'
import AdminEnquiries    from './pages/admin/Enquiries'
import AdminVendors      from './pages/admin/Vendors'
import AdminNewsletter   from './pages/admin/Newsletter'
import AdminUsers        from './pages/admin/Users'
import AdminApplications from './pages/admin/Applications'

const ProtectedRoute = ({ children }) => {
  const authed = localStorage.getItem('admin_authed');
  const token = localStorage.getItem('admin_token');
  if (!authed || !token) {
    return <Navigate to="/admin/login" replace />
  }
  return children
}

const App = () => {
  return (
    <HelmetProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            {/* Phase 1 — Public Website */}
            <Route index element={<Home />} />
            <Route path="about" element={<About />} />
            <Route path="services" element={<Services />} />
            <Route path="services/:slug" element={<ServiceDetail />} />
            <Route path="projects" element={<Projects />} />
            <Route path="projects/:slug" element={<ProjectDetail />} />
            <Route path="gallery" element={<Gallery />} />
            <Route path="team" element={<Team />} />
            <Route path="testimonials" element={<Testimonials />} />
            <Route path="careers" element={<Careers />} />
            <Route path="careers/:slug" element={<JobDetail />} />
            <Route path="careers/:slug/apply" element={<Application />} />
            <Route path="insights" element={<Insights />} />
            <Route path="insights/:slug" element={<ArticleDetail />} />
            <Route path="newsletter" element={<Newsletter />} />
            <Route path="podcast" element={<Podcast />} />
            <Route path="contact" element={<Contact />} />
            <Route path="search" element={<Search />} />
            <Route path="vendors" element={<Vendors />} />
            <Route path="*" element={<NotFound />} />
          </Route>

          {/* Phase 3 — Admin CMS */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
            {/* Dashboard */}
            <Route index element={<AdminDashboard />} />

            {/* Content */}
            <Route path="home"          element={<AdminHome />} />
            <Route path="company"       element={<AdminCompany />} />
            <Route path="services"      element={<AdminServices />} />
            <Route path="projects"      element={<AdminProjects />} />
            <Route path="gallery"       element={<AdminGallery />} />
            <Route path="media"         element={<AdminMedia />} />
            <Route path="team"          element={<AdminTeam />} />
            <Route path="testimonials"  element={<AdminTestimonials />} />

            {/* Publishing */}
            <Route path="blog"          element={<AdminBlog />} />
            <Route path="podcast"       element={<AdminPodcast />} />
            <Route path="newsletter"    element={<AdminNewsletter />} />

            {/* Interactions */}
            <Route path="enquiries"     element={<AdminEnquiries />} />
            <Route path="careers"       element={<AdminCareers />} />
            <Route path="applications"  element={<AdminApplications />} />
            <Route path="vendors"       element={<AdminVendors />} />

            {/* System */}
            <Route path="users"         element={<AdminUsers />} />

            {/* Legacy alias — /admin/insights redirects to /admin/blog */}
            <Route path="insights"      element={<Navigate to="/admin/blog" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </HelmetProvider>
  )
}

export default App