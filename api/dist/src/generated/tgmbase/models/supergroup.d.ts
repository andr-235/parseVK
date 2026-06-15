import type * as runtime from "@prisma/client/runtime/client";
import type * as Prisma from "../internal/prismaNamespace.js";
export type supergroupModel = runtime.Types.Result.DefaultSelection<Prisma.$supergroupPayload>;
export type AggregateSupergroup = {
    _count: SupergroupCountAggregateOutputType | null;
    _avg: SupergroupAvgAggregateOutputType | null;
    _sum: SupergroupSumAggregateOutputType | null;
    _min: SupergroupMinAggregateOutputType | null;
    _max: SupergroupMaxAggregateOutputType | null;
};
export type SupergroupAvgAggregateOutputType = {
    id: number | null;
    supergroup_id: number | null;
    participants_count: number | null;
    scam: number | null;
    region: number | null;
};
export type SupergroupSumAggregateOutputType = {
    id: bigint | null;
    supergroup_id: bigint | null;
    participants_count: bigint | null;
    scam: number | null;
    region: number | null;
};
export type SupergroupMinAggregateOutputType = {
    id: bigint | null;
    supergroup_id: bigint | null;
    title: string | null;
    username: string | null;
    participants_count: bigint | null;
    scam: number | null;
    date: Date | null;
    region: number | null;
    description: string | null;
    upd_date: Date | null;
};
export type SupergroupMaxAggregateOutputType = {
    id: bigint | null;
    supergroup_id: bigint | null;
    title: string | null;
    username: string | null;
    participants_count: bigint | null;
    scam: number | null;
    date: Date | null;
    region: number | null;
    description: string | null;
    upd_date: Date | null;
};
export type SupergroupCountAggregateOutputType = {
    id: number;
    supergroup_id: number;
    title: number;
    username: number;
    participants_count: number;
    scam: number;
    date: number;
    region: number;
    description: number;
    upd_date: number;
    _all: number;
};
export type SupergroupAvgAggregateInputType = {
    id?: true;
    supergroup_id?: true;
    participants_count?: true;
    scam?: true;
    region?: true;
};
export type SupergroupSumAggregateInputType = {
    id?: true;
    supergroup_id?: true;
    participants_count?: true;
    scam?: true;
    region?: true;
};
export type SupergroupMinAggregateInputType = {
    id?: true;
    supergroup_id?: true;
    title?: true;
    username?: true;
    participants_count?: true;
    scam?: true;
    date?: true;
    region?: true;
    description?: true;
    upd_date?: true;
};
export type SupergroupMaxAggregateInputType = {
    id?: true;
    supergroup_id?: true;
    title?: true;
    username?: true;
    participants_count?: true;
    scam?: true;
    date?: true;
    region?: true;
    description?: true;
    upd_date?: true;
};
export type SupergroupCountAggregateInputType = {
    id?: true;
    supergroup_id?: true;
    title?: true;
    username?: true;
    participants_count?: true;
    scam?: true;
    date?: true;
    region?: true;
    description?: true;
    upd_date?: true;
    _all?: true;
};
export type SupergroupAggregateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.supergroupWhereInput;
    orderBy?: Prisma.supergroupOrderByWithRelationInput | Prisma.supergroupOrderByWithRelationInput[];
    cursor?: Prisma.supergroupWhereUniqueInput;
    take?: number;
    skip?: number;
    _count?: true | SupergroupCountAggregateInputType;
    _avg?: SupergroupAvgAggregateInputType;
    _sum?: SupergroupSumAggregateInputType;
    _min?: SupergroupMinAggregateInputType;
    _max?: SupergroupMaxAggregateInputType;
};
export type GetSupergroupAggregateType<T extends SupergroupAggregateArgs> = {
    [P in keyof T & keyof AggregateSupergroup]: P extends '_count' | 'count' ? T[P] extends true ? number : Prisma.GetScalarType<T[P], AggregateSupergroup[P]> : Prisma.GetScalarType<T[P], AggregateSupergroup[P]>;
};
export type supergroupGroupByArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.supergroupWhereInput;
    orderBy?: Prisma.supergroupOrderByWithAggregationInput | Prisma.supergroupOrderByWithAggregationInput[];
    by: Prisma.SupergroupScalarFieldEnum[] | Prisma.SupergroupScalarFieldEnum;
    having?: Prisma.supergroupScalarWhereWithAggregatesInput;
    take?: number;
    skip?: number;
    _count?: SupergroupCountAggregateInputType | true;
    _avg?: SupergroupAvgAggregateInputType;
    _sum?: SupergroupSumAggregateInputType;
    _min?: SupergroupMinAggregateInputType;
    _max?: SupergroupMaxAggregateInputType;
};
export type SupergroupGroupByOutputType = {
    id: bigint;
    supergroup_id: bigint;
    title: string;
    username: string | null;
    participants_count: bigint | null;
    scam: number;
    date: Date;
    region: number;
    description: string | null;
    upd_date: Date;
    _count: SupergroupCountAggregateOutputType | null;
    _avg: SupergroupAvgAggregateOutputType | null;
    _sum: SupergroupSumAggregateOutputType | null;
    _min: SupergroupMinAggregateOutputType | null;
    _max: SupergroupMaxAggregateOutputType | null;
};
type GetSupergroupGroupByPayload<T extends supergroupGroupByArgs> = Prisma.PrismaPromise<Array<Prisma.PickEnumerable<SupergroupGroupByOutputType, T['by']> & {
    [P in ((keyof T) & (keyof SupergroupGroupByOutputType))]: P extends '_count' ? T[P] extends boolean ? number : Prisma.GetScalarType<T[P], SupergroupGroupByOutputType[P]> : Prisma.GetScalarType<T[P], SupergroupGroupByOutputType[P]>;
}>>;
export type supergroupWhereInput = {
    AND?: Prisma.supergroupWhereInput | Prisma.supergroupWhereInput[];
    OR?: Prisma.supergroupWhereInput[];
    NOT?: Prisma.supergroupWhereInput | Prisma.supergroupWhereInput[];
    id?: Prisma.BigIntFilter<"supergroup"> | bigint | number;
    supergroup_id?: Prisma.BigIntFilter<"supergroup"> | bigint | number;
    title?: Prisma.StringFilter<"supergroup"> | string;
    username?: Prisma.StringNullableFilter<"supergroup"> | string | null;
    participants_count?: Prisma.BigIntNullableFilter<"supergroup"> | bigint | number | null;
    scam?: Prisma.IntFilter<"supergroup"> | number;
    date?: Prisma.DateTimeFilter<"supergroup"> | Date | string;
    region?: Prisma.IntFilter<"supergroup"> | number;
    description?: Prisma.StringNullableFilter<"supergroup"> | string | null;
    upd_date?: Prisma.DateTimeFilter<"supergroup"> | Date | string;
};
export type supergroupOrderByWithRelationInput = {
    id?: Prisma.SortOrder;
    supergroup_id?: Prisma.SortOrder;
    title?: Prisma.SortOrder;
    username?: Prisma.SortOrderInput | Prisma.SortOrder;
    participants_count?: Prisma.SortOrderInput | Prisma.SortOrder;
    scam?: Prisma.SortOrder;
    date?: Prisma.SortOrder;
    region?: Prisma.SortOrder;
    description?: Prisma.SortOrderInput | Prisma.SortOrder;
    upd_date?: Prisma.SortOrder;
};
export type supergroupWhereUniqueInput = Prisma.AtLeast<{
    id?: bigint | number;
    supergroup_id?: bigint | number;
    username?: string;
    AND?: Prisma.supergroupWhereInput | Prisma.supergroupWhereInput[];
    OR?: Prisma.supergroupWhereInput[];
    NOT?: Prisma.supergroupWhereInput | Prisma.supergroupWhereInput[];
    title?: Prisma.StringFilter<"supergroup"> | string;
    participants_count?: Prisma.BigIntNullableFilter<"supergroup"> | bigint | number | null;
    scam?: Prisma.IntFilter<"supergroup"> | number;
    date?: Prisma.DateTimeFilter<"supergroup"> | Date | string;
    region?: Prisma.IntFilter<"supergroup"> | number;
    description?: Prisma.StringNullableFilter<"supergroup"> | string | null;
    upd_date?: Prisma.DateTimeFilter<"supergroup"> | Date | string;
}, "id" | "supergroup_id" | "username">;
export type supergroupOrderByWithAggregationInput = {
    id?: Prisma.SortOrder;
    supergroup_id?: Prisma.SortOrder;
    title?: Prisma.SortOrder;
    username?: Prisma.SortOrderInput | Prisma.SortOrder;
    participants_count?: Prisma.SortOrderInput | Prisma.SortOrder;
    scam?: Prisma.SortOrder;
    date?: Prisma.SortOrder;
    region?: Prisma.SortOrder;
    description?: Prisma.SortOrderInput | Prisma.SortOrder;
    upd_date?: Prisma.SortOrder;
    _count?: Prisma.supergroupCountOrderByAggregateInput;
    _avg?: Prisma.supergroupAvgOrderByAggregateInput;
    _max?: Prisma.supergroupMaxOrderByAggregateInput;
    _min?: Prisma.supergroupMinOrderByAggregateInput;
    _sum?: Prisma.supergroupSumOrderByAggregateInput;
};
export type supergroupScalarWhereWithAggregatesInput = {
    AND?: Prisma.supergroupScalarWhereWithAggregatesInput | Prisma.supergroupScalarWhereWithAggregatesInput[];
    OR?: Prisma.supergroupScalarWhereWithAggregatesInput[];
    NOT?: Prisma.supergroupScalarWhereWithAggregatesInput | Prisma.supergroupScalarWhereWithAggregatesInput[];
    id?: Prisma.BigIntWithAggregatesFilter<"supergroup"> | bigint | number;
    supergroup_id?: Prisma.BigIntWithAggregatesFilter<"supergroup"> | bigint | number;
    title?: Prisma.StringWithAggregatesFilter<"supergroup"> | string;
    username?: Prisma.StringNullableWithAggregatesFilter<"supergroup"> | string | null;
    participants_count?: Prisma.BigIntNullableWithAggregatesFilter<"supergroup"> | bigint | number | null;
    scam?: Prisma.IntWithAggregatesFilter<"supergroup"> | number;
    date?: Prisma.DateTimeWithAggregatesFilter<"supergroup"> | Date | string;
    region?: Prisma.IntWithAggregatesFilter<"supergroup"> | number;
    description?: Prisma.StringNullableWithAggregatesFilter<"supergroup"> | string | null;
    upd_date?: Prisma.DateTimeWithAggregatesFilter<"supergroup"> | Date | string;
};
export type supergroupCreateInput = {
    id?: bigint | number;
    supergroup_id: bigint | number;
    title: string;
    username?: string | null;
    participants_count?: bigint | number | null;
    scam: number;
    date: Date | string;
    region?: number;
    description?: string | null;
    upd_date?: Date | string;
};
export type supergroupUncheckedCreateInput = {
    id?: bigint | number;
    supergroup_id: bigint | number;
    title: string;
    username?: string | null;
    participants_count?: bigint | number | null;
    scam: number;
    date: Date | string;
    region?: number;
    description?: string | null;
    upd_date?: Date | string;
};
export type supergroupUpdateInput = {
    id?: Prisma.BigIntFieldUpdateOperationsInput | bigint | number;
    supergroup_id?: Prisma.BigIntFieldUpdateOperationsInput | bigint | number;
    title?: Prisma.StringFieldUpdateOperationsInput | string;
    username?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    participants_count?: Prisma.NullableBigIntFieldUpdateOperationsInput | bigint | number | null;
    scam?: Prisma.IntFieldUpdateOperationsInput | number;
    date?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    region?: Prisma.IntFieldUpdateOperationsInput | number;
    description?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    upd_date?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type supergroupUncheckedUpdateInput = {
    id?: Prisma.BigIntFieldUpdateOperationsInput | bigint | number;
    supergroup_id?: Prisma.BigIntFieldUpdateOperationsInput | bigint | number;
    title?: Prisma.StringFieldUpdateOperationsInput | string;
    username?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    participants_count?: Prisma.NullableBigIntFieldUpdateOperationsInput | bigint | number | null;
    scam?: Prisma.IntFieldUpdateOperationsInput | number;
    date?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    region?: Prisma.IntFieldUpdateOperationsInput | number;
    description?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    upd_date?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type supergroupCreateManyInput = {
    id?: bigint | number;
    supergroup_id: bigint | number;
    title: string;
    username?: string | null;
    participants_count?: bigint | number | null;
    scam: number;
    date: Date | string;
    region?: number;
    description?: string | null;
    upd_date?: Date | string;
};
export type supergroupUpdateManyMutationInput = {
    id?: Prisma.BigIntFieldUpdateOperationsInput | bigint | number;
    supergroup_id?: Prisma.BigIntFieldUpdateOperationsInput | bigint | number;
    title?: Prisma.StringFieldUpdateOperationsInput | string;
    username?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    participants_count?: Prisma.NullableBigIntFieldUpdateOperationsInput | bigint | number | null;
    scam?: Prisma.IntFieldUpdateOperationsInput | number;
    date?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    region?: Prisma.IntFieldUpdateOperationsInput | number;
    description?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    upd_date?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type supergroupUncheckedUpdateManyInput = {
    id?: Prisma.BigIntFieldUpdateOperationsInput | bigint | number;
    supergroup_id?: Prisma.BigIntFieldUpdateOperationsInput | bigint | number;
    title?: Prisma.StringFieldUpdateOperationsInput | string;
    username?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    participants_count?: Prisma.NullableBigIntFieldUpdateOperationsInput | bigint | number | null;
    scam?: Prisma.IntFieldUpdateOperationsInput | number;
    date?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    region?: Prisma.IntFieldUpdateOperationsInput | number;
    description?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    upd_date?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type supergroupCountOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    supergroup_id?: Prisma.SortOrder;
    title?: Prisma.SortOrder;
    username?: Prisma.SortOrder;
    participants_count?: Prisma.SortOrder;
    scam?: Prisma.SortOrder;
    date?: Prisma.SortOrder;
    region?: Prisma.SortOrder;
    description?: Prisma.SortOrder;
    upd_date?: Prisma.SortOrder;
};
export type supergroupAvgOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    supergroup_id?: Prisma.SortOrder;
    participants_count?: Prisma.SortOrder;
    scam?: Prisma.SortOrder;
    region?: Prisma.SortOrder;
};
export type supergroupMaxOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    supergroup_id?: Prisma.SortOrder;
    title?: Prisma.SortOrder;
    username?: Prisma.SortOrder;
    participants_count?: Prisma.SortOrder;
    scam?: Prisma.SortOrder;
    date?: Prisma.SortOrder;
    region?: Prisma.SortOrder;
    description?: Prisma.SortOrder;
    upd_date?: Prisma.SortOrder;
};
export type supergroupMinOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    supergroup_id?: Prisma.SortOrder;
    title?: Prisma.SortOrder;
    username?: Prisma.SortOrder;
    participants_count?: Prisma.SortOrder;
    scam?: Prisma.SortOrder;
    date?: Prisma.SortOrder;
    region?: Prisma.SortOrder;
    description?: Prisma.SortOrder;
    upd_date?: Prisma.SortOrder;
};
export type supergroupSumOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    supergroup_id?: Prisma.SortOrder;
    participants_count?: Prisma.SortOrder;
    scam?: Prisma.SortOrder;
    region?: Prisma.SortOrder;
};
export type supergroupSelect<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    supergroup_id?: boolean;
    title?: boolean;
    username?: boolean;
    participants_count?: boolean;
    scam?: boolean;
    date?: boolean;
    region?: boolean;
    description?: boolean;
    upd_date?: boolean;
}, ExtArgs["result"]["supergroup"]>;
export type supergroupSelectCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    supergroup_id?: boolean;
    title?: boolean;
    username?: boolean;
    participants_count?: boolean;
    scam?: boolean;
    date?: boolean;
    region?: boolean;
    description?: boolean;
    upd_date?: boolean;
}, ExtArgs["result"]["supergroup"]>;
export type supergroupSelectUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    supergroup_id?: boolean;
    title?: boolean;
    username?: boolean;
    participants_count?: boolean;
    scam?: boolean;
    date?: boolean;
    region?: boolean;
    description?: boolean;
    upd_date?: boolean;
}, ExtArgs["result"]["supergroup"]>;
export type supergroupSelectScalar = {
    id?: boolean;
    supergroup_id?: boolean;
    title?: boolean;
    username?: boolean;
    participants_count?: boolean;
    scam?: boolean;
    date?: boolean;
    region?: boolean;
    description?: boolean;
    upd_date?: boolean;
};
export type supergroupOmit<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetOmit<"id" | "supergroup_id" | "title" | "username" | "participants_count" | "scam" | "date" | "region" | "description" | "upd_date", ExtArgs["result"]["supergroup"]>;
export type $supergroupPayload<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    name: "supergroup";
    objects: {};
    scalars: runtime.Types.Extensions.GetPayloadResult<{
        id: bigint;
        supergroup_id: bigint;
        title: string;
        username: string | null;
        participants_count: bigint | null;
        scam: number;
        date: Date;
        region: number;
        description: string | null;
        upd_date: Date;
    }, ExtArgs["result"]["supergroup"]>;
    composites: {};
};
export type supergroupGetPayload<S extends boolean | null | undefined | supergroupDefaultArgs> = runtime.Types.Result.GetResult<Prisma.$supergroupPayload, S>;
export type supergroupCountArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = Omit<supergroupFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
    select?: SupergroupCountAggregateInputType | true;
};
export interface supergroupDelegate<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: {
        types: Prisma.TypeMap<ExtArgs>['model']['supergroup'];
        meta: {
            name: 'supergroup';
        };
    };
    findUnique<T extends supergroupFindUniqueArgs>(args: Prisma.SelectSubset<T, supergroupFindUniqueArgs<ExtArgs>>): Prisma.Prisma__supergroupClient<runtime.Types.Result.GetResult<Prisma.$supergroupPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    findUniqueOrThrow<T extends supergroupFindUniqueOrThrowArgs>(args: Prisma.SelectSubset<T, supergroupFindUniqueOrThrowArgs<ExtArgs>>): Prisma.Prisma__supergroupClient<runtime.Types.Result.GetResult<Prisma.$supergroupPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    findFirst<T extends supergroupFindFirstArgs>(args?: Prisma.SelectSubset<T, supergroupFindFirstArgs<ExtArgs>>): Prisma.Prisma__supergroupClient<runtime.Types.Result.GetResult<Prisma.$supergroupPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    findFirstOrThrow<T extends supergroupFindFirstOrThrowArgs>(args?: Prisma.SelectSubset<T, supergroupFindFirstOrThrowArgs<ExtArgs>>): Prisma.Prisma__supergroupClient<runtime.Types.Result.GetResult<Prisma.$supergroupPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    findMany<T extends supergroupFindManyArgs>(args?: Prisma.SelectSubset<T, supergroupFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$supergroupPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>;
    create<T extends supergroupCreateArgs>(args: Prisma.SelectSubset<T, supergroupCreateArgs<ExtArgs>>): Prisma.Prisma__supergroupClient<runtime.Types.Result.GetResult<Prisma.$supergroupPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    createMany<T extends supergroupCreateManyArgs>(args?: Prisma.SelectSubset<T, supergroupCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    createManyAndReturn<T extends supergroupCreateManyAndReturnArgs>(args?: Prisma.SelectSubset<T, supergroupCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$supergroupPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>;
    delete<T extends supergroupDeleteArgs>(args: Prisma.SelectSubset<T, supergroupDeleteArgs<ExtArgs>>): Prisma.Prisma__supergroupClient<runtime.Types.Result.GetResult<Prisma.$supergroupPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    update<T extends supergroupUpdateArgs>(args: Prisma.SelectSubset<T, supergroupUpdateArgs<ExtArgs>>): Prisma.Prisma__supergroupClient<runtime.Types.Result.GetResult<Prisma.$supergroupPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    deleteMany<T extends supergroupDeleteManyArgs>(args?: Prisma.SelectSubset<T, supergroupDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    updateMany<T extends supergroupUpdateManyArgs>(args: Prisma.SelectSubset<T, supergroupUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    updateManyAndReturn<T extends supergroupUpdateManyAndReturnArgs>(args: Prisma.SelectSubset<T, supergroupUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$supergroupPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>;
    upsert<T extends supergroupUpsertArgs>(args: Prisma.SelectSubset<T, supergroupUpsertArgs<ExtArgs>>): Prisma.Prisma__supergroupClient<runtime.Types.Result.GetResult<Prisma.$supergroupPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    count<T extends supergroupCountArgs>(args?: Prisma.Subset<T, supergroupCountArgs>): Prisma.PrismaPromise<T extends runtime.Types.Utils.Record<'select', any> ? T['select'] extends true ? number : Prisma.GetScalarType<T['select'], SupergroupCountAggregateOutputType> : number>;
    aggregate<T extends SupergroupAggregateArgs>(args: Prisma.Subset<T, SupergroupAggregateArgs>): Prisma.PrismaPromise<GetSupergroupAggregateType<T>>;
    groupBy<T extends supergroupGroupByArgs, HasSelectOrTake extends Prisma.Or<Prisma.Extends<'skip', Prisma.Keys<T>>, Prisma.Extends<'take', Prisma.Keys<T>>>, OrderByArg extends Prisma.True extends HasSelectOrTake ? {
        orderBy: supergroupGroupByArgs['orderBy'];
    } : {
        orderBy?: supergroupGroupByArgs['orderBy'];
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
    }[OrderFields]>(args: Prisma.SubsetIntersection<T, supergroupGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetSupergroupGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>;
    readonly fields: supergroupFieldRefs;
}
export interface Prisma__supergroupClient<T, Null = never, ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise";
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): runtime.Types.Utils.JsPromise<TResult1 | TResult2>;
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): runtime.Types.Utils.JsPromise<T | TResult>;
    finally(onfinally?: (() => void) | undefined | null): runtime.Types.Utils.JsPromise<T>;
}
export interface supergroupFieldRefs {
    readonly id: Prisma.FieldRef<"supergroup", 'BigInt'>;
    readonly supergroup_id: Prisma.FieldRef<"supergroup", 'BigInt'>;
    readonly title: Prisma.FieldRef<"supergroup", 'String'>;
    readonly username: Prisma.FieldRef<"supergroup", 'String'>;
    readonly participants_count: Prisma.FieldRef<"supergroup", 'BigInt'>;
    readonly scam: Prisma.FieldRef<"supergroup", 'Int'>;
    readonly date: Prisma.FieldRef<"supergroup", 'DateTime'>;
    readonly region: Prisma.FieldRef<"supergroup", 'Int'>;
    readonly description: Prisma.FieldRef<"supergroup", 'String'>;
    readonly upd_date: Prisma.FieldRef<"supergroup", 'DateTime'>;
}
export type supergroupFindUniqueArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.supergroupSelect<ExtArgs> | null;
    omit?: Prisma.supergroupOmit<ExtArgs> | null;
    where: Prisma.supergroupWhereUniqueInput;
};
export type supergroupFindUniqueOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.supergroupSelect<ExtArgs> | null;
    omit?: Prisma.supergroupOmit<ExtArgs> | null;
    where: Prisma.supergroupWhereUniqueInput;
};
export type supergroupFindFirstArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.supergroupSelect<ExtArgs> | null;
    omit?: Prisma.supergroupOmit<ExtArgs> | null;
    where?: Prisma.supergroupWhereInput;
    orderBy?: Prisma.supergroupOrderByWithRelationInput | Prisma.supergroupOrderByWithRelationInput[];
    cursor?: Prisma.supergroupWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.SupergroupScalarFieldEnum | Prisma.SupergroupScalarFieldEnum[];
};
export type supergroupFindFirstOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.supergroupSelect<ExtArgs> | null;
    omit?: Prisma.supergroupOmit<ExtArgs> | null;
    where?: Prisma.supergroupWhereInput;
    orderBy?: Prisma.supergroupOrderByWithRelationInput | Prisma.supergroupOrderByWithRelationInput[];
    cursor?: Prisma.supergroupWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.SupergroupScalarFieldEnum | Prisma.SupergroupScalarFieldEnum[];
};
export type supergroupFindManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.supergroupSelect<ExtArgs> | null;
    omit?: Prisma.supergroupOmit<ExtArgs> | null;
    where?: Prisma.supergroupWhereInput;
    orderBy?: Prisma.supergroupOrderByWithRelationInput | Prisma.supergroupOrderByWithRelationInput[];
    cursor?: Prisma.supergroupWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.SupergroupScalarFieldEnum | Prisma.SupergroupScalarFieldEnum[];
};
export type supergroupCreateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.supergroupSelect<ExtArgs> | null;
    omit?: Prisma.supergroupOmit<ExtArgs> | null;
    data: Prisma.XOR<Prisma.supergroupCreateInput, Prisma.supergroupUncheckedCreateInput>;
};
export type supergroupCreateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    data: Prisma.supergroupCreateManyInput | Prisma.supergroupCreateManyInput[];
    skipDuplicates?: boolean;
};
export type supergroupCreateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.supergroupSelectCreateManyAndReturn<ExtArgs> | null;
    omit?: Prisma.supergroupOmit<ExtArgs> | null;
    data: Prisma.supergroupCreateManyInput | Prisma.supergroupCreateManyInput[];
    skipDuplicates?: boolean;
};
export type supergroupUpdateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.supergroupSelect<ExtArgs> | null;
    omit?: Prisma.supergroupOmit<ExtArgs> | null;
    data: Prisma.XOR<Prisma.supergroupUpdateInput, Prisma.supergroupUncheckedUpdateInput>;
    where: Prisma.supergroupWhereUniqueInput;
};
export type supergroupUpdateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    data: Prisma.XOR<Prisma.supergroupUpdateManyMutationInput, Prisma.supergroupUncheckedUpdateManyInput>;
    where?: Prisma.supergroupWhereInput;
    limit?: number;
};
export type supergroupUpdateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.supergroupSelectUpdateManyAndReturn<ExtArgs> | null;
    omit?: Prisma.supergroupOmit<ExtArgs> | null;
    data: Prisma.XOR<Prisma.supergroupUpdateManyMutationInput, Prisma.supergroupUncheckedUpdateManyInput>;
    where?: Prisma.supergroupWhereInput;
    limit?: number;
};
export type supergroupUpsertArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.supergroupSelect<ExtArgs> | null;
    omit?: Prisma.supergroupOmit<ExtArgs> | null;
    where: Prisma.supergroupWhereUniqueInput;
    create: Prisma.XOR<Prisma.supergroupCreateInput, Prisma.supergroupUncheckedCreateInput>;
    update: Prisma.XOR<Prisma.supergroupUpdateInput, Prisma.supergroupUncheckedUpdateInput>;
};
export type supergroupDeleteArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.supergroupSelect<ExtArgs> | null;
    omit?: Prisma.supergroupOmit<ExtArgs> | null;
    where: Prisma.supergroupWhereUniqueInput;
};
export type supergroupDeleteManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.supergroupWhereInput;
    limit?: number;
};
export type supergroupDefaultArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.supergroupSelect<ExtArgs> | null;
    omit?: Prisma.supergroupOmit<ExtArgs> | null;
};
export {};
