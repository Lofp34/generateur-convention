export type ParsedParticipant = {
  firstName: string;
  lastName: string;
  fullName: string;
};

export function parseParticipants(raw: string): ParsedParticipant[] {
  return raw
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => {
      const parts = entry.split(/\s+/).filter(Boolean);
      if (parts.length === 0) {
        return {
          firstName: "",
          lastName: "",
          fullName: "",
        };
      }
      if (parts.length === 1) {
        return {
          firstName: parts[0],
          lastName: "",
          fullName: parts[0],
        };
      }
      return {
        firstName: parts[0],
        lastName: parts.slice(1).join(" "),
        fullName: entry,
      };
    });
}
