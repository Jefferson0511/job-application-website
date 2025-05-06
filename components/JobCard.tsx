'use client';

import { Group, Text, Badge, Button, Card, Box, Image } from '@mantine/core';
import { IconMapPin, IconCoin } from '@tabler/icons-react';

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
        color="#B0D9FF" 
        style={{ 
          position: 'absolute', 
          top: 16, 
          right: 16,
          width: 75,
          height: 33,
          borderRadius: '10px',
          padding: '7px 10px 7px 10px',
          gap: 10,
          fontSize: '14px',
          fontFamily: 'var(--font-satoshi)',
          fontWeight: 400,
          color: '#000000',
          textTransform: 'none'
        }}
      >
        24h Ago
      </Badge>
      
      <Box style={{padding: '7px 10px 7px 10px',
        flex: 1 }}>
        <Box style={{ 
          width: 83.46, 
          height: 82, 
          overflow: 'hidden', 
          borderRadius: '13.18px', 
          border: '1px solid #e9ecef', 
          background: 'linear-gradient(180deg, #FEFEFD 0%, #F1F1F1 100%)',
          boxShadow: '0px 0px 10.25px 0px rgba(148, 148, 148, 0.25)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 6
        }}>
          <Image
            src={job.logo || 'https://placehold.co/60x60?text=Logo'}
            alt={job.company}
            style={{ 
              width: 65.89,
              height: 65.89,
              objectFit: 'contain',
              borderRadius: '102.5px',
              // position: 'absolute',
              top: '8.05px',
              left: '8.79px'
            }}
          />
        </Box>
        
        <Box mb={0}>
          <Text
            fw={700}
            size="20px"
            lineClamp={1}
            // ta="center"
            lh="100%"
            pl="3px"
            style={{
              letterSpacing: 'normal',
              marginTop: '16px',
              // marginLeft: '16px',
              marginBottom: '12px',
              marginRight: '16px',
              fontFamily: 'var(--font-satoshi)',
              color: '#000000'
            }}
          >
            {job.title}
          </Text>
        </Box>
      </Box>
      
      <Group justify="left" gap="16px" mb={8} wrap="nowrap" pl="12px">
        <Group gap={4} wrap="nowrap">
          <Image
            src="/logos/member.png"
            alt="Briefcase icon"
            style={{
              width: '17.1px',
              height: '13.5px', 
              // border: '1.6px solid #5A5A5A',
              flex: 'none',
              order: 0,
              flexGrow: 0
            }}
          />
          <Text size="sm" fw={500} style={{
            fontFamily: 'var(--font-satoshi)',
            color: '#555555'
          }}>{job.experience || '1-3 yr Exp'}</Text>
        </Group>
        
        <Group gap={4} wrap="nowrap">
        <Image
            src="/logos/site.png"
            alt="Briefcase icon"
            style={{
              width: '17.27px',
              height: '15px', 
              // border: '1.6px solid #5A5A5A',
              flex: 'none',
              order: 0,
              flexGrow: 0
            }}
          />          
          <Text size="sm"style={{
            fontFamily: 'var(--font-satoshi)',
            color: '#555555'
          }}>{job.location || 'Onsite'}</Text>
        </Group>
        
        <Group gap={4} wrap="nowrap">
        <Image
            src="/logos/salary.png"
            alt="Briefcase icon"
            style={{
              width: '16.36px',
              height: '18.18px', 
              // border: '1.6px solid #5A5A5A',
              flex: 'none',
              order: 0,
              flexGrow: 0
            }}
          />
          <Text size="sm"style={{
            fontFamily: 'var(--font-satoshi)',
            color: '#555555'
          }}>{job.salary || '12LPA'}</Text>
        </Group>
      </Group>

      <Box p="xs" style={{ flex: 1 }}>
        <Text size="sm" lh={1.4} mb={8} pl="6px" pr="12px" style={{
          fontFamily: 'var(--font-satoshi)',
          color: '#555555'
        }}>
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
