import { NextResponse } from 'next/server';
import { prisma, testDatabaseConnection } from '@/lib/prisma';

export async function GET() {
  try {
    // Test database connection
    const isConnected = await testDatabaseConnection();
    
    if (!isConnected) {
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 500 }
      );
    }
    
    // Try a simple query
    const userCount = await prisma.user.count();
    
    return NextResponse.json(
      { 
        status: 'ok',
        message: 'Database connection successful',
        database: process.env.DATABASE_URL?.split('@')[1]?.split('/')[0] || 'Unknown',
        userCount,
        environment: process.env.NODE_ENV,
        prismaVersion: require('@prisma/client/package.json').version
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('DATABASE_TEST_ERROR', error);
    return NextResponse.json(
      { 
        error: 'Database test failed',
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        databaseUrl: process.env.DATABASE_URL?.replace(
          /postgresql:\/\/([^:]+):([^@]+)@/,
          'postgresql://$1:****@'
        ) || 'Not provided'
      },
      { status: 500 }
    );
  }
}
