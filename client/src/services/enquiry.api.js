import api from './api';

export const submitEnquiry = async (data) => {
  const response = await api.post('/enquiries', data);
  return response.data;
};
