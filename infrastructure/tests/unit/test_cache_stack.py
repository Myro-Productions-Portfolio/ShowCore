"""
Unit tests for ShowCoreCacheStack

Tests verify:
- ElastiCache is cache.t3.micro (Free Tier eligible)
- Single node deployment (cost optimization) - NumCacheNodes should be 1
- Encryption at rest and in transit are enabled
- Automated backups are enabled with 7-day retention
- CloudWatch alarms exist for CPU and memory
- TLS is enforced (transit encryption enabled)

These tests run against CDK synthesized template - no actual AWS resources.

Validates: Requirements 4.1, 4.2, 4.4, 4.5, 4.6, 4.7, 4.8, 9.1, 9.5
"""

import aws_cdk as cdk
from aws_cdk.assertions import Template, Match
from lib.stacks.cache_stack import ShowCoreCacheStack
from lib.stacks.network_stack import ShowCoreNetworkStack
from lib.stacks.security_stack import ShowCoreSecurityStack


def _create_test_stack():
    """
    Helper function to create test stack with dependencies.
    
    CacheStack requires NetworkStack (VPC) and SecurityStack (security group).
    """
    app = cdk.App()
    
    # Create network stack (provides VPC)
    network_stack = ShowCoreNetworkStack(app, "TestNetworkStack")
    
    # Create security stack (provides ElastiCache security group)
    security_stack = ShowCoreSecurityStack(
        app,
        "TestSecurityStack",
        vpc=network_stack.vpc
    )
    
    # Create cache stack
    cache_stack = ShowCoreCacheStack(
        app,
        "TestCacheStack",
        vpc=network_stack.vpc,
        elasticache_security_group=security_stack.elasticache_security_group
    )
    
    return cache_stack


def test_elasticache_is_free_tier_eligible():
    """
    Test ElastiCache uses Free Tier eligible cache.t3.micro node type.
    
    cache.t3.micro provides 750 hours/month free for 12 months.
    After Free Tier: ~$12/month.
    
    Validates: Requirements 4.1, 9.1
    """
    stack = _create_test_stack()
    template = Template.from_stack(stack)
    
    # Verify ElastiCache node type is cache.t3.micro
    template.has_resource_properties("AWS::ElastiCache::CacheCluster", {
        "CacheNodeType": "cache.t3.micro"
    })


def test_elasticache_is_single_node_deployment():
    """
    Test ElastiCache is deployed as single node (cost optimization).
    
    Single node deployment (no replicas) reduces cost.
    Acceptable for low-traffic project website.
    Can add replicas later if traffic increases.
    
    Validates: Requirements 4.2, 9.5
    """
    stack = _create_test_stack()
    template = Template.from_stack(stack)
    
    # Verify single node deployment (NumCacheNodes = 1)
    template.has_resource_properties("AWS::ElastiCache::CacheCluster", {
        "NumCacheNodes": 1
    })
    
    # Verify specific availability zone is set (us-east-1a)
    template.has_resource_properties("AWS::ElastiCache::CacheCluster", {
        "PreferredAvailabilityZone": "us-east-1a"
    })


def test_elasticache_encryption_at_rest_enabled():
    """
    Test ElastiCache has encryption at rest enabled.
    
    Uses AWS managed encryption (not KMS) for cost optimization.
    AWS managed encryption is free.
    
    Validates: Requirements 4.4, 9.5
    """
    stack = _create_test_stack()
    template = Template.from_stack(stack)
    
    # Verify encryption at rest is enabled
    template.has_resource_properties("AWS::ElastiCache::CacheCluster", {
        "AtRestEncryptionEnabled": True
    })


def test_elasticache_encryption_in_transit_enabled():
    """
    Test ElastiCache has encryption in transit (TLS) enabled.
    
    All client connections must use TLS.
    Prevents unencrypted connections.
    
    Validates: Requirements 4.5
    """
    stack = _create_test_stack()
    template = Template.from_stack(stack)
    
    # Verify encryption in transit (TLS) is enabled
    template.has_resource_properties("AWS::ElastiCache::CacheCluster", {
        "TransitEncryptionEnabled": True
    })


def test_elasticache_automated_backups_enabled():
    """
    Test ElastiCache has automated backups enabled with 7-day retention.
    
    Daily automated snapshots with 7-day retention (short retention for cost optimization).
    Backup window: 03:00-04:00 UTC (off-peak hours).
    
    Validates: Requirements 4.8
    """
    stack = _create_test_stack()
    template = Template.from_stack(stack)
    
    # Verify automated backups are enabled with 7-day retention
    template.has_resource_properties("AWS::ElastiCache::CacheCluster", {
        "SnapshotRetentionLimit": 7,
        "SnapshotWindow": "03:00-04:00"
    })


def test_elasticache_maintenance_window_configured():
    """
    Test ElastiCache has maintenance window configured.
    
    Maintenance window: Sunday 04:00-05:00 UTC (off-peak hours).
    
    Validates: Requirements 4.8
    """
    stack = _create_test_stack()
    template = Template.from_stack(stack)
    
    # Verify maintenance window is configured
    template.has_resource_properties("AWS::ElastiCache::CacheCluster", {
        "PreferredMaintenanceWindow": "sun:04:00-sun:05:00"
    })


def test_elasticache_uses_redis_engine():
    """
    Test ElastiCache uses Redis engine version 7.x.
    
    Redis 7.x provides latest features and security updates.
    
    Validates: Requirements 4.1
    """
    stack = _create_test_stack()
    template = Template.from_stack(stack)
    
    # Verify Redis engine is used
    template.has_resource_properties("AWS::ElastiCache::CacheCluster", {
        "Engine": "redis",
        "EngineVersion": Match.string_like_regexp("^7\\..*")
    })


def test_elasticache_port_is_6379():
    """
    Test ElastiCache uses standard Redis port 6379.
    
    Validates: Requirements 4.1
    """
    stack = _create_test_stack()
    template = Template.from_stack(stack)
    
    # Verify Redis port is 6379
    template.has_resource_properties("AWS::ElastiCache::CacheCluster", {
        "Port": 6379
    })


def test_elasticache_subnet_group_exists():
    """
    Test ElastiCache subnet group is created in private subnets.
    
    Subnet group defines which subnets ElastiCache can be deployed in.
    Uses private subnets with NO internet access.
    
    Validates: Requirements 4.1
    """
    stack = _create_test_stack()
    template = Template.from_stack(stack)
    
    # Verify subnet group exists
    template.resource_count_is("AWS::ElastiCache::SubnetGroup", 1)
    
    # Verify subnet group has description
    template.has_resource_properties("AWS::ElastiCache::SubnetGroup", {
        "Description": Match.string_like_regexp(".*private subnets.*")
    })


def test_elasticache_parameter_group_exists():
    """
    Test ElastiCache parameter group is created for Redis 7.
    
    Parameter group defines configuration settings for Redis cluster.
    
    Validates: Requirements 4.5
    """
    stack = _create_test_stack()
    template = Template.from_stack(stack)
    
    # Verify parameter group exists
    template.resource_count_is("AWS::ElastiCache::ParameterGroup", 1)
    
    # Verify parameter group is for Redis 7
    template.has_resource_properties("AWS::ElastiCache::ParameterGroup", {
        "CacheParameterGroupFamily": "redis7"
    })


def test_elasticache_security_group_attached():
    """
    Test ElastiCache cluster has security group attached.
    
    Security group allows Redis (6379) only from application tier.
    
    Validates: Requirements 4.3
    """
    stack = _create_test_stack()
    template = Template.from_stack(stack)
    
    # Verify security group is attached
    template.has_resource_properties("AWS::ElastiCache::CacheCluster", {
        "VpcSecurityGroupIds": Match.any_value()
    })


def test_cloudwatch_cpu_alarm_exists():
    """
    Test CloudWatch alarm exists for CPU utilization > 75%.
    
    Alarm triggers when CPU utilization exceeds 75% for 5 minutes.
    Lower threshold than RDS (80%) because cache is more sensitive to CPU load.
    
    Validates: Requirements 4.6, 7.3, 7.5
    """
    stack = _create_test_stack()
    template = Template.from_stack(stack)
    
    # Verify CPU alarm exists
    template.has_resource_properties("AWS::CloudWatch::Alarm", {
        "AlarmName": "showcore-elasticache-cpu-high",
        "MetricName": "CPUUtilization",
        "Namespace": "AWS/ElastiCache",
        "Threshold": 75,
        "ComparisonOperator": "GreaterThanThreshold"
    })


def test_cloudwatch_memory_alarm_exists():
    """
    Test CloudWatch alarm exists for memory utilization > 80%.
    
    Alarm triggers when memory utilization exceeds 80%.
    High memory usage can lead to evictions.
    
    Validates: Requirements 4.7, 7.3, 7.5
    """
    stack = _create_test_stack()
    template = Template.from_stack(stack)
    
    # Verify memory alarm exists
    template.has_resource_properties("AWS::CloudWatch::Alarm", {
        "AlarmName": "showcore-elasticache-memory-high",
        "MetricName": "DatabaseMemoryUsagePercentage",
        "Namespace": "AWS/ElastiCache",
        "Threshold": 80,
        "ComparisonOperator": "GreaterThanThreshold"
    })


def test_elasticache_cluster_name_follows_convention():
    """
    Test ElastiCache cluster name follows naming convention.
    
    Naming convention: showcore-{component}-{environment}-{resource-type}
    For cache: showcore-redis
    
    Validates: Requirements 9.6 (via iac-standards.md)
    """
    stack = _create_test_stack()
    template = Template.from_stack(stack)
    
    # Verify cluster name follows convention
    template.has_resource_properties("AWS::ElastiCache::CacheCluster", {
        "ClusterName": "showcore-redis"
    })


def test_elasticache_auto_minor_version_upgrade_enabled():
    """
    Test ElastiCache has auto minor version upgrade enabled.
    
    Automatically applies minor version upgrades during maintenance window.
    Keeps cluster up-to-date with security patches.
    
    Validates: Requirements 4.8
    """
    stack = _create_test_stack()
    template = Template.from_stack(stack)
    
    # Verify auto minor version upgrade is enabled
    template.has_resource_properties("AWS::ElastiCache::CacheCluster", {
        "AutoMinorVersionUpgrade": True
    })


def test_stack_has_required_outputs():
    """
    Test stack exports required CloudFormation outputs.
    
    Outputs:
    - ElastiCacheSubnetGroupName
    - ElastiCacheParameterGroupName
    - ElastiCacheEndpoint
    - ElastiCachePort
    
    Validates: Cross-stack references
    """
    stack = _create_test_stack()
    template = Template.from_stack(stack)
    
    # Verify required outputs exist
    template.has_output("ElastiCacheSubnetGroupName", {})
    template.has_output("ElastiCacheParameterGroupName", {})
    template.has_output("ElastiCacheEndpoint", {})
    template.has_output("ElastiCachePort", {})
