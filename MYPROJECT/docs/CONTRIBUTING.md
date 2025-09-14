# Contributing to Finance Tracker

Thank you for your interest in contributing to Finance Tracker! This document provides guidelines and information for contributors.

## Table of Contents
- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Contributing Process](#contributing-process)
- [Coding Standards](#coding-standards)
- [Testing Guidelines](#testing-guidelines)
- [Commit Message Guidelines](#commit-message-guidelines)
- [Pull Request Process](#pull-request-process)
- [Issue Reporting](#issue-reporting)
- [Feature Requests](#feature-requests)
- [Documentation](#documentation)
- [Community](#community)

---

## Code of Conduct

### Our Pledge

We are committed to making participation in our project a harassment-free experience for everyone, regardless of age, body size, disability, ethnicity, gender identity and expression, level of experience, nationality, personal appearance, race, religion, or sexual identity and orientation.

### Our Standards

**Positive behaviors include:**
- Using welcoming and inclusive language
- Being respectful of differing viewpoints and experiences
- Gracefully accepting constructive criticism
- Focusing on what is best for the community
- Showing empathy towards other community members

**Unacceptable behaviors include:**
- The use of sexualized language or imagery
- Trolling, insulting/derogatory comments, and personal attacks
- Public or private harassment
- Publishing others' private information without explicit permission
- Other conduct which could reasonably be considered inappropriate

### Enforcement

Project maintainers are responsible for clarifying standards and may take appropriate corrective action in response to unacceptable behavior.

---

## Getting Started

### Prerequisites

Before contributing, ensure you have:
- Node.js (v16.0.0 or higher)
- npm (v8.0.0 or higher)
- Git
- A code editor (VS Code recommended)
- MongoDB (local installation or Atlas account)

### First-Time Contributors

1. **Fork the repository** on GitHub
2. **Star the repository** to show support
3. **Read through the codebase** to understand the structure
4. **Look for "good first issue" labels** for beginner-friendly tasks
5. **Join our community** (Discord/Slack) for discussions

---

## Development Setup

### 1. Clone Your Fork

```bash
git clone https://github.com/YOUR-USERNAME/finance-tracker.git
cd finance-tracker
git remote add upstream https://github.com/ORIGINAL-OWNER/finance-tracker.git
```

### 2. Install Dependencies

```bash
npm run install-deps
```

### 3. Environment Configuration

```bash
cp .env.example .env
# Edit .env with your configuration
```

### 4. Start Development Servers

```bash
npm run dev
```

### 5. Verify Setup

- Frontend: http://localhost:3000
- Backend: http://localhost:5000
- API Health: http://localhost:5000/health

---

## Contributing Process

### Workflow Overview

1. **Choose or create an issue** to work on
2. **Create a feature branch** from `main`
3. **Make your changes** following our coding standards
4. **Test thoroughly** - add tests for new features
5. **Update documentation** if needed
6. **Submit a pull request** with clear description
7. **Address review feedback** promptly
8. **Celebrate** when merged! 🎉

### Branch Naming Convention

```bash
# Feature branches
feature/user-authentication
feature/transaction-export
feature/dashboard-charts

# Bug fixes
fix/login-validation-error
fix/transaction-date-format

# Documentation
docs/api-documentation
docs/deployment-guide

# Refactoring
refactor/auth-service
refactor/database-queries
```

---

## Coding Standards

### JavaScript/Node.js Standards

**General Guidelines:**
- Use ES6+ features (const/let, arrow functions, destructuring)
- Follow camelCase for variables and functions
- Use PascalCase for classes and components
- Use UPPER_SNAKE_CASE for constants
- Prefer async/await over promises
- Use meaningful variable and function names

**Example:**
```javascript
// ✅ Good
const calculateMonthlyExpenses = async (userId, startDate) => {
  const transactions = await Transaction.find({
    userId,
    type: 'expense',
    date: { $gte: startDate }
  });
  
  return transactions.reduce((total, transaction) => {
    return total + transaction.amount;
  }, 0);
};

// ❌ Bad
const calc = (u, d) => {
  // unclear function name and parameters
};
```

### React/Frontend Standards

**Component Guidelines:**
- Use functional components with hooks
- Keep components small and focused
- Use TypeScript for type safety (if applicable)
- Follow the component file structure

**Example:**
```jsx
// ✅ Good
import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';

const TransactionForm = ({ onSubmit, initialData }) => {
  const [formData, setFormData] = useState({
    type: 'expense',
    amount: '',
    category: '',
    description: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await onSubmit(formData);
      toast.success('Transaction created successfully!');
    } catch (error) {
      toast.error('Failed to create transaction');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
    </form>
  );
};

export default TransactionForm;
```

### CSS/Styling Standards

- Use Tailwind CSS utility classes
- Create custom CSS only when necessary
- Follow mobile-first responsive design
- Maintain consistent spacing and colors

---

## Testing Guidelines

### Backend Testing

**Test Structure:**
```javascript
// tests/auth.test.js
const request = require('supertest');
const app = require('../server/server');

describe('Authentication', () => {
  describe('POST /api/auth/register', () => {
    it('should register a new user', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'SecurePass123!'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.email).toBe(userData.email);
    });
  });
});
```

### Frontend Testing

**Component Testing:**
```jsx
// components/Auth/Login.test.js
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Login from './Login';

describe('Login Component', () => {
  it('should display validation error for invalid email', async () => {
    render(<Login />);
    
    const emailInput = screen.getByLabelText(/email/i);
    const submitButton = screen.getByRole('button', { name: /login/i });
    
    fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/invalid email/i)).toBeInTheDocument();
    });
  });
});
```

### Test Coverage Requirements

- **Minimum coverage**: 70%
- **Critical paths**: 90%+ coverage
- **New features**: Must include comprehensive tests
- **Bug fixes**: Must include regression tests

### Running Tests

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run backend tests only
npm run test:server

# Run frontend tests only
npm run test:client

# Run tests in watch mode
npm run test:watch
```

---

## Commit Message Guidelines

### Format

```
type(scope): subject

body

footer
```

### Types

- **feat**: New feature
- **fix**: Bug fix
- **docs**: Documentation changes
- **style**: Code style changes (formatting, etc.)
- **refactor**: Code refactoring
- **perf**: Performance improvements
- **test**: Adding or updating tests
- **chore**: Build process or auxiliary tool changes

### Examples

```bash
# Feature
feat(auth): add OTP verification for user registration

Implement OTP-based email verification system:
- Generate 6-digit OTP codes
- Send verification emails using nodemailer
- Add OTP validation middleware
- Update user registration flow

Closes #123

# Bug fix
fix(transactions): resolve date filtering issue in analytics

Fixed incorrect date range calculations that were causing
analytics to show wrong data for custom date periods.

Fixes #456

# Documentation
docs(api): update authentication endpoint documentation

- Add missing request/response examples
- Update error code descriptions
- Fix typos in parameter descriptions
```

### Commit Message Rules

- Use the imperative mood ("add" not "added")
- Capitalize the first letter of the subject
- Do not end the subject line with a period
- Limit the subject line to 50 characters
- Wrap the body at 72 characters
- Reference issues and pull requests when applicable

---

## Pull Request Process

### Before Submitting

**Checklist:**
- [ ] Code follows our coding standards
- [ ] Tests are written and passing
- [ ] Documentation is updated
- [ ] Commit messages follow our guidelines
- [ ] Branch is up to date with main
- [ ] No conflicts with main branch
- [ ] Linting passes without errors

### Pull Request Template

```markdown
## Description
Brief description of changes made.

## Type of Change
- [ ] Bug fix (non-breaking change that fixes an issue)
- [ ] New feature (non-breaking change that adds functionality)
- [ ] Breaking change (fix or feature that causes existing functionality to not work as expected)
- [ ] Documentation update

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed

## Screenshots (if applicable)
Add screenshots to help explain your changes.

## Related Issues
Closes #issue_number

## Additional Notes
Any additional information for reviewers.
```

### Review Process

1. **Automated checks** must pass (CI/CD, tests, linting)
2. **Code review** by at least one maintainer
3. **Manual testing** for UI changes
4. **Documentation review** if applicable
5. **Final approval** and merge by maintainer

### Review Criteria

**Code Quality:**
- Follows coding standards
- Is well-documented
- Has appropriate error handling
- Is performant and secure

**Testing:**
- Has adequate test coverage
- Tests are meaningful and thorough
- Edge cases are considered

**Documentation:**
- API changes are documented
- README is updated if needed
- Comments explain complex logic

---

## Issue Reporting

### Bug Reports

Use the bug report template:

```markdown
**Bug Description**
A clear description of what the bug is.

**Steps to Reproduce**
1. Go to '...'
2. Click on '....'
3. Scroll down to '....'
4. See error

**Expected Behavior**
What you expected to happen.

**Screenshots**
If applicable, add screenshots.

**Environment:**
- OS: [e.g. macOS, Windows, Linux]
- Browser: [e.g. Chrome, Firefox, Safari]
- Version: [e.g. 1.0.0]
- Node.js version: [e.g. 16.14.0]

**Additional Context**
Any other context about the problem.
```

### Security Issues

**Do not create public issues for security vulnerabilities.**

Instead:
1. Email security@financetracker.com
2. Include detailed description and steps to reproduce
3. Allow reasonable time for fix before public disclosure

---

## Feature Requests

### Before Requesting

- Check if the feature already exists
- Search existing issues and discussions
- Consider if it aligns with project goals
- Think about implementation complexity

### Feature Request Template

```markdown
**Is your feature request related to a problem?**
A clear description of what the problem is.

**Describe the solution you'd like**
A clear description of what you want to happen.

**Describe alternatives you've considered**
Other solutions you've thought about.

**Additional context**
Screenshots, mockups, or examples.

**Implementation Ideas**
Technical approach if you have thoughts.
```

---

## Documentation

### Types of Documentation

1. **Code Documentation**: Inline comments, JSDoc
2. **API Documentation**: Endpoint descriptions, examples
3. **User Documentation**: Setup guides, tutorials
4. **Developer Documentation**: Architecture, contributing guides

### Writing Guidelines

- **Be clear and concise**
- **Use examples** where possible
- **Keep it up to date** with code changes
- **Consider different skill levels**
- **Use proper grammar and spelling**

### Documentation Standards

**Code Comments:**
```javascript
/**
 * Calculate user's monthly spending by category
 * @param {string} userId - User's unique identifier
 * @param {Date} startDate - Start of the month
 * @param {Date} endDate - End of the month
 * @returns {Promise<Object>} Category spending breakdown
 */
const getMonthlySpendingByCategory = async (userId, startDate, endDate) => {
  // Implementation
};
```

**API Documentation:**
- Include request/response examples
- Document all parameters and fields
- Provide error scenarios
- Add authentication requirements

---

## Community

### Communication Channels

- **GitHub Issues**: Bug reports, feature requests
- **GitHub Discussions**: General questions, ideas
- **Discord/Slack**: Real-time chat (if available)
- **Email**: security@financetracker.com for security issues

### Getting Help

1. **Check existing documentation** first
2. **Search GitHub issues** for similar problems
3. **Ask in discussions** for general questions
4. **Create an issue** for bugs or feature requests

### Recognition

Contributors will be recognized in:
- README.md contributors section
- Release notes for significant contributions
- Annual contributor awards
- Social media shoutouts

---

## Development Tips

### Useful Commands

```bash
# Database operations
npm run db:seed          # Seed test data
npm run db:reset         # Reset database
npm run db:backup        # Backup database

# Code quality
npm run lint:fix         # Auto-fix linting issues
npm run format           # Format code with Prettier
npm run type-check       # Check TypeScript types

# Build and deploy
npm run build:prod       # Production build
npm run analyze          # Analyze bundle size
npm run docker:build     # Build Docker image
```

### IDE Configuration

**VS Code Extensions:**
- ES7+ React/Redux/React-Native snippets
- Prettier - Code formatter
- ESLint
- Thunder Client (for API testing)
- GitLens
- Auto Rename Tag

**Settings:**
```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "eslint.autoFixOnSave": true,
  "emmet.includeLanguages": {
    "javascript": "javascriptreact"
  }
}
```

---

## FAQ

**Q: How long does it take for PRs to be reviewed?**
A: We aim to review PRs within 2-3 business days. Complex changes may take longer.

**Q: Can I work on multiple issues simultaneously?**
A: Yes, but please create separate branches for each issue.

**Q: What if my PR conflicts with recent changes?**
A: Rebase your branch on the latest main and resolve conflicts.

**Q: How can I become a maintainer?**
A: Regular contributors who demonstrate expertise and commitment may be invited to join the maintainer team.

**Q: Is there a contributor license agreement?**
A: Yes, you'll be prompted to sign our CLA on your first contribution.

---

## Resources

### Learning Resources
- [React Documentation](https://reactjs.org/docs)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)
- [MongoDB University](https://university.mongodb.com/)
- [JavaScript Style Guide](https://github.com/airbnb/javascript)

### Tools
- [Postman](https://www.postman.com/) - API testing
- [MongoDB Compass](https://www.mongodb.com/products/compass) - Database GUI
- [React Developer Tools](https://chrome.google.com/webstore/detail/react-developer-tools/) - Browser extension

---

Thank you for contributing to Finance Tracker! Your efforts help make personal finance management accessible to everyone. 🚀

For questions or clarification, please don't hesitate to reach out through our community channels.