# Git Setup Guide

## ✅ Git Repository Initialized

Your Finance Tracker application has been successfully added to git!

## 📊 Repository Status

- ✅ Git repository initialized
- ✅ All files staged and committed
- ✅ .gitignore configured to exclude:
  - Virtual environments (venv/)
  - Node modules (node_modules/)
  - Database files (*.db)
  - Build artifacts
  - Log files
  - Temporary files

## 🔍 View Repository Status

```bash
git status
```

## 📝 View Commit History

```bash
git log
```

Or with a compact view:
```bash
git log --oneline
```

## 🚀 Next Steps: Connect to Remote Repository

### Option 1: GitHub

1. **Create a new repository on GitHub:**
   - Go to https://github.com/new
   - Name it: `finance-tracker`
   - Don't initialize with README (we already have one)
   - Click "Create repository"

2. **Connect your local repository:**
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/finance-tracker.git
   git branch -M main
   git push -u origin main
   ```

### Option 2: GitLab

1. **Create a new project on GitLab**
2. **Connect your local repository:**
   ```bash
   git remote add origin https://gitlab.com/YOUR_USERNAME/finance-tracker.git
   git branch -M main
   git push -u origin main
   ```

### Option 3: Bitbucket

1. **Create a new repository on Bitbucket**
2. **Connect your local repository:**
   ```bash
   git remote add origin https://bitbucket.org/YOUR_USERNAME/finance-tracker.git
   git branch -M main
   git push -u origin main
   ```

## 📋 Common Git Commands

### View Changes
```bash
git status              # Show working directory status
git diff                # Show unstaged changes
git diff --staged       # Show staged changes
git log                 # Show commit history
```

### Make Changes
```bash
git add .               # Stage all changes
git add <file>          # Stage specific file
git commit -m "message" # Commit staged changes
git push                # Push to remote repository
```

### Update from Remote
```bash
git pull                # Pull latest changes
git fetch               # Fetch latest changes without merging
```

### Branch Management
```bash
git branch              # List branches
git branch <name>       # Create new branch
git checkout <name>     # Switch to branch
git merge <branch>      # Merge branch into current
```

### Undo Changes
```bash
git restore <file>      # Discard changes to file
git restore --staged <file>  # Unstage file
git reset HEAD~1        # Undo last commit (keep changes)
git reset --hard HEAD~1 # Undo last commit (discard changes)
```

## 🔒 Important: What's Excluded from Git

The following are **NOT** tracked in git (for security and size):

- ✅ `venv/` - Python virtual environment
- ✅ `node_modules/` - Node.js dependencies
- ✅ `*.db` - Database files (contains user data)
- ✅ `backend/instance/` - Database instance folder
- ✅ `.env` - Environment variables (if you add them)
- ✅ `build/` - Build artifacts
- ✅ `*.log` - Log files

## 📝 Adding New Files

When you add new files, make sure to:

1. **Stage them:**
   ```bash
   git add <file>
   ```

2. **Commit them:**
   ```bash
   git commit -m "Description of changes"
   ```

3. **Push to remote:**
   ```bash
   git push
   ```

## 🛡️ Security Notes

1. **Never commit:**
   - Database files (contains user passwords)
   - Environment variables with secrets
   - API keys or tokens
   - Personal data

2. **Always review before committing:**
   ```bash
   git status
   git diff
   ```

3. **Use .gitignore:**
   - Already configured to exclude sensitive files
   - Check `.gitignore` before adding files

## 🔄 Workflow Example

```bash
# Make changes to files
# ...

# Check what changed
git status

# Stage changes
git add .

# Commit changes
git commit -m "Add new feature: export transactions"

# Push to remote
git push
```

## 📚 Resources

- [Git Documentation](https://git-scm.com/doc)
- [GitHub Guides](https://guides.github.com/)
- [Git Cheat Sheet](https://education.github.com/git-cheat-sheet-education.pdf)

## 🎉 You're All Set!

Your Finance Tracker application is now under version control. You can:
- Track changes over time
- Collaborate with others
- Backup your code
- Roll back to previous versions if needed

Happy coding! 🚀

