import api from './api';

/**
 * researcher.api.js — Public API calls for R&D researcher registration and directory.
 */

/**
 * Submit a civil researcher / academic collaborator registration.
 * @param {Object} data - Researcher registration payload.
 */
export const registerResearcher = async (data) => {
  const response = await api.post('/researchers/register', data);
  return response.data;
};

/**
 * Fetch the public approved researcher directory.
 * @param {Object} params - Optional query params: { page, limit, discipline }
 */
export const getApprovedResearchers = async (params = {}) => {
  const response = await api.get('/researchers/approved', { params });
  return response.data;
};
