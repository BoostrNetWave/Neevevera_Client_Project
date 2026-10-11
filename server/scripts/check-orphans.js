import 'dotenv/config';
import mongoose from 'mongoose';
import MediaAsset from '../src/models/MediaAsset.js';
import Project from '../src/models/Project.js';
import Service from '../src/models/Service.js';
import TeamMember from '../src/models/TeamMember.js';
import Testimonial from '../src/models/Testimonial.js';
import Blog from '../src/models/Blog.js';
import HomeContent from '../src/models/HomeContent.js';
import CompanyInfo from '../src/models/CompanyInfo.js';

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB.\n');

  // Find all MediaAssets with usageCount 0
  const orphans = await MediaAsset.find({ usageCount: 0 }).lean();
  console.log(`Found ${orphans.length} MediaAssets with usageCount: 0`);

  if (orphans.length === 0) {
    await mongoose.disconnect();
    return;
  }

  const orphanUrls = orphans.map(a => a.url);
  const orphanPublicIds = orphans.map(a => a.publicId);

  // Check if any of these URLs/publicIds are actually used in other collections
  let falseOrphans = 0;

  for (const asset of orphans) {
    let isUsed = false;
    let usedIn = [];

    // Check Projects (coverImage, gallery array)
    const inProjects = await Project.countDocuments({
      $or: [
        { coverImage: asset.url },
        { gallery: asset.url }
      ]
    });
    if (inProjects > 0) { isUsed = true; usedIn.push('Project'); }

    // Check Services (coverImage, icon if it's a URL)
    const inServices = await Service.countDocuments({ coverImage: asset.url });
    if (inServices > 0) { isUsed = true; usedIn.push('Service'); }

    // Check Team (image)
    const inTeam = await TeamMember.countDocuments({ image: asset.url });
    if (inTeam > 0) { isUsed = true; usedIn.push('TeamMember'); }

    // Check Testimonial (image)
    const inTestimonial = await Testimonial.countDocuments({ image: asset.url });
    if (inTestimonial > 0) { isUsed = true; usedIn.push('Testimonial'); }

    // Check Blog (coverImage)
    const inBlog = await Blog.countDocuments({ coverImage: asset.url });
    if (inBlog > 0) { isUsed = true; usedIn.push('Blog'); }

    // Check HomeContent (heroImage)
    const inHome = await HomeContent.countDocuments({ heroImage: asset.url });
    if (inHome > 0) { isUsed = true; usedIn.push('HomeContent'); }

    // Check CompanyInfo (logo, certifications)
    const inCompany = await CompanyInfo.countDocuments({
      $or: [
        { logoLight: asset.url },
        { logoDark: asset.url },
        { 'certifications.image': asset.url }
      ]
    });
    if (inCompany > 0) { isUsed = true; usedIn.push('CompanyInfo'); }

    if (isUsed) {
      console.log(`FALSE ORPHAN: Asset ${asset.publicId} (context: ${asset.context}) is used in: ${usedIn.join(', ')}`);
      falseOrphans++;
    }
  }

  console.log(`\nTotal False Orphans (usageCount: 0 but actually referenced): ${falseOrphans}`);
  console.log(`True Orphans (safe to delete): ${orphans.length - falseOrphans}`);

  await mongoose.disconnect();
}

run().catch(console.error);
