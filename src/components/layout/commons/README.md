# Alert Modal System

A comprehensive modal alert system for displaying success, error, warning, and info messages throughout the application.

## Components

### AlertModal.vue

The main modal component that displays alert messages with different types and configurations.

### useAlertModal.js

A composable that provides easy-to-use functions for showing different types of alerts.

## Usage

### Basic Usage

```vue
<script setup>
import { useAlertModal } from '@/composables/useAlertModal.js'

const { showSuccess, showError, showWarning, showInfo, hideAlert } = useAlertModal()

// Show different types of alerts
const handleSuccess = () => {
  showSuccess('Operation completed successfully!')
}

const handleError = () => {
  showError('Something went wrong. Please try again.')
}

const handleWarning = () => {
  showWarning('Please be careful with this action.')
}

const handleInfo = () => {
  showInfo('Here is some useful information.')
}
</script>

<template>
  <div>
    <!-- Your content -->

    <!-- Add the AlertModal component -->
    <AlertModal
      :show="showAlert"
      :type="alertConfig.type"
      :title="alertConfig.title"
      :message="alertConfig.message"
      :showCloseButton="alertConfig.showCloseButton"
      :autoClose="alertConfig.autoClose"
      :autoCloseDelay="alertConfig.autoCloseDelay"
      @close="hideAlert"
    />
  </div>
</template>
```

### Advanced Usage

```javascript
// Custom configuration
showSuccess('User created successfully!', 'Success!', {
  autoClose: true,
  autoCloseDelay: 5000,
  showCloseButton: true,
})

// Custom alert
showCustom({
  type: 'warning',
  title: 'Custom Alert',
  message: 'This is a custom alert message.',
  autoClose: false,
  showCloseButton: true,
})
```

## API Reference

### useAlertModal Composable

#### Functions

- `showSuccess(message, title?, options?)` - Show success alert
- `showError(message, title?, options?)` - Show error alert
- `showWarning(message, title?, options?)` - Show warning alert
- `showInfo(message, title?, options?)` - Show info alert
- `showCustom(config)` - Show custom alert with full configuration
- `hideAlert()` - Hide the current alert

#### Reactive Properties

- `showAlert` - Boolean indicating if alert is visible
- `alertConfig` - Object containing current alert configuration

### AlertModal Props

| Prop              | Type    | Default  | Description                                       |
| ----------------- | ------- | -------- | ------------------------------------------------- |
| `show`            | Boolean | `false`  | Controls modal visibility                         |
| `type`            | String  | `'info'` | Alert type: 'success', 'error', 'warning', 'info' |
| `title`           | String  | `''`     | Alert title (auto-generated if empty)             |
| `message`         | String  | `''`     | Alert message content                             |
| `showCloseButton` | Boolean | `true`   | Show close button                                 |
| `autoClose`       | Boolean | `false`  | Auto-close after delay                            |
| `autoCloseDelay`  | Number  | `3000`   | Auto-close delay in milliseconds                  |

### AlertModal Events

| Event     | Description                            |
| --------- | -------------------------------------- |
| `close`   | Emitted when modal is closed           |
| `confirm` | Emitted when confirm button is clicked |

## Alert Types

### Success

- **Color**: Green (#4CAF50)
- **Icon**: Check circle
- **Auto-close**: Default true (3 seconds)
- **Use case**: Successful operations, confirmations

### Error

- **Color**: Red (#F44336)
- **Icon**: Alert circle
- **Auto-close**: Default false
- **Use case**: Errors, failures, validation issues

### Warning

- **Color**: Orange (#FF9800)
- **Icon**: Alert
- **Auto-close**: Default false
- **Use case**: Warnings, cautions, important notices

### Info

- **Color**: Blue (#2196F3)
- **Icon**: Information
- **Auto-close**: Default true (3 seconds)
- **Use case**: General information, tips

## Styling

The modal is fully responsive and includes:

- Smooth animations (fade in, slide in)
- Mobile-optimized layout
- Consistent color scheme
- Accessible design
- Customizable appearance

## Examples

### Login/Register Forms

```javascript
// Login success
showSuccess('Welcome back! You have been logged in successfully.', 'Login Successful')

// Login error
showError('Invalid email or password. Please check your credentials.', 'Login Failed')

// Registration success
showSuccess('Account created successfully! You can now log in.', 'Registration Successful')
```

### Form Validation

```javascript
// Field validation error
showError('Please fill in all required fields.', 'Validation Error')

// Success message
showSuccess('Your changes have been saved.', 'Saved Successfully')
```

### System Messages

```javascript
// Network error
showError('Unable to connect to server. Please check your internet connection.', 'Connection Error')

// Loading complete
showInfo('Data has been loaded successfully.', 'Ready')
```

## Integration

The alert modal system is already integrated into:

- LoginView.vue
- Can be easily added to any other component

## Best Practices

1. **Use appropriate alert types** - Match the alert type to the message content
2. **Keep messages concise** - Use clear, actionable language
3. **Provide context** - Include relevant details in error messages
4. **Use auto-close wisely** - Success and info messages can auto-close, errors and warnings should not
5. **Test on mobile** - Ensure messages are readable on all screen sizes
