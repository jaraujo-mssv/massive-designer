import { createContext, useContext } from "react";

interface LogoSources {
  /** Logo.dev's publishable key, taken from the loaded sheet's Logo.dev URLs (logoDevTokenFrom). */
  logoDevToken: string | null;
}

const LogoSourcesContext = createContext<LogoSources>({ logoDevToken: null });

/** Each canvas tool wraps its canvas and edit popover in this, so logos can be looked up by domain. */
export const LogoSourcesProvider = LogoSourcesContext.Provider;

export function useLogoSources(): LogoSources {
  return useContext(LogoSourcesContext);
}
