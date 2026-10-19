import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { FiArrowLeft, FiArrowRight, FiCalendar, FiClock, FiUser, FiShare2, FiStar, FiThumbsUp } from 'react-icons/fi'
import axios from 'axios'
import { insights as mockInsights } from '../data/mockData'
import NewsletterCTA from '../components/NewsletterCTA'

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

const ArticleDetail = () => {
  const { slug } = useParams()
  const [article, setArticle] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    const fetchArticle = async () => {
      try {
        const res = await axios.get(`${API}/blog/${slug}`)
        if (res.data.success && res.data.data) {
          setArticle(res.data.data)
        }
      } catch (err) {
        const mockMatch = mockInsights.find(i => i.slug === slug)
        if (mockMatch) {
          setArticle({
            ...mockMatch,
            createdAt: mockMatch.publishedAt,
            author: mockMatch.author || 'Neevevera Technical Cell'
          })
        } else {
          setError(true)
        }
      } finally {
        setLoading(false)
      }
    }
    fetchArticle()
  }, [slug])

  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [reviewSubmitted, setReviewSubmitted] = useState(false)
  const [reviewText, setReviewText] = useState('')

  const handleReviewSubmit = (e) => {
    e.preventDefault()
    // Placeholder for backend wiring later
    setReviewSubmitted(true)
  }

  if (loading) {
    return (
      <div className="w-full min-h-screen bg-[#FAF9F6] flex items-center justify-center text-[#171717]">
        <div className="flex flex-col items-center gap-2">
          <div className="w-6 h-6 border-2 border-[#07558F] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-medium uppercase tracking-widest text-[#07558F]">Loading Article...</p>
        </div>
      </div>
    )
  }

  if (error || !article) {
    return (
      <div className="w-full min-h-screen bg-[#FAF9F6] flex flex-col items-center justify-center text-[#171717] px-6 text-center">
        <h1 className="font-display text-2xl font-bold text-[#111822] mb-2">Article Not Found</h1>
        <Link to="/insights" className="px-6 py-3 bg-[#07558F] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#054373]">
          Return to Journal
        </Link>
      </div>
    )
  }

  return (
    <div className="w-full bg-[#FAF9F6] text-[#171717]">
      <Helmet>
        <title>{article.title} | Neevevera Technical Journal</title>
        <meta name="description" content={article.excerpt || article.content?.slice(0, 160)} />
        <meta property="og:title" content={`${article.title} | Neevevera Insights`} />
        <meta property="og:description" content={article.excerpt || article.content?.slice(0, 160)} />
      </Helmet>
      {/* ── Breadcrumb ── */}
      <div className="border-b border-[#D8D8D2] bg-[#F2EFE9] py-3">
        <div className="max-w-4xl mx-auto px-6 flex items-center justify-between text-xs font-medium">
          <Link
            to="/insights"
            className="inline-flex items-center gap-2 text-[#07558F] hover:underline font-bold uppercase"
          >
            <FiArrowLeft size={13} />
            <span>Return to Technical Journal</span>
          </Link>
          <div className="text-[#6B6B67]">
            CATEGORY: <span className="font-bold text-[#111822]">{article.category}</span>
          </div>
        </div>
      </div>

      {/* ── Article Header ── */}
      <section className="py-12 bg-white border-b border-[#D8D8D2]">
        <div className="max-w-4xl mx-auto px-6">
          <div className="flex items-center gap-3 text-xs font-medium text-[#6B6B67] mb-3">
            <span className="bg-[#07558F] text-white px-2 py-0.5 font-bold uppercase">
              {article.category}
            </span>
            <span className="flex items-center gap-1">
              <FiCalendar size={12} /> {new Date(article.publishedAt || article.createdAt).toLocaleDateString()}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <FiClock size={12} /> 5 min read
            </span>
          </div>

          <h1 className="font-display text-3xl sm:text-5xl font-extrabold text-[#111822] tracking-tight leading-tight">
            {article.title}
          </h1>

          <div className="mt-6 pt-6 border-t border-[#E5E3DC] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#07558F] text-white flex items-center justify-center font-display font-bold text-sm">
                {article.author.charAt(0)}
              </div>
              <div>
                <div className="font-bold text-sm text-[#111822]">{article.author || 'Editorial Team'}</div>
                <div className="text-xs font-medium text-[#6B6B67]">Author</div>
              </div>
            </div>

            <button
              onClick={() => {
                if (navigator.clipboard) {
                  navigator.clipboard.writeText(window.location.href)
                  alert('Article link copied to clipboard!')
                }
              }}
              className="p-2 border border-[#D8D8D2] hover:bg-[#FAF9F6] text-[#6B6B67] hover:text-[#111822] transition-colors rounded-xs"
              title="Share Article"
            >
              <FiShare2 size={16} />
            </button>
          </div>
        </div>
      </section>

      {/* ── Featured Visual ── */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="aspect-[16/9] w-full overflow-hidden border border-[#D8D8D2] bg-neutral-900">
          <img
            src={article.coverImage}
            alt={article.title}
            className="w-full h-full object-cover"
          />
        </div>
      </div>

      {/* ── Article Content ── */}
      <article className="max-w-4xl mx-auto px-6 pb-12 border-b border-[#D8D8D2]">
        <div className="bg-white border border-[#D8D8D2] p-8 sm:p-12 space-y-6 text-[#444440] leading-relaxed text-sm sm:text-base">
          {article.excerpt && (
            <div className="p-4 bg-[#FAF9F6] border-l-4 border-[#07558F] font-medium text-xs sm:text-sm text-[#111822] italic">
              Executive Summary: {article.excerpt}
            </div>
          )}

          <div dangerouslySetInnerHTML={{ __html: article.content }} />
        </div>
      </article>

      {/* ── Blog Review / Feedback Section ── */}
      <section className="py-12 bg-white border-b border-[#D8D8D2]">
        <div className="max-w-4xl mx-auto px-6">
          <div className="bg-[#F2EFE9] p-8 rounded-sm border border-[#D8D8D2]">
            <div className="text-center mb-6">
              <h3 className="font-display font-bold text-xl text-[#111822]">Was this technical article helpful?</h3>
              <p className="text-xs text-[#6B6B67] mt-1">Your feedback helps our editorial board improve content quality.</p>
            </div>
            
            {reviewSubmitted ? (
              <div className="text-center p-6 bg-white border border-[#D8D8D2] rounded-sm flex flex-col items-center justify-center">
                <FiThumbsUp className="text-[#075638] text-2xl mb-2" />
                <p className="font-bold text-[#111822]">Thank you for your feedback!</p>
                <p className="text-xs text-[#6B6B67]">Your review has been recorded.</p>
              </div>
            ) : (
              <form onSubmit={handleReviewSubmit} className="max-w-lg mx-auto space-y-4">
                <div className="flex justify-center gap-2 mb-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="focus:outline-none transition-transform hover:scale-110"
                    >
                      <FiStar
                        size={28}
                        className={`${
                          (hoverRating || rating) >= star ? 'fill-[#B9923B] text-[#B9923B]' : 'text-[#D8D8D2]'
                        } transition-colors`}
                      />
                    </button>
                  ))}
                </div>
                <div>
                  <textarea
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                    placeholder="Share any specific thoughts or questions about this article... (Optional)"
                    rows={3}
                    className="w-full bg-white text-[#111822] p-3 text-xs border border-[#D8D8D2] focus:outline-none focus:border-[#07558F] rounded-sm resize-none"
                  />
                </div>
                <button
                  type="submit"
                  disabled={rating === 0}
                  className="w-full py-3 bg-[#111822] hover:bg-[#07558F] text-white text-xs font-bold uppercase tracking-wider transition-colors rounded-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Submit Review
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* ── Newsletter Section ── */}
      <NewsletterCTA />
    </div>
  )
}

export default ArticleDetail
