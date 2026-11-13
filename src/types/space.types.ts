export type SpaceKind = "OUR_HOME" | "BUILDERS_CIRCLE" | "STUDIO" | "MY_CORNER" | "CUSTOM";
export type ThemePreset = "HEARTH" | "NEON_GRID" | "IVORY_INK" | "ORBIT";
export type ThemeMode = "light" | "dark";
export type SpaceVisibility = "PRIVATE" | "UNLISTED" | "PUBLIC";
export type SpaceJoinPolicy = "INVITE_ONLY" | "REQUEST" | "OPEN";
export type SpacePermission = "OWNER_ONLY" | "OWNER_AND_CREATOR" | "ALL_MEMBERS";

export interface ISpaceTheme {
    preset: ThemePreset;
    mode: ThemeMode;
}

export interface ISpace {
    _id: string;
    name: string;
    description?: string;
    ownerId: string;
    status: 'Active' | 'Inactive';
    spaceType?: 'Personal' | 'Shared';
    kind: SpaceKind;
    theme: ISpaceTheme;
    visibility: SpaceVisibility;
    joinPolicy: SpaceJoinPolicy;
    assigneePermission: SpacePermission;
    invitePermission: SpacePermission;
    createdAt: Date;
    updatedAt: Date;
}

export interface ICreateSpace {
    name: string;
    description?: string;
    ownerId: string;
    kind?: SpaceKind;
    theme?: Partial<ISpaceTheme>;
    visibility?: SpaceVisibility;
    joinPolicy?: SpaceJoinPolicy;
    assigneePermission?: SpacePermission;
    invitePermission?: SpacePermission;
    spaceType?: 'Personal' | 'Shared';
}

export interface IUpdateSpace {
    name?: string;
    description?: string;
    status?: 'Active' | 'Inactive';
    kind?: SpaceKind;
    theme?: Partial<ISpaceTheme>;
    visibility?: SpaceVisibility;
    joinPolicy?: SpaceJoinPolicy;
    assigneePermission?: SpacePermission;
    invitePermission?: SpacePermission;
}
