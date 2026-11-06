// Central site configuration: social links and identity.
// Edit here to add/change a social profile; the Footer and the Organization
// JSON-LD both read from this single source of truth.

export const SOCIAL_LINKS = {
  linkedin: "https://www.linkedin.com/company/choosetool/home",
  facebook: "https://www.facebook.com/profile.php?id=61595194893879",
} as const;

export type SocialKey = keyof typeof SOCIAL_LINKS;
