import type * as runtime from "@prisma/client/runtime/client";
import type * as Prisma from "../internal/prismaNamespace.js";
export type messageModel = runtime.Types.Result.DefaultSelection<Prisma.$messagePayload>;
export type AggregateMessage = {
    _count: MessageCountAggregateOutputType | null;
    _avg: MessageAvgAggregateOutputType | null;
    _sum: MessageSumAggregateOutputType | null;
    _min: MessageMinAggregateOutputType | null;
    _max: MessageMaxAggregateOutputType | null;
};
export type MessageAvgAggregateOutputType = {
    id: number | null;
    message_id: number | null;
    peer_id: number | null;
    from_id: number | null;
    reply_to: number | null;
};
export type MessageSumAggregateOutputType = {
    id: bigint | null;
    message_id: bigint | null;
    peer_id: bigint | null;
    from_id: bigint | null;
    reply_to: bigint | null;
};
export type MessageMinAggregateOutputType = {
    id: bigint | null;
    message_id: bigint | null;
    peer_id: bigint | null;
    date: Date | null;
    message: string | null;
    from_id: bigint | null;
    forwarded: boolean | null;
    reply_to: bigint | null;
    media: boolean | null;
    keywords: string | null;
};
export type MessageMaxAggregateOutputType = {
    id: bigint | null;
    message_id: bigint | null;
    peer_id: bigint | null;
    date: Date | null;
    message: string | null;
    from_id: bigint | null;
    forwarded: boolean | null;
    reply_to: bigint | null;
    media: boolean | null;
    keywords: string | null;
};
export type MessageCountAggregateOutputType = {
    id: number;
    message_id: number;
    peer_id: number;
    date: number;
    message: number;
    from_id: number;
    forwarded: number;
    reply_to: number;
    media: number;
    keywords: number;
    _all: number;
};
export type MessageAvgAggregateInputType = {
    id?: true;
    message_id?: true;
    peer_id?: true;
    from_id?: true;
    reply_to?: true;
};
export type MessageSumAggregateInputType = {
    id?: true;
    message_id?: true;
    peer_id?: true;
    from_id?: true;
    reply_to?: true;
};
export type MessageMinAggregateInputType = {
    id?: true;
    message_id?: true;
    peer_id?: true;
    date?: true;
    message?: true;
    from_id?: true;
    forwarded?: true;
    reply_to?: true;
    media?: true;
    keywords?: true;
};
export type MessageMaxAggregateInputType = {
    id?: true;
    message_id?: true;
    peer_id?: true;
    date?: true;
    message?: true;
    from_id?: true;
    forwarded?: true;
    reply_to?: true;
    media?: true;
    keywords?: true;
};
export type MessageCountAggregateInputType = {
    id?: true;
    message_id?: true;
    peer_id?: true;
    date?: true;
    message?: true;
    from_id?: true;
    forwarded?: true;
    reply_to?: true;
    media?: true;
    keywords?: true;
    _all?: true;
};
export type MessageAggregateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.messageWhereInput;
    orderBy?: Prisma.messageOrderByWithRelationInput | Prisma.messageOrderByWithRelationInput[];
    cursor?: Prisma.messageWhereUniqueInput;
    take?: number;
    skip?: number;
    _count?: true | MessageCountAggregateInputType;
    _avg?: MessageAvgAggregateInputType;
    _sum?: MessageSumAggregateInputType;
    _min?: MessageMinAggregateInputType;
    _max?: MessageMaxAggregateInputType;
};
export type GetMessageAggregateType<T extends MessageAggregateArgs> = {
    [P in keyof T & keyof AggregateMessage]: P extends '_count' | 'count' ? T[P] extends true ? number : Prisma.GetScalarType<T[P], AggregateMessage[P]> : Prisma.GetScalarType<T[P], AggregateMessage[P]>;
};
export type messageGroupByArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.messageWhereInput;
    orderBy?: Prisma.messageOrderByWithAggregationInput | Prisma.messageOrderByWithAggregationInput[];
    by: Prisma.MessageScalarFieldEnum[] | Prisma.MessageScalarFieldEnum;
    having?: Prisma.messageScalarWhereWithAggregatesInput;
    take?: number;
    skip?: number;
    _count?: MessageCountAggregateInputType | true;
    _avg?: MessageAvgAggregateInputType;
    _sum?: MessageSumAggregateInputType;
    _min?: MessageMinAggregateInputType;
    _max?: MessageMaxAggregateInputType;
};
export type MessageGroupByOutputType = {
    id: bigint;
    message_id: bigint;
    peer_id: bigint;
    date: Date;
    message: string | null;
    from_id: bigint | null;
    forwarded: boolean | null;
    reply_to: bigint | null;
    media: boolean | null;
    keywords: string | null;
    _count: MessageCountAggregateOutputType | null;
    _avg: MessageAvgAggregateOutputType | null;
    _sum: MessageSumAggregateOutputType | null;
    _min: MessageMinAggregateOutputType | null;
    _max: MessageMaxAggregateOutputType | null;
};
type GetMessageGroupByPayload<T extends messageGroupByArgs> = Prisma.PrismaPromise<Array<Prisma.PickEnumerable<MessageGroupByOutputType, T['by']> & {
    [P in ((keyof T) & (keyof MessageGroupByOutputType))]: P extends '_count' ? T[P] extends boolean ? number : Prisma.GetScalarType<T[P], MessageGroupByOutputType[P]> : Prisma.GetScalarType<T[P], MessageGroupByOutputType[P]>;
}>>;
export type messageWhereInput = {
    AND?: Prisma.messageWhereInput | Prisma.messageWhereInput[];
    OR?: Prisma.messageWhereInput[];
    NOT?: Prisma.messageWhereInput | Prisma.messageWhereInput[];
    id?: Prisma.BigIntFilter<"message"> | bigint | number;
    message_id?: Prisma.BigIntFilter<"message"> | bigint | number;
    peer_id?: Prisma.BigIntFilter<"message"> | bigint | number;
    date?: Prisma.DateTimeFilter<"message"> | Date | string;
    message?: Prisma.StringNullableFilter<"message"> | string | null;
    from_id?: Prisma.BigIntNullableFilter<"message"> | bigint | number | null;
    forwarded?: Prisma.BoolNullableFilter<"message"> | boolean | null;
    reply_to?: Prisma.BigIntNullableFilter<"message"> | bigint | number | null;
    media?: Prisma.BoolNullableFilter<"message"> | boolean | null;
    keywords?: Prisma.StringNullableFilter<"message"> | string | null;
};
export type messageOrderByWithRelationInput = {
    id?: Prisma.SortOrder;
    message_id?: Prisma.SortOrder;
    peer_id?: Prisma.SortOrder;
    date?: Prisma.SortOrder;
    message?: Prisma.SortOrderInput | Prisma.SortOrder;
    from_id?: Prisma.SortOrderInput | Prisma.SortOrder;
    forwarded?: Prisma.SortOrderInput | Prisma.SortOrder;
    reply_to?: Prisma.SortOrderInput | Prisma.SortOrder;
    media?: Prisma.SortOrderInput | Prisma.SortOrder;
    keywords?: Prisma.SortOrderInput | Prisma.SortOrder;
};
export type messageWhereUniqueInput = Prisma.AtLeast<{
    id?: bigint | number;
    AND?: Prisma.messageWhereInput | Prisma.messageWhereInput[];
    OR?: Prisma.messageWhereInput[];
    NOT?: Prisma.messageWhereInput | Prisma.messageWhereInput[];
    message_id?: Prisma.BigIntFilter<"message"> | bigint | number;
    peer_id?: Prisma.BigIntFilter<"message"> | bigint | number;
    date?: Prisma.DateTimeFilter<"message"> | Date | string;
    message?: Prisma.StringNullableFilter<"message"> | string | null;
    from_id?: Prisma.BigIntNullableFilter<"message"> | bigint | number | null;
    forwarded?: Prisma.BoolNullableFilter<"message"> | boolean | null;
    reply_to?: Prisma.BigIntNullableFilter<"message"> | bigint | number | null;
    media?: Prisma.BoolNullableFilter<"message"> | boolean | null;
    keywords?: Prisma.StringNullableFilter<"message"> | string | null;
}, "id">;
export type messageOrderByWithAggregationInput = {
    id?: Prisma.SortOrder;
    message_id?: Prisma.SortOrder;
    peer_id?: Prisma.SortOrder;
    date?: Prisma.SortOrder;
    message?: Prisma.SortOrderInput | Prisma.SortOrder;
    from_id?: Prisma.SortOrderInput | Prisma.SortOrder;
    forwarded?: Prisma.SortOrderInput | Prisma.SortOrder;
    reply_to?: Prisma.SortOrderInput | Prisma.SortOrder;
    media?: Prisma.SortOrderInput | Prisma.SortOrder;
    keywords?: Prisma.SortOrderInput | Prisma.SortOrder;
    _count?: Prisma.messageCountOrderByAggregateInput;
    _avg?: Prisma.messageAvgOrderByAggregateInput;
    _max?: Prisma.messageMaxOrderByAggregateInput;
    _min?: Prisma.messageMinOrderByAggregateInput;
    _sum?: Prisma.messageSumOrderByAggregateInput;
};
export type messageScalarWhereWithAggregatesInput = {
    AND?: Prisma.messageScalarWhereWithAggregatesInput | Prisma.messageScalarWhereWithAggregatesInput[];
    OR?: Prisma.messageScalarWhereWithAggregatesInput[];
    NOT?: Prisma.messageScalarWhereWithAggregatesInput | Prisma.messageScalarWhereWithAggregatesInput[];
    id?: Prisma.BigIntWithAggregatesFilter<"message"> | bigint | number;
    message_id?: Prisma.BigIntWithAggregatesFilter<"message"> | bigint | number;
    peer_id?: Prisma.BigIntWithAggregatesFilter<"message"> | bigint | number;
    date?: Prisma.DateTimeWithAggregatesFilter<"message"> | Date | string;
    message?: Prisma.StringNullableWithAggregatesFilter<"message"> | string | null;
    from_id?: Prisma.BigIntNullableWithAggregatesFilter<"message"> | bigint | number | null;
    forwarded?: Prisma.BoolNullableWithAggregatesFilter<"message"> | boolean | null;
    reply_to?: Prisma.BigIntNullableWithAggregatesFilter<"message"> | bigint | number | null;
    media?: Prisma.BoolNullableWithAggregatesFilter<"message"> | boolean | null;
    keywords?: Prisma.StringNullableWithAggregatesFilter<"message"> | string | null;
};
export type messageCreateInput = {
    id?: bigint | number;
    message_id: bigint | number;
    peer_id: bigint | number;
    date?: Date | string;
    message?: string | null;
    from_id?: bigint | number | null;
    forwarded?: boolean | null;
    reply_to?: bigint | number | null;
    media?: boolean | null;
    keywords?: string | null;
};
export type messageUncheckedCreateInput = {
    id?: bigint | number;
    message_id: bigint | number;
    peer_id: bigint | number;
    date?: Date | string;
    message?: string | null;
    from_id?: bigint | number | null;
    forwarded?: boolean | null;
    reply_to?: bigint | number | null;
    media?: boolean | null;
    keywords?: string | null;
};
export type messageUpdateInput = {
    id?: Prisma.BigIntFieldUpdateOperationsInput | bigint | number;
    message_id?: Prisma.BigIntFieldUpdateOperationsInput | bigint | number;
    peer_id?: Prisma.BigIntFieldUpdateOperationsInput | bigint | number;
    date?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    message?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    from_id?: Prisma.NullableBigIntFieldUpdateOperationsInput | bigint | number | null;
    forwarded?: Prisma.NullableBoolFieldUpdateOperationsInput | boolean | null;
    reply_to?: Prisma.NullableBigIntFieldUpdateOperationsInput | bigint | number | null;
    media?: Prisma.NullableBoolFieldUpdateOperationsInput | boolean | null;
    keywords?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
};
export type messageUncheckedUpdateInput = {
    id?: Prisma.BigIntFieldUpdateOperationsInput | bigint | number;
    message_id?: Prisma.BigIntFieldUpdateOperationsInput | bigint | number;
    peer_id?: Prisma.BigIntFieldUpdateOperationsInput | bigint | number;
    date?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    message?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    from_id?: Prisma.NullableBigIntFieldUpdateOperationsInput | bigint | number | null;
    forwarded?: Prisma.NullableBoolFieldUpdateOperationsInput | boolean | null;
    reply_to?: Prisma.NullableBigIntFieldUpdateOperationsInput | bigint | number | null;
    media?: Prisma.NullableBoolFieldUpdateOperationsInput | boolean | null;
    keywords?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
};
export type messageCreateManyInput = {
    id?: bigint | number;
    message_id: bigint | number;
    peer_id: bigint | number;
    date?: Date | string;
    message?: string | null;
    from_id?: bigint | number | null;
    forwarded?: boolean | null;
    reply_to?: bigint | number | null;
    media?: boolean | null;
    keywords?: string | null;
};
export type messageUpdateManyMutationInput = {
    id?: Prisma.BigIntFieldUpdateOperationsInput | bigint | number;
    message_id?: Prisma.BigIntFieldUpdateOperationsInput | bigint | number;
    peer_id?: Prisma.BigIntFieldUpdateOperationsInput | bigint | number;
    date?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    message?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    from_id?: Prisma.NullableBigIntFieldUpdateOperationsInput | bigint | number | null;
    forwarded?: Prisma.NullableBoolFieldUpdateOperationsInput | boolean | null;
    reply_to?: Prisma.NullableBigIntFieldUpdateOperationsInput | bigint | number | null;
    media?: Prisma.NullableBoolFieldUpdateOperationsInput | boolean | null;
    keywords?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
};
export type messageUncheckedUpdateManyInput = {
    id?: Prisma.BigIntFieldUpdateOperationsInput | bigint | number;
    message_id?: Prisma.BigIntFieldUpdateOperationsInput | bigint | number;
    peer_id?: Prisma.BigIntFieldUpdateOperationsInput | bigint | number;
    date?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    message?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    from_id?: Prisma.NullableBigIntFieldUpdateOperationsInput | bigint | number | null;
    forwarded?: Prisma.NullableBoolFieldUpdateOperationsInput | boolean | null;
    reply_to?: Prisma.NullableBigIntFieldUpdateOperationsInput | bigint | number | null;
    media?: Prisma.NullableBoolFieldUpdateOperationsInput | boolean | null;
    keywords?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
};
export type messageCountOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    message_id?: Prisma.SortOrder;
    peer_id?: Prisma.SortOrder;
    date?: Prisma.SortOrder;
    message?: Prisma.SortOrder;
    from_id?: Prisma.SortOrder;
    forwarded?: Prisma.SortOrder;
    reply_to?: Prisma.SortOrder;
    media?: Prisma.SortOrder;
    keywords?: Prisma.SortOrder;
};
export type messageAvgOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    message_id?: Prisma.SortOrder;
    peer_id?: Prisma.SortOrder;
    from_id?: Prisma.SortOrder;
    reply_to?: Prisma.SortOrder;
};
export type messageMaxOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    message_id?: Prisma.SortOrder;
    peer_id?: Prisma.SortOrder;
    date?: Prisma.SortOrder;
    message?: Prisma.SortOrder;
    from_id?: Prisma.SortOrder;
    forwarded?: Prisma.SortOrder;
    reply_to?: Prisma.SortOrder;
    media?: Prisma.SortOrder;
    keywords?: Prisma.SortOrder;
};
export type messageMinOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    message_id?: Prisma.SortOrder;
    peer_id?: Prisma.SortOrder;
    date?: Prisma.SortOrder;
    message?: Prisma.SortOrder;
    from_id?: Prisma.SortOrder;
    forwarded?: Prisma.SortOrder;
    reply_to?: Prisma.SortOrder;
    media?: Prisma.SortOrder;
    keywords?: Prisma.SortOrder;
};
export type messageSumOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    message_id?: Prisma.SortOrder;
    peer_id?: Prisma.SortOrder;
    from_id?: Prisma.SortOrder;
    reply_to?: Prisma.SortOrder;
};
export type NullableBoolFieldUpdateOperationsInput = {
    set?: boolean | null;
};
export type messageSelect<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    message_id?: boolean;
    peer_id?: boolean;
    date?: boolean;
    message?: boolean;
    from_id?: boolean;
    forwarded?: boolean;
    reply_to?: boolean;
    media?: boolean;
    keywords?: boolean;
}, ExtArgs["result"]["message"]>;
export type messageSelectCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    message_id?: boolean;
    peer_id?: boolean;
    date?: boolean;
    message?: boolean;
    from_id?: boolean;
    forwarded?: boolean;
    reply_to?: boolean;
    media?: boolean;
    keywords?: boolean;
}, ExtArgs["result"]["message"]>;
export type messageSelectUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    message_id?: boolean;
    peer_id?: boolean;
    date?: boolean;
    message?: boolean;
    from_id?: boolean;
    forwarded?: boolean;
    reply_to?: boolean;
    media?: boolean;
    keywords?: boolean;
}, ExtArgs["result"]["message"]>;
export type messageSelectScalar = {
    id?: boolean;
    message_id?: boolean;
    peer_id?: boolean;
    date?: boolean;
    message?: boolean;
    from_id?: boolean;
    forwarded?: boolean;
    reply_to?: boolean;
    media?: boolean;
    keywords?: boolean;
};
export type messageOmit<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetOmit<"id" | "message_id" | "peer_id" | "date" | "message" | "from_id" | "forwarded" | "reply_to" | "media" | "keywords", ExtArgs["result"]["message"]>;
export type $messagePayload<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    name: "message";
    objects: {};
    scalars: runtime.Types.Extensions.GetPayloadResult<{
        id: bigint;
        message_id: bigint;
        peer_id: bigint;
        date: Date;
        message: string | null;
        from_id: bigint | null;
        forwarded: boolean | null;
        reply_to: bigint | null;
        media: boolean | null;
        keywords: string | null;
    }, ExtArgs["result"]["message"]>;
    composites: {};
};
export type messageGetPayload<S extends boolean | null | undefined | messageDefaultArgs> = runtime.Types.Result.GetResult<Prisma.$messagePayload, S>;
export type messageCountArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = Omit<messageFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
    select?: MessageCountAggregateInputType | true;
};
export interface messageDelegate<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: {
        types: Prisma.TypeMap<ExtArgs>['model']['message'];
        meta: {
            name: 'message';
        };
    };
    findUnique<T extends messageFindUniqueArgs>(args: Prisma.SelectSubset<T, messageFindUniqueArgs<ExtArgs>>): Prisma.Prisma__messageClient<runtime.Types.Result.GetResult<Prisma.$messagePayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    findUniqueOrThrow<T extends messageFindUniqueOrThrowArgs>(args: Prisma.SelectSubset<T, messageFindUniqueOrThrowArgs<ExtArgs>>): Prisma.Prisma__messageClient<runtime.Types.Result.GetResult<Prisma.$messagePayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    findFirst<T extends messageFindFirstArgs>(args?: Prisma.SelectSubset<T, messageFindFirstArgs<ExtArgs>>): Prisma.Prisma__messageClient<runtime.Types.Result.GetResult<Prisma.$messagePayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    findFirstOrThrow<T extends messageFindFirstOrThrowArgs>(args?: Prisma.SelectSubset<T, messageFindFirstOrThrowArgs<ExtArgs>>): Prisma.Prisma__messageClient<runtime.Types.Result.GetResult<Prisma.$messagePayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    findMany<T extends messageFindManyArgs>(args?: Prisma.SelectSubset<T, messageFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$messagePayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>;
    create<T extends messageCreateArgs>(args: Prisma.SelectSubset<T, messageCreateArgs<ExtArgs>>): Prisma.Prisma__messageClient<runtime.Types.Result.GetResult<Prisma.$messagePayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    createMany<T extends messageCreateManyArgs>(args?: Prisma.SelectSubset<T, messageCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    createManyAndReturn<T extends messageCreateManyAndReturnArgs>(args?: Prisma.SelectSubset<T, messageCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$messagePayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>;
    delete<T extends messageDeleteArgs>(args: Prisma.SelectSubset<T, messageDeleteArgs<ExtArgs>>): Prisma.Prisma__messageClient<runtime.Types.Result.GetResult<Prisma.$messagePayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    update<T extends messageUpdateArgs>(args: Prisma.SelectSubset<T, messageUpdateArgs<ExtArgs>>): Prisma.Prisma__messageClient<runtime.Types.Result.GetResult<Prisma.$messagePayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    deleteMany<T extends messageDeleteManyArgs>(args?: Prisma.SelectSubset<T, messageDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    updateMany<T extends messageUpdateManyArgs>(args: Prisma.SelectSubset<T, messageUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    updateManyAndReturn<T extends messageUpdateManyAndReturnArgs>(args: Prisma.SelectSubset<T, messageUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$messagePayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>;
    upsert<T extends messageUpsertArgs>(args: Prisma.SelectSubset<T, messageUpsertArgs<ExtArgs>>): Prisma.Prisma__messageClient<runtime.Types.Result.GetResult<Prisma.$messagePayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    count<T extends messageCountArgs>(args?: Prisma.Subset<T, messageCountArgs>): Prisma.PrismaPromise<T extends runtime.Types.Utils.Record<'select', any> ? T['select'] extends true ? number : Prisma.GetScalarType<T['select'], MessageCountAggregateOutputType> : number>;
    aggregate<T extends MessageAggregateArgs>(args: Prisma.Subset<T, MessageAggregateArgs>): Prisma.PrismaPromise<GetMessageAggregateType<T>>;
    groupBy<T extends messageGroupByArgs, HasSelectOrTake extends Prisma.Or<Prisma.Extends<'skip', Prisma.Keys<T>>, Prisma.Extends<'take', Prisma.Keys<T>>>, OrderByArg extends Prisma.True extends HasSelectOrTake ? {
        orderBy: messageGroupByArgs['orderBy'];
    } : {
        orderBy?: messageGroupByArgs['orderBy'];
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
    }[OrderFields]>(args: Prisma.SubsetIntersection<T, messageGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetMessageGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>;
    readonly fields: messageFieldRefs;
}
export interface Prisma__messageClient<T, Null = never, ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise";
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): runtime.Types.Utils.JsPromise<TResult1 | TResult2>;
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): runtime.Types.Utils.JsPromise<T | TResult>;
    finally(onfinally?: (() => void) | undefined | null): runtime.Types.Utils.JsPromise<T>;
}
export interface messageFieldRefs {
    readonly id: Prisma.FieldRef<"message", 'BigInt'>;
    readonly message_id: Prisma.FieldRef<"message", 'BigInt'>;
    readonly peer_id: Prisma.FieldRef<"message", 'BigInt'>;
    readonly date: Prisma.FieldRef<"message", 'DateTime'>;
    readonly message: Prisma.FieldRef<"message", 'String'>;
    readonly from_id: Prisma.FieldRef<"message", 'BigInt'>;
    readonly forwarded: Prisma.FieldRef<"message", 'Boolean'>;
    readonly reply_to: Prisma.FieldRef<"message", 'BigInt'>;
    readonly media: Prisma.FieldRef<"message", 'Boolean'>;
    readonly keywords: Prisma.FieldRef<"message", 'String'>;
}
export type messageFindUniqueArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.messageSelect<ExtArgs> | null;
    omit?: Prisma.messageOmit<ExtArgs> | null;
    where: Prisma.messageWhereUniqueInput;
};
export type messageFindUniqueOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.messageSelect<ExtArgs> | null;
    omit?: Prisma.messageOmit<ExtArgs> | null;
    where: Prisma.messageWhereUniqueInput;
};
export type messageFindFirstArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.messageSelect<ExtArgs> | null;
    omit?: Prisma.messageOmit<ExtArgs> | null;
    where?: Prisma.messageWhereInput;
    orderBy?: Prisma.messageOrderByWithRelationInput | Prisma.messageOrderByWithRelationInput[];
    cursor?: Prisma.messageWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.MessageScalarFieldEnum | Prisma.MessageScalarFieldEnum[];
};
export type messageFindFirstOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.messageSelect<ExtArgs> | null;
    omit?: Prisma.messageOmit<ExtArgs> | null;
    where?: Prisma.messageWhereInput;
    orderBy?: Prisma.messageOrderByWithRelationInput | Prisma.messageOrderByWithRelationInput[];
    cursor?: Prisma.messageWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.MessageScalarFieldEnum | Prisma.MessageScalarFieldEnum[];
};
export type messageFindManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.messageSelect<ExtArgs> | null;
    omit?: Prisma.messageOmit<ExtArgs> | null;
    where?: Prisma.messageWhereInput;
    orderBy?: Prisma.messageOrderByWithRelationInput | Prisma.messageOrderByWithRelationInput[];
    cursor?: Prisma.messageWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.MessageScalarFieldEnum | Prisma.MessageScalarFieldEnum[];
};
export type messageCreateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.messageSelect<ExtArgs> | null;
    omit?: Prisma.messageOmit<ExtArgs> | null;
    data: Prisma.XOR<Prisma.messageCreateInput, Prisma.messageUncheckedCreateInput>;
};
export type messageCreateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    data: Prisma.messageCreateManyInput | Prisma.messageCreateManyInput[];
    skipDuplicates?: boolean;
};
export type messageCreateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.messageSelectCreateManyAndReturn<ExtArgs> | null;
    omit?: Prisma.messageOmit<ExtArgs> | null;
    data: Prisma.messageCreateManyInput | Prisma.messageCreateManyInput[];
    skipDuplicates?: boolean;
};
export type messageUpdateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.messageSelect<ExtArgs> | null;
    omit?: Prisma.messageOmit<ExtArgs> | null;
    data: Prisma.XOR<Prisma.messageUpdateInput, Prisma.messageUncheckedUpdateInput>;
    where: Prisma.messageWhereUniqueInput;
};
export type messageUpdateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    data: Prisma.XOR<Prisma.messageUpdateManyMutationInput, Prisma.messageUncheckedUpdateManyInput>;
    where?: Prisma.messageWhereInput;
    limit?: number;
};
export type messageUpdateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.messageSelectUpdateManyAndReturn<ExtArgs> | null;
    omit?: Prisma.messageOmit<ExtArgs> | null;
    data: Prisma.XOR<Prisma.messageUpdateManyMutationInput, Prisma.messageUncheckedUpdateManyInput>;
    where?: Prisma.messageWhereInput;
    limit?: number;
};
export type messageUpsertArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.messageSelect<ExtArgs> | null;
    omit?: Prisma.messageOmit<ExtArgs> | null;
    where: Prisma.messageWhereUniqueInput;
    create: Prisma.XOR<Prisma.messageCreateInput, Prisma.messageUncheckedCreateInput>;
    update: Prisma.XOR<Prisma.messageUpdateInput, Prisma.messageUncheckedUpdateInput>;
};
export type messageDeleteArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.messageSelect<ExtArgs> | null;
    omit?: Prisma.messageOmit<ExtArgs> | null;
    where: Prisma.messageWhereUniqueInput;
};
export type messageDeleteManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.messageWhereInput;
    limit?: number;
};
export type messageDefaultArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.messageSelect<ExtArgs> | null;
    omit?: Prisma.messageOmit<ExtArgs> | null;
};
export {};
