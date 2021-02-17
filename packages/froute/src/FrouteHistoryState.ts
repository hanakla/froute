// eslint-disable-next-line @typescript-eslint/ban-types
export type StateBase = object | null;

export type FrouteHistoryState<S extends StateBase = any> = {
  __froute?: {
    sid: string | undefined | null;
    scrollX: number;
    scrollY: number;
  };
  app: S;
};

export const isFrouteState = (state: any): state is FrouteHistoryState => {
  if (state && typeof state.__froute === "object") return true;
  return false;
};

export const createFrouteHistoryState = (
  sid: string | undefined | null,
  appState: StateBase = null
): FrouteHistoryState => ({
  __froute: { sid, scrollX: 0, scrollY: 0 },
  app: appState,
});
