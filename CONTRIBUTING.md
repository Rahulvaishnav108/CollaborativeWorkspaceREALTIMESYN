# Contributing to SyncSpace

Thank you for your interest in contributing to SyncSpace! This document provides guidelines and instructions for contributing to this real-time collaborative workspace project.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Process](#development-process)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)
- [Issue Reporting](#issue-reporting)

## 🤝 Code of Conduct

This project follows a standard code of conduct. By participating, you are expected to uphold this code:

- Be respectful and inclusive
- Focus on constructive feedback
- Help others learn and grow
- Maintain a professional environment

## 🚀 Getting Started

### Prerequisites

- Node.js LTS (18.x or later)
- npm or yarn
- Docker and Docker Compose
- Git

### Setup Development Environment

1. Fork and clone the repository:
```bash
git clone https://github.com/Rahulvaishnav108/CollaborativeWorkspaceREALTIMESYN.git
cd CollaborativeWorkspaceREALTIMESYN
```

2. Run the setup script:
```bash
# Linux/macOS
chmod +x setup.sh
./setup.sh

# Windows
.\setup.ps1
```

3. Start the development environment:
```bash
# Start infrastructure
docker compose -f docker-compose.dev.yml up -d

# Install dependencies
npm install

# Setup database
npm run db:migrate

# Start development servers
npm run dev
```

## 🔄 Development Process

### Branch Naming Convention

- `feature/feature-name` - New features
- `bugfix/issue-description` - Bug fixes
- `hotfix/critical-issue` - Critical fixes
- `docs/documentation-update` - Documentation changes
- `refactor/component-name` - Code refactoring

### Project Structure

```
├── apps/
│   ├── web/          # Next.js frontend
│   └── api/          # NestJS backend
├── packages/
│   ├── shared-types/ # Shared TypeScript types
│   └── validation/   # Shared validation schemas
├── prisma/           # Database schema and migrations
├── infrastructure/   # Docker and deployment configs
└── docs/            # Documentation
```

### Development Guidelines

1. **Code Style**
   - Use TypeScript for type safety
   - Follow ESLint and Prettier configurations
   - Write meaningful variable and function names
   - Add comments for complex logic

2. **Testing**
   - Write unit tests for new features
   - Include integration tests for API endpoints
   - Add e2e tests for critical user flows
   - Maintain test coverage above 80%

3. **Performance**
   - Optimize database queries
   - Implement proper caching strategies
   - Use lazy loading where appropriate
   - Monitor bundle sizes

4. **Security**
   - Validate all inputs
   - Implement proper authentication
   - Use environment variables for secrets
   - Follow OWASP security guidelines

## 📝 Commit Guidelines

We follow conventional commits for clear and organized commit history:

### Commit Format
```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

### Examples
```bash
feat(auth): add JWT token refresh functionality

- Implement token refresh endpoint
- Add automatic token renewal on frontend
- Update authentication guards

Closes #123
```

```bash
fix(chat): resolve message ordering issue

- Fix race condition in message timestamps
- Ensure proper message order in channels
- Add timestamp validation

Fixes #456
```

## 🔍 Pull Request Process

1. **Before Submitting**
   - Ensure your branch is up to date with main
   - Run all tests and ensure they pass
   - Run linting and fix any issues
   - Update documentation if needed

2. **PR Title and Description**
   - Use a clear, descriptive title
   - Explain what changes were made and why
   - Reference related issues
   - Include screenshots for UI changes

3. **PR Checklist**
   - [ ] Code follows project style guidelines
   - [ ] Self-review completed
   - [ ] Tests added for new features
   - [ ] Documentation updated
   - [ ] No breaking changes (or clearly documented)

4. **Review Process**
   - PRs require at least one review
   - Address review feedback promptly
   - Keep PRs focused and reasonably sized
   - Maintain a clean commit history

## 🐛 Issue Reporting

### Before Creating an Issue

1. Search existing issues to avoid duplicates
2. Check if it's already fixed in the latest version
3. Gather relevant information

### Issue Templates

**Bug Report:**
```markdown
**Describe the bug**
A clear description of what the bug is.

**To Reproduce**
Steps to reproduce the behavior:
1. Go to '...'
2. Click on '....'
3. Scroll down to '....'
4. See error

**Expected behavior**
What you expected to happen.

**Screenshots**
If applicable, add screenshots.

**Environment:**
- OS: [e.g. Windows 11]
- Browser: [e.g. Chrome 91]
- Version: [e.g. 1.0.0]
```

**Feature Request:**
```markdown
**Is your feature request related to a problem?**
A clear description of what the problem is.

**Describe the solution you'd like**
A clear description of what you want to happen.

**Describe alternatives you've considered**
Alternative solutions or features you've considered.

**Additional context**
Any other context or screenshots about the feature request.
```

## 🏗️ Architecture Guidelines

### Backend (NestJS)
- Use modular architecture
- Implement proper error handling
- Use DTOs for validation
- Follow SOLID principles
- Implement proper logging

### Frontend (Next.js)
- Use server and client components appropriately
- Implement proper state management
- Use TypeScript for type safety
- Follow React best practices
- Optimize for performance

### Database (PostgreSQL + Prisma)
- Design normalized schemas
- Use migrations for changes
- Implement proper indexing
- Follow naming conventions
- Document schema changes

## 🚀 Deployment

### Environment Setup
- Development: Local Docker setup
- Staging: Preview deployments
- Production: Containerized deployment

### Release Process
1. Create release branch from main
2. Update version numbers
3. Update CHANGELOG.md
4. Create release PR
5. After merge, tag the release
6. Deploy to production

## 📚 Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [NestJS Documentation](https://docs.nestjs.com)
- [Prisma Documentation](https://www.prisma.io/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs)

## 🙋‍♂️ Getting Help

- Check existing [Issues](https://github.com/Rahulvaishnav108/CollaborativeWorkspaceREALTIMESYN/issues)
- Start a [Discussion](https://github.com/Rahulvaishnav108/CollaborativeWorkspaceREALTIMESYN/discussions)
- Read the [README.md](./README.md)

## 📄 License

By contributing to SyncSpace, you agree that your contributions will be licensed under the project's MIT License.

---

Thank you for contributing to SyncSpace! Your efforts help make this collaborative workspace better for everyone. 🙌