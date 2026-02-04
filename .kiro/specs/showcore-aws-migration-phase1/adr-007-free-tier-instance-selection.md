# ADR-007: Free Tier Instance Selection Strategy

**Status**: Accepted  
**Date**: February 4, 2026  
**Deciders**: ShowCore Engineering Team  
**Validates**: Requirements 3.1, 3.9, 4.1, 9.1

## Context

Phase 1 infrastructure requires compute resources for RDS PostgreSQL and ElastiCache Redis. AWS offers a wide range of instance types with varying performance characteristics and costs. The AWS Free Tier provides 750 hours/month of specific instance types for the first 12 months.

Key considerations:
- ShowCore is a low-traffic portfolio/learning project
- Target monthly cost under $60
- AWS Free Tier: 750 hours/month db.t3.micro RDS (12 months)
- AWS Free Tier: 750 hours/month cache.t3.micro ElastiCache (12 months)
- Expected workload: Low traffic, simple queries, minimal caching needs
- Performance requirements: Acceptable latency for portfolio website

Instance type decision impacts:
- **Cost**: Free Tier vs paid instances
- **Performance**: CPU, memory, network throughput
- **Scalability**: Ability to handle traffic growth
- **Learning**: Understanding AWS instance sizing

## Decision

**Use Free Tier eligible instance types for Phase 1:**
- **RDS PostgreSQL**: db.t3.micro (2 vCPU, 1 GB RAM)
- **ElastiCache Redis**: cache.t3.micro (2 vCPU, 0.5 GB RAM)

Implementation:
- Single instances (no replicas) for cost optimization
- Burstable performance with CPU credits
- Monitor CPU and memory utilization
- Upgrade to larger instances if performance issues arise
- Free for first 12 months, then $15/month (RDS) + $12/month (ElastiCache)

## Alternatives Considered

### Alternative 1: Larger Instances (db.t3.small, cache.t3.small)

**Approach**: Use next tier up for better performance headroom.

**Pros**:
- More memory: 2 GB (RDS), 1.37 GB (ElastiCache)
- Better performance for complex queries
- More CPU credits for burst capacity
- Less risk of resource exhaustion

**Cons**:
- Not Free Tier eligible
- Higher cost: $30/month (RDS) + $24/month (ElastiCache) = $54/month
- Overkill for low-traffic portfolio website
- Doubles data tier cost

**Monthly Cost**: $54 (data tier only)

**Decision**: Rejected. Not justified for low-traffic learning project.

### Alternative 2: Free Tier Instances (Selected)

**Approach**: Use db.t3.micro and cache.t3.micro (Free Tier eligible).

**Pros**:
- Free for first 12 months (750 hours/month)
- Affordable after Free Tier: $15/month (RDS) + $12/month (ElastiCache)
- Sufficient for low-traffic portfolio website
- Fits within $60 budget
- Teaches resource optimization
- Can upgrade later if needed

**Cons**:
- Limited memory: 1 GB (RDS), 0.5 GB (ElastiCache)
- Limited CPU credits for burst capacity
- May need to upgrade if traffic increases
- Requires monitoring and optimization

**Monthly Cost**: $0 (first 12 months), $27 (after Free Tier)

**Decision**: Accepted. Best balance of cost and functionality.

### Alternative 3: Serverless Options (Aurora Serverless, DynamoDB)

**Approach**: Use serverless databases that scale to zero.

**Pros**:
- Pay only for actual usage
- Automatic scaling
- No instance management
- Can scale to zero when idle

**Cons**:
- Aurora Serverless: Minimum $43/month (not Free Tier eligible)
- DynamoDB: Different data model (NoSQL vs SQL)
- More complex migration from PostgreSQL
- Higher learning curve
- Not suitable for Phase 1 (PostgreSQL requirement)

**Monthly Cost**: $43+ (Aurora Serverless)

**Decision**: Rejected. Not cost-effective for Phase 1, requires data model changes.

### Alternative 4: Reserved Instances

**Approach**: Purchase 1-year or 3-year reserved instances for discount.

**Pros**:
- 30-40% discount vs on-demand pricing
- Predictable costs
- Better for long-term projects

**Cons**:
- Upfront payment required
- Locked into instance type for 1-3 years
- Not Free Tier eligible
- Not suitable for learning project (may change requirements)
- Higher initial cost

**Monthly Cost**: ~$18/month (RDS) + ~$15/month (ElastiCache) with 1-year commitment

**Decision**: Rejected. Too much commitment for learning project.

## Rationale

The decision prioritizes cost optimization while maintaining acceptable performance for a low-traffic portfolio website.

### Cost Analysis

**Free Tier Instances** (selected):
- First 12 months: $0/month (750 hours/month free)
- After 12 months: $27/month ($15 RDS + $12 ElastiCache)
- Total first year: $0
- Total second year: $324

**Larger Instances** (rejected):
- All months: $54/month
- Total first year: $648
- Total second year: $648
- **Additional cost**: $648 first year, $324 second year

**Savings**: $648 first year, $324/year thereafter

### Performance Analysis

**db.t3.micro (RDS)**:
- 2 vCPU (burstable)
- 1 GB RAM
- Baseline CPU: 10% per vCPU
- CPU credits: Accumulate when below baseline
- Network: Up to 5 Gbps
- Storage: 20 GB gp3 (Free Tier limit)

**Sufficient for**:
- Simple to moderate SQL queries
- < 100 concurrent connections
- < 1000 requests/day
- Small database size (< 10 GB)

**May struggle with**:
- Complex joins on large tables
- Heavy analytics queries
- > 100 concurrent connections
- Sustained high CPU usage

**cache.t3.micro (ElastiCache)**:
- 2 vCPU (burstable)
- 0.5 GB RAM (512 MB)
- Baseline CPU: 10% per vCPU
- Network: Up to 5 Gbps

**Sufficient for**:
- Session storage
- Simple key-value caching
- < 50 concurrent connections
- < 100 MB cached data

**May struggle with**:
- Large cached datasets (> 400 MB)
- Complex Redis operations
- High eviction rates
- Sustained high CPU usage

### Expected ShowCore Workload

**Traffic Estimate**:
- Portfolio website visitors: 10-100/day
- Database queries: 100-1000/day
- Cache operations: 500-5000/day
- Peak concurrent users: < 10

**Database Usage**:
- User accounts: < 1000
- Bookings: < 100/month
- Messages: < 500/month
- Total data: < 1 GB

**Cache Usage**:
- Session data: < 50 MB
- Frequently accessed data: < 100 MB
- Total cached: < 200 MB

**Verdict**: Free Tier instances are sufficient for expected workload.

### Monitoring Strategy

Monitor these metrics to detect performance issues:

**RDS Metrics**:
- CPU Utilization: Alert if > 80% for 5 minutes
- Memory: Alert if < 100 MB free
- Database Connections: Alert if > 80
- Read/Write Latency: Alert if > 100ms
- CPU Credit Balance: Alert if < 10

**ElastiCache Metrics**:
- CPU Utilization: Alert if > 75% for 5 minutes
- Memory: Alert if > 80% used
- Evictions: Alert if > 0 (memory pressure)
- Cache Hit Rate: Alert if < 80%
- CPU Credit Balance: Alert if < 10

**Upgrade Triggers**:
- Sustained CPU > 80% for multiple days
- Memory exhaustion (OOM errors)
- Connection limits reached
- Query latency > 500ms
- Cache evictions > 100/hour

### Learning Value

Free Tier instances teach:
- Resource optimization and right-sizing
- Performance monitoring and tuning
- Cost-performance trade-offs
- When to scale up vs scale out
- Burstable performance concepts
- CPU credit management

Larger instances would teach:
- Less about optimization (more headroom)
- Less about cost management
- Less about resource constraints

**Verdict**: Free Tier instances provide better learning experience.

## Consequences

### Positive

1. **Cost Savings**: $648 first year, $324/year thereafter
2. **Free Tier Benefits**: $0 cost for first 12 months
3. **Budget Compliance**: Fits within $60/month target
4. **Learning Opportunity**: Hands-on resource optimization
5. **Upgrade Path**: Can scale up without data loss
6. **Sufficient Performance**: Adequate for expected workload

### Negative

1. **Limited Resources**: 1 GB RAM (RDS), 0.5 GB RAM (ElastiCache)
2. **Performance Risk**: May need to upgrade if traffic increases
3. **Monitoring Required**: Must watch CPU and memory closely
4. **Optimization Needed**: May need query optimization
5. **Burstable Performance**: CPU credits can be exhausted

### Neutral

1. **Acceptable for Portfolio**: Performance adequate for learning project
2. **Monitoring Required**: CloudWatch alarms for resource exhaustion
3. **Optimization Opportunity**: Learn query and cache optimization
4. **Upgrade Available**: Can scale up if needed

## Implementation

### RDS Instance Configuration

```python
rds.DatabaseInstance(
    self, "Database",
    engine=rds.DatabaseInstanceEngine.postgres(version=rds.PostgresEngineVersion.VER_16),
    instance_type=ec2.InstanceType.of(
        ec2.InstanceClass.BURSTABLE3,  # T3 family
        ec2.InstanceSize.MICRO         # Free Tier eligible
    ),
    vpc=vpc,
    allocated_storage=20,  # Free Tier limit
    storage_type=rds.StorageType.GP3,
    max_allocated_storage=100,  # Auto-scaling limit
    # Performance monitoring
    enable_performance_insights=True,
    performance_insight_retention=rds.PerformanceInsightRetention.DEFAULT,  # 7 days free
    monitoring_interval=Duration.seconds(60),  # Enhanced monitoring
)
```

### ElastiCache Instance Configuration

```python
elasticache.CfnCacheCluster(
    self, "RedisCluster",
    cache_node_type="cache.t3.micro",  # Free Tier eligible
    engine="redis",
    engine_version="7.0",
    num_cache_nodes=1,  # Single node
    # Memory management
    cache_parameter_group_name=parameter_group.ref,  # Configure maxmemory-policy
)
```

### CloudWatch Alarms

```python
# RDS CPU Alarm
cloudwatch.Alarm(
    self, "RdsCpuAlarm",
    metric=database.metric_cpu_utilization(),
    threshold=80,
    evaluation_periods=2,
    datapoints_to_alarm=2,
    treat_missing_data=cloudwatch.TreatMissingData.NOT_BREACHING,
)

# RDS Memory Alarm
cloudwatch.Alarm(
    self, "RdsMemoryAlarm",
    metric=database.metric("FreeableMemory"),
    threshold=100_000_000,  # 100 MB
    comparison_operator=cloudwatch.ComparisonOperator.LESS_THAN_THRESHOLD,
    evaluation_periods=2,
)

# ElastiCache Memory Alarm
cloudwatch.Alarm(
    self, "CacheMemoryAlarm",
    metric=cache_cluster.metric("DatabaseMemoryUsagePercentage"),
    threshold=80,
    evaluation_periods=2,
)

# ElastiCache Evictions Alarm
cloudwatch.Alarm(
    self, "CacheEvictionsAlarm",
    metric=cache_cluster.metric("Evictions"),
    threshold=0,
    comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
    evaluation_periods=1,
)
```

### Performance Optimization

**Database Optimization**:
1. Create indexes on frequently queried columns
2. Use connection pooling (max 50 connections)
3. Optimize queries (EXPLAIN ANALYZE)
4. Use prepared statements
5. Limit result set sizes

**Cache Optimization**:
1. Set appropriate TTLs (time-to-live)
2. Use maxmemory-policy: allkeys-lru
3. Monitor cache hit rate (target > 80%)
4. Avoid storing large objects (> 1 MB)
5. Use Redis pipelining for bulk operations

## When to Upgrade

Consider upgrading to larger instances when:

1. **CPU Exhaustion**: Sustained CPU > 80% for multiple days
2. **Memory Pressure**: Frequent OOM errors or evictions
3. **Connection Limits**: Reaching max connections (100 for RDS)
4. **Query Performance**: Latency > 500ms for simple queries
5. **Traffic Growth**: Consistent traffic > 1000 requests/day
6. **Data Growth**: Database size > 15 GB

**Upgrade Path**:
- db.t3.micro → db.t3.small (2 GB RAM, $30/month)
- cache.t3.micro → cache.t3.small (1.37 GB RAM, $24/month)
- Can upgrade with minimal downtime (5-15 minutes)

## Cost-Benefit Analysis

**Free Tier Benefits**:
- Save $648 first year (12 months free)
- Save $324/year thereafter vs larger instances
- Total savings: $972 over first 2 years

**Performance Trade-offs**:
- Adequate for expected workload (< 1000 requests/day)
- May need optimization for complex queries
- Monitoring required to detect issues
- Upgrade available if needed

**Verdict**: For a low-traffic portfolio website, Free Tier cost savings ($972 over 2 years) outweigh performance limitations.

## References

- [RDS Instance Types](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/Concepts.DBInstanceClass.html)
- [ElastiCache Node Types](https://docs.aws.amazon.com/AmazonElastiCache/latest/red-ug/CacheNodes.SupportedTypes.html)
- [AWS Free Tier](https://aws.amazon.com/free/)
- [T3 Instances](https://aws.amazon.com/ec2/instance-types/t3/)
- [RDS Pricing](https://aws.amazon.com/rds/postgresql/pricing/)
- [ElastiCache Pricing](https://aws.amazon.com/elasticache/pricing/)
- ShowCore Requirements: 3.1, 3.9, 4.1, 9.1
- ShowCore Design: design.md (Database and Cache Infrastructure)

## Related Decisions

- ADR-001: VPC Endpoints over NAT Gateway (cost optimization)
- ADR-006: Single-AZ deployment strategy (cost optimization)
- ADR-008: Encryption key management (cost optimization)

## Approval

- **Proposed By**: ShowCore Engineering Team
- **Reviewed By**: Cost Optimization Review
- **Approved By**: Project Lead
- **Date**: February 4, 2026

---

**Implementation Status**: ✅ Implemented in `infrastructure/lib/stacks/database_stack.py` and `cache_stack.py`  
**Next Review**: After Phase 1 completion or when performance issues arise
