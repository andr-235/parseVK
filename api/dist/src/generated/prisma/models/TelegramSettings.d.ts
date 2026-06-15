import type * as runtime from "@prisma/client/runtime/client";
import type * as Prisma from "../internal/prismaNamespace.js";
export type TelegramSettingsModel = runtime.Types.Result.DefaultSelection<Prisma.$TelegramSettingsPayload>;
export type AggregateTelegramSettings = {
    _count: TelegramSettingsCountAggregateOutputType | null;
    _avg: TelegramSettingsAvgAggregateOutputType | null;
    _sum: TelegramSettingsSumAggregateOutputType | null;
    _min: TelegramSettingsMinAggregateOutputType | null;
    _max: TelegramSettingsMaxAggregateOutputType | null;
};
export type TelegramSettingsAvgAggregateOutputType = {
    id: number | null;
    apiId: number | null;
};
export type TelegramSettingsSumAggregateOutputType = {
    id: number | null;
    apiId: number | null;
};
export type TelegramSettingsMinAggregateOutputType = {
    id: number | null;
    phoneNumber: string | null;
    apiId: number | null;
    apiHash: string | null;
    createdAt: Date | null;
    updatedAt: Date | null;
};
export type TelegramSettingsMaxAggregateOutputType = {
    id: number | null;
    phoneNumber: string | null;
    apiId: number | null;
    apiHash: string | null;
    createdAt: Date | null;
    updatedAt: Date | null;
};
export type TelegramSettingsCountAggregateOutputType = {
    id: number;
    phoneNumber: number;
    apiId: number;
    apiHash: number;
    createdAt: number;
    updatedAt: number;
    _all: number;
};
export type TelegramSettingsAvgAggregateInputType = {
    id?: true;
    apiId?: true;
};
export type TelegramSettingsSumAggregateInputType = {
    id?: true;
    apiId?: true;
};
export type TelegramSettingsMinAggregateInputType = {
    id?: true;
    phoneNumber?: true;
    apiId?: true;
    apiHash?: true;
    createdAt?: true;
    updatedAt?: true;
};
export type TelegramSettingsMaxAggregateInputType = {
    id?: true;
    phoneNumber?: true;
    apiId?: true;
    apiHash?: true;
    createdAt?: true;
    updatedAt?: true;
};
export type TelegramSettingsCountAggregateInputType = {
    id?: true;
    phoneNumber?: true;
    apiId?: true;
    apiHash?: true;
    createdAt?: true;
    updatedAt?: true;
    _all?: true;
};
export type TelegramSettingsAggregateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.TelegramSettingsWhereInput;
    orderBy?: Prisma.TelegramSettingsOrderByWithRelationInput | Prisma.TelegramSettingsOrderByWithRelationInput[];
    cursor?: Prisma.TelegramSettingsWhereUniqueInput;
    take?: number;
    skip?: number;
    _count?: true | TelegramSettingsCountAggregateInputType;
    _avg?: TelegramSettingsAvgAggregateInputType;
    _sum?: TelegramSettingsSumAggregateInputType;
    _min?: TelegramSettingsMinAggregateInputType;
    _max?: TelegramSettingsMaxAggregateInputType;
};
export type GetTelegramSettingsAggregateType<T extends TelegramSettingsAggregateArgs> = {
    [P in keyof T & keyof AggregateTelegramSettings]: P extends '_count' | 'count' ? T[P] extends true ? number : Prisma.GetScalarType<T[P], AggregateTelegramSettings[P]> : Prisma.GetScalarType<T[P], AggregateTelegramSettings[P]>;
};
export type TelegramSettingsGroupByArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.TelegramSettingsWhereInput;
    orderBy?: Prisma.TelegramSettingsOrderByWithAggregationInput | Prisma.TelegramSettingsOrderByWithAggregationInput[];
    by: Prisma.TelegramSettingsScalarFieldEnum[] | Prisma.TelegramSettingsScalarFieldEnum;
    having?: Prisma.TelegramSettingsScalarWhereWithAggregatesInput;
    take?: number;
    skip?: number;
    _count?: TelegramSettingsCountAggregateInputType | true;
    _avg?: TelegramSettingsAvgAggregateInputType;
    _sum?: TelegramSettingsSumAggregateInputType;
    _min?: TelegramSettingsMinAggregateInputType;
    _max?: TelegramSettingsMaxAggregateInputType;
};
export type TelegramSettingsGroupByOutputType = {
    id: number;
    phoneNumber: string | null;
    apiId: number | null;
    apiHash: string | null;
    createdAt: Date;
    updatedAt: Date;
    _count: TelegramSettingsCountAggregateOutputType | null;
    _avg: TelegramSettingsAvgAggregateOutputType | null;
    _sum: TelegramSettingsSumAggregateOutputType | null;
    _min: TelegramSettingsMinAggregateOutputType | null;
    _max: TelegramSettingsMaxAggregateOutputType | null;
};
type GetTelegramSettingsGroupByPayload<T extends TelegramSettingsGroupByArgs> = Prisma.PrismaPromise<Array<Prisma.PickEnumerable<TelegramSettingsGroupByOutputType, T['by']> & {
    [P in ((keyof T) & (keyof TelegramSettingsGroupByOutputType))]: P extends '_count' ? T[P] extends boolean ? number : Prisma.GetScalarType<T[P], TelegramSettingsGroupByOutputType[P]> : Prisma.GetScalarType<T[P], TelegramSettingsGroupByOutputType[P]>;
}>>;
export type TelegramSettingsWhereInput = {
    AND?: Prisma.TelegramSettingsWhereInput | Prisma.TelegramSettingsWhereInput[];
    OR?: Prisma.TelegramSettingsWhereInput[];
    NOT?: Prisma.TelegramSettingsWhereInput | Prisma.TelegramSettingsWhereInput[];
    id?: Prisma.IntFilter<"TelegramSettings"> | number;
    phoneNumber?: Prisma.StringNullableFilter<"TelegramSettings"> | string | null;
    apiId?: Prisma.IntNullableFilter<"TelegramSettings"> | number | null;
    apiHash?: Prisma.StringNullableFilter<"TelegramSettings"> | string | null;
    createdAt?: Prisma.DateTimeFilter<"TelegramSettings"> | Date | string;
    updatedAt?: Prisma.DateTimeFilter<"TelegramSettings"> | Date | string;
};
export type TelegramSettingsOrderByWithRelationInput = {
    id?: Prisma.SortOrder;
    phoneNumber?: Prisma.SortOrderInput | Prisma.SortOrder;
    apiId?: Prisma.SortOrderInput | Prisma.SortOrder;
    apiHash?: Prisma.SortOrderInput | Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
};
export type TelegramSettingsWhereUniqueInput = Prisma.AtLeast<{
    id?: number;
    AND?: Prisma.TelegramSettingsWhereInput | Prisma.TelegramSettingsWhereInput[];
    OR?: Prisma.TelegramSettingsWhereInput[];
    NOT?: Prisma.TelegramSettingsWhereInput | Prisma.TelegramSettingsWhereInput[];
    phoneNumber?: Prisma.StringNullableFilter<"TelegramSettings"> | string | null;
    apiId?: Prisma.IntNullableFilter<"TelegramSettings"> | number | null;
    apiHash?: Prisma.StringNullableFilter<"TelegramSettings"> | string | null;
    createdAt?: Prisma.DateTimeFilter<"TelegramSettings"> | Date | string;
    updatedAt?: Prisma.DateTimeFilter<"TelegramSettings"> | Date | string;
}, "id">;
export type TelegramSettingsOrderByWithAggregationInput = {
    id?: Prisma.SortOrder;
    phoneNumber?: Prisma.SortOrderInput | Prisma.SortOrder;
    apiId?: Prisma.SortOrderInput | Prisma.SortOrder;
    apiHash?: Prisma.SortOrderInput | Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
    _count?: Prisma.TelegramSettingsCountOrderByAggregateInput;
    _avg?: Prisma.TelegramSettingsAvgOrderByAggregateInput;
    _max?: Prisma.TelegramSettingsMaxOrderByAggregateInput;
    _min?: Prisma.TelegramSettingsMinOrderByAggregateInput;
    _sum?: Prisma.TelegramSettingsSumOrderByAggregateInput;
};
export type TelegramSettingsScalarWhereWithAggregatesInput = {
    AND?: Prisma.TelegramSettingsScalarWhereWithAggregatesInput | Prisma.TelegramSettingsScalarWhereWithAggregatesInput[];
    OR?: Prisma.TelegramSettingsScalarWhereWithAggregatesInput[];
    NOT?: Prisma.TelegramSettingsScalarWhereWithAggregatesInput | Prisma.TelegramSettingsScalarWhereWithAggregatesInput[];
    id?: Prisma.IntWithAggregatesFilter<"TelegramSettings"> | number;
    phoneNumber?: Prisma.StringNullableWithAggregatesFilter<"TelegramSettings"> | string | null;
    apiId?: Prisma.IntNullableWithAggregatesFilter<"TelegramSettings"> | number | null;
    apiHash?: Prisma.StringNullableWithAggregatesFilter<"TelegramSettings"> | string | null;
    createdAt?: Prisma.DateTimeWithAggregatesFilter<"TelegramSettings"> | Date | string;
    updatedAt?: Prisma.DateTimeWithAggregatesFilter<"TelegramSettings"> | Date | string;
};
export type TelegramSettingsCreateInput = {
    phoneNumber?: string | null;
    apiId?: number | null;
    apiHash?: string | null;
    createdAt?: Date | string;
    updatedAt?: Date | string;
};
export type TelegramSettingsUncheckedCreateInput = {
    id?: number;
    phoneNumber?: string | null;
    apiId?: number | null;
    apiHash?: string | null;
    createdAt?: Date | string;
    updatedAt?: Date | string;
};
export type TelegramSettingsUpdateInput = {
    phoneNumber?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    apiId?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    apiHash?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type TelegramSettingsUncheckedUpdateInput = {
    id?: Prisma.IntFieldUpdateOperationsInput | number;
    phoneNumber?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    apiId?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    apiHash?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type TelegramSettingsCreateManyInput = {
    id?: number;
    phoneNumber?: string | null;
    apiId?: number | null;
    apiHash?: string | null;
    createdAt?: Date | string;
    updatedAt?: Date | string;
};
export type TelegramSettingsUpdateManyMutationInput = {
    phoneNumber?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    apiId?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    apiHash?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type TelegramSettingsUncheckedUpdateManyInput = {
    id?: Prisma.IntFieldUpdateOperationsInput | number;
    phoneNumber?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    apiId?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    apiHash?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type TelegramSettingsCountOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    phoneNumber?: Prisma.SortOrder;
    apiId?: Prisma.SortOrder;
    apiHash?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
};
export type TelegramSettingsAvgOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    apiId?: Prisma.SortOrder;
};
export type TelegramSettingsMaxOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    phoneNumber?: Prisma.SortOrder;
    apiId?: Prisma.SortOrder;
    apiHash?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
};
export type TelegramSettingsMinOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    phoneNumber?: Prisma.SortOrder;
    apiId?: Prisma.SortOrder;
    apiHash?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
};
export type TelegramSettingsSumOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    apiId?: Prisma.SortOrder;
};
export type TelegramSettingsSelect<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    phoneNumber?: boolean;
    apiId?: boolean;
    apiHash?: boolean;
    createdAt?: boolean;
    updatedAt?: boolean;
}, ExtArgs["result"]["telegramSettings"]>;
export type TelegramSettingsSelectCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    phoneNumber?: boolean;
    apiId?: boolean;
    apiHash?: boolean;
    createdAt?: boolean;
    updatedAt?: boolean;
}, ExtArgs["result"]["telegramSettings"]>;
export type TelegramSettingsSelectUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    phoneNumber?: boolean;
    apiId?: boolean;
    apiHash?: boolean;
    createdAt?: boolean;
    updatedAt?: boolean;
}, ExtArgs["result"]["telegramSettings"]>;
export type TelegramSettingsSelectScalar = {
    id?: boolean;
    phoneNumber?: boolean;
    apiId?: boolean;
    apiHash?: boolean;
    createdAt?: boolean;
    updatedAt?: boolean;
};
export type TelegramSettingsOmit<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetOmit<"id" | "phoneNumber" | "apiId" | "apiHash" | "createdAt" | "updatedAt", ExtArgs["result"]["telegramSettings"]>;
export type $TelegramSettingsPayload<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    name: "TelegramSettings";
    objects: {};
    scalars: runtime.Types.Extensions.GetPayloadResult<{
        id: number;
        phoneNumber: string | null;
        apiId: number | null;
        apiHash: string | null;
        createdAt: Date;
        updatedAt: Date;
    }, ExtArgs["result"]["telegramSettings"]>;
    composites: {};
};
export type TelegramSettingsGetPayload<S extends boolean | null | undefined | TelegramSettingsDefaultArgs> = runtime.Types.Result.GetResult<Prisma.$TelegramSettingsPayload, S>;
export type TelegramSettingsCountArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = Omit<TelegramSettingsFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
    select?: TelegramSettingsCountAggregateInputType | true;
};
export interface TelegramSettingsDelegate<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: {
        types: Prisma.TypeMap<ExtArgs>['model']['TelegramSettings'];
        meta: {
            name: 'TelegramSettings';
        };
    };
    findUnique<T extends TelegramSettingsFindUniqueArgs>(args: Prisma.SelectSubset<T, TelegramSettingsFindUniqueArgs<ExtArgs>>): Prisma.Prisma__TelegramSettingsClient<runtime.Types.Result.GetResult<Prisma.$TelegramSettingsPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    findUniqueOrThrow<T extends TelegramSettingsFindUniqueOrThrowArgs>(args: Prisma.SelectSubset<T, TelegramSettingsFindUniqueOrThrowArgs<ExtArgs>>): Prisma.Prisma__TelegramSettingsClient<runtime.Types.Result.GetResult<Prisma.$TelegramSettingsPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    findFirst<T extends TelegramSettingsFindFirstArgs>(args?: Prisma.SelectSubset<T, TelegramSettingsFindFirstArgs<ExtArgs>>): Prisma.Prisma__TelegramSettingsClient<runtime.Types.Result.GetResult<Prisma.$TelegramSettingsPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    findFirstOrThrow<T extends TelegramSettingsFindFirstOrThrowArgs>(args?: Prisma.SelectSubset<T, TelegramSettingsFindFirstOrThrowArgs<ExtArgs>>): Prisma.Prisma__TelegramSettingsClient<runtime.Types.Result.GetResult<Prisma.$TelegramSettingsPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    findMany<T extends TelegramSettingsFindManyArgs>(args?: Prisma.SelectSubset<T, TelegramSettingsFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$TelegramSettingsPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>;
    create<T extends TelegramSettingsCreateArgs>(args: Prisma.SelectSubset<T, TelegramSettingsCreateArgs<ExtArgs>>): Prisma.Prisma__TelegramSettingsClient<runtime.Types.Result.GetResult<Prisma.$TelegramSettingsPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    createMany<T extends TelegramSettingsCreateManyArgs>(args?: Prisma.SelectSubset<T, TelegramSettingsCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    createManyAndReturn<T extends TelegramSettingsCreateManyAndReturnArgs>(args?: Prisma.SelectSubset<T, TelegramSettingsCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$TelegramSettingsPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>;
    delete<T extends TelegramSettingsDeleteArgs>(args: Prisma.SelectSubset<T, TelegramSettingsDeleteArgs<ExtArgs>>): Prisma.Prisma__TelegramSettingsClient<runtime.Types.Result.GetResult<Prisma.$TelegramSettingsPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    update<T extends TelegramSettingsUpdateArgs>(args: Prisma.SelectSubset<T, TelegramSettingsUpdateArgs<ExtArgs>>): Prisma.Prisma__TelegramSettingsClient<runtime.Types.Result.GetResult<Prisma.$TelegramSettingsPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    deleteMany<T extends TelegramSettingsDeleteManyArgs>(args?: Prisma.SelectSubset<T, TelegramSettingsDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    updateMany<T extends TelegramSettingsUpdateManyArgs>(args: Prisma.SelectSubset<T, TelegramSettingsUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    updateManyAndReturn<T extends TelegramSettingsUpdateManyAndReturnArgs>(args: Prisma.SelectSubset<T, TelegramSettingsUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$TelegramSettingsPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>;
    upsert<T extends TelegramSettingsUpsertArgs>(args: Prisma.SelectSubset<T, TelegramSettingsUpsertArgs<ExtArgs>>): Prisma.Prisma__TelegramSettingsClient<runtime.Types.Result.GetResult<Prisma.$TelegramSettingsPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    count<T extends TelegramSettingsCountArgs>(args?: Prisma.Subset<T, TelegramSettingsCountArgs>): Prisma.PrismaPromise<T extends runtime.Types.Utils.Record<'select', any> ? T['select'] extends true ? number : Prisma.GetScalarType<T['select'], TelegramSettingsCountAggregateOutputType> : number>;
    aggregate<T extends TelegramSettingsAggregateArgs>(args: Prisma.Subset<T, TelegramSettingsAggregateArgs>): Prisma.PrismaPromise<GetTelegramSettingsAggregateType<T>>;
    groupBy<T extends TelegramSettingsGroupByArgs, HasSelectOrTake extends Prisma.Or<Prisma.Extends<'skip', Prisma.Keys<T>>, Prisma.Extends<'take', Prisma.Keys<T>>>, OrderByArg extends Prisma.True extends HasSelectOrTake ? {
        orderBy: TelegramSettingsGroupByArgs['orderBy'];
    } : {
        orderBy?: TelegramSettingsGroupByArgs['orderBy'];
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
    }[OrderFields]>(args: Prisma.SubsetIntersection<T, TelegramSettingsGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetTelegramSettingsGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>;
    readonly fields: TelegramSettingsFieldRefs;
}
export interface Prisma__TelegramSettingsClient<T, Null = never, ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise";
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): runtime.Types.Utils.JsPromise<TResult1 | TResult2>;
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): runtime.Types.Utils.JsPromise<T | TResult>;
    finally(onfinally?: (() => void) | undefined | null): runtime.Types.Utils.JsPromise<T>;
}
export interface TelegramSettingsFieldRefs {
    readonly id: Prisma.FieldRef<"TelegramSettings", 'Int'>;
    readonly phoneNumber: Prisma.FieldRef<"TelegramSettings", 'String'>;
    readonly apiId: Prisma.FieldRef<"TelegramSettings", 'Int'>;
    readonly apiHash: Prisma.FieldRef<"TelegramSettings", 'String'>;
    readonly createdAt: Prisma.FieldRef<"TelegramSettings", 'DateTime'>;
    readonly updatedAt: Prisma.FieldRef<"TelegramSettings", 'DateTime'>;
}
export type TelegramSettingsFindUniqueArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.TelegramSettingsSelect<ExtArgs> | null;
    omit?: Prisma.TelegramSettingsOmit<ExtArgs> | null;
    where: Prisma.TelegramSettingsWhereUniqueInput;
};
export type TelegramSettingsFindUniqueOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.TelegramSettingsSelect<ExtArgs> | null;
    omit?: Prisma.TelegramSettingsOmit<ExtArgs> | null;
    where: Prisma.TelegramSettingsWhereUniqueInput;
};
export type TelegramSettingsFindFirstArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.TelegramSettingsSelect<ExtArgs> | null;
    omit?: Prisma.TelegramSettingsOmit<ExtArgs> | null;
    where?: Prisma.TelegramSettingsWhereInput;
    orderBy?: Prisma.TelegramSettingsOrderByWithRelationInput | Prisma.TelegramSettingsOrderByWithRelationInput[];
    cursor?: Prisma.TelegramSettingsWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.TelegramSettingsScalarFieldEnum | Prisma.TelegramSettingsScalarFieldEnum[];
};
export type TelegramSettingsFindFirstOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.TelegramSettingsSelect<ExtArgs> | null;
    omit?: Prisma.TelegramSettingsOmit<ExtArgs> | null;
    where?: Prisma.TelegramSettingsWhereInput;
    orderBy?: Prisma.TelegramSettingsOrderByWithRelationInput | Prisma.TelegramSettingsOrderByWithRelationInput[];
    cursor?: Prisma.TelegramSettingsWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.TelegramSettingsScalarFieldEnum | Prisma.TelegramSettingsScalarFieldEnum[];
};
export type TelegramSettingsFindManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.TelegramSettingsSelect<ExtArgs> | null;
    omit?: Prisma.TelegramSettingsOmit<ExtArgs> | null;
    where?: Prisma.TelegramSettingsWhereInput;
    orderBy?: Prisma.TelegramSettingsOrderByWithRelationInput | Prisma.TelegramSettingsOrderByWithRelationInput[];
    cursor?: Prisma.TelegramSettingsWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.TelegramSettingsScalarFieldEnum | Prisma.TelegramSettingsScalarFieldEnum[];
};
export type TelegramSettingsCreateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.TelegramSettingsSelect<ExtArgs> | null;
    omit?: Prisma.TelegramSettingsOmit<ExtArgs> | null;
    data: Prisma.XOR<Prisma.TelegramSettingsCreateInput, Prisma.TelegramSettingsUncheckedCreateInput>;
};
export type TelegramSettingsCreateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    data: Prisma.TelegramSettingsCreateManyInput | Prisma.TelegramSettingsCreateManyInput[];
    skipDuplicates?: boolean;
};
export type TelegramSettingsCreateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.TelegramSettingsSelectCreateManyAndReturn<ExtArgs> | null;
    omit?: Prisma.TelegramSettingsOmit<ExtArgs> | null;
    data: Prisma.TelegramSettingsCreateManyInput | Prisma.TelegramSettingsCreateManyInput[];
    skipDuplicates?: boolean;
};
export type TelegramSettingsUpdateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.TelegramSettingsSelect<ExtArgs> | null;
    omit?: Prisma.TelegramSettingsOmit<ExtArgs> | null;
    data: Prisma.XOR<Prisma.TelegramSettingsUpdateInput, Prisma.TelegramSettingsUncheckedUpdateInput>;
    where: Prisma.TelegramSettingsWhereUniqueInput;
};
export type TelegramSettingsUpdateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    data: Prisma.XOR<Prisma.TelegramSettingsUpdateManyMutationInput, Prisma.TelegramSettingsUncheckedUpdateManyInput>;
    where?: Prisma.TelegramSettingsWhereInput;
    limit?: number;
};
export type TelegramSettingsUpdateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.TelegramSettingsSelectUpdateManyAndReturn<ExtArgs> | null;
    omit?: Prisma.TelegramSettingsOmit<ExtArgs> | null;
    data: Prisma.XOR<Prisma.TelegramSettingsUpdateManyMutationInput, Prisma.TelegramSettingsUncheckedUpdateManyInput>;
    where?: Prisma.TelegramSettingsWhereInput;
    limit?: number;
};
export type TelegramSettingsUpsertArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.TelegramSettingsSelect<ExtArgs> | null;
    omit?: Prisma.TelegramSettingsOmit<ExtArgs> | null;
    where: Prisma.TelegramSettingsWhereUniqueInput;
    create: Prisma.XOR<Prisma.TelegramSettingsCreateInput, Prisma.TelegramSettingsUncheckedCreateInput>;
    update: Prisma.XOR<Prisma.TelegramSettingsUpdateInput, Prisma.TelegramSettingsUncheckedUpdateInput>;
};
export type TelegramSettingsDeleteArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.TelegramSettingsSelect<ExtArgs> | null;
    omit?: Prisma.TelegramSettingsOmit<ExtArgs> | null;
    where: Prisma.TelegramSettingsWhereUniqueInput;
};
export type TelegramSettingsDeleteManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.TelegramSettingsWhereInput;
    limit?: number;
};
export type TelegramSettingsDefaultArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.TelegramSettingsSelect<ExtArgs> | null;
    omit?: Prisma.TelegramSettingsOmit<ExtArgs> | null;
};
export {};
