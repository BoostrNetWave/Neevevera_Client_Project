import HomeContent from '../models/HomeContent.js';
import { incrementMediaUsage, decrementMediaUsage } from '../utils/mediaHelper.js';

const ALLOWED_FIELDS = [
  'heroTitle', 'heroSubtitle', 'heroImage', 'heroCtaLabel', 'heroCtaLink',
  'introHeadline', 'introBody',
  'featuredServiceIds', 'featuredProjectIds',
  'stats', 'whyChooseUsTitle', 'whyChooseUsPoints',
  'ctaTitle', 'ctaBody', 'ctaButtonLabel', 'ctaButtonLink',
];

// GET /api/home — public, returns the singleton record
export const getHomeContent = async (req, res) => {
  const doc = await HomeContent.findOne({ _singletonKey: 'home' })
    .populate('featuredServiceIds', 'title slug image shortDescription isActive')
    .populate('featuredProjectIds', 'title slug coverImage category location status');
  if (!doc) return res.status(404).json({ success: false, message: 'Home content not yet configured.' });
  res.json({ success: true, data: doc });
};

// PUT /api/home — admin/superadmin only, upserts the singleton
export const updateHomeContent = async (req, res) => {
  const update = {};
  for (const key of ALLOWED_FIELDS) {
    if (req.body[key] !== undefined) update[key] = req.body[key];
  }

  if (Object.keys(update).length === 0) {
    return res.status(400).json({ success: false, message: 'No valid fields provided.' });
  }

  update.updatedBy = req.user._id;

  const current = await HomeContent.findOne({ _singletonKey: 'home' });
  const oldImage = current?.heroImage;
  const newImage = update.heroImage;

  const doc = await HomeContent.findOneAndUpdate(
    { _singletonKey: 'home' },
    { $set: update },
    { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
  );
  
  if (newImage !== oldImage) {
    if (oldImage) decrementMediaUsage(oldImage);
    if (newImage) incrementMediaUsage(newImage);
  }
  
  res.json({ success: true, data: doc });
};
