# ADR-006: Single-AZ vs Multi-AZ Deployment Strategy

**Status**: Accepted  
**Date**: February 4, 2026  
**Deciders**: ShowCore Engineering Team  
**Validates**: Requirements 3.2, 4.2, 9.5

## Context

Phase 1 infrastructure includes RDS PostgreSQL 16 and ElastiCache Redis 7 for the data tier. AWS offers two deployment options:

1. **Single-AZ**: Deploy database/cache in one availability zone
2. **Multi-AZ**: Deploy primary in one AZ with standby replica in another AZ

This decision impacts:
- **Cost**: Multi-AZ roughly doubles the cost of RDS and ElastiCache
- **Availability**: Multi-AZ provides automatic failover during AZ outages
- **Performance**: Multi-AZ adds replication latency for writes
- **Maintenance**: Multi-AZ enables zero-downtime patching

Current context:
- ShowCore is a low-traffic portfolio/learning project
- Target monthly cost under $60 (currently ~$3-10 during Free Tier, ~$49-60 after)
- RDS db.t3.micro: $15/month single-AZ, $30/month Multi-AZ
- ElastiCache cache.t3.micro: $12/month single-AZ, $24/month Multi-AZ
- Expected traffic: Low (personal portfolio website)
- Acceptable downtime: Minutes to hours for maintenance

## Decision

**Deploy RDS PostgreSQL and ElastiCache Redis in Single-AZ configuration for Phase 1.**

Implementation:
- RDS instance in us-east-1a (single AZ)
- ElastiCache cluster in us-east-1a (single node, no replicas)
- Automated daily backups with 7-day retention
- Point-in-time recovery enabled for RDS
- Manual snapshots before major changes
- Can upgrade to Multi-AZ later if traffic increases

## Alternatives Considered

### Alternative 1: Multi-AZ Deployment (High Availability)

**Approach**: Deploy RDS with Multi-AZ and ElastiCache with replica nodes.

**Pros**:
- Automatic failover during AZ outages (typically < 2 minutes)
- Zero-downtime patching and maintenance
- Higher availability SLA (99.95% vs 99.5%)
- Better disaster recovery posture
- Production-ready architecture
- Synchronous replication for RDS (no data loss)

**Cons**:
- Doubles cost: RDS $15→$30/month, ElastiCache $12→$24/month
- Total increase: ~$27/month (45% cost increase)
- Overkill for low-traffic portfolio website
- Replication latency for writes (typically < 10ms)
- More complex troubleshooting
- Not Free Tier eligible

**Monthly Cost**: ~$76-87 (exceeds $60 budget)

**Decision**: Rejected due to cost. Not justified for low-traffic learning project.

### Alternative 2: Single-AZ with Manual Failover Plan (Selected)

**Approach**: Single-AZ deployment with documented manual failover procedures.

**Pros**:
- Cost-effective: $15/month RDS, $12/month ElastiCache
- Fits within $60 budget
- Automated backups provide recovery capability
- Point-in-time recovery for RDS (5-minute granularity)
- Acceptable downtime for portfolio website
- Can upgrade to Multi-AZ later if needed
- Free Tier eligible for first 12 months

**Cons**:
- No automatic failover during AZ outages
- Downtime during maintenance windows (typically 30-60 minutes)
- Manual intervention required for recovery
- Lower availability SLA (99.5%)
- Potential data loss if AZ fails (up to 5 minutes for RDS)

**Monthly Cost**: ~$49-60 (within budget)

**Decision**: Accepted for Phase 1. Best balance of cost and functionality.

### Alternative 3: Hybrid Approach (RDS Multi-AZ, ElastiCache Single-AZ)

**Approach**: Multi-AZ for RDS (persistent data), Single-AZ for ElastiCache (cache).

**Pros**:
- Protects persistent data with Multi-AZ
- Cache can be rebuilt from database
- Moderate cost increase (~$15/month)
- Better availability for database

**Cons**:
- Still exceeds budget: ~$64-75/month
- Inconsistent architecture (some HA, some not)
- Cache downtime still impacts application
- Not significantly better than full Single-AZ

**Monthly Cost**: ~$64-75 (exceeds $60 budget)

**Decision**: Rejected. Cost still too high, inconsistent architecture.

### Alternative 4: Read Replicas (RDS Only)

**Approach**: Single-AZ primary with read replicas for scaling.

**Pros**:
- Improves read performance
- Can promote replica to primary if needed
- Lower cost than Multi-AZ (~$15/month per replica)

**Cons**:
- Not needed for low-traffic website
- Adds cost without availability benefit
- Manual promotion required (not automatic failover)
- Asynchronous replication (potential data loss)

**Monthly Cost**: ~$64-75 (exceeds $60 budget)

**Decision**: Rejected. Not needed for Phase 1 traffic levels.

## Rationale

The decision prioritizes cost optimization while maintaining acceptable availability for a learning project.

### Cost Analysis

**Single-AZ** (selected):
- RDS db.t3.micro: $15/month (Free Tier: $0 for 12 months)
- ElastiCache cache.t3.micro: $12/month (Free Tier: $0 for 12 months)
- Total data tier: $27/month ($0 during Free Tier)
- Total Phase 1: ~$49-60/month (~$3-10 during Free Tier)

**Multi-AZ** (rejected):
- RDS db.t3.micro Multi-AZ: $30/month (not Free Tier eligible)
- ElastiCache with replica: $24/month (not Free Tier eligible)
- Total data tier: $54/month
- Total Phase 1: ~$76-87/month
- **Cost increase: 45%**

**Savings**: $27/month ($324/year) by using Single-AZ

### Availability Analysis

**Single-AZ Availability**:
- AWS SLA: 99.5% (43.8 hours downtime/year)
- Actual availability typically higher (99.9%+)
- Downtime scenarios:
  - AZ outage: Requires manual failover from backup (RTO: 30-60 minutes)
  - Maintenance: Scheduled downtime (30-60 minutes, can schedule off-peak)
  - Instance failure: Automatic recovery (RTO: 5-15 minutes)

**Multi-AZ Availability**:
- AWS SLA: 99.95% (4.4 hours downtime/year)
- Automatic failover: < 2 minutes
- Zero-downtime maintenance
- No data loss during failover

**Acceptable for ShowCore**:
- Portfolio website, not production application
- Low traffic (personal project)
- Downtime of 30-60 minutes acceptable for maintenance
- Can schedule maintenance during off-peak hours
- Automated backups provide recovery capability

### Learning Value

Single-AZ deployment teaches:
- Backup and recovery procedures
- Manual failover processes
- Maintenance window planning
- Cost optimization trade-offs
- When to use Multi-AZ vs Single-AZ

Multi-AZ would teach:
- High availability architecture
- Automatic failover mechanisms
- Replication concepts

**Verdict**: Single-AZ provides sufficient learning value while staying within budget.

### Risk Assessment

**Risks of Single-AZ**:
1. **AZ Outage**: Rare (< 0.1% probability), requires manual failover
2. **Maintenance Downtime**: Scheduled, can plan around it
3. **Instance Failure**: Automatic recovery, minimal downtime
4. **Data Loss**: Up to 5 minutes if AZ fails (point-in-time recovery)

**Mitigation Strategies**:
1. **Automated Backups**: Daily backups with 7-day retention
2. **Point-in-Time Recovery**: 5-minute granularity for RDS
3. **Manual Snapshots**: Before major changes
4. **Monitoring**: CloudWatch alarms for failures
5. **Runbooks**: Documented recovery procedures
6. **Upgrade Path**: Can enable Multi-AZ later if needed

**Risk Acceptance**: Acceptable for low-traffic portfolio website.

## Consequences

### Positive

1. **Cost Savings**: $27/month ($324/year) compared to Multi-AZ
2. **Budget Compliance**: Stays within $60/month target
3. **Free Tier Eligible**: $0 cost for first 12 months
4. **Simpler Architecture**: Easier to understand and troubleshoot
5. **Learning Opportunity**: Hands-on experience with backup/recovery
6. **Upgrade Path**: Can enable Multi-AZ later without data loss

### Negative

1. **Lower Availability**: 99.5% SLA vs 99.95% for Multi-AZ
2. **Maintenance Downtime**: 30-60 minutes during patching
3. **Manual Failover**: Requires human intervention during AZ outage
4. **Potential Data Loss**: Up to 5 minutes if AZ fails
5. **No Zero-Downtime Patching**: Must schedule maintenance windows

### Neutral

1. **Acceptable for Portfolio**: Downtime acceptable for learning project
2. **Monitoring Required**: Must monitor backups and health
3. **Runbooks Needed**: Document recovery procedures
4. **Scheduled Maintenance**: Plan maintenance during off-peak hours

## Implementation

### RDS Configuration

```python
rds.DatabaseInstance(
    self, "Database",
    engine=rds.DatabaseInstanceEngine.postgres(version=rds.PostgresEngineVersion.VER_16),
    instance_type=ec2.InstanceType.of(ec2.InstanceClass.BURSTABLE3, ec2.InstanceSize.MICRO),
    vpc=vpc,
    vpc_subnets=ec2.SubnetSelection(subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS),
    multi_az=False,  # Single-AZ deployment
    allocated_storage=20,  # Free Tier limit
    storage_type=rds.StorageType.GP3,
    backup_retention=Duration.days(7),
    preferred_backup_window="03:00-04:00",  # Off-peak hours
    preferred_maintenance_window="sun:04:00-sun:05:00",  # Sunday morning
    deletion_protection=True,  # Prevent accidental deletion
    removal_policy=RemovalPolicy.SNAPSHOT,  # Create snapshot on deletion
)
```

### ElastiCache Configuration

```python
elasticache.CfnCacheCluster(
    self, "RedisCluster",
    cache_node_type="cache.t3.micro",
    engine="redis",
    num_cache_nodes=1,  # Single node, no replicas
    vpc_security_group_ids=[security_group.security_group_id],
    cache_subnet_group_name=subnet_group.ref,
    preferred_maintenance_window="sun:04:00-sun:05:00",  # Sunday morning
    snapshot_retention_limit=7,  # 7-day retention
    snapshot_window="03:00-04:00",  # Off-peak hours
)
```

### Backup Strategy

1. **Automated Daily Backups**:
   - RDS: 7-day retention, 03:00-04:00 UTC
   - ElastiCache: 7-day retention, 03:00-04:00 UTC

2. **Point-in-Time Recovery**:
   - RDS: Enabled, 5-minute granularity
   - ElastiCache: Not available (snapshot-based only)

3. **Manual Snapshots**:
   - Before major schema changes
   - Before application deployments
   - Before infrastructure changes

4. **Maintenance Windows**:
   - Sunday 04:00-05:00 UTC (off-peak)
   - Can reschedule if needed

### Recovery Procedures

**RDS Recovery from Backup**:
1. Identify latest backup or point-in-time
2. Restore to new RDS instance
3. Update application connection string
4. Verify data integrity
5. Delete old instance

**ElastiCache Recovery from Snapshot**:
1. Identify latest snapshot
2. Restore to new cluster
3. Update application connection string
4. Verify cache functionality
5. Delete old cluster

**Estimated RTO**: 30-60 minutes  
**Estimated RPO**: 5 minutes (RDS), 24 hours (ElastiCache)

### Monitoring

CloudWatch alarms for:
- RDS backup failures → critical alert
- ElastiCache snapshot failures → critical alert
- RDS storage < 15% → warning alert
- RDS CPU > 80% → critical alert
- ElastiCache memory > 80% → critical alert

## When to Upgrade to Multi-AZ

Consider upgrading to Multi-AZ when:

1. **Traffic Increases**: Consistent traffic > 1000 requests/day
2. **Availability Requirements**: Downtime becomes unacceptable
3. **Production Use**: Moving beyond portfolio/learning project
4. **Budget Increases**: Can afford $27/month additional cost
5. **Business Critical**: Data becomes business-critical
6. **Compliance**: Regulatory requirements mandate high availability

**Upgrade Process**:
1. Enable Multi-AZ via AWS Console or CDK
2. AWS creates standby replica automatically
3. No downtime during upgrade
4. Automatic failover enabled after replication complete
5. Cost increases to Multi-AZ pricing

## Cost-Benefit Analysis

**Single-AZ Benefits**:
- Save $27/month ($324/year)
- Free Tier eligible (save $27/month for 12 months = $324)
- Total savings: $648 over first year

**Multi-AZ Benefits**:
- Automatic failover (< 2 minutes)
- Zero-downtime patching
- Higher availability SLA (99.95% vs 99.5%)
- Better disaster recovery

**Verdict**: For a low-traffic portfolio website, Single-AZ cost savings ($648/year) outweigh Multi-AZ availability benefits.

## References

- [RDS Multi-AZ Deployments](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/Concepts.MultiAZ.html)
- [ElastiCache Replication](https://docs.aws.amazon.com/AmazonElastiCache/latest/red-ug/Replication.html)
- [RDS Pricing](https://aws.amazon.com/rds/postgresql/pricing/)
- [ElastiCache Pricing](https://aws.amazon.com/elasticache/pricing/)
- [AWS Free Tier](https://aws.amazon.com/free/)
- ShowCore Requirements: 3.2, 4.2, 9.5
- ShowCore Design: design.md (Database and Cache Infrastructure)

## Related Decisions

- ADR-001: VPC Endpoints over NAT Gateway (cost optimization)
- ADR-007: Free Tier instance selection (cost optimization)
- ADR-008: Encryption key management (cost optimization)

## Approval

- **Proposed By**: ShowCore Engineering Team
- **Reviewed By**: Cost Optimization Review
- **Approved By**: Project Lead
- **Date**: February 4, 2026

---

**Implementation Status**: ✅ Implemented in `infrastructure/lib/stacks/database_stack.py` and `cache_stack.py`  
**Next Review**: After Phase 1 completion or when traffic exceeds 1000 requests/day
