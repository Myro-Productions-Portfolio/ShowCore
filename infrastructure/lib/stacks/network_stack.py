"""
ShowCore Network Stack

This module implements the network infrastructure for ShowCore Phase 1.
It creates a VPC with multi-AZ subnets and VPC Endpoints for cost-optimized
AWS service access without NAT Gateways.

Cost Optimization:
- NO NAT Gateway deployed (saves ~$32/month)
- Uses VPC Endpoints for AWS service access instead
- Gateway Endpoints (S3, DynamoDB) are FREE
- Interface Endpoints cost ~$7/month each but still cheaper than NAT Gateway
- Net savings: ~$4-11/month vs NAT Gateway architecture

Security:
- Private subnets have NO internet access (no NAT Gateway route)
- VPC Endpoints provide secure AWS service access
- Security groups follow least privilege principle

Network Architecture:
- VPC: 10.0.0.0/16 CIDR block (65,536 IPs)
- Public Subnets: 10.0.0.0/24, 10.0.1.0/24 (us-east-1a, us-east-1b)
- Private Subnets: 10.0.2.0/24, 10.0.3.0/24 (us-east-1a, us-east-1b)
- Internet Gateway for public subnets
- NO NAT Gateway (cost optimization)

Resources Created:
- VPC (10.0.0.0/16)
- 2 Public Subnets in us-east-1a and us-east-1b
- 2 Private Subnets in us-east-1a and us-east-1b
- Internet Gateway
- Route Tables (public and private)
- S3 Gateway Endpoint (FREE)
- DynamoDB Gateway Endpoint (FREE)

Dependencies: None (foundation stack)

Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 9.3
"""

from typing import List
from aws_cdk import (
    aws_ec2 as ec2,
    CfnOutput,
)
from constructs import Construct
from lib.stacks.base_stack import ShowCoreBaseStack


class ShowCoreNetworkStack(ShowCoreBaseStack):
    """
    Network infrastructure stack for ShowCore Phase 1.
    
    Creates VPC, subnets, Internet Gateway, route tables, and VPC Gateway Endpoints.
    Uses VPC Endpoints instead of NAT Gateway for cost optimization.
    
    Cost Optimization:
    - NO NAT Gateway (saves ~$32/month)
    - Private subnets access AWS services via VPC Endpoints
    - Gateway Endpoints (S3, DynamoDB) are FREE
    - Interface Endpoints (~$7/month each) added in future tasks
    
    Security:
    - Private subnets have NO internet access
    - Public subnets use Internet Gateway for outbound traffic
    - VPC Endpoints provide secure AWS service access
    
    Network Design:
    - VPC: 10.0.0.0/16 (65,536 IPs)
    - Public Subnets: 256 IPs each (10.0.0.0/24, 10.0.1.0/24)
    - Private Subnets: 256 IPs each (10.0.2.0/24, 10.0.3.0/24)
    - Multi-AZ: us-east-1a and us-east-1b
    - S3 Gateway Endpoint (FREE)
    - DynamoDB Gateway Endpoint (FREE)
    
    Usage:
        network_stack = ShowCoreNetworkStack(
            app,
            "ShowCoreNetworkStack",
            env=env
        )
    
    Exports:
    - VpcId: VPC ID for cross-stack references
    - PublicSubnetIds: Public subnet IDs
    - PrivateSubnetIds: Private subnet IDs
    """
    
    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        **kwargs
    ) -> None:
        """
        Initialize the network stack.
        
        Args:
            scope: CDK app or parent construct
            construct_id: Unique identifier for this stack
            **kwargs: Additional stack properties
        """
        super().__init__(
            scope,
            construct_id,
            component="Network",
            **kwargs
        )
        
        # Get configuration from context
        vpc_cidr = self.node.try_get_context("vpc_cidr") or "10.0.0.0/16"
        enable_nat_gateway = self.node.try_get_context("enable_nat_gateway")
        if enable_nat_gateway is None:
            enable_nat_gateway = False  # Default to False for cost optimization
        
        # Create VPC with multi-AZ subnets
        # DO NOT create NAT Gateway (cost optimization - saves ~$32/month)
        self.vpc = self._create_vpc(vpc_cidr, enable_nat_gateway)
        
        # Create VPC Gateway Endpoints (FREE)
        # Gateway Endpoints for S3 and DynamoDB are FREE and provide secure access
        # from private subnets without requiring NAT Gateway or internet access
        self.s3_gateway_endpoint = self._create_s3_gateway_endpoint()
        self.dynamodb_gateway_endpoint = self._create_dynamodb_gateway_endpoint()
        
        # Export VPC ID and subnet IDs for cross-stack references
        self._create_outputs()
    
    def _create_vpc(self, vpc_cidr: str, enable_nat_gateway: bool) -> ec2.Vpc:
        """
        Create VPC with multi-AZ subnets.
        
        Creates a VPC with:
        - 2 public subnets in us-east-1a and us-east-1b
        - 2 private subnets in us-east-1a and us-east-1b
        - Internet Gateway for public subnets
        - NO NAT Gateway (cost optimization)
        
        Args:
            vpc_cidr: CIDR block for VPC (e.g., "10.0.0.0/16")
            enable_nat_gateway: Whether to create NAT Gateway (should be False)
            
        Returns:
            VPC construct
        """
        # Create VPC with explicit subnet configuration
        # Use construct ID "VPC" as specified in task requirements
        vpc = ec2.Vpc(
            self,
            "VPC",
            ip_addresses=ec2.IpAddresses.cidr(vpc_cidr),
            max_azs=2,  # Use 2 availability zones (us-east-1a, us-east-1b)
            nat_gateways=0 if not enable_nat_gateway else 1,  # NO NAT Gateway for cost optimization
            subnet_configuration=[
                # Public subnets (10.0.0.0/24, 10.0.1.0/24)
                ec2.SubnetConfiguration(
                    name="Public",
                    subnet_type=ec2.SubnetType.PUBLIC,
                    cidr_mask=24,  # 256 IPs per subnet
                ),
                # Private subnets (10.0.2.0/24, 10.0.3.0/24)
                # NO NAT Gateway route - will use VPC Endpoints for AWS service access
                ec2.SubnetConfiguration(
                    name="Private",
                    subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS if enable_nat_gateway else ec2.SubnetType.PRIVATE_ISOLATED,
                    cidr_mask=24,  # 256 IPs per subnet
                ),
            ],
            # Enable DNS hostnames and DNS support for VPC Endpoints
            enable_dns_hostnames=True,
            enable_dns_support=True,
        )
        
        # Add Name tag to VPC for easier identification in console
        vpc.node.add_metadata("Name", self.get_resource_name("vpc"))
        
        return vpc
    
    def _create_s3_gateway_endpoint(self) -> ec2.GatewayVpcEndpoint:
        """
        Create S3 Gateway Endpoint for secure S3 access from private subnets.
        
        Gateway Endpoints are FREE and automatically add routes to private subnet
        route tables. This enables private subnets to access S3 without requiring
        NAT Gateway or internet access.
        
        Use cases:
        - RDS backups to S3
        - Application logs to S3
        - Static asset storage
        - CloudTrail logs to S3
        
        Cost: FREE (no charges for Gateway Endpoints)
        
        Returns:
            S3 Gateway Endpoint construct
        """
        s3_endpoint = ec2.GatewayVpcEndpoint(
            self,
            "S3GatewayEndpoint",
            vpc=self.vpc,
            service=ec2.GatewayVpcEndpointAwsService.S3,
            # Attach to private subnet route tables automatically
            # This allows private subnets to access S3 without internet access
            subnets=[ec2.SubnetSelection(subnet_type=ec2.SubnetType.PRIVATE_ISOLATED)]
        )
        
        return s3_endpoint
    
    def _create_dynamodb_gateway_endpoint(self) -> ec2.GatewayVpcEndpoint:
        """
        Create DynamoDB Gateway Endpoint for future use.
        
        Gateway Endpoints are FREE and automatically add routes to private subnet
        route tables. This enables private subnets to access DynamoDB without
        requiring NAT Gateway or internet access.
        
        Use cases:
        - Future application data storage
        - Session management
        - Caching layer
        
        Cost: FREE (no charges for Gateway Endpoints)
        
        Returns:
            DynamoDB Gateway Endpoint construct
        """
        dynamodb_endpoint = ec2.GatewayVpcEndpoint(
            self,
            "DynamoDBGatewayEndpoint",
            vpc=self.vpc,
            service=ec2.GatewayVpcEndpointAwsService.DYNAMODB,
            # Attach to private subnet route tables automatically
            # This allows private subnets to access DynamoDB without internet access
            subnets=[ec2.SubnetSelection(subnet_type=ec2.SubnetType.PRIVATE_ISOLATED)]
        )
        
        return dynamodb_endpoint
    
    def _create_outputs(self) -> None:
        """
        Create CloudFormation outputs for cross-stack references.
        
        Exports:
        - VpcId: VPC ID
        - PublicSubnetIds: Comma-separated list of public subnet IDs
        - PrivateSubnetIds: Comma-separated list of private subnet IDs
        """
        # Export VPC ID
        CfnOutput(
            self,
            "VpcId",
            value=self.vpc.vpc_id,
            export_name="ShowCoreVpcId",
            description="VPC ID for ShowCore Phase 1"
        )
        
        # Export public subnet IDs
        public_subnet_ids = [subnet.subnet_id for subnet in self.vpc.public_subnets]
        CfnOutput(
            self,
            "PublicSubnetIds",
            value=",".join(public_subnet_ids),
            export_name="ShowCorePublicSubnetIds",
            description="Public subnet IDs for ShowCore Phase 1"
        )
        
        # Export private subnet IDs
        private_subnet_ids = [subnet.subnet_id for subnet in self.vpc.private_subnets]
        CfnOutput(
            self,
            "PrivateSubnetIds",
            value=",".join(private_subnet_ids),
            export_name="ShowCorePrivateSubnetIds",
            description="Private subnet IDs for ShowCore Phase 1"
        )
    
    @property
    def public_subnets(self) -> List[ec2.ISubnet]:
        """
        Get public subnets.
        
        Returns:
            List of public subnets
        """
        return self.vpc.public_subnets
    
    @property
    def private_subnets(self) -> List[ec2.ISubnet]:
        """
        Get private subnets.
        
        Returns:
            List of private subnets
        """
        return self.vpc.private_subnets

