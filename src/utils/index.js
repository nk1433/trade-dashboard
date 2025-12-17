export const formatToIndianUnits = (num) => {
  if (num == null) return '-';
  if (num >= 1e7) return (num / 1e7).toFixed(2) + ' Cr'; // Crores
  if (num >= 1e5) return (num / 1e5).toFixed(2) + ' L';  // Lakhs
  return Number(num).toFixed(2);
};