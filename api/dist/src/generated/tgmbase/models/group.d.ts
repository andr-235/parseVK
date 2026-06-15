import type * as runtime from "@prisma/client/runtime/client";
import type * as Prisma from "../internal/prismaNamespace.js";
export type groupModel = runtime.Types.Result.DefaultSelection<Prisma.$groupPayload>;
export type AggregateGroup = {
    _count: GroupCountAggregateOutputType | null;
    _avg: GroupAvgAggregateOutputType | null;
    _sum: GroupSumAggregateOutputType | null;
    _min: GroupMinAggregateOutputType | null;
    _max: GroupMaxAggregateOutputType | null;
};
export type GroupAvgAggregateOutputType = {
    id: number | null;
    group_id: number | null;
    participants_count: number | null;
    region: number | null;
};
export type GroupSumAggregateOutputType = {
    id: bigint | null;
    group_id: bigint | null;
    participants_count: bigint | null;
    region: number | null;
};
export type GroupMinAggregateOutputType = {
    id: bigint | null;
    group_id: bigint | null;
    title: string | null;
    participants_count: bigint | null;
    date: Date | null;
    region: number | null;
    description: string | null;
    upd_date: Date | null;
};
export type GroupMaxAggregateOutputType = {
    id: bigint | null;
    group_id: bigint | null;
    title: string | null;
    participants_count: bigint | null;
    date: Date | null;
    region: number | null;
    description: string | null;
    upd_date: Date | null;
};
export type GroupCountAggregateOutputType = {
    id: number;
    group_id: number;
    title: number;
    participants_count: number;
    date: number;
    region: number;
    description: number;
    upd_date: number;
    _all: number;
};
export type GroupAvgAggregateInputType = {
    id?: true;
    group_id?: true;
    participants_count?: true;
    region?: true;
};
export type GroupSumAggregateInputType = {
    id?: true;
    group_id?: true;
    participants_count?: true;
    region?: true;
};
export type GroupMinAggregateInputType = {
    id?: true;
    group_id?: true;
    title?: true;
    participants_count?: true;
    date?: true;
    region?: true;
    description?: true;
    upd_date?: true;
};
export type GroupMaxAggregateInputType = {
    id?: true;
    group_id?: true;
    title?: true;
    participants_count?: true;
    date?: true;
    region?: true;
    description?: true;
    upd_date?: true;
};
export type GroupCountAggregateInputType = {
    id?: true;
    group_id?: true;
    title?: true;
    participants_count?: true;
    date?: true;
    region?: true;
    description?: true;
    upd_date?: true;
    _all?: true;
};
export type GroupAggregateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.groupWhereInput;
    orderBy?: Prisma.groupOrderByWithRelationInput | Prisma.groupOrderByWithRelationInput[];
    cursor?: Prisma.groupWhereUniqueInput;
    take?: number;
    skip?: number;
    _count?: true | GroupCountAggregateInputType;
    _avg?: GroupAvgAggregateInputType;
    _sum?: GroupSumAggregateInputType;
    _min?: GroupMinAggregateInputType;
    _max?: GroupMaxAggregateInputType;
};
export type GetGroupAggregateType<T extends GroupAggregateArgs> = {
    [P in keyof T & keyof AggregateGroup]: P extends '_count' | 'count' ? T[P] extends true ? number : Prisma.GetScalarType<T[P], AggregateGroup[P]> : Prisma.GetScalarType<T[P], AggregateGroup[P]>;
};
export type groupGroupByArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.groupWhereInput;
    orderBy?: Prisma.groupOrderByWithAggregationInput | Prisma.groupOrderByWithAggregationInput[];
    by: Prisma.GroupScalarFieldEnum[] | Prisma.GroupScalarFieldEnum;
    having?: Prisma.groupScalarWhereWithAggregatesInput;
    take?: number;
    skip?: number;
    _count?: GroupCountAggregateInputType | true;
    _avg?: GroupAvgAggregateInputType;
    _sum?: GroupSumAggregateInputType;
    _min?: GroupMinAggregateInputType;
    _max?: GroupMaxAggregateInputType;
};
export type GroupGroupByOutputType = {
    id: bigint;
    group_id: bigint;
    title: string;
    participants_count: bigint | null;
    date: Date;
    region: number;
    description: string | null;
    upd_date: Date;
    _count: GroupCountAggregateOutputType | null;
    _avg: GroupAvgAggregateOutputType | null;
    _sum: GroupSumAggregateOutputType | null;
    _min: GroupMinAggregateOutputType | null;
    _max: GroupMaxAggregateOutputType | null;
};
type GetGroupGroupByPayload<T extends groupGroupByArgs> = Prisma.PrismaPromise<Array<Prisma.PickEnumerable<GroupGroupByOutputType, T['by']> & {
    [P in ((keyof T) & (keyof GroupGroupByOutputType))]: P extends '_count' ? T[P] extends boolean ? number : Prisma.GetScalarType<T[P], GroupGroupByOutputType[P]> : Prisma.GetScalarType<T[P], GroupGroupByOutputType[P]>;
}>>;
export type groupWhereInput = {
    AND?: Prisma.groupWhereInput | Prisma.groupWhereInput[];
    OR?: Prisma.groupWhereInput[];
    NOT?: Prisma.groupWhereInput | Prisma.groupWhereInput[];
    id?: Prisma.BigIntFilter<"group"> | bigint | number;
    group_id?: Prisma.BigIntFilter<"group"> | bigint | number;
    title?: Prisma.StringFilter<"group"> | string;
    participants_count?: Prisma.BigIntNullableFilter<"group"> | bigint | number | null;
    date?: Prisma.DateTimeFilter<"group"> | Date | string;
    region?: Prisma.IntFilter<"group"> | number;
    description?: Prisma.StringNullableFilter<"group"> | string | null;
    upd_date?: Prisma.DateTimeFilter<"group"> | Date | string;
};
export type groupOrderByWithRelationInput = {
    id?: Prisma.SortOrder;
    group_id?: Prisma.SortOrder;
    title?: Prisma.SortOrder;
    participants_count?: Prisma.SortOrderInput | Prisma.SortOrder;
    date?: Prisma.SortOrder;
    region?: Prisma.SortOrder;
    description?: Prisma.SortOrderInput | Prisma.SortOrder;
    upd_date?: Prisma.SortOrder;
};
export type groupWhereUniqueInput = Prisma.AtLeast<{
    id?: bigint | number;
    group_id?: bigint | number;
    AND?: Prisma.groupWhereInput | Prisma.groupWhereInput[];
    OR?: Prisma.groupWhereInput[];
    NOT?: Prisma.groupWhereInput | Prisma.groupWhereInput[];
    title?: Prisma.StringFilter<"group"> | string;
    participants_count?: Prisma.BigIntNullableFilter<"group"> | bigint | number | null;
    date?: Prisma.DateTimeFilter<"group"> | Date | string;
    region?: Prisma.IntFilter<"group"> | number;
    description?: Prisma.StringNullableFilter<"group"> | string | null;
    upd_date?: Prisma.DateTimeFilter<"group"> | Date | string;
}, "id" | "group_id">;
export type groupOrderByWithAggregationInput = {
    id?: Prisma.SortOrder;
    group_id?: Prisma.SortOrder;
    title?: Prisma.SortOrder;
    participants_count?: Prisma.SortOrderInput | Prisma.SortOrder;
    date?: Prisma.SortOrder;
    region?: Prisma.SortOrder;
    description?: Prisma.SortOrderInput | Prisma.SortOrder;
    upd_date?: Prisma.SortOrder;
    _count?: Prisma.groupCountOrderByAggregateInput;
    _avg?: Prisma.groupAvgOrderByAggregateInput;
    _max?: Prisma.groupMaxOrderByAggregateInput;
    _min?: Prisma.groupMinOrderByAggregateInput;
    _sum?: Prisma.groupSumOrderByAggregateInput;
};
export type groupScalarWhereWithAggregatesInput = {
    AND?: Prisma.groupScalarWhereWithAggregatesInput | Prisma.groupScalarWhereWithAggregatesInput[];
    OR?: Prisma.groupScalarWhereWithAggregatesInput[];
    NOT?: Prisma.groupScalarWhereWithAggregatesInput | Prisma.groupScalarWhereWithAggregatesInput[];
    id?: Prisma.BigIntWithAggregatesFilter<"group"> | bigint | number;
    group_id?: Prisma.BigIntWithAggregatesFilter<"group"> | bigint | number;
    title?: Prisma.StringWithAggregatesFilter<"group"> | string;
    participants_count?: Prisma.BigIntNullableWithAggregatesFilter<"group"> | bigint | number | null;
    date?: Prisma.DateTimeWithAggregatesFilter<"group"> | Date | string;
    region?: Prisma.IntWithAggregatesFilter<"group"> | number;
    description?: Prisma.StringNullableWithAggregatesFilter<"group"> | string | null;
    upd_date?: Prisma.DateTimeWithAggregatesFilter<"group"> | Date | string;
};
export type groupCreateInput = {
    id?: bigint | number;
    group_id: bigint | number;
    title: string;
    participants_count?: bigint | number | null;
    date: Date | string;
    region?: number;
    description?: string | null;
    upd_date?: Date | string;
};
export type groupUncheckedCreateInput = {
    id?: bigint | number;
    group_id: bigint | number;
    title: string;
    participants_count?: bigint | number | null;
    date: Date | string;
    region?: number;
    description?: string | null;
    upd_date?: Date | string;
};
export type groupUpdateInput = {
    id?: Prisma.BigIntFieldUpdateOperationsInput | bigint | number;
    group_id?: Prisma.BigIntFieldUpdateOperationsInput | bigint | number;
    title?: Prisma.StringFieldUpdateOperationsInput | string;
    participants_count?: Prisma.NullableBigIntFieldUpdateOperationsInput | bigint | number | null;
    date?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    region?: Prisma.IntFieldUpdateOperationsInput | number;
    description?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    upd_date?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type groupUncheckedUpdateInput = {
    id?: Prisma.BigIntFieldUpdateOperationsInput | bigint | number;
    group_id?: Prisma.BigIntFieldUpdateOperationsInput | bigint | number;
    title?: Prisma.StringFieldUpdateOperationsInput | string;
    participants_count?: Prisma.NullableBigIntFieldUpdateOperationsInput | bigint | number | null;
    date?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    region?: Prisma.IntFieldUpdateOperationsInput | number;
    description?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    upd_date?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type groupCreateManyInput = {
    id?: bigint | number;
    group_id: bigint | number;
    title: string;
    participants_count?: bigint | number | null;
    date: Date | string;
    region?: number;
    description?: string | null;
    upd_date?: Date | string;
};
export type groupUpdateManyMutationInput = {
    id?: Prisma.BigIntFieldUpdateOperationsInput | bigint | number;
    group_id?: Prisma.BigIntFieldUpdateOperationsInput | bigint | number;
    title?: Prisma.StringFieldUpdateOperationsInput | string;
    participants_count?: Prisma.NullableBigIntFieldUpdateOperationsInput | bigint | number | null;
    date?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    region?: Prisma.IntFieldUpdateOperationsInput | number;
    description?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    upd_date?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type groupUncheckedUpdateManyInput = {
    id?: Prisma.BigIntFieldUpdateOperationsInput | bigint | number;
    group_id?: Prisma.BigIntFieldUpdateOperationsInput | bigint | number;
    title?: Prisma.StringFieldUpdateOperationsInput | string;
    participants_count?: Prisma.NullableBigIntFieldUpdateOperationsInput | bigint | number | null;
    date?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    region?: Prisma.IntFieldUpdateOperationsInput | number;
    description?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    upd_date?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type groupCountOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    group_id?: Prisma.SortOrder;
    title?: Prisma.SortOrder;
    participants_count?: Prisma.SortOrder;
    date?: Prisma.SortOrder;
    region?: Prisma.SortOrder;
    description?: Prisma.SortOrder;
    upd_date?: Prisma.SortOrder;
};
export type groupAvgOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    group_id?: Prisma.SortOrder;
    participants_count?: Prisma.SortOrder;
    region?: Prisma.SortOrder;
};
export type groupMaxOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    group_id?: Prisma.SortOrder;
    title?: Prisma.SortOrder;
    participants_count?: Prisma.SortOrder;
    date?: Prisma.SortOrder;
    region?: Prisma.SortOrder;
    description?: Prisma.SortOrder;
    upd_date?: Prisma.SortOrder;
};
export type groupMinOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    group_id?: Prisma.SortOrder;
    title?: Prisma.SortOrder;
    participants_count?: Prisma.SortOrder;
    date?: Prisma.SortOrder;
    region?: Prisma.SortOrder;
    description?: Prisma.SortOrder;
    upd_date?: Prisma.SortOrder;
};
export type groupSumOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    group_id?: Prisma.SortOrder;
    participants_count?: Prisma.SortOrder;
    region?: Prisma.SortOrder;
};
export type groupSelect<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    group_id?: boolean;
    title?: boolean;
    participants_count?: boolean;
    date?: boolean;
    region?: boolean;
    description?: boolean;
    upd_date?: boolean;
}, ExtArgs["result"]["group"]>;
export type groupSelectCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    group_id?: boolean;
    title?: boolean;
    participants_count?: boolean;
    date?: boolean;
    region?: boolean;
    description?: boolean;
    upd_date?: boolean;
}, ExtArgs["result"]["group"]>;
export type groupSelectUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    group_id?: boolean;
    title?: boolean;
    participants_count?: boolean;
    date?: boolean;
    region?: boolean;
    description?: boolean;
    upd_date?: boolean;
}, ExtArgs["result"]["group"]>;
export type groupSelectScalar = {
    id?: boolean;
    group_id?: boolean;
    title?: boolean;
    participants_count?: boolean;
    date?: boolean;
    region?: boolean;
    description?: boolean;
    upd_date?: boolean;
};
export type groupOmit<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetOmit<"id" | "group_id" | "title" | "participants_count" | "date" | "region" | "description" | "upd_date", ExtArgs["result"]["group"]>;
export type $groupPayload<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    name: "group";
    objects: {};
    scalars: runtime.Types.Extensions.GetPayloadResult<{
        id: bigint;
        group_id: bigint;
        title: string;
        participants_count: bigint | null;
        date: Date;
        region: number;
        description: string | null;
        upd_date: Date;
    }, ExtArgs["result"]["group"]>;
    composites: {};
};
export type groupGetPayload<S extends boolean | null | undefined | groupDefaultArgs> = runtime.Types.Result.GetResult<Prisma.$groupPayload, S>;
export type groupCountArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = Omit<groupFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
    select?: GroupCountAggregateInputType | true;
};
export interface groupDelegate<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: {
        types: Prisma.TypeMap<ExtArgs>['model']['group'];
        meta: {
            name: 'group';
        };
    };
    findUnique<T extends groupFindUniqueArgs>(args: Prisma.SelectSubset<T, groupFindUniqueArgs<ExtArgs>>): Prisma.Prisma__groupClient<runtime.Types.Result.GetResult<Prisma.$groupPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    findUniqueOrThrow<T extends groupFindUniqueOrThrowArgs>(args: Prisma.SelectSubset<T, groupFindUniqueOrThrowArgs<ExtArgs>>): Prisma.Prisma__groupClient<runtime.Types.Result.GetResult<Prisma.$groupPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    findFirst<T extends groupFindFirstArgs>(args?: Prisma.SelectSubset<T, groupFindFirstArgs<ExtArgs>>): Prisma.Prisma__groupClient<runtime.Types.Result.GetResult<Prisma.$groupPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    findFirstOrThrow<T extends groupFindFirstOrThrowArgs>(args?: Prisma.SelectSubset<T, groupFindFirstOrThrowArgs<ExtArgs>>): Prisma.Prisma__groupClient<runtime.Types.Result.GetResult<Prisma.$groupPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    findMany<T extends groupFindManyArgs>(args?: Prisma.SelectSubset<T, groupFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$groupPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>;
    create<T extends groupCreateArgs>(args: Prisma.SelectSubset<T, groupCreateArgs<ExtArgs>>): Prisma.Prisma__groupClient<runtime.Types.Result.GetResult<Prisma.$groupPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    createMany<T extends groupCreateManyArgs>(args?: Prisma.SelectSubset<T, groupCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    createManyAndReturn<T extends groupCreateManyAndReturnArgs>(args?: Prisma.SelectSubset<T, groupCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$groupPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>;
    delete<T extends groupDeleteArgs>(args: Prisma.SelectSubset<T, groupDeleteArgs<ExtArgs>>): Prisma.Prisma__groupClient<runtime.Types.Result.GetResult<Prisma.$groupPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    update<T extends groupUpdateArgs>(args: Prisma.SelectSubset<T, groupUpdateArgs<ExtArgs>>): Prisma.Prisma__groupClient<runtime.Types.Result.GetResult<Prisma.$groupPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    deleteMany<T extends groupDeleteManyArgs>(args?: Prisma.SelectSubset<T, groupDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    updateMany<T extends groupUpdateManyArgs>(args: Prisma.SelectSubset<T, groupUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    updateManyAndReturn<T extends groupUpdateManyAndReturnArgs>(args: Prisma.SelectSubset<T, groupUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$groupPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>;
    upsert<T extends groupUpsertArgs>(args: Prisma.SelectSubset<T, groupUpsertArgs<ExtArgs>>): Prisma.Prisma__groupClient<runtime.Types.Result.GetResult<Prisma.$groupPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    count<T extends groupCountArgs>(args?: Prisma.Subset<T, groupCountArgs>): Prisma.PrismaPromise<T extends runtime.Types.Utils.Record<'select', any> ? T['select'] extends true ? number : Prisma.GetScalarType<T['select'], GroupCountAggregateOutputType> : number>;
    aggregate<T extends GroupAggregateArgs>(args: Prisma.Subset<T, GroupAggregateArgs>): Prisma.PrismaPromise<GetGroupAggregateType<T>>;
    groupBy<T extends groupGroupByArgs, HasSelectOrTake extends Prisma.Or<Prisma.Extends<'skip', Prisma.Keys<T>>, Prisma.Extends<'take', Prisma.Keys<T>>>, OrderByArg extends Prisma.True extends HasSelectOrTake ? {
        orderBy: groupGroupByArgs['orderBy'];
    } : {
        orderBy?: groupGroupByArgs['orderBy'];
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
    }[OrderFields]>(args: Prisma.SubsetIntersection<T, groupGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetGroupGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>;
    readonly fields: groupFieldRefs;
}
export interface Prisma__groupClient<T, Null = never, ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise";
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): runtime.Types.Utils.JsPromise<TResult1 | TResult2>;
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): runtime.Types.Utils.JsPromise<T | TResult>;
    finally(onfinally?: (() => void) | undefined | null): runtime.Types.Utils.JsPromise<T>;
}
export interface groupFieldRefs {
    readonly id: Prisma.FieldRef<"group", 'BigInt'>;
    readonly group_id: Prisma.FieldRef<"group", 'BigInt'>;
    readonly title: Prisma.FieldRef<"group", 'String'>;
    readonly participants_count: Prisma.FieldRef<"group", 'BigInt'>;
    readonly date: Prisma.FieldRef<"group", 'DateTime'>;
    readonly region: Prisma.FieldRef<"group", 'Int'>;
    readonly description: Prisma.FieldRef<"group", 'String'>;
    readonly upd_date: Prisma.FieldRef<"group", 'DateTime'>;
}
export type groupFindUniqueArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.groupSelect<ExtArgs> | null;
    omit?: Prisma.groupOmit<ExtArgs> | null;
    where: Prisma.groupWhereUniqueInput;
};
export type groupFindUniqueOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.groupSelect<ExtArgs> | null;
    omit?: Prisma.groupOmit<ExtArgs> | null;
    where: Prisma.groupWhereUniqueInput;
};
export type groupFindFirstArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.groupSelect<ExtArgs> | null;
    omit?: Prisma.groupOmit<ExtArgs> | null;
    where?: Prisma.groupWhereInput;
    orderBy?: Prisma.groupOrderByWithRelationInput | Prisma.groupOrderByWithRelationInput[];
    cursor?: Prisma.groupWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.GroupScalarFieldEnum | Prisma.GroupScalarFieldEnum[];
};
export type groupFindFirstOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.groupSelect<ExtArgs> | null;
    omit?: Prisma.groupOmit<ExtArgs> | null;
    where?: Prisma.groupWhereInput;
    orderBy?: Prisma.groupOrderByWithRelationInput | Prisma.groupOrderByWithRelationInput[];
    cursor?: Prisma.groupWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.GroupScalarFieldEnum | Prisma.GroupScalarFieldEnum[];
};
export type groupFindManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.groupSelect<ExtArgs> | null;
    omit?: Prisma.groupOmit<ExtArgs> | null;
    where?: Prisma.groupWhereInput;
    orderBy?: Prisma.groupOrderByWithRelationInput | Prisma.groupOrderByWithRelationInput[];
    cursor?: Prisma.groupWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.GroupScalarFieldEnum | Prisma.GroupScalarFieldEnum[];
};
export type groupCreateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.groupSelect<ExtArgs> | null;
    omit?: Prisma.groupOmit<ExtArgs> | null;
    data: Prisma.XOR<Prisma.groupCreateInput, Prisma.groupUncheckedCreateInput>;
};
export type groupCreateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    data: Prisma.groupCreateManyInput | Prisma.groupCreateManyInput[];
    skipDuplicates?: boolean;
};
export type groupCreateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.groupSelectCreateManyAndReturn<ExtArgs> | null;
    omit?: Prisma.groupOmit<ExtArgs> | null;
    data: Prisma.groupCreateManyInput | Prisma.groupCreateManyInput[];
    skipDuplicates?: boolean;
};
export type groupUpdateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.groupSelect<ExtArgs> | null;
    omit?: Prisma.groupOmit<ExtArgs> | null;
    data: Prisma.XOR<Prisma.groupUpdateInput, Prisma.groupUncheckedUpdateInput>;
    where: Prisma.groupWhereUniqueInput;
};
export type groupUpdateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    data: Prisma.XOR<Prisma.groupUpdateManyMutationInput, Prisma.groupUncheckedUpdateManyInput>;
    where?: Prisma.groupWhereInput;
    limit?: number;
};
export type groupUpdateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.groupSelectUpdateManyAndReturn<ExtArgs> | null;
    omit?: Prisma.groupOmit<ExtArgs> | null;
    data: Prisma.XOR<Prisma.groupUpdateManyMutationInput, Prisma.groupUncheckedUpdateManyInput>;
    where?: Prisma.groupWhereInput;
    limit?: number;
};
export type groupUpsertArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.groupSelect<ExtArgs> | null;
    omit?: Prisma.groupOmit<ExtArgs> | null;
    where: Prisma.groupWhereUniqueInput;
    create: Prisma.XOR<Prisma.groupCreateInput, Prisma.groupUncheckedCreateInput>;
    update: Prisma.XOR<Prisma.groupUpdateInput, Prisma.groupUncheckedUpdateInput>;
};
export type groupDeleteArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.groupSelect<ExtArgs> | null;
    omit?: Prisma.groupOmit<ExtArgs> | null;
    where: Prisma.groupWhereUniqueInput;
};
export type groupDeleteManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.groupWhereInput;
    limit?: number;
};
export type groupDefaultArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.groupSelect<ExtArgs> | null;
    omit?: Prisma.groupOmit<ExtArgs> | null;
};
export {};
