import * as runtime from "@prisma/client/runtime/client";
export const PrismaClientKnownRequestError = runtime.PrismaClientKnownRequestError;
export const PrismaClientUnknownRequestError = runtime.PrismaClientUnknownRequestError;
export const PrismaClientRustPanicError = runtime.PrismaClientRustPanicError;
export const PrismaClientInitializationError = runtime.PrismaClientInitializationError;
export const PrismaClientValidationError = runtime.PrismaClientValidationError;
export const sql = runtime.sqltag;
export const empty = runtime.empty;
export const join = runtime.join;
export const raw = runtime.raw;
export const Sql = runtime.Sql;
export const Decimal = runtime.Decimal;
export const getExtensionContext = runtime.Extensions.getExtensionContext;
export const prismaVersion = {
    client: "7.3.0",
    engine: "9d6ad21cbbceab97458517b147a6a09ff43aa735"
};
export const NullTypes = {
    DbNull: runtime.NullTypes.DbNull,
    JsonNull: runtime.NullTypes.JsonNull,
    AnyNull: runtime.NullTypes.AnyNull,
};
export const DbNull = runtime.DbNull;
export const JsonNull = runtime.JsonNull;
export const AnyNull = runtime.AnyNull;
export const ModelName = {
    Task: 'Task',
    TaskAuditLog: 'TaskAuditLog',
    ExportJob: 'ExportJob',
    FriendRecord: 'FriendRecord',
    JobLog: 'JobLog',
    User: 'User',
    TaskAutomationSettings: 'TaskAutomationSettings',
    Group: 'Group',
    Post: 'Post',
    Comment: 'Comment',
    Listing: 'Listing',
    Author: 'Author',
    PhotoAnalysis: 'PhotoAnalysis',
    Keyword: 'Keyword',
    KeywordForm: 'KeywordForm',
    KeywordFormExclusion: 'KeywordFormExclusion',
    MonitoringGroup: 'MonitoringGroup',
    CommentKeywordMatch: 'CommentKeywordMatch',
    WatchlistSettings: 'WatchlistSettings',
    WatchlistAuthor: 'WatchlistAuthor',
    TelegramChat: 'TelegramChat',
    TelegramUser: 'TelegramUser',
    TelegramChatMember: 'TelegramChatMember',
    TelegramSession: 'TelegramSession',
    TelegramSettings: 'TelegramSettings'
};
export const TransactionIsolationLevel = runtime.makeStrictEnum({
    ReadUncommitted: 'ReadUncommitted',
    ReadCommitted: 'ReadCommitted',
    RepeatableRead: 'RepeatableRead',
    Serializable: 'Serializable'
});
export const TaskScalarFieldEnum = {
    id: 'id',
    title: 'title',
    description: 'description',
    completed: 'completed',
    totalItems: 'totalItems',
    processedItems: 'processedItems',
    progress: 'progress',
    status: 'status',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
};
export const TaskAuditLogScalarFieldEnum = {
    id: 'id',
    taskId: 'taskId',
    eventType: 'eventType',
    eventData: 'eventData',
    createdAt: 'createdAt'
};
export const ExportJobScalarFieldEnum = {
    id: 'id',
    createdAt: 'createdAt',
    status: 'status',
    params: 'params',
    vkUserId: 'vkUserId',
    okUserId: 'okUserId',
    totalCount: 'totalCount',
    fetchedCount: 'fetchedCount',
    warning: 'warning',
    error: 'error',
    xlsxPath: 'xlsxPath',
    docxPath: 'docxPath'
};
export const FriendRecordScalarFieldEnum = {
    id: 'id',
    jobId: 'jobId',
    vkFriendId: 'vkFriendId',
    okFriendId: 'okFriendId',
    payload: 'payload',
    createdAt: 'createdAt'
};
export const JobLogScalarFieldEnum = {
    id: 'id',
    jobId: 'jobId',
    level: 'level',
    message: 'message',
    meta: 'meta',
    createdAt: 'createdAt'
};
export const UserScalarFieldEnum = {
    id: 'id',
    username: 'username',
    passwordHash: 'passwordHash',
    role: 'role',
    isTemporaryPassword: 'isTemporaryPassword',
    refreshTokenHash: 'refreshTokenHash',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
};
export const TaskAutomationSettingsScalarFieldEnum = {
    id: 'id',
    enabled: 'enabled',
    runHour: 'runHour',
    runMinute: 'runMinute',
    postLimit: 'postLimit',
    timezoneOffsetMinutes: 'timezoneOffsetMinutes',
    lastRunAt: 'lastRunAt',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
};
export const GroupScalarFieldEnum = {
    id: 'id',
    vkId: 'vkId',
    name: 'name',
    screenName: 'screenName',
    isClosed: 'isClosed',
    deactivated: 'deactivated',
    type: 'type',
    photo50: 'photo50',
    photo100: 'photo100',
    photo200: 'photo200',
    activity: 'activity',
    ageLimits: 'ageLimits',
    description: 'description',
    membersCount: 'membersCount',
    status: 'status',
    verified: 'verified',
    wall: 'wall',
    addresses: 'addresses',
    city: 'city',
    counters: 'counters',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
};
export const PostScalarFieldEnum = {
    id: 'id',
    ownerId: 'ownerId',
    vkPostId: 'vkPostId',
    fromId: 'fromId',
    postedAt: 'postedAt',
    text: 'text',
    attachments: 'attachments',
    commentsCount: 'commentsCount',
    commentsCanPost: 'commentsCanPost',
    commentsGroupsCanPost: 'commentsGroupsCanPost',
    commentsCanClose: 'commentsCanClose',
    commentsCanOpen: 'commentsCanOpen',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
    groupId: 'groupId'
};
export const CommentScalarFieldEnum = {
    id: 'id',
    postId: 'postId',
    ownerId: 'ownerId',
    vkCommentId: 'vkCommentId',
    fromId: 'fromId',
    text: 'text',
    publishedAt: 'publishedAt',
    likesCount: 'likesCount',
    parentsStack: 'parentsStack',
    threadCount: 'threadCount',
    threadItems: 'threadItems',
    attachments: 'attachments',
    replyToUser: 'replyToUser',
    replyToComment: 'replyToComment',
    authorVkId: 'authorVkId',
    isDeleted: 'isDeleted',
    isRead: 'isRead',
    source: 'source',
    watchlistAuthorId: 'watchlistAuthorId',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
};
export const ListingScalarFieldEnum = {
    id: 'id',
    source: 'source',
    externalId: 'externalId',
    title: 'title',
    description: 'description',
    url: 'url',
    price: 'price',
    currency: 'currency',
    address: 'address',
    city: 'city',
    latitude: 'latitude',
    longitude: 'longitude',
    rooms: 'rooms',
    areaTotal: 'areaTotal',
    areaLiving: 'areaLiving',
    areaKitchen: 'areaKitchen',
    floor: 'floor',
    floorsTotal: 'floorsTotal',
    publishedAt: 'publishedAt',
    contactName: 'contactName',
    contactPhone: 'contactPhone',
    images: 'images',
    sourceAuthorName: 'sourceAuthorName',
    sourceAuthorPhone: 'sourceAuthorPhone',
    sourceAuthorUrl: 'sourceAuthorUrl',
    sourcePostedAt: 'sourcePostedAt',
    sourceParsedAt: 'sourceParsedAt',
    manualOverrides: 'manualOverrides',
    manualNote: 'manualNote',
    archived: 'archived',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
};
export const AuthorScalarFieldEnum = {
    id: 'id',
    vkUserId: 'vkUserId',
    firstName: 'firstName',
    lastName: 'lastName',
    deactivated: 'deactivated',
    domain: 'domain',
    screenName: 'screenName',
    isClosed: 'isClosed',
    canAccessClosed: 'canAccessClosed',
    photo50: 'photo50',
    photo100: 'photo100',
    photo200: 'photo200',
    photo200Orig: 'photo200Orig',
    photo400Orig: 'photo400Orig',
    photoMax: 'photoMax',
    photoMaxOrig: 'photoMaxOrig',
    photoId: 'photoId',
    city: 'city',
    country: 'country',
    about: 'about',
    activities: 'activities',
    bdate: 'bdate',
    books: 'books',
    career: 'career',
    connections: 'connections',
    contacts: 'contacts',
    counters: 'counters',
    education: 'education',
    followersCount: 'followersCount',
    homeTown: 'homeTown',
    interests: 'interests',
    lastSeen: 'lastSeen',
    maidenName: 'maidenName',
    military: 'military',
    movies: 'movies',
    music: 'music',
    nickname: 'nickname',
    occupation: 'occupation',
    personal: 'personal',
    relatives: 'relatives',
    relation: 'relation',
    schools: 'schools',
    sex: 'sex',
    site: 'site',
    status: 'status',
    timezone: 'timezone',
    tv: 'tv',
    universities: 'universities',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
    verifiedAt: 'verifiedAt'
};
export const PhotoAnalysisScalarFieldEnum = {
    id: 'id',
    authorId: 'authorId',
    photoUrl: 'photoUrl',
    photoVkId: 'photoVkId',
    analysisResult: 'analysisResult',
    hasSuspicious: 'hasSuspicious',
    suspicionLevel: 'suspicionLevel',
    categories: 'categories',
    confidence: 'confidence',
    explanation: 'explanation',
    analyzedAt: 'analyzedAt',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
};
export const KeywordScalarFieldEnum = {
    id: 'id',
    word: 'word',
    category: 'category',
    isPhrase: 'isPhrase',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
};
export const KeywordFormScalarFieldEnum = {
    id: 'id',
    keywordId: 'keywordId',
    form: 'form',
    source: 'source',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
};
export const KeywordFormExclusionScalarFieldEnum = {
    id: 'id',
    keywordId: 'keywordId',
    form: 'form',
    createdAt: 'createdAt'
};
export const MonitoringGroupScalarFieldEnum = {
    id: 'id',
    messenger: 'messenger',
    chatId: 'chatId',
    name: 'name',
    category: 'category',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
};
export const CommentKeywordMatchScalarFieldEnum = {
    commentId: 'commentId',
    keywordId: 'keywordId',
    source: 'source',
    createdAt: 'createdAt'
};
export const WatchlistSettingsScalarFieldEnum = {
    id: 'id',
    trackAllComments: 'trackAllComments',
    pollIntervalMinutes: 'pollIntervalMinutes',
    maxAuthors: 'maxAuthors',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
};
export const WatchlistAuthorScalarFieldEnum = {
    id: 'id',
    authorVkId: 'authorVkId',
    sourceCommentId: 'sourceCommentId',
    status: 'status',
    lastCheckedAt: 'lastCheckedAt',
    lastActivityAt: 'lastActivityAt',
    foundCommentsCount: 'foundCommentsCount',
    monitoringStartedAt: 'monitoringStartedAt',
    monitoringStoppedAt: 'monitoringStoppedAt',
    settingsId: 'settingsId',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
};
export const TelegramChatScalarFieldEnum = {
    id: 'id',
    telegramId: 'telegramId',
    type: 'type',
    title: 'title',
    username: 'username',
    accessHash: 'accessHash',
    photoUrl: 'photoUrl',
    description: 'description',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
};
export const TelegramUserScalarFieldEnum = {
    id: 'id',
    telegramId: 'telegramId',
    firstName: 'firstName',
    lastName: 'lastName',
    username: 'username',
    phoneNumber: 'phoneNumber',
    bio: 'bio',
    languageCode: 'languageCode',
    isBot: 'isBot',
    isPremium: 'isPremium',
    deleted: 'deleted',
    restricted: 'restricted',
    verified: 'verified',
    scam: 'scam',
    fake: 'fake',
    min: 'min',
    self: 'self',
    contact: 'contact',
    mutualContact: 'mutualContact',
    accessHash: 'accessHash',
    photoId: 'photoId',
    photoDcId: 'photoDcId',
    photoHasVideo: 'photoHasVideo',
    commonChatsCount: 'commonChatsCount',
    usernames: 'usernames',
    personal: 'personal',
    botInfo: 'botInfo',
    blocked: 'blocked',
    contactRequirePremium: 'contactRequirePremium',
    spam: 'spam',
    closeFriend: 'closeFriend',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
};
export const TelegramChatMemberScalarFieldEnum = {
    id: 'id',
    chatId: 'chatId',
    userId: 'userId',
    status: 'status',
    isAdmin: 'isAdmin',
    isOwner: 'isOwner',
    joinedAt: 'joinedAt',
    leftAt: 'leftAt',
    importedAt: 'importedAt',
    rawPayload: 'rawPayload'
};
export const TelegramSessionScalarFieldEnum = {
    id: 'id',
    session: 'session',
    userId: 'userId',
    username: 'username',
    phoneNumber: 'phoneNumber',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
};
export const TelegramSettingsScalarFieldEnum = {
    id: 'id',
    phoneNumber: 'phoneNumber',
    apiId: 'apiId',
    apiHash: 'apiHash',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
};
export const SortOrder = {
    asc: 'asc',
    desc: 'desc'
};
export const NullableJsonNullValueInput = {
    DbNull: DbNull,
    JsonNull: JsonNull
};
export const JsonNullValueInput = {
    JsonNull: JsonNull
};
export const QueryMode = {
    default: 'default',
    insensitive: 'insensitive'
};
export const NullsOrder = {
    first: 'first',
    last: 'last'
};
export const JsonNullValueFilter = {
    DbNull: DbNull,
    JsonNull: JsonNull,
    AnyNull: AnyNull
};
export const defineExtension = runtime.Extensions.defineExtension;
//# sourceMappingURL=prismaNamespace.js.map