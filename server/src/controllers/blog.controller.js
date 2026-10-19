import Blog from '../models/Blog.js';
import { paginate } from '../utils/paginate.js';
import sendEmail from '../utils/mailer.js';
import { claimDocMedia, syncDocMediaUsage, releaseDocMedia } from '../utils/mediaFields.js';

export const getBlogs = async (req, res) => {
  const query = { isDeleted: false, isPublished: true };
  if (req.query.category) query.category = req.query.category;
  if (req.query.type)     query.type     = req.query.type;
  if (req.query.search) {
    query.title = { $regex: req.query.search, $options: 'i' };
  }
  const data = await paginate(Blog, query, req, { sort: { publishedAt: -1 } });
  res.json({ success: true, ...data });
};

export const getAdminBlogs = async (req, res) => {
  const query = {};
  if (req.query.isPublished !== undefined) query.isPublished = req.query.isPublished === 'true';
  if (req.query.isDeleted   !== undefined) query.isDeleted   = req.query.isDeleted   === 'true';
  const data = await paginate(Blog, query, req);
  res.json({ success: true, ...data });
};

export const getBlogBySlug = async (req, res) => {
  const blog = await Blog.findOne({ slug: req.params.slug, isDeleted: false, isPublished: true });
  if (!blog) return res.status(404).json({ success: false, message: 'Article not found.' });
  res.json({ success: true, data: blog });
};

export const getAdminBlogById = async (req, res) => {
  const blog = await Blog.findById(req.params.id);
  if (!blog) return res.status(404).json({ success: false, message: 'Article not found.' });
  res.json({ success: true, data: blog });
};

export const createBlog = async (req, res) => {
  const blog = await Blog.create({ ...req.body, createdBy: req.user._id, isDeleted: false });
  await claimDocMedia('Blog', blog);

  sendEmail({
    to: "ayankhan987456@gmail.com",
    subject: "New Blog Post ",
    text: "Check out our latest blog post!",
    html: `<p>Check out our latest blog post! Read it here: <a href="http://localhost:5173/insights/${blog.slug}">Read More</a></p>`
  });

  res.status(201).json({ success: true, data: blog });
};

export const updateBlog = async (req, res) => {
  const current = await Blog.findById(req.params.id);
  if (!current || current.isDeleted) {
    return res.status(404).json({ success: false, message: 'Article not found.' });
  }
  if (req.body.lastKnownUpdatedAt &&
      new Date(current.updatedAt).getTime() !== new Date(req.body.lastKnownUpdatedAt).getTime()) {
    return res.status(409).json({
      success: false,
      error: 'This record was modified by another user since you loaded it.',
      updatedBy: current.updatedBy, updatedAt: current.updatedAt,
    });
  }
  const { lastKnownUpdatedAt, ...updateData } = req.body;

  if (updateData.isPublished && !current.publishedAt) updateData.publishedAt = new Date();

  const updated = await Blog.findByIdAndUpdate(
    req.params.id,
    { ...updateData, updatedBy: req.user._id },
    { returnDocument: 'after', runValidators: true }
  );

  await syncDocMediaUsage('Blog', current, updated);

  res.json({ success: true, data: updated });
};

export const deleteBlog = async (req, res) => {
  const blog = await Blog.findById(req.params.id);
  if (!blog || blog.isDeleted) {
    return res.status(404).json({ success: false, message: 'Article not found.' });
  }

  if (blog.isPublished) {
    await Blog.findByIdAndUpdate(req.params.id, { isDeleted: true, updatedBy: req.user._id });
    await releaseDocMedia('Blog', blog);
    return res.json({ success: true, message: 'Article soft-deleted.' });
  } else {
    await Blog.findByIdAndDelete(req.params.id);
    await releaseDocMedia('Blog', blog);
    return res.json({ success: true, message: 'Draft permanently deleted.' });
  }
};
