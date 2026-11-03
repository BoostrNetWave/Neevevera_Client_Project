import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';

async function main() {
  await mongoose.connect(process.env.MONGO_URI);
  const DsrSetting = mongoose.model('DsrSetting', new mongoose.Schema({}, { strict: false }));
  const DsrItem = mongoose.model('DsrItem', new mongoose.Schema({}, { strict: false }));
  
  const sRes = await DsrSetting.updateOne(
    { key: 'global_dsr_settings' },
    { $set: { isEstimatorActive: true } },
    { upsert: true }
  );
  
  const iRes = await DsrItem.updateMany(
    {},
    { $set: { isVerified: true, isActive: true } }
  );

  const total = await DsrItem.countDocuments();
  const verified = await DsrItem.countDocuments({ isVerified: true, isActive: true });
  console.log('Settings update:', sRes);
  console.log('Active verified items:', verified, 'of', total);
  await mongoose.disconnect();
}

main().catch(console.error);

