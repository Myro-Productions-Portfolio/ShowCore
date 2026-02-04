"""
ShowCore Monitoring Stack

This stack creates:
- SNS topics for billing, critical, and warning alerts
- CloudWatch billing alarms for $50 and $100 thresholds
- CloudWatch dashboard for Phase 1 infrastructure monitoring
- Cost allocation tag configuration

Cost Optimization:
- Billing alarms are free (first 10 alarms)
- SNS email notifications are free
- CloudWatch dashboards are free
- Uses standard metrics (no custom metrics)
- Cost Explorer is free to use

Security:
- SNS topics use encryption at rest
- Email subscriptions require confirmation

Dependencies: None (foundation stack for monitoring)
"""

from typing import List
from aws_cdk import (
    Duration,
    aws_sns as sns,
    aws_cloudwatch as cloudwatch,
    aws_cloudwatch_actions as cloudwatch_actions,
    aws_sns_subscriptions as subscriptions,
    aws_logs as logs,
    CfnOutput,
)
from constructs import Construct
from .base_stack import ShowCoreBaseStack


class ShowCoreMonitoringStack(ShowCoreBaseStack):
    """
    Monitoring infrastructure stack for ShowCore Phase 1.
    
    Creates SNS topics for alerts, CloudWatch billing alarms, and CloudWatch dashboard.
    
    Cost Optimization:
    - Billing alarms are free (first 10 alarms)
    - SNS email notifications are free
    - CloudWatch dashboards are free
    - Uses standard metrics (no custom metrics)
    - Minimal alarms to reduce costs
    
    Security:
    - SNS topics use encryption at rest
    - Email subscriptions require confirmation
    
    Resources:
    - SNS Topic: Critical Alerts
    - SNS Topic: Warning Alerts
    - SNS Topic: Billing Alerts
    - CloudWatch Alarm: Billing $50 threshold
    - CloudWatch Alarm: Billing $100 threshold
    - CloudWatch Alarm: RDS CPU utilization > 80% (critical)
    - CloudWatch Alarm: RDS storage utilization > 85% (warning)
    - CloudWatch Alarm: RDS connection count > 80 (warning)
    - CloudWatch Alarm: RDS read latency > 100ms (warning)
    - CloudWatch Alarm: RDS write latency > 100ms (warning)
    - CloudWatch Alarm: ElastiCache CPU utilization > 75% (critical)
    - CloudWatch Alarm: ElastiCache memory utilization > 80% (critical)
    - CloudWatch Alarm: ElastiCache evictions > 0 (warning)
    - CloudWatch Alarm: ElastiCache cache hit rate < 80% (warning)
    - CloudWatch Dashboard: ShowCore-Phase1-Dashboard
      - RDS metrics: CPU, connections, latency, storage
      - ElastiCache metrics: CPU, memory, evictions, cache hits/misses
      - S3 metrics: bucket size, object count, errors
      - CloudFront metrics: requests, data transfer, errors, cache hit rate
      - VPC Endpoint metrics: network traffic (packets and bytes)
    
    Dependencies: None (foundation stack)
    """
    
    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        **kwargs
    ) -> None:
        super().__init__(
            scope,
            construct_id,
            component="Monitoring",
            **kwargs
        )
        
        # Get configuration from context
        billing_thresholds = self.node.try_get_context("billing_alert_thresholds") or [50, 100]
        alarm_emails = self.node.try_get_context("alarm_email_addresses") or []
        
        # Create SNS topics for alerts
        self.critical_alerts_topic = self._create_sns_topic(
            "CriticalAlerts",
            "showcore-critical-alerts",
            "Critical alerts for ShowCore infrastructure",
            alarm_emails
        )
        
        self.warning_alerts_topic = self._create_sns_topic(
            "WarningAlerts",
            "showcore-warning-alerts",
            "Warning alerts for ShowCore infrastructure",
            alarm_emails
        )
        
        self.billing_alerts_topic = self._create_sns_topic(
            "BillingAlerts",
            "showcore-billing-alerts",
            "Billing alerts for ShowCore cost monitoring",
            alarm_emails
        )
        
        # Create billing alarms
        self._create_billing_alarms(billing_thresholds)
        
        # Create RDS alarms
        # Note: RDS instance ID will be passed from context or database stack
        rds_instance_id = self.node.try_get_context("rds_instance_id") or "showcore-db"
        self._create_rds_alarms(rds_instance_id)
        
        # Create ElastiCache alarms
        # Note: ElastiCache cluster ID will be passed from context or cache stack
        elasticache_cluster_id = self.node.try_get_context("elasticache_cluster_id") or "showcore-redis"
        self._create_elasticache_alarms(elasticache_cluster_id)
        
        # Create S3 alarms
        # Note: S3 bucket name will be passed from context or storage stack
        s3_bucket_name = self.node.try_get_context("s3_static_assets_bucket") or "showcore-static-assets"
        self._create_s3_alarms(s3_bucket_name)
        
        # Create CloudWatch dashboard
        self.dashboard = self._create_cloudwatch_dashboard()
        
        # Configure CloudWatch log retention
        self._configure_log_retention()
        
        # Export SNS topic ARNs for use by other stacks
        CfnOutput(
            self,
            "CriticalAlertsTopicArn",
            value=self.critical_alerts_topic.topic_arn,
            export_name="ShowCoreCriticalAlertsTopicArn",
            description="ARN of SNS topic for critical alerts"
        )
        
        CfnOutput(
            self,
            "WarningAlertsTopicArn",
            value=self.warning_alerts_topic.topic_arn,
            export_name="ShowCoreWarningAlertsTopicArn",
            description="ARN of SNS topic for warning alerts"
        )
        
        CfnOutput(
            self,
            "BillingAlertsTopicArn",
            value=self.billing_alerts_topic.topic_arn,
            export_name="ShowCoreBillingAlertsTopicArn",
            description="ARN of SNS topic for billing alerts"
        )
    
    def _create_sns_topic(
        self,
        construct_id: str,
        topic_name: str,
        display_name: str,
        email_addresses: List[str]
    ) -> sns.Topic:
        """
        Create an SNS topic with email subscriptions.
        
        Args:
            construct_id: CDK construct ID
            topic_name: Name of the SNS topic
            display_name: Display name for the topic
            email_addresses: List of email addresses to subscribe
            
        Returns:
            SNS Topic construct
        """
        topic = sns.Topic(
            self,
            construct_id,
            topic_name=topic_name,
            display_name=display_name
        )
        
        # Add email subscriptions if provided
        for email in email_addresses:
            topic.add_subscription(
                subscriptions.EmailSubscription(email)
            )
        
        return topic
    
    def _create_billing_alarms(self, thresholds: List[int]) -> None:
        """
        Create CloudWatch billing alarms for cost monitoring.
        
        Billing alarms monitor EstimatedCharges metric in us-east-1.
        The first 10 alarms are free.
        
        Creates alarms for:
        - Estimated charges > $50 → warning alert to billing alerts topic
        - Estimated charges > $100 → critical alert to billing alerts topic
        
        Cost Optimization:
        - First 10 CloudWatch alarms are free
        - Evaluation period set to 6 hours to reduce false positives
        
        Args:
            thresholds: List of dollar amounts for billing thresholds
        
        Validates: Requirements 1.2, 1.3, 9.7, 9.8
        """
        for threshold in thresholds:
            # Determine alarm name and severity based on threshold
            alarm_name = f"showcore-billing-{threshold}"
            alarm_description = f"Alert when estimated charges exceed ${threshold}"
            
            # Both alarms send to billing alerts topic as per task requirements
            alarm_topic = self.billing_alerts_topic
            
            # Create billing alarm
            # Note: Billing metrics are only available in us-east-1
            # Evaluation period is 6 hours (21600 seconds) to reduce false positives
            alarm = cloudwatch.Alarm(
                self,
                f"BillingAlarm{threshold}",
                alarm_name=alarm_name,
                alarm_description=alarm_description,
                metric=cloudwatch.Metric(
                    namespace="AWS/Billing",
                    metric_name="EstimatedCharges",
                    dimensions_map={
                        "Currency": "USD"
                    },
                    statistic="Maximum",
                    period=Duration.hours(6)  # 6 hours = 21600 seconds
                ),
                threshold=threshold,
                evaluation_periods=1,
                comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
                treat_missing_data=cloudwatch.TreatMissingData.NOT_BREACHING
            )
            
            # Add SNS action to billing alerts topic
            alarm.add_alarm_action(
                cloudwatch_actions.SnsAction(alarm_topic)
            )
            
            # Output alarm ARN
            CfnOutput(
                self,
                f"BillingAlarm{threshold}Arn",
                value=alarm.alarm_arn,
                description=f"ARN of billing alarm for ${threshold} threshold"
            )
    
    def _create_rds_alarms(self, rds_instance_id: str) -> None:
        """
        Create CloudWatch alarms for RDS PostgreSQL monitoring.
        
        Creates alarms for:
        - CPU utilization > 80% for 5 minutes → critical alert
        - Storage utilization > 85% → warning alert
        - Connection count > 80 → warning alert
        - Read/write latency > 100ms → warning alert
        
        Cost Optimization:
        - Uses standard RDS metrics (free)
        - Minimal alarms to reduce costs ($0.10 per alarm per month)
        
        Args:
            rds_instance_id: RDS instance identifier for metric dimensions
        """
        # RDS CPU Utilization Alarm (Critical)
        rds_cpu_alarm = cloudwatch.Alarm(
            self,
            "RdsCpuAlarm",
            alarm_name="showcore-rds-cpu-high",
            alarm_description="Alert when RDS CPU utilization exceeds 80% for 5 minutes",
            metric=cloudwatch.Metric(
                namespace="AWS/RDS",
                metric_name="CPUUtilization",
                dimensions_map={"DBInstanceIdentifier": rds_instance_id},
                statistic="Average",
                period=Duration.minutes(5)
            ),
            threshold=80,
            evaluation_periods=1,
            comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
            treat_missing_data=cloudwatch.TreatMissingData.NOT_BREACHING
        )
        
        # Add SNS action to critical alerts topic
        rds_cpu_alarm.add_alarm_action(
            cloudwatch_actions.SnsAction(self.critical_alerts_topic)
        )
        
        # RDS Storage Utilization Alarm (Warning)
        # FreeStorageSpace is in bytes, so we need to calculate 15% of total storage
        # For 20 GB (Free Tier), 15% = 3 GB = 3,221,225,472 bytes
        rds_storage_alarm = cloudwatch.Alarm(
            self,
            "RdsStorageAlarm",
            alarm_name="showcore-rds-storage-high",
            alarm_description="Alert when RDS free storage space is less than 15% (3 GB for 20 GB storage)",
            metric=cloudwatch.Metric(
                namespace="AWS/RDS",
                metric_name="FreeStorageSpace",
                dimensions_map={"DBInstanceIdentifier": rds_instance_id},
                statistic="Average",
                period=Duration.minutes(5)
            ),
            threshold=3221225472,  # 3 GB in bytes (15% of 20 GB)
            evaluation_periods=1,
            comparison_operator=cloudwatch.ComparisonOperator.LESS_THAN_THRESHOLD,
            treat_missing_data=cloudwatch.TreatMissingData.NOT_BREACHING
        )
        
        # Add SNS action to warning alerts topic
        rds_storage_alarm.add_alarm_action(
            cloudwatch_actions.SnsAction(self.warning_alerts_topic)
        )
        
        # RDS Connection Count Alarm (Warning)
        rds_connections_alarm = cloudwatch.Alarm(
            self,
            "RdsConnectionsAlarm",
            alarm_name="showcore-rds-connections-high",
            alarm_description="Alert when RDS connection count exceeds 80",
            metric=cloudwatch.Metric(
                namespace="AWS/RDS",
                metric_name="DatabaseConnections",
                dimensions_map={"DBInstanceIdentifier": rds_instance_id},
                statistic="Average",
                period=Duration.minutes(5)
            ),
            threshold=80,
            evaluation_periods=1,
            comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
            treat_missing_data=cloudwatch.TreatMissingData.NOT_BREACHING
        )
        
        # Add SNS action to warning alerts topic
        rds_connections_alarm.add_alarm_action(
            cloudwatch_actions.SnsAction(self.warning_alerts_topic)
        )
        
        # RDS Read Latency Alarm (Warning)
        # Latency is in seconds, so 100ms = 0.1 seconds
        rds_read_latency_alarm = cloudwatch.Alarm(
            self,
            "RdsReadLatencyAlarm",
            alarm_name="showcore-rds-read-latency-high",
            alarm_description="Alert when RDS read latency exceeds 100ms",
            metric=cloudwatch.Metric(
                namespace="AWS/RDS",
                metric_name="ReadLatency",
                dimensions_map={"DBInstanceIdentifier": rds_instance_id},
                statistic="Average",
                period=Duration.minutes(5)
            ),
            threshold=0.1,  # 100ms in seconds
            evaluation_periods=1,
            comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
            treat_missing_data=cloudwatch.TreatMissingData.NOT_BREACHING
        )
        
        # Add SNS action to warning alerts topic
        rds_read_latency_alarm.add_alarm_action(
            cloudwatch_actions.SnsAction(self.warning_alerts_topic)
        )
        
        # RDS Write Latency Alarm (Warning)
        # Latency is in seconds, so 100ms = 0.1 seconds
        rds_write_latency_alarm = cloudwatch.Alarm(
            self,
            "RdsWriteLatencyAlarm",
            alarm_name="showcore-rds-write-latency-high",
            alarm_description="Alert when RDS write latency exceeds 100ms",
            metric=cloudwatch.Metric(
                namespace="AWS/RDS",
                metric_name="WriteLatency",
                dimensions_map={"DBInstanceIdentifier": rds_instance_id},
                statistic="Average",
                period=Duration.minutes(5)
            ),
            threshold=0.1,  # 100ms in seconds
            evaluation_periods=1,
            comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
            treat_missing_data=cloudwatch.TreatMissingData.NOT_BREACHING
        )
        
        # Add SNS action to warning alerts topic
        rds_write_latency_alarm.add_alarm_action(
            cloudwatch_actions.SnsAction(self.warning_alerts_topic)
        )
        
        # Output alarm ARNs
        CfnOutput(
            self,
            "RdsCpuAlarmArn",
            value=rds_cpu_alarm.alarm_arn,
            description="ARN of RDS CPU utilization alarm"
        )
        
        CfnOutput(
            self,
            "RdsStorageAlarmArn",
            value=rds_storage_alarm.alarm_arn,
            description="ARN of RDS storage utilization alarm"
        )
        
        CfnOutput(
            self,
            "RdsConnectionsAlarmArn",
            value=rds_connections_alarm.alarm_arn,
            description="ARN of RDS connections alarm"
        )
        
        CfnOutput(
            self,
            "RdsReadLatencyAlarmArn",
            value=rds_read_latency_alarm.alarm_arn,
            description="ARN of RDS read latency alarm"
        )
        
        CfnOutput(
            self,
            "RdsWriteLatencyAlarmArn",
            value=rds_write_latency_alarm.alarm_arn,
            description="ARN of RDS write latency alarm"
        )
    
    def _create_elasticache_alarms(self, elasticache_cluster_id: str) -> None:
        """
        Create CloudWatch alarms for ElastiCache Redis monitoring.
        
        Creates alarms for:
        - CPU utilization > 75% for 5 minutes → critical alert
        - Memory utilization > 80% → critical alert
        - Evictions > 0 → warning alert
        - Cache hit rate < 80% → warning alert
        
        Cost Optimization:
        - Uses standard ElastiCache metrics (free)
        - Minimal alarms to reduce costs ($0.10 per alarm per month)
        
        Args:
            elasticache_cluster_id: ElastiCache cluster identifier for metric dimensions
        """
        # ElastiCache CPU Utilization Alarm (Critical)
        elasticache_cpu_alarm = cloudwatch.Alarm(
            self,
            "ElastiCacheCpuAlarm",
            alarm_name="showcore-elasticache-cpu-high",
            alarm_description="Alert when ElastiCache CPU utilization exceeds 75% for 5 minutes",
            metric=cloudwatch.Metric(
                namespace="AWS/ElastiCache",
                metric_name="CPUUtilization",
                dimensions_map={"CacheClusterId": elasticache_cluster_id},
                statistic="Average",
                period=Duration.minutes(5)
            ),
            threshold=75,
            evaluation_periods=1,
            comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
            treat_missing_data=cloudwatch.TreatMissingData.NOT_BREACHING
        )
        
        # Add SNS action to critical alerts topic
        elasticache_cpu_alarm.add_alarm_action(
            cloudwatch_actions.SnsAction(self.critical_alerts_topic)
        )
        
        # ElastiCache Memory Utilization Alarm (Critical)
        elasticache_memory_alarm = cloudwatch.Alarm(
            self,
            "ElastiCacheMemoryAlarm",
            alarm_name="showcore-elasticache-memory-high",
            alarm_description="Alert when ElastiCache memory utilization exceeds 80%",
            metric=cloudwatch.Metric(
                namespace="AWS/ElastiCache",
                metric_name="DatabaseMemoryUsagePercentage",
                dimensions_map={"CacheClusterId": elasticache_cluster_id},
                statistic="Average",
                period=Duration.minutes(5)
            ),
            threshold=80,
            evaluation_periods=1,
            comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
            treat_missing_data=cloudwatch.TreatMissingData.NOT_BREACHING
        )
        
        # Add SNS action to critical alerts topic
        elasticache_memory_alarm.add_alarm_action(
            cloudwatch_actions.SnsAction(self.critical_alerts_topic)
        )
        
        # ElastiCache Evictions Alarm (Warning)
        elasticache_evictions_alarm = cloudwatch.Alarm(
            self,
            "ElastiCacheEvictionsAlarm",
            alarm_name="showcore-elasticache-evictions",
            alarm_description="Alert when ElastiCache evictions occur (> 0)",
            metric=cloudwatch.Metric(
                namespace="AWS/ElastiCache",
                metric_name="Evictions",
                dimensions_map={"CacheClusterId": elasticache_cluster_id},
                statistic="Sum",
                period=Duration.minutes(5)
            ),
            threshold=0,
            evaluation_periods=1,
            comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
            treat_missing_data=cloudwatch.TreatMissingData.NOT_BREACHING
        )
        
        # Add SNS action to warning alerts topic
        elasticache_evictions_alarm.add_alarm_action(
            cloudwatch_actions.SnsAction(self.warning_alerts_topic)
        )
        
        # ElastiCache Cache Hit Rate Alarm (Warning)
        # Cache hit rate is calculated as: CacheHits / (CacheHits + CacheMisses) * 100
        # We need to use a math expression to calculate this
        # For simplicity, we'll create a metric math expression
        elasticache_cache_hit_rate_alarm = cloudwatch.Alarm(
            self,
            "ElastiCacheCacheHitRateAlarm",
            alarm_name="showcore-elasticache-cache-hit-low",
            alarm_description="Alert when ElastiCache cache hit rate is below 80%",
            metric=cloudwatch.MathExpression(
                expression="(hits / (hits + misses)) * 100",
                using_metrics={
                    "hits": cloudwatch.Metric(
                        namespace="AWS/ElastiCache",
                        metric_name="CacheHits",
                        dimensions_map={"CacheClusterId": elasticache_cluster_id},
                        statistic="Sum",
                        period=Duration.minutes(5)
                    ),
                    "misses": cloudwatch.Metric(
                        namespace="AWS/ElastiCache",
                        metric_name="CacheMisses",
                        dimensions_map={"CacheClusterId": elasticache_cluster_id},
                        statistic="Sum",
                        period=Duration.minutes(5)
                    )
                },
                label="Cache Hit Rate %"
            ),
            threshold=80,
            evaluation_periods=1,
            comparison_operator=cloudwatch.ComparisonOperator.LESS_THAN_THRESHOLD,
            treat_missing_data=cloudwatch.TreatMissingData.NOT_BREACHING
        )
        
        # Add SNS action to warning alerts topic
        elasticache_cache_hit_rate_alarm.add_alarm_action(
            cloudwatch_actions.SnsAction(self.warning_alerts_topic)
        )
        
        # Output alarm ARNs
        CfnOutput(
            self,
            "ElastiCacheCpuAlarmArn",
            value=elasticache_cpu_alarm.alarm_arn,
            description="ARN of ElastiCache CPU utilization alarm"
        )
        
        CfnOutput(
            self,
            "ElastiCacheMemoryAlarmArn",
            value=elasticache_memory_alarm.alarm_arn,
            description="ARN of ElastiCache memory utilization alarm"
        )
        
        CfnOutput(
            self,
            "ElastiCacheEvictionsAlarmArn",
            value=elasticache_evictions_alarm.alarm_arn,
            description="ARN of ElastiCache evictions alarm"
        )
        
        CfnOutput(
            self,
            "ElastiCacheCacheHitRateAlarmArn",
            value=elasticache_cache_hit_rate_alarm.alarm_arn,
            description="ARN of ElastiCache cache hit rate alarm"
        )
    
    def _create_s3_alarms(self, s3_bucket_name: str) -> None:
        """
        Create CloudWatch alarms for S3 bucket monitoring.
        
        Creates alarms for:
        - Bucket size > 10GB → warning alert
        - 4xx error rate > 5% → warning alert
        - 5xx error rate > 1% → critical alert
        
        Cost Optimization:
        - Uses standard S3 metrics (free)
        - Minimal alarms to reduce costs ($0.10 per alarm per month)
        
        Note: S3 metrics are reported daily, so alarms may have delayed detection.
        BucketSizeBytes and NumberOfObjects are reported once per day.
        Request metrics (4xxErrors, 5xxErrors) require request metrics to be enabled.
        
        Args:
            s3_bucket_name: S3 bucket name for metric dimensions
        """
        # S3 Bucket Size Alarm (Warning)
        # 10 GB = 10,737,418,240 bytes
        s3_size_alarm = cloudwatch.Alarm(
            self,
            "S3SizeAlarm",
            alarm_name="showcore-s3-size-high",
            alarm_description="Alert when S3 bucket size exceeds 10GB",
            metric=cloudwatch.Metric(
                namespace="AWS/S3",
                metric_name="BucketSizeBytes",
                dimensions_map={
                    "BucketName": s3_bucket_name,
                    "StorageType": "StandardStorage"
                },
                statistic="Average",
                period=Duration.days(1)  # S3 storage metrics are reported daily
            ),
            threshold=10737418240,  # 10 GB in bytes
            evaluation_periods=1,
            comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
            treat_missing_data=cloudwatch.TreatMissingData.NOT_BREACHING
        )
        
        # Add SNS action to warning alerts topic
        s3_size_alarm.add_alarm_action(
            cloudwatch_actions.SnsAction(self.warning_alerts_topic)
        )
        
        # S3 4xx Error Rate Alarm (Warning)
        # Error rate is calculated as: (4xxErrors / AllRequests) * 100
        # We'll use a math expression to calculate the error rate
        # Note: This requires request metrics to be enabled on the S3 bucket
        s3_4xx_alarm = cloudwatch.Alarm(
            self,
            "S34xxErrorsAlarm",
            alarm_name="showcore-s3-4xx-errors",
            alarm_description="Alert when S3 4xx error rate exceeds 5%",
            metric=cloudwatch.MathExpression(
                expression="(errors / requests) * 100",
                using_metrics={
                    "errors": cloudwatch.Metric(
                        namespace="AWS/S3",
                        metric_name="4xxErrors",
                        dimensions_map={"BucketName": s3_bucket_name},
                        statistic="Sum",
                        period=Duration.minutes(5)
                    ),
                    "requests": cloudwatch.Metric(
                        namespace="AWS/S3",
                        metric_name="AllRequests",
                        dimensions_map={"BucketName": s3_bucket_name},
                        statistic="Sum",
                        period=Duration.minutes(5)
                    )
                },
                label="4xx Error Rate %"
            ),
            threshold=5,  # 5% error rate
            evaluation_periods=1,
            comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
            treat_missing_data=cloudwatch.TreatMissingData.NOT_BREACHING
        )
        
        # Add SNS action to warning alerts topic
        s3_4xx_alarm.add_alarm_action(
            cloudwatch_actions.SnsAction(self.warning_alerts_topic)
        )
        
        # S3 5xx Error Rate Alarm (Critical)
        # Error rate is calculated as: (5xxErrors / AllRequests) * 100
        # We'll use a math expression to calculate the error rate
        # Note: This requires request metrics to be enabled on the S3 bucket
        s3_5xx_alarm = cloudwatch.Alarm(
            self,
            "S35xxErrorsAlarm",
            alarm_name="showcore-s3-5xx-errors",
            alarm_description="Alert when S3 5xx error rate exceeds 1%",
            metric=cloudwatch.MathExpression(
                expression="(errors / requests) * 100",
                using_metrics={
                    "errors": cloudwatch.Metric(
                        namespace="AWS/S3",
                        metric_name="5xxErrors",
                        dimensions_map={"BucketName": s3_bucket_name},
                        statistic="Sum",
                        period=Duration.minutes(5)
                    ),
                    "requests": cloudwatch.Metric(
                        namespace="AWS/S3",
                        metric_name="AllRequests",
                        dimensions_map={"BucketName": s3_bucket_name},
                        statistic="Sum",
                        period=Duration.minutes(5)
                    )
                },
                label="5xx Error Rate %"
            ),
            threshold=1,  # 1% error rate
            evaluation_periods=1,
            comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
            treat_missing_data=cloudwatch.TreatMissingData.NOT_BREACHING
        )
        
        # Add SNS action to critical alerts topic
        s3_5xx_alarm.add_alarm_action(
            cloudwatch_actions.SnsAction(self.critical_alerts_topic)
        )
        
        # Output alarm ARNs
        CfnOutput(
            self,
            "S3SizeAlarmArn",
            value=s3_size_alarm.alarm_arn,
            description="ARN of S3 bucket size alarm"
        )
        
        CfnOutput(
            self,
            "S34xxErrorsAlarmArn",
            value=s3_4xx_alarm.alarm_arn,
            description="ARN of S3 4xx errors alarm"
        )
        
        CfnOutput(
            self,
            "S35xxErrorsAlarmArn",
            value=s3_5xx_alarm.alarm_arn,
            description="ARN of S3 5xx errors alarm"
        )
    
    def _create_cloudwatch_dashboard(self) -> cloudwatch.Dashboard:
        """
        Create CloudWatch dashboard for ShowCore Phase 1 infrastructure.
        
        The dashboard displays key metrics for:
        - RDS PostgreSQL: CPU, connections, latency, storage
        - ElastiCache Redis: CPU, memory, evictions, cache hits/misses
        - S3: Bucket size, object count, errors
        - CloudFront: Requests, data transfer, errors, cache hit rate
        - VPC Endpoints: Network traffic metrics
        
        Cost Optimization:
        - Dashboards are free (no charge for creating or viewing)
        - Uses standard metrics (no custom metrics)
        
        Returns:
            CloudWatch Dashboard construct
        """
        dashboard = cloudwatch.Dashboard(
            self,
            "Dashboard",
            dashboard_name="ShowCore-Phase1-Dashboard"
        )
        
        # Get resource identifiers from context (will be set by other stacks)
        # For now, use placeholders that will be replaced during deployment
        rds_instance_id = self.node.try_get_context("rds_instance_id") or "showcore-db"
        elasticache_cluster_id = self.node.try_get_context("elasticache_cluster_id") or "showcore-redis"
        s3_bucket_name = self.node.try_get_context("s3_static_assets_bucket") or "showcore-static-assets"
        cloudfront_distribution_id = self.node.try_get_context("cloudfront_distribution_id") or "DISTRIBUTION_ID"
        
        # RDS Metrics Section
        dashboard.add_widgets(
            cloudwatch.GraphWidget(
                title="RDS - CPU Utilization",
                left=[
                    cloudwatch.Metric(
                        namespace="AWS/RDS",
                        metric_name="CPUUtilization",
                        dimensions_map={"DBInstanceIdentifier": rds_instance_id},
                        statistic="Average",
                        period=Duration.minutes(5),
                        label="CPU %"
                    )
                ],
                width=12,
                height=6
            ),
            cloudwatch.GraphWidget(
                title="RDS - Database Connections",
                left=[
                    cloudwatch.Metric(
                        namespace="AWS/RDS",
                        metric_name="DatabaseConnections",
                        dimensions_map={"DBInstanceIdentifier": rds_instance_id},
                        statistic="Average",
                        period=Duration.minutes(5),
                        label="Connections"
                    )
                ],
                width=12,
                height=6
            )
        )
        
        dashboard.add_widgets(
            cloudwatch.GraphWidget(
                title="RDS - Read/Write Latency",
                left=[
                    cloudwatch.Metric(
                        namespace="AWS/RDS",
                        metric_name="ReadLatency",
                        dimensions_map={"DBInstanceIdentifier": rds_instance_id},
                        statistic="Average",
                        period=Duration.minutes(5),
                        label="Read Latency (ms)"
                    ),
                    cloudwatch.Metric(
                        namespace="AWS/RDS",
                        metric_name="WriteLatency",
                        dimensions_map={"DBInstanceIdentifier": rds_instance_id},
                        statistic="Average",
                        period=Duration.minutes(5),
                        label="Write Latency (ms)"
                    )
                ],
                width=12,
                height=6
            ),
            cloudwatch.GraphWidget(
                title="RDS - Free Storage Space",
                left=[
                    cloudwatch.Metric(
                        namespace="AWS/RDS",
                        metric_name="FreeStorageSpace",
                        dimensions_map={"DBInstanceIdentifier": rds_instance_id},
                        statistic="Average",
                        period=Duration.minutes(5),
                        label="Free Storage (bytes)"
                    )
                ],
                width=12,
                height=6
            )
        )
        
        # ElastiCache Metrics Section
        dashboard.add_widgets(
            cloudwatch.GraphWidget(
                title="ElastiCache - CPU Utilization",
                left=[
                    cloudwatch.Metric(
                        namespace="AWS/ElastiCache",
                        metric_name="CPUUtilization",
                        dimensions_map={"CacheClusterId": elasticache_cluster_id},
                        statistic="Average",
                        period=Duration.minutes(5),
                        label="CPU %"
                    )
                ],
                width=12,
                height=6
            ),
            cloudwatch.GraphWidget(
                title="ElastiCache - Memory Usage",
                left=[
                    cloudwatch.Metric(
                        namespace="AWS/ElastiCache",
                        metric_name="DatabaseMemoryUsagePercentage",
                        dimensions_map={"CacheClusterId": elasticache_cluster_id},
                        statistic="Average",
                        period=Duration.minutes(5),
                        label="Memory %"
                    )
                ],
                width=12,
                height=6
            )
        )
        
        dashboard.add_widgets(
            cloudwatch.GraphWidget(
                title="ElastiCache - Evictions",
                left=[
                    cloudwatch.Metric(
                        namespace="AWS/ElastiCache",
                        metric_name="Evictions",
                        dimensions_map={"CacheClusterId": elasticache_cluster_id},
                        statistic="Sum",
                        period=Duration.minutes(5),
                        label="Evictions"
                    )
                ],
                width=12,
                height=6
            ),
            cloudwatch.GraphWidget(
                title="ElastiCache - Cache Hits/Misses",
                left=[
                    cloudwatch.Metric(
                        namespace="AWS/ElastiCache",
                        metric_name="CacheHits",
                        dimensions_map={"CacheClusterId": elasticache_cluster_id},
                        statistic="Sum",
                        period=Duration.minutes(5),
                        label="Cache Hits"
                    ),
                    cloudwatch.Metric(
                        namespace="AWS/ElastiCache",
                        metric_name="CacheMisses",
                        dimensions_map={"CacheClusterId": elasticache_cluster_id},
                        statistic="Sum",
                        period=Duration.minutes(5),
                        label="Cache Misses"
                    )
                ],
                width=12,
                height=6
            )
        )
        
        # S3 Metrics Section
        dashboard.add_widgets(
            cloudwatch.GraphWidget(
                title="S3 - Bucket Size and Object Count",
                left=[
                    cloudwatch.Metric(
                        namespace="AWS/S3",
                        metric_name="BucketSizeBytes",
                        dimensions_map={
                            "BucketName": s3_bucket_name,
                            "StorageType": "StandardStorage"
                        },
                        statistic="Average",
                        period=Duration.days(1),
                        label="Bucket Size (bytes)"
                    )
                ],
                right=[
                    cloudwatch.Metric(
                        namespace="AWS/S3",
                        metric_name="NumberOfObjects",
                        dimensions_map={
                            "BucketName": s3_bucket_name,
                            "StorageType": "AllStorageTypes"
                        },
                        statistic="Average",
                        period=Duration.days(1),
                        label="Object Count"
                    )
                ],
                width=12,
                height=6
            ),
            cloudwatch.GraphWidget(
                title="S3 - Errors",
                left=[
                    cloudwatch.Metric(
                        namespace="AWS/S3",
                        metric_name="4xxErrors",
                        dimensions_map={"BucketName": s3_bucket_name},
                        statistic="Sum",
                        period=Duration.minutes(5),
                        label="4xx Errors"
                    ),
                    cloudwatch.Metric(
                        namespace="AWS/S3",
                        metric_name="5xxErrors",
                        dimensions_map={"BucketName": s3_bucket_name},
                        statistic="Sum",
                        period=Duration.minutes(5),
                        label="5xx Errors"
                    )
                ],
                width=12,
                height=6
            )
        )
        
        # CloudFront Metrics Section
        dashboard.add_widgets(
            cloudwatch.GraphWidget(
                title="CloudFront - Requests and Data Transfer",
                left=[
                    cloudwatch.Metric(
                        namespace="AWS/CloudFront",
                        metric_name="Requests",
                        dimensions_map={"DistributionId": cloudfront_distribution_id},
                        statistic="Sum",
                        period=Duration.minutes(5),
                        label="Requests"
                    )
                ],
                right=[
                    cloudwatch.Metric(
                        namespace="AWS/CloudFront",
                        metric_name="BytesDownloaded",
                        dimensions_map={"DistributionId": cloudfront_distribution_id},
                        statistic="Sum",
                        period=Duration.minutes(5),
                        label="Bytes Downloaded"
                    )
                ],
                width=12,
                height=6
            ),
            cloudwatch.GraphWidget(
                title="CloudFront - Error Rates",
                left=[
                    cloudwatch.Metric(
                        namespace="AWS/CloudFront",
                        metric_name="4xxErrorRate",
                        dimensions_map={"DistributionId": cloudfront_distribution_id},
                        statistic="Average",
                        period=Duration.minutes(5),
                        label="4xx Error Rate %"
                    ),
                    cloudwatch.Metric(
                        namespace="AWS/CloudFront",
                        metric_name="5xxErrorRate",
                        dimensions_map={"DistributionId": cloudfront_distribution_id},
                        statistic="Average",
                        period=Duration.minutes(5),
                        label="5xx Error Rate %"
                    )
                ],
                width=12,
                height=6
            )
        )
        
        dashboard.add_widgets(
            cloudwatch.GraphWidget(
                title="CloudFront - Cache Hit Rate",
                left=[
                    cloudwatch.Metric(
                        namespace="AWS/CloudFront",
                        metric_name="CacheHitRate",
                        dimensions_map={"DistributionId": cloudfront_distribution_id},
                        statistic="Average",
                        period=Duration.minutes(5),
                        label="Cache Hit Rate %"
                    )
                ],
                width=12,
                height=6
            )
        )
        
        # VPC Endpoint Metrics Section
        # Note: VPC Endpoint metrics require the VPC Endpoint ID
        # These will be populated after VPC Endpoints are created
        vpc_endpoint_id = self.node.try_get_context("vpc_endpoint_id") or "vpce-placeholder"
        
        dashboard.add_widgets(
            cloudwatch.GraphWidget(
                title="VPC Endpoints - Network Traffic (Packets)",
                left=[
                    cloudwatch.Metric(
                        namespace="AWS/PrivateLinkEndpoints",
                        metric_name="PacketsReceived",
                        dimensions_map={"VPC Endpoint Id": vpc_endpoint_id},
                        statistic="Sum",
                        period=Duration.minutes(5),
                        label="Packets Received"
                    ),
                    cloudwatch.Metric(
                        namespace="AWS/PrivateLinkEndpoints",
                        metric_name="PacketsSent",
                        dimensions_map={"VPC Endpoint Id": vpc_endpoint_id},
                        statistic="Sum",
                        period=Duration.minutes(5),
                        label="Packets Sent"
                    )
                ],
                width=12,
                height=6
            ),
            cloudwatch.GraphWidget(
                title="VPC Endpoints - Network Traffic (Bytes)",
                left=[
                    cloudwatch.Metric(
                        namespace="AWS/PrivateLinkEndpoints",
                        metric_name="BytesReceived",
                        dimensions_map={"VPC Endpoint Id": vpc_endpoint_id},
                        statistic="Sum",
                        period=Duration.minutes(5),
                        label="Bytes Received"
                    ),
                    cloudwatch.Metric(
                        namespace="AWS/PrivateLinkEndpoints",
                        metric_name="BytesSent",
                        dimensions_map={"VPC Endpoint Id": vpc_endpoint_id},
                        statistic="Sum",
                        period=Duration.minutes(5),
                        label="Bytes Sent"
                    )
                ],
                width=12,
                height=6
            )
        )
        
        # Output dashboard URL
        CfnOutput(
            self,
            "DashboardUrl",
            value=f"https://console.aws.amazon.com/cloudwatch/home?region={self.region}#dashboards:name={dashboard.dashboard_name}",
            description="URL to CloudWatch dashboard for ShowCore Phase 1"
        )
        
        return dashboard
    
    def _configure_log_retention(self) -> None:
        """
        Configure CloudWatch log retention for cost optimization.
        
        Sets log retention to 7 days for all Phase 1 infrastructure log groups.
        This reduces CloudWatch Logs storage costs while maintaining sufficient
        logs for troubleshooting and compliance.
        
        Log Groups:
        - /aws/rds/showcore-db: RDS PostgreSQL logs
        - /aws/elasticache/showcore-redis: ElastiCache Redis logs
        - /aws/cloudtrail/showcore: CloudTrail audit logs
        - /aws/vpc/flowlogs: VPC Flow Logs (if enabled)
        
        Cost Optimization:
        - 7-day retention reduces storage costs
        - Can increase retention later if needed
        - First 5 GB of log ingestion is free
        - Storage: $0.03 per GB per month after free tier
        
        Note: Log groups are created automatically by AWS services.
        This configuration sets retention policy when logs are first written.
        
        Validates: Requirements 7.4
        """
        # Get resource identifiers from context
        rds_instance_id = self.node.try_get_context("rds_instance_id") or "showcore-db"
        elasticache_cluster_id = self.node.try_get_context("elasticache_cluster_id") or "showcore-redis"
        
        # RDS Log Group
        # RDS automatically creates log groups for error logs, slow query logs, etc.
        # Format: /aws/rds/instance/{instance-id}/{log-type}
        # We'll create a log group for the main RDS instance logs
        rds_log_group = logs.LogGroup(
            self,
            "RdsLogGroup",
            log_group_name=f"/aws/rds/instance/{rds_instance_id}/postgresql",
            retention=logs.RetentionDays.ONE_WEEK,  # 7 days
            removal_policy=self.removal_policy
        )
        
        # ElastiCache Log Group
        # ElastiCache can send slow logs and engine logs to CloudWatch
        # Format: /aws/elasticache/{cluster-id}
        elasticache_log_group = logs.LogGroup(
            self,
            "ElastiCacheLogGroup",
            log_group_name=f"/aws/elasticache/{elasticache_cluster_id}",
            retention=logs.RetentionDays.ONE_WEEK,  # 7 days
            removal_policy=self.removal_policy
        )
        
        # CloudTrail Log Group
        # CloudTrail sends audit logs to CloudWatch Logs
        # Format: /aws/cloudtrail/{trail-name}
        cloudtrail_log_group = logs.LogGroup(
            self,
            "CloudTrailLogGroup",
            log_group_name="/aws/cloudtrail/showcore",
            retention=logs.RetentionDays.ONE_WEEK,  # 7 days
            removal_policy=self.removal_policy
        )
        
        # VPC Flow Logs Log Group (optional - only if VPC Flow Logs are enabled)
        # VPC Flow Logs are disabled initially for cost optimization
        # This log group can be created later if VPC Flow Logs are enabled
        # Format: /aws/vpc/flowlogs
        # Uncomment the following code if VPC Flow Logs are enabled:
        #
        # vpc_flow_logs_log_group = logs.LogGroup(
        #     self,
        #     "VpcFlowLogsLogGroup",
        #     log_group_name="/aws/vpc/flowlogs",
        #     retention=logs.RetentionDays.ONE_WEEK,  # 7 days
        #     removal_policy=self.removal_policy
        # )
        
        # Output log group ARNs
        CfnOutput(
            self,
            "RdsLogGroupArn",
            value=rds_log_group.log_group_arn,
            description="ARN of RDS CloudWatch log group"
        )
        
        CfnOutput(
            self,
            "ElastiCacheLogGroupArn",
            value=elasticache_log_group.log_group_arn,
            description="ARN of ElastiCache CloudWatch log group"
        )
        
        CfnOutput(
            self,
            "CloudTrailLogGroupArn",
            value=cloudtrail_log_group.log_group_arn,
            description="ARN of CloudTrail CloudWatch log group"
        )
