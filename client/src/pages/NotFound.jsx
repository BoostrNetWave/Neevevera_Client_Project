import React from 'react'
import { Link } from 'react-router-dom'
import { FiArrowLeft } from 'react-icons/fi'

const NotFound = () => {
  return (
    <div className="w-full bg-[#FAF9F6] text-[#171717] min-h-[60vh] flex items-center justify-center py-20">
      <div className="text-center max-w-md mx-auto px-6">
        <div className="font-medium text-6xl font-extrabold text-[#07558F]">404</div>
        <h1 className="font-display text-2xl font-bold text-[#111822] mt-2">
          Structural Record Not Found
        </h1>
        <p className="text-xs font-medium text-[#6B6B67] mt-2">
          The requested engineering dossier or page does not exist in the current directory index.
        </p>
        <Link
          to="/"
          className="mt-6 inline-flex items-center gap-2 px-6 py-3 bg-[#07558F] text-white text-xs font-medium font-bold uppercase"
        >
          <FiArrowLeft size={13} />
          <span>Return to Homepage</span>
        </Link>
      </div>
    </div>
  )
}

export default NotFound
