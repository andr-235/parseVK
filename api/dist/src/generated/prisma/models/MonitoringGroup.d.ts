import type * as runtime from "@prisma/client/runtime/client";
import type * as $Enums from "../enums.js";
import type * as Prisma from "../internal/prismaNamespace.js";
export type MonitoringGroupModel = runtime.Types.Result.DefaultSelection<Prisma.$MonitoringGroupPayload>;
export type AggregateMonitoringGroup = {
    _count: MonitoringGroupCountAggregateOutputType | null;
    _avg: MonitoringGroupAvgAggregateOutputType | null;
    _sum: MonitoringGroupSumAggregateOutputType | null;
    _min: MonitoringGroupMinAggregateOutputType | null;
    _max: MonitoringGroupMaxAggregateOutputType | null;
};
export type MonitoringGroupAvgAggregateOutputType = {
    id: number | null;
};
export type MonitoringGroupSumAggregateOutputType = {
    id: number | null;
};
export type MonitoringGroupMinAggregateOutputType = {
    id: number | null;
    messenger: $Enums.MonitoringMessenger | null;
    chatId: string | null;
    name: string | null;
    category: string | null;
    createdAt: Date | null;
    updatedAt: Date | null;
};
export type MonitoringGroupMaxAggregateOutputType = {
    id: number | null;
    messenger: $Enums.MonitoringMessenger | null;
    chatId: string | null;
    name: string | null;
    category: string | null;
    createdAt: Date | null;
    updatedAt: Date | null;
};
export type MonitoringGroupCountAggregateOutputType = {
    id: number;
    messenger: number;
    chatId: number;
    name: number;
    category: number;
    createdAt: number;
    updatedAt: number;
    _all: number;
};
export type MonitoringGroupAvgAggregateInputType = {
    id?: true;
};
export type MonitoringGroupSumAggregateInputType = {
    id?: true;
};
export type MonitoringGroupMinAggregateInputType = {
    id?: true;
    messenger?: true;
    chatId?: true;
    name?: true;
    category?: true;
    createdAt?: true;
    updatedAt?: true;
};
export type MonitoringGroupMaxAggregateInputType = {
    id?: true;
    messenger?: true;
    chatId?: true;
    name?: true;
    category?: true;
    createdAt?: true;
    updatedAt?: true;
};
export type MonitoringGroupCountAggregateInputType = {
    id?: true;
    messenger?: true;
    chatId?: true;
    name?: true;
    category?: true;
    createdAt?: true;
    updatedAt?: true;
    _all?: true;
};
export type MonitoringGroupAggregateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.MonitoringGroupWhereInput;
    orderBy?: Prisma.MonitoringGroupOrderByWithRelationInput | Prisma.MonitoringGroupOrderByWithRelationInput[];
    cursor?: Prisma.MonitoringGroupWhereUniqueInput;
    take?: number;
    skip?: number;
    _count?: true | MonitoringGroupCountAggregateInputType;
    _avg?: MonitoringGroupAvgAggregateInputType;
    _sum?: MonitoringGroupSumAggregateInputType;
    _min?: MonitoringGroupMinAggregateInputType;
    _max?: MonitoringGroupMaxAggregateInputType;
};
export type GetMonitoringGroupAggregateType<T extends MonitoringGroupAggregateArgs> = {
    [P in keyof T & keyof AggregateMonitoringGroup]: P extends '_count' | 'count' ? T[P] extends true ? number : Prisma.GetScalarType<T[P], AggregateMonitoringGroup[P]> : Prisma.GetScalarType<T[P], AggregateMonitoringGroup[P]>;
};
export type MonitoringGroupGroupByArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.MonitoringGroupWhereInput;
    orderBy?: Prisma.MonitoringGroupOrderByWithAggregationInput | Prisma.MonitoringGroupOrderByWithAggregationInput[];
    by: Prisma.MonitoringGroupScalarFieldEnum[] | Prisma.MonitoringGroupScalarFieldEnum;
    having?: Prisma.MonitoringGroupScalarWhereWithAggregatesInput;
    take?: number;
    skip?: number;
    _count?: MonitoringGroupCountAggregateInputType | true;
    _avg?: MonitoringGroupAvgAggregateInputType;
    _sum?: MonitoringGroupSumAggregateInputType;
    _min?: MonitoringGroupMinAggregateInputType;
    _max?: MonitoringGroupMaxAggregateInputType;
};
export type MonitoringGroupGroupByOutputType = {
    id: number;
    messenger: $Enums.MonitoringMessenger;
    chatId: string;
    name: string;
    category: string | null;
    createdAt: Date;
    updatedAt: Date;
    _count: MonitoringGroupCountAggregateOutputType | null;
    _avg: MonitoringGroupAvgAggregateOutputType | null;
    _sum: MonitoringGroupSumAggregateOutputType | null;
    _min: MonitoringGroupMinAggregateOutputType | null;
    _max: MonitoringGroupMaxAggregateOutputType | null;
};
type GetMonitoringGroupGroupByPayload<T extends MonitoringGroupGroupByArgs> = Prisma.PrismaPromise<Array<Prisma.PickEnumerable<MonitoringGroupGroupByOutputType, T['by']> & {
    [P in ((keyof T) & (keyof MonitoringGroupGroupByOutputType))]: P extends '_count' ? T[P] extends boolean ? number : Prisma.GetScalarType<T[P], MonitoringGroupGroupByOutputType[P]> : Prisma.GetScalarType<T[P], MonitoringGroupGroupByOutputType[P]>;
}>>;
export type MonitoringGroupWhereInput = {
    AND?: Prisma.MonitoringGroupWhereInput | Prisma.MonitoringGroupWhereInput[];
    OR?: Prisma.MonitoringGroupWhereInput[];
    NOT?: Prisma.MonitoringGroupWhereInput | Prisma.MonitoringGroupWhereInput[];
    id?: Prisma.IntFilter<"MonitoringGroup"> | number;
    messenger?: Prisma.EnumMonitoringMessengerFilter<"MonitoringGroup"> | $Enums.MonitoringMessenger;
    chatId?: Prisma.StringFilter<"MonitoringGroup"> | string;
    name?: Prisma.StringFilter<"MonitoringGroup"> | string;
    category?: Prisma.StringNullableFilter<"MonitoringGroup"> | string | null;
    createdAt?: Prisma.DateTimeFilter<"MonitoringGroup"> | Date | string;
    updatedAt?: Prisma.DateTimeFilter<"MonitoringGroup"> | Date | string;
};
export type MonitoringGroupOrderByWithRelationInput = {
    id?: Prisma.SortOrder;
    messenger?: Prisma.SortOrder;
    chatId?: Prisma.SortOrder;
    name?: Prisma.SortOrder;
    category?: Prisma.SortOrderInput | Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
};
export type MonitoringGroupWhereUniqueInput = Prisma.AtLeast<{
    id?: number;
    messenger_chatId?: Prisma.MonitoringGroupMessengerChatIdCompoundUniqueInput;
    AND?: Prisma.MonitoringGroupWhereInput | Prisma.MonitoringGroupWhereInput[];
    OR?: Prisma.MonitoringGroupWhereInput[];
    NOT?: Prisma.MonitoringGroupWhereInput | Prisma.MonitoringGroupWhereInput[];
    messenger?: Prisma.EnumMonitoringMessengerFilter<"MonitoringGroup"> | $Enums.MonitoringMessenger;
    chatId?: Prisma.StringFilter<"MonitoringGroup"> | string;
    name?: Prisma.StringFilter<"MonitoringGroup"> | string;
    category?: Prisma.StringNullableFilter<"MonitoringGroup"> | string | null;
    createdAt?: Prisma.DateTimeFilter<"MonitoringGroup"> | Date | string;
    updatedAt?: Prisma.DateTimeFilter<"MonitoringGroup"> | Date | string;
}, "id" | "messenger_chatId">;
export type MonitoringGroupOrderByWithAggregationInput = {
    id?: Prisma.SortOrder;
    messenger?: Prisma.SortOrder;
    chatId?: Prisma.SortOrder;
    name?: Prisma.SortOrder;
    category?: Prisma.SortOrderInput | Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
    _count?: Prisma.MonitoringGroupCountOrderByAggregateInput;
    _avg?: Prisma.MonitoringGroupAvgOrderByAggregateInput;
    _max?: Prisma.MonitoringGroupMaxOrderByAggregateInput;
    _min?: Prisma.MonitoringGroupMinOrderByAggregateInput;
    _sum?: Prisma.MonitoringGroupSumOrderByAggregateInput;
};
export type MonitoringGroupScalarWhereWithAggregatesInput = {
    AND?: Prisma.MonitoringGroupScalarWhereWithAggregatesInput | Prisma.MonitoringGroupScalarWhereWithAggregatesInput[];
    OR?: Prisma.MonitoringGroupScalarWhereWithAggregatesInput[];
    NOT?: Prisma.MonitoringGroupScalarWhereWithAggregatesInput | Prisma.MonitoringGroupScalarWhereWithAggregatesInput[];
    id?: Prisma.IntWithAggregatesFilter<"MonitoringGroup"> | number;
    messenger?: Prisma.EnumMonitoringMessengerWithAggregatesFilter<"MonitoringGroup"> | $Enums.MonitoringMessenger;
    chatId?: Prisma.StringWithAggregatesFilter<"MonitoringGroup"> | string;
    name?: Prisma.StringWithAggregatesFilter<"MonitoringGroup"> | string;
    category?: Prisma.StringNullableWithAggregatesFilter<"MonitoringGroup"> | string | null;
    createdAt?: Prisma.DateTimeWithAggregatesFilter<"MonitoringGroup"> | Date | string;
    updatedAt?: Prisma.DateTimeWithAggregatesFilter<"MonitoringGroup"> | Date | string;
};
export type MonitoringGroupCreateInput = {
    messenger: $Enums.MonitoringMessenger;
    chatId: string;
    name: string;
    category?: string | null;
    createdAt?: Date | string;
    updatedAt?: Date | string;
};
export type MonitoringGroupUncheckedCreateInput = {
    id?: number;
    messenger: $Enums.MonitoringMessenger;
    chatId: string;
    name: string;
    category?: string | null;
    createdAt?: Date | string;
    updatedAt?: Date | string;
};
export type MonitoringGroupUpdateInput = {
    messenger?: Prisma.EnumMonitoringMessengerFieldUpdateOperationsInput | $Enums.MonitoringMessenger;
    chatId?: Prisma.StringFieldUpdateOperationsInput | string;
    name?: Prisma.StringFieldUpdateOperationsInput | string;
    category?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type MonitoringGroupUncheckedUpdateInput = {
    id?: Prisma.IntFieldUpdateOperationsInput | number;
    messenger?: Prisma.EnumMonitoringMessengerFieldUpdateOperationsInput | $Enums.MonitoringMessenger;
    chatId?: Prisma.StringFieldUpdateOperationsInput | string;
    name?: Prisma.StringFieldUpdateOperationsInput | string;
    category?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type MonitoringGroupCreateManyInput = {
    id?: number;
    messenger: $Enums.MonitoringMessenger;
    chatId: string;
    name: string;
    category?: string | null;
    createdAt?: Date | string;
    updatedAt?: Date | string;
};
export type MonitoringGroupUpdateManyMutationInput = {
    messenger?: Prisma.EnumMonitoringMessengerFieldUpdateOperationsInput | $Enums.MonitoringMessenger;
    chatId?: Prisma.StringFieldUpdateOperationsInput | string;
    name?: Prisma.StringFieldUpdateOperationsInput | string;
    category?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type MonitoringGroupUncheckedUpdateManyInput = {
    id?: Prisma.IntFieldUpdateOperationsInput | number;
    messenger?: Prisma.EnumMonitoringMessengerFieldUpdateOperationsInput | $Enums.MonitoringMessenger;
    chatId?: Prisma.StringFieldUpdateOperationsInput | string;
    name?: Prisma.StringFieldUpdateOperationsInput | string;
    category?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type MonitoringGroupMessengerChatIdCompoundUniqueInput = {
    messenger: $Enums.MonitoringMessenger;
    chatId: string;
};
export type MonitoringGroupCountOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    messenger?: Prisma.SortOrder;
    chatId?: Prisma.SortOrder;
    name?: Prisma.SortOrder;
    category?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
};
export type MonitoringGroupAvgOrderByAggregateInput = {
    id?: Prisma.SortOrder;
};
export type MonitoringGroupMaxOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    messenger?: Prisma.SortOrder;
    chatId?: Prisma.SortOrder;
    name?: Prisma.SortOrder;
    category?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
};
export type MonitoringGroupMinOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    messenger?: Prisma.SortOrder;
    chatId?: Prisma.SortOrder;
    name?: Prisma.SortOrder;
    category?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
};
export type MonitoringGroupSumOrderByAggregateInput = {
    id?: Prisma.SortOrder;
};
export type EnumMonitoringMessengerFieldUpdateOperationsInput = {
    set?: $Enums.MonitoringMessenger;
};
export type MonitoringGroupSelect<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    messenger?: boolean;
    chatId?: boolean;
    name?: boolean;
    category?: boolean;
    createdAt?: boolean;
    updatedAt?: boolean;
}, ExtArgs["result"]["monitoringGroup"]>;
export type MonitoringGroupSelectCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    messenger?: boolean;
    chatId?: boolean;
    name?: boolean;
    category?: boolean;
    createdAt?: boolean;
    updatedAt?: boolean;
}, ExtArgs["result"]["monitoringGroup"]>;
export type MonitoringGroupSelectUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    messenger?: boolean;
    chatId?: boolean;
    name?: boolean;
    category?: boolean;
    createdAt?: boolean;
    updatedAt?: boolean;
}, ExtArgs["result"]["monitoringGroup"]>;
export type MonitoringGroupSelectScalar = {
    id?: boolean;
    messenger?: boolean;
    chatId?: boolean;
    name?: boolean;
    category?: boolean;
    createdAt?: boolean;
    updatedAt?: boolean;
};
export type MonitoringGroupOmit<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetOmit<"id" | "messenger" | "chatId" | "name" | "category" | "createdAt" | "updatedAt", ExtArgs["result"]["monitoringGroup"]>;
export type $MonitoringGroupPayload<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    name: "MonitoringGroup";
    objects: {};
    scalars: runtime.Types.Extensions.GetPayloadResult<{
        id: number;
        messenger: $Enums.MonitoringMessenger;
        chatId: string;
        name: string;
        category: string | null;
        createdAt: Date;
        updatedAt: Date;
    }, ExtArgs["result"]["monitoringGroup"]>;
    composites: {};
};
export type MonitoringGroupGetPayload<S extends boolean | null | undefined | MonitoringGroupDefaultArgs> = runtime.Types.Result.GetResult<Prisma.$MonitoringGroupPayload, S>;
export type MonitoringGroupCountArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = Omit<MonitoringGroupFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
    select?: MonitoringGroupCountAggregateInputType | true;
};
export interface MonitoringGroupDelegate<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: {
        types: Prisma.TypeMap<ExtArgs>['model']['MonitoringGroup'];
        meta: {
            name: 'MonitoringGroup';
        };
    };
    findUnique<T extends MonitoringGroupFindUniqueArgs>(args: Prisma.SelectSubset<T, MonitoringGroupFindUniqueArgs<ExtArgs>>): Prisma.Prisma__MonitoringGroupClient<runtime.Types.Result.GetResult<Prisma.$MonitoringGroupPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    findUniqueOrThrow<T extends MonitoringGroupFindUniqueOrThrowArgs>(args: Prisma.SelectSubset<T, MonitoringGroupFindUniqueOrThrowArgs<ExtArgs>>): Prisma.Prisma__MonitoringGroupClient<runtime.Types.Result.GetResult<Prisma.$MonitoringGroupPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    findFirst<T extends MonitoringGroupFindFirstArgs>(args?: Prisma.SelectSubset<T, MonitoringGroupFindFirstArgs<ExtArgs>>): Prisma.Prisma__MonitoringGroupClient<runtime.Types.Result.GetResult<Prisma.$MonitoringGroupPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    findFirstOrThrow<T extends MonitoringGroupFindFirstOrThrowArgs>(args?: Prisma.SelectSubset<T, MonitoringGroupFindFirstOrThrowArgs<ExtArgs>>): Prisma.Prisma__MonitoringGroupClient<runtime.Types.Result.GetResult<Prisma.$MonitoringGroupPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    findMany<T extends MonitoringGroupFindManyArgs>(args?: Prisma.SelectSubset<T, MonitoringGroupFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$MonitoringGroupPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>;
    create<T extends MonitoringGroupCreateArgs>(args: Prisma.SelectSubset<T, MonitoringGroupCreateArgs<ExtArgs>>): Prisma.Prisma__MonitoringGroupClient<runtime.Types.Result.GetResult<Prisma.$MonitoringGroupPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    createMany<T extends MonitoringGroupCreateManyArgs>(args?: Prisma.SelectSubset<T, MonitoringGroupCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    createManyAndReturn<T extends MonitoringGroupCreateManyAndReturnArgs>(args?: Prisma.SelectSubset<T, MonitoringGroupCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$MonitoringGroupPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>;
    delete<T extends MonitoringGroupDeleteArgs>(args: Prisma.SelectSubset<T, MonitoringGroupDeleteArgs<ExtArgs>>): Prisma.Prisma__MonitoringGroupClient<runtime.Types.Result.GetResult<Prisma.$MonitoringGroupPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    update<T extends MonitoringGroupUpdateArgs>(args: Prisma.SelectSubset<T, MonitoringGroupUpdateArgs<ExtArgs>>): Prisma.Prisma__MonitoringGroupClient<runtime.Types.Result.GetResult<Prisma.$MonitoringGroupPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    deleteMany<T extends MonitoringGroupDeleteManyArgs>(args?: Prisma.SelectSubset<T, MonitoringGroupDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    updateMany<T extends MonitoringGroupUpdateManyArgs>(args: Prisma.SelectSubset<T, MonitoringGroupUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    updateManyAndReturn<T extends MonitoringGroupUpdateManyAndReturnArgs>(args: Prisma.SelectSubset<T, MonitoringGroupUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$MonitoringGroupPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>;
    upsert<T extends MonitoringGroupUpsertArgs>(args: Prisma.SelectSubset<T, MonitoringGroupUpsertArgs<ExtArgs>>): Prisma.Prisma__MonitoringGroupClient<runtime.Types.Result.GetResult<Prisma.$MonitoringGroupPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    count<T extends MonitoringGroupCountArgs>(args?: Prisma.Subset<T, MonitoringGroupCountArgs>): Prisma.PrismaPromise<T extends runtime.Types.Utils.Record<'select', any> ? T['select'] extends true ? number : Prisma.GetScalarType<T['select'], MonitoringGroupCountAggregateOutputType> : number>;
    aggregate<T extends MonitoringGroupAggregateArgs>(args: Prisma.Subset<T, MonitoringGroupAggregateArgs>): Prisma.PrismaPromise<GetMonitoringGroupAggregateType<T>>;
    groupBy<T extends MonitoringGroupGroupByArgs, HasSelectOrTake extends Prisma.Or<Prisma.Extends<'skip', Prisma.Keys<T>>, Prisma.Extends<'take', Prisma.Keys<T>>>, OrderByArg extends Prisma.True extends HasSelectOrTake ? {
        orderBy: MonitoringGroupGroupByArgs['orderBy'];
    } : {
        orderBy?: MonitoringGroupGroupByArgs['orderBy'];
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
    }[OrderFields]>(args: Prisma.SubsetIntersection<T, MonitoringGroupGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetMonitoringGroupGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>;
    readonly fields: MonitoringGroupFieldRefs;
}
export interface Prisma__MonitoringGroupClient<T, Null = never, ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise";
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): runtime.Types.Utils.JsPromise<TResult1 | TResult2>;
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): runtime.Types.Utils.JsPromise<T | TResult>;
    finally(onfinally?: (() => void) | undefined | null): runtime.Types.Utils.JsPromise<T>;
}
export interface MonitoringGroupFieldRefs {
    readonly id: Prisma.FieldRef<"MonitoringGroup", 'Int'>;
    readonly messenger: Prisma.FieldRef<"MonitoringGroup", 'MonitoringMessenger'>;
    readonly chatId: Prisma.FieldRef<"MonitoringGroup", 'String'>;
    readonly name: Prisma.FieldRef<"MonitoringGroup", 'String'>;
    readonly category: Prisma.FieldRef<"MonitoringGroup", 'String'>;
    readonly createdAt: Prisma.FieldRef<"MonitoringGroup", 'DateTime'>;
    readonly updatedAt: Prisma.FieldRef<"MonitoringGroup", 'DateTime'>;
}
export type MonitoringGroupFindUniqueArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.MonitoringGroupSelect<ExtArgs> | null;
    omit?: Prisma.MonitoringGroupOmit<ExtArgs> | null;
    where: Prisma.MonitoringGroupWhereUniqueInput;
};
export type MonitoringGroupFindUniqueOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.MonitoringGroupSelect<ExtArgs> | null;
    omit?: Prisma.MonitoringGroupOmit<ExtArgs> | null;
    where: Prisma.MonitoringGroupWhereUniqueInput;
};
export type MonitoringGroupFindFirstArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.MonitoringGroupSelect<ExtArgs> | null;
    omit?: Prisma.MonitoringGroupOmit<ExtArgs> | null;
    where?: Prisma.MonitoringGroupWhereInput;
    orderBy?: Prisma.MonitoringGroupOrderByWithRelationInput | Prisma.MonitoringGroupOrderByWithRelationInput[];
    cursor?: Prisma.MonitoringGroupWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.MonitoringGroupScalarFieldEnum | Prisma.MonitoringGroupScalarFieldEnum[];
};
export type MonitoringGroupFindFirstOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.MonitoringGroupSelect<ExtArgs> | null;
    omit?: Prisma.MonitoringGroupOmit<ExtArgs> | null;
    where?: Prisma.MonitoringGroupWhereInput;
    orderBy?: Prisma.MonitoringGroupOrderByWithRelationInput | Prisma.MonitoringGroupOrderByWithRelationInput[];
    cursor?: Prisma.MonitoringGroupWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.MonitoringGroupScalarFieldEnum | Prisma.MonitoringGroupScalarFieldEnum[];
};
export type MonitoringGroupFindManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.MonitoringGroupSelect<ExtArgs> | null;
    omit?: Prisma.MonitoringGroupOmit<ExtArgs> | null;
    where?: Prisma.MonitoringGroupWhereInput;
    orderBy?: Prisma.MonitoringGroupOrderByWithRelationInput | Prisma.MonitoringGroupOrderByWithRelationInput[];
    cursor?: Prisma.MonitoringGroupWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.MonitoringGroupScalarFieldEnum | Prisma.MonitoringGroupScalarFieldEnum[];
};
export type MonitoringGroupCreateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.MonitoringGroupSelect<ExtArgs> | null;
    omit?: Prisma.MonitoringGroupOmit<ExtArgs> | null;
    data: Prisma.XOR<Prisma.MonitoringGroupCreateInput, Prisma.MonitoringGroupUncheckedCreateInput>;
};
export type MonitoringGroupCreateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    data: Prisma.MonitoringGroupCreateManyInput | Prisma.MonitoringGroupCreateManyInput[];
    skipDuplicates?: boolean;
};
export type MonitoringGroupCreateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.MonitoringGroupSelectCreateManyAndReturn<ExtArgs> | null;
    omit?: Prisma.MonitoringGroupOmit<ExtArgs> | null;
    data: Prisma.MonitoringGroupCreateManyInput | Prisma.MonitoringGroupCreateManyInput[];
    skipDuplicates?: boolean;
};
export type MonitoringGroupUpdateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.MonitoringGroupSelect<ExtArgs> | null;
    omit?: Prisma.MonitoringGroupOmit<ExtArgs> | null;
    data: Prisma.XOR<Prisma.MonitoringGroupUpdateInput, Prisma.MonitoringGroupUncheckedUpdateInput>;
    where: Prisma.MonitoringGroupWhereUniqueInput;
};
export type MonitoringGroupUpdateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    data: Prisma.XOR<Prisma.MonitoringGroupUpdateManyMutationInput, Prisma.MonitoringGroupUncheckedUpdateManyInput>;
    where?: Prisma.MonitoringGroupWhereInput;
    limit?: number;
};
export type MonitoringGroupUpdateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.MonitoringGroupSelectUpdateManyAndReturn<ExtArgs> | null;
    omit?: Prisma.MonitoringGroupOmit<ExtArgs> | null;
    data: Prisma.XOR<Prisma.MonitoringGroupUpdateManyMutationInput, Prisma.MonitoringGroupUncheckedUpdateManyInput>;
    where?: Prisma.MonitoringGroupWhereInput;
    limit?: number;
};
export type MonitoringGroupUpsertArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.MonitoringGroupSelect<ExtArgs> | null;
    omit?: Prisma.MonitoringGroupOmit<ExtArgs> | null;
    where: Prisma.MonitoringGroupWhereUniqueInput;
    create: Prisma.XOR<Prisma.MonitoringGroupCreateInput, Prisma.MonitoringGroupUncheckedCreateInput>;
    update: Prisma.XOR<Prisma.MonitoringGroupUpdateInput, Prisma.MonitoringGroupUncheckedUpdateInput>;
};
export type MonitoringGroupDeleteArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.MonitoringGroupSelect<ExtArgs> | null;
    omit?: Prisma.MonitoringGroupOmit<ExtArgs> | null;
    where: Prisma.MonitoringGroupWhereUniqueInput;
};
export type MonitoringGroupDeleteManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.MonitoringGroupWhereInput;
    limit?: number;
};
export type MonitoringGroupDefaultArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.MonitoringGroupSelect<ExtArgs> | null;
    omit?: Prisma.MonitoringGroupOmit<ExtArgs> | null;
};
export {};
