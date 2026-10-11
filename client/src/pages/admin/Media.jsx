import React from 'react';
import MediaLibrary from '../../components/admin/MediaLibrary';

const AdminMedia = () => {
  return (
    <div className="space-y-6 w-full h-[calc(100vh-8rem)] flex flex-col">
      <div className="flex items-end justify-between border-b border-border-neutral pb-5 shrink-0">
        <div>
          <h1 className="font-display text-xl font-bold text-graphite uppercase tracking-tight">
            Media & Gallery
          </h1>
          <p className="text-sm text-soft-grey mt-1">
            Manage all images and videos used across the website.
          </p>
        </div>
      </div>
      
      {/* The library handles its own scrolling and layout */}
      <div className="flex-1 min-h-0">
        <MediaLibrary mode="manage" />
      </div>
    </div>
  );
};

export default AdminMedia;
