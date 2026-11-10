// In-memory presence map: userId -> Map<socketId, isVisible>
const userSockets = new Map<string, Map<string, boolean>>();

export function setUserSocketVisibility(
  userId: string,
  socketId: string,
  isVisible: boolean
): void {
  if (!userSockets.has(userId)) {
    userSockets.set(userId, new Map());
  }
  const sockets = userSockets.get(userId)!;
  sockets.set(socketId, isVisible);
}

export function removeUserSocket(userId: string, socketId: string): void {
  const sockets = userSockets.get(userId);
  if (sockets) {
    sockets.delete(socketId);
    if (sockets.size === 0) {
      userSockets.delete(userId);
    }
  }
}

export function isUserVisible(userId: string): boolean {
  const sockets = userSockets.get(userId);
  if (!sockets || sockets.size === 0) {
    return false;
  }
  for (const isVisible of sockets.values()) {
    if (isVisible) {
      return true;
    }
  }
  return false;
}
