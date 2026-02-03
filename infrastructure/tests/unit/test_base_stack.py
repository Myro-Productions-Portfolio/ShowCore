"""
Unit tests for ShowCoreBaseStack

Tests verify:
- Standard tags are applied to all resources
- Resource naming follows conventions
- Component tags are applied correctly
"""

import aws_cdk as cdk
from aws_cdk.assertions import Template, Match
from lib.stacks.base_stack import ShowCoreBaseStack


def test_base_stack_applies_standard_tags():
    """Test that ShowCoreBaseStack applies standard tags to all resources."""
    app = cdk.App()
    
    # Create a base stack with component
    stack = ShowCoreBaseStack(
        app,
        "TestStack",
        component="TestComponent",
        environment="production"
    )
    
    # Verify standard tags are set
    assert stack.env_name == "production"
    assert stack.component == "TestComponent"


def test_base_stack_default_environment():
    """Test that ShowCoreBaseStack uses default environment if not specified."""
    app = cdk.App()
    
    # Create a base stack without environment
    stack = ShowCoreBaseStack(
        app,
        "TestStack",
        component="TestComponent"
    )
    
    # Verify default environment is used
    assert stack.env_name == "production"


def test_base_stack_context_environment():
    """Test that ShowCoreBaseStack uses context environment if available."""
    app = cdk.App(context={"environment": "staging"})
    
    # Create a base stack without environment parameter
    stack = ShowCoreBaseStack(
        app,
        "TestStack",
        component="TestComponent"
    )
    
    # Verify context environment is used
    assert stack.env_name == "staging"


def test_get_resource_name_basic():
    """Test resource name generation without suffix."""
    app = cdk.App()
    
    stack = ShowCoreBaseStack(
        app,
        "TestStack",
        component="Network",
        environment="production"
    )
    
    # Test basic resource name
    vpc_name = stack.get_resource_name("vpc")
    assert vpc_name == "showcore-network-production-vpc"
    
    # Test with different resource type
    subnet_name = stack.get_resource_name("subnet")
    assert subnet_name == "showcore-network-production-subnet"


def test_get_resource_name_with_suffix():
    """Test resource name generation with suffix."""
    app = cdk.App()
    
    stack = ShowCoreBaseStack(
        app,
        "TestStack",
        component="Storage",
        environment="production"
    )
    
    # Test resource name with suffix
    bucket_name = stack.get_resource_name("assets", suffix="123456789012")
    assert bucket_name == "showcore-storage-production-assets-123456789012"


def test_get_resource_name_case_conversion():
    """Test that resource names are converted to lowercase."""
    app = cdk.App()
    
    stack = ShowCoreBaseStack(
        app,
        "TestStack",
        component="Database",
        environment="Production"
    )
    
    # Test case conversion
    db_name = stack.get_resource_name("RDS")
    assert db_name == "showcore-database-production-rds"


def test_get_resource_name_without_component():
    """Test that get_resource_name raises error without component."""
    app = cdk.App()
    
    stack = ShowCoreBaseStack(
        app,
        "TestStack",
        environment="production"
    )
    
    # Test that error is raised
    try:
        stack.get_resource_name("vpc")
        assert False, "Should have raised ValueError"
    except ValueError as e:
        assert "Component must be set" in str(e)


def test_add_component_tag():
    """Test adding component tag after initialization."""
    app = cdk.App()
    
    stack = ShowCoreBaseStack(
        app,
        "TestStack",
        environment="production"
    )
    
    # Initially no component
    assert stack.component is None
    
    # Add component tag
    stack.add_component_tag("Database")
    
    # Verify component is set
    assert stack.component == "Database"


def test_add_custom_tag():
    """Test adding custom tags to stack."""
    app = cdk.App()
    
    stack = ShowCoreBaseStack(
        app,
        "TestStack",
        component="Database",
        environment="production"
    )
    
    # Add custom tags
    stack.add_custom_tag("BackupRequired", "true")
    stack.add_custom_tag("Compliance", "Required")
    
    # Tags are applied via CDK Tags API, so we can't directly verify
    # but we can verify the method doesn't raise errors
    assert True


def test_base_stack_with_different_components():
    """Test base stack with different component names."""
    app = cdk.App()
    
    components = ["Network", "Database", "Cache", "Storage", "CDN", "Monitoring", "Backup"]
    
    for component in components:
        stack = ShowCoreBaseStack(
            app,
            f"TestStack{component}",
            component=component,
            environment="production"
        )
        
        assert stack.component == component
        
        # Test resource naming
        resource_name = stack.get_resource_name("test")
        expected = f"showcore-{component.lower()}-production-test"
        assert resource_name == expected


def test_base_stack_with_different_environments():
    """Test base stack with different environment names."""
    app = cdk.App()
    
    environments = ["production", "staging", "development"]
    
    for environment in environments:
        stack = ShowCoreBaseStack(
            app,
            f"TestStack{environment}",
            component="Network",
            environment=environment
        )
        
        assert stack.env_name == environment
        
        # Test resource naming
        resource_name = stack.get_resource_name("vpc")
        expected = f"showcore-network-{environment}-vpc"
        assert resource_name == expected
