import { useRef, useEffect, type RefObject } from 'react';
import { useAIActionsOptional } from './AIActionContext';

type FieldElement = HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;

interface UseAIActionFieldOptions {
  /** Human-readable label for the field (shown in confirmation dialog) */
  label?: string;
}

interface UseAIActionFieldReturn<T extends FieldElement> {
  /** Ref to attach to the input element */
  ref: RefObject<T>;
}

/**
 * Hook to register a form field for AI targeting
 *
 * When the AI assistant suggests filling a form, it can target fields
 * registered with this hook by their fieldId.
 *
 * @param fieldId - Unique identifier for the field (e.g., "profile.name", "settings.bio")
 * @param setValue - Function to update the field's value in your state
 * @param options - Optional configuration
 *
 * @example
 * ```tsx
 * // In a form component
 * const [name, setName] = useState('');
 * const nameField = useAIActionField('profile.name', setName, { label: 'Full Name' });
 *
 * return <input ref={nameField.ref} value={name} onChange={e => setName(e.target.value)} />;
 * ```
 */
export function useAIActionField<T extends FieldElement = HTMLInputElement>(
  fieldId: string,
  setValue: (value: string) => void,
  options: UseAIActionFieldOptions = {}
): UseAIActionFieldReturn<T> {
  const ref = useRef<T>(null);
  const aiActions = useAIActionsOptional();

  useEffect(() => {
    if (aiActions) {
      aiActions.registerField(fieldId, ref as RefObject<FieldElement>, setValue, options.label);

      return () => {
        aiActions.unregisterField(fieldId);
      };
    }
  }, [fieldId, setValue, options.label, aiActions]);

  return { ref };
}

/**
 * Hook to register multiple form fields at once
 *
 * Useful for forms with many fields to reduce boilerplate.
 *
 * @example
 * ```tsx
 * const fields = useAIActionFields({
 *   'profile.name': { setValue: setName, label: 'Name' },
 *   'profile.bio': { setValue: setBio, label: 'Bio' },
 *   'profile.location': { setValue: setLocation, label: 'Location' },
 * });
 *
 * return (
 *   <>
 *     <input ref={fields['profile.name'].ref} ... />
 *     <textarea ref={fields['profile.bio'].ref} ... />
 *     <input ref={fields['profile.location'].ref} ... />
 *   </>
 * );
 * ```
 */
export function useAIActionFields<K extends string>(
  fieldConfigs: Record<K, { setValue: (value: string) => void; label?: string }>
): Record<K, UseAIActionFieldReturn<FieldElement>> {
  const aiActions = useAIActionsOptional();
  const refsMap = useRef<Record<string, RefObject<FieldElement>>>({});

  // Create refs for each field
  for (const fieldId of Object.keys(fieldConfigs) as K[]) {
    if (!refsMap.current[fieldId]) {
      refsMap.current[fieldId] = { current: null };
    }
  }

  useEffect(() => {
    if (aiActions) {
      // Register all fields
      for (const [fieldId, config] of Object.entries(fieldConfigs) as [K, { setValue: (value: string) => void; label?: string }][]) {
        const ref = refsMap.current[fieldId];
        if (ref) {
          aiActions.registerField(fieldId, ref, config.setValue, config.label);
        }
      }

      // Cleanup: unregister all fields
      return () => {
        for (const fieldId of Object.keys(fieldConfigs)) {
          aiActions.unregisterField(fieldId);
        }
      };
    }
  }, [fieldConfigs, aiActions]);

  // Build return object
  const result = {} as Record<K, UseAIActionFieldReturn<FieldElement>>;
  for (const fieldId of Object.keys(fieldConfigs) as K[]) {
    result[fieldId] = { ref: refsMap.current[fieldId] };
  }

  return result;
}
