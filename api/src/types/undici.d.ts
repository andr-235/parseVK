declare module 'undici' {
  export interface Dispatcher {
    close(): Promise<void>;
  }

  export class Agent implements Dispatcher {
    constructor(options?: { connect?: { rejectUnauthorized?: boolean } });
    close(): Promise<void>;
  }
}
