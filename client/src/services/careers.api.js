import api from './api';

export const uploadResume = async (file) => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await api.post('/public-upload/resume', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const submitApplication = async ({ jobSlug, ...data }) => {
  const response = await api.post(`/careers/${jobSlug}/apply`, data);
  return response.data;
};
