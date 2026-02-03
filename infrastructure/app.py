#!/usr/bin/env python3
"""
ShowCore AWS Migration Phase 1 - CDK Application Entry Point

This is the main entry point for the AWS CDK application that deploys
the ShowCore Phase 1 infrastructure.
"""

import aws_cdk as cdk
from lib.stacks.network_stack import ShowCoreNetworkStack
from lib.stacks.security_stack import ShowCoreSecurityStack
from lib.stacks.monitoring_stack import ShowCoreMonitoringStack

app = cdk.App()

# Get configuration from context
environment = app.node.try_get_context("environment") or "production"
account = app.node.try_get_context("account") or None
region = app.node.try_get_context("region") or "us-east-1"

# Define environment (account can be None for synthesis)
if account:
    env = cdk.Environment(account=account, region=region)
else:
    env = None

# Deploy Network Stack (foundation - VPC, subnets, Internet Gateway)
network_stack = ShowCoreNetworkStack(
    app,
    "ShowCoreNetworkStack",
    env=env,
    description="ShowCore Phase 1 - Network Infrastructure (VPC, Subnets, No NAT Gateway)"
)

# Deploy Security Stack (includes CloudTrail)
security_stack = ShowCoreSecurityStack(
    app,
    "ShowCoreSecurityStack",
    env=env,
    description="ShowCore Phase 1 - Security, CloudTrail, and Audit Logging"
)

# Deploy Monitoring Stack (includes billing alerts)
monitoring_stack = ShowCoreMonitoringStack(
    app,
    "ShowCoreMonitoringStack",
    env=env,
    description="ShowCore Phase 1 - Monitoring, Alerting, and Billing"
)

app.synth()
