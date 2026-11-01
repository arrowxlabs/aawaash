import { describe, expect, it } from "vitest";
import {
  canAddTeamLeader,
  canAssignMemberToTeam,
  compareTeamCodes,
  isValidTeamCode,
  nextTeamCode,
} from "@/lib/team-policy";

describe("team policy", () => {
  it("allows adding Team Leaders beyond three", () => {
    expect(canAddTeamLeader(3)).toBe(true);
    expect(canAddTeamLeader(50)).toBe(true);
  });

  it("allows member assignment at counts above 50 when the team has a leader", () => {
    expect(canAssignMemberToTeam(true)).toBe(true);
  });

  it("requires a Team Leader before assigning members", () => {
    expect(canAssignMemberToTeam(false)).toBe(false);
  });

  it("numbers the fourth team 4 after 1, 2, 3", () => {
    expect(nextTeamCode(["1", "2", "3"])).toBe("4");
  });

  it("supports 50+ numbered teams", () => {
    const all = Array.from({ length: 60 }, (_, i) => String(i + 1));
    expect(nextTeamCode(all)).toBe("61");
  });

  it("reuses the first free number", () => {
    expect(nextTeamCode(["1", "3"])).toBe("2");
  });

  it("accepts numbered and legacy letter codes", () => {
    expect(isValidTeamCode("57")).toBe(true);
    expect(isValidTeamCode("0")).toBe(false);
    expect(isValidTeamCode("A")).toBe(true);
  });

  it("sorts numerically", () => {
    expect(["10", "2", "1"].sort(compareTeamCodes)).toEqual(["1", "2", "10"]);
  });
});
