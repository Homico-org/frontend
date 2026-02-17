// Legacy registration hook (for backward compatibility)
export { PRO_STEPS, useRegistration } from './useRegistration';
export type {
    AuthMethod, FormData,
    PortfolioProject, RegistrationStep, StepConfig, UseRegistrationOptions, UseRegistrationReturn, VerificationChannel
} from './useRegistration';

// New simplified Pro registration hook
export { useProRegistration } from './useProRegistration';
export type {
    ProRegistrationStep,
    UseProRegistrationReturn
} from './useProRegistration';

