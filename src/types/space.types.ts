export interface ISpace {
    _id: string;
    name: string;
    description?: string;
    ownerID: string;
    status: 'Active' | 'Inactive';
    createdAt: Date;
    updatedAt: Date;
}

export interface ICreateSpace {
    name: string;
    description?: string;
    ownerID: string;
}

export interface IUpdateSpace {
    name?: string;
    description?: string;
    status?: 'Active' | 'Inactive';
}
