# SSM Session Manager - Additional Endpoints Required

## Issue Discovered

The SSM access instance is deployed and online, but Session Manager port forwarding requires **3 VPC endpoints**, and we only have 1:

- ✅ `com.amazonaws.us-east-1.ssm` - Deployed
- ❌ `com.amazonaws.us-east-1.ssmmessages` - **Missing** (required for Session Manager)
- ❌ `com.amazonaws.us-east-1.ec2messages` - **Missing** (required for Session Manager)

## Quick Fix (Manual)

You can add these endpoints manually via AWS Console or CLI:

### Option 1: AWS Console (Easiest)

1. Go to VPC Console → Endpoints
2. Click "Create Endpoint"
3. Create endpoint for `com.amazonaws.us-east-1.ssmmessages`:
   - Service: `com.amazonaws.us-east-1.ssmmessages`
   - VPC: Select ShowCore VPC
   - Subnets: Select both private subnets
   - Security Group: Select VPC Endpoint security group
   - Enable Private DNS
4. Repeat for `com.amazonaws.us-east-1.ec2messages`

### Option 2: AWS CLI

```bash
# Get VPC ID
VPC_ID=$(aws ec2 describe-instances --instance-ids i-XXXXXXXXXXXXXXXXX --query 'Reservations[0].Instances[0].VpcId' --output text)

# Get private subnet IDs
SUBNET_IDS=$(aws ec2 describe-subnets --filters "Name=vpc-id,Values=$VPC_ID" "Name=tag:Name,Values=*Private*" --query 'Subnets[*].SubnetId' --output text | tr '\t' ',')

# Get VPC endpoint security group
SG_ID=$(aws ec2 describe-security-groups --filters "Name=vpc-id,Values=$VPC_ID" "Name=group-name,Values=*VpcEndpoint*" --query 'SecurityGroups[0].GroupId' --output text)

# Create ssmmessages endpoint
aws ec2 create-vpc-endpoint \
  --vpc-id $VPC_ID \
  --vpc-endpoint-type Interface \
  --service-name com.amazonaws.us-east-1.ssmmessages \
  --subnet-ids $(echo $SUBNET_IDS | tr ',' ' ') \
  --security-group-ids $SG_ID \
  --private-dns-enabled

# Create ec2messages endpoint
aws ec2 create-vpc-endpoint \
  --vpc-id $VPC_ID \
  --vpc-endpoint-type Interface \
  --service-name com.amazonaws.us-east-1.ec2messages \
  --subnet-ids $(echo $SUBNET_IDS | tr ',' ' ') \
  --security-group-ids $SG_ID \
  --private-dns-enabled
```

## Alternative: Temporarily Make RDS Public

If you want to test immediately without waiting for VPC endpoints:

```bash
# Make RDS publicly accessible (TEMPORARY - for testing only)
aws rds modify-db-instance \
  --db-instance-identifier showcore-database-production-rds \
  --publicly-accessible \
  --apply-immediately

# Wait for modification (2-3 minutes)
aws rds wait db-instance-available \
  --db-instance-identifier showcore-database-production-rds

# Then connect directly
cd backend
npm run db:push
npm run dev

# REMEMBER TO REVERT:
aws rds modify-db-instance \
  --db-instance-identifier showcore-database-production-rds \
  --no-publicly-accessible \
  --apply-immediately
```

## Proper Fix: Update CDK Stack

I'll update the network stack to include all required Session Manager endpoints.

## Cost Impact

Adding the two additional VPC endpoints:
- ssmmessages: ~$7/month
- ec2messages: ~$7/month
- **Total additional cost**: ~$14/month

**Total VPC endpoint cost**: ~$21/month (3 endpoints × $7)

Still cheaper than NAT Gateway ($32/month)!

## Status

- ✅ SSM instance deployed
- ✅ Security groups configured
- ✅ SSM agent online
- ❌ Missing VPC endpoints for Session Manager
- 🔧 **Action required**: Add ssmmessages and ec2messages endpoints

## Recommendation

**For immediate testing**: Make RDS temporarily public (see above)

**For proper setup**: Add the missing VPC endpoints (see Option 1 or 2 above)

---

**Discovered**: February 4, 2026  
**Impact**: Cannot use Session Manager port forwarding until endpoints are added  
**Workaround**: Temporarily make RDS public for testing
