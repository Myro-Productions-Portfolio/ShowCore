# Cost Estimates - ShowCore AWS Migration Phase 1

## Overview

This document provides detailed cost estimates for Phase 1 of the ShowCore AWS Migration. Phase 1 establishes foundational infrastructure using a cost-optimized VPC Endpoints architecture that eliminates expensive NAT Gateways while maintaining secure AWS service access.

**Cost Optimization Philosophy:**
- Prioritize Free Tier eligible resources
- Use VPC Endpoints instead of NAT Gateway (~$32/month savings)
- Single-AZ deployment for low-traffic project website
- AWS managed encryption keys (no KMS costs)
- Minimal monitoring and logging (can expand later)

**Target Monthly Costs:**
- **During Free Tier (Months 1-12)**: ~$3-10/month
- **After Free Tier (Month 13+)**: ~$49-60/month

---

## Detailed Cost Breakdown by Service

### 1. VPC Endpoints: ~$21-28/month

VPC Endpoints provide secure, private connectivity to AWS services without requiring a NAT Gateway.

#### Gateway Endpoints (FREE)
- **S3 Gateway Endpoint**: $0/month
  - Used for: Backups, logs, static assets
  - Data processing: FREE
  - No hourly charges
  
- **DynamoDB Gateway Endpoint**: $0/month
  - Used for: Future application needs
  - Data processing: FREE
  - No hourly charges

**Gateway Endpoints Total: $0/month**

#### Interface Endpoints (~$7/month each)

Each Interface Endpoint costs approximately:
- **Hourly charge**: $0.01/hour × 730 hours = $7.30/month
- **Data processing**: $0.01/GB (first 1 GB free per AZ)

**Required Interface Endpoints:**

1. **CloudWatch Logs Interface Endpoint**: ~$7/month
   - Purpose: Send logs from RDS, ElastiCache, and future applications
   - Deployed in: 2 AZs (us-east-1a, us-east-1b)
   - Data processing: Minimal (~$0-1/month)

2. **CloudWatch Monitoring Interface Endpoint**: ~$7/month
   - Purpose: Send metrics and alarms from infrastructure
   - Deployed in: 2 AZs (us-east-1a, us-east-1b)
   - Data processing: Minimal (~$0-1/month)

3. **Systems Manager Interface Endpoint**: ~$7/month
   - Purpose: Session Manager access without SSH keys
   - Deployed in: 2 AZs (us-east-1a, us-east-1b)
   - Data processing: Minimal (~$0-1/month)

**Optional Interface Endpoints:**

4. **Secrets Manager Interface Endpoint**: ~$7/month (optional)
   - Purpose: Retrieve database credentials securely
   - Can be added later if needed
   - Not included in base estimate

**Interface Endpoints Total: ~$21-28/month**
- Base (3 endpoints): ~$21/month
- With Secrets Manager (4 endpoints): ~$28/month

**VPC Endpoints Total: ~$21-28/month**

**Cost Savings vs NAT Gateway:**
- NAT Gateway cost: ~$32/month ($0.045/hour × 730 hours)
- NAT Gateway data processing: ~$0.045/GB
- VPC Endpoints cost: ~$21-28/month
- **Net savings: ~$4-11/month**

---

### 2. RDS PostgreSQL: $0 (Free Tier) → ~$15/month (After)

#### During Free Tier (Months 1-12)

**Free Tier Benefits:**
- 750 hours/month of db.t3.micro usage (covers 24/7 operation)
- 20 GB of General Purpose (SSD) storage
- 20 GB of backup storage

**Instance Configuration:**
- Instance class: db.t3.micro (2 vCPU, 1 GB RAM)
- Storage: 20 GB gp3 SSD
- Deployment: Single-AZ (us-east-1a)
- Backups: 7-day retention

**Cost During Free Tier: $0/month**

#### After Free Tier (Month 13+)

**RDS Instance Costs:**
- db.t3.micro: $0.017/hour × 730 hours = **$12.41/month**
- Storage (20 GB gp3): $0.115/GB × 20 GB = **$2.30/month**
- Backup storage (within 20 GB): **$0/month** (free up to DB size)

**Additional Costs:**
- I/O operations: Included with gp3 (3,000 IOPS baseline)
- Snapshots beyond 20 GB: $0.095/GB-month (minimal for low traffic)

**Total RDS Cost After Free Tier: ~$15/month**

**Cost Optimization Measures:**
- Single-AZ deployment (Multi-AZ would double cost to ~$30/month)
- 20 GB storage (Free Tier limit, can expand later)
- 7-day backup retention (short retention for cost optimization)
- AWS managed encryption (no KMS costs)

---

### 3. ElastiCache Redis: $0 (Free Tier) → ~$12/month (After)

#### During Free Tier (Months 1-12)

**Free Tier Benefits:**
- 750 hours/month of cache.t3.micro usage (covers 24/7 operation)

**Cluster Configuration:**
- Node type: cache.t3.micro (2 vCPU, 0.5 GB RAM)
- Nodes: 1 node (no replicas)
- Deployment: Single-AZ (us-east-1a)
- Backups: 7-day retention

**Cost During Free Tier: $0/month**

#### After Free Tier (Month 13+)

**ElastiCache Costs:**
- cache.t3.micro: $0.017/hour × 730 hours = **$12.41/month**
- Backup storage: $0.085/GB-month (minimal for Redis snapshots)

**Total ElastiCache Cost After Free Tier: ~$12/month**

**Cost Optimization Measures:**
- Single node deployment (no replicas)
- 7-day backup retention (short retention for cost optimization)
- AWS managed encryption (no KMS costs)

---

### 4. S3 Storage: ~$1-5/month

#### During Free Tier (Months 1-12)

**Free Tier Benefits:**
- 5 GB of Standard storage
- 20,000 GET requests
- 2,000 PUT requests

**S3 Buckets:**
1. **Static Assets Bucket** (showcore-static-assets-{account-id})
   - Estimated size: 1-3 GB (frontend assets)
   - Versioning enabled
   - Lifecycle: Delete old versions after 90 days

2. **Backups Bucket** (showcore-backups-{account-id})
   - Estimated size: 2-5 GB (RDS backups, ElastiCache snapshots)
   - Versioning enabled
   - Lifecycle: Transition to Glacier after 30 days, delete after 90 days

3. **CloudTrail Logs Bucket** (showcore-cloudtrail-logs-{account-id})
   - Estimated size: < 1 GB (audit logs)
   - Lifecycle: Delete after 90 days

**Estimated Costs During Free Tier:**
- Storage (3-8 GB total): First 5 GB free, then $0.023/GB = **$0-0.07/month**
- Requests: Covered by Free Tier
- Data transfer: Covered by Free Tier (first 100 GB out)

**Total S3 Cost During Free Tier: ~$0-1/month**

#### After Free Tier (Month 13+)

**S3 Standard Storage:**
- Static assets (3 GB): $0.023/GB × 3 GB = **$0.07/month**
- Backups (5 GB): $0.023/GB × 5 GB = **$0.12/month**
- CloudTrail logs (1 GB): $0.023/GB × 1 GB = **$0.02/month**

**S3 Glacier Flexible Retrieval:**
- Old backups (5 GB): $0.0036/GB × 5 GB = **$0.02/month**

**Requests:**
- GET requests (50,000/month): $0.0004/1,000 = **$0.02/month**
- PUT requests (10,000/month): $0.005/1,000 = **$0.05/month**

**Total S3 Cost After Free Tier: ~$1-2/month**

**Cost Optimization Measures:**
- SSE-S3 encryption (free, no KMS costs)
- Lifecycle policies to transition to Glacier after 30 days
- Delete old backups after 90 days
- Versioning with old version deletion after 90 days

---

### 5. CloudFront CDN: ~$1-5/month

#### During Free Tier (Months 1-12)

**Free Tier Benefits:**
- 1 TB data transfer out
- 10,000,000 HTTP/HTTPS requests
- 2,000,000 CloudFront Function invocations

**Distribution Configuration:**
- Origin: S3 static assets bucket
- Price Class: PriceClass_100 (North America and Europe only)
- SSL/TLS: Free with AWS Certificate Manager
- Compression: Enabled (free)

**Estimated Usage (Low Traffic):**
- Data transfer: 10-50 GB/month
- Requests: 100,000-500,000/month

**Cost During Free Tier: $0/month** (well within Free Tier limits)

#### After Free Tier (Month 13+)

**CloudFront Costs (PriceClass_100):**
- Data transfer out (50 GB): $0.085/GB × 50 GB = **$4.25/month**
- HTTP/HTTPS requests (500,000): $0.0075/10,000 × 50 = **$0.38/month**

**Total CloudFront Cost After Free Tier: ~$1-5/month**

**Cost Optimization Measures:**
- PriceClass_100 (lowest cost regions only)
- Automatic compression enabled
- Long cache TTLs (24 hours default, 1 year max)
- No access logging (saves S3 storage costs)

---

### 6. Data Transfer: ~$0-5/month

#### During Free Tier (Months 1-12)

**Free Tier Benefits:**
- 100 GB data transfer out to internet per month

**Estimated Usage:**
- CloudFront to users: 10-50 GB/month (covered by CloudFront Free Tier)
- S3 to CloudFront: FREE (same region)
- VPC Endpoint data processing: Minimal (~1-5 GB/month)

**Cost During Free Tier: $0/month**

#### After Free Tier (Month 13+)

**Data Transfer Costs:**
- Internet data transfer (beyond 100 GB): $0.09/GB
- VPC Endpoint data processing: $0.01/GB (first 1 GB free per AZ)

**Estimated Costs:**
- Internet transfer (low traffic): **$0-2/month**
- VPC Endpoint processing: **$0-1/month**

**Total Data Transfer Cost After Free Tier: ~$0-5/month**

---

### 7. CloudWatch: ~$0-5/month

#### Monitoring Costs

**Free Tier (Always Free):**
- 10 custom metrics
- 10 alarms
- 1,000,000 API requests
- 5 GB log ingestion
- 5 GB log storage

**Phase 1 Usage:**
- Custom metrics: ~5-8 (RDS, ElastiCache, S3, CloudFront)
- Alarms: ~8-10 (CPU, memory, storage, billing)
- Log ingestion: ~1-3 GB/month
- Log storage: ~2-5 GB (7-day retention)

**Estimated Costs:**
- Metrics: Covered by Free Tier
- Alarms: $0.10 × 0-2 alarms = **$0-0.20/month**
- Log ingestion: Covered by Free Tier
- Log storage: Covered by Free Tier

**Total CloudWatch Cost: ~$0-1/month**

**Cost Optimization Measures:**
- 7-day log retention (can increase later)
- Minimal alarms (only critical ones)
- No detailed monitoring initially
- No Container Insights initially

---

### 8. Other AWS Services: ~$0-2/month

#### AWS Config
- Configuration items: First 1,000 free, then $0.003 each
- Estimated: ~100-200 items = **$0/month** (within free tier)

#### AWS CloudTrail
- First trail: FREE
- S3 storage: Covered in S3 costs above
- Estimated: **$0/month**

#### AWS Backup
- Backup storage: Covered in S3 costs above
- Restore requests: $0.02/GB (only when restoring)
- Estimated: **$0/month** (no restores in normal operation)

#### SNS (Notifications)
- Email notifications: First 1,000 free, then $2.00/100,000
- Estimated: ~50-100 notifications/month = **$0/month**

**Total Other Services Cost: ~$0-2/month**

---

## Total Cost Summary

### During Free Tier (Months 1-12)

| Service | Monthly Cost | Notes |
|---------|--------------|-------|
| VPC Endpoints | $21-28 | Interface Endpoints only (Gateway Endpoints FREE) |
| RDS PostgreSQL | $0 | Free Tier: 750 hours db.t3.micro |
| ElastiCache Redis | $0 | Free Tier: 750 hours cache.t3.micro |
| S3 Storage | $0-1 | First 5 GB free |
| CloudFront CDN | $0 | Free Tier: 1 TB transfer, 10M requests |
| Data Transfer | $0 | Free Tier: 100 GB out |
| CloudWatch | $0-1 | Free Tier: 10 metrics, 10 alarms |
| Other Services | $0-2 | Config, CloudTrail, Backup, SNS |
| **TOTAL** | **$3-10/month** | **Estimated range for low-traffic project** |

### After Free Tier (Month 13+)

| Service | Monthly Cost | Notes |
|---------|--------------|-------|
| VPC Endpoints | $21-28 | Interface Endpoints only (Gateway Endpoints FREE) |
| RDS PostgreSQL | $15 | db.t3.micro + 20 GB storage |
| ElastiCache Redis | $12 | cache.t3.micro |
| S3 Storage | $1-2 | Standard + Glacier storage |
| CloudFront CDN | $1-5 | PriceClass_100, low traffic |
| Data Transfer | $0-5 | Beyond Free Tier limits |
| CloudWatch | $0-1 | Minimal alarms and logs |
| Other Services | $0-2 | Config, CloudTrail, Backup, SNS |
| **TOTAL** | **$49-60/month** | **Estimated range for low-traffic project** |

---

## Cost Optimization Achievements

### Savings vs Traditional Architecture

**Traditional NAT Gateway Architecture:**
- NAT Gateway: $32/month
- NAT Gateway data processing: $5-10/month
- RDS Multi-AZ: $30/month (vs $15 single-AZ)
- ElastiCache replicas: $24/month (vs $12 single node)
- KMS keys: $1-2/month (vs $0 AWS managed)
- **Total: ~$92-98/month**

**ShowCore VPC Endpoints Architecture:**
- VPC Endpoints: $21-28/month
- RDS Single-AZ: $15/month
- ElastiCache Single Node: $12/month
- AWS managed encryption: $0/month
- **Total: ~$49-60/month**

**Total Savings: ~$32-49/month (40-50% cost reduction)**

### Key Cost Optimization Decisions

1. **VPC Endpoints vs NAT Gateway**: Saves ~$4-11/month
   - Eliminates NAT Gateway ($32/month)
   - Adds Interface Endpoints ($21-28/month)
   - Gateway Endpoints are FREE (S3, DynamoDB)

2. **Single-AZ Deployment**: Saves ~$27/month
   - RDS Single-AZ vs Multi-AZ: Saves ~$15/month
   - ElastiCache Single Node vs Replicas: Saves ~$12/month

3. **Free Tier Eligible Instances**: Saves ~$27/month (first 12 months)
   - RDS db.t3.micro: $15/month savings
   - ElastiCache cache.t3.micro: $12/month savings

4. **AWS Managed Encryption**: Saves ~$1-2/month
   - SSE-S3 instead of KMS for S3
   - AWS managed keys for RDS and ElastiCache

5. **Minimal Monitoring**: Saves ~$5-10/month
   - No VPC Flow Logs initially
   - No GuardDuty initially
   - 7-day log retention
   - Minimal CloudWatch alarms

6. **CloudFront PriceClass_100**: Saves ~$2-5/month
   - Lowest cost regions only (North America and Europe)

---

## Cost Monitoring Plan

### Pre-Deployment Setup

Before deploying infrastructure, set up cost monitoring:

1. **Enable Cost Allocation Tags**
   - Navigate to AWS Billing Console → Cost Allocation Tags
   - Activate tags: Project, Phase, Environment, ManagedBy, CostCenter, Component
   - Tags will appear in Cost Explorer within 24 hours

2. **Set Up Billing Alerts**
   - Create CloudWatch billing alarm for $50 threshold (warning)
   - Create CloudWatch billing alarm for $100 threshold (critical)
   - Configure SNS topic for billing notifications
   - Subscribe email addresses to SNS topic

3. **Enable Cost Explorer**
   - Navigate to AWS Billing Console → Cost Explorer
   - Enable Cost Explorer (may take 24 hours to populate)
   - Configure default filters for ShowCore project

### Post-Deployment Monitoring

After deploying infrastructure, monitor costs regularly:

#### Daily Monitoring (First Week)

1. **Check AWS Billing Dashboard**
   - Navigate to AWS Billing Console → Bills
   - Review current month-to-date charges
   - Verify charges match estimates
   - Look for unexpected services or charges

2. **Review Cost Explorer**
   - Filter by tag: Project = ShowCore
   - Group by: Service
   - Time range: Last 7 days
   - Verify each service cost matches estimates

#### Weekly Monitoring (First Month)

1. **Cost Explorer Analysis**
   - Navigate to Cost Explorer
   - Filter by: Project = ShowCore, Phase = Phase1
   - Group by: Service
   - Compare actual costs to estimates
   - Identify any cost anomalies

2. **Service-Specific Cost Review**
   - VPC Endpoints: Check data processed and hourly charges
   - RDS: Verify Free Tier hours used (should be ~168 hours/week)
   - ElastiCache: Verify Free Tier hours used (should be ~168 hours/week)
   - S3: Check storage size and request counts
   - CloudFront: Check data transfer and request counts

3. **Tag Compliance Check**
   - Cost Explorer → Filter by tag
   - Verify all resources have required tags
   - Identify any untagged resources
   - Add missing tags to resources

#### Monthly Monitoring (Ongoing)

1. **Monthly Cost Report**
   - Generate Cost Explorer report for previous month
   - Compare to estimates and previous months
   - Document any variances
   - Update estimates if needed

2. **Cost Optimization Review**
   - Identify underutilized resources
   - Review CloudWatch metrics for right-sizing opportunities
   - Check for unused resources (snapshots, old backups)
   - Verify lifecycle policies are working

3. **Free Tier Usage Tracking**
   - Navigate to AWS Billing Console → Free Tier
   - Check remaining Free Tier hours for RDS and ElastiCache
   - Verify staying within Free Tier limits
   - Plan for Free Tier expiration (month 12)

### Cost Anomaly Detection Setup

After deployment, set up AWS Cost Anomaly Detection:

1. **Enable Cost Anomaly Detection**
   - Navigate to AWS Cost Management → Cost Anomaly Detection
   - Click "Get started"
   - Create monitor for ShowCore project

2. **Configure Monitor**
   - Monitor name: "ShowCore Phase 1 Cost Monitor"
   - Monitor type: AWS Services
   - Filter: Tag = Project:ShowCore
   - Alerting threshold: $5 (detect small anomalies early)

3. **Set Up Alerts**
   - Create SNS topic: "showcore-cost-anomaly-alerts"
   - Subscribe email addresses
   - Configure alert frequency: Immediately

4. **Review Anomalies**
   - Check Cost Anomaly Detection dashboard weekly
   - Investigate any detected anomalies
   - Document root cause and resolution
   - Update estimates if needed

### Cost Optimization Actions

If costs exceed estimates:

1. **Immediate Actions**
   - Check for unexpected resources (EC2 instances, NAT Gateways)
   - Verify no resources running in wrong regions
   - Check for large data transfers
   - Review CloudWatch Logs ingestion volume

2. **Short-Term Actions**
   - Reduce CloudWatch log retention (7 days → 3 days)
   - Delete old snapshots and backups
   - Optimize S3 lifecycle policies
   - Reduce CloudWatch alarm count

3. **Long-Term Actions**
   - Right-size RDS and ElastiCache instances
   - Consider Reserved Instances (after 12 months)
   - Optimize application to reduce data transfer
   - Review and optimize VPC Endpoint usage

---

## Cost Estimation Assumptions

### Traffic Assumptions

These estimates assume low-traffic project website usage:

- **Monthly active users**: 100-500
- **Page views**: 1,000-5,000/month
- **API requests**: 10,000-50,000/month
- **Data transfer**: 10-50 GB/month
- **Database connections**: 5-20 concurrent
- **Cache operations**: 100,000-500,000/month

### Growth Scenarios

If traffic increases significantly:

**Moderate Growth (10x traffic):**
- CloudFront: $5-15/month (500 GB transfer)
- Data Transfer: $5-15/month
- RDS: May need db.t3.small ($30/month)
- ElastiCache: May need cache.t3.small ($24/month)
- **Estimated Total: $70-100/month**

**High Growth (100x traffic):**
- Consider Multi-AZ deployment for RDS and ElastiCache
- Consider larger instance types
- Consider Reserved Instances for cost savings
- Consider CloudFront Reserved Capacity
- **Estimated Total: $200-400/month**

### Seasonal Variations

Costs may vary based on:
- **Holiday traffic spikes**: CloudFront and data transfer costs may increase
- **Backup retention**: Costs increase if retention period is extended
- **Development activity**: Costs increase during active development (more logs, metrics)

---

## Cost Reporting Template

Use this template for monthly cost reports:

```markdown
# ShowCore Phase 1 - Monthly Cost Report
**Month**: [Month Year]
**Report Date**: [Date]

## Summary
- **Total Cost**: $XX.XX
- **Estimated Cost**: $XX.XX
- **Variance**: $XX.XX (XX%)
- **Status**: ✅ Within budget / ⚠️ Over budget

## Cost Breakdown
| Service | Actual | Estimated | Variance |
|---------|--------|-----------|----------|
| VPC Endpoints | $XX.XX | $21-28 | $XX.XX |
| RDS PostgreSQL | $XX.XX | $0-15 | $XX.XX |
| ElastiCache Redis | $XX.XX | $0-12 | $XX.XX |
| S3 Storage | $XX.XX | $1-5 | $XX.XX |
| CloudFront CDN | $XX.XX | $1-5 | $XX.XX |
| Data Transfer | $XX.XX | $0-5 | $XX.XX |
| CloudWatch | $XX.XX | $0-5 | $XX.XX |
| Other Services | $XX.XX | $0-2 | $XX.XX |

## Key Findings
- [Finding 1]
- [Finding 2]
- [Finding 3]

## Cost Anomalies
- [Anomaly 1 with explanation]
- [Anomaly 2 with explanation]

## Optimization Opportunities
- [Opportunity 1]
- [Opportunity 2]

## Actions Taken
- [Action 1]
- [Action 2]

## Next Month Forecast
- **Estimated Cost**: $XX.XX
- **Key Changes**: [Changes that will affect cost]
```

---

## References

- **Requirements**: 9.7 (Billing alerts at $50), 9.8 (Billing alerts at $100), 1.5 (Cost Explorer with cost allocation tags)
- **ADRs**: 
  - ADR-001: VPC Endpoints over NAT Gateway
  - ADR-006: Single-AZ Deployment Strategy
  - ADR-007: Free Tier Instance Selection
  - ADR-008: Encryption Key Management
  - ADR-011: CloudFront Price Class
  - ADR-013: Cost Allocation Tagging
- **Design Document**: Section "Cost Optimization Summary"
- **AWS Pricing**: https://aws.amazon.com/pricing/
- **AWS Free Tier**: https://aws.amazon.com/free/
- **AWS Cost Management**: https://aws.amazon.com/aws-cost-management/

---

**Document Version**: 1.0  
**Last Updated**: February 4, 2026  
**Maintained By**: ShowCore Engineering Team  
**Review Frequency**: Monthly after deployment, quarterly for estimates
