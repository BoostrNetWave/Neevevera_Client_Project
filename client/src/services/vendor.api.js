import api from './api';

export const registerVendor = async (data) => {
  const response = await api.post('/vendors', data);
  return response.data;
};
