export const formatCategory = (category?: string) => {
  if (!category) return "Other";
  return category
    .split("-")
    .map((part) => (part ? part[0].toUpperCase() + part.slice(1) : ""))
    .join(" ");
};


export const formatListingPrice = (price?: number | null) => {
  if (typeof price !== "number" || !Number.isFinite(price) || price < 100) {
    return "Price on request";
  }
  return `$${price.toLocaleString()}`;
};

export const formatListingHours = (hours?: number | null) => {
  if (typeof hours !== "number" || !Number.isFinite(hours)) return null;
  return `${hours.toLocaleString()} hrs`;
};

export const toPlainText = (value?: string | null) => {
  if (!value) return "";
  return value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
};
