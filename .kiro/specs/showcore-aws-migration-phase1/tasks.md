# Implementation Plan: ShowCore AWS Migration Phase 1

## Overview

This implementation plan breaks down the Phase 1 AWS infrastructure deployment into discrete, actionable tasks. Phase 1 establishes the foundational AWS infrastructure using a cost-optimized VPC Endpoints architecture (no NAT Gateway) to save ~$4-11/month while maintaining secure AWS service access.

The implementation uses AWS CDK with Python for Infrastructure as Code, following the design specified in design.md and adhering to the standards defined in iac-standards.md. All infrastructure will be deployed to us-east-1 region.

**Key Architecture Decisions:**
- VPC Endpoints instead of NAT Gateway (saves ~$4-11/month, better security)
- Single-AZ deployment for RDS and ElastiCache (cost optimization for low-traffic project)
- Free Tier eligible instance types (db.t3.micro, cache.t3.micro)
- Gateway Endpoints for S3 and DynamoDB (FREE)
- Interface Endpoints for CloudWatch and Systems Manager (~$7/month each)
- AWS managed encryption keys (SSE-S3) instead of KMS for cost optimization
- CloudFront PriceClass_100 for lowest cost regions

**Cost Optimization Target:**
- During Free Tier (first 12 months): ~$3-10/month
- After Free Tier: ~$49-60/month
- Net savings vs NAT Gateway architecture: ~$4-11/month

**Estimated Timeline:** 2-3 weeks for complete deployment and validation

## Tasks

### 🎯 Phase Overview: Write CDK Code → Deploy Once → Validate

```
┌─────────────────────────────────────────────────────────────────┐
│  TASKS 1-12: Write CDK Code Locally (NO Cloud Deployment)      │
│  ├─ Write Python CDK stack definitions                          │
│  ├─ Write unit tests (validate CDK templates)                   │
│  ├─ Run `cdk synth` to generate CloudFormation                  │
│  └─ All code lives in infrastructure/lib/stacks/                │
├─────────────────────────────────────────────────────────────────┤
│  TASK 13: 🚀 THE BIG DEPLOYMENT (Deploy to AWS Cloud)          │
│  ├─ Run `cdk deploy --all`                                      │
│  ├─ Deploy ALL stacks at once (15-30 minutes)                   │
│  └─ 🎉 Infrastructure goes LIVE in AWS! 🎉                      │
├─────────────────────────────────────────────────────────────────┤
│  TASKS 14-17: Post-Deployment Validation (Test Live AWS)       │
│  ├─ Integration tests (test actual AWS resources)               │
│  ├─ Property tests (validate actual AWS resources)              │
│  ├─ Compliance checks (validate actual AWS resources)           │
│  └─ Documentation (based on deployed infrastructure)            │
└─────────────────────────────────────────────────────────────────┘
```

**Key Distinction:**
- **"Write CDK code to define..."** = Writing Python code locally (Tasks 1-12)
- **"Deploy..."** = Actually creating resources in AWS cloud (Task 13)
- **"Test actual AWS..."** = Validating live infrastructure (Tasks 14-17)

---

### 1. AWS Account Foundation Setup (Manual AWS Console Setup)

**Note**: These are one-time manual setup tasks in AWS Console, not CDK code.

- [x] 1.1 Configure AWS Organizations structure (Manual)
  - Create organizational units for ShowCore project in AWS Console
  - Document organization hierarchy
  - _Requirements: 1.1_

- [x] 1.2 Set up billing alerts and cost monitoring (Manual)
  - Create CloudWatch billing alarms for $50 and $100 thresholds in AWS Console
  - Configure SNS topic for billing notifications
  - Enable Cost Explorer with cost allocation tags
  - _Requirements: 1.2, 1.3, 1.5_

- [x] 1.3 Enable AWS CloudTrail for audit logging (Manual)
  - Create CloudTrail trail for all regions in AWS Console
  - Configure S3 bucket for CloudTrail logs
  - Enable log file validation
  - _Requirements: 1.4_

### 2. Infrastructure as Code Setup (Local CDK Project Setup)

**Note**: These tasks set up the CDK project structure locally. No AWS resources created yet.

- [x] 2.1 Initialize AWS CDK project structure (Local)
  - Create CDK app with Python following iac-standards.md project structure
  - Set up directory structure: lib/stacks/, lib/constructs/, tests/unit/, tests/property/, tests/integration/
  - Configure cdk.json with project settings (account, region, environment context)
  - Create requirements.txt with CDK dependencies (aws-cdk-lib, constructs, boto3)
  - Create requirements-dev.txt with testing dependencies (pytest, hypothesis, boto3)
  - Create README.md with deployment instructions
  - _Requirements: 10.1, 10.7_

- [x] 2.2 Write base CDK stack class with standard tagging (Local Code)
  - Write ShowCoreBaseStack class with standard tags (Project, Phase, Environment, ManagedBy, CostCenter)
  - Use Tags.of(self).add() API for applying tags to all resources in stack
  - Create tagging utility for consistent resource tagging across stacks
  - Follow naming convention: showcore-{component}-{environment}-{resource-type}
  - **No deployment yet** - just writing Python code
  - _Requirements: 9.6_

- [x] 2.3 Set up CDK testing framework (Local)
  - Configure pytest for CDK stack testing
  - Set up aws-cdk.assertions for template validation
  - Create test utilities for AWS resource validation using boto3
  - Configure test structure: tests/unit/, tests/property/, tests/integration/
  - _Requirements: 10.3_

- [ ]* 2.4 Write unit tests for base stack configuration (Local Tests)
  - Test standard tags are applied to all resources using Template.from_stack()
  - Test stack naming conventions follow iac-standards.md
  - Test resource naming follows showcore-{component}-{environment}-{resource-type} format
  - **Tests validate CDK template output** - no actual AWS resources involved
  - _Requirements: 9.6_

### 3. Network Infrastructure CDK Code (VPC Endpoints Architecture)

**Note**: Write CDK code to define network infrastructure. No AWS deployment yet.

- [x] 3.1 Write CDK code to define VPC with multi-AZ subnets (Local Code)
  - Write code to create VPC with 10.0.0.0/16 CIDR block (65,536 IPs) using ec2.Vpc L2 construct
  - Define 2 public subnets (10.0.0.0/24, 10.0.1.0/24) in us-east-1a and us-east-1b
  - Define 2 private subnets (10.0.2.0/24, 10.0.3.0/24) in us-east-1a and us-east-1b
  - Define Internet Gateway for public subnets
  - DO NOT define NAT Gateway (cost optimization - saves ~$32/month)
  - Use construct ID "VPC" for VPC resource
  - Apply standard tags to all network resources
  - **Save code in lib/stacks/network_stack.py** - no deployment yet
  - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [x] 3.2 Write CDK code to define VPC Gateway Endpoints (Local Code)
  - Write code to create S3 Gateway Endpoint using ec2.GatewayVpcEndpoint construct
  - Write code to create DynamoDB Gateway Endpoint using ec2.GatewayVpcEndpoint construct
  - Configure Gateway Endpoints to attach to private subnet route tables automatically
  - Verify Gateway Endpoints are FREE (no charges)
  - Use construct IDs: "S3GatewayEndpoint", "DynamoDBGatewayEndpoint"
  - **Add to network_stack.py** - no deployment yet
  - _Requirements: 2.5, 2.6, 9.3_

- [x] 3.3 Write CDK code to define VPC Interface Endpoints (Local Code)
  - Write code to create security group for Interface Endpoints (allow HTTPS 443 from VPC CIDR)
  - Write code to create CloudWatch Logs Interface Endpoint using ec2.InterfaceVpcEndpoint
  - Write code to create CloudWatch Monitoring Interface Endpoint using ec2.InterfaceVpcEndpoint
  - Write code to create Systems Manager Interface Endpoint using ec2.InterfaceVpcEndpoint
  - Configure Interface Endpoints to deploy in both private subnets (us-east-1a, us-east-1b)
  - Enable private DNS for all Interface Endpoints
  - Use construct IDs: "VpcEndpointSecurityGroup", "CloudWatchLogsEndpoint", "CloudWatchMonitoringEndpoint", "SystemsManagerEndpoint"
  - **Add to network_stack.py** - no deployment yet
  - _Requirements: 2.7, 2.8, 2.9, 2.12, 9.4_

- [x] 3.4 Write CDK code to configure route tables (Local Code)
  - Write code to configure public subnet route tables (0.0.0.0/0 → Internet Gateway)
  - Write code to configure private subnet route tables (NO default route, only VPC Endpoint routes)
  - Verify Gateway Endpoints automatically add routes to private route tables
  - Verify private subnets have NO internet access (no NAT Gateway route)
  - Export VPC ID and subnet IDs as CloudFormation outputs for cross-stack references
  - **Add to network_stack.py** - no deployment yet
  - _Requirements: 2.11, 2.4_

- [x] 3.5 Write unit tests for network infrastructure CDK code (Local Tests)
  - Test VPC exists with correct CIDR (10.0.0.0/16) using Template.has_resource_properties()
  - Test subnets exist in correct AZs with correct CIDR blocks
  - Test NO NAT Gateway exists (cost optimization) using Template.resource_count_is("AWS::EC2::NatGateway", 0)
  - Test Gateway Endpoints exist for S3 and DynamoDB
  - Test Interface Endpoints exist with correct security groups
  - Test route tables have correct routes (public: IGW, private: no default route)
  - Test Internet Gateway exists for public subnets
  - **Tests run against CDK synthesized template** - no actual AWS resources
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9_

### 4. Security Infrastructure CDK Code

**Note**: Write CDK code to define security infrastructure. No AWS deployment yet.

- [x] 4.1 Write CDK code to define security groups for data tier (Local Code)
  - Write code to create RDS security group using ec2.SecurityGroup (allow PostgreSQL 5432 from application tier)
  - Write code to create ElastiCache security group using ec2.SecurityGroup (allow Redis 6379 from application tier)
  - Write code to create VPC Endpoint security group using ec2.SecurityGroup (allow HTTPS 443 from VPC CIDR 10.0.0.0/16)
  - Follow least privilege principle (no 0.0.0.0/0 on sensitive ports 22, 5432, 6379)
  - Use descriptive construct IDs: "RdsSecurityGroup", "ElastiCacheSecurityGroup", "VpcEndpointSecurityGroup"
  - Add description to each security group rule for clarity
  - **Save code in lib/stacks/security_stack.py** - no deployment yet
  - _Requirements: 3.3, 4.3, 6.2, 2.12_

- [x] 4.2 Write CDK code to enable AWS Config (Local Code)
  - Write code to create AWS Config configuration recorder using config.CfnConfigurationRecorder
  - Write code to configure Config rules: rds-storage-encrypted, s3-bucket-public-read-prohibited
  - Write code to set up Config delivery channel to S3 bucket
  - Enable Config for continuous compliance monitoring
  - **Add to security_stack.py** - no deployment yet
  - _Requirements: 6.3_

- [x] 4.3 Write CDK code to configure AWS Systems Manager Session Manager (Local Code)
  - Write code to enable Session Manager for secure instance access without SSH keys
  - Write code to configure Session Manager logging to CloudWatch Logs via Interface Endpoint
  - Write code to create IAM role for Session Manager with required permissions
  - Verify no SSH keys required for instance access
  - **Add to security_stack.py** - no deployment yet
  - _Requirements: 6.8, 2.9_

- [x] 4.4 Write CDK code to create CloudTrail S3 bucket (Local Code)
  - Write code to create S3 bucket for CloudTrail logs with versioning enabled
  - Write code to enable encryption at rest using SSE-S3 (AWS managed keys, not KMS for cost optimization)
  - Write code to configure bucket policy for CloudTrail write access
  - Write code to enable log file validation for integrity checking
  - Write code to set lifecycle policy to delete logs after 90 days (cost optimization)
  - **Add to security_stack.py** - no deployment yet
  - _Requirements: 6.5, 1.4, 9.9_

- [x] 4.5 Write property test for security group least privilege (Local Tests)
  - Write test: no security group has 0.0.0.0/0 on ports 22, 5432, 6379
  - Test will query all security groups using boto3 ec2.describe_security_groups()
  - Test will verify no overly permissive ingress rules on sensitive ports
  - **Property 1: Security Group Least Privilege**
  - **This test runs AFTER deployment in Task 15** - validates actual AWS resources
  - **Validates: Requirements 6.2**

- [x] 4.6 Write unit tests for security infrastructure CDK code (Local Tests)
  - Test security groups have correct ingress rules using Template.has_resource_properties()
  - Test AWS Config is enabled and recording
  - Test CloudTrail is enabled with log file validation
  - Test Systems Manager Session Manager is configured
  - Test CloudTrail S3 bucket has SSE-S3 encryption (not KMS)
  - **Tests run against CDK synthesized template** - no actual AWS resources
  - _Requirements: 6.2, 6.3, 6.5, 6.8, 9.9_

### 5. Database Infrastructure CDK Code (RDS PostgreSQL)

**Note**: Write CDK code to define RDS infrastructure. No AWS deployment yet.

- [x] 5.1 Write CDK code to define RDS subnet group and parameter group (Local Code)
  - Write code to create RDS subnet group in private subnets using rds.SubnetGroup
  - Write code to create RDS parameter group for PostgreSQL 16 using rds.ParameterGroup
  - Set rds.force_ssl=1 in parameter group to enforce SSL/TLS connections
  - Use construct IDs: "RdsSubnetGroup", "RdsParameterGroup"
  - **Save code in lib/stacks/database_stack.py** - no deployment yet
  - _Requirements: 3.1, 3.6_

- [x] 5.2 Write CDK code to define RDS PostgreSQL instance (Local Code)
  - Write code to create db.t3.micro instance (Free Tier eligible - 750 hours/month for 12 months) using rds.DatabaseInstance
  - Configure single AZ deployment (us-east-1a) for cost optimization (Multi-AZ doubles cost)
  - Allocate 20 GB gp3 storage (Free Tier limit)
  - Enable encryption at rest using AWS managed keys (not KMS for cost optimization)
  - Attach RDS security group from task 4.1
  - Set database name to "showcore"
  - Use construct ID: "Database"
  - **Add to database_stack.py** - no deployment yet
  - _Requirements: 3.1, 3.2, 3.5, 3.9, 9.1, 9.5_

- [x] 5.3 Write CDK code to configure RDS automated backups (Local Code)
  - Write code to enable automated daily backups with 7-day retention (short retention for cost optimization)
  - Set backup window to 03:00-04:00 UTC (off-peak hours)
  - Enable point-in-time recovery (5-minute granularity)
  - Set maintenance window to Sunday 04:00-05:00 UTC
  - **Add to database_stack.py** - no deployment yet
  - _Requirements: 3.4_

- [x] 5.4 Write CDK code to configure RDS monitoring and alarms (Local Code)
  - Write code to create CloudWatch alarm for CPU utilization > 80% for 5 minutes using cloudwatch.Alarm
  - Write code to create CloudWatch alarm for storage utilization > 85%
  - Configure SNS notifications for alarms (will be created in task 10.1)
  - Use alarm names: "showcore-rds-cpu-high", "showcore-rds-storage-high"
  - **Add to database_stack.py** - no deployment yet
  - _Requirements: 3.7, 3.8, 7.3, 7.5_

- [x] 5.5 Write unit tests for RDS CDK code (Local Tests)
  - Test RDS instance is db.t3.micro (Free Tier) using Template.has_resource_properties()
  - Test RDS is in single AZ (cost optimization) - MultiAZ should be false
  - Test encryption at rest is enabled with AWS managed keys
  - Test SSL/TLS is required (rds.force_ssl=1 in parameter group)
  - Test automated backups are enabled with 7-day retention
  - Test CloudWatch alarms exist for CPU and storage
  - Test allocated storage is 20 GB (Free Tier limit)
  - **Tests run against CDK synthesized template** - no actual AWS resources
  - _Requirements: 3.1, 3.2, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9, 9.1, 9.5_

- [x] 5.6 Write integration test for RDS connectivity (Post-Deployment Test)
  - Write test to deploy test EC2 instance in private subnet using ec2.Instance
  - Write test to install PostgreSQL client (psql)
  - Write test to connect to RDS endpoint using psql with SSL mode=require
  - Write test to verify SSL/TLS connection is enforced
  - Write test to verify security group rules allow connection
  - Write test to terminate test instance after validation
  - **This test runs AFTER deployment in Task 14.1** - validates actual AWS resources
  - _Requirements: 3.3, 3.6_

### 6. Cache Infrastructure CDK Code (ElastiCache Redis)
- [x] **Queue all Cache Infrastructure tasks (6.1-6.5)**

**Note**: Write CDK code to define ElastiCache infrastructure. No AWS deployment yet.

- [x] 6.1 Write CDK code to define ElastiCache subnet group and parameter group (Local Code)
  - Write code to create ElastiCache subnet group in private subnets using elasticache.CfnSubnetGroup
  - Write code to create ElastiCache parameter group for Redis 7 using elasticache.CfnParameterGroup
  - Configure parameter group to enforce TLS connections (transit-encryption-enabled=yes)
  - Use construct IDs: "ElastiCacheSubnetGroup", "ElastiCacheParameterGroup"
  - **Save code in lib/stacks/cache_stack.py** - no deployment yet
  - _Requirements: 4.1, 4.5_

- [x] 6.2 Write CDK code to define ElastiCache Redis cluster (Local Code)
  - Write code to create cache.t3.micro node (Free Tier eligible - 750 hours/month for 12 months) using elasticache.CfnCacheCluster
  - Configure single node in us-east-1a for cost optimization (no replicas)
  - Enable encryption at rest using AWS managed encryption (not KMS for cost optimization)
  - Enable encryption in transit (TLS required)
  - Attach ElastiCache security group from task 4.1
  - Set cluster ID to "showcore-redis"
  - Use construct ID: "RedisCluster"
  - **Add to cache_stack.py** - no deployment yet
  - _Requirements: 4.1, 4.2, 4.4, 4.5, 9.1, 9.5_

- [x] 6.3 Write CDK code to configure ElastiCache automated backups (Local Code)
  - Write code to enable daily automated backups with 7-day retention (short retention for cost optimization)
  - Set backup window to 03:00-04:00 UTC (off-peak hours)
  - Configure snapshot retention limit to 7
  - **Add to cache_stack.py** - no deployment yet
  - _Requirements: 4.8_

- [x] 6.4 Write CDK code to configure ElastiCache monitoring and alarms (Local Code)
  - Write code to create CloudWatch alarm for CPU utilization > 75% for 5 minutes using cloudwatch.Alarm
  - Write code to create CloudWatch alarm for memory utilization > 80%
  - Configure SNS notifications for alarms (will be created in task 10.1)
  - Use alarm names: "showcore-elasticache-cpu-high", "showcore-elasticache-memory-high"
  - **Add to cache_stack.py** - no deployment yet
  - _Requirements: 4.6, 4.7, 7.3, 7.5_

- [x] 6.5 Write unit tests for ElastiCache CDK code (Local Tests)
  - Test ElastiCache is cache.t3.micro (Free Tier) using Template.has_resource_properties()
  - Test single node deployment (cost optimization) - NumCacheNodes should be 1
  - Test encryption at rest and in transit are enabled
  - Test automated backups are enabled with 7-day retention
  - Test CloudWatch alarms exist for CPU and memory
  - Test TLS is enforced in parameter group
  - **Tests run against CDK synthesized template** - no actual AWS resources
  - _Requirements: 4.1, 4.2, 4.4, 4.5, 4.6, 4.7, 4.8, 9.1, 9.5_

### 7. Checkpoint - Core Infrastructure CDK Code Review
- [ ] **Queue all Checkpoint tasks (7.1-7.2)**

**Note**: Review CDK code written so far. No AWS deployment yet.

- [x] 7.1 Review core infrastructure CDK code (Local Review)
  - Run all unit tests for network, security, database, and cache stacks: `pytest tests/unit/ -v`
  - Run `cdk synth` to generate CloudFormation templates and verify no errors
  - Review synthesized templates to verify cost optimization measures:
    - NO NAT Gateway in template
    - Free Tier instances (db.t3.micro, cache.t3.micro)
    - Gateway Endpoints (S3, DynamoDB) configured
    - Interface Endpoints (CloudWatch, SSM) configured
    - Private subnets have NO default route
  - Run `cdk diff` to preview what will be deployed (should show all new resources)
  - **No actual AWS resources created yet** - just validating CDK code
  - Ask user if any issues or questions arise before proceeding to storage/CDN code
  - _Requirements: All Phase 1 requirements_

- [x] 7.2 📋 ADR Checkpoint: Review and document architectural decisions (ADR Documentation)
  - Review all architectural decisions made in Tasks 1-6 (network, security, database, cache)
  - Identify decisions that need ADR documentation:
    - VPC Endpoints vs NAT Gateway architecture (if not already documented)
    - Single-AZ vs Multi-AZ deployment strategy
    - Free Tier instance selection
    - Encryption key management (AWS managed vs KMS)
    - Security group design and least privilege approach
  - For each significant decision, create or update ADR in `.kiro/specs/showcore-aws-migration-phase1/`
  - Follow ADR format: Status, Context, Decision, Alternatives, Rationale, Consequences
  - Reference requirements and cost optimization goals
  - **This checkpoint ensures architectural decisions are documented before proceeding**
  - _Requirements: 10.1, 10.7_

### 8. Storage Infrastructure CDK Code (S3 Buckets)
- [ ] **Queue all Storage Infrastructure tasks (8.1-8.4)**

**Note**: Write CDK code to define S3 infrastructure. No AWS deployment yet.

- [x] 8.1 Write CDK code to define S3 bucket for static assets (Local Code)
  - Write code to create bucket with versioning enabled using s3.Bucket
  - Write code to enable encryption at rest using SSE-S3 (AWS managed keys, not KMS for cost optimization)
  - Write code to configure bucket policy to prevent public access (CloudFront only via OAC)
  - Set bucket name: showcore-static-assets-{account-id}
  - Write code to configure lifecycle policy to delete old versions after 90 days
  - Use construct ID: "StaticAssetsBucket"
  - **Save code in lib/stacks/storage_stack.py** - no deployment yet
  - _Requirements: 5.1, 5.3, 5.4, 9.9_

- [x] 8.2 Write CDK code to define S3 bucket for backups (Local Code)
  - Write code to create bucket with versioning enabled using s3.Bucket
  - Write code to enable encryption at rest using SSE-S3 (AWS managed keys, not KMS for cost optimization)
  - Write code to configure bucket policy for private access only (IAM only)
  - Set bucket name: showcore-backups-{account-id}
  - Use construct ID: "BackupsBucket"
  - **Add to storage_stack.py** - no deployment yet
  - _Requirements: 5.2, 5.3, 9.9_

- [x] 8.3 Write CDK code to configure S3 lifecycle policies (Local Code)
  - Write code to configure lifecycle policy to transition backups to Glacier Flexible Retrieval after 30 days
  - Write code to configure lifecycle policy to delete old backups after 90 days (short retention for cost optimization)
  - Write code to configure lifecycle policy to delete old versions after 90 days
  - Apply lifecycle policies to backups bucket only
  - **Add to storage_stack.py** - no deployment yet
  - _Requirements: 5.9, 9.10_

- [x] 8.4 Write unit tests for S3 CDK code (Local Tests)
  - Test S3 buckets exist with versioning enabled using Template.has_resource_properties()
  - Test encryption at rest is enabled using SSE-S3 (not KMS)
  - Test bucket policies prevent public access
  - Test lifecycle policies are configured for backups bucket
  - Test bucket names follow naming convention: showcore-{component}-{account-id}
  - **Tests run against CDK synthesized template** - no actual AWS resources
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.9, 9.9, 9.10_

### 9. Content Delivery Network CDK Code (CloudFront)
- [ ] **Queue all CDN Infrastructure tasks (9.1-9.4)**

**Note**: Write CDK code to define CloudFront infrastructure. No AWS deployment yet.

- [x] 9.1 Write CDK code to define CloudFront distribution (Local Code)
  - Write code to create distribution with S3 static assets bucket as origin using cloudfront.Distribution
  - Write code to configure Origin Access Control (OAC) for secure S3 access (not legacy OAI)
  - Set PriceClass_100 (North America and Europe only) for cost optimization
  - Use construct ID: "CloudFrontDistribution"
  - **Save code in lib/stacks/cdn_stack.py** - no deployment yet
  - _Requirements: 5.5, 5.7, 9.11_

- [x] 9.2 Write CDK code to configure CloudFront caching and security (Local Code)
  - Write code to configure HTTPS-only viewer protocol policy (redirect HTTP to HTTPS)
  - Set default TTL to 86400 seconds (24 hours)
  - Set max TTL to 31536000 seconds (1 year)
  - Write code to enable automatic compression (gzip, brotli)
  - Use TLS 1.2 minimum for viewer connections
  - **Add to cdn_stack.py** - no deployment yet
  - _Requirements: 5.6_

- [x] 9.3 Write CDK code to update S3 bucket policy for CloudFront (Local Code)
  - Write code to update static assets bucket policy to allow CloudFront OAC access
  - Verify direct S3 access is blocked (no public access)
  - Use s3.Bucket.add_to_resource_policy() to grant CloudFront access
  - **Add to cdn_stack.py** - no deployment yet
  - _Requirements: 5.4_

- [x] 9.4 Write integration test for CloudFront and S3 (Post-Deployment Test)
  - Write test to upload test file to S3 static assets bucket using boto3
  - Write test to verify file is accessible via CloudFront URL (HTTPS)
  - Write test to verify HTTPS redirect works (HTTP → HTTPS)
  - Write test to verify file is NOT accessible via direct S3 URL (should return 403)
  - Write test to verify compression is enabled (check Content-Encoding header)
  - Write test to delete test file after validation
  - **This test runs AFTER deployment in Task 14.5** - validates actual AWS resources
  - _Requirements: 5.4, 5.5, 5.6_

### 10. Monitoring and Alerting CDK Code
- [ ] **Queue all Monitoring Infrastructure tasks (10.1-10.8)**

**Note**: Write CDK code to define monitoring infrastructure. No AWS deployment yet.

- [x] 10.1 Write CDK code to define SNS topics for alerts (Local Code)
  - Write code to create critical alerts topic with email subscriptions using sns.Topic
  - Write code to create warning alerts topic with email subscriptions using sns.Topic
  - Write code to create billing alerts topic with email subscriptions using sns.Topic
  - Use topic names: "showcore-critical-alerts", "showcore-warning-alerts", "showcore-billing-alerts"
  - Add email subscriptions using sns.Subscription
  - **Save code in lib/stacks/monitoring_stack.py** - no deployment yet
  - _Requirements: 7.2_

- [x] 10.2 Write CDK code to define CloudWatch dashboard (Local Code)
  - Write code to create dashboard using cloudwatch.Dashboard with name "ShowCore-Phase1-Dashboard"
  - Add RDS metrics: CPUUtilization, DatabaseConnections, ReadLatency, WriteLatency, FreeStorageSpace
  - Add ElastiCache metrics: CPUUtilization, DatabaseMemoryUsagePercentage, Evictions, CacheHits, CacheMisses
  - Add S3 metrics: BucketSizeBytes, NumberOfObjects, 4xxErrors, 5xxErrors
  - Add CloudFront metrics: Requests, BytesDownloaded, 4xxErrorRate, 5xxErrorRate, CacheHitRate
  - Add VPC Endpoint metrics: PacketsReceived, PacketsSent, BytesReceived, BytesSent
  - Use cloudwatch.GraphWidget for metric visualization
  - **Add to monitoring_stack.py** - no deployment yet
  - _Requirements: 7.1_

- [x] 10.3 Write CDK code to define CloudWatch alarms for RDS (Local Code)
  - Write code to create alarm: CPU utilization > 80% for 5 minutes → critical alert using cloudwatch.Alarm
  - Write code to create alarm: Storage utilization > 85% → warning alert
  - Write code to create alarm: Connection count > 80 → warning alert
  - Write code to create alarm: Read/write latency > 100ms → warning alert
  - Use alarm names: "showcore-rds-cpu-high", "showcore-rds-storage-high", "showcore-rds-connections-high", "showcore-rds-latency-high"
  - Configure SNS actions to appropriate topics
  - **Add to monitoring_stack.py** - no deployment yet
  - _Requirements: 3.7, 3.8, 7.3, 7.5_

- [x] 10.4 Write CDK code to define CloudWatch alarms for ElastiCache (Local Code)
  - Write code to create alarm: CPU utilization > 75% for 5 minutes → critical alert using cloudwatch.Alarm
  - Write code to create alarm: Memory utilization > 80% → critical alert
  - Write code to create alarm: Evictions > 0 → warning alert
  - Write code to create alarm: Cache hit rate < 80% → warning alert
  - Use alarm names: "showcore-elasticache-cpu-high", "showcore-elasticache-memory-high", "showcore-elasticache-evictions", "showcore-elasticache-cache-hit-low"
  - Configure SNS actions to appropriate topics
  - **Add to monitoring_stack.py** - no deployment yet
  - _Requirements: 4.6, 4.7, 7.3, 7.5_

- [x] 10.5 Write CDK code to define CloudWatch alarms for S3 (Local Code)
  - Write code to create alarm: Bucket size > 10GB → warning alert using cloudwatch.Alarm
  - Write code to create alarm: 4xx error rate > 5% → warning alert
  - Write code to create alarm: 5xx error rate > 1% → critical alert
  - Use alarm names: "showcore-s3-size-high", "showcore-s3-4xx-errors", "showcore-s3-5xx-errors"
  - Configure SNS actions to appropriate topics
  - **Add to monitoring_stack.py** - no deployment yet
  - _Requirements: 5.8, 7.3_

- [x] 10.6 Write CDK code to define CloudWatch alarms for billing (Local Code)
  - Write code to create alarm: Estimated charges > $50 → warning alert using cloudwatch.Alarm
  - Write code to create alarm: Estimated charges > $100 → critical alert
  - Use alarm names: "showcore-billing-50", "showcore-billing-100"
  - Configure SNS actions to billing alerts topic
  - Set evaluation period to 6 hours (21600 seconds)
  - **Add to monitoring_stack.py** - no deployment yet
  - _Requirements: 1.2, 1.3, 9.7, 9.8_

- [x] 10.7 Write CDK code to configure CloudWatch log retention (Local Code)
  - Write code to set log retention to 7 days for cost optimization using logs.LogGroup
  - Configure log groups for RDS, ElastiCache, CloudTrail, VPC Flow Logs (if enabled)
  - Use log group names: "/aws/rds/showcore-db", "/aws/elasticache/showcore-redis", "/aws/cloudtrail/showcore"
  - **Add to monitoring_stack.py** - no deployment yet
  - _Requirements: 7.4_

- [x] 10.8 Write unit tests for monitoring CDK code (Local Tests)
  - Test SNS topics exist with subscriptions using Template.has_resource_properties()
  - Test CloudWatch dashboard exists with correct widgets
  - Test CloudWatch alarms exist for all critical metrics (RDS, ElastiCache, S3, billing)
  - Test log retention is set to 7 days for all log groups
  - Test alarm thresholds match requirements (CPU 80%, memory 80%, billing $50/$100)
  - **Tests run against CDK synthesized template** - no actual AWS resources
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

### 11. Backup and Disaster Recovery CDK Code
- [ ] **Queue all Backup Infrastructure tasks (11.1-11.5)**

**Note**: Write CDK code to define backup infrastructure. No AWS deployment yet.

- [x] 11.1 Write CDK code to define AWS Backup vault (Local Code)
  - Write code to create backup vault for centralized backup management using backup.BackupVault
  - Write code to enable encryption for backup vault using AWS managed keys (not KMS for cost optimization)
  - Use vault name: "showcore-backup-vault"
  - **Save code in lib/stacks/backup_stack.py** - no deployment yet
  - _Requirements: 8.1, 9.9_

- [x] 11.2 Write CDK code to define AWS Backup plan for RDS (Local Code)
  - Write code to configure daily backup schedule (03:00 UTC) using backup.BackupPlan
  - Set backup retention to 7 days (short retention for cost optimization)
  - Tag backup resources with cost allocation tags (Project, Phase, Environment)
  - Use backup plan name: "showcore-rds-backup-plan"
  - Create backup selection to include RDS instances with tag Project=ShowCore
  - **Add to backup_stack.py** - no deployment yet
  - _Requirements: 8.2, 8.4, 8.7_

- [x] 11.3 Write CDK code to define AWS Backup plan for ElastiCache (Local Code)
  - Write code to configure daily snapshot schedule (03:00 UTC) using backup.BackupPlan
  - Set snapshot retention to 7 days (short retention for cost optimization)
  - Tag backup resources with cost allocation tags (Project, Phase, Environment)
  - Use backup plan name: "showcore-elasticache-backup-plan"
  - Create backup selection to include ElastiCache clusters with tag Project=ShowCore
  - **Add to backup_stack.py** - no deployment yet
  - _Requirements: 8.3, 8.5, 8.7_

- [x] 11.4 Write CDK code to define backup failure alarms (Local Code)
  - Write code to create CloudWatch alarm for RDS backup job failures using cloudwatch.Alarm
  - Write code to create CloudWatch alarm for ElastiCache backup job failures
  - Configure SNS notifications to critical alerts topic
  - Use alarm names: "showcore-rds-backup-failure", "showcore-elasticache-backup-failure"
  - Monitor AWS Backup job status metrics
  - **Add to backup_stack.py** - no deployment yet
  - _Requirements: 8.6_

- [x] 11.5 Write unit tests for backup CDK code (Local Tests)
  - Test AWS Backup vault exists using Template.has_resource_properties()
  - Test backup plans include RDS and ElastiCache resources
  - Test backup retention is 7 days for both RDS and ElastiCache
  - Test backup failure alarms exist and are configured
  - Test backup vault uses AWS managed encryption (not KMS)
  - Test backup resources have cost allocation tags
  - **Tests run against CDK synthesized template** - no actual AWS resources
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 9.9_

### 12. Cost Optimization and Tagging Validation
- [ ] **Queue all Cost Validation tasks (12.0-12.4)**

**Note**: Validate CDK code for cost optimization. No AWS deployment yet.

- [x] 12.0 📋 ADR Checkpoint: Review storage, CDN, monitoring, and backup decisions (ADR Documentation)
  - Review all architectural decisions made in Tasks 8-11 (storage, CDN, monitoring, backup)
  - Identify decisions that need ADR documentation:
    - S3 lifecycle policies and retention strategy
    - CloudFront distribution configuration and price class selection
    - Monitoring and alerting thresholds
    - Backup retention and recovery objectives (RTO/RPO)
    - Cost allocation tagging strategy
  - For each significant decision, create or update ADR in `.kiro/specs/showcore-aws-migration-phase1/`
  - Follow ADR format: Status, Context, Decision, Alternatives, Rationale, Consequences
  - Reference requirements and cost optimization goals
  - **This checkpoint ensures all pre-deployment architectural decisions are documented**
  - _Requirements: 10.1, 10.7_

- [x] 12.1 Verify cost optimization measures in CDK code (Local Validation)
  - Run unit test to verify NO NAT Gateway is deployed using Template.resource_count_is("AWS::EC2::NatGateway", 0)
  - Run unit tests to verify Free Tier eligible instance types: db.t3.micro, cache.t3.micro
  - Run unit tests to verify single-AZ deployment for RDS (MultiAZ=false) and ElastiCache (NumCacheNodes=1)
  - Run unit tests to verify Gateway Endpoints are used for S3 and DynamoDB (FREE)
  - Run unit tests to verify minimal Interface Endpoints (only CloudWatch Logs, Monitoring, Systems Manager)
  - Run unit tests to verify S3 SSE-S3 encryption (not KMS) for all buckets
  - Run unit tests to verify CloudFront PriceClass_100 (North America and Europe only)
  - Run unit tests to verify short backup retention (7 days) for cost optimization
  - Document cost savings: ~$32/month NAT Gateway eliminated, ~$21-28/month Interface Endpoints added, net savings ~$4-11/month
  - **Run `pytest tests/unit/ -v` to validate all cost optimization measures**
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.9, 9.11, 9.13_

- [x] 12.2 Verify tagging in CDK code (Local Validation)
  - Run unit tests to verify all resources have standard tags in CDK templates
  - Verify tags: Project, Phase, Environment, ManagedBy, CostCenter
  - Document plan to activate cost allocation tags in AWS Billing console after deployment
  - Document plan to create tag policy to enforce tagging on new resources
  - **Run `pytest tests/unit/ -v` to validate tagging**
  - _Requirements: 9.6, 1.5_

- [x] 12.3 Write property test for resource tagging compliance (Post-Deployment Test)
  - Write test: all Phase 1 resources have required tags: Project, Phase, Environment, ManagedBy, CostCenter
  - Test will query all resources using boto3 resourcegroupstaggingapi.get_resources()
  - Test will verify each resource has all 5 required tags
  - **Property 2: Resource Tagging Compliance**
  - **This test runs AFTER deployment in Task 15** - validates actual AWS resources
  - **Validates: Requirements 9.6**

- [x] 12.4 Document cost estimates (Local Documentation)
  - Document expected Phase 1 costs by service:
    - VPC Endpoints: ~$21-28/month (Interface Endpoints only, Gateway Endpoints FREE)
    - RDS db.t3.micro: ~$0 during Free Tier, ~$15/month after
    - ElastiCache cache.t3.micro: ~$0 during Free Tier, ~$12/month after
    - S3 storage: ~$1-5/month
    - CloudFront: ~$1-5/month
    - Data transfer: ~$0-5/month
  - Total expected: ~$3-10/month during Free Tier, ~$49-60/month after
  - Document plan to check Cost Explorer after deployment
  - Document plan to set up Cost Anomaly Detection after deployment
  - _Requirements: 9.7, 9.8, 1.5_

### 13. 🚀 THE BIG DEPLOYMENT - Deploy All Infrastructure to AWS
- [ ] **Queue Deployment task (13.1)**

**Note**: This is where we actually deploy everything to AWS cloud!

- [x] 13.1 Deploy complete infrastructure to AWS (ACTUAL CLOUD DEPLOYMENT)
  - **Pre-deployment checks:**
    - Run all unit tests: `pytest tests/unit/ -v` (must pass 100%)
    - Run `cdk synth` to generate CloudFormation templates (must succeed)
    - Run `cdk diff` to preview all changes (review carefully)
    - Verify AWS credentials are configured: `aws sts get-caller-identity`
    - Verify CDK is bootstrapped: `cdk bootstrap aws://{account-id}/us-east-1`
  - **THE BIG DEPLOYMENT:**
    - Run `cdk deploy --all --require-approval never` to deploy ALL stacks at once
    - Monitor deployment progress in terminal (will take 15-30 minutes)
    - Monitor CloudFormation stacks in AWS Console
    - Wait for all stacks to reach CREATE_COMPLETE status
  - **Post-deployment verification:**
    - Verify all resources are created in AWS Console:
      - VPC with subnets, Internet Gateway, VPC Endpoints
      - Security groups for RDS, ElastiCache, VPC Endpoints
      - RDS PostgreSQL instance (db.t3.micro, single-AZ)
      - ElastiCache Redis cluster (cache.t3.micro, single-node)
      - S3 buckets (static-assets, backups, cloudtrail-logs)
      - CloudFront distribution
      - CloudWatch dashboard and alarms
      - SNS topics for alerts
      - AWS Backup vault and plans
    - Verify NO NAT Gateway exists (cost optimization)
    - Verify VPC Endpoints are healthy (Gateway and Interface)
    - Verify private subnets have NO internet access (no default route)
    - Review CloudWatch dashboards for initial metrics
    - Run `cdk diff` again to ensure no drift (should show no changes)
  - **🎉 INFRASTRUCTURE IS NOW LIVE IN AWS! 🎉**
  - Ask user if any issues or questions arise before proceeding to integration testing
  - _Requirements: All Phase 1 requirements_

### 14. Integration Testing (Post-Deployment - Test Actual AWS Resources)
- [ ] **Queue all Integration Testing tasks (14.1-14.5)**

**Note**: These tests run against ACTUAL AWS resources deployed in Task 13.

- [ ] 14.1 Test RDS connectivity from private subnet (Live AWS Test)
  - Deploy test EC2 instance in private subnet using AWS Console or CLI
  - Use Systems Manager Session Manager to connect (no SSH keys needed)
  - Install PostgreSQL client: `sudo yum install postgresql15 -y`
  - Test connection to RDS endpoint: `psql -h <rds-endpoint> -U postgres -d showcore sslmode=require`
  - Verify SSL/TLS connection is enforced (connection should fail without SSL)
  - Verify security group rules allow connection from test instance
  - Test basic SQL operations: `CREATE TABLE test (id INT); INSERT INTO test VALUES (1); SELECT * FROM test;`
  - Terminate test instance after validation
  - **Tests actual RDS instance in AWS**
  - _Requirements: 3.3, 3.6_

- [ ] 14.2 Test ElastiCache connectivity from private subnet (Live AWS Test)
  - Deploy test EC2 instance in private subnet using AWS Console or CLI
  - Use Systems Manager Session Manager to connect (no SSH keys needed)
  - Install Redis client: `sudo amazon-linux-extras install redis6 -y`
  - Test connection to ElastiCache endpoint: `redis-cli -h <elasticache-endpoint> -p 6379 --tls`
  - Verify TLS connection is enforced (connection should fail without TLS)
  - Verify security group rules allow connection from test instance
  - Test basic Redis operations: `SET test "hello"; GET test; DEL test;`
  - Terminate test instance after validation
  - **Tests actual ElastiCache cluster in AWS**
  - _Requirements: 4.3, 4.5_

- [ ] 14.3 Test VPC Endpoint functionality (Live AWS Test)
  - From private subnet instance, test S3 access via Gateway Endpoint: `aws s3 ls s3://showcore-backups-{account-id}`
  - From private subnet instance, test CloudWatch Logs access via Interface Endpoint: `aws logs describe-log-groups`
  - From private subnet instance, test Systems Manager access via Interface Endpoint: `aws ssm describe-instance-information`
  - Verify NO internet access from private subnet: `curl http://www.google.com` (should fail/timeout)
  - Verify AWS service access works via VPC Endpoints (all aws cli commands should succeed)
  - Verify private DNS is enabled for Interface Endpoints (service endpoints resolve to private IPs)
  - **Tests actual VPC Endpoints in AWS**
  - _Requirements: 2.5, 2.6, 2.7, 2.8, 2.9, 2.4_

- [ ] 14.4 Test backup and restore procedures (Live AWS Test)
  - Trigger manual RDS snapshot: `aws rds create-db-snapshot --db-instance-identifier showcore-db --db-snapshot-identifier showcore-db-test-snapshot`
  - Wait for snapshot to complete: `aws rds describe-db-snapshots --db-snapshot-identifier showcore-db-test-snapshot`
  - Restore snapshot to new RDS instance: `aws rds restore-db-instance-from-db-snapshot --db-instance-identifier showcore-db-restored --db-snapshot-identifier showcore-db-test-snapshot`
  - Verify data integrity by connecting and querying restored instance
  - Terminate restored instance after validation
  - Trigger manual ElastiCache snapshot: `aws elasticache create-snapshot --cache-cluster-id showcore-redis --snapshot-name showcore-redis-test-snapshot`
  - Wait for snapshot to complete
  - Restore snapshot to new ElastiCache cluster
  - Verify data by connecting to restored cluster
  - Terminate restored cluster after validation
  - **Tests actual backup/restore in AWS**
  - _Requirements: 8.2, 8.3, 8.4, 8.5_

- [ ] 14.5 Test CloudFront and S3 integration (Live AWS Test)
  - Upload test file to S3 static assets bucket: `aws s3 cp test.html s3://showcore-static-assets-{account-id}/`
  - Verify file is accessible via CloudFront URL: `curl https://<cloudfront-domain>/test.html`
  - Verify HTTPS redirect works: `curl -I http://<cloudfront-domain>/test.html` (should return 301/302)
  - Verify file is NOT accessible via direct S3 URL: `curl https://showcore-static-assets-{account-id}.s3.amazonaws.com/test.html` (should return 403)
  - Test cache behavior: request file twice, verify second request is served from cache (X-Cache: Hit from cloudfront)
  - Verify compression is enabled: check Content-Encoding header (should be gzip or br)
  - Delete test file after validation
  - **Tests actual CloudFront and S3 in AWS**
  - _Requirements: 5.4, 5.5, 5.6_

### 15. Compliance and Security Validation (Post-Deployment)
- [ ] **Queue all Compliance Validation tasks (15.1-15.5)**

**Note**: Validate actual AWS resources for compliance and security.

- [ ] 15.1 Run AWS Config compliance checks (Live AWS Validation)
  - Open AWS Config console and review compliance dashboard
  - Verify all Config rules are passing: rds-storage-encrypted, s3-bucket-public-read-prohibited
  - Review non-compliant resources (if any) in AWS Config console
  - Remediate any non-compliant resources immediately
  - Document compliance status in compliance report
  - **Validates actual AWS resources**
  - _Requirements: 6.3_

- [ ] 15.2 Run security validation tests (Live AWS Validation)
  - Run property test for security group least privilege: `pytest tests/property/test_security_groups.py -v`
  - Test queries actual security groups using boto3 and verifies no 0.0.0.0/0 on ports 22, 5432, 6379
  - Verify encryption at rest is enabled for all data resources (check RDS, ElastiCache, S3 in console)
  - Verify encryption in transit is enforced (SSL/TLS for RDS, TLS for ElastiCache, HTTPS for CloudFront)
  - Verify CloudTrail is logging all API calls to S3 bucket
  - Verify log file validation is enabled for CloudTrail
  - Review security group rules in console for least privilege compliance
  - **Validates actual AWS resources**
  - _Requirements: 6.2, 6.5, 3.5, 3.6, 4.4, 4.5, 5.3, 5.6_

- [ ] 15.3 Review CloudTrail logs for deployment activities (Live AWS Validation)
  - Open CloudTrail console and review Event history
  - Review CloudTrail logs for all infrastructure deployment API calls (CreateStack, UpdateStack, CreateVpc, etc.)
  - Verify no unauthorized access attempts or suspicious API calls
  - Verify all API calls are from showcore-app IAM user or CDK execution role
  - Document any security findings or anomalies
  - **Validates actual CloudTrail logs in AWS**
  - _Requirements: 6.5, 6.6, 1.4_

- [ ] 15.4 Run property test for resource tagging compliance (Live AWS Validation)
  - Run property test: `pytest tests/property/test_tagging.py -v`
  - Test queries all Phase 1 resources using boto3 resourcegroupstaggingapi.get_resources()
  - Test verifies each resource has all 5 required tags: Project, Phase, Environment, ManagedBy, CostCenter
  - **Property 2: Resource Tagging Compliance**
  - **Validates actual AWS resources**
  - **Validates: Requirements 9.6**

- [ ] 15.5 Enable cost allocation tags in AWS Billing (Manual AWS Console)
  - Open AWS Billing console → Cost Allocation Tags
  - Activate cost allocation tags: Project, Phase, Environment, ManagedBy, CostCenter
  - Wait 24 hours for tags to appear in Cost Explorer
  - Create tag policy to enforce tagging on new resources (optional)
  - **Manual configuration in AWS Console**
  - _Requirements: 9.6, 1.5_

### 16. Documentation and Handoff (Post-Deployment)
- [ ] **Queue all Documentation tasks (16.0-16.4)**

**Note**: Create operational documentation based on deployed infrastructure.

- [ ] 16.0 📋 ADR Checkpoint: Document post-deployment learnings and decisions (ADR Documentation)
  - Review deployment experience and any decisions made during deployment (Task 13)
  - Review integration testing results and any architectural adjustments (Tasks 14-15)
  - Identify decisions that need ADR documentation:
    - Deployment strategy and stack dependencies
    - Integration testing approach and findings
    - Security validation results and any remediation
    - Performance tuning decisions based on actual metrics
    - Operational procedures and runbook requirements
  - For each significant decision or learning, create or update ADR in `.kiro/specs/showcore-aws-migration-phase1/`
  - Follow ADR format: Status, Context, Decision, Alternatives, Rationale, Consequences
  - Document lessons learned for Phase 2 planning
  - **This checkpoint captures deployment and operational learnings**
  - _Requirements: 10.1, 10.7_

- [ ] 16.1 Create runbook for RDS backup and restore (Documentation)
  - Document manual snapshot procedures: `aws rds create-db-snapshot --db-instance-identifier showcore-db --db-snapshot-identifier showcore-db-manual-snapshot-YYYYMMDD`
  - Document point-in-time recovery procedures: `aws rds restore-db-instance-to-point-in-time --source-db-instance-identifier showcore-db --target-db-instance-identifier showcore-db-restored --restore-time YYYY-MM-DDTHH:MM:SSZ`
  - Document restore from snapshot procedures: `aws rds restore-db-instance-from-db-snapshot --db-instance-identifier showcore-db-restored --db-snapshot-identifier showcore-db-snapshot-id`
  - Document verification steps: connect to restored instance, verify data integrity
  - Store in `.kiro/specs/showcore-aws-migration-phase1/runbooks/rds-backup-restore.md`
  - **Creates operational documentation**
  - _Requirements: 8.2, 8.4_

- [ ] 16.2 Create runbook for ElastiCache backup and restore (Documentation)
  - Document manual snapshot procedures: `aws elasticache create-snapshot --cache-cluster-id showcore-redis --snapshot-name showcore-redis-manual-snapshot-YYYYMMDD`
  - Document restore from snapshot procedures: `aws elasticache create-cache-cluster --cache-cluster-id showcore-redis-restored --snapshot-name showcore-redis-snapshot-name`
  - Document verification steps: connect to restored cluster, verify data
  - Store in `.kiro/specs/showcore-aws-migration-phase1/runbooks/elasticache-backup-restore.md`
  - **Creates operational documentation**
  - _Requirements: 8.3, 8.5_

- [ ] 16.3 Create runbook for VPC Endpoint troubleshooting (Documentation)
  - Document VPC Endpoint health checks: verify endpoint status, check security groups, verify private DNS
  - Document connectivity troubleshooting steps: test from private subnet, check route tables, verify DNS resolution
  - Document how to add new Interface Endpoints: create endpoint, attach security group, enable private DNS
  - Document cost implications: Gateway Endpoints are FREE, Interface Endpoints cost ~$7/month each
  - Store in `.kiro/specs/showcore-aws-migration-phase1/runbooks/vpc-endpoint-troubleshooting.md`
  - **Creates operational documentation**
  - _Requirements: 2.5, 2.6, 2.7, 2.8, 2.9, 9.13_

- [ ] 16.4 Update README with deployment instructions (Documentation)
  - Document CDK deployment commands: `cdk bootstrap`, `cdk synth`, `cdk diff`, `cdk deploy --all`
  - Document environment configuration: set AWS_ACCOUNT_ID, AWS_REGION in cdk.json context
  - Document testing procedures: `pytest tests/unit/`, `pytest tests/property/`, `pytest tests/integration/`
  - Document cost monitoring procedures: review Cost Explorer, check billing alarms, activate cost allocation tags
  - Document VPC Endpoints architecture and cost savings (~$4-11/month vs NAT Gateway)
  - Document management trade-offs: manual patching, no internet access from private subnets
  - Store in `infrastructure/README.md`
  - **Creates deployment documentation**
  - _Requirements: 10.7, 9.13_

### 17. Final Validation and Sign-off (Post-Deployment)
- [ ] **Queue all Final Validation tasks (17.1-17.3)**

**Note**: Final checks on actual AWS infrastructure before Phase 1 completion.

- [ ] 17.1 Run complete test suite (All Tests)
  - Run all unit tests: `pytest tests/unit/ -v` (validates CDK templates)
  - Run all property tests: `pytest tests/property/ -v` (validates actual AWS resources)
  - Run all integration tests: `pytest tests/integration/ -v` (validates actual AWS connectivity)
  - Verify 100% test pass rate (all tests must pass)
  - Generate test coverage report: `pytest tests/ --cov=lib --cov-report=html`
  - Review coverage report and ensure adequate coverage (target: 80%+)
  - **Validates both CDK code and actual AWS resources**
  - _Requirements: All Phase 1 requirements_

- [ ] 17.2 Review final cost estimates and optimization (Live AWS Cost Review)
  - Open AWS Cost Explorer and review actual Phase 1 costs by service
  - Verify costs match estimates: ~$3-10/month during Free Tier, ~$49-60/month after
  - Document detailed cost breakdown from Cost Explorer:
    - VPC Endpoints: ~$21-28/month (Interface Endpoints only, Gateway Endpoints are FREE)
    - RDS db.t3.micro: ~$0 during Free Tier, ~$15/month after
    - ElastiCache cache.t3.micro: ~$0 during Free Tier, ~$12/month after
    - S3 storage: ~$1-5/month
    - CloudFront: ~$1-5/month
    - Data transfer: ~$0-5/month
  - Verify all cost optimization measures are in place in AWS Console:
    - NO NAT Gateway exists (check VPC console)
    - Free Tier instances deployed (check RDS and ElastiCache consoles)
    - Single-AZ deployment (check RDS and ElastiCache consoles)
    - Gateway Endpoints for S3/DynamoDB (check VPC Endpoints console)
    - Minimal Interface Endpoints (check VPC Endpoints console)
    - SSE-S3 encryption (check S3 bucket properties)
    - CloudFront PriceClass_100 (check CloudFront distribution settings)
    - Short backup retention (check AWS Backup console)
  - Document net savings vs NAT Gateway architecture: ~$4-11/month
  - Set up Cost Anomaly Detection for unexpected cost increases
  - **Reviews actual AWS costs**
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.7, 9.8, 9.9, 9.11, 9.13_

- [ ] 17.3 Phase 1 completion sign-off (Final Review)
  - Review all requirements are met (check requirements.md against actual AWS resources)
  - Review all tests are passing (100% pass rate for unit, property, and integration tests)
  - Review all documentation is complete (README, runbooks, ADRs)
  - Review security configurations are correct in AWS Console (encryption, security groups, CloudTrail, AWS Config)
  - Review cost optimization measures are in place in AWS Console (no NAT Gateway, Free Tier instances, minimal endpoints)
  - Review VPC Endpoints architecture is working (Gateway and Interface Endpoints healthy)
  - Review CloudWatch dashboards show healthy metrics for all resources
  - Obtain stakeholder approval for Phase 1 completion
  - Document lessons learned and recommendations for Phase 2
  - **🎉 PHASE 1 COMPLETE! Infrastructure is live and validated! 🎉**
  - _Requirements: All Phase 1 requirements_

## Notes

### Workflow Summary

**Phase 1: Write CDK Code (Tasks 1-12)**
- All tasks write Python CDK code locally in `infrastructure/lib/stacks/`
- Unit tests validate CDK templates using `cdk synth` output
- NO actual AWS resources are created during these tasks
- Code is version controlled in Git
- **ADR Checkpoints at Tasks 7.2 and 12.0** ensure architectural decisions are documented

**Phase 2: THE BIG DEPLOYMENT (Task 13)**
- Run `cdk deploy --all` to deploy everything to AWS at once
- This is when actual AWS resources are created in the cloud
- Takes 15-30 minutes for complete deployment
- All stacks deployed together with proper dependencies

**Phase 3: Post-Deployment Validation (Tasks 14-17)**
- Integration tests validate actual AWS resources
- Property tests validate actual AWS resources
- Compliance checks validate actual AWS resources
- Documentation based on deployed infrastructure
- **ADR Checkpoint at Task 16.0** captures deployment learnings and operational decisions

### Testing Strategy

**Unit Tests (Local - Tasks 2.4, 3.5, 4.6, 5.5, 6.5, 8.4, 10.8, 11.5, 12.1)**
- Test CDK code generates correct CloudFormation templates
- Run against `cdk synth` output (no AWS resources needed)
- Fast execution (< 1 second per test)
- Run before deployment to catch errors early

**Property Tests (Post-Deployment - Tasks 4.5, 12.3, 15.4)**
- Test universal correctness properties on actual AWS resources
- Run against live AWS infrastructure after deployment
- Examples: security group least privilege, resource tagging compliance
- Use boto3 to query actual AWS resources

**Integration Tests (Post-Deployment - Tasks 5.6, 9.4, 14.1-14.5)**
- Test connectivity and functionality between actual AWS components
- Run against live AWS infrastructure after deployment
- Examples: RDS connectivity, ElastiCache connectivity, VPC Endpoints, CloudFront
- Deploy temporary test resources, validate, then clean up

### Key Points

- Tasks marked with `*` are optional testing tasks that can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation at key milestones (Tasks 7.1, 13.1, 17.3)
- **ADR Checkpoints (Tasks 7.2, 12.0, 16.0)** ensure architectural decisions are documented at critical phases:
  - Task 7.2: After core infrastructure design (network, security, database, cache)
  - Task 12.0: Before deployment (storage, CDN, monitoring, backup)
  - Task 16.0: After deployment (operational learnings and adjustments)
- All infrastructure is defined as code using AWS CDK with Python following iac-standards.md
- Cost optimization is prioritized throughout:
  - NO NAT Gateway (saves ~$32/month)
  - VPC Endpoints architecture (Gateway Endpoints FREE, Interface Endpoints ~$7/month each)
  - Free Tier eligible instances (db.t3.micro, cache.t3.micro)
  - Single-AZ deployment for RDS and ElastiCache
  - AWS managed encryption keys (SSE-S3, not KMS)
  - CloudFront PriceClass_100 (lowest cost regions)
  - Short backup retention (7 days)
  - Net savings: ~$4-11/month vs NAT Gateway architecture
- VPC Endpoints architecture provides secure AWS service access without internet connectivity:
  - Gateway Endpoints (S3, DynamoDB) are FREE
  - Interface Endpoints (CloudWatch Logs, CloudWatch Monitoring, Systems Manager) cost ~$7/month each
  - Private subnets have NO internet access (no NAT Gateway route)
  - Better security: no internet access from data tier
  - Management trade-offs: manual patching, limited to AWS services accessible via VPC Endpoints
- All resources follow naming convention: showcore-{component}-{environment}-{resource-type}
- All resources have standard tags: Project, Phase, Environment, ManagedBy, CostCenter
- Testing framework uses pytest with aws-cdk.assertions for template validation and boto3 for integration testing
- Estimated timeline: 2-3 weeks for complete deployment and validation
