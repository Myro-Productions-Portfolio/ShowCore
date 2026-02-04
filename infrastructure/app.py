#!/usr/bin/env python3
"""
ShowCore AWS Migration Phase 1 - CDK Application Entry Point

This is the main entry point for the AWS CDK application that deploys
the ShowCore Phase 1 infrastructure.

Stack Deployment Order:
1. NetworkStack - VPC, subnets, VPC endpoints (no dependencies)
2. SecurityStack - Security groups, CloudTrail (depends on Network)
3. MonitoringStack - CloudWatch, SNS, billing alarms (no dependencies)
4. DatabaseStack - RDS PostgreSQL (depends on Network, Security)
5. CacheStack - ElastiCache Redis (depends on Network, Security)
6. StorageStack - S3 buckets (no dependencies)
7. CDNStack - CloudFront distribution (depends on Storage)
8. BackupStack - AWS Backup plans (depends on Database, Cache)
"""

import aws_cdk as cdk
from lib.stacks.network_stack import ShowCoreNetworkStack
from lib.stacks.security_stack import ShowCoreSecurityStack
from lib.stacks.monitoring_stack import ShowCoreMonitoringStack
from lib.stacks.database_stack import ShowCoreDatabaseStack
from lib.stacks.cache_stack import ShowCoreCacheStack
from lib.stacks.storage_stack import ShowCoreStorageStack
from lib.stacks.cdn_stack import ShowCoreCDNStack
from lib.stacks.backup_stack import ShowCoreBackupStack

app = cdk.App()

# Get configuration from context
environment = app.node.try_get_context("environment") or "production"
account = app.node.try_get_context("account") or None
region = app.node.try_get_context("region") or "us-east-1"

# Define environment (account can be None for synthesis)
if account:
    env = cdk.Environment(account=account, region=region)
else:
    env = None

# 1. Deploy Network Stack (foundation - VPC, subnets, VPC endpoints, NO NAT Gateway)
network_stack = ShowCoreNetworkStack(
    app,
    "ShowCoreNetworkStack",
    env=env,
    description="ShowCore Phase 1 - Network Infrastructure (VPC, Subnets, VPC Endpoints, No NAT Gateway)"
)

# 2. Deploy Security Stack (depends on Network Stack for VPC)
security_stack = ShowCoreSecurityStack(
    app,
    "ShowCoreSecurityStack",
    vpc=network_stack.vpc,
    env=env,
    description="ShowCore Phase 1 - Security Groups, CloudTrail, and Audit Logging"
)
security_stack.add_dependency(network_stack)

# 3. Deploy Monitoring Stack (includes CloudWatch dashboards, alarms, SNS topics, billing alerts)
monitoring_stack = ShowCoreMonitoringStack(
    app,
    "ShowCoreMonitoringStack",
    env=env,
    description="ShowCore Phase 1 - Monitoring, Alerting, and Billing"
)

# 4. Deploy Database Stack (depends on Network and Security for VPC and security groups)
database_stack = ShowCoreDatabaseStack(
    app,
    "ShowCoreDatabaseStack",
    vpc=network_stack.vpc,
    rds_security_group=security_stack.rds_security_group,
    env=env,
    description="ShowCore Phase 1 - RDS PostgreSQL Database (db.t3.micro, Free Tier)"
)
database_stack.add_dependency(network_stack)
database_stack.add_dependency(security_stack)

# 5. Deploy Cache Stack (depends on Network and Security for VPC and security groups)
cache_stack = ShowCoreCacheStack(
    app,
    "ShowCoreCacheStack",
    vpc=network_stack.vpc,
    elasticache_security_group=security_stack.elasticache_security_group,
    env=env,
    description="ShowCore Phase 1 - ElastiCache Redis Cluster (cache.t3.micro, Free Tier)"
)
cache_stack.add_dependency(network_stack)
cache_stack.add_dependency(security_stack)

# 6. Deploy Storage Stack (S3 buckets for static assets and backups)
storage_stack = ShowCoreStorageStack(
    app,
    "ShowCoreStorageStack",
    env=env,
    description="ShowCore Phase 1 - S3 Buckets for Static Assets and Backups"
)

# 7. Deploy CDN Stack (depends on Storage for bucket name)
cdn_stack = ShowCoreCDNStack(
    app,
    "ShowCoreCDNStack",
    static_assets_bucket_name=storage_stack.static_assets_bucket_name,
    env=env,
    description="ShowCore Phase 1 - CloudFront CDN Distribution"
)
cdn_stack.add_dependency(storage_stack)

# 8. Deploy Backup Stack (depends on Monitoring for SNS topics)
backup_stack = ShowCoreBackupStack(
    app,
    "ShowCoreBackupStack",
    critical_alerts_topic=monitoring_stack.critical_alerts_topic,
    env=env,
    description="ShowCore Phase 1 - AWS Backup Plans for RDS and ElastiCache"
)
backup_stack.add_dependency(monitoring_stack)

app.synth()
