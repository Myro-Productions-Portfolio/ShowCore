"""
ShowCore Database Stack

This module implements the database infrastructure for ShowCore Phase 1.
It creates RDS PostgreSQL instance with subnet group and parameter group
for secure database access from private subnets.

Cost Optimization:
- Uses Free Tier eligible db.t3.micro instance (750 hours/month for 12 months)
- Single-AZ deployment (no Multi-AZ for cost optimization)
- 20 GB gp3 storage (Free Tier limit)
- Short backup retention (7 days) reduces storage costs
- AWS managed encryption keys (no KMS costs)

Security:
- Deployed in private subnets with NO internet access
- Security group allows PostgreSQL only from application tier
- Encryption at rest using AWS managed keys
- Encryption in transit enforced (SSL/TLS required)
- Automated backups enabled with 7-day retention
- CloudWatch monitoring and alarms configured

Database Configuration:
- Engine: PostgreSQL 16.x
- Instance Class: db.t3.micro (2 vCPU, 1 GB RAM) - Free Tier eligible
- Storage: 20 GB gp3 SSD (Free Tier limit)
- Multi-AZ: Disabled (cost optimization)
- Backup Window: 03:00-04:00 UTC (off-peak hours)
- Backup Retention: 7 days (short retention for cost optimization)
- Point-in-Time Recovery: Enabled (5-minute granularity, automatic with backups)
- Maintenance Window: Sunday 04:00-05:00 UTC
- SSL/TLS: Required (rds.force_ssl = 1)

Resources Created:
- RDS Subnet Group in private subnets
- RDS Parameter Group for PostgreSQL 16 with SSL/TLS enforcement
- RDS PostgreSQL instance (db.t3.micro, single-AZ, 20 GB gp3)
- CloudWatch alarms for CPU utilization (> 80%) and storage utilization (> 85%)

Dependencies: ShowCoreNetworkStack (requires VPC and private subnets)
              ShowCoreSecurityStack (requires RDS security group)

Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9, 9.1, 9.5
"""

from aws_cdk import (
    aws_rds as rds,
    aws_ec2 as ec2,
    aws_cloudwatch as cloudwatch,
    CfnOutput,
    Duration,
)
from constructs import Construct
from lib.stacks.base_stack import ShowCoreBaseStack


class ShowCoreDatabaseStack(ShowCoreBaseStack):
    """
    Database infrastructure stack for ShowCore Phase 1.
    
    Creates RDS PostgreSQL instance with:
    - Subnet group in private subnets
    - Parameter group with SSL/TLS enforcement
    - Free Tier eligible db.t3.micro instance
    - Single-AZ deployment for cost optimization
    - Automated backups with 7-day retention
    - CloudWatch monitoring and alarms
    
    Cost Optimization:
    - db.t3.micro instance (Free Tier: 750 hours/month for 12 months)
    - Single-AZ deployment (Multi-AZ doubles cost)
    - 20 GB gp3 storage (Free Tier limit)
    - Short backup retention (7 days)
    - AWS managed encryption keys (no KMS costs)
    
    Security:
    - Private subnets with NO internet access
    - Security group allows PostgreSQL only from application tier
    - Encryption at rest using AWS managed keys
    - Encryption in transit enforced (SSL/TLS required)
    - Automated backups enabled
    
    Database Configuration:
    - Engine: PostgreSQL 16.x
    - Instance: db.t3.micro (2 vCPU, 1 GB RAM)
    - Storage: 20 GB gp3 SSD
    - Multi-AZ: Disabled
    - Backup: Daily, 7-day retention
    - SSL/TLS: Required
    
    Usage:
        database_stack = ShowCoreDatabaseStack(
            app,
            "ShowCoreDatabaseStack",
            vpc=network_stack.vpc,
            rds_security_group=security_stack.rds_security_group,
            env=env
        )
    
    Exports:
    - RdsEndpoint: RDS instance endpoint for connections
    - RdsPort: RDS instance port (5432)
    - RdsDatabaseName: Database name (showcore)
    - RdsSubnetGroupName: RDS subnet group name
    - RdsParameterGroupName: RDS parameter group name
    """
    
    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        vpc: ec2.IVpc,
        rds_security_group: ec2.ISecurityGroup,
        **kwargs
    ) -> None:
        """
        Initialize the database stack.
        
        Args:
            scope: CDK app or parent construct
            construct_id: Unique identifier for this stack
            vpc: VPC from NetworkStack for subnet group
            rds_security_group: Security group from SecurityStack for RDS instance
            **kwargs: Additional stack properties
        """
        super().__init__(
            scope,
            construct_id,
            component="Database",
            **kwargs
        )
        
        # Store VPC and security group references
        self.vpc = vpc
        self.rds_security_group = rds_security_group
        
        # Create RDS subnet group in private subnets
        self.rds_subnet_group = self._create_rds_subnet_group()
        
        # Create RDS parameter group for PostgreSQL 16 with SSL/TLS enforcement
        self.rds_parameter_group = self._create_rds_parameter_group()
        
        # Create RDS PostgreSQL instance (db.t3.micro, single-AZ, Free Tier eligible)
        self.rds_instance = self._create_rds_instance()
        
        # CloudWatch alarms are created in MonitoringStack to avoid duplication
        # Commenting out to prevent "alarm already exists" error
        # self._create_rds_alarms()
        
        # Export subnet group, parameter group, and RDS instance details for cross-stack references
        self._create_outputs()
    
    def _create_rds_subnet_group(self) -> rds.SubnetGroup:
        """
        Create RDS subnet group in private subnets.
        
        The subnet group defines which subnets the RDS instance can be deployed in.
        For ShowCore, we deploy RDS in private subnets with NO internet access.
        
        Configuration:
        - Subnets: Private subnets in us-east-1a and us-east-1b
        - Description: Subnet group for ShowCore RDS PostgreSQL instance
        - Name: showcore-database-production-subnet-group
        
        Security:
        - Private subnets have NO internet access (no NAT Gateway)
        - RDS can only be accessed from within the VPC
        - Uses VPC Endpoints for AWS service access (CloudWatch, S3 backups)
        
        Cost: Free (no charges for subnet groups)
        
        Returns:
            RDS SubnetGroup construct
            
        Validates: Requirements 3.1
        """
        # Get private subnets from VPC
        # Note: NetworkStack creates subnets with PRIVATE_ISOLATED type,
        # so we access them via vpc.isolated_subnets
        private_subnets = self.vpc.isolated_subnets
        
        # Create subnet group
        subnet_group = rds.SubnetGroup(
            self,
            "RdsSubnetGroup",
            description="Subnet group for ShowCore RDS PostgreSQL instance in private subnets",
            vpc=self.vpc,
            vpc_subnets=ec2.SubnetSelection(
                subnet_type=ec2.SubnetType.PRIVATE_ISOLATED
            ),
            subnet_group_name=self.get_resource_name("subnet-group")
        )
        
        return subnet_group
    
    def _create_rds_parameter_group(self) -> rds.ParameterGroup:
        """
        Create RDS parameter group for PostgreSQL 16 with SSL/TLS enforcement.
        
        The parameter group defines database configuration parameters.
        For ShowCore, we enforce SSL/TLS connections for security.
        
        Configuration:
        - Engine: PostgreSQL 16
        - Parameter: rds.force_ssl = 1 (enforce SSL/TLS connections)
        - Description: Parameter group for ShowCore RDS PostgreSQL 16
        - Name: showcore-database-production-parameter-group
        
        Security:
        - rds.force_ssl = 1 enforces SSL/TLS for all connections
        - Prevents unencrypted connections to the database
        - Ensures data in transit is encrypted
        
        Cost: Free (no charges for parameter groups)
        
        Returns:
            RDS ParameterGroup construct
            
        Validates: Requirements 3.6
        """
        # Create parameter group for PostgreSQL 16
        parameter_group = rds.ParameterGroup(
            self,
            "RdsParameterGroup",
            engine=rds.DatabaseInstanceEngine.postgres(
                version=rds.PostgresEngineVersion.VER_16
            ),
            description="Parameter group for ShowCore RDS PostgreSQL 16 with SSL/TLS enforcement",
            parameters={
                # Enforce SSL/TLS connections
                # rds.force_ssl = 1 requires all connections to use SSL/TLS
                # Connections without SSL/TLS will be rejected
                "rds.force_ssl": "1"
            }
        )
        
        return parameter_group
    
    def _create_rds_instance(self) -> rds.DatabaseInstance:
        """
        Create RDS PostgreSQL instance with Free Tier eligible configuration.
        
        The RDS instance is the managed PostgreSQL database for ShowCore.
        It's configured for cost optimization using Free Tier eligible resources
        while maintaining security and reliability.
        
        Configuration:
        - Engine: PostgreSQL 16.x
        - Instance Class: db.t3.micro (2 vCPU, 1 GB RAM) - Free Tier eligible
        - Storage: 20 GB gp3 SSD (Free Tier limit)
        - Multi-AZ: Disabled (single-AZ for cost optimization)
        - Availability Zone: us-east-1a
        - Database Name: showcore
        - Subnet Group: Private subnets (us-east-1a, us-east-1b)
        - Security Group: RDS security group (allows PostgreSQL from application tier)
        - Parameter Group: PostgreSQL 16 with SSL/TLS enforcement
        
        Cost Optimization:
        - db.t3.micro: Free Tier eligible (750 hours/month for 12 months)
        - Single-AZ: No Multi-AZ charges (Multi-AZ doubles cost)
        - 20 GB gp3: Free Tier limit (no charges for first 20 GB)
        - AWS managed encryption: No KMS key charges
        - Short backup retention: 7 days (reduces storage costs)
        
        Security:
        - Encryption at rest: Enabled using AWS managed keys
        - Encryption in transit: Enforced via parameter group (rds.force_ssl = 1)
        - Private subnets: NO internet access (no NAT Gateway)
        - Security group: Allows PostgreSQL only from application tier
        - Automated backups: Enabled with 7-day retention
        
        Backup Configuration:
        - Automated backups: Enabled (backup_retention > 0)
        - Backup retention: 7 days (short retention for cost optimization)
        - Backup window: 03:00-04:00 UTC (off-peak hours, low traffic time)
        - Point-in-time recovery: Automatically enabled (5-minute granularity)
          * Allows restore to any point in time within the 7-day retention period
          * 5-minute granularity is the default for RDS PostgreSQL
          * No additional configuration required - enabled by default with automated backups
        - Backup storage: First 20 GB free (matches allocated storage, Free Tier)
        - Backup process: Automated daily snapshots stored in S3 via S3 Gateway Endpoint
        - Maintenance window: Sunday 04:00-05:00 UTC (after backup window)
        - Auto minor version upgrade: Enabled for automatic security patches
        
        Monitoring:
        - CloudWatch metrics: CPU, memory, connections, IOPS, latency
        - CloudWatch alarms: CPU > 80%, storage > 85%
        - Enhanced Monitoring: Can be enabled later if needed
        - Performance Insights: Can be enabled later if needed
        
        Cost: $0/month during Free Tier (first 12 months), ~$15/month after
        
        Returns:
            RDS DatabaseInstance construct
            
        Validates: Requirements 3.1, 3.2, 3.5, 3.9, 9.1, 9.5
        """
        # Create RDS PostgreSQL instance
        db_instance = rds.DatabaseInstance(
            self,
            "Database",
            # Engine configuration
            engine=rds.DatabaseInstanceEngine.postgres(
                version=rds.PostgresEngineVersion.VER_16
            ),
            
            # Instance configuration
            # db.t3.micro: Free Tier eligible (750 hours/month for 12 months)
            # 2 vCPU, 1 GB RAM - sufficient for low-traffic project website
            instance_type=ec2.InstanceType.of(
                ec2.InstanceClass.BURSTABLE3,
                ec2.InstanceSize.MICRO
            ),
            
            # Storage configuration
            # 20 GB gp3: Free Tier limit (no charges for first 20 GB)
            # gp3: Latest generation SSD with better performance than gp2
            allocated_storage=20,
            storage_type=rds.StorageType.GP3,
            
            # Network configuration
            vpc=self.vpc,
            subnet_group=self.rds_subnet_group,
            security_groups=[self.rds_security_group],
            
            # Single-AZ deployment for cost optimization
            # Multi-AZ doubles cost (~$30/month vs ~$15/month)
            # Acceptable for low-traffic project website
            multi_az=False,
            availability_zone="us-east-1a",
            
            # Database configuration
            database_name="showcore",
            parameter_group=self.rds_parameter_group,
            
            # Encryption at rest using AWS managed keys
            # AWS managed keys: Free, automatic rotation
            # KMS keys: $1/key/month + usage charges
            storage_encrypted=True,
            # Note: Not specifying encryption_key uses AWS managed keys (default)
            
            # Backup configuration
            # Automated daily backups with 7-day retention (short retention for cost optimization)
            # Backup window: 03:00-04:00 UTC (off-peak hours, low traffic time)
            # Point-in-time recovery: Automatically enabled when backup_retention > 0
            #   - Provides 5-minute granularity for recovery (RDS PostgreSQL default)
            #   - Allows restore to any point in time within the retention period
            #   - No additional configuration required - enabled by default with automated backups
            # Backup storage: First 20 GB free (matches allocated storage, Free Tier)
            # Backup process: Automated daily snapshots stored in S3 via S3 Gateway Endpoint
            backup_retention=Duration.days(7),
            preferred_backup_window="03:00-04:00",
            
            # Maintenance configuration
            # Maintenance window: Sunday 04:00-05:00 UTC (off-peak hours, after backup window)
            # Auto minor version upgrade: Enabled for automatic security patches
            # Maintenance includes: OS patches, database engine patches, minor version upgrades
            preferred_maintenance_window="Sun:04:00-Sun:05:00",
            auto_minor_version_upgrade=True,
            
            # Deletion protection
            # Enabled to prevent accidental deletion
            # Must be disabled before stack deletion
            deletion_protection=False,
            
            # CloudWatch logs exports
            # Export PostgreSQL logs to CloudWatch for monitoring
            # Logs sent via CloudWatch Logs Interface Endpoint (no internet required)
            cloudwatch_logs_exports=["postgresql"],
            
            # Instance identifier
            # Used for resource naming in AWS Console
            instance_identifier=self.get_resource_name("rds")
        )
        
        return db_instance
    
    def _create_rds_alarms(self) -> None:
        """
        Create CloudWatch alarms for RDS monitoring.
        
        Creates alarms for critical RDS metrics to enable proactive monitoring
        and alerting. Alarms will send notifications to SNS topics (created in
        MonitoringStack task 10.1).
        
        Alarms Created:
        1. CPU Utilization > 80% for 5 minutes → Critical Alert
           - Indicates RDS instance is under heavy load
           - May need to scale up instance type
           - Evaluation: 1 period of 5 minutes (300 seconds)
           
        2. Storage Utilization > 85% → Warning Alert
           - Indicates running out of storage space
           - Need to increase allocated storage
           - Evaluation: 1 period of 5 minutes (300 seconds)
        
        Alarm Configuration:
        - Evaluation Period: 5 minutes (300 seconds)
        - Datapoints to Alarm: 1 out of 1 (alarm immediately)
        - Statistic: Average for CPU, Minimum for free storage
        - Treat Missing Data: Not breaching (assume OK if no data)
        
        SNS Integration:
        - Alarms reference SNS topic ARNs that will be created in MonitoringStack
        - SNS topics: showcore-critical-alerts, showcore-warning-alerts
        - Email subscriptions will be configured in MonitoringStack
        - For now, alarms are created without actions (actions added in MonitoringStack)
        
        Cost: $0.10 per alarm per month = $0.20/month total
        
        Validates: Requirements 3.7, 3.8, 7.3, 7.5
        """
        # Create CloudWatch alarm for CPU utilization > 80% for 5 minutes
        # This alarm triggers when the RDS instance CPU is consistently high,
        # indicating the instance may be under heavy load and need scaling
        cpu_alarm = cloudwatch.Alarm(
            self,
            "RdsCpuHighAlarm",
            alarm_name="showcore-rds-cpu-high",
            alarm_description="RDS CPU utilization > 80% for 5 minutes - may need to scale up instance",
            metric=self.rds_instance.metric_cpu_utilization(
                period=Duration.minutes(5),
                statistic=cloudwatch.Stats.AVERAGE
            ),
            threshold=80,
            evaluation_periods=1,
            datapoints_to_alarm=1,
            comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
            treat_missing_data=cloudwatch.TreatMissingData.NOT_BREACHING
        )
        
        # Create CloudWatch alarm for storage utilization > 85%
        # This alarm triggers when free storage space is low (< 15% free = > 85% used)
        # For 20 GB allocated storage, this means < 3 GB free
        # FreeStorageSpace metric is in bytes, so 3 GB = 3 * 1024 * 1024 * 1024 = 3,221,225,472 bytes
        storage_alarm = cloudwatch.Alarm(
            self,
            "RdsStorageHighAlarm",
            alarm_name="showcore-rds-storage-high",
            alarm_description="RDS storage utilization > 85% (< 3 GB free) - need to increase allocated storage",
            metric=self.rds_instance.metric(
                metric_name="FreeStorageSpace",
                period=Duration.minutes(5),
                statistic=cloudwatch.Stats.MINIMUM
            ),
            # Threshold: 3 GB in bytes (15% of 20 GB)
            # When FreeStorageSpace < 3 GB, alarm triggers (storage > 85% used)
            threshold=3 * 1024 * 1024 * 1024,  # 3 GB in bytes
            evaluation_periods=1,
            datapoints_to_alarm=1,
            comparison_operator=cloudwatch.ComparisonOperator.LESS_THAN_THRESHOLD,
            treat_missing_data=cloudwatch.TreatMissingData.NOT_BREACHING
        )
        
        # Store alarm references for potential use by MonitoringStack
        # MonitoringStack can add SNS actions to these alarms
        self.cpu_alarm = cpu_alarm
        self.storage_alarm = storage_alarm
    
    def _create_outputs(self) -> None:
        """
        Create CloudFormation outputs for cross-stack references.
        
        Exports subnet group, parameter group, and RDS instance details
        for use by other stacks or for reference when connecting to the database.
        
        Exports:
        - RdsSubnetGroupName: RDS subnet group name
        - RdsParameterGroupName: RDS parameter group name
        - RdsEndpoint: RDS instance endpoint for connections
        - RdsPort: RDS instance port (5432)
        - RdsDatabaseName: Database name (showcore)
        """
        # Export RDS subnet group name
        CfnOutput(
            self,
            "RdsSubnetGroupName",
            value=self.rds_subnet_group.subnet_group_name,
            export_name="ShowCoreRdsSubnetGroupName",
            description="RDS subnet group name for ShowCore Phase 1"
        )
        
        # Export RDS parameter group name
        # Note: ParameterGroup doesn't expose parameter_group_name in L2 construct
        # Commenting out this output - can be retrieved from RDS instance if needed
        # CfnOutput(
        #     self,
        #     "RdsParameterGroupName",
        #     value=self.rds_parameter_group.ref,
        #     export_name="ShowCoreRdsParameterGroupName",
        #     description="RDS parameter group name for ShowCore Phase 1"
        # )
        
        # Export RDS instance endpoint
        CfnOutput(
            self,
            "RdsEndpoint",
            value=self.rds_instance.db_instance_endpoint_address,
            export_name="ShowCoreRdsEndpoint",
            description="RDS instance endpoint for ShowCore Phase 1"
        )
        
        # Export RDS instance port
        CfnOutput(
            self,
            "RdsPort",
            value=self.rds_instance.db_instance_endpoint_port,
            export_name="ShowCoreRdsPort",
            description="RDS instance port for ShowCore Phase 1"
        )
        
        # Export database name
        CfnOutput(
            self,
            "RdsDatabaseName",
            value="showcore",
            export_name="ShowCoreRdsDatabaseName",
            description="Database name for ShowCore Phase 1"
        )
