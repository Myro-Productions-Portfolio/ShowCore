# ADR-005: CloudTrail Audit Logging Implementation

**Status**: Accepted  
**Date**: February 3, 2026  
**Deciders**: ShowCore Engineering Team  
**Validates**: Requirements 1.4, 6.5, 6.6

## Context

ShowCore requires comprehensive audit logging to track all API calls and administrative actions across the AWS infrastructure. This is essential for:

1. **Security Compliance**: Detecting unauthorized access attempts and security incidents
2. **Operational Troubleshooting**: Understanding what changes were made and when
3. **Cost Attribution**: Tracking which users/services are creating resources
4. **Regulatory Requirements**: Maintaining audit trails for compliance (future)

AWS provides several options for audit logging:
- AWS CloudTrail (managed service for API call logging)
- VPC Flow Logs (network traffic logging)
- CloudWatch Logs (application and service logs)
- AWS Config (resource configuration history)

For Phase 1, we need to decide on the audit logging strategy, storage approach, retention policies, and cost optimization measures.

## Decision

**Implement AWS CloudTrail with the following configuration:**

1. **Multi-Region Trail**: Log API calls from all AWS regions
2. **S3 Storage**: Store logs in dedicated S3 bucket with versioning
3. **SSE-S3 Encryption**: Use AWS managed encryption (free, no KMS costs)
4. **Log File Validation**: Enable integrity checking to detect tampering
5. **Lifecycle Policies**: Transition old logs to Glacier after 90 days, delete after 1 year
6. **Management Events Only**: Log all management events (API calls), defer data events

## Alternatives Considered

### Alternative 1: CloudTrail with CloudWatch Logs Integration

**Approach**: Send CloudTrail logs to both S3 and CloudWatch Logs for real-time monitoring.

**Pros**:
- Real-time log analysis and alerting
- CloudWatch Insights for log queries
- Integration with CloudWatch Alarms

**Cons**:
- Additional cost: ~$0.50/GB for CloudWatch Logs ingestion
- Additional cost: ~$0.03/GB/month for CloudWatch Logs storage
- For low-traffic project, S3 storage is sufficient
- Can add CloudWatch integration later if needed

**Decision**: Rejected for Phase 1 due to cost. S3 storage is sufficient for audit trail.

### Alternative 2: CloudTrail with KMS Encryption

**Approach**: Use AWS KMS Customer Managed Keys for CloudTrail log encryption.

**Pros**:
- More control over encryption keys
- Key rotation policies
- Audit trail for key usage

**Cons**:
- Additional cost: $1/month per KMS key
- Additional cost: $0.03 per 10,000 API requests
- SSE-S3 encryption is sufficient for Phase 1
- Adds complexity for minimal security benefit

**Decision**: Rejected for Phase 1 due to cost. SSE-S3 encryption is sufficient.

### Alternative 3: Organization Trail (Multi-Account)

**Approach**: Create organization-wide CloudTrail trail in management account.

**Pros**:
- Centralized logging for all accounts
- Single trail for entire organization
- Easier compliance management

**Cons**:
- Requires AWS Organizations setup (Phase 2)
- More complex to implement initially
- Not needed for single-account Phase 1

**Decision**: Deferred to Phase 2 when multi-account structure is implemented.

### Alternative 4: CloudTrail Data Events

**Approach**: Enable data events logging (S3 object-level operations, Lambda invocations).

**Pros**:
- More detailed logging of data access
- Useful for security investigations
- Compliance requirements for sensitive data

**Cons**:
- Significant cost increase: $0.10 per 100,000 events
- High volume of events for S3 operations
- Not needed for Phase 1 (infrastructure focus)

**Decision**: Deferred to Phase 2 or when compliance requires it.

## Rationale

### Why CloudTrail?

1. **AWS Native**: Fully managed service, no infrastructure to maintain
2. **Comprehensive**: Logs all API calls across all AWS services
3. **Cost Effective**: First trail is free, S3 storage is cheap (~$0.023/GB/month)
4. **Compliance Ready**: Meets most audit and compliance requirements
5. **Integration**: Works with AWS Config, GuardDuty, Security Hub

### Why S3 Storage?

1. **Cost Effective**: S3 Standard storage is ~$0.023/GB/month
2. **Durable**: 99.999999999% (11 9's) durability
3. **Scalable**: No capacity planning required
4. **Lifecycle Policies**: Automatic transition to Glacier for cost optimization
5. **Versioning**: Protects against accidental deletion

### Why SSE-S3 Encryption?

1. **Free**: No additional cost compared to KMS ($1/month per key)
2. **Automatic**: AWS manages encryption keys automatically
3. **Sufficient**: Meets security requirements for Phase 1
4. **Simple**: No key management complexity
5. **Compliant**: Meets most compliance requirements

### Why Log File Validation?

1. **Free**: No additional cost
2. **Integrity**: Detects if logs have been tampered with
3. **Compliance**: Required for many audit standards
4. **Simple**: Enabled with single flag

### Why Lifecycle Policies?

1. **Cost Optimization**: Glacier storage is ~$0.004/GB/month (83% cheaper)
2. **Compliance**: Retain logs for 1 year (can extend if needed)
3. **Automatic**: No manual intervention required
4. **Flexible**: Can adjust retention periods later

## Consequences

### Positive

1. **Comprehensive Audit Trail**: All API calls logged across all regions
2. **Cost Effective**: First trail is free, S3 storage is cheap
3. **Security**: Log file validation ensures integrity
4. **Compliance Ready**: Meets most audit requirements
5. **Scalable**: No capacity planning or maintenance required
6. **Simple**: Minimal configuration, fully managed service

### Negative

1. **No Real-Time Alerting**: S3 storage doesn't provide real-time alerts (can add CloudWatch later)
2. **Query Limitations**: S3 logs require Athena or download for analysis (acceptable for Phase 1)
3. **Retention Trade-off**: 1-year retention may be short for some compliance requirements (can extend)
4. **Management Events Only**: No data events logging (can enable later if needed)

### Neutral

1. **Storage Costs**: Will grow over time as logs accumulate (~1-5 GB/month estimated)
2. **Glacier Retrieval**: Old logs take 3-5 hours to retrieve from Glacier (acceptable for audit use case)
3. **Multi-Region**: Logs from all regions stored in single S3 bucket (simplifies management)

## Implementation

### Phase 1 (Current)

1. **Create S3 Bucket**: `showcore-cloudtrail-logs-{account-id}`
   - Enable versioning
   - Enable SSE-S3 encryption
   - Block all public access
   - Lifecycle policy: Glacier after 90 days, delete after 365 days
   - Bucket policy: Allow CloudTrail service to write logs

2. **Create CloudTrail Trail**: `showcore-audit-trail`
   - Multi-region trail
   - Log all management events (read and write)
   - Enable log file validation
   - Store logs in S3 bucket
   - Include global service events (IAM, STS, CloudFront)

3. **Export Outputs**:
   - CloudTrail bucket name
   - CloudTrail trail ARN

4. **Testing**:
   - Verify trail is logging events
   - Verify logs are stored in S3
   - Verify log file validation works
   - Verify lifecycle policies are applied

### Phase 2 (Future Enhancements)

1. **CloudWatch Logs Integration**: Add real-time log analysis if needed
2. **Organization Trail**: Migrate to organization-wide trail when multi-account setup is complete
3. **Data Events**: Enable S3 object-level logging if compliance requires
4. **Athena Queries**: Set up Athena for log analysis and reporting
5. **GuardDuty Integration**: Enable threat detection using CloudTrail logs
6. **Extended Retention**: Increase retention period if compliance requires

## Cost Analysis

### Monthly Costs (Estimated)

**CloudTrail**:
- First trail: Free
- Additional trails: $2/month each (not needed for Phase 1)

**S3 Storage** (assuming 2 GB/month of logs):
- Standard storage (0-90 days): 2 GB × $0.023/GB = $0.046/month
- Glacier storage (90-365 days): 6 GB × $0.004/GB = $0.024/month
- Total S3 storage: ~$0.07/month

**S3 Requests**:
- PUT requests: ~10,000/month × $0.005/1,000 = $0.05/month
- GET requests: Minimal (only for retrieval)

**Total Estimated Cost**: ~$0.12/month

**Cost After 1 Year** (with full Glacier storage):
- Standard storage: 2 GB × $0.023/GB = $0.046/month
- Glacier storage: 24 GB × $0.004/GB = $0.096/month
- Total: ~$0.14/month

**Comparison to Alternatives**:
- CloudTrail + CloudWatch Logs: ~$1-2/month (10x more expensive)
- CloudTrail + KMS: ~$1.12/month (9x more expensive)
- CloudTrail + Data Events: ~$5-10/month (50x more expensive)

## Monitoring and Validation

### CloudWatch Metrics

Monitor these CloudTrail metrics:
- Trail status (active/inactive)
- Log file delivery failures
- Log file validation failures

### CloudWatch Alarms

Create alarms for:
- Trail stopped logging (critical)
- Log file delivery failures (warning)
- Log file validation failures (critical)

### Validation Checks

1. **Log File Validation**: Run `aws cloudtrail validate-logs` monthly
2. **Log Delivery**: Verify logs are being delivered to S3 daily
3. **Lifecycle Policies**: Verify old logs are transitioning to Glacier
4. **Bucket Policy**: Verify only CloudTrail can write to bucket

## When to Revisit

Revisit this decision when:

1. **Multi-Account Setup**: When implementing AWS Organizations (Phase 2)
2. **Compliance Requirements**: If audit requirements change (e.g., longer retention)
3. **Real-Time Alerting**: If real-time security monitoring becomes critical
4. **Data Events**: If compliance requires S3 object-level logging
5. **Cost Concerns**: If CloudTrail costs exceed $5/month
6. **Security Incident**: If investigation requires more detailed logging

## References

- [AWS CloudTrail Documentation](https://docs.aws.amazon.com/cloudtrail/)
- [CloudTrail Pricing](https://aws.amazon.com/cloudtrail/pricing/)
- [CloudTrail Best Practices](https://docs.aws.amazon.com/awscloudtrail/latest/userguide/best-practices-security.html)
- [Log File Validation](https://docs.aws.amazon.com/awscloudtrail/latest/userguide/cloudtrail-log-file-validation-intro.html)
- [S3 Lifecycle Policies](https://docs.aws.amazon.com/AmazonS3/latest/userguide/object-lifecycle-mgmt.html)
- ShowCore Requirements: 1.4, 6.5, 6.6
- ShowCore Design: design.md (Security Infrastructure)

## Approval

- **Proposed By**: ShowCore Engineering Team
- **Reviewed By**: Security Team (self-review for Phase 1)
- **Approved By**: Project Lead
- **Date**: February 3, 2026

---

**Implementation Status**: ✅ Implemented in `infrastructure/lib/stacks/security_stack.py`  
**Next Review**: After Phase 1 completion or when multi-account setup begins
