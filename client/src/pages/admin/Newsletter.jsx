import React, { useState, useEffect, useCallback } from 'react';
import adminApi from '../../utils/adminApi';

const API = 'http://localhost:5000/api';

const AdminNewsletter = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [filter, setFilter] = useState('All');

  const fetchItems = useCallback(async (pageNum = 1, currentFilter = filter) => {
    setLoading(true); setError('');
    try {
      const params = { page: pageNum, limit: 20 };
      if (currentFilter === 'Active') params.active = 'true';
      if (currentFilter === 'Unsubscribed') params.active = 'false';
      const res = await adminApi.get(`${API}/newsletter/subscribers`, { params });
      setItems(res.data.items);
      setTotal(res.data.total);
      setPage(res.data.page);
      setPages(res.data.pages);
    } catch (err) {
      setError('Failed to load subscribers.');
    } finally { setLoading(false); }
  }, [filter]);

  useEffect(() => { fetchItems(1, filter); }, [fetchItems, filter]);

  return (
    <div className="space-y-6 w-full">
      <div className="flex items-end justify-between border-b border-border-neutral pb-5">
        <div>
          <h1 className="font-display text-xl font-bold text-graphite uppercase tracking-tight">
            Newsletter Subscribers
          </h1>
          <p className="text-sm text-soft-grey mt-1">
            {total} subscriber{total !== 1 ? 's' : ''} found.
          </p>
        </div>
        <button className="text-xs font-bold uppercase tracking-wider text-soft-grey border border-border-neutral px-4 py-2 rounded-sm hover:border-brand-blue hover:text-brand-blue transition-colors font-display">
          Export CSV
        </button>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto">
        {['All', 'Active', 'Unsubscribed'].map((tab) => (
          <button
            key={tab}
            onClick={() => { setFilter(tab); fetchItems(1, tab); }}
            className={`px-3 py-1.5 rounded-sm text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-colors ${
              filter === tab
                ? 'bg-brand-blue text-white'
                : 'bg-white border border-border-neutral text-soft-grey hover:border-brand-blue hover:text-brand-blue'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {error && <div className="p-3 bg-red-50 text-red-700 text-sm rounded-sm border border-red-200">{error}</div>}

      <div className="bg-white border border-border-neutral rounded-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-32 text-soft-grey gap-2 text-sm">
            <span className="material-symbols-outlined animate-spin text-[20px]">progress_activity</span>Loading...
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-soft-grey gap-1">
            <span className="material-symbols-outlined text-[28px]">mail</span>
            <p className="text-sm">No subscribers found.</p>
          </div>
        ) : (
          <table className="w-full text-sm text-left">
            <thead className="border-b border-border-neutral bg-surface-warm">
              <tr>
                {['Email', 'Name', 'Source', 'Status', 'Subscribed On'].map(h => (
                  <th key={h} className="py-3 px-5 text-xs font-bold uppercase tracking-wider text-soft-grey font-display">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border-neutral">
              {items.map(row => (
                <tr key={row._id} className="hover:bg-surface-warm transition-colors">
                  <td className="py-3.5 px-5 font-semibold text-graphite">{row.email}</td>
                  <td className="py-3.5 px-5 text-soft-grey">{row.name || '—'}</td>
                  <td className="py-3.5 px-5 text-xs text-soft-grey font-mono">{row.source}</td>
                  <td className="py-3.5 px-5">
                    <span className={`px-2 py-0.5 rounded-sm text-[10px] font-bold uppercase tracking-wide border ${row.isActive ? 'bg-brand-green/10 text-brand-green border-brand-green/20' : 'bg-surface-muted text-soft-grey border-border-neutral line-through'}`}>
                      {row.isActive ? 'Active' : 'Unsubscribed'}
                    </span>
                  </td>
                  <td className="py-3.5 px-5 text-xs text-soft-grey whitespace-nowrap">
                    {new Date(row.createdAt).toLocaleDateString()}
                    {row.unsubscribedAt && <span className="block text-[10px]">Unsub: {new Date(row.unsubscribedAt).toLocaleDateString()}</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {pages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <span className="text-xs text-soft-grey">Page {page} of {pages}</span>
          <div className="flex gap-2">
            <button onClick={() => fetchItems(page - 1)} disabled={page <= 1 || loading}
              className="text-xs font-bold uppercase tracking-wider text-soft-grey border border-border-neutral px-3 py-1.5 rounded-sm hover:border-brand-blue disabled:opacity-40 font-display">Prev</button>
            <button onClick={() => fetchItems(page + 1)} disabled={page >= pages || loading}
              className="text-xs font-bold uppercase tracking-wider text-soft-grey border border-border-neutral px-3 py-1.5 rounded-sm hover:border-brand-blue disabled:opacity-40 font-display">Next</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminNewsletter;
