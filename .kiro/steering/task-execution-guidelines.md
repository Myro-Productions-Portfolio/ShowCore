# Task Execution Guidelines - ShowCore

This document defines guidelines for executing tasks from the ShowCore AWS Migration Phase 1 implementation plan. These guidelines ensure efficient task execution and prevent timeout issues.

## Overview

Tasks in the implementation plan are categorized by type:
- **Local Code**: Writing CDK code locally (no AWS deployment)
- **Local Tests**: Writing unit tests locally (no AWS deployment)
- **Live AWS Test**: Testing actual AWS resources after deployment
- **Manual AWS Console**: Manual configuration in AWS Console
- **Documentation**: Creating documentation files

## Task Execution Rules by Type

### Local Code Tasks (e.g., "Write CDK code to define...")

**What to do:**
1. Write the CDK code in the appropriate stack file
2. Add comprehensive docstrings and comments
3. Verify code is written correctly by reading it back
4. Mark task as completed

**What NOT to do:**
- ❌ DO NOT run `cdk synth` to validate the code
- ❌ DO NOT run `cdk diff` to preview changes
- ❌ DO NOT run any CDK commands that produce large outputs
- ❌ DO NOT run validation commands that may timeout

**Rationale:**
- CDK synth commands can be slow and produce large outputs
- These commands can timeout and stall execution
- User will handle validation after code is written
- Focus on writing correct code, not validating it runs

**Example:**
```
Task: "Write CDK code to define VPC with multi-AZ subnets"

✅ Correct approach:
1. Write the VPC code in network_stack.py
2. Read the file back to verify it's correct
3. Mark task complete

❌ Wrong approach:
1. Write the VPC code
2. Run `cdk synth ShowCoreNetworkStack` (TIMEOUT!)
3. Run `cdk diff` (TIMEOUT!)
4. Mark task complete
```

### Local Tests Tasks (e.g., "Write unit tests for...")

**What to do:**
1. Write the test code in the appropriate test file
2. Add clear test names and docstrings
3. Verify test code is written correctly by reading it back
4. Mark task as completed

**What NOT to do:**
- ❌ DO NOT run `pytest` to execute the tests
- ❌ DO NOT run test commands that may timeout
- ❌ DO NOT try to validate tests pass

**Rationale:**
- Test execution can be slow, especially for integration tests
- User will run tests after code is written
- Focus on writing correct tests, not running them

**Example:**
```
Task: "Write unit tests for network infrastructure CDK code"

✅ Correct approach:
1. Write tests in tests/unit/test_network_stack.py
2. Read the file back to verify tests are correct
3. Mark task complete

❌ Wrong approach:
1. Write tests
2. Run `pytest tests/unit/test_network_stack.py -v` (TIMEOUT!)
3. Mark task complete
```

### Live AWS Test Tasks (e.g., "Test RDS connectivity from private subnet")

**What to do:**
1. Document the test procedure in the task notes
2. Provide AWS CLI commands or console steps
3. Explain expected results
4. Mark task as completed after user confirms test passed

**What NOT to do:**
- ❌ DO NOT attempt to run AWS CLI commands (no AWS credentials in agent)
- ❌ DO NOT try to deploy test resources
- ❌ DO NOT run commands that interact with AWS

**Rationale:**
- Agent does not have AWS credentials
- These tests run against actual AWS resources after deployment
- User will execute these tests manually

### Documentation Tasks (e.g., "Create runbook for...")

**What to do:**
1. Create the documentation file with comprehensive content
2. Include all required sections and examples
3. Verify documentation is complete by reading it back
4. Mark task as completed

**What NOT to do:**
- ❌ DO NOT run validation commands on documentation
- ❌ DO NOT try to test procedures in documentation

**Rationale:**
- Documentation tasks are straightforward
- No validation needed beyond reading the file

## General Guidelines

### When to Run Commands

**Safe commands (OK to run - complete in < 2 seconds):**
- `ls`, `cat`, `grep`, `find` - File system operations
- `git status`, `git log --oneline` - Git operations (read-only)
- `echo`, `pwd`, `whoami` - Simple shell commands
- Quick file checks and validations
- Any command that completes in under 2 seconds

**Unsafe commands (DO NOT run - these WILL timeout):**
- `cdk synth` - Slow, large output, WILL timeout
- `cdk diff` - Slow, large output, WILL timeout
- `cdk deploy` - Deploys to AWS, very slow, WILL timeout
- `pytest` - Can be slow, especially integration tests, WILL timeout
- `npm test`, `yarn test` - Can be slow, WILL timeout
- Python scripts that update files (e.g., `python create_pr.py`) - WILL timeout
- GitHub CLI commands with large operations (e.g., `gh pr create` with long bodies) - May timeout
- Any command that produces large output (> 100 lines)
- Any command that takes > 2 seconds to complete

**Special note on GitHub operations:**
- Small `gh` commands are OK (e.g., `gh auth status`)
- Large `gh` commands that create PRs or process lots of data - avoid or keep minimal

### Verification Approach

**For Local Code tasks:**
1. Write the code
2. Read the file back to verify:
   - Code is syntactically correct (proper indentation, brackets, etc.)
   - All required components are present
   - Docstrings and comments are comprehensive
   - Code follows iac-standards.md conventions
3. Mark task complete

**For Local Tests tasks:**
1. Write the tests
2. Read the file back to verify:
   - Test names are descriptive
   - Test logic is correct
   - All required test cases are covered
   - Tests follow pytest conventions
3. Mark task complete

### Task Completion Criteria

A task is complete when:
- ✅ All code/tests/documentation is written
- ✅ File has been read back to verify correctness
- ✅ Code follows project standards (iac-standards.md)
- ✅ Task status is marked as "completed"

A task is NOT complete when:
- ❌ Code is written but not verified by reading back
- ❌ Validation commands are run but timeout
- ❌ Tests are written but not executed (execution is user's job)

## Timeout Prevention

### Why Timeouts Happen

1. **Large output**: Commands that produce > 100 lines of output
2. **Slow execution**: Commands that take > 2 seconds (especially > 5 seconds)
3. **Network operations**: Commands that make network requests (GitHub API, AWS API, etc.)
4. **Complex operations**: CDK synth, pytest, npm test, Python scripts, etc.
5. **File processing**: Python scripts that read/write many files or process large data

### How to Prevent Timeouts

1. **Avoid running validation commands** during task execution
2. **Focus on writing correct code** rather than validating it runs
3. **Let user handle validation** after code is written
4. **Use file reading** to verify code correctness instead of running it
5. **Keep terminal commands simple** and fast

### What to Do If You Need Validation

If you genuinely need to validate something (rare):
1. **Ask the user** to run the command
2. **Explain why** you need the validation
3. **Provide the exact command** for user to run
4. **Wait for user response** before proceeding

**Example:**
```
"I've written the VPC code in network_stack.py. To verify it synthesizes 
correctly, could you please run:

cd infrastructure && source .venv/bin/activate && cdk synth ShowCoreNetworkStack

Let me know if there are any errors and I'll fix them."
```

## Task Workflow Summary

### Standard Workflow for Local Code/Tests Tasks

```
1. Read task requirements
2. Write code/tests in appropriate file
3. Read file back to verify correctness
4. Mark task as completed
5. DONE - user will handle validation
```

### What NOT to Do

```
1. Read task requirements
2. Write code/tests
3. Run `cdk synth` (TIMEOUT!) ❌
4. Run `pytest` (TIMEOUT!) ❌
5. Try to fix errors (can't see them due to timeout) ❌
6. Get stuck in timeout loop ❌
```

## Examples

### Example 1: Local Code Task

**Task:** "Write CDK code to define RDS PostgreSQL instance"

**Correct execution:**
```
1. Write RDS code in database_stack.py
2. Read database_stack.py to verify:
   - RDS instance is defined with correct properties
   - Security group is attached
   - Encryption is enabled
   - Backup is configured
3. Mark task complete
4. DONE
```

**Incorrect execution:**
```
1. Write RDS code in database_stack.py
2. Run `cdk synth ShowCoreDatabaseStack` (TIMEOUT!) ❌
3. Can't see output due to timeout ❌
4. Try again with different command (TIMEOUT!) ❌
5. Get stuck ❌
```

### Example 2: Local Tests Task

**Task:** "Write unit tests for RDS CDK code"

**Correct execution:**
```
1. Write tests in tests/unit/test_database_stack.py
2. Read test file to verify:
   - All test cases are present
   - Test logic is correct
   - Test names are descriptive
3. Mark task complete
4. DONE
```

**Incorrect execution:**
```
1. Write tests in tests/unit/test_database_stack.py
2. Run `pytest tests/unit/test_database_stack.py -v` (TIMEOUT!) ❌
3. Can't see test results due to timeout ❌
4. Try to fix tests without seeing errors ❌
5. Get stuck ❌
```

## Key Takeaways

1. **Write code, don't validate it** - Focus on writing correct code, let user validate
2. **Read files to verify** - Use file reading instead of running commands
3. **Avoid large commands** - Don't run cdk synth, pytest, Python scripts, or other slow commands
4. **Keep commands under 2 seconds** - Quick file operations are fine, anything longer is risky
5. **Trust your code** - If code looks correct when you read it back, it probably is
6. **Let user handle validation** - User will run validation commands after you're done
7. **Especially avoid**: CDK commands, test runners, Python scripts, and GitHub operations with large data

---

**Last Updated**: February 4, 2026
**Maintained By**: ShowCore Project
**Review Frequency**: After any timeout issues

