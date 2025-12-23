import { createContext, useContext, useRef, useCallback, useState, type ReactNode, type RefObject } from 'react';
import type { SuggestedAction } from '../components/AIAssistant';

/**
 * Registered form field that AI can interact with
 */
interface RegisteredField {
  id: string;
  ref: RefObject<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>;
  setValue: (value: string) => void;
  label?: string;
}

/**
 * Pending action awaiting user confirmation
 */
export interface PendingAction {
  action: SuggestedAction;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * AI Action Context value
 */
interface AIActionContextValue {
  // Navigation
  navigate: (path: string) => void;

  // Form field registration
  registerField: (
    id: string,
    ref: RefObject<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
    setValue: (value: string) => void,
    label?: string
  ) => void;
  unregisterField: (id: string) => void;

  // Action execution
  executeAction: (action: SuggestedAction) => Promise<boolean>;

  // Get registered field IDs (for AI context awareness)
  getRegisteredFields: () => string[];

  // Pending action for confirmation dialog
  pendingAction: PendingAction | null;
  setPendingAction: (action: PendingAction | null) => void;

  // Visual feedback
  highlightField: (fieldId: string) => void;
}

const AIActionContext = createContext<AIActionContextValue | null>(null);

/**
 * Hook to access AI action capabilities
 */
export function useAIActions(): AIActionContextValue {
  const context = useContext(AIActionContext);
  if (!context) {
    throw new Error('useAIActions must be used within an AIActionProvider');
  }
  return context;
}

/**
 * Optional hook that returns null if not within provider
 */
export function useAIActionsOptional(): AIActionContextValue | null {
  return useContext(AIActionContext);
}

interface AIActionProviderProps {
  children: ReactNode;
  onNavigate?: (path: string) => void;
}

/**
 * AI Action Provider
 *
 * Provides context for AI-driven actions like navigation and form filling.
 * Wrap your app or shell with this provider to enable AI assistance.
 */
export function AIActionProvider({ children, onNavigate }: AIActionProviderProps) {
  const fieldsRef = useRef<Map<string, RegisteredField>>(new Map());
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);

  // Navigation
  const navigate = useCallback((path: string) => {
    if (onNavigate) {
      onNavigate(path);
    } else {
      console.log('AI Navigation:', path);
    }
  }, [onNavigate]);

  // Register a field for AI targeting
  const registerField = useCallback((
    id: string,
    ref: RefObject<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
    setValue: (value: string) => void,
    label?: string
  ) => {
    fieldsRef.current.set(id, { id, ref, setValue, label });
  }, []);

  // Unregister a field
  const unregisterField = useCallback((id: string) => {
    fieldsRef.current.delete(id);
  }, []);

  // Get all registered field IDs
  const getRegisteredFields = useCallback(() => {
    return Array.from(fieldsRef.current.keys());
  }, []);

  // Highlight a field with visual feedback
  const highlightField = useCallback((fieldId: string) => {
    const field = fieldsRef.current.get(fieldId);
    if (field?.ref.current) {
      const element = field.ref.current;

      // Add highlight class
      element.classList.add('ai-field-highlight');
      element.style.transition = 'box-shadow 0.3s ease, background-color 0.3s ease';
      element.style.boxShadow = '0 0 0 3px rgba(245, 158, 11, 0.5)';
      element.style.backgroundColor = 'rgba(245, 158, 11, 0.1)';

      // Remove highlight after animation
      setTimeout(() => {
        element.classList.remove('ai-field-highlight');
        element.style.boxShadow = '';
        element.style.backgroundColor = '';
      }, 1500);
    }
  }, []);

  // Fill a single field
  const fillField = useCallback((fieldId: string, value: string): boolean => {
    const field = fieldsRef.current.get(fieldId);
    if (field) {
      field.setValue(value);
      highlightField(fieldId);
      return true;
    }
    console.warn(`AI Action: Field "${fieldId}" not found`);
    return false;
  }, [highlightField]);

  // Fill multiple fields
  const fillForm = useCallback((formFields: Record<string, string>): boolean => {
    let allSuccess = true;
    for (const [fieldId, value] of Object.entries(formFields)) {
      if (!fillField(fieldId, value)) {
        allSuccess = false;
      }
    }
    return allSuccess;
  }, [fillField]);

  // Execute an action (with confirmation for form actions)
  const executeAction = useCallback(async (action: SuggestedAction): Promise<boolean> => {
    switch (action.type) {
      case 'navigate':
        if (action.url) {
          navigate(action.url);
          return true;
        }
        return false;

      case 'external':
        if (action.url) {
          window.open(action.url, '_blank');
          return true;
        }
        return false;

      case 'fill_field':
        if (action.fieldId && action.fieldValue !== undefined) {
          // Show confirmation dialog
          return new Promise((resolve) => {
            setPendingAction({
              action,
              onConfirm: () => {
                const success = fillField(action.fieldId!, action.fieldValue!);
                setPendingAction(null);
                resolve(success);
              },
              onCancel: () => {
                setPendingAction(null);
                resolve(false);
              },
            });
          });
        }
        return false;

      case 'fill_form':
        if (action.formFields) {
          // Show confirmation dialog
          return new Promise((resolve) => {
            setPendingAction({
              action,
              onConfirm: () => {
                const success = fillForm(action.formFields!);
                setPendingAction(null);
                resolve(success);
              },
              onCancel: () => {
                setPendingAction(null);
                resolve(false);
              },
            });
          });
        }
        return false;

      case 'click':
        if (action.elementId) {
          const element = document.getElementById(action.elementId);
          if (element) {
            element.click();
            return true;
          }
        }
        return false;

      case 'submit':
        if (action.elementId) {
          const element = document.getElementById(action.elementId);
          if (element) {
            if (element instanceof HTMLFormElement) {
              element.submit();
            } else if (element instanceof HTMLButtonElement) {
              element.click();
            }
            return true;
          }
        }
        return false;

      case 'modal':
      case 'inline':
        // These are handled by the UI, not executed directly
        console.log('AI Action (UI-handled):', action);
        return true;

      default:
        console.warn('AI Action: Unknown action type', action);
        return false;
    }
  }, [navigate, fillField, fillForm]);

  const value: AIActionContextValue = {
    navigate,
    registerField,
    unregisterField,
    executeAction,
    getRegisteredFields,
    pendingAction,
    setPendingAction,
    highlightField,
  };

  return (
    <AIActionContext.Provider value={value}>
      {children}
    </AIActionContext.Provider>
  );
}

export { AIActionContext };
