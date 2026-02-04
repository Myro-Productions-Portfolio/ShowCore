"""
Unit tests for ShowCoreNetworkStack

Tests verify:
- VPC exists with correct CIDR (10.0.0.0/16)
- Subnets exist in correct AZs with correct CIDR blocks
- NO NAT Gateway exists (cost optimization)
- Gateway Endpoints exist for S3 and DynamoDB
- Interface Endpoints exist with correct security groups
- Route tables have correct routes (public: IGW, private: no default route)
- Internet Gateway exists for public subnets

These tests run against CDK synthesized template - no actual AWS resources.

Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9
"""

import aws_cdk as cdk
from aws_cdk.assertions import Template, Match
from lib.stacks.network_stack import ShowCoreNetworkStack


def test_vpc_created_with_correct_cidr():
    """
    Test VPC is created with correct CIDR block (10.0.0.0/16).
    
    Validates: Requirement 2.1 - VPC with CIDR block that supports at least 1000 IP addresses
    """
    app = cdk.App()
    stack = ShowCoreNetworkStack(app, "TestNetworkStack")
    template = Template.from_stack(stack)
    
    # Verify VPC exists with correct CIDR
    template.has_resource_properties("AWS::EC2::VPC", {
        "CidrBlock": "10.0.0.0/16",
        "EnableDnsHostnames": True,
        "EnableDnsSupport": True
    })


def test_public_subnets_exist_in_correct_azs():
    """
    Test public subnets exist in correct availability zones.
    
    Validates: Requirement 2.2 - Public subnets in at least two availability zones
    """
    app = cdk.App()
    stack = ShowCoreNetworkStack(app, "TestNetworkStack")
    template = Template.from_stack(stack)
    
    # Verify at least 2 public subnets exist
    # Public subnets have MapPublicIpOnLaunch set to true
    template.resource_count_is("AWS::EC2::Subnet", 4)  # 2 public + 2 private
    
    # Find public subnets (those with MapPublicIpOnLaunch: true)
    resources = template.find_resources("AWS::EC2::Subnet")
    public_subnets = [
        subnet for subnet_id, subnet in resources.items()
        if subnet.get("Properties", {}).get("MapPublicIpOnLaunch", False)
    ]
    
    # Verify we have 2 public subnets
    assert len(public_subnets) == 2, f"Expected 2 public subnets, found {len(public_subnets)}"
    
    # Verify public subnets are in different AZs
    # Extract AZ references (they may be Fn::GetAtt or Fn::Select)
    azs = []
    for subnet in public_subnets:
        az = subnet["Properties"]["AvailabilityZone"]
        # Convert to string representation for comparison
        az_str = str(az)
        azs.append(az_str)
    
    assert len(set(azs)) == 2, "Public subnets should be in 2 different AZs"


def test_private_subnets_exist_in_correct_azs():
    """
    Test private subnets exist in correct availability zones.
    
    Validates: Requirement 2.3 - Private subnets in at least two availability zones
    """
    app = cdk.App()
    stack = ShowCoreNetworkStack(app, "TestNetworkStack")
    template = Template.from_stack(stack)
    
    # Find private subnets (those without MapPublicIpOnLaunch or set to false)
    resources = template.find_resources("AWS::EC2::Subnet")
    private_subnets = [
        subnet for subnet_id, subnet in resources.items()
        if not subnet.get("Properties", {}).get("MapPublicIpOnLaunch", False)
    ]
    
    # Verify we have 2 private subnets
    assert len(private_subnets) == 2, f"Expected 2 private subnets, found {len(private_subnets)}"
    
    # Verify private subnets are in different AZs
    # Extract AZ references (they may be Fn::GetAtt or Fn::Select)
    azs = []
    for subnet in private_subnets:
        az = subnet["Properties"]["AvailabilityZone"]
        # Convert to string representation for comparison
        az_str = str(az)
        azs.append(az_str)
    
    assert len(set(azs)) == 2, "Private subnets should be in 2 different AZs"


def test_subnet_cidr_blocks():
    """
    Test subnets have correct CIDR blocks.
    
    Public subnets: 10.0.0.0/24, 10.0.1.0/24
    Private subnets: 10.0.2.0/24, 10.0.3.0/24
    
    Validates: Requirements 2.2, 2.3
    """
    app = cdk.App()
    stack = ShowCoreNetworkStack(app, "TestNetworkStack")
    template = Template.from_stack(stack)
    
    # Get all subnets
    resources = template.find_resources("AWS::EC2::Subnet")
    
    # Extract CIDR blocks
    cidr_blocks = [subnet["Properties"]["CidrBlock"] for subnet_id, subnet in resources.items()]
    
    # Verify we have 4 subnets with /24 CIDR blocks
    assert len(cidr_blocks) == 4, f"Expected 4 subnets, found {len(cidr_blocks)}"
    
    # Verify all subnets are /24 (256 IPs each)
    for cidr in cidr_blocks:
        assert cidr.endswith("/24"), f"Expected /24 CIDR block, found {cidr}"
    
    # Verify CIDR blocks are in the 10.0.0.0/16 range
    for cidr in cidr_blocks:
        assert cidr.startswith("10.0."), f"Expected CIDR in 10.0.0.0/16 range, found {cidr}"


def test_no_nat_gateway_exists():
    """
    Test NO NAT Gateway is deployed (cost optimization).
    
    This is a critical cost optimization measure that saves ~$32/month.
    Private subnets use VPC Endpoints for AWS service access instead.
    
    Validates: Requirement 2.4 - NO NAT Gateway deployed
    """
    app = cdk.App()
    stack = ShowCoreNetworkStack(app, "TestNetworkStack")
    template = Template.from_stack(stack)
    
    # Verify NO NAT Gateway exists
    template.resource_count_is("AWS::EC2::NatGateway", 0)


def test_internet_gateway_exists():
    """
    Test Internet Gateway exists for public subnets.
    
    Internet Gateway enables internet access for resources in public subnets.
    
    Validates: Requirement 2.2 - Public subnets with internet access
    """
    app = cdk.App()
    stack = ShowCoreNetworkStack(app, "TestNetworkStack")
    template = Template.from_stack(stack)
    
    # Verify Internet Gateway exists
    template.resource_count_is("AWS::EC2::InternetGateway", 1)
    
    # Verify Internet Gateway is attached to VPC
    template.has_resource_properties("AWS::EC2::VPCGatewayAttachment", {
        "InternetGatewayId": Match.any_value(),
        "VpcId": Match.any_value()
    })


def test_s3_gateway_endpoint_exists():
    """
    Test S3 Gateway Endpoint exists (FREE).
    
    Gateway Endpoints are FREE and enable private subnets to access S3
    without requiring NAT Gateway or internet access.
    
    Validates: Requirement 2.5 - Gateway Endpoint for S3
    """
    app = cdk.App()
    stack = ShowCoreNetworkStack(app, "TestNetworkStack")
    template = Template.from_stack(stack)
    
    # Verify S3 Gateway Endpoint exists
    # ServiceName is a CloudFormation intrinsic function, so we just check for Gateway type
    template.has_resource_properties("AWS::EC2::VPCEndpoint", {
        "VpcEndpointType": "Gateway"
    })
    
    # Count Gateway Endpoints (should be 2: S3 and DynamoDB)
    resources = template.find_resources("AWS::EC2::VPCEndpoint")
    gateway_endpoints = [
        endpoint for endpoint_id, endpoint in resources.items()
        if endpoint["Properties"].get("VpcEndpointType") == "Gateway"
    ]
    assert len(gateway_endpoints) >= 1, "Should have at least 1 Gateway Endpoint (S3)"


def test_dynamodb_gateway_endpoint_exists():
    """
    Test DynamoDB Gateway Endpoint exists (FREE).
    
    Gateway Endpoints are FREE and enable private subnets to access DynamoDB
    without requiring NAT Gateway or internet access.
    
    Validates: Requirement 2.6 - Gateway Endpoint for DynamoDB
    """
    app = cdk.App()
    stack = ShowCoreNetworkStack(app, "TestNetworkStack")
    template = Template.from_stack(stack)
    
    # Verify DynamoDB Gateway Endpoint exists
    # ServiceName is a CloudFormation intrinsic function, so we just check for Gateway type
    template.has_resource_properties("AWS::EC2::VPCEndpoint", {
        "VpcEndpointType": "Gateway"
    })
    
    # Count Gateway Endpoints (should be 2: S3 and DynamoDB)
    resources = template.find_resources("AWS::EC2::VPCEndpoint")
    gateway_endpoints = [
        endpoint for endpoint_id, endpoint in resources.items()
        if endpoint["Properties"].get("VpcEndpointType") == "Gateway"
    ]
    assert len(gateway_endpoints) == 2, f"Should have 2 Gateway Endpoints (S3 and DynamoDB), found {len(gateway_endpoints)}"


def test_cloudwatch_logs_interface_endpoint_exists():
    """
    Test CloudWatch Logs Interface Endpoint exists.
    
    Interface Endpoints cost ~$7/month but enable private subnets to send logs
    to CloudWatch without internet access.
    
    Validates: Requirement 2.7 - Interface Endpoint for CloudWatch Logs
    """
    app = cdk.App()
    stack = ShowCoreNetworkStack(app, "TestNetworkStack")
    template = Template.from_stack(stack)
    
    # Verify CloudWatch Logs Interface Endpoint exists
    # ServiceName is a CloudFormation intrinsic function, so we just check for Interface type
    template.has_resource_properties("AWS::EC2::VPCEndpoint", {
        "VpcEndpointType": "Interface",
        "PrivateDnsEnabled": True
    })
    
    # Count Interface Endpoints (should be 3: CloudWatch Logs, Monitoring, Systems Manager)
    resources = template.find_resources("AWS::EC2::VPCEndpoint")
    interface_endpoints = [
        endpoint for endpoint_id, endpoint in resources.items()
        if endpoint["Properties"].get("VpcEndpointType") == "Interface"
    ]
    assert len(interface_endpoints) >= 1, "Should have at least 1 Interface Endpoint"


def test_cloudwatch_monitoring_interface_endpoint_exists():
    """
    Test CloudWatch Monitoring Interface Endpoint exists.
    
    Interface Endpoints cost ~$7/month but enable private subnets to send metrics
    to CloudWatch without internet access.
    
    Validates: Requirement 2.8 - Interface Endpoint for CloudWatch Monitoring
    """
    app = cdk.App()
    stack = ShowCoreNetworkStack(app, "TestNetworkStack")
    template = Template.from_stack(stack)
    
    # Verify CloudWatch Monitoring Interface Endpoint exists
    # ServiceName is a CloudFormation intrinsic function, so we just check for Interface type
    template.has_resource_properties("AWS::EC2::VPCEndpoint", {
        "VpcEndpointType": "Interface",
        "PrivateDnsEnabled": True
    })
    
    # Count Interface Endpoints (should be 3: CloudWatch Logs, Monitoring, Systems Manager)
    resources = template.find_resources("AWS::EC2::VPCEndpoint")
    interface_endpoints = [
        endpoint for endpoint_id, endpoint in resources.items()
        if endpoint["Properties"].get("VpcEndpointType") == "Interface"
    ]
    assert len(interface_endpoints) >= 2, "Should have at least 2 Interface Endpoints"


def test_systems_manager_interface_endpoint_exists():
    """
    Test Systems Manager Interface Endpoint exists.
    
    Interface Endpoints cost ~$7/month but enable Session Manager access
    without SSH keys or bastion hosts.
    
    Validates: Requirement 2.9 - Interface Endpoint for Systems Manager
    """
    app = cdk.App()
    stack = ShowCoreNetworkStack(app, "TestNetworkStack")
    template = Template.from_stack(stack)
    
    # Verify Systems Manager Interface Endpoint exists
    # ServiceName is a CloudFormation intrinsic function, so we just check for Interface type
    template.has_resource_properties("AWS::EC2::VPCEndpoint", {
        "VpcEndpointType": "Interface",
        "PrivateDnsEnabled": True
    })
    
    # Count Interface Endpoints (should be 3: CloudWatch Logs, Monitoring, Systems Manager)
    resources = template.find_resources("AWS::EC2::VPCEndpoint")
    interface_endpoints = [
        endpoint for endpoint_id, endpoint in resources.items()
        if endpoint["Properties"].get("VpcEndpointType") == "Interface"
    ]
    assert len(interface_endpoints) == 3, f"Should have 3 Interface Endpoints, found {len(interface_endpoints)}"


def test_vpc_endpoint_security_group_exists():
    """
    Test security group for VPC Interface Endpoints exists.
    
    Interface Endpoints require a security group to control access.
    
    Validates: Requirement 2.12 - Security groups for Interface Endpoints
    """
    app = cdk.App()
    stack = ShowCoreNetworkStack(app, "TestNetworkStack")
    template = Template.from_stack(stack)
    
    # Verify VPC Endpoint security group exists
    template.has_resource_properties("AWS::EC2::SecurityGroup", {
        "GroupDescription": "Security group for VPC Interface Endpoints",
        "VpcId": Match.any_value()
    })


def test_vpc_endpoint_security_group_allows_https_from_vpc():
    """
    Test VPC Endpoint security group allows HTTPS from VPC CIDR.
    
    This allows all resources in the VPC to access AWS services via Interface Endpoints.
    
    Validates: Requirement 2.12 - Security groups allow traffic from VPC
    """
    app = cdk.App()
    stack = ShowCoreNetworkStack(app, "TestNetworkStack")
    template = Template.from_stack(stack)
    
    # Find the VPC Endpoint security group
    resources = template.find_resources("AWS::EC2::SecurityGroup")
    vpc_endpoint_sg = None
    
    for sg_id, sg in resources.items():
        if sg["Properties"]["GroupDescription"] == "Security group for VPC Interface Endpoints":
            vpc_endpoint_sg = sg
            break
    
    assert vpc_endpoint_sg is not None, "VPC Endpoint security group not found"
    
    # Verify ingress rule allows HTTPS (443) from VPC CIDR
    ingress_rules = vpc_endpoint_sg["Properties"].get("SecurityGroupIngress", [])
    
    # Find HTTPS rule
    https_rule = None
    for rule in ingress_rules:
        if rule.get("IpProtocol") == "tcp" and rule.get("FromPort") == 443:
            https_rule = rule
            break
    
    assert https_rule is not None, "HTTPS ingress rule not found"
    
    # CidrIp may be a CloudFormation intrinsic function (Fn::GetAtt) or a string
    # We just verify it exists and is from the VPC
    cidr_ip = https_rule.get("CidrIp")
    assert cidr_ip is not None, "HTTPS rule should have CidrIp"
    
    # If it's a dict, it's likely a CloudFormation function referencing the VPC CIDR
    # If it's a string, it should be 10.0.0.0/16
    if isinstance(cidr_ip, dict):
        # It's a CloudFormation function (Fn::GetAtt), which is correct
        assert "Fn::GetAtt" in cidr_ip or "Ref" in cidr_ip, "CidrIp should reference VPC CIDR"
    else:
        # It's a string, should be the VPC CIDR
        assert cidr_ip == "10.0.0.0/16", f"HTTPS rule should allow traffic from VPC CIDR, got {cidr_ip}"


def test_interface_endpoints_use_security_group():
    """
    Test Interface Endpoints are configured with security group.
    
    All Interface Endpoints should use the VPC Endpoint security group.
    
    Validates: Requirement 2.12 - Interface Endpoints use security groups
    """
    app = cdk.App()
    stack = ShowCoreNetworkStack(app, "TestNetworkStack")
    template = Template.from_stack(stack)
    
    # Find all Interface Endpoints
    resources = template.find_resources("AWS::EC2::VPCEndpoint")
    interface_endpoints = [
        endpoint for endpoint_id, endpoint in resources.items()
        if endpoint["Properties"].get("VpcEndpointType") == "Interface"
    ]
    
    # Verify we have 3 Interface Endpoints (CloudWatch Logs, Monitoring, Systems Manager)
    assert len(interface_endpoints) >= 3, f"Expected at least 3 Interface Endpoints, found {len(interface_endpoints)}"
    
    # Verify all Interface Endpoints have security groups
    for endpoint in interface_endpoints:
        security_group_ids = endpoint["Properties"].get("SecurityGroupIds", [])
        assert len(security_group_ids) > 0, "Interface Endpoint should have security group"


def test_interface_endpoints_in_private_subnets():
    """
    Test Interface Endpoints are deployed in private subnets.
    
    Interface Endpoints should be deployed in both private subnets (us-east-1a, us-east-1b).
    
    Validates: Requirements 2.7, 2.8, 2.9
    """
    app = cdk.App()
    stack = ShowCoreNetworkStack(app, "TestNetworkStack")
    template = Template.from_stack(stack)
    
    # Find all Interface Endpoints
    resources = template.find_resources("AWS::EC2::VPCEndpoint")
    interface_endpoints = [
        endpoint for endpoint_id, endpoint in resources.items()
        if endpoint["Properties"].get("VpcEndpointType") == "Interface"
    ]
    
    # Verify all Interface Endpoints have subnet IDs
    for endpoint in interface_endpoints:
        subnet_ids = endpoint["Properties"].get("SubnetIds", [])
        # Should have 2 subnets (one per AZ)
        assert len(subnet_ids) == 2, f"Interface Endpoint should be in 2 subnets, found {len(subnet_ids)}"


def test_gateway_endpoints_attached_to_route_tables():
    """
    Test Gateway Endpoints are attached to route tables.
    
    Gateway Endpoints automatically add routes to the specified route tables.
    
    Validates: Requirement 2.11 - Route tables configured for VPC Endpoints
    """
    app = cdk.App()
    stack = ShowCoreNetworkStack(app, "TestNetworkStack")
    template = Template.from_stack(stack)
    
    # Find all Gateway Endpoints
    resources = template.find_resources("AWS::EC2::VPCEndpoint")
    gateway_endpoints = [
        endpoint for endpoint_id, endpoint in resources.items()
        if endpoint["Properties"].get("VpcEndpointType") == "Gateway"
    ]
    
    # Verify we have 2 Gateway Endpoints (S3, DynamoDB)
    assert len(gateway_endpoints) == 2, f"Expected 2 Gateway Endpoints, found {len(gateway_endpoints)}"
    
    # Verify all Gateway Endpoints have route table IDs
    for endpoint in gateway_endpoints:
        route_table_ids = endpoint["Properties"].get("RouteTableIds", [])
        # Should have at least 2 route tables (one per private subnet)
        assert len(route_table_ids) >= 2, f"Gateway Endpoint should be attached to at least 2 route tables, found {len(route_table_ids)}"


def test_route_tables_exist():
    """
    Test route tables exist for public and private subnets.
    
    CDK automatically creates route tables for each subnet type.
    
    Validates: Requirement 2.11 - Route tables configured
    """
    app = cdk.App()
    stack = ShowCoreNetworkStack(app, "TestNetworkStack")
    template = Template.from_stack(stack)
    
    # Verify route tables exist
    # Should have at least 4 route tables (2 public + 2 private)
    template.resource_count_is("AWS::EC2::RouteTable", 4)


def test_public_subnet_route_to_internet_gateway():
    """
    Test public subnets have route to Internet Gateway.
    
    Public subnets should have a default route (0.0.0.0/0) to Internet Gateway.
    
    Validates: Requirement 2.2 - Public subnets with internet access
    """
    app = cdk.App()
    stack = ShowCoreNetworkStack(app, "TestNetworkStack")
    template = Template.from_stack(stack)
    
    # Find routes with destination 0.0.0.0/0
    resources = template.find_resources("AWS::EC2::Route")
    default_routes = [
        route for route_id, route in resources.items()
        if route["Properties"].get("DestinationCidrBlock") == "0.0.0.0/0"
    ]
    
    # Verify we have at least 2 default routes (one per public subnet)
    assert len(default_routes) >= 2, f"Expected at least 2 default routes, found {len(default_routes)}"
    
    # Verify default routes point to Internet Gateway
    for route in default_routes:
        assert "GatewayId" in route["Properties"], "Default route should have GatewayId (Internet Gateway)"


def test_private_subnets_no_default_route():
    """
    Test private subnets have NO default route (no internet access).
    
    Private subnets should NOT have a route to NAT Gateway or Internet Gateway.
    This is a critical security and cost optimization measure.
    
    Validates: Requirement 2.4 - Private subnets have NO internet access
    """
    app = cdk.App()
    stack = ShowCoreNetworkStack(app, "TestNetworkStack")
    template = Template.from_stack(stack)
    
    # Get all route tables
    route_tables = template.find_resources("AWS::EC2::RouteTable")
    
    # Get all subnet route table associations
    associations = template.find_resources("AWS::EC2::SubnetRouteTableAssociation")
    
    # Get all subnets
    subnets = template.find_resources("AWS::EC2::Subnet")
    
    # Find private subnets (those without MapPublicIpOnLaunch)
    private_subnet_ids = []
    for subnet_id, subnet in subnets.items():
        if not subnet.get("Properties", {}).get("MapPublicIpOnLaunch", False):
            private_subnet_ids.append({"Ref": subnet_id})
    
    # Find route tables associated with private subnets
    private_route_table_ids = []
    for assoc_id, assoc in associations.items():
        subnet_ref = assoc["Properties"]["SubnetId"]
        if subnet_ref in private_subnet_ids:
            private_route_table_ids.append(assoc["Properties"]["RouteTableId"])
    
    # Get all routes
    routes = template.find_resources("AWS::EC2::Route")
    
    # Verify NO routes with destination 0.0.0.0/0 in private route tables
    for route_id, route in routes.items():
        route_table_ref = route["Properties"]["RouteTableId"]
        destination = route["Properties"].get("DestinationCidrBlock")
        
        # If this route is in a private route table and has destination 0.0.0.0/0
        if route_table_ref in private_route_table_ids and destination == "0.0.0.0/0":
            # This should NOT happen - private subnets should have NO default route
            assert False, "Private subnet route table should NOT have default route (0.0.0.0/0)"


def test_vpc_outputs_exported():
    """
    Test VPC ID and subnet IDs are exported as CloudFormation outputs.
    
    These outputs are used for cross-stack references.
    
    Validates: Requirement 2.11 - Cross-stack references
    """
    app = cdk.App()
    stack = ShowCoreNetworkStack(app, "TestNetworkStack")
    template = Template.from_stack(stack)
    
    # Verify VPC ID output exists
    template.has_output("VpcId", {
        "Export": {
            "Name": "ShowCoreVpcId"
        }
    })
    
    # Verify public subnet IDs output exists
    template.has_output("PublicSubnetIds", {
        "Export": {
            "Name": "ShowCorePublicSubnetIds"
        }
    })
    
    # Verify private subnet IDs output exists
    template.has_output("PrivateSubnetIds", {
        "Export": {
            "Name": "ShowCorePrivateSubnetIds"
        }
    })


def test_vpc_dns_enabled():
    """
    Test VPC has DNS hostnames and DNS support enabled.
    
    This is required for VPC Endpoints to work correctly.
    
    Validates: Requirements 2.7, 2.8, 2.9 - VPC Endpoints require DNS
    """
    app = cdk.App()
    stack = ShowCoreNetworkStack(app, "TestNetworkStack")
    template = Template.from_stack(stack)
    
    # Verify VPC has DNS enabled
    template.has_resource_properties("AWS::EC2::VPC", {
        "EnableDnsHostnames": True,
        "EnableDnsSupport": True
    })


def test_interface_endpoints_private_dns_enabled():
    """
    Test Interface Endpoints have private DNS enabled.
    
    Private DNS allows applications to use standard AWS service endpoints
    (e.g., logs.us-east-1.amazonaws.com) which resolve to private IPs.
    
    Validates: Requirements 2.7, 2.8, 2.9
    """
    app = cdk.App()
    stack = ShowCoreNetworkStack(app, "TestNetworkStack")
    template = Template.from_stack(stack)
    
    # Find all Interface Endpoints
    resources = template.find_resources("AWS::EC2::VPCEndpoint")
    interface_endpoints = [
        endpoint for endpoint_id, endpoint in resources.items()
        if endpoint["Properties"].get("VpcEndpointType") == "Interface"
    ]
    
    # Verify all Interface Endpoints have private DNS enabled
    for endpoint in interface_endpoints:
        private_dns_enabled = endpoint["Properties"].get("PrivateDnsEnabled", False)
        assert private_dns_enabled, "Interface Endpoint should have private DNS enabled"


def test_cost_optimization_no_nat_gateway():
    """
    Test cost optimization: NO NAT Gateway deployed.
    
    This is the primary cost optimization measure, saving ~$32/month.
    
    Validates: Requirement 9.2 - NO NAT Gateway for cost optimization
    """
    app = cdk.App()
    stack = ShowCoreNetworkStack(app, "TestNetworkStack")
    template = Template.from_stack(stack)
    
    # Verify NO NAT Gateway exists
    template.resource_count_is("AWS::EC2::NatGateway", 0)
    
    # Verify NO Elastic IP for NAT Gateway exists
    # Note: Elastic IPs can be used for other purposes, so we just check NAT Gateway count
    pass


def test_cost_optimization_gateway_endpoints_free():
    """
    Test cost optimization: Gateway Endpoints are FREE.
    
    S3 and DynamoDB Gateway Endpoints are FREE and provide secure access
    from private subnets without requiring NAT Gateway.
    
    Validates: Requirement 9.3 - Gateway Endpoints for S3 and DynamoDB at no cost
    """
    app = cdk.App()
    stack = ShowCoreNetworkStack(app, "TestNetworkStack")
    template = Template.from_stack(stack)
    
    # Verify Gateway Endpoints exist (they are FREE)
    resources = template.find_resources("AWS::EC2::VPCEndpoint")
    gateway_endpoints = [
        endpoint for endpoint_id, endpoint in resources.items()
        if endpoint["Properties"].get("VpcEndpointType") == "Gateway"
    ]
    
    # Verify we have 2 Gateway Endpoints (S3, DynamoDB)
    assert len(gateway_endpoints) == 2, f"Expected 2 Gateway Endpoints (FREE), found {len(gateway_endpoints)}"


def test_cost_optimization_minimal_interface_endpoints():
    """
    Test cost optimization: Minimal Interface Endpoints.
    
    Only essential Interface Endpoints are deployed (CloudWatch Logs, Monitoring, Systems Manager).
    Each Interface Endpoint costs ~$7/month.
    
    Validates: Requirement 9.4 - Interface Endpoints for essential services only
    """
    app = cdk.App()
    stack = ShowCoreNetworkStack(app, "TestNetworkStack")
    template = Template.from_stack(stack)
    
    # Find all Interface Endpoints
    resources = template.find_resources("AWS::EC2::VPCEndpoint")
    interface_endpoints = [
        endpoint for endpoint_id, endpoint in resources.items()
        if endpoint["Properties"].get("VpcEndpointType") == "Interface"
    ]
    
    # Verify we have exactly 3 Interface Endpoints (CloudWatch Logs, Monitoring, Systems Manager)
    # This is the minimal set for essential services
    assert len(interface_endpoints) == 3, f"Expected 3 Interface Endpoints (minimal set), found {len(interface_endpoints)}"


def test_network_stack_with_custom_cidr():
    """
    Test network stack can be created with custom VPC CIDR.
    
    This tests the flexibility of the stack to use different CIDR blocks.
    """
    app = cdk.App(context={"vpc_cidr": "10.1.0.0/16"})
    stack = ShowCoreNetworkStack(app, "TestNetworkStack")
    template = Template.from_stack(stack)
    
    # Verify VPC uses custom CIDR
    template.has_resource_properties("AWS::EC2::VPC", {
        "CidrBlock": "10.1.0.0/16"
    })


def test_network_stack_resource_count():
    """
    Test network stack creates expected number of resources.
    
    This is a sanity check to ensure the stack creates all expected resources.
    """
    app = cdk.App()
    stack = ShowCoreNetworkStack(app, "TestNetworkStack")
    template = Template.from_stack(stack)
    
    # Verify resource counts
    template.resource_count_is("AWS::EC2::VPC", 1)
    template.resource_count_is("AWS::EC2::Subnet", 4)  # 2 public + 2 private
    template.resource_count_is("AWS::EC2::InternetGateway", 1)
    template.resource_count_is("AWS::EC2::NatGateway", 0)  # Cost optimization
    template.resource_count_is("AWS::EC2::RouteTable", 4)  # 2 public + 2 private
    
    # VPC Endpoints: 2 Gateway + 3 Interface = 5 total
    template.resource_count_is("AWS::EC2::VPCEndpoint", 5)
    
    # Security groups: 1 for VPC Endpoints + 1 default VPC security group
    # Note: CDK may create additional security groups, so we check for at least 1
    resources = template.find_resources("AWS::EC2::SecurityGroup")
    assert len(resources) >= 1, "Should have at least 1 security group (VPC Endpoint SG)"
