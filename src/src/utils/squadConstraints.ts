import { MatchFormat } from "../matchTypes";

export interface SquadConstraints {
  min: number;
  max: number;
  presets: Array<{
    value: number;
    label: string;
    description: string;
  }>;
}

export function getSquadConstraints(format: MatchFormat): SquadConstraints {
  const basePresets = [
    { value: 6, label: "6 Players", description: "Minimum squad size" },
    { value: 8, label: "8 Players", description: "Small squad" },
    { value: 10, label: "10 Players", description: "Standard squad" },
    { value: 11, label: "11 Players", description: "ICC playing XI" },
  ];

  switch (format) {
    case "INDOOR":
      return {
        min: 1,
        max: 12,
        presets: basePresets,
      };

    case "T20":
    case "ODI":
    case "TEST":
      return {
        min: 1,
        max: 11,
        presets: basePresets,
      };

    default:
      return {
        min: 1,
        max: 11,
        presets: basePresets,
      };
  }
}

export function isValidSquadSizeForFormat(
  squadSize: number,
  format: MatchFormat
): { valid: boolean; error?: string } {
  const constraints = getSquadConstraints(format);

  if (squadSize < constraints.min || squadSize > constraints.max) {
    return {
      valid: false,
      error: `Allowed range is ${constraints.min}–${constraints.max}`,
    };
  }

  return { valid: true };
}

export function clampSquadSizeToFormat(
  squadSize: number | undefined,
  format: MatchFormat
): number {
  const constraints = getSquadConstraints(format);

  if (squadSize === undefined) {
    return format === "INDOOR" ? 10 : 11;
  }

  if (squadSize < constraints.min) return constraints.min;
  if (squadSize > constraints.max) return constraints.max;

  return squadSize;
}
