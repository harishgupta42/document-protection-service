import { generatePassword, isAcceptablePassword } from "../src/services/password.service";

describe("generatePassword", () => {
  it("produces passwords within the length range that satisfy the policy", () => {
    for (let i = 0; i < 200; i += 1) {
      const pw = generatePassword(14, 28);
      expect(pw.length).toBeGreaterThanOrEqual(14);
      expect(pw.length).toBeLessThanOrEqual(28);
      expect(isAcceptablePassword(pw)).toBe(true);
    }
  });

  it("rejects an impossible range", () => {
    expect(() => generatePassword(10, 5)).toThrow();
  });
});

describe("isAcceptablePassword", () => {
  it.each([
    ["Abcdefghijk1!xyz", true],
    ["short1!A", false],
    ["alllowercase123!!!!", false],
    ["ALLUPPERCASE123!!!!", false],
    ["NoDigitsHere!!!!!!", false],
    ["NoSpecialChars12345", false],
    ["Has spaces in it 12!A", false],
    ["x".repeat(29) + "A1!", false],
  ])("%s -> %s", (pw, expected) => {
    expect(isAcceptablePassword(pw)).toBe(expected);
  });
});
