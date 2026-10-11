import React, { useState, useEffect, useRef, useCallback } from 'react';
import adminApi from '../../utils/adminApi';
import axios from 'axios';   // only for direct-to-Cloudinary (no auth needed there)

const API = 'http://localhost:5000/api';

const VIDEO_MIME_TYPES = ['video/mp4', 'video/webm', 'video/quicktime', 'video/ogg'];
const IMAGE_CONTEXTS   = ['galleryMedia', 'serviceImage', 'projectImage', 'teamPhoto'];
const VIDEO_MAX_MB = 200;
const IMAGE_MAX_MB = 10;

/**
 * MediaLibrary
 * Props:
 *   mode         — 'manage' (full library with delete) | 'select' (picker)
 *   onSelect     — called with { url, publicId, _id } when mode='select'
 *   imageContext — Cloudinary context key for uploads (default: 'galleryMedia')
 */
const MediaLibrary = ({ mode = 'manage', onSelect, imageContext = 'galleryMedia' }) => {
  const [assets, setAssets]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [error, setError]       = useState('');
  const [page, setPage]         = useState(1);
  const [pagination, setPagination] = useState(null);

  const fileInputRef = useRef(null);

  // ── Fetch asset list ──────────────────────────────────────────
  const fetchAssets = useCallback(async (pageNum = 1, append = false) => {
    try {
      setLoading(true);
      setError('');
      const res = await adminApi.get(`${API}/media`, {
        params: { page: pageNum, limit: 24 },
      });
      const incoming = res.data.items || [];
      setAssets(prev => append ? [...prev, ...incoming] : incoming);
      setPagination({ page: res.data.page, pages: res.data.pages, total: res.data.total });
      setPage(pageNum);
    } catch (err) {
      setError('Failed to load media library. Please ensure you are logged in.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAssets(1); }, [fetchAssets]);

  // ── Upload dispatcher ─────────────────────────────────────────
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    e.target.value = '';

    const isVideo  = VIDEO_MIME_TYPES.includes(file.type);
    const sizeMB   = file.size / (1024 * 1024);

    setUploading(true);
    setError('');

    try {
      if (isVideo) {
        await uploadVideo(file, sizeMB);
      } else {
        await uploadImage(file, sizeMB);
      }
      await fetchAssets(1);
    } catch (err) {
      // Log full error detail so we can see exactly what's failing
      console.error('[Upload Error] full error:', err);
      console.error('[Upload Error] response status:', err.response?.status);
      console.error('[Upload Error] response data:', err.response?.data);
      console.error('[Upload Error] message:', err.message);
      const msg = err.response?.data?.error || err.message || 'Upload failed. Check browser console.';
      setError(msg);
    } finally {
      setUploading(false);
      setUploadProgress('');
    }
  };

  // ── Image upload: proxy through Express (auth required) ───────
  const uploadImage = async (file, sizeMB) => {
    if (sizeMB > IMAGE_MAX_MB) throw new Error(`Image exceeds ${IMAGE_MAX_MB}MB limit.`);

    console.log('[Upload] starting image upload, context:', imageContext, 'size:', sizeMB.toFixed(2), 'MB');
    setUploadProgress('Uploading image...');
    const form = new FormData();
    form.append('file', file);
    form.append('context', imageContext);

    // Use adminApi so the Bearer token is injected automatically
    const res = await adminApi.post(`${API}/upload/image`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    console.log('[Upload] success:', res.data);
  };

  // ── Video upload: signed direct-to-Cloudinary ─────────────────
  const uploadVideo = async (file, sizeMB) => {
    if (sizeMB > VIDEO_MAX_MB) throw new Error(`Video exceeds ${VIDEO_MAX_MB}MB limit.`);

    setUploadProgress('Requesting upload credentials...');

    // Step 1: get signed credentials from our server (requires auth)
    const signedRes = await adminApi.post(`${API}/upload/signed-url`, {
      context: 'galleryVideo',
      fileSizeBytes: file.size,
    });
    const { signature, timestamp, folder, apiKey, cloudName } = signedRes.data;

    setUploadProgress('Uploading video to Cloudinary...');

    // Step 2: direct browser→Cloudinary (no auth header needed — uses signature)
    const form = new FormData();
    form.append('file', file);
    form.append('api_key', apiKey);
    form.append('timestamp', String(timestamp));
    form.append('signature', signature);
    form.append('folder', folder);

    const cloudRes = await axios.post(
      `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`,
      form,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );

    setUploadProgress('Confirming upload...');

    // Step 3: tell our backend to create the MediaAsset record (requires auth)
    await adminApi.post(`${API}/upload/confirm-signed-upload`, {
      url:          cloudRes.data.secure_url,
      publicId:     cloudRes.data.public_id,
      context:      'galleryVideo',
      originalName: file.name,
      mimeType:     file.type,
      sizeBytes:    cloudRes.data.bytes,
    });
  };

  // ── Delete asset ──────────────────────────────────────────────
  const handleDelete = async (publicId, usageCount) => {
    if (usageCount > 0) {
      setError(`Cannot delete: asset is referenced in ${usageCount} place(s). Remove those references first.`);
      return;
    }
    if (!window.confirm('Delete this asset? This cannot be undone.')) return;

    try {
      setLoading(true);
      await adminApi.delete(`${API}/upload/${encodeURIComponent(publicId)}`);
      await fetchAssets(1);
    } catch (err) {
      const msg = err.response?.data?.error || 'Deletion failed. Asset record preserved.';
      setError(msg);
      setLoading(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full bg-white border border-border-neutral rounded-sm overflow-hidden">

      {/* Toolbar */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-border-neutral bg-surface-warm shrink-0">
        <h2 className="text-xs font-bold uppercase tracking-wider text-graphite font-display">
          Media Library
        </h2>
        <div className="flex items-center gap-4">
          {error && (
            <span className="text-xs text-red-600 font-semibold max-w-xs truncate" title={error}>
              {error}
            </span>
          )}
          {uploading && (
            <span className="flex items-center gap-1.5 text-xs text-brand-blue font-bold uppercase tracking-wider font-display">
              <span className="material-symbols-outlined animate-spin text-[15px]">progress_activity</span>
              {uploadProgress || 'Uploading...'}
            </span>
          )}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            accept="image/jpeg,image/png,image/webp,video/mp4,video/webm,video/quicktime"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="text-xs font-bold uppercase tracking-wider bg-brand-blue text-white px-4 py-2 rounded-sm hover:bg-brand-blue-hover transition-colors font-display flex items-center gap-1.5 disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-[15px]">cloud_upload</span>
            Upload
          </button>
        </div>
      </div>

      {/* Asset Grid */}
      <div className="flex-1 overflow-y-auto p-4">
        {loading && assets.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-soft-grey gap-2">
            <span className="material-symbols-outlined animate-spin text-[28px]">progress_activity</span>
            <span className="text-sm">Loading library...</span>
          </div>
        ) : assets.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-soft-grey gap-2">
            <span className="material-symbols-outlined text-[32px]">perm_media</span>
            <p className="text-sm font-semibold text-graphite">No assets uploaded yet</p>
            <p className="text-xs">Click Upload to add your first image or video.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
              {assets.map(asset => (
                <AssetTile
                  key={asset._id}
                  asset={asset}
                  mode={mode}
                  onSelect={onSelect}
                  onDelete={handleDelete}
                />
              ))}
            </div>

            {pagination && pagination.page < pagination.pages && (
              <div className="mt-6 flex justify-center">
                <button
                  onClick={() => fetchAssets(page + 1, true)}
                  disabled={loading}
                  className="text-xs font-bold uppercase tracking-wider text-soft-grey border border-border-neutral px-5 py-2 rounded-sm hover:border-brand-blue hover:text-brand-blue transition-colors font-display disabled:opacity-50"
                >
                  {loading ? 'Loading...' : 'Load More'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

// ── Individual asset tile ─────────────────────────────────────
const AssetTile = ({ asset, mode, onSelect, onDelete }) => {
  const isVideo = asset.mimeType?.startsWith('video/');

  return (
    <div className="group relative aspect-square bg-surface-muted border border-border-neutral rounded-sm overflow-hidden flex items-center justify-center">
      {isVideo ? (
        <video src={asset.url} className="w-full h-full object-cover" muted />
      ) : (
        <img src={asset.url} alt={asset.originalName} className="w-full h-full object-cover" loading="lazy" />
      )}

      {isVideo && (
        <span className="absolute top-1.5 left-1.5 bg-graphite/80 text-white text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-sm">
          Video
        </span>
      )}

      {/* Hover overlay */}
      <div className="absolute inset-0 bg-graphite/80 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-2">
        <span className="text-white text-[10px] truncate w-full text-center" title={asset.originalName}>
          {asset.originalName}
        </span>

        {mode === 'select' && (
          <button
            onClick={() => onSelect?.({ url: asset.url, publicId: asset.publicId, _id: asset._id })}
            className="bg-brand-blue text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-sm hover:bg-brand-blue-hover transition-colors font-display"
          >
            Select
          </button>
        )}

        {mode === 'manage' && (
          <>
            {asset.usageCount > 0 && (
              <span className="text-brand-gold text-[9px] font-bold bg-brand-gold/20 px-2 py-0.5 rounded-sm">
                {asset.usageCount} reference{asset.usageCount > 1 ? 's' : ''}
              </span>
            )}
            <button
              onClick={() => onDelete(asset.publicId, asset.usageCount)}
              className="bg-red-500/90 text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-sm hover:bg-red-600 transition-colors font-display flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[13px]">delete</span>
              {asset.usageCount > 0 ? 'In use' : 'Delete'}
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default MediaLibrary;
