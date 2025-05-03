import axios from 'axios';

const API_URL = 'http://localhost:3001/api';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Define the Job interface
export interface Job {
  id: number;
  title: string;
  company: string;
  location: string;
  jobType: string;
  salaryRange: string;
  deadline: string;
  description: string;
  requirements: string;
  responsibilities: string;
  isDraft: boolean;
}

export interface JobFilters {
  title?: string;
  company?: string;
  location?: string;
  jobType?: string;
  minSalary?: number;
  maxSalary?: number;
  deadline?: string;
}

export const jobApi = {
  // Specify that data should be of type Job
  createJob: (data: Job) => api.post('/jobs', data),
  getJobs: () => api.get<Job[]>('/jobs'),  // Returns an array of Job objects
  filterJobs: (filters: JobFilters) => api.get('/jobs/filter', { params: filters }),  // Returns filtered jobs
  getJob: (id: number) => api.get<Job>(`/jobs/${id}`),  // Returns a single Job
  updateJob: (id: number, data: Job) => api.patch(`/jobs/${id}`, data),
  deleteJob: (id: number) => api.delete(`/jobs/${id}`),
  getDrafts: () => api.get<Job[]>('/jobs/drafts'),  // Returns an array of Job objects (drafts)
  getPublished: () => api.get<Job[]>('/jobs/published'),  // Returns an array of Job objects (published)
};
