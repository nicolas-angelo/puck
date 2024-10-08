import type { AppState } from "../types";
import { PuckAction } from "../reducer";
import { useHotkeys } from "react-hotkeys-hook";
import { History, HistoryStore } from "./use-history-store";

export type PuckHistory = {
  back: VoidFunction;
  forward: VoidFunction;
  setHistories: (histories: History[]) => void;
  setHistoryIndex: (index: number) => void;
  historyStore: HistoryStore;
};

export function usePuckHistory({
  dispatch,
  initialAppState,
  historyStore,
}: {
  dispatch: (action: PuckAction) => void;
  initialAppState: AppState;
  historyStore: HistoryStore;
}) {
  const back = () => {
    if (historyStore.hasPast) {
      dispatch({
        type: "set",
        state: historyStore.prevHistory?.data || initialAppState,
      });

      historyStore.back();
    }
  };

  const forward = () => {
    if (historyStore.nextHistory) {
      dispatch({ type: "set", state: historyStore.nextHistory.data });

      historyStore.forward();
    }
  };

  const setHistories = (histories: History[]) => {
    // dispatch the last history index or initial state
    dispatch({
      type: "set",
      state: histories[histories.length - 1]?.data || initialAppState,
    });

    historyStore.setHistories(histories);
  };

  const setHistoryIndex = (index: number) => {
    if (historyStore.histories.length > index) {
      dispatch({
        type: "set",
        state: historyStore.histories[index]?.data || initialAppState,
      });

      historyStore.setHistoryIndex(index);
    }
  };

  useHotkeys("meta+z", back, { preventDefault: true });
  useHotkeys("meta+shift+z", forward, { preventDefault: true });
  useHotkeys("meta+y", forward, { preventDefault: true });

  return {
    back,
    forward,
    historyStore,
    setHistories,
    setHistoryIndex,
  };
}
