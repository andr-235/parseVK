import type * as runtime from "@prisma/client/runtime/client";
import type * as Prisma from "../internal/prismaNamespace.js";
export type KeywordFormExclusionModel = runtime.Types.Result.DefaultSelection<Prisma.$KeywordFormExclusionPayload>;
export type AggregateKeywordFormExclusion = {
    _count: KeywordFormExclusionCountAggregateOutputType | null;
    _avg: KeywordFormExclusionAvgAggregateOutputType | null;
    _sum: KeywordFormExclusionSumAggregateOutputType | null;
    _min: KeywordFormExclusionMinAggregateOutputType | null;
    _max: KeywordFormExclusionMaxAggregateOutputType | null;
};
export type KeywordFormExclusionAvgAggregateOutputType = {
    id: number | null;
    keywordId: number | null;
};
export type KeywordFormExclusionSumAggregateOutputType = {
    id: number | null;
    keywordId: number | null;
};
export type KeywordFormExclusionMinAggregateOutputType = {
    id: number | null;
    keywordId: number | null;
    form: string | null;
    createdAt: Date | null;
};
export type KeywordFormExclusionMaxAggregateOutputType = {
    id: number | null;
    keywordId: number | null;
    form: string | null;
    createdAt: Date | null;
};
export type KeywordFormExclusionCountAggregateOutputType = {
    id: number;
    keywordId: number;
    form: number;
    createdAt: number;
    _all: number;
};
export type KeywordFormExclusionAvgAggregateInputType = {
    id?: true;
    keywordId?: true;
};
export type KeywordFormExclusionSumAggregateInputType = {
    id?: true;
    keywordId?: true;
};
export type KeywordFormExclusionMinAggregateInputType = {
    id?: true;
    keywordId?: true;
    form?: true;
    createdAt?: true;
};
export type KeywordFormExclusionMaxAggregateInputType = {
    id?: true;
    keywordId?: true;
    form?: true;
    createdAt?: true;
};
export type KeywordFormExclusionCountAggregateInputType = {
    id?: true;
    keywordId?: true;
    form?: true;
    createdAt?: true;
    _all?: true;
};
export type KeywordFormExclusionAggregateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.KeywordFormExclusionWhereInput;
    orderBy?: Prisma.KeywordFormExclusionOrderByWithRelationInput | Prisma.KeywordFormExclusionOrderByWithRelationInput[];
    cursor?: Prisma.KeywordFormExclusionWhereUniqueInput;
    take?: number;
    skip?: number;
    _count?: true | KeywordFormExclusionCountAggregateInputType;
    _avg?: KeywordFormExclusionAvgAggregateInputType;
    _sum?: KeywordFormExclusionSumAggregateInputType;
    _min?: KeywordFormExclusionMinAggregateInputType;
    _max?: KeywordFormExclusionMaxAggregateInputType;
};
export type GetKeywordFormExclusionAggregateType<T extends KeywordFormExclusionAggregateArgs> = {
    [P in keyof T & keyof AggregateKeywordFormExclusion]: P extends '_count' | 'count' ? T[P] extends true ? number : Prisma.GetScalarType<T[P], AggregateKeywordFormExclusion[P]> : Prisma.GetScalarType<T[P], AggregateKeywordFormExclusion[P]>;
};
export type KeywordFormExclusionGroupByArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.KeywordFormExclusionWhereInput;
    orderBy?: Prisma.KeywordFormExclusionOrderByWithAggregationInput | Prisma.KeywordFormExclusionOrderByWithAggregationInput[];
    by: Prisma.KeywordFormExclusionScalarFieldEnum[] | Prisma.KeywordFormExclusionScalarFieldEnum;
    having?: Prisma.KeywordFormExclusionScalarWhereWithAggregatesInput;
    take?: number;
    skip?: number;
    _count?: KeywordFormExclusionCountAggregateInputType | true;
    _avg?: KeywordFormExclusionAvgAggregateInputType;
    _sum?: KeywordFormExclusionSumAggregateInputType;
    _min?: KeywordFormExclusionMinAggregateInputType;
    _max?: KeywordFormExclusionMaxAggregateInputType;
};
export type KeywordFormExclusionGroupByOutputType = {
    id: number;
    keywordId: number;
    form: string;
    createdAt: Date;
    _count: KeywordFormExclusionCountAggregateOutputType | null;
    _avg: KeywordFormExclusionAvgAggregateOutputType | null;
    _sum: KeywordFormExclusionSumAggregateOutputType | null;
    _min: KeywordFormExclusionMinAggregateOutputType | null;
    _max: KeywordFormExclusionMaxAggregateOutputType | null;
};
type GetKeywordFormExclusionGroupByPayload<T extends KeywordFormExclusionGroupByArgs> = Prisma.PrismaPromise<Array<Prisma.PickEnumerable<KeywordFormExclusionGroupByOutputType, T['by']> & {
    [P in ((keyof T) & (keyof KeywordFormExclusionGroupByOutputType))]: P extends '_count' ? T[P] extends boolean ? number : Prisma.GetScalarType<T[P], KeywordFormExclusionGroupByOutputType[P]> : Prisma.GetScalarType<T[P], KeywordFormExclusionGroupByOutputType[P]>;
}>>;
export type KeywordFormExclusionWhereInput = {
    AND?: Prisma.KeywordFormExclusionWhereInput | Prisma.KeywordFormExclusionWhereInput[];
    OR?: Prisma.KeywordFormExclusionWhereInput[];
    NOT?: Prisma.KeywordFormExclusionWhereInput | Prisma.KeywordFormExclusionWhereInput[];
    id?: Prisma.IntFilter<"KeywordFormExclusion"> | number;
    keywordId?: Prisma.IntFilter<"KeywordFormExclusion"> | number;
    form?: Prisma.StringFilter<"KeywordFormExclusion"> | string;
    createdAt?: Prisma.DateTimeFilter<"KeywordFormExclusion"> | Date | string;
    keyword?: Prisma.XOR<Prisma.KeywordScalarRelationFilter, Prisma.KeywordWhereInput>;
};
export type KeywordFormExclusionOrderByWithRelationInput = {
    id?: Prisma.SortOrder;
    keywordId?: Prisma.SortOrder;
    form?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    keyword?: Prisma.KeywordOrderByWithRelationInput;
};
export type KeywordFormExclusionWhereUniqueInput = Prisma.AtLeast<{
    id?: number;
    keywordId_form?: Prisma.KeywordFormExclusionKeywordIdFormCompoundUniqueInput;
    AND?: Prisma.KeywordFormExclusionWhereInput | Prisma.KeywordFormExclusionWhereInput[];
    OR?: Prisma.KeywordFormExclusionWhereInput[];
    NOT?: Prisma.KeywordFormExclusionWhereInput | Prisma.KeywordFormExclusionWhereInput[];
    keywordId?: Prisma.IntFilter<"KeywordFormExclusion"> | number;
    form?: Prisma.StringFilter<"KeywordFormExclusion"> | string;
    createdAt?: Prisma.DateTimeFilter<"KeywordFormExclusion"> | Date | string;
    keyword?: Prisma.XOR<Prisma.KeywordScalarRelationFilter, Prisma.KeywordWhereInput>;
}, "id" | "keywordId_form">;
export type KeywordFormExclusionOrderByWithAggregationInput = {
    id?: Prisma.SortOrder;
    keywordId?: Prisma.SortOrder;
    form?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    _count?: Prisma.KeywordFormExclusionCountOrderByAggregateInput;
    _avg?: Prisma.KeywordFormExclusionAvgOrderByAggregateInput;
    _max?: Prisma.KeywordFormExclusionMaxOrderByAggregateInput;
    _min?: Prisma.KeywordFormExclusionMinOrderByAggregateInput;
    _sum?: Prisma.KeywordFormExclusionSumOrderByAggregateInput;
};
export type KeywordFormExclusionScalarWhereWithAggregatesInput = {
    AND?: Prisma.KeywordFormExclusionScalarWhereWithAggregatesInput | Prisma.KeywordFormExclusionScalarWhereWithAggregatesInput[];
    OR?: Prisma.KeywordFormExclusionScalarWhereWithAggregatesInput[];
    NOT?: Prisma.KeywordFormExclusionScalarWhereWithAggregatesInput | Prisma.KeywordFormExclusionScalarWhereWithAggregatesInput[];
    id?: Prisma.IntWithAggregatesFilter<"KeywordFormExclusion"> | number;
    keywordId?: Prisma.IntWithAggregatesFilter<"KeywordFormExclusion"> | number;
    form?: Prisma.StringWithAggregatesFilter<"KeywordFormExclusion"> | string;
    createdAt?: Prisma.DateTimeWithAggregatesFilter<"KeywordFormExclusion"> | Date | string;
};
export type KeywordFormExclusionCreateInput = {
    form: string;
    createdAt?: Date | string;
    keyword: Prisma.KeywordCreateNestedOneWithoutKeywordFormExclusionsInput;
};
export type KeywordFormExclusionUncheckedCreateInput = {
    id?: number;
    keywordId: number;
    form: string;
    createdAt?: Date | string;
};
export type KeywordFormExclusionUpdateInput = {
    form?: Prisma.StringFieldUpdateOperationsInput | string;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    keyword?: Prisma.KeywordUpdateOneRequiredWithoutKeywordFormExclusionsNestedInput;
};
export type KeywordFormExclusionUncheckedUpdateInput = {
    id?: Prisma.IntFieldUpdateOperationsInput | number;
    keywordId?: Prisma.IntFieldUpdateOperationsInput | number;
    form?: Prisma.StringFieldUpdateOperationsInput | string;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type KeywordFormExclusionCreateManyInput = {
    id?: number;
    keywordId: number;
    form: string;
    createdAt?: Date | string;
};
export type KeywordFormExclusionUpdateManyMutationInput = {
    form?: Prisma.StringFieldUpdateOperationsInput | string;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type KeywordFormExclusionUncheckedUpdateManyInput = {
    id?: Prisma.IntFieldUpdateOperationsInput | number;
    keywordId?: Prisma.IntFieldUpdateOperationsInput | number;
    form?: Prisma.StringFieldUpdateOperationsInput | string;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type KeywordFormExclusionListRelationFilter = {
    every?: Prisma.KeywordFormExclusionWhereInput;
    some?: Prisma.KeywordFormExclusionWhereInput;
    none?: Prisma.KeywordFormExclusionWhereInput;
};
export type KeywordFormExclusionOrderByRelationAggregateInput = {
    _count?: Prisma.SortOrder;
};
export type KeywordFormExclusionKeywordIdFormCompoundUniqueInput = {
    keywordId: number;
    form: string;
};
export type KeywordFormExclusionCountOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    keywordId?: Prisma.SortOrder;
    form?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
};
export type KeywordFormExclusionAvgOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    keywordId?: Prisma.SortOrder;
};
export type KeywordFormExclusionMaxOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    keywordId?: Prisma.SortOrder;
    form?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
};
export type KeywordFormExclusionMinOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    keywordId?: Prisma.SortOrder;
    form?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
};
export type KeywordFormExclusionSumOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    keywordId?: Prisma.SortOrder;
};
export type KeywordFormExclusionCreateNestedManyWithoutKeywordInput = {
    create?: Prisma.XOR<Prisma.KeywordFormExclusionCreateWithoutKeywordInput, Prisma.KeywordFormExclusionUncheckedCreateWithoutKeywordInput> | Prisma.KeywordFormExclusionCreateWithoutKeywordInput[] | Prisma.KeywordFormExclusionUncheckedCreateWithoutKeywordInput[];
    connectOrCreate?: Prisma.KeywordFormExclusionCreateOrConnectWithoutKeywordInput | Prisma.KeywordFormExclusionCreateOrConnectWithoutKeywordInput[];
    createMany?: Prisma.KeywordFormExclusionCreateManyKeywordInputEnvelope;
    connect?: Prisma.KeywordFormExclusionWhereUniqueInput | Prisma.KeywordFormExclusionWhereUniqueInput[];
};
export type KeywordFormExclusionUncheckedCreateNestedManyWithoutKeywordInput = {
    create?: Prisma.XOR<Prisma.KeywordFormExclusionCreateWithoutKeywordInput, Prisma.KeywordFormExclusionUncheckedCreateWithoutKeywordInput> | Prisma.KeywordFormExclusionCreateWithoutKeywordInput[] | Prisma.KeywordFormExclusionUncheckedCreateWithoutKeywordInput[];
    connectOrCreate?: Prisma.KeywordFormExclusionCreateOrConnectWithoutKeywordInput | Prisma.KeywordFormExclusionCreateOrConnectWithoutKeywordInput[];
    createMany?: Prisma.KeywordFormExclusionCreateManyKeywordInputEnvelope;
    connect?: Prisma.KeywordFormExclusionWhereUniqueInput | Prisma.KeywordFormExclusionWhereUniqueInput[];
};
export type KeywordFormExclusionUpdateManyWithoutKeywordNestedInput = {
    create?: Prisma.XOR<Prisma.KeywordFormExclusionCreateWithoutKeywordInput, Prisma.KeywordFormExclusionUncheckedCreateWithoutKeywordInput> | Prisma.KeywordFormExclusionCreateWithoutKeywordInput[] | Prisma.KeywordFormExclusionUncheckedCreateWithoutKeywordInput[];
    connectOrCreate?: Prisma.KeywordFormExclusionCreateOrConnectWithoutKeywordInput | Prisma.KeywordFormExclusionCreateOrConnectWithoutKeywordInput[];
    upsert?: Prisma.KeywordFormExclusionUpsertWithWhereUniqueWithoutKeywordInput | Prisma.KeywordFormExclusionUpsertWithWhereUniqueWithoutKeywordInput[];
    createMany?: Prisma.KeywordFormExclusionCreateManyKeywordInputEnvelope;
    set?: Prisma.KeywordFormExclusionWhereUniqueInput | Prisma.KeywordFormExclusionWhereUniqueInput[];
    disconnect?: Prisma.KeywordFormExclusionWhereUniqueInput | Prisma.KeywordFormExclusionWhereUniqueInput[];
    delete?: Prisma.KeywordFormExclusionWhereUniqueInput | Prisma.KeywordFormExclusionWhereUniqueInput[];
    connect?: Prisma.KeywordFormExclusionWhereUniqueInput | Prisma.KeywordFormExclusionWhereUniqueInput[];
    update?: Prisma.KeywordFormExclusionUpdateWithWhereUniqueWithoutKeywordInput | Prisma.KeywordFormExclusionUpdateWithWhereUniqueWithoutKeywordInput[];
    updateMany?: Prisma.KeywordFormExclusionUpdateManyWithWhereWithoutKeywordInput | Prisma.KeywordFormExclusionUpdateManyWithWhereWithoutKeywordInput[];
    deleteMany?: Prisma.KeywordFormExclusionScalarWhereInput | Prisma.KeywordFormExclusionScalarWhereInput[];
};
export type KeywordFormExclusionUncheckedUpdateManyWithoutKeywordNestedInput = {
    create?: Prisma.XOR<Prisma.KeywordFormExclusionCreateWithoutKeywordInput, Prisma.KeywordFormExclusionUncheckedCreateWithoutKeywordInput> | Prisma.KeywordFormExclusionCreateWithoutKeywordInput[] | Prisma.KeywordFormExclusionUncheckedCreateWithoutKeywordInput[];
    connectOrCreate?: Prisma.KeywordFormExclusionCreateOrConnectWithoutKeywordInput | Prisma.KeywordFormExclusionCreateOrConnectWithoutKeywordInput[];
    upsert?: Prisma.KeywordFormExclusionUpsertWithWhereUniqueWithoutKeywordInput | Prisma.KeywordFormExclusionUpsertWithWhereUniqueWithoutKeywordInput[];
    createMany?: Prisma.KeywordFormExclusionCreateManyKeywordInputEnvelope;
    set?: Prisma.KeywordFormExclusionWhereUniqueInput | Prisma.KeywordFormExclusionWhereUniqueInput[];
    disconnect?: Prisma.KeywordFormExclusionWhereUniqueInput | Prisma.KeywordFormExclusionWhereUniqueInput[];
    delete?: Prisma.KeywordFormExclusionWhereUniqueInput | Prisma.KeywordFormExclusionWhereUniqueInput[];
    connect?: Prisma.KeywordFormExclusionWhereUniqueInput | Prisma.KeywordFormExclusionWhereUniqueInput[];
    update?: Prisma.KeywordFormExclusionUpdateWithWhereUniqueWithoutKeywordInput | Prisma.KeywordFormExclusionUpdateWithWhereUniqueWithoutKeywordInput[];
    updateMany?: Prisma.KeywordFormExclusionUpdateManyWithWhereWithoutKeywordInput | Prisma.KeywordFormExclusionUpdateManyWithWhereWithoutKeywordInput[];
    deleteMany?: Prisma.KeywordFormExclusionScalarWhereInput | Prisma.KeywordFormExclusionScalarWhereInput[];
};
export type KeywordFormExclusionCreateWithoutKeywordInput = {
    form: string;
    createdAt?: Date | string;
};
export type KeywordFormExclusionUncheckedCreateWithoutKeywordInput = {
    id?: number;
    form: string;
    createdAt?: Date | string;
};
export type KeywordFormExclusionCreateOrConnectWithoutKeywordInput = {
    where: Prisma.KeywordFormExclusionWhereUniqueInput;
    create: Prisma.XOR<Prisma.KeywordFormExclusionCreateWithoutKeywordInput, Prisma.KeywordFormExclusionUncheckedCreateWithoutKeywordInput>;
};
export type KeywordFormExclusionCreateManyKeywordInputEnvelope = {
    data: Prisma.KeywordFormExclusionCreateManyKeywordInput | Prisma.KeywordFormExclusionCreateManyKeywordInput[];
    skipDuplicates?: boolean;
};
export type KeywordFormExclusionUpsertWithWhereUniqueWithoutKeywordInput = {
    where: Prisma.KeywordFormExclusionWhereUniqueInput;
    update: Prisma.XOR<Prisma.KeywordFormExclusionUpdateWithoutKeywordInput, Prisma.KeywordFormExclusionUncheckedUpdateWithoutKeywordInput>;
    create: Prisma.XOR<Prisma.KeywordFormExclusionCreateWithoutKeywordInput, Prisma.KeywordFormExclusionUncheckedCreateWithoutKeywordInput>;
};
export type KeywordFormExclusionUpdateWithWhereUniqueWithoutKeywordInput = {
    where: Prisma.KeywordFormExclusionWhereUniqueInput;
    data: Prisma.XOR<Prisma.KeywordFormExclusionUpdateWithoutKeywordInput, Prisma.KeywordFormExclusionUncheckedUpdateWithoutKeywordInput>;
};
export type KeywordFormExclusionUpdateManyWithWhereWithoutKeywordInput = {
    where: Prisma.KeywordFormExclusionScalarWhereInput;
    data: Prisma.XOR<Prisma.KeywordFormExclusionUpdateManyMutationInput, Prisma.KeywordFormExclusionUncheckedUpdateManyWithoutKeywordInput>;
};
export type KeywordFormExclusionScalarWhereInput = {
    AND?: Prisma.KeywordFormExclusionScalarWhereInput | Prisma.KeywordFormExclusionScalarWhereInput[];
    OR?: Prisma.KeywordFormExclusionScalarWhereInput[];
    NOT?: Prisma.KeywordFormExclusionScalarWhereInput | Prisma.KeywordFormExclusionScalarWhereInput[];
    id?: Prisma.IntFilter<"KeywordFormExclusion"> | number;
    keywordId?: Prisma.IntFilter<"KeywordFormExclusion"> | number;
    form?: Prisma.StringFilter<"KeywordFormExclusion"> | string;
    createdAt?: Prisma.DateTimeFilter<"KeywordFormExclusion"> | Date | string;
};
export type KeywordFormExclusionCreateManyKeywordInput = {
    id?: number;
    form: string;
    createdAt?: Date | string;
};
export type KeywordFormExclusionUpdateWithoutKeywordInput = {
    form?: Prisma.StringFieldUpdateOperationsInput | string;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type KeywordFormExclusionUncheckedUpdateWithoutKeywordInput = {
    id?: Prisma.IntFieldUpdateOperationsInput | number;
    form?: Prisma.StringFieldUpdateOperationsInput | string;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type KeywordFormExclusionUncheckedUpdateManyWithoutKeywordInput = {
    id?: Prisma.IntFieldUpdateOperationsInput | number;
    form?: Prisma.StringFieldUpdateOperationsInput | string;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type KeywordFormExclusionSelect<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    keywordId?: boolean;
    form?: boolean;
    createdAt?: boolean;
    keyword?: boolean | Prisma.KeywordDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["keywordFormExclusion"]>;
export type KeywordFormExclusionSelectCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    keywordId?: boolean;
    form?: boolean;
    createdAt?: boolean;
    keyword?: boolean | Prisma.KeywordDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["keywordFormExclusion"]>;
export type KeywordFormExclusionSelectUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    keywordId?: boolean;
    form?: boolean;
    createdAt?: boolean;
    keyword?: boolean | Prisma.KeywordDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["keywordFormExclusion"]>;
export type KeywordFormExclusionSelectScalar = {
    id?: boolean;
    keywordId?: boolean;
    form?: boolean;
    createdAt?: boolean;
};
export type KeywordFormExclusionOmit<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetOmit<"id" | "keywordId" | "form" | "createdAt", ExtArgs["result"]["keywordFormExclusion"]>;
export type KeywordFormExclusionInclude<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    keyword?: boolean | Prisma.KeywordDefaultArgs<ExtArgs>;
};
export type KeywordFormExclusionIncludeCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    keyword?: boolean | Prisma.KeywordDefaultArgs<ExtArgs>;
};
export type KeywordFormExclusionIncludeUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    keyword?: boolean | Prisma.KeywordDefaultArgs<ExtArgs>;
};
export type $KeywordFormExclusionPayload<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    name: "KeywordFormExclusion";
    objects: {
        keyword: Prisma.$KeywordPayload<ExtArgs>;
    };
    scalars: runtime.Types.Extensions.GetPayloadResult<{
        id: number;
        keywordId: number;
        form: string;
        createdAt: Date;
    }, ExtArgs["result"]["keywordFormExclusion"]>;
    composites: {};
};
export type KeywordFormExclusionGetPayload<S extends boolean | null | undefined | KeywordFormExclusionDefaultArgs> = runtime.Types.Result.GetResult<Prisma.$KeywordFormExclusionPayload, S>;
export type KeywordFormExclusionCountArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = Omit<KeywordFormExclusionFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
    select?: KeywordFormExclusionCountAggregateInputType | true;
};
export interface KeywordFormExclusionDelegate<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: {
        types: Prisma.TypeMap<ExtArgs>['model']['KeywordFormExclusion'];
        meta: {
            name: 'KeywordFormExclusion';
        };
    };
    findUnique<T extends KeywordFormExclusionFindUniqueArgs>(args: Prisma.SelectSubset<T, KeywordFormExclusionFindUniqueArgs<ExtArgs>>): Prisma.Prisma__KeywordFormExclusionClient<runtime.Types.Result.GetResult<Prisma.$KeywordFormExclusionPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    findUniqueOrThrow<T extends KeywordFormExclusionFindUniqueOrThrowArgs>(args: Prisma.SelectSubset<T, KeywordFormExclusionFindUniqueOrThrowArgs<ExtArgs>>): Prisma.Prisma__KeywordFormExclusionClient<runtime.Types.Result.GetResult<Prisma.$KeywordFormExclusionPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    findFirst<T extends KeywordFormExclusionFindFirstArgs>(args?: Prisma.SelectSubset<T, KeywordFormExclusionFindFirstArgs<ExtArgs>>): Prisma.Prisma__KeywordFormExclusionClient<runtime.Types.Result.GetResult<Prisma.$KeywordFormExclusionPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    findFirstOrThrow<T extends KeywordFormExclusionFindFirstOrThrowArgs>(args?: Prisma.SelectSubset<T, KeywordFormExclusionFindFirstOrThrowArgs<ExtArgs>>): Prisma.Prisma__KeywordFormExclusionClient<runtime.Types.Result.GetResult<Prisma.$KeywordFormExclusionPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    findMany<T extends KeywordFormExclusionFindManyArgs>(args?: Prisma.SelectSubset<T, KeywordFormExclusionFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$KeywordFormExclusionPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>;
    create<T extends KeywordFormExclusionCreateArgs>(args: Prisma.SelectSubset<T, KeywordFormExclusionCreateArgs<ExtArgs>>): Prisma.Prisma__KeywordFormExclusionClient<runtime.Types.Result.GetResult<Prisma.$KeywordFormExclusionPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    createMany<T extends KeywordFormExclusionCreateManyArgs>(args?: Prisma.SelectSubset<T, KeywordFormExclusionCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    createManyAndReturn<T extends KeywordFormExclusionCreateManyAndReturnArgs>(args?: Prisma.SelectSubset<T, KeywordFormExclusionCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$KeywordFormExclusionPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>;
    delete<T extends KeywordFormExclusionDeleteArgs>(args: Prisma.SelectSubset<T, KeywordFormExclusionDeleteArgs<ExtArgs>>): Prisma.Prisma__KeywordFormExclusionClient<runtime.Types.Result.GetResult<Prisma.$KeywordFormExclusionPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    update<T extends KeywordFormExclusionUpdateArgs>(args: Prisma.SelectSubset<T, KeywordFormExclusionUpdateArgs<ExtArgs>>): Prisma.Prisma__KeywordFormExclusionClient<runtime.Types.Result.GetResult<Prisma.$KeywordFormExclusionPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    deleteMany<T extends KeywordFormExclusionDeleteManyArgs>(args?: Prisma.SelectSubset<T, KeywordFormExclusionDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    updateMany<T extends KeywordFormExclusionUpdateManyArgs>(args: Prisma.SelectSubset<T, KeywordFormExclusionUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    updateManyAndReturn<T extends KeywordFormExclusionUpdateManyAndReturnArgs>(args: Prisma.SelectSubset<T, KeywordFormExclusionUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$KeywordFormExclusionPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>;
    upsert<T extends KeywordFormExclusionUpsertArgs>(args: Prisma.SelectSubset<T, KeywordFormExclusionUpsertArgs<ExtArgs>>): Prisma.Prisma__KeywordFormExclusionClient<runtime.Types.Result.GetResult<Prisma.$KeywordFormExclusionPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    count<T extends KeywordFormExclusionCountArgs>(args?: Prisma.Subset<T, KeywordFormExclusionCountArgs>): Prisma.PrismaPromise<T extends runtime.Types.Utils.Record<'select', any> ? T['select'] extends true ? number : Prisma.GetScalarType<T['select'], KeywordFormExclusionCountAggregateOutputType> : number>;
    aggregate<T extends KeywordFormExclusionAggregateArgs>(args: Prisma.Subset<T, KeywordFormExclusionAggregateArgs>): Prisma.PrismaPromise<GetKeywordFormExclusionAggregateType<T>>;
    groupBy<T extends KeywordFormExclusionGroupByArgs, HasSelectOrTake extends Prisma.Or<Prisma.Extends<'skip', Prisma.Keys<T>>, Prisma.Extends<'take', Prisma.Keys<T>>>, OrderByArg extends Prisma.True extends HasSelectOrTake ? {
        orderBy: KeywordFormExclusionGroupByArgs['orderBy'];
    } : {
        orderBy?: KeywordFormExclusionGroupByArgs['orderBy'];
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
    }[OrderFields]>(args: Prisma.SubsetIntersection<T, KeywordFormExclusionGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetKeywordFormExclusionGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>;
    readonly fields: KeywordFormExclusionFieldRefs;
}
export interface Prisma__KeywordFormExclusionClient<T, Null = never, ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise";
    keyword<T extends Prisma.KeywordDefaultArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.KeywordDefaultArgs<ExtArgs>>): Prisma.Prisma__KeywordClient<runtime.Types.Result.GetResult<Prisma.$KeywordPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>;
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): runtime.Types.Utils.JsPromise<TResult1 | TResult2>;
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): runtime.Types.Utils.JsPromise<T | TResult>;
    finally(onfinally?: (() => void) | undefined | null): runtime.Types.Utils.JsPromise<T>;
}
export interface KeywordFormExclusionFieldRefs {
    readonly id: Prisma.FieldRef<"KeywordFormExclusion", 'Int'>;
    readonly keywordId: Prisma.FieldRef<"KeywordFormExclusion", 'Int'>;
    readonly form: Prisma.FieldRef<"KeywordFormExclusion", 'String'>;
    readonly createdAt: Prisma.FieldRef<"KeywordFormExclusion", 'DateTime'>;
}
export type KeywordFormExclusionFindUniqueArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.KeywordFormExclusionSelect<ExtArgs> | null;
    omit?: Prisma.KeywordFormExclusionOmit<ExtArgs> | null;
    include?: Prisma.KeywordFormExclusionInclude<ExtArgs> | null;
    where: Prisma.KeywordFormExclusionWhereUniqueInput;
};
export type KeywordFormExclusionFindUniqueOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.KeywordFormExclusionSelect<ExtArgs> | null;
    omit?: Prisma.KeywordFormExclusionOmit<ExtArgs> | null;
    include?: Prisma.KeywordFormExclusionInclude<ExtArgs> | null;
    where: Prisma.KeywordFormExclusionWhereUniqueInput;
};
export type KeywordFormExclusionFindFirstArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.KeywordFormExclusionSelect<ExtArgs> | null;
    omit?: Prisma.KeywordFormExclusionOmit<ExtArgs> | null;
    include?: Prisma.KeywordFormExclusionInclude<ExtArgs> | null;
    where?: Prisma.KeywordFormExclusionWhereInput;
    orderBy?: Prisma.KeywordFormExclusionOrderByWithRelationInput | Prisma.KeywordFormExclusionOrderByWithRelationInput[];
    cursor?: Prisma.KeywordFormExclusionWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.KeywordFormExclusionScalarFieldEnum | Prisma.KeywordFormExclusionScalarFieldEnum[];
};
export type KeywordFormExclusionFindFirstOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.KeywordFormExclusionSelect<ExtArgs> | null;
    omit?: Prisma.KeywordFormExclusionOmit<ExtArgs> | null;
    include?: Prisma.KeywordFormExclusionInclude<ExtArgs> | null;
    where?: Prisma.KeywordFormExclusionWhereInput;
    orderBy?: Prisma.KeywordFormExclusionOrderByWithRelationInput | Prisma.KeywordFormExclusionOrderByWithRelationInput[];
    cursor?: Prisma.KeywordFormExclusionWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.KeywordFormExclusionScalarFieldEnum | Prisma.KeywordFormExclusionScalarFieldEnum[];
};
export type KeywordFormExclusionFindManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.KeywordFormExclusionSelect<ExtArgs> | null;
    omit?: Prisma.KeywordFormExclusionOmit<ExtArgs> | null;
    include?: Prisma.KeywordFormExclusionInclude<ExtArgs> | null;
    where?: Prisma.KeywordFormExclusionWhereInput;
    orderBy?: Prisma.KeywordFormExclusionOrderByWithRelationInput | Prisma.KeywordFormExclusionOrderByWithRelationInput[];
    cursor?: Prisma.KeywordFormExclusionWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.KeywordFormExclusionScalarFieldEnum | Prisma.KeywordFormExclusionScalarFieldEnum[];
};
export type KeywordFormExclusionCreateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.KeywordFormExclusionSelect<ExtArgs> | null;
    omit?: Prisma.KeywordFormExclusionOmit<ExtArgs> | null;
    include?: Prisma.KeywordFormExclusionInclude<ExtArgs> | null;
    data: Prisma.XOR<Prisma.KeywordFormExclusionCreateInput, Prisma.KeywordFormExclusionUncheckedCreateInput>;
};
export type KeywordFormExclusionCreateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    data: Prisma.KeywordFormExclusionCreateManyInput | Prisma.KeywordFormExclusionCreateManyInput[];
    skipDuplicates?: boolean;
};
export type KeywordFormExclusionCreateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.KeywordFormExclusionSelectCreateManyAndReturn<ExtArgs> | null;
    omit?: Prisma.KeywordFormExclusionOmit<ExtArgs> | null;
    data: Prisma.KeywordFormExclusionCreateManyInput | Prisma.KeywordFormExclusionCreateManyInput[];
    skipDuplicates?: boolean;
    include?: Prisma.KeywordFormExclusionIncludeCreateManyAndReturn<ExtArgs> | null;
};
export type KeywordFormExclusionUpdateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.KeywordFormExclusionSelect<ExtArgs> | null;
    omit?: Prisma.KeywordFormExclusionOmit<ExtArgs> | null;
    include?: Prisma.KeywordFormExclusionInclude<ExtArgs> | null;
    data: Prisma.XOR<Prisma.KeywordFormExclusionUpdateInput, Prisma.KeywordFormExclusionUncheckedUpdateInput>;
    where: Prisma.KeywordFormExclusionWhereUniqueInput;
};
export type KeywordFormExclusionUpdateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    data: Prisma.XOR<Prisma.KeywordFormExclusionUpdateManyMutationInput, Prisma.KeywordFormExclusionUncheckedUpdateManyInput>;
    where?: Prisma.KeywordFormExclusionWhereInput;
    limit?: number;
};
export type KeywordFormExclusionUpdateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.KeywordFormExclusionSelectUpdateManyAndReturn<ExtArgs> | null;
    omit?: Prisma.KeywordFormExclusionOmit<ExtArgs> | null;
    data: Prisma.XOR<Prisma.KeywordFormExclusionUpdateManyMutationInput, Prisma.KeywordFormExclusionUncheckedUpdateManyInput>;
    where?: Prisma.KeywordFormExclusionWhereInput;
    limit?: number;
    include?: Prisma.KeywordFormExclusionIncludeUpdateManyAndReturn<ExtArgs> | null;
};
export type KeywordFormExclusionUpsertArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.KeywordFormExclusionSelect<ExtArgs> | null;
    omit?: Prisma.KeywordFormExclusionOmit<ExtArgs> | null;
    include?: Prisma.KeywordFormExclusionInclude<ExtArgs> | null;
    where: Prisma.KeywordFormExclusionWhereUniqueInput;
    create: Prisma.XOR<Prisma.KeywordFormExclusionCreateInput, Prisma.KeywordFormExclusionUncheckedCreateInput>;
    update: Prisma.XOR<Prisma.KeywordFormExclusionUpdateInput, Prisma.KeywordFormExclusionUncheckedUpdateInput>;
};
export type KeywordFormExclusionDeleteArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.KeywordFormExclusionSelect<ExtArgs> | null;
    omit?: Prisma.KeywordFormExclusionOmit<ExtArgs> | null;
    include?: Prisma.KeywordFormExclusionInclude<ExtArgs> | null;
    where: Prisma.KeywordFormExclusionWhereUniqueInput;
};
export type KeywordFormExclusionDeleteManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.KeywordFormExclusionWhereInput;
    limit?: number;
};
export type KeywordFormExclusionDefaultArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.KeywordFormExclusionSelect<ExtArgs> | null;
    omit?: Prisma.KeywordFormExclusionOmit<ExtArgs> | null;
    include?: Prisma.KeywordFormExclusionInclude<ExtArgs> | null;
};
export {};
