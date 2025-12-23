import { useState, useCallback } from 'react'

// Types
export interface FormField<T = any> {
  value: T
  error?: string
  touched: boolean
}

export interface FormState<T extends Record<string, any>> {
  fields: { [K in keyof T]: FormField<T[K]> }
  isValid: boolean
  isSubmitting: boolean
  submitCount: number
}

export interface ValidationRule<T = any> {
  required?: boolean | string
  minLength?: number | string
  maxLength?: number | string
  pattern?: RegExp | string
  custom?: (value: T) => string | undefined
}

export interface FormConfig<T extends Record<string, any>> {
  initialValues: T
  validationRules?: { [K in keyof T]?: ValidationRule<T[K]> }
  onSubmit: (values: T) => Promise<void> | void
}

/**
 * Custom hook for form state management with validation
 */
export function useForm<T extends Record<string, any>>({
  initialValues,
  validationRules = {},
  onSubmit,
}: FormConfig<T>) {
  const [formState, setFormState] = useState<FormState<T>>(() => {
    const fields = {} as { [K in keyof T]: FormField<T[K]> }
    
    for (const key in initialValues) {
      fields[key] = {
        value: initialValues[key],
        error: undefined,
        touched: false,
      }
    }

    return {
      fields,
      isValid: true,
      isSubmitting: false,
      submitCount: 0,
    }
  })

  const validateField = useCallback((name: keyof T, value: T[keyof T]): string | undefined => {
    const rules = validationRules[name]
    if (!rules) return undefined

    // Required validation
    if (rules.required) {
      const isEmpty = value === '' || value === null || value === undefined
      if (isEmpty) {
        return typeof rules.required === 'string' ? rules.required : `${String(name)} is required`
      }
    }

    // Skip other validations if value is empty and not required
    if (value === '' || value === null || value === undefined) {
      return undefined
    }

    // String-specific validations
    if (typeof value === 'string') {
      // Min length validation
      if (rules.minLength && value.length < rules.minLength) {
        return typeof rules.minLength === 'string' 
          ? rules.minLength 
          : `${String(name)} must be at least ${rules.minLength} characters`
      }

      // Max length validation
      if (rules.maxLength && value.length > rules.maxLength) {
        return typeof rules.maxLength === 'string'
          ? rules.maxLength
          : `${String(name)} must be no more than ${rules.maxLength} characters`
      }

      // Pattern validation
      if (rules.pattern) {
        const regex = rules.pattern instanceof RegExp ? rules.pattern : new RegExp(rules.pattern)
        if (!regex.test(value)) {
          return typeof rules.pattern === 'string' 
            ? `${String(name)} format is invalid`
            : `${String(name)} format is invalid`
        }
      }
    }

    // Custom validation
    if (rules.custom) {
      return rules.custom(value)
    }

    return undefined
  }, [validationRules])

  const validateForm = useCallback(() => {
    const newFields = { ...formState.fields }
    let isValid = true

    for (const name in newFields) {
      const error = validateField(name, newFields[name].value)
      newFields[name] = { ...newFields[name], error }
      if (error) isValid = false
    }

    setFormState(prev => ({
      ...prev,
      fields: newFields,
      isValid,
    }))

    return isValid
  }, [formState.fields, validateField])

  const setValue = useCallback((name: keyof T, value: T[keyof T]) => {
    setFormState(prev => {
      const error = validateField(name, value)
      const newFields = {
        ...prev.fields,
        [name]: {
          ...prev.fields[name],
          value,
          error,
          touched: true,
        },
      }

      // Check if form is valid
      const isValid = Object.values(newFields).every(field => !field.error)

      return {
        ...prev,
        fields: newFields,
        isValid,
      }
    })
  }, [validateField])

  const setError = useCallback((name: keyof T, error: string) => {
    setFormState(prev => ({
      ...prev,
      fields: {
        ...prev.fields,
        [name]: {
          ...prev.fields[name],
          error,
        },
      },
      isValid: false,
    }))
  }, [])

  const setTouched = useCallback((name: keyof T, touched = true) => {
    setFormState(prev => ({
      ...prev,
      fields: {
        ...prev.fields,
        [name]: {
          ...prev.fields[name],
          touched,
        },
      },
    }))
  }, [])

  const reset = useCallback((newValues?: Partial<T>) => {
    const values = { ...initialValues, ...newValues }
    const fields = {} as { [K in keyof T]: FormField<T[K]> }
    
    for (const key in values) {
      fields[key] = {
        value: values[key],
        error: undefined,
        touched: false,
      }
    }

    setFormState({
      fields,
      isValid: true,
      isSubmitting: false,
      submitCount: 0,
    })
  }, [initialValues])

  const handleSubmit = useCallback(async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault()
    }

    setFormState(prev => ({
      ...prev,
      isSubmitting: true,
      submitCount: prev.submitCount + 1,
    }))

    // Mark all fields as touched
    setFormState(prev => {
      const newFields = { ...prev.fields }
      for (const name in newFields) {
        newFields[name] = { ...newFields[name], touched: true }
      }
      return { ...prev, fields: newFields }
    })

    const isValid = validateForm()

    if (!isValid) {
      setFormState(prev => ({ ...prev, isSubmitting: false }))
      return
    }

    try {
      const values = {} as T
      for (const name in formState.fields) {
        values[name] = formState.fields[name].value
      }

      await onSubmit(values)
    } catch (error) {
      console.error('Form submission error:', error)
    } finally {
      setFormState(prev => ({ ...prev, isSubmitting: false }))
    }
  }, [formState.fields, validateForm, onSubmit])

  // Helper to get field props for input components
  const getFieldProps = useCallback((name: keyof T) => {
    const field = formState.fields[name]
    return {
      value: field.value,
      onChange: (value: T[keyof T]) => setValue(name, value),
      onBlur: () => setTouched(name, true),
      error: field.touched ? field.error : undefined,
    }
  }, [formState.fields, setValue, setTouched])

  return {
    values: Object.fromEntries(
      Object.entries(formState.fields).map(([key, field]) => [key, field.value])
    ) as T,
    errors: Object.fromEntries(
      Object.entries(formState.fields).map(([key, field]) => [key, field.error])
    ) as { [K in keyof T]?: string },
    touched: Object.fromEntries(
      Object.entries(formState.fields).map(([key, field]) => [key, field.touched])
    ) as { [K in keyof T]: boolean },
    isValid: formState.isValid,
    isSubmitting: formState.isSubmitting,
    submitCount: formState.submitCount,
    setValue,
    setError,
    setTouched,
    reset,
    handleSubmit,
    getFieldProps,
    validateForm,
  }
}