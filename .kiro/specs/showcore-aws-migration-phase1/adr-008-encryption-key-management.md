# ADR-008: AWS Managed Keys vs KMS Customer Managed Keys

**Status**: Accepted  
**Date**: February 4, 2026  
**Deciders**: ShowCore Engineering Team  
**Validates**: Requirements 3.5, 4.4, 5.3, 6.4, 9.9

## Context

Phase 1 infrastructure requires encryption at rest for all data storage services:
- RDS PostgreSQL database
- ElastiCache Redis cluster
- S3 buckets (static assets, backups, CloudTrail logs)

AWS provides two encryption key management options:

1. **AWS Managed Keys (SSE-S3, AWS managed RDS/ElastiCache encryption)**:
   - Free, automatic key management
   - AWS handles key rotation automatically
   - No key management overhead
   - Limited control over key policies

2. **KMS Customer Managed Keys (CMK)**:
   - Full control over key policies and rotation
   - Audit trail for key usage
   - Cross-account access control
   - Cost: $1/month per key + $0.03 per 10,000 API requests

Current context:
- ShowCore is a low-traffic portfolio/learning project
- Target monthly cost under $60
- No compliance requirements mandating CMK
- No cross-account access requirements
- No custom key rotation policies needed
- Expected encryption API calls: < 100,000/month

## Decision

**Use AWS Managed Keys for all encryption at rest in Phase 1.**

Implementation:
- **RDS**: AWS managed encryption (automatic key rotation)
- **ElastiCache**: AWS managed encryption (automatic key rotation)
- **S3**: SSE-S3 (AWS managed keys, automatic key rotation)
- **CloudTrail**: SSE-S3 for log bucket
- No KMS Customer Managed Keys
- Can migrate to CMK later if compliance requires

## Alternatives Considered

### Alternative 1: KMS Customer Managed Keys (CMK)

**Approach**: Create KMS CMKs for each service (RDS, ElastiCache, S3).

**Pros**:
- Full control over key policies
- Custom key rotation schedules
- Audit trail for key usage (CloudTrail)
- Cross-account access control
- Compliance-ready for strict requirements
- Can disable/delete keys
- Granular IAM permissions

**Cons**:
- Cost: $1/month per key (3-4 keys = $3-4/month)
- Cost: $0.03 per 10,000 API requests (~$0.30/month estimated)
- Total cost: ~$3.30-4.30/month additional
- Key management overhead
- Risk of accidental key deletion (data loss)
- More complex IAM policies
- Not needed for Phase 1 requirements

**Monthly Cost**: ~$3.30-4.30 additional

**Decision**: Rejected due to cost and complexity. Not justified for Phase 1.

### Alternative 2: AWS Managed Keys (Selected)

**Approach**: Use AWS managed encryption for all services.

**Pros**:
- Free (no additional cost)
- Automatic key rotation (every 3 years for RDS/ElastiCache, every year for S3)
- No key management overhead
- AWS handles key lifecycle
- Sufficient for most use cases
- Meets compliance requirements for Phase 1
- Simple IAM policies
- No risk of accidental key deletion

**Cons**:
- Limited control over key policies
- Cannot customize rotation schedule
- Cannot disable keys
- Cannot grant cross-account access
- Less detailed audit trail
- Cannot use for client-side encryption

**Monthly Cost**: $0

**Decision**: Accepted. Best balance of security and cost for Phase 1.

### Alternative 3: Hybrid Approach (CMK for RDS, AWS Managed for Others)

**Approach**: Use CMK for critical data (RDS), AWS managed for less critical (S3, ElastiCache).

**Pros**:
- Protects most critical data with CMK
- Lower cost than full CMK (~$1.30/month)
- Audit trail for database encryption
- Flexibility for future compliance

**Cons**:
- Inconsistent architecture
- Still adds cost
- Key management overhead for RDS
- Not significantly better than full AWS managed
- Complexity without clear benefit

**Monthly Cost**: ~$1.30 additional

**Decision**: Rejected. Inconsistent architecture, not worth the cost.

### Alternative 4: No Encryption

**Approach**: Disable encryption at rest (not recommended).

**Pros**:
- Slightly better performance (negligible)
- No encryption overhead

**Cons**:
- Security risk (data exposed if storage compromised)
- Violates AWS best practices
- Violates ShowCore requirements (3.5, 4.4, 5.3)
- Not acceptable for any production use
- Bad practice for learning project

**Monthly Cost**: $0

**Decision**: Rejected. Security requirement, not negotiable.

## Rationale

The decision prioritizes cost optimization while maintaining strong security posture.

### Cost Analysis

**AWS Managed Keys** (selected):
- RDS encryption: $0
- ElastiCache encryption: $0
- S3 SSE-S3: $0
- Total: $0/month

**KMS Customer Managed Keys** (rejected):
- RDS CMK: $1/month
- ElastiCache CMK: $1/month
- S3 CMK: $1/month
- CloudTrail CMK: $1/month (optional)
- API requests: ~$0.30/month
- Total: ~$3.30-4.30/month

**Savings**: $3.30-4.30/month ($40-52/year)

### Security Analysis

**AWS Managed Keys Security**:
- AES-256 encryption (industry standard)
- Automatic key rotation (every 1-3 years)
- Keys stored in AWS-managed HSMs
- Keys never exposed to users
- Integrated with IAM for access control
- Meets most compliance requirements (PCI-DSS, HIPAA, etc.)

**KMS CMK Security**:
- AES-256 encryption (same as AWS managed)
- Custom key rotation (manual or automatic)
- Keys stored in AWS-managed HSMs (same as AWS managed)
- More granular access control
- Detailed audit trail (CloudTrail)
- Required for some compliance (FIPS 140-2 Level 3, etc.)

**Verdict**: AWS managed keys provide sufficient security for Phase 1. No compliance requirements mandate CMK.

### Compliance Analysis

**ShowCore Requirements**:
- Requirement 3.5: Enable encryption at rest for RDS ✅
- Requirement 4.4: Enable encryption at rest for ElastiCache ✅
- Requirement 5.3: Enable encryption at rest for S3 ✅
- Requirement 6.4: Use AWS managed keys for cost optimization ✅
- Requirement 9.9: Use SSE-S3 instead of KMS to avoid costs ✅

**Compliance Standards**:
- PCI-DSS: AWS managed keys acceptable ✅
- HIPAA: AWS managed keys acceptable ✅
- SOC 2: AWS managed keys acceptable ✅
- GDPR: AWS managed keys acceptable ✅
- FIPS 140-2 Level 2: AWS managed keys acceptable ✅
- FIPS 140-2 Level 3: Requires KMS CMK ❌ (not required for Phase 1)

**Verdict**: AWS managed keys meet all Phase 1 compliance requirements.

### Key Rotation Analysis

**AWS Managed Keys Rotation**:
- RDS/ElastiCache: Automatic rotation every 3 years
- S3 SSE-S3: Automatic rotation every year
- No manual intervention required
- No downtime during rotation
- Old keys retained for decryption

**KMS CMK Rotation**:
- Automatic rotation: Every year (if enabled)
- Manual rotation: On-demand
- No downtime during rotation
- Old keys retained for decryption
- More control over rotation schedule

**Verdict**: AWS managed key rotation is sufficient for Phase 1. No need for custom rotation schedules.

### Operational Overhead

**AWS Managed Keys**:
- Zero operational overhead
- No key lifecycle management
- No risk of accidental key deletion
- No IAM policy complexity
- No CloudTrail log analysis for key usage

**KMS CMK**:
- Key lifecycle management required
- Risk of accidental key deletion (data loss)
- Complex IAM policies for key access
- CloudTrail log analysis for key usage
- Key rotation management

**Verdict**: AWS managed keys reduce operational overhead, suitable for solo developer.

## Consequences

### Positive

1. **Cost Savings**: $3.30-4.30/month ($40-52/year)
2. **Zero Overhead**: No key management required
3. **Automatic Rotation**: Keys rotated automatically
4. **Simple IAM**: No complex key policies
5. **No Risk**: Cannot accidentally delete keys
6. **Sufficient Security**: AES-256 encryption, meets compliance
7. **Upgrade Path**: Can migrate to CMK later if needed

### Negative

1. **Limited Control**: Cannot customize key policies
2. **No Custom Rotation**: Cannot change rotation schedule
3. **No Cross-Account**: Cannot grant cross-account access
4. **Less Audit Trail**: Limited key usage visibility
5. **Cannot Disable**: Cannot disable keys temporarily

### Neutral

1. **Acceptable for Phase 1**: No compliance requirements mandate CMK
2. **Learning Trade-off**: Less KMS experience, but simpler architecture
3. **Migration Path**: Can migrate to CMK without data loss

## Implementation

### RDS Encryption Configuration

```python
rds.DatabaseInstance(
    self, "Database",
    engine=rds.DatabaseInstanceEngine.postgres(version=rds.PostgresEngineVersion.VER_16),
    storage_encrypted=True,  # Enable encryption at rest
    # No encryption_key specified = AWS managed key
    # Automatic key rotation every 3 years
)
```

### ElastiCache Encryption Configuration

```python
elasticache.CfnCacheCluster(
    self, "RedisCluster",
    cache_node_type="cache.t3.micro",
    engine="redis",
    at_rest_encryption_enabled=True,  # Enable encryption at rest
    # No kms_key_id specified = AWS managed encryption
    # Automatic key rotation every 3 years
    transit_encryption_enabled=True,  # Also enable in-transit encryption
)
```

### S3 Encryption Configuration

```python
# Static Assets Bucket
s3.Bucket(
    self, "StaticAssetsBucket",
    encryption=s3.BucketEncryption.S3_MANAGED,  # SSE-S3
    # Automatic key rotation every year
    versioned=True,
    block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
)

# Backups Bucket
s3.Bucket(
    self, "BackupsBucket",
    encryption=s3.BucketEncryption.S3_MANAGED,  # SSE-S3
    # Automatic key rotation every year
    versioned=True,
    block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
)

# CloudTrail Logs Bucket
s3.Bucket(
    self, "CloudTrailLogsBucket",
    encryption=s3.BucketEncryption.S3_MANAGED,  # SSE-S3
    # Automatic key rotation every year
    versioned=True,
    block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
)
```

### Encryption Verification

**Verify RDS Encryption**:
```bash
aws rds describe-db-instances \
  --db-instance-identifier showcore-database-production-rds \
  --query 'DBInstances[0].StorageEncrypted'
# Should return: true
```

**Verify ElastiCache Encryption**:
```bash
aws elasticache describe-cache-clusters \
  --cache-cluster-id showcore-cache-production-redis \
  --query 'CacheClusters[0].AtRestEncryptionEnabled'
# Should return: true
```

**Verify S3 Encryption**:
```bash
aws s3api get-bucket-encryption \
  --bucket showcore-static-assets-123456789012
# Should return: "SSEAlgorithm": "AES256"
```

## When to Migrate to KMS CMK

Consider migrating to KMS Customer Managed Keys when:

1. **Compliance Requirements**: Regulations mandate CMK (FIPS 140-2 Level 3, etc.)
2. **Cross-Account Access**: Need to share encrypted data across AWS accounts
3. **Custom Rotation**: Need custom key rotation schedules
4. **Audit Requirements**: Need detailed key usage audit trail
5. **Key Policies**: Need granular control over key access
6. **Budget Increases**: Can afford $3-4/month additional cost

**Migration Process**:
1. Create KMS CMKs for each service
2. Create snapshot/backup with AWS managed key
3. Restore from snapshot with CMK encryption
4. Update application to use new endpoints
5. Delete old resources
6. No data loss during migration

**Estimated Downtime**: 30-60 minutes per service

## Cost-Benefit Analysis

**AWS Managed Keys Benefits**:
- Save $3.30-4.30/month ($40-52/year)
- Zero operational overhead
- No risk of key deletion
- Automatic rotation
- Simple architecture

**KMS CMK Benefits**:
- Full control over keys
- Custom rotation schedules
- Detailed audit trail
- Cross-account access
- Compliance-ready

**Verdict**: For Phase 1, AWS managed keys cost savings ($40-52/year) outweigh CMK control benefits.

## Security Best Practices

Even with AWS managed keys, follow these security practices:

1. **Enable Encryption**: Always enable encryption at rest
2. **Enable In-Transit**: Also enable encryption in transit (SSL/TLS)
3. **IAM Policies**: Use least privilege IAM policies
4. **Backup Encryption**: Ensure backups are also encrypted
5. **Monitoring**: Monitor for encryption failures
6. **Compliance**: Document encryption approach for audits

## References

- [RDS Encryption](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/Overview.Encryption.html)
- [ElastiCache Encryption](https://docs.aws.amazon.com/AmazonElastiCache/latest/red-ug/at-rest-encryption.html)
- [S3 Encryption](https://docs.aws.amazon.com/AmazonS3/latest/userguide/serv-side-encryption.html)
- [KMS Pricing](https://aws.amazon.com/kms/pricing/)
- [AWS Managed Keys vs CMK](https://docs.aws.amazon.com/kms/latest/developerguide/concepts.html#key-mgmt)
- ShowCore Requirements: 3.5, 4.4, 5.3, 6.4, 9.9
- ShowCore Design: design.md (Security Architecture)

## Related Decisions

- ADR-001: VPC Endpoints over NAT Gateway (cost optimization)
- ADR-006: Single-AZ deployment strategy (cost optimization)
- ADR-007: Free Tier instance selection (cost optimization)
- ADR-009: Security group design (security architecture)

## Approval

- **Proposed By**: ShowCore Engineering Team
- **Reviewed By**: Security Review, Cost Optimization Review
- **Approved By**: Project Lead
- **Date**: February 4, 2026

---

**Implementation Status**: ✅ Implemented in all stacks (database, cache, storage, security)  
**Next Review**: After Phase 1 completion or when compliance requirements change
