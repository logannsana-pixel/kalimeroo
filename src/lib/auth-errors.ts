/** Translate backend auth errors into clear French messages. */
export const authErrorMessage = (message: string): string => {
  const m = message.toLowerCase();
  if (m.includes("already registered") || m.includes("already exists")) return "Ce compte existe déjà. Connectez-vous.";
  if (m.includes("weak") || m.includes("pwned") || m.includes("known")) return "Mot de passe trop faible ou déjà divulgué en ligne. Choisissez-en un autre (8 caractères, lettres et chiffres).";
  if (m.includes("rate limit") || m.includes("too many")) return "Trop de tentatives. Patientez quelques minutes puis réessayez.";
  if (m.includes("invalid login")) return "Identifiant ou mot de passe incorrect.";
  if (m.includes("email not confirmed")) return "Compte pas encore confirmé.";
  if (m.includes("password should be")) return "Le mot de passe doit contenir au moins 8 caractères.";
  if (m.includes("network") || m.includes("fetch")) return "Connexion internet instable. Réessayez.";
  return "Une erreur est survenue. Réessayez.";
};

export type PasswordStrength = { score: 0 | 1 | 2 | 3; label: string; ok: boolean };
export const passwordStrength = (pw: string): PasswordStrength => {
  if (!pw) return { score: 0, label: "", ok: false };
  let s = 0;
  if (pw.length >= 8) s++;
  if (/[a-zA-Z]/.test(pw) && /\d/.test(pw)) s++;
  if (pw.length >= 10 && /[^a-zA-Z0-9]/.test(pw)) s++;
  if (pw.length < 8) return { score: 0, label: "Trop court (8 caractères minimum)", ok: false };
  if (s === 1) return { score: 1, label: "Faible : ajoutez des chiffres et des lettres", ok: false };
  if (s === 2) return { score: 2, label: "Correct ✓", ok: true };
  return { score: 3, label: "Fort ✓", ok: true };
};
