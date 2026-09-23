'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
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
import AuthModal from '../../components/AuthModal';
import { jobApi } from '../lib/api';
import { useAuth } from '../lib/use-auth';
import type { Job } from '../lib/types';

export default function Home() {
  const { user, signOut } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [sortedJobs, setSortedJobs] = useState<Job[]>([]);
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
  // Debounced searches can still overlap; only the newest one may write state,
  // otherwise a slow earlier request can overwrite newer results.
  const latestRequest = useRef(0);

  const fetchJobs = useCallback(async () => {
    const requestId = ++latestRequest.current;
    const isStale = () => requestId !== latestRequest.current;

    setLoading(true);
    try {
      const query = filters.title.trim();

      if (query) {
        // With free text present, rank by meaning instead of substring match,
        // so "someone to look after our servers" surfaces the DevOps posting.
        // The dropdowns still narrow the candidate set server-side, and the
        // API already returns hits in descending relevance order.
        const { data } = await jobApi.searchJobs({
          q: query,
          location: filters.location?.toLowerCase(),
          jobType: filters.jobType?.toLowerCase(),
          limit: 24,
        });
        if (!isStale()) {
          setSortedJobs(data.map((hit) => hit.job));
        }
        return;
      }

      // No query: fall back to the structured filter endpoint and show
      // everything matching, in a stable order.
      const { data } = await jobApi.filterJobs({
        location: filters.location?.toLowerCase(),
        jobType: filters.jobType?.toLowerCase(),
        minSalary: filters.minSalary,
        maxSalary: filters.maxSalary,
      });
      if (!isStale()) {
        setSortedJobs([...data].sort((a, b) => a.id - b.id));
      }
    } catch (err) {
      console.error('Fetch error:', err);
      if (!isStale()) {
        setSortedJobs([]);
      }
    } finally {
      if (!isStale()) {
        setLoading(false);
      }
    }
  }, [filters]);

  // Every keystroke in the search box would otherwise trigger an embedding
  // call, so wait for a pause in typing. The first render fires immediately
  // to fill the page.
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      fetchJobs();
      return;
    }

    const timer = setTimeout(fetchJobs, 350);
    return () => clearTimeout(timer);
  }, [fetchJobs]);

  const handleFilterChange = (newFilters: Partial<JobFilters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  };

  return (
    <Box style={{ backgroundColor: 'white', minHeight: '100vh' }}>
      {/* Header */}
      <Box style={{
        backgroundColor: 'white',
        padding: '15px 0'
      }}>
        <Container size="xl">
          <Box style={{
            backgroundColor: 'white',
            borderRadius: '80px',
            boxShadow: '0px 0px 20px 0px #7F7F7F26',
            padding: '10px 20px',
            maxWidth: '800px',
            margin: '0 auto'
          }}>
            <Group justify="center" align="center" style={{ width: '100%' }}>
              <Group gap="xl" style={{ alignItems: 'center' }}>
                <Image
                  src="/logo.png"
                  alt="JobBoard Logo"
                  width={40}
                  height={40}
                  fallbackSrc="https://placehold.co/40x40?text=JB"
                />
                <Text fw={600} lh="100%" lts={0} style={{ cursor: 'pointer', fontSize: '16px', fontFamily: 'var(--font-satoshi)' }}>Home</Text>
                <Text fw={600} lh="100%" lts={0} style={{ cursor: 'pointer', fontSize: '16px', fontFamily: 'var(--font-satoshi)' }}>Find Jobs</Text>
                <Text fw={600} lh="100%" lts={0} style={{ cursor: 'pointer', fontSize: '16px', fontFamily: 'var(--font-satoshi)' }}>Find Talents</Text>
                <Text fw={600} lh="100%" lts={0} style={{ cursor: 'pointer', fontSize: '16px', fontFamily: 'var(--font-satoshi)' }}>About us</Text>
                <Text fw={600} lh="100%" lts={0} style={{ cursor: 'pointer', fontSize: '16px', fontFamily: 'var(--font-satoshi)' }}>Testimonials</Text>
                {/* Posting a job needs an account, so signing in is the
                    prompt when there is no session yet. */}
                <Button
                  radius="xl"
                  style={{
                    background: 'linear-gradient(180deg, #A128FF 0%, #6100AD 113.79%)',
                    padding: '8px 16px',
                    fontSize: '16px',
                    fontWeight: 600,
                    fontFamily: 'var(--font-satoshi)',
                    color: 'white'
                  }}
                  onClick={() =>
                    user ? setIsCreateModalOpen(true) : setIsAuthModalOpen(true)
                  }
                >
                  Create Jobs
                </Button>

                {user ? (
                  <Group gap="xs">
                    <Text size="sm" c="dimmed">{user.email}</Text>
                    <Button variant="subtle" size="xs" radius="xl" onClick={signOut}>
                      Sign out
                    </Button>
                  </Group>
                ) : (
                  <Button
                    variant="subtle"
                    size="xs"
                    radius="xl"
                    onClick={() => setIsAuthModalOpen(true)}
                  >
                    Sign in
                  </Button>
                )}
              </Group>
            </Group>
          </Box>
        </Container>
      </Box>

      <AuthModal
        opened={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />

      <CreateJobModal
        opened={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onJobCreated={() => void fetchJobs()}
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
              {sortedJobs.length > 0 ? (
                sortedJobs.map((job, index) => (
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
