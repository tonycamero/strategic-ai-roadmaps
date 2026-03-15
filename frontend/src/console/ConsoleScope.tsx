import { useEffect, ReactNode } from 'react';
import { ConsolePageType, ConsolePanelType } from './consoleSchema';
import { agentContextStore } from './agentContext';

interface ConsoleScopeProps {
  page?: ConsolePageType;
  panel?: ConsolePanelType;
  children: ReactNode;
}

/**
 * ConsoleScope Wrapper
 * 
 * Automatically updates the global agent context when a console surface is active.
 * This allows the TrustAgent to have semantic awareness of the user's current view.
 */
export function ConsoleScope({ page, panel, children }: ConsoleScopeProps) {
  useEffect(() => {
    const previous = agentContextStore.getContext();

    if (page) {
      agentContextStore.setPage(page);
    }
    if (panel) {
      agentContextStore.setPanel(panel);
    }

    return () => {
      // Revert to previous context on unmount to keep intelligence deterministic
      if (page && previous.page) {
        agentContextStore.setPage(previous.page);
      }
      if (panel && previous.panel) {
        agentContextStore.setPanel(previous.panel);
      } else if (panel) {
        // If we only added a panel, clear it
        agentContextStore.setPanel(undefined);
      }
    };
  }, [page, panel]);

  return <>{children}</>;
}
