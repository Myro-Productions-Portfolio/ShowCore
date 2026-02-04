"""
ShowCore Base Stack

This module provides the base stack class that all ShowCore stacks inherit from.
It implements standard tagging and naming conventions for consistent resource management.

All ShowCore stacks should inherit from ShowCoreBaseStack to ensure:
- Consistent resource tagging (Project, Phase, Environment, ManagedBy, CostCenter)
- Standard naming conventions (showcore-{component}-{environment}-{resource-type})
- Centralized configuration management

Cost Optimization:
- Tags enable cost allocation and tracking by component
- Consistent naming enables automated cost analysis

Security:
- Tags enable compliance monitoring and resource grouping
- Standard naming enables security policy enforcement

Dependencies: None (foundation class for all stacks)
"""

from typing import Optional
from aws_cdk import Stack, Tags
from constructs import Construct


class ShowCoreBaseStack(Stack):
    """
    Base stack class for ShowCore Phase 1 infrastructure.
    
    All ShowCore stacks should inherit from this class to ensure consistent
    tagging and naming conventions across all resources.
    
    Standard Tags Applied:
    - Project: ShowCore
    - Phase: Phase1
    - Environment: production/staging/development
    - ManagedBy: CDK
    - CostCenter: Engineering
    
    Naming Convention:
    - Format: showcore-{component}-{environment}-{resource-type}
    - Case: kebab-case (lowercase with hyphens)
    - Example: showcore-database-production-rds
    
    Usage:
        class ShowCoreDatabaseStack(ShowCoreBaseStack):
            def __init__(self, scope: Construct, construct_id: str, **kwargs):
                super().__init__(
                    scope,
                    construct_id,
                    component="Database",
                    **kwargs
                )
                # Stack implementation...
    
    Args:
        scope: CDK app or parent construct
        construct_id: Unique identifier for this stack
        component: Component name (Network, Database, Cache, Storage, CDN, Monitoring, Backup)
        environment: Environment name (production, staging, development)
        **kwargs: Additional stack properties
    """
    
    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        component: Optional[str] = None,
        environment: Optional[str] = None,
        **kwargs
    ) -> None:
        """
        Initialize the base stack with standard tags.
        
        Args:
            scope: CDK app or parent construct
            construct_id: Unique identifier for this stack
            component: Component name for tagging (e.g., "Network", "Database")
            environment: Environment name (defaults to context value or "production")
            **kwargs: Additional stack properties
        """
        super().__init__(scope, construct_id, **kwargs)
        
        # Get environment from parameter or context
        # Note: Use _env_name instead of environment since Stack.environment is read-only
        self._env_name = environment or self.node.try_get_context("environment") or "production"
        
        # Store component for use by child stacks
        self.component = component
        
        # Apply standard tags to all resources in this stack
        self._apply_standard_tags()
    
    @property
    def env_name(self) -> str:
        """
        Get the environment name for this stack.
        
        Returns:
            Environment name (production, staging, development)
        """
        return self._env_name
    
    def _apply_standard_tags(self) -> None:
        """
        Apply standard tags to all resources in this stack.
        
        Standard tags enable:
        - Cost allocation and tracking
        - Resource grouping and filtering
        - Compliance monitoring
        - Automated policy enforcement
        
        Required Tags:
        - Project: ShowCore (identifies the project)
        - Phase: Phase1 (identifies the migration phase)
        - Environment: production/staging/development (identifies the environment)
        - ManagedBy: CDK (identifies the IaC tool)
        - CostCenter: Engineering (identifies the cost center for billing)
        
        Optional Tags:
        - Component: Network/Database/Cache/etc (identifies the infrastructure component)
        """
        # Required tags for all resources
        Tags.of(self).add("Project", "ShowCore")
        Tags.of(self).add("Phase", "Phase1")
        Tags.of(self).add("Environment", self._env_name)
        Tags.of(self).add("ManagedBy", "CDK")
        Tags.of(self).add("CostCenter", "Engineering")
        
        # Optional component tag
        if self.component:
            Tags.of(self).add("Component", self.component)
    
    def get_resource_name(
        self,
        resource_type: str,
        suffix: Optional[str] = None
    ) -> str:
        """
        Generate a resource name following ShowCore naming conventions.
        
        Naming Convention:
        - Format: showcore-{component}-{environment}-{resource-type}[-{suffix}]
        - Case: kebab-case (lowercase with hyphens)
        - Component: Lowercase component name (network, database, cache, etc.)
        - Environment: Lowercase environment name (production, staging, development)
        - Resource Type: Lowercase resource type (vpc, rds, redis, bucket, etc.)
        - Suffix: Optional suffix for uniqueness (e.g., account ID, timestamp)
        
        Examples:
        - showcore-network-production-vpc
        - showcore-database-production-rds
        - showcore-cache-production-redis
        - showcore-storage-production-assets-123456789012
        
        Args:
            resource_type: Type of resource (vpc, rds, redis, bucket, etc.)
            suffix: Optional suffix for uniqueness
            
        Returns:
            Resource name following naming convention
            
        Raises:
            ValueError: If component is not set
        """
        if not self.component:
            raise ValueError(
                "Component must be set to generate resource names. "
                "Pass component parameter to ShowCoreBaseStack.__init__()"
            )
        
        # Convert component to lowercase kebab-case
        component_lower = self.component.lower().replace("_", "-")
        
        # Build resource name
        parts = [
            "showcore",
            component_lower,
            self._env_name.lower(),
            resource_type.lower()
        ]
        
        if suffix:
            parts.append(suffix)
        
        return "-".join(parts)
    
    def add_component_tag(self, component: str) -> None:
        """
        Add or update the Component tag for this stack.
        
        This is useful if the component wasn't specified during initialization
        or needs to be changed.
        
        Args:
            component: Component name (Network, Database, Cache, Storage, CDN, Monitoring, Backup)
        """
        self.component = component
        Tags.of(self).add("Component", component)
    
    def add_custom_tag(self, key: str, value: str) -> None:
        """
        Add a custom tag to all resources in this stack.
        
        Use this for additional tags beyond the standard set.
        Examples: BackupRequired, Compliance, DataClassification
        
        Args:
            key: Tag key
            value: Tag value
        """
        Tags.of(self).add(key, value)
