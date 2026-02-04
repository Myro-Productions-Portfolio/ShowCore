# Connect to AWS - Quick Checklist ✅

Use this checklist to connect your ShowCore application to AWS infrastructure.

## Prerequisites

- [ ] AWS infrastructure deployed (Phase 1 complete)
- [ ] AWS CLI installed and configured
- [ ] Node.js and npm installed
- [ ] Backend dependencies installed (`cd backend && npm install`)

## Step 1: Retrieve RDS Password

Choose one option:

### Option A: Check Secrets Manager
```bash
aws secretsmanager list-secrets --query 'SecretList[*].Name'
aws secretsmanager get-secret-value --secret-id SECRET_NAME
```

### Option B: Reset Password (Testing)
```bash
aws rds modify-db-instance \
  --db-instance-identifier showcore-database-production-rds \
  --master-user-password "YourSecurePassword123!" \
  --apply-immediately
```

- [ ] RDS password retrieved or reset
- [ ] Password saved securely (not in Git!)

## Step 2: Run Setup Script

```bash
./scripts/setup-aws-connection.sh
```

This will:
- ✅ Verify AWS CLI configuration
- ✅ Check infrastructure status
- ✅ Create backend/.env from template

- [ ] Setup script completed successfully
- [ ] backend/.env file created

## Step 3: Update Environment File

```bash
nano backend/.env
```

Replace `YOUR_PASSWORD_HERE` with actual RDS password.

- [ ] backend/.env updated with RDS password
- [ ] All endpoints verified in .env file

## Step 4: Configure Network Access

⚠️ **Important**: RDS and Redis are in private subnets.

### For Testing (Temporary)

```bash
# Get your IP
MY_IP=$(curl -s https://checkip.amazonaws.com)
echo "Your IP: $MY_IP"

# Get security group IDs
RDS_SG=$(aws ec2 describe-security-groups \
  --filters "Name=tag:Name,Values=*rds*" \
  --query 'SecurityGroups[0].GroupId' \
  --output text)

REDIS_SG=$(aws ec2 describe-security-groups \
  --filters "Name=tag:Name,Values=*redis*" \
  --query 'SecurityGroups[0].GroupId' \
  --output text)

echo "RDS Security Group: $RDS_SG"
echo "Redis Security Group: $REDIS_SG"

# Add temporary rules
aws ec2 authorize-security-group-ingress \
  --group-id $RDS_SG \
  --protocol tcp \
  --port 5432 \
  --cidr ${MY_IP}/32

aws ec2 authorize-security-group-ingress \
  --group-id $REDIS_SG \
  --protocol tcp \
  --port 6379 \
  --cidr ${MY_IP}/32
```

- [ ] Security group rules added
- [ ] Your IP address allowed

⚠️ **Remember**: Remove these rules after testing!

## Step 5: Test Connections

```bash
cd scripts
npm install
npm run test-connections
```

Expected output:
```
✅ Connected to PostgreSQL
✅ Connected to Redis
✅ S3 bucket is accessible
```

- [ ] PostgreSQL connection successful
- [ ] Redis connection successful
- [ ] S3 access successful

## Step 6: Initialize Database

```bash
cd backend

# Generate Prisma client
npm run db:generate

# Push schema to database
npm run db:push

# Optional: Seed data
npm run db:seed
```

- [ ] Prisma client generated
- [ ] Database schema created
- [ ] Initial data seeded (optional)

## Step 7: Start Backend

```bash
cd backend
npm run dev
```

Expected output:
```
Server starting on http://localhost:3001
```

- [ ] Backend started successfully
- [ ] No connection errors in logs

## Step 8: Test API

```bash
# In a new terminal
curl http://localhost:3001/health
```

Expected response:
```json
{"status":"ok","timestamp":"2026-02-04T..."}
```

- [ ] Health check endpoint responds
- [ ] API is accessible

## Step 9: Start Frontend (Optional)

```bash
cd apps/web
npm run dev
```

- [ ] Frontend started successfully
- [ ] Can access application in browser

## Cleanup (After Testing)

⚠️ **Important**: Remove temporary security group rules!

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

- [ ] Temporary security group rules removed

## Troubleshooting

### Connection Timeout

**Problem**: Cannot connect to RDS or Redis

**Solution**:
1. Verify security group rules are in place
2. Check your IP hasn't changed: `curl https://checkip.amazonaws.com`
3. Verify instances are running: `./scripts/setup-aws-connection.sh`

### Authentication Failed

**Problem**: PostgreSQL authentication error

**Solution**:
1. Verify password in backend/.env is correct
2. Check for special characters that need URL encoding
3. Try resetting the password

### Prisma Errors

**Problem**: Prisma cannot connect

**Solution**:
1. Verify DATABASE_URL format
2. Run `npm run db:generate` again
3. Check PostgreSQL connection works with psql first

### S3 Access Denied

**Problem**: Cannot access S3 bucket

**Solution**:
1. Verify AWS_PROFILE=showcore is set
2. Check IAM permissions: `aws sts get-caller-identity --profile showcore`
3. Verify bucket name is correct

## Need Help?

See detailed documentation:
- **[AWS Connection Guide](AWS_CONNECTION_GUIDE.md)** - Comprehensive instructions
- **[AWS Endpoints](AWS_ENDPOINTS.md)** - Quick reference
- **[Troubleshooting](AWS_CONNECTION_GUIDE.md#troubleshooting)** - Common issues

## Success! 🎉

If all checkboxes are complete:
- ✅ Your application is connected to AWS
- ✅ Database is initialized and accessible
- ✅ Redis cache is working
- ✅ S3 storage is configured
- ✅ Backend API is running

**Next Steps**: See Phase 2 planning in AWS_CONNECTION_SETUP_COMPLETE.md

---

**Quick Commands Reference**

```bash
# Check infrastructure status
./scripts/setup-aws-connection.sh

# Test connections
cd scripts && npm run test-connections

# Start backend
cd backend && npm run dev

# View logs
cd backend && npm run dev | grep -i error

# Check database
cd backend && npx prisma studio
```
