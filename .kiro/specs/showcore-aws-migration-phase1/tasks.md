# Implementation Plan: ShowCore AWS Migration Phase 1

## Overview

This implementation plan breaks down the Phase 1 AWS infrastructure deployment into discrete, actionable tasks. Phase 1 establishes the foundational AWS infrastructure using a cost-optimized VPC Endpoints architecture (no NAT Gateway) to save ~$32/month while maintaining secure AWS service access.

The implementation uses AWS CDK with Python for Infrastructure as Code, following the design specified in design.md. All infrastructure will be deployed to AWS account 123456789012 in us-east-1 region.

**Key Architecture Decisions:**
- VPC Endpoints instead of NAT Gateway (saves $4-11/month, better security)
- Single-AZ deployment for RDS and ElastiCache (cost optimization for low-traffic project)
- Free Tier eligible instance types (db.t3.micro, cache.t3.micro)
- Gateway Endpoints for S3 and DynamoDB (FREE)
- Interface Endpoints for CloudWatch and Systems Manager (~$7/month each)

**Estimated Timeline:** 2-3 weeks for complete deployment and validation

**Task Structure:**
1. Project Setup - Hooks and Steering Documentation (6 tasks)
2. Infrastructure as Code Setup and ADR-002 (4 tasks)
3. Network Infrastructure (5 tasks)
4. Security Infrastructure (6 tasks)
5. Database Infrastructure (6 tasks)
6. Cache Infrastructure (5 tasks)
7. Checkpoint - Core Infrastructure Validation
8. Storage Infrastructure (4 tasks)
9. Content Delivery Network (4 tasks)
10. Monitoring and Alerting (8 tasks)
11. Backup and Disaster Recovery (5 tasks)
12. Cost Optimization and Tagging (4 tasks)
13. Checkpoint - Complete Infrastructure Deployment
14. Integration Testing (5 tasks)
15. Compliance and Security Validation (3 tasks)
16. Documentation and Handoff (4 tasks)
17. Final Validation and Sign-off (3 tasks)

## Tasks

### 1. Project Setup - Hooks and Steering Documentation

- [x] 1.1 Create steering documentation for AWS best practices
  - Create `.kiro/steering/aws-well-architected.md` with AWS Well-Architected Framework principles
  - Document cost optimization strategies specific to ShowCore
  - Document security best practices (least privilege, encryption, VPC isolation)
  - Document operational excellence practices (IaC, monitoring, backups)
  - Set inclusion to "always" so it's included in all AI interactions
  - _Requirements: 10.7_

- [x] 1.2 Create steering documentation for Infrastructure as Code standards
  - Create `.kiro/steering/iac-standards.md` with CDK/Terraform coding standards
  - Document naming conventions for resources (kebab-case, prefixed with "showcore-")
  - Document tagging requirements (Project, Phase, Environment, ManagedBy, CostCenter)
  - Document stack organization and dependencies
  - Document testing requirements (unit tests, property tests, integration tests)
  - Set inclusion to "always"
  - _Requirements: 10.7_

- [x] 1.3 Create hook for infrastructure code validation
  - Create hook that triggers on file edits to `infrastructure/**/*.ts`, `infrastructure/**/*.py`, `*.tf`
  - Hook should remind to run `cdk synth` or `terraform plan` before committing
  - Hook should remind to run unit tests
  - Hook should remind to check for security group rules (no 0.0.0.0/0 on sensitive ports)
  - Hook should remind to verify resource tagging compliance
  - _Requirements: 10.3_

- [x] 1.4 Create hook for cost optimization validation
  - Create hook that triggers on infrastructure file edits
  - Hook should remind to verify Free Tier eligible resources are used
  - Hook should remind to check for NAT Gateway (should NOT exist)
  - Hook should remind to verify single-AZ deployment for cost optimization
  - Hook should remind to check CloudFront price class (PriceClass_100)
  - _Requirements: 9.1, 9.2, 9.3, 9.11_

- [x] 1.5 Create hook for ADR creation reminder
  - Already created: `adr-reminder-hook`
  - Verify hook is active and triggers on design.md and infrastructure code edits
  - Test hook by editing design.md
  - _Requirements: 10.7_

- [x] 1.6 Create hook for test execution reminder
  - Create hook that triggers after infrastructure code edits
  - Hook should remind to run unit tests for modified components
  - Hook should remind to run property tests if security or tagging changes made
  - Hook should remind to run integration tests if connectivity changes made
  - _Requirements: All testing requirements_

### 2. Infrastructure as Code Setup and ADR-002

- [x] 2.1 Create ADR-002 for Infrastructure as Code tool selection
  - Document decision between Terraform and AWS CDK
  - Evaluate both options based on: Python familiarity, AWS integration, learning value, community support
  - Recommendation: AWS CDK with Python (better AWS integration, type safety, familiar language)
- [ ] 2.1 Create ADR-002 for Infrastructure as Code tool selection
  - Document decision between Terraform and AWS CDK
  - Evaluate both options based on: Python familiarity, AWS integration, learning value, community support
  - Recommendation: AWS CDK with Python (better AWS integration, type safety, familiar language)
  - Create `.kiro/specs/showcore-aws-migration-phase1/adr-002-infrastructure-as-code-tool.md`
  - _Requirements: 10.1_

- [ ] 2.2 Initialize AWS CDK project structure
  - Run `cdk init app --language python` in project directory
  - Create directory structure: `lib/stacks/`, `lib/constructs/`, `tests/`
  - Configure `cdk.json` with context values (account ID, region, environment)
  - Set up Python virtual environment and install dependencies
  - _Requirements: 10.1, 10.2_

- [ ] 2.3 Configure CDK stack hierarchy and tagging
  - Create base stack class with standard resource tags (Project, Phase, Environment, ManagedBy, CostCenter)
  - Define stack hierarchy: NetworkStack, SecurityStack, DatabaseStack, CacheStack, StorageStack, CDNStack, MonitoringStack, BackupStack
  - Configure stack dependencies and cross-stack references
  - _Requirements: 9.6, 10.6_

- [ ] 2.4 Set up CDK deployment configuration
  - Configure AWS credentials for showcore-app IAM user
  - Set up CDK bootstrap in us-east-1 region
  - Create environment-specific configuration files (production, staging, development)
  - Document deployment commands in README.md
  - _Requirements: 10.3, 10.4, 10.7_

### 3. Network Infrastructure (VPC and VPC Endpoints)

- [ ] 3.1 Implement VPC and subnet infrastructure
- [ ] 3.1 Implement VPC and subnet infrastructure
  - Create VPC with 10.0.0.0/16 CIDR block in us-east-1
  - Create public subnets: 10.0.0.0/24 (us-east-1a), 10.0.1.0/24 (us-east-1b)
  - Create private subnets: 10.0.2.0/24 (us-east-1a), 10.0.3.0/24 (us-east-1b)
  - Attach Internet Gateway to VPC for public subnet access
  - Configure route tables: public subnets route to IGW, private subnets have NO default route
  - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [ ] 3.2 Implement Gateway Endpoints (FREE)
  - Create S3 Gateway Endpoint attached to private subnet route tables
  - Create DynamoDB Gateway Endpoint attached to private subnet route tables
  - Verify route table entries automatically created for S3 and DynamoDB prefix lists
  - _Requirements: 2.5, 2.6, 2.11_

- [ ] 3.3 Implement Interface Endpoints security group
  - Create VPC Endpoint security group allowing HTTPS (port 443) from VPC CIDR (10.0.0.0/16)
  - Add descriptive security group rules with clear descriptions
  - Apply least privilege principle (no overly permissive rules)
  - _Requirements: 2.12, 6.2_

- [ ] 3.4 Implement Interface Endpoints for AWS services
  - Create CloudWatch Logs Interface Endpoint in both private subnets
  - Create CloudWatch Monitoring Interface Endpoint in both private subnets
  - Create Systems Manager Interface Endpoint in both private subnets
  - Optionally create Secrets Manager Interface Endpoint if storing database credentials
  - Attach VPC Endpoint security group to all Interface Endpoints
  - Enable private DNS for all Interface Endpoints
  - _Requirements: 2.7, 2.8, 2.9, 2.10, 2.12_

- [ ] 3.5 Write unit tests for network infrastructure
  - Test VPC exists with correct CIDR block
  - Test subnets exist in correct AZs with correct CIDR blocks
  - Test NO NAT Gateway exists (cost optimization verification)
  - Test Gateway Endpoints exist and are attached to route tables
  - Test Interface Endpoints exist with correct security groups
  - Test route tables have correct routes (public to IGW, private with no default route)
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9_

### 4. Security Infrastructure

- [ ] 4.1 Implement RDS security group
  - Create security group for RDS PostgreSQL
  - Add ingress rule: PostgreSQL port 5432 from future application security group placeholder
  - Add descriptive rule descriptions
  - Apply least privilege principle
  - _Requirements: 3.3, 6.2_

- [ ] 3.2 Implement ElastiCache security group
  - Create security group for ElastiCache Redis
  - Add ingress rule: Redis port 6379 from future application security group placeholder
  - Add descriptive rule descriptions
  - Apply least privilege principle
  - _Requirements: 4.3, 6.2_

- [ ] 3.3 Configure AWS CloudTrail for audit logging
  - Enable CloudTrail for all regions
  - Configure CloudTrail to log to S3 bucket (create dedicated bucket)
  - Enable log file validation for integrity
  - Configure CloudWatch Logs integration for real-time monitoring
  - _Requirements: 1.4, 6.5_

- [ ] 3.4 Configure AWS Config for compliance monitoring
  - Enable AWS Config in us-east-1 region
  - Configure Config to record all resource types
  - Set up Config rules: rds-multi-az-support, rds-storage-encrypted, s3-bucket-public-read-prohibited, s3-bucket-ssl-requests-only
  - Configure Config to deliver to S3 bucket
  - _Requirements: 6.3_

- [ ] 3.5 Write property test for security group least privilege
  - **Property 1: Security Group Least Privilege**
  - Test that no security group has 0.0.0.0/0 access on sensitive ports (22, 5432, 6379)
  - Query all security groups and verify ingress rules
  - **Validates: Requirements 6.2**

- [ ] 3.6 Write unit tests for security infrastructure
  - Test CloudTrail is enabled and logging
  - Test AWS Config is enabled and recording
  - Test security groups exist with correct rules
  - Test no security groups have overly permissive rules
  - _Requirements: 1.4, 6.2, 6.3, 6.5_

### 5. Database Infrastructure (RDS PostgreSQL)

- [ ] 5.1 Implement RDS subnet group
  - Create DB subnet group spanning private subnets in both AZs
  - Configure subnet group for Multi-AZ capability (even though starting single-AZ)
  - _Requirements: 3.2_

- [ ] 4.2 Implement RDS parameter group for PostgreSQL 16
  - Create custom parameter group for PostgreSQL 16
  - Configure SSL/TLS enforcement: `rds.force_ssl = 1`
  - Configure connection limits and performance parameters
  - Document parameter choices in comments
  - _Requirements: 3.6_

- [ ] 4.3 Implement RDS PostgreSQL instance
  - Create RDS PostgreSQL 16 instance with db.t3.micro (Free Tier eligible)
  - Deploy in private subnet (single-AZ for cost optimization)
  - Allocate 20 GB gp3 storage (Free Tier limit)
  - Enable storage autoscaling up to 100 GB
  - Attach RDS security group
  - Configure backup window: 03:00-04:00 UTC
  - Configure maintenance window: Sunday 04:00-05:00 UTC
  - _Requirements: 3.1, 3.2, 3.9_

- [ ] 4.4 Configure RDS encryption and backups
  - Enable encryption at rest using AWS managed keys (default KMS key)
  - Enable automated daily backups with 7-day retention
  - Enable point-in-time recovery
  - Configure backup retention period
  - _Requirements: 3.4, 3.5_

- [ ] 4.5 Configure RDS monitoring and Performance Insights
  - Enable Enhanced Monitoring (60-second granularity)
  - Enable Performance Insights with 7-day retention (Free Tier)
  - Configure CloudWatch Logs exports: postgresql log
  - _Requirements: 3.10_

- [ ] 4.6 Write unit tests for RDS configuration
  - Test RDS instance exists with PostgreSQL 16
  - Test instance class is db.t3.micro (Free Tier)
  - Test instance is in private subnet
  - Test encryption at rest is enabled
  - Test automated backups enabled with >= 7 day retention
  - Test SSL/TLS is enforced
  - Test Performance Insights is enabled
  - Test security group allows only authorized access on port 5432
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.9, 3.10_

### 6. Cache Infrastructure (ElastiCache Redis)

- [ ] 6.1 Implement ElastiCache subnet group
  - Create cache subnet group spanning private subnets in both AZs
  - Configure subnet group for future replica capability
  - _Requirements: 4.2_

- [ ] 5.2 Implement ElastiCache parameter group for Redis 7
  - Create custom parameter group for Redis 7
  - Configure TLS enforcement: `transit-encryption-enabled = yes`
  - Configure memory management and eviction policies
  - Document parameter choices in comments
  - _Requirements: 4.5_

- [ ] 5.3 Implement ElastiCache Redis cluster
  - Create ElastiCache Redis 7 cluster with cache.t3.micro (Free Tier eligible)
  - Deploy single node in private subnet (cost optimization)
  - Disable cluster mode (single node deployment)
  - Attach ElastiCache security group
  - Configure backup window: 03:00-04:00 UTC
  - _Requirements: 4.1, 4.2_

- [ ] 5.4 Configure ElastiCache encryption and backups
  - Enable encryption at rest using AWS managed encryption
  - Enable encryption in transit (TLS)
  - Enable daily automated backups with 7-day retention
  - Configure snapshot retention period
  - _Requirements: 4.4, 4.5, 4.8_

- [ ] 5.5 Write unit tests for ElastiCache configuration
  - Test ElastiCache cluster exists with Redis 7
  - Test node type is cache.t3.micro (Free Tier)
  - Test cluster is in private subnet
  - Test encryption at rest is enabled
  - Test encryption in transit is enabled
  - Test automated backups enabled with >= 7 day retention
  - Test security group allows only authorized access on port 6379
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.8_

### 7. Checkpoint - Core Infrastructure Validation

- [ ] 7.1 Deploy and validate core infrastructure
  - Run `cdk synth` to generate CloudFormation templates
  - Run `cfn-lint` to validate templates
  - Run `cdk diff` to preview changes
  - Deploy NetworkStack, SecurityStack, DatabaseStack, CacheStack
  - Verify all stacks deploy successfully
  - Run unit tests to verify resource configuration
  - Ensure all tests pass, ask the user if questions arise

### 8. Storage Infrastructure (S3 Buckets)

- [ ] 8.1 Implement S3 bucket for static assets
  - Create S3 bucket: `showcore-static-assets-{account-id}`
  - Enable versioning
  - Enable encryption at rest using SSE-S3 (AWS managed, free)
  - Configure bucket policy to prevent public access (CloudFront only)
  - Add lifecycle policy to delete old versions after 90 days
  - _Requirements: 5.1, 5.3, 5.4_

- [ ] 7.2 Implement S3 bucket for backups
  - Create S3 bucket: `showcore-backups-{account-id}`
  - Enable versioning
  - Enable encryption at rest using SSE-S3 (AWS managed, free)
  - Configure bucket policy to prevent public access (IAM only)
  - Add lifecycle policy: transition to Glacier after 30 days, delete after 90 days
  - _Requirements: 5.2, 5.3, 5.9_

- [ ] 7.3 Implement S3 bucket for CloudTrail logs
  - Create S3 bucket: `showcore-cloudtrail-logs-{account-id}`
  - Enable versioning
  - Enable encryption at rest using SSE-S3
  - Configure bucket policy for CloudTrail write access
  - Add lifecycle policy to delete old logs after 90 days
  - _Requirements: 1.4, 6.5_

- [ ] 7.4 Write unit tests for S3 buckets
  - Test all S3 buckets exist
  - Test versioning is enabled on all buckets
  - Test encryption is enabled on all buckets
  - Test bucket policies prevent public access
  - Test lifecycle policies are configured correctly
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.9_

### 9. Content Delivery Network (CloudFront)

- [ ] 9.1 Implement CloudFront Origin Access Control (OAC)
  - Create CloudFront OAC for S3 static assets bucket
  - Update S3 bucket policy to allow CloudFront OAC access
  - Verify direct S3 access is blocked
  - _Requirements: 5.4_

- [ ] 8.2 Implement CloudFront distribution
  - Create CloudFront distribution with S3 static assets as origin
  - Configure origin to use OAC for secure access
  - Set price class to PriceClass_100 (North America and Europe only)
  - Configure HTTPS-only viewer protocol policy
  - Enable automatic compression
  - Set default TTL to 86400 seconds (24 hours)
  - Set max TTL to 31536000 seconds (1 year)
  - _Requirements: 5.5, 5.6, 5.7, 5.10_

- [ ] 8.3 Configure CloudFront caching behavior
  - Configure cache key settings (query strings, headers, cookies)
  - Set up cache invalidation patterns
  - Configure error pages (404, 403)
  - Document caching strategy in comments
  - _Requirements: 5.5_

- [ ] 8.4 Write unit tests for CloudFront configuration
  - Test CloudFront distribution exists
  - Test origin is correct S3 bucket
  - Test HTTPS-only policy is enforced
  - Test price class is PriceClass_100
  - Test OAC is configured correctly
  - Test compression is enabled
  - _Requirements: 5.4, 5.5, 5.6, 5.7, 5.10_

### 10. Monitoring and Alerting Infrastructure

- [ ] 10.1 Implement SNS topics for alerts
  - Create SNS topic: `showcore-critical-alerts`
  - Create SNS topic: `showcore-warning-alerts`
  - Create SNS topic: `showcore-billing-alerts`
  - Configure email subscriptions (use placeholder emails in code, document actual emails in README)
  - _Requirements: 7.2_

- [ ] 9.2 Implement CloudWatch alarms for RDS
  - Create alarm: RDS CPU utilization > 80% for 5 minutes → critical alerts
  - Create alarm: RDS storage utilization > 85% → warning alerts
  - Create alarm: RDS connection count > 80 → warning alerts
  - Create alarm: RDS read/write latency > 100ms → warning alerts
  - _Requirements: 3.7, 3.8, 7.3_

- [ ] 9.3 Implement CloudWatch alarms for ElastiCache
  - Create alarm: ElastiCache CPU utilization > 75% for 5 minutes → critical alerts
  - Create alarm: ElastiCache memory utilization > 80% → critical alerts
  - Create alarm: ElastiCache evictions > 1000 → warning alerts
  - Create alarm: ElastiCache cache hit rate < 80% → warning alerts
  - _Requirements: 4.6, 4.7, 7.3_

- [ ] 9.4 Implement CloudWatch alarms for billing
  - Create alarm: Estimated charges > $50 → billing alerts
  - Create alarm: Estimated charges > $100 → billing alerts (critical)
  - Configure alarms to evaluate every 6 hours
  - _Requirements: 1.2, 1.3, 9.7, 9.8_

- [ ] 9.5 Implement CloudWatch alarms for S3
  - Create alarm: S3 bucket size > 10 GB → warning alerts
  - Create alarm: S3 4xx error rate > 5% → warning alerts
  - Create alarm: S3 5xx error rate > 1% → critical alerts
  - _Requirements: 5.8_

- [ ] 9.6 Implement CloudWatch dashboard
  - Create dashboard: `ShowCore-Phase1-Infrastructure`
  - Add widgets for RDS metrics: CPU, connections, latency, storage
  - Add widgets for ElastiCache metrics: CPU, memory, evictions, cache hit rate
  - Add widgets for S3 metrics: bucket size, request count, error rate
  - Add widgets for CloudFront metrics: requests, data transfer, cache hit rate
  - Add widgets for VPC Endpoint metrics: data processed, connections
  - Add widgets for billing: estimated charges
  - _Requirements: 7.1_

- [ ] 9.7 Configure CloudWatch log retention
  - Set log retention to 7 days for cost optimization (can increase later)
  - Configure log groups for RDS, ElastiCache, VPC Flow Logs (if enabled)
  - Document log retention policy
  - _Requirements: 7.4_

- [ ] 9.8 Write unit tests for monitoring infrastructure
  - Test all SNS topics exist with subscriptions
  - Test all CloudWatch alarms exist with correct thresholds
  - Test CloudWatch dashboard exists with all widgets
  - Test log retention is configured correctly
  - _Requirements: 7.1, 7.2, 7.3, 7.4_

### 11. Backup and Disaster Recovery

- [ ] 11.1 Implement AWS Backup vault
  - Create AWS Backup vault: `showcore-phase1-backup-vault`
  - Enable encryption using AWS managed keys
  - Configure vault access policy (IAM only)
  - _Requirements: 8.1_

- [ ] 10.2 Implement AWS Backup plan for RDS
  - Create backup plan: `showcore-rds-daily-backup`
  - Configure daily backup schedule: 03:00 UTC (cron: 0 3 * * ? *)
  - Set backup retention to 7 days
  - Configure backup lifecycle (no transition to cold storage for short retention)
  - Tag backup plan with cost allocation tags
  - _Requirements: 8.2, 8.4, 8.7_

- [ ] 10.3 Implement AWS Backup plan for ElastiCache
  - Create backup plan: `showcore-elasticache-daily-backup`
  - Configure daily backup schedule: 03:00 UTC (cron: 0 3 * * ? *)
  - Set backup retention to 7 days
  - Tag backup plan with cost allocation tags
  - _Requirements: 8.3, 8.5, 8.7_

- [ ] 10.4 Configure backup failure alarms
  - Create CloudWatch alarm for AWS Backup job failures → critical alerts
  - Configure alarm to trigger on any backup job failure
  - _Requirements: 8.6_

- [ ] 10.5 Write unit tests for backup configuration
  - Test AWS Backup vault exists
  - Test backup plans exist for RDS and ElastiCache
  - Test backup schedules are configured correctly
  - Test backup retention meets requirements (>= 7 days)
  - Test backup failure alarms exist
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7_

### 12. Cost Optimization and Tagging

- [ ] 12.1 Implement resource tagging strategy
  - Create tagging construct that applies standard tags to all resources
  - Standard tags: Project=ShowCore, Phase=Phase1, Environment=Production, ManagedBy=CDK, CostCenter=Engineering
  - Add component-specific tags: Component (Network, Database, Cache, Storage, CDN)
  - Add backup tags: BackupRequired (true/false)
  - _Requirements: 9.6_

- [ ] 11.2 Configure Cost Explorer and cost allocation tags
  - Activate cost allocation tags in AWS Billing console
  - Configure Cost Explorer to track Phase 1 costs by tag
  - Create cost allocation report for monthly review
  - Document cost tracking process in README
  - _Requirements: 1.5_

- [ ] 11.3 Verify cost optimization measures
  - Verify NO NAT Gateway deployed (saves ~$32/month)
  - Verify Free Tier eligible instance types used (db.t3.micro, cache.t3.micro)
  - Verify single-AZ deployment for RDS and ElastiCache
  - Verify Gateway Endpoints used for S3 and DynamoDB (FREE)
  - Verify minimal Interface Endpoints (only essential services)
  - Verify S3 SSE-S3 encryption (free) instead of KMS
  - Verify CloudFront PriceClass_100 (lowest cost)
  - Verify short backup retention (7 days)
  - Document cost optimization decisions in README
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.9, 9.11, 9.12, 9.13_

- [ ] 11.4 Write property test for resource tagging compliance
  - **Property 2: Resource Tagging Compliance**
  - Test that all resources have required tags: Project, Phase, Environment, ManagedBy, CostCenter
  - Query all resources in Phase 1 and verify tags
  - **Validates: Requirements 9.6**

### 13. Checkpoint - Complete Infrastructure Deployment

- [ ] 13.1 Deploy remaining infrastructure stacks
  - Deploy StorageStack, CDNStack, MonitoringStack, BackupStack
  - Verify all stacks deploy successfully
  - Run all unit tests to verify resource configuration
  - Run property tests to verify universal properties
  - Ensure all tests pass, ask the user if questions arise

### 14. Integration Testing

- [ ] 14.1 Test RDS connectivity from private subnet
  - Deploy temporary EC2 instance in private subnet
  - Install PostgreSQL client
  - Test connection to RDS endpoint using security group rules
  - Verify SSL/TLS connection is enforced
  - Verify connection succeeds with correct credentials
  - Terminate test instance
  - _Requirements: 3.3, 3.6_

- [ ] 13.2 Test ElastiCache connectivity from private subnet
  - Deploy temporary EC2 instance in private subnet
  - Install Redis client
  - Test connection to ElastiCache endpoint using security group rules
  - Verify TLS connection is enforced
  - Verify connection succeeds
  - Terminate test instance
  - _Requirements: 4.3, 4.5_

- [ ] 13.3 Test VPC Endpoints functionality
  - From private subnet test instance, verify access to S3 via Gateway Endpoint
  - Verify access to CloudWatch Logs via Interface Endpoint
  - Verify access to Systems Manager via Interface Endpoint
  - Verify NO internet access from private subnet (expected behavior)
  - Document VPC Endpoint functionality in README
  - _Requirements: 2.5, 2.6, 2.7, 2.8, 2.9_

- [ ] 13.4 Test S3 and CloudFront integration
  - Upload test file to S3 static assets bucket
  - Verify file is accessible via CloudFront URL
  - Verify HTTPS redirect works
  - Verify file is NOT accessible via direct S3 URL (OAC working)
  - Test cache invalidation
  - Delete test file
  - _Requirements: 5.4, 5.5, 5.6_

- [ ] 13.5 Test backup and restore procedures
  - Trigger manual RDS snapshot
  - Verify snapshot completes successfully
  - Trigger manual ElastiCache snapshot
  - Verify snapshot completes successfully
  - Test restore from RDS snapshot (optional: restore to new instance, verify, delete)
  - Document backup and restore procedures in runbook
  - _Requirements: 8.2, 8.3_

### 15. Compliance and Security Validation

- [ ] 15.1 Run AWS Config compliance checks
  - Verify all Config rules are passing
  - Review any non-compliant resources
  - Remediate non-compliant resources
  - Document compliance status
  - _Requirements: 6.3_

- [ ] 14.2 Validate security configurations
  - Run security group audit (no 0.0.0.0/0 on sensitive ports)
  - Verify all encryption at rest is enabled
  - Verify all encryption in transit is enforced
  - Verify CloudTrail is logging all API calls
  - Review CloudTrail logs for any suspicious activity
  - _Requirements: 6.2, 6.3, 6.4, 6.5_

- [ ] 14.3 Validate cost optimization measures
  - Review Cost Explorer for Phase 1 costs
  - Verify costs are within expected range (~$3-10/month during Free Tier)
  - Verify NO NAT Gateway charges
  - Verify VPC Endpoint charges (~$21-28/month for Interface Endpoints)
  - Document actual costs vs estimated costs
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

### 16. Documentation and Handoff

- [ ] 16.1 Create operational runbooks
  - Create runbook: RDS backup and restore procedures
  - Create runbook: ElastiCache backup and restore procedures
  - Create runbook: VPC Endpoint troubleshooting
  - Create runbook: CloudFront cache invalidation
  - Create runbook: Security incident response
  - Create runbook: Cost optimization review process
  - Store runbooks in `.kiro/specs/showcore-aws-migration-phase1/runbooks/`
  - _Requirements: 10.7_

- [ ] 15.2 Update project README with deployment instructions
  - Document prerequisites (AWS account, IAM user, CDK installed)
  - Document deployment steps (bootstrap, synth, diff, deploy)
  - Document environment configuration
  - Document cost estimates and optimization measures
  - Document VPC Endpoints architecture and trade-offs
  - Document monitoring and alerting setup
  - Document backup and disaster recovery procedures
  - _Requirements: 10.7_

- [ ] 15.3 Create architecture diagrams
  - Create network architecture diagram (VPC, subnets, VPC Endpoints)
  - Create security architecture diagram (security groups, encryption)
  - Create monitoring architecture diagram (CloudWatch, SNS, alarms)
  - Store diagrams in `.kiro/specs/showcore-aws-migration-phase1/diagrams/`
  - _Requirements: 10.7_

- [ ] 15.4 Document lessons learned and future improvements
  - Document VPC Endpoints experience (pros/cons, troubleshooting)
  - Document cost optimization results (actual vs estimated)
  - Document any issues encountered and resolutions
  - Document recommendations for Phase 2
  - Create document: `.kiro/specs/showcore-aws-migration-phase1/lessons-learned.md`

### 17. Final Validation and Sign-off

- [ ] 17.1 Run complete test suite
  - Run all unit tests
  - Run all property tests
  - Run all integration tests
  - Run all compliance tests
  - Verify 100% test pass rate
  - Generate test report
  - _Requirements: All requirements_

- [ ] 16.2 Validate all acceptance criteria
  - Review requirements.md and verify all acceptance criteria are met
  - Document any deviations or exceptions
  - Create acceptance criteria checklist
  - Obtain stakeholder sign-off

- [ ] 16.3 Final checkpoint and handoff
  - Review CloudWatch dashboard for any anomalies
  - Review Cost Explorer for final cost validation
  - Review all documentation for completeness
  - Ensure all tests pass, ask the user if questions arise
  - Prepare for Phase 2 planning

## Notes

- All tasks are required for comprehensive infrastructure deployment and validation
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation at key milestones
- Property tests validate universal correctness properties across all resources
- Unit tests validate specific resource configurations
- Integration tests validate connectivity and functionality between components
- All infrastructure is defined as code using AWS CDK with Python
- Cost optimization is a primary concern throughout implementation
- VPC Endpoints architecture (no NAT Gateway) saves ~$4-11/month while improving security
- Free Tier eligible resources used where possible to minimize costs during first 12 months
- Single-AZ deployment for RDS and ElastiCache reduces costs for low-traffic project
- Comprehensive monitoring and alerting configured from day one
- Backup and disaster recovery procedures documented and tested

## Estimated Costs

**During Free Tier (First 12 Months):**
- RDS db.t3.micro: $0 (750 hours/month free)
- ElastiCache cache.t3.micro: $0 (750 hours/month free)
- VPC Endpoints (Gateway): $0 (S3, DynamoDB are FREE)
- VPC Endpoints (Interface): ~$21-28/month (3-4 endpoints at ~$7/month each)
- S3 Storage: ~$1-5/month (first 5 GB free)
- CloudFront: ~$1-5/month (first 1 TB free)
- CloudWatch: ~$0-5/month (basic metrics free)
- **Total: ~$3-10/month**

**After Free Tier (Month 13+):**
- RDS db.t3.micro: ~$15/month
- ElastiCache cache.t3.micro: ~$12/month
- VPC Endpoints: ~$21-28/month
- Other costs remain similar
- **Total: ~$49-60/month**

**Cost Savings vs NAT Gateway:**
- NAT Gateway eliminated: -$32/month
- VPC Endpoints added: +$21-28/month
- **Net savings: ~$4-11/month**
- **Additional benefits: Better security, no internet access from private subnets**
