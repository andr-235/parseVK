import type * as runtime from "@prisma/client/runtime/client";
import type * as Prisma from "../internal/prismaNamespace.js";
export type WatchlistSettingsModel = runtime.Types.Result.DefaultSelection<Prisma.$WatchlistSettingsPayload>;
export type AggregateWatchlistSettings = {
    _count: WatchlistSettingsCountAggregateOutputType | null;
    _avg: WatchlistSettingsAvgAggregateOutputType | null;
    _sum: WatchlistSettingsSumAggregateOutputType | null;
    _min: WatchlistSettingsMinAggregateOutputType | null;
    _max: WatchlistSettingsMaxAggregateOutputType | null;
};
export type WatchlistSettingsAvgAggregateOutputType = {
    id: number | null;
    pollIntervalMinutes: number | null;
    maxAuthors: number | null;
};
export type WatchlistSettingsSumAggregateOutputType = {
    id: number | null;
    pollIntervalMinutes: number | null;
    maxAuthors: number | null;
};
export type WatchlistSettingsMinAggregateOutputType = {
    id: number | null;
    trackAllComments: boolean | null;
    pollIntervalMinutes: number | null;
    maxAuthors: number | null;
    createdAt: Date | null;
    updatedAt: Date | null;
};
export type WatchlistSettingsMaxAggregateOutputType = {
    id: number | null;
    trackAllComments: boolean | null;
    pollIntervalMinutes: number | null;
    maxAuthors: number | null;
    createdAt: Date | null;
    updatedAt: Date | null;
};
export type WatchlistSettingsCountAggregateOutputType = {
    id: number;
    trackAllComments: number;
    pollIntervalMinutes: number;
    maxAuthors: number;
    createdAt: number;
    updatedAt: number;
    _all: number;
};
export type WatchlistSettingsAvgAggregateInputType = {
    id?: true;
    pollIntervalMinutes?: true;
    maxAuthors?: true;
};
export type WatchlistSettingsSumAggregateInputType = {
    id?: true;
    pollIntervalMinutes?: true;
    maxAuthors?: true;
};
export type WatchlistSettingsMinAggregateInputType = {
    id?: true;
    trackAllComments?: true;
    pollIntervalMinutes?: true;
    maxAuthors?: true;
    createdAt?: true;
    updatedAt?: true;
};
export type WatchlistSettingsMaxAggregateInputType = {
    id?: true;
    trackAllComments?: true;
    pollIntervalMinutes?: true;
    maxAuthors?: true;
    createdAt?: true;
    updatedAt?: true;
};
export type WatchlistSettingsCountAggregateInputType = {
    id?: true;
    trackAllComments?: true;
    pollIntervalMinutes?: true;
    maxAuthors?: true;
    createdAt?: true;
    updatedAt?: true;
    _all?: true;
};
export type WatchlistSettingsAggregateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.WatchlistSettingsWhereInput;
    orderBy?: Prisma.WatchlistSettingsOrderByWithRelationInput | Prisma.WatchlistSettingsOrderByWithRelationInput[];
    cursor?: Prisma.WatchlistSettingsWhereUniqueInput;
    take?: number;
    skip?: number;
    _count?: true | WatchlistSettingsCountAggregateInputType;
    _avg?: WatchlistSettingsAvgAggregateInputType;
    _sum?: WatchlistSettingsSumAggregateInputType;
    _min?: WatchlistSettingsMinAggregateInputType;
    _max?: WatchlistSettingsMaxAggregateInputType;
};
export type GetWatchlistSettingsAggregateType<T extends WatchlistSettingsAggregateArgs> = {
    [P in keyof T & keyof AggregateWatchlistSettings]: P extends '_count' | 'count' ? T[P] extends true ? number : Prisma.GetScalarType<T[P], AggregateWatchlistSettings[P]> : Prisma.GetScalarType<T[P], AggregateWatchlistSettings[P]>;
};
export type WatchlistSettingsGroupByArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.WatchlistSettingsWhereInput;
    orderBy?: Prisma.WatchlistSettingsOrderByWithAggregationInput | Prisma.WatchlistSettingsOrderByWithAggregationInput[];
    by: Prisma.WatchlistSettingsScalarFieldEnum[] | Prisma.WatchlistSettingsScalarFieldEnum;
    having?: Prisma.WatchlistSettingsScalarWhereWithAggregatesInput;
    take?: number;
    skip?: number;
    _count?: WatchlistSettingsCountAggregateInputType | true;
    _avg?: WatchlistSettingsAvgAggregateInputType;
    _sum?: WatchlistSettingsSumAggregateInputType;
    _min?: WatchlistSettingsMinAggregateInputType;
    _max?: WatchlistSettingsMaxAggregateInputType;
};
export type WatchlistSettingsGroupByOutputType = {
    id: number;
    trackAllComments: boolean;
    pollIntervalMinutes: number;
    maxAuthors: number;
    createdAt: Date;
    updatedAt: Date;
    _count: WatchlistSettingsCountAggregateOutputType | null;
    _avg: WatchlistSettingsAvgAggregateOutputType | null;
    _sum: WatchlistSettingsSumAggregateOutputType | null;
    _min: WatchlistSettingsMinAggregateOutputType | null;
    _max: WatchlistSettingsMaxAggregateOutputType | null;
};
type GetWatchlistSettingsGroupByPayload<T extends WatchlistSettingsGroupByArgs> = Prisma.PrismaPromise<Array<Prisma.PickEnumerable<WatchlistSettingsGroupByOutputType, T['by']> & {
    [P in ((keyof T) & (keyof WatchlistSettingsGroupByOutputType))]: P extends '_count' ? T[P] extends boolean ? number : Prisma.GetScalarType<T[P], WatchlistSettingsGroupByOutputType[P]> : Prisma.GetScalarType<T[P], WatchlistSettingsGroupByOutputType[P]>;
}>>;
export type WatchlistSettingsWhereInput = {
    AND?: Prisma.WatchlistSettingsWhereInput | Prisma.WatchlistSettingsWhereInput[];
    OR?: Prisma.WatchlistSettingsWhereInput[];
    NOT?: Prisma.WatchlistSettingsWhereInput | Prisma.WatchlistSettingsWhereInput[];
    id?: Prisma.IntFilter<"WatchlistSettings"> | number;
    trackAllComments?: Prisma.BoolFilter<"WatchlistSettings"> | boolean;
    pollIntervalMinutes?: Prisma.IntFilter<"WatchlistSettings"> | number;
    maxAuthors?: Prisma.IntFilter<"WatchlistSettings"> | number;
    createdAt?: Prisma.DateTimeFilter<"WatchlistSettings"> | Date | string;
    updatedAt?: Prisma.DateTimeFilter<"WatchlistSettings"> | Date | string;
    authors?: Prisma.WatchlistAuthorListRelationFilter;
};
export type WatchlistSettingsOrderByWithRelationInput = {
    id?: Prisma.SortOrder;
    trackAllComments?: Prisma.SortOrder;
    pollIntervalMinutes?: Prisma.SortOrder;
    maxAuthors?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
    authors?: Prisma.WatchlistAuthorOrderByRelationAggregateInput;
};
export type WatchlistSettingsWhereUniqueInput = Prisma.AtLeast<{
    id?: number;
    AND?: Prisma.WatchlistSettingsWhereInput | Prisma.WatchlistSettingsWhereInput[];
    OR?: Prisma.WatchlistSettingsWhereInput[];
    NOT?: Prisma.WatchlistSettingsWhereInput | Prisma.WatchlistSettingsWhereInput[];
    trackAllComments?: Prisma.BoolFilter<"WatchlistSettings"> | boolean;
    pollIntervalMinutes?: Prisma.IntFilter<"WatchlistSettings"> | number;
    maxAuthors?: Prisma.IntFilter<"WatchlistSettings"> | number;
    createdAt?: Prisma.DateTimeFilter<"WatchlistSettings"> | Date | string;
    updatedAt?: Prisma.DateTimeFilter<"WatchlistSettings"> | Date | string;
    authors?: Prisma.WatchlistAuthorListRelationFilter;
}, "id">;
export type WatchlistSettingsOrderByWithAggregationInput = {
    id?: Prisma.SortOrder;
    trackAllComments?: Prisma.SortOrder;
    pollIntervalMinutes?: Prisma.SortOrder;
    maxAuthors?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
    _count?: Prisma.WatchlistSettingsCountOrderByAggregateInput;
    _avg?: Prisma.WatchlistSettingsAvgOrderByAggregateInput;
    _max?: Prisma.WatchlistSettingsMaxOrderByAggregateInput;
    _min?: Prisma.WatchlistSettingsMinOrderByAggregateInput;
    _sum?: Prisma.WatchlistSettingsSumOrderByAggregateInput;
};
export type WatchlistSettingsScalarWhereWithAggregatesInput = {
    AND?: Prisma.WatchlistSettingsScalarWhereWithAggregatesInput | Prisma.WatchlistSettingsScalarWhereWithAggregatesInput[];
    OR?: Prisma.WatchlistSettingsScalarWhereWithAggregatesInput[];
    NOT?: Prisma.WatchlistSettingsScalarWhereWithAggregatesInput | Prisma.WatchlistSettingsScalarWhereWithAggregatesInput[];
    id?: Prisma.IntWithAggregatesFilter<"WatchlistSettings"> | number;
    trackAllComments?: Prisma.BoolWithAggregatesFilter<"WatchlistSettings"> | boolean;
    pollIntervalMinutes?: Prisma.IntWithAggregatesFilter<"WatchlistSettings"> | number;
    maxAuthors?: Prisma.IntWithAggregatesFilter<"WatchlistSettings"> | number;
    createdAt?: Prisma.DateTimeWithAggregatesFilter<"WatchlistSettings"> | Date | string;
    updatedAt?: Prisma.DateTimeWithAggregatesFilter<"WatchlistSettings"> | Date | string;
};
export type WatchlistSettingsCreateInput = {
    trackAllComments?: boolean;
    pollIntervalMinutes?: number;
    maxAuthors?: number;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    authors?: Prisma.WatchlistAuthorCreateNestedManyWithoutSettingsInput;
};
export type WatchlistSettingsUncheckedCreateInput = {
    id?: number;
    trackAllComments?: boolean;
    pollIntervalMinutes?: number;
    maxAuthors?: number;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    authors?: Prisma.WatchlistAuthorUncheckedCreateNestedManyWithoutSettingsInput;
};
export type WatchlistSettingsUpdateInput = {
    trackAllComments?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    pollIntervalMinutes?: Prisma.IntFieldUpdateOperationsInput | number;
    maxAuthors?: Prisma.IntFieldUpdateOperationsInput | number;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    authors?: Prisma.WatchlistAuthorUpdateManyWithoutSettingsNestedInput;
};
export type WatchlistSettingsUncheckedUpdateInput = {
    id?: Prisma.IntFieldUpdateOperationsInput | number;
    trackAllComments?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    pollIntervalMinutes?: Prisma.IntFieldUpdateOperationsInput | number;
    maxAuthors?: Prisma.IntFieldUpdateOperationsInput | number;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    authors?: Prisma.WatchlistAuthorUncheckedUpdateManyWithoutSettingsNestedInput;
};
export type WatchlistSettingsCreateManyInput = {
    id?: number;
    trackAllComments?: boolean;
    pollIntervalMinutes?: number;
    maxAuthors?: number;
    createdAt?: Date | string;
    updatedAt?: Date | string;
};
export type WatchlistSettingsUpdateManyMutationInput = {
    trackAllComments?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    pollIntervalMinutes?: Prisma.IntFieldUpdateOperationsInput | number;
    maxAuthors?: Prisma.IntFieldUpdateOperationsInput | number;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type WatchlistSettingsUncheckedUpdateManyInput = {
    id?: Prisma.IntFieldUpdateOperationsInput | number;
    trackAllComments?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    pollIntervalMinutes?: Prisma.IntFieldUpdateOperationsInput | number;
    maxAuthors?: Prisma.IntFieldUpdateOperationsInput | number;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type WatchlistSettingsCountOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    trackAllComments?: Prisma.SortOrder;
    pollIntervalMinutes?: Prisma.SortOrder;
    maxAuthors?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
};
export type WatchlistSettingsAvgOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    pollIntervalMinutes?: Prisma.SortOrder;
    maxAuthors?: Prisma.SortOrder;
};
export type WatchlistSettingsMaxOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    trackAllComments?: Prisma.SortOrder;
    pollIntervalMinutes?: Prisma.SortOrder;
    maxAuthors?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
};
export type WatchlistSettingsMinOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    trackAllComments?: Prisma.SortOrder;
    pollIntervalMinutes?: Prisma.SortOrder;
    maxAuthors?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
};
export type WatchlistSettingsSumOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    pollIntervalMinutes?: Prisma.SortOrder;
    maxAuthors?: Prisma.SortOrder;
};
export type WatchlistSettingsScalarRelationFilter = {
    is?: Prisma.WatchlistSettingsWhereInput;
    isNot?: Prisma.WatchlistSettingsWhereInput;
};
export type WatchlistSettingsCreateNestedOneWithoutAuthorsInput = {
    create?: Prisma.XOR<Prisma.WatchlistSettingsCreateWithoutAuthorsInput, Prisma.WatchlistSettingsUncheckedCreateWithoutAuthorsInput>;
    connectOrCreate?: Prisma.WatchlistSettingsCreateOrConnectWithoutAuthorsInput;
    connect?: Prisma.WatchlistSettingsWhereUniqueInput;
};
export type WatchlistSettingsUpdateOneRequiredWithoutAuthorsNestedInput = {
    create?: Prisma.XOR<Prisma.WatchlistSettingsCreateWithoutAuthorsInput, Prisma.WatchlistSettingsUncheckedCreateWithoutAuthorsInput>;
    connectOrCreate?: Prisma.WatchlistSettingsCreateOrConnectWithoutAuthorsInput;
    upsert?: Prisma.WatchlistSettingsUpsertWithoutAuthorsInput;
    connect?: Prisma.WatchlistSettingsWhereUniqueInput;
    update?: Prisma.XOR<Prisma.XOR<Prisma.WatchlistSettingsUpdateToOneWithWhereWithoutAuthorsInput, Prisma.WatchlistSettingsUpdateWithoutAuthorsInput>, Prisma.WatchlistSettingsUncheckedUpdateWithoutAuthorsInput>;
};
export type WatchlistSettingsCreateWithoutAuthorsInput = {
    trackAllComments?: boolean;
    pollIntervalMinutes?: number;
    maxAuthors?: number;
    createdAt?: Date | string;
    updatedAt?: Date | string;
};
export type WatchlistSettingsUncheckedCreateWithoutAuthorsInput = {
    id?: number;
    trackAllComments?: boolean;
    pollIntervalMinutes?: number;
    maxAuthors?: number;
    createdAt?: Date | string;
    updatedAt?: Date | string;
};
export type WatchlistSettingsCreateOrConnectWithoutAuthorsInput = {
    where: Prisma.WatchlistSettingsWhereUniqueInput;
    create: Prisma.XOR<Prisma.WatchlistSettingsCreateWithoutAuthorsInput, Prisma.WatchlistSettingsUncheckedCreateWithoutAuthorsInput>;
};
export type WatchlistSettingsUpsertWithoutAuthorsInput = {
    update: Prisma.XOR<Prisma.WatchlistSettingsUpdateWithoutAuthorsInput, Prisma.WatchlistSettingsUncheckedUpdateWithoutAuthorsInput>;
    create: Prisma.XOR<Prisma.WatchlistSettingsCreateWithoutAuthorsInput, Prisma.WatchlistSettingsUncheckedCreateWithoutAuthorsInput>;
    where?: Prisma.WatchlistSettingsWhereInput;
};
export type WatchlistSettingsUpdateToOneWithWhereWithoutAuthorsInput = {
    where?: Prisma.WatchlistSettingsWhereInput;
    data: Prisma.XOR<Prisma.WatchlistSettingsUpdateWithoutAuthorsInput, Prisma.WatchlistSettingsUncheckedUpdateWithoutAuthorsInput>;
};
export type WatchlistSettingsUpdateWithoutAuthorsInput = {
    trackAllComments?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    pollIntervalMinutes?: Prisma.IntFieldUpdateOperationsInput | number;
    maxAuthors?: Prisma.IntFieldUpdateOperationsInput | number;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type WatchlistSettingsUncheckedUpdateWithoutAuthorsInput = {
    id?: Prisma.IntFieldUpdateOperationsInput | number;
    trackAllComments?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    pollIntervalMinutes?: Prisma.IntFieldUpdateOperationsInput | number;
    maxAuthors?: Prisma.IntFieldUpdateOperationsInput | number;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type WatchlistSettingsCountOutputType = {
    authors: number;
};
export type WatchlistSettingsCountOutputTypeSelect<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    authors?: boolean | WatchlistSettingsCountOutputTypeCountAuthorsArgs;
};
export type WatchlistSettingsCountOutputTypeDefaultArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.WatchlistSettingsCountOutputTypeSelect<ExtArgs> | null;
};
export type WatchlistSettingsCountOutputTypeCountAuthorsArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.WatchlistAuthorWhereInput;
};
export type WatchlistSettingsSelect<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    trackAllComments?: boolean;
    pollIntervalMinutes?: boolean;
    maxAuthors?: boolean;
    createdAt?: boolean;
    updatedAt?: boolean;
    authors?: boolean | Prisma.WatchlistSettings$authorsArgs<ExtArgs>;
    _count?: boolean | Prisma.WatchlistSettingsCountOutputTypeDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["watchlistSettings"]>;
export type WatchlistSettingsSelectCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    trackAllComments?: boolean;
    pollIntervalMinutes?: boolean;
    maxAuthors?: boolean;
    createdAt?: boolean;
    updatedAt?: boolean;
}, ExtArgs["result"]["watchlistSettings"]>;
export type WatchlistSettingsSelectUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    trackAllComments?: boolean;
    pollIntervalMinutes?: boolean;
    maxAuthors?: boolean;
    createdAt?: boolean;
    updatedAt?: boolean;
}, ExtArgs["result"]["watchlistSettings"]>;
export type WatchlistSettingsSelectScalar = {
    id?: boolean;
    trackAllComments?: boolean;
    pollIntervalMinutes?: boolean;
    maxAuthors?: boolean;
    createdAt?: boolean;
    updatedAt?: boolean;
};
export type WatchlistSettingsOmit<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetOmit<"id" | "trackAllComments" | "pollIntervalMinutes" | "maxAuthors" | "createdAt" | "updatedAt", ExtArgs["result"]["watchlistSettings"]>;
export type WatchlistSettingsInclude<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    authors?: boolean | Prisma.WatchlistSettings$authorsArgs<ExtArgs>;
    _count?: boolean | Prisma.WatchlistSettingsCountOutputTypeDefaultArgs<ExtArgs>;
};
export type WatchlistSettingsIncludeCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {};
export type WatchlistSettingsIncludeUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {};
export type $WatchlistSettingsPayload<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    name: "WatchlistSettings";
    objects: {
        authors: Prisma.$WatchlistAuthorPayload<ExtArgs>[];
    };
    scalars: runtime.Types.Extensions.GetPayloadResult<{
        id: number;
        trackAllComments: boolean;
        pollIntervalMinutes: number;
        maxAuthors: number;
        createdAt: Date;
        updatedAt: Date;
    }, ExtArgs["result"]["watchlistSettings"]>;
    composites: {};
};
export type WatchlistSettingsGetPayload<S extends boolean | null | undefined | WatchlistSettingsDefaultArgs> = runtime.Types.Result.GetResult<Prisma.$WatchlistSettingsPayload, S>;
export type WatchlistSettingsCountArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = Omit<WatchlistSettingsFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
    select?: WatchlistSettingsCountAggregateInputType | true;
};
export interface WatchlistSettingsDelegate<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: {
        types: Prisma.TypeMap<ExtArgs>['model']['WatchlistSettings'];
        meta: {
            name: 'WatchlistSettings';
        };
    };
    findUnique<T extends WatchlistSettingsFindUniqueArgs>(args: Prisma.SelectSubset<T, WatchlistSettingsFindUniqueArgs<ExtArgs>>): Prisma.Prisma__WatchlistSettingsClient<runtime.Types.Result.GetResult<Prisma.$WatchlistSettingsPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    findUniqueOrThrow<T extends WatchlistSettingsFindUniqueOrThrowArgs>(args: Prisma.SelectSubset<T, WatchlistSettingsFindUniqueOrThrowArgs<ExtArgs>>): Prisma.Prisma__WatchlistSettingsClient<runtime.Types.Result.GetResult<Prisma.$WatchlistSettingsPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    findFirst<T extends WatchlistSettingsFindFirstArgs>(args?: Prisma.SelectSubset<T, WatchlistSettingsFindFirstArgs<ExtArgs>>): Prisma.Prisma__WatchlistSettingsClient<runtime.Types.Result.GetResult<Prisma.$WatchlistSettingsPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    findFirstOrThrow<T extends WatchlistSettingsFindFirstOrThrowArgs>(args?: Prisma.SelectSubset<T, WatchlistSettingsFindFirstOrThrowArgs<ExtArgs>>): Prisma.Prisma__WatchlistSettingsClient<runtime.Types.Result.GetResult<Prisma.$WatchlistSettingsPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    findMany<T extends WatchlistSettingsFindManyArgs>(args?: Prisma.SelectSubset<T, WatchlistSettingsFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$WatchlistSettingsPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>;
    create<T extends WatchlistSettingsCreateArgs>(args: Prisma.SelectSubset<T, WatchlistSettingsCreateArgs<ExtArgs>>): Prisma.Prisma__WatchlistSettingsClient<runtime.Types.Result.GetResult<Prisma.$WatchlistSettingsPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    createMany<T extends WatchlistSettingsCreateManyArgs>(args?: Prisma.SelectSubset<T, WatchlistSettingsCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    createManyAndReturn<T extends WatchlistSettingsCreateManyAndReturnArgs>(args?: Prisma.SelectSubset<T, WatchlistSettingsCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$WatchlistSettingsPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>;
    delete<T extends WatchlistSettingsDeleteArgs>(args: Prisma.SelectSubset<T, WatchlistSettingsDeleteArgs<ExtArgs>>): Prisma.Prisma__WatchlistSettingsClient<runtime.Types.Result.GetResult<Prisma.$WatchlistSettingsPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    update<T extends WatchlistSettingsUpdateArgs>(args: Prisma.SelectSubset<T, WatchlistSettingsUpdateArgs<ExtArgs>>): Prisma.Prisma__WatchlistSettingsClient<runtime.Types.Result.GetResult<Prisma.$WatchlistSettingsPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    deleteMany<T extends WatchlistSettingsDeleteManyArgs>(args?: Prisma.SelectSubset<T, WatchlistSettingsDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    updateMany<T extends WatchlistSettingsUpdateManyArgs>(args: Prisma.SelectSubset<T, WatchlistSettingsUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    updateManyAndReturn<T extends WatchlistSettingsUpdateManyAndReturnArgs>(args: Prisma.SelectSubset<T, WatchlistSettingsUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$WatchlistSettingsPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>;
    upsert<T extends WatchlistSettingsUpsertArgs>(args: Prisma.SelectSubset<T, WatchlistSettingsUpsertArgs<ExtArgs>>): Prisma.Prisma__WatchlistSettingsClient<runtime.Types.Result.GetResult<Prisma.$WatchlistSettingsPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    count<T extends WatchlistSettingsCountArgs>(args?: Prisma.Subset<T, WatchlistSettingsCountArgs>): Prisma.PrismaPromise<T extends runtime.Types.Utils.Record<'select', any> ? T['select'] extends true ? number : Prisma.GetScalarType<T['select'], WatchlistSettingsCountAggregateOutputType> : number>;
    aggregate<T extends WatchlistSettingsAggregateArgs>(args: Prisma.Subset<T, WatchlistSettingsAggregateArgs>): Prisma.PrismaPromise<GetWatchlistSettingsAggregateType<T>>;
    groupBy<T extends WatchlistSettingsGroupByArgs, HasSelectOrTake extends Prisma.Or<Prisma.Extends<'skip', Prisma.Keys<T>>, Prisma.Extends<'take', Prisma.Keys<T>>>, OrderByArg extends Prisma.True extends HasSelectOrTake ? {
        orderBy: WatchlistSettingsGroupByArgs['orderBy'];
    } : {
        orderBy?: WatchlistSettingsGroupByArgs['orderBy'];
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
    }[OrderFields]>(args: Prisma.SubsetIntersection<T, WatchlistSettingsGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetWatchlistSettingsGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>;
    readonly fields: WatchlistSettingsFieldRefs;
}
export interface Prisma__WatchlistSettingsClient<T, Null = never, ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise";
    authors<T extends Prisma.WatchlistSettings$authorsArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.WatchlistSettings$authorsArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$WatchlistAuthorPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>;
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): runtime.Types.Utils.JsPromise<TResult1 | TResult2>;
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): runtime.Types.Utils.JsPromise<T | TResult>;
    finally(onfinally?: (() => void) | undefined | null): runtime.Types.Utils.JsPromise<T>;
}
export interface WatchlistSettingsFieldRefs {
    readonly id: Prisma.FieldRef<"WatchlistSettings", 'Int'>;
    readonly trackAllComments: Prisma.FieldRef<"WatchlistSettings", 'Boolean'>;
    readonly pollIntervalMinutes: Prisma.FieldRef<"WatchlistSettings", 'Int'>;
    readonly maxAuthors: Prisma.FieldRef<"WatchlistSettings", 'Int'>;
    readonly createdAt: Prisma.FieldRef<"WatchlistSettings", 'DateTime'>;
    readonly updatedAt: Prisma.FieldRef<"WatchlistSettings", 'DateTime'>;
}
export type WatchlistSettingsFindUniqueArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.WatchlistSettingsSelect<ExtArgs> | null;
    omit?: Prisma.WatchlistSettingsOmit<ExtArgs> | null;
    include?: Prisma.WatchlistSettingsInclude<ExtArgs> | null;
    where: Prisma.WatchlistSettingsWhereUniqueInput;
};
export type WatchlistSettingsFindUniqueOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.WatchlistSettingsSelect<ExtArgs> | null;
    omit?: Prisma.WatchlistSettingsOmit<ExtArgs> | null;
    include?: Prisma.WatchlistSettingsInclude<ExtArgs> | null;
    where: Prisma.WatchlistSettingsWhereUniqueInput;
};
export type WatchlistSettingsFindFirstArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.WatchlistSettingsSelect<ExtArgs> | null;
    omit?: Prisma.WatchlistSettingsOmit<ExtArgs> | null;
    include?: Prisma.WatchlistSettingsInclude<ExtArgs> | null;
    where?: Prisma.WatchlistSettingsWhereInput;
    orderBy?: Prisma.WatchlistSettingsOrderByWithRelationInput | Prisma.WatchlistSettingsOrderByWithRelationInput[];
    cursor?: Prisma.WatchlistSettingsWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.WatchlistSettingsScalarFieldEnum | Prisma.WatchlistSettingsScalarFieldEnum[];
};
export type WatchlistSettingsFindFirstOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.WatchlistSettingsSelect<ExtArgs> | null;
    omit?: Prisma.WatchlistSettingsOmit<ExtArgs> | null;
    include?: Prisma.WatchlistSettingsInclude<ExtArgs> | null;
    where?: Prisma.WatchlistSettingsWhereInput;
    orderBy?: Prisma.WatchlistSettingsOrderByWithRelationInput | Prisma.WatchlistSettingsOrderByWithRelationInput[];
    cursor?: Prisma.WatchlistSettingsWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.WatchlistSettingsScalarFieldEnum | Prisma.WatchlistSettingsScalarFieldEnum[];
};
export type WatchlistSettingsFindManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.WatchlistSettingsSelect<ExtArgs> | null;
    omit?: Prisma.WatchlistSettingsOmit<ExtArgs> | null;
    include?: Prisma.WatchlistSettingsInclude<ExtArgs> | null;
    where?: Prisma.WatchlistSettingsWhereInput;
    orderBy?: Prisma.WatchlistSettingsOrderByWithRelationInput | Prisma.WatchlistSettingsOrderByWithRelationInput[];
    cursor?: Prisma.WatchlistSettingsWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.WatchlistSettingsScalarFieldEnum | Prisma.WatchlistSettingsScalarFieldEnum[];
};
export type WatchlistSettingsCreateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.WatchlistSettingsSelect<ExtArgs> | null;
    omit?: Prisma.WatchlistSettingsOmit<ExtArgs> | null;
    include?: Prisma.WatchlistSettingsInclude<ExtArgs> | null;
    data: Prisma.XOR<Prisma.WatchlistSettingsCreateInput, Prisma.WatchlistSettingsUncheckedCreateInput>;
};
export type WatchlistSettingsCreateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    data: Prisma.WatchlistSettingsCreateManyInput | Prisma.WatchlistSettingsCreateManyInput[];
    skipDuplicates?: boolean;
};
export type WatchlistSettingsCreateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.WatchlistSettingsSelectCreateManyAndReturn<ExtArgs> | null;
    omit?: Prisma.WatchlistSettingsOmit<ExtArgs> | null;
    data: Prisma.WatchlistSettingsCreateManyInput | Prisma.WatchlistSettingsCreateManyInput[];
    skipDuplicates?: boolean;
};
export type WatchlistSettingsUpdateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.WatchlistSettingsSelect<ExtArgs> | null;
    omit?: Prisma.WatchlistSettingsOmit<ExtArgs> | null;
    include?: Prisma.WatchlistSettingsInclude<ExtArgs> | null;
    data: Prisma.XOR<Prisma.WatchlistSettingsUpdateInput, Prisma.WatchlistSettingsUncheckedUpdateInput>;
    where: Prisma.WatchlistSettingsWhereUniqueInput;
};
export type WatchlistSettingsUpdateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    data: Prisma.XOR<Prisma.WatchlistSettingsUpdateManyMutationInput, Prisma.WatchlistSettingsUncheckedUpdateManyInput>;
    where?: Prisma.WatchlistSettingsWhereInput;
    limit?: number;
};
export type WatchlistSettingsUpdateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.WatchlistSettingsSelectUpdateManyAndReturn<ExtArgs> | null;
    omit?: Prisma.WatchlistSettingsOmit<ExtArgs> | null;
    data: Prisma.XOR<Prisma.WatchlistSettingsUpdateManyMutationInput, Prisma.WatchlistSettingsUncheckedUpdateManyInput>;
    where?: Prisma.WatchlistSettingsWhereInput;
    limit?: number;
};
export type WatchlistSettingsUpsertArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.WatchlistSettingsSelect<ExtArgs> | null;
    omit?: Prisma.WatchlistSettingsOmit<ExtArgs> | null;
    include?: Prisma.WatchlistSettingsInclude<ExtArgs> | null;
    where: Prisma.WatchlistSettingsWhereUniqueInput;
    create: Prisma.XOR<Prisma.WatchlistSettingsCreateInput, Prisma.WatchlistSettingsUncheckedCreateInput>;
    update: Prisma.XOR<Prisma.WatchlistSettingsUpdateInput, Prisma.WatchlistSettingsUncheckedUpdateInput>;
};
export type WatchlistSettingsDeleteArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.WatchlistSettingsSelect<ExtArgs> | null;
    omit?: Prisma.WatchlistSettingsOmit<ExtArgs> | null;
    include?: Prisma.WatchlistSettingsInclude<ExtArgs> | null;
    where: Prisma.WatchlistSettingsWhereUniqueInput;
};
export type WatchlistSettingsDeleteManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.WatchlistSettingsWhereInput;
    limit?: number;
};
export type WatchlistSettings$authorsArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.WatchlistAuthorSelect<ExtArgs> | null;
    omit?: Prisma.WatchlistAuthorOmit<ExtArgs> | null;
    include?: Prisma.WatchlistAuthorInclude<ExtArgs> | null;
    where?: Prisma.WatchlistAuthorWhereInput;
    orderBy?: Prisma.WatchlistAuthorOrderByWithRelationInput | Prisma.WatchlistAuthorOrderByWithRelationInput[];
    cursor?: Prisma.WatchlistAuthorWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.WatchlistAuthorScalarFieldEnum | Prisma.WatchlistAuthorScalarFieldEnum[];
};
export type WatchlistSettingsDefaultArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.WatchlistSettingsSelect<ExtArgs> | null;
    omit?: Prisma.WatchlistSettingsOmit<ExtArgs> | null;
    include?: Prisma.WatchlistSettingsInclude<ExtArgs> | null;
};
export {};
