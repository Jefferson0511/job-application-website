'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  Container, 
  Grid, 
  Box, 
  Text, 
  Button, 
  Group, 
  Loader, 
  Center, 
  Image,
  // Title
} from '@mantine/core';
import JobCard from '../../components/JobCard';
import FilterBar from '../../components/FilterBar';
import CreateJobModal from '../../components/CreateJobModal';

interface Job {
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
  logo?: string;
  experience?: string;
  salary?: string;
}
// Mock data for jobs (you can remove this when API call is working correctly)
const mockJobs = [
  {
    id: 1,
    title: 'Full Stack Developer',
    company: 'Amazon',
    location: 'Onsite',
    jobType: 'Full-time',
    salaryRange: '₹50k - ₹80k',
    description: 'A user-friendly interface lets you browse stunning photos and videos',
    requirements: 'JavaScript, React, Node.js',
    responsibilities: 'Develop and maintain web applications',
    deadline: '2023-12-31',
    isDraft: false,
    logo: '/logos/amazon.png',
    experience: '1-3 yr Exp',
    salary: '12LPA'
  },
  {
    id: 2,
    title: 'Node Js Developer',
    company: 'Tesla',
    location: 'Onsite',
    jobType: 'Full-time',
    salaryRange: '₹60k - ₹90k',
    description: 'A user-friendly interface lets you browse stunning photos and videos',
    requirements: 'Node.js, Express, MongoDB',
    responsibilities: 'Develop and maintain backend services',
    deadline: '2023-12-15',
    isDraft: false,
    logo: '/logos/tesla.png',
    experience: '1-3 yr Exp',
    salary: '12LPA'
  },
  {
    id: 3,
    title: 'UX/UI Designer',
    company: 'Swiggy',
    location: 'Onsite',
    jobType: 'Full-time',
    salaryRange: '₹70k - ₹100k',
    description: 'A user-friendly interface lets you browse stunning photos and videos',
    requirements: 'Figma, Adobe XD, UI/UX principles',
    responsibilities: 'Design user interfaces and experiences',
    deadline: '2023-12-20',
    isDraft: false,
    logo: '/logos/swiggy.png',
    experience: '1-3 yr Exp',
    salary: '12LPA'
  },
  {
    id: 4,
    title: 'Backend Developer',
    company: 'Google',
    location: 'Remote',
    jobType: 'Full-time',
    salaryRange: '₹65k - ₹95k',
    description: 'A user-friendly interface lets you browse stunning photos and videos',
    requirements: 'Java, Spring Boot, SQL',
    responsibilities: 'Develop and maintain backend services',
    deadline: '2023-12-25',
    isDraft: false,
    logo: '/logos/google.png',
    experience: '2-4 yr Exp',
    salary: '15LPA'
  },
  {
    id: 5,
    title: 'Full Stack Developer',
    company: 'Amazon',
    location: 'Onsite',
    jobType: 'Full-time',
    salaryRange: '₹55k - ₹85k',
    description: 'A user-friendly interface lets you browse stunning photos and videos',
    requirements: 'JavaScript, React, Node.js',
    responsibilities: 'Develop and maintain web applications',
    deadline: '2023-12-31',
    isDraft: false,
    logo: '/logos/amazon.png',
    experience: '1-3 yr Exp',
    salary: '12LPA'
  },
  {
    id: 6,
    title: 'Node Js Developer',
    company: 'Tesla',
    location: 'Onsite',
    jobType: 'Full-time',
    salaryRange: '₹60k - ₹90k',
    description: 'A user-friendly interface lets you browse stunning photos and videos',
    requirements: 'Node.js, Express, MongoDB',
    responsibilities: 'Develop and maintain backend services',
    deadline: '2023-12-15',
    isDraft: false,
    logo: '/logos/tesla.png',
    experience: '1-3 yr Exp',
    salary: '12LPA'
  },
  {
    id: 7,
    title: 'UX/UI Designer',
    company: 'Swiggy',
    location: 'Onsite',
    jobType: 'Full-time',
    salaryRange: '₹70k - ₹100k',
    description: 'A user-friendly interface lets you browse stunning photos and videos',
    requirements: 'Figma, Adobe XD, UI/UX principles',
    responsibilities: 'Design user interfaces and experiences',
    deadline: '2023-12-20',
    isDraft: false,
    logo: '/logos/swiggy.png',
    experience: '1-3 yr Exp',
    salary: '12LPA'
  },
  {
    id: 8,
    title: 'Node Js Developer',
    company: 'Tesla',
    location: 'Onsite',
    jobType: 'Full-time',
    salaryRange: '₹60k - ₹90k',
    description: 'A user-friendly interface lets you browse stunning photos and videos',
    requirements: 'Node.js, Express, MongoDB',
    responsibilities: 'Develop and maintain backend services',
    deadline: '2023-12-15',
    isDraft: false,
    logo: '/logos/tesla.png',
    experience: '1-3 yr Exp',
    salary: '12LPA'
  },
  {
    id: 9,
    title: 'Full Stack Developer',
    company: 'Amazon',
    location: 'Onsite',
    jobType: 'Full-time',
    salaryRange: '₹50k - ₹80k',
    description: 'A user-friendly interface lets you browse stunning photos and videos',
    requirements: 'JavaScript, React, Node.js',
    responsibilities: 'Develop and maintain web applications',
    deadline: '2023-12-31',
    isDraft: false,
    logo: '/logos/amazon.png',
    experience: '1-3 yr Exp',
    salary: '12LPA'
  }
  // Add other mock jobs if needed
];

export default function Home() {
  const [jobs, setJobs] = useState<Job[]>(mockJobs); // Initialize with mock data
  const [loading, setLoading] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  
  // Define an interface for the filters
  interface JobFilters {
    title: string;
    location: string | null;
    jobType: string | null;
    minSalary: number;
    maxSalary: number;
  }
  
  const [filters, setFilters] = useState<JobFilters>({
    title: '',
    location: null,
    jobType: null,
    minSalary: 50,
    maxSalary: 80
  });

  // Fetch jobs from the backend
  const isFirstRender = useRef(true);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const url = new URL('https://job-application-website-production-ba78.up.railway.app/api/jobs/filter');
      url.searchParams.append('title', filters.title || '');
      if (filters.location) url.searchParams.append('location', filters.location);
      if (filters.jobType) url.searchParams.append('jobType', filters.jobType);      
      if (filters.minSalary) url.searchParams.append('minSalary', filters.minSalary.toString());
      if (filters.maxSalary) url.searchParams.append('maxSalary', filters.maxSalary.toString());
  
      const res = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
  
      if (!res.ok) {
        const errorText = await res.text();
        console.error('API error:', errorText);
        throw new Error(`HTTP error! status: ${res.status}`);
      }
  
      const data = await res.json();
      console.log('Fetched jobs:', data);
      setJobs([...mockJobs, ...data]); // ✅ append instead of replace
    } catch (err) {
      console.error('Fetch error:', err);
      alert('Failed to fetch jobs. Please try again later.');
      setJobs(mockJobs);
    } finally {
      setLoading(false);
    }
  };
  
  
  
  // Trigger fetchJobs whenever the filters change
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    fetchJobs();
  }, [filters]);  

  // Initial fetch when component mounts
  useEffect(() => {
    fetchJobs();
  }, []);

  const handleFilterChange = (newFilters: Partial<JobFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };
  
  return (
    <Box style={{ backgroundColor: 'white', minHeight: '100vh' }}>
      {/* Header with centered navbar */}
      <Box style={{ 
        backgroundColor: 'white', 
        borderBottom: '1px solid #f1f3f5',
        padding: '15px 0'
      }}>
        <Container size="xl">
          <Group justify="center" align="center" style={{ width: '100%' }}>
            <Group gap="xl" style={{ display: 'flex', flex: 1, justifyContent: 'center' }}>
              <Image 
                src="/logo.png" 
                alt="JobBoard Logo" 
                width={40}
                height={40}
                fallbackSrc="https://placehold.co/40x40?text=JB"
                style={{ marginRight: '20px' }}
              />
              <Text fw={500} style={{ cursor: 'pointer' }}>Home</Text>
              <Text fw={500} style={{ cursor: 'pointer' }}>Find Jobs</Text>
              <Text fw={500} style={{ cursor: 'pointer' }}>Find Talents</Text>
              <Text fw={500} style={{ cursor: 'pointer' }}>About us</Text>
              <Text fw={500} style={{ cursor: 'pointer' }}>Testimonials</Text>
              <Button 
                color="violet" 
                radius="xl"
                style={{ backgroundColor: '#7950f2' }}
                onClick={() => setIsCreateModalOpen(true)}
              >
                Create Jobs
              </Button>
            </Group>
          </Group>
        </Container>
      </Box>

      <CreateJobModal
        opened={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />

      <Container size="xl" py="xs">
        {/* Filter bar */}
        <Box style={{
          width: 1312,
          height: 100,
          top: 95,
          left: 100,
          gap: 16,
          position: 'absolute'
        }}>
          <FilterBar onFilterChange={handleFilterChange} />
        </Box>

        {/* Job listings */}
        {loading ? (
          <Center style={{ height: 200 }}>
            <Loader size="md" />
          </Center>
        ) : (
          <Box style={{
            width: 1312,
            height: 360,
            top: 160,
            left: 100,
            gap: 16,
            position: 'absolute'
          }}>
            <Grid gutter="md">
              {jobs.map((job, index) => (
                <Grid.Col key={`${job.id}-${index}`} span={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
                  <JobCard job={job} />
                </Grid.Col>
              ))}
            </Grid>
          </Box>
        )}
      </Container>
    </Box>
  );
}
