'use client';

import { useState } from 'react';
import { Group, TextInput, Select, RangeSlider, Box, Text } from '@mantine/core';
import { IconSearch, IconMapPin, IconBriefcase } from '@tabler/icons-react';

interface FilterValues {
  title: string;
  location: string;
  jobType: string;
  minSalary: number;
  maxSalary: number;
}

interface FilterBarProps {
  onFilterChange: (filters: FilterValues) => void;
}


export default function FilterBar({ onFilterChange }: FilterBarProps) {
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [jobType, setJobType] = useState('');
  const [salaryRange, setSalaryRange] = useState<[number, number]>([50, 150]);

  const handleTitleChange = (value: string) => {
    setTitle(value);
    applyFilters({ title: value });
  };

  const handleLocationChange = (value: string | null) => {
    console.log('Location changed to:', value);
    setLocation(value || '');
    applyFilters({ location: value || '' });
  };

  const handleJobTypeChange = (value: string | null) => {
    console.log('Job type changed to:', value);
    setJobType(value || '');
    applyFilters({ jobType: value || '' });
  };

  const handleSalaryChange = (values: [number, number]) => {
    setSalaryRange(values);
    applyFilters({ minSalary: values[0], maxSalary: values[1] });
  };
  interface JobFilters {
    title?: string;
    location?: string;
    jobType?: string;
    minSalary?: number;
    maxSalary?: number;
  }
  
  const applyFilters = (newFilters: JobFilters) => {
    console.log('Applying filters:', {
      title,
      location,
      jobType,
      minSalary: salaryRange[0],
      maxSalary: salaryRange[1],
      ...newFilters
    });
    
    const filters = {
      title,
      location: location || '',
      jobType: jobType || '',
      minSalary: salaryRange[0],
      maxSalary: salaryRange[1],
      ...newFilters
    };
    
    onFilterChange(filters);
  };

  return (
    <Group align="flex-end" gap="md" mb={30}>
      <TextInput
        placeholder="Search by job title or company"
        leftSection={<IconSearch size={16} />}
        value={title}
        onChange={(e) => handleTitleChange(e.target.value)}
        style={{ flex: 1 }}
        size="sm"
      />
      
      <Select
        leftSection={<IconMapPin size={16} />}
        placeholder="Location"
        data={[
          { value: 'onsite', label: 'Onsite' },
          { value: 'remote', label: 'Remote' },
          { value: 'hybrid', label: 'Hybrid' },
        ]}
        value={location}
        onChange={(value, option) => handleLocationChange(value)}
        style={{ flex: 1 }}
        size="sm"
      />

      <Select
        leftSection={<IconBriefcase size={16} />}
        placeholder="Job Type"
        data={[
          { value: 'full-time', label: 'Full-time' },
          { value: 'part-time', label: 'Part-time' },
          { value: 'contract', label: 'Contract' },
          { value: 'internship', label: 'Internship' },
        ]}
        value={jobType}
        onChange={(value, option) => handleJobTypeChange(value)}
        style={{ flex: 1 }}
        size="sm"
      />

      <Box style={{ flex: 1 }}>
        <Group justify="apart" mb={4} style={{ padding: '3px 18px' }}>
          <Text size="sm" c="dimmed">Salary per month</Text>
          <Text size="sm" c="dimmed">₹{salaryRange[0]}k - ₹{salaryRange[1]}k</Text>
        </Group>
        <RangeSlider
          value={salaryRange}
          onChange={handleSalaryChange}
          min={50}
          max={150}
          size="xs"
          styles={{
            root: { padding: '3px 30px' },
            track: { backgroundColor: '#e5e7eb', height: 4 },
            bar: { backgroundColor: '#374151', height: 4 },
            thumb: { 
              borderWidth: 2, 
              height: 10, 
              width: 10, 
              backgroundColor: '#374151',
              borderColor: '#374151',
            },
          }}
        />
      </Box>
    </Group>
  );
}
