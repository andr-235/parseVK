import type * as runtime from "@prisma/client/runtime/client";
import type * as Prisma from "../internal/prismaNamespace.js";
export type DlMatchResultMessageModel = runtime.Types.Result.DefaultSelection<Prisma.$DlMatchResultMessagePayload>;
export type AggregateDlMatchResultMessage = {
    _count: DlMatchResultMessageCountAggregateOutputType | null;
    _avg: DlMatchResultMessageAvgAggregateOutputType | null;
    _sum: DlMatchResultMessageSumAggregateOutputType | null;
    _min: DlMatchResultMessageMinAggregateOutputType | null;
    _max: DlMatchResultMessageMaxAggregateOutputType | null;
};
export type DlMatchResultMessageAvgAggregateOutputType = {
    id: number | null;
    resultId: number | null;
};
export type DlMatchResultMessageSumAggregateOutputType = {
    id: bigint | null;
    resultId: bigint | null;
};
export type DlMatchResultMessageMinAggregateOutputType = {
    id: bigint | null;
    resultId: bigint | null;
    peerId: string | null;
    messageId: string | null;
    messageDate: Date | null;
    text: string | null;
    createdAt: Date | null;
};
export type DlMatchResultMessageMaxAggregateOutputType = {
    id: bigint | null;
    resultId: bigint | null;
    peerId: string | null;
    messageId: string | null;
    messageDate: Date | null;
    text: string | null;
    createdAt: Date | null;
};
export type DlMatchResultMessageCountAggregateOutputType = {
    id: number;
    resultId: number;
    peerId: number;
    messageId: number;
    messageDate: number;
    text: number;
    createdAt: number;
    _all: number;
};
export type DlMatchResultMessageAvgAggregateInputType = {
    id?: true;
    resultId?: true;
};
export type DlMatchResultMessageSumAggregateInputType = {
    id?: true;
    resultId?: true;
};
export type DlMatchResultMessageMinAggregateInputType = {
    id?: true;
    resultId?: true;
    peerId?: true;
    messageId?: true;
    messageDate?: true;
    text?: true;
    createdAt?: true;
};
export type DlMatchResultMessageMaxAggregateInputType = {
    id?: true;
    resultId?: true;
    peerId?: true;
    messageId?: true;
    messageDate?: true;
    text?: true;
    createdAt?: true;
};
export type DlMatchResultMessageCountAggregateInputType = {
    id?: true;
    resultId?: true;
    peerId?: true;
    messageId?: true;
    messageDate?: true;
    text?: true;
    createdAt?: true;
    _all?: true;
};
export type DlMatchResultMessageAggregateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.DlMatchResultMessageWhereInput;
    orderBy?: Prisma.DlMatchResultMessageOrderByWithRelationInput | Prisma.DlMatchResultMessageOrderByWithRelationInput[];
    cursor?: Prisma.DlMatchResultMessageWhereUniqueInput;
    take?: number;
    skip?: number;
    _count?: true | DlMatchResultMessageCountAggregateInputType;
    _avg?: DlMatchResultMessageAvgAggregateInputType;
    _sum?: DlMatchResultMessageSumAggregateInputType;
    _min?: DlMatchResultMessageMinAggregateInputType;
    _max?: DlMatchResultMessageMaxAggregateInputType;
};
export type GetDlMatchResultMessageAggregateType<T extends DlMatchResultMessageAggregateArgs> = {
    [P in keyof T & keyof AggregateDlMatchResultMessage]: P extends '_count' | 'count' ? T[P] extends true ? number : Prisma.GetScalarType<T[P], AggregateDlMatchResultMessage[P]> : Prisma.GetScalarType<T[P], AggregateDlMatchResultMessage[P]>;
};
export type DlMatchResultMessageGroupByArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.DlMatchResultMessageWhereInput;
    orderBy?: Prisma.DlMatchResultMessageOrderByWithAggregationInput | Prisma.DlMatchResultMessageOrderByWithAggregationInput[];
    by: Prisma.DlMatchResultMessageScalarFieldEnum[] | Prisma.DlMatchResultMessageScalarFieldEnum;
    having?: Prisma.DlMatchResultMessageScalarWhereWithAggregatesInput;
    take?: number;
    skip?: number;
    _count?: DlMatchResultMessageCountAggregateInputType | true;
    _avg?: DlMatchResultMessageAvgAggregateInputType;
    _sum?: DlMatchResultMessageSumAggregateInputType;
    _min?: DlMatchResultMessageMinAggregateInputType;
    _max?: DlMatchResultMessageMaxAggregateInputType;
};
export type DlMatchResultMessageGroupByOutputType = {
    id: bigint;
    resultId: bigint;
    peerId: string;
    messageId: string;
    messageDate: Date | null;
    text: string | null;
    createdAt: Date;
    _count: DlMatchResultMessageCountAggregateOutputType | null;
    _avg: DlMatchResultMessageAvgAggregateOutputType | null;
    _sum: DlMatchResultMessageSumAggregateOutputType | null;
    _min: DlMatchResultMessageMinAggregateOutputType | null;
    _max: DlMatchResultMessageMaxAggregateOutputType | null;
};
type GetDlMatchResultMessageGroupByPayload<T extends DlMatchResultMessageGroupByArgs> = Prisma.PrismaPromise<Array<Prisma.PickEnumerable<DlMatchResultMessageGroupByOutputType, T['by']> & {
    [P in ((keyof T) & (keyof DlMatchResultMessageGroupByOutputType))]: P extends '_count' ? T[P] extends boolean ? number : Prisma.GetScalarType<T[P], DlMatchResultMessageGroupByOutputType[P]> : Prisma.GetScalarType<T[P], DlMatchResultMessageGroupByOutputType[P]>;
}>>;
export type DlMatchResultMessageWhereInput = {
    AND?: Prisma.DlMatchResultMessageWhereInput | Prisma.DlMatchResultMessageWhereInput[];
    OR?: Prisma.DlMatchResultMessageWhereInput[];
    NOT?: Prisma.DlMatchResultMessageWhereInput | Prisma.DlMatchResultMessageWhereInput[];
    id?: Prisma.BigIntFilter<"DlMatchResultMessage"> | bigint | number;
    resultId?: Prisma.BigIntFilter<"DlMatchResultMessage"> | bigint | number;
    peerId?: Prisma.StringFilter<"DlMatchResultMessage"> | string;
    messageId?: Prisma.StringFilter<"DlMatchResultMessage"> | string;
    messageDate?: Prisma.DateTimeNullableFilter<"DlMatchResultMessage"> | Date | string | null;
    text?: Prisma.StringNullableFilter<"DlMatchResultMessage"> | string | null;
    createdAt?: Prisma.DateTimeFilter<"DlMatchResultMessage"> | Date | string;
    result?: Prisma.XOR<Prisma.DlMatchResultScalarRelationFilter, Prisma.DlMatchResultWhereInput>;
};
export type DlMatchResultMessageOrderByWithRelationInput = {
    id?: Prisma.SortOrder;
    resultId?: Prisma.SortOrder;
    peerId?: Prisma.SortOrder;
    messageId?: Prisma.SortOrder;
    messageDate?: Prisma.SortOrderInput | Prisma.SortOrder;
    text?: Prisma.SortOrderInput | Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    result?: Prisma.DlMatchResultOrderByWithRelationInput;
};
export type DlMatchResultMessageWhereUniqueInput = Prisma.AtLeast<{
    id?: bigint | number;
    AND?: Prisma.DlMatchResultMessageWhereInput | Prisma.DlMatchResultMessageWhereInput[];
    OR?: Prisma.DlMatchResultMessageWhereInput[];
    NOT?: Prisma.DlMatchResultMessageWhereInput | Prisma.DlMatchResultMessageWhereInput[];
    resultId?: Prisma.BigIntFilter<"DlMatchResultMessage"> | bigint | number;
    peerId?: Prisma.StringFilter<"DlMatchResultMessage"> | string;
    messageId?: Prisma.StringFilter<"DlMatchResultMessage"> | string;
    messageDate?: Prisma.DateTimeNullableFilter<"DlMatchResultMessage"> | Date | string | null;
    text?: Prisma.StringNullableFilter<"DlMatchResultMessage"> | string | null;
    createdAt?: Prisma.DateTimeFilter<"DlMatchResultMessage"> | Date | string;
    result?: Prisma.XOR<Prisma.DlMatchResultScalarRelationFilter, Prisma.DlMatchResultWhereInput>;
}, "id">;
export type DlMatchResultMessageOrderByWithAggregationInput = {
    id?: Prisma.SortOrder;
    resultId?: Prisma.SortOrder;
    peerId?: Prisma.SortOrder;
    messageId?: Prisma.SortOrder;
    messageDate?: Prisma.SortOrderInput | Prisma.SortOrder;
    text?: Prisma.SortOrderInput | Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    _count?: Prisma.DlMatchResultMessageCountOrderByAggregateInput;
    _avg?: Prisma.DlMatchResultMessageAvgOrderByAggregateInput;
    _max?: Prisma.DlMatchResultMessageMaxOrderByAggregateInput;
    _min?: Prisma.DlMatchResultMessageMinOrderByAggregateInput;
    _sum?: Prisma.DlMatchResultMessageSumOrderByAggregateInput;
};
export type DlMatchResultMessageScalarWhereWithAggregatesInput = {
    AND?: Prisma.DlMatchResultMessageScalarWhereWithAggregatesInput | Prisma.DlMatchResultMessageScalarWhereWithAggregatesInput[];
    OR?: Prisma.DlMatchResultMessageScalarWhereWithAggregatesInput[];
    NOT?: Prisma.DlMatchResultMessageScalarWhereWithAggregatesInput | Prisma.DlMatchResultMessageScalarWhereWithAggregatesInput[];
    id?: Prisma.BigIntWithAggregatesFilter<"DlMatchResultMessage"> | bigint | number;
    resultId?: Prisma.BigIntWithAggregatesFilter<"DlMatchResultMessage"> | bigint | number;
    peerId?: Prisma.StringWithAggregatesFilter<"DlMatchResultMessage"> | string;
    messageId?: Prisma.StringWithAggregatesFilter<"DlMatchResultMessage"> | string;
    messageDate?: Prisma.DateTimeNullableWithAggregatesFilter<"DlMatchResultMessage"> | Date | string | null;
    text?: Prisma.StringNullableWithAggregatesFilter<"DlMatchResultMessage"> | string | null;
    createdAt?: Prisma.DateTimeWithAggregatesFilter<"DlMatchResultMessage"> | Date | string;
};
export type DlMatchResultMessageCreateInput = {
    id?: bigint | number;
    peerId: string;
    messageId: string;
    messageDate?: Date | string | null;
    text?: string | null;
    createdAt?: Date | string;
    result: Prisma.DlMatchResultCreateNestedOneWithoutMessagesInput;
};
export type DlMatchResultMessageUncheckedCreateInput = {
    id?: bigint | number;
    resultId: bigint | number;
    peerId: string;
    messageId: string;
    messageDate?: Date | string | null;
    text?: string | null;
    createdAt?: Date | string;
};
export type DlMatchResultMessageUpdateInput = {
    id?: Prisma.BigIntFieldUpdateOperationsInput | bigint | number;
    peerId?: Prisma.StringFieldUpdateOperationsInput | string;
    messageId?: Prisma.StringFieldUpdateOperationsInput | string;
    messageDate?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    text?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    result?: Prisma.DlMatchResultUpdateOneRequiredWithoutMessagesNestedInput;
};
export type DlMatchResultMessageUncheckedUpdateInput = {
    id?: Prisma.BigIntFieldUpdateOperationsInput | bigint | number;
    resultId?: Prisma.BigIntFieldUpdateOperationsInput | bigint | number;
    peerId?: Prisma.StringFieldUpdateOperationsInput | string;
    messageId?: Prisma.StringFieldUpdateOperationsInput | string;
    messageDate?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    text?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type DlMatchResultMessageCreateManyInput = {
    id?: bigint | number;
    resultId: bigint | number;
    peerId: string;
    messageId: string;
    messageDate?: Date | string | null;
    text?: string | null;
    createdAt?: Date | string;
};
export type DlMatchResultMessageUpdateManyMutationInput = {
    id?: Prisma.BigIntFieldUpdateOperationsInput | bigint | number;
    peerId?: Prisma.StringFieldUpdateOperationsInput | string;
    messageId?: Prisma.StringFieldUpdateOperationsInput | string;
    messageDate?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    text?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type DlMatchResultMessageUncheckedUpdateManyInput = {
    id?: Prisma.BigIntFieldUpdateOperationsInput | bigint | number;
    resultId?: Prisma.BigIntFieldUpdateOperationsInput | bigint | number;
    peerId?: Prisma.StringFieldUpdateOperationsInput | string;
    messageId?: Prisma.StringFieldUpdateOperationsInput | string;
    messageDate?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    text?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type DlMatchResultMessageListRelationFilter = {
    every?: Prisma.DlMatchResultMessageWhereInput;
    some?: Prisma.DlMatchResultMessageWhereInput;
    none?: Prisma.DlMatchResultMessageWhereInput;
};
export type DlMatchResultMessageOrderByRelationAggregateInput = {
    _count?: Prisma.SortOrder;
};
export type DlMatchResultMessageCountOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    resultId?: Prisma.SortOrder;
    peerId?: Prisma.SortOrder;
    messageId?: Prisma.SortOrder;
    messageDate?: Prisma.SortOrder;
    text?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
};
export type DlMatchResultMessageAvgOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    resultId?: Prisma.SortOrder;
};
export type DlMatchResultMessageMaxOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    resultId?: Prisma.SortOrder;
    peerId?: Prisma.SortOrder;
    messageId?: Prisma.SortOrder;
    messageDate?: Prisma.SortOrder;
    text?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
};
export type DlMatchResultMessageMinOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    resultId?: Prisma.SortOrder;
    peerId?: Prisma.SortOrder;
    messageId?: Prisma.SortOrder;
    messageDate?: Prisma.SortOrder;
    text?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
};
export type DlMatchResultMessageSumOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    resultId?: Prisma.SortOrder;
};
export type DlMatchResultMessageCreateNestedManyWithoutResultInput = {
    create?: Prisma.XOR<Prisma.DlMatchResultMessageCreateWithoutResultInput, Prisma.DlMatchResultMessageUncheckedCreateWithoutResultInput> | Prisma.DlMatchResultMessageCreateWithoutResultInput[] | Prisma.DlMatchResultMessageUncheckedCreateWithoutResultInput[];
    connectOrCreate?: Prisma.DlMatchResultMessageCreateOrConnectWithoutResultInput | Prisma.DlMatchResultMessageCreateOrConnectWithoutResultInput[];
    createMany?: Prisma.DlMatchResultMessageCreateManyResultInputEnvelope;
    connect?: Prisma.DlMatchResultMessageWhereUniqueInput | Prisma.DlMatchResultMessageWhereUniqueInput[];
};
export type DlMatchResultMessageUncheckedCreateNestedManyWithoutResultInput = {
    create?: Prisma.XOR<Prisma.DlMatchResultMessageCreateWithoutResultInput, Prisma.DlMatchResultMessageUncheckedCreateWithoutResultInput> | Prisma.DlMatchResultMessageCreateWithoutResultInput[] | Prisma.DlMatchResultMessageUncheckedCreateWithoutResultInput[];
    connectOrCreate?: Prisma.DlMatchResultMessageCreateOrConnectWithoutResultInput | Prisma.DlMatchResultMessageCreateOrConnectWithoutResultInput[];
    createMany?: Prisma.DlMatchResultMessageCreateManyResultInputEnvelope;
    connect?: Prisma.DlMatchResultMessageWhereUniqueInput | Prisma.DlMatchResultMessageWhereUniqueInput[];
};
export type DlMatchResultMessageUpdateManyWithoutResultNestedInput = {
    create?: Prisma.XOR<Prisma.DlMatchResultMessageCreateWithoutResultInput, Prisma.DlMatchResultMessageUncheckedCreateWithoutResultInput> | Prisma.DlMatchResultMessageCreateWithoutResultInput[] | Prisma.DlMatchResultMessageUncheckedCreateWithoutResultInput[];
    connectOrCreate?: Prisma.DlMatchResultMessageCreateOrConnectWithoutResultInput | Prisma.DlMatchResultMessageCreateOrConnectWithoutResultInput[];
    upsert?: Prisma.DlMatchResultMessageUpsertWithWhereUniqueWithoutResultInput | Prisma.DlMatchResultMessageUpsertWithWhereUniqueWithoutResultInput[];
    createMany?: Prisma.DlMatchResultMessageCreateManyResultInputEnvelope;
    set?: Prisma.DlMatchResultMessageWhereUniqueInput | Prisma.DlMatchResultMessageWhereUniqueInput[];
    disconnect?: Prisma.DlMatchResultMessageWhereUniqueInput | Prisma.DlMatchResultMessageWhereUniqueInput[];
    delete?: Prisma.DlMatchResultMessageWhereUniqueInput | Prisma.DlMatchResultMessageWhereUniqueInput[];
    connect?: Prisma.DlMatchResultMessageWhereUniqueInput | Prisma.DlMatchResultMessageWhereUniqueInput[];
    update?: Prisma.DlMatchResultMessageUpdateWithWhereUniqueWithoutResultInput | Prisma.DlMatchResultMessageUpdateWithWhereUniqueWithoutResultInput[];
    updateMany?: Prisma.DlMatchResultMessageUpdateManyWithWhereWithoutResultInput | Prisma.DlMatchResultMessageUpdateManyWithWhereWithoutResultInput[];
    deleteMany?: Prisma.DlMatchResultMessageScalarWhereInput | Prisma.DlMatchResultMessageScalarWhereInput[];
};
export type DlMatchResultMessageUncheckedUpdateManyWithoutResultNestedInput = {
    create?: Prisma.XOR<Prisma.DlMatchResultMessageCreateWithoutResultInput, Prisma.DlMatchResultMessageUncheckedCreateWithoutResultInput> | Prisma.DlMatchResultMessageCreateWithoutResultInput[] | Prisma.DlMatchResultMessageUncheckedCreateWithoutResultInput[];
    connectOrCreate?: Prisma.DlMatchResultMessageCreateOrConnectWithoutResultInput | Prisma.DlMatchResultMessageCreateOrConnectWithoutResultInput[];
    upsert?: Prisma.DlMatchResultMessageUpsertWithWhereUniqueWithoutResultInput | Prisma.DlMatchResultMessageUpsertWithWhereUniqueWithoutResultInput[];
    createMany?: Prisma.DlMatchResultMessageCreateManyResultInputEnvelope;
    set?: Prisma.DlMatchResultMessageWhereUniqueInput | Prisma.DlMatchResultMessageWhereUniqueInput[];
    disconnect?: Prisma.DlMatchResultMessageWhereUniqueInput | Prisma.DlMatchResultMessageWhereUniqueInput[];
    delete?: Prisma.DlMatchResultMessageWhereUniqueInput | Prisma.DlMatchResultMessageWhereUniqueInput[];
    connect?: Prisma.DlMatchResultMessageWhereUniqueInput | Prisma.DlMatchResultMessageWhereUniqueInput[];
    update?: Prisma.DlMatchResultMessageUpdateWithWhereUniqueWithoutResultInput | Prisma.DlMatchResultMessageUpdateWithWhereUniqueWithoutResultInput[];
    updateMany?: Prisma.DlMatchResultMessageUpdateManyWithWhereWithoutResultInput | Prisma.DlMatchResultMessageUpdateManyWithWhereWithoutResultInput[];
    deleteMany?: Prisma.DlMatchResultMessageScalarWhereInput | Prisma.DlMatchResultMessageScalarWhereInput[];
};
export type DlMatchResultMessageCreateWithoutResultInput = {
    id?: bigint | number;
    peerId: string;
    messageId: string;
    messageDate?: Date | string | null;
    text?: string | null;
    createdAt?: Date | string;
};
export type DlMatchResultMessageUncheckedCreateWithoutResultInput = {
    id?: bigint | number;
    peerId: string;
    messageId: string;
    messageDate?: Date | string | null;
    text?: string | null;
    createdAt?: Date | string;
};
export type DlMatchResultMessageCreateOrConnectWithoutResultInput = {
    where: Prisma.DlMatchResultMessageWhereUniqueInput;
    create: Prisma.XOR<Prisma.DlMatchResultMessageCreateWithoutResultInput, Prisma.DlMatchResultMessageUncheckedCreateWithoutResultInput>;
};
export type DlMatchResultMessageCreateManyResultInputEnvelope = {
    data: Prisma.DlMatchResultMessageCreateManyResultInput | Prisma.DlMatchResultMessageCreateManyResultInput[];
    skipDuplicates?: boolean;
};
export type DlMatchResultMessageUpsertWithWhereUniqueWithoutResultInput = {
    where: Prisma.DlMatchResultMessageWhereUniqueInput;
    update: Prisma.XOR<Prisma.DlMatchResultMessageUpdateWithoutResultInput, Prisma.DlMatchResultMessageUncheckedUpdateWithoutResultInput>;
    create: Prisma.XOR<Prisma.DlMatchResultMessageCreateWithoutResultInput, Prisma.DlMatchResultMessageUncheckedCreateWithoutResultInput>;
};
export type DlMatchResultMessageUpdateWithWhereUniqueWithoutResultInput = {
    where: Prisma.DlMatchResultMessageWhereUniqueInput;
    data: Prisma.XOR<Prisma.DlMatchResultMessageUpdateWithoutResultInput, Prisma.DlMatchResultMessageUncheckedUpdateWithoutResultInput>;
};
export type DlMatchResultMessageUpdateManyWithWhereWithoutResultInput = {
    where: Prisma.DlMatchResultMessageScalarWhereInput;
    data: Prisma.XOR<Prisma.DlMatchResultMessageUpdateManyMutationInput, Prisma.DlMatchResultMessageUncheckedUpdateManyWithoutResultInput>;
};
export type DlMatchResultMessageScalarWhereInput = {
    AND?: Prisma.DlMatchResultMessageScalarWhereInput | Prisma.DlMatchResultMessageScalarWhereInput[];
    OR?: Prisma.DlMatchResultMessageScalarWhereInput[];
    NOT?: Prisma.DlMatchResultMessageScalarWhereInput | Prisma.DlMatchResultMessageScalarWhereInput[];
    id?: Prisma.BigIntFilter<"DlMatchResultMessage"> | bigint | number;
    resultId?: Prisma.BigIntFilter<"DlMatchResultMessage"> | bigint | number;
    peerId?: Prisma.StringFilter<"DlMatchResultMessage"> | string;
    messageId?: Prisma.StringFilter<"DlMatchResultMessage"> | string;
    messageDate?: Prisma.DateTimeNullableFilter<"DlMatchResultMessage"> | Date | string | null;
    text?: Prisma.StringNullableFilter<"DlMatchResultMessage"> | string | null;
    createdAt?: Prisma.DateTimeFilter<"DlMatchResultMessage"> | Date | string;
};
export type DlMatchResultMessageCreateManyResultInput = {
    id?: bigint | number;
    peerId: string;
    messageId: string;
    messageDate?: Date | string | null;
    text?: string | null;
    createdAt?: Date | string;
};
export type DlMatchResultMessageUpdateWithoutResultInput = {
    id?: Prisma.BigIntFieldUpdateOperationsInput | bigint | number;
    peerId?: Prisma.StringFieldUpdateOperationsInput | string;
    messageId?: Prisma.StringFieldUpdateOperationsInput | string;
    messageDate?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    text?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type DlMatchResultMessageUncheckedUpdateWithoutResultInput = {
    id?: Prisma.BigIntFieldUpdateOperationsInput | bigint | number;
    peerId?: Prisma.StringFieldUpdateOperationsInput | string;
    messageId?: Prisma.StringFieldUpdateOperationsInput | string;
    messageDate?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    text?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type DlMatchResultMessageUncheckedUpdateManyWithoutResultInput = {
    id?: Prisma.BigIntFieldUpdateOperationsInput | bigint | number;
    peerId?: Prisma.StringFieldUpdateOperationsInput | string;
    messageId?: Prisma.StringFieldUpdateOperationsInput | string;
    messageDate?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    text?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type DlMatchResultMessageSelect<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    resultId?: boolean;
    peerId?: boolean;
    messageId?: boolean;
    messageDate?: boolean;
    text?: boolean;
    createdAt?: boolean;
    result?: boolean | Prisma.DlMatchResultDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["dlMatchResultMessage"]>;
export type DlMatchResultMessageSelectCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    resultId?: boolean;
    peerId?: boolean;
    messageId?: boolean;
    messageDate?: boolean;
    text?: boolean;
    createdAt?: boolean;
    result?: boolean | Prisma.DlMatchResultDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["dlMatchResultMessage"]>;
export type DlMatchResultMessageSelectUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    resultId?: boolean;
    peerId?: boolean;
    messageId?: boolean;
    messageDate?: boolean;
    text?: boolean;
    createdAt?: boolean;
    result?: boolean | Prisma.DlMatchResultDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["dlMatchResultMessage"]>;
export type DlMatchResultMessageSelectScalar = {
    id?: boolean;
    resultId?: boolean;
    peerId?: boolean;
    messageId?: boolean;
    messageDate?: boolean;
    text?: boolean;
    createdAt?: boolean;
};
export type DlMatchResultMessageOmit<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetOmit<"id" | "resultId" | "peerId" | "messageId" | "messageDate" | "text" | "createdAt", ExtArgs["result"]["dlMatchResultMessage"]>;
export type DlMatchResultMessageInclude<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    result?: boolean | Prisma.DlMatchResultDefaultArgs<ExtArgs>;
};
export type DlMatchResultMessageIncludeCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    result?: boolean | Prisma.DlMatchResultDefaultArgs<ExtArgs>;
};
export type DlMatchResultMessageIncludeUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    result?: boolean | Prisma.DlMatchResultDefaultArgs<ExtArgs>;
};
export type $DlMatchResultMessagePayload<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    name: "DlMatchResultMessage";
    objects: {
        result: Prisma.$DlMatchResultPayload<ExtArgs>;
    };
    scalars: runtime.Types.Extensions.GetPayloadResult<{
        id: bigint;
        resultId: bigint;
        peerId: string;
        messageId: string;
        messageDate: Date | null;
        text: string | null;
        createdAt: Date;
    }, ExtArgs["result"]["dlMatchResultMessage"]>;
    composites: {};
};
export type DlMatchResultMessageGetPayload<S extends boolean | null | undefined | DlMatchResultMessageDefaultArgs> = runtime.Types.Result.GetResult<Prisma.$DlMatchResultMessagePayload, S>;
export type DlMatchResultMessageCountArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = Omit<DlMatchResultMessageFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
    select?: DlMatchResultMessageCountAggregateInputType | true;
};
export interface DlMatchResultMessageDelegate<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: {
        types: Prisma.TypeMap<ExtArgs>['model']['DlMatchResultMessage'];
        meta: {
            name: 'DlMatchResultMessage';
        };
    };
    findUnique<T extends DlMatchResultMessageFindUniqueArgs>(args: Prisma.SelectSubset<T, DlMatchResultMessageFindUniqueArgs<ExtArgs>>): Prisma.Prisma__DlMatchResultMessageClient<runtime.Types.Result.GetResult<Prisma.$DlMatchResultMessagePayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    findUniqueOrThrow<T extends DlMatchResultMessageFindUniqueOrThrowArgs>(args: Prisma.SelectSubset<T, DlMatchResultMessageFindUniqueOrThrowArgs<ExtArgs>>): Prisma.Prisma__DlMatchResultMessageClient<runtime.Types.Result.GetResult<Prisma.$DlMatchResultMessagePayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    findFirst<T extends DlMatchResultMessageFindFirstArgs>(args?: Prisma.SelectSubset<T, DlMatchResultMessageFindFirstArgs<ExtArgs>>): Prisma.Prisma__DlMatchResultMessageClient<runtime.Types.Result.GetResult<Prisma.$DlMatchResultMessagePayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    findFirstOrThrow<T extends DlMatchResultMessageFindFirstOrThrowArgs>(args?: Prisma.SelectSubset<T, DlMatchResultMessageFindFirstOrThrowArgs<ExtArgs>>): Prisma.Prisma__DlMatchResultMessageClient<runtime.Types.Result.GetResult<Prisma.$DlMatchResultMessagePayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    findMany<T extends DlMatchResultMessageFindManyArgs>(args?: Prisma.SelectSubset<T, DlMatchResultMessageFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$DlMatchResultMessagePayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>;
    create<T extends DlMatchResultMessageCreateArgs>(args: Prisma.SelectSubset<T, DlMatchResultMessageCreateArgs<ExtArgs>>): Prisma.Prisma__DlMatchResultMessageClient<runtime.Types.Result.GetResult<Prisma.$DlMatchResultMessagePayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    createMany<T extends DlMatchResultMessageCreateManyArgs>(args?: Prisma.SelectSubset<T, DlMatchResultMessageCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    createManyAndReturn<T extends DlMatchResultMessageCreateManyAndReturnArgs>(args?: Prisma.SelectSubset<T, DlMatchResultMessageCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$DlMatchResultMessagePayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>;
    delete<T extends DlMatchResultMessageDeleteArgs>(args: Prisma.SelectSubset<T, DlMatchResultMessageDeleteArgs<ExtArgs>>): Prisma.Prisma__DlMatchResultMessageClient<runtime.Types.Result.GetResult<Prisma.$DlMatchResultMessagePayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    update<T extends DlMatchResultMessageUpdateArgs>(args: Prisma.SelectSubset<T, DlMatchResultMessageUpdateArgs<ExtArgs>>): Prisma.Prisma__DlMatchResultMessageClient<runtime.Types.Result.GetResult<Prisma.$DlMatchResultMessagePayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    deleteMany<T extends DlMatchResultMessageDeleteManyArgs>(args?: Prisma.SelectSubset<T, DlMatchResultMessageDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    updateMany<T extends DlMatchResultMessageUpdateManyArgs>(args: Prisma.SelectSubset<T, DlMatchResultMessageUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    updateManyAndReturn<T extends DlMatchResultMessageUpdateManyAndReturnArgs>(args: Prisma.SelectSubset<T, DlMatchResultMessageUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$DlMatchResultMessagePayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>;
    upsert<T extends DlMatchResultMessageUpsertArgs>(args: Prisma.SelectSubset<T, DlMatchResultMessageUpsertArgs<ExtArgs>>): Prisma.Prisma__DlMatchResultMessageClient<runtime.Types.Result.GetResult<Prisma.$DlMatchResultMessagePayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    count<T extends DlMatchResultMessageCountArgs>(args?: Prisma.Subset<T, DlMatchResultMessageCountArgs>): Prisma.PrismaPromise<T extends runtime.Types.Utils.Record<'select', any> ? T['select'] extends true ? number : Prisma.GetScalarType<T['select'], DlMatchResultMessageCountAggregateOutputType> : number>;
    aggregate<T extends DlMatchResultMessageAggregateArgs>(args: Prisma.Subset<T, DlMatchResultMessageAggregateArgs>): Prisma.PrismaPromise<GetDlMatchResultMessageAggregateType<T>>;
    groupBy<T extends DlMatchResultMessageGroupByArgs, HasSelectOrTake extends Prisma.Or<Prisma.Extends<'skip', Prisma.Keys<T>>, Prisma.Extends<'take', Prisma.Keys<T>>>, OrderByArg extends Prisma.True extends HasSelectOrTake ? {
        orderBy: DlMatchResultMessageGroupByArgs['orderBy'];
    } : {
        orderBy?: DlMatchResultMessageGroupByArgs['orderBy'];
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
    }[OrderFields]>(args: Prisma.SubsetIntersection<T, DlMatchResultMessageGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetDlMatchResultMessageGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>;
    readonly fields: DlMatchResultMessageFieldRefs;
}
export interface Prisma__DlMatchResultMessageClient<T, Null = never, ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise";
    result<T extends Prisma.DlMatchResultDefaultArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.DlMatchResultDefaultArgs<ExtArgs>>): Prisma.Prisma__DlMatchResultClient<runtime.Types.Result.GetResult<Prisma.$DlMatchResultPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>;
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): runtime.Types.Utils.JsPromise<TResult1 | TResult2>;
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): runtime.Types.Utils.JsPromise<T | TResult>;
    finally(onfinally?: (() => void) | undefined | null): runtime.Types.Utils.JsPromise<T>;
}
export interface DlMatchResultMessageFieldRefs {
    readonly id: Prisma.FieldRef<"DlMatchResultMessage", 'BigInt'>;
    readonly resultId: Prisma.FieldRef<"DlMatchResultMessage", 'BigInt'>;
    readonly peerId: Prisma.FieldRef<"DlMatchResultMessage", 'String'>;
    readonly messageId: Prisma.FieldRef<"DlMatchResultMessage", 'String'>;
    readonly messageDate: Prisma.FieldRef<"DlMatchResultMessage", 'DateTime'>;
    readonly text: Prisma.FieldRef<"DlMatchResultMessage", 'String'>;
    readonly createdAt: Prisma.FieldRef<"DlMatchResultMessage", 'DateTime'>;
}
export type DlMatchResultMessageFindUniqueArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.DlMatchResultMessageSelect<ExtArgs> | null;
    omit?: Prisma.DlMatchResultMessageOmit<ExtArgs> | null;
    include?: Prisma.DlMatchResultMessageInclude<ExtArgs> | null;
    where: Prisma.DlMatchResultMessageWhereUniqueInput;
};
export type DlMatchResultMessageFindUniqueOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.DlMatchResultMessageSelect<ExtArgs> | null;
    omit?: Prisma.DlMatchResultMessageOmit<ExtArgs> | null;
    include?: Prisma.DlMatchResultMessageInclude<ExtArgs> | null;
    where: Prisma.DlMatchResultMessageWhereUniqueInput;
};
export type DlMatchResultMessageFindFirstArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
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
export type DlMatchResultMessageFindFirstOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
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
export type DlMatchResultMessageFindManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
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
export type DlMatchResultMessageCreateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.DlMatchResultMessageSelect<ExtArgs> | null;
    omit?: Prisma.DlMatchResultMessageOmit<ExtArgs> | null;
    include?: Prisma.DlMatchResultMessageInclude<ExtArgs> | null;
    data: Prisma.XOR<Prisma.DlMatchResultMessageCreateInput, Prisma.DlMatchResultMessageUncheckedCreateInput>;
};
export type DlMatchResultMessageCreateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    data: Prisma.DlMatchResultMessageCreateManyInput | Prisma.DlMatchResultMessageCreateManyInput[];
    skipDuplicates?: boolean;
};
export type DlMatchResultMessageCreateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.DlMatchResultMessageSelectCreateManyAndReturn<ExtArgs> | null;
    omit?: Prisma.DlMatchResultMessageOmit<ExtArgs> | null;
    data: Prisma.DlMatchResultMessageCreateManyInput | Prisma.DlMatchResultMessageCreateManyInput[];
    skipDuplicates?: boolean;
    include?: Prisma.DlMatchResultMessageIncludeCreateManyAndReturn<ExtArgs> | null;
};
export type DlMatchResultMessageUpdateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.DlMatchResultMessageSelect<ExtArgs> | null;
    omit?: Prisma.DlMatchResultMessageOmit<ExtArgs> | null;
    include?: Prisma.DlMatchResultMessageInclude<ExtArgs> | null;
    data: Prisma.XOR<Prisma.DlMatchResultMessageUpdateInput, Prisma.DlMatchResultMessageUncheckedUpdateInput>;
    where: Prisma.DlMatchResultMessageWhereUniqueInput;
};
export type DlMatchResultMessageUpdateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    data: Prisma.XOR<Prisma.DlMatchResultMessageUpdateManyMutationInput, Prisma.DlMatchResultMessageUncheckedUpdateManyInput>;
    where?: Prisma.DlMatchResultMessageWhereInput;
    limit?: number;
};
export type DlMatchResultMessageUpdateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.DlMatchResultMessageSelectUpdateManyAndReturn<ExtArgs> | null;
    omit?: Prisma.DlMatchResultMessageOmit<ExtArgs> | null;
    data: Prisma.XOR<Prisma.DlMatchResultMessageUpdateManyMutationInput, Prisma.DlMatchResultMessageUncheckedUpdateManyInput>;
    where?: Prisma.DlMatchResultMessageWhereInput;
    limit?: number;
    include?: Prisma.DlMatchResultMessageIncludeUpdateManyAndReturn<ExtArgs> | null;
};
export type DlMatchResultMessageUpsertArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.DlMatchResultMessageSelect<ExtArgs> | null;
    omit?: Prisma.DlMatchResultMessageOmit<ExtArgs> | null;
    include?: Prisma.DlMatchResultMessageInclude<ExtArgs> | null;
    where: Prisma.DlMatchResultMessageWhereUniqueInput;
    create: Prisma.XOR<Prisma.DlMatchResultMessageCreateInput, Prisma.DlMatchResultMessageUncheckedCreateInput>;
    update: Prisma.XOR<Prisma.DlMatchResultMessageUpdateInput, Prisma.DlMatchResultMessageUncheckedUpdateInput>;
};
export type DlMatchResultMessageDeleteArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.DlMatchResultMessageSelect<ExtArgs> | null;
    omit?: Prisma.DlMatchResultMessageOmit<ExtArgs> | null;
    include?: Prisma.DlMatchResultMessageInclude<ExtArgs> | null;
    where: Prisma.DlMatchResultMessageWhereUniqueInput;
};
export type DlMatchResultMessageDeleteManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.DlMatchResultMessageWhereInput;
    limit?: number;
};
export type DlMatchResultMessageDefaultArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.DlMatchResultMessageSelect<ExtArgs> | null;
    omit?: Prisma.DlMatchResultMessageOmit<ExtArgs> | null;
    include?: Prisma.DlMatchResultMessageInclude<ExtArgs> | null;
};
export {};
