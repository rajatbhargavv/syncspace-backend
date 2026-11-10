import { randomUUID } from 'crypto';
import { model, Schema } from 'mongoose';

import { ISpace } from '../types/space.types.js';

const spaceSchema = new Schema<ISpace>(
    {
        _id: {
            type: String,
            default: () => 'Space_' + randomUUID()
        },
        name: {
            type: String,
            required: true
        },
        description: {
            type: String,
            required: false
        },
        ownerId: {
            type: String,
            ref: "User",
            required: true
        },
        status: {
            type: String,
            enum: ['Active', 'Inactive'],
            default: 'Active'
        },
        spaceType: {
            type: String,
            enum: ['Personal', 'Shared'],
            default: 'Shared'
        },
        kind: {
            type: String,
            enum: ["OUR_HOME", "BUILDERS_CIRCLE", "STUDIO", "MY_CORNER", "CUSTOM"],
            default: "CUSTOM"
        },
        theme: {
            preset: {
                type: String,
                enum: ["HEARTH", "NEON_GRID", "IVORY_INK", "ORBIT"],
                default: "ORBIT"
            },
            mode: {
                type: String,
                enum: ["light", "dark"],
                default: "dark"
            }
        },
        visibility: {
            type: String,
            enum: ["PRIVATE", "UNLISTED", "PUBLIC"],
            default: "PRIVATE"
        },
        joinPolicy: {
            type: String,
            enum: ["INVITE_ONLY", "REQUEST", "OPEN"],
            default: "INVITE_ONLY"
        }
    },
    {
        timestamps: true
    }
);

export const Space = model<ISpace>("Space", spaceSchema);
