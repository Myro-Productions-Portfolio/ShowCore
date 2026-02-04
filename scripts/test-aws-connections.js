#!/usr/bin/env node

/**
 * ShowCore AWS Connection Test Script
 * 
 * Tests connectivity to AWS infrastructure:
 * - RDS PostgreSQL
 * - ElastiCache Redis
 * - S3 Bucket
 */

import { createClient } from 'redis';
import pg from 'pg';
import { S3Client, HeadBucketCommand } from '@aws-sdk/client-s3';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from backend/.env
dotenv.config({ path: join(__dirname, '../backend/.env') });

const { Client } = pg;

// Colors for output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testPostgreSQL() {
  log('\n📊 Testing PostgreSQL Connection...', 'blue');
  
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    log('❌ DATABASE_URL not found in .env', 'red');
    return false;
  }
  
  if (databaseUrl.includes('YOUR_PASSWORD_HERE')) {
    log('❌ DATABASE_URL contains placeholder password', 'red');
    log('   Update backend/.env with actual RDS password', 'yellow');
    return false;
  }
  
  const client = new Client({
    connectionString: databaseUrl,
    ssl: {
      rejectUnauthorized: false, // For testing; use proper SSL in production
    },
  });
  
  try {
    await client.connect();
    log('✅ Connected to PostgreSQL', 'green');
    
    // Test query
    const result = await client.query('SELECT version()');
    log(`   PostgreSQL version: ${result.rows[0].version.split(',')[0]}`, 'blue');
    
    // Check if database has tables
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    
    if (tables.rows.length > 0) {
      log(`   Found ${tables.rows.length} tables in database`, 'green');
    } else {
      log('   ⚠️  No tables found - run migrations: npm run db:push', 'yellow');
    }
    
    await client.end();
    return true;
  } catch (error) {
    log(`❌ PostgreSQL connection failed: ${error.message}`, 'red');
    
    if (error.code === 'ENOTFOUND') {
      log('   DNS resolution failed - check endpoint address', 'yellow');
    } else if (error.code === 'ETIMEDOUT' || error.code === 'ECONNREFUSED') {
      log('   Connection timeout - check security group rules', 'yellow');
      log('   RDS is in a private subnet - see AWS_CONNECTION_GUIDE.md', 'yellow');
    } else if (error.code === '28P01') {
      log('   Authentication failed - check username/password', 'yellow');
    }
    
    return false;
  }
}

async function testRedis() {
  log('\n🔴 Testing Redis Connection...', 'blue');
  
  const redisUrl = process.env.REDIS_URL;
  
  if (!redisUrl) {
    log('❌ REDIS_URL not found in .env', 'red');
    return false;
  }
  
  const client = createClient({
    url: redisUrl,
    socket: {
      connectTimeout: 5000,
    },
  });
  
  client.on('error', (err) => {
    // Error will be caught in try-catch
  });
  
  try {
    await client.connect();
    log('✅ Connected to Redis', 'green');
    
    // Test ping
    const pong = await client.ping();
    log(`   Ping response: ${pong}`, 'blue');
    
    // Test set/get
    await client.set('test-key', 'test-value', { EX: 10 });
    const value = await client.get('test-key');
    
    if (value === 'test-value') {
      log('   ✅ Read/write test passed', 'green');
    }
    
    await client.quit();
    return true;
  } catch (error) {
    log(`❌ Redis connection failed: ${error.message}`, 'red');
    
    if (error.code === 'ENOTFOUND') {
      log('   DNS resolution failed - check endpoint address', 'yellow');
    } else if (error.code === 'ETIMEDOUT' || error.code === 'ECONNREFUSED') {
      log('   Connection timeout - check security group rules', 'yellow');
      log('   ElastiCache is in a private subnet - see AWS_CONNECTION_GUIDE.md', 'yellow');
    }
    
    return false;
  }
}

async function testS3() {
  log('\n📦 Testing S3 Access...', 'blue');
  
  const bucketName = process.env.S3_BUCKET;
  const region = process.env.AWS_REGION || 'us-east-1';
  
  if (!bucketName) {
    log('❌ S3_BUCKET not found in .env', 'red');
    return false;
  }
  
  const s3Client = new S3Client({
    region,
    // Will use credentials from AWS_PROFILE environment variable or ~/.aws/credentials
  });
  
  try {
    await s3Client.send(new HeadBucketCommand({ Bucket: bucketName }));
    log('✅ S3 bucket is accessible', 'green');
    log(`   Bucket: ${bucketName}`, 'blue');
    log(`   Region: ${region}`, 'blue');
    return true;
  } catch (error) {
    log(`❌ S3 access failed: ${error.message}`, 'red');
    
    if (error.name === 'NotFound') {
      log('   Bucket does not exist', 'yellow');
    } else if (error.name === 'Forbidden' || error.name === 'AccessDenied') {
      log('   Access denied - check IAM permissions', 'yellow');
      log('   Make sure AWS_PROFILE=showcore is set', 'yellow');
    }
    
    return false;
  }
}

async function main() {
  log('🚀 ShowCore AWS Connection Test', 'blue');
  log('================================\n', 'blue');
  
  // Check if .env exists
  const fs = await import('fs');
  const envPath = join(__dirname, '../backend/.env');
  
  if (!fs.existsSync(envPath)) {
    log('❌ backend/.env file not found', 'red');
    log('   Copy backend/.env.aws.template to backend/.env', 'yellow');
    log('   Then update with actual credentials', 'yellow');
    process.exit(1);
  }
  
  const results = {
    postgresql: await testPostgreSQL(),
    redis: await testRedis(),
    s3: await testS3(),
  };
  
  log('\n================================', 'blue');
  log('📊 Test Summary', 'blue');
  log('================================\n', 'blue');
  
  const passed = Object.values(results).filter(Boolean).length;
  const total = Object.keys(results).length;
  
  log(`PostgreSQL: ${results.postgresql ? '✅ PASS' : '❌ FAIL'}`, results.postgresql ? 'green' : 'red');
  log(`Redis:      ${results.redis ? '✅ PASS' : '❌ FAIL'}`, results.redis ? 'green' : 'red');
  log(`S3:         ${results.s3 ? '✅ PASS' : '❌ FAIL'}`, results.s3 ? 'green' : 'red');
  
  log(`\nTotal: ${passed}/${total} tests passed`, passed === total ? 'green' : 'yellow');
  
  if (passed < total) {
    log('\n⚠️  Some tests failed. See AWS_CONNECTION_GUIDE.md for troubleshooting.', 'yellow');
    process.exit(1);
  } else {
    log('\n✅ All connections successful! Your application is ready to use AWS infrastructure.', 'green');
    process.exit(0);
  }
}

main().catch((error) => {
  log(`\n❌ Unexpected error: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});
