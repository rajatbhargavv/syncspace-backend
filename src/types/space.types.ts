
export interface ISpace {
    _id: String;
    name: String;
    description?: String;
    ownerID: String;
    status: 'Active' | 'Inactive';
    createdAt: Date;
    updatedAt: Date;
}
