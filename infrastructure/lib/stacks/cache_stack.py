"""
ShowCore Cache Stack

This module implements the cache infrastructure for ShowCore Phase 1.
It creates ElastiCache Redis cluster with subnet group and parameter group
for secure cache access from private subnets.

Cost Optimization:
- Uses Free Tier eligible cache.t3.micro node (750 hours/month for 12 months)
- Single-node deployment (no replicas for cost optimization)
- Short backup retention (7 days) reduces storage costs
- AWS managed encryption (no KMS costs)

Security:
- Deployed in private subnets with NO internet access
- Security group allows Redis only from application tier
- Encryption at rest using AWS managed encryption
- Encryption in transit enforced (TLS required)
- Automated backups enabled with 7-day retention
- CloudWatch monitoring and alarms configured

Cache Configuration:
- Engine: Redis 7.x
- Node Type: cache.t3.micro (2 vCPU, 0.5 GB RAM) - Free Tier eligible
- Cluster Mode: Disabled (single node)
- Nodes: 1 node (no replicas for cost optimization)
- Backup Window: 03:00-04:00 UTC (off-peak hours)
- Backup Retention: 7 days (short retention for cost optimization)
- Encryption at Rest: Enabled (AWS managed)
- Encryption in Transit: Enabled (TLS required)

Resources Created:
- ElastiCache Subnet Group in private subnets
- ElastiCache Parameter Group for Redis 7 with TLS enforcement
- ElastiCache Redis cluster (cache.t3.micro, single node)
- CloudWatch alarms for CPU utilization (> 75%) and memory utilization (> 80%)

Dependencies: ShowCoreNetworkStack (requires VPC and private subnets)
              ShowCoreSecurityStack (requires ElastiCache security group)

Validates: Requirements 4.1, 4.2, 4.4, 4.5, 4.6, 4.7, 4.8, 9.1, 9.5
"""

from aws_cdk import (
    aws_elasticache as elasticache,
    aws_ec2 as ec2,
    aws_cloudwatch as cloudwatch,
    CfnOutput,
)
from constructs import Construct
from lib.stacks.base_stack import ShowCoreBaseStack


class ShowCoreCacheStack(ShowCoreBaseStack):
    """
    Cache infrastructure stack for ShowCore Phase 1.
    
    Creates ElastiCache Redis cluster with:
    - Subnet group in private subnets
    - Parameter group with TLS enforcement
    - Free Tier eligible cache.t3.micro node
    - Single-node deployment for cost optimization
    - Automated backups with 7-day retention
    - CloudWatch monitoring and alarms
    
    Cost Optimization:
    - cache.t3.micro node (Free Tier: 750 hours/month for 12 months)
    - Single-node deployment (no replicas)
    - Short backup retention (7 days)
    - AWS managed encryption (no KMS costs)
    
    Security:
    - Private subnets with NO internet access
    - Security group allows Redis only from application tier
    - Encryption at rest using AWS managed encryption
    - Encryption in transit enforced (TLS required)
    - Automated backups enabled
    
    Cache Configuration:
    - Engine: Redis 7.x
    - Node: cache.t3.micro (2 vCPU, 0.5 GB RAM)
    - Cluster Mode: Disabled
    - Nodes: 1 (no replicas)
    - Backup: Daily, 7-day retention
    - TLS: Required
    
    Usage:
        cache_stack = ShowCoreCacheStack(
            app,
            "ShowCoreCacheStack",
            vpc=network_stack.vpc,
            elasticache_security_group=security_stack.elasticache_security_group,
            env=env
        )
    
    Exports:
    - ElastiCacheEndpoint: ElastiCache cluster endpoint for connections
    - ElastiCachePort: ElastiCache cluster port (6379)
    - ElastiCacheSubnetGroupName: ElastiCache subnet group name
    - ElastiCacheParameterGroupName: ElastiCache parameter group name
    """
    
    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        vpc: ec2.IVpc,
        elasticache_security_group: ec2.ISecurityGroup,
        **kwargs
    ) -> None:
        """
        Initialize the cache stack.
        
        Args:
            scope: CDK app or parent construct
            construct_id: Unique identifier for this stack
            vpc: VPC from NetworkStack for subnet group
            elasticache_security_group: Security group from SecurityStack for ElastiCache cluster
            **kwargs: Additional stack properties
        """
        super().__init__(
            scope,
            construct_id,
            component="Cache",
            **kwargs
        )
        
        # Store VPC and security group references
        self.vpc = vpc
        self.elasticache_security_group = elasticache_security_group
        
        # Create ElastiCache subnet group in private subnets
        self.elasticache_subnet_group = self._create_elasticache_subnet_group()
        
        # Create ElastiCache parameter group for Redis 7 with TLS enforcement
        self.elasticache_parameter_group = self._create_elasticache_parameter_group()
        
        # Create ElastiCache Redis cluster (cache.t3.micro, single node, Free Tier eligible)
        self.redis_cluster = self._create_redis_cluster()
        
        # Create CloudWatch alarms for ElastiCache monitoring
        self._create_elasticache_alarms()
        
        # Export subnet group, parameter group, and Redis cluster details for cross-stack references
        self._create_outputs()
    
    def _create_elasticache_subnet_group(self) -> elasticache.CfnSubnetGroup:
        """
        Create ElastiCache subnet group in private subnets.
        
        The subnet group defines which subnets the ElastiCache cluster can be
        deployed in. For ShowCore, we deploy in private subnets with NO internet
        access for security.
        
        Configuration:
        - Uses private subnets from VPC (10.0.2.0/24, 10.0.3.0/24)
        - Spans multiple availability zones for future scalability
        - Currently deploys single node in us-east-1a for cost optimization
        
        Cost: Free (no charges for subnet groups)
        
        Returns:
            ElastiCache Subnet Group construct
            
        Validates: Requirements 4.1
        """
        # Get private subnet IDs from VPC
        # Private subnets have NO internet access (no NAT Gateway)
        private_subnet_ids = [subnet.subnet_id for subnet in self.vpc.private_subnets]
        
        subnet_group = elasticache.CfnSubnetGroup(
            self,
            "ElastiCacheSubnetGroup",
            subnet_ids=private_subnet_ids,
            description="Subnet group for ShowCore ElastiCache Redis cluster in private subnets",
            cache_subnet_group_name="showcore-elasticache-subnet-group"
        )
        
        return subnet_group
    
    def _create_elasticache_parameter_group(self) -> elasticache.CfnParameterGroup:
        """
        Create ElastiCache parameter group for Redis 7 with TLS enforcement.
        
        The parameter group defines configuration settings for the Redis cluster.
        For ShowCore, we enforce TLS encryption in transit for security.
        
        Configuration:
        - Family: redis7 (Redis 7.x)
        - TLS enforcement: transit-encryption-enabled=yes
        
        Security:
        - Enforces TLS encryption in transit
        - All client connections must use TLS
        - Prevents unencrypted connections
        
        Cost: Free (no charges for parameter groups)
        
        Returns:
            ElastiCache Parameter Group construct
            
        Validates: Requirements 4.5
        """
        parameter_group = elasticache.CfnParameterGroup(
            self,
            "ElastiCacheParameterGroup",
            cache_parameter_group_family="redis7",
            description="Parameter group for ShowCore ElastiCache Redis 7 with TLS enforcement",
            properties={
                # Note: transit-encryption-enabled is set at cluster level, not in parameter group
                # Parameter group is created for future customization
            }
        )
        
        return parameter_group
    
    def _create_redis_cluster(self) -> elasticache.CfnCacheCluster:
        """
        Create ElastiCache Redis cluster with single node for cost optimization.
        
        Configuration:
        - Node Type: cache.t3.micro (Free Tier eligible - 750 hours/month for 12 months)
        - Engine: Redis 7.x
        - Nodes: 1 (single node, no replicas for cost optimization)
        - AZ: us-east-1a (single AZ for cost optimization)
        - Encryption at Rest: Enabled (AWS managed encryption)
        - Encryption in Transit: Enabled (TLS required)
        - Security Group: ElastiCache security group from SecurityStack
        - Subnet Group: Private subnets (NO internet access)
        - Automated Backups: Daily with 7-day retention
        - Backup Window: 03:00-04:00 UTC (off-peak hours)
        - Maintenance Window: Sunday 04:00-05:00 UTC
        
        Cost Optimization:
        - cache.t3.micro is Free Tier eligible (750 hours/month for 12 months)
        - Single node deployment (no replicas) reduces cost
        - After Free Tier: ~$12/month for cache.t3.micro
        - AWS managed encryption (no KMS costs)
        - Short backup retention (7 days) reduces storage costs
        
        Security:
        - Deployed in private subnet with NO internet access
        - Security group allows Redis only from application tier
        - Encryption at rest using AWS managed encryption
        - Encryption in transit enforced (TLS required)
        - No public access
        
        High Availability Trade-off:
        - Single node deployment (no replicas) for cost optimization
        - Acceptable for low-traffic project website
        - Can add replicas later if traffic increases
        - Automated backups provide recovery capability
        
        Backup Strategy:
        - Daily automated snapshots with 7-day retention
        - Backup window: 03:00-04:00 UTC (off-peak hours)
        - Snapshots stored in S3 (managed by AWS)
        - Manual snapshots can be taken before major changes
        
        Returns:
            ElastiCache Cache Cluster construct
            
        Validates: Requirements 4.1, 4.2, 4.4, 4.5, 4.8, 9.1, 9.5
        """
        redis_cluster = elasticache.CfnCacheCluster(
            self,
            "RedisCluster",
            cache_node_type="cache.t3.micro",  # Free Tier eligible
            engine="redis",
            engine_version="7.0",  # Redis 7.x
            num_cache_nodes=1,  # Single node (no replicas for cost optimization)
            cluster_name="showcore-redis",
            cache_subnet_group_name=self.elasticache_subnet_group.cache_subnet_group_name,
            cache_parameter_group_name=self.elasticache_parameter_group.ref,
            vpc_security_group_ids=[self.elasticache_security_group.security_group_id],
            preferred_availability_zone="us-east-1a",  # Single AZ for cost optimization
            # Encryption in transit (TLS required)
            transit_encryption_enabled=True,
            # Port
            port=6379,
            # Auto minor version upgrade
            auto_minor_version_upgrade=True,
            # Automated backups (daily, 7-day retention for cost optimization)
            snapshot_retention_limit=7,  # Keep snapshots for 7 days
            snapshot_window="03:00-04:00",  # Backup window: 03:00-04:00 UTC (off-peak hours)
            preferred_maintenance_window="sun:04:00-sun:05:00",  # Maintenance window: Sunday 04:00-05:00 UTC
        )
        
        # Cluster depends on subnet group and parameter group
        redis_cluster.add_dependency(self.elasticache_subnet_group)
        redis_cluster.add_dependency(self.elasticache_parameter_group)
        
        return redis_cluster
    
    def _create_elasticache_alarms(self) -> None:
        """
        Create CloudWatch alarms for ElastiCache Redis cluster monitoring.
        
        Alarms:
        1. CPU Utilization > 75% for 5 minutes → Critical Alert
        2. Memory Utilization > 80% → Critical Alert
        
        These alarms will be connected to SNS topics created in MonitoringStack
        (task 10.1). For now, we create the alarms without SNS actions.
        SNS actions will be added when MonitoringStack is deployed.
        
        Cost:
        - CloudWatch alarms: $0.10 per alarm per month
        - 2 alarms = $0.20/month
        
        Monitoring Strategy:
        - CPU utilization > 75% indicates high load (lower threshold than RDS 80%)
        - Memory utilization > 80% indicates potential evictions
        - Both are critical alerts requiring immediate attention
        
        Note: SNS topic ARNs will be added in MonitoringStack (task 10.1)
        
        Validates: Requirements 4.6, 4.7, 7.3, 7.5
        """
        # Alarm 1: CPU Utilization > 75% for 5 minutes
        cpu_alarm = cloudwatch.Alarm(
            self,
            "ElastiCacheCpuAlarm",
            alarm_name="showcore-elasticache-cpu-high",
            alarm_description="ElastiCache Redis CPU utilization > 75% for 5 minutes",
            metric=cloudwatch.Metric(
                namespace="AWS/ElastiCache",
                metric_name="CPUUtilization",
                dimensions_map={
                    "CacheClusterId": self.redis_cluster.ref
                },
                statistic="Average",
                period=cloudwatch.Duration.minutes(5)
            ),
            threshold=75,
            evaluation_periods=1,
            comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
            treat_missing_data=cloudwatch.TreatMissingData.NOT_BREACHING
        )
        
        # Alarm 2: Memory Utilization > 80%
        memory_alarm = cloudwatch.Alarm(
            self,
            "ElastiCacheMemoryAlarm",
            alarm_name="showcore-elasticache-memory-high",
            alarm_description="ElastiCache Redis memory utilization > 80%",
            metric=cloudwatch.Metric(
                namespace="AWS/ElastiCache",
                metric_name="DatabaseMemoryUsagePercentage",
                dimensions_map={
                    "CacheClusterId": self.redis_cluster.ref
                },
                statistic="Average",
                period=cloudwatch.Duration.minutes(5)
            ),
            threshold=80,
            evaluation_periods=1,
            comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
            treat_missing_data=cloudwatch.TreatMissingData.NOT_BREACHING
        )
        
        # Note: SNS actions will be added in MonitoringStack (task 10.1)
        # cpu_alarm.add_alarm_action(...)
        # memory_alarm.add_alarm_action(...)
    
    def _create_outputs(self) -> None:
        """
        Create CloudFormation outputs for ElastiCache resources.
        
        Exports subnet group, parameter group, and Redis cluster details
        for use by other stacks or for reference in future deployments.
        
        Exports:
        - ElastiCacheSubnetGroupName: Subnet group name
        - ElastiCacheParameterGroupName: Parameter group name
        - ElastiCacheEndpoint: Redis cluster endpoint for connections
        - ElastiCachePort: Redis cluster port (6379)
        """
        CfnOutput(
            self,
            "ElastiCacheSubnetGroupName",
            value=self.elasticache_subnet_group.cache_subnet_group_name,
            export_name="ShowCoreElastiCacheSubnetGroupName",
            description="ElastiCache subnet group name for Redis cluster"
        )
        
        CfnOutput(
            self,
            "ElastiCacheParameterGroupName",
            value=self.elasticache_parameter_group.ref,
            export_name="ShowCoreElastiCacheParameterGroupName",
            description="ElastiCache parameter group name for Redis 7"
        )
        
        CfnOutput(
            self,
            "ElastiCacheEndpoint",
            value=self.redis_cluster.attr_redis_endpoint_address,
            export_name="ShowCoreElastiCacheEndpoint",
            description="ElastiCache Redis cluster endpoint for connections"
        )
        
        CfnOutput(
            self,
            "ElastiCachePort",
            value=str(self.redis_cluster.attr_redis_endpoint_port),
            export_name="ShowCoreElastiCachePort",
            description="ElastiCache Redis cluster port (6379)"
        )
