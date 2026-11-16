/** What the backend tells the prospecting worker on its open connection. */
export interface WorkerEvent {
  type: 'send' | 'cancel';
  requestId: string;
}

export interface WorkerPresence {
  connected: boolean;
  lastSeenAt: Date | null;
}

/**
 * Live link to the worker on the user's computer (RF-PRS-05). The worker opens it, so its
 * machine needs no public address. One backend instance: the link lives in memory, and the
 * worker also asks for ready requests when it connects, so nothing is lost while it is away.
 */
export abstract class WorkerChannel {
  abstract publish(ownerId: string, event: WorkerEvent): void;
  abstract presence(ownerId: string): WorkerPresence;
}
