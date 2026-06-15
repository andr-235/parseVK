import type * as runtime from "@prisma/client/runtime/client";
import type * as Prisma from "../internal/prismaNamespace.js";
export type TaskAuditLogModel = runtime.Types.Result.DefaultSelection<Prisma.$TaskAuditLogPayload>;
export type AggregateTaskAuditLog = {
    _count: TaskAuditLogCountAggregateOutputType | null;
    _avg: TaskAuditLogAvgAggregateOutputType | null;
    _sum: TaskAuditLogSumAggregateOutputType | null;
    _min: TaskAuditLogMinAggregateOutputType | null;
    _max: TaskAuditLogMaxAggregateOutputType | null;
};
export type TaskAuditLogAvgAggregateOutputType = {
    id: number | null;
    taskId: number | null;
};
export type TaskAuditLogSumAggregateOutputType = {
    id: number | null;
    taskId: number | null;
};
export type TaskAuditLogMinAggregateOutputType = {
    id: number | null;
    taskId: number | null;
    eventType: string | null;
    createdAt: Date | null;
};
export type TaskAuditLogMaxAggregateOutputType = {
    id: number | null;
    taskId: number | null;
    eventType: string | null;
    createdAt: Date | null;
};
export type TaskAuditLogCountAggregateOutputType = {
    id: number;
    taskId: number;
    eventType: number;
    eventData: number;
    createdAt: number;
    _all: number;
};
export type TaskAuditLogAvgAggregateInputType = {
    id?: true;
    taskId?: true;
};
export type TaskAuditLogSumAggregateInputType = {
    id?: true;
    taskId?: true;
};
export type TaskAuditLogMinAggregateInputType = {
    id?: true;
    taskId?: true;
    eventType?: true;
    createdAt?: true;
};
export type TaskAuditLogMaxAggregateInputType = {
    id?: true;
    taskId?: true;
    eventType?: true;
    createdAt?: true;
};
export type TaskAuditLogCountAggregateInputType = {
    id?: true;
    taskId?: true;
    eventType?: true;
    eventData?: true;
    createdAt?: true;
    _all?: true;
};
export type TaskAuditLogAggregateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.TaskAuditLogWhereInput;
    orderBy?: Prisma.TaskAuditLogOrderByWithRelationInput | Prisma.TaskAuditLogOrderByWithRelationInput[];
    cursor?: Prisma.TaskAuditLogWhereUniqueInput;
    take?: number;
    skip?: number;
    _count?: true | TaskAuditLogCountAggregateInputType;
    _avg?: TaskAuditLogAvgAggregateInputType;
    _sum?: TaskAuditLogSumAggregateInputType;
    _min?: TaskAuditLogMinAggregateInputType;
    _max?: TaskAuditLogMaxAggregateInputType;
};
export type GetTaskAuditLogAggregateType<T extends TaskAuditLogAggregateArgs> = {
    [P in keyof T & keyof AggregateTaskAuditLog]: P extends '_count' | 'count' ? T[P] extends true ? number : Prisma.GetScalarType<T[P], AggregateTaskAuditLog[P]> : Prisma.GetScalarType<T[P], AggregateTaskAuditLog[P]>;
};
export type TaskAuditLogGroupByArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.TaskAuditLogWhereInput;
    orderBy?: Prisma.TaskAuditLogOrderByWithAggregationInput | Prisma.TaskAuditLogOrderByWithAggregationInput[];
    by: Prisma.TaskAuditLogScalarFieldEnum[] | Prisma.TaskAuditLogScalarFieldEnum;
    having?: Prisma.TaskAuditLogScalarWhereWithAggregatesInput;
    take?: number;
    skip?: number;
    _count?: TaskAuditLogCountAggregateInputType | true;
    _avg?: TaskAuditLogAvgAggregateInputType;
    _sum?: TaskAuditLogSumAggregateInputType;
    _min?: TaskAuditLogMinAggregateInputType;
    _max?: TaskAuditLogMaxAggregateInputType;
};
export type TaskAuditLogGroupByOutputType = {
    id: number;
    taskId: number;
    eventType: string;
    eventData: runtime.JsonValue | null;
    createdAt: Date;
    _count: TaskAuditLogCountAggregateOutputType | null;
    _avg: TaskAuditLogAvgAggregateOutputType | null;
    _sum: TaskAuditLogSumAggregateOutputType | null;
    _min: TaskAuditLogMinAggregateOutputType | null;
    _max: TaskAuditLogMaxAggregateOutputType | null;
};
type GetTaskAuditLogGroupByPayload<T extends TaskAuditLogGroupByArgs> = Prisma.PrismaPromise<Array<Prisma.PickEnumerable<TaskAuditLogGroupByOutputType, T['by']> & {
    [P in ((keyof T) & (keyof TaskAuditLogGroupByOutputType))]: P extends '_count' ? T[P] extends boolean ? number : Prisma.GetScalarType<T[P], TaskAuditLogGroupByOutputType[P]> : Prisma.GetScalarType<T[P], TaskAuditLogGroupByOutputType[P]>;
}>>;
export type TaskAuditLogWhereInput = {
    AND?: Prisma.TaskAuditLogWhereInput | Prisma.TaskAuditLogWhereInput[];
    OR?: Prisma.TaskAuditLogWhereInput[];
    NOT?: Prisma.TaskAuditLogWhereInput | Prisma.TaskAuditLogWhereInput[];
    id?: Prisma.IntFilter<"TaskAuditLog"> | number;
    taskId?: Prisma.IntFilter<"TaskAuditLog"> | number;
    eventType?: Prisma.StringFilter<"TaskAuditLog"> | string;
    eventData?: Prisma.JsonNullableFilter<"TaskAuditLog">;
    createdAt?: Prisma.DateTimeFilter<"TaskAuditLog"> | Date | string;
    task?: Prisma.XOR<Prisma.TaskScalarRelationFilter, Prisma.TaskWhereInput>;
};
export type TaskAuditLogOrderByWithRelationInput = {
    id?: Prisma.SortOrder;
    taskId?: Prisma.SortOrder;
    eventType?: Prisma.SortOrder;
    eventData?: Prisma.SortOrderInput | Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    task?: Prisma.TaskOrderByWithRelationInput;
};
export type TaskAuditLogWhereUniqueInput = Prisma.AtLeast<{
    id?: number;
    AND?: Prisma.TaskAuditLogWhereInput | Prisma.TaskAuditLogWhereInput[];
    OR?: Prisma.TaskAuditLogWhereInput[];
    NOT?: Prisma.TaskAuditLogWhereInput | Prisma.TaskAuditLogWhereInput[];
    taskId?: Prisma.IntFilter<"TaskAuditLog"> | number;
    eventType?: Prisma.StringFilter<"TaskAuditLog"> | string;
    eventData?: Prisma.JsonNullableFilter<"TaskAuditLog">;
    createdAt?: Prisma.DateTimeFilter<"TaskAuditLog"> | Date | string;
    task?: Prisma.XOR<Prisma.TaskScalarRelationFilter, Prisma.TaskWhereInput>;
}, "id">;
export type TaskAuditLogOrderByWithAggregationInput = {
    id?: Prisma.SortOrder;
    taskId?: Prisma.SortOrder;
    eventType?: Prisma.SortOrder;
    eventData?: Prisma.SortOrderInput | Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    _count?: Prisma.TaskAuditLogCountOrderByAggregateInput;
    _avg?: Prisma.TaskAuditLogAvgOrderByAggregateInput;
    _max?: Prisma.TaskAuditLogMaxOrderByAggregateInput;
    _min?: Prisma.TaskAuditLogMinOrderByAggregateInput;
    _sum?: Prisma.TaskAuditLogSumOrderByAggregateInput;
};
export type TaskAuditLogScalarWhereWithAggregatesInput = {
    AND?: Prisma.TaskAuditLogScalarWhereWithAggregatesInput | Prisma.TaskAuditLogScalarWhereWithAggregatesInput[];
    OR?: Prisma.TaskAuditLogScalarWhereWithAggregatesInput[];
    NOT?: Prisma.TaskAuditLogScalarWhereWithAggregatesInput | Prisma.TaskAuditLogScalarWhereWithAggregatesInput[];
    id?: Prisma.IntWithAggregatesFilter<"TaskAuditLog"> | number;
    taskId?: Prisma.IntWithAggregatesFilter<"TaskAuditLog"> | number;
    eventType?: Prisma.StringWithAggregatesFilter<"TaskAuditLog"> | string;
    eventData?: Prisma.JsonNullableWithAggregatesFilter<"TaskAuditLog">;
    createdAt?: Prisma.DateTimeWithAggregatesFilter<"TaskAuditLog"> | Date | string;
};
export type TaskAuditLogCreateInput = {
    eventType: string;
    eventData?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    createdAt?: Date | string;
    task: Prisma.TaskCreateNestedOneWithoutAuditLogsInput;
};
export type TaskAuditLogUncheckedCreateInput = {
    id?: number;
    taskId: number;
    eventType: string;
    eventData?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    createdAt?: Date | string;
};
export type TaskAuditLogUpdateInput = {
    eventType?: Prisma.StringFieldUpdateOperationsInput | string;
    eventData?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    task?: Prisma.TaskUpdateOneRequiredWithoutAuditLogsNestedInput;
};
export type TaskAuditLogUncheckedUpdateInput = {
    id?: Prisma.IntFieldUpdateOperationsInput | number;
    taskId?: Prisma.IntFieldUpdateOperationsInput | number;
    eventType?: Prisma.StringFieldUpdateOperationsInput | string;
    eventData?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type TaskAuditLogCreateManyInput = {
    id?: number;
    taskId: number;
    eventType: string;
    eventData?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    createdAt?: Date | string;
};
export type TaskAuditLogUpdateManyMutationInput = {
    eventType?: Prisma.StringFieldUpdateOperationsInput | string;
    eventData?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type TaskAuditLogUncheckedUpdateManyInput = {
    id?: Prisma.IntFieldUpdateOperationsInput | number;
    taskId?: Prisma.IntFieldUpdateOperationsInput | number;
    eventType?: Prisma.StringFieldUpdateOperationsInput | string;
    eventData?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type TaskAuditLogListRelationFilter = {
    every?: Prisma.TaskAuditLogWhereInput;
    some?: Prisma.TaskAuditLogWhereInput;
    none?: Prisma.TaskAuditLogWhereInput;
};
export type TaskAuditLogOrderByRelationAggregateInput = {
    _count?: Prisma.SortOrder;
};
export type TaskAuditLogCountOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    taskId?: Prisma.SortOrder;
    eventType?: Prisma.SortOrder;
    eventData?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
};
export type TaskAuditLogAvgOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    taskId?: Prisma.SortOrder;
};
export type TaskAuditLogMaxOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    taskId?: Prisma.SortOrder;
    eventType?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
};
export type TaskAuditLogMinOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    taskId?: Prisma.SortOrder;
    eventType?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
};
export type TaskAuditLogSumOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    taskId?: Prisma.SortOrder;
};
export type TaskAuditLogCreateNestedManyWithoutTaskInput = {
    create?: Prisma.XOR<Prisma.TaskAuditLogCreateWithoutTaskInput, Prisma.TaskAuditLogUncheckedCreateWithoutTaskInput> | Prisma.TaskAuditLogCreateWithoutTaskInput[] | Prisma.TaskAuditLogUncheckedCreateWithoutTaskInput[];
    connectOrCreate?: Prisma.TaskAuditLogCreateOrConnectWithoutTaskInput | Prisma.TaskAuditLogCreateOrConnectWithoutTaskInput[];
    createMany?: Prisma.TaskAuditLogCreateManyTaskInputEnvelope;
    connect?: Prisma.TaskAuditLogWhereUniqueInput | Prisma.TaskAuditLogWhereUniqueInput[];
};
export type TaskAuditLogUncheckedCreateNestedManyWithoutTaskInput = {
    create?: Prisma.XOR<Prisma.TaskAuditLogCreateWithoutTaskInput, Prisma.TaskAuditLogUncheckedCreateWithoutTaskInput> | Prisma.TaskAuditLogCreateWithoutTaskInput[] | Prisma.TaskAuditLogUncheckedCreateWithoutTaskInput[];
    connectOrCreate?: Prisma.TaskAuditLogCreateOrConnectWithoutTaskInput | Prisma.TaskAuditLogCreateOrConnectWithoutTaskInput[];
    createMany?: Prisma.TaskAuditLogCreateManyTaskInputEnvelope;
    connect?: Prisma.TaskAuditLogWhereUniqueInput | Prisma.TaskAuditLogWhereUniqueInput[];
};
export type TaskAuditLogUpdateManyWithoutTaskNestedInput = {
    create?: Prisma.XOR<Prisma.TaskAuditLogCreateWithoutTaskInput, Prisma.TaskAuditLogUncheckedCreateWithoutTaskInput> | Prisma.TaskAuditLogCreateWithoutTaskInput[] | Prisma.TaskAuditLogUncheckedCreateWithoutTaskInput[];
    connectOrCreate?: Prisma.TaskAuditLogCreateOrConnectWithoutTaskInput | Prisma.TaskAuditLogCreateOrConnectWithoutTaskInput[];
    upsert?: Prisma.TaskAuditLogUpsertWithWhereUniqueWithoutTaskInput | Prisma.TaskAuditLogUpsertWithWhereUniqueWithoutTaskInput[];
    createMany?: Prisma.TaskAuditLogCreateManyTaskInputEnvelope;
    set?: Prisma.TaskAuditLogWhereUniqueInput | Prisma.TaskAuditLogWhereUniqueInput[];
    disconnect?: Prisma.TaskAuditLogWhereUniqueInput | Prisma.TaskAuditLogWhereUniqueInput[];
    delete?: Prisma.TaskAuditLogWhereUniqueInput | Prisma.TaskAuditLogWhereUniqueInput[];
    connect?: Prisma.TaskAuditLogWhereUniqueInput | Prisma.TaskAuditLogWhereUniqueInput[];
    update?: Prisma.TaskAuditLogUpdateWithWhereUniqueWithoutTaskInput | Prisma.TaskAuditLogUpdateWithWhereUniqueWithoutTaskInput[];
    updateMany?: Prisma.TaskAuditLogUpdateManyWithWhereWithoutTaskInput | Prisma.TaskAuditLogUpdateManyWithWhereWithoutTaskInput[];
    deleteMany?: Prisma.TaskAuditLogScalarWhereInput | Prisma.TaskAuditLogScalarWhereInput[];
};
export type TaskAuditLogUncheckedUpdateManyWithoutTaskNestedInput = {
    create?: Prisma.XOR<Prisma.TaskAuditLogCreateWithoutTaskInput, Prisma.TaskAuditLogUncheckedCreateWithoutTaskInput> | Prisma.TaskAuditLogCreateWithoutTaskInput[] | Prisma.TaskAuditLogUncheckedCreateWithoutTaskInput[];
    connectOrCreate?: Prisma.TaskAuditLogCreateOrConnectWithoutTaskInput | Prisma.TaskAuditLogCreateOrConnectWithoutTaskInput[];
    upsert?: Prisma.TaskAuditLogUpsertWithWhereUniqueWithoutTaskInput | Prisma.TaskAuditLogUpsertWithWhereUniqueWithoutTaskInput[];
    createMany?: Prisma.TaskAuditLogCreateManyTaskInputEnvelope;
    set?: Prisma.TaskAuditLogWhereUniqueInput | Prisma.TaskAuditLogWhereUniqueInput[];
    disconnect?: Prisma.TaskAuditLogWhereUniqueInput | Prisma.TaskAuditLogWhereUniqueInput[];
    delete?: Prisma.TaskAuditLogWhereUniqueInput | Prisma.TaskAuditLogWhereUniqueInput[];
    connect?: Prisma.TaskAuditLogWhereUniqueInput | Prisma.TaskAuditLogWhereUniqueInput[];
    update?: Prisma.TaskAuditLogUpdateWithWhereUniqueWithoutTaskInput | Prisma.TaskAuditLogUpdateWithWhereUniqueWithoutTaskInput[];
    updateMany?: Prisma.TaskAuditLogUpdateManyWithWhereWithoutTaskInput | Prisma.TaskAuditLogUpdateManyWithWhereWithoutTaskInput[];
    deleteMany?: Prisma.TaskAuditLogScalarWhereInput | Prisma.TaskAuditLogScalarWhereInput[];
};
export type TaskAuditLogCreateWithoutTaskInput = {
    eventType: string;
    eventData?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    createdAt?: Date | string;
};
export type TaskAuditLogUncheckedCreateWithoutTaskInput = {
    id?: number;
    eventType: string;
    eventData?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    createdAt?: Date | string;
};
export type TaskAuditLogCreateOrConnectWithoutTaskInput = {
    where: Prisma.TaskAuditLogWhereUniqueInput;
    create: Prisma.XOR<Prisma.TaskAuditLogCreateWithoutTaskInput, Prisma.TaskAuditLogUncheckedCreateWithoutTaskInput>;
};
export type TaskAuditLogCreateManyTaskInputEnvelope = {
    data: Prisma.TaskAuditLogCreateManyTaskInput | Prisma.TaskAuditLogCreateManyTaskInput[];
    skipDuplicates?: boolean;
};
export type TaskAuditLogUpsertWithWhereUniqueWithoutTaskInput = {
    where: Prisma.TaskAuditLogWhereUniqueInput;
    update: Prisma.XOR<Prisma.TaskAuditLogUpdateWithoutTaskInput, Prisma.TaskAuditLogUncheckedUpdateWithoutTaskInput>;
    create: Prisma.XOR<Prisma.TaskAuditLogCreateWithoutTaskInput, Prisma.TaskAuditLogUncheckedCreateWithoutTaskInput>;
};
export type TaskAuditLogUpdateWithWhereUniqueWithoutTaskInput = {
    where: Prisma.TaskAuditLogWhereUniqueInput;
    data: Prisma.XOR<Prisma.TaskAuditLogUpdateWithoutTaskInput, Prisma.TaskAuditLogUncheckedUpdateWithoutTaskInput>;
};
export type TaskAuditLogUpdateManyWithWhereWithoutTaskInput = {
    where: Prisma.TaskAuditLogScalarWhereInput;
    data: Prisma.XOR<Prisma.TaskAuditLogUpdateManyMutationInput, Prisma.TaskAuditLogUncheckedUpdateManyWithoutTaskInput>;
};
export type TaskAuditLogScalarWhereInput = {
    AND?: Prisma.TaskAuditLogScalarWhereInput | Prisma.TaskAuditLogScalarWhereInput[];
    OR?: Prisma.TaskAuditLogScalarWhereInput[];
    NOT?: Prisma.TaskAuditLogScalarWhereInput | Prisma.TaskAuditLogScalarWhereInput[];
    id?: Prisma.IntFilter<"TaskAuditLog"> | number;
    taskId?: Prisma.IntFilter<"TaskAuditLog"> | number;
    eventType?: Prisma.StringFilter<"TaskAuditLog"> | string;
    eventData?: Prisma.JsonNullableFilter<"TaskAuditLog">;
    createdAt?: Prisma.DateTimeFilter<"TaskAuditLog"> | Date | string;
};
export type TaskAuditLogCreateManyTaskInput = {
    id?: number;
    eventType: string;
    eventData?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    createdAt?: Date | string;
};
export type TaskAuditLogUpdateWithoutTaskInput = {
    eventType?: Prisma.StringFieldUpdateOperationsInput | string;
    eventData?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type TaskAuditLogUncheckedUpdateWithoutTaskInput = {
    id?: Prisma.IntFieldUpdateOperationsInput | number;
    eventType?: Prisma.StringFieldUpdateOperationsInput | string;
    eventData?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type TaskAuditLogUncheckedUpdateManyWithoutTaskInput = {
    id?: Prisma.IntFieldUpdateOperationsInput | number;
    eventType?: Prisma.StringFieldUpdateOperationsInput | string;
    eventData?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type TaskAuditLogSelect<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    taskId?: boolean;
    eventType?: boolean;
    eventData?: boolean;
    createdAt?: boolean;
    task?: boolean | Prisma.TaskDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["taskAuditLog"]>;
export type TaskAuditLogSelectCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    taskId?: boolean;
    eventType?: boolean;
    eventData?: boolean;
    createdAt?: boolean;
    task?: boolean | Prisma.TaskDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["taskAuditLog"]>;
export type TaskAuditLogSelectUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    taskId?: boolean;
    eventType?: boolean;
    eventData?: boolean;
    createdAt?: boolean;
    task?: boolean | Prisma.TaskDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["taskAuditLog"]>;
export type TaskAuditLogSelectScalar = {
    id?: boolean;
    taskId?: boolean;
    eventType?: boolean;
    eventData?: boolean;
    createdAt?: boolean;
};
export type TaskAuditLogOmit<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetOmit<"id" | "taskId" | "eventType" | "eventData" | "createdAt", ExtArgs["result"]["taskAuditLog"]>;
export type TaskAuditLogInclude<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    task?: boolean | Prisma.TaskDefaultArgs<ExtArgs>;
};
export type TaskAuditLogIncludeCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    task?: boolean | Prisma.TaskDefaultArgs<ExtArgs>;
};
export type TaskAuditLogIncludeUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    task?: boolean | Prisma.TaskDefaultArgs<ExtArgs>;
};
export type $TaskAuditLogPayload<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    name: "TaskAuditLog";
    objects: {
        task: Prisma.$TaskPayload<ExtArgs>;
    };
    scalars: runtime.Types.Extensions.GetPayloadResult<{
        id: number;
        taskId: number;
        eventType: string;
        eventData: runtime.JsonValue | null;
        createdAt: Date;
    }, ExtArgs["result"]["taskAuditLog"]>;
    composites: {};
};
export type TaskAuditLogGetPayload<S extends boolean | null | undefined | TaskAuditLogDefaultArgs> = runtime.Types.Result.GetResult<Prisma.$TaskAuditLogPayload, S>;
export type TaskAuditLogCountArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = Omit<TaskAuditLogFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
    select?: TaskAuditLogCountAggregateInputType | true;
};
export interface TaskAuditLogDelegate<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: {
        types: Prisma.TypeMap<ExtArgs>['model']['TaskAuditLog'];
        meta: {
            name: 'TaskAuditLog';
        };
    };
    findUnique<T extends TaskAuditLogFindUniqueArgs>(args: Prisma.SelectSubset<T, TaskAuditLogFindUniqueArgs<ExtArgs>>): Prisma.Prisma__TaskAuditLogClient<runtime.Types.Result.GetResult<Prisma.$TaskAuditLogPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    findUniqueOrThrow<T extends TaskAuditLogFindUniqueOrThrowArgs>(args: Prisma.SelectSubset<T, TaskAuditLogFindUniqueOrThrowArgs<ExtArgs>>): Prisma.Prisma__TaskAuditLogClient<runtime.Types.Result.GetResult<Prisma.$TaskAuditLogPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    findFirst<T extends TaskAuditLogFindFirstArgs>(args?: Prisma.SelectSubset<T, TaskAuditLogFindFirstArgs<ExtArgs>>): Prisma.Prisma__TaskAuditLogClient<runtime.Types.Result.GetResult<Prisma.$TaskAuditLogPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    findFirstOrThrow<T extends TaskAuditLogFindFirstOrThrowArgs>(args?: Prisma.SelectSubset<T, TaskAuditLogFindFirstOrThrowArgs<ExtArgs>>): Prisma.Prisma__TaskAuditLogClient<runtime.Types.Result.GetResult<Prisma.$TaskAuditLogPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    findMany<T extends TaskAuditLogFindManyArgs>(args?: Prisma.SelectSubset<T, TaskAuditLogFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$TaskAuditLogPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>;
    create<T extends TaskAuditLogCreateArgs>(args: Prisma.SelectSubset<T, TaskAuditLogCreateArgs<ExtArgs>>): Prisma.Prisma__TaskAuditLogClient<runtime.Types.Result.GetResult<Prisma.$TaskAuditLogPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    createMany<T extends TaskAuditLogCreateManyArgs>(args?: Prisma.SelectSubset<T, TaskAuditLogCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    createManyAndReturn<T extends TaskAuditLogCreateManyAndReturnArgs>(args?: Prisma.SelectSubset<T, TaskAuditLogCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$TaskAuditLogPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>;
    delete<T extends TaskAuditLogDeleteArgs>(args: Prisma.SelectSubset<T, TaskAuditLogDeleteArgs<ExtArgs>>): Prisma.Prisma__TaskAuditLogClient<runtime.Types.Result.GetResult<Prisma.$TaskAuditLogPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    update<T extends TaskAuditLogUpdateArgs>(args: Prisma.SelectSubset<T, TaskAuditLogUpdateArgs<ExtArgs>>): Prisma.Prisma__TaskAuditLogClient<runtime.Types.Result.GetResult<Prisma.$TaskAuditLogPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    deleteMany<T extends TaskAuditLogDeleteManyArgs>(args?: Prisma.SelectSubset<T, TaskAuditLogDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    updateMany<T extends TaskAuditLogUpdateManyArgs>(args: Prisma.SelectSubset<T, TaskAuditLogUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    updateManyAndReturn<T extends TaskAuditLogUpdateManyAndReturnArgs>(args: Prisma.SelectSubset<T, TaskAuditLogUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$TaskAuditLogPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>;
    upsert<T extends TaskAuditLogUpsertArgs>(args: Prisma.SelectSubset<T, TaskAuditLogUpsertArgs<ExtArgs>>): Prisma.Prisma__TaskAuditLogClient<runtime.Types.Result.GetResult<Prisma.$TaskAuditLogPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    count<T extends TaskAuditLogCountArgs>(args?: Prisma.Subset<T, TaskAuditLogCountArgs>): Prisma.PrismaPromise<T extends runtime.Types.Utils.Record<'select', any> ? T['select'] extends true ? number : Prisma.GetScalarType<T['select'], TaskAuditLogCountAggregateOutputType> : number>;
    aggregate<T extends TaskAuditLogAggregateArgs>(args: Prisma.Subset<T, TaskAuditLogAggregateArgs>): Prisma.PrismaPromise<GetTaskAuditLogAggregateType<T>>;
    groupBy<T extends TaskAuditLogGroupByArgs, HasSelectOrTake extends Prisma.Or<Prisma.Extends<'skip', Prisma.Keys<T>>, Prisma.Extends<'take', Prisma.Keys<T>>>, OrderByArg extends Prisma.True extends HasSelectOrTake ? {
        orderBy: TaskAuditLogGroupByArgs['orderBy'];
    } : {
        orderBy?: TaskAuditLogGroupByArgs['orderBy'];
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
    }[OrderFields]>(args: Prisma.SubsetIntersection<T, TaskAuditLogGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetTaskAuditLogGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>;
    readonly fields: TaskAuditLogFieldRefs;
}
export interface Prisma__TaskAuditLogClient<T, Null = never, ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise";
    task<T extends Prisma.TaskDefaultArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.TaskDefaultArgs<ExtArgs>>): Prisma.Prisma__TaskClient<runtime.Types.Result.GetResult<Prisma.$TaskPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>;
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): runtime.Types.Utils.JsPromise<TResult1 | TResult2>;
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): runtime.Types.Utils.JsPromise<T | TResult>;
    finally(onfinally?: (() => void) | undefined | null): runtime.Types.Utils.JsPromise<T>;
}
export interface TaskAuditLogFieldRefs {
    readonly id: Prisma.FieldRef<"TaskAuditLog", 'Int'>;
    readonly taskId: Prisma.FieldRef<"TaskAuditLog", 'Int'>;
    readonly eventType: Prisma.FieldRef<"TaskAuditLog", 'String'>;
    readonly eventData: Prisma.FieldRef<"TaskAuditLog", 'Json'>;
    readonly createdAt: Prisma.FieldRef<"TaskAuditLog", 'DateTime'>;
}
export type TaskAuditLogFindUniqueArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.TaskAuditLogSelect<ExtArgs> | null;
    omit?: Prisma.TaskAuditLogOmit<ExtArgs> | null;
    include?: Prisma.TaskAuditLogInclude<ExtArgs> | null;
    where: Prisma.TaskAuditLogWhereUniqueInput;
};
export type TaskAuditLogFindUniqueOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.TaskAuditLogSelect<ExtArgs> | null;
    omit?: Prisma.TaskAuditLogOmit<ExtArgs> | null;
    include?: Prisma.TaskAuditLogInclude<ExtArgs> | null;
    where: Prisma.TaskAuditLogWhereUniqueInput;
};
export type TaskAuditLogFindFirstArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.TaskAuditLogSelect<ExtArgs> | null;
    omit?: Prisma.TaskAuditLogOmit<ExtArgs> | null;
    include?: Prisma.TaskAuditLogInclude<ExtArgs> | null;
    where?: Prisma.TaskAuditLogWhereInput;
    orderBy?: Prisma.TaskAuditLogOrderByWithRelationInput | Prisma.TaskAuditLogOrderByWithRelationInput[];
    cursor?: Prisma.TaskAuditLogWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.TaskAuditLogScalarFieldEnum | Prisma.TaskAuditLogScalarFieldEnum[];
};
export type TaskAuditLogFindFirstOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.TaskAuditLogSelect<ExtArgs> | null;
    omit?: Prisma.TaskAuditLogOmit<ExtArgs> | null;
    include?: Prisma.TaskAuditLogInclude<ExtArgs> | null;
    where?: Prisma.TaskAuditLogWhereInput;
    orderBy?: Prisma.TaskAuditLogOrderByWithRelationInput | Prisma.TaskAuditLogOrderByWithRelationInput[];
    cursor?: Prisma.TaskAuditLogWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.TaskAuditLogScalarFieldEnum | Prisma.TaskAuditLogScalarFieldEnum[];
};
export type TaskAuditLogFindManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.TaskAuditLogSelect<ExtArgs> | null;
    omit?: Prisma.TaskAuditLogOmit<ExtArgs> | null;
    include?: Prisma.TaskAuditLogInclude<ExtArgs> | null;
    where?: Prisma.TaskAuditLogWhereInput;
    orderBy?: Prisma.TaskAuditLogOrderByWithRelationInput | Prisma.TaskAuditLogOrderByWithRelationInput[];
    cursor?: Prisma.TaskAuditLogWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.TaskAuditLogScalarFieldEnum | Prisma.TaskAuditLogScalarFieldEnum[];
};
export type TaskAuditLogCreateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.TaskAuditLogSelect<ExtArgs> | null;
    omit?: Prisma.TaskAuditLogOmit<ExtArgs> | null;
    include?: Prisma.TaskAuditLogInclude<ExtArgs> | null;
    data: Prisma.XOR<Prisma.TaskAuditLogCreateInput, Prisma.TaskAuditLogUncheckedCreateInput>;
};
export type TaskAuditLogCreateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    data: Prisma.TaskAuditLogCreateManyInput | Prisma.TaskAuditLogCreateManyInput[];
    skipDuplicates?: boolean;
};
export type TaskAuditLogCreateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.TaskAuditLogSelectCreateManyAndReturn<ExtArgs> | null;
    omit?: Prisma.TaskAuditLogOmit<ExtArgs> | null;
    data: Prisma.TaskAuditLogCreateManyInput | Prisma.TaskAuditLogCreateManyInput[];
    skipDuplicates?: boolean;
    include?: Prisma.TaskAuditLogIncludeCreateManyAndReturn<ExtArgs> | null;
};
export type TaskAuditLogUpdateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.TaskAuditLogSelect<ExtArgs> | null;
    omit?: Prisma.TaskAuditLogOmit<ExtArgs> | null;
    include?: Prisma.TaskAuditLogInclude<ExtArgs> | null;
    data: Prisma.XOR<Prisma.TaskAuditLogUpdateInput, Prisma.TaskAuditLogUncheckedUpdateInput>;
    where: Prisma.TaskAuditLogWhereUniqueInput;
};
export type TaskAuditLogUpdateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    data: Prisma.XOR<Prisma.TaskAuditLogUpdateManyMutationInput, Prisma.TaskAuditLogUncheckedUpdateManyInput>;
    where?: Prisma.TaskAuditLogWhereInput;
    limit?: number;
};
export type TaskAuditLogUpdateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.TaskAuditLogSelectUpdateManyAndReturn<ExtArgs> | null;
    omit?: Prisma.TaskAuditLogOmit<ExtArgs> | null;
    data: Prisma.XOR<Prisma.TaskAuditLogUpdateManyMutationInput, Prisma.TaskAuditLogUncheckedUpdateManyInput>;
    where?: Prisma.TaskAuditLogWhereInput;
    limit?: number;
    include?: Prisma.TaskAuditLogIncludeUpdateManyAndReturn<ExtArgs> | null;
};
export type TaskAuditLogUpsertArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.TaskAuditLogSelect<ExtArgs> | null;
    omit?: Prisma.TaskAuditLogOmit<ExtArgs> | null;
    include?: Prisma.TaskAuditLogInclude<ExtArgs> | null;
    where: Prisma.TaskAuditLogWhereUniqueInput;
    create: Prisma.XOR<Prisma.TaskAuditLogCreateInput, Prisma.TaskAuditLogUncheckedCreateInput>;
    update: Prisma.XOR<Prisma.TaskAuditLogUpdateInput, Prisma.TaskAuditLogUncheckedUpdateInput>;
};
export type TaskAuditLogDeleteArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.TaskAuditLogSelect<ExtArgs> | null;
    omit?: Prisma.TaskAuditLogOmit<ExtArgs> | null;
    include?: Prisma.TaskAuditLogInclude<ExtArgs> | null;
    where: Prisma.TaskAuditLogWhereUniqueInput;
};
export type TaskAuditLogDeleteManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.TaskAuditLogWhereInput;
    limit?: number;
};
export type TaskAuditLogDefaultArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.TaskAuditLogSelect<ExtArgs> | null;
    omit?: Prisma.TaskAuditLogOmit<ExtArgs> | null;
    include?: Prisma.TaskAuditLogInclude<ExtArgs> | null;
};
export {};
