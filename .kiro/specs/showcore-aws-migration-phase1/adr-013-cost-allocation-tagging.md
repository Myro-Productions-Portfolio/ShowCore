# ADR-013: Cost Allocation Tagging Strategy

**Status**: Accepted  
**Date**: February 4, 2026  
**Deciders**: ShowCore Engineering Team  
**Validates**: Requirements 9.6, 10.1

## Context

Phase 1 infrastructure includes multiple AWS resources across different services (VPC, RDS, ElastiCache, S3, CloudFront, CloudWatch, etc.). To track costs effectively and optimize spending, we need a consistent tagging strategy for cost allocation.

Current context:
- ShowCore is a low-traffic portfolio/learning project
- Target monthly cost under $60
- Multiple infrastructure components (network, database, cache, storage, CDN, monitoring)
- Need to track costs by component, environment, and phase
- Need to identify cost optimization opportunities
- Need to demonstrate cost management skills for portfolio

AWS Cost Allocation Tags:
- User-defined tags for organizing AWS costs
- Appear in Cost Explorer and billing reports
- Must be activated in Billing console
- Take 24 hours to appear in reports
- Support up to 50 active cost allocation tags

Key decisions needed:
1. Which tags to use for cost allocation
2. Tag naming conventions
3. Tag value formats
4. How to enforce tagging compliance
5. How to track and report costs

## Decision

**Implement standardized cost allocation tagging with 5 required tags and 3 optional tags for all AWS resources.**

Implementation:

**Required Tags** (ALL resources MUST have these):
- `Project`: "ShowCore"
- `Phase`: "Phase1", "Phase2", etc.
- `Environment`: "Production", "Staging", "Development"
- `ManagedBy`: "CDK", "Terraform", "Manual"
- `CostCenter`: "Engineering"

**Optional Tags** (component-specific):
- `Component`: "Network", "Database", "Cache", "Storage", "CDN", "Monitoring", "Backup"
- `BackupRequired`: "true", "false"
- `DataClassification`: "Public", "Internal", "Confidential"

**Enforcement**:
- Applied via CDK `Tags.of()` API
- Validated in unit tests
- Verified in property tests
- Documented in iac-standards.md

## Alternatives Considered

### Alternative 1: Minimal Tagging (Cost-First)

Use only 2 tags: Project and Environment.

**Pros**:
- Simplest approach
- Minimal tagging overhead
- Easy to implement and maintain

**Cons**:
- Limited cost visibility
- Cannot track costs by component
- Cannot track costs by phase
- Cannot identify who manages resources
- Difficult to optimize costs
- Poor cost management demonstration

**Decision**: Rejected. Insufficient cost visibility for learning project.

### Alternative 2: Comprehensive Tagging (Enterprise Pattern)

Use 15+ tags including Owner, CreatedBy, CreatedDate, Application, Service, Version, etc.

**Pros**:
- Maximum cost visibility
- Detailed resource tracking
- Follows enterprise best practices
- Can track costs by any dimension

**Cons**:
- High tagging overhead
- Complex to implement and maintain
- Many tags unused for small project
- Overkill for learning project
- Difficult to enforce compliance

**Decision**: Rejected. Too complex for Phase 1 scope.

### Alternative 3: Balanced Tagging (Selected)

Use 5 required tags + 3 optional tags for cost allocation and resource management.

**Pros**:
- Good cost visibility
- Tracks costs by component, phase, environment
- Identifies resource ownership
- Reasonable tagging overhead
- Demonstrates cost management skills
- Easy to enforce compliance

**Cons**:
- More tags than minimal approach
- Requires tagging discipline
- Must activate tags in Billing console

**Decision**: Accepted. Best balance of visibility and simplicity.

### Alternative 4: AWS-Generated Tags Only

Use only AWS-generated tags (aws:cloudformation:stack-name, etc.).

**Pros**:
- No manual tagging required
- Automatic tag generation
- No compliance issues

**Cons**:
- Limited cost visibility
- Cannot track by business dimensions (phase, component)
- Cannot customize tag values
- Poor cost management demonstration

**Decision**: Rejected. Insufficient business context for cost tracking.

## Rationale

The decision prioritizes cost visibility while maintaining simplicity.

### Tag Selection Justification

**Project Tag**:
- Purpose: Identify all ShowCore resources
- Value: "ShowCore"
- Use case: Filter all ShowCore costs in Cost Explorer
- Required: Yes

**Phase Tag**:
- Purpose: Track costs by migration phase
- Values: "Phase1", "Phase2", "Phase3"
- Use case: Compare costs across phases, track phase-specific spending
- Required: Yes

**Environment Tag**:
- Purpose: Separate production, staging, development costs
- Values: "Production", "Staging", "Development"
- Use case: Track production vs non-production costs
- Required: Yes

**ManagedBy Tag**:
- Purpose: Identify how resources are managed
- Values: "CDK", "Terraform", "Manual"
- Use case: Track IaC adoption, identify manually created resources
- Required: Yes

**CostCenter Tag**:
- Purpose: Allocate costs to business unit
- Value: "Engineering"
- Use case: Chargeback/showback reporting (future use)
- Required: Yes

**Component Tag** (optional):
- Purpose: Track costs by infrastructure component
- Values: "Network", "Database", "Cache", "Storage", "CDN", "Monitoring", "Backup"
- Use case: Identify most expensive components, optimize spending
- Required: No (but recommended)

**BackupRequired Tag** (optional):
- Purpose: Identify resources requiring backups
- Values: "true", "false"
- Use case: Track backup costs, ensure backup compliance
- Required: No

**DataClassification Tag** (optional):
- Purpose: Identify data sensitivity level
- Values: "Public", "Internal", "Confidential"
- Use case: Security compliance, data governance
- Required: No

### Tag Naming Conventions

**PascalCase for Tag Keys**:
- Consistent with AWS conventions
- Easy to read and understand
- Examples: `Project`, `Phase`, `Environment`

**PascalCase for Tag Values**:
- Consistent with tag keys
- Easy to read and understand
- Examples: `ShowCore`, `Phase1`, `Production`

**No Spaces or Special Characters**:
- Simplifies scripting and automation
- Avoids parsing issues
- Examples: Use `CostCenter` not `Cost Center`

### Cost Tracking Strategy

**Cost Explorer Filters**:
```
# All ShowCore costs
Tag: Project = ShowCore

# Phase 1 costs
Tag: Project = ShowCore AND Tag: Phase = Phase1

# Database costs
Tag: Project = ShowCore AND Tag: Component = Database

# Production costs
Tag: Project = ShowCore AND Tag: Environment = Production

# CDK-managed resources
Tag: Project = ShowCore AND Tag: ManagedBy = CDK
```

**Cost Allocation Reports**:
- Monthly cost report by Component
- Monthly cost report by Phase
- Monthly cost report by Environment
- Quarterly cost trend analysis

**Cost Optimization Workflow**:
1. Review Cost Explorer monthly
2. Identify most expensive components
3. Analyze cost trends by phase
4. Identify optimization opportunities
5. Implement cost reductions
6. Track savings over time

## Consequences

### Positive

1. **Cost Visibility**: Track costs by component, phase, environment
2. **Cost Optimization**: Identify expensive components, optimize spending
3. **Resource Management**: Identify who manages resources (CDK vs Manual)
4. **Portfolio Demonstration**: Shows cost management skills
5. **Compliance**: Ensures all resources are tagged consistently
6. **Automation**: Tags applied automatically via CDK
7. **Reporting**: Generate cost reports by any tag dimension

### Negative

1. **Tagging Overhead**: Must tag all resources consistently
2. **Activation Required**: Must activate tags in Billing console
3. **24-Hour Delay**: Tags take 24 hours to appear in Cost Explorer
4. **Enforcement Needed**: Must validate tagging compliance in tests

### Neutral

1. **Acceptable for Phase 1**: 5 required + 3 optional tags is reasonable
2. **Learning Value**: Demonstrates cost management best practices
3. **Upgrade Path**: Can add more tags later if needed

## Implementation

### CDK Implementation

**Base Stack** (`lib/stacks/base_stack.py`):

```python
from aws_cdk import Stack, Tags
from constructs import Construct

class ShowCoreBaseStack(Stack):
    """
    Base stack with standard tagging for all ShowCore resources.
    """
    
    def __init__(self, scope: Construct, construct_id: str, **kwargs):
        super().__init__(scope, construct_id, **kwargs)
        
        # Apply standard tags to all resources in this stack
        Tags.of(self).add("Project", "ShowCore")
        Tags.of(self).add("Phase", "Phase1")
        Tags.of(self).add("Environment", self.node.try_get_context("environment") or "Production")
        Tags.of(self).add("ManagedBy", "CDK")
        Tags.of(self).add("CostCenter", "Engineering")
```

**Component-Specific Tags** (`lib/stacks/database_stack.py`):

```python
from aws_cdk import Stack, Tags
from constructs import Construct

class ShowCoreDatabaseStack(ShowCoreBaseStack):
    """
    Database stack with component-specific tags.
    """
    
    def __init__(self, scope: Construct, construct_id: str, **kwargs):
        super().__init__(scope, construct_id, **kwargs)
        
        # Add component-specific tags
        Tags.of(self).add("Component", "Database")
        Tags.of(self).add("BackupRequired", "true")
        Tags.of(self).add("DataClassification", "Internal")
```

**Tagging Utility** (`lib/constructs/tagging_utility.py`):

```python
from aws_cdk import Tags
from constructs import IConstruct

def apply_standard_tags(
    construct: IConstruct,
    project: str = "ShowCore",
    phase: str = "Phase1",
    environment: str = "Production",
    managed_by: str = "CDK",
    cost_center: str = "Engineering",
) -> None:
    """
    Apply standard tags to a construct and all its children.
    
    Args:
        construct: The construct to tag
        project: Project name
        phase: Migration phase
        environment: Environment name
        managed_by: Management tool
        cost_center: Cost center for chargeback
    """
    Tags.of(construct).add("Project", project)
    Tags.of(construct).add("Phase", phase)
    Tags.of(construct).add("Environment", environment)
    Tags.of(construct).add("ManagedBy", managed_by)
    Tags.of(construct).add("CostCenter", cost_center)

def apply_component_tags(
    construct: IConstruct,
    component: str,
    backup_required: bool = False,
    data_classification: str = "Internal",
) -> None:
    """
    Apply component-specific tags to a construct.
    
    Args:
        construct: The construct to tag
        component: Component name (Network, Database, Cache, etc.)
        backup_required: Whether backups are required
        data_classification: Data sensitivity level
    """
    Tags.of(construct).add("Component", component)
    Tags.of(construct).add("BackupRequired", str(backup_required).lower())
    Tags.of(construct).add("DataClassification", data_classification)
```

### Verification

**Unit Tests** (`tests/unit/test_tagging.py`):

```python
import aws_cdk as cdk
from aws_cdk.assertions import Template, Match
from lib.stacks.database_stack import ShowCoreDatabaseStack

def test_standard_tags_applied():
    """Test that all resources have standard tags."""
    app = cdk.App()
    stack = ShowCoreDatabaseStack(app, "TestStack")
    template = Template.from_stack(stack)
    
    # Verify all resources have standard tags
    template.has_resource_properties("AWS::RDS::DBInstance", {
        "Tags": Match.array_with([
            {"Key": "Project", "Value": "ShowCore"},
            {"Key": "Phase", "Value": "Phase1"},
            {"Key": "Environment", "Value": "Production"},
            {"Key": "ManagedBy", "Value": "CDK"},
            {"Key": "CostCenter", "Value": "Engineering"},
        ])
    })

def test_component_tags_applied():
    """Test that component-specific tags are applied."""
    app = cdk.App()
    stack = ShowCoreDatabaseStack(app, "TestStack")
    template = Template.from_stack(stack)
    
    # Verify component tags
    template.has_resource_properties("AWS::RDS::DBInstance", {
        "Tags": Match.array_with([
            {"Key": "Component", "Value": "Database"},
            {"Key": "BackupRequired", "Value": "true"},
            {"Key": "DataClassification", "Value": "Internal"},
        ])
    })
```

**Property Tests** (`tests/property/test_tagging_compliance.py`):

```python
import boto3

def test_all_resources_have_required_tags():
    """
    Property: All AWS resources have required tags.
    
    Validates: Requirements 9.6
    """
    required_tags = ["Project", "Phase", "Environment", "ManagedBy", "CostCenter"]
    
    # Query all resources using Resource Groups Tagging API
    client = boto3.client('resourcegroupstaggingapi', region_name='us-east-1')
    
    # Get all resources with Project=ShowCore tag
    response = client.get_resources(
        TagFilters=[
            {
                'Key': 'Project',
                'Values': ['ShowCore']
            }
        ]
    )
    
    # Verify each resource has all required tags
    for resource in response['ResourceTagMappingList']:
        resource_arn = resource['ResourceARN']
        tags = {tag['Key']: tag['Value'] for tag in resource['Tags']}
        
        for required_tag in required_tags:
            assert required_tag in tags, \
                f"Resource {resource_arn} missing required tag: {required_tag}"
```

**Activate Cost Allocation Tags** (Manual - AWS Console):

```bash
# 1. Go to AWS Billing Console
# 2. Navigate to Cost Allocation Tags
# 3. Activate the following user-defined tags:
#    - Project
#    - Phase
#    - Environment
#    - ManagedBy
#    - CostCenter
#    - Component
#    - BackupRequired
#    - DataClassification
# 4. Wait 24 hours for tags to appear in Cost Explorer
```

**Query Costs by Tag** (AWS CLI):

```bash
# Get costs by Component
aws ce get-cost-and-usage \
  --time-period Start=2026-01-01,End=2026-02-01 \
  --granularity MONTHLY \
  --metrics BlendedCost \
  --group-by Type=TAG,Key=Component

# Get costs by Phase
aws ce get-cost-and-usage \
  --time-period Start=2026-01-01,End=2026-02-01 \
  --granularity MONTHLY \
  --metrics BlendedCost \
  --group-by Type=TAG,Key=Phase

# Get costs by Environment
aws ce get-cost-and-usage \
  --time-period Start=2026-01-01,End=2026-02-01 \
  --granularity MONTHLY \
  --metrics BlendedCost \
  --group-by Type=TAG,Key=Environment
```

## When to Revisit This Decision

Should review this decision:

**After 3 Months** - Review Cost Explorer reports. Assess if current tags provide sufficient visibility. Add more tags if needed.

**If Cost Tracking Needs Change** - If need to track costs by additional dimensions, add new tags.

**If Compliance Requirements Change** - If regulations mandate additional tags, implement accordingly.

**Before Phase 2** - Review tagging strategy for Phase 2 resources. Ensure consistency across phases.

**Quarterly Cost Review** - Use tags to analyze costs by component, phase, environment. Identify optimization opportunities.

**If Tagging Compliance Issues** - If resources missing tags, improve enforcement in CDK and tests.

## References

- [AWS Cost Allocation Tags](https://docs.aws.amazon.com/awsaccountbilling/latest/aboutv2/cost-alloc-tags.html)
- [AWS Tagging Best Practices](https://docs.aws.amazon.com/whitepapers/latest/tagging-best-practices/tagging-best-practices.html)
- [CDK Tagging](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.Tags.html)
- [Cost Explorer](https://docs.aws.amazon.com/cost-management/latest/userguide/ce-what-is.html)
- ShowCore Requirements: 9.6, 10.1
- ShowCore Design: design.md (Resource Tagging Model)
- ShowCore Standards: iac-standards.md (Resource Tagging Requirements)

## Related Decisions

- ADR-002: Infrastructure as Code Tool - Tags applied via CDK
- ADR-006: Single-AZ Deployment Strategy - Cost optimization tracked via tags
- ADR-001: VPC Endpoints over NAT Gateway - Cost savings tracked via tags

## Approval

- **Proposed By**: ShowCore Engineering Team
- **Reviewed By**: Cost Optimization Review
- **Approved By**: Project Lead
- **Date**: February 4, 2026

---

**Implementation Status**: ✅ Implemented in all stacks via ShowCoreBaseStack  
**Next Review**: After 3 months or when cost tracking needs change
