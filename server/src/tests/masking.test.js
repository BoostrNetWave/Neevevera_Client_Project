import { describe, it, expect } from 'vitest';
import { maskPhone, maskEmail, maskSensitivePhoneFields } from '../utils/masking.js';
import { serializeBookingPublic, serializeBookingAdmin } from '../controllers/siteInspection.controller.js';
import { serializeTeamMemberPublic } from '../controllers/team.controller.js';

describe('Phone Number Masking Utility (maskPhone)', () => {
  describe('Indian mobile numbers', () => {
    it('masks standard 10-digit mobile number with +91 format', () => {
      expect(maskPhone('9876543210')).toBe('+91 98••••••10');
      expect(maskPhone('7684078877')).toBe('+91 76••••••77');
      expect(maskPhone('6291234567')).toBe('+91 62••••••67');
      expect(maskPhone('8596911655')).toBe('+91 85••••••55');
    });

    it('handles +91 prefix and spaces', () => {
      expect(maskPhone('+919876543210')).toBe('+91 98••••••10');
      expect(maskPhone('+91 98765 43210')).toBe('+91 98••••••10');
      expect(maskPhone('+91-98765-43210')).toBe('+91 98••••••10');
    });

    it('handles 0 and 91 prefixes', () => {
      expect(maskPhone('09876543210')).toBe('+91 98••••••10');
      expect(maskPhone('919876543210')).toBe('+91 98••••••10');
    });
  });

  describe('International phone numbers', () => {
    it('masks international numbers while preserving country prefix and last 2 digits', () => {
      const maskedUS = maskPhone('+1 415 555 2671');
      expect(maskedUS.startsWith('+1')).toBe(true);
      expect(maskedUS.endsWith('71')).toBe(true);
      expect(maskedUS).toContain('•');
      expect(maskedUS).not.toContain('555');

      const maskedUK = maskPhone('+44 7911 123456');
      expect(maskedUK.startsWith('+44')).toBe(true);
      expect(maskedUK.endsWith('56')).toBe(true);
      expect(maskedUK).toContain('•');
    });
  });

  describe('Missing, empty, and nil values', () => {
    it('returns empty string for null, undefined, and empty string', () => {
      expect(maskPhone(null)).toBe('');
      expect(maskPhone(undefined)).toBe('');
      expect(maskPhone('')).toBe('');
      expect(maskPhone('   ')).toBe('');
    });
  });

  describe('Malformed and unsafe inputs', () => {
    it('does not leak digits for short or invalid inputs', () => {
      const short = maskPhone('12345');
      expect(short).toBe('••••••••••');
      expect(short).not.toContain('12345');

      const textOnly = maskPhone('not-a-number');
      expect(textOnly).toBe('••••••••••');

      const justCountryCode = maskPhone('+91');
      expect(justCountryCode).toBe('••••••••••');
    });
  });

  describe('Email Masking Utility (maskEmail)', () => {
    it('masks local-part while preserving initial and final character and full domain', () => {
      const masked = maskEmail('ramesh.das@example.com');
      expect(masked.startsWith('r')).toBe(true);
      expect(masked.endsWith('s@example.com')).toBe(true);
      expect(masked).toContain('•');
      expect(masked).not.toContain('ramesh.das');
    });

    it('handles short usernames and edge cases safely', () => {
      expect(maskEmail('a@domain.com')).toBe('a•@domain.com');
      expect(maskEmail('ab@domain.com')).toBe('a•@domain.com');
      expect(maskEmail('')).toBe('');
      expect(maskEmail(null)).toBe('');
      expect(maskEmail('invalid-email')).toBe('••••••••');
    });
  });

  describe('maskSensitivePhoneFields helper', () => {
    it('shallowly masks specified phone fields on an object', () => {
      const input = {
        name: 'Ramesh Das',
        phone: '9876543210',
        customerPhone: '+919876543211',
        email: 'ramesh@example.com',
      };
      const masked = maskSensitivePhoneFields(input);
      expect(masked.phone).toBe('+91 98••••••10');
      expect(masked.customerPhone).toBe('+91 98••••••11');
      expect(masked.email).toBe('ramesh@example.com');
      expect(masked.name).toBe('Ramesh Das');
    });
  });
});

describe('Public vs Admin Serializer Behaviour', () => {
  const dummyBooking = {
    _id: '671f00000000000000000001',
    bookingRef: 'SIB-TESTREF1234',
    customerName: 'Amiya Mohapatra',
    customerPhone: '9861012345',
    customerEmail: 'amiya@example.com',
    siteAddress: 'Plot 42, Infocity Road, Patia',
    pinCode: '751024',
    district: 'Khurda',
    state: 'Odisha',
    visitType: 'residential',
    projectNote: 'Private construction notes',
    amountPaise: 100000,
    currency: 'INR',
    visitStartTime: new Date('2026-11-01T10:00:00Z'),
    visitEndTime: new Date('2026-11-01T11:30:00Z'),
    bookingStatus: 'confirmed',
    paymentStatus: 'paid',
    policyVersionSnapshot: 'v1.0',
    termsSnapshot: 'The booking token is non-refundable.',
    holdExpiresAt: new Date('2026-11-01T10:10:00Z'),
    assignedStaffId: '671f00000000000000000002',
    adminNotes: 'High priority corporate lead',
    cancellationReason: null,
    policyAccepted: true,
    policyAcceptedAt: new Date('2026-10-28T10:00:00Z'),
    statusHistory: [{ fromBookingStatus: 'hold_placed', toBookingStatus: 'confirmed' }],
    createdAt: new Date('2026-10-28T10:00:00Z'),
    updatedAt: new Date('2026-10-28T10:05:00Z'),
  };

  it('serializeBookingPublic masks customerPhone and redacts private fields', () => {
    const publicData = serializeBookingPublic(dummyBooking);

    // customerPhone MUST be masked
    expect(publicData.customerPhone).toBe('+91 98••••••45');
    expect(publicData.customerPhone).not.toBe('9861012345');

    // customerEmail MUST be masked
    expect(publicData.customerEmail).toContain('•');
    expect(publicData.customerEmail).not.toBe('amiya@example.com');

    // Safe public fields
    expect(publicData.bookingRef).toBe('SIB-TESTREF1234');
    expect(publicData.customerName).toBe('Amiya Mohapatra');
    expect(publicData.bookingStatus).toBe('confirmed');

    // Sensitive admin fields must NOT be present
    expect(publicData._id).toBeUndefined();
    expect(publicData.siteAddress).toBeUndefined();
    expect(publicData.pinCode).toBeUndefined();
    expect(publicData.adminNotes).toBeUndefined();
    expect(publicData.assignedStaffId).toBeUndefined();
    expect(publicData.statusHistory).toBeUndefined();
  });

  it('serializeBookingAdmin preserves full, unmasked customerPhone and protected fields', () => {
    const adminData = serializeBookingAdmin(dummyBooking);

    // Full phone number available to authorized admin
    expect(adminData.customerPhone).toBe('9861012345');

    // Admin fields present
    expect(adminData.siteAddress).toBe('Plot 42, Infocity Road, Patia');
    expect(adminData.pinCode).toBe('751024');
    expect(adminData.adminNotes).toBe('High priority corporate lead');
    expect(adminData.statusHistory).toBeDefined();
  });

  it('serializeTeamMemberPublic masks phone if present on staff member', () => {
    const staff = {
      name: 'Er. Rajesh Nayak',
      designation: 'Senior Structural Engineer',
      email: 'rajesh@neevevara.com',
      phone: '9437012345',
    };
    const serialized = serializeTeamMemberPublic(staff);
    expect(serialized.name).toBe('Er. Rajesh Nayak');
    expect(serialized.email).toBe('rajesh@neevevara.com');
    expect(serialized.phone).toBe('+91 94••••••45');
  });
});
