import type * as runtime from "@prisma/client/runtime/client";
import type * as Prisma from "../internal/prismaNamespace.js";
export type TaskAutomationSettingsModel = runtime.Types.Result.DefaultSelection<Prisma.$TaskAutomationSettingsPayload>;
export type AggregateTaskAutomationSettings = {
    _count: TaskAutomationSettingsCountAggregateOutputType | null;
    _avg: TaskAutomationSettingsAvgAggregateOutputType | null;
    _sum: TaskAutomationSettingsSumAggregateOutputType | null;
    _min: TaskAutomationSettingsMinAggregateOutputType | null;
    _max: TaskAutomationSettingsMaxAggregateOutputType | null;
};
export type TaskAutomationSettingsAvgAggregateOutputType = {
    id: number | null;
    runHour: number | null;
    runMinute: number | null;
    postLimit: number | null;
    timezoneOffsetMinutes: number | null;
};
export type TaskAutomationSettingsSumAggregateOutputType = {
    id: number | null;
    runHour: number | null;
    runMinute: number | null;
    postLimit: number | null;
    timezoneOffsetMinutes: number | null;
};
export type TaskAutomationSettingsMinAggregateOutputType = {
    id: number | null;
    enabled: boolean | null;
    runHour: number | null;
    runMinute: number | null;
    postLimit: number | null;
    timezoneOffsetMinutes: number | null;
    lastRunAt: Date | null;
    createdAt: Date | null;
    updatedAt: Date | null;
};
export type TaskAutomationSettingsMaxAggregateOutputType = {
    id: number | null;
    enabled: boolean | null;
    runHour: number | null;
    runMinute: number | null;
    postLimit: number | null;
    timezoneOffsetMinutes: number | null;
    lastRunAt: Date | null;
    createdAt: Date | null;
    updatedAt: Date | null;
};
export type TaskAutomationSettingsCountAggregateOutputType = {
    id: number;
    enabled: number;
    runHour: number;
    runMinute: number;
    postLimit: number;
    timezoneOffsetMinutes: number;
    lastRunAt: number;
    createdAt: number;
    updatedAt: number;
    _all: number;
};
export type TaskAutomationSettingsAvgAggregateInputType = {
    id?: true;
    runHour?: true;
    runMinute?: true;
    postLimit?: true;
    timezoneOffsetMinutes?: true;
};
export type TaskAutomationSettingsSumAggregateInputType = {
    id?: true;
    runHour?: true;
    runMinute?: true;
    postLimit?: true;
    timezoneOffsetMinutes?: true;
};
export type TaskAutomationSettingsMinAggregateInputType = {
    id?: true;
    enabled?: true;
    runHour?: true;
    runMinute?: true;
    postLimit?: true;
    timezoneOffsetMinutes?: true;
    lastRunAt?: true;
    createdAt?: true;
    updatedAt?: true;
};
export type TaskAutomationSettingsMaxAggregateInputType = {
    id?: true;
    enabled?: true;
    runHour?: true;
    runMinute?: true;
    postLimit?: true;
    timezoneOffsetMinutes?: true;
    lastRunAt?: true;
    createdAt?: true;
    updatedAt?: true;
};
export type TaskAutomationSettingsCountAggregateInputType = {
    id?: true;
    enabled?: true;
    runHour?: true;
    runMinute?: true;
    postLimit?: true;
    timezoneOffsetMinutes?: true;
    lastRunAt?: true;
    createdAt?: true;
    updatedAt?: true;
    _all?: true;
};
export type TaskAutomationSettingsAggregateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.TaskAutomationSettingsWhereInput;
    orderBy?: Prisma.TaskAutomationSettingsOrderByWithRelationInput | Prisma.TaskAutomationSettingsOrderByWithRelationInput[];
    cursor?: Prisma.TaskAutomationSettingsWhereUniqueInput;
    take?: number;
    skip?: number;
    _count?: true | TaskAutomationSettingsCountAggregateInputType;
    _avg?: TaskAutomationSettingsAvgAggregateInputType;
    _sum?: TaskAutomationSettingsSumAggregateInputType;
    _min?: TaskAutomationSettingsMinAggregateInputType;
    _max?: TaskAutomationSettingsMaxAggregateInputType;
};
export type GetTaskAutomationSettingsAggregateType<T extends TaskAutomationSettingsAggregateArgs> = {
    [P in keyof T & keyof AggregateTaskAutomationSettings]: P extends '_count' | 'count' ? T[P] extends true ? number : Prisma.GetScalarType<T[P], AggregateTaskAutomationSettings[P]> : Prisma.GetScalarType<T[P], AggregateTaskAutomationSettings[P]>;
};
export type TaskAutomationSettingsGroupByArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.TaskAutomationSettingsWhereInput;
    orderBy?: Prisma.TaskAutomationSettingsOrderByWithAggregationInput | Prisma.TaskAutomationSettingsOrderByWithAggregationInput[];
    by: Prisma.TaskAutomationSettingsScalarFieldEnum[] | Prisma.TaskAutomationSettingsScalarFieldEnum;
    having?: Prisma.TaskAutomationSettingsScalarWhereWithAggregatesInput;
    take?: number;
    skip?: number;
    _count?: TaskAutomationSettingsCountAggregateInputType | true;
    _avg?: TaskAutomationSettingsAvgAggregateInputType;
    _sum?: TaskAutomationSettingsSumAggregateInputType;
    _min?: TaskAutomationSettingsMinAggregateInputType;
    _max?: TaskAutomationSettingsMaxAggregateInputType;
};
export type TaskAutomationSettingsGroupByOutputType = {
    id: number;
    enabled: boolean;
    runHour: number;
    runMinute: number;
    postLimit: number;
    timezoneOffsetMinutes: number;
    lastRunAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
    _count: TaskAutomationSettingsCountAggregateOutputType | null;
    _avg: TaskAutomationSettingsAvgAggregateOutputType | null;
    _sum: TaskAutomationSettingsSumAggregateOutputType | null;
    _min: TaskAutomationSettingsMinAggregateOutputType | null;
    _max: TaskAutomationSettingsMaxAggregateOutputType | null;
};
type GetTaskAutomationSettingsGroupByPayload<T extends TaskAutomationSettingsGroupByArgs> = Prisma.PrismaPromise<Array<Prisma.PickEnumerable<TaskAutomationSettingsGroupByOutputType, T['by']> & {
    [P in ((keyof T) & (keyof TaskAutomationSettingsGroupByOutputType))]: P extends '_count' ? T[P] extends boolean ? number : Prisma.GetScalarType<T[P], TaskAutomationSettingsGroupByOutputType[P]> : Prisma.GetScalarType<T[P], TaskAutomationSettingsGroupByOutputType[P]>;
}>>;
export type TaskAutomationSettingsWhereInput = {
    AND?: Prisma.TaskAutomationSettingsWhereInput | Prisma.TaskAutomationSettingsWhereInput[];
    OR?: Prisma.TaskAutomationSettingsWhereInput[];
    NOT?: Prisma.TaskAutomationSettingsWhereInput | Prisma.TaskAutomationSettingsWhereInput[];
    id?: Prisma.IntFilter<"TaskAutomationSettings"> | number;
    enabled?: Prisma.BoolFilter<"TaskAutomationSettings"> | boolean;
    runHour?: Prisma.IntFilter<"TaskAutomationSettings"> | number;
    runMinute?: Prisma.IntFilter<"TaskAutomationSettings"> | number;
    postLimit?: Prisma.IntFilter<"TaskAutomationSettings"> | number;
    timezoneOffsetMinutes?: Prisma.IntFilter<"TaskAutomationSettings"> | number;
    lastRunAt?: Prisma.DateTimeNullableFilter<"TaskAutomationSettings"> | Date | string | null;
    createdAt?: Prisma.DateTimeFilter<"TaskAutomationSettings"> | Date | string;
    updatedAt?: Prisma.DateTimeFilter<"TaskAutomationSettings"> | Date | string;
};
export type TaskAutomationSettingsOrderByWithRelationInput = {
    id?: Prisma.SortOrder;
    enabled?: Prisma.SortOrder;
    runHour?: Prisma.SortOrder;
    runMinute?: Prisma.SortOrder;
    postLimit?: Prisma.SortOrder;
    timezoneOffsetMinutes?: Prisma.SortOrder;
    lastRunAt?: Prisma.SortOrderInput | Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
};
export type TaskAutomationSettingsWhereUniqueInput = Prisma.AtLeast<{
    id?: number;
    AND?: Prisma.TaskAutomationSettingsWhereInput | Prisma.TaskAutomationSettingsWhereInput[];
    OR?: Prisma.TaskAutomationSettingsWhereInput[];
    NOT?: Prisma.TaskAutomationSettingsWhereInput | Prisma.TaskAutomationSettingsWhereInput[];
    enabled?: Prisma.BoolFilter<"TaskAutomationSettings"> | boolean;
    runHour?: Prisma.IntFilter<"TaskAutomationSettings"> | number;
    runMinute?: Prisma.IntFilter<"TaskAutomationSettings"> | number;
    postLimit?: Prisma.IntFilter<"TaskAutomationSettings"> | number;
    timezoneOffsetMinutes?: Prisma.IntFilter<"TaskAutomationSettings"> | number;
    lastRunAt?: Prisma.DateTimeNullableFilter<"TaskAutomationSettings"> | Date | string | null;
    createdAt?: Prisma.DateTimeFilter<"TaskAutomationSettings"> | Date | string;
    updatedAt?: Prisma.DateTimeFilter<"TaskAutomationSettings"> | Date | string;
}, "id">;
export type TaskAutomationSettingsOrderByWithAggregationInput = {
    id?: Prisma.SortOrder;
    enabled?: Prisma.SortOrder;
    runHour?: Prisma.SortOrder;
    runMinute?: Prisma.SortOrder;
    postLimit?: Prisma.SortOrder;
    timezoneOffsetMinutes?: Prisma.SortOrder;
    lastRunAt?: Prisma.SortOrderInput | Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
    _count?: Prisma.TaskAutomationSettingsCountOrderByAggregateInput;
    _avg?: Prisma.TaskAutomationSettingsAvgOrderByAggregateInput;
    _max?: Prisma.TaskAutomationSettingsMaxOrderByAggregateInput;
    _min?: Prisma.TaskAutomationSettingsMinOrderByAggregateInput;
    _sum?: Prisma.TaskAutomationSettingsSumOrderByAggregateInput;
};
export type TaskAutomationSettingsScalarWhereWithAggregatesInput = {
    AND?: Prisma.TaskAutomationSettingsScalarWhereWithAggregatesInput | Prisma.TaskAutomationSettingsScalarWhereWithAggregatesInput[];
    OR?: Prisma.TaskAutomationSettingsScalarWhereWithAggregatesInput[];
    NOT?: Prisma.TaskAutomationSettingsScalarWhereWithAggregatesInput | Prisma.TaskAutomationSettingsScalarWhereWithAggregatesInput[];
    id?: Prisma.IntWithAggregatesFilter<"TaskAutomationSettings"> | number;
    enabled?: Prisma.BoolWithAggregatesFilter<"TaskAutomationSettings"> | boolean;
    runHour?: Prisma.IntWithAggregatesFilter<"TaskAutomationSettings"> | number;
    runMinute?: Prisma.IntWithAggregatesFilter<"TaskAutomationSettings"> | number;
    postLimit?: Prisma.IntWithAggregatesFilter<"TaskAutomationSettings"> | number;
    timezoneOffsetMinutes?: Prisma.IntWithAggregatesFilter<"TaskAutomationSettings"> | number;
    lastRunAt?: Prisma.DateTimeNullableWithAggregatesFilter<"TaskAutomationSettings"> | Date | string | null;
    createdAt?: Prisma.DateTimeWithAggregatesFilter<"TaskAutomationSettings"> | Date | string;
    updatedAt?: Prisma.DateTimeWithAggregatesFilter<"TaskAutomationSettings"> | Date | string;
};
export type TaskAutomationSettingsCreateInput = {
    enabled?: boolean;
    runHour?: number;
    runMinute?: number;
    postLimit?: number;
    timezoneOffsetMinutes?: number;
    lastRunAt?: Date | string | null;
    createdAt?: Date | string;
    updatedAt?: Date | string;
};
export type TaskAutomationSettingsUncheckedCreateInput = {
    id?: number;
    enabled?: boolean;
    runHour?: number;
    runMinute?: number;
    postLimit?: number;
    timezoneOffsetMinutes?: number;
    lastRunAt?: Date | string | null;
    createdAt?: Date | string;
    updatedAt?: Date | string;
};
export type TaskAutomationSettingsUpdateInput = {
    enabled?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    runHour?: Prisma.IntFieldUpdateOperationsInput | number;
    runMinute?: Prisma.IntFieldUpdateOperationsInput | number;
    postLimit?: Prisma.IntFieldUpdateOperationsInput | number;
    timezoneOffsetMinutes?: Prisma.IntFieldUpdateOperationsInput | number;
    lastRunAt?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type TaskAutomationSettingsUncheckedUpdateInput = {
    id?: Prisma.IntFieldUpdateOperationsInput | number;
    enabled?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    runHour?: Prisma.IntFieldUpdateOperationsInput | number;
    runMinute?: Prisma.IntFieldUpdateOperationsInput | number;
    postLimit?: Prisma.IntFieldUpdateOperationsInput | number;
    timezoneOffsetMinutes?: Prisma.IntFieldUpdateOperationsInput | number;
    lastRunAt?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type TaskAutomationSettingsCreateManyInput = {
    id?: number;
    enabled?: boolean;
    runHour?: number;
    runMinute?: number;
    postLimit?: number;
    timezoneOffsetMinutes?: number;
    lastRunAt?: Date | string | null;
    createdAt?: Date | string;
    updatedAt?: Date | string;
};
export type TaskAutomationSettingsUpdateManyMutationInput = {
    enabled?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    runHour?: Prisma.IntFieldUpdateOperationsInput | number;
    runMinute?: Prisma.IntFieldUpdateOperationsInput | number;
    postLimit?: Prisma.IntFieldUpdateOperationsInput | number;
    timezoneOffsetMinutes?: Prisma.IntFieldUpdateOperationsInput | number;
    lastRunAt?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type TaskAutomationSettingsUncheckedUpdateManyInput = {
    id?: Prisma.IntFieldUpdateOperationsInput | number;
    enabled?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    runHour?: Prisma.IntFieldUpdateOperationsInput | number;
    runMinute?: Prisma.IntFieldUpdateOperationsInput | number;
    postLimit?: Prisma.IntFieldUpdateOperationsInput | number;
    timezoneOffsetMinutes?: Prisma.IntFieldUpdateOperationsInput | number;
    lastRunAt?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type TaskAutomationSettingsCountOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    enabled?: Prisma.SortOrder;
    runHour?: Prisma.SortOrder;
    runMinute?: Prisma.SortOrder;
    postLimit?: Prisma.SortOrder;
    timezoneOffsetMinutes?: Prisma.SortOrder;
    lastRunAt?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
};
export type TaskAutomationSettingsAvgOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    runHour?: Prisma.SortOrder;
    runMinute?: Prisma.SortOrder;
    postLimit?: Prisma.SortOrder;
    timezoneOffsetMinutes?: Prisma.SortOrder;
};
export type TaskAutomationSettingsMaxOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    enabled?: Prisma.SortOrder;
    runHour?: Prisma.SortOrder;
    runMinute?: Prisma.SortOrder;
    postLimit?: Prisma.SortOrder;
    timezoneOffsetMinutes?: Prisma.SortOrder;
    lastRunAt?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
};
export type TaskAutomationSettingsMinOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    enabled?: Prisma.SortOrder;
    runHour?: Prisma.SortOrder;
    runMinute?: Prisma.SortOrder;
    postLimit?: Prisma.SortOrder;
    timezoneOffsetMinutes?: Prisma.SortOrder;
    lastRunAt?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
};
export type TaskAutomationSettingsSumOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    runHour?: Prisma.SortOrder;
    runMinute?: Prisma.SortOrder;
    postLimit?: Prisma.SortOrder;
    timezoneOffsetMinutes?: Prisma.SortOrder;
};
export type NullableDateTimeFieldUpdateOperationsInput = {
    set?: Date | string | null;
};
export type TaskAutomationSettingsSelect<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    enabled?: boolean;
    runHour?: boolean;
    runMinute?: boolean;
    postLimit?: boolean;
    timezoneOffsetMinutes?: boolean;
    lastRunAt?: boolean;
    createdAt?: boolean;
    updatedAt?: boolean;
}, ExtArgs["result"]["taskAutomationSettings"]>;
export type TaskAutomationSettingsSelectCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    enabled?: boolean;
    runHour?: boolean;
    runMinute?: boolean;
    postLimit?: boolean;
    timezoneOffsetMinutes?: boolean;
    lastRunAt?: boolean;
    createdAt?: boolean;
    updatedAt?: boolean;
}, ExtArgs["result"]["taskAutomationSettings"]>;
export type TaskAutomationSettingsSelectUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    enabled?: boolean;
    runHour?: boolean;
    runMinute?: boolean;
    postLimit?: boolean;
    timezoneOffsetMinutes?: boolean;
    lastRunAt?: boolean;
    createdAt?: boolean;
    updatedAt?: boolean;
}, ExtArgs["result"]["taskAutomationSettings"]>;
export type TaskAutomationSettingsSelectScalar = {
    id?: boolean;
    enabled?: boolean;
    runHour?: boolean;
    runMinute?: boolean;
    postLimit?: boolean;
    timezoneOffsetMinutes?: boolean;
    lastRunAt?: boolean;
    createdAt?: boolean;
    updatedAt?: boolean;
};
export type TaskAutomationSettingsOmit<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetOmit<"id" | "enabled" | "runHour" | "runMinute" | "postLimit" | "timezoneOffsetMinutes" | "lastRunAt" | "createdAt" | "updatedAt", ExtArgs["result"]["taskAutomationSettings"]>;
export type $TaskAutomationSettingsPayload<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    name: "TaskAutomationSettings";
    objects: {};
    scalars: runtime.Types.Extensions.GetPayloadResult<{
        id: number;
        enabled: boolean;
        runHour: number;
        runMinute: number;
        postLimit: number;
        timezoneOffsetMinutes: number;
        lastRunAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
    }, ExtArgs["result"]["taskAutomationSettings"]>;
    composites: {};
};
export type TaskAutomationSettingsGetPayload<S extends boolean | null | undefined | TaskAutomationSettingsDefaultArgs> = runtime.Types.Result.GetResult<Prisma.$TaskAutomationSettingsPayload, S>;
export type TaskAutomationSettingsCountArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = Omit<TaskAutomationSettingsFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
    select?: TaskAutomationSettingsCountAggregateInputType | true;
};
export interface TaskAutomationSettingsDelegate<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: {
        types: Prisma.TypeMap<ExtArgs>['model']['TaskAutomationSettings'];
        meta: {
            name: 'TaskAutomationSettings';
        };
    };
    findUnique<T extends TaskAutomationSettingsFindUniqueArgs>(args: Prisma.SelectSubset<T, TaskAutomationSettingsFindUniqueArgs<ExtArgs>>): Prisma.Prisma__TaskAutomationSettingsClient<runtime.Types.Result.GetResult<Prisma.$TaskAutomationSettingsPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    findUniqueOrThrow<T extends TaskAutomationSettingsFindUniqueOrThrowArgs>(args: Prisma.SelectSubset<T, TaskAutomationSettingsFindUniqueOrThrowArgs<ExtArgs>>): Prisma.Prisma__TaskAutomationSettingsClient<runtime.Types.Result.GetResult<Prisma.$TaskAutomationSettingsPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    findFirst<T extends TaskAutomationSettingsFindFirstArgs>(args?: Prisma.SelectSubset<T, TaskAutomationSettingsFindFirstArgs<ExtArgs>>): Prisma.Prisma__TaskAutomationSettingsClient<runtime.Types.Result.GetResult<Prisma.$TaskAutomationSettingsPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    findFirstOrThrow<T extends TaskAutomationSettingsFindFirstOrThrowArgs>(args?: Prisma.SelectSubset<T, TaskAutomationSettingsFindFirstOrThrowArgs<ExtArgs>>): Prisma.Prisma__TaskAutomationSettingsClient<runtime.Types.Result.GetResult<Prisma.$TaskAutomationSettingsPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    findMany<T extends TaskAutomationSettingsFindManyArgs>(args?: Prisma.SelectSubset<T, TaskAutomationSettingsFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$TaskAutomationSettingsPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>;
    create<T extends TaskAutomationSettingsCreateArgs>(args: Prisma.SelectSubset<T, TaskAutomationSettingsCreateArgs<ExtArgs>>): Prisma.Prisma__TaskAutomationSettingsClient<runtime.Types.Result.GetResult<Prisma.$TaskAutomationSettingsPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    createMany<T extends TaskAutomationSettingsCreateManyArgs>(args?: Prisma.SelectSubset<T, TaskAutomationSettingsCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    createManyAndReturn<T extends TaskAutomationSettingsCreateManyAndReturnArgs>(args?: Prisma.SelectSubset<T, TaskAutomationSettingsCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$TaskAutomationSettingsPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>;
    delete<T extends TaskAutomationSettingsDeleteArgs>(args: Prisma.SelectSubset<T, TaskAutomationSettingsDeleteArgs<ExtArgs>>): Prisma.Prisma__TaskAutomationSettingsClient<runtime.Types.Result.GetResult<Prisma.$TaskAutomationSettingsPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    update<T extends TaskAutomationSettingsUpdateArgs>(args: Prisma.SelectSubset<T, TaskAutomationSettingsUpdateArgs<ExtArgs>>): Prisma.Prisma__TaskAutomationSettingsClient<runtime.Types.Result.GetResult<Prisma.$TaskAutomationSettingsPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    deleteMany<T extends TaskAutomationSettingsDeleteManyArgs>(args?: Prisma.SelectSubset<T, TaskAutomationSettingsDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    updateMany<T extends TaskAutomationSettingsUpdateManyArgs>(args: Prisma.SelectSubset<T, TaskAutomationSettingsUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    updateManyAndReturn<T extends TaskAutomationSettingsUpdateManyAndReturnArgs>(args: Prisma.SelectSubset<T, TaskAutomationSettingsUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$TaskAutomationSettingsPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>;
    upsert<T extends TaskAutomationSettingsUpsertArgs>(args: Prisma.SelectSubset<T, TaskAutomationSettingsUpsertArgs<ExtArgs>>): Prisma.Prisma__TaskAutomationSettingsClient<runtime.Types.Result.GetResult<Prisma.$TaskAutomationSettingsPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    count<T extends TaskAutomationSettingsCountArgs>(args?: Prisma.Subset<T, TaskAutomationSettingsCountArgs>): Prisma.PrismaPromise<T extends runtime.Types.Utils.Record<'select', any> ? T['select'] extends true ? number : Prisma.GetScalarType<T['select'], TaskAutomationSettingsCountAggregateOutputType> : number>;
    aggregate<T extends TaskAutomationSettingsAggregateArgs>(args: Prisma.Subset<T, TaskAutomationSettingsAggregateArgs>): Prisma.PrismaPromise<GetTaskAutomationSettingsAggregateType<T>>;
    groupBy<T extends TaskAutomationSettingsGroupByArgs, HasSelectOrTake extends Prisma.Or<Prisma.Extends<'skip', Prisma.Keys<T>>, Prisma.Extends<'take', Prisma.Keys<T>>>, OrderByArg extends Prisma.True extends HasSelectOrTake ? {
        orderBy: TaskAutomationSettingsGroupByArgs['orderBy'];
    } : {
        orderBy?: TaskAutomationSettingsGroupByArgs['orderBy'];
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
    }[OrderFields]>(args: Prisma.SubsetIntersection<T, TaskAutomationSettingsGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetTaskAutomationSettingsGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>;
    readonly fields: TaskAutomationSettingsFieldRefs;
}
export interface Prisma__TaskAutomationSettingsClient<T, Null = never, ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise";
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): runtime.Types.Utils.JsPromise<TResult1 | TResult2>;
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): runtime.Types.Utils.JsPromise<T | TResult>;
    finally(onfinally?: (() => void) | undefined | null): runtime.Types.Utils.JsPromise<T>;
}
export interface TaskAutomationSettingsFieldRefs {
    readonly id: Prisma.FieldRef<"TaskAutomationSettings", 'Int'>;
    readonly enabled: Prisma.FieldRef<"TaskAutomationSettings", 'Boolean'>;
    readonly runHour: Prisma.FieldRef<"TaskAutomationSettings", 'Int'>;
    readonly runMinute: Prisma.FieldRef<"TaskAutomationSettings", 'Int'>;
    readonly postLimit: Prisma.FieldRef<"TaskAutomationSettings", 'Int'>;
    readonly timezoneOffsetMinutes: Prisma.FieldRef<"TaskAutomationSettings", 'Int'>;
    readonly lastRunAt: Prisma.FieldRef<"TaskAutomationSettings", 'DateTime'>;
    readonly createdAt: Prisma.FieldRef<"TaskAutomationSettings", 'DateTime'>;
    readonly updatedAt: Prisma.FieldRef<"TaskAutomationSettings", 'DateTime'>;
}
export type TaskAutomationSettingsFindUniqueArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.TaskAutomationSettingsSelect<ExtArgs> | null;
    omit?: Prisma.TaskAutomationSettingsOmit<ExtArgs> | null;
    where: Prisma.TaskAutomationSettingsWhereUniqueInput;
};
export type TaskAutomationSettingsFindUniqueOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.TaskAutomationSettingsSelect<ExtArgs> | null;
    omit?: Prisma.TaskAutomationSettingsOmit<ExtArgs> | null;
    where: Prisma.TaskAutomationSettingsWhereUniqueInput;
};
export type TaskAutomationSettingsFindFirstArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.TaskAutomationSettingsSelect<ExtArgs> | null;
    omit?: Prisma.TaskAutomationSettingsOmit<ExtArgs> | null;
    where?: Prisma.TaskAutomationSettingsWhereInput;
    orderBy?: Prisma.TaskAutomationSettingsOrderByWithRelationInput | Prisma.TaskAutomationSettingsOrderByWithRelationInput[];
    cursor?: Prisma.TaskAutomationSettingsWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.TaskAutomationSettingsScalarFieldEnum | Prisma.TaskAutomationSettingsScalarFieldEnum[];
};
export type TaskAutomationSettingsFindFirstOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.TaskAutomationSettingsSelect<ExtArgs> | null;
    omit?: Prisma.TaskAutomationSettingsOmit<ExtArgs> | null;
    where?: Prisma.TaskAutomationSettingsWhereInput;
    orderBy?: Prisma.TaskAutomationSettingsOrderByWithRelationInput | Prisma.TaskAutomationSettingsOrderByWithRelationInput[];
    cursor?: Prisma.TaskAutomationSettingsWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.TaskAutomationSettingsScalarFieldEnum | Prisma.TaskAutomationSettingsScalarFieldEnum[];
};
export type TaskAutomationSettingsFindManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.TaskAutomationSettingsSelect<ExtArgs> | null;
    omit?: Prisma.TaskAutomationSettingsOmit<ExtArgs> | null;
    where?: Prisma.TaskAutomationSettingsWhereInput;
    orderBy?: Prisma.TaskAutomationSettingsOrderByWithRelationInput | Prisma.TaskAutomationSettingsOrderByWithRelationInput[];
    cursor?: Prisma.TaskAutomationSettingsWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.TaskAutomationSettingsScalarFieldEnum | Prisma.TaskAutomationSettingsScalarFieldEnum[];
};
export type TaskAutomationSettingsCreateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.TaskAutomationSettingsSelect<ExtArgs> | null;
    omit?: Prisma.TaskAutomationSettingsOmit<ExtArgs> | null;
    data: Prisma.XOR<Prisma.TaskAutomationSettingsCreateInput, Prisma.TaskAutomationSettingsUncheckedCreateInput>;
};
export type TaskAutomationSettingsCreateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    data: Prisma.TaskAutomationSettingsCreateManyInput | Prisma.TaskAutomationSettingsCreateManyInput[];
    skipDuplicates?: boolean;
};
export type TaskAutomationSettingsCreateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.TaskAutomationSettingsSelectCreateManyAndReturn<ExtArgs> | null;
    omit?: Prisma.TaskAutomationSettingsOmit<ExtArgs> | null;
    data: Prisma.TaskAutomationSettingsCreateManyInput | Prisma.TaskAutomationSettingsCreateManyInput[];
    skipDuplicates?: boolean;
};
export type TaskAutomationSettingsUpdateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.TaskAutomationSettingsSelect<ExtArgs> | null;
    omit?: Prisma.TaskAutomationSettingsOmit<ExtArgs> | null;
    data: Prisma.XOR<Prisma.TaskAutomationSettingsUpdateInput, Prisma.TaskAutomationSettingsUncheckedUpdateInput>;
    where: Prisma.TaskAutomationSettingsWhereUniqueInput;
};
export type TaskAutomationSettingsUpdateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    data: Prisma.XOR<Prisma.TaskAutomationSettingsUpdateManyMutationInput, Prisma.TaskAutomationSettingsUncheckedUpdateManyInput>;
    where?: Prisma.TaskAutomationSettingsWhereInput;
    limit?: number;
};
export type TaskAutomationSettingsUpdateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.TaskAutomationSettingsSelectUpdateManyAndReturn<ExtArgs> | null;
    omit?: Prisma.TaskAutomationSettingsOmit<ExtArgs> | null;
    data: Prisma.XOR<Prisma.TaskAutomationSettingsUpdateManyMutationInput, Prisma.TaskAutomationSettingsUncheckedUpdateManyInput>;
    where?: Prisma.TaskAutomationSettingsWhereInput;
    limit?: number;
};
export type TaskAutomationSettingsUpsertArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.TaskAutomationSettingsSelect<ExtArgs> | null;
    omit?: Prisma.TaskAutomationSettingsOmit<ExtArgs> | null;
    where: Prisma.TaskAutomationSettingsWhereUniqueInput;
    create: Prisma.XOR<Prisma.TaskAutomationSettingsCreateInput, Prisma.TaskAutomationSettingsUncheckedCreateInput>;
    update: Prisma.XOR<Prisma.TaskAutomationSettingsUpdateInput, Prisma.TaskAutomationSettingsUncheckedUpdateInput>;
};
export type TaskAutomationSettingsDeleteArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.TaskAutomationSettingsSelect<ExtArgs> | null;
    omit?: Prisma.TaskAutomationSettingsOmit<ExtArgs> | null;
    where: Prisma.TaskAutomationSettingsWhereUniqueInput;
};
export type TaskAutomationSettingsDeleteManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.TaskAutomationSettingsWhereInput;
    limit?: number;
};
export type TaskAutomationSettingsDefaultArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.TaskAutomationSettingsSelect<ExtArgs> | null;
    omit?: Prisma.TaskAutomationSettingsOmit<ExtArgs> | null;
};
export {};
