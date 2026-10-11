import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import adminApi from '../../utils/adminApi';

const NAV = [
  {
    group: 'Content',
    items: [
      { label: 'Overview',      path: '/admin',              icon: 'grid_view',            exact: true },
      { label: 'Home Page',     path: '/admin/home',          icon: 'home' },
      { label: 'Company Info',  path: '/admin/company',       icon: 'apartment' },
      { label: 'Services',      path: '/admin/services',      icon: 'home_repair_service' },
      { label: 'Projects',      path: '/admin/projects',      icon: 'architecture' },
      { label: 'Gallery',       path: '/admin/gallery',       icon: 'photo_library' },
      { label: 'Media Library', path: '/admin/media',         icon: 'perm_media' },
      { label: 'Team',          path: '/admin/team',          icon: 'people' },
      { label: 'Testimonials',  path: '/admin/testimonials',  icon: 'format_quote' },
    ],
  },
  {
    group: 'Publishing',
    items: [
      { label: 'Blog / Insights', path: '/admin/blog',       icon: 'article' },
      { label: 'Newsletter',      path: '/admin/newsletter',  icon: 'mail' },
      { label: 'Podcast',         path: '/admin/podcast',     icon: 'podcasts' },
    ],
  },
  {
    group: 'Interactions',
    items: [
      { label: 'Enquiries',       path: '/admin/enquiries',    icon: 'inbox' },
      { label: 'Careers',         path: '/admin/careers',      icon: 'work' },
      { label: 'Applications',    path: '/admin/applications', icon: 'badge' },
      { label: 'Vendors',         path: '/admin/vendors',      icon: 'local_shipping' },
    ],
  },
  {
    group: 'System',
    items: [
      { label: 'Admin Users',   path: '/admin/users',        icon: 'manage_accounts' },
    ],
  },
];

const AdminLayout = () => {
  const navigate = useNavigate();

  const adminUser = (() => {
    try { return JSON.parse(localStorage.getItem('admin_user') || '{}'); }
    catch { return {}; }
  })();
  const displayName = adminUser.name || 'Admin';
  const initials = displayName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  const handleLogout = async () => {
    try {
      await adminApi.post('/auth/logout', {});
    } catch (_) { /* still clear local state */ }
    localStorage.removeItem('admin_authed');
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    navigate('/admin/login');
  };

  return (
    <div className="min-h-screen flex bg-surface-white font-sans text-graphite antialiased">

      {/* ── SIDEBAR ──────────────────────────────────────────── */}
      <aside className="fixed inset-y-0 left-0 w-60 bg-white border-r border-border-neutral flex flex-col z-50 shadow-sm">

        {/* Logo */}
        <div className="h-14 px-5 flex items-center gap-3 border-b border-border-neutral shrink-0">
          <img
            src="/neevevara-logo.png"
            alt="Neevevera"
            className="w-7 h-7 rounded-sm object-cover"
            onError={e => { e.target.style.display = 'none'; }}
          />
          <span className="font-display text-sm font-bold text-graphite uppercase tracking-tight">
            Neevevera CMS
          </span>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-5">
          {NAV.map(section => (
            <div key={section.group}>
              <div className="px-2 mb-1.5 text-[10px] font-bold uppercase tracking-widest text-soft-grey/70 font-display">
                {section.group}
              </div>
              <ul className="space-y-0.5">
                {section.items.map(item => (
                  <li key={item.path}>
                    <NavLink
                      to={item.path}
                      end={item.exact}
                      className={({ isActive }) =>
                        `flex items-center gap-2.5 px-2.5 py-2 rounded-sm text-sm transition-colors ${
                          isActive
                            ? 'bg-brand-blue/8 text-brand-blue font-semibold'
                            : 'text-soft-grey hover:bg-surface-warm hover:text-graphite'
                        }`
                      }
                    >
                      <span className="material-symbols-outlined text-[17px] shrink-0">{item.icon}</span>
                      <span className="truncate">{item.label}</span>
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        {/* User + Logout */}
        <div className="px-3 py-4 border-t border-border-neutral shrink-0 space-y-2">
          <div className="flex items-center gap-2.5 px-2.5 py-2">
            <div className="w-7 h-7 rounded-sm bg-brand-blue text-white flex items-center justify-center text-[11px] font-bold font-display shrink-0">
              {initials}
            </div>
            <div className="min-w-0">
              <div className="text-xs font-semibold text-graphite truncate">{displayName}</div>
              <div className="text-[10px] text-soft-grey capitalize">{adminUser.role || 'admin'}</div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-sm text-sm text-soft-grey hover:bg-red-50 hover:text-red-600 transition-colors"
          >
            <span className="material-symbols-outlined text-[17px]">logout</span>
            <span className="text-xs font-bold uppercase tracking-wider font-display">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* ── MAIN ─────────────────────────────────────────────── */}
      <div className="pl-60 flex flex-col w-full min-h-screen">

        {/* Top bar */}
        <header className="sticky top-0 h-14 bg-white border-b border-border-neutral z-40 flex items-center justify-between px-8">
          <span className="text-[11px] font-bold uppercase tracking-widest text-soft-grey font-display">
            Admin Console
          </span>
          <div className="text-right">
            <span className="text-sm text-graphite font-medium block">{displayName}</span>
            <span className="text-xs text-soft-grey capitalize">{adminUser.role || 'admin'}</span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-8">
          <div className="max-w-5xl mx-auto w-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
