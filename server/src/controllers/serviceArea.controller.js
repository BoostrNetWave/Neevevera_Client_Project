import ServiceArea from '../models/ServiceArea.js';
import { paginate } from '../utils/paginate.js';

/**
 * Public check endpoint:
 * GET /api/service-areas/check?pincode=753001
 */
export const checkPincodeCoverage = async (req, res) => {
  try {
    const rawPin = req.query.pincode;

    if (!rawPin || typeof rawPin !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'PIN code query parameter is required.',
      });
    }

    const pincode = rawPin.trim();

    // Strict 6-digit Indian PIN regex (starts with 1-9 followed by 5 digits)
    if (!/^[1-9][0-9]{5}$/.test(pincode)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Indian PIN code format. Must be 6 digits.',
      });
    }

    const area = await ServiceArea.findOne({ pincode, isActive: true }).populate(
      'serviceIds',
      'title slug category'
    );

    if (!area) {
      return res.json({
        success: true,
        pincode,
        serviceable: false,
        status: 'unconfirmed',
        message: `Coverage is not yet confirmed for PIN ${pincode}. Submit an enquiry for a custom assessment.`,
      });
    }

    if (area.status === 'not_covered') {
      return res.json({
        success: true,
        pincode,
        district: area.district,
        state: area.state,
        serviceable: false,
        status: 'not_covered',
        message: `We currently do not offer active direct field services in ${area.district}, ${area.state}.`,
      });
    }

    return res.json({
      success: true,
      pincode: area.pincode,
      district: area.district,
      state: area.state,
      officeNames: area.officeNames || [],
      serviceable: true,
      status: 'covered',
      allServices: area.allServices,
      services: area.serviceIds || [],
      notes: area.notes || '',
      message: `Direct Civil, Structural & Repair Services Active in ${area.district}, ${area.state}. Next-day engineering appraisal available.`,
    });
  } catch (error) {
    console.error('Error checking PIN code coverage:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while checking coverage.',
    });
  }
};

/**
 * Admin: List all service areas with pagination & search
 * GET /api/service-areas
 */
export const getAllServiceAreas = async (req, res) => {
  try {
    const query = {};
    if (req.query.district) {
      query.district = { $regex: req.query.district.trim(), $options: 'i' };
    }
    if (req.query.status) {
      query.status = req.query.status;
    }
    if (req.query.search) {
      const s = req.query.search.trim();
      query.$or = [
        { pincode: { $regex: s, $options: 'i' } },
        { district: { $regex: s, $options: 'i' } },
        { state: { $regex: s, $options: 'i' } },
      ];
    }

    const data = await paginate(ServiceArea, query, req, {
      sort: { state: 1, district: 1, pincode: 1 },
      populate: { path: 'serviceIds', select: 'title slug' },
    });

    return res.json({ success: true, ...data });
  } catch (error) {
    console.error('Error fetching service areas:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * Admin: Create a new service area PIN
 * POST /api/service-areas
 */
export const createServiceArea = async (req, res) => {
  try {
    const { pincode, district, state, status, officeNames, allServices, serviceIds, notes } = req.body;

    if (!pincode || !district || !state) {
      return res.status(400).json({
        success: false,
        message: 'pincode, district, and state are required fields.',
      });
    }

    const existing = await ServiceArea.findOne({ pincode: pincode.trim() });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: `PIN code ${pincode} already exists in the system.`,
      });
    }

    const area = await ServiceArea.create({
      pincode: pincode.trim(),
      district: district.trim(),
      state: state.trim(),
      status: status || 'covered',
      officeNames: Array.isArray(officeNames) ? officeNames : [],
      allServices: allServices !== false,
      serviceIds: Array.isArray(serviceIds) ? serviceIds : [],
      notes: notes || '',
      updatedBy: req.user?._id,
    });

    return res.status(201).json({ success: true, item: area });
  } catch (error) {
    console.error('Error creating service area:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * Admin: Update service area
 * PUT /api/service-areas/:id
 */
export const updateServiceArea = async (req, res) => {
  try {
    const area = await ServiceArea.findById(req.params.id);
    if (!area) {
      return res.status(404).json({ success: false, message: 'Service area not found' });
    }

    const allowed = ['district', 'state', 'status', 'officeNames', 'isActive', 'allServices', 'serviceIds', 'notes'];
    allowed.forEach((field) => {
      if (req.body[field] !== undefined) {
        area[field] = req.body[field];
      }
    });

    area.updatedBy = req.user?._id;
    await area.save();

    return res.json({ success: true, item: area });
  } catch (error) {
    console.error('Error updating service area:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * Admin: Delete service area
 * DELETE /api/service-areas/:id
 */
export const deleteServiceArea = async (req, res) => {
  try {
    const area = await ServiceArea.findByIdAndDelete(req.params.id);
    if (!area) {
      return res.status(404).json({ success: false, message: 'Service area not found' });
    }
    return res.json({ success: true, message: 'Service area deleted successfully' });
  } catch (error) {
    console.error('Error deleting service area:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};
