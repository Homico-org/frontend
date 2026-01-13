// Registration step components - Legacy (for backward compatibility)
export { default as StepAccount } from './StepAccount';
export { default as StepCategory } from './StepCategory';
export { default as StepReview } from './StepReview';
export { default as StepServices } from './StepServices';

// New simplified Pro registration steps
export { default as StepComplete } from './StepComplete';
export { default as StepPhone } from './StepPhone';
export { default as StepProfile } from './StepProfile';
export { default as StepSelectServices } from './StepSelectServices';

// Types - Legacy
export type { AccountStepProps } from './StepAccount';
export type { CategoryStepProps } from './StepCategory';
export type { ReviewStepProps } from './StepReview';
export type { ServicesStepProps } from './StepServices';

// Types - New
export type { ExperienceLevel, SelectedService } from './StepSelectServices';
