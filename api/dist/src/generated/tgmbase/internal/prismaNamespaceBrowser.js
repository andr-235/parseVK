import * as runtime from "@prisma/client/runtime/index-browser";
export const Decimal = runtime.Decimal;
export const NullTypes = {
    DbNull: runtime.NullTypes.DbNull,
    JsonNull: runtime.NullTypes.JsonNull,
    AnyNull: runtime.NullTypes.AnyNull,
};
export const DbNull = runtime.DbNull;
export const JsonNull = runtime.JsonNull;
export const AnyNull = runtime.AnyNull;
export const ModelName = {
    channel: 'channel',
    group: 'group',
    keyword: 'keyword',
    message: 'message',
    snitch_admin: 'snitch_admin',
    supergroup: 'supergroup',
    telegramnotify: 'telegramnotify',
    user: 'user',
    DlImportBatch: 'DlImportBatch',
    DlImportFile: 'DlImportFile',
    DlContact: 'DlContact',
    DlMatchRun: 'DlMatchRun',
    DlMatchResult: 'DlMatchResult',
    DlMatchResultChat: 'DlMatchResultChat',
    DlMatchResultMessage: 'DlMatchResultMessage'
};
export const TransactionIsolationLevel = runtime.makeStrictEnum({
    ReadUncommitted: 'ReadUncommitted',
    ReadCommitted: 'ReadCommitted',
    RepeatableRead: 'RepeatableRead',
    Serializable: 'Serializable'
});
export const ChannelScalarFieldEnum = {
    id: 'id',
    channel_id: 'channel_id',
    title: 'title',
    date: 'date',
    scam: 'scam',
    username: 'username',
    participants_count: 'participants_count',
    region: 'region',
    description: 'description',
    upd_date: 'upd_date'
};
export const GroupScalarFieldEnum = {
    id: 'id',
    group_id: 'group_id',
    title: 'title',
    participants_count: 'participants_count',
    date: 'date',
    region: 'region',
    description: 'description',
    upd_date: 'upd_date'
};
export const KeywordScalarFieldEnum = {
    id: 'id',
    word: 'word',
    declension: 'declension',
    region: 'region'
};
export const MessageScalarFieldEnum = {
    id: 'id',
    message_id: 'message_id',
    peer_id: 'peer_id',
    date: 'date',
    message: 'message',
    from_id: 'from_id',
    forwarded: 'forwarded',
    reply_to: 'reply_to',
    media: 'media',
    keywords: 'keywords'
};
export const Snitch_adminScalarFieldEnum = {
    id: 'id',
    login: 'login',
    password: 'password',
    last_login: 'last_login'
};
export const SupergroupScalarFieldEnum = {
    id: 'id',
    supergroup_id: 'supergroup_id',
    title: 'title',
    username: 'username',
    participants_count: 'participants_count',
    scam: 'scam',
    date: 'date',
    region: 'region',
    description: 'description',
    upd_date: 'upd_date'
};
export const TelegramnotifyScalarFieldEnum = {
    id: 'id',
    telegram_id: 'telegram_id',
    username: 'username',
    timestamp: 'timestamp'
};
export const UserScalarFieldEnum = {
    id: 'id',
    user_id: 'user_id',
    bot: 'bot',
    scam: 'scam',
    premium: 'premium',
    first_name: 'first_name',
    last_name: 'last_name',
    username: 'username',
    phone: 'phone',
    upd_date: 'upd_date'
};
export const DlImportBatchScalarFieldEnum = {
    id: 'id',
    status: 'status',
    filesTotal: 'filesTotal',
    filesSuccess: 'filesSuccess',
    filesFailed: 'filesFailed',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
};
export const DlImportFileScalarFieldEnum = {
    id: 'id',
    batchId: 'batchId',
    originalFileName: 'originalFileName',
    fileHash: 'fileHash',
    status: 'status',
    rowsTotal: 'rowsTotal',
    rowsSuccess: 'rowsSuccess',
    rowsFailed: 'rowsFailed',
    error: 'error',
    isActive: 'isActive',
    replacedFileId: 'replacedFileId',
    createdAt: 'createdAt',
    finishedAt: 'finishedAt',
    updatedAt: 'updatedAt'
};
export const DlContactScalarFieldEnum = {
    id: 'id',
    importFileId: 'importFileId',
    telegramId: 'telegramId',
    username: 'username',
    phone: 'phone',
    firstName: 'firstName',
    lastName: 'lastName',
    description: 'description',
    region: 'region',
    joinedAt: 'joinedAt',
    channelsRaw: 'channelsRaw',
    fullName: 'fullName',
    address: 'address',
    vkUrl: 'vkUrl',
    email: 'email',
    telegramContact: 'telegramContact',
    instagram: 'instagram',
    viber: 'viber',
    odnoklassniki: 'odnoklassniki',
    birthDateText: 'birthDateText',
    usernameExtra: 'usernameExtra',
    geo: 'geo',
    sourceRowIndex: 'sourceRowIndex',
    createdAt: 'createdAt'
};
export const DlMatchRunScalarFieldEnum = {
    id: 'id',
    status: 'status',
    contactsTotal: 'contactsTotal',
    matchesTotal: 'matchesTotal',
    strictMatchesTotal: 'strictMatchesTotal',
    usernameMatchesTotal: 'usernameMatchesTotal',
    phoneMatchesTotal: 'phoneMatchesTotal',
    createdAt: 'createdAt',
    finishedAt: 'finishedAt',
    error: 'error'
};
export const DlMatchResultScalarFieldEnum = {
    id: 'id',
    runId: 'runId',
    dlContactId: 'dlContactId',
    tgmbaseUserId: 'tgmbaseUserId',
    strictTelegramIdMatch: 'strictTelegramIdMatch',
    usernameMatch: 'usernameMatch',
    phoneMatch: 'phoneMatch',
    chatActivityMatch: 'chatActivityMatch',
    dlContactSnapshot: 'dlContactSnapshot',
    tgmbaseUserSnapshot: 'tgmbaseUserSnapshot',
    createdAt: 'createdAt'
};
export const DlMatchResultChatScalarFieldEnum = {
    id: 'id',
    resultId: 'resultId',
    peerId: 'peerId',
    chatType: 'chatType',
    title: 'title',
    isExcluded: 'isExcluded',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
};
export const DlMatchResultMessageScalarFieldEnum = {
    id: 'id',
    resultId: 'resultId',
    peerId: 'peerId',
    messageId: 'messageId',
    messageDate: 'messageDate',
    text: 'text',
    createdAt: 'createdAt'
};
export const SortOrder = {
    asc: 'asc',
    desc: 'desc'
};
export const JsonNullValueInput = {
    JsonNull: JsonNull
};
export const NullableJsonNullValueInput = {
    DbNull: DbNull,
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
//# sourceMappingURL=prismaNamespaceBrowser.js.map