/**
 * Public barrel for the shared UI library (CLAUDE.md §6.1). Feature code imports
 * components from here — never from @mui/* directly. The remaining §6.1 components
 * (TextInput, DataTable, Modal, etc.) are built in Phase 2 and exported here.
 */
export { Button } from './Button';
export type { ButtonProps, ButtonVariant, ButtonSize } from './Button';
export { Loader } from './Loader';
export type { LoaderProps } from './Loader';
export { TextInput } from './TextInput';
export type { TextInputProps } from './TextInput';
