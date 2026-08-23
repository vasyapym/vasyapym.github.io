import { createContext, useContext } from "react";

export type ForestSettings = {
  reducedMotion: boolean;
};

export const ForestSettingsContext = createContext<ForestSettings>({
  reducedMotion: false,
});

export function useForestSettings(): ForestSettings {
  return useContext(ForestSettingsContext);
}
