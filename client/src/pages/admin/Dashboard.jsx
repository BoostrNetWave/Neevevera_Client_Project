import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import adminApi from '../../utils/adminApi';



const Stat = ({ label, value, icon, path, loading, error }) => (
  <NavLink
    to={path}
    className="bg-white border border-border-neutral rounded-sm p-5 flex flex-col gap-3 hover:border-brand-blue hover:shadow-sm transition-all group"
  >
    <div className="flex items-center justify-between">
      <span className="material-symbols-outlined text-soft-grey group-hover:text-brand-blue transition-colors">
        {icon}
      </span>
      <span className="material-symbols-outlined text-[16px] text-border-neutral group-hover:text-brand-blue transition-colors">
        arrow_forward
      </span>
    </div>
    <div>
      {loading ? (
        <div className="h-9 w-12 bg-surface-warm rounded animate-pulse" />
      ) : error ? (
        <div className="font-display text-base font-bold text-red-500 flex items-center gap-1" title={error}>
          <span className="material-symbols-outlined text-[18px]">error</span>
          <span>Error</span>
        </div>
      ) : (
        <div className="font-display text-3xl font-bold text-graphite">{value}</div>
      )}
      <div className="text-xs font-bold uppercase tracking-wider text-soft-grey font-display mt-1">
        {label}
      </div>
    </div>
  </NavLink>
);

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    enquiries: { value: '0', error: null },
    vendors: { value: '0', error: null },
    applications: { value: '0', error: null },
    subscribers: { value: '0', error: null },
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const fetchStats = async () => {
      try {
        const [enqRes, vendRes, subRes, appRes] = await Promise.allSettled([
          adminApi.get('/enquiries', { params: { limit: 1 } }),
          adminApi.get('/vendors',   { params: { limit: 1 } }),
          adminApi.get('/newsletter/subscribers', { params: { limit: 1 } }),
          adminApi.get('/careers/applications/count'),
        ]);

        if (!mounted) return;

        setStats({
          enquiries: {
            value: enqRes.status === 'fulfilled'
              ? String(enqRes.value.data?.total ?? enqRes.value.data?.count ?? 0)
              : '0',
            error: enqRes.status === 'rejected' ? (enqRes.reason?.message || 'Failed to load') : null,
          },
          vendors: {
            value: vendRes.status === 'fulfilled'
              ? String(vendRes.value.data?.total ?? vendRes.value.data?.count ?? 0)
              : '0',
            error: vendRes.status === 'rejected' ? (vendRes.reason?.message || 'Failed to load') : null,
          },
          subscribers: {
            value: subRes.status === 'fulfilled'
              ? String(subRes.value.data?.total ?? subRes.value.data?.count ?? 0)
              : '0',
            error: subRes.status === 'rejected' ? (subRes.reason?.message || 'Failed to load') : null,
          },
          applications: {
            value: appRes.status === 'fulfilled'
              ? String(appRes.value.data?.total ?? 0)
              : '0',
            error: appRes.status === 'rejected' ? (appRes.reason?.message || 'Failed to load') : null,
          },
        });
      } catch (err) {
        console.error('Dashboard stats error:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchStats();
    return () => { mounted = false; };
  }, []);

  const STAT_CARDS = [
    { label: 'Total Enquiries',        value: stats.enquiries.value,    error: stats.enquiries.error,    icon: 'inbox',          path: '/admin/enquiries' },
    { label: 'Vendor Registrations',   value: stats.vendors.value,      error: stats.vendors.error,      icon: 'local_shipping', path: '/admin/vendors' },
    { label: 'Job Applications',       value: stats.applications.value, error: stats.applications.error, icon: 'badge',          path: '/admin/applications' },
    { label: 'Newsletter Subscribers', value: stats.subscribers.value,  error: stats.subscribers.error,  icon: 'mail',           path: '/admin/newsletter' },
  ];

  const CMS_LINKS = [
    { label: 'Home Page CMS', icon: 'home',           path: '/admin/home' },
    { label: 'Services',      icon: 'build',          path: '/admin/services' },
    { label: 'Projects',      icon: 'engineering',    path: '/admin/projects' },
    { label: 'Careers',       icon: 'work',           path: '/admin/careers' },
    { label: 'Applications',  icon: 'badge',          path: '/admin/applications' },
    { label: 'Enquiries',     icon: 'inbox',          path: '/admin/enquiries' },
    { label: 'Vendors',       icon: 'local_shipping', path: '/admin/vendors' },
    { label: 'Team',          icon: 'group',          path: '/admin/team' },
    { label: 'Gallery',       icon: 'photo_library',  path: '/admin/gallery' },
    { label: 'Media Library', icon: 'perm_media',     path: '/admin/media' },
    { label: 'Blog / Insights', icon: 'article',      path: '/admin/blog' },
    { label: 'Podcast',       icon: 'mic',            path: '/admin/podcast' },
    { label: 'Newsletter',    icon: 'mail',           path: '/admin/newsletter' },
    { label: 'Testimonials',  icon: 'format_quote',   path: '/admin/testimonials' },
    { label: 'Company Info',  icon: 'apartment',      path: '/admin/company' },
  ];

  return (
    <div className="space-y-8 w-full">

      {/* Header */}
      <div className="flex flex-col gap-1 border-b border-border-neutral pb-5">
        <h1 className="font-display text-2xl font-bold text-graphite uppercase tracking-tight">
          Overview
        </h1>
        <p className="text-sm text-soft-grey">
          Website operations and content management portal.
        </p>
      </div>

      {/* Metric Cards — Live */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {STAT_CARDS.map(stat => (
          <Stat key={stat.label} {...stat} loading={loading} />
        ))}
      </div>

      {/* CMS Management Sections */}
      <div className="bg-white border border-border-neutral rounded-sm overflow-hidden flex flex-col">
        <div className="px-5 py-4 border-b border-border-neutral bg-surface-warm flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-graphite font-display">
            CMS & Operations Directory
          </h2>
          <span className="text-[11px] text-soft-grey font-medium">15 Management Modules</span>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {CMS_LINKS.map(({ label, icon, path }) => (
              <NavLink
                key={label}
                to={path}
                className="flex items-center justify-between p-3.5 rounded-sm border border-border-neutral bg-surface-white hover:border-brand-blue hover:bg-brand-blue/5 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-[18px] text-soft-grey group-hover:text-brand-blue transition-colors">{icon}</span>
                  <span className="text-sm font-semibold text-graphite group-hover:text-brand-blue transition-colors">{label}</span>
                </div>
                <span className="material-symbols-outlined text-[16px] text-border-neutral group-hover:text-brand-blue transition-colors">
                  arrow_forward
                </span>
              </NavLink>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
};

export default AdminDashboard;
