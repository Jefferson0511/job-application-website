'use client';
import { useState } from 'react';
import { DateInput } from '@mantine/dates';
import {
  Alert,
  Modal,
  TextInput,
  Select,
  Textarea,
  Button,
  Group,
  Grid,
  NumberInput,
  Stack,
  Text,
} from '@mantine/core';
import { IconChevronDown, IconChevronRight } from '@tabler/icons-react';
import { errorMessage, jobApi } from '../src/lib/api';
import type { Job } from '../src/lib/types';

interface CreateJobModalProps {
  opened: boolean;
  onClose: () => void;
  onJobCreated?: (job: Job) => void;
}

export default function CreateJobModal({ opened, onClose, onJobCreated }: CreateJobModalProps) {
  const [jobData, setJobData] = useState({
    title: '',
    companyName: '',
    location: '',
    jobType: '',
    salaryFrom: '',
    salaryTo: '',
    deadline: '',
    description: '',
    requirements: '',
    responsibilities: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (field: string, value: string | number | null) => {
    setJobData(prev => ({ ...prev, [field]: value }));
  };

  const submit = async (isDraft: boolean) => {
    if (!jobData.title || !jobData.companyName || !jobData.location || !jobData.jobType) {
      setError('Please fill in all required fields');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      // Goes through jobApi so the request picks up the bearer token from the
      // shared axios interceptor.
      const { data } = await jobApi.createJob({
        title: jobData.title,
        company: jobData.companyName,
        location: jobData.location,
        jobType: jobData.jobType,
        salaryRange: `${jobData.salaryFrom}-${jobData.salaryTo}`,
        deadline: jobData.deadline,
        description: jobData.description,
        requirements: jobData.requirements,
        responsibilities: jobData.responsibilities,
        isDraft,
      });

      onJobCreated?.(data);
      onClose();
    } catch (err) {
      setError(errorMessage(err, 'Failed to create the job posting.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      size="lg"
      radius="md"
      centered
      padding="lg"
      withCloseButton={false}
    >
      <Stack>
        <Text fw={600} size="lg" ta="center">Create Job Opening</Text>

        {error && (
          <Alert color="red" radius="md">
            {error}
          </Alert>
        )}

        <Grid>
          <Grid.Col span={6}>
            <TextInput
              label="Job Title"
              placeholder="Full Stack Developer"
              value={jobData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              radius="md"
              withAsterisk
            />
          </Grid.Col>

          <Grid.Col span={6}>
            <TextInput
              label="Company Name"
              placeholder="Amazon"
              value={jobData.companyName}
              onChange={(e) => handleChange('companyName', e.target.value)}
              radius="md"
              withAsterisk
            />
          </Grid.Col>

          <Grid.Col span={6}>
            <Select
              label="Location"
              placeholder="Remote"
              // These must match the values the API's filter and search
              // endpoints accept, or a posting cannot be filtered by location.
              data={[
                { value: 'remote', label: 'Remote' },
                { value: 'onsite', label: 'Onsite' },
                { value: 'hybrid', label: 'Hybrid' },
              ]}
              value={jobData.location}
              onChange={(val) => handleChange('location', val)}
              radius="md"
              withAsterisk
            />
          </Grid.Col>

          <Grid.Col span={6}>
            <Select
              label="Job Type"
              placeholder="FullTime"
              data={[
                { value: 'internship', label: 'Internship' },
                { value: 'full-time', label: 'FullTime' },
                { value: 'part-time', label: 'PartTime' },
                { value: 'contract', label: 'Contract' },
              ]}
              value={jobData.jobType}
              onChange={(val) => handleChange('jobType', val)}
              radius="md"
              withAsterisk
            />
          </Grid.Col>

          <Grid.Col span={6}>
            <Text fw={500} size="sm" mb={4}>Salary Range</Text>
            <Group grow>
              <NumberInput
                placeholder="₹0"
                value={jobData.salaryFrom}
                onChange={(val) => handleChange('salaryFrom', val)}
                radius="md"
              />
              <NumberInput
                placeholder="₹12,00,000"
                value={jobData.salaryTo}
                onChange={(val) => handleChange('salaryTo', val)}
                radius="md"
              />
            </Group>
          </Grid.Col>

          <Grid.Col span={6}>
            <DateInput
              label="Application Deadline"
              placeholder="Pick a date"
              value={jobData.deadline ? new Date(jobData.deadline) : undefined}
              onChange={(val) => handleChange('deadline', val?.toISOString() || '')}
              radius="md"
              size="md"
              clearable
              styles={{
                input: {
                  padding: '10px 14px',
                  fontSize: '14px',
                  borderColor: '#e5e7eb',
                  transition: 'border-color 0.2s ease'
                },
                wrapper: {
                  padding: '0px 0',
                  background: 'transparent'
                },
                day: {
                  padding: '8px',
                  fontSize: '14px',
                  borderRadius: '8px',
                  transition: 'background-color 0.2s ease, color 0.2s ease'
                },
                month: {
                  fontSize: '16px',
                  fontWeight: 500,
                  padding: '12px 0'
                },
                weekday: {
                  fontSize: '12px',
                  fontWeight: 600,
                  color: '#6b7280',
                  padding: '8px 0'
                },
                calendarHeader: {
                  marginBottom: '10px',
                  padding: '0 8px'
                }
              }}
              classNames={{
                day: 'date-input-day'
              }}
              getDayProps={(date) => {
                const isToday = new Date().toDateString() === date.toDateString();
                return {
                  style: {
                    backgroundColor: isToday ? '#eff6ff' : undefined,
                    color: (date.getDay() === 0 || date.getDay() === 6) ? '#dc2626' : 
                           isToday ? '#3b82f6' : undefined,
                    fontWeight: isToday ? 500 : undefined
                  }
                };
              }}
              popoverProps={{
                shadow: "xl",
                radius: "md",
                transitionProps: { transition: "scale-y" },
                styles: {
                  dropdown: {
                    border: '1px solid #e5e7eb',
                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                    borderRadius: '12px',
                    padding: '16px',
                    backgroundColor: '#ffffff'
                  }
                }
              }}
              rightSection={<div style={{ width: 32, pointerEvents: 'none' }} />}
              leftSection={<div style={{ width: 32, pointerEvents: 'none' }} />}
              nextIcon={<IconChevronRight size={16} />}
              previousIcon={<IconChevronDown size={16} rotate={180} />}
            />
          </Grid.Col>

          <Grid.Col span={12}>
            <Textarea
              label="Job Description"
              placeholder="Please share a description to let the candidate know more about the job role"
              minRows={4}
              value={jobData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              required
            />
          </Grid.Col>

          <Grid.Col span={12}>
            <Textarea
              label="Requirements"
              placeholder="Please share the requirements for the job role"
              minRows={4}
              value={jobData.requirements}
              onChange={(e) => handleChange('requirements', e.target.value)}
            />
          </Grid.Col>

          <Grid.Col span={12}>
            <Textarea
              label="Responsibilities"
              placeholder="Please share the responsibilities for the job role"
              minRows={4}
              value={jobData.responsibilities}
              onChange={(e) => handleChange('responsibilities', e.target.value)}
            />
          </Grid.Col>
        </Grid>

        <Group justify="space-between" mt="md">
          <Button
            variant="outline"
            leftSection={<IconChevronDown size={16} />}
            color="dark"
            onClick={() => void submit(true)}
            disabled={submitting}
          >
            Save Draft
          </Button>

          <Button
            rightSection={<IconChevronRight size={18} />}
            color="blue"
            onClick={() => void submit(false)}
            loading={submitting}
          >
            Publish
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}