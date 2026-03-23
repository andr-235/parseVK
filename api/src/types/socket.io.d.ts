declare module 'socket.io' {
  export class Socket {
    join(room: string): void;
  }

  export class Server {
    to(room: string): Server;
    emit(event: string, ...args: unknown[]): boolean;
  }
}
