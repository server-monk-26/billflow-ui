import type { ChangeEventHandler, FocusEventHandler, ReactNode, Ref } from 'react';

/**
 * TextInput (CLAUDE.md §6.1). Label-above-field finance-pro style (Design Spec §05/§09):
 * 12px label, 1px border, 3px soft accent focus ring. RHF-compatible — designed to be driven
 * by a Controller `field` (value/onChange/onBlur/name/ref) or used controlled directly.
 */
export interface TextInputProps {
  label: string;
  name?: string;
  type?: 'text' | 'password' | 'email';
  value?: string;
  defaultValue?: string;
  onChange?: ChangeEventHandler<HTMLInputElement | HTMLTextAreaElement>;
  onBlur?: FocusEventHandler<HTMLInputElement | HTMLTextAreaElement>;
  /** Error message; presence switches the field into the error state. */
  error?: string;
  helperText?: string;
  required?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  placeholder?: string;
  autoComplete?: string;
  maxLength?: number;
  inputMode?: 'text' | 'numeric' | 'tel' | 'email' | 'search' | 'url' | 'none' | 'decimal';
  startAdornment?: ReactNode;
  endAdornment?: ReactNode;
  /** RHF Controller passes its ref here. */
  inputRef?: Ref<HTMLInputElement>;
  'data-testid'?: string;
}
