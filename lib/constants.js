export const XP = {
  SOLO_CHECKIN: 10,
  BOTH_BONUS: 25,
  OPTIONAL: 5,
  BOTH_STREAK_BONUS: 5,
  LEVEL_XP: 100
};

export function stageFromLevel(level){
  if (level >= 22) return 4;
  if (level >= 15) return 3;
  if (level >= 8) return 2;
  return 1;
}
