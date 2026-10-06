// WebSocket client manager for live DC Bank simulation events

class SocketClient {
  constructor() {
    this.ws = null;
    this.listeners = new Set();
    this.statusListeners = new Set();
    this.isConnected = false;
    this.reconnectTimer = null;
  }

  connect() {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    // Use window.location.host so Vite proxy forwards /ws to :5001, or fallback direct to 5001
    const wsUrl = `${protocol}//${window.location.host}/ws`;

    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.isConnected = true;
        this.notifyStatus(true);
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.notifyListeners(data);
        } catch (err) {
          console.error('[WS] Failed to parse message:', err);
        }
      };

      this.ws.onclose = () => {
        this.isConnected = false;
        this.notifyStatus(false);
        this.scheduleReconnect();
      };

      this.ws.onerror = (err) => {
        console.warn('[WS] Socket error:', err);
        this.ws?.close();
      };
    } catch (err) {
      console.error('[WS] Connection error:', err);
      this.scheduleReconnect();
    }
  }

  scheduleReconnect() {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, 2500);
  }

  subscribe(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  subscribeStatus(callback) {
    this.statusListeners.add(callback);
    callback(this.isConnected);
    return () => this.statusListeners.delete(callback);
  }

  notifyListeners(data) {
    for (const cb of this.listeners) {
      try {
        cb(data);
      } catch (e) {
        console.error('Error in WS subscriber callback:', e);
      }
    }
  }

  notifyStatus(status) {
    for (const cb of this.statusListeners) {
      try {
        cb(status);
      } catch (e) {
        console.error('Error in status callback:', e);
      }
    }
  }

  disconnect() {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

export const socket = new SocketClient();
