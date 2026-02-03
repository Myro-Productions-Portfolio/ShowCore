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

### 1. AWS Account Foundation Setup

- [x] 1.1 Configure AWS Organizations structure
  - Create organizational units for ShowCore project
  - Document organization hierarchy
  - _Requirements: 1.1_

- [x] 1.2 Set up billing alerts and cost monitoring
  - Create CloudWatch billing alarms for $50 and $100 thresholds
  - Configure SNS topic for billing notifications
  - Enable Cost Explorer with cost allocation tags
  - _Requirements: 1.2, 1.3, 1.5_

- [x] 1.3 Enable AWS CloudTrail for audit logging
  - Create CloudTrail trail for all regions
  - Configure S3 bucket for CloudTrail logs
  - Enable log file validation
  - _Requirements: 1.4_

### 2. Infrastructure as Code Setup

- [ ] 2.1 Initialize AWS CDK project structure
  - Create CDK app with Python following iac-standards.md project structure
  - Set up directory structure: lib/stacks/, lib/constructs/, tests/unit/, tests/property/, tests/integration/
  - Configure cdk.json with project settings (account, region, environment context)
  - Create requirements.txt with CDK dependencies (aws-cdk-lib, constructs, boto3)
  - Create requirements-dev.txt with testing dependencies (pytest, hypothesis, boto3)
  - Create README.md with deployment instructions
  - _Requirements: 10.1, 10.7_

- [ ] 2.2 Create base CDK stack with standard tagging
  - Implement ShowCoreBaseStack class with standard tags (Project, Phase, Environment, ManagedBy, CostCenter)
  - Use Tags.of(self).add() API for applying tags to all resources in stack
  - Create tagging utility for consistent resource tagging across stacks
  - Follow naming convention: showcore-{component}-{environment}-{resource-type}
  - _Requirements: 9.6_

- [ ] 2.3 Set up CDK testing framework
  - Configure pytest for CDK stack testing
  - Set up aws-cdk.assertions for template validation
  - Create test utilities for AWS resource validation using boto3
  - Configure test structure: tests/unit/, tests/property/, tests/integration/
  - _Requirements: 10.3_

- [ ]* 2.4 Write unit tests for base stack configuration
  - Test standard tags are applied to all resources using Template.from_stack()
  - Test stack naming conventions follow iac-standards.md
  - Test resource naming follows showcore-{component}-{environment}-{resource-type} format
  - _Requirements: 9.6_

### 3. Network Infrastructure (VPC Endpoints Architecture)

- [ ] 3.1 Create VPC with multi-AZ subnets
  - Create VPC with 10.0.0.0/16 CIDR block (65,536 IPs) using ec2.Vpc L2 construct
  - Create 2 public subnets (10.0.0.0/24, 10.0.1.0/24) in us-east-1a and us-east-1b
  - Create 2 private subnets (10.0.2.0/24, 10.0.3.0/24) in us-east-1a and us-east-1b
  - Create Internet Gateway for public subnets
  - DO NOT create NAT Gateway (cost optimization - saves ~$32/month)
  - Use construct ID "VPC" for VPC resource
  - Apply standard tags to all network resources
  - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [ ] 3.2 Configure VPC Gateway Endpoints (FREE)
  - Create S3 Gateway Endpoint using ec2.GatewayVpcEndpoint construct
  - Create DynamoDB Gateway Endpoint using ec2.GatewayVpcEndpoint construct
  - Attach Gateway Endpoints to private subnet route tables automatically
  - Verify Gateway Endpoints are FREE (no charges)
  - Use construct IDs: "S3GatewayEndpoint", "DynamoDBGatewayEndpoint"
  - _Requirements: 2.5, 2.6, 9.3_

- [ ] 3.3 Configure VPC Interface Endpoints (~$7/month each)
  - Create security group for Interface Endpoints (allow HTTPS 443 from VPC CIDR)
  - Create CloudWatch Logs Interface Endpoint using ec2.InterfaceVpcEndpoint
  - Create CloudWatch Monitoring Interface Endpoint using ec2.InterfaceVpcEndpoint
  - Create Systems Manager Interface Endpoint using ec2.InterfaceVpcEndpoint
  - Deploy Interface Endpoints in both private subnets (us-east-1a, us-east-1b)
  - Enable private DNS for all Interface Endpoints
  - Use construct IDs: "VpcEndpointSecurityGroup", "CloudWatchLogsEndpoint", "CloudWatchMonitoringEndpoint", "SystemsManagerEndpoint"
  - _Requirements: 2.7, 2.8, 2.9, 2.12, 9.4_

- [ ] 3.4 Configure route tables for VPC Endpoints
  - Configure public subnet route tables (0.0.0.0/0 → Internet Gateway)
  - Configure private subnet route tables (NO default route, only VPC Endpoint routes)
  - Verify Gateway Endpoints automatically add routes to private route tables
  - Verify private subnets have NO internet access (no NAT Gateway route)
  - Export VPC ID and subnet IDs as CloudFormation outputs for cross-stack references
  - _Requirements: 2.11, 2.4_

- [ ]* 3.5 Write unit tests for network infrastructure
  - Test VPC exists with correct CIDR (10.0.0.0/16) using Template.has_resource_properties()
  - Test subnets exist in correct AZs with correct CIDR blocks
  - Test NO NAT Gateway exists (cost optimization) using Template.resource_count_is("AWS::EC2::NatGateway", 0)
  - Test Gateway Endpoints exist for S3 and DynamoDB
  - Test Interface Endpoints exist with correct security groups
  - Test route tables have correct routes (public: IGW, private: no default route)
  - Test Internet Gateway exists for public subnets
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9_

### 4. Security Infrastructure

- [ ] 4.1 Create security groups for data tier
  - Create RDS security group using ec2.SecurityGroup (allow PostgreSQL 5432 from application tier)
  - Create ElastiCache security group using ec2.SecurityGroup (allow Redis 6379 from application tier)
  - Create VPC Endpoint security group using ec2.SecurityGroup (allow HTTPS 443 from VPC CIDR 10.0.0.0/16)
  - Follow least privilege principle (no 0.0.0.0/0 on sensitive ports 22, 5432, 6379)
  - Use descriptive construct IDs: "RdsSecurityGroup", "ElastiCacheSecurityGroup", "VpcEndpointSecurityGroup"
  - Add description to each security group rule for clarity
  - _Requirements: 3.3, 4.3, 6.2, 2.12_

- [ ] 4.2 Enable AWS Config for compliance monitoring
  - Create AWS Config configuration recorder using config.CfnConfigurationRecorder
  - Configure Config rules: rds-storage-encrypted, s3-bucket-public-read-prohibited
  - Set up Config delivery channel to S3 bucket
  - Enable Config for continuous compliance monitoring
  - _Requirements: 6.3_

- [ ] 4.3 Configure AWS Systems Manager Session Manager
  - Enable Session Manager for secure instance access without SSH keys
  - Configure Session Manager logging to CloudWatch Logs via Interface Endpoint
  - Create IAM role for Session Manager with required permissions
  - Verify no SSH keys required for instance access
  - _Requirements: 6.8, 2.9_

- [ ] 4.4 Create CloudTrail S3 bucket and configure logging
  - Create S3 bucket for CloudTrail logs with versioning enabled
  - Enable encryption at rest using SSE-S3 (AWS managed keys, not KMS for cost optimization)
  - Configure bucket policy for CloudTrail write access
  - Enable log file validation for integrity checking
  - Set lifecycle policy to delete logs after 90 days (cost optimization)
  - _Requirements: 6.5, 1.4, 9.9_

- [ ]* 4.5 Write property test for security group least privilege
  - Test no security group has 0.0.0.0/0 on ports 22, 5432, 6379
  - Query all security groups using boto3 ec2.describe_security_groups()
  - Verify no overly permissive ingress rules on sensitive ports
  - **Property 1: Security Group Least Privilege**
  - **Validates: Requirements 6.2**

- [ ]* 4.6 Write unit tests for security infrastructure
  - Test security groups have correct ingress rules using Template.has_resource_properties()
  - Test AWS Config is enabled and recording
  - Test CloudTrail is enabled with log file validation
  - Test Systems Manager Session Manager is configured
  - Test CloudTrail S3 bucket has SSE-S3 encryption (not KMS)
  - _Requirements: 6.2, 6.3, 6.5, 6.8, 9.9_

### 5. Database Infrastructure (RDS PostgreSQL)

- [ ] 5.1 Create RDS subnet group and parameter group
  - Create RDS subnet group in private subnets using rds.SubnetGroup
  - Create RDS parameter group for PostgreSQL 16 using rds.ParameterGroup
  - Set rds.force_ssl=1 in parameter group to enforce SSL/TLS connections
  - Use construct IDs: "RdsSubnetGroup", "RdsParameterGroup"
  - _Requirements: 3.1, 3.6_

- [ ] 5.2 Deploy RDS PostgreSQL instance
  - Create db.t3.micro instance (Free Tier eligible - 750 hours/month for 12 months) using rds.DatabaseInstance
  - Deploy in single AZ (us-east-1a) for cost optimization (Multi-AZ doubles cost)
  - Allocate 20 GB gp3 storage (Free Tier limit)
  - Enable encryption at rest using AWS managed keys (not KMS for cost optimization)
  - Attach RDS security group from task 4.1
  - Set database name to "showcore"
  - Use construct ID: "Database"
  - _Requirements: 3.1, 3.2, 3.5, 3.9, 9.1, 9.5_

- [ ] 5.3 Configure RDS automated backups
  - Enable automated daily backups with 7-day retention (short retention for cost optimization)
  - Set backup window to 03:00-04:00 UTC (off-peak hours)
  - Enable point-in-time recovery (5-minute granularity)
  - Set maintenance window to Sunday 04:00-05:00 UTC
  - _Requirements: 3.4_

- [ ] 5.4 Configure RDS monitoring and alarms
  - Create CloudWatch alarm for CPU utilization > 80% for 5 minutes using cloudwatch.Alarm
  - Create CloudWatch alarm for storage utilization > 85%
  - Configure SNS notifications for alarms (will be created in task 10.1)
  - Use alarm names: "showcore-rds-cpu-high", "showcore-rds-storage-high"
  - _Requirements: 3.7, 3.8, 7.3, 7.5_

- [ ]* 5.5 Write unit tests for RDS configuration
  - Test RDS instance is db.t3.micro (Free Tier) using Template.has_resource_properties()
  - Test RDS is in single AZ (cost optimization) - MultiAZ should be false
  - Test encryption at rest is enabled with AWS managed keys
  - Test SSL/TLS is required (rds.force_ssl=1 in parameter group)
  - Test automated backups are enabled with 7-day retention
  - Test CloudWatch alarms exist for CPU and storage
  - Test allocated storage is 20 GB (Free Tier limit)
  - _Requirements: 3.1, 3.2, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9, 9.1, 9.5_

- [ ]* 5.6 Write integration test for RDS connectivity
  - Deploy test EC2 instance in private subnet using ec2.Instance
  - Install PostgreSQL client (psql)
  - Test connection to RDS endpoint using psql with SSL mode=require
  - Verify SSL/TLS connection is enforced
  - Verify security group rules allow connection
  - Terminate test instance after validation
  - _Requirements: 3.3, 3.6_

### 6. Cache Infrastructure (ElastiCache Redis)

- [ ] 6.1 Create ElastiCache subnet group and parameter group
  - Create ElastiCache subnet group in private subnets using elasticache.CfnSubnetGroup
  - Create ElastiCache parameter group for Redis 7 using elasticache.CfnParameterGroup
  - Configure parameter group to enforce TLS connections (transit-encryption-enabled=yes)
  - Use construct IDs: "ElastiCacheSubnetGroup", "ElastiCacheParameterGroup"
  - _Requirements: 4.1, 4.5_

- [ ] 6.2 Deploy ElastiCache Redis cluster
  - Create cache.t3.micro node (Free Tier eligible - 750 hours/month for 12 months) using elasticache.CfnCacheCluster
  - Deploy single node in us-east-1a for cost optimization (no replicas)
  - Enable encryption at rest using AWS managed encryption (not KMS for cost optimization)
  - Enable encryption in transit (TLS required)
  - Attach ElastiCache security group from task 4.1
  - Set cluster ID to "showcore-redis"
  - Use construct ID: "RedisCluster"
  - _Requirements: 4.1, 4.2, 4.4, 4.5, 9.1, 9.5_

- [ ] 6.3 Configure ElastiCache automated backups
  - Enable daily automated backups with 7-day retention (short retention for cost optimization)
  - Set backup window to 03:00-04:00 UTC (off-peak hours)
  - Configure snapshot retention limit to 7
  - _Requirements: 4.8_

- [ ] 6.4 Configure ElastiCache monitoring and alarms
  - Create CloudWatch alarm for CPU utilization > 75% for 5 minutes using cloudwatch.Alarm
  - Create CloudWatch alarm for memory utilization > 80%
  - Configure SNS notifications for alarms (will be created in task 10.1)
  - Use alarm names: "showcore-elasticache-cpu-high", "showcore-elasticache-memory-high"
  - _Requirements: 4.6, 4.7, 7.3, 7.5_

- [ ]* 6.5 Write unit tests for ElastiCache configuration
  - Test ElastiCache is cache.t3.micro (Free Tier) using Template.has_resource_properties()
  - Test single node deployment (cost optimization) - NumCacheNodes should be 1
  - Test encryption at rest and in transit are enabled
  - Test automated backups are enabled with 7-day retention
  - Test CloudWatch alarms exist for CPU and memory
  - Test TLS is enforced in parameter group
  - _Requirements: 4.1, 4.2, 4.4, 4.5, 4.6, 4.7, 4.8, 9.1, 9.5_

### 7. Checkpoint - Core Infrastructure Validation

- [ ] 7.1 Validate core infrastructure deployment
  - Run all unit tests for network, security, database, and cache stacks
  - Verify all resources are deployed correctly in AWS Console
  - Verify cost optimization measures: no NAT Gateway, Free Tier instances (db.t3.micro, cache.t3.micro)
  - Verify VPC Endpoints are configured: Gateway Endpoints (S3, DynamoDB), Interface Endpoints (CloudWatch, SSM)
  - Review CloudWatch dashboards for initial metrics (will be created in task 10.2)
  - Verify private subnets have NO internet access (no default route)
  - Run `cdk diff` to ensure no unexpected changes
  - Ask user if any issues or questions arise before proceeding
  - _Requirements: All Phase 1 requirements_

### 8. Storage Infrastructure (S3 Buckets)

- [ ] 8.1 Create S3 bucket for static assets
  - Create bucket with versioning enabled using s3.Bucket
  - Enable encryption at rest using SSE-S3 (AWS managed keys, not KMS for cost optimization)
  - Configure bucket policy to prevent public access (CloudFront only via OAC)
  - Set bucket name: showcore-static-assets-{account-id}
  - Configure lifecycle policy to delete old versions after 90 days
  - Use construct ID: "StaticAssetsBucket"
  - _Requirements: 5.1, 5.3, 5.4, 9.9_

- [ ] 8.2 Create S3 bucket for backups
  - Create bucket with versioning enabled using s3.Bucket
  - Enable encryption at rest using SSE-S3 (AWS managed keys, not KMS for cost optimization)
  - Configure bucket policy for private access only (IAM only)
  - Set bucket name: showcore-backups-{account-id}
  - Use construct ID: "BackupsBucket"
  - _Requirements: 5.2, 5.3, 9.9_

- [ ] 8.3 Configure S3 lifecycle policies
  - Configure lifecycle policy to transition backups to Glacier Flexible Retrieval after 30 days
  - Configure lifecycle policy to delete old backups after 90 days (short retention for cost optimization)
  - Configure lifecycle policy to delete old versions after 90 days
  - Apply lifecycle policies to backups bucket only
  - _Requirements: 5.9, 9.10_

- [ ]* 8.4 Write unit tests for S3 configuration
  - Test S3 buckets exist with versioning enabled using Template.has_resource_properties()
  - Test encryption at rest is enabled using SSE-S3 (not KMS)
  - Test bucket policies prevent public access
  - Test lifecycle policies are configured for backups bucket
  - Test bucket names follow naming convention: showcore-{component}-{account-id}
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.9, 9.9, 9.10_

### 9. Content Delivery Network (CloudFront)

- [ ] 9.1 Create CloudFront distribution
  - Create distribution with S3 static assets bucket as origin using cloudfront.Distribution
  - Configure Origin Access Control (OAC) for secure S3 access (not legacy OAI)
  - Set PriceClass_100 (North America and Europe only) for cost optimization
  - Use construct ID: "CloudFrontDistribution"
  - _Requirements: 5.5, 5.7, 9.11_

- [ ] 9.2 Configure CloudFront caching and security
  - Configure HTTPS-only viewer protocol policy (redirect HTTP to HTTPS)
  - Set default TTL to 86400 seconds (24 hours)
  - Set max TTL to 31536000 seconds (1 year)
  - Enable automatic compression (gzip, brotli)
  - Use TLS 1.2 minimum for viewer connections
  - _Requirements: 5.6_

- [ ] 9.3 Update S3 bucket policy for CloudFront access
  - Update static assets bucket policy to allow CloudFront OAC access
  - Verify direct S3 access is blocked (no public access)
  - Use s3.Bucket.add_to_resource_policy() to grant CloudFront access
  - _Requirements: 5.4_

- [ ]* 9.4 Write integration test for CloudFront and S3
  - Upload test file to S3 static assets bucket using boto3
  - Verify file is accessible via CloudFront URL (HTTPS)
  - Verify HTTPS redirect works (HTTP → HTTPS)
  - Verify file is NOT accessible via direct S3 URL (should return 403)
  - Verify compression is enabled (check Content-Encoding header)
  - Delete test file after validation
  - _Requirements: 5.4, 5.5, 5.6_

### 10. Monitoring and Alerting

- [ ] 10.1 Create SNS topics for alerts
  - Create critical alerts topic with email subscriptions using sns.Topic
  - Create warning alerts topic with email subscriptions using sns.Topic
  - Create billing alerts topic with email subscriptions using sns.Topic
  - Use topic names: "showcore-critical-alerts", "showcore-warning-alerts", "showcore-billing-alerts"
  - Add email subscriptions using sns.Subscription
  - _Requirements: 7.2_

- [ ] 10.2 Create CloudWatch dashboard for Phase 1 infrastructure
  - Create dashboard using cloudwatch.Dashboard with name "ShowCore-Phase1-Dashboard"
  - Add RDS metrics: CPUUtilization, DatabaseConnections, ReadLatency, WriteLatency, FreeStorageSpace
  - Add ElastiCache metrics: CPUUtilization, DatabaseMemoryUsagePercentage, Evictions, CacheHits, CacheMisses
  - Add S3 metrics: BucketSizeBytes, NumberOfObjects, 4xxErrors, 5xxErrors
  - Add CloudFront metrics: Requests, BytesDownloaded, 4xxErrorRate, 5xxErrorRate, CacheHitRate
  - Add VPC Endpoint metrics: PacketsReceived, PacketsSent, BytesReceived, BytesSent
  - Use cloudwatch.GraphWidget for metric visualization
  - _Requirements: 7.1_

- [ ] 10.3 Configure CloudWatch alarms for RDS
  - Create alarm: CPU utilization > 80% for 5 minutes → critical alert using cloudwatch.Alarm
  - Create alarm: Storage utilization > 85% → warning alert
  - Create alarm: Connection count > 80 → warning alert
  - Create alarm: Read/write latency > 100ms → warning alert
  - Use alarm names: "showcore-rds-cpu-high", "showcore-rds-storage-high", "showcore-rds-connections-high", "showcore-rds-latency-high"
  - Configure SNS actions to appropriate topics
  - _Requirements: 3.7, 3.8, 7.3, 7.5_

- [ ] 10.4 Configure CloudWatch alarms for ElastiCache
  - Create alarm: CPU utilization > 75% for 5 minutes → critical alert using cloudwatch.Alarm
  - Create alarm: Memory utilization > 80% → critical alert
  - Create alarm: Evictions > 0 → warning alert
  - Create alarm: Cache hit rate < 80% → warning alert
  - Use alarm names: "showcore-elasticache-cpu-high", "showcore-elasticache-memory-high", "showcore-elasticache-evictions", "showcore-elasticache-cache-hit-low"
  - Configure SNS actions to appropriate topics
  - _Requirements: 4.6, 4.7, 7.3, 7.5_

- [ ] 10.5 Configure CloudWatch alarms for S3
  - Create alarm: Bucket size > 10GB → warning alert using cloudwatch.Alarm
  - Create alarm: 4xx error rate > 5% → warning alert
  - Create alarm: 5xx error rate > 1% → critical alert
  - Use alarm names: "showcore-s3-size-high", "showcore-s3-4xx-errors", "showcore-s3-5xx-errors"
  - Configure SNS actions to appropriate topics
  - _Requirements: 5.8, 7.3_

- [ ] 10.6 Configure CloudWatch alarms for billing
  - Create alarm: Estimated charges > $50 → warning alert using cloudwatch.Alarm
  - Create alarm: Estimated charges > $100 → critical alert
  - Use alarm names: "showcore-billing-50", "showcore-billing-100"
  - Configure SNS actions to billing alerts topic
  - Set evaluation period to 6 hours (21600 seconds)
  - _Requirements: 1.2, 1.3, 9.7, 9.8_

- [ ] 10.7 Configure CloudWatch log retention
  - Set log retention to 7 days for cost optimization using logs.LogGroup
  - Configure log groups for RDS, ElastiCache, CloudTrail, VPC Flow Logs (if enabled)
  - Use log group names: "/aws/rds/showcore-db", "/aws/elasticache/showcore-redis", "/aws/cloudtrail/showcore"
  - _Requirements: 7.4_

- [ ]* 10.8 Write unit tests for monitoring configuration
  - Test SNS topics exist with subscriptions using Template.has_resource_properties()
  - Test CloudWatch dashboard exists with correct widgets
  - Test CloudWatch alarms exist for all critical metrics (RDS, ElastiCache, S3, billing)
  - Test log retention is set to 7 days for all log groups
  - Test alarm thresholds match requirements (CPU 80%, memory 80%, billing $50/$100)
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

### 11. Backup and Disaster Recovery

- [ ] 11.1 Create AWS Backup vault
  - Create backup vault for centralized backup management using backup.BackupVault
  - Enable encryption for backup vault using AWS managed keys (not KMS for cost optimization)
  - Use vault name: "showcore-backup-vault"
  - _Requirements: 8.1, 9.9_

- [ ] 11.2 Create AWS Backup plan for RDS
  - Configure daily backup schedule (03:00 UTC) using backup.BackupPlan
  - Set backup retention to 7 days (short retention for cost optimization)
  - Tag backup resources with cost allocation tags (Project, Phase, Environment)
  - Use backup plan name: "showcore-rds-backup-plan"
  - Create backup selection to include RDS instances with tag Project=ShowCore
  - _Requirements: 8.2, 8.4, 8.7_

- [ ] 11.3 Create AWS Backup plan for ElastiCache
  - Configure daily snapshot schedule (03:00 UTC) using backup.BackupPlan
  - Set snapshot retention to 7 days (short retention for cost optimization)
  - Tag backup resources with cost allocation tags (Project, Phase, Environment)
  - Use backup plan name: "showcore-elasticache-backup-plan"
  - Create backup selection to include ElastiCache clusters with tag Project=ShowCore
  - _Requirements: 8.3, 8.5, 8.7_

- [ ] 11.4 Configure backup failure alarms
  - Create CloudWatch alarm for RDS backup job failures using cloudwatch.Alarm
  - Create CloudWatch alarm for ElastiCache backup job failures
  - Configure SNS notifications to critical alerts topic
  - Use alarm names: "showcore-rds-backup-failure", "showcore-elasticache-backup-failure"
  - Monitor AWS Backup job status metrics
  - _Requirements: 8.6_

- [ ]* 11.5 Write unit tests for backup configuration
  - Test AWS Backup vault exists using Template.has_resource_properties()
  - Test backup plans include RDS and ElastiCache resources
  - Test backup retention is 7 days for both RDS and ElastiCache
  - Test backup failure alarms exist and are configured
  - Test backup vault uses AWS managed encryption (not KMS)
  - Test backup resources have cost allocation tags
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 9.9_

### 12. Cost Optimization and Tagging

- [ ] 12.1 Verify cost optimization measures
  - Verify NO NAT Gateway is deployed using Template.resource_count_is("AWS::EC2::NatGateway", 0)
  - Verify Free Tier eligible instance types: db.t3.micro, cache.t3.micro
  - Verify single-AZ deployment for RDS (MultiAZ=false) and ElastiCache (NumCacheNodes=1)
  - Verify Gateway Endpoints are used for S3 and DynamoDB (FREE)
  - Verify minimal Interface Endpoints (only CloudWatch Logs, Monitoring, Systems Manager)
  - Verify S3 SSE-S3 encryption (not KMS) for all buckets
  - Verify CloudFront PriceClass_100 (North America and Europe only)
  - Verify short backup retention (7 days) for cost optimization
  - Document cost savings: ~$32/month NAT Gateway eliminated, ~$21-28/month Interface Endpoints added, net savings ~$4-11/month
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.9, 9.11, 9.13_

- [ ] 12.2 Enable cost allocation tags
  - Activate cost allocation tags in AWS Billing console: Project, Phase, Environment, ManagedBy, CostCenter
  - Verify all resources have required tags using AWS Resource Groups Tagging API
  - Create tag policy to enforce tagging on new resources
  - _Requirements: 9.6, 1.5_

- [ ]* 12.3 Write property test for resource tagging compliance
  - Test all Phase 1 resources have required tags: Project, Phase, Environment, ManagedBy, CostCenter
  - Query all resources using boto3 resourcegroupstaggingapi.get_resources()
  - Verify each resource has all 5 required tags
  - **Property 2: Resource Tagging Compliance**
  - **Validates: Requirements 9.6**

- [ ] 12.4 Review initial cost estimates
  - Check Cost Explorer for Phase 1 costs by service
  - Verify costs are within expected range: ~$3-10/month during Free Tier, ~$49-60/month after
  - Document cost breakdown: VPC Endpoints (~$21-28/month), RDS (~$0 Free Tier), ElastiCache (~$0 Free Tier), S3 (~$1-5/month), CloudFront (~$1-5/month)
  - Set up Cost Anomaly Detection for unexpected cost increases
  - _Requirements: 9.7, 9.8, 1.5_

### 13. Checkpoint - Complete Infrastructure Deployment

- [ ] 13.1 Validate complete infrastructure deployment
  - Run all unit tests and property tests using pytest
  - Verify all resources are deployed and configured correctly in AWS Console
  - Review CloudWatch dashboards for all metrics (RDS, ElastiCache, S3, CloudFront, VPC Endpoints)
  - Verify cost optimization measures are in place: no NAT Gateway, Free Tier instances, minimal endpoints
  - Verify security configurations: encryption at rest/transit, security groups, CloudTrail, AWS Config
  - Verify VPC Endpoints are healthy: Gateway Endpoints (S3, DynamoDB), Interface Endpoints (CloudWatch, SSM)
  - Run `cdk diff` to ensure no unexpected changes or drift
  - Review Cost Explorer to confirm costs are within expected range
  - Ask user if any issues or questions arise before proceeding to integration testing
  - _Requirements: All Phase 1 requirements_

### 14. Integration Testing

- [ ] 14.1 Test RDS connectivity from private subnet
  - Deploy test EC2 instance in private subnet using ec2.Instance
  - Install PostgreSQL client (psql) using Systems Manager Session Manager
  - Test connection to RDS endpoint: `psql -h <endpoint> -U postgres -d showcore sslmode=require`
  - Verify SSL/TLS connection is enforced (connection should fail without SSL)
  - Verify security group rules allow connection from test instance
  - Test basic SQL operations (CREATE TABLE, INSERT, SELECT)
  - Terminate test instance after validation
  - _Requirements: 3.3, 3.6_

- [ ] 14.2 Test ElastiCache connectivity from private subnet
  - Deploy test EC2 instance in private subnet using ec2.Instance
  - Install Redis client (redis-cli) using Systems Manager Session Manager
  - Test connection to ElastiCache endpoint: `redis-cli -h <endpoint> -p 6379 --tls`
  - Verify TLS connection is enforced (connection should fail without TLS)
  - Verify security group rules allow connection from test instance
  - Test basic Redis operations (SET, GET, DEL)
  - Terminate test instance after validation
  - _Requirements: 4.3, 4.5_

- [ ] 14.3 Test VPC Endpoint functionality
  - From private subnet instance, test S3 access via Gateway Endpoint: `aws s3 ls s3://showcore-backups-{account-id}`
  - From private subnet instance, test CloudWatch Logs access via Interface Endpoint: `aws logs describe-log-groups`
  - From private subnet instance, test Systems Manager access via Interface Endpoint: `aws ssm describe-instance-information`
  - Verify NO internet access from private subnet (curl http://www.google.com should fail)
  - Verify AWS service access works via VPC Endpoints (all aws cli commands should succeed)
  - Verify private DNS is enabled for Interface Endpoints (service endpoints resolve to private IPs)
  - _Requirements: 2.5, 2.6, 2.7, 2.8, 2.9, 2.4_

- [ ] 14.4 Test backup and restore procedures
  - Trigger manual RDS snapshot using AWS Backup or RDS console
  - Wait for snapshot to complete (monitor backup job status)
  - Restore snapshot to new RDS instance in same VPC
  - Verify data integrity by connecting and querying restored instance
  - Terminate restored instance after validation
  - Trigger manual ElastiCache snapshot using AWS Backup or ElastiCache console
  - Wait for snapshot to complete
  - Restore snapshot to new ElastiCache cluster in same VPC
  - Verify data by connecting to restored cluster
  - Terminate restored cluster after validation
  - _Requirements: 8.2, 8.3, 8.4, 8.5_

- [ ] 14.5 Test CloudFront and S3 integration
  - Upload test file to S3 static assets bucket: `aws s3 cp test.html s3://showcore-static-assets-{account-id}/`
  - Verify file is accessible via CloudFront URL: `curl https://<distribution-domain>/test.html`
  - Verify HTTPS redirect works: `curl -I http://<distribution-domain>/test.html` (should return 301/302)
  - Verify file is NOT accessible via direct S3 URL: `curl https://showcore-static-assets-{account-id}.s3.amazonaws.com/test.html` (should return 403)
  - Test cache behavior: request file twice, verify second request is served from cache (X-Cache: Hit from cloudfront)
  - Verify compression is enabled: check Content-Encoding header (should be gzip or br)
  - Delete test file after validation
  - _Requirements: 5.4, 5.5, 5.6_

### 15. Compliance and Security Validation

- [ ] 15.1 Run AWS Config compliance checks
  - Verify all Config rules are passing: rds-storage-encrypted, s3-bucket-public-read-prohibited
  - Review non-compliant resources in AWS Config console
  - Remediate any non-compliant resources immediately
  - Document compliance status in compliance report
  - _Requirements: 6.3_

- [ ] 15.2 Run security validation tests
  - Run property test for security group least privilege (no 0.0.0.0/0 on ports 22, 5432, 6379)
  - Verify encryption at rest is enabled for all data resources (RDS, ElastiCache, S3)
  - Verify encryption in transit is enforced (SSL/TLS for RDS, TLS for ElastiCache, HTTPS for CloudFront)
  - Verify CloudTrail is logging all API calls to S3 bucket
  - Verify log file validation is enabled for CloudTrail
  - Review security group rules for least privilege compliance
  - _Requirements: 6.2, 6.5, 3.5, 3.6, 4.4, 4.5, 5.3, 5.6_

- [ ] 15.3 Review CloudTrail logs for deployment activities
  - Review CloudTrail logs for all infrastructure deployment API calls (CreateStack, UpdateStack, CreateVpc, etc.)
  - Verify no unauthorized access attempts or suspicious API calls
  - Verify all API calls are from showcore-app IAM user or CDK execution role
  - Document any security findings or anomalies
  - _Requirements: 6.5, 6.6, 1.4_

### 16. Documentation and Handoff

- [ ] 16.1 Create runbook for RDS backup and restore
  - Document manual snapshot procedures: `aws rds create-db-snapshot --db-instance-identifier showcore-db --db-snapshot-identifier showcore-db-manual-snapshot-YYYYMMDD`
  - Document point-in-time recovery procedures: `aws rds restore-db-instance-to-point-in-time --source-db-instance-identifier showcore-db --target-db-instance-identifier showcore-db-restored --restore-time YYYY-MM-DDTHH:MM:SSZ`
  - Document restore from snapshot procedures: `aws rds restore-db-instance-from-db-snapshot --db-instance-identifier showcore-db-restored --db-snapshot-identifier showcore-db-snapshot-id`
  - Document verification steps: connect to restored instance, verify data integrity
  - Store in `.kiro/specs/showcore-aws-migration-phase1/runbooks/rds-backup-restore.md`
  - _Requirements: 8.2, 8.4_

- [ ] 16.2 Create runbook for ElastiCache backup and restore
  - Document manual snapshot procedures: `aws elasticache create-snapshot --cache-cluster-id showcore-redis --snapshot-name showcore-redis-manual-snapshot-YYYYMMDD`
  - Document restore from snapshot procedures: `aws elasticache create-cache-cluster --cache-cluster-id showcore-redis-restored --snapshot-name showcore-redis-snapshot-name`
  - Document verification steps: connect to restored cluster, verify data
  - Store in `.kiro/specs/showcore-aws-migration-phase1/runbooks/elasticache-backup-restore.md`
  - _Requirements: 8.3, 8.5_

- [ ] 16.3 Create runbook for VPC Endpoint troubleshooting
  - Document VPC Endpoint health checks: verify endpoint status, check security groups, verify private DNS
  - Document connectivity troubleshooting steps: test from private subnet, check route tables, verify DNS resolution
  - Document how to add new Interface Endpoints: create endpoint, attach security group, enable private DNS
  - Document cost implications: Gateway Endpoints are FREE, Interface Endpoints cost ~$7/month each
  - Store in `.kiro/specs/showcore-aws-migration-phase1/runbooks/vpc-endpoint-troubleshooting.md`
  - _Requirements: 2.5, 2.6, 2.7, 2.8, 2.9, 9.13_

- [ ] 16.4 Update README with deployment instructions
  - Document CDK deployment commands: `cdk bootstrap`, `cdk synth`, `cdk diff`, `cdk deploy --all`
  - Document environment configuration: set AWS_ACCOUNT_ID, AWS_REGION in cdk.json context
  - Document testing procedures: `pytest tests/unit/`, `pytest tests/property/`, `pytest tests/integration/`
  - Document cost monitoring procedures: review Cost Explorer, check billing alarms, activate cost allocation tags
  - Document VPC Endpoints architecture and cost savings (~$4-11/month vs NAT Gateway)
  - Document management trade-offs: manual patching, no internet access from private subnets
  - Store in `infrastructure/README.md`
  - _Requirements: 10.7, 9.13_

### 17. Final Validation and Sign-off

- [ ] 17.1 Run complete test suite
  - Run all unit tests: `pytest tests/unit/ -v`
  - Run all property tests: `pytest tests/property/ -v`
  - Run all integration tests: `pytest tests/integration/ -v`
  - Verify 100% test pass rate (all tests must pass)
  - Generate test coverage report: `pytest tests/ --cov=lib --cov-report=html`
  - Review coverage report and ensure adequate coverage (target: 80%+)
  - _Requirements: All Phase 1 requirements_

- [ ] 17.2 Review final cost estimates and optimization
  - Review Cost Explorer for actual Phase 1 costs by service
  - Verify costs match estimates: ~$3-10/month during Free Tier, ~$49-60/month after
  - Document detailed cost breakdown:
    - VPC Endpoints: ~$21-28/month (Interface Endpoints only, Gateway Endpoints are FREE)
    - RDS db.t3.micro: ~$0 during Free Tier, ~$15/month after
    - ElastiCache cache.t3.micro: ~$0 during Free Tier, ~$12/month after
    - S3 storage: ~$1-5/month
    - CloudFront: ~$1-5/month
    - Data transfer: ~$0-5/month
  - Verify all cost optimization measures are in place:
    - NO NAT Gateway (saves ~$32/month)
    - Free Tier instances (db.t3.micro, cache.t3.micro)
    - Single-AZ deployment (saves 50% on RDS/ElastiCache)
    - Gateway Endpoints for S3/DynamoDB (FREE)
    - Minimal Interface Endpoints (only essential services)
    - SSE-S3 encryption (not KMS, saves ~$1/key/month)
    - CloudFront PriceClass_100 (lowest cost regions)
    - Short backup retention (7 days)
  - Document net savings vs NAT Gateway architecture: ~$4-11/month
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.7, 9.8, 9.9, 9.11, 9.13_

- [ ] 17.3 Phase 1 completion sign-off
  - Review all requirements are met (check requirements.md)
  - Review all tests are passing (100% pass rate)
  - Review all documentation is complete (README, runbooks, ADRs)
  - Review security configurations are correct (encryption, security groups, CloudTrail, AWS Config)
  - Review cost optimization measures are in place (no NAT Gateway, Free Tier instances, minimal endpoints)
  - Review VPC Endpoints architecture is working (Gateway and Interface Endpoints)
  - Obtain stakeholder approval for Phase 1 completion
  - Document lessons learned and recommendations for Phase 2
  - _Requirements: All Phase 1 requirements_

## Notes

- Tasks marked with `*` are optional testing tasks that can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation at key milestones
- Property tests validate universal correctness properties (security groups, resource tagging)
- Unit tests validate specific configurations and examples (resource properties, encryption, instance types)
- Integration tests validate connectivity and functionality between components (RDS, ElastiCache, VPC Endpoints, CloudFront)
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
