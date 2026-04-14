```markdown
# ramie Development Patterns

> Auto-generated skill from repository analysis

## Overview
This skill teaches the core development patterns and conventions used in the `ramie` repository, a Vue-based JavaScript project. You'll learn about file naming, import/export styles, commit message conventions, and testing patterns to ensure consistency and maintainability in your contributions.

## Coding Conventions

### File Naming
- Use **camelCase** for file names.
  - Example: `myComponent.vue`, `userProfile.js`

### Import Style
- Use **relative imports** for modules.
  - Example:
    ```js
    import MyComponent from './myComponent.vue';
    import utils from '../utils/helper.js';
    ```

### Export Style
- Use **default exports** for modules and components.
  - Example:
    ```js
    export default {
      name: 'MyComponent',
      // component options...
    };
    ```

### Commit Message Patterns
- Use prefixes like `feat` or `add` for new features or additions.
- Keep commit messages concise, averaging around 26 characters.
  - Example:
    ```
    feat: add user profile modal
    add: validation to signup form
    ```

## Workflows

_No automated workflows detected in this repository._

## Testing Patterns

- **Test File Pattern:** Test files follow the `*.test.*` naming convention.
  - Example: `userProfile.test.js`, `utils.test.js`
- **Testing Framework:** Not explicitly detected. Use the standard test runner for JavaScript/Vue projects (e.g., Jest or Mocha) as appropriate.

**Example Test File:**
```js
// userProfile.test.js
import userProfile from './userProfile';

describe('userProfile', () => {
  it('should return correct user data', () => {
    // test implementation
  });
});
```

## Commands
| Command | Purpose |
|---------|---------|
| /test   | Run all test files matching `*.test.*` |
| /lint   | Lint the codebase according to project conventions |
| /commit | Generate a commit message following the `feat`/`add` prefix pattern |
```