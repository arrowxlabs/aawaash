/**
 * Team policy — shared rules for teams, Team Leaders and members.
 *
 * - Team Leaders are unlimited: every new leader gets their own team.
 * - Members per team are unlimited.
 * - Teams are numbered: Team 1, Team 2, Team 3 … (stored as "1", "2", …).
 * - Legacy letter codes (A–ZZZ) are still accepted for old login IDs.
 */

export const TEAM_NUMBER_PATTERN = /^[1-9]\d{0,4}$/;
export const TEAM_CODE_PATTERN = /^([1-9]\d{0,4}|[A-Z]{1,3})$/;

export function isValidTeamCode(code: string) {
  return TEAM_CODE_PATTERN.test(code);
}

/** Team Leaders are never capped. */
export function canAddTeamLeader(_currentLeaders: number) {
  return true;
}

export function canAssignMemberToTeam(hasTeamLeader: boolean) {
  return hasTeamLeader;
}

function codeToIndex(code: string) {
  if (TEAM_NUMBER_PATTERN.test(code)) return Number(code);
  // Legacy letters sort after numbered teams.
  let n = 0;
  for (const ch of code) n = n * 26 + (ch.charCodeAt(0) - 64);
  return 1_000_000 + n;
}

/** Returns the lowest unused team number as a string ("1", "2", …). */
export function nextTeamCode(existing: string[]) {
  const used = new Set(existing.filter((c) => TEAM_NUMBER_PATTERN.test(c)).map(Number));
  let i = 1;
  while (used.has(i)) i++;
  if (i > 99999) throw new Error("No team numbers left");
  return String(i);
}

/** Sort numerically: 1, 2 … 10 (not 1, 10, 2). */
export function compareTeamCodes(a: string, b: string) {
  return codeToIndex(a) - codeToIndex(b);
}

/** Human label, e.g. "Team 4". */
export function teamLabel(code: string | null | undefined) {
  return code ? `Team ${code}` : "Unassigned";
}
