# AWS Connection Guide - ShowCore Application

## Overview

This guide walks you through connecting your ShowCore application to the newly deployed AWS infrastructure. The infrastructure includes:

- **RDS PostgreSQL**: Database for application data
- **ElastiCache Redis**: Cache for sessions and frequently accessed data
- **S3**: Storage for static assets and backups
- **CloudFront**: CDN for content delivery (to be configured)

## Infrastructure Endpoints

### RDS PostgreSQL Database
- **Endpoint**: `showcore-database-production-rds.c0n8gos42qfi.us-east-1.rds.amazonaws.com`
- **Port**: `5432`
- **Database Name**: `showcore`
- **Username**: `postgres`
- **Password**: ⚠️ **REQUIRED** - Retrieve from AWS Secrets Manager (see below)

### ElastiCache Redis
- **Endpoint**: `showcore-redis.npl1ux.0001.use1.cache.amazonaws.com`
- **Port**: `6379`
- **Auth**: No authentication configured (within VPC security)

### S3 Static Assets Bucket
- **Bucket Name**: `showcore-static-assets-498618930321`
- **Region**: `us-east-1`
- **Access**: Via IAM credentials (showcore-app user)

## Step 1: Retrieve Database Password

The RDS master password was auto-generated during deployment and stored in AWS Secrets Manager.

### Option A: Using AWS Console
1. Go to AWS Secrets Manager console
2. Search for secrets containing "showcore" and "database"
3. View the secret value
4. Copy the password

### Option B: Using AWS CLI
```bash
# List secrets
aws secretsmanager list-secrets --query 'SecretList[*].Name' --output table

# Get the secret value (replace SECRET_NAME with actual name)
aws secretsmanager get-secret-value --secret-id SECRET_NAME --query 'SecretString' --output text
```

### Option C: Temporary Password for Testing
For initial testing, you can reset the RDS master password:

```bash
# Reset to a known password (for testing only)
aws rds modify-db-instance \
  --db-instance-identifier showcore-database-production-rds \
  --master-user-password "YourSecurePassword123!" \
  --apply-immediately

# Wait for modification to complete (takes 2-3 minutes)
aws rds describe-db-instances \
  --db-instance-identifier showcore-database-production-rds \
  --query 'DBInstances[0].DBInstanceStatus'
```

⚠️ **Security Note**: Use a strong password and store it securely. Never commit passwords to Git.

## Step 2: Update Backend Environment Variables

Create or update `backend/.env` with the AWS connection details:

```bash
# Database Configuration (AWS RDS PostgreSQL)
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD_HERE@showcore-database-production-rds.c0n8gos42qfi.us-east-1.rds.amazonaws.com:5432/showcore
DIRECT_URL=postgresql://postgres:YOUR_PASSWORD_HERE@showcore-database-production-rds.c0n8gos42qfi.us-east-1.rds.amazonaws.com:5432/showcore

# Redis Configuration (AWS ElastiCache)
REDIS_URL=redis://showcore-redis.npl1ux.0001.use1.cache.amazonaws.com:6379

# AWS Configuration
AWS_REGION=us-east-1
AWS_PROFILE=showcore
S3_BUCKET=showcore-static-assets-498618930321

# API Configuration
NODE_ENV=production
PORT=3001

# Frontend Configuration
VITE_API_URL=http://localhost:3001
VITE_CLERK_PUBLISHABLE_KEY=
```

**Replace `YOUR_PASSWORD_HERE`** with the actual password from Step 1.

## Step 3: Network Access Configuration

### Important: VPC Security Considerations

Your RDS and ElastiCache instances are deployed in **private subnets** with **NO internet access**. This means:

1. **Local Development**: You cannot connect directly from your local machine
2. **Security**: This is intentional for security (databases should not be publicly accessible)
3. **Access Methods**: You need one of these approaches:

### Option A: Bastion Host (Recommended for Production)

Deploy an EC2 instance in the public subnet to act as a jump box:

```bash
# This will be covered in Phase 2 of the migration
# For now, we'll use Option B for testing
```

### Option B: Temporary Public Access (Testing Only)

⚠️ **For testing purposes only** - modify security groups to allow your IP:

```bash
# Get your public IP
MY_IP=$(curl -s https://checkip.amazonaws.com)

# Get the RDS security group ID
RDS_SG=$(aws ec2 describe-security-groups \
  --filters "Name=tag:Name,Values=*rds*" \
  --query 'SecurityGroups[0].GroupId' \
  --output text)

# Add temporary ingress rule for PostgreSQL
aws ec2 authorize-security-group-ingress \
  --group-id $RDS_SG \
  --protocol tcp \
  --port 5432 \
  --cidr ${MY_IP}/32 \
  --description "Temporary access for testing"

# Get the ElastiCache security group ID
REDIS_SG=$(aws ec2 describe-security-groups \
  --filters "Name=tag:Name,Values=*redis*" \
  --query 'SecurityGroups[0].GroupId' \
  --output text)

# Add temporary ingress rule for Redis
aws ec2 authorize-security-group-ingress \
  --group-id $REDIS_SG \
  --protocol tcp \
  --port 6379 \
  --cidr ${MY_IP}/32 \
  --description "Temporary access for testing"
```

⚠️ **Remember to remove these rules after testing**:

```bash
# Remove temporary rules
aws ec2 revoke-security-group-ingress \
  --group-id $RDS_SG \
  --protocol tcp \
  --port 5432 \
  --cidr ${MY_IP}/32

aws ec2 revoke-security-group-ingress \
  --group-id $REDIS_SG \
  --protocol tcp \
  --port 6379 \
  --cidr ${MY_IP}/32
```

### Option C: VPN Connection (Best for Development)

Set up AWS Client VPN to securely access private resources (covered in Phase 2).

## Step 4: Initialize Database Schema

Once you have network access configured, initialize the database:

```bash
cd backend

# Generate Prisma client
npm run db:generate

# Push schema to database (creates tables)
npm run db:push

# Or run migrations (if you have migration files)
npm run db:migrate:prod

# Optional: Seed initial data
npm run db:seed
```

## Step 5: Test Database Connection

Test the connection before starting the application:

```bash
# Using psql (if installed)
psql "postgresql://postgres:YOUR_PASSWORD@showcore-database-production-rds.c0n8gos42qfi.us-east-1.rds.amazonaws.com:5432/showcore"

# Or using Node.js
node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.\$connect()
  .then(() => console.log('✅ Database connected successfully'))
  .catch(err => console.error('❌ Database connection failed:', err))
  .finally(() => prisma.\$disconnect());
"
```

## Step 6: Test Redis Connection

Test Redis connectivity:

```bash
# Using redis-cli (if installed)
redis-cli -h showcore-redis.npl1ux.0001.use1.cache.amazonaws.com -p 6379 ping

# Or using Node.js
node -e "
const redis = require('redis');
const client = redis.createClient({
  url: 'redis://showcore-redis.npl1ux.0001.use1.cache.amazonaws.com:6379'
});
client.connect()
  .then(() => client.ping())
  .then(result => console.log('✅ Redis connected:', result))
  .catch(err => console.error('❌ Redis connection failed:', err))
  .finally(() => client.quit());
"
```

## Step 7: Start Backend Application

```bash
cd backend

# Development mode
npm run dev

# Production mode
npm run build
npm start
```

## Step 8: Update Frontend Configuration

Update `apps/web/.env` to point to your backend:

```bash
# Clerk Authentication
VITE_CLERK_PUBLISHABLE_KEY=pk_test_your_key_here

# API URL (update when backend is deployed to AWS)
VITE_API_URL=http://localhost:3001

# AWS Configuration (for direct S3 uploads if needed)
VITE_AWS_REGION=us-east-1
VITE_S3_BUCKET=showcore-static-assets-498618930321
```

## Step 9: Configure S3 for Static Assets

### Upload Static Assets to S3

```bash
# Sync public assets to S3
aws s3 sync apps/web/public/ s3://showcore-static-assets-498618930321/public/ \
  --profile showcore \
  --acl public-read

# Verify upload
aws s3 ls s3://showcore-static-assets-498618930321/public/ \
  --profile showcore \
  --recursive
```

### Update Application to Use S3 URLs

In your application code, update static asset URLs:

```typescript
// Before (local)
const logoUrl = '/logo/showcore-logo.png';

// After (S3)
const S3_BASE_URL = 'https://showcore-static-assets-498618930321.s3.amazonaws.com';
const logoUrl = `${S3_BASE_URL}/public/logo/showcore-logo.png`;
```

## Troubleshooting

### Cannot Connect to RDS

**Problem**: Connection timeout or refused

**Solutions**:
1. Check security group rules allow your IP
2. Verify RDS instance is in "available" state
3. Check VPC and subnet configuration
4. Verify you're using the correct endpoint and port

```bash
# Check RDS status
aws rds describe-db-instances \
  --db-instance-identifier showcore-database-production-rds \
  --query 'DBInstances[0].[DBInstanceStatus,Endpoint.Address]'

# Check security group rules
aws ec2 describe-security-groups \
  --filters "Name=tag:Name,Values=*rds*" \
  --query 'SecurityGroups[0].IpPermissions'
```

### Cannot Connect to Redis

**Problem**: Connection timeout or refused

**Solutions**:
1. Check security group rules allow your IP
2. Verify ElastiCache cluster is in "available" state
3. Check VPC and subnet configuration

```bash
# Check Redis status
aws elasticache describe-cache-clusters \
  --cache-cluster-id showcore-redis \
  --query 'CacheClusters[0].[CacheClusterStatus,CacheNodes[0].Endpoint.Address]'

# Check security group rules
aws ec2 describe-security-groups \
  --filters "Name=tag:Name,Values=*redis*" \
  --query 'SecurityGroups[0].IpPermissions'
```

### Prisma Connection Errors

**Problem**: Prisma cannot connect to database

**Solutions**:
1. Verify DATABASE_URL format is correct
2. Check password doesn't contain special characters that need URL encoding
3. Ensure Prisma client is generated: `npm run db:generate`

```bash
# Test connection with Prisma
npx prisma db pull

# View connection string (without password)
echo $DATABASE_URL | sed 's/:.*@/:***@/'
```

### S3 Access Denied

**Problem**: Cannot upload to S3 bucket

**Solutions**:
1. Verify you're using the showcore profile: `export AWS_PROFILE=showcore`
2. Check IAM permissions for showcore-app user
3. Verify bucket name is correct

```bash
# Test S3 access
aws s3 ls s3://showcore-static-assets-498618930321/ --profile showcore

# Check current AWS identity
aws sts get-caller-identity --profile showcore
```

## Security Checklist

Before going to production:

- [ ] Database password is strong and stored securely (not in Git)
- [ ] Remove temporary security group rules allowing public access
- [ ] Enable SSL/TLS for RDS connections
- [ ] Enable encryption in transit for Redis
- [ ] Configure S3 bucket policies for least privilege access
- [ ] Set up CloudWatch alarms for connection failures
- [ ] Enable RDS automated backups (already configured)
- [ ] Enable ElastiCache snapshots (already configured)
- [ ] Review CloudTrail logs for unauthorized access attempts
- [ ] Set up VPN or bastion host for secure access

## Next Steps

Once your application is connected and tested:

1. **Phase 2: Application Deployment**
   - Deploy backend to ECS Fargate or Lambda
   - Deploy frontend to S3 + CloudFront
   - Configure custom domain and SSL

2. **Phase 2: CI/CD Pipeline**
   - Set up GitHub Actions for automated deployments
   - Configure staging and production environments
   - Implement blue-green deployments

3. **Phase 2: Monitoring & Observability**
   - Configure application-level CloudWatch metrics
   - Set up log aggregation
   - Create operational dashboards

4. **Phase 3: Advanced Features**
   - Multi-AZ deployment for high availability
   - Read replicas for database scaling
   - Auto-scaling for application tier

## Cost Monitoring

Monitor your AWS costs:

```bash
# Check current month costs
aws ce get-cost-and-usage \
  --time-period Start=2026-02-01,End=2026-02-28 \
  --granularity MONTHLY \
  --metrics BlendedCost \
  --group-by Type=TAG,Key=Project

# Set up billing alerts (if not already configured)
aws cloudwatch put-metric-alarm \
  --alarm-name showcore-billing-alert-50 \
  --alarm-description "Alert when ShowCore costs exceed $50" \
  --metric-name EstimatedCharges \
  --namespace AWS/Billing \
  --statistic Maximum \
  --period 21600 \
  --evaluation-periods 1 \
  --threshold 50 \
  --comparison-operator GreaterThanThreshold
```

## Support Resources

- **AWS Documentation**: https://docs.aws.amazon.com/
- **Prisma Documentation**: https://www.prisma.io/docs/
- **Redis Documentation**: https://redis.io/docs/
- **ShowCore Project**: See `.kiro/specs/showcore-aws-migration-phase1/` for detailed specs

---

**Last Updated**: February 4, 2026  
**Phase**: Phase 1 - Infrastructure Deployment Complete  
**Next Phase**: Phase 2 - Application Deployment
