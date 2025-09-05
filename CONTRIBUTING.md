# Contributing to AMELIA-Mini

We're excited that you're interested in contributing to AMELIA-Mini! This document provides guidelines and information for contributors.

## 🤝 Code of Conduct

By participating in this project, you agree to abide by our Code of Conduct:

- **Be Respectful**: Treat everyone with respect and kindness
- **Be Inclusive**: Welcome newcomers and support all skill levels
- **Be Professional**: Keep discussions focused and constructive
- **Be Patient**: Understand that reviews and responses take time

## 🚀 Getting Started

### Prerequisites

Before contributing, ensure you have:
- Node.js 18+ installed
- npm package manager
- Git for version control
- A Supabase account (for database features)
- Code editor (VS Code recommended)

### Setting Up Development Environment

1. **Fork and Clone**
   ```bash
   git fork https://github.com/your-username/AMELIA-Mini.git
   cd AMELIA-Mini
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your Supabase credentials
   ```

4. **Database Setup**
   ```bash
   npx supabase db push
   ```

5. **Start Development Server**
   ```bash
   npm run dev
   ```

## 🏗 Development Workflow

### Branch Strategy

- **`master`** - Production-ready code
- **`develop`** - Integration branch for features
- **`feature/*`** - New features and enhancements
- **`fix/*`** - Bug fixes
- **`docs/*`** - Documentation updates

### Creating a New Feature

1. **Create Feature Branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Implement Changes**
   - Follow the Vertical Slice Architecture (VSA) pattern
   - Add tests for new functionality
   - Update documentation as needed

3. **Test Your Changes**
   ```bash
   npm run lint          # Check code quality
   npm run build         # Ensure build succeeds
   npm test              # Run all tests
   ```

4. **Commit Changes**
   ```bash
   git add .
   git commit -m "feat: add user profile management"
   ```

5. **Push and Create PR**
   ```bash
   git push origin feature/your-feature-name
   ```

## 📝 Coding Standards

### TypeScript Guidelines

```typescript
// Use descriptive names
interface UserProfile {
  id: string
  email: string
  firstName: string
  lastName: string
  createdAt: Date
}

// Export types explicitly
export type { UserProfile }

// Use proper error handling
try {
  const result = await userService.create(userData)
  return { success: true, data: result }
} catch (error) {
  console.error('Failed to create user:', error)
  return { success: false, error: error.message }
}
```

### React Component Standards

```tsx
// Use functional components with TypeScript
interface UserCardProps {
  user: UserProfile
  onEdit?: (user: UserProfile) => void
}

export function UserCard({ user, onEdit }: UserCardProps) {
  return (
    <div className="rounded-lg border p-4">
      <h3 className="font-semibold">{user.firstName} {user.lastName}</h3>
      <p className="text-gray-600">{user.email}</p>
      {onEdit && (
        <Button onClick={() => onEdit(user)}>
          Edit
        </Button>
      )}
    </div>
  )
}
```

### Database Patterns

```sql
-- Always include RLS policies
CREATE POLICY "Users can view own profile" ON profiles
FOR SELECT USING (auth.uid() = user_id);

-- Use consistent naming
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Server Action Patterns

```typescript
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateUserProfile(
  formData: FormData
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()
    
    // Validate input
    const firstName = formData.get('firstName') as string
    if (!firstName?.trim()) {
      return { success: false, error: 'First name is required' }
    }

    // Perform operation
    const { error } = await supabase
      .from('profiles')
      .update({ first_name: firstName })
      .eq('user_id', user.id)

    if (error) {
      throw error
    }

    revalidatePath('/profile')
    return { success: true }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}
```

## 🧪 Testing Requirements

### Unit Tests

```typescript
// Use Jest and Testing Library
import { render, screen } from '@testing-library/react'
import { UserCard } from './UserCard'

describe('UserCard', () => {
  const mockUser = {
    id: '1',
    email: 'test@example.com',
    firstName: 'John',
    lastName: 'Doe',
    createdAt: new Date()
  }

  it('displays user information', () => {
    render(<UserCard user={mockUser} />)
    
    expect(screen.getByText('John Doe')).toBeInTheDocument()
    expect(screen.getByText('test@example.com')).toBeInTheDocument()
  })
})
```

### Integration Tests

- Test server actions with mock Supabase client
- Verify database operations with test data
- Test authentication flows

### E2E Tests

- Use Playwright for end-to-end testing
- Test complete user workflows
- Verify responsive design

## 📋 Pull Request Process

### Before Submitting

- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Tests added for new features
- [ ] Tests pass locally
- [ ] Documentation updated
- [ ] No merge conflicts

### PR Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] E2E tests pass
- [ ] Manual testing completed

## Screenshots (if applicable)
Add screenshots for UI changes

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Tests added
- [ ] Documentation updated
```

### Review Process

1. **Automated Checks** - CI/CD runs tests and linting
2. **Code Review** - Team member reviews changes
3. **Testing** - Manual verification if needed
4. **Approval** - Reviewer approves changes
5. **Merge** - Changes merged to appropriate branch

## 🏛 Architecture Guidelines

### Vertical Slice Architecture (VSA)

Each module should be self-contained:

```
app/(modules)/users/
├── page.tsx                    # Main page component
├── components/
│   ├── UserForm.tsx           # Form component
│   ├── UserTable.tsx          # Table component
│   └── UserCard.tsx           # Card component
├── actions.ts                 # Server actions
├── types.ts                   # TypeScript interfaces
└── utils.ts                   # Utility functions
```

### Database Design

- Use RLS for security
- Follow PostgreSQL best practices
- Create indexes for performance
- Document schema changes

### API Design

- Use Server Actions for mutations
- REST API for external integrations
- Consistent error handling
- Proper status codes

## 🐛 Bug Reports

When reporting bugs, include:

- **Environment**: OS, browser, Node.js version
- **Steps to Reproduce**: Clear step-by-step instructions
- **Expected Behavior**: What should happen
- **Actual Behavior**: What actually happens
- **Screenshots**: If applicable
- **Console Logs**: Any error messages

## 💡 Feature Requests

For new features, provide:

- **Problem Statement**: What problem does this solve?
- **Proposed Solution**: How should it work?
- **Use Cases**: Who would use this feature?
- **Mockups**: Visual representation if applicable

## 📖 Documentation Standards

- Use clear, concise language
- Include code examples
- Keep documentation up-to-date
- Follow markdown standards
- Add JSDoc comments for functions

## 🔒 Security Considerations

- Never commit sensitive data
- Use environment variables for secrets
- Validate all user input
- Test RLS policies thoroughly
- Report security issues privately

## 📞 Getting Help

- **GitHub Discussions** - General questions
- **GitHub Issues** - Bug reports and feature requests
- **Discord** - Real-time community chat
- **Email** - security@amelia-mini.com for security issues

## 📜 Commit Message Format

Use conventional commits:

```
type(scope): description

feat(users): add user profile management
fix(auth): resolve login redirect issue
docs(api): update endpoint documentation
test(users): add unit tests for user service
refactor(db): optimize user queries
```

Types:
- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation
- `style` - Code style changes
- `refactor` - Code refactoring
- `test` - Tests
- `chore` - Build/dependency updates

## 🎯 Development Focus Areas

Current priorities:
- **HR Module** - Employee management features
- **Performance** - Optimization and caching
- **Testing** - Increase test coverage
- **Documentation** - API and user guides
- **Security** - RLS policy auditing

## 🙏 Recognition

Contributors will be:
- Listed in CONTRIBUTORS.md
- Mentioned in release notes
- Invited to maintainer team (for significant contributions)

---

Thank you for contributing to AMELIA-Mini! Your efforts help make this project better for everyone.