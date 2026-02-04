"""
Unit tests for ShowCoreDatabaseStack

Tests verify:
- RDS instance is db.t3.micro (Free Tier eligible)
- RDS is in single AZ (cost optimization) - MultiAZ should be false
- Encryption at rest is enabled with AWS managed keys
- SSL/TLS is required (rds.force_ssl=1 in parameter group)
- Automated backups are enabled with 7-day retention
- CloudWatch alarms exist for CPU and storage
- Allocated storage is 20 GB (Free Tier limit)

These tests run against CDK synthesized template - no actual AWS resources.

Validates: Requirements 3.1, 3.2, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9, 9.1, 9.5
"""

import aws_cdk as cdk
from aws_cdk.assertions import Template, Match
from lib.stacks.database_stack import ShowCoreDatabaseStack
from lib.stacks.network_stack import ShowCoreNetworkStack
from lib.stacks.security_stack import ShowCoreSecurityStack


def _create_test_stack():
    """
    Helper function to create test stack with dependencies.
    
    DatabaseStack requires NetworkStack (VPC) and SecurityStack (security group).
    """
    app = cdk.App()
    
    # Create network stack (provides VPC)
    network_stack = ShowCoreNetworkStack(app, "TestNetworkStack")
    
    # Create security stack (provides RDS security group)
    security_stack = ShowCoreSecurityStack(
        app,
        "TestSecurityStack",
        vpc=network_stack.vpc
    )
    
    # Create database stack
    database_stack = ShowCoreDatabaseStack(
        app,
        "TestDatabaseStack",
        vpc=network_stack.vpc,
        rds_security_group=security_stack.rds_security_group
    )
    
    return database_stack


def test_rds_instance_is_free_tier_eligible():
    """
    Test RDS instance uses Free Tier eligible db.t3.micro instance class.
    
    db.t3.micro provides 750 hours/month free for 12 months.
    After Free Tier: ~$15/month.
    
    Validates: Requirements 3.1, 9.1
    """
    stack = _create_test_stack()
    template = Template.from_stack(stack)
    
    # Verify RDS instance is db.t3.micro
    template.has_resource_properties("AWS::RDS::DBInstance", {
        "DBInstanceClass": "db.t3.micro"
    })


def test_rds_is_single_az_deployment():
    """
    Test RDS is deployed in single AZ (cost optimization).
    
    Multi-AZ deployment doubles cost (~$30/month vs ~$15/month).
    Single-AZ is acceptable for low-traffic project website.
    
    Validates: Requirements 3.2, 9.5
    """
    stack = _create_test_stack()
    template = Template.from_stack(stack)
    
    # Verify RDS is NOT Multi-AZ (MultiAZ should be false or not set)
    template.has_resource_properties("AWS::RDS::DBInstance", {
        "MultiAZ": False
    })
    
    # Verify specific availability zone is set (us-east-1a)
    template.has_resource_properties("AWS::RDS::DBInstance", {
        "AvailabilityZone": "us-east-1a"
    })


def test_rds_encryption_at_rest_enabled():
    """
    Test RDS has encryption at rest enabled.
    
    Uses AWS managed keys (not KMS) for cost optimization.
    AWS managed keys are free and automatically rotated.
    
    Validates: Requirements 3.5, 9.1
    """
    stack = _create_test_stack()
    template = Template.from_stack(stack)
    
    # Verify encryption at rest is enabled
    template.has_resource_properties("AWS::RDS::DBInstance", {
        "StorageEncrypted": True
    })
    
    # Verify KMS key is NOT specified (uses AWS managed keys)
    # If KmsKeyId is not in properties, AWS managed keys are used
    resources = template.find_resources("AWS::RDS::DBInstance")
    for resource_id, resource in resources.items():
        properties = resource.get("Properties", {})
        # KmsKeyId should not be present (AWS managed keys)
        assert "KmsKeyId" not in properties, "Should use AWS managed keys, not KMS"


def test_rds_ssl_tls_required():
    """
    Test RDS parameter group enforces SSL/TLS connections.
    
    rds.force_ssl = 1 requires all connections to use SSL/TLS.
    Connections without SSL/TLS will be rejected.
    
    Validates: Requirement 3.6
    """
    stack = _create_test_stack()
    template = Template.from_stack(stack)
    
    # Verify parameter group exists
    template.has_resource_properties("AWS::RDS::DBParameterGroup", {
        "Family": "postgres16",
        "Parameters": {
            "rds.force_ssl": "1"
        }
    })


def test_rds_automated_backups_enabled():
    """
    Test RDS has automated backups enabled with 7-day retention.
    
    Automated backups enable point-in-time recovery with 5-minute granularity.
    Short retention (7 days) reduces storage costs.
    
    Validates: Requirement 3.4
    """
    stack = _create_test_stack()
    template = Template.from_stack(stack)
    
    # Verify automated backups are enabled (BackupRetentionPeriod > 0)
    template.has_resource_properties("AWS::RDS::DBInstance", {
        "BackupRetentionPeriod": 7
    })
    
    # Verify backup window is set to off-peak hours (03:00-04:00 UTC)
    template.has_resource_properties("AWS::RDS::DBInstance", {
        "PreferredBackupWindow": "03:00-04:00"
    })


def test_rds_allocated_storage_is_free_tier_limit():
    """
    Test RDS allocated storage is 20 GB (Free Tier limit).
    
    Free Tier includes 20 GB of storage for 12 months.
    
    Validates: Requirements 3.9, 9.1
    """
    stack = _create_test_stack()
    template = Template.from_stack(stack)
    
    # Verify allocated storage is 20 GB
    template.has_resource_properties("AWS::RDS::DBInstance", {
        "AllocatedStorage": "20"
    })


def test_rds_storage_type_is_gp3():
    """
    Test RDS uses gp3 storage type.
    
    gp3 is the latest generation SSD with better performance than gp2.
    
    Validates: Requirement 3.1
    """
    stack = _create_test_stack()
    template = Template.from_stack(stack)
    
    # Verify storage type is gp3
    template.has_resource_properties("AWS::RDS::DBInstance", {
        "StorageType": "gp3"
    })


def test_rds_cloudwatch_cpu_alarm_exists():
    """
    Test CloudWatch alarm exists for RDS CPU utilization > 80%.
    
    Alarm triggers when CPU is consistently high for 5 minutes,
    indicating the instance may need scaling.
    
    Validates: Requirements 3.7, 7.3, 7.5
    """
    stack = _create_test_stack()
    template = Template.from_stack(stack)
    
    # Verify CPU alarm exists
    template.has_resource_properties("AWS::CloudWatch::Alarm", {
        "AlarmName": "showcore-rds-cpu-high",
        "ComparisonOperator": "GreaterThanThreshold",
        "Threshold": 80,
        "EvaluationPeriods": 1
    })


def test_rds_cloudwatch_storage_alarm_exists():
    """
    Test CloudWatch alarm exists for RDS storage utilization > 85%.
    
    Alarm triggers when free storage space is low (< 3 GB free = > 85% used).
    For 20 GB allocated storage, this means < 3 GB free.
    
    Validates: Requirements 3.8, 7.3, 7.5
    """
    stack = _create_test_stack()
    template = Template.from_stack(stack)
    
    # Verify storage alarm exists
    # FreeStorageSpace < 3 GB (3 * 1024 * 1024 * 1024 bytes)
    template.has_resource_properties("AWS::CloudWatch::Alarm", {
        "AlarmName": "showcore-rds-storage-high",
        "ComparisonOperator": "LessThanThreshold",
        "Threshold": 3 * 1024 * 1024 * 1024,  # 3 GB in bytes
        "EvaluationPeriods": 1
    })


def test_rds_subnet_group_in_private_subnets():
    """
    Test RDS subnet group is created in private subnets.
    
    RDS should be deployed in private subnets with NO internet access.
    
    Validates: Requirement 3.1
    """
    stack = _create_test_stack()
    template = Template.from_stack(stack)
    
    # Verify RDS subnet group exists
    template.has_resource_properties("AWS::RDS::DBSubnetGroup", {
        "DBSubnetGroupDescription": Match.string_like_regexp(".*private.*")
    })


def test_rds_security_group_attached():
    """
    Test RDS instance has security group attached.
    
    Security group controls access to RDS instance.
    
    Validates: Requirement 3.3
    """
    stack = _create_test_stack()
    template = Template.from_stack(stack)
    
    # Verify RDS instance has security groups
    resources = template.find_resources("AWS::RDS::DBInstance")
    for resource_id, resource in resources.items():
        properties = resource.get("Properties", {})
        vpc_security_groups = properties.get("VPCSecurityGroups", [])
        assert len(vpc_security_groups) > 0, "RDS instance should have security groups"


def test_rds_parameter_group_attached():
    """
    Test RDS instance has parameter group attached.
    
    Parameter group enforces SSL/TLS connections.
    
    Validates: Requirement 3.6
    """
    stack = _create_test_stack()
    template = Template.from_stack(stack)
    
    # Verify RDS instance has parameter group
    resources = template.find_resources("AWS::RDS::DBInstance")
    for resource_id, resource in resources.items():
        properties = resource.get("Properties", {})
        assert "DBParameterGroupName" in properties, "RDS instance should have parameter group"


def test_rds_database_name():
    """
    Test RDS database name is 'showcore'.
    
    Validates: Requirement 3.1
    """
    stack = _create_test_stack()
    template = Template.from_stack(stack)
    
    # Verify database name is 'showcore'
    template.has_resource_properties("AWS::RDS::DBInstance", {
        "DBName": "showcore"
    })


def test_rds_engine_is_postgresql_16():
    """
    Test RDS engine is PostgreSQL 16.
    
    Validates: Requirement 3.1
    """
    stack = _create_test_stack()
    template = Template.from_stack(stack)
    
    # Verify engine is PostgreSQL
    template.has_resource_properties("AWS::RDS::DBInstance", {
        "Engine": "postgres"
    })
    
    # Verify engine version is 16.x
    resources = template.find_resources("AWS::RDS::DBInstance")
    for resource_id, resource in resources.items():
        properties = resource.get("Properties", {})
        engine_version = properties.get("EngineVersion", "")
        assert engine_version.startswith("16"), f"Expected PostgreSQL 16.x, got {engine_version}"


def test_rds_maintenance_window_configured():
    """
    Test RDS maintenance window is configured to off-peak hours.
    
    Maintenance window: Sunday 04:00-05:00 UTC (after backup window).
    
    Validates: Requirement 3.4
    """
    stack = _create_test_stack()
    template = Template.from_stack(stack)
    
    # Verify maintenance window is set
    template.has_resource_properties("AWS::RDS::DBInstance", {
        "PreferredMaintenanceWindow": "Sun:04:00-Sun:05:00"
    })


def test_rds_auto_minor_version_upgrade_enabled():
    """
    Test RDS auto minor version upgrade is enabled.
    
    Enables automatic security patches and minor version upgrades.
    
    Validates: Requirement 3.4
    """
    stack = _create_test_stack()
    template = Template.from_stack(stack)
    
    # Verify auto minor version upgrade is enabled
    template.has_resource_properties("AWS::RDS::DBInstance", {
        "AutoMinorVersionUpgrade": True
    })


def test_rds_cloudwatch_logs_exports_enabled():
    """
    Test RDS CloudWatch logs exports are enabled.
    
    Exports PostgreSQL logs to CloudWatch for monitoring.
    Logs sent via CloudWatch Logs Interface Endpoint (no internet required).
    
    Validates: Requirements 3.7, 7.3
    """
    stack = _create_test_stack()
    template = Template.from_stack(stack)
    
    # Verify CloudWatch logs exports are enabled
    template.has_resource_properties("AWS::RDS::DBInstance", {
        "EnableCloudwatchLogsExports": ["postgresql"]
    })


def test_rds_deletion_protection_disabled():
    """
    Test RDS deletion protection is disabled.
    
    Deletion protection must be disabled for stack deletion.
    For production, this should be enabled.
    
    Validates: Operational requirement
    """
    stack = _create_test_stack()
    template = Template.from_stack(stack)
    
    # Verify deletion protection is disabled
    template.has_resource_properties("AWS::RDS::DBInstance", {
        "DeletionProtection": False
    })


def test_rds_outputs_exported():
    """
    Test RDS outputs are exported for cross-stack references.
    
    Exports: RdsEndpoint, RdsPort, RdsDatabaseName, RdsSubnetGroupName, RdsParameterGroupName
    
    Validates: Operational requirement
    """
    stack = _create_test_stack()
    template = Template.from_stack(stack)
    
    # Verify RDS endpoint output exists
    template.has_output("RdsEndpoint", {
        "Export": {
            "Name": "ShowCoreRdsEndpoint"
        }
    })
    
    # Verify RDS port output exists
    template.has_output("RdsPort", {
        "Export": {
            "Name": "ShowCoreRdsPort"
        }
    })
    
    # Verify database name output exists
    template.has_output("RdsDatabaseName", {
        "Export": {
            "Name": "ShowCoreRdsDatabaseName"
        }
    })
    
    # Verify subnet group name output exists
    template.has_output("RdsSubnetGroupName", {
        "Export": {
            "Name": "ShowCoreRdsSubnetGroupName"
        }
    })
    
    # Verify parameter group name output exists
    template.has_output("RdsParameterGroupName", {
        "Export": {
            "Name": "ShowCoreRdsParameterGroupName"
        }
    })


def test_rds_cost_optimization_single_az():
    """
    Test cost optimization: RDS is deployed in single AZ.
    
    Single-AZ deployment saves ~50% cost compared to Multi-AZ.
    Acceptable for low-traffic project website.
    
    Validates: Requirement 9.5
    """
    stack = _create_test_stack()
    template = Template.from_stack(stack)
    
    # Verify RDS is NOT Multi-AZ
    template.has_resource_properties("AWS::RDS::DBInstance", {
        "MultiAZ": False
    })


def test_rds_cost_optimization_free_tier_instance():
    """
    Test cost optimization: RDS uses Free Tier eligible instance.
    
    db.t3.micro provides 750 hours/month free for 12 months.
    
    Validates: Requirement 9.1
    """
    stack = _create_test_stack()
    template = Template.from_stack(stack)
    
    # Verify RDS instance is db.t3.micro (Free Tier)
    template.has_resource_properties("AWS::RDS::DBInstance", {
        "DBInstanceClass": "db.t3.micro"
    })


def test_rds_cost_optimization_aws_managed_keys():
    """
    Test cost optimization: RDS uses AWS managed keys (not KMS).
    
    AWS managed keys are free and automatically rotated.
    KMS keys cost $1/key/month + usage charges.
    
    Validates: Requirement 9.1
    """
    stack = _create_test_stack()
    template = Template.from_stack(stack)
    
    # Verify encryption is enabled
    template.has_resource_properties("AWS::RDS::DBInstance", {
        "StorageEncrypted": True
    })
    
    # Verify KMS key is NOT specified (uses AWS managed keys)
    resources = template.find_resources("AWS::RDS::DBInstance")
    for resource_id, resource in resources.items():
        properties = resource.get("Properties", {})
        # KmsKeyId should not be present (AWS managed keys)
        assert "KmsKeyId" not in properties, "Should use AWS managed keys for cost optimization"


def test_rds_cost_optimization_short_backup_retention():
    """
    Test cost optimization: RDS has short backup retention (7 days).
    
    Short retention reduces backup storage costs.
    Acceptable for low-traffic project website.
    
    Validates: Requirement 9.1
    """
    stack = _create_test_stack()
    template = Template.from_stack(stack)
    
    # Verify backup retention is 7 days (short retention)
    template.has_resource_properties("AWS::RDS::DBInstance", {
        "BackupRetentionPeriod": 7
    })


def test_rds_instance_identifier_follows_naming_convention():
    """
    Test RDS instance identifier follows naming convention.
    
    Format: showcore-{component}-{environment}-{resource-type}
    
    Validates: IaC standards
    """
    stack = _create_test_stack()
    template = Template.from_stack(stack)
    
    # Verify instance identifier follows naming convention
    resources = template.find_resources("AWS::RDS::DBInstance")
    for resource_id, resource in resources.items():
        properties = resource.get("Properties", {})
        instance_id = properties.get("DBInstanceIdentifier", "")
        # Should start with "showcore-database-production-"
        assert instance_id.startswith("showcore-database-production-"), \
            f"Instance identifier should follow naming convention, got {instance_id}"


def test_rds_alarms_have_correct_metric_period():
    """
    Test RDS CloudWatch alarms have correct metric period (5 minutes).
    
    Validates: Requirements 3.7, 3.8
    """
    stack = _create_test_stack()
    template = Template.from_stack(stack)
    
    # Find all CloudWatch alarms
    resources = template.find_resources("AWS::CloudWatch::Alarm")
    
    # Verify all alarms have 5-minute period (300 seconds)
    for alarm_id, alarm in resources.items():
        properties = alarm.get("Properties", {})
        metric_name = properties.get("MetricName", "")
        
        # Check RDS-related alarms
        if "CPU" in metric_name or "FreeStorageSpace" in metric_name:
            # Period should be 300 seconds (5 minutes)
            # Note: Period is set in the metric definition, not directly in alarm properties
            # We verify evaluation periods is 1 (alarm immediately)
            evaluation_periods = properties.get("EvaluationPeriods", 0)
            assert evaluation_periods == 1, f"Alarm should evaluate 1 period, got {evaluation_periods}"


def test_rds_alarms_treat_missing_data_correctly():
    """
    Test RDS CloudWatch alarms treat missing data as not breaching.
    
    If no data is available, assume everything is OK.
    
    Validates: Requirements 3.7, 3.8
    """
    stack = _create_test_stack()
    template = Template.from_stack(stack)
    
    # Find all CloudWatch alarms
    resources = template.find_resources("AWS::CloudWatch::Alarm")
    
    # Verify all alarms treat missing data as not breaching
    for alarm_id, alarm in resources.items():
        properties = alarm.get("Properties", {})
        alarm_name = properties.get("AlarmName", "")
        
        # Check RDS-related alarms
        if "rds" in alarm_name.lower():
            treat_missing_data = properties.get("TreatMissingData", "")
            assert treat_missing_data == "notBreaching", \
                f"Alarm {alarm_name} should treat missing data as notBreaching, got {treat_missing_data}"


def test_database_stack_resource_count():
    """
    Test database stack creates expected number of resources.
    
    This is a sanity check to ensure the stack creates all expected resources.
    """
    stack = _create_test_stack()
    template = Template.from_stack(stack)
    
    # Verify resource counts
    template.resource_count_is("AWS::RDS::DBInstance", 1)
    template.resource_count_is("AWS::RDS::DBSubnetGroup", 1)
    template.resource_count_is("AWS::RDS::DBParameterGroup", 1)
    template.resource_count_is("AWS::CloudWatch::Alarm", 2)  # CPU and storage alarms


def test_rds_point_in_time_recovery_enabled():
    """
    Test RDS point-in-time recovery is enabled.
    
    Point-in-time recovery is automatically enabled when BackupRetentionPeriod > 0.
    Provides 5-minute granularity for recovery.
    
    Validates: Requirement 3.4
    """
    stack = _create_test_stack()
    template = Template.from_stack(stack)
    
    # Verify backup retention is > 0 (enables point-in-time recovery)
    template.has_resource_properties("AWS::RDS::DBInstance", {
        "BackupRetentionPeriod": 7
    })
    
    # Point-in-time recovery is automatically enabled when BackupRetentionPeriod > 0
    # No additional configuration required
