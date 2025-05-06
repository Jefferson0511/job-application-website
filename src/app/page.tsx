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

export default function Home() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

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
    maxSalary: 80,
  });

  const isFirstRender = useRef(true);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      console.log('Filter values before sending:', {
        title: filters.title,
        location: filters.location,
        jobType: filters.jobType,
        minSalary: filters.minSalary,
        maxSalary: filters.maxSalary
      });

      // Use local URL if in development, otherwise use production URL
      const apiUrl = process.env.NODE_ENV === 'development' 
        ? 'http://localhost:3002'
        : 'https://job-application-website-production-ba78.up.railway.app';
      
      // Use the filter endpoint with existing parameters      
      const url = new URL(`${apiUrl}/api/jobs/filter`);
      url.searchParams.append('title', filters.title || '');
      if (filters.location) url.searchParams.append('location', filters.location.toLowerCase());
      if (filters.jobType) url.searchParams.append('jobType', filters.jobType.toLowerCase());
      if (filters.minSalary && filters.maxSalary) {
        const salaryRange = `${filters.minSalary}-${filters.maxSalary}`;
        url.searchParams.append('salaryRange', salaryRange);
      }

      console.log('URL with filters:', url.toString());
      console.log('Query parameters:', url.searchParams.toString());

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
      setJobs(data);
    } catch (err) {
      console.error('Fetch error:', err);
      alert('Failed to fetch jobs. Please try again later.');
      setJobs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    fetchJobs();
  }, [filters]);

  useEffect(() => {
    fetchJobs();
  }, []);

  const handleFilterChange = (newFilters: Partial<JobFilters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  };

  return (
    <Box style={{ backgroundColor: 'white', minHeight: '100vh' }}>
      {/* Header */}
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
            minHeight: 360,
            top: 160,
            left: 100,
            gap: 16,
            position: 'absolute'
          }}>
            <Grid gutter="md">
              {jobs.length > 0 ? (
                jobs.map((job, index) => (
                  <Grid.Col key={`${job.id}-${index}`} span={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
                    <JobCard job={job} />
                  </Grid.Col>
                ))
              ) : (
                <Center style={{ paddingTop: 100 }}>
                  <Text>No jobs found for the selected filters.</Text>
                </Center>
              )}
            </Grid>
          </Box>
        )}
      </Container>
    </Box>
  );
}
