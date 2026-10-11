import Project from '../models/Project.js';
import Service from '../models/Service.js';
import Blog from '../models/Blog.js';
import { asyncHandler } from '../utils/asyncHandler.js';

/**
 * Global Search Controller
 * Searches across Projects, Services, and Blogs (Insights).
 * Supports the '?q=' query parameter.
 */
export const globalSearch = asyncHandler(async (req, res) => {
  const queryText = req.query.q || '';
  if (!queryText.trim()) {
    return res.json({ success: true, data: [] });
  }

  const regex = { $regex: queryText, $options: 'i' };

  // Search promises
  const projectsPromise = Project.find({
    isDeleted: false,
    $or: [{ title: regex }, { description: regex }, { category: regex }]
  }).limit(10).lean();

  const servicesPromise = Service.find({
    isActive: true,
    $or: [{ title: regex }, { description: regex }, { category: regex }]
  }).limit(10).lean();

  const blogsPromise = Blog.find({
    isDeleted: false,
    isPublished: true,
    $or: [{ title: regex }, { excerpt: regex }, { content: regex }, { category: regex }]
  }).limit(10).lean();

  // Execute in parallel
  const [projects, services, blogs] = await Promise.all([
    projectsPromise,
    servicesPromise,
    blogsPromise
  ]);

  // Format results for the frontend search page
  const formattedResults = [
    ...projects.map(p => ({
      id: p._id,
      type: 'project',
      title: p.title,
      description: p.description,
      slug: p.slug,
      image: p.coverImage,
      badge: p.category
    })),
    ...services.map(s => ({
      id: s._id,
      type: 'service',
      title: s.title,
      description: s.description,
      slug: s.slug,
      image: s.coverImage,
      badge: s.category
    })),
    ...blogs.map(b => ({
      id: b._id,
      type: 'insight',
      title: b.title,
      description: b.excerpt,
      slug: b.slug,
      image: b.coverImage,
      badge: b.category
    }))
  ];

  // Optional: sort results by relevance (currently just sorting by title alphabetically for consistency)
  formattedResults.sort((a, b) => a.title.localeCompare(b.title));

  res.json({
    success: true,
    count: formattedResults.length,
    data: formattedResults
  });
});
