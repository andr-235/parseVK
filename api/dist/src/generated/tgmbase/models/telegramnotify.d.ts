import type * as runtime from "@prisma/client/runtime/client";
import type * as Prisma from "../internal/prismaNamespace.js";
export type telegramnotifyModel = runtime.Types.Result.DefaultSelection<Prisma.$telegramnotifyPayload>;
export type AggregateTelegramnotify = {
    _count: TelegramnotifyCountAggregateOutputType | null;
    _avg: TelegramnotifyAvgAggregateOutputType | null;
    _sum: TelegramnotifySumAggregateOutputType | null;
    _min: TelegramnotifyMinAggregateOutputType | null;
    _max: TelegramnotifyMaxAggregateOutputType | null;
};
export type TelegramnotifyAvgAggregateOutputType = {
    id: number | null;
    telegram_id: number | null;
};
export type TelegramnotifySumAggregateOutputType = {
    id: bigint | null;
    telegram_id: bigint | null;
};
export type TelegramnotifyMinAggregateOutputType = {
    id: bigint | null;
    telegram_id: bigint | null;
    username: string | null;
    timestamp: Date | null;
};
export type TelegramnotifyMaxAggregateOutputType = {
    id: bigint | null;
    telegram_id: bigint | null;
    username: string | null;
    timestamp: Date | null;
};
export type TelegramnotifyCountAggregateOutputType = {
    id: number;
    telegram_id: number;
    username: number;
    timestamp: number;
    _all: number;
};
export type TelegramnotifyAvgAggregateInputType = {
    id?: true;
    telegram_id?: true;
};
export type TelegramnotifySumAggregateInputType = {
    id?: true;
    telegram_id?: true;
};
export type TelegramnotifyMinAggregateInputType = {
    id?: true;
    telegram_id?: true;
    username?: true;
    timestamp?: true;
};
export type TelegramnotifyMaxAggregateInputType = {
    id?: true;
    telegram_id?: true;
    username?: true;
    timestamp?: true;
};
export type TelegramnotifyCountAggregateInputType = {
    id?: true;
    telegram_id?: true;
    username?: true;
    timestamp?: true;
    _all?: true;
};
export type TelegramnotifyAggregateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.telegramnotifyWhereInput;
    orderBy?: Prisma.telegramnotifyOrderByWithRelationInput | Prisma.telegramnotifyOrderByWithRelationInput[];
    cursor?: Prisma.telegramnotifyWhereUniqueInput;
    take?: number;
    skip?: number;
    _count?: true | TelegramnotifyCountAggregateInputType;
    _avg?: TelegramnotifyAvgAggregateInputType;
    _sum?: TelegramnotifySumAggregateInputType;
    _min?: TelegramnotifyMinAggregateInputType;
    _max?: TelegramnotifyMaxAggregateInputType;
};
export type GetTelegramnotifyAggregateType<T extends TelegramnotifyAggregateArgs> = {
    [P in keyof T & keyof AggregateTelegramnotify]: P extends '_count' | 'count' ? T[P] extends true ? number : Prisma.GetScalarType<T[P], AggregateTelegramnotify[P]> : Prisma.GetScalarType<T[P], AggregateTelegramnotify[P]>;
};
export type telegramnotifyGroupByArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.telegramnotifyWhereInput;
    orderBy?: Prisma.telegramnotifyOrderByWithAggregationInput | Prisma.telegramnotifyOrderByWithAggregationInput[];
    by: Prisma.TelegramnotifyScalarFieldEnum[] | Prisma.TelegramnotifyScalarFieldEnum;
    having?: Prisma.telegramnotifyScalarWhereWithAggregatesInput;
    take?: number;
    skip?: number;
    _count?: TelegramnotifyCountAggregateInputType | true;
    _avg?: TelegramnotifyAvgAggregateInputType;
    _sum?: TelegramnotifySumAggregateInputType;
    _min?: TelegramnotifyMinAggregateInputType;
    _max?: TelegramnotifyMaxAggregateInputType;
};
export type TelegramnotifyGroupByOutputType = {
    id: bigint;
    telegram_id: bigint;
    username: string;
    timestamp: Date;
    _count: TelegramnotifyCountAggregateOutputType | null;
    _avg: TelegramnotifyAvgAggregateOutputType | null;
    _sum: TelegramnotifySumAggregateOutputType | null;
    _min: TelegramnotifyMinAggregateOutputType | null;
    _max: TelegramnotifyMaxAggregateOutputType | null;
};
type GetTelegramnotifyGroupByPayload<T extends telegramnotifyGroupByArgs> = Prisma.PrismaPromise<Array<Prisma.PickEnumerable<TelegramnotifyGroupByOutputType, T['by']> & {
    [P in ((keyof T) & (keyof TelegramnotifyGroupByOutputType))]: P extends '_count' ? T[P] extends boolean ? number : Prisma.GetScalarType<T[P], TelegramnotifyGroupByOutputType[P]> : Prisma.GetScalarType<T[P], TelegramnotifyGroupByOutputType[P]>;
}>>;
export type telegramnotifyWhereInput = {
    AND?: Prisma.telegramnotifyWhereInput | Prisma.telegramnotifyWhereInput[];
    OR?: Prisma.telegramnotifyWhereInput[];
    NOT?: Prisma.telegramnotifyWhereInput | Prisma.telegramnotifyWhereInput[];
    id?: Prisma.BigIntFilter<"telegramnotify"> | bigint | number;
    telegram_id?: Prisma.BigIntFilter<"telegramnotify"> | bigint | number;
    username?: Prisma.StringFilter<"telegramnotify"> | string;
    timestamp?: Prisma.DateTimeFilter<"telegramnotify"> | Date | string;
};
export type telegramnotifyOrderByWithRelationInput = {
    id?: Prisma.SortOrder;
    telegram_id?: Prisma.SortOrder;
    username?: Prisma.SortOrder;
    timestamp?: Prisma.SortOrder;
};
export type telegramnotifyWhereUniqueInput = Prisma.AtLeast<{
    id?: bigint | number;
    telegram_id?: bigint | number;
    AND?: Prisma.telegramnotifyWhereInput | Prisma.telegramnotifyWhereInput[];
    OR?: Prisma.telegramnotifyWhereInput[];
    NOT?: Prisma.telegramnotifyWhereInput | Prisma.telegramnotifyWhereInput[];
    username?: Prisma.StringFilter<"telegramnotify"> | string;
    timestamp?: Prisma.DateTimeFilter<"telegramnotify"> | Date | string;
}, "id" | "telegram_id">;
export type telegramnotifyOrderByWithAggregationInput = {
    id?: Prisma.SortOrder;
    telegram_id?: Prisma.SortOrder;
    username?: Prisma.SortOrder;
    timestamp?: Prisma.SortOrder;
    _count?: Prisma.telegramnotifyCountOrderByAggregateInput;
    _avg?: Prisma.telegramnotifyAvgOrderByAggregateInput;
    _max?: Prisma.telegramnotifyMaxOrderByAggregateInput;
    _min?: Prisma.telegramnotifyMinOrderByAggregateInput;
    _sum?: Prisma.telegramnotifySumOrderByAggregateInput;
};
export type telegramnotifyScalarWhereWithAggregatesInput = {
    AND?: Prisma.telegramnotifyScalarWhereWithAggregatesInput | Prisma.telegramnotifyScalarWhereWithAggregatesInput[];
    OR?: Prisma.telegramnotifyScalarWhereWithAggregatesInput[];
    NOT?: Prisma.telegramnotifyScalarWhereWithAggregatesInput | Prisma.telegramnotifyScalarWhereWithAggregatesInput[];
    id?: Prisma.BigIntWithAggregatesFilter<"telegramnotify"> | bigint | number;
    telegram_id?: Prisma.BigIntWithAggregatesFilter<"telegramnotify"> | bigint | number;
    username?: Prisma.StringWithAggregatesFilter<"telegramnotify"> | string;
    timestamp?: Prisma.DateTimeWithAggregatesFilter<"telegramnotify"> | Date | string;
};
export type telegramnotifyCreateInput = {
    id?: bigint | number;
    telegram_id: bigint | number;
    username: string;
    timestamp?: Date | string;
};
export type telegramnotifyUncheckedCreateInput = {
    id?: bigint | number;
    telegram_id: bigint | number;
    username: string;
    timestamp?: Date | string;
};
export type telegramnotifyUpdateInput = {
    id?: Prisma.BigIntFieldUpdateOperationsInput | bigint | number;
    telegram_id?: Prisma.BigIntFieldUpdateOperationsInput | bigint | number;
    username?: Prisma.StringFieldUpdateOperationsInput | string;
    timestamp?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type telegramnotifyUncheckedUpdateInput = {
    id?: Prisma.BigIntFieldUpdateOperationsInput | bigint | number;
    telegram_id?: Prisma.BigIntFieldUpdateOperationsInput | bigint | number;
    username?: Prisma.StringFieldUpdateOperationsInput | string;
    timestamp?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type telegramnotifyCreateManyInput = {
    id?: bigint | number;
    telegram_id: bigint | number;
    username: string;
    timestamp?: Date | string;
};
export type telegramnotifyUpdateManyMutationInput = {
    id?: Prisma.BigIntFieldUpdateOperationsInput | bigint | number;
    telegram_id?: Prisma.BigIntFieldUpdateOperationsInput | bigint | number;
    username?: Prisma.StringFieldUpdateOperationsInput | string;
    timestamp?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type telegramnotifyUncheckedUpdateManyInput = {
    id?: Prisma.BigIntFieldUpdateOperationsInput | bigint | number;
    telegram_id?: Prisma.BigIntFieldUpdateOperationsInput | bigint | number;
    username?: Prisma.StringFieldUpdateOperationsInput | string;
    timestamp?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type telegramnotifyCountOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    telegram_id?: Prisma.SortOrder;
    username?: Prisma.SortOrder;
    timestamp?: Prisma.SortOrder;
};
export type telegramnotifyAvgOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    telegram_id?: Prisma.SortOrder;
};
export type telegramnotifyMaxOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    telegram_id?: Prisma.SortOrder;
    username?: Prisma.SortOrder;
    timestamp?: Prisma.SortOrder;
};
export type telegramnotifyMinOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    telegram_id?: Prisma.SortOrder;
    username?: Prisma.SortOrder;
    timestamp?: Prisma.SortOrder;
};
export type telegramnotifySumOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    telegram_id?: Prisma.SortOrder;
};
export type telegramnotifySelect<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    telegram_id?: boolean;
    username?: boolean;
    timestamp?: boolean;
}, ExtArgs["result"]["telegramnotify"]>;
export type telegramnotifySelectCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    telegram_id?: boolean;
    username?: boolean;
    timestamp?: boolean;
}, ExtArgs["result"]["telegramnotify"]>;
export type telegramnotifySelectUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    telegram_id?: boolean;
    username?: boolean;
    timestamp?: boolean;
}, ExtArgs["result"]["telegramnotify"]>;
export type telegramnotifySelectScalar = {
    id?: boolean;
    telegram_id?: boolean;
    username?: boolean;
    timestamp?: boolean;
};
export type telegramnotifyOmit<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetOmit<"id" | "telegram_id" | "username" | "timestamp", ExtArgs["result"]["telegramnotify"]>;
export type $telegramnotifyPayload<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    name: "telegramnotify";
    objects: {};
    scalars: runtime.Types.Extensions.GetPayloadResult<{
        id: bigint;
        telegram_id: bigint;
        username: string;
        timestamp: Date;
    }, ExtArgs["result"]["telegramnotify"]>;
    composites: {};
};
export type telegramnotifyGetPayload<S extends boolean | null | undefined | telegramnotifyDefaultArgs> = runtime.Types.Result.GetResult<Prisma.$telegramnotifyPayload, S>;
export type telegramnotifyCountArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = Omit<telegramnotifyFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
    select?: TelegramnotifyCountAggregateInputType | true;
};
export interface telegramnotifyDelegate<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: {
        types: Prisma.TypeMap<ExtArgs>['model']['telegramnotify'];
        meta: {
            name: 'telegramnotify';
        };
    };
    findUnique<T extends telegramnotifyFindUniqueArgs>(args: Prisma.SelectSubset<T, telegramnotifyFindUniqueArgs<ExtArgs>>): Prisma.Prisma__telegramnotifyClient<runtime.Types.Result.GetResult<Prisma.$telegramnotifyPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    findUniqueOrThrow<T extends telegramnotifyFindUniqueOrThrowArgs>(args: Prisma.SelectSubset<T, telegramnotifyFindUniqueOrThrowArgs<ExtArgs>>): Prisma.Prisma__telegramnotifyClient<runtime.Types.Result.GetResult<Prisma.$telegramnotifyPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    findFirst<T extends telegramnotifyFindFirstArgs>(args?: Prisma.SelectSubset<T, telegramnotifyFindFirstArgs<ExtArgs>>): Prisma.Prisma__telegramnotifyClient<runtime.Types.Result.GetResult<Prisma.$telegramnotifyPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    findFirstOrThrow<T extends telegramnotifyFindFirstOrThrowArgs>(args?: Prisma.SelectSubset<T, telegramnotifyFindFirstOrThrowArgs<ExtArgs>>): Prisma.Prisma__telegramnotifyClient<runtime.Types.Result.GetResult<Prisma.$telegramnotifyPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    findMany<T extends telegramnotifyFindManyArgs>(args?: Prisma.SelectSubset<T, telegramnotifyFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$telegramnotifyPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>;
    create<T extends telegramnotifyCreateArgs>(args: Prisma.SelectSubset<T, telegramnotifyCreateArgs<ExtArgs>>): Prisma.Prisma__telegramnotifyClient<runtime.Types.Result.GetResult<Prisma.$telegramnotifyPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    createMany<T extends telegramnotifyCreateManyArgs>(args?: Prisma.SelectSubset<T, telegramnotifyCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    createManyAndReturn<T extends telegramnotifyCreateManyAndReturnArgs>(args?: Prisma.SelectSubset<T, telegramnotifyCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$telegramnotifyPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>;
    delete<T extends telegramnotifyDeleteArgs>(args: Prisma.SelectSubset<T, telegramnotifyDeleteArgs<ExtArgs>>): Prisma.Prisma__telegramnotifyClient<runtime.Types.Result.GetResult<Prisma.$telegramnotifyPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    update<T extends telegramnotifyUpdateArgs>(args: Prisma.SelectSubset<T, telegramnotifyUpdateArgs<ExtArgs>>): Prisma.Prisma__telegramnotifyClient<runtime.Types.Result.GetResult<Prisma.$telegramnotifyPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    deleteMany<T extends telegramnotifyDeleteManyArgs>(args?: Prisma.SelectSubset<T, telegramnotifyDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    updateMany<T extends telegramnotifyUpdateManyArgs>(args: Prisma.SelectSubset<T, telegramnotifyUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    updateManyAndReturn<T extends telegramnotifyUpdateManyAndReturnArgs>(args: Prisma.SelectSubset<T, telegramnotifyUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$telegramnotifyPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>;
    upsert<T extends telegramnotifyUpsertArgs>(args: Prisma.SelectSubset<T, telegramnotifyUpsertArgs<ExtArgs>>): Prisma.Prisma__telegramnotifyClient<runtime.Types.Result.GetResult<Prisma.$telegramnotifyPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    count<T extends telegramnotifyCountArgs>(args?: Prisma.Subset<T, telegramnotifyCountArgs>): Prisma.PrismaPromise<T extends runtime.Types.Utils.Record<'select', any> ? T['select'] extends true ? number : Prisma.GetScalarType<T['select'], TelegramnotifyCountAggregateOutputType> : number>;
    aggregate<T extends TelegramnotifyAggregateArgs>(args: Prisma.Subset<T, TelegramnotifyAggregateArgs>): Prisma.PrismaPromise<GetTelegramnotifyAggregateType<T>>;
    groupBy<T extends telegramnotifyGroupByArgs, HasSelectOrTake extends Prisma.Or<Prisma.Extends<'skip', Prisma.Keys<T>>, Prisma.Extends<'take', Prisma.Keys<T>>>, OrderByArg extends Prisma.True extends HasSelectOrTake ? {
        orderBy: telegramnotifyGroupByArgs['orderBy'];
    } : {
        orderBy?: telegramnotifyGroupByArgs['orderBy'];
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
    }[OrderFields]>(args: Prisma.SubsetIntersection<T, telegramnotifyGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetTelegramnotifyGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>;
    readonly fields: telegramnotifyFieldRefs;
}
export interface Prisma__telegramnotifyClient<T, Null = never, ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise";
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): runtime.Types.Utils.JsPromise<TResult1 | TResult2>;
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): runtime.Types.Utils.JsPromise<T | TResult>;
    finally(onfinally?: (() => void) | undefined | null): runtime.Types.Utils.JsPromise<T>;
}
export interface telegramnotifyFieldRefs {
    readonly id: Prisma.FieldRef<"telegramnotify", 'BigInt'>;
    readonly telegram_id: Prisma.FieldRef<"telegramnotify", 'BigInt'>;
    readonly username: Prisma.FieldRef<"telegramnotify", 'String'>;
    readonly timestamp: Prisma.FieldRef<"telegramnotify", 'DateTime'>;
}
export type telegramnotifyFindUniqueArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.telegramnotifySelect<ExtArgs> | null;
    omit?: Prisma.telegramnotifyOmit<ExtArgs> | null;
    where: Prisma.telegramnotifyWhereUniqueInput;
};
export type telegramnotifyFindUniqueOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.telegramnotifySelect<ExtArgs> | null;
    omit?: Prisma.telegramnotifyOmit<ExtArgs> | null;
    where: Prisma.telegramnotifyWhereUniqueInput;
};
export type telegramnotifyFindFirstArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.telegramnotifySelect<ExtArgs> | null;
    omit?: Prisma.telegramnotifyOmit<ExtArgs> | null;
    where?: Prisma.telegramnotifyWhereInput;
    orderBy?: Prisma.telegramnotifyOrderByWithRelationInput | Prisma.telegramnotifyOrderByWithRelationInput[];
    cursor?: Prisma.telegramnotifyWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.TelegramnotifyScalarFieldEnum | Prisma.TelegramnotifyScalarFieldEnum[];
};
export type telegramnotifyFindFirstOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.telegramnotifySelect<ExtArgs> | null;
    omit?: Prisma.telegramnotifyOmit<ExtArgs> | null;
    where?: Prisma.telegramnotifyWhereInput;
    orderBy?: Prisma.telegramnotifyOrderByWithRelationInput | Prisma.telegramnotifyOrderByWithRelationInput[];
    cursor?: Prisma.telegramnotifyWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.TelegramnotifyScalarFieldEnum | Prisma.TelegramnotifyScalarFieldEnum[];
};
export type telegramnotifyFindManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.telegramnotifySelect<ExtArgs> | null;
    omit?: Prisma.telegramnotifyOmit<ExtArgs> | null;
    where?: Prisma.telegramnotifyWhereInput;
    orderBy?: Prisma.telegramnotifyOrderByWithRelationInput | Prisma.telegramnotifyOrderByWithRelationInput[];
    cursor?: Prisma.telegramnotifyWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.TelegramnotifyScalarFieldEnum | Prisma.TelegramnotifyScalarFieldEnum[];
};
export type telegramnotifyCreateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.telegramnotifySelect<ExtArgs> | null;
    omit?: Prisma.telegramnotifyOmit<ExtArgs> | null;
    data: Prisma.XOR<Prisma.telegramnotifyCreateInput, Prisma.telegramnotifyUncheckedCreateInput>;
};
export type telegramnotifyCreateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    data: Prisma.telegramnotifyCreateManyInput | Prisma.telegramnotifyCreateManyInput[];
    skipDuplicates?: boolean;
};
export type telegramnotifyCreateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.telegramnotifySelectCreateManyAndReturn<ExtArgs> | null;
    omit?: Prisma.telegramnotifyOmit<ExtArgs> | null;
    data: Prisma.telegramnotifyCreateManyInput | Prisma.telegramnotifyCreateManyInput[];
    skipDuplicates?: boolean;
};
export type telegramnotifyUpdateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.telegramnotifySelect<ExtArgs> | null;
    omit?: Prisma.telegramnotifyOmit<ExtArgs> | null;
    data: Prisma.XOR<Prisma.telegramnotifyUpdateInput, Prisma.telegramnotifyUncheckedUpdateInput>;
    where: Prisma.telegramnotifyWhereUniqueInput;
};
export type telegramnotifyUpdateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    data: Prisma.XOR<Prisma.telegramnotifyUpdateManyMutationInput, Prisma.telegramnotifyUncheckedUpdateManyInput>;
    where?: Prisma.telegramnotifyWhereInput;
    limit?: number;
};
export type telegramnotifyUpdateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.telegramnotifySelectUpdateManyAndReturn<ExtArgs> | null;
    omit?: Prisma.telegramnotifyOmit<ExtArgs> | null;
    data: Prisma.XOR<Prisma.telegramnotifyUpdateManyMutationInput, Prisma.telegramnotifyUncheckedUpdateManyInput>;
    where?: Prisma.telegramnotifyWhereInput;
    limit?: number;
};
export type telegramnotifyUpsertArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.telegramnotifySelect<ExtArgs> | null;
    omit?: Prisma.telegramnotifyOmit<ExtArgs> | null;
    where: Prisma.telegramnotifyWhereUniqueInput;
    create: Prisma.XOR<Prisma.telegramnotifyCreateInput, Prisma.telegramnotifyUncheckedCreateInput>;
    update: Prisma.XOR<Prisma.telegramnotifyUpdateInput, Prisma.telegramnotifyUncheckedUpdateInput>;
};
export type telegramnotifyDeleteArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.telegramnotifySelect<ExtArgs> | null;
    omit?: Prisma.telegramnotifyOmit<ExtArgs> | null;
    where: Prisma.telegramnotifyWhereUniqueInput;
};
export type telegramnotifyDeleteManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.telegramnotifyWhereInput;
    limit?: number;
};
export type telegramnotifyDefaultArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.telegramnotifySelect<ExtArgs> | null;
    omit?: Prisma.telegramnotifyOmit<ExtArgs> | null;
};
export {};
