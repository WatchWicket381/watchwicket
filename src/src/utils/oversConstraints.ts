export interface OversPreset {
  value: number;
  label: string;
  description: string;
}

export interface OversConstraints {
  min: number;
  max: number;
  presets: OversPreset[];
}

export function getOversConstraints(format: string): OversConstraints {
  switch (format) {
    case "INDOOR":
      return {
        min: 1,
        max: 18,
        presets: [
          { value: 5, label: "5 Overs", description: "Quick match" },
          { value: 10, label: "10 Overs", description: "Quick indoor" },
          { value: 18, label: "18 Overs", description: "Indoor maximum" },
        ],
      };
    case "T20":
      return {
        min: 1,
        max: 20,
        presets: [
          { value: 20, label: "20 Overs", description: "T20 standard" },
        ],
      };
    case "ODI":
      return {
        min: 1,
        max: 50,
        presets: [
          { value: 50, label: "50 Overs", description: "ODI standard" },
        ],
      };
    default:
      return {
        min: 1,
        max: 200,
        presets: [
          { value: 5, label: "5 Overs", description: "Quick match" },
          { value: 10, label: "10 Overs", description: "Short match" },
          { value: 20, label: "20 Overs", description: "T20 standard" },
          { value: 50, label: "50 Overs", description: "ODI standard" },
        ],
      };
  }
}

export function isValidOversForFormat(overs: number, format: string): { valid: boolean; error?: string } {
  const constraints = getOversConstraints(format);

  if (!Number.isInteger(overs)) {
    return { valid: false, error: "Overs must be a whole number" };
  }

  if (overs < constraints.min) {
    return { valid: false, error: `Minimum ${constraints.min} over${constraints.min > 1 ? 's' : ''}` };
  }

  if (overs > constraints.max) {
    return {
      valid: false,
      error: `${format === "INDOOR" ? "Indoor Mode" : format} maximum is ${constraints.max} overs`
    };
  }

  return { valid: true };
}

export function clampOversToFormat(overs: number | null, format: string): number | null {
  if (overs === null) return null;

  const constraints = getOversConstraints(format);
  return Math.max(constraints.min, Math.min(constraints.max, overs));
}
