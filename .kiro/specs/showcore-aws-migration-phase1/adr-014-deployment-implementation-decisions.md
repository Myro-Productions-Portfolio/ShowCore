# ADR-014: Deployment Implementation Decisions

**Status**: Accepted  
**Date**: 2026-02-04  
**Decision Makers**: ShowCore Engineering Team  
**Tags**: #deployment #implementation #aws-cdk #infrastructure

---

## Context

During the deployment of ShowCore Phase 1 infrastructure to AWS, we encountered several technical challenges that required architectural decisions. These decisions were made to ensure successful deployment while maintaining security, cost optimization, and infrastructure integrity.

## Decision

We made the following implementation decisions during deployment:

### 1. AWS Config Disabled Due to SCP Restrictions

**Decision**: Disable AWS Config resources in SecurityStack

**Reason**: The AWS account has a Service Control Policy (SCP) that explicitly denies AWS Config operations:
```
AccessDeniedException: User is not authorized to perform: config:PutConfigurationRecorder 
with an explicit deny in a service control policy
```

**Impact**:
- No automated compliance monitoring via AWS Config
- Manual compliance checks required
- CloudTrail still provides audit logging
- Can be re-enabled if SCP is modified

**Alternative Considered**: Request SCP modification - rejected due to organizational constraints

### 2. ElastiCache Encryption Disabled

**Decision**: Disable transit encryption for ElastiCache Redis cluster

**Reason**: AWS ElastiCache CacheCluster (single node) does not support `transit_encryption_enabled`:
```
InvalidParameterCombination: Encryption feature is not supported for engine REDIS
```

**Impact**:
- Data in transit is not encrypted between application and Redis
- Acceptable for learning/development project
- Redis is in private subnet with no internet access
- Can be enabled by migrating to ReplicationGroup

**Alternative Considered**: Use ReplicationGroup instead of CacheCluster - rejected due to increased complexity and cost

### 3. CloudWatch Alarms Centralized in MonitoringStack

**Decision**: Remove alarm creation from DatabaseStack and CacheStack

**Reason**: MonitoringStack already creates all CloudWatch alarms, causing "alarm already exists" errors when DatabaseStack and CacheStack tried to create the same alarms.

**Impact**:
- All alarms managed in one place (MonitoringStack)
- Cleaner separation of concerns
- Easier to manage alarm configurations
- DatabaseStack and CacheStack focus on resource provisioning only

**Implementation**:
```python
# In DatabaseStack and CacheStack __init__:
# CloudWatch alarms are created in MonitoringStack to avoid duplication
# self._create_rds_alarms()  # Commented out
# self._create_elasticache_alarms()  # Commented out
```

### 4. CDN Stack Cyclic Dependency Resolution

**Decision**: Pass S3 bucket name as string instead of bucket object to CDNStack

**Reason**: Passing the bucket object from StorageStack to CDNStack created a cyclic dependency:
- CDNStack depends on StorageStack (needs bucket)
- S3Origin automatically updates bucket policy, creating StorageStack → CDNStack dependency
- Result: Circular reference error

**Solution**:
```python
# In app.py:
cdn_stack = ShowCoreCDNStack(
    app,
    "ShowCoreCDNStack",
    static_assets_bucket_name=storage_stack.static_assets_bucket.bucket_name,  # String, not object
    env=env,
    description="ShowCore Phase 1 - CloudFront CDN Distribution"
)

# In cdn_stack.py:
self.static_assets_bucket = s3.Bucket.from_bucket_name(
    self,
    "StaticAssetsBucket",
    bucket_name=static_assets_bucket_name  # Look up by name
)
```

**Impact**:
- Breaks circular dependency
- S3 bucket remains intact and safe
- No explicit stack dependency needed
- CloudFront can still access bucket via OAI

### 5. VPC Subnet Selection for ElastiCache

**Decision**: Use `vpc.isolated_subnets` instead of `vpc.private_subnets`

**Reason**: NetworkStack creates subnets with `SubnetType.PRIVATE_ISOLATED`, which are accessed via `vpc.isolated_subnets`, not `vpc.private_subnets`.

**Error Encountered**:
```
InvalidParameterValue: The parameter SubnetIds must be provided
```

**Impact**:
- ElastiCache correctly deployed in private subnets
- Consistent with RDS subnet selection
- No internet access (as intended)

### 6. CDK API Compatibility Fixes

**Decision**: Use correct CDK v2 APIs for Duration and Schedule

**Issues Fixed**:
- `cloudwatch.Duration` → `Duration` (imported from aws_cdk)
- `backup.BackupPlanRule.daily()` → `events.Schedule.cron(minute="0", hour="3")`
- `rds_parameter_group.parameter_group_name` → `rds_parameter_group.ref` (then commented out due to L2 construct limitations)

**Impact**:
- Code compatible with CDK v2.1104.0
- Proper type checking and validation
- Cleaner, more maintainable code

## Consequences

### Positive

1. **All 8 stacks successfully deployed** to AWS
2. **Infrastructure is functional** and ready for application integration
3. **Cost optimized** - staying within Free Tier limits
4. **Security maintained** - private subnets, CloudTrail logging, security groups
5. **Clean architecture** - proper separation of concerns
6. **No data loss** - S3 buckets remain intact

### Negative

1. **AWS Config disabled** - no automated compliance monitoring
2. **ElastiCache not encrypted** - data in transit not protected
3. **Manual workarounds** - some CDK limitations required workarounds

### Neutral

1. **Documentation debt** - these decisions need to be documented (this ADR)
2. **Future refactoring** - some decisions may need revisiting for production

## Validation

### Deployment Verification

```bash
# All stacks deployed successfully
aws cloudformation list-stacks --stack-status-filter CREATE_COMPLETE UPDATE_COMPLETE \
  --query 'StackSummaries[?contains(StackName, `ShowCore`)].Name'

# Output:
# - ShowCoreNetworkStack
# - ShowCoreSecurityStack
# - ShowCoreMonitoringStack
# - ShowCoreDatabaseStack
# - ShowCoreCacheStack
# - ShowCoreStorageStack
# - ShowCoreCDNStack
# - ShowCoreBackupStack
```

### Resource Verification

- ✅ VPC with 4 subnets (2 public, 2 private)
- ✅ VPC Endpoints (S3, DynamoDB, CloudWatch, Systems Manager)
- ✅ RDS PostgreSQL (db.t3.micro, single-AZ)
- ✅ ElastiCache Redis (cache.t3.micro, single node)
- ✅ S3 buckets (static assets, backups, CloudTrail logs)
- ✅ CloudFront distribution
- ✅ CloudWatch dashboards and alarms
- ✅ AWS Backup plans
- ✅ CloudTrail audit logging

### Cost Verification

- Estimated monthly cost: ~$3-10 (during Free Tier), ~$49-60 (after Free Tier)
- No NAT Gateway: ~$32/month saved
- Free Tier instances: db.t3.micro, cache.t3.micro
- Single-AZ deployment: 50% cost reduction

## Related ADRs

- [ADR-001: VPC Endpoints Over NAT Gateway](adr-001-vpc-endpoints-over-nat-gateway.md)
- [ADR-002: Infrastructure as Code Tool Selection](adr-002-infrastructure-as-code-tool.md)
- [ADR-006: Single-AZ Deployment Strategy](adr-006-single-az-deployment-strategy.md)
- [ADR-007: Free Tier Instance Selection](adr-007-free-tier-instance-selection.md)
- [ADR-008: Encryption Key Management](adr-008-encryption-key-management.md)

## Notes

- Deployment completed: 2026-02-04
- Total deployment time: ~40 minutes (including troubleshooting)
- AWS Account: 498618930321
- AWS Region: us-east-1
- CDK Version: 2.1104.0
- Python Version: 3.14.2

## Future Considerations

1. **Enable AWS Config** if SCP restrictions are lifted
2. **Enable ElastiCache encryption** by migrating to ReplicationGroup
3. **Multi-AZ deployment** if traffic increases and budget allows
4. **CloudFront OAC** instead of OAI (when CDK L2 support improves)
5. **Automated testing** of deployed infrastructure

---

**Last Updated**: 2026-02-04  
**Status**: Accepted and Implemented  
**Review Date**: After Phase 2 planning
