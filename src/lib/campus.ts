export const isCampus = (email: string) => /\.ac\.id$/i.test(email.trim()) || /@demo\.mindo\.test$/i.test(email.trim());
