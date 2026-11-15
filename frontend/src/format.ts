/** All menu and order prices are stored in Indian rupees, not paise. */
export const formatPrice = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
}).format;
