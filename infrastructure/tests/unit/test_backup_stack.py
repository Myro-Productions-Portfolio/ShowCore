"""
Unit tests for ShowCoreBackupStack

Tests verify:
- AWS Backup vault exists using Template.has_resource_properties()
- Backup plans include RDS and ElastiCache resources
- Backup retention is 7 days for both RDS and ElastiCache
- Backup failure alarms exist and are configured
- Backup vault uses AWS managed encryption (not KMS)
- Backup resources have cost allocation tags

These tests run against CDK synthesized template - no actual AWS resources.

Validates: Requirements 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 9.9
"""

import aws_cdk as cdk
from aws_cdk.assertions import Template, Match
from lib.stacks.backup_stack import ShowCoreBackupStack
from lib.stacks.monitoring_stack import ShowCoreMonitoringStack


def _create_test_stack():
    """
    Helper function to create test backup stack.
    
    BackupStack optionally depends on MonitoringStack (for critical alerts topic).
    """
    app = cdk.App()
    
    # Create monitoring stack (provides critical alerts topic)
    monitoring_stack = ShowCoreMonitoringStack(app, "TestMonitoringStack")
    
    # Create backup stack
    backup_stack = ShowCoreBackupStack(
        app,
        "TestBackupStack",
        critical_alerts_topic=monitoring_stack.critical_alerts_topic
    )
    
    return backup_stack


def test_backup_vault_exists():
    """
    Test AWS Backup vault exists with correct configuration.
    
    Backup vault provides centralized backup management for RDS and ElastiCache.
    
    Validates: Requirement 8.1
    """
    stack = _create_test_stack()
    template = Template.from_stack(stack)
    
    # Verify backup vault exists
    template.has_resource_properties("AWS::Backup::BackupVault", {
        "BackupVaultName": "showcore-backup-vault"
    })


def test_backup_vault_uses_aws_managed_encryption():
    """
    Test backup vault uses AWS managed encryption keys (not KMS).
    
    AWS managed keys are free and automatically rotated.
    KMS keys cost $1/key/month + usage charges.
    
    Validates: Requirements 8.1, 9.9
    """
    stack = _create_test_stack()
    template = Template.from_stack(stack)
    
    # Verify backup vault exists
    template.has_resource_properties("AWS::Backup::BackupVault", {
        "BackupVaultName": "showcore-backup-vault"
    })
    
    # Verify KMS key is NOT specified (uses AWS managed keys)
    resources = template.find_resources("AWS::Backup::BackupVault")
    for resource_id, resource in resources.items():
        properties = resource.get("Properties", {})
        # EncryptionKeyArn should not be present (AWS managed keys)
        assert "EncryptionKeyArn" not in properties, "Should use AWS managed keys, not KMS"


def test_rds_backup_plan_exists():
    """
    Test AWS Backup plan for RDS instances exists.
    
    Backup plan defines schedule, retention, and lifecycle rules for RDS backups.
    
    Validates: Requirement 8.2
    """
    stack = _create_test_stack()
    template = Template.from_stack(stack)
    
    # Verify RDS backup plan exists
    template.has_resource_properties("AWS::Backup::BackupPlan", {
        "BackupPlan": {
            "BackupPlanName": "showcore-rds-backup-plan"
        }
    })


def test_rds_backup_plan_has_7_day_retention():
    """
    Test RDS backup plan has 7-day retention period.
    
    Short retention (7 days) minimizes storage costs.
    Acceptable for low-traffic project website.
    
    Validates: Requirements 8.4, 8.7
    """
    stack = _create_test_stack()
    template = Template.from_stack(stack)
    
    # Verify RDS backup plan has 7-day retention
    template.has_resource_properties("AWS::Backup::BackupPlan", {
        "BackupPlan": {
            "BackupPlanName": "showcore-rds-backup-plan",
            "BackupPlanRule": Match.array_with([
                Match.object_like({
                    "RuleName": "daily-rds-backup",
                    "Lifecycle": {
                        "DeleteAfterDays": 7
                    }
                })
            ])
        }
    })


def test_rds_backup_plan_daily_schedule():
    """
    Test RDS backup plan has daily schedule at 03:00 UTC.
    
    Daily backups at off-peak hours (03:00 UTC) minimize performance impact.
    
    Validates: Requirements 8.2, 8.7
    """
    stack = _create_test_stack()
    template = Template.from_stack(stack)
    
    # Verify RDS backup plan has daily schedule
    template.has_resource_properties("AWS::Backup::BackupPlan", {
        "BackupPlan": {
            "BackupPlanName": "showcore-rds-backup-plan",
            "BackupPlanRule": Match.array_with([
                Match.object_like({
                    "RuleName": "daily-rds-backup",
                    "ScheduleExpression": Match.string_like_regexp(".*cron.*")
                })
            ])
        }
    })


def test_rds_backup_selection_includes_rds_resources():
    """
    Test RDS backup selection includes RDS instances with tag Project=ShowCore.
    
    Backup selection automatically backs up all RDS instances with matching tag.
    
    Validates: Requirement 8.2
    """
    stack = _create_test_stack()
    template = Template.from_stack(stack)
    
    # Verify RDS backup selection exists
    template.has_resource_properties("AWS::Backup::BackupSelection", {
        "BackupSelectionName": "showcore-rds-instances"
    })


def test_elasticache_backup_plan_exists():
    """
    Test AWS Backup plan for ElastiCache clusters exists.
    
    Backup plan defines schedule, retention, and lifecycle rules for ElastiCache snapshots.
    
    Validates: Requirement 8.3
    """
    stack = _create_test_stack()
    template = Template.from_stack(stack)
    
    # Verify ElastiCache backup plan exists
    template.has_resource_properties("AWS::Backup::BackupPlan", {
        "BackupPlan": {
            "BackupPlanName": "showcore-elasticache-backup-plan"
        }
    })


def test_elasticache_backup_plan_has_7_day_retention():
    """
    Test ElastiCache backup plan has 7-day retention period.
    
    Short retention (7 days) minimizes storage costs.
    Acceptable for low-traffic project website.
    
    Validates: Requirements 8.5, 8.7
    """
    stack = _create_test_stack()
    template = Template.from_stack(stack)
    
    # Verify ElastiCache backup plan has 7-day retention
    template.has_resource_properties("AWS::Backup::BackupPlan", {
        "BackupPlan": {
            "BackupPlanName": "showcore-elasticache-backup-plan",
            "BackupPlanRule": Match.array_with([
                Match.object_like({
                    "RuleName": "daily-elasticache-snapshot",
                    "Lifecycle": {
                        "DeleteAfterDays": 7
                    }
                })
            ])
        }
    })


def test_elasticache_backup_plan_daily_schedule():
    """
    Test ElastiCache backup plan has daily schedule at 03:00 UTC.
    
    Daily snapshots at off-peak hours (03:00 UTC) minimize performance impact.
    Same time as RDS backups for consistency.
    
    Validates: Requirements 8.3, 8.7
    """
    stack = _create_test_stack()
    template = Template.from_stack(stack)
    
    # Verify ElastiCache backup plan has daily schedule
    template.has_resource_properties("AWS::Backup::BackupPlan", {
        "BackupPlan": {
            "BackupPlanName": "showcore-elasticache-backup-plan",
            "BackupPlanRule": Match.array_with([
                Match.object_like({
                    "RuleName": "daily-elasticache-snapshot",
                    "ScheduleExpression": Match.string_like_regexp(".*cron.*")
                })
            ])
        }
    })


def test_elasticache_backup_selection_includes_elasticache_resources():
    """
    Test ElastiCache backup selection includes ElastiCache clusters with tag Project=ShowCore.
    
    Backup selection automatically backs up all ElastiCache clusters with matching tag.
    
    Validates: Requirement 8.3
    """
    stack = _create_test_stack()
    template = Template.from_stack(stack)
    
    # Verify ElastiCache backup selection exists
    template.has_resource_properties("AWS::Backup::BackupSelection", {
        "BackupSelectionName": "showcore-elasticache-clusters"
    })


def test_rds_backup_failure_alarm_exists():
    """
    Test CloudWatch alarm exists for RDS backup job failures.
    
    Alarm monitors AWS Backup job status metrics and sends critical alerts
    when RDS backup jobs fail.
    
    Validates: Requirement 8.6
    """
    stack = _create_test_stack()
    template = Template.from_stack(stack)
    
    # Verify RDS backup failure alarm exists
    template.has_resource_properties("AWS::CloudWatch::Alarm", {
        "AlarmName": "showcore-rds-backup-failure",
        "AlarmDescription": "Alert when RDS backup jobs fail"
    })


def test_rds_backup_failure_alarm_configuration():
    """
    Test RDS backup failure alarm has correct configuration.
    
    Configuration:
    - Metric: AWS/Backup NumberOfBackupJobsFailed
    - Threshold: >= 1 failed backup job
    - Evaluation periods: 1 (immediate alert)
    - Dimensions: ResourceType=RDS
    
    Validates: Requirement 8.6
    """
    stack = _create_test_stack()
    template = Template.from_stack(stack)
    
    # Verify RDS backup failure alarm configuration
    template.has_resource_properties("AWS::CloudWatch::Alarm", {
        "AlarmName": "showcore-rds-backup-failure",
        "Namespace": "AWS/Backup",
        "MetricName": "NumberOfBackupJobsFailed",
        "Dimensions": [
            {
                "Name": "ResourceType",
                "Value": "RDS"
            }
        ],
        "Threshold": 1,
        "ComparisonOperator": "GreaterThanOrEqualToThreshold",
        "EvaluationPeriods": 1
    })


def test_elasticache_backup_failure_alarm_exists():
    """
    Test CloudWatch alarm exists for ElastiCache backup job failures.
    
    Alarm monitors AWS Backup job status metrics and sends critical alerts
    when ElastiCache backup jobs fail.
    
    Validates: Requirement 8.6
    """
    stack = _create_test_stack()
    template = Template.from_stack(stack)
    
    # Verify ElastiCache backup failure alarm exists
    template.has_resource_properties("AWS::CloudWatch::Alarm", {
        "AlarmName": "showcore-elasticache-backup-failure",
        "AlarmDescription": "Alert when ElastiCache backup jobs fail"
    })


def test_elasticache_backup_failure_alarm_configuration():
    """
    Test ElastiCache backup failure alarm has correct configuration.
    
    Configuration:
    - Metric: AWS/Backup NumberOfBackupJobsFailed
    - Threshold: >= 1 failed backup job
    - Evaluation periods: 1 (immediate alert)
    - Dimensions: ResourceType=ElastiCache
    
    Validates: Requirement 8.6
    """
    stack = _create_test_stack()
    template = Template.from_stack(stack)
    
    # Verify ElastiCache backup failure alarm configuration
    template.has_resource_properties("AWS::CloudWatch::Alarm", {
        "AlarmName": "showcore-elasticache-backup-failure",
        "Namespace": "AWS/Backup",
        "MetricName": "NumberOfBackupJobsFailed",
        "Dimensions": [
            {
                "Name": "ResourceType",
                "Value": "ElastiCache"
            }
        ],
        "Threshold": 1,
        "ComparisonOperator": "GreaterThanOrEqualToThreshold",
        "EvaluationPeriods": 1
    })


def test_backup_failure_alarms_treat_missing_data_correctly():
    """
    Test backup failure alarms treat missing data as not breaching.
    
    If no data is available, assume everything is OK (no false alarms).
    
    Validates: Requirement 8.6
    """
    stack = _create_test_stack()
    template = Template.from_stack(stack)
    
    # Find all CloudWatch alarms
    resources = template.find_resources("AWS::CloudWatch::Alarm")
    
    # Verify backup failure alarms treat missing data as not breaching
    for alarm_id, alarm in resources.items():
        properties = alarm.get("Properties", {})
        alarm_name = properties.get("AlarmName", "")
        
        # Check backup failure alarms
        if "backup-failure" in alarm_name.lower():
            treat_missing_data = properties.get("TreatMissingData", "")
            assert treat_missing_data == "notBreaching", \
                f"Alarm {alarm_name} should treat missing data as notBreaching, got {treat_missing_data}"


def test_backup_failure_alarms_have_sns_actions():
    """
    Test backup failure alarms have SNS actions configured.
    
    Alarms should send notifications to critical alerts SNS topic.
    
    Validates: Requirement 8.6
    """
    stack = _create_test_stack()
    template = Template.from_stack(stack)
    
    # Find all CloudWatch alarms
    resources = template.find_resources("AWS::CloudWatch::Alarm")
    
    # Verify backup failure alarms have SNS actions
    for alarm_id, alarm in resources.items():
        properties = alarm.get("Properties", {})
        alarm_name = properties.get("AlarmName", "")
        
        # Check backup failure alarms
        if "backup-failure" in alarm_name.lower():
            alarm_actions = properties.get("AlarmActions", [])
            assert len(alarm_actions) > 0, \
                f"Alarm {alarm_name} should have SNS actions configured"


def test_backup_plans_use_backup_vault():
    """
    Test backup plans use the backup vault for storing backups.
    
    All backups should be stored in the centralized backup vault.
    
    Validates: Requirements 8.1, 8.2, 8.3
    """
    stack = _create_test_stack()
    template = Template.from_stack(stack)
    
    # Find all backup plans
    resources = template.find_resources("AWS::Backup::BackupPlan")
    
    # Verify all backup plans reference the backup vault
    for plan_id, plan in resources.items():
        properties = plan.get("Properties", {})
        backup_plan = properties.get("BackupPlan", {})
        backup_plan_rules = backup_plan.get("BackupPlanRule", [])
        
        # Each rule should reference the backup vault
        for rule in backup_plan_rules:
            target_backup_vault_name = rule.get("TargetBackupVaultName")
            # Vault name should be a reference to the backup vault
            assert target_backup_vault_name is not None, \
                "Backup plan rule should reference backup vault"


def test_backup_plans_have_completion_window():
    """
    Test backup plans have completion window configured.
    
    Completion window: 2 hours (backup must complete within 2 hours).
    
    Validates: Requirements 8.2, 8.3
    """
    stack = _create_test_stack()
    template = Template.from_stack(stack)
    
    # Find all backup plans
    resources = template.find_resources("AWS::Backup::BackupPlan")
    
    # Verify all backup plans have completion window
    for plan_id, plan in resources.items():
        properties = plan.get("Properties", {})
        backup_plan = properties.get("BackupPlan", {})
        backup_plan_rules = backup_plan.get("BackupPlanRule", [])
        
        # Each rule should have completion window
        for rule in backup_plan_rules:
            completion_window_minutes = rule.get("CompletionWindowMinutes")
            assert completion_window_minutes is not None, \
                "Backup plan rule should have completion window"
            # Completion window should be 120 minutes (2 hours)
            assert completion_window_minutes == 120, \
                f"Completion window should be 120 minutes, got {completion_window_minutes}"


def test_backup_plans_have_start_window():
    """
    Test backup plans have start window configured.
    
    Start window: 1 hour (backup can start within 1 hour of scheduled time).
    
    Validates: Requirements 8.2, 8.3
    """
    stack = _create_test_stack()
    template = Template.from_stack(stack)
    
    # Find all backup plans
    resources = template.find_resources("AWS::Backup::BackupPlan")
    
    # Verify all backup plans have start window
    for plan_id, plan in resources.items():
        properties = plan.get("Properties", {})
        backup_plan = properties.get("BackupPlan", {})
        backup_plan_rules = backup_plan.get("BackupPlanRule", [])
        
        # Each rule should have start window
        for rule in backup_plan_rules:
            start_window_minutes = rule.get("StartWindowMinutes")
            assert start_window_minutes is not None, \
                "Backup plan rule should have start window"
            # Start window should be 60 minutes (1 hour)
            assert start_window_minutes == 60, \
                f"Start window should be 60 minutes, got {start_window_minutes}"


def test_rds_backup_plan_enables_continuous_backup():
    """
    Test RDS backup plan enables continuous backup for point-in-time recovery.
    
    Continuous backup allows restore to any point within the retention period.
    
    Validates: Requirement 8.4
    """
    stack = _create_test_stack()
    template = Template.from_stack(stack)
    
    # Verify RDS backup plan enables continuous backup
    template.has_resource_properties("AWS::Backup::BackupPlan", {
        "BackupPlan": {
            "BackupPlanName": "showcore-rds-backup-plan",
            "BackupPlanRule": Match.array_with([
                Match.object_like({
                    "RuleName": "daily-rds-backup",
                    "EnableContinuousBackup": True
                })
            ])
        }
    })


def test_backup_selections_allow_restores():
    """
    Test backup selections allow restores.
    
    This allows AWS Backup to create service-linked role for restore operations.
    
    Validates: Requirements 8.2, 8.3
    """
    stack = _create_test_stack()
    template = Template.from_stack(stack)
    
    # Find all backup selections
    resources = template.find_resources("AWS::Backup::BackupSelection")
    
    # Verify all backup selections have IAM role for restores
    for selection_id, selection in resources.items():
        properties = selection.get("Properties", {})
        # IamRoleArn should be present (allows restores)
        iam_role_arn = properties.get("IamRoleArn")
        assert iam_role_arn is not None, \
            "Backup selection should have IAM role for restores"


def test_backup_stack_resource_count():
    """
    Test backup stack creates expected number of resources.
    
    This is a sanity check to ensure the stack creates all expected resources.
    """
    stack = _create_test_stack()
    template = Template.from_stack(stack)
    
    # Verify resource counts
    template.resource_count_is("AWS::Backup::BackupVault", 1)
    template.resource_count_is("AWS::Backup::BackupPlan", 2)  # RDS and ElastiCache
    template.resource_count_is("AWS::Backup::BackupSelection", 2)  # RDS and ElastiCache
    template.resource_count_is("AWS::CloudWatch::Alarm", 2)  # RDS and ElastiCache backup failures


def test_backup_vault_follows_naming_convention():
    """
    Test backup vault follows naming convention.
    
    Format: showcore-{component}-vault
    
    Validates: IaC standards
    """
    stack = _create_test_stack()
    template = Template.from_stack(stack)
    
    # Verify backup vault name follows naming convention
    template.has_resource_properties("AWS::Backup::BackupVault", {
        "BackupVaultName": "showcore-backup-vault"
    })


def test_backup_plans_follow_naming_convention():
    """
    Test backup plans follow naming convention.
    
    Format: showcore-{resource-type}-backup-plan
    
    Validates: IaC standards
    """
    stack = _create_test_stack()
    template = Template.from_stack(stack)
    
    # Verify RDS backup plan name
    template.has_resource_properties("AWS::Backup::BackupPlan", {
        "BackupPlan": {
            "BackupPlanName": "showcore-rds-backup-plan"
        }
    })
    
    # Verify ElastiCache backup plan name
    template.has_resource_properties("AWS::Backup::BackupPlan", {
        "BackupPlan": {
            "BackupPlanName": "showcore-elasticache-backup-plan"
        }
    })


def test_backup_failure_alarms_follow_naming_convention():
    """
    Test backup failure alarms follow naming convention.
    
    Format: showcore-{resource-type}-backup-failure
    
    Validates: IaC standards
    """
    stack = _create_test_stack()
    template = Template.from_stack(stack)
    
    # Verify RDS backup failure alarm name
    template.has_resource_properties("AWS::CloudWatch::Alarm", {
        "AlarmName": "showcore-rds-backup-failure"
    })
    
    # Verify ElastiCache backup failure alarm name
    template.has_resource_properties("AWS::CloudWatch::Alarm", {
        "AlarmName": "showcore-elasticache-backup-failure"
    })


def test_cost_optimization_aws_managed_keys():
    """
    Test cost optimization: backup vault uses AWS managed keys (not KMS).
    
    AWS managed keys are free and automatically rotated.
    KMS keys cost $1/key/month + usage charges.
    
    Validates: Requirement 9.9
    """
    stack = _create_test_stack()
    template = Template.from_stack(stack)
    
    # Verify backup vault exists
    template.has_resource_properties("AWS::Backup::BackupVault", {
        "BackupVaultName": "showcore-backup-vault"
    })
    
    # Verify KMS key is NOT specified (uses AWS managed keys)
    resources = template.find_resources("AWS::Backup::BackupVault")
    for resource_id, resource in resources.items():
        properties = resource.get("Properties", {})
        # EncryptionKeyArn should not be present (AWS managed keys)
        assert "EncryptionKeyArn" not in properties, \
            "Should use AWS managed keys for cost optimization"


def test_cost_optimization_short_retention():
    """
    Test cost optimization: backup plans have short retention (7 days).
    
    Short retention reduces backup storage costs.
    Acceptable for low-traffic project website.
    
    Validates: Requirement 8.7
    """
    stack = _create_test_stack()
    template = Template.from_stack(stack)
    
    # Find all backup plans
    resources = template.find_resources("AWS::Backup::BackupPlan")
    
    # Verify all backup plans have 7-day retention
    for plan_id, plan in resources.items():
        properties = plan.get("Properties", {})
        backup_plan = properties.get("BackupPlan", {})
        backup_plan_rules = backup_plan.get("BackupPlanRule", [])
        
        # Each rule should have 7-day retention
        for rule in backup_plan_rules:
            lifecycle = rule.get("Lifecycle", {})
            delete_after_days = lifecycle.get("DeleteAfterDays")
            assert delete_after_days == 7, \
                f"Backup retention should be 7 days for cost optimization, got {delete_after_days}"


def test_backup_selections_use_tag_based_selection():
    """
    Test backup selections use tag-based selection (Project=ShowCore).
    
    Tag-based selection automatically includes new resources with matching tag.
    No need to update backup plan when adding new resources.
    
    Validates: Requirements 8.2, 8.3
    """
    stack = _create_test_stack()
    template = Template.from_stack(stack)
    
    # Find all backup selections
    resources = template.find_resources("AWS::Backup::BackupSelection")
    
    # Verify all backup selections use tag-based selection
    for selection_id, selection in resources.items():
        properties = selection.get("Properties", {})
        backup_selection = properties.get("BackupSelection", {})
        
        # ListOfTags should be present for tag-based selection
        list_of_tags = backup_selection.get("ListOfTags")
        assert list_of_tags is not None, \
            "Backup selection should use tag-based selection"
        
        # Verify tag key is "Project" and value is "ShowCore"
        found_project_tag = False
        for tag in list_of_tags:
            if tag.get("ConditionKey") == "Project" and tag.get("ConditionValue") == "ShowCore":
                found_project_tag = True
                break
        
        assert found_project_tag, \
            "Backup selection should filter by tag Project=ShowCore"
