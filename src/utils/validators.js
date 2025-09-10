// IsEmpty
export const isEmpty = (value) => {
  if (value === null || value === undefined || value === '') return true
  return !!(Array.isArray(value) && value.length === 0)
}

// IsNullOrUndefined
export const isNullOrUndefined = (value) => {
  return value === null || value === undefined
}

// IsEmptyArray
export const isEmptyArray = (arr) => {
  return Array.isArray(arr) && arr.length === 0
}

// IsObject
export const isObject = (obj) =>
  obj !== null && !!obj && typeof obj === 'object' && !Array.isArray(obj)

// Required Validator
export const requiredValidator = (value) => {
  if (isNullOrUndefined(value) || isEmptyArray(value) || value === false)
    return 'This field is required'
  return !!String(value).trim().length || 'This field is required'
}

// Email Validator
export const emailValidator = (value) => {
  if (isEmpty(value)) return true
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return re.test(String(value)) || 'Please enter a valid email address'
}

// Password Validator - At least 8 characters with numbers
export const passwordValidator = (password) => {
  if (isEmpty(password)) return true
  const hasNumbers = /\d/.test(password)
  const hasMinLength = password.length >= 8
  return (hasNumbers && hasMinLength) || 'Password must be at least 8 characters with numbers'
}

// Confirm Password Validator
export const confirmedValidator = (value, target) => value === target || 'Passwords do not match'

// Number Validator
export const numberValidator = (value) => {
  if (isEmpty(value)) return true
  return !isNaN(Number(value)) || 'Must be a valid number'
}

// Integer Validator
export const integerValidator = (value) => {
  if (isEmpty(value)) return true
  return /^-?[0-9]+$/.test(String(value)) || 'Must be a whole number'
}

// Min Length Validator
export const minLengthValidator = (value, minLength) => {
  if (isEmpty(value)) return true
  return String(value).length >= minLength || `Must be at least ${minLength} characters`
}

// Max Length Validator
export const maxLengthValidator = (value, maxLength) => {
  if (isEmpty(value)) return true
  return String(value).length <= maxLength || `Must be no more than ${maxLength} characters`
}

// Between Validator
export const betweenValidator = (value, min, max) => {
  if (isEmpty(value)) return true
  const numValue = Number(value)
  return (numValue >= min && numValue <= max) || `Must be between ${min} and ${max}`
}

// Positive Number Validator
export const positiveValidator = (value) => {
  if (isEmpty(value)) return true
  const numValue = Number(value)
  return numValue > 0 || 'Must be a positive number'
}

// Phone Validator
export const phoneValidator = (value) => {
  if (isEmpty(value)) return true
  const re = /^[\+]?[1-9][\d]{0,15}$/
  return re.test(String(value).replace(/\s/g, '')) || 'Please enter a valid phone number'
}

// URL Validator
export const urlValidator = (value) => {
  if (isEmpty(value)) return true
  try {
    new URL(value)
    return true
  } catch {
    return 'Please enter a valid URL'
  }
}

// Alpha Validator (letters only)
export const alphaValidator = (value) => {
  if (isEmpty(value)) return true
  return /^[a-zA-Z\s]+$/.test(String(value)) || 'Only letters are allowed'
}

// Alpha Numeric Validator
export const alphaNumericValidator = (value) => {
  if (isEmpty(value)) return true
  return /^[a-zA-Z0-9\s]+$/.test(String(value)) || 'Only letters and numbers are allowed'
}

// Decimal Validator
export const decimalValidator = (value, decimals = 2) => {
  if (isEmpty(value)) return true
  const regex = new RegExp(`^\\d+(\\.\\d{1,${decimals}})?$`)
  return (
    regex.test(String(value)) || `Must be a valid decimal with up to ${decimals} decimal places`
  )
}
