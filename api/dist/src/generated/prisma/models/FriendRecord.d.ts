import type * as runtime from "@prisma/client/runtime/client";
import type * as Prisma from "../internal/prismaNamespace.js";
export type FriendRecordModel = runtime.Types.Result.DefaultSelection<Prisma.$FriendRecordPayload>;
export type AggregateFriendRecord = {
    _count: FriendRecordCountAggregateOutputType | null;
    _avg: FriendRecordAvgAggregateOutputType | null;
    _sum: FriendRecordSumAggregateOutputType | null;
    _min: FriendRecordMinAggregateOutputType | null;
    _max: FriendRecordMaxAggregateOutputType | null;
};
export type FriendRecordAvgAggregateOutputType = {
    vkFriendId: number | null;
    okFriendId: number | null;
};
export type FriendRecordSumAggregateOutputType = {
    vkFriendId: number | null;
    okFriendId: bigint | null;
};
export type FriendRecordMinAggregateOutputType = {
    id: string | null;
    jobId: string | null;
    vkFriendId: number | null;
    okFriendId: bigint | null;
    createdAt: Date | null;
};
export type FriendRecordMaxAggregateOutputType = {
    id: string | null;
    jobId: string | null;
    vkFriendId: number | null;
    okFriendId: bigint | null;
    createdAt: Date | null;
};
export type FriendRecordCountAggregateOutputType = {
    id: number;
    jobId: number;
    vkFriendId: number;
    okFriendId: number;
    payload: number;
    createdAt: number;
    _all: number;
};
export type FriendRecordAvgAggregateInputType = {
    vkFriendId?: true;
    okFriendId?: true;
};
export type FriendRecordSumAggregateInputType = {
    vkFriendId?: true;
    okFriendId?: true;
};
export type FriendRecordMinAggregateInputType = {
    id?: true;
    jobId?: true;
    vkFriendId?: true;
    okFriendId?: true;
    createdAt?: true;
};
export type FriendRecordMaxAggregateInputType = {
    id?: true;
    jobId?: true;
    vkFriendId?: true;
    okFriendId?: true;
    createdAt?: true;
};
export type FriendRecordCountAggregateInputType = {
    id?: true;
    jobId?: true;
    vkFriendId?: true;
    okFriendId?: true;
    payload?: true;
    createdAt?: true;
    _all?: true;
};
export type FriendRecordAggregateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.FriendRecordWhereInput;
    orderBy?: Prisma.FriendRecordOrderByWithRelationInput | Prisma.FriendRecordOrderByWithRelationInput[];
    cursor?: Prisma.FriendRecordWhereUniqueInput;
    take?: number;
    skip?: number;
    _count?: true | FriendRecordCountAggregateInputType;
    _avg?: FriendRecordAvgAggregateInputType;
    _sum?: FriendRecordSumAggregateInputType;
    _min?: FriendRecordMinAggregateInputType;
    _max?: FriendRecordMaxAggregateInputType;
};
export type GetFriendRecordAggregateType<T extends FriendRecordAggregateArgs> = {
    [P in keyof T & keyof AggregateFriendRecord]: P extends '_count' | 'count' ? T[P] extends true ? number : Prisma.GetScalarType<T[P], AggregateFriendRecord[P]> : Prisma.GetScalarType<T[P], AggregateFriendRecord[P]>;
};
export type FriendRecordGroupByArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.FriendRecordWhereInput;
    orderBy?: Prisma.FriendRecordOrderByWithAggregationInput | Prisma.FriendRecordOrderByWithAggregationInput[];
    by: Prisma.FriendRecordScalarFieldEnum[] | Prisma.FriendRecordScalarFieldEnum;
    having?: Prisma.FriendRecordScalarWhereWithAggregatesInput;
    take?: number;
    skip?: number;
    _count?: FriendRecordCountAggregateInputType | true;
    _avg?: FriendRecordAvgAggregateInputType;
    _sum?: FriendRecordSumAggregateInputType;
    _min?: FriendRecordMinAggregateInputType;
    _max?: FriendRecordMaxAggregateInputType;
};
export type FriendRecordGroupByOutputType = {
    id: string;
    jobId: string;
    vkFriendId: number | null;
    okFriendId: bigint | null;
    payload: runtime.JsonValue;
    createdAt: Date;
    _count: FriendRecordCountAggregateOutputType | null;
    _avg: FriendRecordAvgAggregateOutputType | null;
    _sum: FriendRecordSumAggregateOutputType | null;
    _min: FriendRecordMinAggregateOutputType | null;
    _max: FriendRecordMaxAggregateOutputType | null;
};
type GetFriendRecordGroupByPayload<T extends FriendRecordGroupByArgs> = Prisma.PrismaPromise<Array<Prisma.PickEnumerable<FriendRecordGroupByOutputType, T['by']> & {
    [P in ((keyof T) & (keyof FriendRecordGroupByOutputType))]: P extends '_count' ? T[P] extends boolean ? number : Prisma.GetScalarType<T[P], FriendRecordGroupByOutputType[P]> : Prisma.GetScalarType<T[P], FriendRecordGroupByOutputType[P]>;
}>>;
export type FriendRecordWhereInput = {
    AND?: Prisma.FriendRecordWhereInput | Prisma.FriendRecordWhereInput[];
    OR?: Prisma.FriendRecordWhereInput[];
    NOT?: Prisma.FriendRecordWhereInput | Prisma.FriendRecordWhereInput[];
    id?: Prisma.UuidFilter<"FriendRecord"> | string;
    jobId?: Prisma.UuidFilter<"FriendRecord"> | string;
    vkFriendId?: Prisma.IntNullableFilter<"FriendRecord"> | number | null;
    okFriendId?: Prisma.BigIntNullableFilter<"FriendRecord"> | bigint | number | null;
    payload?: Prisma.JsonFilter<"FriendRecord">;
    createdAt?: Prisma.DateTimeFilter<"FriendRecord"> | Date | string;
    job?: Prisma.XOR<Prisma.ExportJobScalarRelationFilter, Prisma.ExportJobWhereInput>;
};
export type FriendRecordOrderByWithRelationInput = {
    id?: Prisma.SortOrder;
    jobId?: Prisma.SortOrder;
    vkFriendId?: Prisma.SortOrderInput | Prisma.SortOrder;
    okFriendId?: Prisma.SortOrderInput | Prisma.SortOrder;
    payload?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    job?: Prisma.ExportJobOrderByWithRelationInput;
};
export type FriendRecordWhereUniqueInput = Prisma.AtLeast<{
    id?: string;
    AND?: Prisma.FriendRecordWhereInput | Prisma.FriendRecordWhereInput[];
    OR?: Prisma.FriendRecordWhereInput[];
    NOT?: Prisma.FriendRecordWhereInput | Prisma.FriendRecordWhereInput[];
    jobId?: Prisma.UuidFilter<"FriendRecord"> | string;
    vkFriendId?: Prisma.IntNullableFilter<"FriendRecord"> | number | null;
    okFriendId?: Prisma.BigIntNullableFilter<"FriendRecord"> | bigint | number | null;
    payload?: Prisma.JsonFilter<"FriendRecord">;
    createdAt?: Prisma.DateTimeFilter<"FriendRecord"> | Date | string;
    job?: Prisma.XOR<Prisma.ExportJobScalarRelationFilter, Prisma.ExportJobWhereInput>;
}, "id">;
export type FriendRecordOrderByWithAggregationInput = {
    id?: Prisma.SortOrder;
    jobId?: Prisma.SortOrder;
    vkFriendId?: Prisma.SortOrderInput | Prisma.SortOrder;
    okFriendId?: Prisma.SortOrderInput | Prisma.SortOrder;
    payload?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    _count?: Prisma.FriendRecordCountOrderByAggregateInput;
    _avg?: Prisma.FriendRecordAvgOrderByAggregateInput;
    _max?: Prisma.FriendRecordMaxOrderByAggregateInput;
    _min?: Prisma.FriendRecordMinOrderByAggregateInput;
    _sum?: Prisma.FriendRecordSumOrderByAggregateInput;
};
export type FriendRecordScalarWhereWithAggregatesInput = {
    AND?: Prisma.FriendRecordScalarWhereWithAggregatesInput | Prisma.FriendRecordScalarWhereWithAggregatesInput[];
    OR?: Prisma.FriendRecordScalarWhereWithAggregatesInput[];
    NOT?: Prisma.FriendRecordScalarWhereWithAggregatesInput | Prisma.FriendRecordScalarWhereWithAggregatesInput[];
    id?: Prisma.UuidWithAggregatesFilter<"FriendRecord"> | string;
    jobId?: Prisma.UuidWithAggregatesFilter<"FriendRecord"> | string;
    vkFriendId?: Prisma.IntNullableWithAggregatesFilter<"FriendRecord"> | number | null;
    okFriendId?: Prisma.BigIntNullableWithAggregatesFilter<"FriendRecord"> | bigint | number | null;
    payload?: Prisma.JsonWithAggregatesFilter<"FriendRecord">;
    createdAt?: Prisma.DateTimeWithAggregatesFilter<"FriendRecord"> | Date | string;
};
export type FriendRecordCreateInput = {
    id?: string;
    vkFriendId?: number | null;
    okFriendId?: bigint | number | null;
    payload: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    createdAt?: Date | string;
    job: Prisma.ExportJobCreateNestedOneWithoutFriendRecordsInput;
};
export type FriendRecordUncheckedCreateInput = {
    id?: string;
    jobId: string;
    vkFriendId?: number | null;
    okFriendId?: bigint | number | null;
    payload: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    createdAt?: Date | string;
};
export type FriendRecordUpdateInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    vkFriendId?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    okFriendId?: Prisma.NullableBigIntFieldUpdateOperationsInput | bigint | number | null;
    payload?: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    job?: Prisma.ExportJobUpdateOneRequiredWithoutFriendRecordsNestedInput;
};
export type FriendRecordUncheckedUpdateInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    jobId?: Prisma.StringFieldUpdateOperationsInput | string;
    vkFriendId?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    okFriendId?: Prisma.NullableBigIntFieldUpdateOperationsInput | bigint | number | null;
    payload?: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type FriendRecordCreateManyInput = {
    id?: string;
    jobId: string;
    vkFriendId?: number | null;
    okFriendId?: bigint | number | null;
    payload: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    createdAt?: Date | string;
};
export type FriendRecordUpdateManyMutationInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    vkFriendId?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    okFriendId?: Prisma.NullableBigIntFieldUpdateOperationsInput | bigint | number | null;
    payload?: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type FriendRecordUncheckedUpdateManyInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    jobId?: Prisma.StringFieldUpdateOperationsInput | string;
    vkFriendId?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    okFriendId?: Prisma.NullableBigIntFieldUpdateOperationsInput | bigint | number | null;
    payload?: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type FriendRecordListRelationFilter = {
    every?: Prisma.FriendRecordWhereInput;
    some?: Prisma.FriendRecordWhereInput;
    none?: Prisma.FriendRecordWhereInput;
};
export type FriendRecordOrderByRelationAggregateInput = {
    _count?: Prisma.SortOrder;
};
export type FriendRecordCountOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    jobId?: Prisma.SortOrder;
    vkFriendId?: Prisma.SortOrder;
    okFriendId?: Prisma.SortOrder;
    payload?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
};
export type FriendRecordAvgOrderByAggregateInput = {
    vkFriendId?: Prisma.SortOrder;
    okFriendId?: Prisma.SortOrder;
};
export type FriendRecordMaxOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    jobId?: Prisma.SortOrder;
    vkFriendId?: Prisma.SortOrder;
    okFriendId?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
};
export type FriendRecordMinOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    jobId?: Prisma.SortOrder;
    vkFriendId?: Prisma.SortOrder;
    okFriendId?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
};
export type FriendRecordSumOrderByAggregateInput = {
    vkFriendId?: Prisma.SortOrder;
    okFriendId?: Prisma.SortOrder;
};
export type FriendRecordCreateNestedManyWithoutJobInput = {
    create?: Prisma.XOR<Prisma.FriendRecordCreateWithoutJobInput, Prisma.FriendRecordUncheckedCreateWithoutJobInput> | Prisma.FriendRecordCreateWithoutJobInput[] | Prisma.FriendRecordUncheckedCreateWithoutJobInput[];
    connectOrCreate?: Prisma.FriendRecordCreateOrConnectWithoutJobInput | Prisma.FriendRecordCreateOrConnectWithoutJobInput[];
    createMany?: Prisma.FriendRecordCreateManyJobInputEnvelope;
    connect?: Prisma.FriendRecordWhereUniqueInput | Prisma.FriendRecordWhereUniqueInput[];
};
export type FriendRecordUncheckedCreateNestedManyWithoutJobInput = {
    create?: Prisma.XOR<Prisma.FriendRecordCreateWithoutJobInput, Prisma.FriendRecordUncheckedCreateWithoutJobInput> | Prisma.FriendRecordCreateWithoutJobInput[] | Prisma.FriendRecordUncheckedCreateWithoutJobInput[];
    connectOrCreate?: Prisma.FriendRecordCreateOrConnectWithoutJobInput | Prisma.FriendRecordCreateOrConnectWithoutJobInput[];
    createMany?: Prisma.FriendRecordCreateManyJobInputEnvelope;
    connect?: Prisma.FriendRecordWhereUniqueInput | Prisma.FriendRecordWhereUniqueInput[];
};
export type FriendRecordUpdateManyWithoutJobNestedInput = {
    create?: Prisma.XOR<Prisma.FriendRecordCreateWithoutJobInput, Prisma.FriendRecordUncheckedCreateWithoutJobInput> | Prisma.FriendRecordCreateWithoutJobInput[] | Prisma.FriendRecordUncheckedCreateWithoutJobInput[];
    connectOrCreate?: Prisma.FriendRecordCreateOrConnectWithoutJobInput | Prisma.FriendRecordCreateOrConnectWithoutJobInput[];
    upsert?: Prisma.FriendRecordUpsertWithWhereUniqueWithoutJobInput | Prisma.FriendRecordUpsertWithWhereUniqueWithoutJobInput[];
    createMany?: Prisma.FriendRecordCreateManyJobInputEnvelope;
    set?: Prisma.FriendRecordWhereUniqueInput | Prisma.FriendRecordWhereUniqueInput[];
    disconnect?: Prisma.FriendRecordWhereUniqueInput | Prisma.FriendRecordWhereUniqueInput[];
    delete?: Prisma.FriendRecordWhereUniqueInput | Prisma.FriendRecordWhereUniqueInput[];
    connect?: Prisma.FriendRecordWhereUniqueInput | Prisma.FriendRecordWhereUniqueInput[];
    update?: Prisma.FriendRecordUpdateWithWhereUniqueWithoutJobInput | Prisma.FriendRecordUpdateWithWhereUniqueWithoutJobInput[];
    updateMany?: Prisma.FriendRecordUpdateManyWithWhereWithoutJobInput | Prisma.FriendRecordUpdateManyWithWhereWithoutJobInput[];
    deleteMany?: Prisma.FriendRecordScalarWhereInput | Prisma.FriendRecordScalarWhereInput[];
};
export type FriendRecordUncheckedUpdateManyWithoutJobNestedInput = {
    create?: Prisma.XOR<Prisma.FriendRecordCreateWithoutJobInput, Prisma.FriendRecordUncheckedCreateWithoutJobInput> | Prisma.FriendRecordCreateWithoutJobInput[] | Prisma.FriendRecordUncheckedCreateWithoutJobInput[];
    connectOrCreate?: Prisma.FriendRecordCreateOrConnectWithoutJobInput | Prisma.FriendRecordCreateOrConnectWithoutJobInput[];
    upsert?: Prisma.FriendRecordUpsertWithWhereUniqueWithoutJobInput | Prisma.FriendRecordUpsertWithWhereUniqueWithoutJobInput[];
    createMany?: Prisma.FriendRecordCreateManyJobInputEnvelope;
    set?: Prisma.FriendRecordWhereUniqueInput | Prisma.FriendRecordWhereUniqueInput[];
    disconnect?: Prisma.FriendRecordWhereUniqueInput | Prisma.FriendRecordWhereUniqueInput[];
    delete?: Prisma.FriendRecordWhereUniqueInput | Prisma.FriendRecordWhereUniqueInput[];
    connect?: Prisma.FriendRecordWhereUniqueInput | Prisma.FriendRecordWhereUniqueInput[];
    update?: Prisma.FriendRecordUpdateWithWhereUniqueWithoutJobInput | Prisma.FriendRecordUpdateWithWhereUniqueWithoutJobInput[];
    updateMany?: Prisma.FriendRecordUpdateManyWithWhereWithoutJobInput | Prisma.FriendRecordUpdateManyWithWhereWithoutJobInput[];
    deleteMany?: Prisma.FriendRecordScalarWhereInput | Prisma.FriendRecordScalarWhereInput[];
};
export type FriendRecordCreateWithoutJobInput = {
    id?: string;
    vkFriendId?: number | null;
    okFriendId?: bigint | number | null;
    payload: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    createdAt?: Date | string;
};
export type FriendRecordUncheckedCreateWithoutJobInput = {
    id?: string;
    vkFriendId?: number | null;
    okFriendId?: bigint | number | null;
    payload: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    createdAt?: Date | string;
};
export type FriendRecordCreateOrConnectWithoutJobInput = {
    where: Prisma.FriendRecordWhereUniqueInput;
    create: Prisma.XOR<Prisma.FriendRecordCreateWithoutJobInput, Prisma.FriendRecordUncheckedCreateWithoutJobInput>;
};
export type FriendRecordCreateManyJobInputEnvelope = {
    data: Prisma.FriendRecordCreateManyJobInput | Prisma.FriendRecordCreateManyJobInput[];
    skipDuplicates?: boolean;
};
export type FriendRecordUpsertWithWhereUniqueWithoutJobInput = {
    where: Prisma.FriendRecordWhereUniqueInput;
    update: Prisma.XOR<Prisma.FriendRecordUpdateWithoutJobInput, Prisma.FriendRecordUncheckedUpdateWithoutJobInput>;
    create: Prisma.XOR<Prisma.FriendRecordCreateWithoutJobInput, Prisma.FriendRecordUncheckedCreateWithoutJobInput>;
};
export type FriendRecordUpdateWithWhereUniqueWithoutJobInput = {
    where: Prisma.FriendRecordWhereUniqueInput;
    data: Prisma.XOR<Prisma.FriendRecordUpdateWithoutJobInput, Prisma.FriendRecordUncheckedUpdateWithoutJobInput>;
};
export type FriendRecordUpdateManyWithWhereWithoutJobInput = {
    where: Prisma.FriendRecordScalarWhereInput;
    data: Prisma.XOR<Prisma.FriendRecordUpdateManyMutationInput, Prisma.FriendRecordUncheckedUpdateManyWithoutJobInput>;
};
export type FriendRecordScalarWhereInput = {
    AND?: Prisma.FriendRecordScalarWhereInput | Prisma.FriendRecordScalarWhereInput[];
    OR?: Prisma.FriendRecordScalarWhereInput[];
    NOT?: Prisma.FriendRecordScalarWhereInput | Prisma.FriendRecordScalarWhereInput[];
    id?: Prisma.UuidFilter<"FriendRecord"> | string;
    jobId?: Prisma.UuidFilter<"FriendRecord"> | string;
    vkFriendId?: Prisma.IntNullableFilter<"FriendRecord"> | number | null;
    okFriendId?: Prisma.BigIntNullableFilter<"FriendRecord"> | bigint | number | null;
    payload?: Prisma.JsonFilter<"FriendRecord">;
    createdAt?: Prisma.DateTimeFilter<"FriendRecord"> | Date | string;
};
export type FriendRecordCreateManyJobInput = {
    id?: string;
    vkFriendId?: number | null;
    okFriendId?: bigint | number | null;
    payload: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    createdAt?: Date | string;
};
export type FriendRecordUpdateWithoutJobInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    vkFriendId?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    okFriendId?: Prisma.NullableBigIntFieldUpdateOperationsInput | bigint | number | null;
    payload?: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type FriendRecordUncheckedUpdateWithoutJobInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    vkFriendId?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    okFriendId?: Prisma.NullableBigIntFieldUpdateOperationsInput | bigint | number | null;
    payload?: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type FriendRecordUncheckedUpdateManyWithoutJobInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    vkFriendId?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    okFriendId?: Prisma.NullableBigIntFieldUpdateOperationsInput | bigint | number | null;
    payload?: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type FriendRecordSelect<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    jobId?: boolean;
    vkFriendId?: boolean;
    okFriendId?: boolean;
    payload?: boolean;
    createdAt?: boolean;
    job?: boolean | Prisma.ExportJobDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["friendRecord"]>;
export type FriendRecordSelectCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    jobId?: boolean;
    vkFriendId?: boolean;
    okFriendId?: boolean;
    payload?: boolean;
    createdAt?: boolean;
    job?: boolean | Prisma.ExportJobDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["friendRecord"]>;
export type FriendRecordSelectUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    jobId?: boolean;
    vkFriendId?: boolean;
    okFriendId?: boolean;
    payload?: boolean;
    createdAt?: boolean;
    job?: boolean | Prisma.ExportJobDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["friendRecord"]>;
export type FriendRecordSelectScalar = {
    id?: boolean;
    jobId?: boolean;
    vkFriendId?: boolean;
    okFriendId?: boolean;
    payload?: boolean;
    createdAt?: boolean;
};
export type FriendRecordOmit<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetOmit<"id" | "jobId" | "vkFriendId" | "okFriendId" | "payload" | "createdAt", ExtArgs["result"]["friendRecord"]>;
export type FriendRecordInclude<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    job?: boolean | Prisma.ExportJobDefaultArgs<ExtArgs>;
};
export type FriendRecordIncludeCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    job?: boolean | Prisma.ExportJobDefaultArgs<ExtArgs>;
};
export type FriendRecordIncludeUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    job?: boolean | Prisma.ExportJobDefaultArgs<ExtArgs>;
};
export type $FriendRecordPayload<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    name: "FriendRecord";
    objects: {
        job: Prisma.$ExportJobPayload<ExtArgs>;
    };
    scalars: runtime.Types.Extensions.GetPayloadResult<{
        id: string;
        jobId: string;
        vkFriendId: number | null;
        okFriendId: bigint | null;
        payload: runtime.JsonValue;
        createdAt: Date;
    }, ExtArgs["result"]["friendRecord"]>;
    composites: {};
};
export type FriendRecordGetPayload<S extends boolean | null | undefined | FriendRecordDefaultArgs> = runtime.Types.Result.GetResult<Prisma.$FriendRecordPayload, S>;
export type FriendRecordCountArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = Omit<FriendRecordFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
    select?: FriendRecordCountAggregateInputType | true;
};
export interface FriendRecordDelegate<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: {
        types: Prisma.TypeMap<ExtArgs>['model']['FriendRecord'];
        meta: {
            name: 'FriendRecord';
        };
    };
    findUnique<T extends FriendRecordFindUniqueArgs>(args: Prisma.SelectSubset<T, FriendRecordFindUniqueArgs<ExtArgs>>): Prisma.Prisma__FriendRecordClient<runtime.Types.Result.GetResult<Prisma.$FriendRecordPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    findUniqueOrThrow<T extends FriendRecordFindUniqueOrThrowArgs>(args: Prisma.SelectSubset<T, FriendRecordFindUniqueOrThrowArgs<ExtArgs>>): Prisma.Prisma__FriendRecordClient<runtime.Types.Result.GetResult<Prisma.$FriendRecordPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    findFirst<T extends FriendRecordFindFirstArgs>(args?: Prisma.SelectSubset<T, FriendRecordFindFirstArgs<ExtArgs>>): Prisma.Prisma__FriendRecordClient<runtime.Types.Result.GetResult<Prisma.$FriendRecordPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    findFirstOrThrow<T extends FriendRecordFindFirstOrThrowArgs>(args?: Prisma.SelectSubset<T, FriendRecordFindFirstOrThrowArgs<ExtArgs>>): Prisma.Prisma__FriendRecordClient<runtime.Types.Result.GetResult<Prisma.$FriendRecordPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    findMany<T extends FriendRecordFindManyArgs>(args?: Prisma.SelectSubset<T, FriendRecordFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$FriendRecordPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>;
    create<T extends FriendRecordCreateArgs>(args: Prisma.SelectSubset<T, FriendRecordCreateArgs<ExtArgs>>): Prisma.Prisma__FriendRecordClient<runtime.Types.Result.GetResult<Prisma.$FriendRecordPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    createMany<T extends FriendRecordCreateManyArgs>(args?: Prisma.SelectSubset<T, FriendRecordCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    createManyAndReturn<T extends FriendRecordCreateManyAndReturnArgs>(args?: Prisma.SelectSubset<T, FriendRecordCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$FriendRecordPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>;
    delete<T extends FriendRecordDeleteArgs>(args: Prisma.SelectSubset<T, FriendRecordDeleteArgs<ExtArgs>>): Prisma.Prisma__FriendRecordClient<runtime.Types.Result.GetResult<Prisma.$FriendRecordPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    update<T extends FriendRecordUpdateArgs>(args: Prisma.SelectSubset<T, FriendRecordUpdateArgs<ExtArgs>>): Prisma.Prisma__FriendRecordClient<runtime.Types.Result.GetResult<Prisma.$FriendRecordPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    deleteMany<T extends FriendRecordDeleteManyArgs>(args?: Prisma.SelectSubset<T, FriendRecordDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    updateMany<T extends FriendRecordUpdateManyArgs>(args: Prisma.SelectSubset<T, FriendRecordUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    updateManyAndReturn<T extends FriendRecordUpdateManyAndReturnArgs>(args: Prisma.SelectSubset<T, FriendRecordUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$FriendRecordPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>;
    upsert<T extends FriendRecordUpsertArgs>(args: Prisma.SelectSubset<T, FriendRecordUpsertArgs<ExtArgs>>): Prisma.Prisma__FriendRecordClient<runtime.Types.Result.GetResult<Prisma.$FriendRecordPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    count<T extends FriendRecordCountArgs>(args?: Prisma.Subset<T, FriendRecordCountArgs>): Prisma.PrismaPromise<T extends runtime.Types.Utils.Record<'select', any> ? T['select'] extends true ? number : Prisma.GetScalarType<T['select'], FriendRecordCountAggregateOutputType> : number>;
    aggregate<T extends FriendRecordAggregateArgs>(args: Prisma.Subset<T, FriendRecordAggregateArgs>): Prisma.PrismaPromise<GetFriendRecordAggregateType<T>>;
    groupBy<T extends FriendRecordGroupByArgs, HasSelectOrTake extends Prisma.Or<Prisma.Extends<'skip', Prisma.Keys<T>>, Prisma.Extends<'take', Prisma.Keys<T>>>, OrderByArg extends Prisma.True extends HasSelectOrTake ? {
        orderBy: FriendRecordGroupByArgs['orderBy'];
    } : {
        orderBy?: FriendRecordGroupByArgs['orderBy'];
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
    }[OrderFields]>(args: Prisma.SubsetIntersection<T, FriendRecordGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetFriendRecordGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>;
    readonly fields: FriendRecordFieldRefs;
}
export interface Prisma__FriendRecordClient<T, Null = never, ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise";
    job<T extends Prisma.ExportJobDefaultArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.ExportJobDefaultArgs<ExtArgs>>): Prisma.Prisma__ExportJobClient<runtime.Types.Result.GetResult<Prisma.$ExportJobPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>;
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): runtime.Types.Utils.JsPromise<TResult1 | TResult2>;
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): runtime.Types.Utils.JsPromise<T | TResult>;
    finally(onfinally?: (() => void) | undefined | null): runtime.Types.Utils.JsPromise<T>;
}
export interface FriendRecordFieldRefs {
    readonly id: Prisma.FieldRef<"FriendRecord", 'String'>;
    readonly jobId: Prisma.FieldRef<"FriendRecord", 'String'>;
    readonly vkFriendId: Prisma.FieldRef<"FriendRecord", 'Int'>;
    readonly okFriendId: Prisma.FieldRef<"FriendRecord", 'BigInt'>;
    readonly payload: Prisma.FieldRef<"FriendRecord", 'Json'>;
    readonly createdAt: Prisma.FieldRef<"FriendRecord", 'DateTime'>;
}
export type FriendRecordFindUniqueArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.FriendRecordSelect<ExtArgs> | null;
    omit?: Prisma.FriendRecordOmit<ExtArgs> | null;
    include?: Prisma.FriendRecordInclude<ExtArgs> | null;
    where: Prisma.FriendRecordWhereUniqueInput;
};
export type FriendRecordFindUniqueOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.FriendRecordSelect<ExtArgs> | null;
    omit?: Prisma.FriendRecordOmit<ExtArgs> | null;
    include?: Prisma.FriendRecordInclude<ExtArgs> | null;
    where: Prisma.FriendRecordWhereUniqueInput;
};
export type FriendRecordFindFirstArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.FriendRecordSelect<ExtArgs> | null;
    omit?: Prisma.FriendRecordOmit<ExtArgs> | null;
    include?: Prisma.FriendRecordInclude<ExtArgs> | null;
    where?: Prisma.FriendRecordWhereInput;
    orderBy?: Prisma.FriendRecordOrderByWithRelationInput | Prisma.FriendRecordOrderByWithRelationInput[];
    cursor?: Prisma.FriendRecordWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.FriendRecordScalarFieldEnum | Prisma.FriendRecordScalarFieldEnum[];
};
export type FriendRecordFindFirstOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.FriendRecordSelect<ExtArgs> | null;
    omit?: Prisma.FriendRecordOmit<ExtArgs> | null;
    include?: Prisma.FriendRecordInclude<ExtArgs> | null;
    where?: Prisma.FriendRecordWhereInput;
    orderBy?: Prisma.FriendRecordOrderByWithRelationInput | Prisma.FriendRecordOrderByWithRelationInput[];
    cursor?: Prisma.FriendRecordWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.FriendRecordScalarFieldEnum | Prisma.FriendRecordScalarFieldEnum[];
};
export type FriendRecordFindManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.FriendRecordSelect<ExtArgs> | null;
    omit?: Prisma.FriendRecordOmit<ExtArgs> | null;
    include?: Prisma.FriendRecordInclude<ExtArgs> | null;
    where?: Prisma.FriendRecordWhereInput;
    orderBy?: Prisma.FriendRecordOrderByWithRelationInput | Prisma.FriendRecordOrderByWithRelationInput[];
    cursor?: Prisma.FriendRecordWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.FriendRecordScalarFieldEnum | Prisma.FriendRecordScalarFieldEnum[];
};
export type FriendRecordCreateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.FriendRecordSelect<ExtArgs> | null;
    omit?: Prisma.FriendRecordOmit<ExtArgs> | null;
    include?: Prisma.FriendRecordInclude<ExtArgs> | null;
    data: Prisma.XOR<Prisma.FriendRecordCreateInput, Prisma.FriendRecordUncheckedCreateInput>;
};
export type FriendRecordCreateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    data: Prisma.FriendRecordCreateManyInput | Prisma.FriendRecordCreateManyInput[];
    skipDuplicates?: boolean;
};
export type FriendRecordCreateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.FriendRecordSelectCreateManyAndReturn<ExtArgs> | null;
    omit?: Prisma.FriendRecordOmit<ExtArgs> | null;
    data: Prisma.FriendRecordCreateManyInput | Prisma.FriendRecordCreateManyInput[];
    skipDuplicates?: boolean;
    include?: Prisma.FriendRecordIncludeCreateManyAndReturn<ExtArgs> | null;
};
export type FriendRecordUpdateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.FriendRecordSelect<ExtArgs> | null;
    omit?: Prisma.FriendRecordOmit<ExtArgs> | null;
    include?: Prisma.FriendRecordInclude<ExtArgs> | null;
    data: Prisma.XOR<Prisma.FriendRecordUpdateInput, Prisma.FriendRecordUncheckedUpdateInput>;
    where: Prisma.FriendRecordWhereUniqueInput;
};
export type FriendRecordUpdateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    data: Prisma.XOR<Prisma.FriendRecordUpdateManyMutationInput, Prisma.FriendRecordUncheckedUpdateManyInput>;
    where?: Prisma.FriendRecordWhereInput;
    limit?: number;
};
export type FriendRecordUpdateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.FriendRecordSelectUpdateManyAndReturn<ExtArgs> | null;
    omit?: Prisma.FriendRecordOmit<ExtArgs> | null;
    data: Prisma.XOR<Prisma.FriendRecordUpdateManyMutationInput, Prisma.FriendRecordUncheckedUpdateManyInput>;
    where?: Prisma.FriendRecordWhereInput;
    limit?: number;
    include?: Prisma.FriendRecordIncludeUpdateManyAndReturn<ExtArgs> | null;
};
export type FriendRecordUpsertArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.FriendRecordSelect<ExtArgs> | null;
    omit?: Prisma.FriendRecordOmit<ExtArgs> | null;
    include?: Prisma.FriendRecordInclude<ExtArgs> | null;
    where: Prisma.FriendRecordWhereUniqueInput;
    create: Prisma.XOR<Prisma.FriendRecordCreateInput, Prisma.FriendRecordUncheckedCreateInput>;
    update: Prisma.XOR<Prisma.FriendRecordUpdateInput, Prisma.FriendRecordUncheckedUpdateInput>;
};
export type FriendRecordDeleteArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.FriendRecordSelect<ExtArgs> | null;
    omit?: Prisma.FriendRecordOmit<ExtArgs> | null;
    include?: Prisma.FriendRecordInclude<ExtArgs> | null;
    where: Prisma.FriendRecordWhereUniqueInput;
};
export type FriendRecordDeleteManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.FriendRecordWhereInput;
    limit?: number;
};
export type FriendRecordDefaultArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.FriendRecordSelect<ExtArgs> | null;
    omit?: Prisma.FriendRecordOmit<ExtArgs> | null;
    include?: Prisma.FriendRecordInclude<ExtArgs> | null;
};
export {};
