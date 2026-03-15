export const ConsolePage = {
  EXEC_CONSOLE: "EXEC_CONSOLE"
} as const;

export type ConsolePageType = typeof ConsolePage[keyof typeof ConsolePage];

export const ConsolePanel = {
  LIFECYCLE_PANEL: "LIFECYCLE_PANEL",
  CONSTRAINT_PANEL: "CONSTRAINT_PANEL",
  SIGNALS_PANEL: "SIGNALS_PANEL",
  SIMULATION_PANEL: "SIMULATION_PANEL",
  ROADMAP_PANEL: "ROADMAP_PANEL"
} as const;

export type ConsolePanelType = typeof ConsolePanel[keyof typeof ConsolePanel];
