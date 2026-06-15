// Registers the feature i18n namespace as a side effect when the barrel is imported.
import './i18n';

export { Login } from './components/Login';
export { loginFormSchema, makeLoginSchema } from './model/loginSchema';
export type { LoginFormValues } from './model/loginSchema';
