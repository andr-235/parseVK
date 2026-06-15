import type * as runtime from "@prisma/client/runtime/client";
import type * as Prisma from "../internal/prismaNamespace.js";
export type TelegramSessionModel = runtime.Types.Result.DefaultSelection<Prisma.$TelegramSessionPayload>;
export type AggregateTelegramSession = {
    _count: TelegramSessionCountAggregateOutputType | null;
    _avg: TelegramSessionAvgAggregateOutputType | null;
    _sum: TelegramSessionSumAggregateOutputType | null;
    _min: TelegramSessionMinAggregateOutputType | null;
    _max: TelegramSessionMaxAggregateOutputType | null;
};
export type TelegramSessionAvgAggregateOutputType = {
    id: number | null;
    userId: number | null;
};
export type TelegramSessionSumAggregateOutputType = {
    id: number | null;
    userId: number | null;
};
export type TelegramSessionMinAggregateOutputType = {
    id: number | null;
    session: string | null;
    userId: number | null;
    username: string | null;
    phoneNumber: string | null;
    createdAt: Date | null;
    updatedAt: Date | null;
};
export type TelegramSessionMaxAggregateOutputType = {
    id: number | null;
    session: string | null;
    userId: number | null;
    username: string | null;
    phoneNumber: string | null;
    createdAt: Date | null;
    updatedAt: Date | null;
};
export type TelegramSessionCountAggregateOutputType = {
    id: number;
    session: number;
    userId: number;
    username: number;
    phoneNumber: number;
    createdAt: number;
    updatedAt: number;
    _all: number;
};
export type TelegramSessionAvgAggregateInputType = {
    id?: true;
    userId?: true;
};
export type TelegramSessionSumAggregateInputType = {
    id?: true;
    userId?: true;
};
export type TelegramSessionMinAggregateInputType = {
    id?: true;
    session?: true;
    userId?: true;
    username?: true;
    phoneNumber?: true;
    createdAt?: true;
    updatedAt?: true;
};
export type TelegramSessionMaxAggregateInputType = {
    id?: true;
    session?: true;
    userId?: true;
    username?: true;
    phoneNumber?: true;
    createdAt?: true;
    updatedAt?: true;
};
export type TelegramSessionCountAggregateInputType = {
    id?: true;
    session?: true;
    userId?: true;
    username?: true;
    phoneNumber?: true;
    createdAt?: true;
    updatedAt?: true;
    _all?: true;
};
export type TelegramSessionAggregateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.TelegramSessionWhereInput;
    orderBy?: Prisma.TelegramSessionOrderByWithRelationInput | Prisma.TelegramSessionOrderByWithRelationInput[];
    cursor?: Prisma.TelegramSessionWhereUniqueInput;
    take?: number;
    skip?: number;
    _count?: true | TelegramSessionCountAggregateInputType;
    _avg?: TelegramSessionAvgAggregateInputType;
    _sum?: TelegramSessionSumAggregateInputType;
    _min?: TelegramSessionMinAggregateInputType;
    _max?: TelegramSessionMaxAggregateInputType;
};
export type GetTelegramSessionAggregateType<T extends TelegramSessionAggregateArgs> = {
    [P in keyof T & keyof AggregateTelegramSession]: P extends '_count' | 'count' ? T[P] extends true ? number : Prisma.GetScalarType<T[P], AggregateTelegramSession[P]> : Prisma.GetScalarType<T[P], AggregateTelegramSession[P]>;
};
export type TelegramSessionGroupByArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.TelegramSessionWhereInput;
    orderBy?: Prisma.TelegramSessionOrderByWithAggregationInput | Prisma.TelegramSessionOrderByWithAggregationInput[];
    by: Prisma.TelegramSessionScalarFieldEnum[] | Prisma.TelegramSessionScalarFieldEnum;
    having?: Prisma.TelegramSessionScalarWhereWithAggregatesInput;
    take?: number;
    skip?: number;
    _count?: TelegramSessionCountAggregateInputType | true;
    _avg?: TelegramSessionAvgAggregateInputType;
    _sum?: TelegramSessionSumAggregateInputType;
    _min?: TelegramSessionMinAggregateInputType;
    _max?: TelegramSessionMaxAggregateInputType;
};
export type TelegramSessionGroupByOutputType = {
    id: number;
    session: string;
    userId: number | null;
    username: string | null;
    phoneNumber: string | null;
    createdAt: Date;
    updatedAt: Date;
    _count: TelegramSessionCountAggregateOutputType | null;
    _avg: TelegramSessionAvgAggregateOutputType | null;
    _sum: TelegramSessionSumAggregateOutputType | null;
    _min: TelegramSessionMinAggregateOutputType | null;
    _max: TelegramSessionMaxAggregateOutputType | null;
};
type GetTelegramSessionGroupByPayload<T extends TelegramSessionGroupByArgs> = Prisma.PrismaPromise<Array<Prisma.PickEnumerable<TelegramSessionGroupByOutputType, T['by']> & {
    [P in ((keyof T) & (keyof TelegramSessionGroupByOutputType))]: P extends '_count' ? T[P] extends boolean ? number : Prisma.GetScalarType<T[P], TelegramSessionGroupByOutputType[P]> : Prisma.GetScalarType<T[P], TelegramSessionGroupByOutputType[P]>;
}>>;
export type TelegramSessionWhereInput = {
    AND?: Prisma.TelegramSessionWhereInput | Prisma.TelegramSessionWhereInput[];
    OR?: Prisma.TelegramSessionWhereInput[];
    NOT?: Prisma.TelegramSessionWhereInput | Prisma.TelegramSessionWhereInput[];
    id?: Prisma.IntFilter<"TelegramSession"> | number;
    session?: Prisma.StringFilter<"TelegramSession"> | string;
    userId?: Prisma.IntNullableFilter<"TelegramSession"> | number | null;
    username?: Prisma.StringNullableFilter<"TelegramSession"> | string | null;
    phoneNumber?: Prisma.StringNullableFilter<"TelegramSession"> | string | null;
    createdAt?: Prisma.DateTimeFilter<"TelegramSession"> | Date | string;
    updatedAt?: Prisma.DateTimeFilter<"TelegramSession"> | Date | string;
};
export type TelegramSessionOrderByWithRelationInput = {
    id?: Prisma.SortOrder;
    session?: Prisma.SortOrder;
    userId?: Prisma.SortOrderInput | Prisma.SortOrder;
    username?: Prisma.SortOrderInput | Prisma.SortOrder;
    phoneNumber?: Prisma.SortOrderInput | Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
};
export type TelegramSessionWhereUniqueInput = Prisma.AtLeast<{
    id?: number;
    AND?: Prisma.TelegramSessionWhereInput | Prisma.TelegramSessionWhereInput[];
    OR?: Prisma.TelegramSessionWhereInput[];
    NOT?: Prisma.TelegramSessionWhereInput | Prisma.TelegramSessionWhereInput[];
    session?: Prisma.StringFilter<"TelegramSession"> | string;
    userId?: Prisma.IntNullableFilter<"TelegramSession"> | number | null;
    username?: Prisma.StringNullableFilter<"TelegramSession"> | string | null;
    phoneNumber?: Prisma.StringNullableFilter<"TelegramSession"> | string | null;
    createdAt?: Prisma.DateTimeFilter<"TelegramSession"> | Date | string;
    updatedAt?: Prisma.DateTimeFilter<"TelegramSession"> | Date | string;
}, "id">;
export type TelegramSessionOrderByWithAggregationInput = {
    id?: Prisma.SortOrder;
    session?: Prisma.SortOrder;
    userId?: Prisma.SortOrderInput | Prisma.SortOrder;
    username?: Prisma.SortOrderInput | Prisma.SortOrder;
    phoneNumber?: Prisma.SortOrderInput | Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
    _count?: Prisma.TelegramSessionCountOrderByAggregateInput;
    _avg?: Prisma.TelegramSessionAvgOrderByAggregateInput;
    _max?: Prisma.TelegramSessionMaxOrderByAggregateInput;
    _min?: Prisma.TelegramSessionMinOrderByAggregateInput;
    _sum?: Prisma.TelegramSessionSumOrderByAggregateInput;
};
export type TelegramSessionScalarWhereWithAggregatesInput = {
    AND?: Prisma.TelegramSessionScalarWhereWithAggregatesInput | Prisma.TelegramSessionScalarWhereWithAggregatesInput[];
    OR?: Prisma.TelegramSessionScalarWhereWithAggregatesInput[];
    NOT?: Prisma.TelegramSessionScalarWhereWithAggregatesInput | Prisma.TelegramSessionScalarWhereWithAggregatesInput[];
    id?: Prisma.IntWithAggregatesFilter<"TelegramSession"> | number;
    session?: Prisma.StringWithAggregatesFilter<"TelegramSession"> | string;
    userId?: Prisma.IntNullableWithAggregatesFilter<"TelegramSession"> | number | null;
    username?: Prisma.StringNullableWithAggregatesFilter<"TelegramSession"> | string | null;
    phoneNumber?: Prisma.StringNullableWithAggregatesFilter<"TelegramSession"> | string | null;
    createdAt?: Prisma.DateTimeWithAggregatesFilter<"TelegramSession"> | Date | string;
    updatedAt?: Prisma.DateTimeWithAggregatesFilter<"TelegramSession"> | Date | string;
};
export type TelegramSessionCreateInput = {
    session: string;
    userId?: number | null;
    username?: string | null;
    phoneNumber?: string | null;
    createdAt?: Date | string;
    updatedAt?: Date | string;
};
export type TelegramSessionUncheckedCreateInput = {
    id?: number;
    session: string;
    userId?: number | null;
    username?: string | null;
    phoneNumber?: string | null;
    createdAt?: Date | string;
    updatedAt?: Date | string;
};
export type TelegramSessionUpdateInput = {
    session?: Prisma.StringFieldUpdateOperationsInput | string;
    userId?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    username?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    phoneNumber?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type TelegramSessionUncheckedUpdateInput = {
    id?: Prisma.IntFieldUpdateOperationsInput | number;
    session?: Prisma.StringFieldUpdateOperationsInput | string;
    userId?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    username?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    phoneNumber?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type TelegramSessionCreateManyInput = {
    id?: number;
    session: string;
    userId?: number | null;
    username?: string | null;
    phoneNumber?: string | null;
    createdAt?: Date | string;
    updatedAt?: Date | string;
};
export type TelegramSessionUpdateManyMutationInput = {
    session?: Prisma.StringFieldUpdateOperationsInput | string;
    userId?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    username?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    phoneNumber?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type TelegramSessionUncheckedUpdateManyInput = {
    id?: Prisma.IntFieldUpdateOperationsInput | number;
    session?: Prisma.StringFieldUpdateOperationsInput | string;
    userId?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    username?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    phoneNumber?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type TelegramSessionCountOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    session?: Prisma.SortOrder;
    userId?: Prisma.SortOrder;
    username?: Prisma.SortOrder;
    phoneNumber?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
};
export type TelegramSessionAvgOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    userId?: Prisma.SortOrder;
};
export type TelegramSessionMaxOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    session?: Prisma.SortOrder;
    userId?: Prisma.SortOrder;
    username?: Prisma.SortOrder;
    phoneNumber?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
};
export type TelegramSessionMinOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    session?: Prisma.SortOrder;
    userId?: Prisma.SortOrder;
    username?: Prisma.SortOrder;
    phoneNumber?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
};
export type TelegramSessionSumOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    userId?: Prisma.SortOrder;
};
export type TelegramSessionSelect<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    session?: boolean;
    userId?: boolean;
    username?: boolean;
    phoneNumber?: boolean;
    createdAt?: boolean;
    updatedAt?: boolean;
}, ExtArgs["result"]["telegramSession"]>;
export type TelegramSessionSelectCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    session?: boolean;
    userId?: boolean;
    username?: boolean;
    phoneNumber?: boolean;
    createdAt?: boolean;
    updatedAt?: boolean;
}, ExtArgs["result"]["telegramSession"]>;
export type TelegramSessionSelectUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    session?: boolean;
    userId?: boolean;
    username?: boolean;
    phoneNumber?: boolean;
    createdAt?: boolean;
    updatedAt?: boolean;
}, ExtArgs["result"]["telegramSession"]>;
export type TelegramSessionSelectScalar = {
    id?: boolean;
    session?: boolean;
    userId?: boolean;
    username?: boolean;
    phoneNumber?: boolean;
    createdAt?: boolean;
    updatedAt?: boolean;
};
export type TelegramSessionOmit<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetOmit<"id" | "session" | "userId" | "username" | "phoneNumber" | "createdAt" | "updatedAt", ExtArgs["result"]["telegramSession"]>;
export type $TelegramSessionPayload<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    name: "TelegramSession";
    objects: {};
    scalars: runtime.Types.Extensions.GetPayloadResult<{
        id: number;
        session: string;
        userId: number | null;
        username: string | null;
        phoneNumber: string | null;
        createdAt: Date;
        updatedAt: Date;
    }, ExtArgs["result"]["telegramSession"]>;
    composites: {};
};
export type TelegramSessionGetPayload<S extends boolean | null | undefined | TelegramSessionDefaultArgs> = runtime.Types.Result.GetResult<Prisma.$TelegramSessionPayload, S>;
export type TelegramSessionCountArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = Omit<TelegramSessionFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
    select?: TelegramSessionCountAggregateInputType | true;
};
export interface TelegramSessionDelegate<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: {
        types: Prisma.TypeMap<ExtArgs>['model']['TelegramSession'];
        meta: {
            name: 'TelegramSession';
        };
    };
    findUnique<T extends TelegramSessionFindUniqueArgs>(args: Prisma.SelectSubset<T, TelegramSessionFindUniqueArgs<ExtArgs>>): Prisma.Prisma__TelegramSessionClient<runtime.Types.Result.GetResult<Prisma.$TelegramSessionPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    findUniqueOrThrow<T extends TelegramSessionFindUniqueOrThrowArgs>(args: Prisma.SelectSubset<T, TelegramSessionFindUniqueOrThrowArgs<ExtArgs>>): Prisma.Prisma__TelegramSessionClient<runtime.Types.Result.GetResult<Prisma.$TelegramSessionPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    findFirst<T extends TelegramSessionFindFirstArgs>(args?: Prisma.SelectSubset<T, TelegramSessionFindFirstArgs<ExtArgs>>): Prisma.Prisma__TelegramSessionClient<runtime.Types.Result.GetResult<Prisma.$TelegramSessionPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    findFirstOrThrow<T extends TelegramSessionFindFirstOrThrowArgs>(args?: Prisma.SelectSubset<T, TelegramSessionFindFirstOrThrowArgs<ExtArgs>>): Prisma.Prisma__TelegramSessionClient<runtime.Types.Result.GetResult<Prisma.$TelegramSessionPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    findMany<T extends TelegramSessionFindManyArgs>(args?: Prisma.SelectSubset<T, TelegramSessionFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$TelegramSessionPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>;
    create<T extends TelegramSessionCreateArgs>(args: Prisma.SelectSubset<T, TelegramSessionCreateArgs<ExtArgs>>): Prisma.Prisma__TelegramSessionClient<runtime.Types.Result.GetResult<Prisma.$TelegramSessionPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    createMany<T extends TelegramSessionCreateManyArgs>(args?: Prisma.SelectSubset<T, TelegramSessionCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    createManyAndReturn<T extends TelegramSessionCreateManyAndReturnArgs>(args?: Prisma.SelectSubset<T, TelegramSessionCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$TelegramSessionPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>;
    delete<T extends TelegramSessionDeleteArgs>(args: Prisma.SelectSubset<T, TelegramSessionDeleteArgs<ExtArgs>>): Prisma.Prisma__TelegramSessionClient<runtime.Types.Result.GetResult<Prisma.$TelegramSessionPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    update<T extends TelegramSessionUpdateArgs>(args: Prisma.SelectSubset<T, TelegramSessionUpdateArgs<ExtArgs>>): Prisma.Prisma__TelegramSessionClient<runtime.Types.Result.GetResult<Prisma.$TelegramSessionPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    deleteMany<T extends TelegramSessionDeleteManyArgs>(args?: Prisma.SelectSubset<T, TelegramSessionDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    updateMany<T extends TelegramSessionUpdateManyArgs>(args: Prisma.SelectSubset<T, TelegramSessionUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    updateManyAndReturn<T extends TelegramSessionUpdateManyAndReturnArgs>(args: Prisma.SelectSubset<T, TelegramSessionUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$TelegramSessionPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>;
    upsert<T extends TelegramSessionUpsertArgs>(args: Prisma.SelectSubset<T, TelegramSessionUpsertArgs<ExtArgs>>): Prisma.Prisma__TelegramSessionClient<runtime.Types.Result.GetResult<Prisma.$TelegramSessionPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    count<T extends TelegramSessionCountArgs>(args?: Prisma.Subset<T, TelegramSessionCountArgs>): Prisma.PrismaPromise<T extends runtime.Types.Utils.Record<'select', any> ? T['select'] extends true ? number : Prisma.GetScalarType<T['select'], TelegramSessionCountAggregateOutputType> : number>;
    aggregate<T extends TelegramSessionAggregateArgs>(args: Prisma.Subset<T, TelegramSessionAggregateArgs>): Prisma.PrismaPromise<GetTelegramSessionAggregateType<T>>;
    groupBy<T extends TelegramSessionGroupByArgs, HasSelectOrTake extends Prisma.Or<Prisma.Extends<'skip', Prisma.Keys<T>>, Prisma.Extends<'take', Prisma.Keys<T>>>, OrderByArg extends Prisma.True extends HasSelectOrTake ? {
        orderBy: TelegramSessionGroupByArgs['orderBy'];
    } : {
        orderBy?: TelegramSessionGroupByArgs['orderBy'];
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
    }[OrderFields]>(args: Prisma.SubsetIntersection<T, TelegramSessionGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetTelegramSessionGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>;
    readonly fields: TelegramSessionFieldRefs;
}
export interface Prisma__TelegramSessionClient<T, Null = never, ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise";
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): runtime.Types.Utils.JsPromise<TResult1 | TResult2>;
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): runtime.Types.Utils.JsPromise<T | TResult>;
    finally(onfinally?: (() => void) | undefined | null): runtime.Types.Utils.JsPromise<T>;
}
export interface TelegramSessionFieldRefs {
    readonly id: Prisma.FieldRef<"TelegramSession", 'Int'>;
    readonly session: Prisma.FieldRef<"TelegramSession", 'String'>;
    readonly userId: Prisma.FieldRef<"TelegramSession", 'Int'>;
    readonly username: Prisma.FieldRef<"TelegramSession", 'String'>;
    readonly phoneNumber: Prisma.FieldRef<"TelegramSession", 'String'>;
    readonly createdAt: Prisma.FieldRef<"TelegramSession", 'DateTime'>;
    readonly updatedAt: Prisma.FieldRef<"TelegramSession", 'DateTime'>;
}
export type TelegramSessionFindUniqueArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.TelegramSessionSelect<ExtArgs> | null;
    omit?: Prisma.TelegramSessionOmit<ExtArgs> | null;
    where: Prisma.TelegramSessionWhereUniqueInput;
};
export type TelegramSessionFindUniqueOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.TelegramSessionSelect<ExtArgs> | null;
    omit?: Prisma.TelegramSessionOmit<ExtArgs> | null;
    where: Prisma.TelegramSessionWhereUniqueInput;
};
export type TelegramSessionFindFirstArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.TelegramSessionSelect<ExtArgs> | null;
    omit?: Prisma.TelegramSessionOmit<ExtArgs> | null;
    where?: Prisma.TelegramSessionWhereInput;
    orderBy?: Prisma.TelegramSessionOrderByWithRelationInput | Prisma.TelegramSessionOrderByWithRelationInput[];
    cursor?: Prisma.TelegramSessionWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.TelegramSessionScalarFieldEnum | Prisma.TelegramSessionScalarFieldEnum[];
};
export type TelegramSessionFindFirstOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.TelegramSessionSelect<ExtArgs> | null;
    omit?: Prisma.TelegramSessionOmit<ExtArgs> | null;
    where?: Prisma.TelegramSessionWhereInput;
    orderBy?: Prisma.TelegramSessionOrderByWithRelationInput | Prisma.TelegramSessionOrderByWithRelationInput[];
    cursor?: Prisma.TelegramSessionWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.TelegramSessionScalarFieldEnum | Prisma.TelegramSessionScalarFieldEnum[];
};
export type TelegramSessionFindManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.TelegramSessionSelect<ExtArgs> | null;
    omit?: Prisma.TelegramSessionOmit<ExtArgs> | null;
    where?: Prisma.TelegramSessionWhereInput;
    orderBy?: Prisma.TelegramSessionOrderByWithRelationInput | Prisma.TelegramSessionOrderByWithRelationInput[];
    cursor?: Prisma.TelegramSessionWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.TelegramSessionScalarFieldEnum | Prisma.TelegramSessionScalarFieldEnum[];
};
export type TelegramSessionCreateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.TelegramSessionSelect<ExtArgs> | null;
    omit?: Prisma.TelegramSessionOmit<ExtArgs> | null;
    data: Prisma.XOR<Prisma.TelegramSessionCreateInput, Prisma.TelegramSessionUncheckedCreateInput>;
};
export type TelegramSessionCreateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    data: Prisma.TelegramSessionCreateManyInput | Prisma.TelegramSessionCreateManyInput[];
    skipDuplicates?: boolean;
};
export type TelegramSessionCreateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.TelegramSessionSelectCreateManyAndReturn<ExtArgs> | null;
    omit?: Prisma.TelegramSessionOmit<ExtArgs> | null;
    data: Prisma.TelegramSessionCreateManyInput | Prisma.TelegramSessionCreateManyInput[];
    skipDuplicates?: boolean;
};
export type TelegramSessionUpdateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.TelegramSessionSelect<ExtArgs> | null;
    omit?: Prisma.TelegramSessionOmit<ExtArgs> | null;
    data: Prisma.XOR<Prisma.TelegramSessionUpdateInput, Prisma.TelegramSessionUncheckedUpdateInput>;
    where: Prisma.TelegramSessionWhereUniqueInput;
};
export type TelegramSessionUpdateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    data: Prisma.XOR<Prisma.TelegramSessionUpdateManyMutationInput, Prisma.TelegramSessionUncheckedUpdateManyInput>;
    where?: Prisma.TelegramSessionWhereInput;
    limit?: number;
};
export type TelegramSessionUpdateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.TelegramSessionSelectUpdateManyAndReturn<ExtArgs> | null;
    omit?: Prisma.TelegramSessionOmit<ExtArgs> | null;
    data: Prisma.XOR<Prisma.TelegramSessionUpdateManyMutationInput, Prisma.TelegramSessionUncheckedUpdateManyInput>;
    where?: Prisma.TelegramSessionWhereInput;
    limit?: number;
};
export type TelegramSessionUpsertArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.TelegramSessionSelect<ExtArgs> | null;
    omit?: Prisma.TelegramSessionOmit<ExtArgs> | null;
    where: Prisma.TelegramSessionWhereUniqueInput;
    create: Prisma.XOR<Prisma.TelegramSessionCreateInput, Prisma.TelegramSessionUncheckedCreateInput>;
    update: Prisma.XOR<Prisma.TelegramSessionUpdateInput, Prisma.TelegramSessionUncheckedUpdateInput>;
};
export type TelegramSessionDeleteArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.TelegramSessionSelect<ExtArgs> | null;
    omit?: Prisma.TelegramSessionOmit<ExtArgs> | null;
    where: Prisma.TelegramSessionWhereUniqueInput;
};
export type TelegramSessionDeleteManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.TelegramSessionWhereInput;
    limit?: number;
};
export type TelegramSessionDefaultArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.TelegramSessionSelect<ExtArgs> | null;
    omit?: Prisma.TelegramSessionOmit<ExtArgs> | null;
};
export {};
