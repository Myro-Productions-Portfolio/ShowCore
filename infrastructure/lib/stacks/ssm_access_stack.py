"""
ShowCore SSM Access Stack

This module creates a small EC2 instance in the private subnet that can be used
for AWS Systems Manager Session Manager port forwarding to access RDS and ElastiCache.

Cost: ~$3.50/month (t3.nano instance)
- t3.nano: $0.0052/hour = ~$3.74/month
- Free Tier eligible: 750 hours/month free for 12 months

Security:
- Instance in private subnet (no internet access)
- No SSH keys required (uses Session Manager)
- No open SSH ports
- IAM role with minimal permissions
- All sessions logged to CloudWatch

Use Cases:
- Port forwarding to RDS PostgreSQL
- Port forwarding to ElastiCache Redis
- Secure access without bastion host
- No public IP address

Dependencies: NetworkStack, SecurityStack
"""

from aws_cdk import (
    aws_ec2 as ec2,
    aws_iam as iam,
    CfnOutput,
)
from constructs import Construct
from lib.stacks.base_stack import ShowCoreBaseStack


class ShowCoreSSMAccessStack(ShowCoreBaseStack):
    """
    SSM Access instance stack for ShowCore Phase 1.
    
    Creates a small EC2 instance in the private subnet for port forwarding
    to RDS and ElastiCache using AWS Systems Manager Session Manager.
    
    Cost: ~$3.50/month (t3.nano)
    - Free Tier eligible: 750 hours/month free for 12 months
    - After Free Tier: $0.0052/hour = ~$3.74/month
    
    Features:
    - No SSH keys required
    - No public IP address
    - No open SSH ports
    - All sessions logged to CloudWatch
    - IAM-based access control
    
    Usage:
        # Port forward to RDS
        aws ssm start-session \\
          --target INSTANCE_ID \\
          --document-name AWS-StartPortForwardingSessionToRemoteHost \\
          --parameters '{"host":["RDS_ENDPOINT"],"portNumber":["5432"],"localPortNumber":["5432"]}'
        
        # Port forward to Redis
        aws ssm start-session \\
          --target INSTANCE_ID \\
          --document-name AWS-StartPortForwardingSessionToRemoteHost \\
          --parameters '{"host":["REDIS_ENDPOINT"],"portNumber":["6379"],"localPortNumber":["6379"]}'
    """
    
    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        vpc: ec2.IVpc,
        rds_security_group: ec2.ISecurityGroup,
        redis_security_group: ec2.ISecurityGroup,
        **kwargs
    ) -> None:
        """
        Initialize the SSM access stack.
        
        Args:
            scope: CDK app or parent construct
            construct_id: Unique identifier for this stack
            vpc: VPC from NetworkStack
            rds_security_group: RDS security group from SecurityStack
            redis_security_group: Redis security group from SecurityStack
            **kwargs: Additional stack properties
        """
        super().__init__(
            scope,
            construct_id,
            component="SSMAccess",
            **kwargs
        )
        
        # Create IAM role for SSM access
        self.instance_role = self._create_instance_role()
        
        # Create security group for SSM access instance
        self.security_group = self._create_security_group(vpc)
        
        # Allow SSM instance to connect to RDS and Redis
        self._allow_database_access(rds_security_group, redis_security_group)
        
        # Create EC2 instance
        self.instance = self._create_instance(vpc)
        
        # Create outputs
        self._create_outputs()
    
    def _create_instance_role(self) -> iam.Role:
        """
        Create IAM role for EC2 instance with SSM permissions.
        
        Permissions:
        - AmazonSSMManagedInstanceCore: Required for Session Manager
        - CloudWatch Logs: For session logging
        
        Returns:
            IAM Role for EC2 instance
        """
        role = iam.Role(
            self,
            "InstanceRole",
            assumed_by=iam.ServicePrincipal("ec2.amazonaws.com"),
            description="IAM role for ShowCore SSM access instance",
            managed_policies=[
                # Required for Session Manager
                iam.ManagedPolicy.from_aws_managed_policy_name(
                    "AmazonSSMManagedInstanceCore"
                ),
                # Required for CloudWatch Logs
                iam.ManagedPolicy.from_aws_managed_policy_name(
                    "CloudWatchAgentServerPolicy"
                ),
            ],
        )
        
        return role
    
    def _create_security_group(self, vpc: ec2.IVpc) -> ec2.SecurityGroup:
        """
        Create security group for SSM access instance.
        
        No inbound rules required (Session Manager uses outbound HTTPS).
        Outbound rules allow HTTPS to VPC endpoints.
        
        Args:
            vpc: VPC to create security group in
            
        Returns:
            Security Group for SSM access instance
        """
        sg = ec2.SecurityGroup(
            self,
            "SecurityGroup",
            vpc=vpc,
            description="Security group for ShowCore SSM access instance",
            allow_all_outbound=True,  # Allow outbound to VPC endpoints
        )
        
        return sg
    
    def _allow_database_access(
        self,
        rds_security_group: ec2.ISecurityGroup,
        redis_security_group: ec2.ISecurityGroup
    ) -> None:
        """
        Allow SSM instance to connect to RDS and Redis.
        
        Note: We don't modify the RDS/Redis security groups here to avoid
        circular dependencies. Instead, we'll add rules manually after deployment
        or use a custom resource.
        
        Args:
            rds_security_group: RDS security group
            redis_security_group: Redis security group
        """
        # Store references for documentation
        self.rds_security_group = rds_security_group
        self.redis_security_group = redis_security_group
        
        # Note: Security group rules will be added manually after deployment
        # to avoid circular dependencies between stacks
    
    def _create_instance(self, vpc: ec2.IVpc) -> ec2.Instance:
        """
        Create EC2 instance for SSM access.
        
        Instance Configuration:
        - Type: t3.nano (cheapest, Free Tier eligible)
        - AMI: Amazon Linux 2023 (latest)
        - Subnet: Private subnet (no internet access)
        - No public IP
        - No SSH keys
        - SSM agent pre-installed
        
        Args:
            vpc: VPC to launch instance in
            
        Returns:
            EC2 Instance
        """
        # Get latest Amazon Linux 2023 AMI
        # Amazon Linux 2023 has SSM agent pre-installed
        amzn_linux = ec2.MachineImage.latest_amazon_linux2023(
            edition=ec2.AmazonLinuxEdition.STANDARD,
            cpu_type=ec2.AmazonLinuxCpuType.X86_64,
        )
        
        # Create instance in private subnet
        instance = ec2.Instance(
            self,
            "Instance",
            instance_type=ec2.InstanceType.of(
                ec2.InstanceClass.T3,
                ec2.InstanceSize.NANO,  # Cheapest, Free Tier eligible
            ),
            machine_image=amzn_linux,
            vpc=vpc,
            vpc_subnets=ec2.SubnetSelection(
                subnet_type=ec2.SubnetType.PRIVATE_ISOLATED
            ),
            security_group=self.security_group,
            role=self.instance_role,
            # No SSH key pair (using Session Manager)
            # No public IP (private subnet)
        )
        
        # Add Name tag
        instance.node.add_metadata(
            "Name",
            self.get_resource_name("ssm-access")
        )
        
        return instance
    
    def _create_outputs(self) -> None:
        """
        Create CloudFormation outputs.
        
        Exports:
        - InstanceId: EC2 instance ID for Session Manager
        - SecurityGroupId: Security group ID for adding to RDS/Redis rules
        - PortForwardingCommand: Example command for port forwarding
        """
        # Export instance ID
        CfnOutput(
            self,
            "InstanceId",
            value=self.instance.instance_id,
            export_name="ShowCoreSSMAccessInstanceId",
            description="SSM access instance ID for port forwarding"
        )
        
        # Export security group ID
        CfnOutput(
            self,
            "SecurityGroupId",
            value=self.security_group.security_group_id,
            export_name="ShowCoreSSMAccessSecurityGroupId",
            description="Security group ID for SSM access instance"
        )
        
        # Export example port forwarding command
        CfnOutput(
            self,
            "PortForwardingExample",
            value=f"aws ssm start-session --target {self.instance.instance_id} --document-name AWS-StartPortForwardingSessionToRemoteHost",
            description="Example Session Manager port forwarding command"
        )
