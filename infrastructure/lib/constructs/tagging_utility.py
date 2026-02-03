"""
ShowCore Tagging Utility

This module provides utility functions for consistent resource tagging across
the ShowCore infrastructure.

All resources should be tagged with:
- Standard tags (Project, Phase, Environment, ManagedBy, CostCenter)
- Component-specific tags (Component, BackupRequired, Compliance, etc.)

Cost Optimization:
- Tags enable cost allocation and tracking by component
- Cost Explorer can filter and group costs by tags
- Billing alerts can be configured per tag

Security:
- Tags enable compliance monitoring and resource grouping
- AWS Config rules can enforce tagging policies
- IAM policies can restrict access based on tags

Dependencies: None (utility module)
"""

from typing import Dict, Optional
from aws_cdk import Tags
from constructs import IConstruct


# Standard tags required for all ShowCore resources
STANDARD_TAGS = {
    "Project": "ShowCore",
    "Phase": "Phase1",
    "ManagedBy": "CDK",
    "CostCenter": "Engineering"
}

# Component names for consistent tagging
COMPONENTS = {
    "NETWORK": "Network",
    "SECURITY": "Security",
    "DATABASE": "Database",
    "CACHE": "Cache",
    "STORAGE": "Storage",
    "CDN": "CDN",
    "MONITORING": "Monitoring",
    "BACKUP": "Backup"
}

# Environment names
ENVIRONMENTS = {
    "PRODUCTION": "Production",
    "STAGING": "Staging",
    "DEVELOPMENT": "Development"
}


def apply_standard_tags(
    construct: IConstruct,
    environment: str,
    component: Optional[str] = None
) -> None:
    """
    Apply standard tags to a construct and all its children.
    
    Standard tags enable cost allocation, resource grouping, and compliance monitoring.
    
    Args:
        construct: CDK construct to tag (stack, resource, or nested construct)
        environment: Environment name (production, staging, development)
        component: Optional component name (Network, Database, Cache, etc.)
    
    Example:
        apply_standard_tags(
            my_stack,
            environment="production",
            component="Database"
        )
    """
    # Apply required standard tags
    for key, value in STANDARD_TAGS.items():
        Tags.of(construct).add(key, value)
    
    # Apply environment tag
    Tags.of(construct).add("Environment", environment)
    
    # Apply optional component tag
    if component:
        Tags.of(construct).add("Component", component)


def apply_network_tags(
    construct: IConstruct,
    environment: str,
    tier: Optional[str] = None
) -> None:
    """
    Apply tags specific to network resources.
    
    Args:
        construct: CDK construct to tag
        environment: Environment name
        tier: Optional network tier (Public, Private, Isolated)
    
    Example:
        apply_network_tags(
            vpc_construct,
            environment="production",
            tier="Private"
        )
    """
    apply_standard_tags(construct, environment, COMPONENTS["NETWORK"])
    
    if tier:
        Tags.of(construct).add("Tier", tier)


def apply_database_tags(
    construct: IConstruct,
    environment: str,
    backup_required: bool = True,
    compliance: str = "Required"
) -> None:
    """
    Apply tags specific to database resources.
    
    Args:
        construct: CDK construct to tag
        environment: Environment name
        backup_required: Whether backups are required (default: True)
        compliance: Compliance level (Required, Optional)
    
    Example:
        apply_database_tags(
            rds_instance,
            environment="production",
            backup_required=True,
            compliance="Required"
        )
    """
    apply_standard_tags(construct, environment, COMPONENTS["DATABASE"])
    
    Tags.of(construct).add("BackupRequired", str(backup_required).lower())
    Tags.of(construct).add("Compliance", compliance)


def apply_cache_tags(
    construct: IConstruct,
    environment: str,
    backup_required: bool = True
) -> None:
    """
    Apply tags specific to cache resources.
    
    Args:
        construct: CDK construct to tag
        environment: Environment name
        backup_required: Whether backups are required (default: True)
    
    Example:
        apply_cache_tags(
            elasticache_cluster,
            environment="production",
            backup_required=True
        )
    """
    apply_standard_tags(construct, environment, COMPONENTS["CACHE"])
    
    Tags.of(construct).add("BackupRequired", str(backup_required).lower())


def apply_storage_tags(
    construct: IConstruct,
    environment: str,
    data_classification: str = "Internal"
) -> None:
    """
    Apply tags specific to storage resources.
    
    Args:
        construct: CDK construct to tag
        environment: Environment name
        data_classification: Data classification level (Public, Internal, Confidential)
    
    Example:
        apply_storage_tags(
            s3_bucket,
            environment="production",
            data_classification="Internal"
        )
    """
    apply_standard_tags(construct, environment, COMPONENTS["STORAGE"])
    
    Tags.of(construct).add("DataClassification", data_classification)


def apply_monitoring_tags(
    construct: IConstruct,
    environment: str
) -> None:
    """
    Apply tags specific to monitoring resources.
    
    Args:
        construct: CDK construct to tag
        environment: Environment name
    
    Example:
        apply_monitoring_tags(
            cloudwatch_dashboard,
            environment="production"
        )
    """
    apply_standard_tags(construct, environment, COMPONENTS["MONITORING"])


def apply_security_tags(
    construct: IConstruct,
    environment: str
) -> None:
    """
    Apply tags specific to security resources.
    
    Args:
        construct: CDK construct to tag
        environment: Environment name
    
    Example:
        apply_security_tags(
            cloudtrail,
            environment="production"
        )
    """
    apply_standard_tags(construct, environment, COMPONENTS["SECURITY"])


def apply_backup_tags(
    construct: IConstruct,
    environment: str
) -> None:
    """
    Apply tags specific to backup resources.
    
    Args:
        construct: CDK construct to tag
        environment: Environment name
    
    Example:
        apply_backup_tags(
            backup_vault,
            environment="production"
        )
    """
    apply_standard_tags(construct, environment, COMPONENTS["BACKUP"])


def get_resource_tags(
    environment: str,
    component: str,
    additional_tags: Optional[Dict[str, str]] = None
) -> Dict[str, str]:
    """
    Get a dictionary of tags for a resource.
    
    This is useful when creating resources that don't support CDK Tags API
    and require tags as a dictionary.
    
    Args:
        environment: Environment name
        component: Component name
        additional_tags: Optional additional tags to include
        
    Returns:
        Dictionary of tags
    
    Example:
        tags = get_resource_tags(
            environment="production",
            component="Database",
            additional_tags={"BackupRequired": "true"}
        )
    """
    tags = {
        **STANDARD_TAGS,
        "Environment": environment,
        "Component": component
    }
    
    if additional_tags:
        tags.update(additional_tags)
    
    return tags


def validate_component(component: str) -> bool:
    """
    Validate that a component name is one of the standard components.
    
    Args:
        component: Component name to validate
        
    Returns:
        True if valid, False otherwise
    
    Example:
        if validate_component("Database"):
            # Component is valid
    """
    return component in COMPONENTS.values()


def validate_environment(environment: str) -> bool:
    """
    Validate that an environment name is one of the standard environments.
    
    Args:
        environment: Environment name to validate
        
    Returns:
        True if valid, False otherwise
    
    Example:
        if validate_environment("production"):
            # Environment is valid
    """
    return environment in [e.lower() for e in ENVIRONMENTS.values()]
