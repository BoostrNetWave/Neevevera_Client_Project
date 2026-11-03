import React, { useState, useEffect, useCallback } from 'react';
import adminApi from '../../utils/adminApi';

const STATUSES = ['pending', 'under_review', 'approved', 'rejected'];

const STATUS_BADGE = {
  pending:      'bg-amber-100 text-amber-800 border-amber-200',
  under_review: 'bg-brand-blue/10 text-brand-blue border-brand-blue/20',
  approved:     'bg-brand-green/10 text-brand-green border-brand-green/20',
  rejected:     'bg-red-50 text-red-600 border-red-200',
};

const QUAL_LABELS = {
  phd:       'Ph.D.',
  postdoc:   'Post-Doc',
  'mtech-me':'M.Tech/M.E.',
  'btech-be':'B.Tech/B.E.',
  msc:       'M.Sc.',
  other:     'Other',
};

const AdminResearchers = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [selected, setSelected] = useState(null); // detail panel
  const [noteInput, setNoteInput] = useState('');
  const [updateLoading, setUpdateLoading] = useState(false);

  const fetchItems = useCallback(async (pageNum = 1, currentFilter = filter, currentSearch = search) => {
    setLoading(true);
    setError('');
    try {
      const params = { page: pageNum, limit: 20 };
      if (currentFilter !== 'All') params.status = currentFilter;
      if (currentSearch.trim()) params.search = currentSearch.trim();
      const res = await adminApi.get('/researchers', { params });
      setItems(res.data.items || []);
      setTotal(res.data.total || 0);
      setPage(res.data.page || 1);
      setPages(res.data.pages || 1);
    } catch (err) {
      setError('Failed to load researcher applications.');
    } finally {
      setLoading(false);
    }
  }, [filter, search]);

  useEffect(() => { fetchItems(1, filter, search); }, [fetchItems, filter, search]);

  const handleSearch = (e) => {
    e.preventDefault();
    setSearch(searchInput);
  };

  const updateStatus = async (id, newStatus, adminNotes) => {
    setUpdateLoading(true);
    try {
      const res = await adminApi.patch(`/researchers/${id}/status`, {
        status: newStatus,
        adminNotes: adminNotes || undefined,
      });
      const updated = res.data.data;
      setItems(prev => prev.map(item => item._id === id ? updated : item));
      if (selected?._id === id) setSelected(updated);
    } catch (err) {
      alert(err.response?.data?.error || 'Status update failed.');
    } finally {
      setUpdateLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Permanently delete this researcher application?')) return;
    try {
      await adminApi.delete(`/researchers/${id}`);
      setItems(prev => prev.filter(item => item._id !== id));
      setTotal(t => t - 1);
      if (selected?._id === id) setSelected(null);
    } catch (err) {
      alert(err.response?.data?.error || 'Delete failed.');
    }
  };

  const FILTER_TABS = ['All', 'pending', 'under_review', 'approved', 'rejected'];

  return (
    <div className="space-y-6 w-full">
      {/* Header */}
      <div className="flex items-end justify-between border-b border-border-neutral pb-5">
        <div>
          <h1 className="font-display text-xl font-bold text-graphite uppercase tracking-tight">
            R&D Researchers
          </h1>
          <p className="text-sm text-soft-grey mt-1">
            Review and manage civil researcher collaboration applications — {total} record{total !== 1 ? 's' : ''} found.
          </p>
        </div>
      </div>

      {/* Filters + Search */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="flex items-center gap-2 overflow-x-auto">
          {FILTER_TABS.map(tab => (
            <button
              key={tab}
              onClick={() => { setFilter(tab); setPage(1); }}
              className={`px-3 py-1.5 rounded-sm text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-colors font-display ${
                filter === tab
                  ? 'bg-brand-blue text-white'
                  : 'bg-white border border-border-neutral text-soft-grey hover:border-brand-blue hover:text-brand-blue'
              }`}
            >
              {tab === 'All' ? 'All' : tab.replace('_', ' ')}
            </button>
          ))}
        </div>
        <form onSubmit={handleSearch} className="flex gap-2 ml-auto">
          <input
            type="text"
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            placeholder="Search name, email, institution..."
            className="border border-border-neutral rounded-sm px-3 py-1.5 text-xs text-graphite focus:outline-none focus:border-brand-blue w-56"
          />
          <button type="submit"
            className="text-xs font-bold uppercase tracking-wider border border-border-neutral px-3 py-1.5 rounded-sm hover:border-brand-blue hover:text-brand-blue font-display">
            Search
          </button>
          {search && (
            <button type="button" onClick={() => { setSearch(''); setSearchInput(''); }}
              className="text-xs text-soft-grey hover:text-graphite px-2">Clear</button>
          )}
        </form>
      </div>

      {error && <div className="p-3 bg-red-50 text-red-700 text-sm rounded-sm border border-red-200">{error}</div>}

      <div className="flex gap-4">
        {/* TABLE */}
        <div className={`bg-white border border-border-neutral rounded-sm overflow-hidden flex-1 min-w-0`}>
          {loading ? (
            <div className="flex items-center justify-center h-32 text-soft-grey gap-2 text-sm">
              <span className="material-symbols-outlined animate-spin text-[20px]">progress_activity</span> Loading...
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-soft-grey gap-1">
              <span className="material-symbols-outlined text-[28px]">science</span>
              <p className="text-sm">No researcher applications found.</p>
            </div>
          ) : (
            <table className="w-full text-sm text-left">
              <thead className="border-b border-border-neutral bg-surface-warm">
                <tr>
                  {['Applicant', 'Institution', 'Qualification', 'Disciplines', 'Status', 'Date', ''].map(h => (
                    <th key={h} className="py-3 px-4 text-xs font-bold uppercase tracking-wider text-soft-grey font-display whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border-neutral">
                {items.map(row => (
                  <tr
                    key={row._id}
                    className={`hover:bg-surface-warm transition-colors cursor-pointer ${selected?._id === row._id ? 'bg-brand-blue/5' : ''}`}
                    onClick={() => { setSelected(row); setNoteInput(row.adminNotes || ''); }}
                  >
                    <td className="py-3 px-4">
                      <span className="font-semibold text-graphite block text-sm">{row.name}</span>
                      <span className="text-xs text-soft-grey">{row.email}</span>
                    </td>
                    <td className="py-3 px-4 text-xs text-graphite max-w-[140px] truncate">{row.institution}</td>
                    <td className="py-3 px-4">
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-surface-warm border border-border-neutral px-2 py-0.5 rounded-sm text-soft-grey">
                        {QUAL_LABELS[row.highestQualification] || row.highestQualification}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex flex-wrap gap-1 max-w-[160px]">
                        {(row.researchInterests || []).slice(0, 2).map(d => (
                          <span key={d} className="text-[10px] bg-surface-warm border border-border-neutral px-1.5 py-0.5 rounded-sm text-soft-grey">{d}</span>
                        ))}
                        {(row.researchInterests || []).length > 2 && (
                          <span className="text-[10px] text-soft-grey">+{row.researchInterests.length - 2}</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`text-[10px] font-bold uppercase tracking-wider rounded-sm px-2 py-0.5 border font-display ${STATUS_BADGE[row.status] || STATUS_BADGE['pending']}`}>
                        {row.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-xs text-soft-grey whitespace-nowrap">
                      {new Date(row.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={e => { e.stopPropagation(); handleDelete(row._id); }}
                        className="text-soft-grey hover:text-red-600 transition-colors"
                        title="Delete"
                      >
                        <span className="material-symbols-outlined text-[16px]">delete</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* DETAIL PANEL */}
        {selected && (
          <div className="w-72 shrink-0 bg-white border border-border-neutral rounded-sm p-5 space-y-4 self-start sticky top-20 max-h-[calc(100vh-100px)] overflow-y-auto">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-graphite font-display">Application Detail</span>
              <button onClick={() => setSelected(null)} className="text-soft-grey hover:text-graphite text-sm leading-none">
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            {/* Name / identity */}
            <div className="space-y-1">
              <div className="font-display font-bold text-graphite">{selected.name}</div>
              <div className="text-xs text-soft-grey">{selected.designation}</div>
              <div className="text-xs text-brand-blue font-medium">{selected.institution}</div>
              <div className="text-xs text-soft-grey">{QUAL_LABELS[selected.highestQualification] || selected.highestQualification}</div>
            </div>

            {/* Contact */}
            <div className="space-y-1 text-xs text-soft-grey border-t border-border-neutral pt-3">
              <div><span className="font-semibold text-graphite">Email:</span> {selected.email}</div>
              <div><span className="font-semibold text-graphite">Phone:</span> {selected.phone}</div>
            </div>

            {/* Disciplines */}
            {selected.researchInterests?.length > 0 && (
              <div className="border-t border-border-neutral pt-3">
                <div className="text-[10px] font-bold uppercase tracking-wider text-graphite mb-2">Research Disciplines</div>
                <div className="flex flex-wrap gap-1.5">
                  {selected.researchInterests.map(d => (
                    <span key={d} className="text-[10px] bg-surface-warm border border-border-neutral px-2 py-0.5 rounded-sm text-soft-grey">{d}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Summary */}
            {selected.summary && (
              <div className="border-t border-border-neutral pt-3 space-y-1">
                <div className="text-[10px] font-bold uppercase tracking-wider text-graphite">Summary</div>
                <p className="text-xs text-soft-grey leading-relaxed">{selected.summary}</p>
              </div>
            )}

            {/* Publications */}
            {selected.publications?.length > 0 && (
              <div className="border-t border-border-neutral pt-3 space-y-1">
                <div className="text-[10px] font-bold uppercase tracking-wider text-graphite">Publications</div>
                <ul className="space-y-1">
                  {selected.publications.map((p, i) => (
                    <li key={i} className="text-[11px] text-soft-grey leading-relaxed border-l-2 border-brand-blue/30 pl-2">{p}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Proposal URL */}
            {selected.proposalUrl && (
              <div className="border-t border-border-neutral pt-3">
                <a href={selected.proposalUrl} target="_blank" rel="noopener noreferrer"
                  className="text-xs font-bold text-brand-blue hover:underline flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">description</span>
                  View Proposal / CV
                </a>
              </div>
            )}

            {/* Public consent */}
            <div className="border-t border-border-neutral pt-3 text-[11px] text-soft-grey">
              Public listing consent: <span className={`font-bold ${selected.isPublicListingConsented ? 'text-brand-green' : 'text-soft-grey'}`}>
                {selected.isPublicListingConsented ? 'Yes' : 'No'}
              </span>
            </div>

            {/* Admin Notes */}
            <div className="border-t border-border-neutral pt-3 space-y-2">
              <div className="text-[10px] font-bold uppercase tracking-wider text-graphite">Admin Notes</div>
              <textarea
                value={noteInput}
                onChange={e => setNoteInput(e.target.value)}
                rows={3}
                maxLength={2000}
                placeholder="Add review notes..."
                className="w-full border border-border-neutral rounded-sm px-2 py-1.5 text-xs text-graphite focus:outline-none focus:border-brand-blue resize-none"
              />
            </div>

            {/* Status Actions */}
            <div className="border-t border-border-neutral pt-3 space-y-2">
              <div className="text-[10px] font-bold uppercase tracking-wider text-graphite">Update Status</div>
              <div className="grid grid-cols-2 gap-2">
                {STATUSES.map(s => (
                  <button
                    key={s}
                    disabled={selected.status === s || updateLoading}
                    onClick={() => updateStatus(selected._id, s, noteInput)}
                    className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1.5 rounded-sm border transition-colors disabled:opacity-40 font-display ${
                      selected.status === s
                        ? (STATUS_BADGE[s] || '') + ' opacity-60 cursor-default'
                        : 'bg-white border-border-neutral text-soft-grey hover:border-brand-blue hover:text-brand-blue'
                    }`}
                  >
                    {s.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Pagination */}
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

export default AdminResearchers;
