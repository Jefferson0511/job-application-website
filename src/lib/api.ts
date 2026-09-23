import axios from 'axios';
import type { AuthResult, Job, NewJob } from './types';
import { getToken, setToken } from './auth-token';

/**
 * Single source of truth for where the NestJS API lives. Set
 * NEXT_PUBLIC_API_URL to point a build at a different backend.
 */
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  (process.env.NODE_ENV === 'development'
    ? 'http://localhost:3002'
    : 'https://job-application-website-production-ba78.up.railway.app');

export const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attaching the token per request rather than once at client creation, so a
// sign-in later in the session takes effect without rebuilding the client.
api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// An expired or revoked token should not leave the UI believing it is signed
// in; clearing it here means the next render shows the sign-in button.
api.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      setToken(null);
    }
    return Promise.reject(error);
  },
);

export type { Job, NewJob };

export interface JobFilters {
  title?: string;
  company?: string;
  location?: string;
  jobType?: string;
  minSalary?: number;
  maxSalary?: number;
  deadline?: string;
}

export interface SemanticSearchParams {
  /** Natural-language query, e.g. "remote backend work with cloud infra". */
  q: string;
  location?: string;
  jobType?: string;
  limit?: number;
  minSimilarity?: number;
}

/** A posting plus how closely it matched the query, from 0 to 1. */
export interface JobSearchHit {
  job: Job;
  similarity: number;
}

export interface Credentials {
  email: string;
  password: string;
}

export const authApi = {
  register: (credentials: Credentials) =>
    api.post<AuthResult>('/auth/register', credentials),
  login: (credentials: Credentials) =>
    api.post<AuthResult>('/auth/login', credentials),
  me: () => api.get<{ id: number; email: string }>('/auth/me'),
};

export const jobApi = {
  createJob: (data: NewJob) => api.post<Job>('/jobs', data),
  getJobs: () => api.get<Job[]>('/jobs'),
  filterJobs: (filters: JobFilters) =>
    api.get<Job[]>('/jobs/filter', { params: filters }),
  /** Meaning-based search, backed by pgvector similarity on the API side. */
  searchJobs: (params: SemanticSearchParams) =>
    api.get<JobSearchHit[]>('/jobs/search', { params }),
  getJob: (id: number) => api.get<Job>(`/jobs/${id}`),
  updateJob: (id: number, data: Partial<NewJob>) =>
    api.patch<Job>(`/jobs/${id}`, data),
  deleteJob: (id: number) => api.delete(`/jobs/${id}`),
  /** Requires a token; returns only the signed-in user's drafts. */
  getDrafts: () => api.get<Job[]>('/jobs/drafts'),
  getPublished: () => api.get<Job[]>('/jobs/published'),
};

/** Turns an axios failure into something worth showing a user. */
export function errorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const message = (error.response?.data as { message?: string | string[] })
      ?.message;
    if (Array.isArray(message)) {
      return message.join(', ');
    }
    if (typeof message === 'string') {
      return message;
    }
  }
  return fallback;
}
