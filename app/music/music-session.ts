// Application state for the reference client. Presentation and animation are
// deliberately absent: a catalog row, MiniPlayer and portal consume this owner.
export type QueueEntry = { key: number; trackId: number };
export type MusicSession = {
  current: QueueEntry;
  queue: QueueEntry[];
  history: QueueEntry[];
  favorites: number[];
  playing: boolean;
  playedCurrent: boolean;
  nextKey: number;
};

export function createMusicSession(trackIds: readonly number[]): MusicSession {
  if (!trackIds.length)
    throw new Error("A preview collection must contain a track.");
  return {
    current: { key: 1, trackId: trackIds[0] },
    queue: trackIds
      .slice(1)
      .map((trackId, index) => ({ key: index + 2, trackId })),
    history: [],
    favorites: [],
    playing: false,
    playedCurrent: false,
    nextKey: trackIds.length + 1,
  };
}

export type MusicAction =
  | { type: "play"; playing: boolean }
  | { type: "toggle-play" }
  | { type: "played"; trackId: number }
  | { type: "select"; trackId: number; following: readonly number[] }
  | { type: "advance"; key?: number }
  | { type: "favorite"; trackId: number }
  | { type: "add"; trackId: number; next: boolean }
  | { type: "remove"; key: number }
  | { type: "move"; key: number; offset: -1 | 1 }
  | { type: "reorder"; keys: number[] }
  | { type: "clear-queue" }
  | { type: "clear-history" };

function recordCurrent(session: MusicSession) {
  return session.playedCurrent
    ? [session.current, ...session.history].slice(0, 12)
    : session.history;
}

export function musicSessionReducer(
  session: MusicSession,
  action: MusicAction,
): MusicSession {
  switch (action.type) {
    case "play":
      return { ...session, playing: action.playing };
    case "toggle-play":
      return { ...session, playing: !session.playing };
    case "played":
      return action.trackId === session.current.trackId &&
        !session.playedCurrent
        ? { ...session, playedCurrent: true }
        : session;
    case "select": {
      if (action.trackId === session.current.trackId)
        return { ...session, playing: true };
      const key = session.nextKey;
      return {
        ...session,
        current: { key, trackId: action.trackId },
        queue: action.following.map((trackId, index) => ({
          key: key + index + 1,
          trackId,
        })),
        nextKey: key + action.following.length + 1,
        history: recordCurrent(session),
        playing: true,
        playedCurrent: false,
      };
    }
    case "advance": {
      const index =
        action.key === undefined
          ? 0
          : session.queue.findIndex((entry) => entry.key === action.key);
      if (index < 0) return session;
      const next = session.queue[index];
      if (!next) return { ...session, playing: false };
      return {
        ...session,
        current: next,
        queue: session.queue.slice(index + 1),
        history: recordCurrent(session),
        playedCurrent: false,
      };
    }
    case "favorite":
      return {
        ...session,
        favorites: session.favorites.includes(action.trackId)
          ? session.favorites.filter((id) => id !== action.trackId)
          : [...session.favorites, action.trackId],
      };
    case "add": {
      const entry = { key: session.nextKey, trackId: action.trackId };
      return {
        ...session,
        nextKey: session.nextKey + 1,
        queue: action.next
          ? [entry, ...session.queue]
          : [...session.queue, entry],
      };
    }
    case "remove":
      return {
        ...session,
        queue: session.queue.filter((entry) => entry.key !== action.key),
      };
    case "move": {
      const index = session.queue.findIndex(
        (entry) => entry.key === action.key,
      );
      const destination = index + action.offset;
      if (index < 0 || destination < 0 || destination >= session.queue.length)
        return session;
      const queue = [...session.queue];
      [queue[index], queue[destination]] = [queue[destination], queue[index]];
      return { ...session, queue };
    }
    case "reorder": {
      // Dragging must only permute existing occurrences, including duplicates.
      if (
        action.keys.length !== session.queue.length ||
        new Set(action.keys).size !== session.queue.length
      )
        return session;
      const entries = new Map(session.queue.map((entry) => [entry.key, entry]));
      if (action.keys.some((key) => !entries.has(key))) return session;
      return { ...session, queue: action.keys.map((key) => entries.get(key)!) };
    }
    case "clear-queue":
      return { ...session, queue: [] };
    case "clear-history":
      return { ...session, history: [] };
  }
}
