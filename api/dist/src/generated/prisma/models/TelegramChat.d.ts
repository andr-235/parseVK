import type * as runtime from "@prisma/client/runtime/client";
import type * as $Enums from "../enums.js";
import type * as Prisma from "../internal/prismaNamespace.js";
export type TelegramChatModel = runtime.Types.Result.DefaultSelection<Prisma.$TelegramChatPayload>;
export type AggregateTelegramChat = {
    _count: TelegramChatCountAggregateOutputType | null;
    _avg: TelegramChatAvgAggregateOutputType | null;
    _sum: TelegramChatSumAggregateOutputType | null;
    _min: TelegramChatMinAggregateOutputType | null;
    _max: TelegramChatMaxAggregateOutputType | null;
};
export type TelegramChatAvgAggregateOutputType = {
    id: number | null;
    telegramId: number | null;
};
export type TelegramChatSumAggregateOutputType = {
    id: number | null;
    telegramId: bigint | null;
};
export type TelegramChatMinAggregateOutputType = {
    id: number | null;
    telegramId: bigint | null;
    type: $Enums.TelegramChatType | null;
    title: string | null;
    username: string | null;
    accessHash: string | null;
    photoUrl: string | null;
    description: string | null;
    createdAt: Date | null;
    updatedAt: Date | null;
};
export type TelegramChatMaxAggregateOutputType = {
    id: number | null;
    telegramId: bigint | null;
    type: $Enums.TelegramChatType | null;
    title: string | null;
    username: string | null;
    accessHash: string | null;
    photoUrl: string | null;
    description: string | null;
    createdAt: Date | null;
    updatedAt: Date | null;
};
export type TelegramChatCountAggregateOutputType = {
    id: number;
    telegramId: number;
    type: number;
    title: number;
    username: number;
    accessHash: number;
    photoUrl: number;
    description: number;
    createdAt: number;
    updatedAt: number;
    _all: number;
};
export type TelegramChatAvgAggregateInputType = {
    id?: true;
    telegramId?: true;
};
export type TelegramChatSumAggregateInputType = {
    id?: true;
    telegramId?: true;
};
export type TelegramChatMinAggregateInputType = {
    id?: true;
    telegramId?: true;
    type?: true;
    title?: true;
    username?: true;
    accessHash?: true;
    photoUrl?: true;
    description?: true;
    createdAt?: true;
    updatedAt?: true;
};
export type TelegramChatMaxAggregateInputType = {
    id?: true;
    telegramId?: true;
    type?: true;
    title?: true;
    username?: true;
    accessHash?: true;
    photoUrl?: true;
    description?: true;
    createdAt?: true;
    updatedAt?: true;
};
export type TelegramChatCountAggregateInputType = {
    id?: true;
    telegramId?: true;
    type?: true;
    title?: true;
    username?: true;
    accessHash?: true;
    photoUrl?: true;
    description?: true;
    createdAt?: true;
    updatedAt?: true;
    _all?: true;
};
export type TelegramChatAggregateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.TelegramChatWhereInput;
    orderBy?: Prisma.TelegramChatOrderByWithRelationInput | Prisma.TelegramChatOrderByWithRelationInput[];
    cursor?: Prisma.TelegramChatWhereUniqueInput;
    take?: number;
    skip?: number;
    _count?: true | TelegramChatCountAggregateInputType;
    _avg?: TelegramChatAvgAggregateInputType;
    _sum?: TelegramChatSumAggregateInputType;
    _min?: TelegramChatMinAggregateInputType;
    _max?: TelegramChatMaxAggregateInputType;
};
export type GetTelegramChatAggregateType<T extends TelegramChatAggregateArgs> = {
    [P in keyof T & keyof AggregateTelegramChat]: P extends '_count' | 'count' ? T[P] extends true ? number : Prisma.GetScalarType<T[P], AggregateTelegramChat[P]> : Prisma.GetScalarType<T[P], AggregateTelegramChat[P]>;
};
export type TelegramChatGroupByArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.TelegramChatWhereInput;
    orderBy?: Prisma.TelegramChatOrderByWithAggregationInput | Prisma.TelegramChatOrderByWithAggregationInput[];
    by: Prisma.TelegramChatScalarFieldEnum[] | Prisma.TelegramChatScalarFieldEnum;
    having?: Prisma.TelegramChatScalarWhereWithAggregatesInput;
    take?: number;
    skip?: number;
    _count?: TelegramChatCountAggregateInputType | true;
    _avg?: TelegramChatAvgAggregateInputType;
    _sum?: TelegramChatSumAggregateInputType;
    _min?: TelegramChatMinAggregateInputType;
    _max?: TelegramChatMaxAggregateInputType;
};
export type TelegramChatGroupByOutputType = {
    id: number;
    telegramId: bigint;
    type: $Enums.TelegramChatType;
    title: string | null;
    username: string | null;
    accessHash: string | null;
    photoUrl: string | null;
    description: string | null;
    createdAt: Date;
    updatedAt: Date;
    _count: TelegramChatCountAggregateOutputType | null;
    _avg: TelegramChatAvgAggregateOutputType | null;
    _sum: TelegramChatSumAggregateOutputType | null;
    _min: TelegramChatMinAggregateOutputType | null;
    _max: TelegramChatMaxAggregateOutputType | null;
};
type GetTelegramChatGroupByPayload<T extends TelegramChatGroupByArgs> = Prisma.PrismaPromise<Array<Prisma.PickEnumerable<TelegramChatGroupByOutputType, T['by']> & {
    [P in ((keyof T) & (keyof TelegramChatGroupByOutputType))]: P extends '_count' ? T[P] extends boolean ? number : Prisma.GetScalarType<T[P], TelegramChatGroupByOutputType[P]> : Prisma.GetScalarType<T[P], TelegramChatGroupByOutputType[P]>;
}>>;
export type TelegramChatWhereInput = {
    AND?: Prisma.TelegramChatWhereInput | Prisma.TelegramChatWhereInput[];
    OR?: Prisma.TelegramChatWhereInput[];
    NOT?: Prisma.TelegramChatWhereInput | Prisma.TelegramChatWhereInput[];
    id?: Prisma.IntFilter<"TelegramChat"> | number;
    telegramId?: Prisma.BigIntFilter<"TelegramChat"> | bigint | number;
    type?: Prisma.EnumTelegramChatTypeFilter<"TelegramChat"> | $Enums.TelegramChatType;
    title?: Prisma.StringNullableFilter<"TelegramChat"> | string | null;
    username?: Prisma.StringNullableFilter<"TelegramChat"> | string | null;
    accessHash?: Prisma.StringNullableFilter<"TelegramChat"> | string | null;
    photoUrl?: Prisma.StringNullableFilter<"TelegramChat"> | string | null;
    description?: Prisma.StringNullableFilter<"TelegramChat"> | string | null;
    createdAt?: Prisma.DateTimeFilter<"TelegramChat"> | Date | string;
    updatedAt?: Prisma.DateTimeFilter<"TelegramChat"> | Date | string;
    members?: Prisma.TelegramChatMemberListRelationFilter;
};
export type TelegramChatOrderByWithRelationInput = {
    id?: Prisma.SortOrder;
    telegramId?: Prisma.SortOrder;
    type?: Prisma.SortOrder;
    title?: Prisma.SortOrderInput | Prisma.SortOrder;
    username?: Prisma.SortOrderInput | Prisma.SortOrder;
    accessHash?: Prisma.SortOrderInput | Prisma.SortOrder;
    photoUrl?: Prisma.SortOrderInput | Prisma.SortOrder;
    description?: Prisma.SortOrderInput | Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
    members?: Prisma.TelegramChatMemberOrderByRelationAggregateInput;
};
export type TelegramChatWhereUniqueInput = Prisma.AtLeast<{
    id?: number;
    telegramId?: bigint | number;
    AND?: Prisma.TelegramChatWhereInput | Prisma.TelegramChatWhereInput[];
    OR?: Prisma.TelegramChatWhereInput[];
    NOT?: Prisma.TelegramChatWhereInput | Prisma.TelegramChatWhereInput[];
    type?: Prisma.EnumTelegramChatTypeFilter<"TelegramChat"> | $Enums.TelegramChatType;
    title?: Prisma.StringNullableFilter<"TelegramChat"> | string | null;
    username?: Prisma.StringNullableFilter<"TelegramChat"> | string | null;
    accessHash?: Prisma.StringNullableFilter<"TelegramChat"> | string | null;
    photoUrl?: Prisma.StringNullableFilter<"TelegramChat"> | string | null;
    description?: Prisma.StringNullableFilter<"TelegramChat"> | string | null;
    createdAt?: Prisma.DateTimeFilter<"TelegramChat"> | Date | string;
    updatedAt?: Prisma.DateTimeFilter<"TelegramChat"> | Date | string;
    members?: Prisma.TelegramChatMemberListRelationFilter;
}, "id" | "telegramId">;
export type TelegramChatOrderByWithAggregationInput = {
    id?: Prisma.SortOrder;
    telegramId?: Prisma.SortOrder;
    type?: Prisma.SortOrder;
    title?: Prisma.SortOrderInput | Prisma.SortOrder;
    username?: Prisma.SortOrderInput | Prisma.SortOrder;
    accessHash?: Prisma.SortOrderInput | Prisma.SortOrder;
    photoUrl?: Prisma.SortOrderInput | Prisma.SortOrder;
    description?: Prisma.SortOrderInput | Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
    _count?: Prisma.TelegramChatCountOrderByAggregateInput;
    _avg?: Prisma.TelegramChatAvgOrderByAggregateInput;
    _max?: Prisma.TelegramChatMaxOrderByAggregateInput;
    _min?: Prisma.TelegramChatMinOrderByAggregateInput;
    _sum?: Prisma.TelegramChatSumOrderByAggregateInput;
};
export type TelegramChatScalarWhereWithAggregatesInput = {
    AND?: Prisma.TelegramChatScalarWhereWithAggregatesInput | Prisma.TelegramChatScalarWhereWithAggregatesInput[];
    OR?: Prisma.TelegramChatScalarWhereWithAggregatesInput[];
    NOT?: Prisma.TelegramChatScalarWhereWithAggregatesInput | Prisma.TelegramChatScalarWhereWithAggregatesInput[];
    id?: Prisma.IntWithAggregatesFilter<"TelegramChat"> | number;
    telegramId?: Prisma.BigIntWithAggregatesFilter<"TelegramChat"> | bigint | number;
    type?: Prisma.EnumTelegramChatTypeWithAggregatesFilter<"TelegramChat"> | $Enums.TelegramChatType;
    title?: Prisma.StringNullableWithAggregatesFilter<"TelegramChat"> | string | null;
    username?: Prisma.StringNullableWithAggregatesFilter<"TelegramChat"> | string | null;
    accessHash?: Prisma.StringNullableWithAggregatesFilter<"TelegramChat"> | string | null;
    photoUrl?: Prisma.StringNullableWithAggregatesFilter<"TelegramChat"> | string | null;
    description?: Prisma.StringNullableWithAggregatesFilter<"TelegramChat"> | string | null;
    createdAt?: Prisma.DateTimeWithAggregatesFilter<"TelegramChat"> | Date | string;
    updatedAt?: Prisma.DateTimeWithAggregatesFilter<"TelegramChat"> | Date | string;
};
export type TelegramChatCreateInput = {
    telegramId: bigint | number;
    type: $Enums.TelegramChatType;
    title?: string | null;
    username?: string | null;
    accessHash?: string | null;
    photoUrl?: string | null;
    description?: string | null;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    members?: Prisma.TelegramChatMemberCreateNestedManyWithoutChatInput;
};
export type TelegramChatUncheckedCreateInput = {
    id?: number;
    telegramId: bigint | number;
    type: $Enums.TelegramChatType;
    title?: string | null;
    username?: string | null;
    accessHash?: string | null;
    photoUrl?: string | null;
    description?: string | null;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    members?: Prisma.TelegramChatMemberUncheckedCreateNestedManyWithoutChatInput;
};
export type TelegramChatUpdateInput = {
    telegramId?: Prisma.BigIntFieldUpdateOperationsInput | bigint | number;
    type?: Prisma.EnumTelegramChatTypeFieldUpdateOperationsInput | $Enums.TelegramChatType;
    title?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    username?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    accessHash?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    photoUrl?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    description?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    members?: Prisma.TelegramChatMemberUpdateManyWithoutChatNestedInput;
};
export type TelegramChatUncheckedUpdateInput = {
    id?: Prisma.IntFieldUpdateOperationsInput | number;
    telegramId?: Prisma.BigIntFieldUpdateOperationsInput | bigint | number;
    type?: Prisma.EnumTelegramChatTypeFieldUpdateOperationsInput | $Enums.TelegramChatType;
    title?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    username?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    accessHash?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    photoUrl?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    description?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    members?: Prisma.TelegramChatMemberUncheckedUpdateManyWithoutChatNestedInput;
};
export type TelegramChatCreateManyInput = {
    id?: number;
    telegramId: bigint | number;
    type: $Enums.TelegramChatType;
    title?: string | null;
    username?: string | null;
    accessHash?: string | null;
    photoUrl?: string | null;
    description?: string | null;
    createdAt?: Date | string;
    updatedAt?: Date | string;
};
export type TelegramChatUpdateManyMutationInput = {
    telegramId?: Prisma.BigIntFieldUpdateOperationsInput | bigint | number;
    type?: Prisma.EnumTelegramChatTypeFieldUpdateOperationsInput | $Enums.TelegramChatType;
    title?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    username?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    accessHash?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    photoUrl?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    description?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type TelegramChatUncheckedUpdateManyInput = {
    id?: Prisma.IntFieldUpdateOperationsInput | number;
    telegramId?: Prisma.BigIntFieldUpdateOperationsInput | bigint | number;
    type?: Prisma.EnumTelegramChatTypeFieldUpdateOperationsInput | $Enums.TelegramChatType;
    title?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    username?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    accessHash?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    photoUrl?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    description?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type TelegramChatCountOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    telegramId?: Prisma.SortOrder;
    type?: Prisma.SortOrder;
    title?: Prisma.SortOrder;
    username?: Prisma.SortOrder;
    accessHash?: Prisma.SortOrder;
    photoUrl?: Prisma.SortOrder;
    description?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
};
export type TelegramChatAvgOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    telegramId?: Prisma.SortOrder;
};
export type TelegramChatMaxOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    telegramId?: Prisma.SortOrder;
    type?: Prisma.SortOrder;
    title?: Prisma.SortOrder;
    username?: Prisma.SortOrder;
    accessHash?: Prisma.SortOrder;
    photoUrl?: Prisma.SortOrder;
    description?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
};
export type TelegramChatMinOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    telegramId?: Prisma.SortOrder;
    type?: Prisma.SortOrder;
    title?: Prisma.SortOrder;
    username?: Prisma.SortOrder;
    accessHash?: Prisma.SortOrder;
    photoUrl?: Prisma.SortOrder;
    description?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
};
export type TelegramChatSumOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    telegramId?: Prisma.SortOrder;
};
export type TelegramChatScalarRelationFilter = {
    is?: Prisma.TelegramChatWhereInput;
    isNot?: Prisma.TelegramChatWhereInput;
};
export type BigIntFieldUpdateOperationsInput = {
    set?: bigint | number;
    increment?: bigint | number;
    decrement?: bigint | number;
    multiply?: bigint | number;
    divide?: bigint | number;
};
export type EnumTelegramChatTypeFieldUpdateOperationsInput = {
    set?: $Enums.TelegramChatType;
};
export type TelegramChatCreateNestedOneWithoutMembersInput = {
    create?: Prisma.XOR<Prisma.TelegramChatCreateWithoutMembersInput, Prisma.TelegramChatUncheckedCreateWithoutMembersInput>;
    connectOrCreate?: Prisma.TelegramChatCreateOrConnectWithoutMembersInput;
    connect?: Prisma.TelegramChatWhereUniqueInput;
};
export type TelegramChatUpdateOneRequiredWithoutMembersNestedInput = {
    create?: Prisma.XOR<Prisma.TelegramChatCreateWithoutMembersInput, Prisma.TelegramChatUncheckedCreateWithoutMembersInput>;
    connectOrCreate?: Prisma.TelegramChatCreateOrConnectWithoutMembersInput;
    upsert?: Prisma.TelegramChatUpsertWithoutMembersInput;
    connect?: Prisma.TelegramChatWhereUniqueInput;
    update?: Prisma.XOR<Prisma.XOR<Prisma.TelegramChatUpdateToOneWithWhereWithoutMembersInput, Prisma.TelegramChatUpdateWithoutMembersInput>, Prisma.TelegramChatUncheckedUpdateWithoutMembersInput>;
};
export type TelegramChatCreateWithoutMembersInput = {
    telegramId: bigint | number;
    type: $Enums.TelegramChatType;
    title?: string | null;
    username?: string | null;
    accessHash?: string | null;
    photoUrl?: string | null;
    description?: string | null;
    createdAt?: Date | string;
    updatedAt?: Date | string;
};
export type TelegramChatUncheckedCreateWithoutMembersInput = {
    id?: number;
    telegramId: bigint | number;
    type: $Enums.TelegramChatType;
    title?: string | null;
    username?: string | null;
    accessHash?: string | null;
    photoUrl?: string | null;
    description?: string | null;
    createdAt?: Date | string;
    updatedAt?: Date | string;
};
export type TelegramChatCreateOrConnectWithoutMembersInput = {
    where: Prisma.TelegramChatWhereUniqueInput;
    create: Prisma.XOR<Prisma.TelegramChatCreateWithoutMembersInput, Prisma.TelegramChatUncheckedCreateWithoutMembersInput>;
};
export type TelegramChatUpsertWithoutMembersInput = {
    update: Prisma.XOR<Prisma.TelegramChatUpdateWithoutMembersInput, Prisma.TelegramChatUncheckedUpdateWithoutMembersInput>;
    create: Prisma.XOR<Prisma.TelegramChatCreateWithoutMembersInput, Prisma.TelegramChatUncheckedCreateWithoutMembersInput>;
    where?: Prisma.TelegramChatWhereInput;
};
export type TelegramChatUpdateToOneWithWhereWithoutMembersInput = {
    where?: Prisma.TelegramChatWhereInput;
    data: Prisma.XOR<Prisma.TelegramChatUpdateWithoutMembersInput, Prisma.TelegramChatUncheckedUpdateWithoutMembersInput>;
};
export type TelegramChatUpdateWithoutMembersInput = {
    telegramId?: Prisma.BigIntFieldUpdateOperationsInput | bigint | number;
    type?: Prisma.EnumTelegramChatTypeFieldUpdateOperationsInput | $Enums.TelegramChatType;
    title?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    username?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    accessHash?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    photoUrl?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    description?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type TelegramChatUncheckedUpdateWithoutMembersInput = {
    id?: Prisma.IntFieldUpdateOperationsInput | number;
    telegramId?: Prisma.BigIntFieldUpdateOperationsInput | bigint | number;
    type?: Prisma.EnumTelegramChatTypeFieldUpdateOperationsInput | $Enums.TelegramChatType;
    title?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    username?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    accessHash?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    photoUrl?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    description?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type TelegramChatCountOutputType = {
    members: number;
};
export type TelegramChatCountOutputTypeSelect<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    members?: boolean | TelegramChatCountOutputTypeCountMembersArgs;
};
export type TelegramChatCountOutputTypeDefaultArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.TelegramChatCountOutputTypeSelect<ExtArgs> | null;
};
export type TelegramChatCountOutputTypeCountMembersArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.TelegramChatMemberWhereInput;
};
export type TelegramChatSelect<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    telegramId?: boolean;
    type?: boolean;
    title?: boolean;
    username?: boolean;
    accessHash?: boolean;
    photoUrl?: boolean;
    description?: boolean;
    createdAt?: boolean;
    updatedAt?: boolean;
    members?: boolean | Prisma.TelegramChat$membersArgs<ExtArgs>;
    _count?: boolean | Prisma.TelegramChatCountOutputTypeDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["telegramChat"]>;
export type TelegramChatSelectCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    telegramId?: boolean;
    type?: boolean;
    title?: boolean;
    username?: boolean;
    accessHash?: boolean;
    photoUrl?: boolean;
    description?: boolean;
    createdAt?: boolean;
    updatedAt?: boolean;
}, ExtArgs["result"]["telegramChat"]>;
export type TelegramChatSelectUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    telegramId?: boolean;
    type?: boolean;
    title?: boolean;
    username?: boolean;
    accessHash?: boolean;
    photoUrl?: boolean;
    description?: boolean;
    createdAt?: boolean;
    updatedAt?: boolean;
}, ExtArgs["result"]["telegramChat"]>;
export type TelegramChatSelectScalar = {
    id?: boolean;
    telegramId?: boolean;
    type?: boolean;
    title?: boolean;
    username?: boolean;
    accessHash?: boolean;
    photoUrl?: boolean;
    description?: boolean;
    createdAt?: boolean;
    updatedAt?: boolean;
};
export type TelegramChatOmit<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetOmit<"id" | "telegramId" | "type" | "title" | "username" | "accessHash" | "photoUrl" | "description" | "createdAt" | "updatedAt", ExtArgs["result"]["telegramChat"]>;
export type TelegramChatInclude<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    members?: boolean | Prisma.TelegramChat$membersArgs<ExtArgs>;
    _count?: boolean | Prisma.TelegramChatCountOutputTypeDefaultArgs<ExtArgs>;
};
export type TelegramChatIncludeCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {};
export type TelegramChatIncludeUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {};
export type $TelegramChatPayload<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    name: "TelegramChat";
    objects: {
        members: Prisma.$TelegramChatMemberPayload<ExtArgs>[];
    };
    scalars: runtime.Types.Extensions.GetPayloadResult<{
        id: number;
        telegramId: bigint;
        type: $Enums.TelegramChatType;
        title: string | null;
        username: string | null;
        accessHash: string | null;
        photoUrl: string | null;
        description: string | null;
        createdAt: Date;
        updatedAt: Date;
    }, ExtArgs["result"]["telegramChat"]>;
    composites: {};
};
export type TelegramChatGetPayload<S extends boolean | null | undefined | TelegramChatDefaultArgs> = runtime.Types.Result.GetResult<Prisma.$TelegramChatPayload, S>;
export type TelegramChatCountArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = Omit<TelegramChatFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
    select?: TelegramChatCountAggregateInputType | true;
};
export interface TelegramChatDelegate<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: {
        types: Prisma.TypeMap<ExtArgs>['model']['TelegramChat'];
        meta: {
            name: 'TelegramChat';
        };
    };
    findUnique<T extends TelegramChatFindUniqueArgs>(args: Prisma.SelectSubset<T, TelegramChatFindUniqueArgs<ExtArgs>>): Prisma.Prisma__TelegramChatClient<runtime.Types.Result.GetResult<Prisma.$TelegramChatPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    findUniqueOrThrow<T extends TelegramChatFindUniqueOrThrowArgs>(args: Prisma.SelectSubset<T, TelegramChatFindUniqueOrThrowArgs<ExtArgs>>): Prisma.Prisma__TelegramChatClient<runtime.Types.Result.GetResult<Prisma.$TelegramChatPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    findFirst<T extends TelegramChatFindFirstArgs>(args?: Prisma.SelectSubset<T, TelegramChatFindFirstArgs<ExtArgs>>): Prisma.Prisma__TelegramChatClient<runtime.Types.Result.GetResult<Prisma.$TelegramChatPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    findFirstOrThrow<T extends TelegramChatFindFirstOrThrowArgs>(args?: Prisma.SelectSubset<T, TelegramChatFindFirstOrThrowArgs<ExtArgs>>): Prisma.Prisma__TelegramChatClient<runtime.Types.Result.GetResult<Prisma.$TelegramChatPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    findMany<T extends TelegramChatFindManyArgs>(args?: Prisma.SelectSubset<T, TelegramChatFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$TelegramChatPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>;
    create<T extends TelegramChatCreateArgs>(args: Prisma.SelectSubset<T, TelegramChatCreateArgs<ExtArgs>>): Prisma.Prisma__TelegramChatClient<runtime.Types.Result.GetResult<Prisma.$TelegramChatPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    createMany<T extends TelegramChatCreateManyArgs>(args?: Prisma.SelectSubset<T, TelegramChatCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    createManyAndReturn<T extends TelegramChatCreateManyAndReturnArgs>(args?: Prisma.SelectSubset<T, TelegramChatCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$TelegramChatPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>;
    delete<T extends TelegramChatDeleteArgs>(args: Prisma.SelectSubset<T, TelegramChatDeleteArgs<ExtArgs>>): Prisma.Prisma__TelegramChatClient<runtime.Types.Result.GetResult<Prisma.$TelegramChatPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    update<T extends TelegramChatUpdateArgs>(args: Prisma.SelectSubset<T, TelegramChatUpdateArgs<ExtArgs>>): Prisma.Prisma__TelegramChatClient<runtime.Types.Result.GetResult<Prisma.$TelegramChatPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    deleteMany<T extends TelegramChatDeleteManyArgs>(args?: Prisma.SelectSubset<T, TelegramChatDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    updateMany<T extends TelegramChatUpdateManyArgs>(args: Prisma.SelectSubset<T, TelegramChatUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    updateManyAndReturn<T extends TelegramChatUpdateManyAndReturnArgs>(args: Prisma.SelectSubset<T, TelegramChatUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$TelegramChatPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>;
    upsert<T extends TelegramChatUpsertArgs>(args: Prisma.SelectSubset<T, TelegramChatUpsertArgs<ExtArgs>>): Prisma.Prisma__TelegramChatClient<runtime.Types.Result.GetResult<Prisma.$TelegramChatPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    count<T extends TelegramChatCountArgs>(args?: Prisma.Subset<T, TelegramChatCountArgs>): Prisma.PrismaPromise<T extends runtime.Types.Utils.Record<'select', any> ? T['select'] extends true ? number : Prisma.GetScalarType<T['select'], TelegramChatCountAggregateOutputType> : number>;
    aggregate<T extends TelegramChatAggregateArgs>(args: Prisma.Subset<T, TelegramChatAggregateArgs>): Prisma.PrismaPromise<GetTelegramChatAggregateType<T>>;
    groupBy<T extends TelegramChatGroupByArgs, HasSelectOrTake extends Prisma.Or<Prisma.Extends<'skip', Prisma.Keys<T>>, Prisma.Extends<'take', Prisma.Keys<T>>>, OrderByArg extends Prisma.True extends HasSelectOrTake ? {
        orderBy: TelegramChatGroupByArgs['orderBy'];
    } : {
        orderBy?: TelegramChatGroupByArgs['orderBy'];
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
    }[OrderFields]>(args: Prisma.SubsetIntersection<T, TelegramChatGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetTelegramChatGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>;
    readonly fields: TelegramChatFieldRefs;
}
export interface Prisma__TelegramChatClient<T, Null = never, ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise";
    members<T extends Prisma.TelegramChat$membersArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.TelegramChat$membersArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$TelegramChatMemberPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>;
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): runtime.Types.Utils.JsPromise<TResult1 | TResult2>;
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): runtime.Types.Utils.JsPromise<T | TResult>;
    finally(onfinally?: (() => void) | undefined | null): runtime.Types.Utils.JsPromise<T>;
}
export interface TelegramChatFieldRefs {
    readonly id: Prisma.FieldRef<"TelegramChat", 'Int'>;
    readonly telegramId: Prisma.FieldRef<"TelegramChat", 'BigInt'>;
    readonly type: Prisma.FieldRef<"TelegramChat", 'TelegramChatType'>;
    readonly title: Prisma.FieldRef<"TelegramChat", 'String'>;
    readonly username: Prisma.FieldRef<"TelegramChat", 'String'>;
    readonly accessHash: Prisma.FieldRef<"TelegramChat", 'String'>;
    readonly photoUrl: Prisma.FieldRef<"TelegramChat", 'String'>;
    readonly description: Prisma.FieldRef<"TelegramChat", 'String'>;
    readonly createdAt: Prisma.FieldRef<"TelegramChat", 'DateTime'>;
    readonly updatedAt: Prisma.FieldRef<"TelegramChat", 'DateTime'>;
}
export type TelegramChatFindUniqueArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.TelegramChatSelect<ExtArgs> | null;
    omit?: Prisma.TelegramChatOmit<ExtArgs> | null;
    include?: Prisma.TelegramChatInclude<ExtArgs> | null;
    where: Prisma.TelegramChatWhereUniqueInput;
};
export type TelegramChatFindUniqueOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.TelegramChatSelect<ExtArgs> | null;
    omit?: Prisma.TelegramChatOmit<ExtArgs> | null;
    include?: Prisma.TelegramChatInclude<ExtArgs> | null;
    where: Prisma.TelegramChatWhereUniqueInput;
};
export type TelegramChatFindFirstArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.TelegramChatSelect<ExtArgs> | null;
    omit?: Prisma.TelegramChatOmit<ExtArgs> | null;
    include?: Prisma.TelegramChatInclude<ExtArgs> | null;
    where?: Prisma.TelegramChatWhereInput;
    orderBy?: Prisma.TelegramChatOrderByWithRelationInput | Prisma.TelegramChatOrderByWithRelationInput[];
    cursor?: Prisma.TelegramChatWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.TelegramChatScalarFieldEnum | Prisma.TelegramChatScalarFieldEnum[];
};
export type TelegramChatFindFirstOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.TelegramChatSelect<ExtArgs> | null;
    omit?: Prisma.TelegramChatOmit<ExtArgs> | null;
    include?: Prisma.TelegramChatInclude<ExtArgs> | null;
    where?: Prisma.TelegramChatWhereInput;
    orderBy?: Prisma.TelegramChatOrderByWithRelationInput | Prisma.TelegramChatOrderByWithRelationInput[];
    cursor?: Prisma.TelegramChatWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.TelegramChatScalarFieldEnum | Prisma.TelegramChatScalarFieldEnum[];
};
export type TelegramChatFindManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.TelegramChatSelect<ExtArgs> | null;
    omit?: Prisma.TelegramChatOmit<ExtArgs> | null;
    include?: Prisma.TelegramChatInclude<ExtArgs> | null;
    where?: Prisma.TelegramChatWhereInput;
    orderBy?: Prisma.TelegramChatOrderByWithRelationInput | Prisma.TelegramChatOrderByWithRelationInput[];
    cursor?: Prisma.TelegramChatWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.TelegramChatScalarFieldEnum | Prisma.TelegramChatScalarFieldEnum[];
};
export type TelegramChatCreateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.TelegramChatSelect<ExtArgs> | null;
    omit?: Prisma.TelegramChatOmit<ExtArgs> | null;
    include?: Prisma.TelegramChatInclude<ExtArgs> | null;
    data: Prisma.XOR<Prisma.TelegramChatCreateInput, Prisma.TelegramChatUncheckedCreateInput>;
};
export type TelegramChatCreateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    data: Prisma.TelegramChatCreateManyInput | Prisma.TelegramChatCreateManyInput[];
    skipDuplicates?: boolean;
};
export type TelegramChatCreateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.TelegramChatSelectCreateManyAndReturn<ExtArgs> | null;
    omit?: Prisma.TelegramChatOmit<ExtArgs> | null;
    data: Prisma.TelegramChatCreateManyInput | Prisma.TelegramChatCreateManyInput[];
    skipDuplicates?: boolean;
};
export type TelegramChatUpdateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.TelegramChatSelect<ExtArgs> | null;
    omit?: Prisma.TelegramChatOmit<ExtArgs> | null;
    include?: Prisma.TelegramChatInclude<ExtArgs> | null;
    data: Prisma.XOR<Prisma.TelegramChatUpdateInput, Prisma.TelegramChatUncheckedUpdateInput>;
    where: Prisma.TelegramChatWhereUniqueInput;
};
export type TelegramChatUpdateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    data: Prisma.XOR<Prisma.TelegramChatUpdateManyMutationInput, Prisma.TelegramChatUncheckedUpdateManyInput>;
    where?: Prisma.TelegramChatWhereInput;
    limit?: number;
};
export type TelegramChatUpdateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.TelegramChatSelectUpdateManyAndReturn<ExtArgs> | null;
    omit?: Prisma.TelegramChatOmit<ExtArgs> | null;
    data: Prisma.XOR<Prisma.TelegramChatUpdateManyMutationInput, Prisma.TelegramChatUncheckedUpdateManyInput>;
    where?: Prisma.TelegramChatWhereInput;
    limit?: number;
};
export type TelegramChatUpsertArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.TelegramChatSelect<ExtArgs> | null;
    omit?: Prisma.TelegramChatOmit<ExtArgs> | null;
    include?: Prisma.TelegramChatInclude<ExtArgs> | null;
    where: Prisma.TelegramChatWhereUniqueInput;
    create: Prisma.XOR<Prisma.TelegramChatCreateInput, Prisma.TelegramChatUncheckedCreateInput>;
    update: Prisma.XOR<Prisma.TelegramChatUpdateInput, Prisma.TelegramChatUncheckedUpdateInput>;
};
export type TelegramChatDeleteArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.TelegramChatSelect<ExtArgs> | null;
    omit?: Prisma.TelegramChatOmit<ExtArgs> | null;
    include?: Prisma.TelegramChatInclude<ExtArgs> | null;
    where: Prisma.TelegramChatWhereUniqueInput;
};
export type TelegramChatDeleteManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.TelegramChatWhereInput;
    limit?: number;
};
export type TelegramChat$membersArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
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
export type TelegramChatDefaultArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.TelegramChatSelect<ExtArgs> | null;
    omit?: Prisma.TelegramChatOmit<ExtArgs> | null;
    include?: Prisma.TelegramChatInclude<ExtArgs> | null;
};
export {};
