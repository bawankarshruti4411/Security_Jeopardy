/**
 * Calculates a team's rotating physical route order.
 * Challenge codes: P01, P02, P03, P04, P05
 * 
 * Team 1 (routeIndex 0): P01 -> P02 -> P03 -> P04 -> P05
 * Team 2 (routeIndex 1): P02 -> P03 -> P04 -> P05 -> P01
 * Team 3 (routeIndex 2): P03 -> P04 -> P05 -> P01 -> P02
 * Team 4 (routeIndex 3): P04 -> P05 -> P01 -> P02 -> P03
 * Team 5 (routeIndex 4): P05 -> P01 -> P02 -> P03 -> P04
 */
export const PHYSICAL_CODES = ['P01', 'P02', 'P03', 'P04', 'P05'] as const;

export function getTeamPhysicalRoute(routeIndex: number): string[] {
  const normalizedIndex = Math.max(0, routeIndex) % PHYSICAL_CODES.length;
  const route: string[] = [];
  for (let i = 0; i < PHYSICAL_CODES.length; i++) {
    route.push(PHYSICAL_CODES[(normalizedIndex + i) % PHYSICAL_CODES.length]);
  }
  return route;
}

/**
 * Extracts a numeric sequence from a team code like SJ-T001 -> 1
 */
export function parseTeamCodeNumber(teamCode: string): number {
  const match = teamCode.match(/\d+/);
  return match ? parseInt(match[0], 10) : 1;
}

/**
 * Generates next unique team code: e.g. SJ-T006
 */
export function formatTeamCode(num: number): string {
  return `SJ-T${num.toString().padStart(3, '0')}`;
}
