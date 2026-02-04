# ADR-012: Backup Retention and Recovery Objectives (RTO/RPO)

**Status**: Accepted  
**Date**: February 4, 2026  
**Deciders**: ShowCore Engineering Team  
**Validates**: Requirements 8.1, 8.2, 8.3, 8.4, 8.5

## Context

Phase 1 infrastructure includes critical data services that require backup and disaster recovery capabilities:

1. **RDS PostgreSQL Database**:
   - Stores application data (users, bookings, reviews, etc.)
   - Single-AZ deployment (cost optimization)
   - db.t3.micro instance (Free Tier)
   - 20 GB storage

2. **ElastiCache Redis Cluster**:
   - Stores session data and cache
   - Single-node deployment (cost optimization)
   - cache.t3.micro node (Free Tier)
   - Volatile data (can be rebuilt)

3. **S3 Buckets**:
   - Static assets, backups, CloudTrail logs
   - Versioning enabled
   - 99.999999999% durability (11 nines)

Current context:
- ShowCore is a low-traffic portfolio/learning project
- Target monthly cost under $60
- No SLA requirements (not production service)
- Acceptable downtime for cost optimization
- Single-AZ deployment (no automatic failover)

Key decisions needed:
1. Backup retention period (how long to keep backups)
2. Backup frequency (how often to create backups)
3. Recovery Time Objective (RTO) - how quickly to recover
4. Recovery Point Objective (RPO) - how much data loss is acceptable
5. Cross-region replication (disaster recovery)

## Decision

**Implement cost-optimized backup strategy with 7-day retention, daily backups, and defined RTO/RPO targets.**

Implementation:

**RDS PostgreSQL**:
- Automated daily backups at 03:00 UTC
- 7-day retention period
- Point-in-time recovery enabled (5-minute granularity)
- Manual snapshots before major changes
- RTO: < 30 minutes
- RPO: < 5 minutes

**ElastiCache Redis**:
- Daily automated snapshots at 03:00 UTC
- 7-day retention period
- Manual snapshots before major changes
- RTO: < 15 minutes
- RPO: < 24 hours

**S3 Buckets**:
- Versioning enabled (automatic backup)
- Lifecycle policies (90-day retention)
- RTO: < 5 minutes
- RPO: 0 (immediate replication)

**Cross-Region Replication**: Deferred to Phase 2 (cost optimization)

## Alternatives Considered

### Alternative 1: Enterprise Backup Strategy

30-day retention, hourly backups, cross-region replication, Multi-AZ deployment.

**Pros**:
- Maximum data protection
- Minimal data loss (RPO < 1 hour)
- Fast recovery (RTO < 5 minutes with Multi-AZ)
- Cross-region disaster recovery
- Follows enterprise best practices
- Can recover from any point in last 30 days

**Cons**:
- High cost: $50-100/month additional
- Multi-AZ RDS: $30/month (doubles RDS cost)
- Multi-AZ ElastiCache: $24/month (doubles ElastiCache cost)
- Cross-region replication: $10-20/month
- 30-day backup retention: $5-10/month
- Overkill for low-traffic project
- Most backups never used

**Monthly Cost**: $50-100 additional

**Decision**: Rejected due to cost. Not justified for learning project.

### Alternative 2: Minimal Backup Strategy

No automated backups, manual snapshots only, 1-day retention.

**Pros**:
- Lowest cost
- Simple configuration
- No backup storage costs

**Cons**:
- High risk of data loss
- No point-in-time recovery
- Manual backup process (error-prone)
- Cannot recover from issues older than 1 day
- Violates backup best practices
- Not acceptable for any data service

**Monthly Cost**: ~$0

**Decision**: Rejected. Too risky, violates backup best practices.

### Alternative 3: Cost-Optimized Backup Strategy (Selected)

7-day retention, daily backups, point-in-time recovery, single-region.

**Pros**:
- Balanced cost at ~$1-2/month
- Sufficient retention for troubleshooting (7 days)
- Point-in-time recovery for RDS (5-minute granularity)
- Automated daily backups (no manual intervention)
- Acceptable RTO/RPO for learning project
- Follows backup best practices within budget

**Cons**:
- Shorter retention than enterprise standards (7 days vs 30 days)
- No cross-region disaster recovery
- Single-AZ deployment (no automatic failover)
- Higher RPO for ElastiCache (24 hours vs 1 hour)

**Monthly Cost**: ~$1-2

**Decision**: Accepted. Best balance of cost and data protection for Phase 1.

### Alternative 4: Hybrid Strategy

7-day retention for RDS, no backups for ElastiCache (cache can be rebuilt).

**Pros**:
- Lower cost than full backup strategy
- Protects critical data (RDS)
- Cache data is non-critical (can be rebuilt)

**Cons**:
- Inconsistent backup strategy
- ElastiCache recovery requires rebuilding cache (slower)
- Not significantly cheaper than full backup
- Complexity without clear benefit

**Monthly Cost**: ~$1

**Decision**: Rejected. Inconsistent architecture, not worth the minimal savings.

## Rationale

The decision prioritizes data protection while maintaining cost optimization.

### Cost Analysis

**Without Backups**:
- RDS backups: $0 (disabled)
- ElastiCache snapshots: $0 (disabled)
- Risk: High data loss risk
- Total: $0/month (not acceptable)

**With Cost-Optimized Backups** (selected):
- RDS automated backups: $0 (included in RDS pricing)
- RDS backup storage: 20 GB × 7 days × $0.095/GB = $0.19/month
- ElastiCache snapshots: $0.09/GB/month × 0.5 GB × 7 = $0.32/month
- S3 versioning: Included in S3 lifecycle costs
- Total: ~$0.51/month

**With Enterprise Backups**:
- Multi-AZ RDS: $30/month additional
- Multi-AZ ElastiCache: $24/month additional
- Cross-region replication: $10-20/month
- 30-day retention: $5-10/month
- Total: $69-84/month additional

**Savings**: $68-83/month compared to enterprise strategy

### Backup Retention Justification

**7 Days for RDS and ElastiCache**:
- Sufficient for recovering from most issues
- Covers weekly development cycles
- Balances cost with recovery capability
- Can restore from backups up to 1 week old
- Acceptable for low-traffic project

**Why Not 30 Days**:
- 30-day retention costs 4× more ($2/month vs $0.50/month)
- Most recovery scenarios use recent backups (< 7 days)
- Can increase retention later if needed
- Not justified for learning project

**Why Not 1 Day**:
- Too short for troubleshooting
- Cannot recover from weekend issues
- Violates backup best practices
- Minimal cost savings ($0.40/month)

### Backup Frequency Justification

**Daily Backups at 03:00 UTC**:
- Off-peak hours (minimal user impact)
- Consistent backup schedule
- Balances RPO with cost
- Sufficient for low-traffic project

**Why Not Hourly**:
- Hourly backups cost more (more snapshots to store)
- RPO < 24 hours acceptable for learning project
- Point-in-time recovery provides 5-minute RPO for RDS
- Not justified for low-traffic project

**Why Not Weekly**:
- Too infrequent (RPO up to 7 days)
- Higher risk of data loss
- Not acceptable for any data service

### Recovery Time Objective (RTO) Analysis

**RDS RTO: < 30 minutes**

Recovery process:
1. Identify issue and decide to restore (5 minutes)
2. Select backup or point-in-time (2 minutes)
3. Restore RDS instance (15-20 minutes)
4. Update application connection string (2 minutes)
5. Verify data integrity (5 minutes)

Total: ~30 minutes

**ElastiCache RTO: < 15 minutes**

Recovery process:
1. Identify issue and decide to restore (5 minutes)
2. Select snapshot (1 minute)
3. Restore ElastiCache cluster (5-8 minutes)
4. Update application connection string (1 minute)
5. Verify cache is working (2 minutes)

Total: ~15 minutes

**S3 RTO: < 5 minutes**

Recovery process:
1. Identify issue (1 minute)
2. Restore from version (2 minutes)
3. Verify file integrity (1 minute)

Total: ~5 minutes

**Acceptable for Phase 1**: No SLA requirements, downtime acceptable for learning project.

### Recovery Point Objective (RPO) Analysis

**RDS RPO: < 5 minutes**

- Point-in-time recovery enabled (5-minute granularity)
- Can restore to any point in last 7 days
- Maximum data loss: 5 minutes
- Acceptable for low-traffic project

**ElastiCache RPO: < 24 hours**

- Daily snapshots at 03:00 UTC
- Maximum data loss: 24 hours
- Acceptable because cache data is non-critical
- Cache can be rebuilt from RDS if needed

**S3 RPO: 0 (zero)**

- Versioning provides immediate backup
- No data loss (all versions retained)
- Can restore any version within 90 days

### Cross-Region Replication Analysis

**Not Implemented in Phase 1**:
- Cost: $10-20/month for cross-region replication
- Complexity: Requires multi-region infrastructure
- Not needed: Single-region failure extremely rare
- Can implement later if needed

**When to Implement**:
- If ShowCore becomes production service
- If compliance requires geographic redundancy
- If budget allows ($10-20/month additional)

## Consequences

### Positive

1. **Cost Savings**: ~$68-83/month compared to enterprise strategy
2. **Data Protection**: 7-day retention covers most recovery scenarios
3. **Point-in-Time Recovery**: RDS can restore to any 5-minute interval
4. **Automated Backups**: No manual intervention required
5. **Acceptable RTO/RPO**: < 30 minutes RTO, < 5 minutes RPO for RDS
6. **Sufficient for Phase 1**: Meets requirements for learning project

### Negative

1. **Limited Retention**: Cannot recover from issues older than 7 days
2. **No Cross-Region DR**: Single-region failure would cause data loss
3. **Single-AZ Deployment**: No automatic failover (manual recovery required)
4. **Higher ElastiCache RPO**: Up to 24 hours data loss for cache
5. **Manual Recovery**: Requires manual intervention to restore

### Neutral

1. **Acceptable for Phase 1**: No SLA requirements, downtime acceptable
2. **Learning Trade-off**: Shorter retention reduces costs, acceptable for learning project
3. **Upgrade Path**: Can increase retention or enable Multi-AZ later if needed

## Implementation

### CDK Implementation

**Database Stack** (`lib/stacks/database_stack.py`):

```python
from aws_cdk import (
    aws_rds as rds,
    Duration,
)

# RDS PostgreSQL Instance
database = rds.DatabaseInstance(
    self, "Database",
    engine=rds.DatabaseInstanceEngine.postgres(
        version=rds.PostgresEngineVersion.VER_16
    ),
    instance_type=ec2.InstanceType.of(
        ec2.InstanceClass.BURSTABLE3,
        ec2.InstanceSize.MICRO,
    ),
    vpc=vpc,
    vpc_subnets=ec2.SubnetSelection(subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS),
    multi_az=False,  # Single-AZ for cost optimization
    allocated_storage=20,
    storage_encrypted=True,
    backup_retention=Duration.days(7),  # 7-day retention
    preferred_backup_window="03:00-04:00",  # 03:00 UTC daily
    preferred_maintenance_window="Sun:04:00-Sun:05:00",
    deletion_protection=True,
    removal_policy=RemovalPolicy.SNAPSHOT,  # Create final snapshot on deletion
)
```

**Cache Stack** (`lib/stacks/cache_stack.py`):

```python
from aws_cdk import (
    aws_elasticache as elasticache,
)

# ElastiCache Redis Cluster
redis_cluster = elasticache.CfnCacheCluster(
    self, "RedisCluster",
    cache_node_type="cache.t3.micro",
    engine="redis",
    num_cache_nodes=1,
    vpc_security_group_ids=[cache_sg.security_group_id],
    cache_subnet_group_name=subnet_group.ref,
    snapshot_retention_limit=7,  # 7-day retention
    snapshot_window="03:00-04:00",  # 03:00 UTC daily
    preferred_maintenance_window="sun:04:00-sun:05:00",
)
```

**Backup Stack** (`lib/stacks/backup_stack.py`):

```python
from aws_cdk import (
    aws_backup as backup,
    Duration,
)

# AWS Backup Vault
backup_vault = backup.BackupVault(
    self, "BackupVault",
    backup_vault_name="showcore-backup-vault",
    encryption_key=None,  # Use AWS managed key
)

# AWS Backup Plan for RDS
rds_backup_plan = backup.BackupPlan(
    self, "RDSBackupPlan",
    backup_plan_name="showcore-rds-backup-plan",
    backup_vault=backup_vault,
)

rds_backup_plan.add_rule(
    backup.BackupPlanRule(
        rule_name="daily-backups",
        schedule_expression=backup.Schedule.cron(
            hour="3",
            minute="0",
        ),
        delete_after=Duration.days(7),  # 7-day retention
    )
)

rds_backup_plan.add_selection(
    "RDSSelection",
    resources=[
        backup.BackupResource.from_rds_database_instance(database)
    ],
)

# AWS Backup Plan for ElastiCache
elasticache_backup_plan = backup.BackupPlan(
    self, "ElastiCacheBackupPlan",
    backup_plan_name="showcore-elasticache-backup-plan",
    backup_vault=backup_vault,
)

elasticache_backup_plan.add_rule(
    backup.BackupPlanRule(
        rule_name="daily-snapshots",
        schedule_expression=backup.Schedule.cron(
            hour="3",
            minute="0",
        ),
        delete_after=Duration.days(7),  # 7-day retention
    )
)
```

### Verification

**Verify RDS Backups**:
```bash
# List RDS automated backups
aws rds describe-db-instances \
  --db-instance-identifier showcore-database-production-rds \
  --query 'DBInstances[0].{BackupRetention:BackupRetentionPeriod,BackupWindow:PreferredBackupWindow}'

# List RDS snapshots
aws rds describe-db-snapshots \
  --db-instance-identifier showcore-database-production-rds
```

**Verify ElastiCache Snapshots**:
```bash
# List ElastiCache snapshots
aws elasticache describe-snapshots \
  --cache-cluster-id showcore-cache-production-redis
```

**Verify AWS Backup Plans**:
```bash
# List backup plans
aws backup list-backup-plans

# List backup jobs
aws backup list-backup-jobs \
  --by-backup-vault-name showcore-backup-vault
```

### Recovery Procedures

**RDS Point-in-Time Recovery**:
```bash
# Restore to specific time
aws rds restore-db-instance-to-point-in-time \
  --source-db-instance-identifier showcore-database-production-rds \
  --target-db-instance-identifier showcore-database-restored \
  --restore-time 2026-02-04T10:30:00Z
```

**RDS Snapshot Recovery**:
```bash
# Restore from snapshot
aws rds restore-db-instance-from-db-snapshot \
  --db-instance-identifier showcore-database-restored \
  --db-snapshot-identifier rds:showcore-database-production-rds-2026-02-04-03-00
```

**ElastiCache Snapshot Recovery**:
```bash
# Restore from snapshot
aws elasticache create-cache-cluster \
  --cache-cluster-id showcore-cache-restored \
  --snapshot-name showcore-cache-production-redis-2026-02-04-03-00 \
  --cache-node-type cache.t3.micro
```

## When to Revisit This Decision

Should review this decision:

**After 3 Months** - Assess if 7-day retention is sufficient. Check if any issues required older backups. Review backup costs in Cost Explorer.

**If Data Loss Occurs** - If data loss exceeds acceptable RPO, increase backup frequency or enable Multi-AZ.

**If Recovery Takes Too Long** - If recovery exceeds RTO targets, consider Multi-AZ deployment for automatic failover.

**Before Production Launch** - If ShowCore becomes production service with users, increase retention to 30 days and enable Multi-AZ.

**If Compliance Requirements Change** - If regulations mandate longer retention or cross-region replication, implement accordingly.

**Quarterly Cost Review** - Check backup costs in Cost Explorer. Verify costs stay under $2/month.

## References

- [RDS Backup and Restore](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/CHAP_CommonTasks.BackupRestore.html)
- [ElastiCache Backup and Restore](https://docs.aws.amazon.com/AmazonElastiCache/latest/red-ug/backups.html)
- [AWS Backup](https://docs.aws.amazon.com/aws-backup/latest/devguide/whatisbackup.html)
- [RTO and RPO](https://docs.aws.amazon.com/wellarchitected/latest/reliability-pillar/disaster-recovery-dr-objectives.html)
- ShowCore Requirements: 8.1, 8.2, 8.3, 8.4, 8.5
- ShowCore Design: design.md (Backup and Disaster Recovery)

## Related Decisions

- ADR-006: Single-AZ Deployment Strategy - Impacts RTO (no automatic failover)
- ADR-010: S3 Lifecycle Policies - Backup storage lifecycle management
- ADR-008: Encryption Key Management - Backups use AWS managed keys

## Approval

- **Proposed By**: ShowCore Engineering Team
- **Reviewed By**: Cost Optimization Review, Reliability Review
- **Approved By**: Project Lead
- **Date**: February 4, 2026

---

**Implementation Status**: ✅ Implemented in database_stack.py, cache_stack.py, and backup_stack.py  
**Next Review**: After 3 months or when data loss/recovery issues occur
