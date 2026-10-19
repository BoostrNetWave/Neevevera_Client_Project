import React, { useState, useEffect, useCallback } from 'react';
import adminApi from '../../utils/adminApi';

const API = '';

const STATUSES = ['pending-review', 'approved', 'rejected', 'on-hold'];

const STATUS_BADGE = {
  'pending-review': 'bg-brand-blue/10 text-brand-blue border-brand-blue/20',
  'approved': 'bg-brand-green/10 text-brand-green border-brand-green/20',
  'rejected': 'bg-red-50 text-red-600 border-red-200 line-through',
  'on-hold': 'bg-amber-100 text-amber-800 border-amber-200',
};

const AdminVendors = () => {
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
      if (currentFilter !== 'All') {
        if (currentFilter === 'Pending Review') params.status = 'pending-review';
        if (currentFilter === 'Approved') params.status = 'approved';
        if (currentFilter === 'Rejected') params.status = 'rejected';
        if (currentFilter === 'On Hold') params.status = 'on-hold';
      }
      const res = await adminApi.get(`${API}/vendors`, { params });
      setItems(res.data.items);
      setTotal(res.data.total);
      setPage(res.data.page);
      setPages(res.data.pages);
    } catch (err) {
      setError('Failed to load vendors.');
    } finally { setLoading(false); }
  }, [filter]);

  useEffect(() => { fetchItems(1, filter); }, [fetchItems, filter]);

  const updateStatus = async (id, newStatus) => {
    try {
      await adminApi.patch(`${API}/vendors/${id}/status`, { status: newStatus });
      setItems(prev => prev.map(item => item._id === id ? { ...item, status: newStatus } : item));
    } catch (err) {
      alert(err.response?.data?.message || 'Status update failed.');
    }
  };

  return (
    <div className="space-y-6 w-full">
      {/* Header */}
      <div className="flex items-end justify-between border-b border-border-neutral pb-5">
        <div>
          <h1 className="font-display text-xl font-bold text-graphite uppercase tracking-tight">
            Vendors & Resources
          </h1>
          <p className="text-sm text-soft-grey mt-1">
            Review and approve vendor enrollments — {total} record{total !== 1 ? 's' : ''} found.
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 overflow-x-auto">
        {['All', 'Pending Review', 'Approved', 'Rejected', 'On Hold'].map((tab) => (
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

      {/* Table */}
      <div className="bg-white border border-border-neutral rounded-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-32 text-soft-grey gap-2 text-sm">
            <span className="material-symbols-outlined animate-spin text-[20px]">progress_activity</span>Loading...
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-soft-grey gap-1">
            <span className="material-symbols-outlined text-[28px]">handshake</span>
            <p className="text-sm">No vendors found.</p>
          </div>
        ) : (
          <table className="w-full text-sm text-left">
            <thead className="border-b border-border-neutral bg-surface-warm">
              <tr>
                {['Vendor', 'Trade', 'Location', 'Contact', 'Status', 'Date'].map(h => (
                  <th key={h} className="py-3 px-5 text-xs font-bold uppercase tracking-wider text-soft-grey font-display">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border-neutral">
              {items.map(row => (
                <tr key={row._id} className="hover:bg-surface-warm transition-colors">
                  <td className="py-3.5 px-5">
                    <span className="font-semibold text-graphite block">{row.companyName}</span>
                    <span className="text-xs text-soft-grey">{row.gstNumber ? `GST: ${row.gstNumber}` : 'No GST provided'}</span>
                  </td>
                  <td className="py-3.5 px-5">
                    <span className="text-graphite block uppercase text-xs">{row.tradeCategory.replace('-', ' ')}</span>
                    {row.tradeSubCategory && <span className="text-xs text-soft-grey block">{row.tradeSubCategory}</span>}
                  </td>
                  <td className="py-3.5 px-5 text-soft-grey">
                    {row.city}, {row.state} <br/> <span className="text-xs">{row.pinCode}</span>
                  </td>
                  <td className="py-3.5 px-5">
                    <span className="block">{row.contactPerson}</span>
                    <div className="text-xs text-soft-grey flex flex-col gap-0.5 mt-0.5">
                      <a href={`mailto:${row.email}`} className="hover:text-brand-blue flex items-center gap-1"><span className="material-symbols-outlined text-[12px]">mail</span>{row.email}</a>
                      {row.phone && <a href={`tel:${row.phone}`} className="hover:text-brand-blue flex items-center gap-1"><span className="material-symbols-outlined text-[12px]">call</span>{row.phone}</a>}
                    </div>
                  </td>
                  <td className="py-3.5 px-5">
                    <select value={row.status} onChange={e => updateStatus(row._id, e.target.value)}
                      className={`text-[10px] font-bold uppercase tracking-wider rounded-sm px-2 py-1 outline-none border transition-colors cursor-pointer font-display ${STATUS_BADGE[row.status] || STATUS_BADGE['pending-review']}`}>
                      {STATUSES.map(s => <option key={s} value={s}>{s.replace('-', ' ')}</option>)}
                    </select>
                  </td>
                  <td className="py-3.5 px-5 text-xs text-soft-grey whitespace-nowrap">
                    {new Date(row.createdAt).toLocaleDateString()}
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

export default AdminVendors;
