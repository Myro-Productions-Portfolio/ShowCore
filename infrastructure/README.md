# ShowCore AWS Infrastructure - Phase 1

This directory contains the AWS CDK infrastructure code for ShowCore Phase 1 migration.

## Overview

ShowCore Phase 1 establishes foundational AWS infrastructure using a **cost-optimized VPC Endpoints architecture** that eliminates NAT Gateways to save ~$32/month while maintaining secure AWS service access.

**Key Infrastructure Components:**
- **Network Infrastructure**: VPC with VPC Endpoints (no NAT Gateway)
- **Security & Audit**: CloudTrail, AWS Config, Security Groups
- **Database**: RDS PostgreSQL 16 (db.t3.micro, Free Tier eligible)
- **Cache**: ElastiCache Redis 7 (cache.t3.micro, Free Tier eligible)
- **Storage & CDN**: S3 buckets, CloudFront distribution
- **Monitoring**: CloudWatch dashboards, alarms, SNS topics
- **Backup**: AWS Backup plans for RDS and ElastiCache

**Cost Optimization Strategy:**
- NO NAT Gateway (saves ~$32/month)
- VPC Endpoints: Gateway Endpoints (FREE) + Interface Endpoints (~$7/month each)
- Free Tier eligible instances (db.t3.micro, cache.t3.micro)
- Single-AZ deployment for RDS and ElastiCache
- AWS managed encryption (SSE-S3, not KMS)
- CloudFront PriceClass_100 (lowest cost regions)
- **Net savings: ~$4-11/month vs NAT Gateway architecture**

**Estimated Monthly Cost:**
- During Free Tier (first 12 months): ~$3-10/month
- After Free Tier: ~$49-60/month

## Prerequisites

1. **AWS Account**: You need an AWS account with appropriate permissions
2. **AWS CLI**: Install and configure AWS CLI v2
   ```bash
   # Install AWS CLI (macOS)
   brew install awscli
   
   # Verify installation
   aws --version
   ```
3. **Python 3.9+**: Required for AWS CDK
   ```bash
   # Check Python version
   python3 --version
   ```
4. **Node.js 14+**: Required for AWS CDK CLI
   ```bash
   # Install Node.js (macOS)
   brew install node
   
   # Verify installation
   node --version
   ```
5. **AWS CDK CLI**: Install globally with npm
   ```bash
   npm install -g aws-cdk
   
   # Verify installation
   cdk --version
   ```

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

Edit `cdk.json` to set your AWS account ID and email addresses:

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

**Important**: 
- Replace `YOUR_AWS_ACCOUNT_ID` with your actual AWS account ID (12-digit number)
- Replace email addresses with your actual email addresses for alerts
- You can get your account ID with: `aws sts get-caller-identity --query Account --output text`

### 4. Bootstrap CDK (First Time Only)

Bootstrap CDK in your AWS account:

```bash
cdk bootstrap aws://YOUR_ACCOUNT_ID/us-east-1
```

This creates the necessary S3 bucket and IAM roles for CDK deployments.

## Deployment

### Pre-Deployment Checklist

Before deploying, verify:

- [ ] AWS credentials are configured correctly (`aws sts get-caller-identity`)
- [ ] `cdk.json` has correct account ID and email addresses
- [ ] You have reviewed the infrastructure code
- [ ] You understand the cost implications (~$3-10/month during Free Tier)
- [ ] You have run all tests (`pytest tests/unit/ -v`)

### Deployment Order

Stacks must be deployed in this order due to dependencies:

1. **SecurityStack** - CloudTrail, AWS Config (no dependencies)
2. **MonitoringStack** - SNS topics, billing alarms (no dependencies)
3. **NetworkStack** - VPC, subnets, VPC endpoints (no dependencies)
4. **DatabaseStack** - RDS PostgreSQL (depends on NetworkStack)
5. **CacheStack** - ElastiCache Redis (depends on NetworkStack)
6. **StorageStack** - S3 buckets (no dependencies)
7. **CDNStack** - CloudFront distribution (depends on StorageStack)
8. **BackupStack** - AWS Backup plans (depends on DatabaseStack, CacheStack)

### Deploy Individual Stacks

#### 1. Deploy Security Stack (Task 1.3)

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

#### 2. Deploy Monitoring Stack (Task 1.2)

```bash
# Validate CDK code
cdk synth ShowCoreMonitoringStack

# Preview changes
cdk diff ShowCoreMonitoringStack

# Deploy the stack
cdk deploy ShowCoreMonitoringStack

# IMPORTANT: Confirm email subscriptions
# Check your email and confirm SNS subscriptions for alerts
```

**What gets deployed:**
- SNS topics for critical, warning, and billing alerts
- CloudWatch billing alarms at $50 and $100 thresholds
- Email subscriptions (requires confirmation)

**Cost**: SNS email notifications are free. CloudWatch alarms are $0.10 each.

#### 3. Deploy Network Stack (Task 3.x)

```bash
# Validate CDK code
cdk synth ShowCoreNetworkStack

# Preview changes
cdk diff ShowCoreNetworkStack

# Deploy the stack
cdk deploy ShowCoreNetworkStack
```

**What gets deployed:**
- VPC (10.0.0.0/16)
- 2 Public Subnets (10.0.0.0/24, 10.0.1.0/24)
- 2 Private Subnets (10.0.2.0/24, 10.0.3.0/24)
- Internet Gateway
- NO NAT Gateway (cost optimization)
- S3 Gateway Endpoint (FREE)
- DynamoDB Gateway Endpoint (FREE)
- CloudWatch Logs Interface Endpoint (~$7/month)
- CloudWatch Monitoring Interface Endpoint (~$7/month)
- Systems Manager Interface Endpoint (~$7/month)

**Cost**: VPC is free. Interface Endpoints cost ~$7/month each. Gateway Endpoints are FREE.

#### 4. Deploy Database Stack (Task 5.x)

```bash
# Validate CDK code
cdk synth ShowCoreDatabaseStack

# Preview changes
cdk diff ShowCoreDatabaseStack

# Deploy the stack
cdk deploy ShowCoreDatabaseStack
```

**What gets deployed:**
- RDS PostgreSQL 16 instance (db.t3.micro)
- RDS subnet group in private subnets
- RDS parameter group with SSL/TLS enforcement
- RDS security group (PostgreSQL 5432 from application tier)
- Automated daily backups (7-day retention)
- CloudWatch alarms for CPU and storage

**Cost**: Free Tier eligible (750 hours/month for 12 months). After: ~$15/month.

#### 5. Deploy Cache Stack (Task 6.x)

```bash
# Validate CDK code
cdk synth ShowCoreCacheStack

# Preview changes
cdk diff ShowCoreCacheStack

# Deploy the stack
cdk deploy ShowCoreCacheStack
```

**What gets deployed:**
- ElastiCache Redis 7 cluster (cache.t3.micro)
- ElastiCache subnet group in private subnets
- ElastiCache parameter group with TLS enforcement
- ElastiCache security group (Redis 6379 from application tier)
- Automated daily snapshots (7-day retention)
- CloudWatch alarms for CPU and memory

**Cost**: Free Tier eligible (750 hours/month for 12 months). After: ~$12/month.

#### 6. Deploy Storage Stack (Task 8.x)

```bash
# Validate CDK code
cdk synth ShowCoreStorageStack

# Preview changes
cdk diff ShowCoreStorageStack

# Deploy the stack
cdk deploy ShowCoreStorageStack
```

**What gets deployed:**
- S3 bucket for static assets with versioning
- S3 bucket for backups with versioning
- SSE-S3 encryption at rest
- Lifecycle policies (transition to Glacier after 30 days, delete after 90 days)
- Bucket policies for private access

**Cost**: First 5 GB free. Then ~$0.023/GB/month.

#### 7. Deploy CDN Stack (Task 9.x)

```bash
# Validate CDK code
cdk synth ShowCoreCDNStack

# Preview changes
cdk diff ShowCoreCDNStack

# Deploy the stack
cdk deploy ShowCoreCDNStack
```

**What gets deployed:**
- CloudFront distribution with S3 origin
- Origin Access Control (OAC) for secure S3 access
- HTTPS-only viewer protocol
- PriceClass_100 (North America and Europe only)
- Automatic compression enabled

**Cost**: First 1 TB data transfer free. Then ~$0.085/GB.

#### 8. Deploy Backup Stack (Task 11.x)

```bash
# Validate CDK code
cdk synth ShowCoreBackupStack

# Preview changes
cdk diff ShowCoreBackupStack

# Deploy the stack
cdk deploy ShowCoreBackupStack
```

**What gets deployed:**
- AWS Backup vault with encryption
- Backup plans for RDS (daily, 7-day retention)
- Backup plans for ElastiCache (daily, 7-day retention)
- Backup failure alarms

**Cost**: Backup storage costs ~$0.05/GB/month.

### Deploy All Stacks

Once all stacks are implemented, deploy everything at once:

```bash
# Deploy all stacks in correct order
cdk deploy --all

# Deploy with approval for security changes
cdk deploy --all --require-approval any-change

# Deploy with specific context
cdk deploy --all --context environment=production
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

### Review Costs

```bash
# Check current month costs
aws ce get-cost-and-usage \
  --time-period Start=2026-02-01,End=2026-02-28 \
  --granularity MONTHLY \
  --metrics BlendedCost

# Check costs by service
aws ce get-cost-and-usage \
  --time-period Start=2026-02-01,End=2026-02-28 \
  --granularity MONTHLY \
  --metrics BlendedCost \
  --group-by Type=DIMENSION,Key=SERVICE
```

## VPC Endpoints Architecture

ShowCore uses **VPC Endpoints instead of NAT Gateways** for cost optimization and better security.

### Why VPC Endpoints?

**Cost Savings:**
- NAT Gateway: ~$32/month + data processing charges
- VPC Endpoints: Gateway Endpoints FREE, Interface Endpoints ~$7/month each
- **Net savings: ~$4-11/month**

**Security Benefits:**
- Private subnets have NO internet access
- AWS service traffic stays within AWS network
- No exposure to internet threats

**Management Trade-offs:**
- Manual patching required for RDS/ElastiCache (AWS manages automatically)
- Application instances cannot download packages from internet
- No access to third-party APIs from private subnets

### VPC Endpoint Types

#### Gateway Endpoints (FREE)

Gateway Endpoints use route table entries to route traffic to AWS services.

- **S3 Gateway Endpoint**: Access S3 for backups, logs, static assets
- **DynamoDB Gateway Endpoint**: Reserved for future use

**Cost**: FREE (no charges)

#### Interface Endpoints (~$7/month each)

Interface Endpoints use Elastic Network Interfaces (ENIs) with private IP addresses.

- **CloudWatch Logs**: Send logs from RDS, ElastiCache, applications
- **CloudWatch Monitoring**: Send metrics and alarms
- **Systems Manager**: Session Manager access without SSH keys
- **Secrets Manager** (optional): Retrieve database credentials

**Cost**: ~$7/month per endpoint + data processing charges

### Private Subnet Routing

Private subnets have **NO internet access**. All AWS service traffic routes through VPC Endpoints:

```
Private Subnet Route Table:
- 10.0.0.0/16 → local (VPC traffic)
- pl-63a5400a → vpce-s3 (S3 Gateway Endpoint)
- pl-02cd2c6b → vpce-dynamodb (DynamoDB Gateway Endpoint)
- NO default route (0.0.0.0/0) to NAT Gateway or Internet Gateway
```

### Management Implications

**RDS and ElastiCache Patching:**
- AWS manages patching automatically during maintenance windows
- No action required from operators

**Application Updates:**
- Use S3 to host packages, access via S3 Gateway Endpoint
- Use Systems Manager to manage instances
- Pre-bake AMIs with required packages

**Third-Party APIs:**
- Use API Gateway or Lambda in public subnets as proxy
- Add NAT Gateway if external API access becomes critical
- Trade-off: Acceptable for Phase 1 (data layer only)

## Cost Optimization

### Cost Breakdown

**During Free Tier (First 12 Months):**
- RDS db.t3.micro: $0 (750 hours/month free)
- ElastiCache cache.t3.micro: $0 (750 hours/month free)
- VPC Endpoints (Interface): ~$21-28/month (3-4 endpoints × $7/month)
- VPC Endpoints (Gateway): $0 (FREE)
- S3 Storage: ~$1-5/month (first 5 GB free)
- CloudFront: ~$1-5/month (first 1 TB free)
- Data Transfer: ~$0-5/month (first 100 GB free)
- CloudWatch: ~$0-5/month (basic metrics free)
- **Total: ~$3-10/month**

**After Free Tier (Month 13+):**
- RDS db.t3.micro: ~$15/month
- ElastiCache cache.t3.micro: ~$12/month
- VPC Endpoints (Interface): ~$21-28/month
- VPC Endpoints (Gateway): $0 (FREE)
- S3 Storage: ~$1-5/month
- CloudFront: ~$1-5/month
- Data Transfer: ~$0-5/month
- CloudWatch: ~$0-5/month
- **Total: ~$49-60/month**

### Cost Optimization Measures

- ✅ NO NAT Gateway (saves ~$32/month)
- ✅ Free Tier eligible instances (db.t3.micro, cache.t3.micro)
- ✅ Single-AZ deployment (saves 50% on RDS/ElastiCache)
- ✅ Gateway Endpoints for S3/DynamoDB (FREE)
- ✅ Minimal Interface Endpoints (only essential services)
- ✅ S3 SSE-S3 encryption (not KMS, saves ~$1/key/month)
- ✅ CloudFront PriceClass_100 (lowest cost regions)
- ✅ Short backup retention (7 days)
- ✅ CloudWatch log retention (7 days)
- ✅ Minimal CloudWatch alarms (only critical ones)

### Cost Comparison

| Item | NAT Gateway Architecture | VPC Endpoint Architecture | Savings |
|------|-------------------------|---------------------------|---------|
| NAT Gateway | ~$32/month | $0 | +$32 |
| Gateway Endpoints | $0 | $0 | $0 |
| Interface Endpoints (3-4) | $0 | ~$21-28/month | -$21-28 |
| **Net Monthly Cost** | **~$32/month** | **~$21-28/month** | **~$4-11/month** |
| **Security** | Internet access | No internet access | Better |
| **Management** | Automatic updates | Manual management | More hands-on |

## Testing

ShowCore infrastructure uses a comprehensive testing framework with three types of tests to ensure correctness. The testing framework is configured with pytest and includes utilities for AWS resource validation.

### Testing Framework Setup

The testing framework includes:
- **pytest**: Test runner with configuration in `pytest.ini`
- **aws-cdk.assertions**: CDK template validation for unit tests
- **hypothesis**: Property-based testing framework
- **boto3**: AWS SDK for integration and property tests
- **Test utilities**: Helper functions in `tests/utils.py` for AWS resource validation

See `tests/README.md` for complete testing documentation.

### 1. Unit Tests

Unit tests validate CDK stack configurations and resource properties using CDK assertions.

```bash
# Run all unit tests
pytest tests/unit/ -v

# Run specific test file
pytest tests/unit/test_network_stack.py -v

# Run with coverage
pytest tests/unit/ --cov=lib --cov-report=html

# View coverage report
open htmlcov/index.html
```

**What unit tests verify:**
- Resources exist with correct properties
- Cost optimization measures (no NAT Gateway, Free Tier instances)
- Security configurations (encryption, security groups)
- Resource naming conventions
- Standard tagging compliance

**Example unit test:**
```python
def test_no_nat_gateway_deployed():
    """Test NO NAT Gateway is deployed (cost optimization)."""
    app = cdk.App()
    stack = ShowCoreNetworkStack(app, "TestStack")
    template = Template.from_stack(stack)
    
    # Assert NAT Gateway does NOT exist
    template.resource_count_is("AWS::EC2::NatGateway", 0)
```

### 2. Property-Based Tests

Property-based tests verify universal correctness properties that must hold for ALL resources using Hypothesis.

```bash
# Run all property tests
pytest tests/property/ -v -m property

# Run specific property test
pytest tests/property/test_security_groups.py -v
```

**What property tests verify:**
- Security group least privilege (no 0.0.0.0/0 on sensitive ports)
- Resource tagging compliance (all required tags present)
- Encryption at rest enabled for all data resources
- Encryption in transit enforced

**Example property test:**
```python
from tests.utils import AWSResourceValidator

def test_security_group_least_privilege():
    """
    Property: No security group allows 0.0.0.0/0 access on sensitive ports.
    
    Validates: Requirements 6.2
    """
    validator = AWSResourceValidator(region='us-east-1')
    
    # Get all security groups in ShowCore VPC
    vpc = validator.get_vpc_by_tag('Project', 'ShowCore')
    if not vpc:
        pytest.skip("ShowCore VPC not found")
    
    security_groups = validator.get_security_groups_by_vpc(vpc['VpcId'])
    
    sensitive_ports = [22, 5432, 6379]  # SSH, PostgreSQL, Redis
    
    for sg in security_groups:
        for port in sensitive_ports:
            has_open_rule = validator.check_security_group_rule(
                sg['GroupId'],
                port,
                cidr='0.0.0.0/0'
            )
            assert not has_open_rule, \
                f"Security group {sg['GroupId']} allows 0.0.0.0/0 on port {port}"
```

### 3. Integration Tests

Integration tests verify connectivity and functionality between deployed components.

```bash
# Run all integration tests (requires deployed infrastructure)
pytest tests/integration/ -v -m integration

# Run specific integration test
pytest tests/integration/test_rds_connectivity.py -v
```

**What integration tests verify:**
- RDS connectivity from private subnet
- ElastiCache connectivity from private subnet
- VPC Endpoints functionality (S3, CloudWatch, Systems Manager)
- S3 and CloudFront integration
- Backup and restore procedures

**Example integration test:**
```python
from tests.utils import AWSResourceValidator

def test_rds_connectivity():
    """Test RDS PostgreSQL is accessible from private subnet."""
    validator = AWSResourceValidator(region='us-east-1')
    
    # Get RDS instance endpoint
    db_instance = validator.get_rds_instance('showcore-database-production-rds')
    if not db_instance:
        pytest.skip("RDS instance not found")
    
    endpoint = db_instance['Endpoint']['Address']
    port = db_instance['Endpoint']['Port']
    
    # Test connection with SSL required
    # (Implementation requires temporary EC2 instance in private subnet)
    pass
```

### Test Utilities

The `tests/utils.py` module provides helper functions for integration and property-based tests:

```python
from tests.utils import AWSResourceValidator, get_account_id

# Initialize validator
validator = AWSResourceValidator(region='us-east-1')

# VPC and Network
vpc = validator.get_vpc_by_tag('Project', 'ShowCore')
security_groups = validator.get_security_groups_by_vpc(vpc['VpcId'])
vpc_endpoints = validator.get_vpc_endpoints(vpc['VpcId'])

# RDS
rds_instance = validator.get_rds_instance('showcore-database-production-rds')
is_encrypted = validator.check_rds_encryption('showcore-database-production-rds')

# ElastiCache
cache_cluster = validator.get_elasticache_cluster('showcore-redis')
encryption = validator.check_elasticache_encryption('showcore-redis')

# S3
encryption_algo = validator.get_bucket_encryption('showcore-backups-123456789012')
has_versioning = validator.check_bucket_versioning('showcore-backups-123456789012')

# Resource Tagging
resources = validator.get_resources_by_tag('Project', 'ShowCore')
tag_status = validator.check_resource_tags(resource_arn, ['Project', 'Phase'])
```

### Run All Tests

```bash
# Run all tests (unit, property, integration)
pytest tests/ -v

# Run with coverage
pytest tests/ --cov=lib --cov-report=html

# Run with verbose output
pytest tests/ -vv

# Run specific test by name
pytest tests/ -k "test_no_nat_gateway"

# Run tests by marker
pytest tests/ -v -m unit           # Unit tests only
pytest tests/ -v -m property       # Property tests only
pytest tests/ -v -m integration    # Integration tests only
```

### Test Coverage Requirements

- **Unit tests**: 100% of stacks must have tests
- **Property tests**: All universal properties must be tested
- **Integration tests**: All connectivity paths must be tested
- **Minimum coverage**: 80% code coverage for stack definitions

### Pytest Configuration

The testing framework is configured in `pytest.ini` with:
- Test discovery patterns
- Test markers (unit, property, integration, slow, aws)
- Coverage reporting options
- Hypothesis settings for property-based testing
- Console output formatting

See `pytest.ini` for complete configuration details.

## Management

### Update Stack

To update infrastructure:

```bash
# Make changes to code
# ...

# Run tests
pytest tests/unit/ -v

# Preview changes
cdk diff ShowCoreNetworkStack

# Deploy changes
cdk deploy ShowCoreNetworkStack
```

### Destroy Stack

To remove infrastructure:

```bash
# Destroy specific stack
cdk destroy ShowCoreNetworkStack

# Destroy all stacks
cdk destroy --all
```

**Warning**: This will delete all resources. Ensure you have backups if needed.

### View Stack Outputs

```bash
# List all stacks
cdk list

# View stack outputs
aws cloudformation describe-stacks \
  --stack-name ShowCoreNetworkStack \
  --query 'Stacks[0].Outputs'
```

### Validate Infrastructure

```bash
# Validate CDK code
cdk synth

# Run linter
pylint lib/ tests/

# Run type checker
mypy lib/ tests/

# Run security checks
cfn-lint cdk.out/*.template.json
```

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

**Solution**: 
- Check email and confirm SNS subscription
- Check spam folder
- Verify email address in `cdk.json` is correct

### Issue: "Billing alarms not triggering"

**Solution**: 
- Billing metrics are only available in us-east-1
- Wait 6 hours for billing data to update
- Verify alarm threshold is set correctly
- Check CloudWatch alarm status in console

### Issue: "VPC Endpoint not accessible from private subnet"

**Solution**:
- Verify VPC Endpoint status is "available"
- Check security group allows HTTPS (443) from VPC CIDR
- Verify private DNS is enabled for Interface Endpoints
- Check route table has correct routes for Gateway Endpoints
- Test DNS resolution: `nslookup s3.amazonaws.com`

### Issue: "RDS connection timeout from private subnet"

**Solution**:
- Verify RDS security group allows PostgreSQL (5432) from application security group
- Verify RDS is in private subnet
- Verify application is in same VPC
- Test connectivity: `telnet <rds-endpoint> 5432`

### Issue: "CDK diff shows unexpected changes"

**Solution**:
- Review CloudFormation drift detection
- Check if manual changes were made in console
- Verify `cdk.json` context values are correct
- Run `cdk synth` to regenerate templates

### Issue: "Tests failing after deployment"

**Solution**:
- Wait 5-10 minutes for resources to be fully available
- Verify resources are in "available" state
- Check CloudWatch Logs for errors
- Review CloudFormation events for deployment issues

## Project Structure

```
infrastructure/
├── app.py                      # CDK app entry point
├── cdk.json                    # CDK configuration
├── requirements.txt            # Python dependencies
├── requirements-dev.txt        # Development dependencies (includes pytest, hypothesis)
├── README.md                   # This file
│
├── lib/                        # CDK constructs and stacks
│   ├── __init__.py
│   ├── stacks/                 # Stack definitions
│   │   ├── __init__.py
│   │   ├── network_stack.py    # VPC, subnets, VPC endpoints (Task 3.x)
│   │   ├── security_stack.py   # CloudTrail, AWS Config, Security Groups (Task 1.3, 4.x)
│   │   ├── database_stack.py   # RDS PostgreSQL (Task 5.x)
│   │   ├── cache_stack.py      # ElastiCache Redis (Task 6.x)
│   │   ├── storage_stack.py    # S3 buckets (Task 8.x)
│   │   ├── cdn_stack.py        # CloudFront distribution (Task 9.x)
│   │   ├── monitoring_stack.py # CloudWatch, SNS, alarms (Task 1.2, 10.x)
│   │   └── backup_stack.py     # AWS Backup plans (Task 11.x)
│   │
│   └── constructs/             # Reusable constructs
│       ├── __init__.py
│       ├── vpc_endpoints.py    # VPC Endpoint constructs (future)
│       ├── tagged_resource.py  # Tagging utilities (future)
│       └── monitoring_alarms.py # Alarm constructs (future)
│
└── tests/                      # Test files
    ├── __init__.py
    ├── unit/                   # Unit tests (CDK template validation)
    │   ├── __init__.py
    │   ├── test_network_stack.py
    │   ├── test_security_stack.py
    │   ├── test_database_stack.py
    │   ├── test_cache_stack.py
    │   ├── test_storage_stack.py
    │   ├── test_cdn_stack.py
    │   ├── test_monitoring_stack.py
    │   └── test_backup_stack.py
    │
    ├── property/               # Property-based tests (universal properties)
    │   ├── __init__.py
    │   ├── test_security_groups.py  # No 0.0.0.0/0 on sensitive ports
    │   └── test_tagging.py          # All resources have required tags
    │
    └── integration/            # Integration tests (connectivity)
        ├── __init__.py
        ├── test_rds_connectivity.py
        ├── test_elasticache_connectivity.py
        ├── test_vpc_endpoints.py
        └── test_cloudfront_s3.py
```

## Cost Estimates

### Phase 1 Monthly Costs (During Free Tier)

- **CloudTrail**: Free (first trail)
- **S3 CloudTrail Logs**: ~$0.023/GB/month (minimal logs for Phase 1)
- **SNS Topics**: Free (email notifications)
- **CloudWatch Alarms**: Free (first 10 alarms)
- **Cost Explorer**: Free
- **VPC**: Free (VPC itself is free)
- **VPC Endpoints (Gateway)**: Free (S3, DynamoDB)
- **VPC Endpoints (Interface)**: ~$21-28/month (3-4 endpoints × $7/month)
- **RDS db.t3.micro**: $0 (750 hours/month free)
- **ElastiCache cache.t3.micro**: $0 (750 hours/month free)
- **S3 Storage**: ~$1-5/month (first 5 GB free)
- **CloudFront**: ~$1-5/month (first 1 TB free)
- **Data Transfer**: ~$0-5/month (first 100 GB free)
- **Total**: ~$3-10/month

### After Free Tier (Month 13+)

- **CloudTrail**: Free (first trail)
- **S3 CloudTrail Logs**: ~$0.023/GB/month
- **SNS Topics**: Free (email notifications)
- **CloudWatch Alarms**: $0.10 per alarm = ~$1-2/month
- **Cost Explorer**: Free
- **VPC**: Free
- **VPC Endpoints (Gateway)**: Free
- **VPC Endpoints (Interface)**: ~$21-28/month
- **RDS db.t3.micro**: ~$15/month
- **ElastiCache cache.t3.micro**: ~$12/month
- **S3 Storage**: ~$1-5/month
- **CloudFront**: ~$1-5/month
- **Data Transfer**: ~$0-5/month
- **Total**: ~$49-60/month

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
- [AWS CDK Best Practices](https://docs.aws.amazon.com/cdk/latest/guide/best-practices.html)
- [AWS Well-Architected Framework](https://aws.amazon.com/architecture/well-architected/)
- [AWS VPC Endpoints](https://docs.aws.amazon.com/vpc/latest/privatelink/vpc-endpoints.html)
- [AWS Billing Alarms](https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/monitor_estimated_charges_with_cloudwatch.html)
- [AWS Cost Explorer](https://aws.amazon.com/aws-cost-management/aws-cost-explorer/)
- [AWS Free Tier](https://aws.amazon.com/free/)

## Quick Reference

### Essential Commands

```bash
# Validate and test
cdk synth                          # Generate CloudFormation template
pylint lib/ tests/                 # Run linter
mypy lib/ tests/                   # Run type checker
pytest tests/ -v                   # Run all tests
cfn-lint cdk.out/*.template.json   # Validate CloudFormation

# Deploy
cdk bootstrap                      # Bootstrap CDK (first time)
cdk diff                           # Preview changes
cdk deploy --all                   # Deploy all stacks
cdk deploy ShowCoreNetworkStack    # Deploy specific stack

# Manage
cdk list                           # List all stacks
cdk destroy --all                  # Destroy all stacks
cdk doctor                         # Check CDK environment

# AWS CLI
aws sts get-caller-identity        # Check AWS credentials
aws cloudformation list-stacks     # List CloudFormation stacks
aws ec2 describe-vpcs              # List VPCs
aws rds describe-db-instances      # List RDS instances
aws elasticache describe-cache-clusters  # List ElastiCache clusters
```

### Resource Naming Convention

```
showcore-{component}-{environment}-{resource-type}

Components: network, database, cache, storage, cdn, monitoring, backup
Environments: production, staging, development
```

### Required Tags

```python
{
    "Project": "ShowCore",
    "Phase": "Phase1",
    "Environment": "Production",
    "ManagedBy": "CDK",
    "CostCenter": "Engineering"
}
```

### Testing Requirements

- Unit tests: 100% of stacks
- Property tests: All universal properties
- Integration tests: All connectivity paths
- Minimum coverage: 80%

## Support

For issues or questions:
1. Check this README
2. Review AWS CDK documentation
3. Check CloudFormation events in AWS Console
4. Review CloudWatch Logs for errors
5. Check `.kiro/specs/showcore-aws-migration-phase1/` for design docs and ADRs

## Security

### Secrets Management

**NEVER** commit sensitive data to version control:
- AWS credentials
- Account IDs (use context variables in `cdk.json`)
- Email addresses (use context variables in `cdk.json`)
- Database passwords (use AWS Secrets Manager)

### IAM Permissions

The showcore-app IAM user requires these permissions:
- CloudFormation (create/update/delete stacks)
- CloudTrail (create trails)
- S3 (create buckets, CDK asset bucket)
- SNS (create topics, subscriptions)
- CloudWatch (create alarms, dashboards)
- EC2 (create VPCs, subnets, security groups, VPC endpoints)
- RDS (create instances, parameter groups, subnet groups)
- ElastiCache (create clusters, parameter groups, subnet groups)
- CloudFront (create distributions)
- AWS Backup (create vaults, plans)

See `showcore-iam-policy.json` in project root for full policy.

---

**Last Updated**: 2026-02-03
**Phase**: Phase 1 - Complete Infrastructure Setup
**Status**: Task 2.1 Complete - CDK Project Structure Initialized
