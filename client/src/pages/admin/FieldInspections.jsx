import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import {
  FiMapPin,
  FiPhone,
  FiCalendar,
  FiClock,
  FiCamera,
  FiCheckCircle,
  FiAlertCircle,
  FiRefreshCw,
  FiPlay,
  FiFileText,
  FiExternalLink,
} from 'react-icons/fi';
import API from '../../services/api';

export default function FieldInspections() {
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('active'); // 'active' | 'completed'

  // Modal / Action State
  const [selectedVisit, setSelectedVisit] = useState(null);
  const [actionType, setActionType] = useState(null); // 'note' | 'photo' | 'report'
  const [noteText, setNoteText] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [photoCaption, setPhotoCaption] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Report Form State
  const [reportData, setReportData] = useState({
    soilCondition: '',
    structuralObservations: '',
    recommendations: '',
    fieldNotes: '',
  });

  const fetchVisits = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await API.get('/site-inspections/staff/my-visits');
      if (res.data?.success) {
        setVisits(res.data.data || []);
      }
    } catch (err) {
      console.error('Fetch visits error:', err);
      setError(err.response?.data?.error || 'Unable to load assigned inspection visits.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVisits();
  }, []);

  const handleStatusChange = async (visitId, newStatus) => {
    setSubmitting(true);
    try {
      await API.patch(`/site-inspections/staff/visits/${visitId}/status`, {
        status: newStatus,
        note: `Status updated to ${newStatus} via mobile staff view`,
      });
      await fetchVisits();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update visit status.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!noteText.trim() || !selectedVisit) return;
    setSubmitting(true);
    try {
      await API.patch(`/site-inspections/staff/visits/${selectedVisit._id}/status`, {
        status: selectedVisit.bookingStatus,
        note: noteText.trim(),
      });
      setNoteText('');
      setSelectedVisit(null);
      setActionType(null);
      await fetchVisits();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to add note.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitReport = async (e) => {
    e.preventDefault();
    if (!selectedVisit) return;
    setSubmitting(true);
    try {
      await API.post(`/site-inspections/staff/visits/${selectedVisit._id}/report`, {
        soilCondition: reportData.soilCondition,
        structuralObservations: reportData.structuralObservations,
        recommendations: reportData.recommendations,
        fieldNotes: reportData.fieldNotes,
        sitePhotos: photoUrl ? [{ url: photoUrl, caption: photoCaption }] : [],
      });
      setSelectedVisit(null);
      setActionType(null);
      setReportData({ soilCondition: '', structuralObservations: '', recommendations: '', fieldNotes: '' });
      setPhotoUrl('');
      setPhotoCaption('');
      await fetchVisits();
      alert('Field Inspection Report submitted successfully!');
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to submit inspection report.');
    } finally {
      setSubmitting(false);
    }
  };

  const activeVisits = visits.filter((v) => v.bookingStatus !== 'completed');
  const completedVisits = visits.filter((v) => v.bookingStatus === 'completed');
  const displayedVisits = activeTab === 'active' ? activeVisits : completedVisits;

  return (
    <div className="min-h-screen bg-[#F4F1EA] pb-16">
      <Helmet>
        <title>Field Staff Inspections — Neevevera Portal</title>
      </Helmet>

      {/* Header Banner */}
      <div className="bg-[#07558F] text-white px-4 py-4 sticky top-0 z-30 shadow-md">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-blue-200 block">
              Field Engineer Mobile Workflow
            </span>
            <h1 className="text-base font-bold font-display uppercase tracking-wider">
              Assigned Site Inspections
            </h1>
          </div>
          <button
            type="button"
            onClick={fetchVisits}
            disabled={loading}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            title="Refresh Inspections"
          >
            <FiRefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 pt-4">
        {/* Navigation Tabs */}
        <div className="flex rounded-xl bg-white border border-[#DDDAD1] p-1 mb-4 shadow-2xs">
          <button
            type="button"
            onClick={() => setActiveTab('active')}
            className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${
              activeTab === 'active'
                ? 'bg-[#07558F] text-white shadow-xs'
                : 'text-gray-600 hover:text-black'
            }`}
          >
            Active Visits ({activeVisits.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('completed')}
            className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${
              activeTab === 'completed'
                ? 'bg-[#07558F] text-white shadow-xs'
                : 'text-gray-600 hover:text-black'
            }`}
          >
            Completed ({completedVisits.length})
          </button>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs flex items-center gap-2 mb-4">
            <FiAlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div className="text-center py-12 text-gray-500 text-xs">Loading inspection schedule...</div>
        ) : displayedVisits.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[#DDDAD1] p-8 text-center text-gray-500 text-xs">
            <FiCheckCircle className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
            <p className="font-semibold text-gray-800 mb-1">No {activeTab} site visits found.</p>
            <p className="text-[11px] text-gray-400">
              {activeTab === 'active' ? 'You have no pending field visits assigned at this moment.' : 'Completed visit records will appear here.'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {displayedVisits.map((visit) => {
              const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                `${visit.siteAddress}, ${visit.district}, ${visit.pinCode}`
              )}`;

              return (
                <div
                  key={visit._id}
                  className="bg-white rounded-2xl border border-[#DDDAD1] p-4 sm:p-5 shadow-xs space-y-3"
                >
                  {/* Status & Reference */}
                  <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                    <span className="font-mono font-bold text-xs text-[#07558F]">{visit.bookingRef}</span>
                    <span
                      className={`text-[10px] uppercase font-bold px-2.5 py-0.5 rounded-full border ${
                        visit.bookingStatus === 'completed'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : visit.bookingStatus === 'visit_in_progress'
                          ? 'bg-amber-50 text-amber-800 border-amber-200 animate-pulse'
                          : 'bg-blue-50 text-[#07558F] border-blue-200'
                      }`}
                    >
                      {visit.bookingStatus.replace(/_/g, ' ')}
                    </span>
                  </div>

                  {/* Customer & Location */}
                  <div>
                    <h3 className="font-display font-bold text-sm text-gray-900">{visit.customerName}</h3>
                    <div className="flex items-start gap-1.5 text-xs text-gray-600 mt-1">
                      <FiMapPin className="w-3.5 h-3.5 text-[#07558F] shrink-0 mt-0.5" />
                      <div>
                        <span>{visit.siteAddress}</span>
                        <div className="text-[11px] text-gray-400 font-mono">
                          {visit.district}, PIN: {visit.pinCode}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Time Window & Scope */}
                  <div className="grid grid-cols-2 gap-2 text-[11px] bg-[#FAF9F6] p-2.5 rounded-xl border border-[#DDDAD1]/60">
                    <div className="flex items-center gap-1.5 text-gray-600">
                      <FiCalendar className="w-3.5 h-3.5 text-[#07558F]" />
                      <span>{new Date(visit.visitStartTime).toLocaleDateString('en-IN')}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-gray-600">
                      <FiClock className="w-3.5 h-3.5 text-[#07558F]" />
                      <span>
                        {new Date(visit.visitStartTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>

                  {/* Quick Action Buttons */}
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <a
                      href={`tel:${visit.customerPhone}`}
                      className="py-2.5 px-3 bg-white border border-[#DDDAD1] hover:bg-neutral-50 rounded-xl text-xs font-semibold text-gray-800 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <FiPhone className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Call Client</span>
                    </a>
                    <a
                      href={mapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="py-2.5 px-3 bg-white border border-[#DDDAD1] hover:bg-neutral-50 rounded-xl text-xs font-semibold text-gray-800 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <FiExternalLink className="w-3.5 h-3.5 text-[#07558F]" />
                      <span>Maps Direct</span>
                    </a>
                  </div>

                  {/* Status Transition & Report Triggers */}
                  {visit.bookingStatus !== 'completed' && (
                    <div className="pt-2 border-t border-gray-100 flex items-center gap-2">
                      {visit.bookingStatus === 'assigned' && (
                        <button
                          type="button"
                          onClick={() => handleStatusChange(visit._id, 'visit_in_progress')}
                          disabled={submitting}
                          className="flex-1 py-2.5 bg-[#07558F] hover:bg-[#054370] text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
                        >
                          <FiPlay className="w-3.5 h-3.5" />
                          <span>Start Visit</span>
                        </button>
                      )}

                      {visit.bookingStatus === 'visit_in_progress' && (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedVisit(visit);
                            setActionType('report');
                          }}
                          className="flex-1 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
                        >
                          <FiFileText className="w-3.5 h-3.5" />
                          <span>Submit Report</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          setSelectedVisit(visit);
                          setActionType('note');
                        }}
                        className="py-2.5 px-3 bg-white border border-[#DDDAD1] hover:bg-neutral-50 text-gray-700 rounded-xl text-xs font-bold uppercase transition-colors cursor-pointer"
                        title="Add On-Site Field Note"
                      >
                        Add Note
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Action Modal (Note or Report) */}
      {selectedVisit && actionType === 'note' && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
          <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl p-5 space-y-4 shadow-xl">
            <h3 className="font-display font-bold text-base text-gray-900">Add Field Inspection Note</h3>
            <p className="text-xs text-gray-500">
              Booking Ref: <strong className="font-mono text-[#07558F]">{selectedVisit.bookingRef}</strong>
            </p>
            <form onSubmit={handleAddNote} className="space-y-3">
              <textarea
                required
                rows={4}
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Enter observations on site access, soil condition, or client discussions..."
                className="w-full text-xs p-3 bg-[#FAF9F6] border border-[#DDDAD1] rounded-xl focus:outline-none focus:border-[#07558F]"
              />
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedVisit(null);
                    setActionType(null);
                  }}
                  className="flex-1 py-2.5 bg-neutral-100 text-gray-700 text-xs font-bold uppercase rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 bg-[#07558F] text-white text-xs font-bold uppercase rounded-xl"
                >
                  {submitting ? 'Saving...' : 'Save Note'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedVisit && actionType === 'report' && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto animate-in fade-in">
          <div className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl p-5 space-y-4 shadow-xl my-auto">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <h3 className="font-display font-bold text-base text-gray-900">Final Inspection Report</h3>
              <button
                type="button"
                onClick={() => {
                  setSelectedVisit(null);
                  setActionType(null);
                }}
                className="text-gray-400 hover:text-gray-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitReport} className="space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-gray-600 block">Soil / Strata Observations *</label>
                <input
                  required
                  type="text"
                  value={reportData.soilCondition}
                  onChange={(e) => setReportData({ ...reportData, soilCondition: e.target.value })}
                  placeholder="e.g. Red alluvial clay with high bearing capacity at 2.5m"
                  className="w-full text-xs p-2.5 bg-[#FAF9F6] border border-[#DDDAD1] rounded-xl focus:outline-none focus:border-[#07558F]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-gray-600 block">Structural Observations *</label>
                <textarea
                  required
                  rows={3}
                  value={reportData.structuralObservations}
                  onChange={(e) => setReportData({ ...reportData, structuralObservations: e.target.value })}
                  placeholder="e.g. Plot has clear road setback. Water table at 12m. Pile foundation recommended for G+4."
                  className="w-full text-xs p-2.5 bg-[#FAF9F6] border border-[#DDDAD1] rounded-xl focus:outline-none focus:border-[#07558F]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-gray-600 block">Engineering Recommendations *</label>
                <textarea
                  required
                  rows={3}
                  value={reportData.recommendations}
                  onChange={(e) => setReportData({ ...reportData, recommendations: e.target.value })}
                  placeholder="e.g. Conduct plate load test. Standard RCC frame structure suitable."
                  className="w-full text-xs p-2.5 bg-[#FAF9F6] border border-[#DDDAD1] rounded-xl focus:outline-none focus:border-[#07558F]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-gray-600 block">Site Photo URL (Cloudinary / S3)</label>
                <div className="flex items-center gap-2">
                  <FiCamera className="text-gray-400" />
                  <input
                    type="url"
                    value={photoUrl}
                    onChange={(e) => setPhotoUrl(e.target.value)}
                    placeholder="https://res.cloudinary.com/.../site-photo.jpg"
                    className="flex-1 text-xs p-2 bg-[#FAF9F6] border border-[#DDDAD1] rounded-xl focus:outline-none focus:border-[#07558F]"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-colors shadow-sm cursor-pointer mt-2"
              >
                {submitting ? 'Finalizing Visit...' : 'Complete Visit & Submit Official Report'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

