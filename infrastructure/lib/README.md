# ShowCore CDK Library

This directory contains the CDK stacks and reusable constructs for the ShowCore AWS Migration Phase 1 infrastructure.

## Directory Structure

```
lib/
├── stacks/              # CDK stack definitions
│   ├── base_stack.py    # Base stack with standard tagging
│   ├── security_stack.py
│   ├── monitoring_stack.py
│   └── ...
├── constructs/          # Reusable CDK constructs
│   ├── tagging_utility.py
│   └── ...
└── README.md           # This file
```

## Base Stack Usage

All ShowCore stacks should inherit from `ShowCoreBaseStack` to ensure consistent tagging and naming conventions.

### Example: Creating a New Stack

```python
from aws_cdk import aws_ec2 as ec2, CfnOutput
from constructs import Construct
from .base_stack import ShowCoreBaseStack


class ShowCoreNetworkStack(ShowCoreBaseStack):
    """
    Network infrastructure stack for ShowCore Phase 1.
    
    Creates VPC, subnets, VPC endpoints, and route tables.
    """
    
    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        **kwargs
    ) -> None:
        # Initialize base stack with component name
        super().__init__(
            scope,
            construct_id,
            component="Network",  # This sets the Component tag
            **kwargs
        )
        
        # Create VPC with standard naming
        vpc_name = self.get_resource_name("vpc")  # Returns: showcore-network-production-vpc
        
        self.vpc = ec2.Vpc(
            self,
            "VPC",
            vpc_name=vpc_name,
            cidr="10.0.0.0/16",
            max_azs=2
        )
        
        # Export VPC ID
        CfnOutput(
            self,
            "VpcId",
            value=self.vpc.vpc_id,
            export_name="ShowCoreVpcId"
        )
```

### Standard Tags Applied Automatically

When you inherit from `ShowCoreBaseStack`, the following tags are automatically applied to all resources in your stack:

- **Project**: ShowCore
- **Phase**: Phase1
- **Environment**: production/staging/development (from context or parameter)
- **ManagedBy**: CDK
- **CostCenter**: Engineering
- **Component**: Network/Database/Cache/etc (from parameter)

### Resource Naming Convention

Use the `get_resource_name()` method to generate resource names following the ShowCore naming convention:

```python
# Format: showcore-{component}-{environment}-{resource-type}[-{suffix}]

vpc_name = self.get_resource_name("vpc")
# Returns: showcore-network-production-vpc

bucket_name = self.get_resource_name("assets", suffix=self.account)
# Returns: showcore-storage-production-assets-123456789012

db_name = self.get_resource_name("rds")
# Returns: showcore-database-production-rds
```

### Adding Custom Tags

You can add additional tags beyond the standard set:

```python
# Add a custom tag to all resources in the stack
self.add_custom_tag("BackupRequired", "true")
self.add_custom_tag("Compliance", "Required")

# Or update the component tag
self.add_component_tag("Database")
```

## Tagging Utility Usage

The `tagging_utility` module provides helper functions for consistent tagging across resources.

### Example: Using Tagging Utility

```python
from lib.constructs import tagging_utility

# Apply standard tags to a construct
tagging_utility.apply_standard_tags(
    my_construct,
    environment="production",
    component="Database"
)

# Apply database-specific tags
tagging_utility.apply_database_tags(
    rds_instance,
    environment="production",
    backup_required=True,
    compliance="Required"
)

# Apply network-specific tags
tagging_utility.apply_network_tags(
    vpc,
    environment="production",
    tier="Private"
)

# Apply storage-specific tags
tagging_utility.apply_storage_tags(
    s3_bucket,
    environment="production",
    data_classification="Internal"
)

# Get tags as a dictionary (for resources that don't support CDK Tags API)
tags = tagging_utility.get_resource_tags(
    environment="production",
    component="Database",
    additional_tags={"BackupRequired": "true"}
)
```

### Available Tagging Functions

- `apply_standard_tags()` - Apply standard tags (Project, Phase, Environment, ManagedBy, CostCenter)
- `apply_network_tags()` - Apply network-specific tags (includes Tier)
- `apply_database_tags()` - Apply database-specific tags (includes BackupRequired, Compliance)
- `apply_cache_tags()` - Apply cache-specific tags (includes BackupRequired)
- `apply_storage_tags()` - Apply storage-specific tags (includes DataClassification)
- `apply_monitoring_tags()` - Apply monitoring-specific tags
- `apply_security_tags()` - Apply security-specific tags
- `apply_backup_tags()` - Apply backup-specific tags
- `get_resource_tags()` - Get tags as a dictionary

### Standard Components

Use the predefined component constants for consistency:

```python
from lib.constructs.tagging_utility import COMPONENTS

COMPONENTS["NETWORK"]     # "Network"
COMPONENTS["SECURITY"]    # "Security"
COMPONENTS["DATABASE"]    # "Database"
COMPONENTS["CACHE"]       # "Cache"
COMPONENTS["STORAGE"]     # "Storage"
COMPONENTS["CDN"]         # "CDN"
COMPONENTS["MONITORING"]  # "Monitoring"
COMPONENTS["BACKUP"]      # "Backup"
```

## Best Practices

### 1. Always Inherit from ShowCoreBaseStack

```python
# ✅ GOOD
class ShowCoreDatabaseStack(ShowCoreBaseStack):
    def __init__(self, scope, construct_id, **kwargs):
        super().__init__(scope, construct_id, component="Database", **kwargs)

# ❌ BAD
class ShowCoreDatabaseStack(Stack):
    def __init__(self, scope, construct_id, **kwargs):
        super().__init__(scope, construct_id, **kwargs)
```

### 2. Use get_resource_name() for Naming

```python
# ✅ GOOD
vpc_name = self.get_resource_name("vpc")

# ❌ BAD
vpc_name = "my-vpc"
```

### 3. Specify Component in Constructor

```python
# ✅ GOOD
super().__init__(scope, construct_id, component="Database", **kwargs)

# ❌ BAD
super().__init__(scope, construct_id, **kwargs)
# Component tag will be missing
```

### 4. Use Tagging Utility for Component-Specific Tags

```python
# ✅ GOOD
from lib.constructs import tagging_utility
tagging_utility.apply_database_tags(rds_instance, environment="production")

# ❌ BAD
Tags.of(rds_instance).add("BackupRequired", "true")
Tags.of(rds_instance).add("Compliance", "Required")
# Missing standard tags
```

## Testing

All stacks should be tested to verify:

1. Standard tags are applied to all resources
2. Resource names follow naming convention
3. Component-specific tags are applied correctly

Example test:

```python
import aws_cdk as cdk
from aws_cdk.assertions import Template
from lib.stacks.network_stack import ShowCoreNetworkStack


def test_standard_tags_applied():
    """Test that standard tags are applied to all resources."""
    app = cdk.App()
    stack = ShowCoreNetworkStack(app, "TestStack")
    template = Template.from_stack(stack)
    
    # Verify VPC has standard tags
    template.has_resource_properties("AWS::EC2::VPC", {
        "Tags": [
            {"Key": "Project", "Value": "ShowCore"},
            {"Key": "Phase", "Value": "Phase1"},
            {"Key": "Environment", "Value": "production"},
            {"Key": "ManagedBy", "Value": "CDK"},
            {"Key": "CostCenter", "Value": "Engineering"},
            {"Key": "Component", "Value": "Network"}
        ]
    })
```

## Additional Resources

- [AWS CDK Documentation](https://docs.aws.amazon.com/cdk/latest/guide/home.html)
- [AWS Tagging Best Practices](https://docs.aws.amazon.com/general/latest/gr/aws_tagging.html)
- [ShowCore IaC Standards](../../.kiro/specs/showcore-aws-migration-phase1/iac-standards.md)
