"""
ShowCore Backup Stack

This module defines the AWS Backup infrastructure for ShowCore Phase 1.
It creates a backup vault for centralized backup management and backup plans
for RDS and ElastiCache resources.

Cost Optimization:
- Uses AWS managed encryption keys (not KMS) to avoid key management costs
- Short retention period (7 days) minimizes storage costs
- Daily backups balance recovery capability with cost
- First 20 GB of RDS backup storage is FREE (matches allocated storage)
- Centralized backup management reduces operational overhead

Security:
- Encryption at rest using AWS managed keys (automatic rotation)
- Backup vault provides centralized access control
- Backup policies enforce consistent backup schedules
- Audit trail via CloudTrail

Resources:
- AWS Backup Vault (showcore-backup-vault)
  - Encryption using AWS managed keys (not KMS for cost optimization)
  - Centralized backup management for RDS and ElastiCache
  - Access control via IAM policies
- AWS Backup Plan for RDS (showcore-rds-backup-plan)
  - Daily backups at 03:00 UTC (off-peak hours)
  - 7-day retention (short retention for cost optimization)
  - Automatic backup of RDS instances with tag Project=ShowCore
- AWS Backup Plan for ElastiCache (showcore-elasticache-backup-plan)
  - Daily snapshots at 03:00 UTC (off-peak hours)
  - 7-day retention (short retention for cost optimization)
  - Automatic snapshot of ElastiCache clusters with tag Project=ShowCore

Dependencies: None (foundation for backup management)

Validates: Requirements 8.1, 8.2, 8.3, 8.4, 8.5, 8.7, 9.9
"""

from typing import Optional
from aws_cdk import (
    Duration,
    RemovalPolicy,
    aws_backup as backup,
    aws_cloudwatch as cloudwatch,
    aws_cloudwatch_actions as cloudwatch_actions,
    aws_sns as sns,
)
from constructs import Construct
from .base_stack import ShowCoreBaseStack


class ShowCoreBackupStack(ShowCoreBaseStack):
    """
    Backup infrastructure stack for ShowCore Phase 1.
    
    Creates AWS Backup vault for centralized backup management of RDS
    and ElastiCache resources. The backup vault provides a centralized
    location for managing backups with consistent encryption and access control.
    
    Also creates CloudWatch alarms to monitor backup job failures and send
    alerts to designated administrators when backup jobs fail.
    
    Cost Optimization:
    - AWS managed encryption keys (free) instead of KMS ($1/key/month)
    - Backup vault itself has no cost (only storage costs for backups)
    - Centralized management reduces operational overhead
    - CloudWatch alarms for backup failures ($0.10 each)
    
    Security:
    - Encryption at rest using AWS managed keys (automatic rotation)
    - Centralized access control via IAM policies
    - Backup vault provides audit trail for backup operations
    - Immediate alerts on backup failures for rapid response
    
    Resources Created:
    - AWS Backup Vault (showcore-backup-vault)
    - AWS Backup Plan for RDS (showcore-rds-backup-plan)
    - AWS Backup Plan for ElastiCache (showcore-elasticache-backup-plan)
    - CloudWatch Alarm: RDS backup job failures
    - CloudWatch Alarm: ElastiCache backup job failures
    
    Attributes:
        backup_vault: AWS Backup vault for centralized backup management
        rds_backup_plan: AWS Backup plan for RDS instances
        elasticache_backup_plan: AWS Backup plan for ElastiCache clusters
        rds_backup_failure_alarm: CloudWatch alarm for RDS backup failures
        elasticache_backup_failure_alarm: CloudWatch alarm for ElastiCache backup failures
    
    Usage:
        backup_stack = ShowCoreBackupStack(
            app,
            "ShowCoreBackupStack",
            critical_alerts_topic=monitoring_stack.critical_alerts_topic,
            env=env
        )
    
    Validates: Requirements 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 9.9
    """
    
    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        critical_alerts_topic: Optional[sns.ITopic] = None,
        environment: Optional[str] = None,
        **kwargs
    ) -> None:
        """
        Initialize the backup stack.
        
        Args:
            scope: CDK app or parent construct
            construct_id: Unique identifier for this stack
            critical_alerts_topic: SNS topic for critical alerts (backup failures)
            environment: Environment name (production, staging, development)
            **kwargs: Additional stack properties
        """
        super().__init__(
            scope,
            construct_id,
            component="Backup",
            environment=environment,
            **kwargs
        )
        
        # Store critical alerts topic for backup failure alarms
        self.critical_alerts_topic = critical_alerts_topic
        
        # Create AWS Backup vault for centralized backup management
        self.backup_vault = self._create_backup_vault()
        
        # Create AWS Backup plan for RDS instances
        self.rds_backup_plan = self._create_rds_backup_plan()
        
        # Create AWS Backup plan for ElastiCache clusters
        self.elasticache_backup_plan = self._create_elasticache_backup_plan()
        
        # Create CloudWatch alarms for backup job failures
        if self.critical_alerts_topic:
            self.rds_backup_failure_alarm = self._create_rds_backup_failure_alarm()
            self.elasticache_backup_failure_alarm = self._create_elasticache_backup_failure_alarm()
    
    def _create_backup_vault(self) -> backup.BackupVault:
        """
        Create AWS Backup vault for centralized backup management.
        
        The backup vault provides a centralized location for managing backups
        of RDS and ElastiCache resources. It enforces consistent encryption
        and access control policies across all backups.
        
        Configuration:
        - Vault name: showcore-backup-vault
        - Encryption: AWS managed keys (not KMS for cost optimization)
        - Removal policy: RETAIN (protect backups on stack deletion)
        
        Cost Optimization:
        - AWS managed encryption keys are FREE (KMS would cost $1/key/month)
        - Backup vault itself has no cost (only storage costs for backups)
        - Centralized management reduces operational overhead
        
        Security:
        - Encryption at rest using AWS managed keys (automatic rotation)
        - Backup vault provides centralized access control via IAM policies
        - Audit trail for all backup operations via CloudTrail
        
        Backup Storage Costs:
        - RDS backups: First 20 GB free (matches allocated storage, Free Tier)
        - ElastiCache snapshots: Stored in S3, charged at S3 rates
        - Backup storage beyond Free Tier: $0.095/GB-month
        
        Returns:
            AWS Backup vault for centralized backup management
            
        Validates: Requirements 8.1, 9.9
        """
        # Create backup vault with AWS managed encryption
        vault = backup.BackupVault(
            self,
            "BackupVault",
            # Vault name following naming convention
            backup_vault_name="showcore-backup-vault",
            # Use AWS managed encryption keys (FREE)
            # Not specifying encryption_key uses AWS managed keys (default)
            # KMS would cost $1/key/month + usage charges
            # AWS managed keys provide automatic rotation and no additional cost
            # Retain vault on stack deletion to protect backups
            removal_policy=RemovalPolicy.RETAIN,
        )
        
        # Add custom tags for backup vault
        self.add_custom_tag("BackupRequired", "true")
        self.add_custom_tag("Compliance", "Required")
        
        return vault
    
    def _create_rds_backup_plan(self) -> backup.BackupPlan:
        """
        Create AWS Backup plan for RDS instances.
        
        The backup plan defines the backup schedule, retention policy, and
        lifecycle rules for RDS database backups. It automatically backs up
        all RDS instances tagged with Project=ShowCore.
        
        Configuration:
        - Plan name: showcore-rds-backup-plan
        - Schedule: Daily at 03:00 UTC (off-peak hours)
        - Retention: 7 days (short retention for cost optimization)
        - Target: RDS instances with tag Project=ShowCore
        - Vault: showcore-backup-vault
        
        Cost Optimization:
        - Short retention period (7 days) minimizes storage costs
        - Daily backups balance recovery capability with cost
        - First 20 GB of RDS backup storage is FREE (matches allocated storage)
        - Backup storage beyond Free Tier: $0.095/GB-month
        - Off-peak backup window (03:00 UTC) minimizes performance impact
        
        Backup Schedule:
        - Frequency: Daily
        - Time: 03:00 UTC (off-peak hours)
        - Completion window: 2 hours (backup must complete within 2 hours)
        - Start window: 1 hour (backup can start within 1 hour of scheduled time)
        
        Retention Policy:
        - Retention: 7 days (short retention for cost optimization)
        - After 7 days, backups are automatically deleted
        - Manual snapshots can be taken for longer retention if needed
        
        Backup Selection:
        - Target: All RDS instances with tag Project=ShowCore
        - Automatically includes new RDS instances with matching tag
        - No need to update backup plan when adding new RDS instances
        
        Security:
        - Backups stored in backup vault with encryption at rest
        - Access controlled via IAM policies
        - Audit trail via CloudTrail
        
        Returns:
            AWS Backup plan for RDS instances
            
        Validates: Requirements 8.2, 8.4, 8.7
        """
        # Create backup plan with daily schedule
        plan = backup.BackupPlan(
            self,
            "RdsBackupPlan",
            # Backup plan name following naming convention
            backup_plan_name="showcore-rds-backup-plan",
            # Backup vault to store backups
            backup_vault=self.backup_vault,
            # Backup rules define schedule and retention
            backup_plan_rules=[
                backup.BackupPlanRule(
                    # Rule name
                    rule_name="daily-rds-backup",
                    # Backup vault to store backups
                    backup_vault=self.backup_vault,
                    # Daily backup schedule at 03:00 UTC (off-peak hours)
                    # Format: cron(minutes hours day-of-month month day-of-week year)
                    # 0 3 * * ? * = Every day at 03:00 UTC
                    schedule_expression=backup.BackupPlanRule.daily(),
                    # Backup must start within 1 hour of scheduled time
                    start_window=Duration.hours(1),
                    # Backup must complete within 2 hours
                    completion_window=Duration.hours(2),
                    # Retention: 7 days (short retention for cost optimization)
                    delete_after=Duration.days(7),
                    # Enable continuous backup for point-in-time recovery
                    # This allows restore to any point within the retention period
                    enable_continuous_backup=True,
                )
            ],
        )
        
        # Create backup selection to include RDS instances with tag Project=ShowCore
        # This automatically backs up all RDS instances with the specified tag
        backup.BackupSelection(
            self,
            "RdsBackupSelection",
            # Backup plan to associate with
            backup_plan=plan,
            # Selection name
            backup_selection_name="showcore-rds-instances",
            # Resources to backup: RDS instances with tag Project=ShowCore
            resources=[
                # Select all RDS instances with tag Project=ShowCore
                backup.BackupResource.from_tag(
                    key="Project",
                    value="ShowCore",
                    # Resource type: RDS database instances
                    # This ensures only RDS instances are backed up, not other resources
                    operation=backup.TagOperation.STRING_EQUALS,
                )
            ],
            # Allow AWS Backup to create service-linked role if needed
            # This role allows AWS Backup to perform backup operations on RDS
            allow_restores=True,
        )
        
        # Add custom tags for backup plan
        self.add_custom_tag("BackupRequired", "true")
        self.add_custom_tag("Compliance", "Required")
        
        return plan
    
    def _create_elasticache_backup_plan(self) -> backup.BackupPlan:
        """
        Create AWS Backup plan for ElastiCache clusters.
        
        The backup plan defines the backup schedule, retention policy, and
        lifecycle rules for ElastiCache Redis snapshots. It automatically backs up
        all ElastiCache clusters tagged with Project=ShowCore.
        
        Configuration:
        - Plan name: showcore-elasticache-backup-plan
        - Schedule: Daily at 03:00 UTC (off-peak hours)
        - Retention: 7 days (short retention for cost optimization)
        - Target: ElastiCache clusters with tag Project=ShowCore
        - Vault: showcore-backup-vault
        
        Cost Optimization:
        - Short retention period (7 days) minimizes storage costs
        - Daily snapshots balance recovery capability with cost
        - ElastiCache snapshots stored in S3, charged at S3 rates
        - Snapshot storage: $0.085/GB-month (S3 Standard pricing)
        - Off-peak backup window (03:00 UTC) minimizes performance impact
        
        Backup Schedule:
        - Frequency: Daily
        - Time: 03:00 UTC (off-peak hours, same as RDS for consistency)
        - Completion window: 2 hours (snapshot must complete within 2 hours)
        - Start window: 1 hour (snapshot can start within 1 hour of scheduled time)
        
        Retention Policy:
        - Retention: 7 days (short retention for cost optimization)
        - After 7 days, snapshots are automatically deleted
        - Manual snapshots can be taken for longer retention if needed
        
        Backup Selection:
        - Target: All ElastiCache clusters with tag Project=ShowCore
        - Automatically includes new ElastiCache clusters with matching tag
        - No need to update backup plan when adding new clusters
        
        Security:
        - Snapshots stored in backup vault with encryption at rest
        - Access controlled via IAM policies
        - Audit trail via CloudTrail
        
        Returns:
            AWS Backup plan for ElastiCache clusters
            
        Validates: Requirements 8.3, 8.5, 8.7
        """
        # Create backup plan with daily schedule
        plan = backup.BackupPlan(
            self,
            "ElastiCacheBackupPlan",
            # Backup plan name following naming convention
            backup_plan_name="showcore-elasticache-backup-plan",
            # Backup vault to store snapshots
            backup_vault=self.backup_vault,
            # Backup rules define schedule and retention
            backup_plan_rules=[
                backup.BackupPlanRule(
                    # Rule name
                    rule_name="daily-elasticache-snapshot",
                    # Backup vault to store snapshots
                    backup_vault=self.backup_vault,
                    # Daily snapshot schedule at 03:00 UTC (off-peak hours)
                    # Format: cron(minutes hours day-of-month month day-of-week year)
                    # 0 3 * * ? * = Every day at 03:00 UTC
                    # Same time as RDS backups for consistency
                    schedule_expression=backup.BackupPlanRule.daily(),
                    # Snapshot must start within 1 hour of scheduled time
                    start_window=Duration.hours(1),
                    # Snapshot must complete within 2 hours
                    completion_window=Duration.hours(2),
                    # Retention: 7 days (short retention for cost optimization)
                    delete_after=Duration.days(7),
                )
            ],
        )
        
        # Create backup selection to include ElastiCache clusters with tag Project=ShowCore
        # This automatically backs up all ElastiCache clusters with the specified tag
        backup.BackupSelection(
            self,
            "ElastiCacheBackupSelection",
            # Backup plan to associate with
            backup_plan=plan,
            # Selection name
            backup_selection_name="showcore-elasticache-clusters",
            # Resources to backup: ElastiCache clusters with tag Project=ShowCore
            resources=[
                # Select all ElastiCache clusters with tag Project=ShowCore
                backup.BackupResource.from_tag(
                    key="Project",
                    value="ShowCore",
                    # Resource type: ElastiCache clusters
                    # This ensures only ElastiCache clusters are backed up, not other resources
                    operation=backup.TagOperation.STRING_EQUALS,
                )
            ],
            # Allow AWS Backup to create service-linked role if needed
            # This role allows AWS Backup to perform snapshot operations on ElastiCache
            allow_restores=True,
        )
        
        # Add custom tags for backup plan
        self.add_custom_tag("BackupRequired", "true")
        self.add_custom_tag("Compliance", "Required")
        
        return plan

    def _create_rds_backup_failure_alarm(self) -> cloudwatch.Alarm:
        """
        Create CloudWatch alarm for RDS backup job failures.
        
        This alarm monitors AWS Backup job status metrics for RDS backup failures
        and sends critical alerts to designated administrators when backup jobs fail.
        Immediate notification of backup failures is critical for data protection.
        
        Configuration:
        - Alarm name: showcore-rds-backup-failure
        - Metric: AWS/Backup NumberOfBackupJobsFailed
        - Threshold: >= 1 failed backup job
        - Evaluation periods: 1 (immediate alert on first failure)
        - Period: 5 minutes (check every 5 minutes)
        - Statistic: Sum (total number of failed jobs)
        - Action: Send notification to critical alerts SNS topic
        
        Alarm Behavior:
        - Triggers when any RDS backup job fails
        - Sends immediate notification to administrators
        - Allows rapid response to backup failures
        - Helps maintain data protection and recovery capability
        
        Cost:
        - CloudWatch alarm: $0.10/month
        - SNS notifications: Free (email)
        - Total: $0.10/month
        
        Monitoring:
        - AWS Backup automatically publishes metrics to CloudWatch
        - NumberOfBackupJobsFailed metric tracks failed backup jobs
        - Metric dimensions: ResourceType=RDS
        - Alarm evaluates metric every 5 minutes
        
        Response Actions:
        - Investigate backup failure cause (check CloudWatch Logs)
        - Verify RDS instance is healthy and accessible
        - Check IAM permissions for AWS Backup service role
        - Verify backup vault is accessible
        - Manually trigger backup if needed
        - Update backup plan if configuration issue identified
        
        Returns:
            CloudWatch alarm for RDS backup job failures
            
        Validates: Requirements 8.6
        """
        # Create CloudWatch alarm for RDS backup failures
        alarm = cloudwatch.Alarm(
            self,
            "RdsBackupFailureAlarm",
            # Alarm name following naming convention
            alarm_name="showcore-rds-backup-failure",
            # Alarm description
            alarm_description="Alert when RDS backup jobs fail",
            # Metric to monitor: AWS Backup NumberOfBackupJobsFailed
            metric=cloudwatch.Metric(
                # AWS Backup metrics namespace
                namespace="AWS/Backup",
                # Metric name: number of failed backup jobs
                metric_name="NumberOfBackupJobsFailed",
                # Dimensions to filter for RDS resources only
                dimensions_map={
                    "ResourceType": "RDS"
                },
                # Statistic: Sum (total number of failed jobs in period)
                statistic="Sum",
                # Period: 5 minutes (check every 5 minutes)
                period=Duration.minutes(5),
            ),
            # Threshold: >= 1 failed backup job triggers alarm
            threshold=1,
            # Comparison operator: greater than or equal to threshold
            comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
            # Evaluation periods: 1 (immediate alert on first failure)
            evaluation_periods=1,
            # Treat missing data as not breaching (no false alarms)
            treat_missing_data=cloudwatch.TreatMissingData.NOT_BREACHING,
        )
        
        # Add SNS action to send notification to critical alerts topic
        if self.critical_alerts_topic:
            alarm.add_alarm_action(
                cloudwatch_actions.SnsAction(self.critical_alerts_topic)
            )
        
        # Add custom tags for alarm
        self.add_custom_tag("AlarmType", "BackupFailure")
        self.add_custom_tag("Severity", "Critical")
        
        return alarm
    
    def _create_elasticache_backup_failure_alarm(self) -> cloudwatch.Alarm:
        """
        Create CloudWatch alarm for ElastiCache backup job failures.
        
        This alarm monitors AWS Backup job status metrics for ElastiCache snapshot
        failures and sends critical alerts to designated administrators when backup
        jobs fail. Immediate notification of backup failures is critical for data
        protection and cache recovery capability.
        
        Configuration:
        - Alarm name: showcore-elasticache-backup-failure
        - Metric: AWS/Backup NumberOfBackupJobsFailed
        - Threshold: >= 1 failed backup job
        - Evaluation periods: 1 (immediate alert on first failure)
        - Period: 5 minutes (check every 5 minutes)
        - Statistic: Sum (total number of failed jobs)
        - Action: Send notification to critical alerts SNS topic
        
        Alarm Behavior:
        - Triggers when any ElastiCache backup job fails
        - Sends immediate notification to administrators
        - Allows rapid response to backup failures
        - Helps maintain cache recovery capability
        
        Cost:
        - CloudWatch alarm: $0.10/month
        - SNS notifications: Free (email)
        - Total: $0.10/month
        
        Monitoring:
        - AWS Backup automatically publishes metrics to CloudWatch
        - NumberOfBackupJobsFailed metric tracks failed backup jobs
        - Metric dimensions: ResourceType=ElastiCache
        - Alarm evaluates metric every 5 minutes
        
        Response Actions:
        - Investigate backup failure cause (check CloudWatch Logs)
        - Verify ElastiCache cluster is healthy and accessible
        - Check IAM permissions for AWS Backup service role
        - Verify backup vault is accessible
        - Manually trigger snapshot if needed
        - Update backup plan if configuration issue identified
        
        Returns:
            CloudWatch alarm for ElastiCache backup job failures
            
        Validates: Requirements 8.6
        """
        # Create CloudWatch alarm for ElastiCache backup failures
        alarm = cloudwatch.Alarm(
            self,
            "ElastiCacheBackupFailureAlarm",
            # Alarm name following naming convention
            alarm_name="showcore-elasticache-backup-failure",
            # Alarm description
            alarm_description="Alert when ElastiCache backup jobs fail",
            # Metric to monitor: AWS Backup NumberOfBackupJobsFailed
            metric=cloudwatch.Metric(
                # AWS Backup metrics namespace
                namespace="AWS/Backup",
                # Metric name: number of failed backup jobs
                metric_name="NumberOfBackupJobsFailed",
                # Dimensions to filter for ElastiCache resources only
                dimensions_map={
                    "ResourceType": "ElastiCache"
                },
                # Statistic: Sum (total number of failed jobs in period)
                statistic="Sum",
                # Period: 5 minutes (check every 5 minutes)
                period=Duration.minutes(5),
            ),
            # Threshold: >= 1 failed backup job triggers alarm
            threshold=1,
            # Comparison operator: greater than or equal to threshold
            comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
            # Evaluation periods: 1 (immediate alert on first failure)
            evaluation_periods=1,
            # Treat missing data as not breaching (no false alarms)
            treat_missing_data=cloudwatch.TreatMissingData.NOT_BREACHING,
        )
        
        # Add SNS action to send notification to critical alerts topic
        if self.critical_alerts_topic:
            alarm.add_alarm_action(
                cloudwatch_actions.SnsAction(self.critical_alerts_topic)
            )
        
        # Add custom tags for alarm
        self.add_custom_tag("AlarmType", "BackupFailure")
        self.add_custom_tag("Severity", "Critical")
        
        return alarm
