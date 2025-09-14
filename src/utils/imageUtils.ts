export const getDisplayImage = (imageUrl: string | null | undefined, type: 'person' | 'hotel' = 'hotel'): string => {
  if (imageUrl && imageUrl.trim() !== '') {
    return imageUrl;
  }

  // Use picsum.photos for random placeholders
  const randomSeed = Math.random();
  if (type === 'person') {
    // Return a square image for people
    return `https://picsum.photos/400/400?random=${randomSeed}`;
  }

  // Return a landscape image for hotels
  return `https://picsum.photos/600/400?random=${randomSeed}`;
};
