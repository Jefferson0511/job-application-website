'use client';

import { Group, Text, Badge, Button, Card, Box, Image } from '@mantine/core';
import { IconBriefcase, IconMapPin, IconCoin } from '@tabler/icons-react';

// Define the Job interface locally to avoid import issues
interface Job {
  id: number;
  title: string;
  company: string;
  location: string;
  jobType: string;
  salaryRange: string;
  description: string;
  requirements?: string;
  responsibilities?: string;
  deadline: string;
  isDraft?: boolean;
  logo?: string;
  experience?: string;
  salary?: string;
}

interface JobCardProps {
  job: Job;
  // onEdit?: (jobId: number) => void;
  // onDelete?: (jobId: number) => void;
}

export default function JobCard({ job}: JobCardProps) {
  const handleApply = () => {
    console.log('Apply for job:', job.id);
    // Implementation for apply functionality
  };

  return (
    <Card 
      shadow="sm" 
      padding="xs" 
      radius="md" 
      withBorder 
      style={{ 
        width: 316,
        height: 360,
        borderRadius: '12px',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'visible',
        position: 'relative'
      }}
    >
      <Badge 
        color="blue" 
        variant="light" 
        size="sm" 
        style={{ 
          position: 'absolute', 
          top: 16, 
          right: 16,
          width: 75,
          height: 33,
          borderRadius: '10px',
          padding: '7px 10px 7px 10px',
          gap: 10,
          fontWeight: 400,
          backgroundColor: '#B0D9FF',
          color: '#000000'
        }}
      >
        24h Ago
      </Badge>
      
      <Box p="xs" style={{ flex: 1 }}>
        <Box style={{ 
          width: 60, 
          height: 60, 
          overflow: 'hidden', 
          borderRadius: '8px', 
          border: '1px solid #e9ecef', 
          backgroundColor: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 6
        }}>
          <Image
            src={job.logo || 'https://placehold.co/60x60?text=Logo'}
            alt={job.company}
            width={50}
            height={50}
            style={{ objectFit: 'contain' }}
          />
        </Box>
        
        <Box mb={6}>
          <Text fw={700} size="md" lineClamp={1} ta="left">
            {job.title}
          </Text>
        </Box>
      </Box>
      
      <Group justify="center" gap="sm" mb={8} wrap="nowrap">
        <Group gap={4} wrap="nowrap">
          <IconBriefcase size={16} stroke={1.5} color="#868e96" />
          <Text size="sm" c="dimmed">{job.experience || '1-3 yr Exp'}</Text>
        </Group>
        
        <Group gap={4} wrap="nowrap">
          <IconMapPin size={16} stroke={1.5} color="#868e96" />
          <Text size="sm" c="dimmed">{job.location || 'Onsite'}</Text>
        </Group>
        
        <Group gap={4} wrap="nowrap">
          <IconCoin size={16} stroke={1.5} color="#868e96" />
          <Text size="sm" c="dimmed">{job.salary || '12LPA'}</Text>
        </Group>
      </Group>

      <Box p="xs" style={{ flex: 1 }}>
        <Text size="sm" c="dimmed" lh={1.4} mb={8}>
          • A user-friendly interface lets you browse stunning photos and videos
          <br />
          • Filter destinations based on interests and travel style, and create personalized
        </Text>
      </Box>

      <Button
        fullWidth
        color="#00AAFF"
        radius="xl"
        style={{ margin: '0 0 8px 0', backgroundColor: '#00AAFF' }}
        onClick={handleApply}
      >
        Apply Now
      </Button>
    </Card>
  );
}
