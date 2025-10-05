import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export type WarningItem = { level: 'WARN' | 'BLOCK'; code: string; message: string };

export interface BuildState {
  buildType: 'FRESH_COMMUNITY' | 'FRESH_PLANTED' | 'FRESH_CICHLID' | 'BRACKISH' | 'FOWLR' | 'REEF' | 'NANO_REEF' | 'PALUDARIUM' | 'BIOTOPE' | null;
  tank: { id?: string; volumeGal?: number; lengthCm?: number; widthCm?: number; heightCm?: number } | null;
  equipment: { filter?: string; heater?: string; light?: string; substrate?: string; extras: string[] };
  livestock: Array<{ type: 'FISH' | 'INVERT' | 'PLANT' | 'CORAL'; id: string; qty: number }>;
  warnings: WarningItem[];
  set<K extends keyof BuildState>(key: K, value: BuildState[K]): void;
  setWarnings(items: WarningItem[]): void;
  reset(): void;
}

export const useBuildStore = create<BuildState>()(
  persist(
    (set) => ({
      buildType: null,
      tank: null,
      equipment: { extras: [] },
      livestock: [],
      warnings: [],
      set: (key, value) => set((state) => ({ ...state, [key]: value } as BuildState)),
      setWarnings: (items) => set(() => ({ warnings: items })),
      reset: () => set(() => ({ buildType: null, tank: null, equipment: { extras: [] }, livestock: [], warnings: [] })),
    }),
    {
      name: 'aquabuilder/build',
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ buildType: s.buildType, tank: s.tank, equipment: s.equipment, livestock: s.livestock }),
    }
  )
);
