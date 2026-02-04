# ADR-010: S3 Lifecycle Policies and Retention Strategy

**Status**: Accepted  
**Date**: February 4, 2026  
**Deciders**: ShowCore Engineering Team  
**Validates**: Requirements 5.9, 9.10

## Context

Phase 1 infrastructure includes three S3 buckets with different purposes and retention requirements:

1. **Static Assets Bucket** (`showcore-static-assets-{account-id}`):
   - Stores frontend static assets (HTML, CSS, JavaScript, images)
   - Versioning enabled for rollback capability
   - Accessed via CloudFront CDN
   - Expected size: < 1 GB

2. **Backups Bucket** (`showcore-backups-{account-id}`):
   - Stores RDS and ElastiCache backups
   - Versioning enabled for backup integrity
   - Private access only (IAM)
   - Expected size: 5-20 GB (grows over time)

3. **CloudTrail Logs Bucket** (`showcore-cloudtrail-logs-{account-id}`):
   - Stores audit logs from CloudTrail
   - Versioning enabled for compliance
   - Private access only (IAM)
   - Expected size: < 1 GB

Current context:
- ShowCore is a low-traffic portfolio/learning project
- Target monthly cost under $60
- S3 storage costs $0.023/GB/month (Standard), $0.004/GB/month (Glacier Flexible Retrieval)
- No compliance requirements mandating long-term retention
- Backups grow continuously without lifecycle management
- Old versions accumulate storage costs

Key challenges:
- Balancing data retention with storage costs
- Determining appropriate retention periods for different data types
- Choosing optimal storage classes for infrequently accessed data
- Managing version proliferation in versioned buckets

## Decision

**Implement cost-optimized lifecycle policies with short retention periods and Glacier transitions for backups.**

Implementation:

**Static Assets Bucket**:
- Delete old versions after 90 days
- No Glacier transition (assets are actively used)
- Keep current versions indefinitely

**Backups Bucket**:
- Transition to Glacier Flexible Retrieval after 30 days
- Delete after 90 days total
- Delete old versions after 90 days

**CloudTrail Logs Bucket**:
- Delete logs after 90 days
- No Glacier transition (logs are small, transition cost not worth it)
- Delete old versions after 90 days

## Alternatives Considered

### Alternative 1: Long-Term Retention (Enterprise Pattern)

Retain backups for 1 year, CloudTrail logs for 1 year, static asset versions for 1 year.

**Pros**:
- Comprehensive historical data
- Better compliance posture
- Can recover from old backups if needed
- Can audit old CloudTrail logs
- Follows enterprise best practices

**Cons**:
- High storage cost: ~$10-20/month additional
- Backups: 20 GB × 12 months × $0.004/GB = $0.96/month (Glacier)
- CloudTrail: 5 GB × 12 months × $0.023/GB = $1.38/month
- Static assets: 2 GB × 12 months × $0.023/GB = $0.55/month
- Total: ~$3/month minimum, grows over time
- Overkill for low-traffic project
- Most old data never accessed

**Monthly Cost**: ~$3-5 additional (grows over time)

**Decision**: Rejected due to cost and lack of need for long-term retention.

### Alternative 2: Minimal Retention (Cost-First)

Delete backups after 7 days, CloudTrail logs after 7 days, static asset versions immediately.

**Pros**:
- Lowest storage cost
- Simple lifecycle policies
- Minimal S3 storage charges

**Cons**:
- Very short backup retention (risky)
- Cannot recover from issues older than 7 days
- Cannot audit CloudTrail logs older than 7 days
- No rollback capability for static assets
- Too aggressive for learning project
- Violates backup best practices

**Monthly Cost**: ~$0.50 (minimal)

**Decision**: Rejected. Too risky, violates backup best practices.

### Alternative 3: Cost-Optimized Retention (Selected)

90-day retention with Glacier transition for backups after 30 days.

**Pros**:
- Balanced cost at ~$1-2/month
- Sufficient retention for troubleshooting (90 days)
- Glacier transition reduces backup storage costs by 80%
- Keeps recent backups in Standard for fast recovery
- Reasonable rollback window for static assets
- Follows cost optimization best practices

**Cons**:
- Shorter retention than enterprise standards
- Glacier retrieval takes 3-5 hours (acceptable for old backups)
- Cannot recover from issues older than 90 days
- Cannot audit CloudTrail logs older than 90 days

**Monthly Cost**: ~$1-2

**Decision**: Accepted. Best balance of cost and retention for Phase 1.

### Alternative 4: Intelligent-Tiering

Use S3 Intelligent-Tiering to automatically move objects between access tiers.

**Pros**:
- Automatic cost optimization
- No lifecycle policy management
- Optimizes based on actual access patterns

**Cons**:
- Monitoring fee: $0.0025 per 1,000 objects
- Minimum object size: 128 KB (smaller objects not optimized)
- More complex pricing model
- Not worth it for small datasets (< 100 GB)
- Adds complexity without clear benefit

**Monthly Cost**: ~$2-3 (similar to manual lifecycle)

**Decision**: Rejected. Not cost-effective for small datasets.

## Rationale

The decision prioritizes cost optimization while maintaining sufficient retention for operational needs.

### Cost Analysis

**Without Lifecycle Policies**:
- Static assets: 1 GB × $0.023/GB = $0.023/month
- Static asset versions: 2 GB × $0.023/GB = $0.046/month (grows)
- Backups: 20 GB × $0.023/GB = $0.46/month (grows)
- CloudTrail logs: 1 GB × $0.023/GB = $0.023/month (grows)
- Total: ~$0.55/month initially, grows to $5-10/month over time

**With Lifecycle Policies** (selected):
- Static assets: 1 GB × $0.023/GB = $0.023/month
- Static asset versions: 0.5 GB × $0.023/GB = $0.012/month (90-day limit)
- Backups (Standard, 0-30 days): 5 GB × $0.023/GB = $0.115/month
- Backups (Glacier, 30-90 days): 15 GB × $0.004/GB = $0.060/month
- CloudTrail logs: 0.5 GB × $0.023/GB = $0.012/month (90-day limit)
- Total: ~$0.22/month (stable, doesn't grow)

**Savings**: ~$0.33/month initially, $5-10/month long-term

### Retention Period Justification

**90 Days for Backups**:
- Sufficient for recovering from most issues
- Covers quarterly review cycles
- Balances cost with recovery capability
- Can restore from backups up to 3 months old
- Acceptable for low-traffic project

**30 Days in Standard, 60 Days in Glacier**:
- Recent backups (0-30 days) in Standard for fast recovery (< 5 minutes)
- Older backups (30-90 days) in Glacier for cost savings (3-5 hour retrieval)
- Most recovery scenarios use recent backups
- Glacier retrieval time acceptable for old backups

**90 Days for CloudTrail Logs**:
- Sufficient for security audits
- Covers quarterly compliance reviews
- Balances cost with audit capability
- Can investigate security incidents up to 3 months old

**90 Days for Static Asset Versions**:
- Sufficient rollback window for frontend changes
- Can revert to versions up to 3 months old
- Prevents version proliferation
- Balances rollback capability with storage cost

### Storage Class Selection

**S3 Standard** (for active data):
- $0.023/GB/month
- Millisecond access latency
- 99.99% availability
- Best for: Current static assets, recent backups (0-30 days)

**S3 Glacier Flexible Retrieval** (for archival):
- $0.004/GB/month (82% cheaper than Standard)
- 3-5 hour retrieval time
- 99.99% availability
- Best for: Old backups (30-90 days)

**Why Not Glacier Deep Archive**:
- $0.00099/GB/month (even cheaper)
- 12-48 hour retrieval time
- Too slow for backup recovery
- Not worth the complexity for 90-day retention

**Why Not Glacier Instant Retrieval**:
- $0.004/GB/month (same as Flexible)
- Millisecond access latency
- Minimum 90-day storage duration
- Not needed for old backups (rarely accessed)

### Lifecycle Policy Design

**Static Assets Bucket**:
```xml
<LifecycleConfiguration>
  <Rule>
    <ID>delete-old-versions</ID>
    <Status>Enabled</Status>
    <NoncurrentVersionExpiration>
      <NoncurrentDays>90</NoncurrentDays>
    </NoncurrentVersionExpiration>
  </Rule>
</LifecycleConfiguration>
```

**Backups Bucket**:
```xml
<LifecycleConfiguration>
  <Rule>
    <ID>transition-to-glacier</ID>
    <Status>Enabled</Status>
    <Transition>
      <Days>30</Days>
      <StorageClass>GLACIER</StorageClass>
    </Transition>
  </Rule>
  <Rule>
    <ID>delete-old-backups</ID>
    <Status>Enabled</Status>
    <Expiration>
      <Days>90</Days>
    </Expiration>
  </Rule>
  <Rule>
    <ID>delete-old-versions</ID>
    <Status>Enabled</Status>
    <NoncurrentVersionExpiration>
      <NoncurrentDays>90</NoncurrentDays>
    </NoncurrentVersionExpiration>
  </Rule>
</LifecycleConfiguration>
```

**CloudTrail Logs Bucket**:
```xml
<LifecycleConfiguration>
  <Rule>
    <ID>delete-old-logs</ID>
    <Status>Enabled</Status>
    <Expiration>
      <Days>90</Days>
    </Expiration>
  </Rule>
  <Rule>
    <ID>delete-old-versions</ID>
    <Status>Enabled</Status>
    <NoncurrentVersionExpiration>
      <NoncurrentDays>90</NoncurrentDays>
    </NoncurrentVersionExpiration>
  </Rule>
</LifecycleConfiguration>
```

## Consequences

### Positive

1. **Cost Savings**: ~$0.33/month initially, $5-10/month long-term
2. **Predictable Costs**: Storage costs stabilize, don't grow indefinitely
3. **Sufficient Retention**: 90 days covers most operational needs
4. **Glacier Savings**: 82% cost reduction for old backups
5. **Fast Recent Recovery**: Recent backups (0-30 days) in Standard for quick recovery
6. **Version Control**: Prevents version proliferation in versioned buckets
7. **Automated Management**: Lifecycle policies run automatically, no manual cleanup

### Negative

1. **Limited Historical Data**: Cannot recover from issues older than 90 days
2. **Glacier Retrieval Time**: Old backups take 3-5 hours to retrieve
3. **No Long-Term Audit**: CloudTrail logs deleted after 90 days
4. **Limited Rollback**: Static assets can only roll back 90 days
5. **Shorter Than Enterprise**: Enterprise standards typically 1+ year retention

### Neutral

1. **Acceptable for Phase 1**: No compliance requirements mandate longer retention
2. **Learning Trade-off**: Shorter retention reduces costs, acceptable for learning project
3. **Upgrade Path**: Can increase retention periods later if needed

## Implementation

### CDK Implementation

**Storage Stack** (`lib/stacks/storage_stack.py`):

```python
from aws_cdk import (
    aws_s3 as s3,
    Duration,
    RemovalPolicy,
)

# Static Assets Bucket
static_assets_bucket = s3.Bucket(
    self, "StaticAssetsBucket",
    bucket_name=f"showcore-static-assets-{self.account}",
    versioned=True,
    encryption=s3.BucketEncryption.S3_MANAGED,
    block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
    lifecycle_rules=[
        s3.LifecycleRule(
            id="delete-old-versions",
            noncurrent_version_expiration=Duration.days(90),
            enabled=True,
        )
    ],
    removal_policy=RemovalPolicy.RETAIN,
)

# Backups Bucket
backups_bucket = s3.Bucket(
    self, "BackupsBucket",
    bucket_name=f"showcore-backups-{self.account}",
    versioned=True,
    encryption=s3.BucketEncryption.S3_MANAGED,
    block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
    lifecycle_rules=[
        s3.LifecycleRule(
            id="transition-to-glacier",
            transitions=[
                s3.Transition(
                    storage_class=s3.StorageClass.GLACIER,
                    transition_after=Duration.days(30),
                )
            ],
            enabled=True,
        ),
        s3.LifecycleRule(
            id="delete-old-backups",
            expiration=Duration.days(90),
            enabled=True,
        ),
        s3.LifecycleRule(
            id="delete-old-versions",
            noncurrent_version_expiration=Duration.days(90),
            enabled=True,
        ),
    ],
    removal_policy=RemovalPolicy.RETAIN,
)

# CloudTrail Logs Bucket (in Security Stack)
cloudtrail_bucket = s3.Bucket(
    self, "CloudTrailLogsBucket",
    bucket_name=f"showcore-cloudtrail-logs-{self.account}",
    versioned=True,
    encryption=s3.BucketEncryption.S3_MANAGED,
    block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
    lifecycle_rules=[
        s3.LifecycleRule(
            id="delete-old-logs",
            expiration=Duration.days(90),
            enabled=True,
        ),
        s3.LifecycleRule(
            id="delete-old-versions",
            noncurrent_version_expiration=Duration.days(90),
            enabled=True,
        ),
    ],
    removal_policy=RemovalPolicy.RETAIN,
)
```

### Verification

**Verify Lifecycle Policies**:
```bash
# Static Assets Bucket
aws s3api get-bucket-lifecycle-configuration \
  --bucket showcore-static-assets-123456789012

# Backups Bucket
aws s3api get-bucket-lifecycle-configuration \
  --bucket showcore-backups-123456789012

# CloudTrail Logs Bucket
aws s3api get-bucket-lifecycle-configuration \
  --bucket showcore-cloudtrail-logs-123456789012
```

**Monitor Storage Costs**:
```bash
# Check S3 storage metrics in CloudWatch
aws cloudwatch get-metric-statistics \
  --namespace AWS/S3 \
  --metric-name BucketSizeBytes \
  --dimensions Name=BucketName,Value=showcore-backups-123456789012 \
  --start-time 2026-01-01T00:00:00Z \
  --end-time 2026-02-01T00:00:00Z \
  --period 86400 \
  --statistics Average
```

## When to Revisit This Decision

Should review this decision:

**After 3 Months** - Assess if 90-day retention is sufficient. Check if any issues required older backups. Review storage costs in Cost Explorer.

**If Compliance Requirements Change** - If regulations mandate longer retention, increase retention periods. Consider enabling S3 Object Lock for immutability.

**If Storage Costs Exceed Budget** - If S3 costs exceed $2/month, consider shorter retention (60 days) or more aggressive Glacier transitions (15 days).

**If Recovery Scenarios Change** - If need to recover from older backups, increase retention. If Glacier retrieval time is problematic, keep more backups in Standard.

**Before Production Launch** - If ShowCore becomes production service with users, increase retention to 1 year and implement cross-region replication.

**Quarterly Cost Review** - Check S3 costs in Cost Explorer. Verify lifecycle policies are working as expected. Adjust if needed.

## References

- [S3 Lifecycle Configuration](https://docs.aws.amazon.com/AmazonS3/latest/userguide/object-lifecycle-mgmt.html)
- [S3 Storage Classes](https://aws.amazon.com/s3/storage-classes/)
- [S3 Pricing](https://aws.amazon.com/s3/pricing/)
- [Glacier Retrieval Times](https://docs.aws.amazon.com/amazonglacier/latest/dev/downloading-an-archive-two-steps.html)
- ShowCore Requirements: 5.9, 9.10
- ShowCore Design: design.md (Storage Infrastructure)

## Related Decisions

- ADR-008: Encryption Key Management - S3 uses SSE-S3 encryption
- ADR-012: Backup Retention and Recovery Objectives - Backup retention aligns with RTO/RPO
- ADR-006: Single-AZ Deployment Strategy - Cost optimization philosophy

## Approval

- **Proposed By**: ShowCore Engineering Team
- **Reviewed By**: Cost Optimization Review
- **Approved By**: Project Lead
- **Date**: February 4, 2026

---

**Implementation Status**: ✅ Implemented in storage_stack.py and security_stack.py  
**Next Review**: After 3 months or when compliance requirements change
