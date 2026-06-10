// In @/lib/qr file
export const parseQR = (text) => {
  // Pattern to match your URL structure
  const urlPattern = /^https:\/\/loyal\.bahirandelivery\.com\/(menu|restaurant)\/([a-f0-9]+)$/i;
  const match = text.match(urlPattern);
  
  if (match) {
    const type = match[1]; // 'menu' or 'restaurant'
    const restaurantId = match[2]; // The ID part
    
    return {
      kind: type === 'menu' ? 'menu' : 'loyalty', // or however you want to map it
      restaurantId: restaurantId,
      raw: text
    };
  }
  
  // If URL doesn't match the expected pattern
  return {
    kind: 'unknown',
    raw: text
  };

  
};