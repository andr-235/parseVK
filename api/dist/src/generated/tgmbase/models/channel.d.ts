import type * as runtime from "@prisma/client/runtime/client";
import type * as Prisma from "../internal/prismaNamespace.js";
export type channelModel = runtime.Types.Result.DefaultSelection<Prisma.$channelPayload>;
export type AggregateChannel = {
    _count: ChannelCountAggregateOutputType | null;
    _avg: ChannelAvgAggregateOutputType | null;
    _sum: ChannelSumAggregateOutputType | null;
    _min: ChannelMinAggregateOutputType | null;
    _max: ChannelMaxAggregateOutputType | null;
};
export type ChannelAvgAggregateOutputType = {
    id: number | null;
    channel_id: number | null;
    participants_count: number | null;
    region: number | null;
};
export type ChannelSumAggregateOutputType = {
    id: bigint | null;
    channel_id: bigint | null;
    participants_count: bigint | null;
    region: number | null;
};
export type ChannelMinAggregateOutputType = {
    id: bigint | null;
    channel_id: bigint | null;
    title: string | null;
    date: Date | null;
    scam: boolean | null;
    username: string | null;
    participants_count: bigint | null;
    region: number | null;
    description: string | null;
    upd_date: Date | null;
};
export type ChannelMaxAggregateOutputType = {
    id: bigint | null;
    channel_id: bigint | null;
    title: string | null;
    date: Date | null;
    scam: boolean | null;
    username: string | null;
    participants_count: bigint | null;
    region: number | null;
    description: string | null;
    upd_date: Date | null;
};
export type ChannelCountAggregateOutputType = {
    id: number;
    channel_id: number;
    title: number;
    date: number;
    scam: number;
    username: number;
    participants_count: number;
    region: number;
    description: number;
    upd_date: number;
    _all: number;
};
export type ChannelAvgAggregateInputType = {
    id?: true;
    channel_id?: true;
    participants_count?: true;
    region?: true;
};
export type ChannelSumAggregateInputType = {
    id?: true;
    channel_id?: true;
    participants_count?: true;
    region?: true;
};
export type ChannelMinAggregateInputType = {
    id?: true;
    channel_id?: true;
    title?: true;
    date?: true;
    scam?: true;
    username?: true;
    participants_count?: true;
    region?: true;
    description?: true;
    upd_date?: true;
};
export type ChannelMaxAggregateInputType = {
    id?: true;
    channel_id?: true;
    title?: true;
    date?: true;
    scam?: true;
    username?: true;
    participants_count?: true;
    region?: true;
    description?: true;
    upd_date?: true;
};
export type ChannelCountAggregateInputType = {
    id?: true;
    channel_id?: true;
    title?: true;
    date?: true;
    scam?: true;
    username?: true;
    participants_count?: true;
    region?: true;
    description?: true;
    upd_date?: true;
    _all?: true;
};
export type ChannelAggregateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.channelWhereInput;
    orderBy?: Prisma.channelOrderByWithRelationInput | Prisma.channelOrderByWithRelationInput[];
    cursor?: Prisma.channelWhereUniqueInput;
    take?: number;
    skip?: number;
    _count?: true | ChannelCountAggregateInputType;
    _avg?: ChannelAvgAggregateInputType;
    _sum?: ChannelSumAggregateInputType;
    _min?: ChannelMinAggregateInputType;
    _max?: ChannelMaxAggregateInputType;
};
export type GetChannelAggregateType<T extends ChannelAggregateArgs> = {
    [P in keyof T & keyof AggregateChannel]: P extends '_count' | 'count' ? T[P] extends true ? number : Prisma.GetScalarType<T[P], AggregateChannel[P]> : Prisma.GetScalarType<T[P], AggregateChannel[P]>;
};
export type channelGroupByArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.channelWhereInput;
    orderBy?: Prisma.channelOrderByWithAggregationInput | Prisma.channelOrderByWithAggregationInput[];
    by: Prisma.ChannelScalarFieldEnum[] | Prisma.ChannelScalarFieldEnum;
    having?: Prisma.channelScalarWhereWithAggregatesInput;
    take?: number;
    skip?: number;
    _count?: ChannelCountAggregateInputType | true;
    _avg?: ChannelAvgAggregateInputType;
    _sum?: ChannelSumAggregateInputType;
    _min?: ChannelMinAggregateInputType;
    _max?: ChannelMaxAggregateInputType;
};
export type ChannelGroupByOutputType = {
    id: bigint;
    channel_id: bigint;
    title: string;
    date: Date;
    scam: boolean;
    username: string | null;
    participants_count: bigint | null;
    region: number;
    description: string | null;
    upd_date: Date | null;
    _count: ChannelCountAggregateOutputType | null;
    _avg: ChannelAvgAggregateOutputType | null;
    _sum: ChannelSumAggregateOutputType | null;
    _min: ChannelMinAggregateOutputType | null;
    _max: ChannelMaxAggregateOutputType | null;
};
type GetChannelGroupByPayload<T extends channelGroupByArgs> = Prisma.PrismaPromise<Array<Prisma.PickEnumerable<ChannelGroupByOutputType, T['by']> & {
    [P in ((keyof T) & (keyof ChannelGroupByOutputType))]: P extends '_count' ? T[P] extends boolean ? number : Prisma.GetScalarType<T[P], ChannelGroupByOutputType[P]> : Prisma.GetScalarType<T[P], ChannelGroupByOutputType[P]>;
}>>;
export type channelWhereInput = {
    AND?: Prisma.channelWhereInput | Prisma.channelWhereInput[];
    OR?: Prisma.channelWhereInput[];
    NOT?: Prisma.channelWhereInput | Prisma.channelWhereInput[];
    id?: Prisma.BigIntFilter<"channel"> | bigint | number;
    channel_id?: Prisma.BigIntFilter<"channel"> | bigint | number;
    title?: Prisma.StringFilter<"channel"> | string;
    date?: Prisma.DateTimeFilter<"channel"> | Date | string;
    scam?: Prisma.BoolFilter<"channel"> | boolean;
    username?: Prisma.StringNullableFilter<"channel"> | string | null;
    participants_count?: Prisma.BigIntNullableFilter<"channel"> | bigint | number | null;
    region?: Prisma.IntFilter<"channel"> | number;
    description?: Prisma.StringNullableFilter<"channel"> | string | null;
    upd_date?: Prisma.DateTimeNullableFilter<"channel"> | Date | string | null;
};
export type channelOrderByWithRelationInput = {
    id?: Prisma.SortOrder;
    channel_id?: Prisma.SortOrder;
    title?: Prisma.SortOrder;
    date?: Prisma.SortOrder;
    scam?: Prisma.SortOrder;
    username?: Prisma.SortOrderInput | Prisma.SortOrder;
    participants_count?: Prisma.SortOrderInput | Prisma.SortOrder;
    region?: Prisma.SortOrder;
    description?: Prisma.SortOrderInput | Prisma.SortOrder;
    upd_date?: Prisma.SortOrderInput | Prisma.SortOrder;
};
export type channelWhereUniqueInput = Prisma.AtLeast<{
    id?: bigint | number;
    channel_id?: bigint | number;
    username?: string;
    AND?: Prisma.channelWhereInput | Prisma.channelWhereInput[];
    OR?: Prisma.channelWhereInput[];
    NOT?: Prisma.channelWhereInput | Prisma.channelWhereInput[];
    title?: Prisma.StringFilter<"channel"> | string;
    date?: Prisma.DateTimeFilter<"channel"> | Date | string;
    scam?: Prisma.BoolFilter<"channel"> | boolean;
    participants_count?: Prisma.BigIntNullableFilter<"channel"> | bigint | number | null;
    region?: Prisma.IntFilter<"channel"> | number;
    description?: Prisma.StringNullableFilter<"channel"> | string | null;
    upd_date?: Prisma.DateTimeNullableFilter<"channel"> | Date | string | null;
}, "id" | "channel_id" | "username">;
export type channelOrderByWithAggregationInput = {
    id?: Prisma.SortOrder;
    channel_id?: Prisma.SortOrder;
    title?: Prisma.SortOrder;
    date?: Prisma.SortOrder;
    scam?: Prisma.SortOrder;
    username?: Prisma.SortOrderInput | Prisma.SortOrder;
    participants_count?: Prisma.SortOrderInput | Prisma.SortOrder;
    region?: Prisma.SortOrder;
    description?: Prisma.SortOrderInput | Prisma.SortOrder;
    upd_date?: Prisma.SortOrderInput | Prisma.SortOrder;
    _count?: Prisma.channelCountOrderByAggregateInput;
    _avg?: Prisma.channelAvgOrderByAggregateInput;
    _max?: Prisma.channelMaxOrderByAggregateInput;
    _min?: Prisma.channelMinOrderByAggregateInput;
    _sum?: Prisma.channelSumOrderByAggregateInput;
};
export type channelScalarWhereWithAggregatesInput = {
    AND?: Prisma.channelScalarWhereWithAggregatesInput | Prisma.channelScalarWhereWithAggregatesInput[];
    OR?: Prisma.channelScalarWhereWithAggregatesInput[];
    NOT?: Prisma.channelScalarWhereWithAggregatesInput | Prisma.channelScalarWhereWithAggregatesInput[];
    id?: Prisma.BigIntWithAggregatesFilter<"channel"> | bigint | number;
    channel_id?: Prisma.BigIntWithAggregatesFilter<"channel"> | bigint | number;
    title?: Prisma.StringWithAggregatesFilter<"channel"> | string;
    date?: Prisma.DateTimeWithAggregatesFilter<"channel"> | Date | string;
    scam?: Prisma.BoolWithAggregatesFilter<"channel"> | boolean;
    username?: Prisma.StringNullableWithAggregatesFilter<"channel"> | string | null;
    participants_count?: Prisma.BigIntNullableWithAggregatesFilter<"channel"> | bigint | number | null;
    region?: Prisma.IntWithAggregatesFilter<"channel"> | number;
    description?: Prisma.StringNullableWithAggregatesFilter<"channel"> | string | null;
    upd_date?: Prisma.DateTimeNullableWithAggregatesFilter<"channel"> | Date | string | null;
};
export type channelCreateInput = {
    id?: bigint | number;
    channel_id: bigint | number;
    title: string;
    date: Date | string;
    scam?: boolean;
    username?: string | null;
    participants_count?: bigint | number | null;
    region?: number;
    description?: string | null;
    upd_date?: Date | string | null;
};
export type channelUncheckedCreateInput = {
    id?: bigint | number;
    channel_id: bigint | number;
    title: string;
    date: Date | string;
    scam?: boolean;
    username?: string | null;
    participants_count?: bigint | number | null;
    region?: number;
    description?: string | null;
    upd_date?: Date | string | null;
};
export type channelUpdateInput = {
    id?: Prisma.BigIntFieldUpdateOperationsInput | bigint | number;
    channel_id?: Prisma.BigIntFieldUpdateOperationsInput | bigint | number;
    title?: Prisma.StringFieldUpdateOperationsInput | string;
    date?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    scam?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    username?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    participants_count?: Prisma.NullableBigIntFieldUpdateOperationsInput | bigint | number | null;
    region?: Prisma.IntFieldUpdateOperationsInput | number;
    description?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    upd_date?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
};
export type channelUncheckedUpdateInput = {
    id?: Prisma.BigIntFieldUpdateOperationsInput | bigint | number;
    channel_id?: Prisma.BigIntFieldUpdateOperationsInput | bigint | number;
    title?: Prisma.StringFieldUpdateOperationsInput | string;
    date?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    scam?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    username?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    participants_count?: Prisma.NullableBigIntFieldUpdateOperationsInput | bigint | number | null;
    region?: Prisma.IntFieldUpdateOperationsInput | number;
    description?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    upd_date?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
};
export type channelCreateManyInput = {
    id?: bigint | number;
    channel_id: bigint | number;
    title: string;
    date: Date | string;
    scam?: boolean;
    username?: string | null;
    participants_count?: bigint | number | null;
    region?: number;
    description?: string | null;
    upd_date?: Date | string | null;
};
export type channelUpdateManyMutationInput = {
    id?: Prisma.BigIntFieldUpdateOperationsInput | bigint | number;
    channel_id?: Prisma.BigIntFieldUpdateOperationsInput | bigint | number;
    title?: Prisma.StringFieldUpdateOperationsInput | string;
    date?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    scam?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    username?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    participants_count?: Prisma.NullableBigIntFieldUpdateOperationsInput | bigint | number | null;
    region?: Prisma.IntFieldUpdateOperationsInput | number;
    description?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    upd_date?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
};
export type channelUncheckedUpdateManyInput = {
    id?: Prisma.BigIntFieldUpdateOperationsInput | bigint | number;
    channel_id?: Prisma.BigIntFieldUpdateOperationsInput | bigint | number;
    title?: Prisma.StringFieldUpdateOperationsInput | string;
    date?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    scam?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    username?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    participants_count?: Prisma.NullableBigIntFieldUpdateOperationsInput | bigint | number | null;
    region?: Prisma.IntFieldUpdateOperationsInput | number;
    description?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    upd_date?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
};
export type channelCountOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    channel_id?: Prisma.SortOrder;
    title?: Prisma.SortOrder;
    date?: Prisma.SortOrder;
    scam?: Prisma.SortOrder;
    username?: Prisma.SortOrder;
    participants_count?: Prisma.SortOrder;
    region?: Prisma.SortOrder;
    description?: Prisma.SortOrder;
    upd_date?: Prisma.SortOrder;
};
export type channelAvgOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    channel_id?: Prisma.SortOrder;
    participants_count?: Prisma.SortOrder;
    region?: Prisma.SortOrder;
};
export type channelMaxOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    channel_id?: Prisma.SortOrder;
    title?: Prisma.SortOrder;
    date?: Prisma.SortOrder;
    scam?: Prisma.SortOrder;
    username?: Prisma.SortOrder;
    participants_count?: Prisma.SortOrder;
    region?: Prisma.SortOrder;
    description?: Prisma.SortOrder;
    upd_date?: Prisma.SortOrder;
};
export type channelMinOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    channel_id?: Prisma.SortOrder;
    title?: Prisma.SortOrder;
    date?: Prisma.SortOrder;
    scam?: Prisma.SortOrder;
    username?: Prisma.SortOrder;
    participants_count?: Prisma.SortOrder;
    region?: Prisma.SortOrder;
    description?: Prisma.SortOrder;
    upd_date?: Prisma.SortOrder;
};
export type channelSumOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    channel_id?: Prisma.SortOrder;
    participants_count?: Prisma.SortOrder;
    region?: Prisma.SortOrder;
};
export type BigIntFieldUpdateOperationsInput = {
    set?: bigint | number;
    increment?: bigint | number;
    decrement?: bigint | number;
    multiply?: bigint | number;
    divide?: bigint | number;
};
export type StringFieldUpdateOperationsInput = {
    set?: string;
};
export type DateTimeFieldUpdateOperationsInput = {
    set?: Date | string;
};
export type BoolFieldUpdateOperationsInput = {
    set?: boolean;
};
export type NullableStringFieldUpdateOperationsInput = {
    set?: string | null;
};
export type NullableBigIntFieldUpdateOperationsInput = {
    set?: bigint | number | null;
    increment?: bigint | number;
    decrement?: bigint | number;
    multiply?: bigint | number;
    divide?: bigint | number;
};
export type IntFieldUpdateOperationsInput = {
    set?: number;
    increment?: number;
    decrement?: number;
    multiply?: number;
    divide?: number;
};
export type NullableDateTimeFieldUpdateOperationsInput = {
    set?: Date | string | null;
};
export type channelSelect<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    channel_id?: boolean;
    title?: boolean;
    date?: boolean;
    scam?: boolean;
    username?: boolean;
    participants_count?: boolean;
    region?: boolean;
    description?: boolean;
    upd_date?: boolean;
}, ExtArgs["result"]["channel"]>;
export type channelSelectCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    channel_id?: boolean;
    title?: boolean;
    date?: boolean;
    scam?: boolean;
    username?: boolean;
    participants_count?: boolean;
    region?: boolean;
    description?: boolean;
    upd_date?: boolean;
}, ExtArgs["result"]["channel"]>;
export type channelSelectUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    channel_id?: boolean;
    title?: boolean;
    date?: boolean;
    scam?: boolean;
    username?: boolean;
    participants_count?: boolean;
    region?: boolean;
    description?: boolean;
    upd_date?: boolean;
}, ExtArgs["result"]["channel"]>;
export type channelSelectScalar = {
    id?: boolean;
    channel_id?: boolean;
    title?: boolean;
    date?: boolean;
    scam?: boolean;
    username?: boolean;
    participants_count?: boolean;
    region?: boolean;
    description?: boolean;
    upd_date?: boolean;
};
export type channelOmit<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetOmit<"id" | "channel_id" | "title" | "date" | "scam" | "username" | "participants_count" | "region" | "description" | "upd_date", ExtArgs["result"]["channel"]>;
export type $channelPayload<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    name: "channel";
    objects: {};
    scalars: runtime.Types.Extensions.GetPayloadResult<{
        id: bigint;
        channel_id: bigint;
        title: string;
        date: Date;
        scam: boolean;
        username: string | null;
        participants_count: bigint | null;
        region: number;
        description: string | null;
        upd_date: Date | null;
    }, ExtArgs["result"]["channel"]>;
    composites: {};
};
export type channelGetPayload<S extends boolean | null | undefined | channelDefaultArgs> = runtime.Types.Result.GetResult<Prisma.$channelPayload, S>;
export type channelCountArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = Omit<channelFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
    select?: ChannelCountAggregateInputType | true;
};
export interface channelDelegate<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: {
        types: Prisma.TypeMap<ExtArgs>['model']['channel'];
        meta: {
            name: 'channel';
        };
    };
    findUnique<T extends channelFindUniqueArgs>(args: Prisma.SelectSubset<T, channelFindUniqueArgs<ExtArgs>>): Prisma.Prisma__channelClient<runtime.Types.Result.GetResult<Prisma.$channelPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    findUniqueOrThrow<T extends channelFindUniqueOrThrowArgs>(args: Prisma.SelectSubset<T, channelFindUniqueOrThrowArgs<ExtArgs>>): Prisma.Prisma__channelClient<runtime.Types.Result.GetResult<Prisma.$channelPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    findFirst<T extends channelFindFirstArgs>(args?: Prisma.SelectSubset<T, channelFindFirstArgs<ExtArgs>>): Prisma.Prisma__channelClient<runtime.Types.Result.GetResult<Prisma.$channelPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    findFirstOrThrow<T extends channelFindFirstOrThrowArgs>(args?: Prisma.SelectSubset<T, channelFindFirstOrThrowArgs<ExtArgs>>): Prisma.Prisma__channelClient<runtime.Types.Result.GetResult<Prisma.$channelPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    findMany<T extends channelFindManyArgs>(args?: Prisma.SelectSubset<T, channelFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$channelPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>;
    create<T extends channelCreateArgs>(args: Prisma.SelectSubset<T, channelCreateArgs<ExtArgs>>): Prisma.Prisma__channelClient<runtime.Types.Result.GetResult<Prisma.$channelPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    createMany<T extends channelCreateManyArgs>(args?: Prisma.SelectSubset<T, channelCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    createManyAndReturn<T extends channelCreateManyAndReturnArgs>(args?: Prisma.SelectSubset<T, channelCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$channelPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>;
    delete<T extends channelDeleteArgs>(args: Prisma.SelectSubset<T, channelDeleteArgs<ExtArgs>>): Prisma.Prisma__channelClient<runtime.Types.Result.GetResult<Prisma.$channelPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    update<T extends channelUpdateArgs>(args: Prisma.SelectSubset<T, channelUpdateArgs<ExtArgs>>): Prisma.Prisma__channelClient<runtime.Types.Result.GetResult<Prisma.$channelPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    deleteMany<T extends channelDeleteManyArgs>(args?: Prisma.SelectSubset<T, channelDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    updateMany<T extends channelUpdateManyArgs>(args: Prisma.SelectSubset<T, channelUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    updateManyAndReturn<T extends channelUpdateManyAndReturnArgs>(args: Prisma.SelectSubset<T, channelUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$channelPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>;
    upsert<T extends channelUpsertArgs>(args: Prisma.SelectSubset<T, channelUpsertArgs<ExtArgs>>): Prisma.Prisma__channelClient<runtime.Types.Result.GetResult<Prisma.$channelPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    count<T extends channelCountArgs>(args?: Prisma.Subset<T, channelCountArgs>): Prisma.PrismaPromise<T extends runtime.Types.Utils.Record<'select', any> ? T['select'] extends true ? number : Prisma.GetScalarType<T['select'], ChannelCountAggregateOutputType> : number>;
    aggregate<T extends ChannelAggregateArgs>(args: Prisma.Subset<T, ChannelAggregateArgs>): Prisma.PrismaPromise<GetChannelAggregateType<T>>;
    groupBy<T extends channelGroupByArgs, HasSelectOrTake extends Prisma.Or<Prisma.Extends<'skip', Prisma.Keys<T>>, Prisma.Extends<'take', Prisma.Keys<T>>>, OrderByArg extends Prisma.True extends HasSelectOrTake ? {
        orderBy: channelGroupByArgs['orderBy'];
    } : {
        orderBy?: channelGroupByArgs['orderBy'];
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
    }[OrderFields]>(args: Prisma.SubsetIntersection<T, channelGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetChannelGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>;
    readonly fields: channelFieldRefs;
}
export interface Prisma__channelClient<T, Null = never, ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise";
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): runtime.Types.Utils.JsPromise<TResult1 | TResult2>;
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): runtime.Types.Utils.JsPromise<T | TResult>;
    finally(onfinally?: (() => void) | undefined | null): runtime.Types.Utils.JsPromise<T>;
}
export interface channelFieldRefs {
    readonly id: Prisma.FieldRef<"channel", 'BigInt'>;
    readonly channel_id: Prisma.FieldRef<"channel", 'BigInt'>;
    readonly title: Prisma.FieldRef<"channel", 'String'>;
    readonly date: Prisma.FieldRef<"channel", 'DateTime'>;
    readonly scam: Prisma.FieldRef<"channel", 'Boolean'>;
    readonly username: Prisma.FieldRef<"channel", 'String'>;
    readonly participants_count: Prisma.FieldRef<"channel", 'BigInt'>;
    readonly region: Prisma.FieldRef<"channel", 'Int'>;
    readonly description: Prisma.FieldRef<"channel", 'String'>;
    readonly upd_date: Prisma.FieldRef<"channel", 'DateTime'>;
}
export type channelFindUniqueArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.channelSelect<ExtArgs> | null;
    omit?: Prisma.channelOmit<ExtArgs> | null;
    where: Prisma.channelWhereUniqueInput;
};
export type channelFindUniqueOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.channelSelect<ExtArgs> | null;
    omit?: Prisma.channelOmit<ExtArgs> | null;
    where: Prisma.channelWhereUniqueInput;
};
export type channelFindFirstArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.channelSelect<ExtArgs> | null;
    omit?: Prisma.channelOmit<ExtArgs> | null;
    where?: Prisma.channelWhereInput;
    orderBy?: Prisma.channelOrderByWithRelationInput | Prisma.channelOrderByWithRelationInput[];
    cursor?: Prisma.channelWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.ChannelScalarFieldEnum | Prisma.ChannelScalarFieldEnum[];
};
export type channelFindFirstOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.channelSelect<ExtArgs> | null;
    omit?: Prisma.channelOmit<ExtArgs> | null;
    where?: Prisma.channelWhereInput;
    orderBy?: Prisma.channelOrderByWithRelationInput | Prisma.channelOrderByWithRelationInput[];
    cursor?: Prisma.channelWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.ChannelScalarFieldEnum | Prisma.ChannelScalarFieldEnum[];
};
export type channelFindManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.channelSelect<ExtArgs> | null;
    omit?: Prisma.channelOmit<ExtArgs> | null;
    where?: Prisma.channelWhereInput;
    orderBy?: Prisma.channelOrderByWithRelationInput | Prisma.channelOrderByWithRelationInput[];
    cursor?: Prisma.channelWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.ChannelScalarFieldEnum | Prisma.ChannelScalarFieldEnum[];
};
export type channelCreateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.channelSelect<ExtArgs> | null;
    omit?: Prisma.channelOmit<ExtArgs> | null;
    data: Prisma.XOR<Prisma.channelCreateInput, Prisma.channelUncheckedCreateInput>;
};
export type channelCreateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    data: Prisma.channelCreateManyInput | Prisma.channelCreateManyInput[];
    skipDuplicates?: boolean;
};
export type channelCreateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.channelSelectCreateManyAndReturn<ExtArgs> | null;
    omit?: Prisma.channelOmit<ExtArgs> | null;
    data: Prisma.channelCreateManyInput | Prisma.channelCreateManyInput[];
    skipDuplicates?: boolean;
};
export type channelUpdateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.channelSelect<ExtArgs> | null;
    omit?: Prisma.channelOmit<ExtArgs> | null;
    data: Prisma.XOR<Prisma.channelUpdateInput, Prisma.channelUncheckedUpdateInput>;
    where: Prisma.channelWhereUniqueInput;
};
export type channelUpdateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    data: Prisma.XOR<Prisma.channelUpdateManyMutationInput, Prisma.channelUncheckedUpdateManyInput>;
    where?: Prisma.channelWhereInput;
    limit?: number;
};
export type channelUpdateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.channelSelectUpdateManyAndReturn<ExtArgs> | null;
    omit?: Prisma.channelOmit<ExtArgs> | null;
    data: Prisma.XOR<Prisma.channelUpdateManyMutationInput, Prisma.channelUncheckedUpdateManyInput>;
    where?: Prisma.channelWhereInput;
    limit?: number;
};
export type channelUpsertArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.channelSelect<ExtArgs> | null;
    omit?: Prisma.channelOmit<ExtArgs> | null;
    where: Prisma.channelWhereUniqueInput;
    create: Prisma.XOR<Prisma.channelCreateInput, Prisma.channelUncheckedCreateInput>;
    update: Prisma.XOR<Prisma.channelUpdateInput, Prisma.channelUncheckedUpdateInput>;
};
export type channelDeleteArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.channelSelect<ExtArgs> | null;
    omit?: Prisma.channelOmit<ExtArgs> | null;
    where: Prisma.channelWhereUniqueInput;
};
export type channelDeleteManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.channelWhereInput;
    limit?: number;
};
export type channelDefaultArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.channelSelect<ExtArgs> | null;
    omit?: Prisma.channelOmit<ExtArgs> | null;
};
export {};
