import axios from 'axios';

const API_URL = 'http://localhost:3001/api';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const jobApi = {
  createJob: (data: any) => api.post('/jobs', data),
  getJobs: () => api.get('/jobs'),
  filterJobs: (filters: any) => api.get('/jobs/filter', { params: filters }),
  getJob: (id: number) => api.get(`/jobs/${id}`),
  updateJob: (id: number, data: any) => api.patch(`/jobs/${id}`, data),
  deleteJob: (id: number) => api.delete(`/jobs/${id}`),
  getDrafts: () => api.get('/jobs/drafts'),
  getPublished: () => api.get('/jobs/published'),
};