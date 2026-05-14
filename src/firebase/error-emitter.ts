type ErrorHandler = (error: any) => void;

class ErrorEmitter {
  private listeners: { [event: string]: ErrorHandler[] } = {};

  on(event: string, handler: ErrorHandler) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(handler);
  }

  off(event: string, handler: ErrorHandler) {
    if (!this.listeners[event]) return;
    this.listeners[event] = this.listeners[event].filter(h => h !== handler);
  }

  emit(event: string, data: any) {
    if (!this.listeners[event]) return;
    this.listeners[event].forEach(handler => handler(data));
  }
}

export const errorEmitter = new ErrorEmitter();
