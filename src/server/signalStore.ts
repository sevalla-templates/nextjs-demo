type SignalItem = {
  type: "offer" | "answer" | "candidate";
  data: any;
};

export type RoomQueues = {
  queueForA: SignalItem[]; // messages destined for peer A
  queueForB: SignalItem[]; // messages destined for peer B
};

const rooms = new Map<string, RoomQueues>();

function getRoom(roomId: string): RoomQueues {
  let room = rooms.get(roomId);
  if (!room) {
    room = { queueForA: [], queueForB: [] };
    rooms.set(roomId, room);
  }
  return room;
}

export function pushToRoom(roomId: string, from: "a" | "b", item: SignalItem) {
  const room = getRoom(roomId);
  if (from === "a") {
    room.queueForB.push(item);
  } else {
    room.queueForA.push(item);
  }
}

export function popFor(roomId: string, forSide: "a" | "b"): SignalItem[] {
  const room = getRoom(roomId);
  const items = forSide === "a" ? room.queueForA : room.queueForB;
  const out = items.slice();
  items.length = 0; // clear
  return out;
}
