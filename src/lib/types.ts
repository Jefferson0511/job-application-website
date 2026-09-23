// src/lib/types.ts
// The single definition of a job posting on the frontend. Anything that needs
// this shape imports it from here rather than redeclaring it.

export interface Job {
  id: number;
  title: string;
  company: string;
  location: string;
  jobType: string;
  salaryRange: string;
  description: string;
  requirements: string;
  responsibilities: string;
  deadline: string;
  isDraft: boolean;
  /** Null for postings created before the API required authentication. */
  ownerId: number | null;
  logo?: string;
  experience?: string;
}

/** The fields a client supplies when creating a posting; the API assigns the rest. */
export type NewJob = Omit<Job, 'id' | 'ownerId'>;

export interface AuthenticatedUser {
  id: number;
  email: string;
}

export interface AuthResult {
  accessToken: string;
  user: AuthenticatedUser;
}
