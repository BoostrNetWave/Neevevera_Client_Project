import { useState, useEffect, useCallback } from 'react';
import adminApi from '../../utils/adminApi';

const AdminServiceAreas = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState('');

  // Form Fields
  const [formPincode, setFormPincode] = useState('');
  const [formDistrict, setFormDistrict] = useState('');
  const [formState, setFormState] = useState('Odisha');
  const [formStatus, setFormStatus] = useState('covered');
  const [formOffices, setFormOffices] = useState('');
  const [formNotes, setFormNotes] = useState('');

  const fetchItems = useCallback(
    async (pageNum = 1, currentStatus = statusFilter, query = search) => {
      setLoading(true);
      setError('');
      try {
        const params = { page: pageNum, limit: 25 };
        if (currentStatus !== 'All') params.status = currentStatus.toLowerCase();
        if (query.trim()) params.search = query.trim();

        const res = await adminApi.get('/service-areas', { params });
        setItems(res.data.items || []);
        setTotal(res.data.total || 0);
        setPage(res.data.page || 1);
        setPages(res.data.pages || 1);
      } catch (err) {
        console.error('Failed to load service areas:', err);
        setError('Failed to load service areas.');
      } finally {
        setLoading(false);
      }
    },
    [statusFilter, search]
  );

  useEffect(() => {
    fetchItems(1, statusFilter, search);
  }, [fetchItems, statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchItems(1, statusFilter, search);
  };

  const openCreateModal = () => {
    setEditingItem(null);
    setFormPincode('');
    setFormDistrict('');
    setFormState('Odisha');
    setFormStatus('covered');
    setFormOffices('');
    setFormNotes('');
    setModalError('');
    setIsModalOpen(true);
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    setFormPincode(item.pincode);
    setFormDistrict(item.district);
    setFormState(item.state);
    setFormStatus(item.status);
    setFormOffices((item.officeNames || []).join(', '));
    setFormNotes(item.notes || '');
    setModalError('');
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formPincode || !formDistrict || !formState) {
      setModalError('PIN code, district, and state are required.');
      return;
    }
    if (!/^[1-9][0-9]{5}$/.test(formPincode.trim())) {
      setModalError('Invalid 6-digit Indian PIN code.');
      return;
    }

    setModalLoading(true);
    setModalError('');

    const payload = {
      pincode: formPincode.trim(),
      district: formDistrict.trim(),
      state: formState.trim(),
      status: formStatus,
      officeNames: formOffices
        .split(',')
        .map((o) => o.trim())
        .filter(Boolean),
      notes: formNotes.trim(),
    };

    try {
      if (editingItem) {
        await adminApi.put(`/service-areas/${editingItem._id}`, payload);
      } else {
        await adminApi.post('/service-areas', payload);
      }
      setIsModalOpen(false);
      fetchItems(page, statusFilter, search);
    } catch (err) {
      setModalError(err.response?.data?.message || 'Failed to save service area.');
    } finally {
      setModalLoading(false);
    }
  };

  const handleToggleStatus = async (item) => {
    const nextStatus = item.status === 'covered' ? 'not_covered' : 'covered';
    try {
      await adminApi.put(`/service-areas/${item._id}`, { status: nextStatus });
      fetchItems(page, statusFilter, search);
    } catch (err) {
      alert('Failed to update status.');
    }
  };

  const handleDelete = async (item) => {
    if (!window.confirm(`Are you sure you want to delete PIN ${item.pincode}?`)) return;
    try {
      await adminApi.delete(`/service-areas/${item._id}`);
      fetchItems(page, statusFilter, search);
    } catch (err) {
      alert('Failed to delete service area.');
    }
  };

  return (
    <div className="space-y-6 w-full">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-border-neutral pb-5">
        <div>
          <h1 className="font-display text-xl font-bold text-graphite uppercase tracking-tight">
            Service Coverage Corridors
          </h1>
          <p className="text-sm text-soft-grey mt-1">
            {total} operational PIN corridor{total !== 1 ? 's' : ''} across Odisha and Andaman &amp; Nicobar.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="px-4 py-2 bg-brand-blue text-white text-xs font-bold uppercase tracking-wider rounded-sm hover:bg-opacity-90 transition cursor-pointer shadow-xs"
        >
          + Add New PIN Corridor
        </button>
      </div>

      {/* ── Filters & Search ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Status Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto">
          {['All', 'Covered', 'Not_Covered'].map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setStatusFilter(tab);
                fetchItems(1, tab, search);
              }}
              className={`px-3 py-1.5 rounded-sm text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-colors cursor-pointer ${
                statusFilter === tab
                  ? 'bg-brand-blue text-white'
                  : 'bg-white border border-border-neutral text-soft-grey hover:border-brand-blue hover:text-brand-blue'
              }`}
            >
              {tab.replace('_', ' ')}
            </button>
          ))}
        </div>

        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search PIN, District..."
            className="text-xs px-3 py-2 bg-white border border-border-neutral rounded-sm w-48 sm:w-60 focus:outline-none focus:border-brand-blue"
          />
          <button
            type="submit"
            className="px-3 py-2 bg-white border border-border-neutral text-soft-grey hover:text-graphite text-xs font-semibold rounded-sm cursor-pointer"
          >
            Search
          </button>
        </form>
      </div>

      {/* ── Table ── */}
      <div className="bg-white border border-border-neutral rounded-sm overflow-hidden shadow-2xs">
        {loading ? (
          <div className="py-20 flex items-center justify-center gap-2 text-soft-grey text-xs uppercase font-mono">
            <div className="w-4 h-4 border-2 border-brand-blue border-t-transparent rounded-full animate-spin" />
            <span>Loading coverage registry...</span>
          </div>
        ) : error ? (
          <div className="py-12 text-center text-red-600 text-sm font-medium">{error}</div>
        ) : items.length === 0 ? (
          <div className="py-16 text-center text-soft-grey text-sm">
            No service corridors match your criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-border-neutral bg-[#FAF9F5] text-soft-grey uppercase font-mono tracking-wider text-[11px]">
                  <th className="py-3 px-4">PIN Code</th>
                  <th className="py-3 px-4">District &amp; State</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Office Nodes</th>
                  <th className="py-3 px-4">Internal Notes</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-neutral font-sans">
                {items.map((item) => (
                  <tr key={item._id} className="hover:bg-surface-white/60 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-graphite text-sm">
                      {item.pincode}
                    </td>
                    <td className="py-3 px-4 text-graphite">
                      <div className="font-semibold">{item.district}</div>
                      <div className="text-[11px] text-soft-grey">{item.state}</div>
                    </td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => handleToggleStatus(item)}
                        title="Click to toggle status"
                        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono font-semibold cursor-pointer border ${
                          item.status === 'covered'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                            : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            item.status === 'covered' ? 'bg-emerald-500' : 'bg-rose-500'
                          }`}
                        />
                        <span>{item.status === 'covered' ? 'Active' : 'Inactive'}</span>
                      </button>
                    </td>
                    <td className="py-3 px-4 text-soft-grey max-w-xs truncate">
                      {item.officeNames && item.officeNames.length > 0
                        ? item.officeNames.join(', ')
                        : '—'}
                    </td>
                    <td className="py-3 px-4 text-soft-grey text-[11px] max-w-xs truncate">
                      {item.notes || '—'}
                    </td>
                    <td className="py-3 px-4 text-right space-x-2">
                      <button
                        onClick={() => openEditModal(item)}
                        className="text-brand-blue hover:underline font-semibold cursor-pointer"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(item)}
                        className="text-red-500 hover:underline font-semibold cursor-pointer"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pages > 1 && (
          <div className="px-4 py-3 border-t border-border-neutral flex items-center justify-between text-xs text-soft-grey font-mono">
            <span>
              Page {page} of {pages}
            </span>
            <div className="space-x-1">
              <button
                disabled={page <= 1}
                onClick={() => fetchItems(page - 1)}
                className="px-2.5 py-1 border border-border-neutral rounded disabled:opacity-40 cursor-pointer"
              >
                Previous
              </button>
              <button
                disabled={page >= pages}
                onClick={() => fetchItems(page + 1)}
                className="px-2.5 py-1 border border-border-neutral rounded disabled:opacity-40 cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Add / Edit Modal ── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-md w-full max-w-lg shadow-lg border border-border-neutral overflow-hidden">
            <div className="px-6 py-4 border-b border-border-neutral flex items-center justify-between bg-[#FAF9F5]">
              <h2 className="text-sm font-bold uppercase tracking-wider text-graphite font-display">
                {editingItem ? `Edit Corridor: PIN ${editingItem.pincode}` : 'Add New Service Corridor'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-soft-grey hover:text-graphite font-bold text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4 text-xs font-sans">
              {modalError && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded text-xs">
                  {modalError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-graphite font-semibold mb-1">
                    PIN Code <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    required
                    disabled={!!editingItem}
                    value={formPincode}
                    onChange={(e) => setFormPincode(e.target.value.replace(/\D/g, ''))}
                    placeholder="e.g. 753001"
                    className="w-full px-3 py-2 border border-border-neutral rounded font-mono text-xs focus:outline-none focus:border-brand-blue disabled:bg-gray-100"
                  />
                </div>

                <div>
                  <label className="block text-graphite font-semibold mb-1">
                    Status <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value)}
                    className="w-full px-3 py-2 border border-border-neutral rounded text-xs focus:outline-none focus:border-brand-blue bg-white"
                  >
                    <option value="covered">Active / Covered</option>
                    <option value="not_covered">Inactive / Not Covered</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-graphite font-semibold mb-1">
                    District <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formDistrict}
                    onChange={(e) => setFormDistrict(e.target.value)}
                    placeholder="e.g. Cuttack / Khordha / South Andaman"
                    className="w-full px-3 py-2 border border-border-neutral rounded text-xs focus:outline-none focus:border-brand-blue"
                  />
                </div>

                <div>
                  <label className="block text-graphite font-semibold mb-1">
                    State / Territory <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formState}
                    onChange={(e) => setFormState(e.target.value)}
                    className="w-full px-3 py-2 border border-border-neutral rounded text-xs focus:outline-none focus:border-brand-blue bg-white"
                  >
                    <option value="Odisha">Odisha</option>
                    <option value="Andaman & Nicobar Islands">Andaman &amp; Nicobar Islands</option>
                    <option value="West Bengal">West Bengal</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-graphite font-semibold mb-1">
                  Office / Landmark Names (comma separated)
                </label>
                <input
                  type="text"
                  value={formOffices}
                  onChange={(e) => setFormOffices(e.target.value)}
                  placeholder="e.g. CDA Sector 9, Bidanasi, High Court"
                  className="w-full px-3 py-2 border border-border-neutral rounded text-xs focus:outline-none focus:border-brand-blue"
                />
              </div>

              <div>
                <label className="block text-graphite font-semibold mb-1">
                  Internal Operational Notes
                </label>
                <textarea
                  rows={2}
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="e.g. Next-day engineering appraisal active. Barge logistics applicable."
                  className="w-full px-3 py-2 border border-border-neutral rounded text-xs focus:outline-none focus:border-brand-blue"
                />
              </div>

              <div className="pt-3 border-t border-border-neutral flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 text-soft-grey hover:text-graphite cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="px-4 py-1.5 bg-brand-blue text-white font-semibold rounded cursor-pointer hover:bg-opacity-90 disabled:opacity-60"
                >
                  {modalLoading ? 'Saving...' : editingItem ? 'Update Corridor' : 'Create Corridor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminServiceAreas;
