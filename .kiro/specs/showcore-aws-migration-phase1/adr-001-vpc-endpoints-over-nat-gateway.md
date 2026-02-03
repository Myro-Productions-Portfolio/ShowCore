# ADR-001: VPC Endpoints vs NAT Gateway for Private Subnet Connectivity

## Status
Accepted - February 3, 2026

## Context

Phase 1 infrastructure needs private subnets for RDS PostgreSQL and ElastiCache Redis. These resources need to communicate with AWS services (CloudWatch, S3, Systems Manager) but don't need general internet access.

The standard approach is deploying a NAT Gateway, which costs about $32/month plus data transfer fees. Since this is a learning project focused on cost optimization and hands-on management, I wanted to explore whether VPC Endpoints could provide the same functionality at lower cost.

Current setup:
- AWS account configured with dedicated IAM user (showcore-app)
- VPC designed with public and private subnets across 2 availability zones
- Planning to deploy db.t3.micro RDS and cache.t3.micro ElastiCache (Free Tier eligible)
- Target monthly cost under $60

## Decision

Using VPC Endpoints instead of NAT Gateway for AWS service access from private subnets.

Implementation:
- Gateway Endpoints (free): S3, DynamoDB
- Interface Endpoints (~$7/month each): CloudWatch Logs, CloudWatch Monitoring, Systems Manager
- No NAT Gateway deployment
- Private subnets have no outbound internet connectivity

## Alternatives Considered

### Option 1: NAT Gateway (Standard Pattern)

Deploy a single NAT Gateway in a public subnet with private subnets routing all outbound traffic through it.

Advantages:
- Simple, well-documented AWS pattern
- Full internet access for any use case
- Easy package installation and updates
- No restrictions on third-party services

Disadvantages:
- Fixed cost around $32/month ($0.045/hour + data processing)
- Internet access from data tier increases attack surface
- Less interesting from a learning perspective
- Single point of failure with one NAT Gateway

Monthly cost: $32-40

### Option 2: VPC Endpoints (Selected)

Use Gateway Endpoints for S3/DynamoDB and Interface Endpoints for CloudWatch/Systems Manager. No internet access from private subnets.

Advantages:
- Lower cost at $21-28/month
- Better security posture (no internet access from data tier)
- More complex networking provides better learning experience
- Gateway Endpoints are free
- Traffic stays on AWS backbone

Disadvantages:
- More complex setup and troubleshooting
- Limited to AWS services with endpoint support
- Interface Endpoints cost $7/month each
- Can't reach third-party APIs from private subnets
- Requires more hands-on management

Monthly cost: $21-28 (saves $4-11/month)

### Option 3: Hybrid Approach

Combine VPC Endpoints for AWS services with NAT Gateway for general internet access.

Advantages:
- Maximum flexibility
- Best of both approaches

Disadvantages:
- Highest cost at $53-60/month
- Overkill for Phase 1 (no application tier yet)
- Defeats the cost optimization goal

Monthly cost: $53-60

### Option 4: Complete Isolation

No connectivity at all from private subnets.

Advantages:
- Zero cost
- Maximum security

Disadvantages:
- Can't send logs or metrics to CloudWatch
- Can't backup to S3
- Can't use Systems Manager
- Operationally impractical

Monthly cost: $0 (not viable)

## Rationale

The decision came down to three main factors:

**Cost optimization**: VPC Endpoints save $4-11/month compared to NAT Gateway. Over a year that's $48-132 in savings. For a portfolio project, every dollar counts. The Gateway Endpoints for S3 and DynamoDB are completely free, which is a nice bonus.

**Learning value**: This is primarily a learning project for Solutions Architect certification. VPC Endpoints are more complex than NAT Gateway, which means more hands-on experience with AWS networking. Understanding how to architect private connectivity to AWS services is valuable knowledge for real-world scenarios.

**Security posture**: Removing internet access from the data tier reduces the attack surface. With VPC Endpoints, traffic to AWS services never leaves the AWS network. This follows the principle of least privilege - the database and cache don't need internet access, so they shouldn't have it.

Phase 1 scope also influenced the decision. We're only deploying RDS and ElastiCache right now - both are managed services that AWS patches automatically. There's no application tier yet that might need to call third-party APIs. All the AWS services we need (S3, CloudWatch, Systems Manager) support VPC Endpoints.

Trade-offs I'm accepting:

Cost vs convenience - Spending $21-28/month on VPC Endpoints to save $32/month on NAT Gateway. Net savings of $4-11/month, but more complex networking setup.

Flexibility vs security - No internet access from private subnets means we can't reach third-party APIs. That's fine for Phase 1. If Phase 2 needs it, we can add a NAT Gateway then.

Simplicity vs learning - More complex architecture means more troubleshooting and management. But that's the point - this is a learning project.

## Consequences

### What we gain

Cost savings of $4-11/month ($48-132/year). The Gateway Endpoints for S3 and DynamoDB are free, which is great. VPC Endpoint costs are fixed regardless of data transfer, unlike NAT Gateway which charges per GB processed.

Better security posture. No internet access from the data tier means reduced attack surface. Traffic to AWS services stays on the AWS backbone instead of going out to the internet and back.

Valuable learning experience. VPC Endpoints are more complex than NAT Gateway, so there's more to learn about AWS networking. This knowledge transfers well to real-world enterprise scenarios.

Better performance for AWS service calls. Direct private connection to AWS services typically has lower latency than routing through NAT Gateway and internet.

### What we lose

More complexity. Need to manage Gateway Endpoints, Interface Endpoints, and their associated security groups. More moving parts means more potential troubleshooting.

Limited flexibility. Can't reach third-party APIs from private subnets. Can't download packages from the internet. Limited to AWS services that support VPC Endpoints.

Interface Endpoint costs. About $7/month per endpoint, and they're not Free Tier eligible. Need 3-4 endpoints for Phase 1, so $21-28/month.

Potential future rework. If Phase 2 application tier needs third-party API access, might need to add NAT Gateway anyway or use a proxy pattern with API Gateway/Lambda.

### How I'm handling the downsides

Documenting everything thoroughly in the design doc. Planning to create runbooks for common troubleshooting scenarios. Using Infrastructure as Code (AWS CDK) so the setup is reproducible.

For the flexibility limitations, Phase 1 is just the data layer so no third-party APIs needed yet. If Phase 2 needs it, can add NAT Gateway then or use a proxy pattern.

Setting up billing alerts at $50 and $100 to catch any unexpected costs. Will review Cost Explorer monthly to track VPC Endpoint charges.

The architecture supports adding NAT Gateway later if needed. VPC Endpoints remain useful even if we add NAT Gateway in the future.

## Implementation

### VPC Endpoints to deploy

Gateway Endpoints (free):
- S3: `com.amazonaws.us-east-1.s3` - attached to private subnet route tables for RDS backups and logs
- DynamoDB: `com.amazonaws.us-east-1.dynamodb` - attached to private subnet route tables for future use

Interface Endpoints ($7/month each):
- CloudWatch Logs: `com.amazonaws.us-east-1.logs` - deployed in both AZ private subnets for RDS/ElastiCache logs
- CloudWatch Monitoring: `com.amazonaws.us-east-1.monitoring` - deployed in both AZ private subnets for metrics
- Systems Manager: `com.amazonaws.us-east-1.ssm` - deployed in both AZ private subnets for Session Manager access
- Secrets Manager: `com.amazonaws.us-east-1.secretsmanager` - optional, for database credentials if needed

### Security group setup

VPC Endpoint security group allows HTTPS (port 443) from anywhere in the VPC (10.0.0.0/16). No outbound rules needed since security groups are stateful.

### Route table changes

Private subnet route tables won't have a default route to NAT Gateway or Internet Gateway. Gateway Endpoints automatically add routes for S3 and DynamoDB prefix lists. Interface Endpoints use private IPs within the VPC, so no route changes needed.

## When to revisit this

Should review this decision:
- After Phase 1 is complete - check actual costs and see how the operational experience was
- Before starting Phase 2 - assess whether the application tier needs internet access
- Quarterly - review VPC Endpoint costs and usage patterns in Cost Explorer
- If third-party API access becomes a requirement - evaluate NAT Gateway vs proxy approaches

## References

- AWS VPC Endpoints docs: https://docs.aws.amazon.com/vpc/latest/privatelink/vpc-endpoints.html
- VPC Endpoint pricing: https://aws.amazon.com/privatelink/pricing/
- NAT Gateway pricing: https://aws.amazon.com/vpc/pricing/
- Phase 1 requirements and design docs in this spec directory

## Related decisions

- ADR-002: Infrastructure as Code tool selection (Terraform vs AWS CDK) - pending
- ADR-003: Single-AZ vs Multi-AZ deployment strategy - pending
