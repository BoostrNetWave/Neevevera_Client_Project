import 'dotenv/config';
import { v2 as cloudinary } from 'cloudinary';

console.log('CLOUD_NAME :', process.env.CLOUDINARY_CLOUD_NAME);
console.log('API_KEY    :', process.env.CLOUDINARY_API_KEY);
console.log('SECRET_LEN :', process.env.CLOUDINARY_API_SECRET?.length);

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME?.trim(),
  api_key:    process.env.CLOUDINARY_API_KEY?.trim(),
  api_secret: process.env.CLOUDINARY_API_SECRET?.trim(),
});

const PNG_1x1 = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64');

cloudinary.uploader.upload_stream({ resource_type: 'image', public_id: 'neevevera_test_delete_me' }, (err, result) => {
  if (err) { console.error('UPLOAD FAILED:', JSON.stringify(err, null, 2)); }
  else { console.log('UPLOAD SUCCESS! URL:', result.secure_url); }
}).end(PNG_1x1);
