# Tag Policy Enforcement Plan

## Overview

This document describes the plan to create and enforce tag policies in AWS Organizations to ensure all ShowCore resources have required tags. Tag policies are preventive controls that reject resource creation if required tags are missing.

## Why Tag Policy Enforcement?

**Benefits**:
- **Cost Allocation**: Ensures all resources can be tracked in Cost Explorer
- **Compliance**: Enforces tagging standards across all environments
- **Resource Management**: Enables filtering and grouping resources by tags
- **Security**: Enables tag-based IAM policies and access controls
- **Automation**: Enables automated resource management based on tags

**Without Tag Policy**:
- Manual resources may be created without tags
- Cost allocation reports may be incomplete
- Resource management becomes difficult
- Compliance monitoring is unreliable

**With Tag Policy**:
- All resources must have required tags
- Cost allocation is 100% accurate
- Resource management is consistent
- Compliance is enforced automatically

## Required Tags

All ShowCore resources must have these tags:

| Tag Key | Required Values | Purpose |
|---------|----------------|---------|
| Project | ShowCore | Identifies the project |
| Phase | Phase1, Phase2, Phase3 | Identifies the migration phase |
| Environment | production, staging, development | Identifies the environment |
| ManagedBy | CDK, Terraform, Manual | Identifies the IaC tool |
| CostCenter | Engineering, Operations, Finance | Identifies the cost center |

**Optional Tags** (component-specific):
- Component: Network, Database, Cache, Storage, CDN, Monitoring, Backup
- BackupRequired: true, false
- Compliance: Required, Optional
- DataClassification: Public, Internal, Confidential
- Tier: Public, Private, Isolated

## Tag Policy Implementation

### Step 1: Create Tag Policy in AWS Organizations

1. Navigate to **AWS Organizations** > **Policies** > **Tag policies**
2. Click **Enable tag policies** (if not already enabled)
3. Click **Create policy**
4. Enter policy name: `ShowCore-Required-Tags`
5. Enter policy description: `Enforces required tags for ShowCore resources`
6. Enter policy content (see below)
7. Click **Create policy**

### Tag Policy JSON

```json
{
  "tags": {
    "Project": {
      "tag_key": {
        "@@assign": "Project",
        "@@operators_allowed_for_child_policies": ["@@none"]
      },
      "tag_value": {
        "@@assign": ["ShowCore"],
        "@@operators_allowed_for_child_policies": ["@@append"]
      },
      "enforced_for": {
        "@@assign": [
          "ec2:instance",
          "ec2:volume",
          "ec2:snapshot",
          "ec2:security-group",
          "ec2:network-interface",
          "rds:db",
          "rds:cluster",
          "elasticache:cluster",
          "elasticache:replicationgroup",
          "s3:bucket",
          "cloudfront:distribution",
          "cloudwatch:alarm",
          "sns:topic",
          "logs:log-group",
          "backup:backup-vault",
          "backup:backup-plan"
        ]
      }
    },
    "Phase": {
      "tag_key": {
        "@@assign": "Phase",
        "@@operators_allowed_for_child_policies": ["@@none"]
      },
      "tag_value": {
        "@@assign": ["Phase1", "Phase2", "Phase3"],
        "@@operators_allowed_for_child_policies": ["@@append"]
      },
      "enforced_for": {
        "@@assign": [
          "ec2:instance",
          "ec2:volume",
          "rds:db",
          "elasticache:cluster",
          "s3:bucket",
          "cloudfront:distribution"
        ]
      }
    },
    "Environment": {
      "tag_key": {
        "@@assign": "Environment",
        "@@operators_allowed_for_child_policies": ["@@none"]
      },
      "tag_value": {
        "@@assign": ["production", "staging", "development"],
        "@@operators_allowed_for_child_policies": ["@@append"]
      },
      "enforced_for": {
        "@@assign": [
          "ec2:instance",
          "ec2:volume",
          "rds:db",
          "elasticache:cluster",
          "s3:bucket",
          "cloudfront:distribution",
          "cloudwatch:alarm",
          "sns:topic"
        ]
      }
    },
    "ManagedBy": {
      "tag_key": {
        "@@assign": "ManagedBy",
        "@@operators_allowed_for_child_policies": ["@@none"]
      },
      "tag_value": {
        "@@assign": ["CDK", "Terraform", "Manual"],
        "@@operators_allowed_for_child_policies": ["@@append"]
      },
      "enforced_for": {
        "@@assign": [
          "ec2:instance",
          "ec2:volume",
          "rds:db",
          "elasticache:cluster",
          "s3:bucket",
          "cloudfront:distribution"
        ]
      }
    },
    "CostCenter": {
      "tag_key": {
        "@@assign": "CostCenter",
        "@@operators_allowed_for_child_policies": ["@@none"]
      },
      "tag_value": {
        "@@assign": ["Engineering", "Operations", "Finance"],
        "@@operators_allowed_for_child_policies": ["@@append"]
      },
      "enforced_for": {
        "@@assign": [
          "ec2:instance",
          "ec2:volume",
          "rds:db",
          "elasticache:cluster",
          "s3:bucket",
          "cloudfront:distribution",
          "cloudwatch:alarm",
          "sns:topic",
          "logs:log-group"
        ]
      }
    }
  }
}
```

### Step 2: Attach Tag Policy to Organizational Unit

1. In the tag policy list, select `ShowCore-Required-Tags`
2. Click **Targets** tab
3. Click **Attach** button
4. Select the ShowCore organizational unit (or root if no OUs)
5. Click **Attach policy**

**Note**: Tag policies can be attached to:
- Root (applies to all accounts)
- Organizational Unit (applies to accounts in OU)
- Individual Account (applies to single account)

For ShowCore, attach to the ShowCore OU or the specific AWS account.

### Step 3: Verify Tag Policy Enforcement

Test that tag policy is working:

#### Test 1: Create Resource Without Required Tags (Should Fail)

```bash
# Attempt to create EC2 instance without tags
aws ec2 run-instances \
  --image-id ami-0c55b159cbfafe1f0 \
  --instance-type t3.micro \
  --region us-east-1

# Expected error:
# An error occurred (TagPolicyViolation) when calling the RunInstances operation:
# The following tags are required: Project, Phase, Environment, ManagedBy, CostCenter
```

#### Test 2: Create Resource With Required Tags (Should Succeed)

```bash
# Create EC2 instance with required tags
aws ec2 run-instances \
  --image-id ami-0c55b159cbfafe1f0 \
  --instance-type t3.micro \
  --region us-east-1 \
  --tag-specifications 'ResourceType=instance,Tags=[
    {Key=Project,Value=ShowCore},
    {Key=Phase,Value=Phase1},
    {Key=Environment,Value=production},
    {Key=ManagedBy,Value=Manual},
    {Key=CostCenter,Value=Engineering}
  ]'

# Expected: Instance created successfully
```

#### Test 3: Create Resource With Invalid Tag Value (Should Fail)

```bash
# Attempt to create EC2 instance with invalid Environment value
aws ec2 run-instances \
  --image-id ami-0c55b159cbfafe1f0 \
  --instance-type t3.micro \
  --region us-east-1 \
  --tag-specifications 'ResourceType=instance,Tags=[
    {Key=Project,Value=ShowCore},
    {Key=Phase,Value=Phase1},
    {Key=Environment,Value=invalid},
    {Key=ManagedBy,Value=Manual},
    {Key=CostCenter,Value=Engineering}
  ]'

# Expected error:
# An error occurred (TagPolicyViolation) when calling the RunInstances operation:
# Tag 'Environment' has invalid value 'invalid'. Allowed values: production, staging, development
```

### Step 4: Monitor Tag Policy Compliance

1. Navigate to **AWS Organizations** > **Policies** > **Tag policies**
2. Select `ShowCore-Required-Tags` policy
3. Click **Compliance** tab
4. Review compliance status for all accounts
5. Identify non-compliant resources
6. Remediate non-compliant resources

**Compliance Report**:
- **Compliant**: Resources with all required tags
- **Non-compliant**: Resources missing required tags or with invalid values
- **Not evaluated**: Resources not covered by tag policy

## CDK Integration

### Ensure CDK Resources Comply with Tag Policy

ShowCore CDK stacks already apply required tags via `ShowCoreBaseStack`:

```python
class ShowCoreBaseStack(Stack):
    def __init__(self, scope, construct_id, component=None, environment=None, **kwargs):
        super().__init__(scope, construct_id, **kwargs)
        
        # Apply required tags
        Tags.of(self).add("Project", "ShowCore")
        Tags.of(self).add("Phase", "Phase1")
        Tags.of(self).add("Environment", environment or "production")
        Tags.of(self).add("ManagedBy", "CDK")
        Tags.of(self).add("CostCenter", "Engineering")
        
        if component:
            Tags.of(self).add("Component", component)
```

**Verification**:
1. Run `cdk synth` to generate CloudFormation template
2. Search for `Tags` in template
3. Verify all resources have required tags
4. Deploy with `cdk deploy` (should succeed)

### Handle Tag Policy Violations in CDK

If CDK deployment fails due to tag policy violation:

1. **Check error message**: Identify which tag is missing or invalid
2. **Update ShowCoreBaseStack**: Add missing tag or fix invalid value
3. **Run cdk synth**: Verify tags in CloudFormation template
4. **Run cdk deploy**: Deploy with corrected tags

**Example Error**:
```
CREATE_FAILED | AWS::RDS::DBInstance | Database
Tag 'Environment' has invalid value 'prod'. Allowed values: production, staging, development
```

**Fix**:
```python
# Change environment value from 'prod' to 'production'
stack = ShowCoreDatabaseStack(
    app,
    "ShowCoreDatabaseStack",
    environment="production"  # Use valid value
)
```

## Tag Policy Exceptions

### Exempt Resources from Tag Policy

Some resources may need to be exempt from tag policy:

1. **AWS-managed resources**: Resources created by AWS services (e.g., CloudFormation stacks)
2. **Temporary resources**: Resources created for testing or troubleshooting
3. **Legacy resources**: Resources created before tag policy was implemented

**How to Exempt**:

1. Create a separate tag policy for exempt resources
2. Attach exempt policy to specific account or OU
3. Exempt policy overrides parent policy

**Example Exempt Policy**:
```json
{
  "tags": {
    "Project": {
      "tag_key": {
        "@@assign": "Project"
      },
      "enforced_for": {
        "@@assign": []
      }
    }
  }
}
```

**Note**: Use exemptions sparingly. Most resources should comply with tag policy.

## Tag Policy Best Practices

### 1. Start with Audit Mode

Before enforcing tag policy, run in audit mode:

1. Create tag policy without enforcement
2. Review compliance report
3. Identify non-compliant resources
4. Remediate non-compliant resources
5. Enable enforcement after 100% compliance

### 2. Use Inheritance

Tag policies support inheritance:

- **Root policy**: Defines required tags for all accounts
- **OU policy**: Adds additional tags for specific OUs
- **Account policy**: Adds account-specific tags

**Example**:
- Root: Project, Phase, Environment, ManagedBy, CostCenter
- Engineering OU: + Component, BackupRequired
- Production Account: + Compliance, DataClassification

### 3. Allow Child Policies to Extend

Use `@@operators_allowed_for_child_policies` to allow child policies to extend tag values:

```json
{
  "tag_value": {
    "@@assign": ["ShowCore"],
    "@@operators_allowed_for_child_policies": ["@@append"]
  }
}
```

This allows child policies to add more values (e.g., "ShowCore2", "ShowCore3") without overriding parent policy.

### 4. Document Tag Policy

Maintain documentation for:
- Required tags and their values
- Tag policy JSON
- Enforcement scope (which resource types)
- Exemptions and exceptions
- Compliance monitoring process

### 5. Review Tag Policy Regularly

Review tag policy quarterly:
- Are required tags still relevant?
- Are tag values still valid?
- Are new resource types covered?
- Are exemptions still needed?
- Is compliance at 100%?

## Troubleshooting

### Tag Policy Not Enforcing

**Problem**: Resources are created without required tags, but no error is thrown.

**Solution**:
1. Verify tag policy is enabled in AWS Organizations
2. Verify tag policy is attached to correct OU or account
3. Verify resource type is in `enforced_for` list
4. Wait up to 15 minutes for policy to propagate
5. Check AWS Organizations service control policies (SCPs) are not blocking tag policies

### CDK Deployment Fails with Tag Policy Violation

**Problem**: `cdk deploy` fails with tag policy violation error.

**Solution**:
1. Check error message for missing or invalid tag
2. Verify ShowCoreBaseStack applies all required tags
3. Run `cdk synth` and search for `Tags` in template
4. Verify tag values match tag policy allowed values
5. Update CDK code and redeploy

### Existing Resources Non-Compliant

**Problem**: Existing resources created before tag policy are non-compliant.

**Solution**:
1. Identify non-compliant resources using compliance report
2. Apply tags manually using AWS Console or CLI
3. Or recreate resources using CDK (preferred)
4. Verify compliance after remediation

**Apply Tags Manually**:
```bash
# Tag EC2 instance
aws ec2 create-tags \
  --resources i-1234567890abcdef0 \
  --tags \
    Key=Project,Value=ShowCore \
    Key=Phase,Value=Phase1 \
    Key=Environment,Value=production \
    Key=ManagedBy,Value=Manual \
    Key=CostCenter,Value=Engineering

# Tag RDS instance
aws rds add-tags-to-resource \
  --resource-name arn:aws:rds:us-east-1:123456789012:db:showcore-db \
  --tags \
    Key=Project,Value=ShowCore \
    Key=Phase,Value=Phase1 \
    Key=Environment,Value=production \
    Key=ManagedBy,Value=CDK \
    Key=CostCenter,Value=Engineering
```

## Implementation Timeline

### Phase 1: Preparation (Week 1)

- [ ] Review existing resources and their tags
- [ ] Identify resources missing required tags
- [ ] Document tag policy requirements
- [ ] Create tag policy JSON
- [ ] Review tag policy with team

### Phase 2: Audit Mode (Week 2-3)

- [ ] Create tag policy in AWS Organizations (without enforcement)
- [ ] Attach tag policy to ShowCore OU
- [ ] Review compliance report
- [ ] Remediate non-compliant resources
- [ ] Achieve 100% compliance

### Phase 3: Enforcement (Week 4)

- [ ] Enable tag policy enforcement
- [ ] Test tag policy with sample resources
- [ ] Monitor for tag policy violations
- [ ] Document tag policy enforcement process
- [ ] Train team on tag policy requirements

### Phase 4: Monitoring (Ongoing)

- [ ] Review compliance report weekly
- [ ] Remediate non-compliant resources immediately
- [ ] Update tag policy as needed
- [ ] Review tag policy quarterly

## References

- [AWS Tag Policies](https://docs.aws.amazon.com/organizations/latest/userguide/orgs_manage_policies_tag-policies.html)
- [Tag Policy Syntax](https://docs.aws.amazon.com/organizations/latest/userguide/orgs_manage_policies_tag-policies-syntax.html)
- [Tag Policy Enforcement](https://docs.aws.amazon.com/organizations/latest/userguide/orgs_manage_policies_tag-policies-enforcement.html)
- [AWS Tagging Best Practices](https://docs.aws.amazon.com/general/latest/gr/aws_tagging.html)

---

**Validates**: Requirements 9.6, 1.5
**Last Updated**: February 4, 2026
**Maintained By**: ShowCore Engineering Team
