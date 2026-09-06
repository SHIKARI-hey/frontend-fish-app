export interface PondRecord {
  id: string;
  name: string;
  type: string; // e.g. Earthen, Concrete, Tarpaulin, Cage
  widthMeters: number;
  lengthMeters: number;
  depthMeters: number;
  volumeLiters: number;
  fishCount: number;
  fishType: string;
  dateAdded: string;
  measuredViaCamera?: boolean;
}

export interface UserFarmProfile {
  name: string;
  farmName: string;
  phone: string;
  location: string;
  experienceLevel: string;
  primaryGoal: string;
  targetWeightKg: number;
  ponds: PondRecord[];
  notes: string[];
}

const STORAGE_KEY = "fish_doctor_unified_farm_memory_v2";

const DEFAULT_PROFILE: UserFarmProfile = {
  name: "Aquaculture Farmer",
  farmName: "My Fish Farm",
  phone: "+233 248785807",
  location: "Accra, Ghana",
  experienceLevel: "Commercial Farmer",
  primaryGoal: "Increase Yield & Growth Rate",
  targetWeightKg: 1.2,
  ponds: [], // STRICTLY EMPTY - No hardcoded sample ponds!
  notes: [],
};

export function getFarmProfile(): UserFarmProfile {
  if (typeof window === "undefined") return DEFAULT_PROFILE;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const storedFarmName = localStorage.getItem("user_farm_name");
    const storedGoal = localStorage.getItem("user_primary_goal");
    const storedName = localStorage.getItem("user_name");

    if (!raw) {
      const init = {
        ...DEFAULT_PROFILE,
        name: storedName || DEFAULT_PROFILE.name,
        farmName: storedFarmName || DEFAULT_PROFILE.farmName,
        primaryGoal: storedGoal || DEFAULT_PROFILE.primaryGoal,
        ponds: [],
        notes: [],
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(init));
      return init;
    }
    const parsed = JSON.parse(raw) || {};
    if (!Array.isArray(parsed.ponds)) parsed.ponds = [];
    if (!Array.isArray(parsed.notes)) parsed.notes = [];
    if (storedFarmName) parsed.farmName = storedFarmName;
    if (storedGoal) parsed.primaryGoal = storedGoal;
    if (storedName) parsed.name = storedName;
    return parsed;
  } catch {
    return DEFAULT_PROFILE;
  }
}

export function saveFarmProfile(profile: UserFarmProfile): void {
  if (typeof window === "undefined") return;
  if (profile.farmName) localStorage.setItem("user_farm_name", profile.farmName);
  if (profile.primaryGoal) localStorage.setItem("user_primary_goal", profile.primaryGoal);
  if (profile.name) localStorage.setItem("user_name", profile.name);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
}

export function addPondToMemory(pond: Omit<PondRecord, "id" | "dateAdded">): PondRecord {
  const profile = getFarmProfile();
  const newPond: PondRecord = {
    ...pond,
    id: `pond-${Date.now()}`,
    dateAdded: new Date().toISOString(),
  };
  profile.ponds.push(newPond);
  saveFarmProfile(profile);
  return newPond;
}

export function deletePondFromMemory(id: string): void {
  const profile = getFarmProfile();
  profile.ponds = profile.ponds.filter((p) => p.id !== id);
  saveFarmProfile(profile);
}

export function clearAllPondsFromMemory(): void {
  const profile = getFarmProfile();
  profile.ponds = [];
  saveFarmProfile(profile);
}

export function getUnifiedMemoryPrompt(): string {
  const profile = getFarmProfile();
  const totalFish = profile.ponds.reduce((acc, p) => acc + (p.fishCount || 0), 0);
  const totalVolume = profile.ponds.reduce((acc, p) => acc + (p.volumeLiters || 0), 0);
  const primaryGoal = profile.primaryGoal || localStorage.getItem("user_primary_goal") || "Increase Yield & Growth Rate";

  let summary = `FARM OWNER: ${profile.name}\n`;
  summary += `FARM NAME: ${profile.farmName || "My Fish Farm"}\n`;
  summary += `LOCATION: ${profile.location}\n`;
  summary += `PRIMARY FARM GOAL & AI MANDATE: The farmer's primary goal is "${primaryGoal}". You MUST prioritize achieving this primary goal in every diagnosis, calculation, and advice.\n`;
  summary += `TARGET HARVEST WEIGHT: ${profile.targetWeightKg} kg\n`;
  summary += `TOTAL PONDS: ${profile.ponds.length} ponds | TOTAL FISH STOCK: ${totalFish} fish | TOTAL WATER VOLUME: ${totalVolume.toLocaleString()} Liters\n\n`;

  if (profile.ponds.length > 0) {
    summary += `DETAILED POND INVENTORY:\n`;
    profile.ponds.forEach((p, idx) => {
      summary += `${idx + 1}. [${p.name}] - Type: ${p.type} | Dimensions: ${p.widthMeters}m W x ${p.lengthMeters}m L x ${p.depthMeters}m D | Volume: ${p.volumeLiters.toLocaleString()} L | Stock: ${p.fishCount} ${p.fishType} ${p.measuredViaCamera ? "(Measured via AR Camera Scanner)" : ""}\n`;
    });
  } else {
    summary += `NO PONDS MEASURED YET.\n`;
  }

  return summary;
}
