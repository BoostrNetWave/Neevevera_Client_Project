/**
 * content.api.js — GET-side API calls for all public content.
 *
 * Uses the shared Axios instance from api.js (withCredentials, baseURL set).
 *
 * Every function accepts an optional { signal } so AbortController in
 * useApiData can actually cancel the underlying request. Without this,
 * calling controller.abort() is cosmetic — the request still runs and
 * can overwrite state with stale data.
 *
 * Naming convention:
 *   List functions   -> returns { success, items, total, page, pages }
 *   Detail functions -> returns { success, data }
 */

import api from './api';

// -- Company Info (singleton) ----------------------------------------
// Powers: About section on Home, full About page, Footer contact details
export const getCompanyInfo = ({ signal } = {}) =>
  api.get('/company', { signal }).then((r) => r.data);

// -- Services --------------------------------------------------------
// params: { page, limit, category, isActive }
export const getServices = (params = {}, { signal } = {}) =>
  api.get('/services', { params, signal }).then((r) => r.data);

export const getServiceBySlug = (slug, { signal } = {}) =>
  api.get(`/services/${slug}`, { signal }).then((r) => r.data);

// -- Projects --------------------------------------------------------
// params: { page, limit, category, region, status, search }
export const getProjects = (params = {}, { signal } = {}) =>
  api.get('/projects', { params, signal }).then((r) => r.data);

export const getProjectBySlug = (slug, { signal } = {}) =>
  api.get(`/projects/${slug}`, { signal }).then((r) => r.data);

// -- Team ------------------------------------------------------------
export const getTeam = (params = {}, { signal } = {}) =>
  api.get('/team', { params, signal }).then((r) => r.data);

// -- Testimonials ----------------------------------------------------
export const getTestimonials = (params = {}, { signal } = {}) =>
  api.get('/testimonials', { params, signal }).then((r) => r.data);

// -- Careers ---------------------------------------------------------
export const getJobOpenings = (params = {}, { signal } = {}) =>
  api.get('/careers', { params, signal }).then((r) => r.data);

export const getJobBySlug = (slug, { signal } = {}) =>
  api.get(`/careers/${slug}`, { signal }).then((r) => r.data);

// -- Blog / Insights -------------------------------------------------
// params: { page, limit, search } -- backend only returns isPublished:true
export const getBlogPosts = (params = {}, { signal } = {}) =>
  api.get('/blog', { params, signal }).then((r) => r.data);

export const getArticleBySlug = (slug, { signal } = {}) =>
  api.get(`/blog/${slug}`, { signal }).then((r) => r.data);

// -- Podcast ---------------------------------------------------------
export const getPodcastEpisodes = (params = {}, { signal } = {}) =>
  api.get('/podcast', { params, signal }).then((r) => r.data);

export const getPodcastBySlug = (slug, { signal } = {}) =>
  api.get(`/podcast/${slug}`, { signal }).then((r) => r.data);

// -- Search ----------------------------------------------------------
// NOTE: /api/search route exists (search.routes.js mounted in app.js)
// but confirm what the controller returns before wiring Search.jsx.
// The PRD listed full Atlas Search as a future feature; the current
// controller may do a basic aggregation that is not production-ready.
export const search = (query, { signal } = {}) =>
  api.get('/search', { params: { q: query }, signal }).then((r) => r.data);
