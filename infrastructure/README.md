# ShowCore AWS Infrastructure

This directory contains the AWS CDK infrastructure code for ShowCore Phase 1 migration.

## Overview

ShowCore Phase 1 establishes foundational AWS infrastructure including:
- Security and audit logging (CloudTrail)
- Billing alerts and cost monitoring
- Network infrastructure (VPC, subnets, VPC endpoints)
- Database infrastructure (RDS PostgreSQL)
- Cache infrastructure (ElastiCache Redis)
- Storage and CDN (S3, CloudFront)
- Monitoring and alerting (CloudWatch, SNS)
- Backup and disaster recovery (AWS Backup)

## Prerequisites

1. **AWS Account**: You need an AWS account with appropriate permissions
2. **AWS CLI**: Install and configure AWS CLI v2
3. **Python 3.9+**: Required for AWS CDK
4. **Node.js 14+**: Required for AWS CDK CLI
5. **AWS CDK CLI**: Install globally with `npm install -g aws-cdk`

## Setup

### 1. Install Dependencies

```bash
cd infrastructure

# Create virtual environment
python3 -m venv .venv

# Activate virtual environment
source .venv/bin/activate  # On macOS/Linux
# .venv\Scripts\activate.bat  # On Windows

# Install Python dependencies
pip install -r requirements.txt

# Install development dependencies (for testing)
pip install -r requirements-dev.txt
```

### 2. Configure AWS Credentials

Ensure your AWS credentials are configured:

```bash
# Check current AWS identity
aws sts get-caller-identity

# Should show the showcore-app IAM user
# {
#   "UserId": "AIDAXXXXXXXXXXXXXXXXX",
#   "Account": "123456789012",
#   "Arn": "arn:aws:iam::123456789012:user/showcore-app"
# }
```

### 3. Configure CDK Context

Edit `cdk.json` to set your configuration:

```json
{
  "context": {
    "account": "YOUR_AWS_ACCOUNT_ID",
    "region": "us-east-1",
    "environment": "production",
    "alarm_email_addresses": [
      "your-email@example.com"
    ],
    "billing_alert_thresholds": [50, 100]
  }
}
```

**Important**: Replace `YOUR_AWS_ACCOUNT_ID` and email addresses with your actual values.

### 4. Bootstrap CDK (First Time Only)

Bootstrap CDK in your AWS account:

```bash
cdk bootstrap aws://YOUR_ACCOUNT_ID/us-east-1
```

This creates the necessary S3 bucket and IAM roles for CDK deployments.

## Deployment

### Pre-Deployment Checklist

Before deploying, verify:

- [ ] AWS credentials are configured correctly
- [ ] `cdk.json` has correct account ID and email addresses
- [ ] You have reviewed the infrastructure code
- [ ] You understand the cost implications (~$3-10/month during Free Tier)

### Deploy Security Stack (Task 1.3)

Deploy CloudTrail for audit logging:

```bash
# Validate CDK code
cdk synth ShowCoreSecurityStack

# Preview changes
cdk diff ShowCoreSecurityStack

# Deploy the stack
cdk deploy ShowCoreSecurityStack
```

**What gets deployed:**
- CloudTrail trail for all regions
- S3 bucket for CloudTrail logs with versioning
- Log file validation enabled
- SSE-S3 encryption at rest
- Lifecycle policies (transition to Glacier after 90 days, delete after 1 year)

**Cost**: First CloudTrail trail is free. S3 storage costs ~$0.023/GB/month.

### Deploy Monitoring Stack (Task 1.2)

Deploy billing alerts and cost monitoring:

```bash
# Validate CDK code
cdk synth ShowCoreMonitoringStack

# Preview changes
cdk diff ShowCoreMonitoringStack

# Deploy the stack
cdk deploy ShowCoreMonitoringStack

# Confirm email subscriptions
# Check your email and confirm SNS subscriptions
```

### Deploy All Stacks

Once all stacks are implemented:

```bash
# Deploy all stacks
cdk deploy --all

# Deploy with approval for security changes
cdk deploy --all --require-approval any-change
```

## Cost Monitoring

### Billing Alerts

The monitoring stack creates billing alarms at:
- **$50 threshold**: Warning alert (sent to warning alerts topic)
- **$100 threshold**: Critical alert (sent to billing alerts topic)

### Enable Cost Explorer

After deployment, enable Cost Explorer in AWS Console:

1. Go to AWS Billing Console
2. Navigate to Cost Explorer
3. Click "Enable Cost Explorer"
4. Wait 24 hours for data to populate

### Activate Cost Allocation Tags

Enable cost allocation tags for tracking:

1. Go to AWS Billing Console
2. Navigate to Cost Allocation Tags
3. Activate these tags:
   - `Project`
   - `Phase`
   - `Environment`
   - `ManagedBy`
   - `CostCenter`
   - `Component`
4. Wait 24 hours for tags to appear in Cost Explorer

## Testing

### Unit Tests

Run unit tests to verify stack configuration:

```bash
# Run all tests
pytest tests/unit/ -v

# Run specific test file
pytest tests/unit/test_monitoring_stack.py -v

# Run with coverage
pytest tests/unit/ --cov=lib --cov-report=html
```

### Validation

After deployment, verify:

```bash
# List all stacks
cdk list

# Check stack status
aws cloudformation describe-stacks --stack-name ShowCoreMonitoringStack

# Verify SNS topics
aws sns list-topics

# Verify CloudWatch alarms
aws cloudwatch describe-alarms --alarm-name-prefix showcore-billing
```

## Management

### Update Stack

To update infrastructure:

```bash
# Make changes to code
# ...

# Preview changes
cdk diff ShowCoreMonitoringStack

# Deploy changes
cdk deploy ShowCoreMonitoringStack
```

### Destroy Stack

To remove infrastructure:

```bash
# Destroy specific stack
cdk destroy ShowCoreMonitoringStack

# Destroy all stacks
cdk destroy --all
```

**Warning**: This will delete all resources. Ensure you have backups if needed.

## Troubleshooting

### Issue: "Need to perform AWS calls for account XXX, but no credentials configured"

**Solution**: Configure AWS credentials:
```bash
aws configure
# Or set environment variables:
export AWS_ACCESS_KEY_ID=your_access_key
export AWS_SECRET_ACCESS_KEY=your_secret_key
export AWS_DEFAULT_REGION=us-east-1
```

### Issue: "This stack uses assets, so the toolkit stack must be deployed"

**Solution**: Bootstrap CDK:
```bash
cdk bootstrap aws://YOUR_ACCOUNT_ID/us-east-1
```

### Issue: "Email subscription not receiving alerts"

**Solution**: Check email and confirm SNS subscription. Check spam folder.

### Issue: "Billing alarms not triggering"

**Solution**: 
- Billing metrics are only available in us-east-1
- Wait 6 hours for billing data to update
- Verify alarm threshold is set correctly

## Project Structure

```
infrastructure/
├── app.py                      # CDK app entry point
├── cdk.json                    # CDK configuration
├── requirements.txt            # Python dependencies
├── requirements-dev.txt        # Development dependencies
├── README.md                   # This file
│
├── lib/                        # CDK constructs and stacks
│   ├── __init__.py
│   ├── stacks/                 # Stack definitions
│   │   ├── __init__.py
│   │   ├── security_stack.py   # CloudTrail and audit logging
│   │   └── monitoring_stack.py # Monitoring and billing alerts
│   │
│   └── constructs/             # Reusable constructs (future)
│       └── __init__.py
│
└── tests/                      # Test files
    ├── __init__.py
    └── unit/                   # Unit tests
        ├── __init__.py
        ├── test_security_stack.py
        └── test_monitoring_stack.py
```

## Cost Estimates

### Phase 1 Monthly Costs (During Free Tier)

- **CloudTrail**: Free (first trail)
- **S3 CloudTrail Logs**: ~$0.023/GB/month (minimal logs for Phase 1)
- **SNS Topics**: Free (email notifications)
- **CloudWatch Alarms**: Free (first 10 alarms)
- **Cost Explorer**: Free
- **Total**: ~$0-1/month for security and monitoring

### After Free Tier (Month 13+)

- **CloudTrail**: Free (first trail)
- **S3 CloudTrail Logs**: ~$0.023/GB/month
- **SNS Topics**: Free (email notifications)
- **CloudWatch Alarms**: $0.10 per alarm = $0.20/month (2 alarms)
- **Cost Explorer**: Free
- **Total**: ~$0.20-1/month for security and monitoring

## Security

### Secrets Management

**NEVER** commit sensitive data to version control:
- AWS credentials
- Account IDs (use context variables)
- Email addresses (use context variables)

### IAM Permissions

The showcore-app IAM user requires these permissions:
- CloudFormation (create/update/delete stacks)
- CloudTrail (create trails)
- S3 (create buckets, CDK asset bucket)
- SNS (create topics, subscriptions)
- CloudWatch (create alarms)

See `showcore-iam-policy.json` in project root for full policy.

## Additional Resources

- [AWS CDK Documentation](https://docs.aws.amazon.com/cdk/latest/guide/home.html)
- [AWS CDK Python Reference](https://docs.aws.amazon.com/cdk/api/v2/python/)
- [AWS Billing Alarms](https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/monitor_estimated_charges_with_cloudwatch.html)
- [AWS Cost Explorer](https://aws.amazon.com/aws-cost-management/aws-cost-explorer/)

## Support

For issues or questions:
1. Check this README
2. Review AWS CDK documentation
3. Check CloudFormation events in AWS Console
4. Review CloudWatch Logs for errors

---

**Last Updated**: 2026-02-03
**Phase**: Phase 1 - Tasks 1.2 (Billing Alerts), 1.3 (CloudTrail Audit Logging)
