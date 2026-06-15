import type * as runtime from "@prisma/client/runtime/client";
import type * as $Enums from "../enums.js";
import type * as Prisma from "../internal/prismaNamespace.js";
export type JobLogModel = runtime.Types.Result.DefaultSelection<Prisma.$JobLogPayload>;
export type AggregateJobLog = {
    _count: JobLogCountAggregateOutputType | null;
    _min: JobLogMinAggregateOutputType | null;
    _max: JobLogMaxAggregateOutputType | null;
};
export type JobLogMinAggregateOutputType = {
    id: string | null;
    jobId: string | null;
    level: $Enums.JobLogLevel | null;
    message: string | null;
    createdAt: Date | null;
};
export type JobLogMaxAggregateOutputType = {
    id: string | null;
    jobId: string | null;
    level: $Enums.JobLogLevel | null;
    message: string | null;
    createdAt: Date | null;
};
export type JobLogCountAggregateOutputType = {
    id: number;
    jobId: number;
    level: number;
    message: number;
    meta: number;
    createdAt: number;
    _all: number;
};
export type JobLogMinAggregateInputType = {
    id?: true;
    jobId?: true;
    level?: true;
    message?: true;
    createdAt?: true;
};
export type JobLogMaxAggregateInputType = {
    id?: true;
    jobId?: true;
    level?: true;
    message?: true;
    createdAt?: true;
};
export type JobLogCountAggregateInputType = {
    id?: true;
    jobId?: true;
    level?: true;
    message?: true;
    meta?: true;
    createdAt?: true;
    _all?: true;
};
export type JobLogAggregateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.JobLogWhereInput;
    orderBy?: Prisma.JobLogOrderByWithRelationInput | Prisma.JobLogOrderByWithRelationInput[];
    cursor?: Prisma.JobLogWhereUniqueInput;
    take?: number;
    skip?: number;
    _count?: true | JobLogCountAggregateInputType;
    _min?: JobLogMinAggregateInputType;
    _max?: JobLogMaxAggregateInputType;
};
export type GetJobLogAggregateType<T extends JobLogAggregateArgs> = {
    [P in keyof T & keyof AggregateJobLog]: P extends '_count' | 'count' ? T[P] extends true ? number : Prisma.GetScalarType<T[P], AggregateJobLog[P]> : Prisma.GetScalarType<T[P], AggregateJobLog[P]>;
};
export type JobLogGroupByArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.JobLogWhereInput;
    orderBy?: Prisma.JobLogOrderByWithAggregationInput | Prisma.JobLogOrderByWithAggregationInput[];
    by: Prisma.JobLogScalarFieldEnum[] | Prisma.JobLogScalarFieldEnum;
    having?: Prisma.JobLogScalarWhereWithAggregatesInput;
    take?: number;
    skip?: number;
    _count?: JobLogCountAggregateInputType | true;
    _min?: JobLogMinAggregateInputType;
    _max?: JobLogMaxAggregateInputType;
};
export type JobLogGroupByOutputType = {
    id: string;
    jobId: string;
    level: $Enums.JobLogLevel;
    message: string;
    meta: runtime.JsonValue | null;
    createdAt: Date;
    _count: JobLogCountAggregateOutputType | null;
    _min: JobLogMinAggregateOutputType | null;
    _max: JobLogMaxAggregateOutputType | null;
};
type GetJobLogGroupByPayload<T extends JobLogGroupByArgs> = Prisma.PrismaPromise<Array<Prisma.PickEnumerable<JobLogGroupByOutputType, T['by']> & {
    [P in ((keyof T) & (keyof JobLogGroupByOutputType))]: P extends '_count' ? T[P] extends boolean ? number : Prisma.GetScalarType<T[P], JobLogGroupByOutputType[P]> : Prisma.GetScalarType<T[P], JobLogGroupByOutputType[P]>;
}>>;
export type JobLogWhereInput = {
    AND?: Prisma.JobLogWhereInput | Prisma.JobLogWhereInput[];
    OR?: Prisma.JobLogWhereInput[];
    NOT?: Prisma.JobLogWhereInput | Prisma.JobLogWhereInput[];
    id?: Prisma.UuidFilter<"JobLog"> | string;
    jobId?: Prisma.UuidFilter<"JobLog"> | string;
    level?: Prisma.EnumJobLogLevelFilter<"JobLog"> | $Enums.JobLogLevel;
    message?: Prisma.StringFilter<"JobLog"> | string;
    meta?: Prisma.JsonNullableFilter<"JobLog">;
    createdAt?: Prisma.DateTimeFilter<"JobLog"> | Date | string;
    job?: Prisma.XOR<Prisma.ExportJobScalarRelationFilter, Prisma.ExportJobWhereInput>;
};
export type JobLogOrderByWithRelationInput = {
    id?: Prisma.SortOrder;
    jobId?: Prisma.SortOrder;
    level?: Prisma.SortOrder;
    message?: Prisma.SortOrder;
    meta?: Prisma.SortOrderInput | Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    job?: Prisma.ExportJobOrderByWithRelationInput;
};
export type JobLogWhereUniqueInput = Prisma.AtLeast<{
    id?: string;
    AND?: Prisma.JobLogWhereInput | Prisma.JobLogWhereInput[];
    OR?: Prisma.JobLogWhereInput[];
    NOT?: Prisma.JobLogWhereInput | Prisma.JobLogWhereInput[];
    jobId?: Prisma.UuidFilter<"JobLog"> | string;
    level?: Prisma.EnumJobLogLevelFilter<"JobLog"> | $Enums.JobLogLevel;
    message?: Prisma.StringFilter<"JobLog"> | string;
    meta?: Prisma.JsonNullableFilter<"JobLog">;
    createdAt?: Prisma.DateTimeFilter<"JobLog"> | Date | string;
    job?: Prisma.XOR<Prisma.ExportJobScalarRelationFilter, Prisma.ExportJobWhereInput>;
}, "id">;
export type JobLogOrderByWithAggregationInput = {
    id?: Prisma.SortOrder;
    jobId?: Prisma.SortOrder;
    level?: Prisma.SortOrder;
    message?: Prisma.SortOrder;
    meta?: Prisma.SortOrderInput | Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    _count?: Prisma.JobLogCountOrderByAggregateInput;
    _max?: Prisma.JobLogMaxOrderByAggregateInput;
    _min?: Prisma.JobLogMinOrderByAggregateInput;
};
export type JobLogScalarWhereWithAggregatesInput = {
    AND?: Prisma.JobLogScalarWhereWithAggregatesInput | Prisma.JobLogScalarWhereWithAggregatesInput[];
    OR?: Prisma.JobLogScalarWhereWithAggregatesInput[];
    NOT?: Prisma.JobLogScalarWhereWithAggregatesInput | Prisma.JobLogScalarWhereWithAggregatesInput[];
    id?: Prisma.UuidWithAggregatesFilter<"JobLog"> | string;
    jobId?: Prisma.UuidWithAggregatesFilter<"JobLog"> | string;
    level?: Prisma.EnumJobLogLevelWithAggregatesFilter<"JobLog"> | $Enums.JobLogLevel;
    message?: Prisma.StringWithAggregatesFilter<"JobLog"> | string;
    meta?: Prisma.JsonNullableWithAggregatesFilter<"JobLog">;
    createdAt?: Prisma.DateTimeWithAggregatesFilter<"JobLog"> | Date | string;
};
export type JobLogCreateInput = {
    id?: string;
    level: $Enums.JobLogLevel;
    message: string;
    meta?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    createdAt?: Date | string;
    job: Prisma.ExportJobCreateNestedOneWithoutLogsInput;
};
export type JobLogUncheckedCreateInput = {
    id?: string;
    jobId: string;
    level: $Enums.JobLogLevel;
    message: string;
    meta?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    createdAt?: Date | string;
};
export type JobLogUpdateInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    level?: Prisma.EnumJobLogLevelFieldUpdateOperationsInput | $Enums.JobLogLevel;
    message?: Prisma.StringFieldUpdateOperationsInput | string;
    meta?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    job?: Prisma.ExportJobUpdateOneRequiredWithoutLogsNestedInput;
};
export type JobLogUncheckedUpdateInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    jobId?: Prisma.StringFieldUpdateOperationsInput | string;
    level?: Prisma.EnumJobLogLevelFieldUpdateOperationsInput | $Enums.JobLogLevel;
    message?: Prisma.StringFieldUpdateOperationsInput | string;
    meta?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type JobLogCreateManyInput = {
    id?: string;
    jobId: string;
    level: $Enums.JobLogLevel;
    message: string;
    meta?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    createdAt?: Date | string;
};
export type JobLogUpdateManyMutationInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    level?: Prisma.EnumJobLogLevelFieldUpdateOperationsInput | $Enums.JobLogLevel;
    message?: Prisma.StringFieldUpdateOperationsInput | string;
    meta?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type JobLogUncheckedUpdateManyInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    jobId?: Prisma.StringFieldUpdateOperationsInput | string;
    level?: Prisma.EnumJobLogLevelFieldUpdateOperationsInput | $Enums.JobLogLevel;
    message?: Prisma.StringFieldUpdateOperationsInput | string;
    meta?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type JobLogListRelationFilter = {
    every?: Prisma.JobLogWhereInput;
    some?: Prisma.JobLogWhereInput;
    none?: Prisma.JobLogWhereInput;
};
export type JobLogOrderByRelationAggregateInput = {
    _count?: Prisma.SortOrder;
};
export type JobLogCountOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    jobId?: Prisma.SortOrder;
    level?: Prisma.SortOrder;
    message?: Prisma.SortOrder;
    meta?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
};
export type JobLogMaxOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    jobId?: Prisma.SortOrder;
    level?: Prisma.SortOrder;
    message?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
};
export type JobLogMinOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    jobId?: Prisma.SortOrder;
    level?: Prisma.SortOrder;
    message?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
};
export type JobLogCreateNestedManyWithoutJobInput = {
    create?: Prisma.XOR<Prisma.JobLogCreateWithoutJobInput, Prisma.JobLogUncheckedCreateWithoutJobInput> | Prisma.JobLogCreateWithoutJobInput[] | Prisma.JobLogUncheckedCreateWithoutJobInput[];
    connectOrCreate?: Prisma.JobLogCreateOrConnectWithoutJobInput | Prisma.JobLogCreateOrConnectWithoutJobInput[];
    createMany?: Prisma.JobLogCreateManyJobInputEnvelope;
    connect?: Prisma.JobLogWhereUniqueInput | Prisma.JobLogWhereUniqueInput[];
};
export type JobLogUncheckedCreateNestedManyWithoutJobInput = {
    create?: Prisma.XOR<Prisma.JobLogCreateWithoutJobInput, Prisma.JobLogUncheckedCreateWithoutJobInput> | Prisma.JobLogCreateWithoutJobInput[] | Prisma.JobLogUncheckedCreateWithoutJobInput[];
    connectOrCreate?: Prisma.JobLogCreateOrConnectWithoutJobInput | Prisma.JobLogCreateOrConnectWithoutJobInput[];
    createMany?: Prisma.JobLogCreateManyJobInputEnvelope;
    connect?: Prisma.JobLogWhereUniqueInput | Prisma.JobLogWhereUniqueInput[];
};
export type JobLogUpdateManyWithoutJobNestedInput = {
    create?: Prisma.XOR<Prisma.JobLogCreateWithoutJobInput, Prisma.JobLogUncheckedCreateWithoutJobInput> | Prisma.JobLogCreateWithoutJobInput[] | Prisma.JobLogUncheckedCreateWithoutJobInput[];
    connectOrCreate?: Prisma.JobLogCreateOrConnectWithoutJobInput | Prisma.JobLogCreateOrConnectWithoutJobInput[];
    upsert?: Prisma.JobLogUpsertWithWhereUniqueWithoutJobInput | Prisma.JobLogUpsertWithWhereUniqueWithoutJobInput[];
    createMany?: Prisma.JobLogCreateManyJobInputEnvelope;
    set?: Prisma.JobLogWhereUniqueInput | Prisma.JobLogWhereUniqueInput[];
    disconnect?: Prisma.JobLogWhereUniqueInput | Prisma.JobLogWhereUniqueInput[];
    delete?: Prisma.JobLogWhereUniqueInput | Prisma.JobLogWhereUniqueInput[];
    connect?: Prisma.JobLogWhereUniqueInput | Prisma.JobLogWhereUniqueInput[];
    update?: Prisma.JobLogUpdateWithWhereUniqueWithoutJobInput | Prisma.JobLogUpdateWithWhereUniqueWithoutJobInput[];
    updateMany?: Prisma.JobLogUpdateManyWithWhereWithoutJobInput | Prisma.JobLogUpdateManyWithWhereWithoutJobInput[];
    deleteMany?: Prisma.JobLogScalarWhereInput | Prisma.JobLogScalarWhereInput[];
};
export type JobLogUncheckedUpdateManyWithoutJobNestedInput = {
    create?: Prisma.XOR<Prisma.JobLogCreateWithoutJobInput, Prisma.JobLogUncheckedCreateWithoutJobInput> | Prisma.JobLogCreateWithoutJobInput[] | Prisma.JobLogUncheckedCreateWithoutJobInput[];
    connectOrCreate?: Prisma.JobLogCreateOrConnectWithoutJobInput | Prisma.JobLogCreateOrConnectWithoutJobInput[];
    upsert?: Prisma.JobLogUpsertWithWhereUniqueWithoutJobInput | Prisma.JobLogUpsertWithWhereUniqueWithoutJobInput[];
    createMany?: Prisma.JobLogCreateManyJobInputEnvelope;
    set?: Prisma.JobLogWhereUniqueInput | Prisma.JobLogWhereUniqueInput[];
    disconnect?: Prisma.JobLogWhereUniqueInput | Prisma.JobLogWhereUniqueInput[];
    delete?: Prisma.JobLogWhereUniqueInput | Prisma.JobLogWhereUniqueInput[];
    connect?: Prisma.JobLogWhereUniqueInput | Prisma.JobLogWhereUniqueInput[];
    update?: Prisma.JobLogUpdateWithWhereUniqueWithoutJobInput | Prisma.JobLogUpdateWithWhereUniqueWithoutJobInput[];
    updateMany?: Prisma.JobLogUpdateManyWithWhereWithoutJobInput | Prisma.JobLogUpdateManyWithWhereWithoutJobInput[];
    deleteMany?: Prisma.JobLogScalarWhereInput | Prisma.JobLogScalarWhereInput[];
};
export type EnumJobLogLevelFieldUpdateOperationsInput = {
    set?: $Enums.JobLogLevel;
};
export type JobLogCreateWithoutJobInput = {
    id?: string;
    level: $Enums.JobLogLevel;
    message: string;
    meta?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    createdAt?: Date | string;
};
export type JobLogUncheckedCreateWithoutJobInput = {
    id?: string;
    level: $Enums.JobLogLevel;
    message: string;
    meta?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    createdAt?: Date | string;
};
export type JobLogCreateOrConnectWithoutJobInput = {
    where: Prisma.JobLogWhereUniqueInput;
    create: Prisma.XOR<Prisma.JobLogCreateWithoutJobInput, Prisma.JobLogUncheckedCreateWithoutJobInput>;
};
export type JobLogCreateManyJobInputEnvelope = {
    data: Prisma.JobLogCreateManyJobInput | Prisma.JobLogCreateManyJobInput[];
    skipDuplicates?: boolean;
};
export type JobLogUpsertWithWhereUniqueWithoutJobInput = {
    where: Prisma.JobLogWhereUniqueInput;
    update: Prisma.XOR<Prisma.JobLogUpdateWithoutJobInput, Prisma.JobLogUncheckedUpdateWithoutJobInput>;
    create: Prisma.XOR<Prisma.JobLogCreateWithoutJobInput, Prisma.JobLogUncheckedCreateWithoutJobInput>;
};
export type JobLogUpdateWithWhereUniqueWithoutJobInput = {
    where: Prisma.JobLogWhereUniqueInput;
    data: Prisma.XOR<Prisma.JobLogUpdateWithoutJobInput, Prisma.JobLogUncheckedUpdateWithoutJobInput>;
};
export type JobLogUpdateManyWithWhereWithoutJobInput = {
    where: Prisma.JobLogScalarWhereInput;
    data: Prisma.XOR<Prisma.JobLogUpdateManyMutationInput, Prisma.JobLogUncheckedUpdateManyWithoutJobInput>;
};
export type JobLogScalarWhereInput = {
    AND?: Prisma.JobLogScalarWhereInput | Prisma.JobLogScalarWhereInput[];
    OR?: Prisma.JobLogScalarWhereInput[];
    NOT?: Prisma.JobLogScalarWhereInput | Prisma.JobLogScalarWhereInput[];
    id?: Prisma.UuidFilter<"JobLog"> | string;
    jobId?: Prisma.UuidFilter<"JobLog"> | string;
    level?: Prisma.EnumJobLogLevelFilter<"JobLog"> | $Enums.JobLogLevel;
    message?: Prisma.StringFilter<"JobLog"> | string;
    meta?: Prisma.JsonNullableFilter<"JobLog">;
    createdAt?: Prisma.DateTimeFilter<"JobLog"> | Date | string;
};
export type JobLogCreateManyJobInput = {
    id?: string;
    level: $Enums.JobLogLevel;
    message: string;
    meta?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    createdAt?: Date | string;
};
export type JobLogUpdateWithoutJobInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    level?: Prisma.EnumJobLogLevelFieldUpdateOperationsInput | $Enums.JobLogLevel;
    message?: Prisma.StringFieldUpdateOperationsInput | string;
    meta?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type JobLogUncheckedUpdateWithoutJobInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    level?: Prisma.EnumJobLogLevelFieldUpdateOperationsInput | $Enums.JobLogLevel;
    message?: Prisma.StringFieldUpdateOperationsInput | string;
    meta?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type JobLogUncheckedUpdateManyWithoutJobInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    level?: Prisma.EnumJobLogLevelFieldUpdateOperationsInput | $Enums.JobLogLevel;
    message?: Prisma.StringFieldUpdateOperationsInput | string;
    meta?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type JobLogSelect<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    jobId?: boolean;
    level?: boolean;
    message?: boolean;
    meta?: boolean;
    createdAt?: boolean;
    job?: boolean | Prisma.ExportJobDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["jobLog"]>;
export type JobLogSelectCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    jobId?: boolean;
    level?: boolean;
    message?: boolean;
    meta?: boolean;
    createdAt?: boolean;
    job?: boolean | Prisma.ExportJobDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["jobLog"]>;
export type JobLogSelectUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    jobId?: boolean;
    level?: boolean;
    message?: boolean;
    meta?: boolean;
    createdAt?: boolean;
    job?: boolean | Prisma.ExportJobDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["jobLog"]>;
export type JobLogSelectScalar = {
    id?: boolean;
    jobId?: boolean;
    level?: boolean;
    message?: boolean;
    meta?: boolean;
    createdAt?: boolean;
};
export type JobLogOmit<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetOmit<"id" | "jobId" | "level" | "message" | "meta" | "createdAt", ExtArgs["result"]["jobLog"]>;
export type JobLogInclude<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    job?: boolean | Prisma.ExportJobDefaultArgs<ExtArgs>;
};
export type JobLogIncludeCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    job?: boolean | Prisma.ExportJobDefaultArgs<ExtArgs>;
};
export type JobLogIncludeUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    job?: boolean | Prisma.ExportJobDefaultArgs<ExtArgs>;
};
export type $JobLogPayload<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    name: "JobLog";
    objects: {
        job: Prisma.$ExportJobPayload<ExtArgs>;
    };
    scalars: runtime.Types.Extensions.GetPayloadResult<{
        id: string;
        jobId: string;
        level: $Enums.JobLogLevel;
        message: string;
        meta: runtime.JsonValue | null;
        createdAt: Date;
    }, ExtArgs["result"]["jobLog"]>;
    composites: {};
};
export type JobLogGetPayload<S extends boolean | null | undefined | JobLogDefaultArgs> = runtime.Types.Result.GetResult<Prisma.$JobLogPayload, S>;
export type JobLogCountArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = Omit<JobLogFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
    select?: JobLogCountAggregateInputType | true;
};
export interface JobLogDelegate<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: {
        types: Prisma.TypeMap<ExtArgs>['model']['JobLog'];
        meta: {
            name: 'JobLog';
        };
    };
    findUnique<T extends JobLogFindUniqueArgs>(args: Prisma.SelectSubset<T, JobLogFindUniqueArgs<ExtArgs>>): Prisma.Prisma__JobLogClient<runtime.Types.Result.GetResult<Prisma.$JobLogPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    findUniqueOrThrow<T extends JobLogFindUniqueOrThrowArgs>(args: Prisma.SelectSubset<T, JobLogFindUniqueOrThrowArgs<ExtArgs>>): Prisma.Prisma__JobLogClient<runtime.Types.Result.GetResult<Prisma.$JobLogPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    findFirst<T extends JobLogFindFirstArgs>(args?: Prisma.SelectSubset<T, JobLogFindFirstArgs<ExtArgs>>): Prisma.Prisma__JobLogClient<runtime.Types.Result.GetResult<Prisma.$JobLogPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    findFirstOrThrow<T extends JobLogFindFirstOrThrowArgs>(args?: Prisma.SelectSubset<T, JobLogFindFirstOrThrowArgs<ExtArgs>>): Prisma.Prisma__JobLogClient<runtime.Types.Result.GetResult<Prisma.$JobLogPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    findMany<T extends JobLogFindManyArgs>(args?: Prisma.SelectSubset<T, JobLogFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$JobLogPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>;
    create<T extends JobLogCreateArgs>(args: Prisma.SelectSubset<T, JobLogCreateArgs<ExtArgs>>): Prisma.Prisma__JobLogClient<runtime.Types.Result.GetResult<Prisma.$JobLogPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    createMany<T extends JobLogCreateManyArgs>(args?: Prisma.SelectSubset<T, JobLogCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    createManyAndReturn<T extends JobLogCreateManyAndReturnArgs>(args?: Prisma.SelectSubset<T, JobLogCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$JobLogPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>;
    delete<T extends JobLogDeleteArgs>(args: Prisma.SelectSubset<T, JobLogDeleteArgs<ExtArgs>>): Prisma.Prisma__JobLogClient<runtime.Types.Result.GetResult<Prisma.$JobLogPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    update<T extends JobLogUpdateArgs>(args: Prisma.SelectSubset<T, JobLogUpdateArgs<ExtArgs>>): Prisma.Prisma__JobLogClient<runtime.Types.Result.GetResult<Prisma.$JobLogPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    deleteMany<T extends JobLogDeleteManyArgs>(args?: Prisma.SelectSubset<T, JobLogDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    updateMany<T extends JobLogUpdateManyArgs>(args: Prisma.SelectSubset<T, JobLogUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    updateManyAndReturn<T extends JobLogUpdateManyAndReturnArgs>(args: Prisma.SelectSubset<T, JobLogUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$JobLogPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>;
    upsert<T extends JobLogUpsertArgs>(args: Prisma.SelectSubset<T, JobLogUpsertArgs<ExtArgs>>): Prisma.Prisma__JobLogClient<runtime.Types.Result.GetResult<Prisma.$JobLogPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    count<T extends JobLogCountArgs>(args?: Prisma.Subset<T, JobLogCountArgs>): Prisma.PrismaPromise<T extends runtime.Types.Utils.Record<'select', any> ? T['select'] extends true ? number : Prisma.GetScalarType<T['select'], JobLogCountAggregateOutputType> : number>;
    aggregate<T extends JobLogAggregateArgs>(args: Prisma.Subset<T, JobLogAggregateArgs>): Prisma.PrismaPromise<GetJobLogAggregateType<T>>;
    groupBy<T extends JobLogGroupByArgs, HasSelectOrTake extends Prisma.Or<Prisma.Extends<'skip', Prisma.Keys<T>>, Prisma.Extends<'take', Prisma.Keys<T>>>, OrderByArg extends Prisma.True extends HasSelectOrTake ? {
        orderBy: JobLogGroupByArgs['orderBy'];
    } : {
        orderBy?: JobLogGroupByArgs['orderBy'];
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
    }[OrderFields]>(args: Prisma.SubsetIntersection<T, JobLogGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetJobLogGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>;
    readonly fields: JobLogFieldRefs;
}
export interface Prisma__JobLogClient<T, Null = never, ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise";
    job<T extends Prisma.ExportJobDefaultArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.ExportJobDefaultArgs<ExtArgs>>): Prisma.Prisma__ExportJobClient<runtime.Types.Result.GetResult<Prisma.$ExportJobPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>;
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): runtime.Types.Utils.JsPromise<TResult1 | TResult2>;
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): runtime.Types.Utils.JsPromise<T | TResult>;
    finally(onfinally?: (() => void) | undefined | null): runtime.Types.Utils.JsPromise<T>;
}
export interface JobLogFieldRefs {
    readonly id: Prisma.FieldRef<"JobLog", 'String'>;
    readonly jobId: Prisma.FieldRef<"JobLog", 'String'>;
    readonly level: Prisma.FieldRef<"JobLog", 'JobLogLevel'>;
    readonly message: Prisma.FieldRef<"JobLog", 'String'>;
    readonly meta: Prisma.FieldRef<"JobLog", 'Json'>;
    readonly createdAt: Prisma.FieldRef<"JobLog", 'DateTime'>;
}
export type JobLogFindUniqueArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.JobLogSelect<ExtArgs> | null;
    omit?: Prisma.JobLogOmit<ExtArgs> | null;
    include?: Prisma.JobLogInclude<ExtArgs> | null;
    where: Prisma.JobLogWhereUniqueInput;
};
export type JobLogFindUniqueOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.JobLogSelect<ExtArgs> | null;
    omit?: Prisma.JobLogOmit<ExtArgs> | null;
    include?: Prisma.JobLogInclude<ExtArgs> | null;
    where: Prisma.JobLogWhereUniqueInput;
};
export type JobLogFindFirstArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.JobLogSelect<ExtArgs> | null;
    omit?: Prisma.JobLogOmit<ExtArgs> | null;
    include?: Prisma.JobLogInclude<ExtArgs> | null;
    where?: Prisma.JobLogWhereInput;
    orderBy?: Prisma.JobLogOrderByWithRelationInput | Prisma.JobLogOrderByWithRelationInput[];
    cursor?: Prisma.JobLogWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.JobLogScalarFieldEnum | Prisma.JobLogScalarFieldEnum[];
};
export type JobLogFindFirstOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.JobLogSelect<ExtArgs> | null;
    omit?: Prisma.JobLogOmit<ExtArgs> | null;
    include?: Prisma.JobLogInclude<ExtArgs> | null;
    where?: Prisma.JobLogWhereInput;
    orderBy?: Prisma.JobLogOrderByWithRelationInput | Prisma.JobLogOrderByWithRelationInput[];
    cursor?: Prisma.JobLogWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.JobLogScalarFieldEnum | Prisma.JobLogScalarFieldEnum[];
};
export type JobLogFindManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.JobLogSelect<ExtArgs> | null;
    omit?: Prisma.JobLogOmit<ExtArgs> | null;
    include?: Prisma.JobLogInclude<ExtArgs> | null;
    where?: Prisma.JobLogWhereInput;
    orderBy?: Prisma.JobLogOrderByWithRelationInput | Prisma.JobLogOrderByWithRelationInput[];
    cursor?: Prisma.JobLogWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.JobLogScalarFieldEnum | Prisma.JobLogScalarFieldEnum[];
};
export type JobLogCreateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.JobLogSelect<ExtArgs> | null;
    omit?: Prisma.JobLogOmit<ExtArgs> | null;
    include?: Prisma.JobLogInclude<ExtArgs> | null;
    data: Prisma.XOR<Prisma.JobLogCreateInput, Prisma.JobLogUncheckedCreateInput>;
};
export type JobLogCreateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    data: Prisma.JobLogCreateManyInput | Prisma.JobLogCreateManyInput[];
    skipDuplicates?: boolean;
};
export type JobLogCreateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.JobLogSelectCreateManyAndReturn<ExtArgs> | null;
    omit?: Prisma.JobLogOmit<ExtArgs> | null;
    data: Prisma.JobLogCreateManyInput | Prisma.JobLogCreateManyInput[];
    skipDuplicates?: boolean;
    include?: Prisma.JobLogIncludeCreateManyAndReturn<ExtArgs> | null;
};
export type JobLogUpdateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.JobLogSelect<ExtArgs> | null;
    omit?: Prisma.JobLogOmit<ExtArgs> | null;
    include?: Prisma.JobLogInclude<ExtArgs> | null;
    data: Prisma.XOR<Prisma.JobLogUpdateInput, Prisma.JobLogUncheckedUpdateInput>;
    where: Prisma.JobLogWhereUniqueInput;
};
export type JobLogUpdateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    data: Prisma.XOR<Prisma.JobLogUpdateManyMutationInput, Prisma.JobLogUncheckedUpdateManyInput>;
    where?: Prisma.JobLogWhereInput;
    limit?: number;
};
export type JobLogUpdateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.JobLogSelectUpdateManyAndReturn<ExtArgs> | null;
    omit?: Prisma.JobLogOmit<ExtArgs> | null;
    data: Prisma.XOR<Prisma.JobLogUpdateManyMutationInput, Prisma.JobLogUncheckedUpdateManyInput>;
    where?: Prisma.JobLogWhereInput;
    limit?: number;
    include?: Prisma.JobLogIncludeUpdateManyAndReturn<ExtArgs> | null;
};
export type JobLogUpsertArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.JobLogSelect<ExtArgs> | null;
    omit?: Prisma.JobLogOmit<ExtArgs> | null;
    include?: Prisma.JobLogInclude<ExtArgs> | null;
    where: Prisma.JobLogWhereUniqueInput;
    create: Prisma.XOR<Prisma.JobLogCreateInput, Prisma.JobLogUncheckedCreateInput>;
    update: Prisma.XOR<Prisma.JobLogUpdateInput, Prisma.JobLogUncheckedUpdateInput>;
};
export type JobLogDeleteArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.JobLogSelect<ExtArgs> | null;
    omit?: Prisma.JobLogOmit<ExtArgs> | null;
    include?: Prisma.JobLogInclude<ExtArgs> | null;
    where: Prisma.JobLogWhereUniqueInput;
};
export type JobLogDeleteManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.JobLogWhereInput;
    limit?: number;
};
export type JobLogDefaultArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.JobLogSelect<ExtArgs> | null;
    omit?: Prisma.JobLogOmit<ExtArgs> | null;
    include?: Prisma.JobLogInclude<ExtArgs> | null;
};
export {};
