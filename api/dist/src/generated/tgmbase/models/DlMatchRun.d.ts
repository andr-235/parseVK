import type * as runtime from "@prisma/client/runtime/client";
import type * as Prisma from "../internal/prismaNamespace.js";
export type DlMatchRunModel = runtime.Types.Result.DefaultSelection<Prisma.$DlMatchRunPayload>;
export type AggregateDlMatchRun = {
    _count: DlMatchRunCountAggregateOutputType | null;
    _avg: DlMatchRunAvgAggregateOutputType | null;
    _sum: DlMatchRunSumAggregateOutputType | null;
    _min: DlMatchRunMinAggregateOutputType | null;
    _max: DlMatchRunMaxAggregateOutputType | null;
};
export type DlMatchRunAvgAggregateOutputType = {
    id: number | null;
    contactsTotal: number | null;
    matchesTotal: number | null;
    strictMatchesTotal: number | null;
    usernameMatchesTotal: number | null;
    phoneMatchesTotal: number | null;
};
export type DlMatchRunSumAggregateOutputType = {
    id: bigint | null;
    contactsTotal: number | null;
    matchesTotal: number | null;
    strictMatchesTotal: number | null;
    usernameMatchesTotal: number | null;
    phoneMatchesTotal: number | null;
};
export type DlMatchRunMinAggregateOutputType = {
    id: bigint | null;
    status: string | null;
    contactsTotal: number | null;
    matchesTotal: number | null;
    strictMatchesTotal: number | null;
    usernameMatchesTotal: number | null;
    phoneMatchesTotal: number | null;
    createdAt: Date | null;
    finishedAt: Date | null;
    error: string | null;
};
export type DlMatchRunMaxAggregateOutputType = {
    id: bigint | null;
    status: string | null;
    contactsTotal: number | null;
    matchesTotal: number | null;
    strictMatchesTotal: number | null;
    usernameMatchesTotal: number | null;
    phoneMatchesTotal: number | null;
    createdAt: Date | null;
    finishedAt: Date | null;
    error: string | null;
};
export type DlMatchRunCountAggregateOutputType = {
    id: number;
    status: number;
    contactsTotal: number;
    matchesTotal: number;
    strictMatchesTotal: number;
    usernameMatchesTotal: number;
    phoneMatchesTotal: number;
    createdAt: number;
    finishedAt: number;
    error: number;
    _all: number;
};
export type DlMatchRunAvgAggregateInputType = {
    id?: true;
    contactsTotal?: true;
    matchesTotal?: true;
    strictMatchesTotal?: true;
    usernameMatchesTotal?: true;
    phoneMatchesTotal?: true;
};
export type DlMatchRunSumAggregateInputType = {
    id?: true;
    contactsTotal?: true;
    matchesTotal?: true;
    strictMatchesTotal?: true;
    usernameMatchesTotal?: true;
    phoneMatchesTotal?: true;
};
export type DlMatchRunMinAggregateInputType = {
    id?: true;
    status?: true;
    contactsTotal?: true;
    matchesTotal?: true;
    strictMatchesTotal?: true;
    usernameMatchesTotal?: true;
    phoneMatchesTotal?: true;
    createdAt?: true;
    finishedAt?: true;
    error?: true;
};
export type DlMatchRunMaxAggregateInputType = {
    id?: true;
    status?: true;
    contactsTotal?: true;
    matchesTotal?: true;
    strictMatchesTotal?: true;
    usernameMatchesTotal?: true;
    phoneMatchesTotal?: true;
    createdAt?: true;
    finishedAt?: true;
    error?: true;
};
export type DlMatchRunCountAggregateInputType = {
    id?: true;
    status?: true;
    contactsTotal?: true;
    matchesTotal?: true;
    strictMatchesTotal?: true;
    usernameMatchesTotal?: true;
    phoneMatchesTotal?: true;
    createdAt?: true;
    finishedAt?: true;
    error?: true;
    _all?: true;
};
export type DlMatchRunAggregateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.DlMatchRunWhereInput;
    orderBy?: Prisma.DlMatchRunOrderByWithRelationInput | Prisma.DlMatchRunOrderByWithRelationInput[];
    cursor?: Prisma.DlMatchRunWhereUniqueInput;
    take?: number;
    skip?: number;
    _count?: true | DlMatchRunCountAggregateInputType;
    _avg?: DlMatchRunAvgAggregateInputType;
    _sum?: DlMatchRunSumAggregateInputType;
    _min?: DlMatchRunMinAggregateInputType;
    _max?: DlMatchRunMaxAggregateInputType;
};
export type GetDlMatchRunAggregateType<T extends DlMatchRunAggregateArgs> = {
    [P in keyof T & keyof AggregateDlMatchRun]: P extends '_count' | 'count' ? T[P] extends true ? number : Prisma.GetScalarType<T[P], AggregateDlMatchRun[P]> : Prisma.GetScalarType<T[P], AggregateDlMatchRun[P]>;
};
export type DlMatchRunGroupByArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.DlMatchRunWhereInput;
    orderBy?: Prisma.DlMatchRunOrderByWithAggregationInput | Prisma.DlMatchRunOrderByWithAggregationInput[];
    by: Prisma.DlMatchRunScalarFieldEnum[] | Prisma.DlMatchRunScalarFieldEnum;
    having?: Prisma.DlMatchRunScalarWhereWithAggregatesInput;
    take?: number;
    skip?: number;
    _count?: DlMatchRunCountAggregateInputType | true;
    _avg?: DlMatchRunAvgAggregateInputType;
    _sum?: DlMatchRunSumAggregateInputType;
    _min?: DlMatchRunMinAggregateInputType;
    _max?: DlMatchRunMaxAggregateInputType;
};
export type DlMatchRunGroupByOutputType = {
    id: bigint;
    status: string;
    contactsTotal: number;
    matchesTotal: number;
    strictMatchesTotal: number;
    usernameMatchesTotal: number;
    phoneMatchesTotal: number;
    createdAt: Date;
    finishedAt: Date | null;
    error: string | null;
    _count: DlMatchRunCountAggregateOutputType | null;
    _avg: DlMatchRunAvgAggregateOutputType | null;
    _sum: DlMatchRunSumAggregateOutputType | null;
    _min: DlMatchRunMinAggregateOutputType | null;
    _max: DlMatchRunMaxAggregateOutputType | null;
};
type GetDlMatchRunGroupByPayload<T extends DlMatchRunGroupByArgs> = Prisma.PrismaPromise<Array<Prisma.PickEnumerable<DlMatchRunGroupByOutputType, T['by']> & {
    [P in ((keyof T) & (keyof DlMatchRunGroupByOutputType))]: P extends '_count' ? T[P] extends boolean ? number : Prisma.GetScalarType<T[P], DlMatchRunGroupByOutputType[P]> : Prisma.GetScalarType<T[P], DlMatchRunGroupByOutputType[P]>;
}>>;
export type DlMatchRunWhereInput = {
    AND?: Prisma.DlMatchRunWhereInput | Prisma.DlMatchRunWhereInput[];
    OR?: Prisma.DlMatchRunWhereInput[];
    NOT?: Prisma.DlMatchRunWhereInput | Prisma.DlMatchRunWhereInput[];
    id?: Prisma.BigIntFilter<"DlMatchRun"> | bigint | number;
    status?: Prisma.StringFilter<"DlMatchRun"> | string;
    contactsTotal?: Prisma.IntFilter<"DlMatchRun"> | number;
    matchesTotal?: Prisma.IntFilter<"DlMatchRun"> | number;
    strictMatchesTotal?: Prisma.IntFilter<"DlMatchRun"> | number;
    usernameMatchesTotal?: Prisma.IntFilter<"DlMatchRun"> | number;
    phoneMatchesTotal?: Prisma.IntFilter<"DlMatchRun"> | number;
    createdAt?: Prisma.DateTimeFilter<"DlMatchRun"> | Date | string;
    finishedAt?: Prisma.DateTimeNullableFilter<"DlMatchRun"> | Date | string | null;
    error?: Prisma.StringNullableFilter<"DlMatchRun"> | string | null;
    results?: Prisma.DlMatchResultListRelationFilter;
};
export type DlMatchRunOrderByWithRelationInput = {
    id?: Prisma.SortOrder;
    status?: Prisma.SortOrder;
    contactsTotal?: Prisma.SortOrder;
    matchesTotal?: Prisma.SortOrder;
    strictMatchesTotal?: Prisma.SortOrder;
    usernameMatchesTotal?: Prisma.SortOrder;
    phoneMatchesTotal?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    finishedAt?: Prisma.SortOrderInput | Prisma.SortOrder;
    error?: Prisma.SortOrderInput | Prisma.SortOrder;
    results?: Prisma.DlMatchResultOrderByRelationAggregateInput;
};
export type DlMatchRunWhereUniqueInput = Prisma.AtLeast<{
    id?: bigint | number;
    AND?: Prisma.DlMatchRunWhereInput | Prisma.DlMatchRunWhereInput[];
    OR?: Prisma.DlMatchRunWhereInput[];
    NOT?: Prisma.DlMatchRunWhereInput | Prisma.DlMatchRunWhereInput[];
    status?: Prisma.StringFilter<"DlMatchRun"> | string;
    contactsTotal?: Prisma.IntFilter<"DlMatchRun"> | number;
    matchesTotal?: Prisma.IntFilter<"DlMatchRun"> | number;
    strictMatchesTotal?: Prisma.IntFilter<"DlMatchRun"> | number;
    usernameMatchesTotal?: Prisma.IntFilter<"DlMatchRun"> | number;
    phoneMatchesTotal?: Prisma.IntFilter<"DlMatchRun"> | number;
    createdAt?: Prisma.DateTimeFilter<"DlMatchRun"> | Date | string;
    finishedAt?: Prisma.DateTimeNullableFilter<"DlMatchRun"> | Date | string | null;
    error?: Prisma.StringNullableFilter<"DlMatchRun"> | string | null;
    results?: Prisma.DlMatchResultListRelationFilter;
}, "id">;
export type DlMatchRunOrderByWithAggregationInput = {
    id?: Prisma.SortOrder;
    status?: Prisma.SortOrder;
    contactsTotal?: Prisma.SortOrder;
    matchesTotal?: Prisma.SortOrder;
    strictMatchesTotal?: Prisma.SortOrder;
    usernameMatchesTotal?: Prisma.SortOrder;
    phoneMatchesTotal?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    finishedAt?: Prisma.SortOrderInput | Prisma.SortOrder;
    error?: Prisma.SortOrderInput | Prisma.SortOrder;
    _count?: Prisma.DlMatchRunCountOrderByAggregateInput;
    _avg?: Prisma.DlMatchRunAvgOrderByAggregateInput;
    _max?: Prisma.DlMatchRunMaxOrderByAggregateInput;
    _min?: Prisma.DlMatchRunMinOrderByAggregateInput;
    _sum?: Prisma.DlMatchRunSumOrderByAggregateInput;
};
export type DlMatchRunScalarWhereWithAggregatesInput = {
    AND?: Prisma.DlMatchRunScalarWhereWithAggregatesInput | Prisma.DlMatchRunScalarWhereWithAggregatesInput[];
    OR?: Prisma.DlMatchRunScalarWhereWithAggregatesInput[];
    NOT?: Prisma.DlMatchRunScalarWhereWithAggregatesInput | Prisma.DlMatchRunScalarWhereWithAggregatesInput[];
    id?: Prisma.BigIntWithAggregatesFilter<"DlMatchRun"> | bigint | number;
    status?: Prisma.StringWithAggregatesFilter<"DlMatchRun"> | string;
    contactsTotal?: Prisma.IntWithAggregatesFilter<"DlMatchRun"> | number;
    matchesTotal?: Prisma.IntWithAggregatesFilter<"DlMatchRun"> | number;
    strictMatchesTotal?: Prisma.IntWithAggregatesFilter<"DlMatchRun"> | number;
    usernameMatchesTotal?: Prisma.IntWithAggregatesFilter<"DlMatchRun"> | number;
    phoneMatchesTotal?: Prisma.IntWithAggregatesFilter<"DlMatchRun"> | number;
    createdAt?: Prisma.DateTimeWithAggregatesFilter<"DlMatchRun"> | Date | string;
    finishedAt?: Prisma.DateTimeNullableWithAggregatesFilter<"DlMatchRun"> | Date | string | null;
    error?: Prisma.StringNullableWithAggregatesFilter<"DlMatchRun"> | string | null;
};
export type DlMatchRunCreateInput = {
    id?: bigint | number;
    status: string;
    contactsTotal?: number;
    matchesTotal?: number;
    strictMatchesTotal?: number;
    usernameMatchesTotal?: number;
    phoneMatchesTotal?: number;
    createdAt?: Date | string;
    finishedAt?: Date | string | null;
    error?: string | null;
    results?: Prisma.DlMatchResultCreateNestedManyWithoutRunInput;
};
export type DlMatchRunUncheckedCreateInput = {
    id?: bigint | number;
    status: string;
    contactsTotal?: number;
    matchesTotal?: number;
    strictMatchesTotal?: number;
    usernameMatchesTotal?: number;
    phoneMatchesTotal?: number;
    createdAt?: Date | string;
    finishedAt?: Date | string | null;
    error?: string | null;
    results?: Prisma.DlMatchResultUncheckedCreateNestedManyWithoutRunInput;
};
export type DlMatchRunUpdateInput = {
    id?: Prisma.BigIntFieldUpdateOperationsInput | bigint | number;
    status?: Prisma.StringFieldUpdateOperationsInput | string;
    contactsTotal?: Prisma.IntFieldUpdateOperationsInput | number;
    matchesTotal?: Prisma.IntFieldUpdateOperationsInput | number;
    strictMatchesTotal?: Prisma.IntFieldUpdateOperationsInput | number;
    usernameMatchesTotal?: Prisma.IntFieldUpdateOperationsInput | number;
    phoneMatchesTotal?: Prisma.IntFieldUpdateOperationsInput | number;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    finishedAt?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    error?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    results?: Prisma.DlMatchResultUpdateManyWithoutRunNestedInput;
};
export type DlMatchRunUncheckedUpdateInput = {
    id?: Prisma.BigIntFieldUpdateOperationsInput | bigint | number;
    status?: Prisma.StringFieldUpdateOperationsInput | string;
    contactsTotal?: Prisma.IntFieldUpdateOperationsInput | number;
    matchesTotal?: Prisma.IntFieldUpdateOperationsInput | number;
    strictMatchesTotal?: Prisma.IntFieldUpdateOperationsInput | number;
    usernameMatchesTotal?: Prisma.IntFieldUpdateOperationsInput | number;
    phoneMatchesTotal?: Prisma.IntFieldUpdateOperationsInput | number;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    finishedAt?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    error?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    results?: Prisma.DlMatchResultUncheckedUpdateManyWithoutRunNestedInput;
};
export type DlMatchRunCreateManyInput = {
    id?: bigint | number;
    status: string;
    contactsTotal?: number;
    matchesTotal?: number;
    strictMatchesTotal?: number;
    usernameMatchesTotal?: number;
    phoneMatchesTotal?: number;
    createdAt?: Date | string;
    finishedAt?: Date | string | null;
    error?: string | null;
};
export type DlMatchRunUpdateManyMutationInput = {
    id?: Prisma.BigIntFieldUpdateOperationsInput | bigint | number;
    status?: Prisma.StringFieldUpdateOperationsInput | string;
    contactsTotal?: Prisma.IntFieldUpdateOperationsInput | number;
    matchesTotal?: Prisma.IntFieldUpdateOperationsInput | number;
    strictMatchesTotal?: Prisma.IntFieldUpdateOperationsInput | number;
    usernameMatchesTotal?: Prisma.IntFieldUpdateOperationsInput | number;
    phoneMatchesTotal?: Prisma.IntFieldUpdateOperationsInput | number;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    finishedAt?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    error?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
};
export type DlMatchRunUncheckedUpdateManyInput = {
    id?: Prisma.BigIntFieldUpdateOperationsInput | bigint | number;
    status?: Prisma.StringFieldUpdateOperationsInput | string;
    contactsTotal?: Prisma.IntFieldUpdateOperationsInput | number;
    matchesTotal?: Prisma.IntFieldUpdateOperationsInput | number;
    strictMatchesTotal?: Prisma.IntFieldUpdateOperationsInput | number;
    usernameMatchesTotal?: Prisma.IntFieldUpdateOperationsInput | number;
    phoneMatchesTotal?: Prisma.IntFieldUpdateOperationsInput | number;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    finishedAt?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    error?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
};
export type DlMatchRunCountOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    status?: Prisma.SortOrder;
    contactsTotal?: Prisma.SortOrder;
    matchesTotal?: Prisma.SortOrder;
    strictMatchesTotal?: Prisma.SortOrder;
    usernameMatchesTotal?: Prisma.SortOrder;
    phoneMatchesTotal?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    finishedAt?: Prisma.SortOrder;
    error?: Prisma.SortOrder;
};
export type DlMatchRunAvgOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    contactsTotal?: Prisma.SortOrder;
    matchesTotal?: Prisma.SortOrder;
    strictMatchesTotal?: Prisma.SortOrder;
    usernameMatchesTotal?: Prisma.SortOrder;
    phoneMatchesTotal?: Prisma.SortOrder;
};
export type DlMatchRunMaxOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    status?: Prisma.SortOrder;
    contactsTotal?: Prisma.SortOrder;
    matchesTotal?: Prisma.SortOrder;
    strictMatchesTotal?: Prisma.SortOrder;
    usernameMatchesTotal?: Prisma.SortOrder;
    phoneMatchesTotal?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    finishedAt?: Prisma.SortOrder;
    error?: Prisma.SortOrder;
};
export type DlMatchRunMinOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    status?: Prisma.SortOrder;
    contactsTotal?: Prisma.SortOrder;
    matchesTotal?: Prisma.SortOrder;
    strictMatchesTotal?: Prisma.SortOrder;
    usernameMatchesTotal?: Prisma.SortOrder;
    phoneMatchesTotal?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    finishedAt?: Prisma.SortOrder;
    error?: Prisma.SortOrder;
};
export type DlMatchRunSumOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    contactsTotal?: Prisma.SortOrder;
    matchesTotal?: Prisma.SortOrder;
    strictMatchesTotal?: Prisma.SortOrder;
    usernameMatchesTotal?: Prisma.SortOrder;
    phoneMatchesTotal?: Prisma.SortOrder;
};
export type DlMatchRunScalarRelationFilter = {
    is?: Prisma.DlMatchRunWhereInput;
    isNot?: Prisma.DlMatchRunWhereInput;
};
export type DlMatchRunCreateNestedOneWithoutResultsInput = {
    create?: Prisma.XOR<Prisma.DlMatchRunCreateWithoutResultsInput, Prisma.DlMatchRunUncheckedCreateWithoutResultsInput>;
    connectOrCreate?: Prisma.DlMatchRunCreateOrConnectWithoutResultsInput;
    connect?: Prisma.DlMatchRunWhereUniqueInput;
};
export type DlMatchRunUpdateOneRequiredWithoutResultsNestedInput = {
    create?: Prisma.XOR<Prisma.DlMatchRunCreateWithoutResultsInput, Prisma.DlMatchRunUncheckedCreateWithoutResultsInput>;
    connectOrCreate?: Prisma.DlMatchRunCreateOrConnectWithoutResultsInput;
    upsert?: Prisma.DlMatchRunUpsertWithoutResultsInput;
    connect?: Prisma.DlMatchRunWhereUniqueInput;
    update?: Prisma.XOR<Prisma.XOR<Prisma.DlMatchRunUpdateToOneWithWhereWithoutResultsInput, Prisma.DlMatchRunUpdateWithoutResultsInput>, Prisma.DlMatchRunUncheckedUpdateWithoutResultsInput>;
};
export type DlMatchRunCreateWithoutResultsInput = {
    id?: bigint | number;
    status: string;
    contactsTotal?: number;
    matchesTotal?: number;
    strictMatchesTotal?: number;
    usernameMatchesTotal?: number;
    phoneMatchesTotal?: number;
    createdAt?: Date | string;
    finishedAt?: Date | string | null;
    error?: string | null;
};
export type DlMatchRunUncheckedCreateWithoutResultsInput = {
    id?: bigint | number;
    status: string;
    contactsTotal?: number;
    matchesTotal?: number;
    strictMatchesTotal?: number;
    usernameMatchesTotal?: number;
    phoneMatchesTotal?: number;
    createdAt?: Date | string;
    finishedAt?: Date | string | null;
    error?: string | null;
};
export type DlMatchRunCreateOrConnectWithoutResultsInput = {
    where: Prisma.DlMatchRunWhereUniqueInput;
    create: Prisma.XOR<Prisma.DlMatchRunCreateWithoutResultsInput, Prisma.DlMatchRunUncheckedCreateWithoutResultsInput>;
};
export type DlMatchRunUpsertWithoutResultsInput = {
    update: Prisma.XOR<Prisma.DlMatchRunUpdateWithoutResultsInput, Prisma.DlMatchRunUncheckedUpdateWithoutResultsInput>;
    create: Prisma.XOR<Prisma.DlMatchRunCreateWithoutResultsInput, Prisma.DlMatchRunUncheckedCreateWithoutResultsInput>;
    where?: Prisma.DlMatchRunWhereInput;
};
export type DlMatchRunUpdateToOneWithWhereWithoutResultsInput = {
    where?: Prisma.DlMatchRunWhereInput;
    data: Prisma.XOR<Prisma.DlMatchRunUpdateWithoutResultsInput, Prisma.DlMatchRunUncheckedUpdateWithoutResultsInput>;
};
export type DlMatchRunUpdateWithoutResultsInput = {
    id?: Prisma.BigIntFieldUpdateOperationsInput | bigint | number;
    status?: Prisma.StringFieldUpdateOperationsInput | string;
    contactsTotal?: Prisma.IntFieldUpdateOperationsInput | number;
    matchesTotal?: Prisma.IntFieldUpdateOperationsInput | number;
    strictMatchesTotal?: Prisma.IntFieldUpdateOperationsInput | number;
    usernameMatchesTotal?: Prisma.IntFieldUpdateOperationsInput | number;
    phoneMatchesTotal?: Prisma.IntFieldUpdateOperationsInput | number;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    finishedAt?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    error?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
};
export type DlMatchRunUncheckedUpdateWithoutResultsInput = {
    id?: Prisma.BigIntFieldUpdateOperationsInput | bigint | number;
    status?: Prisma.StringFieldUpdateOperationsInput | string;
    contactsTotal?: Prisma.IntFieldUpdateOperationsInput | number;
    matchesTotal?: Prisma.IntFieldUpdateOperationsInput | number;
    strictMatchesTotal?: Prisma.IntFieldUpdateOperationsInput | number;
    usernameMatchesTotal?: Prisma.IntFieldUpdateOperationsInput | number;
    phoneMatchesTotal?: Prisma.IntFieldUpdateOperationsInput | number;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    finishedAt?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    error?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
};
export type DlMatchRunCountOutputType = {
    results: number;
};
export type DlMatchRunCountOutputTypeSelect<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    results?: boolean | DlMatchRunCountOutputTypeCountResultsArgs;
};
export type DlMatchRunCountOutputTypeDefaultArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.DlMatchRunCountOutputTypeSelect<ExtArgs> | null;
};
export type DlMatchRunCountOutputTypeCountResultsArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.DlMatchResultWhereInput;
};
export type DlMatchRunSelect<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    status?: boolean;
    contactsTotal?: boolean;
    matchesTotal?: boolean;
    strictMatchesTotal?: boolean;
    usernameMatchesTotal?: boolean;
    phoneMatchesTotal?: boolean;
    createdAt?: boolean;
    finishedAt?: boolean;
    error?: boolean;
    results?: boolean | Prisma.DlMatchRun$resultsArgs<ExtArgs>;
    _count?: boolean | Prisma.DlMatchRunCountOutputTypeDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["dlMatchRun"]>;
export type DlMatchRunSelectCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    status?: boolean;
    contactsTotal?: boolean;
    matchesTotal?: boolean;
    strictMatchesTotal?: boolean;
    usernameMatchesTotal?: boolean;
    phoneMatchesTotal?: boolean;
    createdAt?: boolean;
    finishedAt?: boolean;
    error?: boolean;
}, ExtArgs["result"]["dlMatchRun"]>;
export type DlMatchRunSelectUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    status?: boolean;
    contactsTotal?: boolean;
    matchesTotal?: boolean;
    strictMatchesTotal?: boolean;
    usernameMatchesTotal?: boolean;
    phoneMatchesTotal?: boolean;
    createdAt?: boolean;
    finishedAt?: boolean;
    error?: boolean;
}, ExtArgs["result"]["dlMatchRun"]>;
export type DlMatchRunSelectScalar = {
    id?: boolean;
    status?: boolean;
    contactsTotal?: boolean;
    matchesTotal?: boolean;
    strictMatchesTotal?: boolean;
    usernameMatchesTotal?: boolean;
    phoneMatchesTotal?: boolean;
    createdAt?: boolean;
    finishedAt?: boolean;
    error?: boolean;
};
export type DlMatchRunOmit<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetOmit<"id" | "status" | "contactsTotal" | "matchesTotal" | "strictMatchesTotal" | "usernameMatchesTotal" | "phoneMatchesTotal" | "createdAt" | "finishedAt" | "error", ExtArgs["result"]["dlMatchRun"]>;
export type DlMatchRunInclude<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    results?: boolean | Prisma.DlMatchRun$resultsArgs<ExtArgs>;
    _count?: boolean | Prisma.DlMatchRunCountOutputTypeDefaultArgs<ExtArgs>;
};
export type DlMatchRunIncludeCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {};
export type DlMatchRunIncludeUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {};
export type $DlMatchRunPayload<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    name: "DlMatchRun";
    objects: {
        results: Prisma.$DlMatchResultPayload<ExtArgs>[];
    };
    scalars: runtime.Types.Extensions.GetPayloadResult<{
        id: bigint;
        status: string;
        contactsTotal: number;
        matchesTotal: number;
        strictMatchesTotal: number;
        usernameMatchesTotal: number;
        phoneMatchesTotal: number;
        createdAt: Date;
        finishedAt: Date | null;
        error: string | null;
    }, ExtArgs["result"]["dlMatchRun"]>;
    composites: {};
};
export type DlMatchRunGetPayload<S extends boolean | null | undefined | DlMatchRunDefaultArgs> = runtime.Types.Result.GetResult<Prisma.$DlMatchRunPayload, S>;
export type DlMatchRunCountArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = Omit<DlMatchRunFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
    select?: DlMatchRunCountAggregateInputType | true;
};
export interface DlMatchRunDelegate<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: {
        types: Prisma.TypeMap<ExtArgs>['model']['DlMatchRun'];
        meta: {
            name: 'DlMatchRun';
        };
    };
    findUnique<T extends DlMatchRunFindUniqueArgs>(args: Prisma.SelectSubset<T, DlMatchRunFindUniqueArgs<ExtArgs>>): Prisma.Prisma__DlMatchRunClient<runtime.Types.Result.GetResult<Prisma.$DlMatchRunPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    findUniqueOrThrow<T extends DlMatchRunFindUniqueOrThrowArgs>(args: Prisma.SelectSubset<T, DlMatchRunFindUniqueOrThrowArgs<ExtArgs>>): Prisma.Prisma__DlMatchRunClient<runtime.Types.Result.GetResult<Prisma.$DlMatchRunPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    findFirst<T extends DlMatchRunFindFirstArgs>(args?: Prisma.SelectSubset<T, DlMatchRunFindFirstArgs<ExtArgs>>): Prisma.Prisma__DlMatchRunClient<runtime.Types.Result.GetResult<Prisma.$DlMatchRunPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    findFirstOrThrow<T extends DlMatchRunFindFirstOrThrowArgs>(args?: Prisma.SelectSubset<T, DlMatchRunFindFirstOrThrowArgs<ExtArgs>>): Prisma.Prisma__DlMatchRunClient<runtime.Types.Result.GetResult<Prisma.$DlMatchRunPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    findMany<T extends DlMatchRunFindManyArgs>(args?: Prisma.SelectSubset<T, DlMatchRunFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$DlMatchRunPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>;
    create<T extends DlMatchRunCreateArgs>(args: Prisma.SelectSubset<T, DlMatchRunCreateArgs<ExtArgs>>): Prisma.Prisma__DlMatchRunClient<runtime.Types.Result.GetResult<Prisma.$DlMatchRunPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    createMany<T extends DlMatchRunCreateManyArgs>(args?: Prisma.SelectSubset<T, DlMatchRunCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    createManyAndReturn<T extends DlMatchRunCreateManyAndReturnArgs>(args?: Prisma.SelectSubset<T, DlMatchRunCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$DlMatchRunPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>;
    delete<T extends DlMatchRunDeleteArgs>(args: Prisma.SelectSubset<T, DlMatchRunDeleteArgs<ExtArgs>>): Prisma.Prisma__DlMatchRunClient<runtime.Types.Result.GetResult<Prisma.$DlMatchRunPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    update<T extends DlMatchRunUpdateArgs>(args: Prisma.SelectSubset<T, DlMatchRunUpdateArgs<ExtArgs>>): Prisma.Prisma__DlMatchRunClient<runtime.Types.Result.GetResult<Prisma.$DlMatchRunPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    deleteMany<T extends DlMatchRunDeleteManyArgs>(args?: Prisma.SelectSubset<T, DlMatchRunDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    updateMany<T extends DlMatchRunUpdateManyArgs>(args: Prisma.SelectSubset<T, DlMatchRunUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    updateManyAndReturn<T extends DlMatchRunUpdateManyAndReturnArgs>(args: Prisma.SelectSubset<T, DlMatchRunUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$DlMatchRunPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>;
    upsert<T extends DlMatchRunUpsertArgs>(args: Prisma.SelectSubset<T, DlMatchRunUpsertArgs<ExtArgs>>): Prisma.Prisma__DlMatchRunClient<runtime.Types.Result.GetResult<Prisma.$DlMatchRunPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    count<T extends DlMatchRunCountArgs>(args?: Prisma.Subset<T, DlMatchRunCountArgs>): Prisma.PrismaPromise<T extends runtime.Types.Utils.Record<'select', any> ? T['select'] extends true ? number : Prisma.GetScalarType<T['select'], DlMatchRunCountAggregateOutputType> : number>;
    aggregate<T extends DlMatchRunAggregateArgs>(args: Prisma.Subset<T, DlMatchRunAggregateArgs>): Prisma.PrismaPromise<GetDlMatchRunAggregateType<T>>;
    groupBy<T extends DlMatchRunGroupByArgs, HasSelectOrTake extends Prisma.Or<Prisma.Extends<'skip', Prisma.Keys<T>>, Prisma.Extends<'take', Prisma.Keys<T>>>, OrderByArg extends Prisma.True extends HasSelectOrTake ? {
        orderBy: DlMatchRunGroupByArgs['orderBy'];
    } : {
        orderBy?: DlMatchRunGroupByArgs['orderBy'];
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
    }[OrderFields]>(args: Prisma.SubsetIntersection<T, DlMatchRunGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetDlMatchRunGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>;
    readonly fields: DlMatchRunFieldRefs;
}
export interface Prisma__DlMatchRunClient<T, Null = never, ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise";
    results<T extends Prisma.DlMatchRun$resultsArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.DlMatchRun$resultsArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$DlMatchResultPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>;
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): runtime.Types.Utils.JsPromise<TResult1 | TResult2>;
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): runtime.Types.Utils.JsPromise<T | TResult>;
    finally(onfinally?: (() => void) | undefined | null): runtime.Types.Utils.JsPromise<T>;
}
export interface DlMatchRunFieldRefs {
    readonly id: Prisma.FieldRef<"DlMatchRun", 'BigInt'>;
    readonly status: Prisma.FieldRef<"DlMatchRun", 'String'>;
    readonly contactsTotal: Prisma.FieldRef<"DlMatchRun", 'Int'>;
    readonly matchesTotal: Prisma.FieldRef<"DlMatchRun", 'Int'>;
    readonly strictMatchesTotal: Prisma.FieldRef<"DlMatchRun", 'Int'>;
    readonly usernameMatchesTotal: Prisma.FieldRef<"DlMatchRun", 'Int'>;
    readonly phoneMatchesTotal: Prisma.FieldRef<"DlMatchRun", 'Int'>;
    readonly createdAt: Prisma.FieldRef<"DlMatchRun", 'DateTime'>;
    readonly finishedAt: Prisma.FieldRef<"DlMatchRun", 'DateTime'>;
    readonly error: Prisma.FieldRef<"DlMatchRun", 'String'>;
}
export type DlMatchRunFindUniqueArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.DlMatchRunSelect<ExtArgs> | null;
    omit?: Prisma.DlMatchRunOmit<ExtArgs> | null;
    include?: Prisma.DlMatchRunInclude<ExtArgs> | null;
    where: Prisma.DlMatchRunWhereUniqueInput;
};
export type DlMatchRunFindUniqueOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.DlMatchRunSelect<ExtArgs> | null;
    omit?: Prisma.DlMatchRunOmit<ExtArgs> | null;
    include?: Prisma.DlMatchRunInclude<ExtArgs> | null;
    where: Prisma.DlMatchRunWhereUniqueInput;
};
export type DlMatchRunFindFirstArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.DlMatchRunSelect<ExtArgs> | null;
    omit?: Prisma.DlMatchRunOmit<ExtArgs> | null;
    include?: Prisma.DlMatchRunInclude<ExtArgs> | null;
    where?: Prisma.DlMatchRunWhereInput;
    orderBy?: Prisma.DlMatchRunOrderByWithRelationInput | Prisma.DlMatchRunOrderByWithRelationInput[];
    cursor?: Prisma.DlMatchRunWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.DlMatchRunScalarFieldEnum | Prisma.DlMatchRunScalarFieldEnum[];
};
export type DlMatchRunFindFirstOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.DlMatchRunSelect<ExtArgs> | null;
    omit?: Prisma.DlMatchRunOmit<ExtArgs> | null;
    include?: Prisma.DlMatchRunInclude<ExtArgs> | null;
    where?: Prisma.DlMatchRunWhereInput;
    orderBy?: Prisma.DlMatchRunOrderByWithRelationInput | Prisma.DlMatchRunOrderByWithRelationInput[];
    cursor?: Prisma.DlMatchRunWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.DlMatchRunScalarFieldEnum | Prisma.DlMatchRunScalarFieldEnum[];
};
export type DlMatchRunFindManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.DlMatchRunSelect<ExtArgs> | null;
    omit?: Prisma.DlMatchRunOmit<ExtArgs> | null;
    include?: Prisma.DlMatchRunInclude<ExtArgs> | null;
    where?: Prisma.DlMatchRunWhereInput;
    orderBy?: Prisma.DlMatchRunOrderByWithRelationInput | Prisma.DlMatchRunOrderByWithRelationInput[];
    cursor?: Prisma.DlMatchRunWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.DlMatchRunScalarFieldEnum | Prisma.DlMatchRunScalarFieldEnum[];
};
export type DlMatchRunCreateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.DlMatchRunSelect<ExtArgs> | null;
    omit?: Prisma.DlMatchRunOmit<ExtArgs> | null;
    include?: Prisma.DlMatchRunInclude<ExtArgs> | null;
    data: Prisma.XOR<Prisma.DlMatchRunCreateInput, Prisma.DlMatchRunUncheckedCreateInput>;
};
export type DlMatchRunCreateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    data: Prisma.DlMatchRunCreateManyInput | Prisma.DlMatchRunCreateManyInput[];
    skipDuplicates?: boolean;
};
export type DlMatchRunCreateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.DlMatchRunSelectCreateManyAndReturn<ExtArgs> | null;
    omit?: Prisma.DlMatchRunOmit<ExtArgs> | null;
    data: Prisma.DlMatchRunCreateManyInput | Prisma.DlMatchRunCreateManyInput[];
    skipDuplicates?: boolean;
};
export type DlMatchRunUpdateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.DlMatchRunSelect<ExtArgs> | null;
    omit?: Prisma.DlMatchRunOmit<ExtArgs> | null;
    include?: Prisma.DlMatchRunInclude<ExtArgs> | null;
    data: Prisma.XOR<Prisma.DlMatchRunUpdateInput, Prisma.DlMatchRunUncheckedUpdateInput>;
    where: Prisma.DlMatchRunWhereUniqueInput;
};
export type DlMatchRunUpdateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    data: Prisma.XOR<Prisma.DlMatchRunUpdateManyMutationInput, Prisma.DlMatchRunUncheckedUpdateManyInput>;
    where?: Prisma.DlMatchRunWhereInput;
    limit?: number;
};
export type DlMatchRunUpdateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.DlMatchRunSelectUpdateManyAndReturn<ExtArgs> | null;
    omit?: Prisma.DlMatchRunOmit<ExtArgs> | null;
    data: Prisma.XOR<Prisma.DlMatchRunUpdateManyMutationInput, Prisma.DlMatchRunUncheckedUpdateManyInput>;
    where?: Prisma.DlMatchRunWhereInput;
    limit?: number;
};
export type DlMatchRunUpsertArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.DlMatchRunSelect<ExtArgs> | null;
    omit?: Prisma.DlMatchRunOmit<ExtArgs> | null;
    include?: Prisma.DlMatchRunInclude<ExtArgs> | null;
    where: Prisma.DlMatchRunWhereUniqueInput;
    create: Prisma.XOR<Prisma.DlMatchRunCreateInput, Prisma.DlMatchRunUncheckedCreateInput>;
    update: Prisma.XOR<Prisma.DlMatchRunUpdateInput, Prisma.DlMatchRunUncheckedUpdateInput>;
};
export type DlMatchRunDeleteArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.DlMatchRunSelect<ExtArgs> | null;
    omit?: Prisma.DlMatchRunOmit<ExtArgs> | null;
    include?: Prisma.DlMatchRunInclude<ExtArgs> | null;
    where: Prisma.DlMatchRunWhereUniqueInput;
};
export type DlMatchRunDeleteManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.DlMatchRunWhereInput;
    limit?: number;
};
export type DlMatchRun$resultsArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
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
export type DlMatchRunDefaultArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.DlMatchRunSelect<ExtArgs> | null;
    omit?: Prisma.DlMatchRunOmit<ExtArgs> | null;
    include?: Prisma.DlMatchRunInclude<ExtArgs> | null;
};
export {};
