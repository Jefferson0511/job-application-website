
// 'use client';

// import { useState, useEffect } from 'react';
// import { 
//   Container, 
//   Grid, 
//   Box, 
//   Text, 
//   Button, 
//   Group, 
//   Loader, 
//   Center, 
//   Image,
//   Title
// } from '@mantine/core';
// import JobCard from '../../components/JobCard';
// import FilterBar from '../../components/FilterBar';
// import CreateJobModal from '../../components/CreateJobModal';

// // Mock data for jobs
// const mockJobs = [
//   {
//     id: 1,
//     title: 'Full Stack Developer',
//     company: 'Amazon',
//     location: 'Onsite',
//     jobType: 'Full-time',
//     salaryRange: '₹50k - ₹80k',
//     description: 'A user-friendly interface lets you browse stunning photos and videos',
//     requirements: 'JavaScript, React, Node.js',
//     responsibilities: 'Develop and maintain web applications',
//     deadline: '2023-12-31',
//     isDraft: false,
//     logo: '/logos/amazon.png',
//     experience: '1-3 yr Exp',
//     salary: '12LPA'
//   },
//   {
//     id: 2,
//     title: 'Node Js Developer',
//     company: 'Tesla',
//     location: 'Onsite',
//     jobType: 'Full-time',
//     salaryRange: '₹60k - ₹90k',
//     description: 'A user-friendly interface lets you browse stunning photos and videos',
//     requirements: 'Node.js, Express, MongoDB',
//     responsibilities: 'Develop and maintain backend services',
//     deadline: '2023-12-15',
//     isDraft: false,
//     logo: '/logos/tesla.png',
//     experience: '1-3 yr Exp',
//     salary: '12LPA'
//   },
//   {
//     id: 3,
//     title: 'UX/UI Designer',
//     company: 'Swiggy',
//     location: 'Onsite',
//     jobType: 'Full-time',
//     salaryRange: '₹70k - ₹100k',
//     description: 'A user-friendly interface lets you browse stunning photos and videos',
//     requirements: 'Figma, Adobe XD, UI/UX principles',
//     responsibilities: 'Design user interfaces and experiences',
//     deadline: '2023-12-20',
//     isDraft: false,
//     logo: '/logos/swiggy.png',
//     experience: '1-3 yr Exp',
//     salary: '12LPA'
//   },
//   {
//     id: 4,
//     title: 'Full Stack Developer',
//     company: 'Amazon',
//     location: 'Onsite',
//     jobType: 'Full-time',
//     salaryRange: '₹55k - ₹85k',
//     description: 'A user-friendly interface lets you browse stunning photos and videos',
//     requirements: 'JavaScript, React, Node.js',
//     responsibilities: 'Develop and maintain web applications',
//     deadline: '2023-12-25',
//     isDraft: false,
//     logo: '/logos/amazon.png',
//     experience: '1-3 yr Exp',
//     salary: '12LPA'
//   },
//   {
//     id: 5,
//     title: 'Node Js Developer',
//     company: 'Tesla',
//     location: 'Onsite',
//     jobType: 'Full-time',
//     salaryRange: '₹60k - ₹90k',
//     description: 'A user-friendly interface lets you browse stunning photos and videos',
//     requirements: 'Node.js, Express, MongoDB',
//     responsibilities: 'Develop and maintain backend services',
//     deadline: '2023-12-15',
//     isDraft: false,
//     logo: '/logos/tesla.png',
//     experience: '1-3 yr Exp',
//     salary: '12LPA'
//   },
//   {
//     id: 6,
//     title: 'UX/UI Designer',
//     company: 'Swiggy',
//     location: 'Onsite',
//     jobType: 'Full-time',
//     salaryRange: '₹70k - ₹100k',
//     description: 'A user-friendly interface lets you browse stunning photos and videos',
//     requirements: 'Figma, Adobe XD, UI/UX principles',
//     responsibilities: 'Design user interfaces and experiences',
//     deadline: '2023-12-20',
//     isDraft: false,
//     logo: '/logos/swiggy.png',
//     experience: '1-3 yr Exp',
//     salary: '12LPA'
//   },
//   {
//     id: 7,
//     title: 'Node Js Developer',
//     company: 'Tesla',
//     location: 'Onsite',
//     jobType: 'Full-time',
//     salaryRange: '₹60k - ₹90k',
//     description: 'A user-friendly interface lets you browse stunning photos and videos',
//     requirements: 'Node.js, Express, MongoDB',
//     responsibilities: 'Develop and maintain backend services',
//     deadline: '2023-12-15',
//     isDraft: false,
//     logo: '/logos/tesla.png',
//     experience: '1-3 yr Exp',
//     salary: '12LPA'
//   },
//   {
//     id: 8,
//     title: 'Full Stack Developer',
//     company: 'Amazon',
//     location: 'Onsite',
//     jobType: 'Full-time',
//     salaryRange: '₹50k - ₹80k',
//     description: 'A user-friendly interface lets you browse stunning photos and videos',
//     requirements: 'JavaScript, React, Node.js',
//     responsibilities: 'Develop and maintain web applications',
//     deadline: '2023-12-31',
//     isDraft: false,
//     logo: '/logos/amazon.png',
//     experience: '1-3 yr Exp',
//     salary: '12LPA'
//   }
// ];

// export default function Home() {
//   const [jobs, setJobs] = useState(mockJobs);
//   const [loading, setLoading] = useState(false);
//   const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  
//   // Define an interface for the filters
//   interface JobFilters {
//     title: string;
//     location: string | null;
//     jobType: string | null;
//     minSalary: number;
//     maxSalary: number;
//   }
  
//   const [filters, setFilters] = useState<JobFilters>({
//     title: '',
//     location: null,
//     jobType: null,
//     minSalary: 50,
//     maxSalary: 80
//   });

//   // Fetch jobs from the backend (commented out for now, using mock data)
//   const fetchJobs = async () => {
//     try {
//       setLoading(true);
//       console.log('Fetching jobs with filters:', filters);
      
//       // Uncomment this when ready to fetch from backend
//       // const response = await fetch('/api/jobs', {
//       //   method: 'POST',
//       //   headers: {
//       //     'Content-Type': 'application/json',
//       //   },
//       //   body: JSON.stringify(filters),
//       // });
//       // const data = await response.json();
//       // setJobs(data);

//       // For now, filter the mock data client-side
//       const filteredJobs = mockJobs.filter(job => {
//         // Title match - handle empty strings and case insensitivity
//         const searchTerm = (filters.title || '').toLowerCase();
//         const titleMatch = searchTerm === '' || 
//                           job.title.toLowerCase().includes(searchTerm) || 
//                           job.company.toLowerCase().includes(searchTerm);
        
//         // Location match - handle null values properly
//         const locationMatch = !filters.location || 
//                               (job.location?.toLowerCase() ?? '') === (filters.location?.toLowerCase() ?? '');
        
//         // Job type match - handle null values properly
//         const jobTypeMatch = !filters.jobType || 
//                              (job.jobType?.toLowerCase() ?? '') === (filters.jobType?.toLowerCase() ?? '');
        
//         // Extract numeric value from salary string for comparison
//         let salary = 0;
//         try {
//           // First try to extract just the number from formats like "12LPA"
//           if (job.salary) {
//             // For "12LPA" format, extract just the number
//             if (job.salary.includes('LPA')) {
//               const lpaValue = parseFloat(job.salary.replace(/[^\d.]/g, ''));
//               // Convert LPA (Lakhs Per Annum) to monthly (divide by 12)
//               salary = Math.round(lpaValue * 100000 / 12);
//             } else {
//               // For other formats like "₹50k - ₹80k", take the average
//               const salaryText = job.salary.replace(/[^\d]/g, '');
//               salary = parseInt(salaryText || '0');
//             }
//           }
//         } catch (e) {
//           console.error('Error parsing salary:', job.salary, e);
//         }
        
//         // Debug the salary parsing
//         console.log(`Job ${job.id} salary parsing:`, {
//           originalSalary: job.salary,
//           parsedSalary: salary
//         });
        
//         // For testing purposes, temporarily make salaryMatch always true
//         const minSalary = (filters.minSalary || 0) * 1000;
//         const maxSalary = (filters.maxSalary || 200) * 1000;
//         // const salaryMatch = salary >= minSalary && salary <= maxSalary;
//         const salaryMatch = true; // Temporarily bypass salary filtering
        
//         console.log(`Job ${job.id} matches:`, {
//           titleMatch,
//           locationMatch,
//           jobTypeMatch,
//           salaryMatch,
//           salary,
//           minSalary,
//           maxSalary
//         });
        
//         return titleMatch && locationMatch && jobTypeMatch && salaryMatch;
//       });
      
//       console.log('Filtered jobs:', filteredJobs.length);
//       setJobs(filteredJobs);
//       setLoading(false);
//     } catch (error) {
//       console.error('Error fetching jobs:', error);
//       setLoading(false);
//       // If there's an error, show all jobs
//       setJobs(mockJobs);
//     }
//   };

//   useEffect(() => {
//     fetchJobs();
//   }, [filters]);

//   const handleFilterChange = (newFilters: Partial<JobFilters>) => {
//     setFilters(prev => ({ ...prev, ...newFilters }));
//   };

//   return (
//     <Box style={{ backgroundColor: 'white', minHeight: '100vh' }}>
//       {/* Header with centered navbar */}
//       <Box style={{ 
//         backgroundColor: 'white', 
//         borderBottom: '1px solid #f1f3f5',
//         padding: '15px 0'
//       }}>
//         <Container size="xl">
//           <Group justify="center" align="center" style={{ width: '100%' }}>
//             <Group gap="xl" style={{ display: 'flex', flex: 1, justifyContent: 'center' }}>
//               <Image 
//                 src="/logo.png" 
//                 alt="JobBoard Logo" 
//                 width={40}
//                 height={40}
//                 fallbackSrc="https://placehold.co/40x40?text=JB"
//                 style={{ marginRight: '20px' }}
//               />
//               <Text fw={500} style={{ cursor: 'pointer' }}>Home</Text>
//               <Text fw={500} style={{ cursor: 'pointer' }}>Find Jobs</Text>
//               <Text fw={500} style={{ cursor: 'pointer' }}>Find Talents</Text>
//               <Text fw={500} style={{ cursor: 'pointer' }}>About us</Text>
//               <Text fw={500} style={{ cursor: 'pointer' }}>Testimonials</Text>
//               <Button 
//                 color="violet" 
//                 radius="xl"
//                 style={{ backgroundColor: '#7950f2' }}
//                 onClick={() => setIsCreateModalOpen(true)}
//               >
//                 Create Jobs
//               </Button>
//             </Group>
//           </Group>
//         </Container>
//       </Box>

//       <CreateJobModal
//         opened={isCreateModalOpen}
//         onClose={() => setIsCreateModalOpen(false)}
//       />

//       <Container size="xl" py="xs">
//         {/* Filter bar */}
//         <Box style={{
//           width: 1312,
//           height: 100,
//           top: 95,
//           left: 100,
//           gap: 16,
//           position: 'absolute'
//         }}>
//           <FilterBar onFilterChange={handleFilterChange} />
//         </Box>

//         {/* Job listings */}
//         {loading ? (
//           <Center style={{ height: 200 }}>
//             <Loader size="md" />
//           </Center>
//         ) : (
//           <Box style={{
//             width: 1312,
//             height: 360,
//             top: 160,
//             left: 100,
//             gap: 16,
//             position: 'absolute'
//           }}>
//             <Grid gutter="md">
//               {jobs.map((job) => (
//                 <Grid.Col key={job.id} span={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
//                   <JobCard job={job} />
//                 </Grid.Col>
//               ))}
//             </Grid>
//           </Box>
//         )}
//       </Container>
//     </Box>
//   );
// }