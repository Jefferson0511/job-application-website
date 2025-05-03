import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

const BACKEND_URL = 'http://localhost:3002'; // Changed to match the new backend port

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const filters = {
      title: url.searchParams.get('title'),
      location: url.searchParams.get('location'),
      jobType: url.searchParams.get('jobType'),
      minSalary: url.searchParams.get('minSalary') ? parseInt(url.searchParams.get('minSalary')!) : undefined,
      maxSalary: url.searchParams.get('maxSalary') ? parseInt(url.searchParams.get('maxSalary')!) : undefined,
    };

    console.log('Received filters on backend:', filters);

    // Forward the request to your NestJS backend
    const response = await axios.get(`${BACKEND_URL}/api/jobs/filter`, {
      params: filters
    });
    
    return NextResponse.json(response.data);
  } catch (error) {
    console.error('Error fetching jobs from backend:', error);
    return NextResponse.json(
      { error: 'Failed to fetch jobs from backend' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const filters = await req.json();
    console.log('Received filters on backend:', filters);

    // Forward the request to your NestJS backend
    const response = await axios.post(`${BACKEND_URL}/api/jobs/filter`, filters);
    
    return NextResponse.json(response.data);
  } catch (error) {
    console.error('Error fetching jobs from backend:', error);
    return NextResponse.json(
      { error: 'Failed to fetch jobs from backend' },
      { status: 500 }
    );
  }
}
