import { describe, it, expect } from "vitest";
import { isValidCongoPhone, normalizeCongoPhone } from "./PhoneInput";
import { passwordStrength } from "@/lib/auth-errors";

describe("phone validation", () => {
  it("accepts local Congo number", () => expect(isValidCongoPhone("06 123 45 67")).toBe(true));
  it("accepts +242 prefix", () => expect(isValidCongoPhone("+242 06 123 45 67")).toBe(true));
  it("accepts foreign number with code", () => expect(isValidCongoPhone("+33 6 12 34 56 78")).toBe(true));
  it("rejects too short", () => expect(isValidCongoPhone("0612")).toBe(false));
  it("normalizes Congo to +242", () => expect(normalizeCongoPhone("06 123 45 67")).toBe("+242061234567"));
  it("keeps foreign number", () => expect(normalizeCongoPhone("+33 6 12 34 56 78")).toBe("+33612345678"));
});
describe("password strength", () => {
  it("rejects under 8 chars", () => expect(passwordStrength("abc12").ok).toBe(false));
  it("rejects letters only", () => expect(passwordStrength("abcdefgh").ok).toBe(false));
  it("accepts letters+digits", () => expect(passwordStrength("abcdef12").ok).toBe(true));
});
