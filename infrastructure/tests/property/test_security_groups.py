"""
ShowCore AWS Migration Phase 1 - Property-Based Tests for Security Groups

This module contains property-based tests that verify universal security
properties for all security groups in the ShowCore infrastructure.

These tests run AFTER deployment and validate actual AWS resources.
"""

import pytest
import boto3
from typing import List, Dict, Any
from botocore.exceptions import ClientError


# Sensitive ports that should NEVER allow 0.0.0.0/0 access
SENSITIVE_PORTS = [22, 5432, 6379]  # SSH, PostgreSQL, Redis


def get_all_security_groups(region: str = 'us-east-1') -> List[Dict[str, Any]]:
    """
    Get all security groups in the specified region.
    
    Args:
        region: AWS region to query (default: us-east-1)
    
    Returns:
        List of security group dicts
    """
    try:
        ec2 = boto3.client('ec2', region_name=region)
        response = ec2.describe_security_groups()
        return response.get('SecurityGroups', [])
    except ClientError as e:
        pytest.skip(f"Unable to query security groups: {e}")
        return []


def check_security_group_has_open_sensitive_port(
    security_group: Dict[str, Any]
) -> List[Dict[str, Any]]:
    """
    Check if a security group has any rules allowing 0.0.0.0/0 on sensitive ports.
    
    Args:
        security_group: Security group dict from describe_security_groups()
    
    Returns:
        List of violating rules (empty if no violations)
    """
    violations = []
    
    for rule in security_group.get('IpPermissions', []):
        from_port = rule.get('FromPort')
        to_port = rule.get('ToPort')
        
        # Check if rule covers any sensitive ports
        if from_port is not None and to_port is not None:
            for sensitive_port in SENSITIVE_PORTS:
                if from_port <= sensitive_port <= to_port:
                    # Check if rule allows 0.0.0.0/0
                    for ip_range in rule.get('IpRanges', []):
                        if ip_range.get('CidrIp') == '0.0.0.0/0':
                            violations.append({
                                'security_group_id': security_group['GroupId'],
                                'security_group_name': security_group.get('GroupName', 'Unknown'),
                                'port': sensitive_port,
                                'from_port': from_port,
                                'to_port': to_port,
                                'cidr': '0.0.0.0/0',
                                'description': ip_range.get('Description', 'No description')
                            })
        
        # Check for rules with -1 protocol (all protocols)
        if rule.get('IpProtocol') == '-1':
            for ip_range in rule.get('IpRanges', []):
                if ip_range.get('CidrIp') == '0.0.0.0/0':
                    violations.append({
                        'security_group_id': security_group['GroupId'],
                        'security_group_name': security_group.get('GroupName', 'Unknown'),
                        'port': 'ALL',
                        'from_port': 'ALL',
                        'to_port': 'ALL',
                        'cidr': '0.0.0.0/0',
                        'description': ip_range.get('Description', 'No description')
                    })
    
    return violations


@pytest.mark.property
@pytest.mark.post_deployment
def test_security_group_least_privilege():
    """
    Property 1: Security Group Least Privilege
    
    Universal property: No security group shall allow 0.0.0.0/0 access on
    sensitive ports (22, 5432, 6379).
    
    This property ensures that:
    - SSH (port 22) is not open to the internet
    - PostgreSQL (port 5432) is not open to the internet
    - Redis (port 6379) is not open to the internet
    
    This test runs AFTER deployment and validates actual AWS resources.
    
    Validates: Requirements 6.2
    """
    # Get all security groups in us-east-1
    security_groups = get_all_security_groups(region='us-east-1')
    
    if not security_groups:
        pytest.skip("No security groups found or unable to query AWS")
    
    # Check each security group for violations
    all_violations = []
    for sg in security_groups:
        violations = check_security_group_has_open_sensitive_port(sg)
        all_violations.extend(violations)
    
    # Assert no violations found
    if all_violations:
        violation_details = "\n".join([
            f"  - Security Group: {v['security_group_name']} ({v['security_group_id']})\n"
            f"    Port: {v['port']} (rule: {v['from_port']}-{v['to_port']})\n"
            f"    CIDR: {v['cidr']}\n"
            f"    Description: {v['description']}"
            for v in all_violations
        ])
        
        pytest.fail(
            f"\n\nSecurity Group Least Privilege Violation!\n\n"
            f"Found {len(all_violations)} security group rule(s) that allow "
            f"0.0.0.0/0 access on sensitive ports:\n\n"
            f"{violation_details}\n\n"
            f"Sensitive ports: {SENSITIVE_PORTS} (SSH, PostgreSQL, Redis)\n"
            f"These ports should NEVER be open to the internet (0.0.0.0/0).\n"
            f"Use specific security group IDs or CIDR blocks instead.\n"
        )


@pytest.mark.property
@pytest.mark.post_deployment
def test_showcore_security_groups_least_privilege():
    """
    Property 1 (ShowCore-specific): Security Group Least Privilege for ShowCore resources
    
    This test specifically checks ShowCore security groups (tagged with Project=ShowCore)
    to ensure they follow least privilege principles.
    
    This is a more focused version of the general test above, specifically for
    ShowCore Phase 1 infrastructure.
    
    Validates: Requirements 6.2
    """
    try:
        ec2 = boto3.client('ec2', region_name='us-east-1')
        
        # Get ShowCore security groups by tag
        response = ec2.describe_security_groups(
            Filters=[
                {'Name': 'tag:Project', 'Values': ['ShowCore']}
            ]
        )
        security_groups = response.get('SecurityGroups', [])
        
        if not security_groups:
            pytest.skip("No ShowCore security groups found")
        
        # Check each ShowCore security group for violations
        all_violations = []
        for sg in security_groups:
            violations = check_security_group_has_open_sensitive_port(sg)
            all_violations.extend(violations)
        
        # Assert no violations found
        if all_violations:
            violation_details = "\n".join([
                f"  - Security Group: {v['security_group_name']} ({v['security_group_id']})\n"
                f"    Port: {v['port']} (rule: {v['from_port']}-{v['to_port']})\n"
                f"    CIDR: {v['cidr']}\n"
                f"    Description: {v['description']}"
                for v in all_violations
            ])
            
            pytest.fail(
                f"\n\nShowCore Security Group Least Privilege Violation!\n\n"
                f"Found {len(all_violations)} ShowCore security group rule(s) that allow "
                f"0.0.0.0/0 access on sensitive ports:\n\n"
                f"{violation_details}\n\n"
                f"Sensitive ports: {SENSITIVE_PORTS} (SSH, PostgreSQL, Redis)\n"
                f"ShowCore security groups should follow least privilege principles.\n"
                f"Use specific security group IDs or VPC CIDR blocks instead.\n"
            )
    
    except ClientError as e:
        pytest.skip(f"Unable to query ShowCore security groups: {e}")


@pytest.mark.property
@pytest.mark.post_deployment
def test_rds_security_group_not_open_to_internet():
    """
    Property 1 (RDS-specific): RDS security group does not allow internet access
    
    This test specifically checks that the RDS security group does not allow
    PostgreSQL access (port 5432) from 0.0.0.0/0.
    
    Validates: Requirements 3.3, 6.2
    """
    try:
        ec2 = boto3.client('ec2', region_name='us-east-1')
        
        # Get RDS security group by tag
        response = ec2.describe_security_groups(
            Filters=[
                {'Name': 'tag:Project', 'Values': ['ShowCore']},
                {'Name': 'tag:Component', 'Values': ['Database']}
            ]
        )
        security_groups = response.get('SecurityGroups', [])
        
        if not security_groups:
            pytest.skip("No RDS security group found")
        
        # Check RDS security group for PostgreSQL port 5432 open to internet
        for sg in security_groups:
            for rule in sg.get('IpPermissions', []):
                from_port = rule.get('FromPort')
                to_port = rule.get('ToPort')
                
                # Check if rule covers PostgreSQL port 5432
                if from_port is not None and to_port is not None:
                    if from_port <= 5432 <= to_port:
                        # Check if rule allows 0.0.0.0/0
                        for ip_range in rule.get('IpRanges', []):
                            if ip_range.get('CidrIp') == '0.0.0.0/0':
                                pytest.fail(
                                    f"\n\nRDS Security Group Violation!\n\n"
                                    f"Security Group: {sg.get('GroupName')} ({sg['GroupId']})\n"
                                    f"PostgreSQL port 5432 is open to the internet (0.0.0.0/0)\n"
                                    f"Rule: {from_port}-{to_port}\n"
                                    f"Description: {ip_range.get('Description', 'No description')}\n\n"
                                    f"RDS should only be accessible from application tier security group.\n"
                                )
    
    except ClientError as e:
        pytest.skip(f"Unable to query RDS security group: {e}")


@pytest.mark.property
@pytest.mark.post_deployment
def test_elasticache_security_group_not_open_to_internet():
    """
    Property 1 (ElastiCache-specific): ElastiCache security group does not allow internet access
    
    This test specifically checks that the ElastiCache security group does not allow
    Redis access (port 6379) from 0.0.0.0/0.
    
    Validates: Requirements 4.3, 6.2
    """
    try:
        ec2 = boto3.client('ec2', region_name='us-east-1')
        
        # Get ElastiCache security group by tag
        response = ec2.describe_security_groups(
            Filters=[
                {'Name': 'tag:Project', 'Values': ['ShowCore']},
                {'Name': 'tag:Component', 'Values': ['Cache']}
            ]
        )
        security_groups = response.get('SecurityGroups', [])
        
        if not security_groups:
            pytest.skip("No ElastiCache security group found")
        
        # Check ElastiCache security group for Redis port 6379 open to internet
        for sg in security_groups:
            for rule in sg.get('IpPermissions', []):
                from_port = rule.get('FromPort')
                to_port = rule.get('ToPort')
                
                # Check if rule covers Redis port 6379
                if from_port is not None and to_port is not None:
                    if from_port <= 6379 <= to_port:
                        # Check if rule allows 0.0.0.0/0
                        for ip_range in rule.get('IpRanges', []):
                            if ip_range.get('CidrIp') == '0.0.0.0/0':
                                pytest.fail(
                                    f"\n\nElastiCache Security Group Violation!\n\n"
                                    f"Security Group: {sg.get('GroupName')} ({sg['GroupId']})\n"
                                    f"Redis port 6379 is open to the internet (0.0.0.0/0)\n"
                                    f"Rule: {from_port}-{to_port}\n"
                                    f"Description: {ip_range.get('Description', 'No description')}\n\n"
                                    f"ElastiCache should only be accessible from application tier security group.\n"
                                )
    
    except ClientError as e:
        pytest.skip(f"Unable to query ElastiCache security group: {e}")
