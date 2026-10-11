import { asyncHandler } from "../utils/asyncHandler.js";
import express    from 'express';
import rateLimit  from 'express-rate-limit';
import { protect, requireRole } from '../middleware/auth.middleware.js';
import * as teamController from '../controllers/team.controller.js';

const router = express.Router();
const WRITE_ROLES = ['admin', 'superadmin', 'editor'];

router.get('/',         asyncHandler(teamController.getTeamMembers));
router.get('/admin',    protect, requireRole(...WRITE_ROLES), asyncHandler(teamController.getTeamMembersAdmin));
router.get('/:id',      protect, requireRole(...WRITE_ROLES), asyncHandler(teamController.getTeamMember));
router.post('/',        protect, requireRole(...WRITE_ROLES), asyncHandler(teamController.createTeamMember));
router.put('/:id',      protect, requireRole(...WRITE_ROLES), asyncHandler(teamController.updateTeamMember));
router.delete('/:id',   protect, requireRole('admin', 'superadmin'), asyncHandler(teamController.deactivateTeamMember));
router.patch('/:id/activate', protect, requireRole('admin', 'superadmin'), asyncHandler(teamController.activateTeamMember));

export default router;
