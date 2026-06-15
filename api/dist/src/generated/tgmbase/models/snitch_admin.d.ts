import type * as runtime from "@prisma/client/runtime/client";
import type * as Prisma from "../internal/prismaNamespace.js";
export type snitch_adminModel = runtime.Types.Result.DefaultSelection<Prisma.$snitch_adminPayload>;
export type AggregateSnitch_admin = {
    _count: Snitch_adminCountAggregateOutputType | null;
    _avg: Snitch_adminAvgAggregateOutputType | null;
    _sum: Snitch_adminSumAggregateOutputType | null;
    _min: Snitch_adminMinAggregateOutputType | null;
    _max: Snitch_adminMaxAggregateOutputType | null;
};
export type Snitch_adminAvgAggregateOutputType = {
    id: number | null;
};
export type Snitch_adminSumAggregateOutputType = {
    id: bigint | null;
};
export type Snitch_adminMinAggregateOutputType = {
    id: bigint | null;
    login: string | null;
    password: string | null;
    last_login: Date | null;
};
export type Snitch_adminMaxAggregateOutputType = {
    id: bigint | null;
    login: string | null;
    password: string | null;
    last_login: Date | null;
};
export type Snitch_adminCountAggregateOutputType = {
    id: number;
    login: number;
    password: number;
    last_login: number;
    _all: number;
};
export type Snitch_adminAvgAggregateInputType = {
    id?: true;
};
export type Snitch_adminSumAggregateInputType = {
    id?: true;
};
export type Snitch_adminMinAggregateInputType = {
    id?: true;
    login?: true;
    password?: true;
    last_login?: true;
};
export type Snitch_adminMaxAggregateInputType = {
    id?: true;
    login?: true;
    password?: true;
    last_login?: true;
};
export type Snitch_adminCountAggregateInputType = {
    id?: true;
    login?: true;
    password?: true;
    last_login?: true;
    _all?: true;
};
export type Snitch_adminAggregateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.snitch_adminWhereInput;
    orderBy?: Prisma.snitch_adminOrderByWithRelationInput | Prisma.snitch_adminOrderByWithRelationInput[];
    cursor?: Prisma.snitch_adminWhereUniqueInput;
    take?: number;
    skip?: number;
    _count?: true | Snitch_adminCountAggregateInputType;
    _avg?: Snitch_adminAvgAggregateInputType;
    _sum?: Snitch_adminSumAggregateInputType;
    _min?: Snitch_adminMinAggregateInputType;
    _max?: Snitch_adminMaxAggregateInputType;
};
export type GetSnitch_adminAggregateType<T extends Snitch_adminAggregateArgs> = {
    [P in keyof T & keyof AggregateSnitch_admin]: P extends '_count' | 'count' ? T[P] extends true ? number : Prisma.GetScalarType<T[P], AggregateSnitch_admin[P]> : Prisma.GetScalarType<T[P], AggregateSnitch_admin[P]>;
};
export type snitch_adminGroupByArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.snitch_adminWhereInput;
    orderBy?: Prisma.snitch_adminOrderByWithAggregationInput | Prisma.snitch_adminOrderByWithAggregationInput[];
    by: Prisma.Snitch_adminScalarFieldEnum[] | Prisma.Snitch_adminScalarFieldEnum;
    having?: Prisma.snitch_adminScalarWhereWithAggregatesInput;
    take?: number;
    skip?: number;
    _count?: Snitch_adminCountAggregateInputType | true;
    _avg?: Snitch_adminAvgAggregateInputType;
    _sum?: Snitch_adminSumAggregateInputType;
    _min?: Snitch_adminMinAggregateInputType;
    _max?: Snitch_adminMaxAggregateInputType;
};
export type Snitch_adminGroupByOutputType = {
    id: bigint;
    login: string;
    password: string;
    last_login: Date | null;
    _count: Snitch_adminCountAggregateOutputType | null;
    _avg: Snitch_adminAvgAggregateOutputType | null;
    _sum: Snitch_adminSumAggregateOutputType | null;
    _min: Snitch_adminMinAggregateOutputType | null;
    _max: Snitch_adminMaxAggregateOutputType | null;
};
type GetSnitch_adminGroupByPayload<T extends snitch_adminGroupByArgs> = Prisma.PrismaPromise<Array<Prisma.PickEnumerable<Snitch_adminGroupByOutputType, T['by']> & {
    [P in ((keyof T) & (keyof Snitch_adminGroupByOutputType))]: P extends '_count' ? T[P] extends boolean ? number : Prisma.GetScalarType<T[P], Snitch_adminGroupByOutputType[P]> : Prisma.GetScalarType<T[P], Snitch_adminGroupByOutputType[P]>;
}>>;
export type snitch_adminWhereInput = {
    AND?: Prisma.snitch_adminWhereInput | Prisma.snitch_adminWhereInput[];
    OR?: Prisma.snitch_adminWhereInput[];
    NOT?: Prisma.snitch_adminWhereInput | Prisma.snitch_adminWhereInput[];
    id?: Prisma.BigIntFilter<"snitch_admin"> | bigint | number;
    login?: Prisma.StringFilter<"snitch_admin"> | string;
    password?: Prisma.StringFilter<"snitch_admin"> | string;
    last_login?: Prisma.DateTimeNullableFilter<"snitch_admin"> | Date | string | null;
};
export type snitch_adminOrderByWithRelationInput = {
    id?: Prisma.SortOrder;
    login?: Prisma.SortOrder;
    password?: Prisma.SortOrder;
    last_login?: Prisma.SortOrderInput | Prisma.SortOrder;
};
export type snitch_adminWhereUniqueInput = Prisma.AtLeast<{
    id?: bigint | number;
    AND?: Prisma.snitch_adminWhereInput | Prisma.snitch_adminWhereInput[];
    OR?: Prisma.snitch_adminWhereInput[];
    NOT?: Prisma.snitch_adminWhereInput | Prisma.snitch_adminWhereInput[];
    login?: Prisma.StringFilter<"snitch_admin"> | string;
    password?: Prisma.StringFilter<"snitch_admin"> | string;
    last_login?: Prisma.DateTimeNullableFilter<"snitch_admin"> | Date | string | null;
}, "id">;
export type snitch_adminOrderByWithAggregationInput = {
    id?: Prisma.SortOrder;
    login?: Prisma.SortOrder;
    password?: Prisma.SortOrder;
    last_login?: Prisma.SortOrderInput | Prisma.SortOrder;
    _count?: Prisma.snitch_adminCountOrderByAggregateInput;
    _avg?: Prisma.snitch_adminAvgOrderByAggregateInput;
    _max?: Prisma.snitch_adminMaxOrderByAggregateInput;
    _min?: Prisma.snitch_adminMinOrderByAggregateInput;
    _sum?: Prisma.snitch_adminSumOrderByAggregateInput;
};
export type snitch_adminScalarWhereWithAggregatesInput = {
    AND?: Prisma.snitch_adminScalarWhereWithAggregatesInput | Prisma.snitch_adminScalarWhereWithAggregatesInput[];
    OR?: Prisma.snitch_adminScalarWhereWithAggregatesInput[];
    NOT?: Prisma.snitch_adminScalarWhereWithAggregatesInput | Prisma.snitch_adminScalarWhereWithAggregatesInput[];
    id?: Prisma.BigIntWithAggregatesFilter<"snitch_admin"> | bigint | number;
    login?: Prisma.StringWithAggregatesFilter<"snitch_admin"> | string;
    password?: Prisma.StringWithAggregatesFilter<"snitch_admin"> | string;
    last_login?: Prisma.DateTimeNullableWithAggregatesFilter<"snitch_admin"> | Date | string | null;
};
export type snitch_adminCreateInput = {
    id?: bigint | number;
    login: string;
    password: string;
    last_login?: Date | string | null;
};
export type snitch_adminUncheckedCreateInput = {
    id?: bigint | number;
    login: string;
    password: string;
    last_login?: Date | string | null;
};
export type snitch_adminUpdateInput = {
    id?: Prisma.BigIntFieldUpdateOperationsInput | bigint | number;
    login?: Prisma.StringFieldUpdateOperationsInput | string;
    password?: Prisma.StringFieldUpdateOperationsInput | string;
    last_login?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
};
export type snitch_adminUncheckedUpdateInput = {
    id?: Prisma.BigIntFieldUpdateOperationsInput | bigint | number;
    login?: Prisma.StringFieldUpdateOperationsInput | string;
    password?: Prisma.StringFieldUpdateOperationsInput | string;
    last_login?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
};
export type snitch_adminCreateManyInput = {
    id?: bigint | number;
    login: string;
    password: string;
    last_login?: Date | string | null;
};
export type snitch_adminUpdateManyMutationInput = {
    id?: Prisma.BigIntFieldUpdateOperationsInput | bigint | number;
    login?: Prisma.StringFieldUpdateOperationsInput | string;
    password?: Prisma.StringFieldUpdateOperationsInput | string;
    last_login?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
};
export type snitch_adminUncheckedUpdateManyInput = {
    id?: Prisma.BigIntFieldUpdateOperationsInput | bigint | number;
    login?: Prisma.StringFieldUpdateOperationsInput | string;
    password?: Prisma.StringFieldUpdateOperationsInput | string;
    last_login?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
};
export type snitch_adminCountOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    login?: Prisma.SortOrder;
    password?: Prisma.SortOrder;
    last_login?: Prisma.SortOrder;
};
export type snitch_adminAvgOrderByAggregateInput = {
    id?: Prisma.SortOrder;
};
export type snitch_adminMaxOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    login?: Prisma.SortOrder;
    password?: Prisma.SortOrder;
    last_login?: Prisma.SortOrder;
};
export type snitch_adminMinOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    login?: Prisma.SortOrder;
    password?: Prisma.SortOrder;
    last_login?: Prisma.SortOrder;
};
export type snitch_adminSumOrderByAggregateInput = {
    id?: Prisma.SortOrder;
};
export type snitch_adminSelect<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    login?: boolean;
    password?: boolean;
    last_login?: boolean;
}, ExtArgs["result"]["snitch_admin"]>;
export type snitch_adminSelectCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    login?: boolean;
    password?: boolean;
    last_login?: boolean;
}, ExtArgs["result"]["snitch_admin"]>;
export type snitch_adminSelectUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    login?: boolean;
    password?: boolean;
    last_login?: boolean;
}, ExtArgs["result"]["snitch_admin"]>;
export type snitch_adminSelectScalar = {
    id?: boolean;
    login?: boolean;
    password?: boolean;
    last_login?: boolean;
};
export type snitch_adminOmit<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetOmit<"id" | "login" | "password" | "last_login", ExtArgs["result"]["snitch_admin"]>;
export type $snitch_adminPayload<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    name: "snitch_admin";
    objects: {};
    scalars: runtime.Types.Extensions.GetPayloadResult<{
        id: bigint;
        login: string;
        password: string;
        last_login: Date | null;
    }, ExtArgs["result"]["snitch_admin"]>;
    composites: {};
};
export type snitch_adminGetPayload<S extends boolean | null | undefined | snitch_adminDefaultArgs> = runtime.Types.Result.GetResult<Prisma.$snitch_adminPayload, S>;
export type snitch_adminCountArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = Omit<snitch_adminFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
    select?: Snitch_adminCountAggregateInputType | true;
};
export interface snitch_adminDelegate<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: {
        types: Prisma.TypeMap<ExtArgs>['model']['snitch_admin'];
        meta: {
            name: 'snitch_admin';
        };
    };
    findUnique<T extends snitch_adminFindUniqueArgs>(args: Prisma.SelectSubset<T, snitch_adminFindUniqueArgs<ExtArgs>>): Prisma.Prisma__snitch_adminClient<runtime.Types.Result.GetResult<Prisma.$snitch_adminPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    findUniqueOrThrow<T extends snitch_adminFindUniqueOrThrowArgs>(args: Prisma.SelectSubset<T, snitch_adminFindUniqueOrThrowArgs<ExtArgs>>): Prisma.Prisma__snitch_adminClient<runtime.Types.Result.GetResult<Prisma.$snitch_adminPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    findFirst<T extends snitch_adminFindFirstArgs>(args?: Prisma.SelectSubset<T, snitch_adminFindFirstArgs<ExtArgs>>): Prisma.Prisma__snitch_adminClient<runtime.Types.Result.GetResult<Prisma.$snitch_adminPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    findFirstOrThrow<T extends snitch_adminFindFirstOrThrowArgs>(args?: Prisma.SelectSubset<T, snitch_adminFindFirstOrThrowArgs<ExtArgs>>): Prisma.Prisma__snitch_adminClient<runtime.Types.Result.GetResult<Prisma.$snitch_adminPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    findMany<T extends snitch_adminFindManyArgs>(args?: Prisma.SelectSubset<T, snitch_adminFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$snitch_adminPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>;
    create<T extends snitch_adminCreateArgs>(args: Prisma.SelectSubset<T, snitch_adminCreateArgs<ExtArgs>>): Prisma.Prisma__snitch_adminClient<runtime.Types.Result.GetResult<Prisma.$snitch_adminPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    createMany<T extends snitch_adminCreateManyArgs>(args?: Prisma.SelectSubset<T, snitch_adminCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    createManyAndReturn<T extends snitch_adminCreateManyAndReturnArgs>(args?: Prisma.SelectSubset<T, snitch_adminCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$snitch_adminPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>;
    delete<T extends snitch_adminDeleteArgs>(args: Prisma.SelectSubset<T, snitch_adminDeleteArgs<ExtArgs>>): Prisma.Prisma__snitch_adminClient<runtime.Types.Result.GetResult<Prisma.$snitch_adminPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    update<T extends snitch_adminUpdateArgs>(args: Prisma.SelectSubset<T, snitch_adminUpdateArgs<ExtArgs>>): Prisma.Prisma__snitch_adminClient<runtime.Types.Result.GetResult<Prisma.$snitch_adminPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    deleteMany<T extends snitch_adminDeleteManyArgs>(args?: Prisma.SelectSubset<T, snitch_adminDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    updateMany<T extends snitch_adminUpdateManyArgs>(args: Prisma.SelectSubset<T, snitch_adminUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    updateManyAndReturn<T extends snitch_adminUpdateManyAndReturnArgs>(args: Prisma.SelectSubset<T, snitch_adminUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$snitch_adminPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>;
    upsert<T extends snitch_adminUpsertArgs>(args: Prisma.SelectSubset<T, snitch_adminUpsertArgs<ExtArgs>>): Prisma.Prisma__snitch_adminClient<runtime.Types.Result.GetResult<Prisma.$snitch_adminPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    count<T extends snitch_adminCountArgs>(args?: Prisma.Subset<T, snitch_adminCountArgs>): Prisma.PrismaPromise<T extends runtime.Types.Utils.Record<'select', any> ? T['select'] extends true ? number : Prisma.GetScalarType<T['select'], Snitch_adminCountAggregateOutputType> : number>;
    aggregate<T extends Snitch_adminAggregateArgs>(args: Prisma.Subset<T, Snitch_adminAggregateArgs>): Prisma.PrismaPromise<GetSnitch_adminAggregateType<T>>;
    groupBy<T extends snitch_adminGroupByArgs, HasSelectOrTake extends Prisma.Or<Prisma.Extends<'skip', Prisma.Keys<T>>, Prisma.Extends<'take', Prisma.Keys<T>>>, OrderByArg extends Prisma.True extends HasSelectOrTake ? {
        orderBy: snitch_adminGroupByArgs['orderBy'];
    } : {
        orderBy?: snitch_adminGroupByArgs['orderBy'];
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
    }[OrderFields]>(args: Prisma.SubsetIntersection<T, snitch_adminGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetSnitch_adminGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>;
    readonly fields: snitch_adminFieldRefs;
}
export interface Prisma__snitch_adminClient<T, Null = never, ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise";
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): runtime.Types.Utils.JsPromise<TResult1 | TResult2>;
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): runtime.Types.Utils.JsPromise<T | TResult>;
    finally(onfinally?: (() => void) | undefined | null): runtime.Types.Utils.JsPromise<T>;
}
export interface snitch_adminFieldRefs {
    readonly id: Prisma.FieldRef<"snitch_admin", 'BigInt'>;
    readonly login: Prisma.FieldRef<"snitch_admin", 'String'>;
    readonly password: Prisma.FieldRef<"snitch_admin", 'String'>;
    readonly last_login: Prisma.FieldRef<"snitch_admin", 'DateTime'>;
}
export type snitch_adminFindUniqueArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.snitch_adminSelect<ExtArgs> | null;
    omit?: Prisma.snitch_adminOmit<ExtArgs> | null;
    where: Prisma.snitch_adminWhereUniqueInput;
};
export type snitch_adminFindUniqueOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.snitch_adminSelect<ExtArgs> | null;
    omit?: Prisma.snitch_adminOmit<ExtArgs> | null;
    where: Prisma.snitch_adminWhereUniqueInput;
};
export type snitch_adminFindFirstArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.snitch_adminSelect<ExtArgs> | null;
    omit?: Prisma.snitch_adminOmit<ExtArgs> | null;
    where?: Prisma.snitch_adminWhereInput;
    orderBy?: Prisma.snitch_adminOrderByWithRelationInput | Prisma.snitch_adminOrderByWithRelationInput[];
    cursor?: Prisma.snitch_adminWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.Snitch_adminScalarFieldEnum | Prisma.Snitch_adminScalarFieldEnum[];
};
export type snitch_adminFindFirstOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.snitch_adminSelect<ExtArgs> | null;
    omit?: Prisma.snitch_adminOmit<ExtArgs> | null;
    where?: Prisma.snitch_adminWhereInput;
    orderBy?: Prisma.snitch_adminOrderByWithRelationInput | Prisma.snitch_adminOrderByWithRelationInput[];
    cursor?: Prisma.snitch_adminWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.Snitch_adminScalarFieldEnum | Prisma.Snitch_adminScalarFieldEnum[];
};
export type snitch_adminFindManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.snitch_adminSelect<ExtArgs> | null;
    omit?: Prisma.snitch_adminOmit<ExtArgs> | null;
    where?: Prisma.snitch_adminWhereInput;
    orderBy?: Prisma.snitch_adminOrderByWithRelationInput | Prisma.snitch_adminOrderByWithRelationInput[];
    cursor?: Prisma.snitch_adminWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.Snitch_adminScalarFieldEnum | Prisma.Snitch_adminScalarFieldEnum[];
};
export type snitch_adminCreateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.snitch_adminSelect<ExtArgs> | null;
    omit?: Prisma.snitch_adminOmit<ExtArgs> | null;
    data: Prisma.XOR<Prisma.snitch_adminCreateInput, Prisma.snitch_adminUncheckedCreateInput>;
};
export type snitch_adminCreateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    data: Prisma.snitch_adminCreateManyInput | Prisma.snitch_adminCreateManyInput[];
    skipDuplicates?: boolean;
};
export type snitch_adminCreateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.snitch_adminSelectCreateManyAndReturn<ExtArgs> | null;
    omit?: Prisma.snitch_adminOmit<ExtArgs> | null;
    data: Prisma.snitch_adminCreateManyInput | Prisma.snitch_adminCreateManyInput[];
    skipDuplicates?: boolean;
};
export type snitch_adminUpdateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.snitch_adminSelect<ExtArgs> | null;
    omit?: Prisma.snitch_adminOmit<ExtArgs> | null;
    data: Prisma.XOR<Prisma.snitch_adminUpdateInput, Prisma.snitch_adminUncheckedUpdateInput>;
    where: Prisma.snitch_adminWhereUniqueInput;
};
export type snitch_adminUpdateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    data: Prisma.XOR<Prisma.snitch_adminUpdateManyMutationInput, Prisma.snitch_adminUncheckedUpdateManyInput>;
    where?: Prisma.snitch_adminWhereInput;
    limit?: number;
};
export type snitch_adminUpdateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.snitch_adminSelectUpdateManyAndReturn<ExtArgs> | null;
    omit?: Prisma.snitch_adminOmit<ExtArgs> | null;
    data: Prisma.XOR<Prisma.snitch_adminUpdateManyMutationInput, Prisma.snitch_adminUncheckedUpdateManyInput>;
    where?: Prisma.snitch_adminWhereInput;
    limit?: number;
};
export type snitch_adminUpsertArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.snitch_adminSelect<ExtArgs> | null;
    omit?: Prisma.snitch_adminOmit<ExtArgs> | null;
    where: Prisma.snitch_adminWhereUniqueInput;
    create: Prisma.XOR<Prisma.snitch_adminCreateInput, Prisma.snitch_adminUncheckedCreateInput>;
    update: Prisma.XOR<Prisma.snitch_adminUpdateInput, Prisma.snitch_adminUncheckedUpdateInput>;
};
export type snitch_adminDeleteArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.snitch_adminSelect<ExtArgs> | null;
    omit?: Prisma.snitch_adminOmit<ExtArgs> | null;
    where: Prisma.snitch_adminWhereUniqueInput;
};
export type snitch_adminDeleteManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.snitch_adminWhereInput;
    limit?: number;
};
export type snitch_adminDefaultArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.snitch_adminSelect<ExtArgs> | null;
    omit?: Prisma.snitch_adminOmit<ExtArgs> | null;
};
export {};
