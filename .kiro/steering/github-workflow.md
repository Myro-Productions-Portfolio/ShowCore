---
inclusion: always
---

# GitHub Workflow Standards - ShowCore

This document defines the standard workflow for GitHub operations in the ShowCore project. These guidelines ensure consistent, reliable interactions with GitHub while avoiding common pitfalls.

## Overview

ShowCore uses GitHub for version control and collaboration. All GitHub operations should use the native GitHub CLI (`gh`) for reliability and speed.

**Key Principles:**
- Use GitHub CLI (`gh`) commands directly, not Python scripts
- Always verify correct GitHub account authentication before operations
- Use correct base branch (`master`, not `main`)
- Keep commands simple and fast to avoid timeouts

## GitHub CLI Authentication

### Verify Current Authentication

Before any GitHub operations, verify you're authenticated as the correct account:

```bash
# Check current authentication status
gh auth status

# Should show:
# ✓ Logged in to github.com account Myro-Productions-Portfolio
```

### Switch Accounts if Needed

If authenticated as wrong account (e.g., `husky2466-codo`):

```bash
# Logout of current account
gh auth logout

# Login with correct account
gh auth login
# Select: GitHub.com
# Select: HTTPS
# Select: Yes (authenticate Git)
# Select: Login with a web browser
# Follow browser authentication flow
```

### Verify Repository Permissions

Before creating PRs or merging, verify you have write access:

```bash
# Check permissions for ShowCore repository
gh repo view Myro-Productions-Portfolio/ShowCore --json nameWithOwner,viewerPermission

# Should show:
# {
#   "nameWithOwner": "Myro-Productions-Portfolio/ShowCore",
#   "viewerPermission": "ADMIN"
# }
```

## Branch Management

### Default Branch

ShowCore uses `master` as the default branch, **NOT** `main`.

**CRITICAL**: Always use `--base master` when creating pull requests.

```bash
# ✅ CORRECT
gh pr create --base master --title "..." --body "..."

# ❌ WRONG - will fail
gh pr create --base main --title "..." --body "..."
```

### Branch Naming Convention

Use descriptive branch names with prefixes:

```bash
# Feature branches
feat/feature-name
feat/adr-002-iac-tool-and-security

# Bug fixes
fix/bug-description
fix/security-hook-timeout

# Documentation
docs/update-readme
docs/add-adr-003

# Chores
chore/update-dependencies
chore/cleanup-old-files
```

### Creating Feature Branches

```bash
# Create and switch to new branch
git checkout -b feat/feature-name

# Make changes, commit
git add .
git commit -m "feat: descriptive commit message"

# Push to remote
git push origin feat/feature-name
```

## Pull Request Workflow

### Creating Pull Requests

**ALWAYS use GitHub CLI directly, NOT Python scripts.**

```bash
# Create PR with title and body
gh pr create \
  --base master \
  --title "feat: Brief description" \
  --body "## Overview

Detailed description of changes.

## Key Changes
- Change 1
- Change 2

## Testing
- ✅ Test 1
- ✅ Test 2"
```

**Why this works:**
- Fast execution (< 1 second)
- No timeout issues
- Simple and reliable
- Native GitHub integration

**Why NOT to use Python scripts:**
- Slow execution (imports, API calls)
- Timeout issues (> 60 seconds)
- Complex error handling
- Terminal disconnection problems

### Pull Request Title Format

Follow Conventional Commits format:

```
<type>: <description>

Types:
- feat: New feature
- fix: Bug fix
- docs: Documentation changes
- chore: Maintenance tasks
- refactor: Code refactoring
- test: Adding or updating tests
```

**Examples:**
```
feat: Add ADR-002 (IaC Tool Selection) and ADR-003 (Public Repo Security)
fix: Correct security hook timeout issue
docs: Update README with security notice
chore: Update .gitignore with sensitive file exclusions
```

### Pull Request Body Structure

Use this template for comprehensive PR descriptions:

```markdown
## Overview
Brief summary of what this PR does and why.

## Key Changes
- Change 1 with brief explanation
- Change 2 with brief explanation
- Change 3 with brief explanation

## Testing
- ✅ Test 1 description
- ✅ Test 2 description
- ✅ Test 3 description

## Impact
- Security improvements
- Performance improvements
- Breaking changes (if any)

Completes task X.X from Phase 1 implementation plan.
```

### Reviewing Pull Requests

```bash
# List open PRs
gh pr list

# View specific PR
gh pr view 2

# Check PR status
gh pr status

# Review PR diff
gh pr diff 2
```

### Merging Pull Requests

**Use squash merge to keep history clean:**

```bash
# Merge PR with squash (combines all commits into one)
gh pr merge 2 --squash --delete-branch

# This will:
# 1. Squash all commits into one
# 2. Merge into master
# 3. Delete the feature branch (local and remote)
# 4. Switch back to master
```

**Why squash merge:**
- Keeps master history clean
- One commit per feature/fix
- Easier to revert if needed
- Better for portfolio presentation

## Commit Message Standards

### Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Examples

```bash
# Feature with scope
git commit -m "feat(infrastructure): add VPC Endpoints for cost optimization

- Add S3 Gateway Endpoint (FREE)
- Add CloudWatch Interface Endpoints (~$7/month each)
- Remove NAT Gateway to save ~$32/month

Validates: Requirements 2.5, 2.6, 2.7"

# Bug fix
git commit -m "fix(security): resolve hook timeout issue

Use GitHub CLI directly instead of Python scripts to avoid 60-second timeout.

Closes #123"

# Documentation
git commit -m "docs(adr): add ADR-002 for IaC tool selection

Document decision between Terraform and AWS CDK.
Recommendation: AWS CDK with Python.

Validates: Requirements 10.1"
```

## Common Operations

### Check Current Status

```bash
# Check git status
git status

# Check current branch
git branch --show-current

# Check remote configuration
git remote -v

# Check GitHub authentication
gh auth status
```

### Sync with Remote

```bash
# Fetch latest changes
git fetch origin

# Pull latest master
git checkout master
git pull origin master

# Update feature branch with latest master
git checkout feat/feature-name
git merge master
```

### Undo Mistakes

```bash
# Undo last commit (keep changes)
git reset --soft HEAD~1

# Undo last commit (discard changes)
git reset --hard HEAD~1

# Undo changes to specific file
git checkout -- path/to/file
```

## Troubleshooting

### Issue: "No commits between main and feature-branch"

**Problem**: Using wrong base branch name.

**Solution**: ShowCore uses `master`, not `main`.

```bash
# ✅ CORRECT
gh pr create --base master --title "..." --body "..."
```

### Issue: "viewerPermission: READ"

**Problem**: Authenticated as wrong GitHub account.

**Solution**: Switch to Myro-Productions-Portfolio account.

```bash
gh auth logout
gh auth login
# Follow authentication flow
```

### Issue: Terminal disconnection during PR creation

**Problem**: Using Python scripts that take too long.

**Solution**: Use GitHub CLI commands directly.

```bash
# ✅ CORRECT - Fast and reliable
gh pr create --base master --title "..." --body "..."

# ❌ WRONG - Slow and times out
python create_pr.py
```

### Issue: "Head sha can't be blank"

**Problem**: No commits on the feature branch.

**Solution**: Make sure changes are committed and pushed.

```bash
git add .
git commit -m "feat: description"
git push origin feat/feature-name
```

## Best Practices

### Before Creating PR

1. **Verify authentication**: `gh auth status`
2. **Verify permissions**: `gh repo view Myro-Productions-Portfolio/ShowCore --json viewerPermission`
3. **Review changes**: `git diff`
4. **Run tests**: Ensure all tests pass
5. **Check for sensitive data**: Review with security hook

### During PR Creation

1. **Use descriptive title**: Follow Conventional Commits format
2. **Write comprehensive body**: Use template structure
3. **Reference tasks**: Link to task numbers from implementation plan
4. **Validate requirements**: Reference requirement numbers

### After PR Merge

1. **Verify merge**: Check GitHub to confirm PR is merged
2. **Update local master**: `git checkout master && git pull origin master`
3. **Delete local branch**: `git branch -d feat/feature-name` (if not auto-deleted)
4. **Update task status**: Mark task as completed in tasks.md

## GitHub CLI Quick Reference

```bash
# Authentication
gh auth status                    # Check authentication
gh auth login                     # Login to GitHub
gh auth logout                    # Logout from GitHub

# Repository
gh repo view OWNER/REPO           # View repository details
gh repo view --json permissions   # Check permissions

# Pull Requests
gh pr list                        # List open PRs
gh pr create                      # Create new PR
gh pr view NUMBER                 # View specific PR
gh pr merge NUMBER --squash       # Merge PR with squash
gh pr status                      # Check PR status
gh pr diff NUMBER                 # View PR diff

# Issues
gh issue list                     # List open issues
gh issue create                   # Create new issue
gh issue view NUMBER              # View specific issue

# Workflow
gh workflow list                  # List workflows
gh workflow view NAME             # View workflow details
gh run list                       # List workflow runs
```

## Security Considerations

### Before Pushing

Always review changes for sensitive data:

```bash
# Review all changes
git diff

# Search for account IDs (12-digit numbers)
git diff | grep -E '[0-9]{12}'

# Search for email addresses
git diff | grep -E '@'

# Search for AWS keys
git diff | grep -E 'AKIA'
```

### Sensitive Data Hook

The `sensitive-data-check` hook will automatically scan files, but manual review is still required.

See `SECURITY-SANITIZATION-GUIDE.md` for complete details.

## Integration with Kiro Workflow

### Task Completion Workflow

When completing a task from tasks.md:

1. **Update task status**: Mark as "in_progress"
2. **Create feature branch**: `git checkout -b feat/task-name`
3. **Implement changes**: Write code, documentation, tests
4. **Commit changes**: Use Conventional Commits format
5. **Push to remote**: `git push origin feat/task-name`
6. **Create PR**: `gh pr create --base master`
7. **Merge PR**: `gh pr merge NUMBER --squash --delete-branch`
8. **Update task status**: Mark as "completed"

### ADR Workflow

When creating ADRs:

1. **Create ADR file**: `.kiro/specs/SPEC-NAME/adr-NNN-title.md`
2. **Follow ADR format**: Status, Context, Decision, Alternatives, Rationale, Consequences
3. **Commit with descriptive message**: `git commit -m "docs(adr): add ADR-NNN for decision"`
4. **Create PR**: Include ADR in PR description
5. **Reference in design doc**: Link ADR from design.md

## Summary

**Key Takeaways:**
- ✅ Use GitHub CLI (`gh`) commands directly
- ✅ Always verify authentication before operations
- ✅ Use `--base master` for pull requests
- ✅ Use squash merge to keep history clean
- ✅ Follow Conventional Commits format
- ✅ Review for sensitive data before pushing
- ❌ Don't use Python scripts for GitHub operations
- ❌ Don't use `main` as base branch (use `master`)
- ❌ Don't skip authentication verification

---

**Last Updated**: February 3, 2026
**Maintained By**: ShowCore Project
**Review Frequency**: After any GitHub workflow issues
