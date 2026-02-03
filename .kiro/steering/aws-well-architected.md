---
inclusion: always
---

# AWS Well-Architected Framework - ShowCore Guidelines

This steering document provides AWS best practices and guidelines for the ShowCore AWS Migration project, based on the AWS Well-Architected Framework. These principles should guide all infrastructure decisions and implementations.

## Overview

The AWS Well-Architected Framework helps cloud architects build secure, high-performing, resilient, and efficient infrastructure. For ShowCore, we prioritize cost optimization and operational excellence while maintaining security and reliability appropriate for a low-traffic project website.

## Cost Optimization Pillar

### ShowCore Cost Optimization Strategies

**Target Monthly Cost**: ~$3-10/month during Free Tier, ~$49-60/month after

#### 1. Eliminate NAT Gateways (~$32/month savings)
- **DO NOT** deploy NAT Gateways in any environment
- Use VPC Endpoints for AWS service access instead
- Gateway Endpoints (S3, DynamoDB) are FREE
- Interface Endpoints cost ~$7/month each but still cheaper than NAT Gateway
- Private subnets should have NO internet access

#### 2. Use Free Tier Eligible Resources
- RDS: db.t3.micro (750 hours/month free for 12 months)
- ElastiCache: cache.t3.micro (750 hours/month free for 12 months)
- S3: First 5 GB storage free
- CloudFront: First 1 TB data transfer free
- Always verify instance types are Free Tier eligible before deployment

#### 3. Single-AZ Deployment for Low Traffic
- Deploy RDS in single AZ (Multi-AZ doubles cost)
- Deploy ElastiCache in single AZ (no replicas)
- Acceptable for low-traffic project website
- Can scale to Multi-AZ later if traffic increases

#### 4. Optimize Storage Costs
- Use S3 SSE-S3 encryption (free) instead of KMS ($1/key/month)
- Configure lifecycle policies to transition old backups to Glacier after 30 days
- Delete old backups after 90 days (short retention for low-traffic project)
- Enable S3 versioning but delete old versions after 90 days

#### 5. Optimize CloudFront Costs
- Use PriceClass_100 (North America and Europe only) - lowest cost
- Disable access logging initially (incurs S3 storage costs)
- Enable automatic compression (free, reduces data transfer)

#### 6. Minimize Monitoring Costs
- Use basic CloudWatch metrics (free)
- Create only critical alarms ($0.10 each)
- Set log retention to 7 days (can increase later)
- Defer VPC Flow Logs until needed for troubleshooting
- Defer GuardDuty ($4.62/month minimum) until needed

#### 7. Resource Tagging for Cost Allocation
- Tag ALL resources with: Project, Phase, Environment, ManagedBy, CostCenter
- Enable cost allocation tags in AWS Billing console
- Review Cost Explorer monthly to track spending by tag
- Set up billing alerts at $50 and $100 thresholds

### Cost Optimization Checklist
- [ ] No NAT Gateways deployed
- [ ] Free Tier eligible instance types used (db.t3.micro, cache.t3.micro)
- [ ] Single-AZ deployment for RDS and ElastiCache
- [ ] Gateway Endpoints used for S3 and DynamoDB (FREE)
- [ ] Minimal Interface Endpoints (only essential services)
- [ ] S3 SSE-S3 encryption (not KMS)
- [ ] CloudFront PriceClass_100
- [ ] Short backup retention (7 days)
- [ ] All resources tagged with cost allocation tags

## Security Pillar

### ShowCore Security Best Practices

#### 1. Least Privilege Access
- Use IAM roles with minimal required permissions
- Never use root account for daily operations
- Use the showcore-app IAM user with ShowCoreDeploymentPolicy for deployments
- Review and audit IAM policies regularly
- Enable MFA for all human users

#### 2. Network Security
- Deploy databases and caches in private subnets with NO internet access
- Use Security Groups as stateful firewalls
- **NEVER** allow 0.0.0.0/0 access on sensitive ports (22, 5432, 6379)
- Use VPC Endpoints for AWS service access (no internet required)
- Configure Security Group rules with descriptive names

#### 3. Encryption at Rest
- Enable encryption for all RDS instances using AWS managed keys
- Enable encryption for all ElastiCache clusters using AWS managed encryption
- Enable encryption for all S3 buckets using SSE-S3
- Use AWS managed keys for cost optimization (automatic rotation)

#### 4. Encryption in Transit
- Require SSL/TLS for all RDS connections (rds.force_ssl = 1)
- Require TLS for all ElastiCache connections
- Use HTTPS-only for CloudFront distributions
- Use TLS 1.2 minimum for all services

#### 5. Audit Logging
- Enable AWS CloudTrail for all API calls
- Enable CloudTrail log file validation for integrity
- Configure CloudWatch Logs integration for real-time monitoring
- Store CloudTrail logs in dedicated S3 bucket with versioning

#### 6. Compliance Monitoring
- Enable AWS Config for continuous compliance monitoring
- Configure Config rules: rds-storage-encrypted, s3-bucket-public-read-prohibited
- Review Config compliance dashboard regularly
- Remediate non-compliant resources immediately

#### 7. VPC Isolation
- Use private subnets for all data tier resources
- NO internet access from private subnets (no NAT Gateway)
- Use VPC Endpoints for AWS service access
- Use Systems Manager Session Manager for instance access (no SSH keys)

### Security Checklist
- [ ] All Security Groups follow least privilege (no 0.0.0.0/0 on sensitive ports)
- [ ] Encryption at rest enabled for RDS, ElastiCache, S3
- [ ] Encryption in transit enforced (SSL/TLS required)
- [ ] CloudTrail enabled and logging to S3
- [ ] AWS Config enabled with compliance rules
- [ ] Private subnets have NO internet access
- [ ] VPC Endpoints configured for AWS service access

## Operational Excellence Pillar

### ShowCore Operational Best Practices

#### 1. Infrastructure as Code (IaC)
- Define ALL infrastructure using AWS CDK with Python
- Store infrastructure code in version control (Git)
- Use meaningful commit messages and branch strategy
- Run `cdk synth` to validate templates before deployment
- Run `cdk diff` to preview changes before applying
- Never make manual changes in AWS Console

#### 2. Automated Testing
- Write unit tests for all CDK stacks
- Write property tests for universal correctness properties
- Write integration tests for connectivity and functionality
- Run tests before every deployment
- Maintain 100% test pass rate

#### 3. Monitoring and Alerting
- Create CloudWatch dashboards for all infrastructure components
- Configure alarms for critical metrics only (cost optimization)
- Use SNS topics for alert notifications
- Set up billing alerts at $50 and $100 thresholds
- Review dashboards weekly

#### 4. Backup and Disaster Recovery
- Enable automated daily backups for RDS (7-day retention)
- Enable automated daily snapshots for ElastiCache (7-day retention)
- Test backup restore procedures quarterly
- Document recovery procedures in runbooks
- Store runbooks in `.kiro/specs/showcore-aws-migration-phase1/runbooks/`

#### 5. Change Management
- Document all architectural decisions in ADRs
- Create ADR for significant infrastructure changes
- Store ADRs in `.kiro/specs/showcore-aws-migration-phase1/`
- Review ADRs before implementation

#### 6. Documentation
- Maintain up-to-date README with deployment instructions
- Document all manual procedures in runbooks
- Create architecture diagrams for network, security, monitoring
- Document lessons learned after each phase

#### 7. Incident Response
- Create runbook for security incident response
- Create runbook for RDS backup and restore
- Create runbook for ElastiCache backup and restore
- Create runbook for VPC Endpoint troubleshooting
- Test runbooks quarterly

### Operational Excellence Checklist
- [ ] All infrastructure defined as code (AWS CDK)
- [ ] Infrastructure code in version control
- [ ] Unit tests, property tests, integration tests written
- [ ] CloudWatch dashboards and alarms configured
- [ ] Automated backups enabled (RDS, ElastiCache)
- [ ] Runbooks created for common procedures
- [ ] Architecture diagrams created and up-to-date

## Reliability Pillar

### ShowCore Reliability Considerations

#### 1. High Availability Trade-offs
- Single-AZ deployment acceptable for low-traffic project website
- Automated backups provide recovery capability
- Can enable Multi-AZ later if traffic increases
- Acceptable downtime for cost optimization

#### 2. Backup Strategy
- RDS: Automated daily backups with 7-day retention
- ElastiCache: Daily snapshots with 7-day retention
- S3: Versioning enabled for static assets and backups
- Manual snapshots before major changes

#### 3. Recovery Objectives
- RDS: RTO < 30 minutes, RPO < 5 minutes (point-in-time recovery)
- ElastiCache: RTO < 15 minutes, RPO < 24 hours (daily snapshots)
- S3: RTO < 5 minutes (versioning), RPO = 0 (immediate replication)

#### 4. Monitoring for Reliability
- RDS CPU utilization > 80% for 5 minutes → critical alert
- RDS storage utilization > 85% → warning alert
- ElastiCache CPU utilization > 75% for 5 minutes → critical alert
- ElastiCache memory utilization > 80% → critical alert
- Backup job failures → critical alert

## Performance Efficiency Pillar

### ShowCore Performance Considerations

#### 1. Right-Sizing Resources
- Start with Free Tier eligible instance types (db.t3.micro, cache.t3.micro)
- Monitor CPU, memory, and connection metrics
- Scale up if utilization consistently exceeds 80%
- Use CloudWatch metrics to inform scaling decisions

#### 2. Caching Strategy
- Use ElastiCache Redis for session data and frequently accessed data
- Configure appropriate TTLs for cached data
- Monitor cache hit rate (target > 80%)
- Alert if cache hit rate < 80%

#### 3. Content Delivery
- Use CloudFront CDN for static assets
- Configure appropriate cache TTLs (24 hours default, 1 year max)
- Enable automatic compression
- Monitor cache hit rate and adjust TTLs as needed

#### 4. Database Performance
- Enable RDS Performance Insights (7-day retention, Free Tier)
- Enable Enhanced Monitoring (60-second granularity)
- Monitor read/write latency (alert if > 100ms)
- Monitor connection count (alert if > 80)

## VPC Endpoints Architecture

### Management Philosophy

The ShowCore infrastructure uses VPC Endpoints instead of NAT Gateways for AWS service access. This approach prioritizes:

1. **Cost Optimization**: Saves ~$32/month by eliminating NAT Gateway
2. **Security**: No internet access from private subnets
3. **Hands-on Management**: More manual control and learning experience

### VPC Endpoint Types

#### Gateway Endpoints (FREE)
- S3: For backups, logs, and static assets
- DynamoDB: For future use
- Automatically added to route tables
- No additional cost

#### Interface Endpoints (~$7/month each)
- CloudWatch Logs: For application and infrastructure logging
- CloudWatch Monitoring: For metrics and alarms
- Systems Manager: For Session Manager access (no SSH keys)
- Secrets Manager: Optional, if storing database credentials

### Management Implications

#### Manual Patching
- RDS and ElastiCache cannot download patches from the internet
- AWS manages patching automatically during maintenance windows
- No action required from operators

#### Application Updates
- Future application instances cannot download packages from the internet
- Solution: Use S3 to host packages, access via S3 Gateway Endpoint
- Solution: Use Systems Manager to manage instances
- Solution: Pre-bake AMIs with required packages

#### Third-Party APIs
- Applications cannot call external APIs from private subnets
- Solution: Use API Gateway or Lambda in public subnets as proxy
- Solution: Add NAT Gateway if external API access becomes critical
- Trade-off: Acceptable for Phase 1 (data layer only)

### VPC Endpoint Best Practices

1. **Security Groups**: Create dedicated security group for Interface Endpoints
2. **Private DNS**: Enable private DNS for all Interface Endpoints
3. **Monitoring**: Monitor VPC Endpoint data processed and connections
4. **Cost Tracking**: Tag VPC Endpoints with cost allocation tags
5. **Documentation**: Document which services require which endpoints

## Implementation Guidelines

### When Implementing Infrastructure

1. **Always use AWS CDK** - Never create resources manually in console
2. **Tag all resources** - Use standard tags (Project, Phase, Environment, ManagedBy, CostCenter)
3. **Verify Free Tier** - Check instance types are Free Tier eligible
4. **No NAT Gateways** - Use VPC Endpoints instead
5. **Test before deploy** - Run unit tests, property tests, integration tests
6. **Review costs** - Check Cost Explorer after deployment

### When Modifying Infrastructure

1. **Create ADR** - Document significant architectural changes
2. **Run cdk diff** - Preview changes before applying
3. **Update tests** - Modify tests to reflect changes
4. **Update documentation** - Keep README and runbooks current
5. **Monitor impact** - Watch CloudWatch dashboards after changes

### When Troubleshooting

1. **Check CloudWatch Logs** - Review logs via CloudWatch Logs Interface Endpoint
2. **Check CloudWatch Metrics** - Review metrics in dashboards
3. **Check Security Groups** - Verify rules allow required traffic
4. **Check VPC Endpoints** - Verify endpoints are healthy and accessible
5. **Check AWS Config** - Review compliance status
6. **Check CloudTrail** - Review API calls for errors

## Common Pitfalls to Avoid

1. **DO NOT** deploy NAT Gateways (use VPC Endpoints instead)
2. **DO NOT** allow 0.0.0.0/0 on sensitive ports (22, 5432, 6379)
3. **DO NOT** use KMS for encryption (use AWS managed keys for cost optimization)
4. **DO NOT** enable Multi-AZ for RDS/ElastiCache initially (cost optimization)
5. **DO NOT** enable VPC Flow Logs initially (cost optimization, add later if needed)
6. **DO NOT** enable GuardDuty initially (cost optimization, add later if needed)
7. **DO NOT** make manual changes in AWS Console (use IaC only)
8. **DO NOT** skip tagging resources (required for cost allocation)
9. **DO NOT** skip testing before deployment (maintain 100% test pass rate)
10. **DO NOT** forget to set up billing alerts ($50 and $100 thresholds)

## Quick Reference

### Cost Optimization
- No NAT Gateway: ~$32/month savings
- Free Tier instances: db.t3.micro, cache.t3.micro
- Single-AZ deployment: 50% cost reduction
- Gateway Endpoints: FREE (S3, DynamoDB)
- Interface Endpoints: ~$7/month each (CloudWatch, Systems Manager)

### Security
- Private subnets: NO internet access
- Encryption at rest: AWS managed keys
- Encryption in transit: SSL/TLS required
- Security Groups: Least privilege, no 0.0.0.0/0 on sensitive ports
- Audit logging: CloudTrail enabled

### Operations
- Infrastructure as Code: AWS CDK with Python
- Testing: Unit tests, property tests, integration tests
- Monitoring: CloudWatch dashboards and alarms
- Backups: Automated daily (7-day retention)
- Documentation: README, runbooks, ADRs, architecture diagrams

### VPC Endpoints
- Gateway Endpoints: S3, DynamoDB (FREE)
- Interface Endpoints: CloudWatch Logs, CloudWatch Monitoring, Systems Manager (~$7/month each)
- No internet access from private subnets
- Manual management required for application updates

## Additional Resources

- [AWS Well-Architected Framework](https://aws.amazon.com/architecture/well-architected/)
- [AWS Cost Optimization](https://aws.amazon.com/pricing/cost-optimization/)
- [AWS Security Best Practices](https://aws.amazon.com/security/best-practices/)
- [AWS VPC Endpoints](https://docs.aws.amazon.com/vpc/latest/privatelink/vpc-endpoints.html)
- [AWS CDK Documentation](https://docs.aws.amazon.com/cdk/latest/guide/home.html)
