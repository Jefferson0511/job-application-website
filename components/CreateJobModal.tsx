'use client';
// import { ChangeEvent } from 'react';
import { useState } from 'react';
import { 
  Modal, 
  TextInput, 
  Select, 
  Textarea, 
  Button, 
  Group, 
  Stack, 
  Text, 
  Box,
  Grid,
  // ActionIcon,
  NumberInput
} from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { IconCalendar, IconChevronDown } from '@tabler/icons-react';

interface Job {
  title: string;
  company: string;
  location: string;
  jobType: string;
  salaryRange: string;
  deadline?: string;
  description: string;
  requirements: string;
  responsibilities: string;
  isDraft: boolean;
}

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
    deadline: null as Date | null,
    description: '',
    requirements: '',
    responsibilities: ''
  });

  const handleChange = (field: string, value: string | number | Date | null) => {
    setJobData(prev => ({ ...prev, [field]: value }));
  };

  const handlePublish = async () => {
    try {
      // Validate required fields
      if (
        !jobData.title ||
        !jobData.companyName ||
        !jobData.location ||
        !jobData.jobType ||
        !jobData.requirements ||
        !jobData.responsibilities
      ) {
        alert('Please fill in all required fields');
        return;
      }
  
      const formattedJob = {
        title: jobData.title,
        company: jobData.companyName,
        location: jobData.location,
        jobType: jobData.jobType,
        salaryRange:
          jobData.salaryFrom && jobData.salaryTo
            ? `${jobData.salaryFrom}-${jobData.salaryTo}`
            : '',
        deadline: jobData.deadline?.toISOString().split('T')[0],
        description: jobData.description,
        requirements: jobData.requirements,
        responsibilities: jobData.responsibilities,
        isDraft: false
      };
  
      // 🔥 POST the job to the backend API
      const response = await fetch('http://localhost:3002/api/jobs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formattedJob)
      });
  
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || 'Failed to create job');
      }
  
      const createdJob = await response.json();
  
      if (onJobCreated) {
        onJobCreated(createdJob); // use backend response
      }
  
      alert('Job has been successfully published!');
      onClose();
    } catch (error) {
      console.error('Error creating job:', error);
      alert('Failed to create job. Please check the console for details.');
    }
  };
  
  const handleSaveDraft = () => {
    console.log('Saving draft:', jobData);
    // Implement save draft logic
  };

  return (
    <Modal 
      opened={opened} 
      onClose={onClose} 
      size="lg"
      centered
      padding="xl"
      radius="md"
      withCloseButton={false}
      styles={{
        title: {
          fontSize: '1.25rem',
          fontWeight: 600,
          marginBottom: '1.5rem'
        },
        content: {
          backgroundColor: '#ffffff'
        }
      }}
    >
      <Stack gap="md">
        <Box style={{ textAlign: 'center' }}>
          <Text fw={600} size="lg">Create Job Opening</Text>
        </Box>

        <Grid gutter="md">
          <Grid.Col span={6}>
            <Text size="sm" fw={500} mb={5}>Job Title</Text>
            <TextInput
              placeholder="Full Stack Developer"
              value={jobData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              size="sm"
              radius="md"
            />
          </Grid.Col>

          <Grid.Col span={6}>
            <Text size="sm" fw={500} mb={5}>Company Name</Text>
            <TextInput
              placeholder="Amazon, Microsoft, Swiggy"
              value={jobData.companyName}
              onChange={(e) => handleChange('companyName', e.target.value)}
              size="sm"
              radius="md"
            />
          </Grid.Col>

          <Grid.Col span={4}>
            <Text size="sm" fw={500} mb={5}>Location</Text>
            <Select
              placeholder="Choose Preferred Location"
              data={[
                { value: 'onsite', label: 'Onsite' },
                { value: 'remote', label: 'Remote' },
                { value: 'hybrid', label: 'Hybrid' }
              ]}
              value={jobData.location}
              onChange={(value) => handleChange('location', value)}
              size="sm"
              radius="md"
            />
          </Grid.Col>

          <Grid.Col span={4}>
            <Text size="sm" fw={500} mb={5}>Job Type</Text>
            <Select
              placeholder="Choose Job Type"
              data={[
                { value: 'full-time', label: 'Full-time' },
                { value: 'part-time', label: 'Part-time' },
                { value: 'contract', label: 'Contract' },
                { value: 'internship', label: 'Internship' }
              ]}
              value={jobData.jobType}
              onChange={(value) => handleChange('jobType', value)}
              size="sm"
              radius="md"
            />
          </Grid.Col>

          <Grid.Col span={4}>
            <Text size="sm" fw={500} mb={5}>Salary Range</Text>
            <Group>
              <NumberInput
                placeholder="From"
                value={jobData.salaryFrom}
                onChange={(value) => handleChange('salaryFrom', value)}
                size="sm"
                radius="md"
              />
              <NumberInput
                placeholder="To"
                value={jobData.salaryTo}
                onChange={(value) => handleChange('salaryTo', value)}
                size="sm"
                radius="md"
              />
            </Group>
          </Grid.Col>

          <Grid.Col span={12}>
            <Text size="sm" fw={500} mb={5}>Job Description</Text>
            <Textarea
              placeholder="Please share a description to let the candidate know more about the job role"
              minRows={5}
              value={jobData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              size="sm"
              radius="md"
            />
          </Grid.Col>

          <Grid.Col span={12}>
            <Text size="sm" fw={500} mb={5}>Job Requirements</Text>
            <Textarea
              placeholder="Please list the requirements for this position"
              minRows={5}
              value={jobData.requirements}
              onChange={(e) => handleChange('requirements', e.target.value)}
              size="sm"
              radius="md"
            />
          </Grid.Col>

          <Grid.Col span={12}>
            <Text size="sm" fw={500} mb={5}>Job Responsibilities</Text>
            <Textarea
              placeholder="Please list the responsibilities for this position"
              minRows={5}
              value={jobData.responsibilities}
              onChange={(e) => handleChange('responsibilities', e.target.value)}
              size="sm"
              radius="md"
            />
          </Grid.Col>

          <Grid.Col span={12}>
            <Text size="sm" fw={500} mb={5}>Application Deadline</Text>
            <DateInput
              value={jobData.deadline}
              onChange={(value) => handleChange('deadline', value)}
              size="sm"
              styles={{
                input: {
                  borderRadius: '8px',
                  padding: '8px 12px',
                  fontSize: '0.875rem'
                }
              }}
              leftSection={<IconCalendar size={16} />}
              placeholder="Pick a date"
            />
          </Grid.Col>
        </Grid>

        <Group justify="space-between" mt="xl">
          <Button 
            variant="outline" 
            color="gray" 
            onClick={handleSaveDraft}
            disabled
          >
            Save Draft
          </Button>
          <Button 
            color="cyan" 
            onClick={handlePublish}
            leftSection={<IconChevronDown size={16} />}
          >
            Publish
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}