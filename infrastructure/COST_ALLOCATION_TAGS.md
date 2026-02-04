# Cost Allocation Tags - Activation Plan

## Overview

This document describes the plan to activate cost allocation tags in AWS Billing console after Phase 1 infrastructure deployment. Cost allocation tags enable tracking and analyzing AWS costs by project, component, environment, and cost center.

## Required Tags

All ShowCore Phase 1 resources are tagged with the following standard tags:

| Tag Key | Tag Value | Purpose |
|---------|-----------|---------|
| Project | ShowCore | Identifies the project |
| Phase | Phase1 | Identifies the migration phase |
| Environment | production/staging/development | Identifies the environment |
| Component | Network/Database/Cache/Storage/CDN/Monitoring/Backup | Identifies the infrastructure component |
| ManagedBy | CDK | Identifies the IaC tool |
| CostCenter | Engineering | Identifies the cost center for billing |

## Activation Steps

### Step 1: Activate Cost Allocation Tags (After Deployment)

1. Log in to AWS Console with administrator credentials
2. Navigate to **Billing and Cost Management** > **Cost Allocation Tags**
3. In the **User-Defined Cost Allocation Tags** section, select the following tags:
   - ✅ Project
   - ✅ Phase
   - ✅ Environment
   - ✅ Component
   - ✅ CostCenter
   - ✅ ManagedBy (optional, for tracking IaC tool)
4. Click **Activate** button
5. Wait 24 hours for tags to appear in Cost Explorer and billing reports

**Note**: Tags must be activated before they appear in Cost Explorer. Historical costs before activation will not have tag data.

### Step 2: Verify Tag Activation (24 Hours After Activation)

1. Navigate to **Cost Explorer**
2. Click **Filters** and verify the following tags are available:
   - Project
   - Phase
   - Environment
   - Component
   - CostCenter
3. Create a test report filtered by `Project = ShowCore`
4. Verify costs are displayed correctly

### Step 3: Create Cost Allocation Reports

Create the following reports in Cost Explorer:

#### Report 1: Monthly Costs by Component

- **Name**: ShowCore - Monthly Costs by Component
- **Time Range**: Last 3 months
- **Granularity**: Monthly
- **Group By**: Component tag
- **Filter**: Project = ShowCore
- **Chart Type**: Stacked bar chart

**Purpose**: Track which components (Database, Cache, Storage, etc.) consume the most costs.

#### Report 2: Monthly Costs by Environment

- **Name**: ShowCore - Monthly Costs by Environment
- **Time Range**: Last 3 months
- **Granularity**: Monthly
- **Group By**: Environment tag
- **Filter**: Project = ShowCore
- **Chart Type**: Stacked bar chart

**Purpose**: Track costs across production, staging, and development environments.

#### Report 3: Total ShowCore Project Costs

- **Name**: ShowCore - Total Project Costs
- **Time Range**: Last 6 months
- **Granularity**: Monthly
- **Group By**: None
- **Filter**: Project = ShowCore
- **Chart Type**: Line chart

**Purpose**: Track total project costs over time and identify trends.

#### Report 4: Cost Breakdown by Service and Component

- **Name**: ShowCore - Service and Component Breakdown
- **Time Range**: Last month
- **Granularity**: Daily
- **Group By**: Service, Component tag
- **Filter**: Project = ShowCore
- **Chart Type**: Stacked area chart

**Purpose**: Identify which AWS services and components drive costs.

### Step 4: Set Up Billing Alerts by Tag

Create CloudWatch billing alarms filtered by tags:

#### Alarm 1: Database Component Cost Alert

```python
# In monitoring_stack.py (already implemented)
database_cost_alarm = cloudwatch.Alarm(
    self, "DatabaseCostAlarm",
    alarm_name="showcore-database-cost-high",
    metric=cloudwatch.Metric(
        namespace="AWS/Billing",
        metric_name="EstimatedCharges",
        dimensions_map={
            "Currency": "USD",
            "Tag:Component": "Database"
        },
        statistic="Maximum",
        period=Duration.hours(6)
    ),
    threshold=20,  # Alert if Database costs > $20/month
    evaluation_periods=1,
    comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD
)
```

#### Alarm 2: Cache Component Cost Alert

```python
cache_cost_alarm = cloudwatch.Alarm(
    self, "CacheCostAlarm",
    alarm_name="showcore-cache-cost-high",
    metric=cloudwatch.Metric(
        namespace="AWS/Billing",
        metric_name="EstimatedCharges",
        dimensions_map={
            "Currency": "USD",
            "Tag:Component": "Cache"
        },
        statistic="Maximum",
        period=Duration.hours(6)
    ),
    threshold=15,  # Alert if Cache costs > $15/month
    evaluation_periods=1,
    comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD
)
```

#### Alarm 3: Total ShowCore Project Cost Alert

```python
# Already implemented in monitoring_stack.py
project_cost_alarm = cloudwatch.Alarm(
    self, "ProjectCostAlarm",
    alarm_name="showcore-project-cost-high",
    metric=cloudwatch.Metric(
        namespace="AWS/Billing",
        metric_name="EstimatedCharges",
        dimensions_map={
            "Currency": "USD",
            "Tag:Project": "ShowCore"
        },
        statistic="Maximum",
        period=Duration.hours(6)
    ),
    threshold=50,  # Alert if total ShowCore costs > $50/month
    evaluation_periods=1,
    comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD
)
```

### Step 5: Create Cost Allocation Report (Optional)

For detailed cost analysis, create a Cost and Usage Report (CUR):

1. Navigate to **Billing and Cost Management** > **Cost and Usage Reports**
2. Click **Create report**
3. Configure report:
   - **Report name**: ShowCore-CUR
   - **Time granularity**: Daily
   - **Include**: Resource IDs
   - **Enable**: Data integration for Amazon Athena
   - **Report versioning**: Overwrite existing report
4. Configure S3 bucket:
   - **S3 bucket**: showcore-billing-reports-{account-id}
   - **Report path prefix**: cur/
   - **Compression**: GZIP
5. Click **Next** and **Review and Complete**
6. Wait 24 hours for first report to be generated

**Query CUR with Athena**:

```sql
-- Total costs by component for last month
SELECT
    line_item_usage_account_id,
    resource_tags_user_component AS component,
    SUM(line_item_unblended_cost) AS total_cost
FROM
    showcore_cur
WHERE
    resource_tags_user_project = 'ShowCore'
    AND year = '2026'
    AND month = '02'
GROUP BY
    line_item_usage_account_id,
    resource_tags_user_component
ORDER BY
    total_cost DESC;
```

## Tag Policy Enforcement (Optional)

To enforce tagging on all new resources, create a tag policy in AWS Organizations:

### Step 1: Create Tag Policy

1. Navigate to **AWS Organizations** > **Policies** > **Tag policies**
2. Click **Create policy**
3. Enter policy name: `ShowCore-Required-Tags`
4. Enter policy content:

```json
{
  "tags": {
    "Project": {
      "tag_key": {
        "@@assign": "Project"
      },
      "tag_value": {
        "@@assign": [
          "ShowCore"
        ]
      },
      "enforced_for": {
        "@@assign": [
          "ec2:instance",
          "rds:db",
          "elasticache:cluster",
          "s3:bucket",
          "cloudfront:distribution"
        ]
      }
    },
    "Phase": {
      "tag_key": {
        "@@assign": "Phase"
      },
      "tag_value": {
        "@@assign": [
          "Phase1",
          "Phase2",
          "Phase3"
        ]
      },
      "enforced_for": {
        "@@assign": [
          "ec2:instance",
          "rds:db",
          "elasticache:cluster",
          "s3:bucket",
          "cloudfront:distribution"
        ]
      }
    },
    "Environment": {
      "tag_key": {
        "@@assign": "Environment"
      },
      "tag_value": {
        "@@assign": [
          "production",
          "staging",
          "development"
        ]
      },
      "enforced_for": {
        "@@assign": [
          "ec2:instance",
          "rds:db",
          "elasticache:cluster",
          "s3:bucket",
          "cloudfront:distribution"
        ]
      }
    },
    "ManagedBy": {
      "tag_key": {
        "@@assign": "ManagedBy"
      },
      "tag_value": {
        "@@assign": [
          "CDK",
          "Terraform",
          "Manual"
        ]
      },
      "enforced_for": {
        "@@assign": [
          "ec2:instance",
          "rds:db",
          "elasticache:cluster",
          "s3:bucket",
          "cloudfront:distribution"
        ]
      }
    },
    "CostCenter": {
      "tag_key": {
        "@@assign": "CostCenter"
      },
      "tag_value": {
        "@@assign": [
          "Engineering",
          "Operations",
          "Finance"
        ]
      },
      "enforced_for": {
        "@@assign": [
          "ec2:instance",
          "rds:db",
          "elasticache:cluster",
          "s3:bucket",
          "cloudfront:distribution"
        ]
      }
    }
  }
}
```

### Step 2: Attach Tag Policy

1. In the tag policy list, select `ShowCore-Required-Tags`
2. Click **Attach** button
3. Select the ShowCore organizational unit
4. Click **Attach policy**

### Step 3: Verify Tag Policy

1. Attempt to create a resource without required tags (should fail)
2. Attempt to create a resource with required tags (should succeed)
3. Review tag policy compliance in AWS Organizations console

**Note**: Tag policies are preventive controls. Resources created without required tags will be rejected.

## Cost Optimization Monitoring

### Monthly Cost Review Checklist

- [ ] Review Cost Explorer reports for ShowCore project
- [ ] Verify costs are within expected range (~$3-10/month during Free Tier, ~$49-60/month after)
- [ ] Identify any unexpected cost increases
- [ ] Review costs by component (Database, Cache, Storage, etc.)
- [ ] Review costs by environment (production, staging, development)
- [ ] Verify billing alerts are working correctly
- [ ] Check for untagged resources (should be none)
- [ ] Review Cost and Usage Report (if enabled)

### Cost Optimization Actions

If costs exceed expected range:

1. **Identify high-cost components**: Use Cost Explorer to identify which components are driving costs
2. **Review resource utilization**: Check CloudWatch metrics for CPU, memory, storage utilization
3. **Right-size resources**: Scale down underutilized resources (e.g., db.t3.micro → db.t3.nano)
4. **Review lifecycle policies**: Ensure S3 lifecycle policies are transitioning old backups to Glacier
5. **Disable unused features**: Disable VPC Flow Logs, GuardDuty, or other optional monitoring if not needed
6. **Review VPC Endpoints**: Verify Interface Endpoints are still needed (each costs ~$7/month)
7. **Check for orphaned resources**: Look for resources that should have been deleted

## Expected Monthly Costs by Component

| Component | During Free Tier (12 months) | After Free Tier |
|-----------|------------------------------|-----------------|
| Database (RDS db.t3.micro) | $0 | ~$15/month |
| Cache (ElastiCache cache.t3.micro) | $0 | ~$12/month |
| VPC Endpoints (3-4 Interface Endpoints) | ~$21-28/month | ~$21-28/month |
| Storage (S3) | ~$1-5/month | ~$1-5/month |
| CDN (CloudFront) | ~$1-5/month | ~$1-5/month |
| Monitoring (CloudWatch) | ~$0-5/month | ~$0-5/month |
| Data Transfer | ~$0-5/month | ~$0-5/month |
| **Total** | **~$3-10/month** | **~$49-60/month** |

## Troubleshooting

### Tags Not Appearing in Cost Explorer

**Problem**: Tags are activated but not appearing in Cost Explorer.

**Solution**:
1. Wait 24 hours after activation
2. Verify tags are applied to resources in AWS Console
3. Check that resources were created after tag activation
4. Historical costs before activation will not have tag data

### Billing Alarms Not Triggering

**Problem**: Billing alarms are not triggering when costs exceed threshold.

**Solution**:
1. Verify billing alarms are created in us-east-1 region (billing metrics only available in us-east-1)
2. Check that SNS topic has valid email subscription
3. Confirm email subscription (check spam folder)
4. Verify alarm threshold is set correctly
5. Check that alarm is in "OK" state (not "INSUFFICIENT_DATA")

### Untagged Resources

**Problem**: Some resources are missing required tags.

**Solution**:
1. Identify untagged resources using AWS Resource Groups Tagging API
2. Verify resources were created by CDK (should have tags automatically)
3. Check if resources were created manually (should be avoided)
4. Apply tags manually if needed (but prefer recreating with CDK)
5. Enable tag policy to prevent future untagged resources

## References

- [AWS Cost Allocation Tags](https://docs.aws.amazon.com/awsaccountbilling/latest/aboutv2/cost-alloc-tags.html)
- [AWS Cost Explorer](https://docs.aws.amazon.com/cost-management/latest/userguide/ce-what-is.html)
- [AWS Cost and Usage Report](https://docs.aws.amazon.com/cur/latest/userguide/what-is-cur.html)
- [AWS Tag Policies](https://docs.aws.amazon.com/organizations/latest/userguide/orgs_manage_policies_tag-policies.html)
- [AWS Billing Alarms](https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/monitor_estimated_charges_with_cloudwatch.html)

---

**Validates**: Requirements 9.6, 1.5
**Last Updated**: February 4, 2026
**Maintained By**: ShowCore Engineering Team
