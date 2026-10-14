import { ISpace } from "./space.types.js";
import { IComment } from "./comments.types.js";
import { ISpaceMember } from "./spaceMember.types.js";

export {};

declare global {
    namespace Express {
        interface Request {
            user?: {
                id: string;
                [key: string]: any;
            };
            space?: ISpace;
            spaceMember?: ISpaceMember;
            comment?: IComment;
        }
    }
}
