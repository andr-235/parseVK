declare module 'socket.io' {
  export class Server {
    emit(event: string, ...args: unknown[]): boolean;
  }
}
