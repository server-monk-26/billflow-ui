// Registers the feature i18n namespace as a side effect when the barrel is imported.
import './i18n';

export { Login } from './components/Login';
export { ResetPassword } from './components/ResetPassword';
export { SignUp } from './components/SignUp';
export { useLoadCurrentUser } from './hooks/useLoadCurrentUser';
export { meSchema } from './model/meSchema';
export type { Me } from './model/meSchema';
export { loginFormSchema, makeLoginSchema } from './model/loginSchema';
export type { LoginFormValues } from './model/loginSchema';
export { makeSignUpSchema } from './model/signUpSchema';
export type { SignUpFormValues } from './model/signUpSchema';
export { evaluatePassword, PASSWORD_RULES } from './model/passwordStrength';
export type { PasswordStrength } from './model/passwordStrength';
export { makeResetSchema } from './model/resetSchema';
export type { ResetFormValues } from './model/resetSchema';
