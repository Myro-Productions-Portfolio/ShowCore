"""
Test utilities for AWS resource validation using boto3.

This module provides helper functions for integration and property-based tests
that need to validate actual AWS resources.

Usage:
    from tests.utils import AWSResourceValidator
    
    validator = AWSResourceValidator(region='us-east-1')
    vpc = validator.get_vpc_by_tag('Project', 'ShowCore')
"""

import boto3
from typing import Dict, List, Optional, Any
from botocore.exceptions import ClientError


class AWSResourceValidator:
    """
    Utility class for validating AWS resources in integration and property tests.
    
    This class provides methods to query and validate AWS resources using boto3.
    It's designed for use in integration tests that run after infrastructure deployment.
    """
    
    def __init__(self, region: str = 'us-east-1', profile: Optional[str] = None):
        """
        Initialize AWS resource validator.
        
        Args:
            region: AWS region to query (default: us-east-1)
            profile: AWS profile name to use (default: None, uses default profile)
        """
        self.region = region
        self.session = boto3.Session(profile_name=profile, region_name=region)
        
        # Initialize clients (lazy loading)
        self._ec2_client = None
        self._rds_client = None
        self._elasticache_client = None
        self._s3_client = None
        self._cloudfront_client = None
        self._cloudwatch_client = None
        self._sns_client = None
        self._cloudtrail_client = None
        self._config_client = None
        self._backup_client = None
        self._tagging_client = None
    
    @property
    def ec2(self):
        """Get EC2 client (lazy loading)."""
        if self._ec2_client is None:
            self._ec2_client = self.session.client('ec2')
        return self._ec2_client
    
    @property
    def rds(self):
        """Get RDS client (lazy loading)."""
        if self._rds_client is None:
            self._rds_client = self.session.client('rds')
        return self._rds_client
    
    @property
    def elasticache(self):
        """Get ElastiCache client (lazy loading)."""
        if self._elasticache_client is None:
            self._elasticache_client = self.session.client('elasticache')
        return self._elasticache_client
    
    @property
    def s3(self):
        """Get S3 client (lazy loading)."""
        if self._s3_client is None:
            self._s3_client = self.session.client('s3')
        return self._s3_client
    
    @property
    def cloudfront(self):
        """Get CloudFront client (lazy loading)."""
        if self._cloudfront_client is None:
            self._cloudfront_client = self.session.client('cloudfront')
        return self._cloudfront_client
    
    @property
    def cloudwatch(self):
        """Get CloudWatch client (lazy loading)."""
        if self._cloudwatch_client is None:
            self._cloudwatch_client = self.session.client('cloudwatch')
        return self._cloudwatch_client
    
    @property
    def sns(self):
        """Get SNS client (lazy loading)."""
        if self._sns_client is None:
            self._sns_client = self.session.client('sns')
        return self._sns_client
    
    @property
    def cloudtrail(self):
        """Get CloudTrail client (lazy loading)."""
        if self._cloudtrail_client is None:
            self._cloudtrail_client = self.session.client('cloudtrail')
        return self._cloudtrail_client
    
    @property
    def config(self):
        """Get AWS Config client (lazy loading)."""
        if self._config_client is None:
            self._config_client = self.session.client('config')
        return self._config_client
    
    @property
    def backup(self):
        """Get AWS Backup client (lazy loading)."""
        if self._backup_client is None:
            self._backup_client = self.session.client('backup')
        return self._backup_client
    
    @property
    def tagging(self):
        """Get Resource Groups Tagging API client (lazy loading)."""
        if self._tagging_client is None:
            self._tagging_client = self.session.client('resourcegroupstaggingapi')
        return self._tagging_client
    
    # VPC and Network Methods
    
    def get_vpc_by_tag(self, tag_key: str, tag_value: str) -> Optional[Dict[str, Any]]:
        """
        Get VPC by tag key and value.
        
        Args:
            tag_key: Tag key to search for (e.g., 'Project')
            tag_value: Tag value to match (e.g., 'ShowCore')
        
        Returns:
            VPC dict if found, None otherwise
        """
        try:
            response = self.ec2.describe_vpcs(
                Filters=[
                    {'Name': f'tag:{tag_key}', 'Values': [tag_value]}
                ]
            )
            vpcs = response.get('Vpcs', [])
            return vpcs[0] if vpcs else None
        except ClientError as e:
            print(f"Error getting VPC: {e}")
            return None
    
    def get_security_groups_by_vpc(self, vpc_id: str) -> List[Dict[str, Any]]:
        """
        Get all security groups in a VPC.
        
        Args:
            vpc_id: VPC ID to query
        
        Returns:
            List of security group dicts
        """
        try:
            response = self.ec2.describe_security_groups(
                Filters=[
                    {'Name': 'vpc-id', 'Values': [vpc_id]}
                ]
            )
            return response.get('SecurityGroups', [])
        except ClientError as e:
            print(f"Error getting security groups: {e}")
            return []
    
    def check_security_group_rule(
        self,
        security_group_id: str,
        port: int,
        cidr: str = '0.0.0.0/0'
    ) -> bool:
        """
        Check if a security group has a rule allowing access from a CIDR.
        
        Args:
            security_group_id: Security group ID to check
            port: Port number to check
            cidr: CIDR block to check (default: 0.0.0.0/0)
        
        Returns:
            True if rule exists, False otherwise
        """
        try:
            response = self.ec2.describe_security_groups(
                GroupIds=[security_group_id]
            )
            sg = response['SecurityGroups'][0]
            
            for rule in sg.get('IpPermissions', []):
                from_port = rule.get('FromPort')
                to_port = rule.get('ToPort')
                
                if from_port and to_port and from_port <= port <= to_port:
                    for ip_range in rule.get('IpRanges', []):
                        if ip_range.get('CidrIp') == cidr:
                            return True
            
            return False
        except ClientError as e:
            print(f"Error checking security group rule: {e}")
            return False
    
    def get_vpc_endpoints(self, vpc_id: str) -> List[Dict[str, Any]]:
        """
        Get all VPC endpoints in a VPC.
        
        Args:
            vpc_id: VPC ID to query
        
        Returns:
            List of VPC endpoint dicts
        """
        try:
            response = self.ec2.describe_vpc_endpoints(
                Filters=[
                    {'Name': 'vpc-id', 'Values': [vpc_id]}
                ]
            )
            return response.get('VpcEndpoints', [])
        except ClientError as e:
            print(f"Error getting VPC endpoints: {e}")
            return []
    
    # RDS Methods
    
    def get_rds_instance(self, db_instance_identifier: str) -> Optional[Dict[str, Any]]:
        """
        Get RDS instance by identifier.
        
        Args:
            db_instance_identifier: RDS instance identifier
        
        Returns:
            RDS instance dict if found, None otherwise
        """
        try:
            response = self.rds.describe_db_instances(
                DBInstanceIdentifier=db_instance_identifier
            )
            instances = response.get('DBInstances', [])
            return instances[0] if instances else None
        except ClientError as e:
            print(f"Error getting RDS instance: {e}")
            return None
    
    def check_rds_encryption(self, db_instance_identifier: str) -> bool:
        """
        Check if RDS instance has encryption at rest enabled.
        
        Args:
            db_instance_identifier: RDS instance identifier
        
        Returns:
            True if encrypted, False otherwise
        """
        instance = self.get_rds_instance(db_instance_identifier)
        return instance.get('StorageEncrypted', False) if instance else False
    
    # ElastiCache Methods
    
    def get_elasticache_cluster(self, cache_cluster_id: str) -> Optional[Dict[str, Any]]:
        """
        Get ElastiCache cluster by ID.
        
        Args:
            cache_cluster_id: ElastiCache cluster ID
        
        Returns:
            ElastiCache cluster dict if found, None otherwise
        """
        try:
            response = self.elasticache.describe_cache_clusters(
                CacheClusterId=cache_cluster_id,
                ShowCacheNodeInfo=True
            )
            clusters = response.get('CacheClusters', [])
            return clusters[0] if clusters else None
        except ClientError as e:
            print(f"Error getting ElastiCache cluster: {e}")
            return None
    
    def check_elasticache_encryption(self, cache_cluster_id: str) -> Dict[str, bool]:
        """
        Check ElastiCache encryption settings.
        
        Args:
            cache_cluster_id: ElastiCache cluster ID
        
        Returns:
            Dict with 'at_rest' and 'in_transit' encryption status
        """
        cluster = self.get_elasticache_cluster(cache_cluster_id)
        if not cluster:
            return {'at_rest': False, 'in_transit': False}
        
        return {
            'at_rest': cluster.get('AtRestEncryptionEnabled', False),
            'in_transit': cluster.get('TransitEncryptionEnabled', False)
        }
    
    # S3 Methods
    
    def get_bucket_encryption(self, bucket_name: str) -> Optional[str]:
        """
        Get S3 bucket encryption algorithm.
        
        Args:
            bucket_name: S3 bucket name
        
        Returns:
            Encryption algorithm (e.g., 'AES256', 'aws:kms') or None
        """
        try:
            response = self.s3.get_bucket_encryption(Bucket=bucket_name)
            rules = response.get('ServerSideEncryptionConfiguration', {}).get('Rules', [])
            if rules:
                return rules[0].get('ApplyServerSideEncryptionByDefault', {}).get('SSEAlgorithm')
            return None
        except ClientError as e:
            if e.response['Error']['Code'] == 'ServerSideEncryptionConfigurationNotFoundError':
                return None
            print(f"Error getting bucket encryption: {e}")
            return None
    
    def check_bucket_versioning(self, bucket_name: str) -> bool:
        """
        Check if S3 bucket has versioning enabled.
        
        Args:
            bucket_name: S3 bucket name
        
        Returns:
            True if versioning enabled, False otherwise
        """
        try:
            response = self.s3.get_bucket_versioning(Bucket=bucket_name)
            return response.get('Status') == 'Enabled'
        except ClientError as e:
            print(f"Error checking bucket versioning: {e}")
            return False
    
    # CloudWatch Methods
    
    def get_alarms_by_prefix(self, alarm_name_prefix: str) -> List[Dict[str, Any]]:
        """
        Get CloudWatch alarms by name prefix.
        
        Args:
            alarm_name_prefix: Alarm name prefix (e.g., 'showcore-')
        
        Returns:
            List of alarm dicts
        """
        try:
            response = self.cloudwatch.describe_alarms(
                AlarmNamePrefix=alarm_name_prefix
            )
            return response.get('MetricAlarms', [])
        except ClientError as e:
            print(f"Error getting alarms: {e}")
            return []
    
    # Resource Tagging Methods
    
    def get_resources_by_tag(
        self,
        tag_key: str,
        tag_value: str,
        resource_type_filters: Optional[List[str]] = None
    ) -> List[Dict[str, Any]]:
        """
        Get all resources with a specific tag.
        
        Args:
            tag_key: Tag key to search for
            tag_value: Tag value to match
            resource_type_filters: Optional list of resource types to filter
                                  (e.g., ['ec2:vpc', 'rds:db'])
        
        Returns:
            List of resource dicts with ARN and tags
        """
        try:
            params = {
                'TagFilters': [
                    {
                        'Key': tag_key,
                        'Values': [tag_value]
                    }
                ]
            }
            
            if resource_type_filters:
                params['ResourceTypeFilters'] = resource_type_filters
            
            response = self.tagging.get_resources(**params)
            return response.get('ResourceTagMappingList', [])
        except ClientError as e:
            print(f"Error getting resources by tag: {e}")
            return []
    
    def check_resource_tags(
        self,
        resource_arn: str,
        required_tags: List[str]
    ) -> Dict[str, bool]:
        """
        Check if a resource has all required tags.
        
        Args:
            resource_arn: Resource ARN to check
            required_tags: List of required tag keys
        
        Returns:
            Dict mapping tag key to presence (True/False)
        """
        try:
            response = self.tagging.get_resources(
                ResourceARNList=[resource_arn]
            )
            
            resources = response.get('ResourceTagMappingList', [])
            if not resources:
                return {tag: False for tag in required_tags}
            
            resource_tags = {
                tag['Key']: tag['Value']
                for tag in resources[0].get('Tags', [])
            }
            
            return {
                tag: tag in resource_tags
                for tag in required_tags
            }
        except ClientError as e:
            print(f"Error checking resource tags: {e}")
            return {tag: False for tag in required_tags}
    
    # CloudTrail Methods
    
    def get_trails(self) -> List[Dict[str, Any]]:
        """
        Get all CloudTrail trails.
        
        Returns:
            List of trail dicts
        """
        try:
            response = self.cloudtrail.describe_trails()
            return response.get('trailList', [])
        except ClientError as e:
            print(f"Error getting trails: {e}")
            return []
    
    def check_trail_logging(self, trail_name: str) -> bool:
        """
        Check if CloudTrail trail is logging.
        
        Args:
            trail_name: Trail name to check
        
        Returns:
            True if logging, False otherwise
        """
        try:
            response = self.cloudtrail.get_trail_status(Name=trail_name)
            return response.get('IsLogging', False)
        except ClientError as e:
            print(f"Error checking trail logging: {e}")
            return False


def get_account_id() -> Optional[str]:
    """
    Get current AWS account ID.
    
    Returns:
        AWS account ID or None if unable to retrieve
    """
    try:
        sts = boto3.client('sts')
        response = sts.get_caller_identity()
        return response.get('Account')
    except ClientError as e:
        print(f"Error getting account ID: {e}")
        return None


def wait_for_stack_complete(
    stack_name: str,
    region: str = 'us-east-1',
    timeout: int = 600
) -> bool:
    """
    Wait for CloudFormation stack to complete deployment.
    
    Args:
        stack_name: CloudFormation stack name
        region: AWS region
        timeout: Timeout in seconds (default: 600)
    
    Returns:
        True if stack completed successfully, False otherwise
    """
    try:
        cfn = boto3.client('cloudformation', region_name=region)
        waiter = cfn.get_waiter('stack_create_complete')
        waiter.wait(
            StackName=stack_name,
            WaiterConfig={'Delay': 30, 'MaxAttempts': timeout // 30}
        )
        return True
    except ClientError as e:
        print(f"Error waiting for stack: {e}")
        return False
