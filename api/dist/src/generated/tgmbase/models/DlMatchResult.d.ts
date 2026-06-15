import type * as runtime from "@prisma/client/runtime/client";
import type * as Prisma from "../internal/prismaNamespace.js";
export type DlMatchResultModel = runtime.Types.Result.DefaultSelection<Prisma.$DlMatchResultPayload>;
export type AggregateDlMatchResult = {
    _count: DlMatchResultCountAggregateOutputType | null;
    _avg: DlMatchResultAvgAggregateOutputType | null;
    _sum: DlMatchResultSumAggregateOutputType | null;
    _min: DlMatchResultMinAggregateOutputType | null;
    _max: DlMatchResultMaxAggregateOutputType | null;
};
export type DlMatchResultAvgAggregateOutputType = {
    id: number | null;
    runId: number | null;
    dlContactId: number | null;
    tgmbaseUserId: number | null;
};
export type DlMatchResultSumAggregateOutputType = {
    id: bigint | null;
    runId: bigint | null;
    dlContactId: bigint | null;
    tgmbaseUserId: bigint | null;
};
export type DlMatchResultMinAggregateOutputType = {
    id: bigint | null;
    runId: bigint | null;
    dlContactId: bigint | null;
    tgmbaseUserId: bigint | null;
    strictTelegramIdMatch: boolean | null;
    usernameMatch: boolean | null;
    phoneMatch: boolean | null;
    chatActivityMatch: boolean | null;
    createdAt: Date | null;
};
export type DlMatchResultMaxAggregateOutputType = {
    id: bigint | null;
    runId: bigint | null;
    dlContactId: bigint | null;
    tgmbaseUserId: bigint | null;
    strictTelegramIdMatch: boolean | null;
    usernameMatch: boolean | null;
    phoneMatch: boolean | null;
    chatActivityMatch: boolean | null;
    createdAt: Date | null;
};
export type DlMatchResultCountAggregateOutputType = {
    id: number;
    runId: number;
    dlContactId: number;
    tgmbaseUserId: number;
    strictTelegramIdMatch: number;
    usernameMatch: number;
    phoneMatch: number;
    chatActivityMatch: number;
    dlContactSnapshot: number;
    tgmbaseUserSnapshot: number;
    createdAt: number;
    _all: number;
};
export type DlMatchResultAvgAggregateInputType = {
    id?: true;
    runId?: true;
    dlContactId?: true;
    tgmbaseUserId?: true;
};
export type DlMatchResultSumAggregateInputType = {
    id?: true;
    runId?: true;
    dlContactId?: true;
    tgmbaseUserId?: true;
};
export type DlMatchResultMinAggregateInputType = {
    id?: true;
    runId?: true;
    dlContactId?: true;
    tgmbaseUserId?: true;
    strictTelegramIdMatch?: true;
    usernameMatch?: true;
    phoneMatch?: true;
    chatActivityMatch?: true;
    createdAt?: true;
};
export type DlMatchResultMaxAggregateInputType = {
    id?: true;
    runId?: true;
    dlContactId?: true;
    tgmbaseUserId?: true;
    strictTelegramIdMatch?: true;
    usernameMatch?: true;
    phoneMatch?: true;
    chatActivityMatch?: true;
    createdAt?: true;
};
export type DlMatchResultCountAggregateInputType = {
    id?: true;
    runId?: true;
    dlContactId?: true;
    tgmbaseUserId?: true;
    strictTelegramIdMatch?: true;
    usernameMatch?: true;
    phoneMatch?: true;
    chatActivityMatch?: true;
    dlContactSnapshot?: true;
    tgmbaseUserSnapshot?: true;
    createdAt?: true;
    _all?: true;
};
export type DlMatchResultAggregateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.DlMatchResultWhereInput;
    orderBy?: Prisma.DlMatchResultOrderByWithRelationInput | Prisma.DlMatchResultOrderByWithRelationInput[];
    cursor?: Prisma.DlMatchResultWhereUniqueInput;
    take?: number;
    skip?: number;
    _count?: true | DlMatchResultCountAggregateInputType;
    _avg?: DlMatchResultAvgAggregateInputType;
    _sum?: DlMatchResultSumAggregateInputType;
    _min?: DlMatchResultMinAggregateInputType;
    _max?: DlMatchResultMaxAggregateInputType;
};
export type GetDlMatchResultAggregateType<T extends DlMatchResultAggregateArgs> = {
    [P in keyof T & keyof AggregateDlMatchResult]: P extends '_count' | 'count' ? T[P] extends true ? number : Prisma.GetScalarType<T[P], AggregateDlMatchResult[P]> : Prisma.GetScalarType<T[P], AggregateDlMatchResult[P]>;
};
export type DlMatchResultGroupByArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.DlMatchResultWhereInput;
    orderBy?: Prisma.DlMatchResultOrderByWithAggregationInput | Prisma.DlMatchResultOrderByWithAggregationInput[];
    by: Prisma.DlMatchResultScalarFieldEnum[] | Prisma.DlMatchResultScalarFieldEnum;
    having?: Prisma.DlMatchResultScalarWhereWithAggregatesInput;
    take?: number;
    skip?: number;
    _count?: DlMatchResultCountAggregateInputType | true;
    _avg?: DlMatchResultAvgAggregateInputType;
    _sum?: DlMatchResultSumAggregateInputType;
    _min?: DlMatchResultMinAggregateInputType;
    _max?: DlMatchResultMaxAggregateInputType;
};
export type DlMatchResultGroupByOutputType = {
    id: bigint;
    runId: bigint;
    dlContactId: bigint;
    tgmbaseUserId: bigint | null;
    strictTelegramIdMatch: boolean;
    usernameMatch: boolean;
    phoneMatch: boolean;
    chatActivityMatch: boolean;
    dlContactSnapshot: runtime.JsonValue;
    tgmbaseUserSnapshot: runtime.JsonValue | null;
    createdAt: Date;
    _count: DlMatchResultCountAggregateOutputType | null;
    _avg: DlMatchResultAvgAggregateOutputType | null;
    _sum: DlMatchResultSumAggregateOutputType | null;
    _min: DlMatchResultMinAggregateOutputType | null;
    _max: DlMatchResultMaxAggregateOutputType | null;
};
type GetDlMatchResultGroupByPayload<T extends DlMatchResultGroupByArgs> = Prisma.PrismaPromise<Array<Prisma.PickEnumerable<DlMatchResultGroupByOutputType, T['by']> & {
    [P in ((keyof T) & (keyof DlMatchResultGroupByOutputType))]: P extends '_count' ? T[P] extends boolean ? number : Prisma.GetScalarType<T[P], DlMatchResultGroupByOutputType[P]> : Prisma.GetScalarType<T[P], DlMatchResultGroupByOutputType[P]>;
}>>;
export type DlMatchResultWhereInput = {
    AND?: Prisma.DlMatchResultWhereInput | Prisma.DlMatchResultWhereInput[];
    OR?: Prisma.DlMatchResultWhereInput[];
    NOT?: Prisma.DlMatchResultWhereInput | Prisma.DlMatchResultWhereInput[];
    id?: Prisma.BigIntFilter<"DlMatchResult"> | bigint | number;
    runId?: Prisma.BigIntFilter<"DlMatchResult"> | bigint | number;
    dlContactId?: Prisma.BigIntFilter<"DlMatchResult"> | bigint | number;
    tgmbaseUserId?: Prisma.BigIntNullableFilter<"DlMatchResult"> | bigint | number | null;
    strictTelegramIdMatch?: Prisma.BoolFilter<"DlMatchResult"> | boolean;
    usernameMatch?: Prisma.BoolFilter<"DlMatchResult"> | boolean;
    phoneMatch?: Prisma.BoolFilter<"DlMatchResult"> | boolean;
    chatActivityMatch?: Prisma.BoolFilter<"DlMatchResult"> | boolean;
    dlContactSnapshot?: Prisma.JsonFilter<"DlMatchResult">;
    tgmbaseUserSnapshot?: Prisma.JsonNullableFilter<"DlMatchResult">;
    createdAt?: Prisma.DateTimeFilter<"DlMatchResult"> | Date | string;
    run?: Prisma.XOR<Prisma.DlMatchRunScalarRelationFilter, Prisma.DlMatchRunWhereInput>;
    dlContact?: Prisma.XOR<Prisma.DlContactScalarRelationFilter, Prisma.DlContactWhereInput>;
    tgmbaseUser?: Prisma.XOR<Prisma.UserNullableScalarRelationFilter, Prisma.userWhereInput> | null;
    chats?: Prisma.DlMatchResultChatListRelationFilter;
    messages?: Prisma.DlMatchResultMessageListRelationFilter;
};
export type DlMatchResultOrderByWithRelationInput = {
    id?: Prisma.SortOrder;
    runId?: Prisma.SortOrder;
    dlContactId?: Prisma.SortOrder;
    tgmbaseUserId?: Prisma.SortOrderInput | Prisma.SortOrder;
    strictTelegramIdMatch?: Prisma.SortOrder;
    usernameMatch?: Prisma.SortOrder;
    phoneMatch?: Prisma.SortOrder;
    chatActivityMatch?: Prisma.SortOrder;
    dlContactSnapshot?: Prisma.SortOrder;
    tgmbaseUserSnapshot?: Prisma.SortOrderInput | Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    run?: Prisma.DlMatchRunOrderByWithRelationInput;
    dlContact?: Prisma.DlContactOrderByWithRelationInput;
    tgmbaseUser?: Prisma.userOrderByWithRelationInput;
    chats?: Prisma.DlMatchResultChatOrderByRelationAggregateInput;
    messages?: Prisma.DlMatchResultMessageOrderByRelationAggregateInput;
};
export type DlMatchResultWhereUniqueInput = Prisma.AtLeast<{
    id?: bigint | number;
    AND?: Prisma.DlMatchResultWhereInput | Prisma.DlMatchResultWhereInput[];
    OR?: Prisma.DlMatchResultWhereInput[];
    NOT?: Prisma.DlMatchResultWhereInput | Prisma.DlMatchResultWhereInput[];
    runId?: Prisma.BigIntFilter<"DlMatchResult"> | bigint | number;
    dlContactId?: Prisma.BigIntFilter<"DlMatchResult"> | bigint | number;
    tgmbaseUserId?: Prisma.BigIntNullableFilter<"DlMatchResult"> | bigint | number | null;
    strictTelegramIdMatch?: Prisma.BoolFilter<"DlMatchResult"> | boolean;
    usernameMatch?: Prisma.BoolFilter<"DlMatchResult"> | boolean;
    phoneMatch?: Prisma.BoolFilter<"DlMatchResult"> | boolean;
    chatActivityMatch?: Prisma.BoolFilter<"DlMatchResult"> | boolean;
    dlContactSnapshot?: Prisma.JsonFilter<"DlMatchResult">;
    tgmbaseUserSnapshot?: Prisma.JsonNullableFilter<"DlMatchResult">;
    createdAt?: Prisma.DateTimeFilter<"DlMatchResult"> | Date | string;
    run?: Prisma.XOR<Prisma.DlMatchRunScalarRelationFilter, Prisma.DlMatchRunWhereInput>;
    dlContact?: Prisma.XOR<Prisma.DlContactScalarRelationFilter, Prisma.DlContactWhereInput>;
    tgmbaseUser?: Prisma.XOR<Prisma.UserNullableScalarRelationFilter, Prisma.userWhereInput> | null;
    chats?: Prisma.DlMatchResultChatListRelationFilter;
    messages?: Prisma.DlMatchResultMessageListRelationFilter;
}, "id">;
export type DlMatchResultOrderByWithAggregationInput = {
    id?: Prisma.SortOrder;
    runId?: Prisma.SortOrder;
    dlContactId?: Prisma.SortOrder;
    tgmbaseUserId?: Prisma.SortOrderInput | Prisma.SortOrder;
    strictTelegramIdMatch?: Prisma.SortOrder;
    usernameMatch?: Prisma.SortOrder;
    phoneMatch?: Prisma.SortOrder;
    chatActivityMatch?: Prisma.SortOrder;
    dlContactSnapshot?: Prisma.SortOrder;
    tgmbaseUserSnapshot?: Prisma.SortOrderInput | Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    _count?: Prisma.DlMatchResultCountOrderByAggregateInput;
    _avg?: Prisma.DlMatchResultAvgOrderByAggregateInput;
    _max?: Prisma.DlMatchResultMaxOrderByAggregateInput;
    _min?: Prisma.DlMatchResultMinOrderByAggregateInput;
    _sum?: Prisma.DlMatchResultSumOrderByAggregateInput;
};
export type DlMatchResultScalarWhereWithAggregatesInput = {
    AND?: Prisma.DlMatchResultScalarWhereWithAggregatesInput | Prisma.DlMatchResultScalarWhereWithAggregatesInput[];
    OR?: Prisma.DlMatchResultScalarWhereWithAggregatesInput[];
    NOT?: Prisma.DlMatchResultScalarWhereWithAggregatesInput | Prisma.DlMatchResultScalarWhereWithAggregatesInput[];
    id?: Prisma.BigIntWithAggregatesFilter<"DlMatchResult"> | bigint | number;
    runId?: Prisma.BigIntWithAggregatesFilter<"DlMatchResult"> | bigint | number;
    dlContactId?: Prisma.BigIntWithAggregatesFilter<"DlMatchResult"> | bigint | number;
    tgmbaseUserId?: Prisma.BigIntNullableWithAggregatesFilter<"DlMatchResult"> | bigint | number | null;
    strictTelegramIdMatch?: Prisma.BoolWithAggregatesFilter<"DlMatchResult"> | boolean;
    usernameMatch?: Prisma.BoolWithAggregatesFilter<"DlMatchResult"> | boolean;
    phoneMatch?: Prisma.BoolWithAggregatesFilter<"DlMatchResult"> | boolean;
    chatActivityMatch?: Prisma.BoolWithAggregatesFilter<"DlMatchResult"> | boolean;
    dlContactSnapshot?: Prisma.JsonWithAggregatesFilter<"DlMatchResult">;
    tgmbaseUserSnapshot?: Prisma.JsonNullableWithAggregatesFilter<"DlMatchResult">;
    createdAt?: Prisma.DateTimeWithAggregatesFilter<"DlMatchResult"> | Date | string;
};
export type DlMatchResultCreateInput = {
    id?: bigint | number;
    strictTelegramIdMatch?: boolean;
    usernameMatch?: boolean;
    phoneMatch?: boolean;
    chatActivityMatch?: boolean;
    dlContactSnapshot: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    tgmbaseUserSnapshot?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    createdAt?: Date | string;
    run: Prisma.DlMatchRunCreateNestedOneWithoutResultsInput;
    dlContact: Prisma.DlContactCreateNestedOneWithoutMatchResultsInput;
    tgmbaseUser?: Prisma.userCreateNestedOneWithoutDlMatchesInput;
    chats?: Prisma.DlMatchResultChatCreateNestedManyWithoutResultInput;
    messages?: Prisma.DlMatchResultMessageCreateNestedManyWithoutResultInput;
};
export type DlMatchResultUncheckedCreateInput = {
    id?: bigint | number;
    runId: bigint | number;
    dlContactId: bigint | number;
    tgmbaseUserId?: bigint | number | null;
    strictTelegramIdMatch?: boolean;
    usernameMatch?: boolean;
    phoneMatch?: boolean;
    chatActivityMatch?: boolean;
    dlContactSnapshot: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    tgmbaseUserSnapshot?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    createdAt?: Date | string;
    chats?: Prisma.DlMatchResultChatUncheckedCreateNestedManyWithoutResultInput;
    messages?: Prisma.DlMatchResultMessageUncheckedCreateNestedManyWithoutResultInput;
};
export type DlMatchResultUpdateInput = {
    id?: Prisma.BigIntFieldUpdateOperationsInput | bigint | number;
    strictTelegramIdMatch?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    usernameMatch?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    phoneMatch?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    chatActivityMatch?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    dlContactSnapshot?: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    tgmbaseUserSnapshot?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    run?: Prisma.DlMatchRunUpdateOneRequiredWithoutResultsNestedInput;
    dlContact?: Prisma.DlContactUpdateOneRequiredWithoutMatchResultsNestedInput;
    tgmbaseUser?: Prisma.userUpdateOneWithoutDlMatchesNestedInput;
    chats?: Prisma.DlMatchResultChatUpdateManyWithoutResultNestedInput;
    messages?: Prisma.DlMatchResultMessageUpdateManyWithoutResultNestedInput;
};
export type DlMatchResultUncheckedUpdateInput = {
    id?: Prisma.BigIntFieldUpdateOperationsInput | bigint | number;
    runId?: Prisma.BigIntFieldUpdateOperationsInput | bigint | number;
    dlContactId?: Prisma.BigIntFieldUpdateOperationsInput | bigint | number;
    tgmbaseUserId?: Prisma.NullableBigIntFieldUpdateOperationsInput | bigint | number | null;
    strictTelegramIdMatch?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    usernameMatch?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    phoneMatch?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    chatActivityMatch?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    dlContactSnapshot?: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    tgmbaseUserSnapshot?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    chats?: Prisma.DlMatchResultChatUncheckedUpdateManyWithoutResultNestedInput;
    messages?: Prisma.DlMatchResultMessageUncheckedUpdateManyWithoutResultNestedInput;
};
export type DlMatchResultCreateManyInput = {
    id?: bigint | number;
    runId: bigint | number;
    dlContactId: bigint | number;
    tgmbaseUserId?: bigint | number | null;
    strictTelegramIdMatch?: boolean;
    usernameMatch?: boolean;
    phoneMatch?: boolean;
    chatActivityMatch?: boolean;
    dlContactSnapshot: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    tgmbaseUserSnapshot?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    createdAt?: Date | string;
};
export type DlMatchResultUpdateManyMutationInput = {
    id?: Prisma.BigIntFieldUpdateOperationsInput | bigint | number;
    strictTelegramIdMatch?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    usernameMatch?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    phoneMatch?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    chatActivityMatch?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    dlContactSnapshot?: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    tgmbaseUserSnapshot?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type DlMatchResultUncheckedUpdateManyInput = {
    id?: Prisma.BigIntFieldUpdateOperationsInput | bigint | number;
    runId?: Prisma.BigIntFieldUpdateOperationsInput | bigint | number;
    dlContactId?: Prisma.BigIntFieldUpdateOperationsInput | bigint | number;
    tgmbaseUserId?: Prisma.NullableBigIntFieldUpdateOperationsInput | bigint | number | null;
    strictTelegramIdMatch?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    usernameMatch?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    phoneMatch?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    chatActivityMatch?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    dlContactSnapshot?: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    tgmbaseUserSnapshot?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type DlMatchResultListRelationFilter = {
    every?: Prisma.DlMatchResultWhereInput;
    some?: Prisma.DlMatchResultWhereInput;
    none?: Prisma.DlMatchResultWhereInput;
};
export type DlMatchResultOrderByRelationAggregateInput = {
    _count?: Prisma.SortOrder;
};
export type DlMatchResultCountOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    runId?: Prisma.SortOrder;
    dlContactId?: Prisma.SortOrder;
    tgmbaseUserId?: Prisma.SortOrder;
    strictTelegramIdMatch?: Prisma.SortOrder;
    usernameMatch?: Prisma.SortOrder;
    phoneMatch?: Prisma.SortOrder;
    chatActivityMatch?: Prisma.SortOrder;
    dlContactSnapshot?: Prisma.SortOrder;
    tgmbaseUserSnapshot?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
};
export type DlMatchResultAvgOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    runId?: Prisma.SortOrder;
    dlContactId?: Prisma.SortOrder;
    tgmbaseUserId?: Prisma.SortOrder;
};
export type DlMatchResultMaxOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    runId?: Prisma.SortOrder;
    dlContactId?: Prisma.SortOrder;
    tgmbaseUserId?: Prisma.SortOrder;
    strictTelegramIdMatch?: Prisma.SortOrder;
    usernameMatch?: Prisma.SortOrder;
    phoneMatch?: Prisma.SortOrder;
    chatActivityMatch?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
};
export type DlMatchResultMinOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    runId?: Prisma.SortOrder;
    dlContactId?: Prisma.SortOrder;
    tgmbaseUserId?: Prisma.SortOrder;
    strictTelegramIdMatch?: Prisma.SortOrder;
    usernameMatch?: Prisma.SortOrder;
    phoneMatch?: Prisma.SortOrder;
    chatActivityMatch?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
};
export type DlMatchResultSumOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    runId?: Prisma.SortOrder;
    dlContactId?: Prisma.SortOrder;
    tgmbaseUserId?: Prisma.SortOrder;
};
export type DlMatchResultScalarRelationFilter = {
    is?: Prisma.DlMatchResultWhereInput;
    isNot?: Prisma.DlMatchResultWhereInput;
};
export type DlMatchResultCreateNestedManyWithoutTgmbaseUserInput = {
    create?: Prisma.XOR<Prisma.DlMatchResultCreateWithoutTgmbaseUserInput, Prisma.DlMatchResultUncheckedCreateWithoutTgmbaseUserInput> | Prisma.DlMatchResultCreateWithoutTgmbaseUserInput[] | Prisma.DlMatchResultUncheckedCreateWithoutTgmbaseUserInput[];
    connectOrCreate?: Prisma.DlMatchResultCreateOrConnectWithoutTgmbaseUserInput | Prisma.DlMatchResultCreateOrConnectWithoutTgmbaseUserInput[];
    createMany?: Prisma.DlMatchResultCreateManyTgmbaseUserInputEnvelope;
    connect?: Prisma.DlMatchResultWhereUniqueInput | Prisma.DlMatchResultWhereUniqueInput[];
};
export type DlMatchResultUncheckedCreateNestedManyWithoutTgmbaseUserInput = {
    create?: Prisma.XOR<Prisma.DlMatchResultCreateWithoutTgmbaseUserInput, Prisma.DlMatchResultUncheckedCreateWithoutTgmbaseUserInput> | Prisma.DlMatchResultCreateWithoutTgmbaseUserInput[] | Prisma.DlMatchResultUncheckedCreateWithoutTgmbaseUserInput[];
    connectOrCreate?: Prisma.DlMatchResultCreateOrConnectWithoutTgmbaseUserInput | Prisma.DlMatchResultCreateOrConnectWithoutTgmbaseUserInput[];
    createMany?: Prisma.DlMatchResultCreateManyTgmbaseUserInputEnvelope;
    connect?: Prisma.DlMatchResultWhereUniqueInput | Prisma.DlMatchResultWhereUniqueInput[];
};
export type DlMatchResultUpdateManyWithoutTgmbaseUserNestedInput = {
    create?: Prisma.XOR<Prisma.DlMatchResultCreateWithoutTgmbaseUserInput, Prisma.DlMatchResultUncheckedCreateWithoutTgmbaseUserInput> | Prisma.DlMatchResultCreateWithoutTgmbaseUserInput[] | Prisma.DlMatchResultUncheckedCreateWithoutTgmbaseUserInput[];
    connectOrCreate?: Prisma.DlMatchResultCreateOrConnectWithoutTgmbaseUserInput | Prisma.DlMatchResultCreateOrConnectWithoutTgmbaseUserInput[];
    upsert?: Prisma.DlMatchResultUpsertWithWhereUniqueWithoutTgmbaseUserInput | Prisma.DlMatchResultUpsertWithWhereUniqueWithoutTgmbaseUserInput[];
    createMany?: Prisma.DlMatchResultCreateManyTgmbaseUserInputEnvelope;
    set?: Prisma.DlMatchResultWhereUniqueInput | Prisma.DlMatchResultWhereUniqueInput[];
    disconnect?: Prisma.DlMatchResultWhereUniqueInput | Prisma.DlMatchResultWhereUniqueInput[];
    delete?: Prisma.DlMatchResultWhereUniqueInput | Prisma.DlMatchResultWhereUniqueInput[];
    connect?: Prisma.DlMatchResultWhereUniqueInput | Prisma.DlMatchResultWhereUniqueInput[];
    update?: Prisma.DlMatchResultUpdateWithWhereUniqueWithoutTgmbaseUserInput | Prisma.DlMatchResultUpdateWithWhereUniqueWithoutTgmbaseUserInput[];
    updateMany?: Prisma.DlMatchResultUpdateManyWithWhereWithoutTgmbaseUserInput | Prisma.DlMatchResultUpdateManyWithWhereWithoutTgmbaseUserInput[];
    deleteMany?: Prisma.DlMatchResultScalarWhereInput | Prisma.DlMatchResultScalarWhereInput[];
};
export type DlMatchResultUncheckedUpdateManyWithoutTgmbaseUserNestedInput = {
    create?: Prisma.XOR<Prisma.DlMatchResultCreateWithoutTgmbaseUserInput, Prisma.DlMatchResultUncheckedCreateWithoutTgmbaseUserInput> | Prisma.DlMatchResultCreateWithoutTgmbaseUserInput[] | Prisma.DlMatchResultUncheckedCreateWithoutTgmbaseUserInput[];
    connectOrCreate?: Prisma.DlMatchResultCreateOrConnectWithoutTgmbaseUserInput | Prisma.DlMatchResultCreateOrConnectWithoutTgmbaseUserInput[];
    upsert?: Prisma.DlMatchResultUpsertWithWhereUniqueWithoutTgmbaseUserInput | Prisma.DlMatchResultUpsertWithWhereUniqueWithoutTgmbaseUserInput[];
    createMany?: Prisma.DlMatchResultCreateManyTgmbaseUserInputEnvelope;
    set?: Prisma.DlMatchResultWhereUniqueInput | Prisma.DlMatchResultWhereUniqueInput[];
    disconnect?: Prisma.DlMatchResultWhereUniqueInput | Prisma.DlMatchResultWhereUniqueInput[];
    delete?: Prisma.DlMatchResultWhereUniqueInput | Prisma.DlMatchResultWhereUniqueInput[];
    connect?: Prisma.DlMatchResultWhereUniqueInput | Prisma.DlMatchResultWhereUniqueInput[];
    update?: Prisma.DlMatchResultUpdateWithWhereUniqueWithoutTgmbaseUserInput | Prisma.DlMatchResultUpdateWithWhereUniqueWithoutTgmbaseUserInput[];
    updateMany?: Prisma.DlMatchResultUpdateManyWithWhereWithoutTgmbaseUserInput | Prisma.DlMatchResultUpdateManyWithWhereWithoutTgmbaseUserInput[];
    deleteMany?: Prisma.DlMatchResultScalarWhereInput | Prisma.DlMatchResultScalarWhereInput[];
};
export type DlMatchResultCreateNestedManyWithoutDlContactInput = {
    create?: Prisma.XOR<Prisma.DlMatchResultCreateWithoutDlContactInput, Prisma.DlMatchResultUncheckedCreateWithoutDlContactInput> | Prisma.DlMatchResultCreateWithoutDlContactInput[] | Prisma.DlMatchResultUncheckedCreateWithoutDlContactInput[];
    connectOrCreate?: Prisma.DlMatchResultCreateOrConnectWithoutDlContactInput | Prisma.DlMatchResultCreateOrConnectWithoutDlContactInput[];
    createMany?: Prisma.DlMatchResultCreateManyDlContactInputEnvelope;
    connect?: Prisma.DlMatchResultWhereUniqueInput | Prisma.DlMatchResultWhereUniqueInput[];
};
export type DlMatchResultUncheckedCreateNestedManyWithoutDlContactInput = {
    create?: Prisma.XOR<Prisma.DlMatchResultCreateWithoutDlContactInput, Prisma.DlMatchResultUncheckedCreateWithoutDlContactInput> | Prisma.DlMatchResultCreateWithoutDlContactInput[] | Prisma.DlMatchResultUncheckedCreateWithoutDlContactInput[];
    connectOrCreate?: Prisma.DlMatchResultCreateOrConnectWithoutDlContactInput | Prisma.DlMatchResultCreateOrConnectWithoutDlContactInput[];
    createMany?: Prisma.DlMatchResultCreateManyDlContactInputEnvelope;
    connect?: Prisma.DlMatchResultWhereUniqueInput | Prisma.DlMatchResultWhereUniqueInput[];
};
export type DlMatchResultUpdateManyWithoutDlContactNestedInput = {
    create?: Prisma.XOR<Prisma.DlMatchResultCreateWithoutDlContactInput, Prisma.DlMatchResultUncheckedCreateWithoutDlContactInput> | Prisma.DlMatchResultCreateWithoutDlContactInput[] | Prisma.DlMatchResultUncheckedCreateWithoutDlContactInput[];
    connectOrCreate?: Prisma.DlMatchResultCreateOrConnectWithoutDlContactInput | Prisma.DlMatchResultCreateOrConnectWithoutDlContactInput[];
    upsert?: Prisma.DlMatchResultUpsertWithWhereUniqueWithoutDlContactInput | Prisma.DlMatchResultUpsertWithWhereUniqueWithoutDlContactInput[];
    createMany?: Prisma.DlMatchResultCreateManyDlContactInputEnvelope;
    set?: Prisma.DlMatchResultWhereUniqueInput | Prisma.DlMatchResultWhereUniqueInput[];
    disconnect?: Prisma.DlMatchResultWhereUniqueInput | Prisma.DlMatchResultWhereUniqueInput[];
    delete?: Prisma.DlMatchResultWhereUniqueInput | Prisma.DlMatchResultWhereUniqueInput[];
    connect?: Prisma.DlMatchResultWhereUniqueInput | Prisma.DlMatchResultWhereUniqueInput[];
    update?: Prisma.DlMatchResultUpdateWithWhereUniqueWithoutDlContactInput | Prisma.DlMatchResultUpdateWithWhereUniqueWithoutDlContactInput[];
    updateMany?: Prisma.DlMatchResultUpdateManyWithWhereWithoutDlContactInput | Prisma.DlMatchResultUpdateManyWithWhereWithoutDlContactInput[];
    deleteMany?: Prisma.DlMatchResultScalarWhereInput | Prisma.DlMatchResultScalarWhereInput[];
};
export type DlMatchResultUncheckedUpdateManyWithoutDlContactNestedInput = {
    create?: Prisma.XOR<Prisma.DlMatchResultCreateWithoutDlContactInput, Prisma.DlMatchResultUncheckedCreateWithoutDlContactInput> | Prisma.DlMatchResultCreateWithoutDlContactInput[] | Prisma.DlMatchResultUncheckedCreateWithoutDlContactInput[];
    connectOrCreate?: Prisma.DlMatchResultCreateOrConnectWithoutDlContactInput | Prisma.DlMatchResultCreateOrConnectWithoutDlContactInput[];
    upsert?: Prisma.DlMatchResultUpsertWithWhereUniqueWithoutDlContactInput | Prisma.DlMatchResultUpsertWithWhereUniqueWithoutDlContactInput[];
    createMany?: Prisma.DlMatchResultCreateManyDlContactInputEnvelope;
    set?: Prisma.DlMatchResultWhereUniqueInput | Prisma.DlMatchResultWhereUniqueInput[];
    disconnect?: Prisma.DlMatchResultWhereUniqueInput | Prisma.DlMatchResultWhereUniqueInput[];
    delete?: Prisma.DlMatchResultWhereUniqueInput | Prisma.DlMatchResultWhereUniqueInput[];
    connect?: Prisma.DlMatchResultWhereUniqueInput | Prisma.DlMatchResultWhereUniqueInput[];
    update?: Prisma.DlMatchResultUpdateWithWhereUniqueWithoutDlContactInput | Prisma.DlMatchResultUpdateWithWhereUniqueWithoutDlContactInput[];
    updateMany?: Prisma.DlMatchResultUpdateManyWithWhereWithoutDlContactInput | Prisma.DlMatchResultUpdateManyWithWhereWithoutDlContactInput[];
    deleteMany?: Prisma.DlMatchResultScalarWhereInput | Prisma.DlMatchResultScalarWhereInput[];
};
export type DlMatchResultCreateNestedManyWithoutRunInput = {
    create?: Prisma.XOR<Prisma.DlMatchResultCreateWithoutRunInput, Prisma.DlMatchResultUncheckedCreateWithoutRunInput> | Prisma.DlMatchResultCreateWithoutRunInput[] | Prisma.DlMatchResultUncheckedCreateWithoutRunInput[];
    connectOrCreate?: Prisma.DlMatchResultCreateOrConnectWithoutRunInput | Prisma.DlMatchResultCreateOrConnectWithoutRunInput[];
    createMany?: Prisma.DlMatchResultCreateManyRunInputEnvelope;
    connect?: Prisma.DlMatchResultWhereUniqueInput | Prisma.DlMatchResultWhereUniqueInput[];
};
export type DlMatchResultUncheckedCreateNestedManyWithoutRunInput = {
    create?: Prisma.XOR<Prisma.DlMatchResultCreateWithoutRunInput, Prisma.DlMatchResultUncheckedCreateWithoutRunInput> | Prisma.DlMatchResultCreateWithoutRunInput[] | Prisma.DlMatchResultUncheckedCreateWithoutRunInput[];
    connectOrCreate?: Prisma.DlMatchResultCreateOrConnectWithoutRunInput | Prisma.DlMatchResultCreateOrConnectWithoutRunInput[];
    createMany?: Prisma.DlMatchResultCreateManyRunInputEnvelope;
    connect?: Prisma.DlMatchResultWhereUniqueInput | Prisma.DlMatchResultWhereUniqueInput[];
};
export type DlMatchResultUpdateManyWithoutRunNestedInput = {
    create?: Prisma.XOR<Prisma.DlMatchResultCreateWithoutRunInput, Prisma.DlMatchResultUncheckedCreateWithoutRunInput> | Prisma.DlMatchResultCreateWithoutRunInput[] | Prisma.DlMatchResultUncheckedCreateWithoutRunInput[];
    connectOrCreate?: Prisma.DlMatchResultCreateOrConnectWithoutRunInput | Prisma.DlMatchResultCreateOrConnectWithoutRunInput[];
    upsert?: Prisma.DlMatchResultUpsertWithWhereUniqueWithoutRunInput | Prisma.DlMatchResultUpsertWithWhereUniqueWithoutRunInput[];
    createMany?: Prisma.DlMatchResultCreateManyRunInputEnvelope;
    set?: Prisma.DlMatchResultWhereUniqueInput | Prisma.DlMatchResultWhereUniqueInput[];
    disconnect?: Prisma.DlMatchResultWhereUniqueInput | Prisma.DlMatchResultWhereUniqueInput[];
    delete?: Prisma.DlMatchResultWhereUniqueInput | Prisma.DlMatchResultWhereUniqueInput[];
    connect?: Prisma.DlMatchResultWhereUniqueInput | Prisma.DlMatchResultWhereUniqueInput[];
    update?: Prisma.DlMatchResultUpdateWithWhereUniqueWithoutRunInput | Prisma.DlMatchResultUpdateWithWhereUniqueWithoutRunInput[];
    updateMany?: Prisma.DlMatchResultUpdateManyWithWhereWithoutRunInput | Prisma.DlMatchResultUpdateManyWithWhereWithoutRunInput[];
    deleteMany?: Prisma.DlMatchResultScalarWhereInput | Prisma.DlMatchResultScalarWhereInput[];
};
export type DlMatchResultUncheckedUpdateManyWithoutRunNestedInput = {
    create?: Prisma.XOR<Prisma.DlMatchResultCreateWithoutRunInput, Prisma.DlMatchResultUncheckedCreateWithoutRunInput> | Prisma.DlMatchResultCreateWithoutRunInput[] | Prisma.DlMatchResultUncheckedCreateWithoutRunInput[];
    connectOrCreate?: Prisma.DlMatchResultCreateOrConnectWithoutRunInput | Prisma.DlMatchResultCreateOrConnectWithoutRunInput[];
    upsert?: Prisma.DlMatchResultUpsertWithWhereUniqueWithoutRunInput | Prisma.DlMatchResultUpsertWithWhereUniqueWithoutRunInput[];
    createMany?: Prisma.DlMatchResultCreateManyRunInputEnvelope;
    set?: Prisma.DlMatchResultWhereUniqueInput | Prisma.DlMatchResultWhereUniqueInput[];
    disconnect?: Prisma.DlMatchResultWhereUniqueInput | Prisma.DlMatchResultWhereUniqueInput[];
    delete?: Prisma.DlMatchResultWhereUniqueInput | Prisma.DlMatchResultWhereUniqueInput[];
    connect?: Prisma.DlMatchResultWhereUniqueInput | Prisma.DlMatchResultWhereUniqueInput[];
    update?: Prisma.DlMatchResultUpdateWithWhereUniqueWithoutRunInput | Prisma.DlMatchResultUpdateWithWhereUniqueWithoutRunInput[];
    updateMany?: Prisma.DlMatchResultUpdateManyWithWhereWithoutRunInput | Prisma.DlMatchResultUpdateManyWithWhereWithoutRunInput[];
    deleteMany?: Prisma.DlMatchResultScalarWhereInput | Prisma.DlMatchResultScalarWhereInput[];
};
export type DlMatchResultCreateNestedOneWithoutChatsInput = {
    create?: Prisma.XOR<Prisma.DlMatchResultCreateWithoutChatsInput, Prisma.DlMatchResultUncheckedCreateWithoutChatsInput>;
    connectOrCreate?: Prisma.DlMatchResultCreateOrConnectWithoutChatsInput;
    connect?: Prisma.DlMatchResultWhereUniqueInput;
};
export type DlMatchResultUpdateOneRequiredWithoutChatsNestedInput = {
    create?: Prisma.XOR<Prisma.DlMatchResultCreateWithoutChatsInput, Prisma.DlMatchResultUncheckedCreateWithoutChatsInput>;
    connectOrCreate?: Prisma.DlMatchResultCreateOrConnectWithoutChatsInput;
    upsert?: Prisma.DlMatchResultUpsertWithoutChatsInput;
    connect?: Prisma.DlMatchResultWhereUniqueInput;
    update?: Prisma.XOR<Prisma.XOR<Prisma.DlMatchResultUpdateToOneWithWhereWithoutChatsInput, Prisma.DlMatchResultUpdateWithoutChatsInput>, Prisma.DlMatchResultUncheckedUpdateWithoutChatsInput>;
};
export type DlMatchResultCreateNestedOneWithoutMessagesInput = {
    create?: Prisma.XOR<Prisma.DlMatchResultCreateWithoutMessagesInput, Prisma.DlMatchResultUncheckedCreateWithoutMessagesInput>;
    connectOrCreate?: Prisma.DlMatchResultCreateOrConnectWithoutMessagesInput;
    connect?: Prisma.DlMatchResultWhereUniqueInput;
};
export type DlMatchResultUpdateOneRequiredWithoutMessagesNestedInput = {
    create?: Prisma.XOR<Prisma.DlMatchResultCreateWithoutMessagesInput, Prisma.DlMatchResultUncheckedCreateWithoutMessagesInput>;
    connectOrCreate?: Prisma.DlMatchResultCreateOrConnectWithoutMessagesInput;
    upsert?: Prisma.DlMatchResultUpsertWithoutMessagesInput;
    connect?: Prisma.DlMatchResultWhereUniqueInput;
    update?: Prisma.XOR<Prisma.XOR<Prisma.DlMatchResultUpdateToOneWithWhereWithoutMessagesInput, Prisma.DlMatchResultUpdateWithoutMessagesInput>, Prisma.DlMatchResultUncheckedUpdateWithoutMessagesInput>;
};
export type DlMatchResultCreateWithoutTgmbaseUserInput = {
    id?: bigint | number;
    strictTelegramIdMatch?: boolean;
    usernameMatch?: boolean;
    phoneMatch?: boolean;
    chatActivityMatch?: boolean;
    dlContactSnapshot: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    tgmbaseUserSnapshot?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    createdAt?: Date | string;
    run: Prisma.DlMatchRunCreateNestedOneWithoutResultsInput;
    dlContact: Prisma.DlContactCreateNestedOneWithoutMatchResultsInput;
    chats?: Prisma.DlMatchResultChatCreateNestedManyWithoutResultInput;
    messages?: Prisma.DlMatchResultMessageCreateNestedManyWithoutResultInput;
};
export type DlMatchResultUncheckedCreateWithoutTgmbaseUserInput = {
    id?: bigint | number;
    runId: bigint | number;
    dlContactId: bigint | number;
    strictTelegramIdMatch?: boolean;
    usernameMatch?: boolean;
    phoneMatch?: boolean;
    chatActivityMatch?: boolean;
    dlContactSnapshot: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    tgmbaseUserSnapshot?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    createdAt?: Date | string;
    chats?: Prisma.DlMatchResultChatUncheckedCreateNestedManyWithoutResultInput;
    messages?: Prisma.DlMatchResultMessageUncheckedCreateNestedManyWithoutResultInput;
};
export type DlMatchResultCreateOrConnectWithoutTgmbaseUserInput = {
    where: Prisma.DlMatchResultWhereUniqueInput;
    create: Prisma.XOR<Prisma.DlMatchResultCreateWithoutTgmbaseUserInput, Prisma.DlMatchResultUncheckedCreateWithoutTgmbaseUserInput>;
};
export type DlMatchResultCreateManyTgmbaseUserInputEnvelope = {
    data: Prisma.DlMatchResultCreateManyTgmbaseUserInput | Prisma.DlMatchResultCreateManyTgmbaseUserInput[];
    skipDuplicates?: boolean;
};
export type DlMatchResultUpsertWithWhereUniqueWithoutTgmbaseUserInput = {
    where: Prisma.DlMatchResultWhereUniqueInput;
    update: Prisma.XOR<Prisma.DlMatchResultUpdateWithoutTgmbaseUserInput, Prisma.DlMatchResultUncheckedUpdateWithoutTgmbaseUserInput>;
    create: Prisma.XOR<Prisma.DlMatchResultCreateWithoutTgmbaseUserInput, Prisma.DlMatchResultUncheckedCreateWithoutTgmbaseUserInput>;
};
export type DlMatchResultUpdateWithWhereUniqueWithoutTgmbaseUserInput = {
    where: Prisma.DlMatchResultWhereUniqueInput;
    data: Prisma.XOR<Prisma.DlMatchResultUpdateWithoutTgmbaseUserInput, Prisma.DlMatchResultUncheckedUpdateWithoutTgmbaseUserInput>;
};
export type DlMatchResultUpdateManyWithWhereWithoutTgmbaseUserInput = {
    where: Prisma.DlMatchResultScalarWhereInput;
    data: Prisma.XOR<Prisma.DlMatchResultUpdateManyMutationInput, Prisma.DlMatchResultUncheckedUpdateManyWithoutTgmbaseUserInput>;
};
export type DlMatchResultScalarWhereInput = {
    AND?: Prisma.DlMatchResultScalarWhereInput | Prisma.DlMatchResultScalarWhereInput[];
    OR?: Prisma.DlMatchResultScalarWhereInput[];
    NOT?: Prisma.DlMatchResultScalarWhereInput | Prisma.DlMatchResultScalarWhereInput[];
    id?: Prisma.BigIntFilter<"DlMatchResult"> | bigint | number;
    runId?: Prisma.BigIntFilter<"DlMatchResult"> | bigint | number;
    dlContactId?: Prisma.BigIntFilter<"DlMatchResult"> | bigint | number;
    tgmbaseUserId?: Prisma.BigIntNullableFilter<"DlMatchResult"> | bigint | number | null;
    strictTelegramIdMatch?: Prisma.BoolFilter<"DlMatchResult"> | boolean;
    usernameMatch?: Prisma.BoolFilter<"DlMatchResult"> | boolean;
    phoneMatch?: Prisma.BoolFilter<"DlMatchResult"> | boolean;
    chatActivityMatch?: Prisma.BoolFilter<"DlMatchResult"> | boolean;
    dlContactSnapshot?: Prisma.JsonFilter<"DlMatchResult">;
    tgmbaseUserSnapshot?: Prisma.JsonNullableFilter<"DlMatchResult">;
    createdAt?: Prisma.DateTimeFilter<"DlMatchResult"> | Date | string;
};
export type DlMatchResultCreateWithoutDlContactInput = {
    id?: bigint | number;
    strictTelegramIdMatch?: boolean;
    usernameMatch?: boolean;
    phoneMatch?: boolean;
    chatActivityMatch?: boolean;
    dlContactSnapshot: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    tgmbaseUserSnapshot?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    createdAt?: Date | string;
    run: Prisma.DlMatchRunCreateNestedOneWithoutResultsInput;
    tgmbaseUser?: Prisma.userCreateNestedOneWithoutDlMatchesInput;
    chats?: Prisma.DlMatchResultChatCreateNestedManyWithoutResultInput;
    messages?: Prisma.DlMatchResultMessageCreateNestedManyWithoutResultInput;
};
export type DlMatchResultUncheckedCreateWithoutDlContactInput = {
    id?: bigint | number;
    runId: bigint | number;
    tgmbaseUserId?: bigint | number | null;
    strictTelegramIdMatch?: boolean;
    usernameMatch?: boolean;
    phoneMatch?: boolean;
    chatActivityMatch?: boolean;
    dlContactSnapshot: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    tgmbaseUserSnapshot?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    createdAt?: Date | string;
    chats?: Prisma.DlMatchResultChatUncheckedCreateNestedManyWithoutResultInput;
    messages?: Prisma.DlMatchResultMessageUncheckedCreateNestedManyWithoutResultInput;
};
export type DlMatchResultCreateOrConnectWithoutDlContactInput = {
    where: Prisma.DlMatchResultWhereUniqueInput;
    create: Prisma.XOR<Prisma.DlMatchResultCreateWithoutDlContactInput, Prisma.DlMatchResultUncheckedCreateWithoutDlContactInput>;
};
export type DlMatchResultCreateManyDlContactInputEnvelope = {
    data: Prisma.DlMatchResultCreateManyDlContactInput | Prisma.DlMatchResultCreateManyDlContactInput[];
    skipDuplicates?: boolean;
};
export type DlMatchResultUpsertWithWhereUniqueWithoutDlContactInput = {
    where: Prisma.DlMatchResultWhereUniqueInput;
    update: Prisma.XOR<Prisma.DlMatchResultUpdateWithoutDlContactInput, Prisma.DlMatchResultUncheckedUpdateWithoutDlContactInput>;
    create: Prisma.XOR<Prisma.DlMatchResultCreateWithoutDlContactInput, Prisma.DlMatchResultUncheckedCreateWithoutDlContactInput>;
};
export type DlMatchResultUpdateWithWhereUniqueWithoutDlContactInput = {
    where: Prisma.DlMatchResultWhereUniqueInput;
    data: Prisma.XOR<Prisma.DlMatchResultUpdateWithoutDlContactInput, Prisma.DlMatchResultUncheckedUpdateWithoutDlContactInput>;
};
export type DlMatchResultUpdateManyWithWhereWithoutDlContactInput = {
    where: Prisma.DlMatchResultScalarWhereInput;
    data: Prisma.XOR<Prisma.DlMatchResultUpdateManyMutationInput, Prisma.DlMatchResultUncheckedUpdateManyWithoutDlContactInput>;
};
export type DlMatchResultCreateWithoutRunInput = {
    id?: bigint | number;
    strictTelegramIdMatch?: boolean;
    usernameMatch?: boolean;
    phoneMatch?: boolean;
    chatActivityMatch?: boolean;
    dlContactSnapshot: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    tgmbaseUserSnapshot?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    createdAt?: Date | string;
    dlContact: Prisma.DlContactCreateNestedOneWithoutMatchResultsInput;
    tgmbaseUser?: Prisma.userCreateNestedOneWithoutDlMatchesInput;
    chats?: Prisma.DlMatchResultChatCreateNestedManyWithoutResultInput;
    messages?: Prisma.DlMatchResultMessageCreateNestedManyWithoutResultInput;
};
export type DlMatchResultUncheckedCreateWithoutRunInput = {
    id?: bigint | number;
    dlContactId: bigint | number;
    tgmbaseUserId?: bigint | number | null;
    strictTelegramIdMatch?: boolean;
    usernameMatch?: boolean;
    phoneMatch?: boolean;
    chatActivityMatch?: boolean;
    dlContactSnapshot: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    tgmbaseUserSnapshot?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    createdAt?: Date | string;
    chats?: Prisma.DlMatchResultChatUncheckedCreateNestedManyWithoutResultInput;
    messages?: Prisma.DlMatchResultMessageUncheckedCreateNestedManyWithoutResultInput;
};
export type DlMatchResultCreateOrConnectWithoutRunInput = {
    where: Prisma.DlMatchResultWhereUniqueInput;
    create: Prisma.XOR<Prisma.DlMatchResultCreateWithoutRunInput, Prisma.DlMatchResultUncheckedCreateWithoutRunInput>;
};
export type DlMatchResultCreateManyRunInputEnvelope = {
    data: Prisma.DlMatchResultCreateManyRunInput | Prisma.DlMatchResultCreateManyRunInput[];
    skipDuplicates?: boolean;
};
export type DlMatchResultUpsertWithWhereUniqueWithoutRunInput = {
    where: Prisma.DlMatchResultWhereUniqueInput;
    update: Prisma.XOR<Prisma.DlMatchResultUpdateWithoutRunInput, Prisma.DlMatchResultUncheckedUpdateWithoutRunInput>;
    create: Prisma.XOR<Prisma.DlMatchResultCreateWithoutRunInput, Prisma.DlMatchResultUncheckedCreateWithoutRunInput>;
};
export type DlMatchResultUpdateWithWhereUniqueWithoutRunInput = {
    where: Prisma.DlMatchResultWhereUniqueInput;
    data: Prisma.XOR<Prisma.DlMatchResultUpdateWithoutRunInput, Prisma.DlMatchResultUncheckedUpdateWithoutRunInput>;
};
export type DlMatchResultUpdateManyWithWhereWithoutRunInput = {
    where: Prisma.DlMatchResultScalarWhereInput;
    data: Prisma.XOR<Prisma.DlMatchResultUpdateManyMutationInput, Prisma.DlMatchResultUncheckedUpdateManyWithoutRunInput>;
};
export type DlMatchResultCreateWithoutChatsInput = {
    id?: bigint | number;
    strictTelegramIdMatch?: boolean;
    usernameMatch?: boolean;
    phoneMatch?: boolean;
    chatActivityMatch?: boolean;
    dlContactSnapshot: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    tgmbaseUserSnapshot?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    createdAt?: Date | string;
    run: Prisma.DlMatchRunCreateNestedOneWithoutResultsInput;
    dlContact: Prisma.DlContactCreateNestedOneWithoutMatchResultsInput;
    tgmbaseUser?: Prisma.userCreateNestedOneWithoutDlMatchesInput;
    messages?: Prisma.DlMatchResultMessageCreateNestedManyWithoutResultInput;
};
export type DlMatchResultUncheckedCreateWithoutChatsInput = {
    id?: bigint | number;
    runId: bigint | number;
    dlContactId: bigint | number;
    tgmbaseUserId?: bigint | number | null;
    strictTelegramIdMatch?: boolean;
    usernameMatch?: boolean;
    phoneMatch?: boolean;
    chatActivityMatch?: boolean;
    dlContactSnapshot: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    tgmbaseUserSnapshot?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    createdAt?: Date | string;
    messages?: Prisma.DlMatchResultMessageUncheckedCreateNestedManyWithoutResultInput;
};
export type DlMatchResultCreateOrConnectWithoutChatsInput = {
    where: Prisma.DlMatchResultWhereUniqueInput;
    create: Prisma.XOR<Prisma.DlMatchResultCreateWithoutChatsInput, Prisma.DlMatchResultUncheckedCreateWithoutChatsInput>;
};
export type DlMatchResultUpsertWithoutChatsInput = {
    update: Prisma.XOR<Prisma.DlMatchResultUpdateWithoutChatsInput, Prisma.DlMatchResultUncheckedUpdateWithoutChatsInput>;
    create: Prisma.XOR<Prisma.DlMatchResultCreateWithoutChatsInput, Prisma.DlMatchResultUncheckedCreateWithoutChatsInput>;
    where?: Prisma.DlMatchResultWhereInput;
};
export type DlMatchResultUpdateToOneWithWhereWithoutChatsInput = {
    where?: Prisma.DlMatchResultWhereInput;
    data: Prisma.XOR<Prisma.DlMatchResultUpdateWithoutChatsInput, Prisma.DlMatchResultUncheckedUpdateWithoutChatsInput>;
};
export type DlMatchResultUpdateWithoutChatsInput = {
    id?: Prisma.BigIntFieldUpdateOperationsInput | bigint | number;
    strictTelegramIdMatch?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    usernameMatch?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    phoneMatch?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    chatActivityMatch?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    dlContactSnapshot?: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    tgmbaseUserSnapshot?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    run?: Prisma.DlMatchRunUpdateOneRequiredWithoutResultsNestedInput;
    dlContact?: Prisma.DlContactUpdateOneRequiredWithoutMatchResultsNestedInput;
    tgmbaseUser?: Prisma.userUpdateOneWithoutDlMatchesNestedInput;
    messages?: Prisma.DlMatchResultMessageUpdateManyWithoutResultNestedInput;
};
export type DlMatchResultUncheckedUpdateWithoutChatsInput = {
    id?: Prisma.BigIntFieldUpdateOperationsInput | bigint | number;
    runId?: Prisma.BigIntFieldUpdateOperationsInput | bigint | number;
    dlContactId?: Prisma.BigIntFieldUpdateOperationsInput | bigint | number;
    tgmbaseUserId?: Prisma.NullableBigIntFieldUpdateOperationsInput | bigint | number | null;
    strictTelegramIdMatch?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    usernameMatch?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    phoneMatch?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    chatActivityMatch?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    dlContactSnapshot?: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    tgmbaseUserSnapshot?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    messages?: Prisma.DlMatchResultMessageUncheckedUpdateManyWithoutResultNestedInput;
};
export type DlMatchResultCreateWithoutMessagesInput = {
    id?: bigint | number;
    strictTelegramIdMatch?: boolean;
    usernameMatch?: boolean;
    phoneMatch?: boolean;
    chatActivityMatch?: boolean;
    dlContactSnapshot: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    tgmbaseUserSnapshot?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    createdAt?: Date | string;
    run: Prisma.DlMatchRunCreateNestedOneWithoutResultsInput;
    dlContact: Prisma.DlContactCreateNestedOneWithoutMatchResultsInput;
    tgmbaseUser?: Prisma.userCreateNestedOneWithoutDlMatchesInput;
    chats?: Prisma.DlMatchResultChatCreateNestedManyWithoutResultInput;
};
export type DlMatchResultUncheckedCreateWithoutMessagesInput = {
    id?: bigint | number;
    runId: bigint | number;
    dlContactId: bigint | number;
    tgmbaseUserId?: bigint | number | null;
    strictTelegramIdMatch?: boolean;
    usernameMatch?: boolean;
    phoneMatch?: boolean;
    chatActivityMatch?: boolean;
    dlContactSnapshot: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    tgmbaseUserSnapshot?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    createdAt?: Date | string;
    chats?: Prisma.DlMatchResultChatUncheckedCreateNestedManyWithoutResultInput;
};
export type DlMatchResultCreateOrConnectWithoutMessagesInput = {
    where: Prisma.DlMatchResultWhereUniqueInput;
    create: Prisma.XOR<Prisma.DlMatchResultCreateWithoutMessagesInput, Prisma.DlMatchResultUncheckedCreateWithoutMessagesInput>;
};
export type DlMatchResultUpsertWithoutMessagesInput = {
    update: Prisma.XOR<Prisma.DlMatchResultUpdateWithoutMessagesInput, Prisma.DlMatchResultUncheckedUpdateWithoutMessagesInput>;
    create: Prisma.XOR<Prisma.DlMatchResultCreateWithoutMessagesInput, Prisma.DlMatchResultUncheckedCreateWithoutMessagesInput>;
    where?: Prisma.DlMatchResultWhereInput;
};
export type DlMatchResultUpdateToOneWithWhereWithoutMessagesInput = {
    where?: Prisma.DlMatchResultWhereInput;
    data: Prisma.XOR<Prisma.DlMatchResultUpdateWithoutMessagesInput, Prisma.DlMatchResultUncheckedUpdateWithoutMessagesInput>;
};
export type DlMatchResultUpdateWithoutMessagesInput = {
    id?: Prisma.BigIntFieldUpdateOperationsInput | bigint | number;
    strictTelegramIdMatch?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    usernameMatch?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    phoneMatch?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    chatActivityMatch?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    dlContactSnapshot?: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    tgmbaseUserSnapshot?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    run?: Prisma.DlMatchRunUpdateOneRequiredWithoutResultsNestedInput;
    dlContact?: Prisma.DlContactUpdateOneRequiredWithoutMatchResultsNestedInput;
    tgmbaseUser?: Prisma.userUpdateOneWithoutDlMatchesNestedInput;
    chats?: Prisma.DlMatchResultChatUpdateManyWithoutResultNestedInput;
};
export type DlMatchResultUncheckedUpdateWithoutMessagesInput = {
    id?: Prisma.BigIntFieldUpdateOperationsInput | bigint | number;
    runId?: Prisma.BigIntFieldUpdateOperationsInput | bigint | number;
    dlContactId?: Prisma.BigIntFieldUpdateOperationsInput | bigint | number;
    tgmbaseUserId?: Prisma.NullableBigIntFieldUpdateOperationsInput | bigint | number | null;
    strictTelegramIdMatch?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    usernameMatch?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    phoneMatch?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    chatActivityMatch?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    dlContactSnapshot?: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    tgmbaseUserSnapshot?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    chats?: Prisma.DlMatchResultChatUncheckedUpdateManyWithoutResultNestedInput;
};
export type DlMatchResultCreateManyTgmbaseUserInput = {
    id?: bigint | number;
    runId: bigint | number;
    dlContactId: bigint | number;
    strictTelegramIdMatch?: boolean;
    usernameMatch?: boolean;
    phoneMatch?: boolean;
    chatActivityMatch?: boolean;
    dlContactSnapshot: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    tgmbaseUserSnapshot?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    createdAt?: Date | string;
};
export type DlMatchResultUpdateWithoutTgmbaseUserInput = {
    id?: Prisma.BigIntFieldUpdateOperationsInput | bigint | number;
    strictTelegramIdMatch?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    usernameMatch?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    phoneMatch?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    chatActivityMatch?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    dlContactSnapshot?: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    tgmbaseUserSnapshot?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    run?: Prisma.DlMatchRunUpdateOneRequiredWithoutResultsNestedInput;
    dlContact?: Prisma.DlContactUpdateOneRequiredWithoutMatchResultsNestedInput;
    chats?: Prisma.DlMatchResultChatUpdateManyWithoutResultNestedInput;
    messages?: Prisma.DlMatchResultMessageUpdateManyWithoutResultNestedInput;
};
export type DlMatchResultUncheckedUpdateWithoutTgmbaseUserInput = {
    id?: Prisma.BigIntFieldUpdateOperationsInput | bigint | number;
    runId?: Prisma.BigIntFieldUpdateOperationsInput | bigint | number;
    dlContactId?: Prisma.BigIntFieldUpdateOperationsInput | bigint | number;
    strictTelegramIdMatch?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    usernameMatch?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    phoneMatch?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    chatActivityMatch?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    dlContactSnapshot?: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    tgmbaseUserSnapshot?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    chats?: Prisma.DlMatchResultChatUncheckedUpdateManyWithoutResultNestedInput;
    messages?: Prisma.DlMatchResultMessageUncheckedUpdateManyWithoutResultNestedInput;
};
export type DlMatchResultUncheckedUpdateManyWithoutTgmbaseUserInput = {
    id?: Prisma.BigIntFieldUpdateOperationsInput | bigint | number;
    runId?: Prisma.BigIntFieldUpdateOperationsInput | bigint | number;
    dlContactId?: Prisma.BigIntFieldUpdateOperationsInput | bigint | number;
    strictTelegramIdMatch?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    usernameMatch?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    phoneMatch?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    chatActivityMatch?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    dlContactSnapshot?: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    tgmbaseUserSnapshot?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type DlMatchResultCreateManyDlContactInput = {
    id?: bigint | number;
    runId: bigint | number;
    tgmbaseUserId?: bigint | number | null;
    strictTelegramIdMatch?: boolean;
    usernameMatch?: boolean;
    phoneMatch?: boolean;
    chatActivityMatch?: boolean;
    dlContactSnapshot: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    tgmbaseUserSnapshot?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    createdAt?: Date | string;
};
export type DlMatchResultUpdateWithoutDlContactInput = {
    id?: Prisma.BigIntFieldUpdateOperationsInput | bigint | number;
    strictTelegramIdMatch?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    usernameMatch?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    phoneMatch?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    chatActivityMatch?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    dlContactSnapshot?: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    tgmbaseUserSnapshot?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    run?: Prisma.DlMatchRunUpdateOneRequiredWithoutResultsNestedInput;
    tgmbaseUser?: Prisma.userUpdateOneWithoutDlMatchesNestedInput;
    chats?: Prisma.DlMatchResultChatUpdateManyWithoutResultNestedInput;
    messages?: Prisma.DlMatchResultMessageUpdateManyWithoutResultNestedInput;
};
export type DlMatchResultUncheckedUpdateWithoutDlContactInput = {
    id?: Prisma.BigIntFieldUpdateOperationsInput | bigint | number;
    runId?: Prisma.BigIntFieldUpdateOperationsInput | bigint | number;
    tgmbaseUserId?: Prisma.NullableBigIntFieldUpdateOperationsInput | bigint | number | null;
    strictTelegramIdMatch?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    usernameMatch?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    phoneMatch?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    chatActivityMatch?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    dlContactSnapshot?: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    tgmbaseUserSnapshot?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    chats?: Prisma.DlMatchResultChatUncheckedUpdateManyWithoutResultNestedInput;
    messages?: Prisma.DlMatchResultMessageUncheckedUpdateManyWithoutResultNestedInput;
};
export type DlMatchResultUncheckedUpdateManyWithoutDlContactInput = {
    id?: Prisma.BigIntFieldUpdateOperationsInput | bigint | number;
    runId?: Prisma.BigIntFieldUpdateOperationsInput | bigint | number;
    tgmbaseUserId?: Prisma.NullableBigIntFieldUpdateOperationsInput | bigint | number | null;
    strictTelegramIdMatch?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    usernameMatch?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    phoneMatch?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    chatActivityMatch?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    dlContactSnapshot?: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    tgmbaseUserSnapshot?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type DlMatchResultCreateManyRunInput = {
    id?: bigint | number;
    dlContactId: bigint | number;
    tgmbaseUserId?: bigint | number | null;
    strictTelegramIdMatch?: boolean;
    usernameMatch?: boolean;
    phoneMatch?: boolean;
    chatActivityMatch?: boolean;
    dlContactSnapshot: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    tgmbaseUserSnapshot?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    createdAt?: Date | string;
};
export type DlMatchResultUpdateWithoutRunInput = {
    id?: Prisma.BigIntFieldUpdateOperationsInput | bigint | number;
    strictTelegramIdMatch?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    usernameMatch?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    phoneMatch?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    chatActivityMatch?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    dlContactSnapshot?: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    tgmbaseUserSnapshot?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    dlContact?: Prisma.DlContactUpdateOneRequiredWithoutMatchResultsNestedInput;
    tgmbaseUser?: Prisma.userUpdateOneWithoutDlMatchesNestedInput;
    chats?: Prisma.DlMatchResultChatUpdateManyWithoutResultNestedInput;
    messages?: Prisma.DlMatchResultMessageUpdateManyWithoutResultNestedInput;
};
export type DlMatchResultUncheckedUpdateWithoutRunInput = {
    id?: Prisma.BigIntFieldUpdateOperationsInput | bigint | number;
    dlContactId?: Prisma.BigIntFieldUpdateOperationsInput | bigint | number;
    tgmbaseUserId?: Prisma.NullableBigIntFieldUpdateOperationsInput | bigint | number | null;
    strictTelegramIdMatch?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    usernameMatch?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    phoneMatch?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    chatActivityMatch?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    dlContactSnapshot?: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    tgmbaseUserSnapshot?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    chats?: Prisma.DlMatchResultChatUncheckedUpdateManyWithoutResultNestedInput;
    messages?: Prisma.DlMatchResultMessageUncheckedUpdateManyWithoutResultNestedInput;
};
export type DlMatchResultUncheckedUpdateManyWithoutRunInput = {
    id?: Prisma.BigIntFieldUpdateOperationsInput | bigint | number;
    dlContactId?: Prisma.BigIntFieldUpdateOperationsInput | bigint | number;
    tgmbaseUserId?: Prisma.NullableBigIntFieldUpdateOperationsInput | bigint | number | null;
    strictTelegramIdMatch?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    usernameMatch?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    phoneMatch?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    chatActivityMatch?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    dlContactSnapshot?: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    tgmbaseUserSnapshot?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type DlMatchResultCountOutputType = {
    chats: number;
    messages: number;
};
export type DlMatchResultCountOutputTypeSelect<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    chats?: boolean | DlMatchResultCountOutputTypeCountChatsArgs;
    messages?: boolean | DlMatchResultCountOutputTypeCountMessagesArgs;
};
export type DlMatchResultCountOutputTypeDefaultArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.DlMatchResultCountOutputTypeSelect<ExtArgs> | null;
};
export type DlMatchResultCountOutputTypeCountChatsArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.DlMatchResultChatWhereInput;
};
export type DlMatchResultCountOutputTypeCountMessagesArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.DlMatchResultMessageWhereInput;
};
export type DlMatchResultSelect<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    runId?: boolean;
    dlContactId?: boolean;
    tgmbaseUserId?: boolean;
    strictTelegramIdMatch?: boolean;
    usernameMatch?: boolean;
    phoneMatch?: boolean;
    chatActivityMatch?: boolean;
    dlContactSnapshot?: boolean;
    tgmbaseUserSnapshot?: boolean;
    createdAt?: boolean;
    run?: boolean | Prisma.DlMatchRunDefaultArgs<ExtArgs>;
    dlContact?: boolean | Prisma.DlContactDefaultArgs<ExtArgs>;
    tgmbaseUser?: boolean | Prisma.DlMatchResult$tgmbaseUserArgs<ExtArgs>;
    chats?: boolean | Prisma.DlMatchResult$chatsArgs<ExtArgs>;
    messages?: boolean | Prisma.DlMatchResult$messagesArgs<ExtArgs>;
    _count?: boolean | Prisma.DlMatchResultCountOutputTypeDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["dlMatchResult"]>;
export type DlMatchResultSelectCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    runId?: boolean;
    dlContactId?: boolean;
    tgmbaseUserId?: boolean;
    strictTelegramIdMatch?: boolean;
    usernameMatch?: boolean;
    phoneMatch?: boolean;
    chatActivityMatch?: boolean;
    dlContactSnapshot?: boolean;
    tgmbaseUserSnapshot?: boolean;
    createdAt?: boolean;
    run?: boolean | Prisma.DlMatchRunDefaultArgs<ExtArgs>;
    dlContact?: boolean | Prisma.DlContactDefaultArgs<ExtArgs>;
    tgmbaseUser?: boolean | Prisma.DlMatchResult$tgmbaseUserArgs<ExtArgs>;
}, ExtArgs["result"]["dlMatchResult"]>;
export type DlMatchResultSelectUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    runId?: boolean;
    dlContactId?: boolean;
    tgmbaseUserId?: boolean;
    strictTelegramIdMatch?: boolean;
    usernameMatch?: boolean;
    phoneMatch?: boolean;
    chatActivityMatch?: boolean;
    dlContactSnapshot?: boolean;
    tgmbaseUserSnapshot?: boolean;
    createdAt?: boolean;
    run?: boolean | Prisma.DlMatchRunDefaultArgs<ExtArgs>;
    dlContact?: boolean | Prisma.DlContactDefaultArgs<ExtArgs>;
    tgmbaseUser?: boolean | Prisma.DlMatchResult$tgmbaseUserArgs<ExtArgs>;
}, ExtArgs["result"]["dlMatchResult"]>;
export type DlMatchResultSelectScalar = {
    id?: boolean;
    runId?: boolean;
    dlContactId?: boolean;
    tgmbaseUserId?: boolean;
    strictTelegramIdMatch?: boolean;
    usernameMatch?: boolean;
    phoneMatch?: boolean;
    chatActivityMatch?: boolean;
    dlContactSnapshot?: boolean;
    tgmbaseUserSnapshot?: boolean;
    createdAt?: boolean;
};
export type DlMatchResultOmit<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetOmit<"id" | "runId" | "dlContactId" | "tgmbaseUserId" | "strictTelegramIdMatch" | "usernameMatch" | "phoneMatch" | "chatActivityMatch" | "dlContactSnapshot" | "tgmbaseUserSnapshot" | "createdAt", ExtArgs["result"]["dlMatchResult"]>;
export type DlMatchResultInclude<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    run?: boolean | Prisma.DlMatchRunDefaultArgs<ExtArgs>;
    dlContact?: boolean | Prisma.DlContactDefaultArgs<ExtArgs>;
    tgmbaseUser?: boolean | Prisma.DlMatchResult$tgmbaseUserArgs<ExtArgs>;
    chats?: boolean | Prisma.DlMatchResult$chatsArgs<ExtArgs>;
    messages?: boolean | Prisma.DlMatchResult$messagesArgs<ExtArgs>;
    _count?: boolean | Prisma.DlMatchResultCountOutputTypeDefaultArgs<ExtArgs>;
};
export type DlMatchResultIncludeCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    run?: boolean | Prisma.DlMatchRunDefaultArgs<ExtArgs>;
    dlContact?: boolean | Prisma.DlContactDefaultArgs<ExtArgs>;
    tgmbaseUser?: boolean | Prisma.DlMatchResult$tgmbaseUserArgs<ExtArgs>;
};
export type DlMatchResultIncludeUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    run?: boolean | Prisma.DlMatchRunDefaultArgs<ExtArgs>;
    dlContact?: boolean | Prisma.DlContactDefaultArgs<ExtArgs>;
    tgmbaseUser?: boolean | Prisma.DlMatchResult$tgmbaseUserArgs<ExtArgs>;
};
export type $DlMatchResultPayload<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    name: "DlMatchResult";
    objects: {
        run: Prisma.$DlMatchRunPayload<ExtArgs>;
        dlContact: Prisma.$DlContactPayload<ExtArgs>;
        tgmbaseUser: Prisma.$userPayload<ExtArgs> | null;
        chats: Prisma.$DlMatchResultChatPayload<ExtArgs>[];
        messages: Prisma.$DlMatchResultMessagePayload<ExtArgs>[];
    };
    scalars: runtime.Types.Extensions.GetPayloadResult<{
        id: bigint;
        runId: bigint;
        dlContactId: bigint;
        tgmbaseUserId: bigint | null;
        strictTelegramIdMatch: boolean;
        usernameMatch: boolean;
        phoneMatch: boolean;
        chatActivityMatch: boolean;
        dlContactSnapshot: runtime.JsonValue;
        tgmbaseUserSnapshot: runtime.JsonValue | null;
        createdAt: Date;
    }, ExtArgs["result"]["dlMatchResult"]>;
    composites: {};
};
export type DlMatchResultGetPayload<S extends boolean | null | undefined | DlMatchResultDefaultArgs> = runtime.Types.Result.GetResult<Prisma.$DlMatchResultPayload, S>;
export type DlMatchResultCountArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = Omit<DlMatchResultFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
    select?: DlMatchResultCountAggregateInputType | true;
};
export interface DlMatchResultDelegate<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: {
        types: Prisma.TypeMap<ExtArgs>['model']['DlMatchResult'];
        meta: {
            name: 'DlMatchResult';
        };
    };
    findUnique<T extends DlMatchResultFindUniqueArgs>(args: Prisma.SelectSubset<T, DlMatchResultFindUniqueArgs<ExtArgs>>): Prisma.Prisma__DlMatchResultClient<runtime.Types.Result.GetResult<Prisma.$DlMatchResultPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    findUniqueOrThrow<T extends DlMatchResultFindUniqueOrThrowArgs>(args: Prisma.SelectSubset<T, DlMatchResultFindUniqueOrThrowArgs<ExtArgs>>): Prisma.Prisma__DlMatchResultClient<runtime.Types.Result.GetResult<Prisma.$DlMatchResultPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    findFirst<T extends DlMatchResultFindFirstArgs>(args?: Prisma.SelectSubset<T, DlMatchResultFindFirstArgs<ExtArgs>>): Prisma.Prisma__DlMatchResultClient<runtime.Types.Result.GetResult<Prisma.$DlMatchResultPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    findFirstOrThrow<T extends DlMatchResultFindFirstOrThrowArgs>(args?: Prisma.SelectSubset<T, DlMatchResultFindFirstOrThrowArgs<ExtArgs>>): Prisma.Prisma__DlMatchResultClient<runtime.Types.Result.GetResult<Prisma.$DlMatchResultPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    findMany<T extends DlMatchResultFindManyArgs>(args?: Prisma.SelectSubset<T, DlMatchResultFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$DlMatchResultPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>;
    create<T extends DlMatchResultCreateArgs>(args: Prisma.SelectSubset<T, DlMatchResultCreateArgs<ExtArgs>>): Prisma.Prisma__DlMatchResultClient<runtime.Types.Result.GetResult<Prisma.$DlMatchResultPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    createMany<T extends DlMatchResultCreateManyArgs>(args?: Prisma.SelectSubset<T, DlMatchResultCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    createManyAndReturn<T extends DlMatchResultCreateManyAndReturnArgs>(args?: Prisma.SelectSubset<T, DlMatchResultCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$DlMatchResultPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>;
    delete<T extends DlMatchResultDeleteArgs>(args: Prisma.SelectSubset<T, DlMatchResultDeleteArgs<ExtArgs>>): Prisma.Prisma__DlMatchResultClient<runtime.Types.Result.GetResult<Prisma.$DlMatchResultPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    update<T extends DlMatchResultUpdateArgs>(args: Prisma.SelectSubset<T, DlMatchResultUpdateArgs<ExtArgs>>): Prisma.Prisma__DlMatchResultClient<runtime.Types.Result.GetResult<Prisma.$DlMatchResultPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    deleteMany<T extends DlMatchResultDeleteManyArgs>(args?: Prisma.SelectSubset<T, DlMatchResultDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    updateMany<T extends DlMatchResultUpdateManyArgs>(args: Prisma.SelectSubset<T, DlMatchResultUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    updateManyAndReturn<T extends DlMatchResultUpdateManyAndReturnArgs>(args: Prisma.SelectSubset<T, DlMatchResultUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$DlMatchResultPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>;
    upsert<T extends DlMatchResultUpsertArgs>(args: Prisma.SelectSubset<T, DlMatchResultUpsertArgs<ExtArgs>>): Prisma.Prisma__DlMatchResultClient<runtime.Types.Result.GetResult<Prisma.$DlMatchResultPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    count<T extends DlMatchResultCountArgs>(args?: Prisma.Subset<T, DlMatchResultCountArgs>): Prisma.PrismaPromise<T extends runtime.Types.Utils.Record<'select', any> ? T['select'] extends true ? number : Prisma.GetScalarType<T['select'], DlMatchResultCountAggregateOutputType> : number>;
    aggregate<T extends DlMatchResultAggregateArgs>(args: Prisma.Subset<T, DlMatchResultAggregateArgs>): Prisma.PrismaPromise<GetDlMatchResultAggregateType<T>>;
    groupBy<T extends DlMatchResultGroupByArgs, HasSelectOrTake extends Prisma.Or<Prisma.Extends<'skip', Prisma.Keys<T>>, Prisma.Extends<'take', Prisma.Keys<T>>>, OrderByArg extends Prisma.True extends HasSelectOrTake ? {
        orderBy: DlMatchResultGroupByArgs['orderBy'];
    } : {
        orderBy?: DlMatchResultGroupByArgs['orderBy'];
    }, OrderFields extends Prisma.ExcludeUnderscoreKeys<Prisma.Keys<Prisma.MaybeTupleToUnion<T['orderBy']>>>, ByFields extends Prisma.MaybeTupleToUnion<T['by']>, ByValid extends Prisma.Has<ByFields, OrderFields>, HavingFields extends Prisma.GetHavingFields<T['having']>, HavingValid extends Prisma.Has<ByFields, HavingFields>, ByEmpty extends T['by'] extends never[] ? Prisma.True : Prisma.False, InputErrors extends ByEmpty extends Prisma.True ? `Error: "by" must not be empty.` : HavingValid extends Prisma.False ? {
        [P in HavingFields]: P extends ByFields ? never : P extends string ? `Error: Field "${P}" used in "having" needs to be provided in "by".` : [
            Error,
            'Field ',
            P,
            ` in "having" needs to be provided in "by"`
        ];
    }[HavingFields] : 'take' extends Prisma.Keys<T> ? 'orderBy' extends Prisma.Keys<T> ? ByValid extends Prisma.True ? {} : {
        [P in OrderFields]: P extends ByFields ? never : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`;
    }[OrderFields] : 'Error: If you provide "take", you also need to provide "orderBy"' : 'skip' extends Prisma.Keys<T> ? 'orderBy' extends Prisma.Keys<T> ? ByValid extends Prisma.True ? {} : {
        [P in OrderFields]: P extends ByFields ? never : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`;
    }[OrderFields] : 'Error: If you provide "skip", you also need to provide "orderBy"' : ByValid extends Prisma.True ? {} : {
        [P in OrderFields]: P extends ByFields ? never : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`;
    }[OrderFields]>(args: Prisma.SubsetIntersection<T, DlMatchResultGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetDlMatchResultGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>;
    readonly fields: DlMatchResultFieldRefs;
}
export interface Prisma__DlMatchResultClient<T, Null = never, ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise";
    run<T extends Prisma.DlMatchRunDefaultArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.DlMatchRunDefaultArgs<ExtArgs>>): Prisma.Prisma__DlMatchRunClient<runtime.Types.Result.GetResult<Prisma.$DlMatchRunPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>;
    dlContact<T extends Prisma.DlContactDefaultArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.DlContactDefaultArgs<ExtArgs>>): Prisma.Prisma__DlContactClient<runtime.Types.Result.GetResult<Prisma.$DlContactPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>;
    tgmbaseUser<T extends Prisma.DlMatchResult$tgmbaseUserArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.DlMatchResult$tgmbaseUserArgs<ExtArgs>>): Prisma.Prisma__userClient<runtime.Types.Result.GetResult<Prisma.$userPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    chats<T extends Prisma.DlMatchResult$chatsArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.DlMatchResult$chatsArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$DlMatchResultChatPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>;
    messages<T extends Prisma.DlMatchResult$messagesArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.DlMatchResult$messagesArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$DlMatchResultMessagePayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>;
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): runtime.Types.Utils.JsPromise<TResult1 | TResult2>;
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): runtime.Types.Utils.JsPromise<T | TResult>;
    finally(onfinally?: (() => void) | undefined | null): runtime.Types.Utils.JsPromise<T>;
}
export interface DlMatchResultFieldRefs {
    readonly id: Prisma.FieldRef<"DlMatchResult", 'BigInt'>;
    readonly runId: Prisma.FieldRef<"DlMatchResult", 'BigInt'>;
    readonly dlContactId: Prisma.FieldRef<"DlMatchResult", 'BigInt'>;
    readonly tgmbaseUserId: Prisma.FieldRef<"DlMatchResult", 'BigInt'>;
    readonly strictTelegramIdMatch: Prisma.FieldRef<"DlMatchResult", 'Boolean'>;
    readonly usernameMatch: Prisma.FieldRef<"DlMatchResult", 'Boolean'>;
    readonly phoneMatch: Prisma.FieldRef<"DlMatchResult", 'Boolean'>;
    readonly chatActivityMatch: Prisma.FieldRef<"DlMatchResult", 'Boolean'>;
    readonly dlContactSnapshot: Prisma.FieldRef<"DlMatchResult", 'Json'>;
    readonly tgmbaseUserSnapshot: Prisma.FieldRef<"DlMatchResult", 'Json'>;
    readonly createdAt: Prisma.FieldRef<"DlMatchResult", 'DateTime'>;
}
export type DlMatchResultFindUniqueArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.DlMatchResultSelect<ExtArgs> | null;
    omit?: Prisma.DlMatchResultOmit<ExtArgs> | null;
    include?: Prisma.DlMatchResultInclude<ExtArgs> | null;
    where: Prisma.DlMatchResultWhereUniqueInput;
};
export type DlMatchResultFindUniqueOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.DlMatchResultSelect<ExtArgs> | null;
    omit?: Prisma.DlMatchResultOmit<ExtArgs> | null;
    include?: Prisma.DlMatchResultInclude<ExtArgs> | null;
    where: Prisma.DlMatchResultWhereUniqueInput;
};
export type DlMatchResultFindFirstArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.DlMatchResultSelect<ExtArgs> | null;
    omit?: Prisma.DlMatchResultOmit<ExtArgs> | null;
    include?: Prisma.DlMatchResultInclude<ExtArgs> | null;
    where?: Prisma.DlMatchResultWhereInput;
    orderBy?: Prisma.DlMatchResultOrderByWithRelationInput | Prisma.DlMatchResultOrderByWithRelationInput[];
    cursor?: Prisma.DlMatchResultWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.DlMatchResultScalarFieldEnum | Prisma.DlMatchResultScalarFieldEnum[];
};
export type DlMatchResultFindFirstOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.DlMatchResultSelect<ExtArgs> | null;
    omit?: Prisma.DlMatchResultOmit<ExtArgs> | null;
    include?: Prisma.DlMatchResultInclude<ExtArgs> | null;
    where?: Prisma.DlMatchResultWhereInput;
    orderBy?: Prisma.DlMatchResultOrderByWithRelationInput | Prisma.DlMatchResultOrderByWithRelationInput[];
    cursor?: Prisma.DlMatchResultWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.DlMatchResultScalarFieldEnum | Prisma.DlMatchResultScalarFieldEnum[];
};
export type DlMatchResultFindManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.DlMatchResultSelect<ExtArgs> | null;
    omit?: Prisma.DlMatchResultOmit<ExtArgs> | null;
    include?: Prisma.DlMatchResultInclude<ExtArgs> | null;
    where?: Prisma.DlMatchResultWhereInput;
    orderBy?: Prisma.DlMatchResultOrderByWithRelationInput | Prisma.DlMatchResultOrderByWithRelationInput[];
    cursor?: Prisma.DlMatchResultWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.DlMatchResultScalarFieldEnum | Prisma.DlMatchResultScalarFieldEnum[];
};
export type DlMatchResultCreateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.DlMatchResultSelect<ExtArgs> | null;
    omit?: Prisma.DlMatchResultOmit<ExtArgs> | null;
    include?: Prisma.DlMatchResultInclude<ExtArgs> | null;
    data: Prisma.XOR<Prisma.DlMatchResultCreateInput, Prisma.DlMatchResultUncheckedCreateInput>;
};
export type DlMatchResultCreateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    data: Prisma.DlMatchResultCreateManyInput | Prisma.DlMatchResultCreateManyInput[];
    skipDuplicates?: boolean;
};
export type DlMatchResultCreateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.DlMatchResultSelectCreateManyAndReturn<ExtArgs> | null;
    omit?: Prisma.DlMatchResultOmit<ExtArgs> | null;
    data: Prisma.DlMatchResultCreateManyInput | Prisma.DlMatchResultCreateManyInput[];
    skipDuplicates?: boolean;
    include?: Prisma.DlMatchResultIncludeCreateManyAndReturn<ExtArgs> | null;
};
export type DlMatchResultUpdateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.DlMatchResultSelect<ExtArgs> | null;
    omit?: Prisma.DlMatchResultOmit<ExtArgs> | null;
    include?: Prisma.DlMatchResultInclude<ExtArgs> | null;
    data: Prisma.XOR<Prisma.DlMatchResultUpdateInput, Prisma.DlMatchResultUncheckedUpdateInput>;
    where: Prisma.DlMatchResultWhereUniqueInput;
};
export type DlMatchResultUpdateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    data: Prisma.XOR<Prisma.DlMatchResultUpdateManyMutationInput, Prisma.DlMatchResultUncheckedUpdateManyInput>;
    where?: Prisma.DlMatchResultWhereInput;
    limit?: number;
};
export type DlMatchResultUpdateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.DlMatchResultSelectUpdateManyAndReturn<ExtArgs> | null;
    omit?: Prisma.DlMatchResultOmit<ExtArgs> | null;
    data: Prisma.XOR<Prisma.DlMatchResultUpdateManyMutationInput, Prisma.DlMatchResultUncheckedUpdateManyInput>;
    where?: Prisma.DlMatchResultWhereInput;
    limit?: number;
    include?: Prisma.DlMatchResultIncludeUpdateManyAndReturn<ExtArgs> | null;
};
export type DlMatchResultUpsertArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.DlMatchResultSelect<ExtArgs> | null;
    omit?: Prisma.DlMatchResultOmit<ExtArgs> | null;
    include?: Prisma.DlMatchResultInclude<ExtArgs> | null;
    where: Prisma.DlMatchResultWhereUniqueInput;
    create: Prisma.XOR<Prisma.DlMatchResultCreateInput, Prisma.DlMatchResultUncheckedCreateInput>;
    update: Prisma.XOR<Prisma.DlMatchResultUpdateInput, Prisma.DlMatchResultUncheckedUpdateInput>;
};
export type DlMatchResultDeleteArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.DlMatchResultSelect<ExtArgs> | null;
    omit?: Prisma.DlMatchResultOmit<ExtArgs> | null;
    include?: Prisma.DlMatchResultInclude<ExtArgs> | null;
    where: Prisma.DlMatchResultWhereUniqueInput;
};
export type DlMatchResultDeleteManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.DlMatchResultWhereInput;
    limit?: number;
};
export type DlMatchResult$tgmbaseUserArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.userSelect<ExtArgs> | null;
    omit?: Prisma.userOmit<ExtArgs> | null;
    include?: Prisma.userInclude<ExtArgs> | null;
    where?: Prisma.userWhereInput;
};
export type DlMatchResult$chatsArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.DlMatchResultChatSelect<ExtArgs> | null;
    omit?: Prisma.DlMatchResultChatOmit<ExtArgs> | null;
    include?: Prisma.DlMatchResultChatInclude<ExtArgs> | null;
    where?: Prisma.DlMatchResultChatWhereInput;
    orderBy?: Prisma.DlMatchResultChatOrderByWithRelationInput | Prisma.DlMatchResultChatOrderByWithRelationInput[];
    cursor?: Prisma.DlMatchResultChatWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.DlMatchResultChatScalarFieldEnum | Prisma.DlMatchResultChatScalarFieldEnum[];
};
export type DlMatchResult$messagesArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.DlMatchResultMessageSelect<ExtArgs> | null;
    omit?: Prisma.DlMatchResultMessageOmit<ExtArgs> | null;
    include?: Prisma.DlMatchResultMessageInclude<ExtArgs> | null;
    where?: Prisma.DlMatchResultMessageWhereInput;
    orderBy?: Prisma.DlMatchResultMessageOrderByWithRelationInput | Prisma.DlMatchResultMessageOrderByWithRelationInput[];
    cursor?: Prisma.DlMatchResultMessageWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.DlMatchResultMessageScalarFieldEnum | Prisma.DlMatchResultMessageScalarFieldEnum[];
};
export type DlMatchResultDefaultArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.DlMatchResultSelect<ExtArgs> | null;
    omit?: Prisma.DlMatchResultOmit<ExtArgs> | null;
    include?: Prisma.DlMatchResultInclude<ExtArgs> | null;
};
export {};
