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

Route Table Configuration:
- Public subnet route tables: 0.0.0.0/0 → Internet Gateway (automatic)
- Private subnet route tables: NO default route, only VPC Endpoint routes (automatic)
- Gateway Endpoints automatically add routes to private route tables
- Private subnets have NO internet access (PRIVATE_ISOLATED type ensures this)

Resources Created:
- VPC (10.0.0.0/16)
- 2 Public Subnets in us-east-1a and us-east-1b
- 2 Private Subnets in us-east-1a and us-east-1b
- Internet Gateway
- Route Tables (public and private) - configured automatically by CDK
- S3 Gateway Endpoint (FREE) - automatically adds routes to private route tables
- DynamoDB Gateway Endpoint (FREE) - automatically adds routes to private route tables
- VPC Endpoint Security Group
- CloudWatch Logs Interface Endpoint (~$7/month)
- CloudWatch Monitoring Interface Endpoint (~$7/month)
- Systems Manager Interface Endpoint (~$7/month)

Dependencies: None (foundation stack)

Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9, 2.11, 2.12, 9.3, 9.4
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
    
    Creates VPC, subnets, Internet Gateway, route tables, VPC Gateway Endpoints,
    and VPC Interface Endpoints. Uses VPC Endpoints instead of NAT Gateway for
    cost optimization.
    
    Cost Optimization:
    - NO NAT Gateway (saves ~$32/month)
    - Private subnets access AWS services via VPC Endpoints
    - Gateway Endpoints (S3, DynamoDB) are FREE
    - Interface Endpoints (~$7/month each) for essential services only
    - Net savings: ~$4-11/month vs NAT Gateway architecture
    
    Security:
    - Private subnets have NO internet access
    - Public subnets use Internet Gateway for outbound traffic
    - VPC Endpoints provide secure AWS service access
    - Security group controls access to Interface Endpoints
    
    Network Design:
    - VPC: 10.0.0.0/16 (65,536 IPs)
    - Public Subnets: 256 IPs each (10.0.0.0/24, 10.0.1.0/24)
    - Private Subnets: 256 IPs each (10.0.2.0/24, 10.0.3.0/24)
    - Multi-AZ: us-east-1a and us-east-1b
    - S3 Gateway Endpoint (FREE)
    - DynamoDB Gateway Endpoint (FREE)
    - CloudWatch Logs Interface Endpoint (~$7/month)
    - CloudWatch Monitoring Interface Endpoint (~$7/month)
    - Systems Manager Interface Endpoint (~$7/month)
    
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
        
        # Create security group for VPC Interface Endpoints
        # Interface Endpoints require security group to control access
        self.vpc_endpoint_security_group = self._create_vpc_endpoint_security_group()
        
        # Create VPC Interface Endpoints (~$7/month each)
        # Interface Endpoints use ENIs with private IPs to route traffic to AWS services
        # More expensive than Gateway Endpoints but still cheaper than NAT Gateway
        self.cloudwatch_logs_endpoint = self._create_cloudwatch_logs_endpoint()
        self.cloudwatch_monitoring_endpoint = self._create_cloudwatch_monitoring_endpoint()
        self.systems_manager_endpoint = self._create_systems_manager_endpoint()
        
        # Export VPC ID and subnet IDs for cross-stack references
        self._create_outputs()
    
    def _create_vpc(self, vpc_cidr: str, enable_nat_gateway: bool) -> ec2.Vpc:
        """
        Create VPC with multi-AZ subnets and configure route tables.
        
        Creates a VPC with:
        - 2 public subnets in us-east-1a and us-east-1b
        - 2 private subnets in us-east-1a and us-east-1b
        - Internet Gateway for public subnets
        - NO NAT Gateway (cost optimization)
        
        Route Table Configuration (Automatic by CDK):
        ================================================
        
        PUBLIC SUBNET ROUTE TABLES:
        - CDK automatically creates route table for public subnets
        - Route: 0.0.0.0/0 → Internet Gateway (automatic)
        - Enables internet access for resources in public subnets
        - Used for future Application Load Balancers
        
        PRIVATE SUBNET ROUTE TABLES:
        - CDK automatically creates route table for private subnets
        - NO default route (0.0.0.0/0) - NO internet access
        - PRIVATE_ISOLATED subnet type ensures no NAT Gateway route
        - Only local VPC routes (10.0.0.0/16) are present initially
        
        VPC ENDPOINT ROUTES (Added Automatically):
        - Gateway Endpoints (S3, DynamoDB) automatically add routes to private route tables
        - Route format: pl-xxxxx (prefix list) → vpce-xxxxx (Gateway Endpoint)
        - S3 Gateway Endpoint: pl-63a5400a → vpce-s3-gateway-id
        - DynamoDB Gateway Endpoint: pl-02cd2c6b → vpce-dynamodb-gateway-id
        - These routes enable AWS service access without internet connectivity
        
        VERIFICATION:
        - Private subnets have NO internet access (no 0.0.0.0/0 route)
        - Private subnets can access S3 and DynamoDB via Gateway Endpoints (FREE)
        - Private subnets can access CloudWatch and Systems Manager via Interface Endpoints
        - Public subnets have internet access via Internet Gateway
        
        Args:
            vpc_cidr: CIDR block for VPC (e.g., "10.0.0.0/16")
            enable_nat_gateway: Whether to create NAT Gateway (should be False)
            
        Returns:
            VPC construct
            
        Validates: Requirements 2.11, 2.4
        """
        # Create VPC with explicit subnet configuration
        # Use construct ID "VPC" as specified in task requirements
        # 
        # ROUTE TABLE CONFIGURATION (Automatic by CDK):
        # ==============================================
        # 
        # CDK automatically creates and configures route tables for each subnet type:
        # 
        # 1. PUBLIC SUBNET ROUTE TABLES:
        #    - CDK creates one route table per public subnet
        #    - Automatically adds route: 0.0.0.0/0 → Internet Gateway
        #    - Enables internet access for resources in public subnets
        #    - Used for future Application Load Balancers
        # 
        # 2. PRIVATE SUBNET ROUTE TABLES:
        #    - CDK creates one route table per private subnet
        #    - NO default route (0.0.0.0/0) - NO internet access
        #    - PRIVATE_ISOLATED type ensures no NAT Gateway route is added
        #    - Only local VPC routes (10.0.0.0/16) are present initially
        #    - Gateway Endpoints will automatically add routes to these tables
        # 
        # 3. VPC ENDPOINT ROUTES (Added by Gateway Endpoints):
        #    - S3 Gateway Endpoint automatically adds route to private route tables
        #    - DynamoDB Gateway Endpoint automatically adds route to private route tables
        #    - Route format: pl-xxxxx (prefix list) → vpce-xxxxx (Gateway Endpoint)
        #    - These routes enable AWS service access without internet connectivity
        # 
        # VERIFICATION:
        # - Private subnets have NO internet access (no 0.0.0.0/0 route to NAT Gateway or IGW)
        # - Private subnets can access S3 and DynamoDB via Gateway Endpoints (FREE)
        # - Private subnets can access CloudWatch and Systems Manager via Interface Endpoints
        # - Public subnets have internet access via Internet Gateway
        # 
        vpc = ec2.Vpc(
            self,
            "VPC",
            ip_addresses=ec2.IpAddresses.cidr(vpc_cidr),
            max_azs=2,  # Use 2 availability zones (us-east-1a, us-east-1b)
            nat_gateways=0 if not enable_nat_gateway else 1,  # NO NAT Gateway for cost optimization
            subnet_configuration=[
                # Public subnets (10.0.0.0/24, 10.0.1.0/24)
                # Route table: 0.0.0.0/0 → Internet Gateway (automatic)
                ec2.SubnetConfiguration(
                    name="Public",
                    subnet_type=ec2.SubnetType.PUBLIC,
                    cidr_mask=24,  # 256 IPs per subnet
                ),
                # Private subnets (10.0.2.0/24, 10.0.3.0/24)
                # Route table: NO default route (PRIVATE_ISOLATED ensures no internet access)
                # Gateway Endpoints will automatically add routes to these route tables
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
        
        # ============================================================================
        # ROUTE TABLE CONFIGURATION VERIFICATION
        # ============================================================================
        # 
        # At this point, CDK has automatically configured the following route tables:
        # 
        # PUBLIC SUBNET ROUTE TABLES (2 route tables, one per AZ):
        # ┌─────────────────────────────────────────────────────────────────┐
        # │ Destination          │ Target                                   │
        # ├─────────────────────────────────────────────────────────────────┤
        # │ 10.0.0.0/16          │ local (VPC CIDR)                         │
        # │ 0.0.0.0/0            │ igw-xxxxx (Internet Gateway)             │
        # └─────────────────────────────────────────────────────────────────┘
        # 
        # PRIVATE SUBNET ROUTE TABLES (2 route tables, one per AZ):
        # ┌─────────────────────────────────────────────────────────────────┐
        # │ Destination          │ Target                                   │
        # ├─────────────────────────────────────────────────────────────────┤
        # │ 10.0.0.0/16          │ local (VPC CIDR)                         │
        # │ NO DEFAULT ROUTE     │ NO NAT Gateway or Internet Gateway       │
        # └─────────────────────────────────────────────────────────────────┘
        # 
        # AFTER GATEWAY ENDPOINTS ARE CREATED (in subsequent methods):
        # Private subnet route tables will automatically have these routes added:
        # ┌─────────────────────────────────────────────────────────────────┐
        # │ Destination          │ Target                                   │
        # ├─────────────────────────────────────────────────────────────────┤
        # │ 10.0.0.0/16          │ local (VPC CIDR)                         │
        # │ pl-63a5400a          │ vpce-xxxxx (S3 Gateway Endpoint)         │
        # │ pl-02cd2c6b          │ vpce-xxxxx (DynamoDB Gateway Endpoint)   │
        # └─────────────────────────────────────────────────────────────────┘
        # 
        # VERIFICATION CHECKLIST:
        # ✅ Public subnets have route to Internet Gateway (0.0.0.0/0 → IGW)
        # ✅ Private subnets have NO default route (no 0.0.0.0/0 route)
        # ✅ Private subnets have NO NAT Gateway route (cost optimization)
        # ✅ Gateway Endpoints will automatically add routes to private route tables
        # ✅ Private subnets have NO internet access (PRIVATE_ISOLATED type)
        # ✅ VPC ID and subnet IDs will be exported as CloudFormation outputs
        # 
        # This configuration validates Requirements 2.11 and 2.4:
        # - Requirement 2.11: Route tables configured to route AWS service traffic through VPC Endpoints
        # - Requirement 2.4: NO NAT Gateway deployed to eliminate ~$32/month cost
        # ============================================================================
        
        return vpc
    
    def _create_s3_gateway_endpoint(self) -> ec2.GatewayVpcEndpoint:
        """
        Create S3 Gateway Endpoint for secure S3 access from private subnets.
        
        Gateway Endpoints are FREE and automatically add routes to private subnet
        route tables. This enables private subnets to access S3 without requiring
        NAT Gateway or internet access.
        
        Route Table Configuration:
        - Gateway Endpoint automatically adds route to private subnet route tables
        - Route format: pl-63a5400a (S3 prefix list) → vpce-xxxxx (Gateway Endpoint)
        - NO manual route configuration required
        - Private subnets can access S3 without internet access
        
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
            # CDK automatically adds routes to the specified subnet route tables
            # Route: S3 prefix list → Gateway Endpoint (automatic)
            subnets=[ec2.SubnetSelection(subnet_type=ec2.SubnetType.PRIVATE_ISOLATED)]
        )
        
        return s3_endpoint
    
    def _create_dynamodb_gateway_endpoint(self) -> ec2.GatewayVpcEndpoint:
        """
        Create DynamoDB Gateway Endpoint for future use.
        
        Gateway Endpoints are FREE and automatically add routes to private subnet
        route tables. This enables private subnets to access DynamoDB without
        requiring NAT Gateway or internet access.
        
        Route Table Configuration:
        - Gateway Endpoint automatically adds route to private subnet route tables
        - Route format: pl-02cd2c6b (DynamoDB prefix list) → vpce-xxxxx (Gateway Endpoint)
        - NO manual route configuration required
        - Private subnets can access DynamoDB without internet access
        
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
            # CDK automatically adds routes to the specified subnet route tables
            # Route: DynamoDB prefix list → Gateway Endpoint (automatic)
            subnets=[ec2.SubnetSelection(subnet_type=ec2.SubnetType.PRIVATE_ISOLATED)]
        )
        
        return dynamodb_endpoint
    
    def _create_vpc_endpoint_security_group(self) -> ec2.SecurityGroup:
        """
        Create security group for VPC Interface Endpoints.
        
        Interface Endpoints use Elastic Network Interfaces (ENIs) with private IP
        addresses in the VPC. They require a security group to control access.
        
        Security Rules:
        - Ingress: HTTPS (443) from VPC CIDR (10.0.0.0/16)
        - Egress: None (stateful firewall, return traffic allowed automatically)
        
        This security group allows all resources in the VPC to access AWS services
        via Interface Endpoints using HTTPS.
        
        Cost: No additional cost for security groups
        
        Returns:
            Security Group construct for VPC Endpoints
        """
        vpc_endpoint_sg = ec2.SecurityGroup(
            self,
            "VpcEndpointSecurityGroup",
            vpc=self.vpc,
            description="Security group for VPC Interface Endpoints",
            allow_all_outbound=False,  # No outbound rules needed (stateful)
        )
        
        # Allow HTTPS (443) from VPC CIDR
        # This allows all resources in the VPC to access AWS services via Interface Endpoints
        vpc_endpoint_sg.add_ingress_rule(
            peer=ec2.Peer.ipv4(self.vpc.vpc_cidr_block),
            connection=ec2.Port.tcp(443),
            description="HTTPS from VPC for AWS service access"
        )
        
        return vpc_endpoint_sg
    
    def _create_cloudwatch_logs_endpoint(self) -> ec2.InterfaceVpcEndpoint:
        """
        Create CloudWatch Logs Interface Endpoint.
        
        Enables private subnets to send logs to CloudWatch Logs without internet access.
        Uses Elastic Network Interfaces (ENIs) with private IPs in both private subnets.
        
        Use cases:
        - RDS logs to CloudWatch
        - ElastiCache logs to CloudWatch
        - Future application logs
        - VPC Flow Logs (if enabled)
        
        Cost: ~$7/month + data processing charges
        - $0.01 per GB data processed
        - $0.01 per hour per AZ (~$7.20/month for 2 AZs)
        
        Returns:
            CloudWatch Logs Interface Endpoint construct
        """
        cloudwatch_logs_endpoint = ec2.InterfaceVpcEndpoint(
            self,
            "CloudWatchLogsEndpoint",
            vpc=self.vpc,
            service=ec2.InterfaceVpcEndpointAwsService.CLOUDWATCH_LOGS,
            # Deploy ENI in both private subnets (us-east-1a, us-east-1b)
            subnets=ec2.SubnetSelection(subnet_type=ec2.SubnetType.PRIVATE_ISOLATED),
            # Attach security group to allow HTTPS from VPC
            security_groups=[self.vpc_endpoint_security_group],
            # Enable private DNS to use standard CloudWatch Logs endpoints
            # This allows applications to use logs.us-east-1.amazonaws.com
            private_dns_enabled=True,
        )
        
        return cloudwatch_logs_endpoint
    
    def _create_cloudwatch_monitoring_endpoint(self) -> ec2.InterfaceVpcEndpoint:
        """
        Create CloudWatch Monitoring Interface Endpoint.
        
        Enables private subnets to send metrics and alarms to CloudWatch without
        internet access. Uses Elastic Network Interfaces (ENIs) with private IPs
        in both private subnets.
        
        Use cases:
        - RDS metrics to CloudWatch
        - ElastiCache metrics to CloudWatch
        - Custom application metrics
        - CloudWatch alarms
        
        Cost: ~$7/month + data processing charges
        - $0.01 per GB data processed
        - $0.01 per hour per AZ (~$7.20/month for 2 AZs)
        
        Returns:
            CloudWatch Monitoring Interface Endpoint construct
        """
        cloudwatch_monitoring_endpoint = ec2.InterfaceVpcEndpoint(
            self,
            "CloudWatchMonitoringEndpoint",
            vpc=self.vpc,
            service=ec2.InterfaceVpcEndpointAwsService.CLOUDWATCH_MONITORING,
            # Deploy ENI in both private subnets (us-east-1a, us-east-1b)
            subnets=ec2.SubnetSelection(subnet_type=ec2.SubnetType.PRIVATE_ISOLATED),
            # Attach security group to allow HTTPS from VPC
            security_groups=[self.vpc_endpoint_security_group],
            # Enable private DNS to use standard CloudWatch endpoints
            # This allows applications to use monitoring.us-east-1.amazonaws.com
            private_dns_enabled=True,
        )
        
        return cloudwatch_monitoring_endpoint
    
    def _create_systems_manager_endpoint(self) -> ec2.InterfaceVpcEndpoint:
        """
        Create Systems Manager Interface Endpoint.
        
        Enables Session Manager for secure instance access without SSH keys or
        bastion hosts. Uses Elastic Network Interfaces (ENIs) with private IPs
        in both private subnets.
        
        Use cases:
        - Session Manager access to EC2 instances
        - Secure shell access without SSH keys
        - No bastion hosts required
        - Audit logging of all sessions
        
        Security Benefits:
        - No SSH keys to manage
        - No open SSH ports (22)
        - All sessions logged to CloudWatch
        - IAM-based access control
        
        Cost: ~$7/month + data processing charges
        - $0.01 per GB data processed
        - $0.01 per hour per AZ (~$7.20/month for 2 AZs)
        
        Returns:
            Systems Manager Interface Endpoint construct
        """
        systems_manager_endpoint = ec2.InterfaceVpcEndpoint(
            self,
            "SystemsManagerEndpoint",
            vpc=self.vpc,
            service=ec2.InterfaceVpcEndpointAwsService.SSM,
            # Deploy ENI in both private subnets (us-east-1a, us-east-1b)
            subnets=ec2.SubnetSelection(subnet_type=ec2.SubnetType.PRIVATE_ISOLATED),
            # Attach security group to allow HTTPS from VPC
            security_groups=[self.vpc_endpoint_security_group],
            # Enable private DNS to use standard Systems Manager endpoints
            # This allows applications to use ssm.us-east-1.amazonaws.com
            private_dns_enabled=True,
        )
        
        return systems_manager_endpoint
    
    def _create_outputs(self) -> None:
        """
        Create CloudFormation outputs for cross-stack references.
        
        Exports VPC ID and subnet IDs for use by other stacks.
        
        Note: Private subnets are created with PRIVATE_ISOLATED type, which means
        they are accessible via vpc.isolated_subnets property in CDK.
        
        Exports:
        - VpcId: VPC ID
        - PublicSubnetIds: Comma-separated list of public subnet IDs
        - PrivateSubnetIds: Comma-separated list of private (isolated) subnet IDs
        
        Validates: Requirements 2.11 (cross-stack references for route tables)
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
        # Note: Using isolated_subnets because we created subnets with PRIVATE_ISOLATED type
        # These are the private subnets with NO internet access (no NAT Gateway route)
        private_subnet_ids = [subnet.subnet_id for subnet in self.vpc.isolated_subnets]
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
        
        Note: Returns isolated_subnets because we created subnets with PRIVATE_ISOLATED type.
        These are the private subnets with NO internet access (no NAT Gateway route).
        
        Returns:
            List of private (isolated) subnets
        """
        return self.vpc.isolated_subnets

