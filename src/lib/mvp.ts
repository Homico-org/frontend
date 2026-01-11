/**
 * MVP Mode Configuration
 * 
 * When MVP_MODE is enabled:
 * - Hiring through Homico is disabled
 * - Direct phone contact is the only option
 * - Project tracking features are hidden
 * - Simplified hire flow (no project management)
 * 
 * Set NEXT_PUBLIC_MVP_MODE=true in production .env to enable
 */

export const isMVPMode = (): boolean => {
  return process.env.NEXT_PUBLIC_MVP_MODE === 'true';
};

/**
 * Features available in MVP mode
 */
export const MVP_CONFIG = {
  // Hiring options
  allowHomicoHiring: false,  // Disable "Hire with Homico" option
  allowDirectHiring: true,   // Enable "Hire Direct" (phone reveal)
  
  // Project tracking
  showProjectTracker: false, // Hide project tracker card
  showProjectChat: false,    // Hide project chat
  showPolls: false,          // Hide polls feature
  showMaterials: false,      // Hide materials/resources
  showHistory: false,        // Hide project history
  
  // Job page
  showHiredJobActions: false, // Hide chat/polls/resources on job page
  
  // What to show instead
  showPhoneReveal: true,     // Show phone number when hired
  showSimpleHiredCard: true, // Show simple "You hired X" card
} as const;

/**
 * Get feature availability based on MVP mode
 */
export const getMVPFeature = <K extends keyof typeof MVP_CONFIG>(
  feature: K
): typeof MVP_CONFIG[K] => {
  if (isMVPMode()) {
    return MVP_CONFIG[feature];
  }
  // In non-MVP mode, all features are enabled
  return true as typeof MVP_CONFIG[K];
};
