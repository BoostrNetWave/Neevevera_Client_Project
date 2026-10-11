import NewsletterSubscriber from '../models/NewsletterSubscriber.js';
import { paginate } from '../utils/paginate.js';

export const subscribe = async (req, res) => {
  const email = req.body.email?.toLowerCase()?.trim();
  if (!email) return res.status(400).json({ success: false, message: 'Email is required.' });

  const existing = await NewsletterSubscriber.findOne({ email });
  if (existing) {
    if (!existing.isActive) {
      existing.isActive = true;
      existing.unsubscribedAt = undefined;
      await existing.save();
      return res.json({ success: true, message: 'You have been re-subscribed. Welcome back!' });
    }
    return res.json({ success: true, message: 'You are already subscribed.' });
  }

  await NewsletterSubscriber.create({
    email,
    name: req.body.name?.trim(),
    source: req.body.source || 'website-newsletter',
  });
  res.status(201).json({ success: true, message: 'Subscribed successfully.' });
};

export const unsubscribe = async (req, res) => {
  const email = req.body.email?.toLowerCase()?.trim();
  if (!email) return res.status(400).json({ success: false, message: 'Email is required.' });
  const sub = await NewsletterSubscriber.findOne({ email });
  if (!sub) return res.status(404).json({ success: false, message: 'Email not found.' });
  sub.isActive = false;
  sub.unsubscribedAt = new Date();
  await sub.save();
  res.json({ success: true, message: 'You have been unsubscribed.' });
};

export const getSubscribers = async (req, res) => {
  const filter = {};
  if (req.query.active !== undefined) filter.isActive = req.query.active === 'true';
  const data = await paginate(NewsletterSubscriber, filter, req);
  res.json({ success: true, ...data });
};
