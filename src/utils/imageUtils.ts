export const getDisplayImage = (imageUrl: string | null | undefined, type: 'person' | 'hotel' = 'hotel'): string => {
  if (imageUrl && imageUrl.trim() !== '') {
    return imageUrl; // Use the provided imageUrl if it exists
  }

  // If no imageUrl, use a placeholder based on type
  const randomSeed = Math.random();
  if (type === 'person') {
    return `https://picsum.photos/400/400?random=${randomSeed}`;
  }

  // Fallback for 'hotel' type if no imageUrl is provided
  return 'https://placehold.co/600x400/gray/white?text=Hotel'; // Use placehold.co for hotel placeholder
};
