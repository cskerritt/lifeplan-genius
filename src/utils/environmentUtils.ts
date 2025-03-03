/**
 * Environment detection utilities
 * These utilities help determine the current execution environment
 */

/**
 * Check if the code is running in a browser environment
 * @returns boolean indicating if the code is running in a browser
 */
export const isBrowser = (): boolean => {
  return typeof window !== 'undefined' && typeof document !== 'undefined';
};

/**
 * Check if the code is running in a Node.js environment
 * @returns boolean indicating if the code is running in Node.js
 */
export const isNode = (): boolean => {
  return typeof process !== 'undefined' && 
         process.versions != null && 
         process.versions.node != null;
};

/**
 * Check if the code is running in a development environment
 * @returns boolean indicating if the code is running in development
 */
export const isDevelopment = (): boolean => {
  return import.meta.env.DEV === true;
};

/**
 * Check if the code is running in a production environment
 * @returns boolean indicating if the code is running in production
 */
export const isProduction = (): boolean => {
  return import.meta.env.PROD === true;
};

/**
 * Log environment information for debugging
 */
export const logEnvironmentInfo = (): void => {
  console.log('Environment Information:');
  console.log(`- Browser: ${isBrowser()}`);
  console.log(`- Node.js: ${isNode()}`);
  console.log(`- Development: ${isDevelopment()}`);
  console.log(`- Production: ${isProduction()}`);
  
  if (isBrowser()) {
    console.log(`- User Agent: ${navigator.userAgent}`);
  }
  
  if (isNode()) {
    console.log(`- Node.js Version: ${process.version}`);
    console.log(`- Platform: ${process.platform}`);
  }
};
