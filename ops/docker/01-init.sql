-- DateApp Database Initialization Script
-- This script runs when the PostgreSQL container is first created

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Create custom types
DO $$ BEGIN
    CREATE TYPE gender AS ENUM ('male', 'female', 'non_binary', 'other', 'prefer_not_to_say');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE relationship_goal AS ENUM ('casual', 'dating', 'relationship', 'marriage', 'friendship');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE match_status AS ENUM ('pending', 'matched', 'rejected', 'expired');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE message_status AS ENUM ('sent', 'delivered', 'read');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Grant permissions (the main user is created by POSTGRES_USER env var)
-- Additional grants can be added here for read-only users, etc.

-- Create indexes function for better query performance
-- These will be properly created by Prisma migrations, but we set up the basics

-- Log initialization complete
DO $$
BEGIN
    RAISE NOTICE 'DateApp database initialization complete!';
END $$;
