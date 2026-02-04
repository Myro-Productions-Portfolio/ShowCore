# ShowCore Phase 1 - Complete Infrastructure Deployment Guide

## 🎯 Task 13.1: Deploy Complete Infrastructure to AWS

This guide walks you through deploying ALL ShowCore Phase 1 infrastructure to AWS cloud.

**Estimated Time**: 15-30 minutes for complete deployment

**What Will Be Deployed**:
- ✅ VPC with subnets, VPC endpoints (NO NAT Gateway)
- ✅ Security groups, CloudTrail, audit logging
- ✅ CloudWatch dashboards, alarms, SNS topics
- ✅ RDS PostgreSQL 16 (db.t3.micro, Free Tier)
- ✅ ElastiCache Redis 7 (cache.t3.micro, Free Tier)
- ✅ S3 buckets (static assets, backups, CloudTrail logs)
- ✅ CloudFront CDN distribution
- ✅ AWS Backup plans for RDS and ElastiCache

**Estimated Monthly Cost**:
- During Free Tier (first 12 months): ~$3-10/month
- After Free Tier: ~$49-60/month

---

## Prerequisites Checklist

Before starting deployment, verify:

- [ ] AWS CLI is installed and configured
- [ ] AWS credentials are configured for showcore-app IAM user
- [ ] Python 3.9+ is installed
- [ ] Node.js 14+ is installed
- [ ] AWS CDK CLI is installed globally
- [ ] Virtual environment is activated
- [ ] All Python dependencies are installed
- [ ] CDK is bootstrapped in your AWS account

---

## Step 1: Verify Prerequisites

### 1.1 Check AWS Credentials

```bash
# Navigate to infrastructure directory
cd infrastructure

# Check current AWS identity (should show showcore-app user)
aws sts get-caller-identity
```

**Expected Output**:
```json
{
  "UserId": "AIDAXXXXXXXXXXXXXXXXX",
  "Account": "123456789012",
  "Arn": "arn:aws:iam::123456789012:user/showcore-app"
}
```

**If wrong user**: Configure AWS credentials:
```bash
aws configure
# Enter Access Key ID
# Enter Secret Access Key
# Enter region: us-east-1
# Enter output format: json
```

### 1.2 Activate Virtual Environment

```bash
# Activate virtual environment
source .venv/bin/activate  # On macOS/Linux
# .venv\Scripts\activate.bat  # On Windows

# Verify Python packages are installed
pip list | grep aws-cdk
```

### 1.3 Verify CDK Installation

```bash
# Check CDK version
cdk --version

# Should show: 2.x.x or higher
```

**If not installed**:
```bash
npm install -g aws-cdk
```

### 1.4 Configure CDK Context

**IMPORTANT**: Update `cdk.json` with your AWS account ID and email addresses.

```bash
# Get your AWS account ID
aws sts get-caller-identity --query Account --output text
```

Edit `cdk.json` and update:
```json
{
  "context": {
    "account": "YOUR_12_DIGIT_ACCOUNT_ID",
    "region": "us-east-1",
    "alarm_email_addresses": [
      "your-email@example.com"
    ]
  }
}
```

### 1.5 Bootstrap CDK (First Time Only)

**Skip this if you've already bootstrapped CDK in us-east-1.**

```bash
# Bootstrap CDK (replace with your account ID)
cdk bootstrap aws://YOUR_ACCOUNT_ID/us-east-1
```

This creates the CDK toolkit stack with S3 bucket and IAM roles.

---

## Step 2: Pre-Deployment Validation

### 2.1 Run All Unit Tests

```bash
# Run all unit tests (must pass 100%)
pytest tests/unit/ -v

# Expected: All tests should PASS
```

**If tests fail**: Review and fix issues before proceeding.

### 2.2 Synthesize CloudFormation Templates

```bash
# Generate CloudFormation templates
cdk synth

# This should complete without errors and show all 8 stacks:
# - ShowCoreNetworkStack
# - ShowCoreSecurityStack
# - ShowCoreMonitoringStack
# - ShowCoreDatabaseStack
# - ShowCoreCacheStack
# - ShowCoreStorageStack
# - ShowCoreCDNStack
# - ShowCoreBackupStack
```

**If synthesis fails**: Review error messages and fix code issues.

### 2.3 Preview All Changes

```bash
# Preview what will be deployed
cdk diff --all

# Review carefully:
# - Verify NO NAT Gateway is being created
# - Verify Free Tier instance types (db.t3.micro, cache.t3.micro)
# - Verify VPC Endpoints are configured
# - Verify encryption is enabled for all data resources
```

**Important**: This shows you exactly what AWS resources will be created.

### 2.4 List All Stacks

```bash
# List all stacks that will be deployed
cdk list

# Expected output:
# ShowCoreNetworkStack
# ShowCoreSecurityStack
# ShowCoreMonitoringStack
# ShowCoreDatabaseStack
# ShowCoreCacheStack
# ShowCoreStorageStack
# ShowCoreCDNStack
# ShowCoreBackupStack
```

---

## Step 3: 🚀 THE BIG DEPLOYMENT

### 3.1 Deploy All Stacks

**This is the moment!** This command will deploy ALL infrastructure to AWS cloud.

```bash
# Deploy all stacks at once (15-30 minutes)
cdk deploy --all --require-approval never

# Alternative: Deploy with approval prompts for security changes
cdk deploy --all --require-approval any-change
```

**What happens during deployment**:
1. CDK uploads assets to S3
2. CloudFormation creates stacks in dependency order:
   - NetworkStack (VPC, subnets, VPC endpoints) - ~5 minutes
   - SecurityStack (security groups, CloudTrail) - ~3 minutes
   - MonitoringStack (CloudWatch, SNS, alarms) - ~2 minutes
   - DatabaseStack (RDS PostgreSQL) - ~10-15 minutes ⏰
   - CacheStack (ElastiCache Redis) - ~5-10 minutes
   - StorageStack (S3 buckets) - ~2 minutes
   - CDNStack (CloudFront distribution) - ~5-10 minutes
   - BackupStack (AWS Backup plans) - ~2 minutes

**Total Time**: 15-30 minutes (RDS and CloudFront take the longest)

### 3.2 Monitor Deployment Progress

**In Terminal**: Watch the deployment progress in your terminal.

**In AWS Console**: 
1. Open AWS Console → CloudFormation
2. Watch stacks being created in real-time
3. Each stack will show CREATE_IN_PROGRESS → CREATE_COMPLETE

**Expected Output**:
```
✨  Synthesis time: 5.2s

ShowCoreNetworkStack: deploying...
ShowCoreNetworkStack: creating CloudFormation changeset...
[████████████████████████████████████████] (10/10)

 ✅  ShowCoreNetworkStack

ShowCoreSecurityStack: deploying...
...

 ✅  ShowCoreSecurityStack
 ✅  ShowCoreMonitoringStack
 ✅  ShowCoreDatabaseStack
 ✅  ShowCoreCacheStack
 ✅  ShowCoreStorageStack
 ✅  ShowCoreCDNStack
 ✅  ShowCoreBackupStack

✨  Deployment time: 25m 32s

Stack ARN:
arn:aws:cloudformation:us-east-1:123456789012:stack/ShowCoreNetworkStack/...
```

### 3.3 Handle Deployment Issues

**If deployment fails**:
1. Review error message in terminal
2. Check CloudFormation events in AWS Console
3. Common issues:
   - **Insufficient permissions**: Verify IAM user has required permissions
   - **Resource limits**: Check AWS service quotas
   - **Invalid configuration**: Review `cdk.json` settings
   - **Email not confirmed**: Confirm SNS email subscriptions

**To retry after fixing issues**:
```bash
cdk deploy --all --require-approval never
```

---

## Step 4: Post-Deployment Verification

### 4.1 Verify All Stacks Deployed Successfully

```bash
# List all deployed stacks
aws cloudformation list-stacks \
  --stack-status-filter CREATE_COMPLETE \
  --query 'StackSummaries[?contains(StackName, `ShowCore`)].StackName' \
  --output table
```

**Expected**: All 8 stacks should show CREATE_COMPLETE status.

### 4.2 Verify Resources in AWS Console

**Network Infrastructure**:
1. Go to VPC Console
2. Verify VPC exists (10.0.0.0/16)
3. Verify 4 subnets (2 public, 2 private)
4. Verify Internet Gateway exists
5. **Verify NO NAT Gateway exists** ✅ (cost optimization)
6. Verify VPC Endpoints exist:
   - S3 Gateway Endpoint (FREE)
   - DynamoDB Gateway Endpoint (FREE)
   - CloudWatch Logs Interface Endpoint
   - CloudWatch Monitoring Interface Endpoint
   - Systems Manager Interface Endpoint

**Security**:
1. Go to EC2 Console → Security Groups
2. Verify security groups exist:
   - RDS security group (PostgreSQL 5432)
   - ElastiCache security group (Redis 6379)
   - VPC Endpoint security group (HTTPS 443)
3. Verify NO 0.0.0.0/0 rules on sensitive ports

**Database**:
1. Go to RDS Console
2. Verify RDS instance exists (showcore-database-production-rds)
3. Verify instance class is db.t3.micro (Free Tier)
4. Verify single-AZ deployment
5. Verify encryption at rest is enabled
6. Verify automated backups are enabled (7-day retention)

**Cache**:
1. Go to ElastiCache Console
2. Verify Redis cluster exists (showcore-redis)
3. Verify node type is cache.t3.micro (Free Tier)
4. Verify single-node deployment
5. Verify encryption at rest and in transit are enabled
6. Verify automated snapshots are enabled (7-day retention)

**Storage**:
1. Go to S3 Console
2. Verify buckets exist:
   - showcore-static-assets-{account-id}
   - showcore-backups-{account-id}
   - showcore-cloudtrail-logs-{account-id}
3. Verify versioning is enabled
4. Verify encryption is enabled (SSE-S3)
5. Verify lifecycle policies are configured

**CDN**:
1. Go to CloudFront Console
2. Verify distribution exists
3. Verify origin is S3 static assets bucket
4. Verify HTTPS-only is configured
5. Verify PriceClass_100 (North America and Europe)

**Monitoring**:
1. Go to CloudWatch Console → Dashboards
2. Verify ShowCore-Phase1-Dashboard exists
3. Verify metrics are displayed (may take a few minutes)
4. Go to CloudWatch → Alarms
5. Verify alarms exist for:
   - RDS CPU and storage
   - ElastiCache CPU and memory
   - Billing thresholds ($50, $100)

**Backup**:
1. Go to AWS Backup Console
2. Verify backup vault exists
3. Verify backup plans exist for RDS and ElastiCache
4. Verify backup jobs are scheduled

### 4.3 Verify VPC Endpoints Are Healthy

```bash
# List VPC endpoints
aws ec2 describe-vpc-endpoints \
  --filters "Name=tag:Project,Values=ShowCore" \
  --query 'VpcEndpoints[*].[VpcEndpointId,ServiceName,State]' \
  --output table
```

**Expected**: All endpoints should show "available" state.

### 4.4 Verify Private Subnets Have NO Internet Access

```bash
# Get private subnet route tables
aws ec2 describe-route-tables \
  --filters "Name=tag:Name,Values=*Private*" \
  --query 'RouteTables[*].Routes' \
  --output table
```

**Expected**: 
- ✅ Local route (10.0.0.0/16)
- ✅ VPC Endpoint routes (S3, DynamoDB)
- ❌ NO default route (0.0.0.0/0) to NAT Gateway or Internet Gateway

### 4.5 Verify No Infrastructure Drift

```bash
# Run cdk diff again to check for drift
cdk diff --all

# Expected: "There were no differences"
```

If differences are shown, it means manual changes were made in AWS Console.

### 4.6 Confirm SNS Email Subscriptions

**IMPORTANT**: Check your email inbox for SNS subscription confirmation emails.

1. Check email for messages from AWS Notifications
2. Click "Confirm subscription" link in each email
3. You should receive 3 emails:
   - Critical alerts topic
   - Warning alerts topic
   - Billing alerts topic

**Until confirmed, you will NOT receive alerts!**

---

## Step 5: 🎉 Infrastructure Is Live!

### 5.1 Get Resource Endpoints

```bash
# Get RDS endpoint
aws rds describe-db-instances \
  --db-instance-identifier showcore-database-production-rds \
  --query 'DBInstances[0].Endpoint.Address' \
  --output text

# Get ElastiCache endpoint
aws elasticache describe-cache-clusters \
  --cache-cluster-id showcore-redis \
  --show-cache-node-info \
  --query 'CacheClusters[0].CacheNodes[0].Endpoint.Address' \
  --output text

# Get CloudFront distribution domain
aws cloudfront list-distributions \
  --query 'DistributionList.Items[?Comment==`ShowCore Static Assets CDN`].DomainName' \
  --output text
```

Save these endpoints for application configuration.

### 5.2 Review CloudWatch Dashboard

1. Go to CloudWatch Console → Dashboards
2. Open "ShowCore-Phase1-Dashboard"
3. Review initial metrics (may take 5-10 minutes to populate)

### 5.3 Verify Cost Allocation Tags

1. Go to AWS Billing Console → Cost Allocation Tags
2. Activate these tags:
   - Project
   - Phase
   - Environment
   - ManagedBy
   - CostCenter
   - Component
3. Wait 24 hours for tags to appear in Cost Explorer

### 5.4 Enable Cost Explorer (If Not Already Enabled)

1. Go to AWS Billing Console
2. Navigate to Cost Explorer
3. Click "Enable Cost Explorer"
4. Wait 24 hours for data to populate

---

## Step 6: Integration Testing (Next Task)

Now that infrastructure is deployed, proceed to Task 14 for integration testing:

- Test RDS connectivity from private subnet
- Test ElastiCache connectivity from private subnet
- Test VPC Endpoints functionality
- Test S3 and CloudFront integration
- Test backup and restore procedures

---

## Troubleshooting

### Issue: "Need to perform AWS calls for account XXX, but no credentials configured"

**Solution**:
```bash
aws configure
# Enter your AWS credentials
```

### Issue: "This stack uses assets, so the toolkit stack must be deployed"

**Solution**:
```bash
cdk bootstrap aws://YOUR_ACCOUNT_ID/us-east-1
```

### Issue: "Resource limit exceeded"

**Solution**:
- Check AWS service quotas in Service Quotas console
- Request quota increase if needed
- Common limits: VPCs (5), Elastic IPs (5), VPC Endpoints (20)

### Issue: "Insufficient permissions"

**Solution**:
- Verify showcore-app IAM user has ShowCoreDeploymentPolicy attached
- Review IAM policy in `showcore-iam-policy.json`
- Contact AWS administrator if permissions are missing

### Issue: "Stack rollback due to resource creation failure"

**Solution**:
1. Check CloudFormation events for specific error
2. Common issues:
   - RDS: Insufficient storage or invalid parameter
   - ElastiCache: Invalid node type or subnet group
   - CloudFront: Invalid origin configuration
3. Fix issue and redeploy:
   ```bash
   cdk deploy --all --require-approval never
   ```

### Issue: "Email subscriptions not confirmed"

**Solution**:
- Check spam folder for AWS Notifications emails
- Resend confirmation:
  ```bash
  aws sns subscribe \
    --topic-arn arn:aws:sns:us-east-1:ACCOUNT_ID:showcore-critical-alerts \
    --protocol email \
    --notification-endpoint your-email@example.com
  ```

---

## Cost Monitoring

### Expected Costs

**During Free Tier (First 12 Months)**:
- RDS db.t3.micro: $0 (750 hours/month free)
- ElastiCache cache.t3.micro: $0 (750 hours/month free)
- VPC Endpoints (Interface): ~$21-28/month
- VPC Endpoints (Gateway): $0 (FREE)
- S3 Storage: ~$1-5/month
- CloudFront: ~$1-5/month
- Data Transfer: ~$0-5/month
- CloudWatch: ~$0-5/month
- **Total: ~$3-10/month**

**After Free Tier (Month 13+)**:
- RDS db.t3.micro: ~$15/month
- ElastiCache cache.t3.micro: ~$12/month
- VPC Endpoints (Interface): ~$21-28/month
- Other costs remain the same
- **Total: ~$49-60/month**

### Monitor Costs

```bash
# Check current month costs
aws ce get-cost-and-usage \
  --time-period Start=2026-02-01,End=2026-02-28 \
  --granularity MONTHLY \
  --metrics BlendedCost \
  --output table
```

### Billing Alerts

You will receive email alerts when:
- Monthly costs exceed $50 (warning)
- Monthly costs exceed $100 (critical)

---

## Cleanup (If Needed)

To destroy all infrastructure:

```bash
# Destroy all stacks (WARNING: This deletes everything!)
cdk destroy --all

# Confirm each stack deletion when prompted
```

**Note**: Some resources may require manual deletion:
- S3 buckets with objects (must empty first)
- CloudTrail logs (must delete manually)
- RDS snapshots (must delete manually)

---

## Next Steps

1. ✅ Mark Task 13.1 as completed
2. ➡️ Proceed to Task 14: Integration Testing
3. ➡️ Test RDS connectivity
4. ➡️ Test ElastiCache connectivity
5. ➡️ Test VPC Endpoints
6. ➡️ Test CloudFront and S3 integration
7. ➡️ Run property-based tests
8. ➡️ Document deployment results

---

## Summary

**What Was Deployed**:
- ✅ VPC with 4 subnets (2 public, 2 private)
- ✅ VPC Endpoints (Gateway: S3, DynamoDB; Interface: CloudWatch, SSM)
- ✅ NO NAT Gateway (cost savings: ~$32/month)
- ✅ Security groups with least privilege
- ✅ CloudTrail audit logging
- ✅ RDS PostgreSQL 16 (db.t3.micro, Free Tier)
- ✅ ElastiCache Redis 7 (cache.t3.micro, Free Tier)
- ✅ S3 buckets with versioning and encryption
- ✅ CloudFront CDN distribution
- ✅ CloudWatch monitoring and alarms
- ✅ AWS Backup plans

**Cost Optimization Achieved**:
- ✅ NO NAT Gateway: ~$32/month savings
- ✅ Free Tier instances: $0 for 12 months
- ✅ Gateway Endpoints: FREE
- ✅ Single-AZ deployment: 50% cost reduction
- ✅ AWS managed encryption: No KMS costs
- ✅ **Net savings: ~$4-11/month vs NAT Gateway architecture**

**Estimated Monthly Cost**:
- During Free Tier: ~$3-10/month
- After Free Tier: ~$49-60/month

🎉 **Congratulations! Your ShowCore Phase 1 infrastructure is now live in AWS!** 🎉

---

**Last Updated**: February 4, 2026
**Task**: 13.1 Deploy complete infrastructure to AWS
**Status**: Ready for deployment
