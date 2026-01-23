// Force cleanup utility to remove all mock data
export const forceCleanupMockData = () => {
  if (typeof window === 'undefined') return;
  
  console.log('[Force Cleanup] Starting comprehensive mock data removal...');
  
  // List of known mock data patterns
  const mockPatterns = [
    'strategy_001', 'strategy_002', 'strategy_003',
    'exec_001', 'exec_002', 'exec_003',
    '500', '1000', '300', // Known mock amounts
    '1800', '1881' // Known mock totals
  ];
  
  // Clear all Intent-related localStorage
  Object.keys(localStorage).forEach(key => {
    if (key.startsWith('intent_') || 
        key.includes('strategy') || 
        key.includes('portfolio') || 
        key.includes('activity')) {
      
      // Check if the data contains mock patterns
      try {
        const data = localStorage.getItem(key);
        if (data) {
          const hasMovckData = mockPatterns.some(pattern => 
            data.includes(pattern)
          );
          
          if (hasMovckData || key.startsWith('intent_')) {
            console.log(`[Force Cleanup] Removing ${key}`);
            localStorage.removeItem(key);
          }
        }
      } catch (error) {
        console.warn(`Error checking ${key}:`, error);
        // Remove it anyway if we can't parse it
        localStorage.removeItem(key);
      }
    }
  });
  
  console.log('[Force Cleanup] Mock data cleanup complete!');
};

// Run cleanup immediately when this module is imported
if (typeof window !== 'undefined') {
  forceCleanupMockData();
}