import { randomUUID } from 'crypto';
import { model, Schema } from 'mongoose';

import { ISpace } from '../types/space.types.js';

const spaceSchema = new Schema<ISpace>(
    {
        _id: {
            type: String,
            default : () => 'Space_' + randomUUID()
        },
        name:{
            type: String,
            required: true
        },
        description:{
            type: String,
            required: false
        },
        ownerID:{
            type: String,
            ref:"User",
            required: true
        },
        status:{
            type: String,
            enum: ['Active', 'Inactive'],
            default: 'Active'
        },
        
    },{
        timestamps: true
    }
)

export const Space = model<ISpace>("Space",spaceSchema);