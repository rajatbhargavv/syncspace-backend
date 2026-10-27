declare module "socket.io" {
  import { Server as HttpServer } from "node:http";

  export interface Socket {
    id: string;
    handshake: {
      headers: Record<string, string | string[] | undefined>;
      auth?: Record<string, any>;
    };
    join(room: string | string[]): void;
    leave(room: string): void;
    emit(event: string, ...args: any[]): boolean;
    on(event: string, listener: (...args: any[]) => void): this;
    [key: string]: any;
  }

  export interface ServerOptions {
    cors?: {
      origin?: any;
      credentials?: boolean;
    };
    [key: string]: any;
  }

  export class Server {
    constructor(srv?: HttpServer | any, opts?: ServerOptions);
    use(fn: (socket: Socket, next: (err?: any) => void) => void): this;
    on(event: "connection", listener: (socket: Socket) => void): this;
    on(event: string, listener: (...args: any[]) => void): this;
    to(room: string | string[]): {
      emit(event: string, ...args: any[]): boolean;
    };
    emit(event: string, ...args: any[]): boolean;
  }
}

