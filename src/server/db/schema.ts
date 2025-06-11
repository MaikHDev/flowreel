import {relations, sql} from "drizzle-orm";
import {customType, index, pgEnum, pgTableCreator, primaryKey, unique} from "drizzle-orm/pg-core";
import {type AdapterAccount} from "next-auth/adapters";

/**
 * This is an example of how to use the multi-project schema feature of Drizzle ORM. Use the same
 * database instance for multiple projects.
 *
 * @see https://orm.drizzle.team/docs/goodies#multi-project-schema
 */
export const createTable = pgTableCreator((name) => `flowreel_${name}`);

export const Actions = pgEnum('Actions',
    ['create', 'read', 'update', 'delete']);
export const ConversationTypes = pgEnum('ConversationTypes',
    ['direct', 'group']);
export const MessageTypes = pgEnum('MessageTypes',
    ['text', 'image', 'video', 'audio']);
export const ParticipantRoles = pgEnum('ParticipantRoles',
    ['member', 'admin']);
export const MediaContext = pgEnum('MediaContext',
    ['post', 'avatar', 'groupPicture', 'attachment']);
export const Visibility = pgEnum('Visibility',
    ['public', 'private']);
export const messages = createTable(
    "messages",
    (d) => ({
        id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
        senderId: d
            .varchar({length: 255})
            .notNull()
            .references(() => users.id),
        conversationId: d
            .integer()
            .notNull()
            .references(() => conversations.id),
        content: d
            .text(),
        type: MessageTypes('MessageTypes').notNull(),
        createdAt: d
            .timestamp({withTimezone: true})
            .default(sql`CURRENT_TIMESTAMP`)
            .notNull(),
        updatedAt: d.timestamp({withTimezone: true}).$onUpdate(() => new Date())
    }),
    (t) => [
        index().on(t.senderId),
        index().on(t.conversationId),
    ],
);
export const messageRelations = relations(messages, ({one}) => ({
    sender: one(users, {fields: [messages.senderId], references: [users.id]}),
    conversation: one(conversations, {fields: [messages.conversationId], references: [conversations.id]}),
}));

export const messagesReadStatus = createTable(
    "messagesReadStatus",
    (d) => ({
        id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
        userId: d
            .varchar({length: 255})
            .notNull()
            .references(() => users.id),
        messageId: d
            .integer()
            .notNull()
            .references(() => messages.id),
        readAt: d
            .timestamp({withTimezone: true})
            .default(sql`CURRENT_TIMESTAMP`)
            .notNull(),
    }),
    (t) => [
        unique().on(t.userId, t.messageId),
        index().on(t.userId),
        index().on(t.messageId),
    ],
);
export const messageReadRelations = relations(messagesReadStatus, ({one}) => ({
    user: one(users, {fields: [messagesReadStatus.userId], references: [users.id]}),
    message: one(messages, {fields: [messagesReadStatus.messageId], references: [messages.id]}),
}));


export const users = createTable("user", (d) => ({
    id: d
        .varchar({length: 255})
        .notNull()
        .primaryKey()
        .$defaultFn(() => crypto.randomUUID()),
    name: d.varchar({length: 30}).notNull(),
    email: d.varchar({length: 255}).notNull(),
    emailVerified: d
        .timestamp({
            mode: "date",
            withTimezone: true,
        })
        .default(sql`CURRENT_TIMESTAMP`),
    image: d.text(),
    createdAt: d
        .timestamp({withTimezone: true})
        .default(sql`CURRENT_TIMESTAMP`)
        .notNull(),
}));
export const usersRelations = relations(users, ({many, one}) => ({
    // Many
    accounts: many(accounts),
    messages: many(messages),
    messagesRead: many(messagesReadStatus),


    // One

}));

export const profiles = createTable("profiles", (d) => ({
    id: d
        .varchar({length: 255})
        .notNull()
        .primaryKey()
        .references(() => users.id),
    avatar: d.integer().notNull().references(() => media.id),
    displayName: d.varchar({length: 30}),
}));
export const profilesRelations = relations(profiles, ({many, one}) => ({
    profilePrivacy: many(profilePrivacy),
    avatar: one(media, {fields: [profiles.avatar], references: [media.id]})
}));

export const profilePrivacy = createTable("profilePrivacy", (d) => ({
        profileId: d
            .varchar({length: 255})
            .notNull()
            .references(() => profiles.id),
        privacyName: d.varchar({length: 30}).notNull().references(() => privacySettings.name),
    }),
    (t) => []
);
export const profilePrivacyRelations = relations(profilePrivacy, ({one}) => ({
    profile: one(profiles, {fields: [profilePrivacy.profileId], references: [profiles.id]}),
    privacySetting: one(privacySettings, {fields: [profilePrivacy.privacyName], references: [privacySettings.name]}),
}));

export const privacySettings = createTable("privacySettings", (d) => ({
        name: d
            .varchar({length: 30})
            .notNull()
            .unique()
            .primaryKey(),
        resource: d.varchar({length: 30}).notNull(),
        visibility: Visibility('Visibility').notNull(),
    }),
);
export const privacySettingsRelations = relations(privacySettings, ({many}) => ({
    profilePrivacy: many(profilePrivacy),
}));

export const accounts = createTable(
    "account",
    (d) => ({
        userId: d
            .varchar({length: 255})
            .notNull()
            .references(() => users.id),
        type: d.varchar({length: 255}).$type<AdapterAccount["type"]>().notNull(),
        provider: d.varchar({length: 255}).notNull(),
        providerAccountId: d.varchar({length: 255}).notNull(),
        refresh_token: d.text(),
        access_token: d.text(),
        expires_at: d.integer(),
        token_type: d.varchar({length: 255}),
        scope: d.varchar({length: 255}),
        id_token: d.text(),
        session_state: d.varchar({length: 255}),
    }),
    (t) => [
        primaryKey({columns: [t.provider, t.providerAccountId]}),
        index().on(t.userId),
    ],
);
export const accountsRelations = relations(accounts, ({one}) => ({
    user: one(users, {fields: [accounts.userId], references: [users.id]}),
}));

export const sessions = createTable(
    "session",
    (d) => ({
        sessionToken: d.varchar({length: 255}).notNull().primaryKey(),
        userId: d
            .varchar({length: 255})
            .notNull()
            .references(() => users.id),
        expires: d.timestamp({mode: "date", withTimezone: true}).notNull(),
    }),
    (t) => [index().on(t.userId)],
);

export const sessionsRelations = relations(sessions, ({one}) => ({
    user: one(users, {fields: [sessions.userId], references: [users.id]}),
}));

export const verificationTokens = createTable(
    "verification_token",
    (d) => ({
        identifier: d.varchar({length: 255}).notNull(),
        token: d.varchar({length: 255}).notNull(),
        expires: d.timestamp({mode: "date", withTimezone: true}).notNull(),
    }),
    (t) => [primaryKey({columns: [t.identifier, t.token]})],
);

export const conversations = createTable(
    "conversations",
    (d) => ({
        id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
        createdByUser: d.varchar({length: 256}).references(() => users.id),
        groupPicture: d.integer().references(() => media.id),
        type: ConversationTypes('ConversationTypes').notNull(),
        name: d.varchar({length: 30}),
        description: d.text(),
        lastMessageAt: d.timestamp({withTimezone: true}).$onUpdate(() => new Date()),
        createdAt: d
            .timestamp({withTimezone: true})
            .default(sql`CURRENT_TIMESTAMP`)
            .notNull(),
    }),
    (t) => [
        index().on(t.lastMessageAt),
    ],
);
export const conversationRelations = relations(conversations, ({one}) => ({
    createdByUser: one(users, {fields: [conversations.createdByUser], references: [users.id]}),
    groupPicture: one(media, {fields: [conversations.groupPicture], references: [media.id]}),
}));

export const conversationParticipants = createTable(
    "conversationParticipants",
    (d) => ({
        id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
        conversationId: d.integer().notNull().references(() => conversations.id),
        userId: d.varchar({length: 255}).notNull().references(() => users.id),
        role: ParticipantRoles('role').default('member'),
        joinedAt: d
            .timestamp({withTimezone: true})
            .default(sql`CURRENT_TIMESTAMP`)
            .notNull(),
        leftAt: d.timestamp({withTimezone: true}).$onUpdate(() => new Date()),
        isActive: d.boolean(),
    }),
    (t) => [
        unique().on(t.conversationId, t.userId),
        index().on(t.conversationId),
        index().on(t.userId),
    ],
);
export const conversationParticipantsRelations = relations(conversationParticipants, ({one}) => ({
    conversation: one(conversations, {
        fields: [conversationParticipants.conversationId],
        references: [conversations.id]
    }),
    user: one(users, {fields: [conversationParticipants.userId], references: [users.id]}),
}));

export const roles = createTable(
    "roles",
    (d) => ({
        id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
        roleName: d.varchar({length: 30}).notNull(),
        description: d.text(),
        createdAt: d
            .timestamp({withTimezone: true})
            .default(sql`CURRENT_TIMESTAMP`)
            .notNull(),
        updatedAt: d.timestamp({withTimezone: true}).$onUpdate(() => new Date()),
        isActive: d.boolean(),
    }),
);
export const rolesRelations = relations(roles, ({many}) => ({
    userRole: many(userRoles),
    rolePermission: many(rolePermissions),
}));

export const userRoles = createTable(
    "userRoles",
    (d) => ({
        roleId: d.integer().notNull().references(() => roles.id),
        userId: d.varchar({length: 255}).notNull().unique().references(() => users.id),
        assignedAt: d
            .timestamp({withTimezone: true})
            .default(sql`CURRENT_TIMESTAMP`)
            .notNull(),
    }),
    (t) => [
        primaryKey({columns: [t.roleId, t.userId]}),
        index().on(t.roleId),
        index().on(t.userId),
    ],
);
export const userRolesRelations = relations(userRoles, ({one}) => ({
    role: one(roles, {fields: [userRoles.roleId], references: [roles.id]}),
    user: one(users, {fields: [userRoles.userId], references: [users.id]}),
}));

export const permissions = createTable(
    "permissions",
    (d) => ({
        id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
        name: d.varchar({length: 30}).notNull().unique(),
        resource: d.varchar({length: 30}).notNull(),
        action: Actions('action').notNull(),
        description: d.text(),
        createdAt: d
            .timestamp({withTimezone: true})
            .default(sql`CURRENT_TIMESTAMP`)
            .notNull(),
    }),
);
export const permissionRelations = relations(permissions, ({many}) => ({
    rolePermission: many(rolePermissions),
}));

export const rolePermissions = createTable(
    "rolePermissions",
    (d) => ({
        roleId: d.integer().notNull().references(() => roles.id),
        permissionId: d.integer().notNull().references(() => permissions.id),
        assignedAt: d
            .timestamp({withTimezone: true})
            .default(sql`CURRENT_TIMESTAMP`)
            .notNull(),
    }),
    (t) => [
        primaryKey({columns: [t.roleId, t.permissionId]}),
        t.roleId,
        t.permissionId,
    ]
);
export const rolePermissionsRelations = relations(rolePermissions, ({one}) => ({
    role: one(roles, {fields: [rolePermissions.roleId], references: [roles.id]}),
    permission: one(permissions, {fields: [rolePermissions.permissionId], references: [permissions.id]}),
}));

export const posts = createTable(
    "post",
    (d) => ({
        id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
        userId: d
            .varchar({length: 255})
            .notNull()
            .references(() => users.id),
        message: d.text(),
        createdAt: d
            .timestamp({withTimezone: true})
            .default(sql`CURRENT_TIMESTAMP`)
            .notNull(),
    }),
    (t) => [
        index().on(t.userId, t.createdAt),
        index().on(t.userId),
    ],
);
export const postsRelations = relations(posts, ({one}) => ({
    user: one(users, {fields: [posts.userId], references: [users.id]}),
}));

export const userLikedPosts = createTable(
    "userLikedPosts",
    (d) => ({
        userId: d
            .varchar({length: 255})
            .notNull()
            .references(() => users.id),
        postId: d
            .integer()
            .notNull()
            .references(() => posts.id),
        dateLiked: d
            .timestamp({withTimezone: true})
            .default(sql`CURRENT_TIMESTAMP`)
            .notNull(),
    }),
    (t) => [
        primaryKey({columns: [t.userId, t.postId]}),
        index().on(t.userId),
        index().on(t.postId),
        index().on(t.dateLiked),
    ],
);
export const userLikedPostsRelations = relations(userLikedPosts, ({one}) => ({
    user: one(users, {fields: [userLikedPosts.userId], references: [users.id]}),
    post: one(posts, {fields: [userLikedPosts.userId], references: [posts.id]}),
}));

export const tags = createTable(
    "tags",
    (d) => ({
        name: d
            .varchar({length: 30})
            .notNull()
            .unique()
            .primaryKey(),
        usageCount: d
            .integer()
            .notNull()
            .default(0),
    }),
);
export const tagsRelations = relations(tags, ({many}) => ({
    postTag: many(postTags),
}));

export const postTags = createTable(
    "postTags",
    (d) => ({
        tagName: d
            .varchar({length: 30})
            .notNull()
            .references(() => tags.name),
        postId: d
            .integer()
            .notNull()
            .references(() => posts.id),
    }),
    (t) => [
        primaryKey({columns: [t.tagName, t.postId]}),
        index().on(t.tagName),
        index().on(t.postId),
    ],
);
export const postTagsRelations = relations(postTags, ({one}) => ({
    tag: one(tags, {fields: [postTags.tagName], references: [tags.name]}),
    post: one(posts, {fields: [postTags.postId], references: [posts.id]}),
}));

export const postUserTags = createTable(
    "postUserTags",
    (d) => ({
        userId: d
            .varchar({length: 255})
            .notNull()
            .references(() => users.id),
        postId: d
            .integer()
            .notNull()
            .references(() => posts.id),
    }),
    (t) => [
        primaryKey({columns: [t.userId, t.postId]}),
        index().on(t.userId),
        index().on(t.postId),
    ],
);
export const postUserTagsRelations = relations(postUserTags, ({one}) => ({
    user: one(users, {fields: [postUserTags.userId], references: [users.id]}),
    post: one(posts, {fields: [postUserTags.userId], references: [posts.id]}),
}));

export const comments = createTable(
    "comments",
    (d) => ({
        id: d
            .integer()
            .primaryKey()
            .generatedByDefaultAsIdentity(),
        userId: d
            .varchar({length: 255})
            .notNull()
            .references(() => users.id),
        postId: d
            .integer()
            .notNull()
            .references(() => posts.id),
        parentId: d.integer(),
        content: d.text().notNull(),
        createdAt: d
            .timestamp({withTimezone: true})
            .default(sql`CURRENT_TIMESTAMP`)
            .notNull(),
        updatedAt: d.timestamp({withTimezone: true}).$onUpdate(() => new Date()),
    }),
    (t) => [
        index().on(t.userId),
        index().on(t.postId),
    ],
);
export const commentsRelations = relations(comments, ({one, many}) => ({
    user: one(users, {fields: [comments.userId], references: [users.id]}),
    post: one(posts, {fields: [comments.userId], references: [posts.id]}),
    parent: one(comments, {fields: [comments.parentId], references: [comments.id]}),
    replies: many(comments),
}));

const bytea = customType<{ data: Buffer; notNull: false; default: false }>({
    dataType() {
        return 'bytea';
    },
});

export const media = createTable(
    "media",
    (d) => ({
        id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
        postId: d
            .integer()
            .references(() => posts.id),
        data: bytea(),
        name: d.varchar({length: 100}).notNull(),
        type: d.varchar({length: 30}).notNull(),
        context: MediaContext('context').notNull(),
        uploadedAt: d
            .timestamp({withTimezone: true})
            .default(sql`CURRENT_TIMESTAMP`)
            .notNull(),
    }),
    (t) => [
        index().on(t.data),
        index().on(t.name),
    ],
);
export const mediaRelations = relations(media, ({one}) => ({
    post: one(posts, {fields: [media.postId], references: [posts.id]}),
}));