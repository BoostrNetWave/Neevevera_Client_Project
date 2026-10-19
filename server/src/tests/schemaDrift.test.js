import { describe, it, expect } from 'vitest';
import { MEDIA_FIELDS } from '../utils/mediaFields.js';

import Service from '../models/Service.js';
import Project from '../models/Project.js';
import Blog from '../models/Blog.js';
import TeamMember from '../models/TeamMember.js';
import Testimonial from '../models/Testimonial.js';
import GalleryItem from '../models/GalleryItem.js';
import HomeContent from '../models/HomeContent.js';
import CompanyInfo from '../models/CompanyInfo.js';

const MODELS = {
  Service,
  Project,
  Blog,
  TeamMember,
  Testimonial,
  GalleryItem,
  HomeContent,
  CompanyInfo,
};

/**
 * Checks whether a Mongoose schema contains a specified field path,
 * correctly navigating through nested arrays and subdocuments.
 */
function verifySchemaPath(schema, pathStr) {
  const segments = pathStr.split('.').filter(Boolean);
  let currentSchema = schema;

  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];
    const isArray = segment.endsWith('[]');
    const fieldName = isArray ? segment.slice(0, -2) : segment;

    const schemaType = currentSchema.path(fieldName);
    if (!schemaType) {
      return { exists: false, failedAt: fieldName, segment };
    }

    if (i === segments.length - 1) {
      return { exists: true };
    }

    // Traverse into embedded schema
    if (schemaType.schema) {
      currentSchema = schemaType.schema;
    } else if (schemaType.caster?.schema) {
      currentSchema = schemaType.caster.schema;
    } else if (schemaType.schemaOptions?._isSchema) {
      currentSchema = schemaType;
    } else {
      return { exists: false, failedAt: `${fieldName} (not a subdocument schema)`, segment };
    }
  }

  return { exists: true };
}

describe('Schema Drift Test — MEDIA_FIELDS vs Mongoose Models', () => {
  it('all registered models must be imported and have a Mongoose schema', () => {
    for (const modelName of Object.keys(MEDIA_FIELDS)) {
      const model = MODELS[modelName];
      expect(model, `Model "${modelName}" should be registered in MODELS`).toBeDefined();
      expect(model.schema, `Model "${modelName}" should have a valid Mongoose schema`).toBeDefined();
    }
  });

  for (const [modelName, fields] of Object.entries(MEDIA_FIELDS)) {
    describe(`Model: ${modelName}`, () => {
      for (const fieldPath of fields) {
        it(`schema must define path: "${fieldPath}"`, () => {
          const model = MODELS[modelName];
          const result = verifySchemaPath(model.schema, fieldPath);
          expect(
            result.exists,
            `Path "${fieldPath}" does NOT exist in ${modelName} schema (failed at: ${result.failedAt}). Possible schema drift / mismatched field name!`
          ).toBe(true);
        });
      }
    });
  }

  it('detects deliberate invalid field names (e.g. image vs photo on TeamMember)', () => {
    const teamCheck = verifySchemaPath(TeamMember.schema, 'image');
    expect(teamCheck.exists).toBe(false);

    const testimonialCheck = verifySchemaPath(Testimonial.schema, 'image');
    expect(testimonialCheck.exists).toBe(false);
  });
});
