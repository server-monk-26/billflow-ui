import { useId, useState } from 'react';
import FormControl from '@mui/material/FormControl';
import OutlinedInput, { type OutlinedInputProps } from '@mui/material/OutlinedInput';
import FormHelperText from '@mui/material/FormHelperText';
import InputAdornment from '@mui/material/InputAdornment';
import IconButton from '@mui/material/IconButton';
import { Eye, EyeOff } from 'lucide-react';
import type { TextInputProps } from './TextInput.types';

/**
 * App TextInput — wraps MUI so feature code never imports the UI library (§3.2). All sizing,
 * radius, border, and focus colors come from design tokens, so it inherits the live data-*
 * axes. For password fields it renders a show/hide toggle.
 */
export function TextInput({
  label,
  name,
  type = 'text',
  value,
  defaultValue,
  onChange,
  onBlur,
  error,
  helperText,
  required = false,
  disabled = false,
  fullWidth = true,
  placeholder,
  autoComplete,
  maxLength,
  inputMode,
  startAdornment,
  endAdornment,
  inputRef,
  'data-testid': testId,
}: TextInputProps) {
  const id = useId();
  const [showPassword, setShowPassword] = useState(false);

  const isPassword = type === 'password';
  const resolvedType = isPassword ? (showPassword ? 'text' : 'password') : type;
  const describedBy = error || helperText ? `${id}-help` : undefined;

  // Build props without assigning `undefined` (exactOptionalPropertyTypes).
  const inputProps: OutlinedInputProps = {
    id,
    type: resolvedType,
    notched: false,
    required,
    fullWidth,
    inputProps: {
      'aria-describedby': describedBy,
      'data-testid': testId,
      ...(maxLength !== undefined ? { maxLength } : {}),
      ...(inputMode !== undefined ? { inputMode } : {}),
    },
    sx: {
      borderRadius: 'var(--r)',
      minHeight: 'var(--row-h)',
      backgroundColor: 'var(--surface)',
      fontSize: 'var(--fs-body)',
      '& .MuiOutlinedInput-notchedOutline': { borderColor: 'var(--border)' },
      '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'var(--border-strong)' },
      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
        borderColor: 'var(--accent)',
        borderWidth: '1px',
      },
      '&.Mui-focused': { boxShadow: '0 0 0 3px var(--accent-soft)' },
      '&.Mui-error.Mui-focused': { boxShadow: '0 0 0 3px var(--danger-soft)' },
      '& .MuiOutlinedInput-input': { paddingTop: 'var(--sp-2)', paddingBottom: 'var(--sp-2)' },
    },
  };
  if (name !== undefined) inputProps.name = name;
  if (value !== undefined) inputProps.value = value;
  if (defaultValue !== undefined) inputProps.defaultValue = defaultValue;
  if (onChange) inputProps.onChange = onChange;
  if (onBlur) inputProps.onBlur = onBlur;
  if (inputRef) inputProps.inputRef = inputRef;
  if (placeholder !== undefined) inputProps.placeholder = placeholder;
  if (autoComplete !== undefined) inputProps.autoComplete = autoComplete;
  if (startAdornment)
    inputProps.startAdornment = <InputAdornment position="start">{startAdornment}</InputAdornment>;

  if (isPassword) {
    inputProps.endAdornment = (
      <InputAdornment position="end">
        <IconButton
          aria-label={showPassword ? 'Hide password' : 'Show password'}
          onClick={() => setShowPassword((v) => !v)}
          edge="end"
          size="small"
          tabIndex={-1}
        >
          {showPassword ? <EyeOff size={16} strokeWidth={1.6} /> : <Eye size={16} strokeWidth={1.6} />}
        </IconButton>
      </InputAdornment>
    );
  } else if (endAdornment) {
    inputProps.endAdornment = <InputAdornment position="end">{endAdornment}</InputAdornment>;
  }

  return (
    <FormControl fullWidth={fullWidth} error={!!error} disabled={disabled} variant="outlined">
      <label
        htmlFor={id}
        style={{
          display: 'block',
          width: '100%',
          fontSize: 'var(--fs-label)',
          fontWeight: 500,
          color: 'var(--text-2)',
          marginBottom: 'var(--sp-1)',
        }}
      >
        {label}
        {required && (
          <span aria-hidden style={{ color: 'var(--danger)' }}>
            {' '}
            *
          </span>
        )}
      </label>
      <OutlinedInput {...inputProps} />
      {(error || helperText) && (
        <FormHelperText id={describedBy} sx={{ marginLeft: 0, fontSize: 'var(--fs-label)' }}>
          {error ?? helperText}
        </FormHelperText>
      )}
    </FormControl>
  );
}
