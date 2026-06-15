import type * as runtime from "@prisma/client/runtime/client";
import type * as $Enums from "../enums.js";
import type * as Prisma from "../internal/prismaNamespace.js";
export type TelegramChatMemberModel = runtime.Types.Result.DefaultSelection<Prisma.$TelegramChatMemberPayload>;
export type AggregateTelegramChatMember = {
    _count: TelegramChatMemberCountAggregateOutputType | null;
    _avg: TelegramChatMemberAvgAggregateOutputType | null;
    _sum: TelegramChatMemberSumAggregateOutputType | null;
    _min: TelegramChatMemberMinAggregateOutputType | null;
    _max: TelegramChatMemberMaxAggregateOutputType | null;
};
export type TelegramChatMemberAvgAggregateOutputType = {
    id: number | null;
    chatId: number | null;
    userId: number | null;
};
export type TelegramChatMemberSumAggregateOutputType = {
    id: number | null;
    chatId: number | null;
    userId: number | null;
};
export type TelegramChatMemberMinAggregateOutputType = {
    id: number | null;
    chatId: number | null;
    userId: number | null;
    status: $Enums.TelegramMemberStatus | null;
    isAdmin: boolean | null;
    isOwner: boolean | null;
    joinedAt: Date | null;
    leftAt: Date | null;
    importedAt: Date | null;
};
export type TelegramChatMemberMaxAggregateOutputType = {
    id: number | null;
    chatId: number | null;
    userId: number | null;
    status: $Enums.TelegramMemberStatus | null;
    isAdmin: boolean | null;
    isOwner: boolean | null;
    joinedAt: Date | null;
    leftAt: Date | null;
    importedAt: Date | null;
};
export type TelegramChatMemberCountAggregateOutputType = {
    id: number;
    chatId: number;
    userId: number;
    status: number;
    isAdmin: number;
    isOwner: number;
    joinedAt: number;
    leftAt: number;
    importedAt: number;
    rawPayload: number;
    _all: number;
};
export type TelegramChatMemberAvgAggregateInputType = {
    id?: true;
    chatId?: true;
    userId?: true;
};
export type TelegramChatMemberSumAggregateInputType = {
    id?: true;
    chatId?: true;
    userId?: true;
};
export type TelegramChatMemberMinAggregateInputType = {
    id?: true;
    chatId?: true;
    userId?: true;
    status?: true;
    isAdmin?: true;
    isOwner?: true;
    joinedAt?: true;
    leftAt?: true;
    importedAt?: true;
};
export type TelegramChatMemberMaxAggregateInputType = {
    id?: true;
    chatId?: true;
    userId?: true;
    status?: true;
    isAdmin?: true;
    isOwner?: true;
    joinedAt?: true;
    leftAt?: true;
    importedAt?: true;
};
export type TelegramChatMemberCountAggregateInputType = {
    id?: true;
    chatId?: true;
    userId?: true;
    status?: true;
    isAdmin?: true;
    isOwner?: true;
    joinedAt?: true;
    leftAt?: true;
    importedAt?: true;
    rawPayload?: true;
    _all?: true;
};
export type TelegramChatMemberAggregateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.TelegramChatMemberWhereInput;
    orderBy?: Prisma.TelegramChatMemberOrderByWithRelationInput | Prisma.TelegramChatMemberOrderByWithRelationInput[];
    cursor?: Prisma.TelegramChatMemberWhereUniqueInput;
    take?: number;
    skip?: number;
    _count?: true | TelegramChatMemberCountAggregateInputType;
    _avg?: TelegramChatMemberAvgAggregateInputType;
    _sum?: TelegramChatMemberSumAggregateInputType;
    _min?: TelegramChatMemberMinAggregateInputType;
    _max?: TelegramChatMemberMaxAggregateInputType;
};
export type GetTelegramChatMemberAggregateType<T extends TelegramChatMemberAggregateArgs> = {
    [P in keyof T & keyof AggregateTelegramChatMember]: P extends '_count' | 'count' ? T[P] extends true ? number : Prisma.GetScalarType<T[P], AggregateTelegramChatMember[P]> : Prisma.GetScalarType<T[P], AggregateTelegramChatMember[P]>;
};
export type TelegramChatMemberGroupByArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.TelegramChatMemberWhereInput;
    orderBy?: Prisma.TelegramChatMemberOrderByWithAggregationInput | Prisma.TelegramChatMemberOrderByWithAggregationInput[];
    by: Prisma.TelegramChatMemberScalarFieldEnum[] | Prisma.TelegramChatMemberScalarFieldEnum;
    having?: Prisma.TelegramChatMemberScalarWhereWithAggregatesInput;
    take?: number;
    skip?: number;
    _count?: TelegramChatMemberCountAggregateInputType | true;
    _avg?: TelegramChatMemberAvgAggregateInputType;
    _sum?: TelegramChatMemberSumAggregateInputType;
    _min?: TelegramChatMemberMinAggregateInputType;
    _max?: TelegramChatMemberMaxAggregateInputType;
};
export type TelegramChatMemberGroupByOutputType = {
    id: number;
    chatId: number;
    userId: number;
    status: $Enums.TelegramMemberStatus;
    isAdmin: boolean;
    isOwner: boolean;
    joinedAt: Date | null;
    leftAt: Date | null;
    importedAt: Date;
    rawPayload: runtime.JsonValue | null;
    _count: TelegramChatMemberCountAggregateOutputType | null;
    _avg: TelegramChatMemberAvgAggregateOutputType | null;
    _sum: TelegramChatMemberSumAggregateOutputType | null;
    _min: TelegramChatMemberMinAggregateOutputType | null;
    _max: TelegramChatMemberMaxAggregateOutputType | null;
};
type GetTelegramChatMemberGroupByPayload<T extends TelegramChatMemberGroupByArgs> = Prisma.PrismaPromise<Array<Prisma.PickEnumerable<TelegramChatMemberGroupByOutputType, T['by']> & {
    [P in ((keyof T) & (keyof TelegramChatMemberGroupByOutputType))]: P extends '_count' ? T[P] extends boolean ? number : Prisma.GetScalarType<T[P], TelegramChatMemberGroupByOutputType[P]> : Prisma.GetScalarType<T[P], TelegramChatMemberGroupByOutputType[P]>;
}>>;
export type TelegramChatMemberWhereInput = {
    AND?: Prisma.TelegramChatMemberWhereInput | Prisma.TelegramChatMemberWhereInput[];
    OR?: Prisma.TelegramChatMemberWhereInput[];
    NOT?: Prisma.TelegramChatMemberWhereInput | Prisma.TelegramChatMemberWhereInput[];
    id?: Prisma.IntFilter<"TelegramChatMember"> | number;
    chatId?: Prisma.IntFilter<"TelegramChatMember"> | number;
    userId?: Prisma.IntFilter<"TelegramChatMember"> | number;
    status?: Prisma.EnumTelegramMemberStatusFilter<"TelegramChatMember"> | $Enums.TelegramMemberStatus;
    isAdmin?: Prisma.BoolFilter<"TelegramChatMember"> | boolean;
    isOwner?: Prisma.BoolFilter<"TelegramChatMember"> | boolean;
    joinedAt?: Prisma.DateTimeNullableFilter<"TelegramChatMember"> | Date | string | null;
    leftAt?: Prisma.DateTimeNullableFilter<"TelegramChatMember"> | Date | string | null;
    importedAt?: Prisma.DateTimeFilter<"TelegramChatMember"> | Date | string;
    rawPayload?: Prisma.JsonNullableFilter<"TelegramChatMember">;
    chat?: Prisma.XOR<Prisma.TelegramChatScalarRelationFilter, Prisma.TelegramChatWhereInput>;
    user?: Prisma.XOR<Prisma.TelegramUserScalarRelationFilter, Prisma.TelegramUserWhereInput>;
};
export type TelegramChatMemberOrderByWithRelationInput = {
    id?: Prisma.SortOrder;
    chatId?: Prisma.SortOrder;
    userId?: Prisma.SortOrder;
    status?: Prisma.SortOrder;
    isAdmin?: Prisma.SortOrder;
    isOwner?: Prisma.SortOrder;
    joinedAt?: Prisma.SortOrderInput | Prisma.SortOrder;
    leftAt?: Prisma.SortOrderInput | Prisma.SortOrder;
    importedAt?: Prisma.SortOrder;
    rawPayload?: Prisma.SortOrderInput | Prisma.SortOrder;
    chat?: Prisma.TelegramChatOrderByWithRelationInput;
    user?: Prisma.TelegramUserOrderByWithRelationInput;
};
export type TelegramChatMemberWhereUniqueInput = Prisma.AtLeast<{
    id?: number;
    chatId_userId?: Prisma.TelegramChatMemberChatIdUserIdCompoundUniqueInput;
    AND?: Prisma.TelegramChatMemberWhereInput | Prisma.TelegramChatMemberWhereInput[];
    OR?: Prisma.TelegramChatMemberWhereInput[];
    NOT?: Prisma.TelegramChatMemberWhereInput | Prisma.TelegramChatMemberWhereInput[];
    chatId?: Prisma.IntFilter<"TelegramChatMember"> | number;
    userId?: Prisma.IntFilter<"TelegramChatMember"> | number;
    status?: Prisma.EnumTelegramMemberStatusFilter<"TelegramChatMember"> | $Enums.TelegramMemberStatus;
    isAdmin?: Prisma.BoolFilter<"TelegramChatMember"> | boolean;
    isOwner?: Prisma.BoolFilter<"TelegramChatMember"> | boolean;
    joinedAt?: Prisma.DateTimeNullableFilter<"TelegramChatMember"> | Date | string | null;
    leftAt?: Prisma.DateTimeNullableFilter<"TelegramChatMember"> | Date | string | null;
    importedAt?: Prisma.DateTimeFilter<"TelegramChatMember"> | Date | string;
    rawPayload?: Prisma.JsonNullableFilter<"TelegramChatMember">;
    chat?: Prisma.XOR<Prisma.TelegramChatScalarRelationFilter, Prisma.TelegramChatWhereInput>;
    user?: Prisma.XOR<Prisma.TelegramUserScalarRelationFilter, Prisma.TelegramUserWhereInput>;
}, "id" | "chatId_userId">;
export type TelegramChatMemberOrderByWithAggregationInput = {
    id?: Prisma.SortOrder;
    chatId?: Prisma.SortOrder;
    userId?: Prisma.SortOrder;
    status?: Prisma.SortOrder;
    isAdmin?: Prisma.SortOrder;
    isOwner?: Prisma.SortOrder;
    joinedAt?: Prisma.SortOrderInput | Prisma.SortOrder;
    leftAt?: Prisma.SortOrderInput | Prisma.SortOrder;
    importedAt?: Prisma.SortOrder;
    rawPayload?: Prisma.SortOrderInput | Prisma.SortOrder;
    _count?: Prisma.TelegramChatMemberCountOrderByAggregateInput;
    _avg?: Prisma.TelegramChatMemberAvgOrderByAggregateInput;
    _max?: Prisma.TelegramChatMemberMaxOrderByAggregateInput;
    _min?: Prisma.TelegramChatMemberMinOrderByAggregateInput;
    _sum?: Prisma.TelegramChatMemberSumOrderByAggregateInput;
};
export type TelegramChatMemberScalarWhereWithAggregatesInput = {
    AND?: Prisma.TelegramChatMemberScalarWhereWithAggregatesInput | Prisma.TelegramChatMemberScalarWhereWithAggregatesInput[];
    OR?: Prisma.TelegramChatMemberScalarWhereWithAggregatesInput[];
    NOT?: Prisma.TelegramChatMemberScalarWhereWithAggregatesInput | Prisma.TelegramChatMemberScalarWhereWithAggregatesInput[];
    id?: Prisma.IntWithAggregatesFilter<"TelegramChatMember"> | number;
    chatId?: Prisma.IntWithAggregatesFilter<"TelegramChatMember"> | number;
    userId?: Prisma.IntWithAggregatesFilter<"TelegramChatMember"> | number;
    status?: Prisma.EnumTelegramMemberStatusWithAggregatesFilter<"TelegramChatMember"> | $Enums.TelegramMemberStatus;
    isAdmin?: Prisma.BoolWithAggregatesFilter<"TelegramChatMember"> | boolean;
    isOwner?: Prisma.BoolWithAggregatesFilter<"TelegramChatMember"> | boolean;
    joinedAt?: Prisma.DateTimeNullableWithAggregatesFilter<"TelegramChatMember"> | Date | string | null;
    leftAt?: Prisma.DateTimeNullableWithAggregatesFilter<"TelegramChatMember"> | Date | string | null;
    importedAt?: Prisma.DateTimeWithAggregatesFilter<"TelegramChatMember"> | Date | string;
    rawPayload?: Prisma.JsonNullableWithAggregatesFilter<"TelegramChatMember">;
};
export type TelegramChatMemberCreateInput = {
    status: $Enums.TelegramMemberStatus;
    isAdmin?: boolean;
    isOwner?: boolean;
    joinedAt?: Date | string | null;
    leftAt?: Date | string | null;
    importedAt?: Date | string;
    rawPayload?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    chat: Prisma.TelegramChatCreateNestedOneWithoutMembersInput;
    user: Prisma.TelegramUserCreateNestedOneWithoutMembershipsInput;
};
export type TelegramChatMemberUncheckedCreateInput = {
    id?: number;
    chatId: number;
    userId: number;
    status: $Enums.TelegramMemberStatus;
    isAdmin?: boolean;
    isOwner?: boolean;
    joinedAt?: Date | string | null;
    leftAt?: Date | string | null;
    importedAt?: Date | string;
    rawPayload?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
};
export type TelegramChatMemberUpdateInput = {
    status?: Prisma.EnumTelegramMemberStatusFieldUpdateOperationsInput | $Enums.TelegramMemberStatus;
    isAdmin?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    isOwner?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    joinedAt?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    leftAt?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    importedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    rawPayload?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    chat?: Prisma.TelegramChatUpdateOneRequiredWithoutMembersNestedInput;
    user?: Prisma.TelegramUserUpdateOneRequiredWithoutMembershipsNestedInput;
};
export type TelegramChatMemberUncheckedUpdateInput = {
    id?: Prisma.IntFieldUpdateOperationsInput | number;
    chatId?: Prisma.IntFieldUpdateOperationsInput | number;
    userId?: Prisma.IntFieldUpdateOperationsInput | number;
    status?: Prisma.EnumTelegramMemberStatusFieldUpdateOperationsInput | $Enums.TelegramMemberStatus;
    isAdmin?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    isOwner?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    joinedAt?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    leftAt?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    importedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    rawPayload?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
};
export type TelegramChatMemberCreateManyInput = {
    id?: number;
    chatId: number;
    userId: number;
    status: $Enums.TelegramMemberStatus;
    isAdmin?: boolean;
    isOwner?: boolean;
    joinedAt?: Date | string | null;
    leftAt?: Date | string | null;
    importedAt?: Date | string;
    rawPayload?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
};
export type TelegramChatMemberUpdateManyMutationInput = {
    status?: Prisma.EnumTelegramMemberStatusFieldUpdateOperationsInput | $Enums.TelegramMemberStatus;
    isAdmin?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    isOwner?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    joinedAt?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    leftAt?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    importedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    rawPayload?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
};
export type TelegramChatMemberUncheckedUpdateManyInput = {
    id?: Prisma.IntFieldUpdateOperationsInput | number;
    chatId?: Prisma.IntFieldUpdateOperationsInput | number;
    userId?: Prisma.IntFieldUpdateOperationsInput | number;
    status?: Prisma.EnumTelegramMemberStatusFieldUpdateOperationsInput | $Enums.TelegramMemberStatus;
    isAdmin?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    isOwner?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    joinedAt?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    leftAt?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    importedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    rawPayload?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
};
export type TelegramChatMemberListRelationFilter = {
    every?: Prisma.TelegramChatMemberWhereInput;
    some?: Prisma.TelegramChatMemberWhereInput;
    none?: Prisma.TelegramChatMemberWhereInput;
};
export type TelegramChatMemberOrderByRelationAggregateInput = {
    _count?: Prisma.SortOrder;
};
export type TelegramChatMemberChatIdUserIdCompoundUniqueInput = {
    chatId: number;
    userId: number;
};
export type TelegramChatMemberCountOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    chatId?: Prisma.SortOrder;
    userId?: Prisma.SortOrder;
    status?: Prisma.SortOrder;
    isAdmin?: Prisma.SortOrder;
    isOwner?: Prisma.SortOrder;
    joinedAt?: Prisma.SortOrder;
    leftAt?: Prisma.SortOrder;
    importedAt?: Prisma.SortOrder;
    rawPayload?: Prisma.SortOrder;
};
export type TelegramChatMemberAvgOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    chatId?: Prisma.SortOrder;
    userId?: Prisma.SortOrder;
};
export type TelegramChatMemberMaxOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    chatId?: Prisma.SortOrder;
    userId?: Prisma.SortOrder;
    status?: Prisma.SortOrder;
    isAdmin?: Prisma.SortOrder;
    isOwner?: Prisma.SortOrder;
    joinedAt?: Prisma.SortOrder;
    leftAt?: Prisma.SortOrder;
    importedAt?: Prisma.SortOrder;
};
export type TelegramChatMemberMinOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    chatId?: Prisma.SortOrder;
    userId?: Prisma.SortOrder;
    status?: Prisma.SortOrder;
    isAdmin?: Prisma.SortOrder;
    isOwner?: Prisma.SortOrder;
    joinedAt?: Prisma.SortOrder;
    leftAt?: Prisma.SortOrder;
    importedAt?: Prisma.SortOrder;
};
export type TelegramChatMemberSumOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    chatId?: Prisma.SortOrder;
    userId?: Prisma.SortOrder;
};
export type TelegramChatMemberCreateNestedManyWithoutChatInput = {
    create?: Prisma.XOR<Prisma.TelegramChatMemberCreateWithoutChatInput, Prisma.TelegramChatMemberUncheckedCreateWithoutChatInput> | Prisma.TelegramChatMemberCreateWithoutChatInput[] | Prisma.TelegramChatMemberUncheckedCreateWithoutChatInput[];
    connectOrCreate?: Prisma.TelegramChatMemberCreateOrConnectWithoutChatInput | Prisma.TelegramChatMemberCreateOrConnectWithoutChatInput[];
    createMany?: Prisma.TelegramChatMemberCreateManyChatInputEnvelope;
    connect?: Prisma.TelegramChatMemberWhereUniqueInput | Prisma.TelegramChatMemberWhereUniqueInput[];
};
export type TelegramChatMemberUncheckedCreateNestedManyWithoutChatInput = {
    create?: Prisma.XOR<Prisma.TelegramChatMemberCreateWithoutChatInput, Prisma.TelegramChatMemberUncheckedCreateWithoutChatInput> | Prisma.TelegramChatMemberCreateWithoutChatInput[] | Prisma.TelegramChatMemberUncheckedCreateWithoutChatInput[];
    connectOrCreate?: Prisma.TelegramChatMemberCreateOrConnectWithoutChatInput | Prisma.TelegramChatMemberCreateOrConnectWithoutChatInput[];
    createMany?: Prisma.TelegramChatMemberCreateManyChatInputEnvelope;
    connect?: Prisma.TelegramChatMemberWhereUniqueInput | Prisma.TelegramChatMemberWhereUniqueInput[];
};
export type TelegramChatMemberUpdateManyWithoutChatNestedInput = {
    create?: Prisma.XOR<Prisma.TelegramChatMemberCreateWithoutChatInput, Prisma.TelegramChatMemberUncheckedCreateWithoutChatInput> | Prisma.TelegramChatMemberCreateWithoutChatInput[] | Prisma.TelegramChatMemberUncheckedCreateWithoutChatInput[];
    connectOrCreate?: Prisma.TelegramChatMemberCreateOrConnectWithoutChatInput | Prisma.TelegramChatMemberCreateOrConnectWithoutChatInput[];
    upsert?: Prisma.TelegramChatMemberUpsertWithWhereUniqueWithoutChatInput | Prisma.TelegramChatMemberUpsertWithWhereUniqueWithoutChatInput[];
    createMany?: Prisma.TelegramChatMemberCreateManyChatInputEnvelope;
    set?: Prisma.TelegramChatMemberWhereUniqueInput | Prisma.TelegramChatMemberWhereUniqueInput[];
    disconnect?: Prisma.TelegramChatMemberWhereUniqueInput | Prisma.TelegramChatMemberWhereUniqueInput[];
    delete?: Prisma.TelegramChatMemberWhereUniqueInput | Prisma.TelegramChatMemberWhereUniqueInput[];
    connect?: Prisma.TelegramChatMemberWhereUniqueInput | Prisma.TelegramChatMemberWhereUniqueInput[];
    update?: Prisma.TelegramChatMemberUpdateWithWhereUniqueWithoutChatInput | Prisma.TelegramChatMemberUpdateWithWhereUniqueWithoutChatInput[];
    updateMany?: Prisma.TelegramChatMemberUpdateManyWithWhereWithoutChatInput | Prisma.TelegramChatMemberUpdateManyWithWhereWithoutChatInput[];
    deleteMany?: Prisma.TelegramChatMemberScalarWhereInput | Prisma.TelegramChatMemberScalarWhereInput[];
};
export type TelegramChatMemberUncheckedUpdateManyWithoutChatNestedInput = {
    create?: Prisma.XOR<Prisma.TelegramChatMemberCreateWithoutChatInput, Prisma.TelegramChatMemberUncheckedCreateWithoutChatInput> | Prisma.TelegramChatMemberCreateWithoutChatInput[] | Prisma.TelegramChatMemberUncheckedCreateWithoutChatInput[];
    connectOrCreate?: Prisma.TelegramChatMemberCreateOrConnectWithoutChatInput | Prisma.TelegramChatMemberCreateOrConnectWithoutChatInput[];
    upsert?: Prisma.TelegramChatMemberUpsertWithWhereUniqueWithoutChatInput | Prisma.TelegramChatMemberUpsertWithWhereUniqueWithoutChatInput[];
    createMany?: Prisma.TelegramChatMemberCreateManyChatInputEnvelope;
    set?: Prisma.TelegramChatMemberWhereUniqueInput | Prisma.TelegramChatMemberWhereUniqueInput[];
    disconnect?: Prisma.TelegramChatMemberWhereUniqueInput | Prisma.TelegramChatMemberWhereUniqueInput[];
    delete?: Prisma.TelegramChatMemberWhereUniqueInput | Prisma.TelegramChatMemberWhereUniqueInput[];
    connect?: Prisma.TelegramChatMemberWhereUniqueInput | Prisma.TelegramChatMemberWhereUniqueInput[];
    update?: Prisma.TelegramChatMemberUpdateWithWhereUniqueWithoutChatInput | Prisma.TelegramChatMemberUpdateWithWhereUniqueWithoutChatInput[];
    updateMany?: Prisma.TelegramChatMemberUpdateManyWithWhereWithoutChatInput | Prisma.TelegramChatMemberUpdateManyWithWhereWithoutChatInput[];
    deleteMany?: Prisma.TelegramChatMemberScalarWhereInput | Prisma.TelegramChatMemberScalarWhereInput[];
};
export type TelegramChatMemberCreateNestedManyWithoutUserInput = {
    create?: Prisma.XOR<Prisma.TelegramChatMemberCreateWithoutUserInput, Prisma.TelegramChatMemberUncheckedCreateWithoutUserInput> | Prisma.TelegramChatMemberCreateWithoutUserInput[] | Prisma.TelegramChatMemberUncheckedCreateWithoutUserInput[];
    connectOrCreate?: Prisma.TelegramChatMemberCreateOrConnectWithoutUserInput | Prisma.TelegramChatMemberCreateOrConnectWithoutUserInput[];
    createMany?: Prisma.TelegramChatMemberCreateManyUserInputEnvelope;
    connect?: Prisma.TelegramChatMemberWhereUniqueInput | Prisma.TelegramChatMemberWhereUniqueInput[];
};
export type TelegramChatMemberUncheckedCreateNestedManyWithoutUserInput = {
    create?: Prisma.XOR<Prisma.TelegramChatMemberCreateWithoutUserInput, Prisma.TelegramChatMemberUncheckedCreateWithoutUserInput> | Prisma.TelegramChatMemberCreateWithoutUserInput[] | Prisma.TelegramChatMemberUncheckedCreateWithoutUserInput[];
    connectOrCreate?: Prisma.TelegramChatMemberCreateOrConnectWithoutUserInput | Prisma.TelegramChatMemberCreateOrConnectWithoutUserInput[];
    createMany?: Prisma.TelegramChatMemberCreateManyUserInputEnvelope;
    connect?: Prisma.TelegramChatMemberWhereUniqueInput | Prisma.TelegramChatMemberWhereUniqueInput[];
};
export type TelegramChatMemberUpdateManyWithoutUserNestedInput = {
    create?: Prisma.XOR<Prisma.TelegramChatMemberCreateWithoutUserInput, Prisma.TelegramChatMemberUncheckedCreateWithoutUserInput> | Prisma.TelegramChatMemberCreateWithoutUserInput[] | Prisma.TelegramChatMemberUncheckedCreateWithoutUserInput[];
    connectOrCreate?: Prisma.TelegramChatMemberCreateOrConnectWithoutUserInput | Prisma.TelegramChatMemberCreateOrConnectWithoutUserInput[];
    upsert?: Prisma.TelegramChatMemberUpsertWithWhereUniqueWithoutUserInput | Prisma.TelegramChatMemberUpsertWithWhereUniqueWithoutUserInput[];
    createMany?: Prisma.TelegramChatMemberCreateManyUserInputEnvelope;
    set?: Prisma.TelegramChatMemberWhereUniqueInput | Prisma.TelegramChatMemberWhereUniqueInput[];
    disconnect?: Prisma.TelegramChatMemberWhereUniqueInput | Prisma.TelegramChatMemberWhereUniqueInput[];
    delete?: Prisma.TelegramChatMemberWhereUniqueInput | Prisma.TelegramChatMemberWhereUniqueInput[];
    connect?: Prisma.TelegramChatMemberWhereUniqueInput | Prisma.TelegramChatMemberWhereUniqueInput[];
    update?: Prisma.TelegramChatMemberUpdateWithWhereUniqueWithoutUserInput | Prisma.TelegramChatMemberUpdateWithWhereUniqueWithoutUserInput[];
    updateMany?: Prisma.TelegramChatMemberUpdateManyWithWhereWithoutUserInput | Prisma.TelegramChatMemberUpdateManyWithWhereWithoutUserInput[];
    deleteMany?: Prisma.TelegramChatMemberScalarWhereInput | Prisma.TelegramChatMemberScalarWhereInput[];
};
export type TelegramChatMemberUncheckedUpdateManyWithoutUserNestedInput = {
    create?: Prisma.XOR<Prisma.TelegramChatMemberCreateWithoutUserInput, Prisma.TelegramChatMemberUncheckedCreateWithoutUserInput> | Prisma.TelegramChatMemberCreateWithoutUserInput[] | Prisma.TelegramChatMemberUncheckedCreateWithoutUserInput[];
    connectOrCreate?: Prisma.TelegramChatMemberCreateOrConnectWithoutUserInput | Prisma.TelegramChatMemberCreateOrConnectWithoutUserInput[];
    upsert?: Prisma.TelegramChatMemberUpsertWithWhereUniqueWithoutUserInput | Prisma.TelegramChatMemberUpsertWithWhereUniqueWithoutUserInput[];
    createMany?: Prisma.TelegramChatMemberCreateManyUserInputEnvelope;
    set?: Prisma.TelegramChatMemberWhereUniqueInput | Prisma.TelegramChatMemberWhereUniqueInput[];
    disconnect?: Prisma.TelegramChatMemberWhereUniqueInput | Prisma.TelegramChatMemberWhereUniqueInput[];
    delete?: Prisma.TelegramChatMemberWhereUniqueInput | Prisma.TelegramChatMemberWhereUniqueInput[];
    connect?: Prisma.TelegramChatMemberWhereUniqueInput | Prisma.TelegramChatMemberWhereUniqueInput[];
    update?: Prisma.TelegramChatMemberUpdateWithWhereUniqueWithoutUserInput | Prisma.TelegramChatMemberUpdateWithWhereUniqueWithoutUserInput[];
    updateMany?: Prisma.TelegramChatMemberUpdateManyWithWhereWithoutUserInput | Prisma.TelegramChatMemberUpdateManyWithWhereWithoutUserInput[];
    deleteMany?: Prisma.TelegramChatMemberScalarWhereInput | Prisma.TelegramChatMemberScalarWhereInput[];
};
export type EnumTelegramMemberStatusFieldUpdateOperationsInput = {
    set?: $Enums.TelegramMemberStatus;
};
export type TelegramChatMemberCreateWithoutChatInput = {
    status: $Enums.TelegramMemberStatus;
    isAdmin?: boolean;
    isOwner?: boolean;
    joinedAt?: Date | string | null;
    leftAt?: Date | string | null;
    importedAt?: Date | string;
    rawPayload?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    user: Prisma.TelegramUserCreateNestedOneWithoutMembershipsInput;
};
export type TelegramChatMemberUncheckedCreateWithoutChatInput = {
    id?: number;
    userId: number;
    status: $Enums.TelegramMemberStatus;
    isAdmin?: boolean;
    isOwner?: boolean;
    joinedAt?: Date | string | null;
    leftAt?: Date | string | null;
    importedAt?: Date | string;
    rawPayload?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
};
export type TelegramChatMemberCreateOrConnectWithoutChatInput = {
    where: Prisma.TelegramChatMemberWhereUniqueInput;
    create: Prisma.XOR<Prisma.TelegramChatMemberCreateWithoutChatInput, Prisma.TelegramChatMemberUncheckedCreateWithoutChatInput>;
};
export type TelegramChatMemberCreateManyChatInputEnvelope = {
    data: Prisma.TelegramChatMemberCreateManyChatInput | Prisma.TelegramChatMemberCreateManyChatInput[];
    skipDuplicates?: boolean;
};
export type TelegramChatMemberUpsertWithWhereUniqueWithoutChatInput = {
    where: Prisma.TelegramChatMemberWhereUniqueInput;
    update: Prisma.XOR<Prisma.TelegramChatMemberUpdateWithoutChatInput, Prisma.TelegramChatMemberUncheckedUpdateWithoutChatInput>;
    create: Prisma.XOR<Prisma.TelegramChatMemberCreateWithoutChatInput, Prisma.TelegramChatMemberUncheckedCreateWithoutChatInput>;
};
export type TelegramChatMemberUpdateWithWhereUniqueWithoutChatInput = {
    where: Prisma.TelegramChatMemberWhereUniqueInput;
    data: Prisma.XOR<Prisma.TelegramChatMemberUpdateWithoutChatInput, Prisma.TelegramChatMemberUncheckedUpdateWithoutChatInput>;
};
export type TelegramChatMemberUpdateManyWithWhereWithoutChatInput = {
    where: Prisma.TelegramChatMemberScalarWhereInput;
    data: Prisma.XOR<Prisma.TelegramChatMemberUpdateManyMutationInput, Prisma.TelegramChatMemberUncheckedUpdateManyWithoutChatInput>;
};
export type TelegramChatMemberScalarWhereInput = {
    AND?: Prisma.TelegramChatMemberScalarWhereInput | Prisma.TelegramChatMemberScalarWhereInput[];
    OR?: Prisma.TelegramChatMemberScalarWhereInput[];
    NOT?: Prisma.TelegramChatMemberScalarWhereInput | Prisma.TelegramChatMemberScalarWhereInput[];
    id?: Prisma.IntFilter<"TelegramChatMember"> | number;
    chatId?: Prisma.IntFilter<"TelegramChatMember"> | number;
    userId?: Prisma.IntFilter<"TelegramChatMember"> | number;
    status?: Prisma.EnumTelegramMemberStatusFilter<"TelegramChatMember"> | $Enums.TelegramMemberStatus;
    isAdmin?: Prisma.BoolFilter<"TelegramChatMember"> | boolean;
    isOwner?: Prisma.BoolFilter<"TelegramChatMember"> | boolean;
    joinedAt?: Prisma.DateTimeNullableFilter<"TelegramChatMember"> | Date | string | null;
    leftAt?: Prisma.DateTimeNullableFilter<"TelegramChatMember"> | Date | string | null;
    importedAt?: Prisma.DateTimeFilter<"TelegramChatMember"> | Date | string;
    rawPayload?: Prisma.JsonNullableFilter<"TelegramChatMember">;
};
export type TelegramChatMemberCreateWithoutUserInput = {
    status: $Enums.TelegramMemberStatus;
    isAdmin?: boolean;
    isOwner?: boolean;
    joinedAt?: Date | string | null;
    leftAt?: Date | string | null;
    importedAt?: Date | string;
    rawPayload?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    chat: Prisma.TelegramChatCreateNestedOneWithoutMembersInput;
};
export type TelegramChatMemberUncheckedCreateWithoutUserInput = {
    id?: number;
    chatId: number;
    status: $Enums.TelegramMemberStatus;
    isAdmin?: boolean;
    isOwner?: boolean;
    joinedAt?: Date | string | null;
    leftAt?: Date | string | null;
    importedAt?: Date | string;
    rawPayload?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
};
export type TelegramChatMemberCreateOrConnectWithoutUserInput = {
    where: Prisma.TelegramChatMemberWhereUniqueInput;
    create: Prisma.XOR<Prisma.TelegramChatMemberCreateWithoutUserInput, Prisma.TelegramChatMemberUncheckedCreateWithoutUserInput>;
};
export type TelegramChatMemberCreateManyUserInputEnvelope = {
    data: Prisma.TelegramChatMemberCreateManyUserInput | Prisma.TelegramChatMemberCreateManyUserInput[];
    skipDuplicates?: boolean;
};
export type TelegramChatMemberUpsertWithWhereUniqueWithoutUserInput = {
    where: Prisma.TelegramChatMemberWhereUniqueInput;
    update: Prisma.XOR<Prisma.TelegramChatMemberUpdateWithoutUserInput, Prisma.TelegramChatMemberUncheckedUpdateWithoutUserInput>;
    create: Prisma.XOR<Prisma.TelegramChatMemberCreateWithoutUserInput, Prisma.TelegramChatMemberUncheckedCreateWithoutUserInput>;
};
export type TelegramChatMemberUpdateWithWhereUniqueWithoutUserInput = {
    where: Prisma.TelegramChatMemberWhereUniqueInput;
    data: Prisma.XOR<Prisma.TelegramChatMemberUpdateWithoutUserInput, Prisma.TelegramChatMemberUncheckedUpdateWithoutUserInput>;
};
export type TelegramChatMemberUpdateManyWithWhereWithoutUserInput = {
    where: Prisma.TelegramChatMemberScalarWhereInput;
    data: Prisma.XOR<Prisma.TelegramChatMemberUpdateManyMutationInput, Prisma.TelegramChatMemberUncheckedUpdateManyWithoutUserInput>;
};
export type TelegramChatMemberCreateManyChatInput = {
    id?: number;
    userId: number;
    status: $Enums.TelegramMemberStatus;
    isAdmin?: boolean;
    isOwner?: boolean;
    joinedAt?: Date | string | null;
    leftAt?: Date | string | null;
    importedAt?: Date | string;
    rawPayload?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
};
export type TelegramChatMemberUpdateWithoutChatInput = {
    status?: Prisma.EnumTelegramMemberStatusFieldUpdateOperationsInput | $Enums.TelegramMemberStatus;
    isAdmin?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    isOwner?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    joinedAt?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    leftAt?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    importedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    rawPayload?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    user?: Prisma.TelegramUserUpdateOneRequiredWithoutMembershipsNestedInput;
};
export type TelegramChatMemberUncheckedUpdateWithoutChatInput = {
    id?: Prisma.IntFieldUpdateOperationsInput | number;
    userId?: Prisma.IntFieldUpdateOperationsInput | number;
    status?: Prisma.EnumTelegramMemberStatusFieldUpdateOperationsInput | $Enums.TelegramMemberStatus;
    isAdmin?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    isOwner?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    joinedAt?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    leftAt?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    importedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    rawPayload?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
};
export type TelegramChatMemberUncheckedUpdateManyWithoutChatInput = {
    id?: Prisma.IntFieldUpdateOperationsInput | number;
    userId?: Prisma.IntFieldUpdateOperationsInput | number;
    status?: Prisma.EnumTelegramMemberStatusFieldUpdateOperationsInput | $Enums.TelegramMemberStatus;
    isAdmin?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    isOwner?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    joinedAt?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    leftAt?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    importedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    rawPayload?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
};
export type TelegramChatMemberCreateManyUserInput = {
    id?: number;
    chatId: number;
    status: $Enums.TelegramMemberStatus;
    isAdmin?: boolean;
    isOwner?: boolean;
    joinedAt?: Date | string | null;
    leftAt?: Date | string | null;
    importedAt?: Date | string;
    rawPayload?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
};
export type TelegramChatMemberUpdateWithoutUserInput = {
    status?: Prisma.EnumTelegramMemberStatusFieldUpdateOperationsInput | $Enums.TelegramMemberStatus;
    isAdmin?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    isOwner?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    joinedAt?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    leftAt?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    importedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    rawPayload?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    chat?: Prisma.TelegramChatUpdateOneRequiredWithoutMembersNestedInput;
};
export type TelegramChatMemberUncheckedUpdateWithoutUserInput = {
    id?: Prisma.IntFieldUpdateOperationsInput | number;
    chatId?: Prisma.IntFieldUpdateOperationsInput | number;
    status?: Prisma.EnumTelegramMemberStatusFieldUpdateOperationsInput | $Enums.TelegramMemberStatus;
    isAdmin?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    isOwner?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    joinedAt?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    leftAt?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    importedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    rawPayload?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
};
export type TelegramChatMemberUncheckedUpdateManyWithoutUserInput = {
    id?: Prisma.IntFieldUpdateOperationsInput | number;
    chatId?: Prisma.IntFieldUpdateOperationsInput | number;
    status?: Prisma.EnumTelegramMemberStatusFieldUpdateOperationsInput | $Enums.TelegramMemberStatus;
    isAdmin?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    isOwner?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    joinedAt?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    leftAt?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    importedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    rawPayload?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
};
export type TelegramChatMemberSelect<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    chatId?: boolean;
    userId?: boolean;
    status?: boolean;
    isAdmin?: boolean;
    isOwner?: boolean;
    joinedAt?: boolean;
    leftAt?: boolean;
    importedAt?: boolean;
    rawPayload?: boolean;
    chat?: boolean | Prisma.TelegramChatDefaultArgs<ExtArgs>;
    user?: boolean | Prisma.TelegramUserDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["telegramChatMember"]>;
export type TelegramChatMemberSelectCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    chatId?: boolean;
    userId?: boolean;
    status?: boolean;
    isAdmin?: boolean;
    isOwner?: boolean;
    joinedAt?: boolean;
    leftAt?: boolean;
    importedAt?: boolean;
    rawPayload?: boolean;
    chat?: boolean | Prisma.TelegramChatDefaultArgs<ExtArgs>;
    user?: boolean | Prisma.TelegramUserDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["telegramChatMember"]>;
export type TelegramChatMemberSelectUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    chatId?: boolean;
    userId?: boolean;
    status?: boolean;
    isAdmin?: boolean;
    isOwner?: boolean;
    joinedAt?: boolean;
    leftAt?: boolean;
    importedAt?: boolean;
    rawPayload?: boolean;
    chat?: boolean | Prisma.TelegramChatDefaultArgs<ExtArgs>;
    user?: boolean | Prisma.TelegramUserDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["telegramChatMember"]>;
export type TelegramChatMemberSelectScalar = {
    id?: boolean;
    chatId?: boolean;
    userId?: boolean;
    status?: boolean;
    isAdmin?: boolean;
    isOwner?: boolean;
    joinedAt?: boolean;
    leftAt?: boolean;
    importedAt?: boolean;
    rawPayload?: boolean;
};
export type TelegramChatMemberOmit<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetOmit<"id" | "chatId" | "userId" | "status" | "isAdmin" | "isOwner" | "joinedAt" | "leftAt" | "importedAt" | "rawPayload", ExtArgs["result"]["telegramChatMember"]>;
export type TelegramChatMemberInclude<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    chat?: boolean | Prisma.TelegramChatDefaultArgs<ExtArgs>;
    user?: boolean | Prisma.TelegramUserDefaultArgs<ExtArgs>;
};
export type TelegramChatMemberIncludeCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    chat?: boolean | Prisma.TelegramChatDefaultArgs<ExtArgs>;
    user?: boolean | Prisma.TelegramUserDefaultArgs<ExtArgs>;
};
export type TelegramChatMemberIncludeUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    chat?: boolean | Prisma.TelegramChatDefaultArgs<ExtArgs>;
    user?: boolean | Prisma.TelegramUserDefaultArgs<ExtArgs>;
};
export type $TelegramChatMemberPayload<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    name: "TelegramChatMember";
    objects: {
        chat: Prisma.$TelegramChatPayload<ExtArgs>;
        user: Prisma.$TelegramUserPayload<ExtArgs>;
    };
    scalars: runtime.Types.Extensions.GetPayloadResult<{
        id: number;
        chatId: number;
        userId: number;
        status: $Enums.TelegramMemberStatus;
        isAdmin: boolean;
        isOwner: boolean;
        joinedAt: Date | null;
        leftAt: Date | null;
        importedAt: Date;
        rawPayload: runtime.JsonValue | null;
    }, ExtArgs["result"]["telegramChatMember"]>;
    composites: {};
};
export type TelegramChatMemberGetPayload<S extends boolean | null | undefined | TelegramChatMemberDefaultArgs> = runtime.Types.Result.GetResult<Prisma.$TelegramChatMemberPayload, S>;
export type TelegramChatMemberCountArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = Omit<TelegramChatMemberFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
    select?: TelegramChatMemberCountAggregateInputType | true;
};
export interface TelegramChatMemberDelegate<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: {
        types: Prisma.TypeMap<ExtArgs>['model']['TelegramChatMember'];
        meta: {
            name: 'TelegramChatMember';
        };
    };
    findUnique<T extends TelegramChatMemberFindUniqueArgs>(args: Prisma.SelectSubset<T, TelegramChatMemberFindUniqueArgs<ExtArgs>>): Prisma.Prisma__TelegramChatMemberClient<runtime.Types.Result.GetResult<Prisma.$TelegramChatMemberPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    findUniqueOrThrow<T extends TelegramChatMemberFindUniqueOrThrowArgs>(args: Prisma.SelectSubset<T, TelegramChatMemberFindUniqueOrThrowArgs<ExtArgs>>): Prisma.Prisma__TelegramChatMemberClient<runtime.Types.Result.GetResult<Prisma.$TelegramChatMemberPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    findFirst<T extends TelegramChatMemberFindFirstArgs>(args?: Prisma.SelectSubset<T, TelegramChatMemberFindFirstArgs<ExtArgs>>): Prisma.Prisma__TelegramChatMemberClient<runtime.Types.Result.GetResult<Prisma.$TelegramChatMemberPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    findFirstOrThrow<T extends TelegramChatMemberFindFirstOrThrowArgs>(args?: Prisma.SelectSubset<T, TelegramChatMemberFindFirstOrThrowArgs<ExtArgs>>): Prisma.Prisma__TelegramChatMemberClient<runtime.Types.Result.GetResult<Prisma.$TelegramChatMemberPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    findMany<T extends TelegramChatMemberFindManyArgs>(args?: Prisma.SelectSubset<T, TelegramChatMemberFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$TelegramChatMemberPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>;
    create<T extends TelegramChatMemberCreateArgs>(args: Prisma.SelectSubset<T, TelegramChatMemberCreateArgs<ExtArgs>>): Prisma.Prisma__TelegramChatMemberClient<runtime.Types.Result.GetResult<Prisma.$TelegramChatMemberPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    createMany<T extends TelegramChatMemberCreateManyArgs>(args?: Prisma.SelectSubset<T, TelegramChatMemberCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    createManyAndReturn<T extends TelegramChatMemberCreateManyAndReturnArgs>(args?: Prisma.SelectSubset<T, TelegramChatMemberCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$TelegramChatMemberPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>;
    delete<T extends TelegramChatMemberDeleteArgs>(args: Prisma.SelectSubset<T, TelegramChatMemberDeleteArgs<ExtArgs>>): Prisma.Prisma__TelegramChatMemberClient<runtime.Types.Result.GetResult<Prisma.$TelegramChatMemberPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    update<T extends TelegramChatMemberUpdateArgs>(args: Prisma.SelectSubset<T, TelegramChatMemberUpdateArgs<ExtArgs>>): Prisma.Prisma__TelegramChatMemberClient<runtime.Types.Result.GetResult<Prisma.$TelegramChatMemberPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    deleteMany<T extends TelegramChatMemberDeleteManyArgs>(args?: Prisma.SelectSubset<T, TelegramChatMemberDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    updateMany<T extends TelegramChatMemberUpdateManyArgs>(args: Prisma.SelectSubset<T, TelegramChatMemberUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    updateManyAndReturn<T extends TelegramChatMemberUpdateManyAndReturnArgs>(args: Prisma.SelectSubset<T, TelegramChatMemberUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$TelegramChatMemberPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>;
    upsert<T extends TelegramChatMemberUpsertArgs>(args: Prisma.SelectSubset<T, TelegramChatMemberUpsertArgs<ExtArgs>>): Prisma.Prisma__TelegramChatMemberClient<runtime.Types.Result.GetResult<Prisma.$TelegramChatMemberPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    count<T extends TelegramChatMemberCountArgs>(args?: Prisma.Subset<T, TelegramChatMemberCountArgs>): Prisma.PrismaPromise<T extends runtime.Types.Utils.Record<'select', any> ? T['select'] extends true ? number : Prisma.GetScalarType<T['select'], TelegramChatMemberCountAggregateOutputType> : number>;
    aggregate<T extends TelegramChatMemberAggregateArgs>(args: Prisma.Subset<T, TelegramChatMemberAggregateArgs>): Prisma.PrismaPromise<GetTelegramChatMemberAggregateType<T>>;
    groupBy<T extends TelegramChatMemberGroupByArgs, HasSelectOrTake extends Prisma.Or<Prisma.Extends<'skip', Prisma.Keys<T>>, Prisma.Extends<'take', Prisma.Keys<T>>>, OrderByArg extends Prisma.True extends HasSelectOrTake ? {
        orderBy: TelegramChatMemberGroupByArgs['orderBy'];
    } : {
        orderBy?: TelegramChatMemberGroupByArgs['orderBy'];
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
    }[OrderFields]>(args: Prisma.SubsetIntersection<T, TelegramChatMemberGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetTelegramChatMemberGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>;
    readonly fields: TelegramChatMemberFieldRefs;
}
export interface Prisma__TelegramChatMemberClient<T, Null = never, ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise";
    chat<T extends Prisma.TelegramChatDefaultArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.TelegramChatDefaultArgs<ExtArgs>>): Prisma.Prisma__TelegramChatClient<runtime.Types.Result.GetResult<Prisma.$TelegramChatPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>;
    user<T extends Prisma.TelegramUserDefaultArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.TelegramUserDefaultArgs<ExtArgs>>): Prisma.Prisma__TelegramUserClient<runtime.Types.Result.GetResult<Prisma.$TelegramUserPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>;
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): runtime.Types.Utils.JsPromise<TResult1 | TResult2>;
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): runtime.Types.Utils.JsPromise<T | TResult>;
    finally(onfinally?: (() => void) | undefined | null): runtime.Types.Utils.JsPromise<T>;
}
export interface TelegramChatMemberFieldRefs {
    readonly id: Prisma.FieldRef<"TelegramChatMember", 'Int'>;
    readonly chatId: Prisma.FieldRef<"TelegramChatMember", 'Int'>;
    readonly userId: Prisma.FieldRef<"TelegramChatMember", 'Int'>;
    readonly status: Prisma.FieldRef<"TelegramChatMember", 'TelegramMemberStatus'>;
    readonly isAdmin: Prisma.FieldRef<"TelegramChatMember", 'Boolean'>;
    readonly isOwner: Prisma.FieldRef<"TelegramChatMember", 'Boolean'>;
    readonly joinedAt: Prisma.FieldRef<"TelegramChatMember", 'DateTime'>;
    readonly leftAt: Prisma.FieldRef<"TelegramChatMember", 'DateTime'>;
    readonly importedAt: Prisma.FieldRef<"TelegramChatMember", 'DateTime'>;
    readonly rawPayload: Prisma.FieldRef<"TelegramChatMember", 'Json'>;
}
export type TelegramChatMemberFindUniqueArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.TelegramChatMemberSelect<ExtArgs> | null;
    omit?: Prisma.TelegramChatMemberOmit<ExtArgs> | null;
    include?: Prisma.TelegramChatMemberInclude<ExtArgs> | null;
    where: Prisma.TelegramChatMemberWhereUniqueInput;
};
export type TelegramChatMemberFindUniqueOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.TelegramChatMemberSelect<ExtArgs> | null;
    omit?: Prisma.TelegramChatMemberOmit<ExtArgs> | null;
    include?: Prisma.TelegramChatMemberInclude<ExtArgs> | null;
    where: Prisma.TelegramChatMemberWhereUniqueInput;
};
export type TelegramChatMemberFindFirstArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.TelegramChatMemberSelect<ExtArgs> | null;
    omit?: Prisma.TelegramChatMemberOmit<ExtArgs> | null;
    include?: Prisma.TelegramChatMemberInclude<ExtArgs> | null;
    where?: Prisma.TelegramChatMemberWhereInput;
    orderBy?: Prisma.TelegramChatMemberOrderByWithRelationInput | Prisma.TelegramChatMemberOrderByWithRelationInput[];
    cursor?: Prisma.TelegramChatMemberWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.TelegramChatMemberScalarFieldEnum | Prisma.TelegramChatMemberScalarFieldEnum[];
};
export type TelegramChatMemberFindFirstOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.TelegramChatMemberSelect<ExtArgs> | null;
    omit?: Prisma.TelegramChatMemberOmit<ExtArgs> | null;
    include?: Prisma.TelegramChatMemberInclude<ExtArgs> | null;
    where?: Prisma.TelegramChatMemberWhereInput;
    orderBy?: Prisma.TelegramChatMemberOrderByWithRelationInput | Prisma.TelegramChatMemberOrderByWithRelationInput[];
    cursor?: Prisma.TelegramChatMemberWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.TelegramChatMemberScalarFieldEnum | Prisma.TelegramChatMemberScalarFieldEnum[];
};
export type TelegramChatMemberFindManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.TelegramChatMemberSelect<ExtArgs> | null;
    omit?: Prisma.TelegramChatMemberOmit<ExtArgs> | null;
    include?: Prisma.TelegramChatMemberInclude<ExtArgs> | null;
    where?: Prisma.TelegramChatMemberWhereInput;
    orderBy?: Prisma.TelegramChatMemberOrderByWithRelationInput | Prisma.TelegramChatMemberOrderByWithRelationInput[];
    cursor?: Prisma.TelegramChatMemberWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.TelegramChatMemberScalarFieldEnum | Prisma.TelegramChatMemberScalarFieldEnum[];
};
export type TelegramChatMemberCreateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.TelegramChatMemberSelect<ExtArgs> | null;
    omit?: Prisma.TelegramChatMemberOmit<ExtArgs> | null;
    include?: Prisma.TelegramChatMemberInclude<ExtArgs> | null;
    data: Prisma.XOR<Prisma.TelegramChatMemberCreateInput, Prisma.TelegramChatMemberUncheckedCreateInput>;
};
export type TelegramChatMemberCreateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    data: Prisma.TelegramChatMemberCreateManyInput | Prisma.TelegramChatMemberCreateManyInput[];
    skipDuplicates?: boolean;
};
export type TelegramChatMemberCreateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.TelegramChatMemberSelectCreateManyAndReturn<ExtArgs> | null;
    omit?: Prisma.TelegramChatMemberOmit<ExtArgs> | null;
    data: Prisma.TelegramChatMemberCreateManyInput | Prisma.TelegramChatMemberCreateManyInput[];
    skipDuplicates?: boolean;
    include?: Prisma.TelegramChatMemberIncludeCreateManyAndReturn<ExtArgs> | null;
};
export type TelegramChatMemberUpdateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.TelegramChatMemberSelect<ExtArgs> | null;
    omit?: Prisma.TelegramChatMemberOmit<ExtArgs> | null;
    include?: Prisma.TelegramChatMemberInclude<ExtArgs> | null;
    data: Prisma.XOR<Prisma.TelegramChatMemberUpdateInput, Prisma.TelegramChatMemberUncheckedUpdateInput>;
    where: Prisma.TelegramChatMemberWhereUniqueInput;
};
export type TelegramChatMemberUpdateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    data: Prisma.XOR<Prisma.TelegramChatMemberUpdateManyMutationInput, Prisma.TelegramChatMemberUncheckedUpdateManyInput>;
    where?: Prisma.TelegramChatMemberWhereInput;
    limit?: number;
};
export type TelegramChatMemberUpdateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.TelegramChatMemberSelectUpdateManyAndReturn<ExtArgs> | null;
    omit?: Prisma.TelegramChatMemberOmit<ExtArgs> | null;
    data: Prisma.XOR<Prisma.TelegramChatMemberUpdateManyMutationInput, Prisma.TelegramChatMemberUncheckedUpdateManyInput>;
    where?: Prisma.TelegramChatMemberWhereInput;
    limit?: number;
    include?: Prisma.TelegramChatMemberIncludeUpdateManyAndReturn<ExtArgs> | null;
};
export type TelegramChatMemberUpsertArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.TelegramChatMemberSelect<ExtArgs> | null;
    omit?: Prisma.TelegramChatMemberOmit<ExtArgs> | null;
    include?: Prisma.TelegramChatMemberInclude<ExtArgs> | null;
    where: Prisma.TelegramChatMemberWhereUniqueInput;
    create: Prisma.XOR<Prisma.TelegramChatMemberCreateInput, Prisma.TelegramChatMemberUncheckedCreateInput>;
    update: Prisma.XOR<Prisma.TelegramChatMemberUpdateInput, Prisma.TelegramChatMemberUncheckedUpdateInput>;
};
export type TelegramChatMemberDeleteArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.TelegramChatMemberSelect<ExtArgs> | null;
    omit?: Prisma.TelegramChatMemberOmit<ExtArgs> | null;
    include?: Prisma.TelegramChatMemberInclude<ExtArgs> | null;
    where: Prisma.TelegramChatMemberWhereUniqueInput;
};
export type TelegramChatMemberDeleteManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.TelegramChatMemberWhereInput;
    limit?: number;
};
export type TelegramChatMemberDefaultArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.TelegramChatMemberSelect<ExtArgs> | null;
    omit?: Prisma.TelegramChatMemberOmit<ExtArgs> | null;
    include?: Prisma.TelegramChatMemberInclude<ExtArgs> | null;
};
export {};
