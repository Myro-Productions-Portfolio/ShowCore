# ADR-004: Monitoring Stack Implementation Strategy

## Status
Accepted - February 3, 2026

## Context

Phase 1 infrastructure requires monitoring and observability for RDS PostgreSQL, ElastiCache Redis, VPC, and S3 resources. The monitoring solution needs to provide visibility into system health, performance metrics, and cost tracking while staying within the project's cost optimization goals.

Current setup:
- Network stack deployed with VPC, subnets, and VPC Endpoints
- Database and cache stacks planned with db.t3.micro RDS and cache.t3.micro ElastiCache
- Target monthly cost under $60
- CloudWatch Logs and Monitoring Interface Endpoints deployed (~$14/month)

Key requirements:
- Monitor critical infrastructure metrics (CPU, memory, storage, connections)
- Alert on threshold breaches for proactive issue detection
- Track costs and resource utilization
- Maintain operational visibility without excessive costs
- Support troubleshooting and performance optimization

## Decision

Implement a cost-optimized monitoring stack using CloudWatch with minimal alarms and 7-day log retention.

Implementation:
- CloudWatch Dashboard with key metrics for all Phase 1 resources
- Critical alarms only (5-7 alarms total)
- SNS topic for email notifications
- 7-day log retention for CloudWatch Logs
- Basic CloudWatch metrics (free)
- No VPC Flow Logs initially (defer until needed)
- No GuardDuty initially (defer until needed)

## Alternatives Considered

### Option 1: Comprehensive Monitoring (Enterprise Pattern)

Deploy full monitoring suite with all available CloudWatch features, VPC Flow Logs, GuardDuty, and detailed alarms.

Advantages:
- Maximum visibility into all infrastructure components
- Proactive threat detection with GuardDuty
- Detailed network traffic analysis with VPC Flow Logs
- Comprehensive alarm coverage for all metrics
- Best practices for production environments

Disadvantages:
- High cost: $15-25/month additional
- VPC Flow Logs: ~$5-10/month for storage and analysis
- GuardDuty: $4.62/month minimum
- CloudWatch alarms: $0.10 each (20+ alarms = $2+/month)
- Overkill for low-traffic project website
- Most features unused in Phase 1

Monthly cost: $15-25 additional

### Option 2: Minimal Monitoring (Cost-First)

Use only free CloudWatch basic metrics with no alarms, no dashboard, and no log retention.

Advantages:
- Zero additional cost
- Simplest implementation
- Metrics still available in CloudWatch console

Disadvantages:
- No proactive alerting (reactive troubleshooting only)
- No centralized dashboard (must navigate multiple console pages)
- No log retention (logs deleted after 2 weeks by default)
- Poor operational visibility
- Difficult to troubleshoot issues
- Not suitable for learning operational best practices

Monthly cost: $0 (not viable for learning project)

### Option 3: Cost-Optimized Monitoring (Selected)

Deploy CloudWatch dashboard with critical alarms only, 7-day log retention, and defer expensive features.

Advantages:
- Balanced cost at ~$1-2/month for alarms
- Centralized dashboard for all key metrics
- Proactive alerting for critical issues
- Sufficient log retention for troubleshooting
- Can add features later if needed
- Follows operational best practices within budget

Disadvantages:
- Limited alarm coverage (only critical metrics)
- No VPC Flow Logs (harder to troubleshoot network issues)
- No GuardDuty (no automated threat detection)
- Short log retention (7 days vs 30+ days)

Monthly cost: ~$1-2 additional

### Option 4: Third-Party Monitoring

Use third-party monitoring service like Datadog, New Relic, or Grafana Cloud.

Advantages:
- Better visualization and dashboards
- More advanced alerting capabilities
- Multi-cloud support
- Better user experience

Disadvantages:
- Additional cost: $15-50/month minimum
- Requires integration setup
- Another service to manage
- Not necessary for Phase 1 scope
- Defeats AWS-native learning goals

Monthly cost: $15-50 additional

## Rationale

The decision prioritizes operational visibility within strict cost constraints while maintaining learning value.

**Cost optimization**: CloudWatch basic metrics are free. Alarms cost $0.10 each, so 5-7 critical alarms = $0.50-0.70/month. Dashboard is free. 7-day log retention is minimal cost. Total monitoring cost under $2/month fits within the $60 budget.

**Operational best practices**: Even in a learning project, monitoring is essential. The monitoring stack provides proactive alerting for critical issues (RDS CPU > 80%, storage > 85%, backup failures). This teaches operational excellence principles from the Well-Architected Framework.

**Learning value**: Implementing CloudWatch dashboards, alarms, and SNS notifications provides hands-on experience with AWS monitoring services. Understanding which metrics matter and how to set appropriate thresholds is valuable for Solutions Architect certification.

**Scalability**: The architecture supports adding more alarms, enabling VPC Flow Logs, or activating GuardDuty later if needed. Starting minimal and scaling up based on actual needs is a sound approach.

Phase 1 scope influenced the decision. With only RDS and ElastiCache deployed, the critical metrics are well-defined: CPU, memory, storage, connections, and backup status. No application tier means no application-level metrics needed yet.

Trade-offs accepted:

Limited alarm coverage - Only 5-7 critical alarms instead of 20+ comprehensive alarms. Acceptable for low-traffic project website. Can add more alarms if specific issues arise.

No VPC Flow Logs - Saves $5-10/month but makes network troubleshooting harder. Acceptable since VPC Endpoints are well-documented and network issues should be rare. Can enable temporarily if troubleshooting needed.

No GuardDuty - Saves $4.62/month but no automated threat detection. Acceptable for Phase 1 data layer with no public endpoints. CloudTrail still provides audit logging. Can enable in Phase 2 when application tier is deployed.

Short log retention - 7 days instead of 30+ days. Acceptable for learning project. Logs are primarily for troubleshooting recent issues. Can increase retention if needed.

## Consequences

### What we gain

Cost-effective monitoring at ~$1-2/month. Fits comfortably within the $60 budget while providing essential operational visibility.

Proactive alerting for critical issues. Email notifications via SNS when RDS CPU exceeds 80%, storage exceeds 85%, or backups fail. Enables quick response before issues become critical.

Centralized dashboard for all Phase 1 resources. Single pane of glass showing RDS metrics, ElastiCache metrics, VPC Endpoint metrics, and S3 metrics. Saves time navigating multiple console pages.

Sufficient log retention for troubleshooting. 7 days covers most troubleshooting scenarios. Logs older than 7 days rarely needed for low-traffic project.

Learning experience with CloudWatch. Hands-on experience creating dashboards, configuring alarms, setting up SNS topics, and defining metric thresholds. Valuable for Solutions Architect certification.

Foundation for future monitoring. Easy to add more alarms, increase log retention, or enable VPC Flow Logs/GuardDuty later based on actual needs.

### What we lose

Limited alarm coverage. Only 5-7 critical alarms instead of comprehensive coverage. Won't be alerted for non-critical issues. Must check dashboard manually for trends.

No VPC Flow Logs. Harder to troubleshoot network connectivity issues. Can't analyze traffic patterns or identify security issues from network traffic. Must rely on CloudTrail and application logs.

No GuardDuty. No automated threat detection or anomaly detection. Must rely on CloudTrail logs and manual security reviews. Acceptable for Phase 1 with no public endpoints.

Short log retention. Logs deleted after 7 days. Can't investigate issues that occurred more than a week ago. Must increase retention if long-term analysis needed.

No advanced monitoring features. No custom metrics, no detailed monitoring (1-minute intervals), no anomaly detection. Basic monitoring only.

### How to handle the downsides

Document monitoring gaps in runbooks. Create troubleshooting guides that account for limited monitoring. Include steps to enable VPC Flow Logs temporarily if network issues arise.

Set up billing alerts at $50 and $100. Catch any unexpected monitoring costs early. Review Cost Explorer monthly to track CloudWatch charges.

Review dashboard weekly. Since alarm coverage is limited, manual dashboard review catches trends and non-critical issues. Set calendar reminder for weekly review.

Enable VPC Flow Logs on-demand. If network troubleshooting needed, enable VPC Flow Logs temporarily, troubleshoot, then disable. Keeps costs low while maintaining troubleshooting capability.

Plan to enable GuardDuty in Phase 2. When application tier is deployed with public endpoints, security monitoring becomes more critical. Budget for GuardDuty in Phase 2.

Increase log retention if needed. If 7 days proves insufficient, can increase to 14 or 30 days. Cost scales linearly with retention period.

## Implementation

### CloudWatch Dashboard

Single dashboard named "ShowCore-Phase1-Dashboard" with widgets for:

**RDS Metrics**:
- CPU Utilization (%)
- Database Connections (count)
- Free Storage Space (GB)
- Read/Write Latency (ms)
- Read/Write IOPS

**ElastiCache Metrics**:
- CPU Utilization (%)
- Memory Utilization (%)
- Cache Hits/Misses (count)
- Current Connections (count)
- Network Bytes In/Out

**VPC Endpoint Metrics**:
- Packets In/Out (count)
- Bytes In/Out (count)
- Active Connections (count)

**S3 Metrics**:
- Bucket Size (bytes)
- Number of Objects (count)
- All Requests (count)

### CloudWatch Alarms

Critical alarms only (5-7 total):

1. **RDS-CPU-High**: RDS CPU > 80% for 5 minutes → ALARM
2. **RDS-Storage-Low**: RDS free storage < 15% → ALARM
3. **RDS-Connections-High**: RDS connections > 80 → ALARM
4. **ElastiCache-CPU-High**: ElastiCache CPU > 75% for 5 minutes → ALARM
5. **ElastiCache-Memory-High**: ElastiCache memory > 80% → ALARM
6. **Backup-Failure**: RDS backup job failed → ALARM
7. **Billing-Alert**: Estimated charges > $50 → ALARM (configured in Billing console)

### SNS Topic

Topic name: `showcore-phase1-alerts`
- Email subscription for notifications
- Used by all CloudWatch alarms
- Confirm subscription after deployment

### Log Retention

Set retention to 7 days for all log groups:
- `/aws/rds/instance/showcore-database-production-rds/postgresql`
- `/aws/elasticache/showcore-cache-production-redis`
- CloudWatch Logs Interface Endpoint logs (if enabled)

### Deferred Features

Not implementing initially (can enable later):
- VPC Flow Logs (enable if network troubleshooting needed)
- GuardDuty (enable in Phase 2 with application tier)
- Detailed monitoring (1-minute intervals)
- Custom metrics
- Anomaly detection
- CloudWatch Insights queries

## When to revisit this

Should review this decision:

**After Phase 1 deployment** - Check if 5-7 alarms provide sufficient coverage. Review dashboard usability. Assess if 7-day log retention is adequate.

**If troubleshooting network issues** - Enable VPC Flow Logs temporarily to analyze traffic patterns. Disable after troubleshooting to save costs.

**Before Phase 2** - Assess if application tier needs additional monitoring. Plan to enable GuardDuty for security monitoring. Consider custom metrics for application performance.

**If alarm fatigue occurs** - Review alarm thresholds and adjust if too many false positives. Consider adding more alarms if critical issues are missed.

**Quarterly cost review** - Check CloudWatch costs in Cost Explorer. Verify monitoring costs stay under $2/month. Adjust if costs exceed budget.

**If log retention proves insufficient** - Increase to 14 or 30 days if troubleshooting requires older logs. Monitor cost impact.

## References

- AWS CloudWatch documentation: https://docs.aws.amazon.com/cloudwatch/
- CloudWatch pricing: https://aws.amazon.com/cloudwatch/pricing/
- AWS Well-Architected Operational Excellence: https://docs.aws.amazon.com/wellarchitected/latest/operational-excellence-pillar/
- Phase 1 requirements and design docs in this spec directory

## Related decisions

- ADR-001: VPC Endpoints over NAT Gateway - monitoring via CloudWatch Interface Endpoints
- ADR-002: Infrastructure as Code tool selection - monitoring stack implemented in AWS CDK
- ADR-003: Public repository security - no sensitive data in monitoring configurations
