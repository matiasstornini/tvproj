type ControlMessage = {
  type: string;
  key?: string;
  label?: string;
  hasVideo?: boolean;
  isPaused?: boolean;
  id?: string;
};

class RemoteSyncService {
  private listeners: ((msg: ControlMessage) => void)[] = [];
  private ws: WebSocket | null = null;
  private lastReceivedTime = 0;
  private lastReceivedKey = "";
  private mediaState = { hasVideo: false, isPaused: true };

  constructor() {
    if (typeof window !== "undefined") {
      this.initWebSocket();
    }
  }

  private initWebSocket() {
    try {
      const host = window.location.hostname || "localhost";
      const wsUrl = `ws://${host}:8081`;
      this.ws = new WebSocket(wsUrl);

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === "media-status") {
            this.mediaState = { hasVideo: !!data.hasVideo, isPaused: !!data.isPaused };
          }
          this.notify(data);
        } catch {}
      };

      this.ws.onerror = () => {};
      this.ws.onclose = () => {
        setTimeout(() => this.initWebSocket(), 3000);
      };
    } catch {}
  }

  public getMediaState() {
    return this.mediaState;
  }

  public sendMediaAction(actionType: string) {
    const msg = { type: actionType };
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(JSON.stringify(msg));
      } catch {}
    } else if (import.meta.hot) {
      try {
        import.meta.hot.send("tv:control", msg);
      } catch {}
    }
  }

  public sendKey(key: string, label: string) {
    const msg: ControlMessage = { type: "key", key, label, id: `${Date.now()}-${Math.random()}` };

    if (import.meta.hot) {
      try {
        import.meta.hot.send("tv:control", msg);
      } catch {}
    }

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(JSON.stringify(msg));
      } catch {}
    }
  }

  public onKey(callback: (msg: ControlMessage) => void) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== callback);
    };
  }

  private notify(msg: ControlMessage) {
    if (msg.type === "key") {
      const now = Date.now();
      if (now - this.lastReceivedTime < 90 && this.lastReceivedKey === msg.key) {
        return;
      }
      this.lastReceivedTime = now;
      this.lastReceivedKey = msg.key || "";
    }

    this.listeners.forEach((listener) => listener(msg));
  }
}

export const remoteSync = new RemoteSyncService();
