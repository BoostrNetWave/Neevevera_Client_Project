/**
 * serviceMedia.js
 * 
 * Helper utility to collect all image URLs referenced across an entire
 * service document tree. Re-exports and wraps the generic extractMediaUrls.
 */
import { extractMediaUrls } from './mediaFields.js';

export function collectServiceImages(service) {
  return extractMediaUrls('Service', service);
}
