import type * as runtime from "@prisma/client/runtime/client";
import type * as Prisma from "../internal/prismaNamespace.js";
export type keywordModel = runtime.Types.Result.DefaultSelection<Prisma.$keywordPayload>;
export type AggregateKeyword = {
    _count: KeywordCountAggregateOutputType | null;
    _avg: KeywordAvgAggregateOutputType | null;
    _sum: KeywordSumAggregateOutputType | null;
    _min: KeywordMinAggregateOutputType | null;
    _max: KeywordMaxAggregateOutputType | null;
};
export type KeywordAvgAggregateOutputType = {
    id: number | null;
    declension: number | null;
    region: number | null;
};
export type KeywordSumAggregateOutputType = {
    id: bigint | null;
    declension: number | null;
    region: bigint | null;
};
export type KeywordMinAggregateOutputType = {
    id: bigint | null;
    word: string | null;
    declension: number | null;
    region: bigint | null;
};
export type KeywordMaxAggregateOutputType = {
    id: bigint | null;
    word: string | null;
    declension: number | null;
    region: bigint | null;
};
export type KeywordCountAggregateOutputType = {
    id: number;
    word: number;
    declension: number;
    region: number;
    _all: number;
};
export type KeywordAvgAggregateInputType = {
    id?: true;
    declension?: true;
    region?: true;
};
export type KeywordSumAggregateInputType = {
    id?: true;
    declension?: true;
    region?: true;
};
export type KeywordMinAggregateInputType = {
    id?: true;
    word?: true;
    declension?: true;
    region?: true;
};
export type KeywordMaxAggregateInputType = {
    id?: true;
    word?: true;
    declension?: true;
    region?: true;
};
export type KeywordCountAggregateInputType = {
    id?: true;
    word?: true;
    declension?: true;
    region?: true;
    _all?: true;
};
export type KeywordAggregateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.keywordWhereInput;
    orderBy?: Prisma.keywordOrderByWithRelationInput | Prisma.keywordOrderByWithRelationInput[];
    cursor?: Prisma.keywordWhereUniqueInput;
    take?: number;
    skip?: number;
    _count?: true | KeywordCountAggregateInputType;
    _avg?: KeywordAvgAggregateInputType;
    _sum?: KeywordSumAggregateInputType;
    _min?: KeywordMinAggregateInputType;
    _max?: KeywordMaxAggregateInputType;
};
export type GetKeywordAggregateType<T extends KeywordAggregateArgs> = {
    [P in keyof T & keyof AggregateKeyword]: P extends '_count' | 'count' ? T[P] extends true ? number : Prisma.GetScalarType<T[P], AggregateKeyword[P]> : Prisma.GetScalarType<T[P], AggregateKeyword[P]>;
};
export type keywordGroupByArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.keywordWhereInput;
    orderBy?: Prisma.keywordOrderByWithAggregationInput | Prisma.keywordOrderByWithAggregationInput[];
    by: Prisma.KeywordScalarFieldEnum[] | Prisma.KeywordScalarFieldEnum;
    having?: Prisma.keywordScalarWhereWithAggregatesInput;
    take?: number;
    skip?: number;
    _count?: KeywordCountAggregateInputType | true;
    _avg?: KeywordAvgAggregateInputType;
    _sum?: KeywordSumAggregateInputType;
    _min?: KeywordMinAggregateInputType;
    _max?: KeywordMaxAggregateInputType;
};
export type KeywordGroupByOutputType = {
    id: bigint;
    word: string;
    declension: number;
    region: bigint;
    _count: KeywordCountAggregateOutputType | null;
    _avg: KeywordAvgAggregateOutputType | null;
    _sum: KeywordSumAggregateOutputType | null;
    _min: KeywordMinAggregateOutputType | null;
    _max: KeywordMaxAggregateOutputType | null;
};
type GetKeywordGroupByPayload<T extends keywordGroupByArgs> = Prisma.PrismaPromise<Array<Prisma.PickEnumerable<KeywordGroupByOutputType, T['by']> & {
    [P in ((keyof T) & (keyof KeywordGroupByOutputType))]: P extends '_count' ? T[P] extends boolean ? number : Prisma.GetScalarType<T[P], KeywordGroupByOutputType[P]> : Prisma.GetScalarType<T[P], KeywordGroupByOutputType[P]>;
}>>;
export type keywordWhereInput = {
    AND?: Prisma.keywordWhereInput | Prisma.keywordWhereInput[];
    OR?: Prisma.keywordWhereInput[];
    NOT?: Prisma.keywordWhereInput | Prisma.keywordWhereInput[];
    id?: Prisma.BigIntFilter<"keyword"> | bigint | number;
    word?: Prisma.StringFilter<"keyword"> | string;
    declension?: Prisma.IntFilter<"keyword"> | number;
    region?: Prisma.BigIntFilter<"keyword"> | bigint | number;
};
export type keywordOrderByWithRelationInput = {
    id?: Prisma.SortOrder;
    word?: Prisma.SortOrder;
    declension?: Prisma.SortOrder;
    region?: Prisma.SortOrder;
};
export type keywordWhereUniqueInput = Prisma.AtLeast<{
    id?: bigint | number;
    AND?: Prisma.keywordWhereInput | Prisma.keywordWhereInput[];
    OR?: Prisma.keywordWhereInput[];
    NOT?: Prisma.keywordWhereInput | Prisma.keywordWhereInput[];
    word?: Prisma.StringFilter<"keyword"> | string;
    declension?: Prisma.IntFilter<"keyword"> | number;
    region?: Prisma.BigIntFilter<"keyword"> | bigint | number;
}, "id">;
export type keywordOrderByWithAggregationInput = {
    id?: Prisma.SortOrder;
    word?: Prisma.SortOrder;
    declension?: Prisma.SortOrder;
    region?: Prisma.SortOrder;
    _count?: Prisma.keywordCountOrderByAggregateInput;
    _avg?: Prisma.keywordAvgOrderByAggregateInput;
    _max?: Prisma.keywordMaxOrderByAggregateInput;
    _min?: Prisma.keywordMinOrderByAggregateInput;
    _sum?: Prisma.keywordSumOrderByAggregateInput;
};
export type keywordScalarWhereWithAggregatesInput = {
    AND?: Prisma.keywordScalarWhereWithAggregatesInput | Prisma.keywordScalarWhereWithAggregatesInput[];
    OR?: Prisma.keywordScalarWhereWithAggregatesInput[];
    NOT?: Prisma.keywordScalarWhereWithAggregatesInput | Prisma.keywordScalarWhereWithAggregatesInput[];
    id?: Prisma.BigIntWithAggregatesFilter<"keyword"> | bigint | number;
    word?: Prisma.StringWithAggregatesFilter<"keyword"> | string;
    declension?: Prisma.IntWithAggregatesFilter<"keyword"> | number;
    region?: Prisma.BigIntWithAggregatesFilter<"keyword"> | bigint | number;
};
export type keywordCreateInput = {
    id?: bigint | number;
    word: string;
    declension?: number;
    region: bigint | number;
};
export type keywordUncheckedCreateInput = {
    id?: bigint | number;
    word: string;
    declension?: number;
    region: bigint | number;
};
export type keywordUpdateInput = {
    id?: Prisma.BigIntFieldUpdateOperationsInput | bigint | number;
    word?: Prisma.StringFieldUpdateOperationsInput | string;
    declension?: Prisma.IntFieldUpdateOperationsInput | number;
    region?: Prisma.BigIntFieldUpdateOperationsInput | bigint | number;
};
export type keywordUncheckedUpdateInput = {
    id?: Prisma.BigIntFieldUpdateOperationsInput | bigint | number;
    word?: Prisma.StringFieldUpdateOperationsInput | string;
    declension?: Prisma.IntFieldUpdateOperationsInput | number;
    region?: Prisma.BigIntFieldUpdateOperationsInput | bigint | number;
};
export type keywordCreateManyInput = {
    id?: bigint | number;
    word: string;
    declension?: number;
    region: bigint | number;
};
export type keywordUpdateManyMutationInput = {
    id?: Prisma.BigIntFieldUpdateOperationsInput | bigint | number;
    word?: Prisma.StringFieldUpdateOperationsInput | string;
    declension?: Prisma.IntFieldUpdateOperationsInput | number;
    region?: Prisma.BigIntFieldUpdateOperationsInput | bigint | number;
};
export type keywordUncheckedUpdateManyInput = {
    id?: Prisma.BigIntFieldUpdateOperationsInput | bigint | number;
    word?: Prisma.StringFieldUpdateOperationsInput | string;
    declension?: Prisma.IntFieldUpdateOperationsInput | number;
    region?: Prisma.BigIntFieldUpdateOperationsInput | bigint | number;
};
export type keywordCountOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    word?: Prisma.SortOrder;
    declension?: Prisma.SortOrder;
    region?: Prisma.SortOrder;
};
export type keywordAvgOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    declension?: Prisma.SortOrder;
    region?: Prisma.SortOrder;
};
export type keywordMaxOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    word?: Prisma.SortOrder;
    declension?: Prisma.SortOrder;
    region?: Prisma.SortOrder;
};
export type keywordMinOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    word?: Prisma.SortOrder;
    declension?: Prisma.SortOrder;
    region?: Prisma.SortOrder;
};
export type keywordSumOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    declension?: Prisma.SortOrder;
    region?: Prisma.SortOrder;
};
export type keywordSelect<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    word?: boolean;
    declension?: boolean;
    region?: boolean;
}, ExtArgs["result"]["keyword"]>;
export type keywordSelectCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    word?: boolean;
    declension?: boolean;
    region?: boolean;
}, ExtArgs["result"]["keyword"]>;
export type keywordSelectUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    word?: boolean;
    declension?: boolean;
    region?: boolean;
}, ExtArgs["result"]["keyword"]>;
export type keywordSelectScalar = {
    id?: boolean;
    word?: boolean;
    declension?: boolean;
    region?: boolean;
};
export type keywordOmit<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetOmit<"id" | "word" | "declension" | "region", ExtArgs["result"]["keyword"]>;
export type $keywordPayload<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    name: "keyword";
    objects: {};
    scalars: runtime.Types.Extensions.GetPayloadResult<{
        id: bigint;
        word: string;
        declension: number;
        region: bigint;
    }, ExtArgs["result"]["keyword"]>;
    composites: {};
};
export type keywordGetPayload<S extends boolean | null | undefined | keywordDefaultArgs> = runtime.Types.Result.GetResult<Prisma.$keywordPayload, S>;
export type keywordCountArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = Omit<keywordFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
    select?: KeywordCountAggregateInputType | true;
};
export interface keywordDelegate<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: {
        types: Prisma.TypeMap<ExtArgs>['model']['keyword'];
        meta: {
            name: 'keyword';
        };
    };
    findUnique<T extends keywordFindUniqueArgs>(args: Prisma.SelectSubset<T, keywordFindUniqueArgs<ExtArgs>>): Prisma.Prisma__keywordClient<runtime.Types.Result.GetResult<Prisma.$keywordPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    findUniqueOrThrow<T extends keywordFindUniqueOrThrowArgs>(args: Prisma.SelectSubset<T, keywordFindUniqueOrThrowArgs<ExtArgs>>): Prisma.Prisma__keywordClient<runtime.Types.Result.GetResult<Prisma.$keywordPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    findFirst<T extends keywordFindFirstArgs>(args?: Prisma.SelectSubset<T, keywordFindFirstArgs<ExtArgs>>): Prisma.Prisma__keywordClient<runtime.Types.Result.GetResult<Prisma.$keywordPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    findFirstOrThrow<T extends keywordFindFirstOrThrowArgs>(args?: Prisma.SelectSubset<T, keywordFindFirstOrThrowArgs<ExtArgs>>): Prisma.Prisma__keywordClient<runtime.Types.Result.GetResult<Prisma.$keywordPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    findMany<T extends keywordFindManyArgs>(args?: Prisma.SelectSubset<T, keywordFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$keywordPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>;
    create<T extends keywordCreateArgs>(args: Prisma.SelectSubset<T, keywordCreateArgs<ExtArgs>>): Prisma.Prisma__keywordClient<runtime.Types.Result.GetResult<Prisma.$keywordPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    createMany<T extends keywordCreateManyArgs>(args?: Prisma.SelectSubset<T, keywordCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    createManyAndReturn<T extends keywordCreateManyAndReturnArgs>(args?: Prisma.SelectSubset<T, keywordCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$keywordPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>;
    delete<T extends keywordDeleteArgs>(args: Prisma.SelectSubset<T, keywordDeleteArgs<ExtArgs>>): Prisma.Prisma__keywordClient<runtime.Types.Result.GetResult<Prisma.$keywordPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    update<T extends keywordUpdateArgs>(args: Prisma.SelectSubset<T, keywordUpdateArgs<ExtArgs>>): Prisma.Prisma__keywordClient<runtime.Types.Result.GetResult<Prisma.$keywordPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    deleteMany<T extends keywordDeleteManyArgs>(args?: Prisma.SelectSubset<T, keywordDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    updateMany<T extends keywordUpdateManyArgs>(args: Prisma.SelectSubset<T, keywordUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    updateManyAndReturn<T extends keywordUpdateManyAndReturnArgs>(args: Prisma.SelectSubset<T, keywordUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$keywordPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>;
    upsert<T extends keywordUpsertArgs>(args: Prisma.SelectSubset<T, keywordUpsertArgs<ExtArgs>>): Prisma.Prisma__keywordClient<runtime.Types.Result.GetResult<Prisma.$keywordPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    count<T extends keywordCountArgs>(args?: Prisma.Subset<T, keywordCountArgs>): Prisma.PrismaPromise<T extends runtime.Types.Utils.Record<'select', any> ? T['select'] extends true ? number : Prisma.GetScalarType<T['select'], KeywordCountAggregateOutputType> : number>;
    aggregate<T extends KeywordAggregateArgs>(args: Prisma.Subset<T, KeywordAggregateArgs>): Prisma.PrismaPromise<GetKeywordAggregateType<T>>;
    groupBy<T extends keywordGroupByArgs, HasSelectOrTake extends Prisma.Or<Prisma.Extends<'skip', Prisma.Keys<T>>, Prisma.Extends<'take', Prisma.Keys<T>>>, OrderByArg extends Prisma.True extends HasSelectOrTake ? {
        orderBy: keywordGroupByArgs['orderBy'];
    } : {
        orderBy?: keywordGroupByArgs['orderBy'];
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
    }[OrderFields]>(args: Prisma.SubsetIntersection<T, keywordGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetKeywordGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>;
    readonly fields: keywordFieldRefs;
}
export interface Prisma__keywordClient<T, Null = never, ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise";
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): runtime.Types.Utils.JsPromise<TResult1 | TResult2>;
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): runtime.Types.Utils.JsPromise<T | TResult>;
    finally(onfinally?: (() => void) | undefined | null): runtime.Types.Utils.JsPromise<T>;
}
export interface keywordFieldRefs {
    readonly id: Prisma.FieldRef<"keyword", 'BigInt'>;
    readonly word: Prisma.FieldRef<"keyword", 'String'>;
    readonly declension: Prisma.FieldRef<"keyword", 'Int'>;
    readonly region: Prisma.FieldRef<"keyword", 'BigInt'>;
}
export type keywordFindUniqueArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.keywordSelect<ExtArgs> | null;
    omit?: Prisma.keywordOmit<ExtArgs> | null;
    where: Prisma.keywordWhereUniqueInput;
};
export type keywordFindUniqueOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.keywordSelect<ExtArgs> | null;
    omit?: Prisma.keywordOmit<ExtArgs> | null;
    where: Prisma.keywordWhereUniqueInput;
};
export type keywordFindFirstArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.keywordSelect<ExtArgs> | null;
    omit?: Prisma.keywordOmit<ExtArgs> | null;
    where?: Prisma.keywordWhereInput;
    orderBy?: Prisma.keywordOrderByWithRelationInput | Prisma.keywordOrderByWithRelationInput[];
    cursor?: Prisma.keywordWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.KeywordScalarFieldEnum | Prisma.KeywordScalarFieldEnum[];
};
export type keywordFindFirstOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.keywordSelect<ExtArgs> | null;
    omit?: Prisma.keywordOmit<ExtArgs> | null;
    where?: Prisma.keywordWhereInput;
    orderBy?: Prisma.keywordOrderByWithRelationInput | Prisma.keywordOrderByWithRelationInput[];
    cursor?: Prisma.keywordWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.KeywordScalarFieldEnum | Prisma.KeywordScalarFieldEnum[];
};
export type keywordFindManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.keywordSelect<ExtArgs> | null;
    omit?: Prisma.keywordOmit<ExtArgs> | null;
    where?: Prisma.keywordWhereInput;
    orderBy?: Prisma.keywordOrderByWithRelationInput | Prisma.keywordOrderByWithRelationInput[];
    cursor?: Prisma.keywordWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.KeywordScalarFieldEnum | Prisma.KeywordScalarFieldEnum[];
};
export type keywordCreateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.keywordSelect<ExtArgs> | null;
    omit?: Prisma.keywordOmit<ExtArgs> | null;
    data: Prisma.XOR<Prisma.keywordCreateInput, Prisma.keywordUncheckedCreateInput>;
};
export type keywordCreateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    data: Prisma.keywordCreateManyInput | Prisma.keywordCreateManyInput[];
    skipDuplicates?: boolean;
};
export type keywordCreateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.keywordSelectCreateManyAndReturn<ExtArgs> | null;
    omit?: Prisma.keywordOmit<ExtArgs> | null;
    data: Prisma.keywordCreateManyInput | Prisma.keywordCreateManyInput[];
    skipDuplicates?: boolean;
};
export type keywordUpdateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.keywordSelect<ExtArgs> | null;
    omit?: Prisma.keywordOmit<ExtArgs> | null;
    data: Prisma.XOR<Prisma.keywordUpdateInput, Prisma.keywordUncheckedUpdateInput>;
    where: Prisma.keywordWhereUniqueInput;
};
export type keywordUpdateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    data: Prisma.XOR<Prisma.keywordUpdateManyMutationInput, Prisma.keywordUncheckedUpdateManyInput>;
    where?: Prisma.keywordWhereInput;
    limit?: number;
};
export type keywordUpdateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.keywordSelectUpdateManyAndReturn<ExtArgs> | null;
    omit?: Prisma.keywordOmit<ExtArgs> | null;
    data: Prisma.XOR<Prisma.keywordUpdateManyMutationInput, Prisma.keywordUncheckedUpdateManyInput>;
    where?: Prisma.keywordWhereInput;
    limit?: number;
};
export type keywordUpsertArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.keywordSelect<ExtArgs> | null;
    omit?: Prisma.keywordOmit<ExtArgs> | null;
    where: Prisma.keywordWhereUniqueInput;
    create: Prisma.XOR<Prisma.keywordCreateInput, Prisma.keywordUncheckedCreateInput>;
    update: Prisma.XOR<Prisma.keywordUpdateInput, Prisma.keywordUncheckedUpdateInput>;
};
export type keywordDeleteArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.keywordSelect<ExtArgs> | null;
    omit?: Prisma.keywordOmit<ExtArgs> | null;
    where: Prisma.keywordWhereUniqueInput;
};
export type keywordDeleteManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.keywordWhereInput;
    limit?: number;
};
export type keywordDefaultArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.keywordSelect<ExtArgs> | null;
    omit?: Prisma.keywordOmit<ExtArgs> | null;
};
export {};
