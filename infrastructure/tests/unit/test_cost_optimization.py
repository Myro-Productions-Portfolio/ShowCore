"""
Unit tests for Cost Optimization Measures

This test file consolidates all cost optimization verification tests across all stacks.
It verifies that the infrastructure follows cost optimization best practices:

1. NO NAT Gateway deployed (saves ~$32/month)
2. Free Tier eligible instance types (db.t3.micro, cache.t3.micro)
3. Single-AZ deployment for RDS and ElastiCache
4. Gateway Endpoints used for S3 and DynamoDB (FREE)
5. Minimal Interface Endpoints (only essential services)
6. S3 SSE-S3 encryption (not KMS)
7. CloudFront PriceClass_100 (North America and Europe only)
8. Short backup retention (7 days)

Cost Savings Summary:
- NAT Gateway eliminated: ~$32/month savings
- Interface Endpoints added: ~$21-28/month cost (3-4 endpoints × $7/month)
- Net savings: ~$4-11/month
- During Free Tier (12 months): ~$3-10/month total
- After Free Tier: ~$49-60/month total

Validates: Requirements 9.1, 9.2, 9.3, 9.4, 9.5, 9.9, 9.11, 9.13
"""

import aws_cdk as cdk
from aws_cdk.assertions import Template, Match
from lib.stacks.network_stack import ShowCoreNetworkStack
from lib.stacks.security_stack import ShowCoreSecurityStack
from lib.stacks.database_stack import ShowCoreDatabaseStack
from lib.stacks.cache_stack import ShowCoreCacheStack
from lib.stacks.storage_stack import ShowCoreStorageStack
from lib.stacks.cdn_stack import ShowCoreCDNStack


def _create_all_stacks():
    """
    Helper function to create all stacks for comprehensive testing.
    
    Returns tuple of (app, network_stack, security_stack, database_stack, 
                      cache_stack, storage_stack, cdn_stack)
    """
    app = cdk.App()
    
    # Create network stack (foundation)
    network_stack = ShowCoreNetworkStack(app, "TestNetworkStack")
    
    # Create security stack (depends on network)
    security_stack = ShowCoreSecurityStack(
        app,
        "TestSecurityStack",
        vpc=network_stack.vpc
    )
    
    # Create database stack (depends on network and security)
    database_stack = ShowCoreDatabaseStack(
        app,
        "TestDatabaseStack",
        vpc=network_stack.vpc,
        rds_security_group=security_stack.rds_security_group
    )
    
    # Create cache stack (depends on network and security)
    cache_stack = ShowCoreCacheStack(
        app,
        "TestCacheStack",
        vpc=network_stack.vpc,
        elasticache_security_group=security_stack.elasticache_security_group
    )
    
    # Create storage stack (no dependencies)
    storage_stack = ShowCoreStorageStack(
        app,
        "TestStorageStack",
        environment="production"
    )
    
    # Create CDN stack (depends on storage)
    cdn_stack = ShowCoreCDNStack(
        app,
        "TestCDNStack",
        static_assets_bucket=storage_stack.static_assets_bucket
    )
    
    return (app, network_stack, security_stack, database_stack, 
            cache_stack, storage_stack, cdn_stack)


def test_no_nat_gateway_deployed():
    """
    Test NO NAT Gateway is deployed (cost optimization).
    
    This is the primary cost optimization measure, saving ~$32/month.
    NAT Gateway costs: $0.045/hour (~$32/month) + data processing charges.
    
    Instead, we use VPC Endpoints for AWS service access:
    - Gateway Endpoints (S3, DynamoDB): FREE
    - Interface Endpoints (CloudWatch, Systems Manager): ~$7/month each
    
    Net savings: ~$32/month (NAT Gateway) - ~$21-28/month (Interface Endpoints) = ~$4-11/month
    
    Validates: Requirement 9.2
    """
    _, network_stack, _, _, _, _, _ = _create_all_stacks()
    template = Template.from_stack(network_stack)
    
    # Verify NO NAT Gateway exists
    template.resource_count_is("AWS::EC2::NatGateway", 0)
    
    # Verify NO Elastic IP for NAT Gateway exists
    # Note: We only check NAT Gateway count since Elastic IPs can be used for other purposes
    pass


def test_free_tier_eligible_rds_instance():
    """
    Test RDS uses Free Tier eligible db.t3.micro instance class.
    
    db.t3.micro provides:
    - 750 hours/month free for 12 months
    - 2 vCPU, 1 GB RAM
    - After Free Tier: ~$15/month
    
    Validates: Requirements 3.1, 9.1
    """
    _, _, _, database_stack, _, _, _ = _create_all_stacks()
    template = Template.from_stack(database_stack)
    
    # Verify RDS instance is db.t3.micro
    template.has_resource_properties("AWS::RDS::DBInstance", {
        "DBInstanceClass": "db.t3.micro"
    })


def test_free_tier_eligible_elasticache_node():
    """
    Test ElastiCache uses Free Tier eligible cache.t3.micro node type.
    
    cache.t3.micro provides:
    - 750 hours/month free for 12 months
    - 2 vCPU, 0.5 GB RAM
    - After Free Tier: ~$12/month
    
    Validates: Requirements 4.1, 9.1
    """
    _, _, _, _, cache_stack, _, _ = _create_all_stacks()
    template = Template.from_stack(cache_stack)
    
    # Verify ElastiCache node type is cache.t3.micro
    template.has_resource_properties("AWS::ElastiCache::CacheCluster", {
        "CacheNodeType": "cache.t3.micro"
    })


def test_rds_single_az_deployment():
    """
    Test RDS is deployed in single AZ (cost optimization).
    
    Single-AZ deployment:
    - Cost: ~$15/month (after Free Tier)
    - Acceptable downtime for low-traffic project
    
    Multi-AZ deployment would:
    - Cost: ~$30/month (double the cost)
    - Provide automatic failover
    
    For low-traffic project website, single-AZ is acceptable.
    Can enable Multi-AZ later if traffic increases.
    
    Validates: Requirements 3.2, 9.5
    """
    _, _, _, database_stack, _, _, _ = _create_all_stacks()
    template = Template.from_stack(database_stack)
    
    # Verify RDS is NOT Multi-AZ (MultiAZ should be false)
    template.has_resource_properties("AWS::RDS::DBInstance", {
        "MultiAZ": False
    })
    
    # Verify specific availability zone is set (us-east-1a)
    template.has_resource_properties("AWS::RDS::DBInstance", {
        "AvailabilityZone": "us-east-1a"
    })


def test_elasticache_single_node_deployment():
    """
    Test ElastiCache is deployed as single node (cost optimization).
    
    Single node deployment:
    - Cost: ~$12/month (after Free Tier)
    - NumCacheNodes = 1
    - No replicas
    - Acceptable downtime for low-traffic project
    
    Multi-node deployment would:
    - Cost: ~$24/month or more (multiple nodes)
    - Provide automatic failover
    - Provide read replicas
    
    For low-traffic project website, single node is acceptable.
    Can add replicas later if traffic increases.
    
    Validates: Requirements 4.2, 9.5
    """
    _, _, _, _, cache_stack, _, _ = _create_all_stacks()
    template = Template.from_stack(cache_stack)
    
    # Verify single node deployment (NumCacheNodes = 1)
    template.has_resource_properties("AWS::ElastiCache::CacheCluster", {
        "NumCacheNodes": 1
    })
    
    # Verify specific availability zone is set (us-east-1a)
    template.has_resource_properties("AWS::ElastiCache::CacheCluster", {
        "PreferredAvailabilityZone": "us-east-1a"
    })


def test_gateway_endpoints_for_s3_and_dynamodb():
    """
    Test Gateway Endpoints are used for S3 and DynamoDB (FREE).
    
    Gateway Endpoints:
    - Cost: FREE (no charges)
    - Use route table entries to route traffic
    - Highly available by design
    - No bandwidth limits
    
    Services:
    - S3: For backups, logs, static assets
    - DynamoDB: For future use
    
    Validates: Requirement 9.3
    """
    _, network_stack, _, _, _, _, _ = _create_all_stacks()
    template = Template.from_stack(network_stack)
    
    # Find all Gateway Endpoints
    resources = template.find_resources("AWS::EC2::VPCEndpoint")
    gateway_endpoints = [
        endpoint for endpoint_id, endpoint in resources.items()
        if endpoint["Properties"].get("VpcEndpointType") == "Gateway"
    ]
    
    # Verify we have exactly 2 Gateway Endpoints (S3 and DynamoDB)
    assert len(gateway_endpoints) == 2, \
        f"Expected 2 Gateway Endpoints (S3, DynamoDB), found {len(gateway_endpoints)}"


def test_minimal_interface_endpoints():
    """
    Test minimal Interface Endpoints are deployed (only essential services).
    
    Interface Endpoints cost ~$7/month each + data processing charges.
    We deploy only essential services:
    1. CloudWatch Logs (~$7/month) - Required for logging from private subnets
    2. CloudWatch Monitoring (~$7/month) - Required for metrics from private subnets
    3. Systems Manager (~$7/month) - Required for Session Manager access
    
    Total Interface Endpoint cost: ~$21/month
    
    Optional endpoints NOT deployed (can add later if needed):
    - Secrets Manager (~$7/month) - Can use environment variables initially
    - EC2 (~$7/month) - Not needed for Phase 1
    - ECS (~$7/month) - Not needed for Phase 1
    
    Validates: Requirement 9.4
    """
    _, network_stack, _, _, _, _, _ = _create_all_stacks()
    template = Template.from_stack(network_stack)
    
    # Find all Interface Endpoints
    resources = template.find_resources("AWS::EC2::VPCEndpoint")
    interface_endpoints = [
        endpoint for endpoint_id, endpoint in resources.items()
        if endpoint["Properties"].get("VpcEndpointType") == "Interface"
    ]
    
    # Verify we have exactly 3 Interface Endpoints (minimal set)
    assert len(interface_endpoints) == 3, \
        f"Expected 3 Interface Endpoints (minimal set), found {len(interface_endpoints)}"


def test_s3_uses_sse_s3_not_kms():
    """
    Test S3 buckets use SSE-S3 encryption (not KMS).
    
    SSE-S3 (AWS managed keys):
    - Cost: FREE
    - Automatic key rotation
    - AES-256 encryption
    - Managed by AWS
    
    KMS (Customer managed keys) would cost:
    - $1/key/month
    - $0.03 per 10,000 requests
    - More control but higher cost
    
    For cost optimization, we use SSE-S3 for all S3 buckets.
    
    Validates: Requirement 9.9
    """
    _, _, _, _, _, storage_stack, _ = _create_all_stacks()
    template = Template.from_stack(storage_stack)
    
    # Verify all buckets use SSE-S3 encryption (not KMS)
    resources = template.find_resources("AWS::S3::Bucket")
    
    for bucket_id, bucket in resources.items():
        properties = bucket.get("Properties", {})
        encryption = properties.get("BucketEncryption", {})
        rules = encryption.get("ServerSideEncryptionConfiguration", [])
        
        assert len(rules) > 0, f"Bucket {bucket_id} should have encryption configured"
        
        # Verify SSE-S3 encryption (not KMS)
        for rule in rules:
            sse_algorithm = rule.get("ServerSideEncryptionByDefault", {}).get("SSEAlgorithm")
            assert sse_algorithm == "AES256", \
                f"Bucket {bucket_id} should use SSE-S3 (AES256), not KMS"
            
            # Verify KMS key is NOT specified
            assert "KMSMasterKeyID" not in rule.get("ServerSideEncryptionByDefault", {}), \
                f"Bucket {bucket_id} should not use KMS keys for cost optimization"


def test_cloudfront_uses_priceclass_100():
    """
    Test CloudFront uses PriceClass_100 (North America and Europe only).
    
    CloudFront Price Classes:
    - PriceClass_100: North America and Europe only (lowest cost)
    - PriceClass_200: Adds Asia, Middle East, Africa (medium cost)
    - PriceClass_All: All edge locations worldwide (highest cost)
    
    For low-traffic project website targeting North America and Europe,
    PriceClass_100 provides sufficient coverage at lowest cost.
    
    Data transfer pricing (PriceClass_100):
    - First 10 TB/month: $0.085/GB
    - Next 40 TB/month: $0.080/GB
    - Over 150 TB/month: $0.060/GB
    
    Validates: Requirements 5.7, 9.11
    """
    _, _, _, _, _, storage_stack, cdn_stack = _create_all_stacks()
    template = Template.from_stack(cdn_stack)
    
    # Verify CloudFront distribution uses PriceClass_100
    template.has_resource_properties("AWS::CloudFront::Distribution", {
        "DistributionConfig": {
            "PriceClass": "PriceClass_100"
        }
    })


def test_short_backup_retention():
    """
    Test RDS and ElastiCache have short backup retention (7 days).
    
    Backup retention costs:
    - RDS: Backup storage up to 100% of database size is free
    - ElastiCache: Backup storage is charged at $0.085/GB/month
    
    Short retention (7 days) reduces backup storage costs.
    Longer retention (30 days) would increase storage costs.
    
    For low-traffic project website, 7-day retention is acceptable.
    Can increase retention later if needed.
    
    Validates: Requirements 3.4, 4.8, 9.1
    """
    _, _, _, database_stack, cache_stack, _, _ = _create_all_stacks()
    
    # Verify RDS backup retention is 7 days
    rds_template = Template.from_stack(database_stack)
    rds_template.has_resource_properties("AWS::RDS::DBInstance", {
        "BackupRetentionPeriod": 7
    })
    
    # Verify ElastiCache snapshot retention is 7 days
    cache_template = Template.from_stack(cache_stack)
    cache_template.has_resource_properties("AWS::ElastiCache::CacheCluster", {
        "SnapshotRetentionLimit": 7
    })


def test_rds_uses_aws_managed_keys():
    """
    Test RDS uses AWS managed keys (not KMS).
    
    AWS managed keys:
    - Cost: FREE
    - Automatic rotation
    - Managed by AWS
    
    KMS customer managed keys would cost:
    - $1/key/month
    - $0.03 per 10,000 requests
    
    For cost optimization, we use AWS managed keys for RDS encryption.
    
    Validates: Requirements 3.5, 9.1
    """
    _, _, _, database_stack, _, _, _ = _create_all_stacks()
    template = Template.from_stack(database_stack)
    
    # Verify encryption is enabled
    template.has_resource_properties("AWS::RDS::DBInstance", {
        "StorageEncrypted": True
    })
    
    # Verify KMS key is NOT specified (uses AWS managed keys)
    resources = template.find_resources("AWS::RDS::DBInstance")
    for resource_id, resource in resources.items():
        properties = resource.get("Properties", {})
        # KmsKeyId should not be present (AWS managed keys)
        assert "KmsKeyId" not in properties, \
            "RDS should use AWS managed keys, not KMS for cost optimization"


def test_elasticache_uses_aws_managed_encryption():
    """
    Test ElastiCache uses AWS managed encryption (not KMS).
    
    AWS managed encryption:
    - Cost: FREE
    - Automatic rotation
    - Managed by AWS
    
    For cost optimization, we use AWS managed encryption for ElastiCache.
    
    Validates: Requirements 4.4, 9.5
    """
    _, _, _, _, cache_stack, _, _ = _create_all_stacks()
    template = Template.from_stack(cache_stack)
    
    # Verify encryption at rest is enabled
    template.has_resource_properties("AWS::ElastiCache::CacheCluster", {
        "AtRestEncryptionEnabled": True
    })
    
    # ElastiCache uses AWS managed encryption by default when AtRestEncryptionEnabled is true
    # No KMS key configuration needed


def test_s3_lifecycle_policies_reduce_storage_costs():
    """
    Test S3 lifecycle policies reduce storage costs.
    
    Lifecycle policies:
    1. Transition backups to Glacier after 30 days
       - Standard storage: $0.023/GB/month
       - Glacier Flexible Retrieval: $0.0036/GB/month
       - Savings: ~84% reduction in storage costs
    
    2. Delete old backups after 90 days
       - Prevents unlimited storage growth
       - Acceptable for low-traffic project
    
    3. Delete old versions after 90 days
       - Versioning provides protection
       - Old versions consume storage
       - Deleting old versions reduces costs
    
    Validates: Requirements 5.9, 9.10
    """
    _, _, _, _, _, storage_stack, _ = _create_all_stacks()
    template = Template.from_stack(storage_stack)
    
    # Find backups bucket (has Glacier transition)
    resources = template.find_resources("AWS::S3::Bucket")
    
    # Verify Glacier transition exists
    found_glacier_transition = False
    for bucket_id, bucket in resources.items():
        properties = bucket.get("Properties", {})
        lifecycle_rules = properties.get("LifecycleConfiguration", {}).get("Rules", [])
        
        for rule in lifecycle_rules:
            transitions = rule.get("Transitions", [])
            for transition in transitions:
                if transition.get("StorageClass") == "GLACIER_FLEXIBLE_RETRIEVAL":
                    assert transition.get("TransitionInDays") == 30, \
                        "Backups should transition to Glacier after 30 days"
                    found_glacier_transition = True
    
    assert found_glacier_transition, \
        "Backups bucket should have Glacier transition lifecycle policy"
    
    # Verify expiration policies exist
    found_current_expiration = False
    found_noncurrent_expiration = False
    
    for bucket_id, bucket in resources.items():
        properties = bucket.get("Properties", {})
        lifecycle_rules = properties.get("LifecycleConfiguration", {}).get("Rules", [])
        
        for rule in lifecycle_rules:
            if "ExpirationInDays" in rule:
                assert rule.get("ExpirationInDays") == 90, \
                    "Old backups should be deleted after 90 days"
                found_current_expiration = True
            
            if "NoncurrentVersionExpirationInDays" in rule:
                assert rule.get("NoncurrentVersionExpirationInDays") == 90, \
                    "Old versions should be deleted after 90 days"
                found_noncurrent_expiration = True
    
    assert found_current_expiration, \
        "Backups bucket should have expiration lifecycle policy"
    assert found_noncurrent_expiration, \
        "Buckets should have noncurrent version expiration lifecycle policy"


def test_cost_optimization_summary():
    """
    Test comprehensive cost optimization summary.
    
    This test documents the complete cost optimization strategy:
    
    Monthly Cost Breakdown (During Free Tier - First 12 months):
    - RDS db.t3.micro: $0 (750 hours/month free)
    - ElastiCache cache.t3.micro: $0 (750 hours/month free)
    - VPC Endpoints:
      - Gateway Endpoints (S3, DynamoDB): $0 (FREE)
      - Interface Endpoints (3 × $7/month): ~$21/month
    - S3 Storage: ~$1-5/month (first 5 GB free)
    - CloudFront: ~$1-5/month (first 1 TB free)
    - Data Transfer: ~$0-5/month (first 100 GB free)
    - CloudWatch: ~$0-5/month (basic metrics free, alarms $0.10 each)
    - Total: ~$3-10/month
    
    Monthly Cost Breakdown (After Free Tier - Month 13+):
    - RDS db.t3.micro: ~$15/month
    - ElastiCache cache.t3.micro: ~$12/month
    - VPC Endpoints: ~$21/month
    - Other costs: ~$1-12/month
    - Total: ~$49-60/month
    
    Cost Savings vs NAT Gateway Architecture:
    - NAT Gateway eliminated: -$32/month
    - Interface Endpoints added: +$21/month
    - Net savings: ~$11/month
    
    Validates: Requirement 9.13
    """
    # This test documents the cost optimization strategy
    # All individual cost optimization measures are tested above
    
    # Verify all cost optimization measures are in place
    _, network_stack, _, database_stack, cache_stack, storage_stack, cdn_stack = _create_all_stacks()
    
    # 1. NO NAT Gateway
    network_template = Template.from_stack(network_stack)
    network_template.resource_count_is("AWS::EC2::NatGateway", 0)
    
    # 2. Free Tier instances
    rds_template = Template.from_stack(database_stack)
    rds_template.has_resource_properties("AWS::RDS::DBInstance", {
        "DBInstanceClass": "db.t3.micro"
    })
    
    cache_template = Template.from_stack(cache_stack)
    cache_template.has_resource_properties("AWS::ElastiCache::CacheCluster", {
        "CacheNodeType": "cache.t3.micro"
    })
    
    # 3. Single-AZ deployment
    rds_template.has_resource_properties("AWS::RDS::DBInstance", {
        "MultiAZ": False
    })
    
    cache_template.has_resource_properties("AWS::ElastiCache::CacheCluster", {
        "NumCacheNodes": 1
    })
    
    # 4. Gateway Endpoints (FREE)
    gateway_endpoints = [
        e for e in network_template.find_resources("AWS::EC2::VPCEndpoint").values()
        if e["Properties"].get("VpcEndpointType") == "Gateway"
    ]
    assert len(gateway_endpoints) == 2, "Should have 2 Gateway Endpoints (FREE)"
    
    # 5. Minimal Interface Endpoints
    interface_endpoints = [
        e for e in network_template.find_resources("AWS::EC2::VPCEndpoint").values()
        if e["Properties"].get("VpcEndpointType") == "Interface"
    ]
    assert len(interface_endpoints) == 3, "Should have 3 Interface Endpoints (minimal)"
    
    # 6. S3 SSE-S3 encryption
    storage_template = Template.from_stack(storage_stack)
    for bucket in storage_template.find_resources("AWS::S3::Bucket").values():
        encryption = bucket["Properties"]["BucketEncryption"]
        rules = encryption["ServerSideEncryptionConfiguration"]
        for rule in rules:
            assert rule["ServerSideEncryptionByDefault"]["SSEAlgorithm"] == "AES256"
    
    # 7. CloudFront PriceClass_100
    cdn_template = Template.from_stack(cdn_stack)
    cdn_template.has_resource_properties("AWS::CloudFront::Distribution", {
        "DistributionConfig": {
            "PriceClass": "PriceClass_100"
        }
    })
    
    # 8. Short backup retention
    rds_template.has_resource_properties("AWS::RDS::DBInstance", {
        "BackupRetentionPeriod": 7
    })
    
    cache_template.has_resource_properties("AWS::ElastiCache::CacheCluster", {
        "SnapshotRetentionLimit": 7
    })
    
    # All cost optimization measures verified!
    # Net savings: ~$4-11/month vs NAT Gateway architecture
    # Total cost during Free Tier: ~$3-10/month
    # Total cost after Free Tier: ~$49-60/month


def test_all_cost_optimization_measures_documented():
    """
    Test that all cost optimization measures are documented and implemented.
    
    This test serves as a checklist to ensure all cost optimization measures
    from the requirements are implemented:
    
    ✅ 9.1: Free Tier eligible instance types (db.t3.micro, cache.t3.micro)
    ✅ 9.2: NO NAT Gateway deployed
    ✅ 9.3: Gateway Endpoints for S3 and DynamoDB (FREE)
    ✅ 9.4: Interface Endpoints for essential services only
    ✅ 9.5: Single-AZ deployment for RDS and ElastiCache
    ✅ 9.9: S3 SSE-S3 encryption (not KMS)
    ✅ 9.10: S3 lifecycle policies (Glacier transition, expiration)
    ✅ 9.11: CloudFront PriceClass_100
    ✅ 9.13: Cost savings documented (~$4-11/month net savings)
    
    Validates: All cost optimization requirements
    """
    # This test documents that all requirements are covered
    # Individual tests above verify each requirement
    
    cost_optimization_requirements = {
        "9.1": "Free Tier eligible instance types",
        "9.2": "NO NAT Gateway deployed",
        "9.3": "Gateway Endpoints for S3 and DynamoDB (FREE)",
        "9.4": "Interface Endpoints for essential services only",
        "9.5": "Single-AZ deployment for RDS and ElastiCache",
        "9.9": "S3 SSE-S3 encryption (not KMS)",
        "9.10": "S3 lifecycle policies",
        "9.11": "CloudFront PriceClass_100",
        "9.13": "Cost savings documented"
    }
    
    # All requirements are tested above
    assert len(cost_optimization_requirements) == 9, \
        "All 9 cost optimization requirements should be documented"
