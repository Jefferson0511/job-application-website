// src/lib/types.ts
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
    logo?: string; // Make this optional to match both interfaces
    experience?: string; // Keep this optional
    
    salary?: string; // Keep this optional
  }