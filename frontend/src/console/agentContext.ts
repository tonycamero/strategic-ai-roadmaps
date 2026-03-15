import { ConsolePageType, ConsolePanelType } from './consoleSchema';

export interface ConsoleContext {
  page?: ConsolePageType;
  panel?: ConsolePanelType;
}

// Simple singleton for non-React access (like AgentChatPanel payload assembly)
let currentContext: ConsoleContext = {};

export const agentContextStore = {
  setPage(page: ConsolePageType) {
    currentContext.page = page;
    this.notify();
  },
  setPanel(panel: ConsolePanelType | undefined) {
    currentContext.panel = panel;
    this.notify();
  },
  getContext(): ConsoleContext {
    return { ...currentContext };
  },
  // Listeners if needed
  listeners: [] as Array<(ctx: ConsoleContext) => void>,
  subscribe(fn: (ctx: ConsoleContext) => void) {
    this.listeners.push(fn);
    return () => {
      this.listeners = this.listeners.filter(l => l !== fn);
    };
  },
  notify() {
    this.listeners.forEach(l => l(currentContext));
  }
};
