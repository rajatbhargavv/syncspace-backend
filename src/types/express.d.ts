import { ISpace } from "./space.types.ts";

export {};

declare global {
    namespace Express {
        interface Request {
            user?: {
                id: string;
                [key: string]: any;
            };
            space?: ISpace;
        }
    }
}
