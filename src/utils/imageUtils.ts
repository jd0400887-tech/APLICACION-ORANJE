export const getDisplayImage = (imageUrl: string | null | undefined, type: 'person' | 'hotel' = 'hotel'): string => {
  if (imageUrl && imageUrl.trim() !== '') {
    return imageUrl; // Use the provided imageUrl if it exists
  }

  // If no imageUrl, use a placeholder based on type
  const placeholderText = type === 'person' ? 'O' : 'Hotel';
  const backgroundColor = type === 'person' ? 'E8751A' : 'cccccc'; // Orange for person, gray for hotel
  return `https://placehold.co/400x400/${backgroundColor}/FFFFFF?text=${placeholderText}&font=lato`;
};
