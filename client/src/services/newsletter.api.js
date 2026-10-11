import api from './api';

export const subscribeNewsletter = async (data) => {
  const response = await api.post('/newsletter/subscribe', data);
  return response.data;
};
