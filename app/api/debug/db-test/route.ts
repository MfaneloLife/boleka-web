import { NextResponse } from 'next/server';
import { prisma, testDatabaseConnection } from '@/lib/prisma';

export async function GET() {
  try {
    // Test database connection
    const dbResult = await testDatabaseConnection();
    
    if (!dbResult.success) {
      return NextResponse.json(
        { 
          status: 'error',
          message: 'Database connection failed', 
          error: dbResult.error,
          provider: "sqlite",
          databaseUrl: process.env.DATABASE_URL?.startsWith('file:') 
            ? 'SQLite file database' 
            : (process.env.DATABASE_URL?.replace(/postgresql:\/\/([^:]+):([^@]+)@/, 'postgresql://$1:****@') || 'Not provided'),
          stack: dbResult.stack
        },
        { status: 500 }
      );
    }
    
    // Try a simple query
    const userCount = await prisma.user.count();
    
    // Read prisma package version safely
    let prismaVersion: string | undefined;
    try {
      // dynamic import to avoid require in TS
      const pkg = (await import('@prisma/client/package.json')) as { version?: string };
      prismaVersion = pkg?.version;
    } catch {
      prismaVersion = undefined;
    }

    return NextResponse.json(
      { 
        status: 'ok',
        message: 'Database connection successful',
        provider: "sqlite",
        database: process.env.DATABASE_URL?.startsWith('file:') 
          ? 'SQLite file database' 
          : (process.env.DATABASE_URL?.split('@')[1]?.split('/')[0] || 'Unknown'),
        userCount,
        environment: process.env.NODE_ENV,
        prismaVersion
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('DATABASE_TEST_ERROR', error);
    return NextResponse.json(
      { 
        status: 'error',
        error: 'Database test failed',
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        provider: "sqlite",
        databaseUrl: process.env.DATABASE_URL?.startsWith('file:') 
          ? 'SQLite file database' 
          : (process.env.DATABASE_URL?.replace(/postgresql:\/\/([^:]+):([^@]+)@/, 'postgresql://$1:****@') || 'Not provided')
      },
      { status: 500 }
    );
  }
}
