import type * as runtime from "@prisma/client/runtime/client";
import type * as $Enums from "../enums.js";
import type * as Prisma from "../internal/prismaNamespace.js";
export type KeywordFormModel = runtime.Types.Result.DefaultSelection<Prisma.$KeywordFormPayload>;
export type AggregateKeywordForm = {
    _count: KeywordFormCountAggregateOutputType | null;
    _avg: KeywordFormAvgAggregateOutputType | null;
    _sum: KeywordFormSumAggregateOutputType | null;
    _min: KeywordFormMinAggregateOutputType | null;
    _max: KeywordFormMaxAggregateOutputType | null;
};
export type KeywordFormAvgAggregateOutputType = {
    id: number | null;
    keywordId: number | null;
};
export type KeywordFormSumAggregateOutputType = {
    id: number | null;
    keywordId: number | null;
};
export type KeywordFormMinAggregateOutputType = {
    id: number | null;
    keywordId: number | null;
    form: string | null;
    source: $Enums.KeywordFormSource | null;
    createdAt: Date | null;
    updatedAt: Date | null;
};
export type KeywordFormMaxAggregateOutputType = {
    id: number | null;
    keywordId: number | null;
    form: string | null;
    source: $Enums.KeywordFormSource | null;
    createdAt: Date | null;
    updatedAt: Date | null;
};
export type KeywordFormCountAggregateOutputType = {
    id: number;
    keywordId: number;
    form: number;
    source: number;
    createdAt: number;
    updatedAt: number;
    _all: number;
};
export type KeywordFormAvgAggregateInputType = {
    id?: true;
    keywordId?: true;
};
export type KeywordFormSumAggregateInputType = {
    id?: true;
    keywordId?: true;
};
export type KeywordFormMinAggregateInputType = {
    id?: true;
    keywordId?: true;
    form?: true;
    source?: true;
    createdAt?: true;
    updatedAt?: true;
};
export type KeywordFormMaxAggregateInputType = {
    id?: true;
    keywordId?: true;
    form?: true;
    source?: true;
    createdAt?: true;
    updatedAt?: true;
};
export type KeywordFormCountAggregateInputType = {
    id?: true;
    keywordId?: true;
    form?: true;
    source?: true;
    createdAt?: true;
    updatedAt?: true;
    _all?: true;
};
export type KeywordFormAggregateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.KeywordFormWhereInput;
    orderBy?: Prisma.KeywordFormOrderByWithRelationInput | Prisma.KeywordFormOrderByWithRelationInput[];
    cursor?: Prisma.KeywordFormWhereUniqueInput;
    take?: number;
    skip?: number;
    _count?: true | KeywordFormCountAggregateInputType;
    _avg?: KeywordFormAvgAggregateInputType;
    _sum?: KeywordFormSumAggregateInputType;
    _min?: KeywordFormMinAggregateInputType;
    _max?: KeywordFormMaxAggregateInputType;
};
export type GetKeywordFormAggregateType<T extends KeywordFormAggregateArgs> = {
    [P in keyof T & keyof AggregateKeywordForm]: P extends '_count' | 'count' ? T[P] extends true ? number : Prisma.GetScalarType<T[P], AggregateKeywordForm[P]> : Prisma.GetScalarType<T[P], AggregateKeywordForm[P]>;
};
export type KeywordFormGroupByArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.KeywordFormWhereInput;
    orderBy?: Prisma.KeywordFormOrderByWithAggregationInput | Prisma.KeywordFormOrderByWithAggregationInput[];
    by: Prisma.KeywordFormScalarFieldEnum[] | Prisma.KeywordFormScalarFieldEnum;
    having?: Prisma.KeywordFormScalarWhereWithAggregatesInput;
    take?: number;
    skip?: number;
    _count?: KeywordFormCountAggregateInputType | true;
    _avg?: KeywordFormAvgAggregateInputType;
    _sum?: KeywordFormSumAggregateInputType;
    _min?: KeywordFormMinAggregateInputType;
    _max?: KeywordFormMaxAggregateInputType;
};
export type KeywordFormGroupByOutputType = {
    id: number;
    keywordId: number;
    form: string;
    source: $Enums.KeywordFormSource;
    createdAt: Date;
    updatedAt: Date;
    _count: KeywordFormCountAggregateOutputType | null;
    _avg: KeywordFormAvgAggregateOutputType | null;
    _sum: KeywordFormSumAggregateOutputType | null;
    _min: KeywordFormMinAggregateOutputType | null;
    _max: KeywordFormMaxAggregateOutputType | null;
};
type GetKeywordFormGroupByPayload<T extends KeywordFormGroupByArgs> = Prisma.PrismaPromise<Array<Prisma.PickEnumerable<KeywordFormGroupByOutputType, T['by']> & {
    [P in ((keyof T) & (keyof KeywordFormGroupByOutputType))]: P extends '_count' ? T[P] extends boolean ? number : Prisma.GetScalarType<T[P], KeywordFormGroupByOutputType[P]> : Prisma.GetScalarType<T[P], KeywordFormGroupByOutputType[P]>;
}>>;
export type KeywordFormWhereInput = {
    AND?: Prisma.KeywordFormWhereInput | Prisma.KeywordFormWhereInput[];
    OR?: Prisma.KeywordFormWhereInput[];
    NOT?: Prisma.KeywordFormWhereInput | Prisma.KeywordFormWhereInput[];
    id?: Prisma.IntFilter<"KeywordForm"> | number;
    keywordId?: Prisma.IntFilter<"KeywordForm"> | number;
    form?: Prisma.StringFilter<"KeywordForm"> | string;
    source?: Prisma.EnumKeywordFormSourceFilter<"KeywordForm"> | $Enums.KeywordFormSource;
    createdAt?: Prisma.DateTimeFilter<"KeywordForm"> | Date | string;
    updatedAt?: Prisma.DateTimeFilter<"KeywordForm"> | Date | string;
    keyword?: Prisma.XOR<Prisma.KeywordScalarRelationFilter, Prisma.KeywordWhereInput>;
};
export type KeywordFormOrderByWithRelationInput = {
    id?: Prisma.SortOrder;
    keywordId?: Prisma.SortOrder;
    form?: Prisma.SortOrder;
    source?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
    keyword?: Prisma.KeywordOrderByWithRelationInput;
};
export type KeywordFormWhereUniqueInput = Prisma.AtLeast<{
    id?: number;
    keywordId_form?: Prisma.KeywordFormKeywordIdFormCompoundUniqueInput;
    AND?: Prisma.KeywordFormWhereInput | Prisma.KeywordFormWhereInput[];
    OR?: Prisma.KeywordFormWhereInput[];
    NOT?: Prisma.KeywordFormWhereInput | Prisma.KeywordFormWhereInput[];
    keywordId?: Prisma.IntFilter<"KeywordForm"> | number;
    form?: Prisma.StringFilter<"KeywordForm"> | string;
    source?: Prisma.EnumKeywordFormSourceFilter<"KeywordForm"> | $Enums.KeywordFormSource;
    createdAt?: Prisma.DateTimeFilter<"KeywordForm"> | Date | string;
    updatedAt?: Prisma.DateTimeFilter<"KeywordForm"> | Date | string;
    keyword?: Prisma.XOR<Prisma.KeywordScalarRelationFilter, Prisma.KeywordWhereInput>;
}, "id" | "keywordId_form">;
export type KeywordFormOrderByWithAggregationInput = {
    id?: Prisma.SortOrder;
    keywordId?: Prisma.SortOrder;
    form?: Prisma.SortOrder;
    source?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
    _count?: Prisma.KeywordFormCountOrderByAggregateInput;
    _avg?: Prisma.KeywordFormAvgOrderByAggregateInput;
    _max?: Prisma.KeywordFormMaxOrderByAggregateInput;
    _min?: Prisma.KeywordFormMinOrderByAggregateInput;
    _sum?: Prisma.KeywordFormSumOrderByAggregateInput;
};
export type KeywordFormScalarWhereWithAggregatesInput = {
    AND?: Prisma.KeywordFormScalarWhereWithAggregatesInput | Prisma.KeywordFormScalarWhereWithAggregatesInput[];
    OR?: Prisma.KeywordFormScalarWhereWithAggregatesInput[];
    NOT?: Prisma.KeywordFormScalarWhereWithAggregatesInput | Prisma.KeywordFormScalarWhereWithAggregatesInput[];
    id?: Prisma.IntWithAggregatesFilter<"KeywordForm"> | number;
    keywordId?: Prisma.IntWithAggregatesFilter<"KeywordForm"> | number;
    form?: Prisma.StringWithAggregatesFilter<"KeywordForm"> | string;
    source?: Prisma.EnumKeywordFormSourceWithAggregatesFilter<"KeywordForm"> | $Enums.KeywordFormSource;
    createdAt?: Prisma.DateTimeWithAggregatesFilter<"KeywordForm"> | Date | string;
    updatedAt?: Prisma.DateTimeWithAggregatesFilter<"KeywordForm"> | Date | string;
};
export type KeywordFormCreateInput = {
    form: string;
    source: $Enums.KeywordFormSource;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    keyword: Prisma.KeywordCreateNestedOneWithoutKeywordFormsInput;
};
export type KeywordFormUncheckedCreateInput = {
    id?: number;
    keywordId: number;
    form: string;
    source: $Enums.KeywordFormSource;
    createdAt?: Date | string;
    updatedAt?: Date | string;
};
export type KeywordFormUpdateInput = {
    form?: Prisma.StringFieldUpdateOperationsInput | string;
    source?: Prisma.EnumKeywordFormSourceFieldUpdateOperationsInput | $Enums.KeywordFormSource;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    keyword?: Prisma.KeywordUpdateOneRequiredWithoutKeywordFormsNestedInput;
};
export type KeywordFormUncheckedUpdateInput = {
    id?: Prisma.IntFieldUpdateOperationsInput | number;
    keywordId?: Prisma.IntFieldUpdateOperationsInput | number;
    form?: Prisma.StringFieldUpdateOperationsInput | string;
    source?: Prisma.EnumKeywordFormSourceFieldUpdateOperationsInput | $Enums.KeywordFormSource;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type KeywordFormCreateManyInput = {
    id?: number;
    keywordId: number;
    form: string;
    source: $Enums.KeywordFormSource;
    createdAt?: Date | string;
    updatedAt?: Date | string;
};
export type KeywordFormUpdateManyMutationInput = {
    form?: Prisma.StringFieldUpdateOperationsInput | string;
    source?: Prisma.EnumKeywordFormSourceFieldUpdateOperationsInput | $Enums.KeywordFormSource;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type KeywordFormUncheckedUpdateManyInput = {
    id?: Prisma.IntFieldUpdateOperationsInput | number;
    keywordId?: Prisma.IntFieldUpdateOperationsInput | number;
    form?: Prisma.StringFieldUpdateOperationsInput | string;
    source?: Prisma.EnumKeywordFormSourceFieldUpdateOperationsInput | $Enums.KeywordFormSource;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type KeywordFormListRelationFilter = {
    every?: Prisma.KeywordFormWhereInput;
    some?: Prisma.KeywordFormWhereInput;
    none?: Prisma.KeywordFormWhereInput;
};
export type KeywordFormOrderByRelationAggregateInput = {
    _count?: Prisma.SortOrder;
};
export type KeywordFormKeywordIdFormCompoundUniqueInput = {
    keywordId: number;
    form: string;
};
export type KeywordFormCountOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    keywordId?: Prisma.SortOrder;
    form?: Prisma.SortOrder;
    source?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
};
export type KeywordFormAvgOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    keywordId?: Prisma.SortOrder;
};
export type KeywordFormMaxOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    keywordId?: Prisma.SortOrder;
    form?: Prisma.SortOrder;
    source?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
};
export type KeywordFormMinOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    keywordId?: Prisma.SortOrder;
    form?: Prisma.SortOrder;
    source?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
};
export type KeywordFormSumOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    keywordId?: Prisma.SortOrder;
};
export type KeywordFormCreateNestedManyWithoutKeywordInput = {
    create?: Prisma.XOR<Prisma.KeywordFormCreateWithoutKeywordInput, Prisma.KeywordFormUncheckedCreateWithoutKeywordInput> | Prisma.KeywordFormCreateWithoutKeywordInput[] | Prisma.KeywordFormUncheckedCreateWithoutKeywordInput[];
    connectOrCreate?: Prisma.KeywordFormCreateOrConnectWithoutKeywordInput | Prisma.KeywordFormCreateOrConnectWithoutKeywordInput[];
    createMany?: Prisma.KeywordFormCreateManyKeywordInputEnvelope;
    connect?: Prisma.KeywordFormWhereUniqueInput | Prisma.KeywordFormWhereUniqueInput[];
};
export type KeywordFormUncheckedCreateNestedManyWithoutKeywordInput = {
    create?: Prisma.XOR<Prisma.KeywordFormCreateWithoutKeywordInput, Prisma.KeywordFormUncheckedCreateWithoutKeywordInput> | Prisma.KeywordFormCreateWithoutKeywordInput[] | Prisma.KeywordFormUncheckedCreateWithoutKeywordInput[];
    connectOrCreate?: Prisma.KeywordFormCreateOrConnectWithoutKeywordInput | Prisma.KeywordFormCreateOrConnectWithoutKeywordInput[];
    createMany?: Prisma.KeywordFormCreateManyKeywordInputEnvelope;
    connect?: Prisma.KeywordFormWhereUniqueInput | Prisma.KeywordFormWhereUniqueInput[];
};
export type KeywordFormUpdateManyWithoutKeywordNestedInput = {
    create?: Prisma.XOR<Prisma.KeywordFormCreateWithoutKeywordInput, Prisma.KeywordFormUncheckedCreateWithoutKeywordInput> | Prisma.KeywordFormCreateWithoutKeywordInput[] | Prisma.KeywordFormUncheckedCreateWithoutKeywordInput[];
    connectOrCreate?: Prisma.KeywordFormCreateOrConnectWithoutKeywordInput | Prisma.KeywordFormCreateOrConnectWithoutKeywordInput[];
    upsert?: Prisma.KeywordFormUpsertWithWhereUniqueWithoutKeywordInput | Prisma.KeywordFormUpsertWithWhereUniqueWithoutKeywordInput[];
    createMany?: Prisma.KeywordFormCreateManyKeywordInputEnvelope;
    set?: Prisma.KeywordFormWhereUniqueInput | Prisma.KeywordFormWhereUniqueInput[];
    disconnect?: Prisma.KeywordFormWhereUniqueInput | Prisma.KeywordFormWhereUniqueInput[];
    delete?: Prisma.KeywordFormWhereUniqueInput | Prisma.KeywordFormWhereUniqueInput[];
    connect?: Prisma.KeywordFormWhereUniqueInput | Prisma.KeywordFormWhereUniqueInput[];
    update?: Prisma.KeywordFormUpdateWithWhereUniqueWithoutKeywordInput | Prisma.KeywordFormUpdateWithWhereUniqueWithoutKeywordInput[];
    updateMany?: Prisma.KeywordFormUpdateManyWithWhereWithoutKeywordInput | Prisma.KeywordFormUpdateManyWithWhereWithoutKeywordInput[];
    deleteMany?: Prisma.KeywordFormScalarWhereInput | Prisma.KeywordFormScalarWhereInput[];
};
export type KeywordFormUncheckedUpdateManyWithoutKeywordNestedInput = {
    create?: Prisma.XOR<Prisma.KeywordFormCreateWithoutKeywordInput, Prisma.KeywordFormUncheckedCreateWithoutKeywordInput> | Prisma.KeywordFormCreateWithoutKeywordInput[] | Prisma.KeywordFormUncheckedCreateWithoutKeywordInput[];
    connectOrCreate?: Prisma.KeywordFormCreateOrConnectWithoutKeywordInput | Prisma.KeywordFormCreateOrConnectWithoutKeywordInput[];
    upsert?: Prisma.KeywordFormUpsertWithWhereUniqueWithoutKeywordInput | Prisma.KeywordFormUpsertWithWhereUniqueWithoutKeywordInput[];
    createMany?: Prisma.KeywordFormCreateManyKeywordInputEnvelope;
    set?: Prisma.KeywordFormWhereUniqueInput | Prisma.KeywordFormWhereUniqueInput[];
    disconnect?: Prisma.KeywordFormWhereUniqueInput | Prisma.KeywordFormWhereUniqueInput[];
    delete?: Prisma.KeywordFormWhereUniqueInput | Prisma.KeywordFormWhereUniqueInput[];
    connect?: Prisma.KeywordFormWhereUniqueInput | Prisma.KeywordFormWhereUniqueInput[];
    update?: Prisma.KeywordFormUpdateWithWhereUniqueWithoutKeywordInput | Prisma.KeywordFormUpdateWithWhereUniqueWithoutKeywordInput[];
    updateMany?: Prisma.KeywordFormUpdateManyWithWhereWithoutKeywordInput | Prisma.KeywordFormUpdateManyWithWhereWithoutKeywordInput[];
    deleteMany?: Prisma.KeywordFormScalarWhereInput | Prisma.KeywordFormScalarWhereInput[];
};
export type EnumKeywordFormSourceFieldUpdateOperationsInput = {
    set?: $Enums.KeywordFormSource;
};
export type KeywordFormCreateWithoutKeywordInput = {
    form: string;
    source: $Enums.KeywordFormSource;
    createdAt?: Date | string;
    updatedAt?: Date | string;
};
export type KeywordFormUncheckedCreateWithoutKeywordInput = {
    id?: number;
    form: string;
    source: $Enums.KeywordFormSource;
    createdAt?: Date | string;
    updatedAt?: Date | string;
};
export type KeywordFormCreateOrConnectWithoutKeywordInput = {
    where: Prisma.KeywordFormWhereUniqueInput;
    create: Prisma.XOR<Prisma.KeywordFormCreateWithoutKeywordInput, Prisma.KeywordFormUncheckedCreateWithoutKeywordInput>;
};
export type KeywordFormCreateManyKeywordInputEnvelope = {
    data: Prisma.KeywordFormCreateManyKeywordInput | Prisma.KeywordFormCreateManyKeywordInput[];
    skipDuplicates?: boolean;
};
export type KeywordFormUpsertWithWhereUniqueWithoutKeywordInput = {
    where: Prisma.KeywordFormWhereUniqueInput;
    update: Prisma.XOR<Prisma.KeywordFormUpdateWithoutKeywordInput, Prisma.KeywordFormUncheckedUpdateWithoutKeywordInput>;
    create: Prisma.XOR<Prisma.KeywordFormCreateWithoutKeywordInput, Prisma.KeywordFormUncheckedCreateWithoutKeywordInput>;
};
export type KeywordFormUpdateWithWhereUniqueWithoutKeywordInput = {
    where: Prisma.KeywordFormWhereUniqueInput;
    data: Prisma.XOR<Prisma.KeywordFormUpdateWithoutKeywordInput, Prisma.KeywordFormUncheckedUpdateWithoutKeywordInput>;
};
export type KeywordFormUpdateManyWithWhereWithoutKeywordInput = {
    where: Prisma.KeywordFormScalarWhereInput;
    data: Prisma.XOR<Prisma.KeywordFormUpdateManyMutationInput, Prisma.KeywordFormUncheckedUpdateManyWithoutKeywordInput>;
};
export type KeywordFormScalarWhereInput = {
    AND?: Prisma.KeywordFormScalarWhereInput | Prisma.KeywordFormScalarWhereInput[];
    OR?: Prisma.KeywordFormScalarWhereInput[];
    NOT?: Prisma.KeywordFormScalarWhereInput | Prisma.KeywordFormScalarWhereInput[];
    id?: Prisma.IntFilter<"KeywordForm"> | number;
    keywordId?: Prisma.IntFilter<"KeywordForm"> | number;
    form?: Prisma.StringFilter<"KeywordForm"> | string;
    source?: Prisma.EnumKeywordFormSourceFilter<"KeywordForm"> | $Enums.KeywordFormSource;
    createdAt?: Prisma.DateTimeFilter<"KeywordForm"> | Date | string;
    updatedAt?: Prisma.DateTimeFilter<"KeywordForm"> | Date | string;
};
export type KeywordFormCreateManyKeywordInput = {
    id?: number;
    form: string;
    source: $Enums.KeywordFormSource;
    createdAt?: Date | string;
    updatedAt?: Date | string;
};
export type KeywordFormUpdateWithoutKeywordInput = {
    form?: Prisma.StringFieldUpdateOperationsInput | string;
    source?: Prisma.EnumKeywordFormSourceFieldUpdateOperationsInput | $Enums.KeywordFormSource;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type KeywordFormUncheckedUpdateWithoutKeywordInput = {
    id?: Prisma.IntFieldUpdateOperationsInput | number;
    form?: Prisma.StringFieldUpdateOperationsInput | string;
    source?: Prisma.EnumKeywordFormSourceFieldUpdateOperationsInput | $Enums.KeywordFormSource;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type KeywordFormUncheckedUpdateManyWithoutKeywordInput = {
    id?: Prisma.IntFieldUpdateOperationsInput | number;
    form?: Prisma.StringFieldUpdateOperationsInput | string;
    source?: Prisma.EnumKeywordFormSourceFieldUpdateOperationsInput | $Enums.KeywordFormSource;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type KeywordFormSelect<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    keywordId?: boolean;
    form?: boolean;
    source?: boolean;
    createdAt?: boolean;
    updatedAt?: boolean;
    keyword?: boolean | Prisma.KeywordDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["keywordForm"]>;
export type KeywordFormSelectCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    keywordId?: boolean;
    form?: boolean;
    source?: boolean;
    createdAt?: boolean;
    updatedAt?: boolean;
    keyword?: boolean | Prisma.KeywordDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["keywordForm"]>;
export type KeywordFormSelectUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    keywordId?: boolean;
    form?: boolean;
    source?: boolean;
    createdAt?: boolean;
    updatedAt?: boolean;
    keyword?: boolean | Prisma.KeywordDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["keywordForm"]>;
export type KeywordFormSelectScalar = {
    id?: boolean;
    keywordId?: boolean;
    form?: boolean;
    source?: boolean;
    createdAt?: boolean;
    updatedAt?: boolean;
};
export type KeywordFormOmit<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetOmit<"id" | "keywordId" | "form" | "source" | "createdAt" | "updatedAt", ExtArgs["result"]["keywordForm"]>;
export type KeywordFormInclude<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    keyword?: boolean | Prisma.KeywordDefaultArgs<ExtArgs>;
};
export type KeywordFormIncludeCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    keyword?: boolean | Prisma.KeywordDefaultArgs<ExtArgs>;
};
export type KeywordFormIncludeUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    keyword?: boolean | Prisma.KeywordDefaultArgs<ExtArgs>;
};
export type $KeywordFormPayload<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    name: "KeywordForm";
    objects: {
        keyword: Prisma.$KeywordPayload<ExtArgs>;
    };
    scalars: runtime.Types.Extensions.GetPayloadResult<{
        id: number;
        keywordId: number;
        form: string;
        source: $Enums.KeywordFormSource;
        createdAt: Date;
        updatedAt: Date;
    }, ExtArgs["result"]["keywordForm"]>;
    composites: {};
};
export type KeywordFormGetPayload<S extends boolean | null | undefined | KeywordFormDefaultArgs> = runtime.Types.Result.GetResult<Prisma.$KeywordFormPayload, S>;
export type KeywordFormCountArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = Omit<KeywordFormFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
    select?: KeywordFormCountAggregateInputType | true;
};
export interface KeywordFormDelegate<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: {
        types: Prisma.TypeMap<ExtArgs>['model']['KeywordForm'];
        meta: {
            name: 'KeywordForm';
        };
    };
    findUnique<T extends KeywordFormFindUniqueArgs>(args: Prisma.SelectSubset<T, KeywordFormFindUniqueArgs<ExtArgs>>): Prisma.Prisma__KeywordFormClient<runtime.Types.Result.GetResult<Prisma.$KeywordFormPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    findUniqueOrThrow<T extends KeywordFormFindUniqueOrThrowArgs>(args: Prisma.SelectSubset<T, KeywordFormFindUniqueOrThrowArgs<ExtArgs>>): Prisma.Prisma__KeywordFormClient<runtime.Types.Result.GetResult<Prisma.$KeywordFormPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    findFirst<T extends KeywordFormFindFirstArgs>(args?: Prisma.SelectSubset<T, KeywordFormFindFirstArgs<ExtArgs>>): Prisma.Prisma__KeywordFormClient<runtime.Types.Result.GetResult<Prisma.$KeywordFormPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    findFirstOrThrow<T extends KeywordFormFindFirstOrThrowArgs>(args?: Prisma.SelectSubset<T, KeywordFormFindFirstOrThrowArgs<ExtArgs>>): Prisma.Prisma__KeywordFormClient<runtime.Types.Result.GetResult<Prisma.$KeywordFormPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    findMany<T extends KeywordFormFindManyArgs>(args?: Prisma.SelectSubset<T, KeywordFormFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$KeywordFormPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>;
    create<T extends KeywordFormCreateArgs>(args: Prisma.SelectSubset<T, KeywordFormCreateArgs<ExtArgs>>): Prisma.Prisma__KeywordFormClient<runtime.Types.Result.GetResult<Prisma.$KeywordFormPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    createMany<T extends KeywordFormCreateManyArgs>(args?: Prisma.SelectSubset<T, KeywordFormCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    createManyAndReturn<T extends KeywordFormCreateManyAndReturnArgs>(args?: Prisma.SelectSubset<T, KeywordFormCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$KeywordFormPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>;
    delete<T extends KeywordFormDeleteArgs>(args: Prisma.SelectSubset<T, KeywordFormDeleteArgs<ExtArgs>>): Prisma.Prisma__KeywordFormClient<runtime.Types.Result.GetResult<Prisma.$KeywordFormPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    update<T extends KeywordFormUpdateArgs>(args: Prisma.SelectSubset<T, KeywordFormUpdateArgs<ExtArgs>>): Prisma.Prisma__KeywordFormClient<runtime.Types.Result.GetResult<Prisma.$KeywordFormPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    deleteMany<T extends KeywordFormDeleteManyArgs>(args?: Prisma.SelectSubset<T, KeywordFormDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    updateMany<T extends KeywordFormUpdateManyArgs>(args: Prisma.SelectSubset<T, KeywordFormUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    updateManyAndReturn<T extends KeywordFormUpdateManyAndReturnArgs>(args: Prisma.SelectSubset<T, KeywordFormUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$KeywordFormPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>;
    upsert<T extends KeywordFormUpsertArgs>(args: Prisma.SelectSubset<T, KeywordFormUpsertArgs<ExtArgs>>): Prisma.Prisma__KeywordFormClient<runtime.Types.Result.GetResult<Prisma.$KeywordFormPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    count<T extends KeywordFormCountArgs>(args?: Prisma.Subset<T, KeywordFormCountArgs>): Prisma.PrismaPromise<T extends runtime.Types.Utils.Record<'select', any> ? T['select'] extends true ? number : Prisma.GetScalarType<T['select'], KeywordFormCountAggregateOutputType> : number>;
    aggregate<T extends KeywordFormAggregateArgs>(args: Prisma.Subset<T, KeywordFormAggregateArgs>): Prisma.PrismaPromise<GetKeywordFormAggregateType<T>>;
    groupBy<T extends KeywordFormGroupByArgs, HasSelectOrTake extends Prisma.Or<Prisma.Extends<'skip', Prisma.Keys<T>>, Prisma.Extends<'take', Prisma.Keys<T>>>, OrderByArg extends Prisma.True extends HasSelectOrTake ? {
        orderBy: KeywordFormGroupByArgs['orderBy'];
    } : {
        orderBy?: KeywordFormGroupByArgs['orderBy'];
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
    }[OrderFields]>(args: Prisma.SubsetIntersection<T, KeywordFormGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetKeywordFormGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>;
    readonly fields: KeywordFormFieldRefs;
}
export interface Prisma__KeywordFormClient<T, Null = never, ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise";
    keyword<T extends Prisma.KeywordDefaultArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.KeywordDefaultArgs<ExtArgs>>): Prisma.Prisma__KeywordClient<runtime.Types.Result.GetResult<Prisma.$KeywordPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>;
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): runtime.Types.Utils.JsPromise<TResult1 | TResult2>;
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): runtime.Types.Utils.JsPromise<T | TResult>;
    finally(onfinally?: (() => void) | undefined | null): runtime.Types.Utils.JsPromise<T>;
}
export interface KeywordFormFieldRefs {
    readonly id: Prisma.FieldRef<"KeywordForm", 'Int'>;
    readonly keywordId: Prisma.FieldRef<"KeywordForm", 'Int'>;
    readonly form: Prisma.FieldRef<"KeywordForm", 'String'>;
    readonly source: Prisma.FieldRef<"KeywordForm", 'KeywordFormSource'>;
    readonly createdAt: Prisma.FieldRef<"KeywordForm", 'DateTime'>;
    readonly updatedAt: Prisma.FieldRef<"KeywordForm", 'DateTime'>;
}
export type KeywordFormFindUniqueArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.KeywordFormSelect<ExtArgs> | null;
    omit?: Prisma.KeywordFormOmit<ExtArgs> | null;
    include?: Prisma.KeywordFormInclude<ExtArgs> | null;
    where: Prisma.KeywordFormWhereUniqueInput;
};
export type KeywordFormFindUniqueOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.KeywordFormSelect<ExtArgs> | null;
    omit?: Prisma.KeywordFormOmit<ExtArgs> | null;
    include?: Prisma.KeywordFormInclude<ExtArgs> | null;
    where: Prisma.KeywordFormWhereUniqueInput;
};
export type KeywordFormFindFirstArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.KeywordFormSelect<ExtArgs> | null;
    omit?: Prisma.KeywordFormOmit<ExtArgs> | null;
    include?: Prisma.KeywordFormInclude<ExtArgs> | null;
    where?: Prisma.KeywordFormWhereInput;
    orderBy?: Prisma.KeywordFormOrderByWithRelationInput | Prisma.KeywordFormOrderByWithRelationInput[];
    cursor?: Prisma.KeywordFormWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.KeywordFormScalarFieldEnum | Prisma.KeywordFormScalarFieldEnum[];
};
export type KeywordFormFindFirstOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.KeywordFormSelect<ExtArgs> | null;
    omit?: Prisma.KeywordFormOmit<ExtArgs> | null;
    include?: Prisma.KeywordFormInclude<ExtArgs> | null;
    where?: Prisma.KeywordFormWhereInput;
    orderBy?: Prisma.KeywordFormOrderByWithRelationInput | Prisma.KeywordFormOrderByWithRelationInput[];
    cursor?: Prisma.KeywordFormWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.KeywordFormScalarFieldEnum | Prisma.KeywordFormScalarFieldEnum[];
};
export type KeywordFormFindManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.KeywordFormSelect<ExtArgs> | null;
    omit?: Prisma.KeywordFormOmit<ExtArgs> | null;
    include?: Prisma.KeywordFormInclude<ExtArgs> | null;
    where?: Prisma.KeywordFormWhereInput;
    orderBy?: Prisma.KeywordFormOrderByWithRelationInput | Prisma.KeywordFormOrderByWithRelationInput[];
    cursor?: Prisma.KeywordFormWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.KeywordFormScalarFieldEnum | Prisma.KeywordFormScalarFieldEnum[];
};
export type KeywordFormCreateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.KeywordFormSelect<ExtArgs> | null;
    omit?: Prisma.KeywordFormOmit<ExtArgs> | null;
    include?: Prisma.KeywordFormInclude<ExtArgs> | null;
    data: Prisma.XOR<Prisma.KeywordFormCreateInput, Prisma.KeywordFormUncheckedCreateInput>;
};
export type KeywordFormCreateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    data: Prisma.KeywordFormCreateManyInput | Prisma.KeywordFormCreateManyInput[];
    skipDuplicates?: boolean;
};
export type KeywordFormCreateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.KeywordFormSelectCreateManyAndReturn<ExtArgs> | null;
    omit?: Prisma.KeywordFormOmit<ExtArgs> | null;
    data: Prisma.KeywordFormCreateManyInput | Prisma.KeywordFormCreateManyInput[];
    skipDuplicates?: boolean;
    include?: Prisma.KeywordFormIncludeCreateManyAndReturn<ExtArgs> | null;
};
export type KeywordFormUpdateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.KeywordFormSelect<ExtArgs> | null;
    omit?: Prisma.KeywordFormOmit<ExtArgs> | null;
    include?: Prisma.KeywordFormInclude<ExtArgs> | null;
    data: Prisma.XOR<Prisma.KeywordFormUpdateInput, Prisma.KeywordFormUncheckedUpdateInput>;
    where: Prisma.KeywordFormWhereUniqueInput;
};
export type KeywordFormUpdateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    data: Prisma.XOR<Prisma.KeywordFormUpdateManyMutationInput, Prisma.KeywordFormUncheckedUpdateManyInput>;
    where?: Prisma.KeywordFormWhereInput;
    limit?: number;
};
export type KeywordFormUpdateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.KeywordFormSelectUpdateManyAndReturn<ExtArgs> | null;
    omit?: Prisma.KeywordFormOmit<ExtArgs> | null;
    data: Prisma.XOR<Prisma.KeywordFormUpdateManyMutationInput, Prisma.KeywordFormUncheckedUpdateManyInput>;
    where?: Prisma.KeywordFormWhereInput;
    limit?: number;
    include?: Prisma.KeywordFormIncludeUpdateManyAndReturn<ExtArgs> | null;
};
export type KeywordFormUpsertArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.KeywordFormSelect<ExtArgs> | null;
    omit?: Prisma.KeywordFormOmit<ExtArgs> | null;
    include?: Prisma.KeywordFormInclude<ExtArgs> | null;
    where: Prisma.KeywordFormWhereUniqueInput;
    create: Prisma.XOR<Prisma.KeywordFormCreateInput, Prisma.KeywordFormUncheckedCreateInput>;
    update: Prisma.XOR<Prisma.KeywordFormUpdateInput, Prisma.KeywordFormUncheckedUpdateInput>;
};
export type KeywordFormDeleteArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.KeywordFormSelect<ExtArgs> | null;
    omit?: Prisma.KeywordFormOmit<ExtArgs> | null;
    include?: Prisma.KeywordFormInclude<ExtArgs> | null;
    where: Prisma.KeywordFormWhereUniqueInput;
};
export type KeywordFormDeleteManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.KeywordFormWhereInput;
    limit?: number;
};
export type KeywordFormDefaultArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.KeywordFormSelect<ExtArgs> | null;
    omit?: Prisma.KeywordFormOmit<ExtArgs> | null;
    include?: Prisma.KeywordFormInclude<ExtArgs> | null;
};
export {};
