"""
Unit tests for ShowCoreStorageStack

Tests verify:
- S3 buckets exist with versioning enabled
- Encryption at rest is enabled using SSE-S3 (not KMS)
- Bucket policies prevent public access
- Lifecycle policies are configured for backups bucket
- Bucket names follow naming convention: showcore-{component}-{account-id}

These tests run against CDK synthesized template - no actual AWS resources.

Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.9, 9.9, 9.10
"""

import aws_cdk as cdk
from aws_cdk.assertions import Template, Match
from lib.stacks.storage_stack import ShowCoreStorageStack


def _create_test_stack():
    """
    Helper function to create test storage stack.
    
    StorageStack has no dependencies on other stacks.
    """
    app = cdk.App()
    
    # Create storage stack
    storage_stack = ShowCoreStorageStack(
        app,
        "TestStorageStack",
        environment="production"
    )
    
    return storage_stack


def test_static_assets_bucket_exists_with_versioning():
    """
    Test static assets bucket exists with versioning enabled.
    
    Versioning provides data protection and recovery capability.
    Enables rollback to previous versions if needed.
    
    Validates: Requirement 5.1
    """
    stack = _create_test_stack()
    template = Template.from_stack(stack)
    
    # Verify static assets bucket exists with versioning
    template.has_resource_properties("AWS::S3::Bucket", {
        "VersioningConfiguration": {
            "Status": "Enabled"
        }
    })


def test_backups_bucket_exists_with_versioning():
    """
    Test backups bucket exists with versioning enabled.
    
    Versioning provides data protection and recovery capability.
    Critical for backup data integrity.
    
    Validates: Requirement 5.2
    """
    stack = _create_test_stack()
    template = Template.from_stack(stack)
    
    # Count buckets with versioning enabled (should be 2: static assets + backups)
    template.resource_count_is("AWS::S3::Bucket", 2)
    
    # Verify all buckets have versioning enabled
    resources = template.find_resources("AWS::S3::Bucket")
    for bucket_id, bucket in resources.items():
        properties = bucket.get("Properties", {})
        versioning = properties.get("VersioningConfiguration", {})
        assert versioning.get("Status") == "Enabled", \
            f"Bucket {bucket_id} should have versioning enabled"


def test_buckets_use_sse_s3_encryption():
    """
    Test S3 buckets use SSE-S3 encryption (not KMS).
    
    SSE-S3 encryption is FREE and uses AWS managed keys with automatic rotation.
    KMS would cost $1/key/month + usage charges.
    
    Validates: Requirements 5.3, 9.9
    """
    stack = _create_test_stack()
    template = Template.from_stack(stack)
    
    # Verify all buckets use SSE-S3 encryption
    resources = template.find_resources("AWS::S3::Bucket")
    for bucket_id, bucket in resources.items():
        properties = bucket.get("Properties", {})
        encryption = properties.get("BucketEncryption", {})
        rules = encryption.get("ServerSideEncryptionConfiguration", [])
        
        assert len(rules) > 0, f"Bucket {bucket_id} should have encryption configured"
        
        # Verify SSE-S3 encryption (not KMS)
        for rule in rules:
            sse_algorithm = rule.get("ServerSideEncryptionByDefault", {}).get("SSEAlgorithm")
            assert sse_algorithm == "AES256", \
                f"Bucket {bucket_id} should use SSE-S3 (AES256), not KMS"
            
            # Verify KMS key is NOT specified
            assert "KMSMasterKeyID" not in rule.get("ServerSideEncryptionByDefault", {}), \
                f"Bucket {bucket_id} should not use KMS keys for cost optimization"


def test_buckets_block_public_access():
    """
    Test S3 buckets block all public access.
    
    Static assets bucket: CloudFront only via Origin Access Control (OAC)
    Backups bucket: Private access only via IAM
    
    Validates: Requirements 5.4, 5.2
    """
    stack = _create_test_stack()
    template = Template.from_stack(stack)
    
    # Verify all buckets block public access
    resources = template.find_resources("AWS::S3::Bucket")
    for bucket_id, bucket in resources.items():
        properties = bucket.get("Properties", {})
        public_access = properties.get("PublicAccessBlockConfiguration", {})
        
        # All four public access settings should be true
        assert public_access.get("BlockPublicAcls") == True, \
            f"Bucket {bucket_id} should block public ACLs"
        assert public_access.get("BlockPublicPolicy") == True, \
            f"Bucket {bucket_id} should block public policies"
        assert public_access.get("IgnorePublicAcls") == True, \
            f"Bucket {bucket_id} should ignore public ACLs"
        assert public_access.get("RestrictPublicBuckets") == True, \
            f"Bucket {bucket_id} should restrict public buckets"


def test_backups_bucket_has_glacier_transition_lifecycle_policy():
    """
    Test backups bucket has lifecycle policy to transition to Glacier after 30 days.
    
    Glacier Flexible Retrieval significantly reduces storage costs.
    Retrieval time: 3-5 hours (acceptable for backups).
    
    Validates: Requirement 5.9
    """
    stack = _create_test_stack()
    template = Template.from_stack(stack)
    
    # Find backups bucket (has lifecycle rules for Glacier transition)
    resources = template.find_resources("AWS::S3::Bucket")
    
    # Look for bucket with Glacier transition rule
    found_glacier_transition = False
    for bucket_id, bucket in resources.items():
        properties = bucket.get("Properties", {})
        lifecycle_rules = properties.get("LifecycleConfiguration", {}).get("Rules", [])
        
        for rule in lifecycle_rules:
            transitions = rule.get("Transitions", [])
            for transition in transitions:
                if transition.get("StorageClass") == "GLACIER_FLEXIBLE_RETRIEVAL":
                    # Verify transition after 30 days
                    assert transition.get("TransitionInDays") == 30, \
                        "Backups should transition to Glacier after 30 days"
                    found_glacier_transition = True
    
    assert found_glacier_transition, "Backups bucket should have Glacier transition lifecycle policy"


def test_backups_bucket_has_expiration_lifecycle_policy():
    """
    Test backups bucket has lifecycle policy to delete old backups after 90 days.
    
    Short retention (90 days) reduces storage costs.
    Acceptable for low-traffic project website.
    
    Validates: Requirement 5.9
    """
    stack = _create_test_stack()
    template = Template.from_stack(stack)
    
    # Find backups bucket (has lifecycle rules for expiration)
    resources = template.find_resources("AWS::S3::Bucket")
    
    # Look for bucket with expiration rule
    found_expiration = False
    for bucket_id, bucket in resources.items():
        properties = bucket.get("Properties", {})
        lifecycle_rules = properties.get("LifecycleConfiguration", {}).get("Rules", [])
        
        for rule in lifecycle_rules:
            if "ExpirationInDays" in rule:
                # Verify expiration after 90 days
                assert rule.get("ExpirationInDays") == 90, \
                    "Old backups should be deleted after 90 days"
                found_expiration = True
    
    assert found_expiration, "Backups bucket should have expiration lifecycle policy"


def test_buckets_have_noncurrent_version_expiration_lifecycle_policy():
    """
    Test S3 buckets have lifecycle policy to delete old versions after 90 days.
    
    Versioning provides protection, but old versions consume storage.
    Deleting old versions reduces storage costs.
    
    Validates: Requirement 9.10
    """
    stack = _create_test_stack()
    template = Template.from_stack(stack)
    
    # Verify all buckets have noncurrent version expiration
    resources = template.find_resources("AWS::S3::Bucket")
    
    for bucket_id, bucket in resources.items():
        properties = bucket.get("Properties", {})
        lifecycle_rules = properties.get("LifecycleConfiguration", {}).get("Rules", [])
        
        # Look for noncurrent version expiration rule
        found_noncurrent_expiration = False
        for rule in lifecycle_rules:
            if "NoncurrentVersionExpirationInDays" in rule:
                # Verify expiration after 90 days
                assert rule.get("NoncurrentVersionExpirationInDays") == 90, \
                    f"Bucket {bucket_id} should delete old versions after 90 days"
                found_noncurrent_expiration = True
        
        assert found_noncurrent_expiration, \
            f"Bucket {bucket_id} should have noncurrent version expiration lifecycle policy"


def test_static_assets_bucket_name_follows_naming_convention():
    """
    Test static assets bucket name follows naming convention.
    
    Format: showcore-static-assets-{account-id}
    
    Validates: IaC standards, Requirement 5.1
    """
    stack = _create_test_stack()
    template = Template.from_stack(stack)
    
    # Find static assets bucket
    resources = template.find_resources("AWS::S3::Bucket")
    
    # Look for bucket with "static-assets" in name
    found_static_assets_bucket = False
    for bucket_id, bucket in resources.items():
        properties = bucket.get("Properties", {})
        bucket_name = properties.get("BucketName", "")
        
        if "static-assets" in bucket_name:
            # Verify naming convention: showcore-static-assets-{account-id}
            assert bucket_name.startswith("showcore-static-assets-"), \
                f"Static assets bucket should follow naming convention, got {bucket_name}"
            
            # Verify account ID is included (12-digit number)
            parts = bucket_name.split("-")
            account_id = parts[-1] if len(parts) > 0 else ""
            assert len(account_id) == 12 and account_id.isdigit(), \
                f"Bucket name should include 12-digit account ID, got {bucket_name}"
            
            found_static_assets_bucket = True
    
    assert found_static_assets_bucket, "Static assets bucket should exist with correct naming"


def test_backups_bucket_name_follows_naming_convention():
    """
    Test backups bucket name follows naming convention.
    
    Format: showcore-backups-{account-id}
    
    Validates: IaC standards, Requirement 5.2
    """
    stack = _create_test_stack()
    template = Template.from_stack(stack)
    
    # Find backups bucket
    resources = template.find_resources("AWS::S3::Bucket")
    
    # Look for bucket with "backups" in name
    found_backups_bucket = False
    for bucket_id, bucket in resources.items():
        properties = bucket.get("Properties", {})
        bucket_name = properties.get("BucketName", "")
        
        if "backups" in bucket_name and "static-assets" not in bucket_name:
            # Verify naming convention: showcore-backups-{account-id}
            assert bucket_name.startswith("showcore-backups-"), \
                f"Backups bucket should follow naming convention, got {bucket_name}"
            
            # Verify account ID is included (12-digit number)
            parts = bucket_name.split("-")
            account_id = parts[-1] if len(parts) > 0 else ""
            assert len(account_id) == 12 and account_id.isdigit(), \
                f"Bucket name should include 12-digit account ID, got {bucket_name}"
            
            found_backups_bucket = True
    
    assert found_backups_bucket, "Backups bucket should exist with correct naming"


def test_buckets_enforce_ssl_tls():
    """
    Test S3 buckets enforce SSL/TLS for all requests.
    
    All requests must use HTTPS. HTTP requests will be denied.
    
    Validates: Requirement 5.3
    """
    stack = _create_test_stack()
    template = Template.from_stack(stack)
    
    # Verify all buckets have bucket policies that enforce SSL/TLS
    # This is enforced by the enforce_ssl=True parameter in CDK
    # The CDK will create a bucket policy that denies non-SSL requests
    
    # Find bucket policies
    resources = template.find_resources("AWS::S3::BucketPolicy")
    
    # Verify bucket policies exist (enforce_ssl creates policies)
    assert len(resources) > 0, "Buckets should have policies to enforce SSL/TLS"
    
    # Verify each policy denies non-SSL requests
    for policy_id, policy in resources.items():
        properties = policy.get("Properties", {})
        policy_document = properties.get("PolicyDocument", {})
        statements = policy_document.get("Statement", [])
        
        # Look for Deny statement with aws:SecureTransport condition
        found_ssl_enforcement = False
        for statement in statements:
            if statement.get("Effect") == "Deny":
                condition = statement.get("Condition", {})
                if "Bool" in condition and "aws:SecureTransport" in condition.get("Bool", {}):
                    # Verify it denies when SecureTransport is false
                    assert condition["Bool"]["aws:SecureTransport"] == "false", \
                        "Policy should deny when SecureTransport is false"
                    found_ssl_enforcement = True
        
        assert found_ssl_enforcement, \
            f"Bucket policy {policy_id} should enforce SSL/TLS"


def test_buckets_have_retention_policy():
    """
    Test S3 buckets are configured to retain on stack deletion.
    
    Prevents accidental data loss when stack is deleted.
    
    Validates: Operational requirement
    """
    stack = _create_test_stack()
    template = Template.from_stack(stack)
    
    # Verify all buckets have DeletionPolicy: Retain
    resources = template.find_resources("AWS::S3::Bucket")
    
    for bucket_id, bucket in resources.items():
        deletion_policy = bucket.get("DeletionPolicy", "")
        assert deletion_policy == "Retain", \
            f"Bucket {bucket_id} should have DeletionPolicy: Retain"


def test_static_assets_bucket_lifecycle_rules():
    """
    Test static assets bucket has correct lifecycle rules.
    
    Should only have noncurrent version expiration (no Glacier transition).
    
    Validates: Requirement 5.1
    """
    stack = _create_test_stack()
    template = Template.from_stack(stack)
    
    # Find static assets bucket
    resources = template.find_resources("AWS::S3::Bucket")
    
    for bucket_id, bucket in resources.items():
        properties = bucket.get("Properties", {})
        bucket_name = properties.get("BucketName", "")
        
        if "static-assets" in bucket_name:
            lifecycle_rules = properties.get("LifecycleConfiguration", {}).get("Rules", [])
            
            # Verify has noncurrent version expiration
            has_noncurrent_expiration = False
            has_glacier_transition = False
            has_current_expiration = False
            
            for rule in lifecycle_rules:
                if "NoncurrentVersionExpirationInDays" in rule:
                    has_noncurrent_expiration = True
                if "Transitions" in rule:
                    has_glacier_transition = True
                if "ExpirationInDays" in rule:
                    has_current_expiration = True
            
            assert has_noncurrent_expiration, \
                "Static assets bucket should have noncurrent version expiration"
            assert not has_glacier_transition, \
                "Static assets bucket should NOT have Glacier transition"
            assert not has_current_expiration, \
                "Static assets bucket should NOT have current version expiration"


def test_backups_bucket_lifecycle_rules():
    """
    Test backups bucket has correct lifecycle rules.
    
    Should have: Glacier transition, current expiration, noncurrent expiration.
    
    Validates: Requirements 5.2, 5.9, 9.10
    """
    stack = _create_test_stack()
    template = Template.from_stack(stack)
    
    # Find backups bucket
    resources = template.find_resources("AWS::S3::Bucket")
    
    for bucket_id, bucket in resources.items():
        properties = bucket.get("Properties", {})
        bucket_name = properties.get("BucketName", "")
        
        if "backups" in bucket_name and "static-assets" not in bucket_name:
            lifecycle_rules = properties.get("LifecycleConfiguration", {}).get("Rules", [])
            
            # Verify has all three lifecycle rules
            has_noncurrent_expiration = False
            has_glacier_transition = False
            has_current_expiration = False
            
            for rule in lifecycle_rules:
                if "NoncurrentVersionExpirationInDays" in rule:
                    has_noncurrent_expiration = True
                    assert rule.get("NoncurrentVersionExpirationInDays") == 90
                
                if "Transitions" in rule:
                    has_glacier_transition = True
                    transitions = rule.get("Transitions", [])
                    for transition in transitions:
                        if transition.get("StorageClass") == "GLACIER_FLEXIBLE_RETRIEVAL":
                            assert transition.get("TransitionInDays") == 30
                
                if "ExpirationInDays" in rule:
                    has_current_expiration = True
                    assert rule.get("ExpirationInDays") == 90
            
            assert has_noncurrent_expiration, \
                "Backups bucket should have noncurrent version expiration"
            assert has_glacier_transition, \
                "Backups bucket should have Glacier transition"
            assert has_current_expiration, \
                "Backups bucket should have current version expiration"


def test_storage_stack_resource_count():
    """
    Test storage stack creates expected number of resources.
    
    This is a sanity check to ensure the stack creates all expected resources.
    """
    stack = _create_test_stack()
    template = Template.from_stack(stack)
    
    # Verify resource counts
    template.resource_count_is("AWS::S3::Bucket", 2)  # Static assets + backups
    template.resource_count_is("AWS::S3::BucketPolicy", 2)  # SSL enforcement policies


def test_buckets_have_standard_tags():
    """
    Test S3 buckets have standard tags applied.
    
    Standard tags: Project, Phase, Environment, ManagedBy, CostCenter, Component
    
    Validates: IaC standards
    """
    stack = _create_test_stack()
    template = Template.from_stack(stack)
    
    # Verify all buckets have tags
    resources = template.find_resources("AWS::S3::Bucket")
    
    for bucket_id, bucket in resources.items():
        properties = bucket.get("Properties", {})
        tags = properties.get("Tags", [])
        
        # Convert tags list to dict for easier checking
        tags_dict = {tag["Key"]: tag["Value"] for tag in tags}
        
        # Verify standard tags exist
        assert "Project" in tags_dict, f"Bucket {bucket_id} should have Project tag"
        assert "Phase" in tags_dict, f"Bucket {bucket_id} should have Phase tag"
        assert "Environment" in tags_dict, f"Bucket {bucket_id} should have Environment tag"
        assert "ManagedBy" in tags_dict, f"Bucket {bucket_id} should have ManagedBy tag"
        assert "CostCenter" in tags_dict, f"Bucket {bucket_id} should have CostCenter tag"
        assert "Component" in tags_dict, f"Bucket {bucket_id} should have Component tag"
        
        # Verify tag values
        assert tags_dict["Project"] == "ShowCore"
        assert tags_dict["Phase"] == "Phase1"
        assert tags_dict["ManagedBy"] == "CDK"
        assert tags_dict["Component"] == "Storage"


def test_cost_optimization_sse_s3_not_kms():
    """
    Test cost optimization: S3 buckets use SSE-S3 (not KMS).
    
    SSE-S3 is FREE. KMS would cost $1/key/month + usage charges.
    
    Validates: Requirement 9.9
    """
    stack = _create_test_stack()
    template = Template.from_stack(stack)
    
    # Verify all buckets use SSE-S3 (not KMS)
    resources = template.find_resources("AWS::S3::Bucket")
    
    for bucket_id, bucket in resources.items():
        properties = bucket.get("Properties", {})
        encryption = properties.get("BucketEncryption", {})
        rules = encryption.get("ServerSideEncryptionConfiguration", [])
        
        for rule in rules:
            sse_algorithm = rule.get("ServerSideEncryptionByDefault", {}).get("SSEAlgorithm")
            assert sse_algorithm == "AES256", \
                f"Bucket {bucket_id} should use SSE-S3 for cost optimization"


def test_cost_optimization_lifecycle_policies():
    """
    Test cost optimization: Lifecycle policies reduce storage costs.
    
    - Glacier transition after 30 days (backups)
    - Delete old backups after 90 days
    - Delete old versions after 90 days
    
    Validates: Requirements 5.9, 9.10
    """
    stack = _create_test_stack()
    template = Template.from_stack(stack)
    
    # Verify lifecycle policies exist
    resources = template.find_resources("AWS::S3::Bucket")
    
    total_lifecycle_rules = 0
    for bucket_id, bucket in resources.items():
        properties = bucket.get("Properties", {})
        lifecycle_rules = properties.get("LifecycleConfiguration", {}).get("Rules", [])
        total_lifecycle_rules += len(lifecycle_rules)
    
    # Static assets: 1 rule (noncurrent expiration)
    # Backups: 3 rules (Glacier transition, current expiration, noncurrent expiration)
    # Total: 4 rules
    assert total_lifecycle_rules == 4, \
        f"Expected 4 lifecycle rules total, got {total_lifecycle_rules}"


def test_security_encryption_at_rest():
    """
    Test security: All S3 buckets have encryption at rest enabled.
    
    Validates: Requirement 5.3
    """
    stack = _create_test_stack()
    template = Template.from_stack(stack)
    
    # Verify all buckets have encryption
    resources = template.find_resources("AWS::S3::Bucket")
    
    for bucket_id, bucket in resources.items():
        properties = bucket.get("Properties", {})
        encryption = properties.get("BucketEncryption", {})
        rules = encryption.get("ServerSideEncryptionConfiguration", [])
        
        assert len(rules) > 0, \
            f"Bucket {bucket_id} should have encryption at rest enabled"


def test_security_block_public_access():
    """
    Test security: All S3 buckets block public access.
    
    Validates: Requirements 5.4, 5.2
    """
    stack = _create_test_stack()
    template = Template.from_stack(stack)
    
    # Verify all buckets block public access
    resources = template.find_resources("AWS::S3::Bucket")
    
    for bucket_id, bucket in resources.items():
        properties = bucket.get("Properties", {})
        public_access = properties.get("PublicAccessBlockConfiguration", {})
        
        # All four settings should be true
        assert public_access.get("BlockPublicAcls") == True
        assert public_access.get("BlockPublicPolicy") == True
        assert public_access.get("IgnorePublicAcls") == True
        assert public_access.get("RestrictPublicBuckets") == True


def test_security_enforce_ssl_tls():
    """
    Test security: All S3 buckets enforce SSL/TLS.
    
    Validates: Requirement 5.3
    """
    stack = _create_test_stack()
    template = Template.from_stack(stack)
    
    # Verify bucket policies enforce SSL/TLS
    resources = template.find_resources("AWS::S3::BucketPolicy")
    
    assert len(resources) > 0, "Buckets should have policies to enforce SSL/TLS"


def test_data_protection_versioning():
    """
    Test data protection: All S3 buckets have versioning enabled.
    
    Validates: Requirements 5.1, 5.2
    """
    stack = _create_test_stack()
    template = Template.from_stack(stack)
    
    # Verify all buckets have versioning
    resources = template.find_resources("AWS::S3::Bucket")
    
    for bucket_id, bucket in resources.items():
        properties = bucket.get("Properties", {})
        versioning = properties.get("VersioningConfiguration", {})
        assert versioning.get("Status") == "Enabled", \
            f"Bucket {bucket_id} should have versioning enabled for data protection"
