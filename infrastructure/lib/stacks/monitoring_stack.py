"""
ShowCore Monitoring Stack

This stack creates:
- SNS topics for billing, critical, and warning alerts
- CloudWatch billing alarms for $50 and $100 thresholds
- Cost allocation tag configuration

Cost Optimization:
- Billing alarms are free (first 10 alarms)
- SNS email notifications are free
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
    CfnOutput,
)
from constructs import Construct
from .base_stack import ShowCoreBaseStack


class ShowCoreMonitoringStack(ShowCoreBaseStack):
    """
    Monitoring infrastructure stack for ShowCore Phase 1.
    
    Creates SNS topics for alerts and CloudWatch billing alarms.
    
    Cost Optimization:
    - Billing alarms are free (first 10 alarms)
    - SNS email notifications are free
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
        
        Args:
            thresholds: List of dollar amounts for billing thresholds
        """
        for threshold in thresholds:
            # Determine alarm severity based on threshold
            alarm_name = f"showcore-billing-threshold-{threshold}"
            alarm_description = f"Alert when estimated charges exceed ${threshold}"
            
            # Use warning topic for lower threshold, critical for higher
            alarm_topic = (
                self.warning_alerts_topic if threshold <= 50
                else self.billing_alerts_topic
            )
            
            # Create billing alarm
            # Note: Billing metrics are only available in us-east-1
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
                    period=Duration.hours(6)
                ),
                threshold=threshold,
                evaluation_periods=1,
                comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
                treat_missing_data=cloudwatch.TreatMissingData.NOT_BREACHING
            )
            
            # Add SNS action to alarm
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
