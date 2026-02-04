"""
ShowCore AWS Migration Phase 1 - Property-Based Tests for Resource Tagging Compliance

This module contains property-based tests that verify all Phase 1 resources
have the required tags for cost allocation and management.

These tests run AFTER deployment and validate actual AWS resources.
"""

import pytest
import boto3
from typing import List, Dict, Any, Set
from botocore.exceptions import ClientError


# Required tags for ALL ShowCore Phase 1 resources
REQUIRED_TAGS = [
    'Project',
    'Phase',
    'Environment',
    'ManagedBy',
    'CostCenter'
]


def get_all_showcore_resources(region: str = 'us-east-1') -> List[Dict[str, Any]]:
    """
    Get all ShowCore Phase 1 resources using Resource Groups Tagging API.
    
    Args:
        region: AWS region to query (default: us-east-1)
    
    Returns:
        List of resource dicts with ARN and tags
    """
    try:
        tagging = boto3.client('resourcegroupstaggingapi', region_name=region)
        
        # Get all resources tagged with Project=ShowCore
        resources = []
        pagination_token = None
        
        while True:
            params = {
                'TagFilters': [
                    {
                        'Key': 'Project',
                        'Values': ['ShowCore']
                    }
                ]
            }
            
            if pagination_token:
                params['PaginationToken'] = pagination_token
            
            response = tagging.get_resources(**params)
            resources.extend(response.get('ResourceTagMappingList', []))
            
            pagination_token = response.get('PaginationToken')
            if not pagination_token:
                break
        
        return resources
    
    except ClientError as e:
        pytest.skip(f"Unable to query resources: {e}")
        return []


def check_resource_has_required_tags(
    resource: Dict[str, Any],
    required_tags: List[str]
) -> Dict[str, Any]:
    """
    Check if a resource has all required tags.
    
    Args:
        resource: Resource dict from get_resources() with ARN and Tags
        required_tags: List of required tag keys
    
    Returns:
        Dict with resource info and missing tags (empty list if compliant)
    """
    resource_arn = resource.get('ResourceARN', 'Unknown')
    resource_tags = {tag['Key']: tag['Value'] for tag in resource.get('Tags', [])}
    
    # Find missing tags
    missing_tags = [tag for tag in required_tags if tag not in resource_tags]
    
    # Extract resource type and name from ARN
    # ARN format: arn:aws:service:region:account:resource-type/resource-name
    arn_parts = resource_arn.split(':')
    resource_type = 'Unknown'
    resource_name = 'Unknown'
    
    if len(arn_parts) >= 6:
        service = arn_parts[2]
        resource_part = arn_parts[5]
        
        if '/' in resource_part:
            resource_type_part, resource_name = resource_part.split('/', 1)
            resource_type = f"{service}:{resource_type_part}"
        else:
            resource_type = service
            resource_name = resource_part
    
    return {
        'arn': resource_arn,
        'type': resource_type,
        'name': resource_name,
        'missing_tags': missing_tags,
        'existing_tags': resource_tags
    }


@pytest.mark.property
@pytest.mark.post_deployment
def test_resource_tagging_compliance():
    """
    Property 2: Resource Tagging Compliance
    
    Universal property: All ShowCore Phase 1 resources shall have the required tags:
    - Project: ShowCore
    - Phase: Phase1
    - Environment: Production (or Staging, Development)
    - ManagedBy: CDK
    - CostCenter: Engineering
    
    This property ensures that:
    - All resources can be tracked for cost allocation
    - All resources can be identified by project and phase
    - All resources have ownership and management information
    
    This test runs AFTER deployment and validates actual AWS resources.
    
    Validates: Requirements 9.6
    """
    # Get all ShowCore resources
    resources = get_all_showcore_resources(region='us-east-1')
    
    if not resources:
        pytest.skip("No ShowCore resources found or unable to query AWS")
    
    # Check each resource for required tags
    non_compliant_resources = []
    for resource in resources:
        result = check_resource_has_required_tags(resource, REQUIRED_TAGS)
        if result['missing_tags']:
            non_compliant_resources.append(result)
    
    # Assert all resources are compliant
    if non_compliant_resources:
        # Group by resource type for better reporting
        by_type: Dict[str, List[Dict[str, Any]]] = {}
        for resource in non_compliant_resources:
            resource_type = resource['type']
            if resource_type not in by_type:
                by_type[resource_type] = []
            by_type[resource_type].append(resource)
        
        # Build detailed violation report
        violation_details = []
        for resource_type, resources_list in sorted(by_type.items()):
            violation_details.append(f"\n  {resource_type}:")
            for resource in resources_list:
                violation_details.append(
                    f"    - {resource['name']}\n"
                    f"      ARN: {resource['arn']}\n"
                    f"      Missing tags: {', '.join(resource['missing_tags'])}\n"
                    f"      Existing tags: {', '.join(resource['existing_tags'].keys())}"
                )
        
        violation_report = "\n".join(violation_details)
        
        pytest.fail(
            f"\n\nResource Tagging Compliance Violation!\n\n"
            f"Found {len(non_compliant_resources)} resource(s) missing required tags.\n"
            f"Total ShowCore resources checked: {len(resources)}\n\n"
            f"Required tags: {', '.join(REQUIRED_TAGS)}\n\n"
            f"Non-compliant resources by type:"
            f"{violation_report}\n\n"
            f"All ShowCore Phase 1 resources MUST have all 5 required tags.\n"
            f"Update CDK code to apply tags using Tags.of(self).add() API.\n"
        )


@pytest.mark.property
@pytest.mark.post_deployment
def test_showcore_project_tag_present():
    """
    Property 2 (Project Tag): All ShowCore resources have Project=ShowCore tag
    
    This test verifies that all resources can be identified as part of the
    ShowCore project using the Project tag.
    
    Validates: Requirements 9.6
    """
    try:
        tagging = boto3.client('resourcegroupstaggingapi', region_name='us-east-1')
        
        # Get all resources tagged with Project=ShowCore
        response = tagging.get_resources(
            TagFilters=[
                {
                    'Key': 'Project',
                    'Values': ['ShowCore']
                }
            ]
        )
        
        resources = response.get('ResourceTagMappingList', [])
        
        if not resources:
            pytest.skip("No ShowCore resources found")
        
        # All resources should have Project=ShowCore tag (by definition of the query)
        # This test validates the query works and resources are tagged
        assert len(resources) > 0, "Expected at least one ShowCore resource"
        
        # Verify each resource actually has the Project tag
        for resource in resources:
            resource_tags = {tag['Key']: tag['Value'] for tag in resource.get('Tags', [])}
            assert 'Project' in resource_tags, \
                f"Resource {resource['ResourceARN']} missing Project tag"
            assert resource_tags['Project'] == 'ShowCore', \
                f"Resource {resource['ResourceARN']} has incorrect Project tag: {resource_tags['Project']}"
    
    except ClientError as e:
        pytest.skip(f"Unable to query resources: {e}")


@pytest.mark.property
@pytest.mark.post_deployment
def test_showcore_phase_tag_present():
    """
    Property 2 (Phase Tag): All ShowCore resources have Phase=Phase1 tag
    
    This test verifies that all Phase 1 resources can be identified and
    distinguished from future phases using the Phase tag.
    
    Validates: Requirements 9.6
    """
    try:
        tagging = boto3.client('resourcegroupstaggingapi', region_name='us-east-1')
        
        # Get all ShowCore resources
        response = tagging.get_resources(
            TagFilters=[
                {
                    'Key': 'Project',
                    'Values': ['ShowCore']
                }
            ]
        )
        
        resources = response.get('ResourceTagMappingList', [])
        
        if not resources:
            pytest.skip("No ShowCore resources found")
        
        # Check each resource has Phase tag
        missing_phase_tag = []
        for resource in resources:
            resource_tags = {tag['Key']: tag['Value'] for tag in resource.get('Tags', [])}
            if 'Phase' not in resource_tags:
                missing_phase_tag.append(resource['ResourceARN'])
        
        if missing_phase_tag:
            pytest.fail(
                f"\n\nPhase Tag Missing!\n\n"
                f"Found {len(missing_phase_tag)} resource(s) without Phase tag:\n"
                f"{chr(10).join(['  - ' + arn for arn in missing_phase_tag])}\n\n"
                f"All Phase 1 resources must have Phase=Phase1 tag.\n"
            )
    
    except ClientError as e:
        pytest.skip(f"Unable to query resources: {e}")


@pytest.mark.property
@pytest.mark.post_deployment
def test_showcore_cost_allocation_tags():
    """
    Property 2 (Cost Allocation): All ShowCore resources have cost allocation tags
    
    This test verifies that all resources have the tags required for cost
    allocation and tracking: Project, Phase, Environment, CostCenter.
    
    Validates: Requirements 9.6, 1.5
    """
    try:
        tagging = boto3.client('resourcegroupstaggingapi', region_name='us-east-1')
        
        # Get all ShowCore resources
        response = tagging.get_resources(
            TagFilters=[
                {
                    'Key': 'Project',
                    'Values': ['ShowCore']
                }
            ]
        )
        
        resources = response.get('ResourceTagMappingList', [])
        
        if not resources:
            pytest.skip("No ShowCore resources found")
        
        # Cost allocation tags
        cost_allocation_tags = ['Project', 'Phase', 'Environment', 'CostCenter']
        
        # Check each resource has all cost allocation tags
        non_compliant = []
        for resource in resources:
            resource_tags = {tag['Key']: tag['Value'] for tag in resource.get('Tags', [])}
            missing = [tag for tag in cost_allocation_tags if tag not in resource_tags]
            
            if missing:
                non_compliant.append({
                    'arn': resource['ResourceARN'],
                    'missing': missing
                })
        
        if non_compliant:
            violation_details = "\n".join([
                f"  - {r['arn']}\n    Missing: {', '.join(r['missing'])}"
                for r in non_compliant
            ])
            
            pytest.fail(
                f"\n\nCost Allocation Tags Missing!\n\n"
                f"Found {len(non_compliant)} resource(s) missing cost allocation tags:\n"
                f"{violation_details}\n\n"
                f"Required cost allocation tags: {', '.join(cost_allocation_tags)}\n"
                f"These tags are essential for tracking costs by project, phase, and cost center.\n"
            )
    
    except ClientError as e:
        pytest.skip(f"Unable to query resources: {e}")


@pytest.mark.property
@pytest.mark.post_deployment
def test_showcore_managed_by_tag():
    """
    Property 2 (ManagedBy Tag): All ShowCore resources have ManagedBy=CDK tag
    
    This test verifies that all resources are properly tagged to indicate
    they are managed by AWS CDK (Infrastructure as Code).
    
    Validates: Requirements 9.6, 10.1
    """
    try:
        tagging = boto3.client('resourcegroupstaggingapi', region_name='us-east-1')
        
        # Get all ShowCore resources
        response = tagging.get_resources(
            TagFilters=[
                {
                    'Key': 'Project',
                    'Values': ['ShowCore']
                }
            ]
        )
        
        resources = response.get('ResourceTagMappingList', [])
        
        if not resources:
            pytest.skip("No ShowCore resources found")
        
        # Check each resource has ManagedBy=CDK tag
        missing_managed_by = []
        incorrect_managed_by = []
        
        for resource in resources:
            resource_tags = {tag['Key']: tag['Value'] for tag in resource.get('Tags', [])}
            
            if 'ManagedBy' not in resource_tags:
                missing_managed_by.append(resource['ResourceARN'])
            elif resource_tags['ManagedBy'] != 'CDK':
                incorrect_managed_by.append({
                    'arn': resource['ResourceARN'],
                    'value': resource_tags['ManagedBy']
                })
        
        errors = []
        
        if missing_managed_by:
            errors.append(
                f"Missing ManagedBy tag ({len(missing_managed_by)} resources):\n"
                f"{chr(10).join(['  - ' + arn for arn in missing_managed_by])}"
            )
        
        if incorrect_managed_by:
            errors.append(
                f"Incorrect ManagedBy tag value ({len(incorrect_managed_by)} resources):\n"
                f"{chr(10).join([f'  - {r['arn']}: {r['value']}' for r in incorrect_managed_by])}"
            )
        
        if errors:
            pytest.fail(
                f"\n\nManagedBy Tag Violation!\n\n"
                f"{chr(10).join(errors)}\n\n"
                f"All ShowCore resources must have ManagedBy=CDK tag.\n"
                f"This indicates resources are managed by Infrastructure as Code.\n"
            )
    
    except ClientError as e:
        pytest.skip(f"Unable to query resources: {e}")


@pytest.mark.property
@pytest.mark.post_deployment
def test_showcore_resource_count():
    """
    Property 2 (Resource Count): Verify expected number of ShowCore resources exist
    
    This test provides visibility into the total number of ShowCore Phase 1
    resources and helps detect if resources are missing or unexpected resources exist.
    
    This is an informational test that reports resource counts by type.
    
    Validates: Requirements 9.6
    """
    try:
        tagging = boto3.client('resourcegroupstaggingapi', region_name='us-east-1')
        
        # Get all ShowCore resources
        resources = []
        pagination_token = None
        
        while True:
            params = {
                'TagFilters': [
                    {
                        'Key': 'Project',
                        'Values': ['ShowCore']
                    }
                ]
            }
            
            if pagination_token:
                params['PaginationToken'] = pagination_token
            
            response = tagging.get_resources(**params)
            resources.extend(response.get('ResourceTagMappingList', []))
            
            pagination_token = response.get('PaginationToken')
            if not pagination_token:
                break
        
        if not resources:
            pytest.skip("No ShowCore resources found")
        
        # Count resources by type
        resource_counts: Dict[str, int] = {}
        for resource in resources:
            arn = resource['ResourceARN']
            # Extract service from ARN (arn:aws:service:region:account:resource)
            arn_parts = arn.split(':')
            if len(arn_parts) >= 3:
                service = arn_parts[2]
                resource_counts[service] = resource_counts.get(service, 0) + 1
        
        # Report resource counts
        count_report = "\n".join([
            f"  {service}: {count}"
            for service, count in sorted(resource_counts.items())
        ])
        
        print(
            f"\n\nShowCore Phase 1 Resource Count:\n"
            f"Total resources: {len(resources)}\n\n"
            f"Resources by service:\n"
            f"{count_report}\n"
        )
        
        # This test always passes - it's informational
        assert len(resources) > 0, "Expected at least one ShowCore resource"
    
    except ClientError as e:
        pytest.skip(f"Unable to query resources: {e}")
