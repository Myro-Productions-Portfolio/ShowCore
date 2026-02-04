# ShowCore AWS Architecture Overview

## Introduction

This document provides a high-level overview of the ShowCore AWS infrastructure architecture for Phase 1. For detailed technical documentation, see the [infrastructure directory](infrastructure/).

## Architecture Diagrams

### Complete Architecture
![ShowCore Phase 1 Architecture](infrastructure/showcore_phase1_architecture.png)

### Network Flow & Cost Optimization
![ShowCore Network Flow](infrastructure/showcore_network_flow.png)

## Key Architecture Decisions

### 1. Cost-Optimized VPC Endpoints Architecture

**Decision**: Use VPC Endpoints instead of NAT Gateway for AWS service access.

**Rationale**:
- NAT Gateway costs ~$32/month + data processing charges
- VPC Endpoints: Gateway Endpoints FREE, Interface Endpoints ~$7/month each
- Net savings: ~$11/month
- Better security: Private subnets have NO internet access

**Trade-offs**:
- ✅ Lower cost
- ✅ Better security (no internet access)
- ✅ More hands-on management experience
- ⚠️ Manual management required for some operations
- ⚠️ Limited to AWS services accessible via VPC Endpoints

### 2. Single-AZ Deployment

**Decision**: Deploy RDS and ElastiCache in single availability zone (us-east-1a).

**Rationale**:
- Cost optimization for low-traffic project website
- Multi-AZ doubles costs (~$30/month for RDS, ~$24/month for ElastiCache)
- Automated backups provide recovery capability
- Can enable Multi-AZ later if traffic increases

**Trade-offs**:
- ✅ 50% cost reduction
- ✅ Acceptable for low-traffic project
- ⚠️ Downtime during AZ failure (acceptable for portfolio project)
- ⚠️ Manual failover required

### 3. Free Tier Eligible Instances

**Decision**: Use db.t3.micro (RDS) and cache.t3.micro (ElastiCache).

**Rationale**:
- Free Tier eligible: 750 hours/month for 12 months
- Sufficient for low-traffic project website
- Can scale up if needed

**Trade-offs**:
- ✅ $0 cost during Free Tier (12 months)
- ✅ ~$27/month after Free Tier (vs ~$60+ for larger instances)
- ⚠️ Limited resources (1 GB RAM for RDS, 0.5 GB for ElastiCache)

## Infrastructure Components

### Network Layer
- **VPC**: 10.0.0.0/16 (65,536 IPs)
- **Public Subnets**: 2 subnets across 2 AZs (future ALB)
- **Private Subnets**: 2 subnets across 2 AZs (RDS, ElastiCache, future app tier)
- **Internet Gateway**: Public subnet internet access
- **NO NAT Gateway**: Cost optimization

### VPC Endpoints
- **Gateway Endpoints (FREE)**: S3, DynamoDB
- **Interface Endpoints (~$7/month each)**: CloudWatch Logs, CloudWatch Monitoring, Systems Manager

### Data Layer
- **RDS PostgreSQL 16**: db.t3.micro, 20 GB storage, single-AZ
- **ElastiCache Redis 7**: cache.t3.micro, single node

### Storage & CDN
- **S3 Buckets**: Static assets, backups, CloudTrail logs (all versioned)
- **CloudFront**: PriceClass_100 (North America, Europe only)

### Security & Compliance
- **CloudTrail**: All regions, log file validation
- **AWS Config**: Compliance monitoring
- **Security Groups**: Least privilege access

### Monitoring & Alerting
- **CloudWatch**: Dashboard, alarms, metrics
- **SNS**: Critical, warning, billing alerts

### Backup & DR
- **AWS Backup**: Daily backups, 7-day retention
- **RDS**: Point-in-time recovery (5-minute granularity)
- **ElastiCache**: Daily snapshots

## Cost Breakdown

### During Free Tier (Months 1-12)
```
RDS db.t3.micro:              $0 (Free Tier)
ElastiCache cache.t3.micro:   $0 (Free Tier)
VPC Endpoints (Gateway):      $0 (FREE)
VPC Endpoints (Interface):    ~$21/month
S3 Storage:                   ~$1-5/month
CloudFront:                   ~$1-5/month
Other:                        ~$0-5/month
─────────────────────────────────────────
Total:                        ~$3-10/month
```

### After Free Tier (Month 13+)
```
RDS db.t3.micro:              ~$15/month
ElastiCache cache.t3.micro:   ~$12/month
VPC Endpoints:                ~$21/month
Other:                        ~$1-12/month
─────────────────────────────────────────
Total:                        ~$49-60/month
```

### Cost Comparison
| Architecture | Monthly Cost | Notes |
|--------------|--------------|-------|
| NAT Gateway | ~$32/month | Traditional approach |
| VPC Endpoints | ~$21/month | Our approach |
| **Savings** | **~$11/month** | **~34% reduction** |

## Security Architecture

### Network Security
- Private subnets have NO internet access
- Security groups follow least privilege principle
- VPC Endpoints provide secure AWS service access

### Data Security
- Encryption at rest: SSE-S3 (S3), AWS managed keys (RDS, ElastiCache)
- Encryption in transit: TLS 1.2+ for all connections
- SSL/TLS required for RDS connections

### Access Control
- IAM roles with least privilege policies
- MFA required for sensitive operations
- CloudTrail logging all API calls

### Compliance
- AWS Config for continuous compliance monitoring
- CloudTrail for audit logging
- Security group rules validated by property tests

## High Availability & Disaster Recovery

### Availability
- Multi-AZ VPC (us-east-1a, us-east-1b)
- Single-AZ resources (cost optimization)
- Automated backups for recovery

### Backup Strategy
- **RDS**: Daily automated backups, 7-day retention, point-in-time recovery
- **ElastiCache**: Daily snapshots, 7-day retention
- **S3**: Versioning enabled, lifecycle policies

### Recovery Objectives
- **RDS**: RTO < 30 minutes, RPO < 5 minutes
- **ElastiCache**: RTO < 15 minutes, RPO < 24 hours
- **S3**: RTO < 5 minutes, RPO = 0

## Deployment

### Prerequisites
1. AWS Account with appropriate permissions
2. AWS CLI v2 configured
3. Python 3.9+
4. Node.js 14+
5. AWS CDK CLI

### Deployment Steps
```bash
# 1. Bootstrap CDK (first time only)
cd infrastructure
cdk bootstrap aws://YOUR_ACCOUNT_ID/us-east-1

# 2. Install dependencies
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# 3. Configure context
# Edit cdk.json with your account ID and email addresses

# 4. Deploy all stacks
cdk deploy --all
```

### Stack Deployment Order
1. SecurityStack (CloudTrail, AWS Config)
2. MonitoringStack (SNS, billing alarms)
3. NetworkStack (VPC, subnets, VPC endpoints)
4. DatabaseStack (RDS PostgreSQL)
5. CacheStack (ElastiCache Redis)
6. StorageStack (S3 buckets)
7. CDNStack (CloudFront distribution)
8. BackupStack (AWS Backup plans)

## Monitoring & Operations

### CloudWatch Dashboard
- RDS metrics: CPU, connections, latency, storage
- ElastiCache metrics: CPU, memory, evictions, cache hit rate
- S3 metrics: Bucket size, requests, errors
- CloudFront metrics: Requests, data transfer, cache hit rate

### Alarms
- **Critical**: RDS CPU > 80%, ElastiCache memory > 80%
- **Warning**: RDS storage < 15%, cache hit rate < 80%
- **Billing**: Charges > $50, charges > $100

### Logging
- CloudTrail: All API calls to S3
- RDS logs: Error logs, slow query logs to CloudWatch
- ElastiCache logs: Slow logs to CloudWatch
- VPC Flow Logs: Optional (can add later)

## Future Enhancements

### Phase 2: Application Tier
- Application Load Balancer in public subnets
- ECS Fargate or EC2 instances in private subnets
- Auto Scaling based on traffic
- WAF for application protection

### Phase 3: Multi-AZ High Availability
- Enable RDS Multi-AZ deployment
- Add ElastiCache replicas
- Cross-region backup replication
- Route 53 health checks and failover

### Phase 4: Advanced Monitoring
- Enable VPC Flow Logs
- Enable GuardDuty for threat detection
- AWS Security Hub for centralized security
- X-Ray for distributed tracing

## Documentation

### Infrastructure Documentation
- [Complete Architecture Documentation](infrastructure/ARCHITECTURE.md)
- [Infrastructure README](infrastructure/README.md)
- [Quick Reference Guide](infrastructure/QUICK_REFERENCE.md)
- [Diagram Documentation](infrastructure/DIAGRAMS.md)

### Development Guidelines
- [IaC Standards](.kiro/steering/iac-standards.md)
- [AWS Well-Architected Guidelines](.kiro/steering/aws-well-architected.md)
- [Task Execution Guidelines](.kiro/steering/task-execution-guidelines.md)
- [GitHub Workflow](.kiro/steering/github-workflow.md)

### Testing Documentation
- [Testing Strategy](infrastructure/tests/README.md)
- [Unit Tests](infrastructure/tests/unit/)
- [Property Tests](infrastructure/tests/property/)
- [Integration Tests](infrastructure/tests/integration/)

## Support

### Contact Information
- **Critical Issues**: admin@showcore.com, oncall@showcore.com
- **Warnings**: devops@showcore.com
- **Billing**: finance@showcore.com

### Useful Links
- [AWS Console](https://console.aws.amazon.com/)
- [CloudWatch Dashboard](https://console.aws.amazon.com/cloudwatch/)
- [Cost Explorer](https://console.aws.amazon.com/cost-management/)
- [CloudTrail](https://console.aws.amazon.com/cloudtrail/)

## Conclusion

ShowCore Phase 1 establishes a cost-optimized, secure, and scalable AWS infrastructure foundation. The architecture prioritizes cost optimization while maintaining security and reliability appropriate for a low-traffic project website.

Key achievements:
- ✅ Cost-optimized architecture (~$3-10/month during Free Tier)
- ✅ Secure network design (no internet access from private subnets)
- ✅ Automated backups and disaster recovery
- ✅ Comprehensive monitoring and alerting
- ✅ Infrastructure as Code with AWS CDK
- ✅ Well-documented and maintainable

For detailed technical information, see the [infrastructure directory](infrastructure/).
