// Registers the feature i18n namespace as a side effect when the barrel is imported.
import './i18n';

export { Login } from './components/Login';
export { ResetPassword } from './components/ResetPassword';
export { loginFormSchema, makeLoginSchema } from './model/loginSchema';
export type { LoginFormValues } from './model/loginSchema';
export { evaluatePassword, PASSWORD_RULES } from './model/passwordStrength';
export type { PasswordStrength } from './model/passwordStrength';
export { makeResetSchema } from './model/resetSchema';
export type { ResetFormValues } from './model/resetSchema';
