import type * as runtime from "@prisma/client/runtime/client";
import type * as $Enums from "../enums.js";
import type * as Prisma from "../internal/prismaNamespace.js";
export type ExportJobModel = runtime.Types.Result.DefaultSelection<Prisma.$ExportJobPayload>;
export type AggregateExportJob = {
    _count: ExportJobCountAggregateOutputType | null;
    _avg: ExportJobAvgAggregateOutputType | null;
    _sum: ExportJobSumAggregateOutputType | null;
    _min: ExportJobMinAggregateOutputType | null;
    _max: ExportJobMaxAggregateOutputType | null;
};
export type ExportJobAvgAggregateOutputType = {
    vkUserId: number | null;
    okUserId: number | null;
    totalCount: number | null;
    fetchedCount: number | null;
};
export type ExportJobSumAggregateOutputType = {
    vkUserId: number | null;
    okUserId: bigint | null;
    totalCount: number | null;
    fetchedCount: number | null;
};
export type ExportJobMinAggregateOutputType = {
    id: string | null;
    createdAt: Date | null;
    status: $Enums.ExportJobStatus | null;
    vkUserId: number | null;
    okUserId: bigint | null;
    totalCount: number | null;
    fetchedCount: number | null;
    warning: string | null;
    error: string | null;
    xlsxPath: string | null;
    docxPath: string | null;
};
export type ExportJobMaxAggregateOutputType = {
    id: string | null;
    createdAt: Date | null;
    status: $Enums.ExportJobStatus | null;
    vkUserId: number | null;
    okUserId: bigint | null;
    totalCount: number | null;
    fetchedCount: number | null;
    warning: string | null;
    error: string | null;
    xlsxPath: string | null;
    docxPath: string | null;
};
export type ExportJobCountAggregateOutputType = {
    id: number;
    createdAt: number;
    status: number;
    params: number;
    vkUserId: number;
    okUserId: number;
    totalCount: number;
    fetchedCount: number;
    warning: number;
    error: number;
    xlsxPath: number;
    docxPath: number;
    _all: number;
};
export type ExportJobAvgAggregateInputType = {
    vkUserId?: true;
    okUserId?: true;
    totalCount?: true;
    fetchedCount?: true;
};
export type ExportJobSumAggregateInputType = {
    vkUserId?: true;
    okUserId?: true;
    totalCount?: true;
    fetchedCount?: true;
};
export type ExportJobMinAggregateInputType = {
    id?: true;
    createdAt?: true;
    status?: true;
    vkUserId?: true;
    okUserId?: true;
    totalCount?: true;
    fetchedCount?: true;
    warning?: true;
    error?: true;
    xlsxPath?: true;
    docxPath?: true;
};
export type ExportJobMaxAggregateInputType = {
    id?: true;
    createdAt?: true;
    status?: true;
    vkUserId?: true;
    okUserId?: true;
    totalCount?: true;
    fetchedCount?: true;
    warning?: true;
    error?: true;
    xlsxPath?: true;
    docxPath?: true;
};
export type ExportJobCountAggregateInputType = {
    id?: true;
    createdAt?: true;
    status?: true;
    params?: true;
    vkUserId?: true;
    okUserId?: true;
    totalCount?: true;
    fetchedCount?: true;
    warning?: true;
    error?: true;
    xlsxPath?: true;
    docxPath?: true;
    _all?: true;
};
export type ExportJobAggregateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.ExportJobWhereInput;
    orderBy?: Prisma.ExportJobOrderByWithRelationInput | Prisma.ExportJobOrderByWithRelationInput[];
    cursor?: Prisma.ExportJobWhereUniqueInput;
    take?: number;
    skip?: number;
    _count?: true | ExportJobCountAggregateInputType;
    _avg?: ExportJobAvgAggregateInputType;
    _sum?: ExportJobSumAggregateInputType;
    _min?: ExportJobMinAggregateInputType;
    _max?: ExportJobMaxAggregateInputType;
};
export type GetExportJobAggregateType<T extends ExportJobAggregateArgs> = {
    [P in keyof T & keyof AggregateExportJob]: P extends '_count' | 'count' ? T[P] extends true ? number : Prisma.GetScalarType<T[P], AggregateExportJob[P]> : Prisma.GetScalarType<T[P], AggregateExportJob[P]>;
};
export type ExportJobGroupByArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.ExportJobWhereInput;
    orderBy?: Prisma.ExportJobOrderByWithAggregationInput | Prisma.ExportJobOrderByWithAggregationInput[];
    by: Prisma.ExportJobScalarFieldEnum[] | Prisma.ExportJobScalarFieldEnum;
    having?: Prisma.ExportJobScalarWhereWithAggregatesInput;
    take?: number;
    skip?: number;
    _count?: ExportJobCountAggregateInputType | true;
    _avg?: ExportJobAvgAggregateInputType;
    _sum?: ExportJobSumAggregateInputType;
    _min?: ExportJobMinAggregateInputType;
    _max?: ExportJobMaxAggregateInputType;
};
export type ExportJobGroupByOutputType = {
    id: string;
    createdAt: Date;
    status: $Enums.ExportJobStatus;
    params: runtime.JsonValue;
    vkUserId: number | null;
    okUserId: bigint | null;
    totalCount: number | null;
    fetchedCount: number;
    warning: string | null;
    error: string | null;
    xlsxPath: string | null;
    docxPath: string | null;
    _count: ExportJobCountAggregateOutputType | null;
    _avg: ExportJobAvgAggregateOutputType | null;
    _sum: ExportJobSumAggregateOutputType | null;
    _min: ExportJobMinAggregateOutputType | null;
    _max: ExportJobMaxAggregateOutputType | null;
};
type GetExportJobGroupByPayload<T extends ExportJobGroupByArgs> = Prisma.PrismaPromise<Array<Prisma.PickEnumerable<ExportJobGroupByOutputType, T['by']> & {
    [P in ((keyof T) & (keyof ExportJobGroupByOutputType))]: P extends '_count' ? T[P] extends boolean ? number : Prisma.GetScalarType<T[P], ExportJobGroupByOutputType[P]> : Prisma.GetScalarType<T[P], ExportJobGroupByOutputType[P]>;
}>>;
export type ExportJobWhereInput = {
    AND?: Prisma.ExportJobWhereInput | Prisma.ExportJobWhereInput[];
    OR?: Prisma.ExportJobWhereInput[];
    NOT?: Prisma.ExportJobWhereInput | Prisma.ExportJobWhereInput[];
    id?: Prisma.UuidFilter<"ExportJob"> | string;
    createdAt?: Prisma.DateTimeFilter<"ExportJob"> | Date | string;
    status?: Prisma.EnumExportJobStatusFilter<"ExportJob"> | $Enums.ExportJobStatus;
    params?: Prisma.JsonFilter<"ExportJob">;
    vkUserId?: Prisma.IntNullableFilter<"ExportJob"> | number | null;
    okUserId?: Prisma.BigIntNullableFilter<"ExportJob"> | bigint | number | null;
    totalCount?: Prisma.IntNullableFilter<"ExportJob"> | number | null;
    fetchedCount?: Prisma.IntFilter<"ExportJob"> | number;
    warning?: Prisma.StringNullableFilter<"ExportJob"> | string | null;
    error?: Prisma.StringNullableFilter<"ExportJob"> | string | null;
    xlsxPath?: Prisma.StringNullableFilter<"ExportJob"> | string | null;
    docxPath?: Prisma.StringNullableFilter<"ExportJob"> | string | null;
    friendRecords?: Prisma.FriendRecordListRelationFilter;
    logs?: Prisma.JobLogListRelationFilter;
};
export type ExportJobOrderByWithRelationInput = {
    id?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    status?: Prisma.SortOrder;
    params?: Prisma.SortOrder;
    vkUserId?: Prisma.SortOrderInput | Prisma.SortOrder;
    okUserId?: Prisma.SortOrderInput | Prisma.SortOrder;
    totalCount?: Prisma.SortOrderInput | Prisma.SortOrder;
    fetchedCount?: Prisma.SortOrder;
    warning?: Prisma.SortOrderInput | Prisma.SortOrder;
    error?: Prisma.SortOrderInput | Prisma.SortOrder;
    xlsxPath?: Prisma.SortOrderInput | Prisma.SortOrder;
    docxPath?: Prisma.SortOrderInput | Prisma.SortOrder;
    friendRecords?: Prisma.FriendRecordOrderByRelationAggregateInput;
    logs?: Prisma.JobLogOrderByRelationAggregateInput;
};
export type ExportJobWhereUniqueInput = Prisma.AtLeast<{
    id?: string;
    AND?: Prisma.ExportJobWhereInput | Prisma.ExportJobWhereInput[];
    OR?: Prisma.ExportJobWhereInput[];
    NOT?: Prisma.ExportJobWhereInput | Prisma.ExportJobWhereInput[];
    createdAt?: Prisma.DateTimeFilter<"ExportJob"> | Date | string;
    status?: Prisma.EnumExportJobStatusFilter<"ExportJob"> | $Enums.ExportJobStatus;
    params?: Prisma.JsonFilter<"ExportJob">;
    vkUserId?: Prisma.IntNullableFilter<"ExportJob"> | number | null;
    okUserId?: Prisma.BigIntNullableFilter<"ExportJob"> | bigint | number | null;
    totalCount?: Prisma.IntNullableFilter<"ExportJob"> | number | null;
    fetchedCount?: Prisma.IntFilter<"ExportJob"> | number;
    warning?: Prisma.StringNullableFilter<"ExportJob"> | string | null;
    error?: Prisma.StringNullableFilter<"ExportJob"> | string | null;
    xlsxPath?: Prisma.StringNullableFilter<"ExportJob"> | string | null;
    docxPath?: Prisma.StringNullableFilter<"ExportJob"> | string | null;
    friendRecords?: Prisma.FriendRecordListRelationFilter;
    logs?: Prisma.JobLogListRelationFilter;
}, "id">;
export type ExportJobOrderByWithAggregationInput = {
    id?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    status?: Prisma.SortOrder;
    params?: Prisma.SortOrder;
    vkUserId?: Prisma.SortOrderInput | Prisma.SortOrder;
    okUserId?: Prisma.SortOrderInput | Prisma.SortOrder;
    totalCount?: Prisma.SortOrderInput | Prisma.SortOrder;
    fetchedCount?: Prisma.SortOrder;
    warning?: Prisma.SortOrderInput | Prisma.SortOrder;
    error?: Prisma.SortOrderInput | Prisma.SortOrder;
    xlsxPath?: Prisma.SortOrderInput | Prisma.SortOrder;
    docxPath?: Prisma.SortOrderInput | Prisma.SortOrder;
    _count?: Prisma.ExportJobCountOrderByAggregateInput;
    _avg?: Prisma.ExportJobAvgOrderByAggregateInput;
    _max?: Prisma.ExportJobMaxOrderByAggregateInput;
    _min?: Prisma.ExportJobMinOrderByAggregateInput;
    _sum?: Prisma.ExportJobSumOrderByAggregateInput;
};
export type ExportJobScalarWhereWithAggregatesInput = {
    AND?: Prisma.ExportJobScalarWhereWithAggregatesInput | Prisma.ExportJobScalarWhereWithAggregatesInput[];
    OR?: Prisma.ExportJobScalarWhereWithAggregatesInput[];
    NOT?: Prisma.ExportJobScalarWhereWithAggregatesInput | Prisma.ExportJobScalarWhereWithAggregatesInput[];
    id?: Prisma.UuidWithAggregatesFilter<"ExportJob"> | string;
    createdAt?: Prisma.DateTimeWithAggregatesFilter<"ExportJob"> | Date | string;
    status?: Prisma.EnumExportJobStatusWithAggregatesFilter<"ExportJob"> | $Enums.ExportJobStatus;
    params?: Prisma.JsonWithAggregatesFilter<"ExportJob">;
    vkUserId?: Prisma.IntNullableWithAggregatesFilter<"ExportJob"> | number | null;
    okUserId?: Prisma.BigIntNullableWithAggregatesFilter<"ExportJob"> | bigint | number | null;
    totalCount?: Prisma.IntNullableWithAggregatesFilter<"ExportJob"> | number | null;
    fetchedCount?: Prisma.IntWithAggregatesFilter<"ExportJob"> | number;
    warning?: Prisma.StringNullableWithAggregatesFilter<"ExportJob"> | string | null;
    error?: Prisma.StringNullableWithAggregatesFilter<"ExportJob"> | string | null;
    xlsxPath?: Prisma.StringNullableWithAggregatesFilter<"ExportJob"> | string | null;
    docxPath?: Prisma.StringNullableWithAggregatesFilter<"ExportJob"> | string | null;
};
export type ExportJobCreateInput = {
    id?: string;
    createdAt?: Date | string;
    status?: $Enums.ExportJobStatus;
    params: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    vkUserId?: number | null;
    okUserId?: bigint | number | null;
    totalCount?: number | null;
    fetchedCount?: number;
    warning?: string | null;
    error?: string | null;
    xlsxPath?: string | null;
    docxPath?: string | null;
    friendRecords?: Prisma.FriendRecordCreateNestedManyWithoutJobInput;
    logs?: Prisma.JobLogCreateNestedManyWithoutJobInput;
};
export type ExportJobUncheckedCreateInput = {
    id?: string;
    createdAt?: Date | string;
    status?: $Enums.ExportJobStatus;
    params: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    vkUserId?: number | null;
    okUserId?: bigint | number | null;
    totalCount?: number | null;
    fetchedCount?: number;
    warning?: string | null;
    error?: string | null;
    xlsxPath?: string | null;
    docxPath?: string | null;
    friendRecords?: Prisma.FriendRecordUncheckedCreateNestedManyWithoutJobInput;
    logs?: Prisma.JobLogUncheckedCreateNestedManyWithoutJobInput;
};
export type ExportJobUpdateInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    status?: Prisma.EnumExportJobStatusFieldUpdateOperationsInput | $Enums.ExportJobStatus;
    params?: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    vkUserId?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    okUserId?: Prisma.NullableBigIntFieldUpdateOperationsInput | bigint | number | null;
    totalCount?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    fetchedCount?: Prisma.IntFieldUpdateOperationsInput | number;
    warning?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    error?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    xlsxPath?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    docxPath?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    friendRecords?: Prisma.FriendRecordUpdateManyWithoutJobNestedInput;
    logs?: Prisma.JobLogUpdateManyWithoutJobNestedInput;
};
export type ExportJobUncheckedUpdateInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    status?: Prisma.EnumExportJobStatusFieldUpdateOperationsInput | $Enums.ExportJobStatus;
    params?: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    vkUserId?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    okUserId?: Prisma.NullableBigIntFieldUpdateOperationsInput | bigint | number | null;
    totalCount?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    fetchedCount?: Prisma.IntFieldUpdateOperationsInput | number;
    warning?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    error?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    xlsxPath?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    docxPath?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    friendRecords?: Prisma.FriendRecordUncheckedUpdateManyWithoutJobNestedInput;
    logs?: Prisma.JobLogUncheckedUpdateManyWithoutJobNestedInput;
};
export type ExportJobCreateManyInput = {
    id?: string;
    createdAt?: Date | string;
    status?: $Enums.ExportJobStatus;
    params: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    vkUserId?: number | null;
    okUserId?: bigint | number | null;
    totalCount?: number | null;
    fetchedCount?: number;
    warning?: string | null;
    error?: string | null;
    xlsxPath?: string | null;
    docxPath?: string | null;
};
export type ExportJobUpdateManyMutationInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    status?: Prisma.EnumExportJobStatusFieldUpdateOperationsInput | $Enums.ExportJobStatus;
    params?: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    vkUserId?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    okUserId?: Prisma.NullableBigIntFieldUpdateOperationsInput | bigint | number | null;
    totalCount?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    fetchedCount?: Prisma.IntFieldUpdateOperationsInput | number;
    warning?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    error?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    xlsxPath?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    docxPath?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
};
export type ExportJobUncheckedUpdateManyInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    status?: Prisma.EnumExportJobStatusFieldUpdateOperationsInput | $Enums.ExportJobStatus;
    params?: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    vkUserId?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    okUserId?: Prisma.NullableBigIntFieldUpdateOperationsInput | bigint | number | null;
    totalCount?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    fetchedCount?: Prisma.IntFieldUpdateOperationsInput | number;
    warning?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    error?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    xlsxPath?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    docxPath?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
};
export type ExportJobCountOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    status?: Prisma.SortOrder;
    params?: Prisma.SortOrder;
    vkUserId?: Prisma.SortOrder;
    okUserId?: Prisma.SortOrder;
    totalCount?: Prisma.SortOrder;
    fetchedCount?: Prisma.SortOrder;
    warning?: Prisma.SortOrder;
    error?: Prisma.SortOrder;
    xlsxPath?: Prisma.SortOrder;
    docxPath?: Prisma.SortOrder;
};
export type ExportJobAvgOrderByAggregateInput = {
    vkUserId?: Prisma.SortOrder;
    okUserId?: Prisma.SortOrder;
    totalCount?: Prisma.SortOrder;
    fetchedCount?: Prisma.SortOrder;
};
export type ExportJobMaxOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    status?: Prisma.SortOrder;
    vkUserId?: Prisma.SortOrder;
    okUserId?: Prisma.SortOrder;
    totalCount?: Prisma.SortOrder;
    fetchedCount?: Prisma.SortOrder;
    warning?: Prisma.SortOrder;
    error?: Prisma.SortOrder;
    xlsxPath?: Prisma.SortOrder;
    docxPath?: Prisma.SortOrder;
};
export type ExportJobMinOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    status?: Prisma.SortOrder;
    vkUserId?: Prisma.SortOrder;
    okUserId?: Prisma.SortOrder;
    totalCount?: Prisma.SortOrder;
    fetchedCount?: Prisma.SortOrder;
    warning?: Prisma.SortOrder;
    error?: Prisma.SortOrder;
    xlsxPath?: Prisma.SortOrder;
    docxPath?: Prisma.SortOrder;
};
export type ExportJobSumOrderByAggregateInput = {
    vkUserId?: Prisma.SortOrder;
    okUserId?: Prisma.SortOrder;
    totalCount?: Prisma.SortOrder;
    fetchedCount?: Prisma.SortOrder;
};
export type ExportJobScalarRelationFilter = {
    is?: Prisma.ExportJobWhereInput;
    isNot?: Prisma.ExportJobWhereInput;
};
export type EnumExportJobStatusFieldUpdateOperationsInput = {
    set?: $Enums.ExportJobStatus;
};
export type NullableIntFieldUpdateOperationsInput = {
    set?: number | null;
    increment?: number;
    decrement?: number;
    multiply?: number;
    divide?: number;
};
export type NullableBigIntFieldUpdateOperationsInput = {
    set?: bigint | number | null;
    increment?: bigint | number;
    decrement?: bigint | number;
    multiply?: bigint | number;
    divide?: bigint | number;
};
export type ExportJobCreateNestedOneWithoutFriendRecordsInput = {
    create?: Prisma.XOR<Prisma.ExportJobCreateWithoutFriendRecordsInput, Prisma.ExportJobUncheckedCreateWithoutFriendRecordsInput>;
    connectOrCreate?: Prisma.ExportJobCreateOrConnectWithoutFriendRecordsInput;
    connect?: Prisma.ExportJobWhereUniqueInput;
};
export type ExportJobUpdateOneRequiredWithoutFriendRecordsNestedInput = {
    create?: Prisma.XOR<Prisma.ExportJobCreateWithoutFriendRecordsInput, Prisma.ExportJobUncheckedCreateWithoutFriendRecordsInput>;
    connectOrCreate?: Prisma.ExportJobCreateOrConnectWithoutFriendRecordsInput;
    upsert?: Prisma.ExportJobUpsertWithoutFriendRecordsInput;
    connect?: Prisma.ExportJobWhereUniqueInput;
    update?: Prisma.XOR<Prisma.XOR<Prisma.ExportJobUpdateToOneWithWhereWithoutFriendRecordsInput, Prisma.ExportJobUpdateWithoutFriendRecordsInput>, Prisma.ExportJobUncheckedUpdateWithoutFriendRecordsInput>;
};
export type ExportJobCreateNestedOneWithoutLogsInput = {
    create?: Prisma.XOR<Prisma.ExportJobCreateWithoutLogsInput, Prisma.ExportJobUncheckedCreateWithoutLogsInput>;
    connectOrCreate?: Prisma.ExportJobCreateOrConnectWithoutLogsInput;
    connect?: Prisma.ExportJobWhereUniqueInput;
};
export type ExportJobUpdateOneRequiredWithoutLogsNestedInput = {
    create?: Prisma.XOR<Prisma.ExportJobCreateWithoutLogsInput, Prisma.ExportJobUncheckedCreateWithoutLogsInput>;
    connectOrCreate?: Prisma.ExportJobCreateOrConnectWithoutLogsInput;
    upsert?: Prisma.ExportJobUpsertWithoutLogsInput;
    connect?: Prisma.ExportJobWhereUniqueInput;
    update?: Prisma.XOR<Prisma.XOR<Prisma.ExportJobUpdateToOneWithWhereWithoutLogsInput, Prisma.ExportJobUpdateWithoutLogsInput>, Prisma.ExportJobUncheckedUpdateWithoutLogsInput>;
};
export type ExportJobCreateWithoutFriendRecordsInput = {
    id?: string;
    createdAt?: Date | string;
    status?: $Enums.ExportJobStatus;
    params: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    vkUserId?: number | null;
    okUserId?: bigint | number | null;
    totalCount?: number | null;
    fetchedCount?: number;
    warning?: string | null;
    error?: string | null;
    xlsxPath?: string | null;
    docxPath?: string | null;
    logs?: Prisma.JobLogCreateNestedManyWithoutJobInput;
};
export type ExportJobUncheckedCreateWithoutFriendRecordsInput = {
    id?: string;
    createdAt?: Date | string;
    status?: $Enums.ExportJobStatus;
    params: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    vkUserId?: number | null;
    okUserId?: bigint | number | null;
    totalCount?: number | null;
    fetchedCount?: number;
    warning?: string | null;
    error?: string | null;
    xlsxPath?: string | null;
    docxPath?: string | null;
    logs?: Prisma.JobLogUncheckedCreateNestedManyWithoutJobInput;
};
export type ExportJobCreateOrConnectWithoutFriendRecordsInput = {
    where: Prisma.ExportJobWhereUniqueInput;
    create: Prisma.XOR<Prisma.ExportJobCreateWithoutFriendRecordsInput, Prisma.ExportJobUncheckedCreateWithoutFriendRecordsInput>;
};
export type ExportJobUpsertWithoutFriendRecordsInput = {
    update: Prisma.XOR<Prisma.ExportJobUpdateWithoutFriendRecordsInput, Prisma.ExportJobUncheckedUpdateWithoutFriendRecordsInput>;
    create: Prisma.XOR<Prisma.ExportJobCreateWithoutFriendRecordsInput, Prisma.ExportJobUncheckedCreateWithoutFriendRecordsInput>;
    where?: Prisma.ExportJobWhereInput;
};
export type ExportJobUpdateToOneWithWhereWithoutFriendRecordsInput = {
    where?: Prisma.ExportJobWhereInput;
    data: Prisma.XOR<Prisma.ExportJobUpdateWithoutFriendRecordsInput, Prisma.ExportJobUncheckedUpdateWithoutFriendRecordsInput>;
};
export type ExportJobUpdateWithoutFriendRecordsInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    status?: Prisma.EnumExportJobStatusFieldUpdateOperationsInput | $Enums.ExportJobStatus;
    params?: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    vkUserId?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    okUserId?: Prisma.NullableBigIntFieldUpdateOperationsInput | bigint | number | null;
    totalCount?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    fetchedCount?: Prisma.IntFieldUpdateOperationsInput | number;
    warning?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    error?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    xlsxPath?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    docxPath?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    logs?: Prisma.JobLogUpdateManyWithoutJobNestedInput;
};
export type ExportJobUncheckedUpdateWithoutFriendRecordsInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    status?: Prisma.EnumExportJobStatusFieldUpdateOperationsInput | $Enums.ExportJobStatus;
    params?: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    vkUserId?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    okUserId?: Prisma.NullableBigIntFieldUpdateOperationsInput | bigint | number | null;
    totalCount?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    fetchedCount?: Prisma.IntFieldUpdateOperationsInput | number;
    warning?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    error?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    xlsxPath?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    docxPath?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    logs?: Prisma.JobLogUncheckedUpdateManyWithoutJobNestedInput;
};
export type ExportJobCreateWithoutLogsInput = {
    id?: string;
    createdAt?: Date | string;
    status?: $Enums.ExportJobStatus;
    params: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    vkUserId?: number | null;
    okUserId?: bigint | number | null;
    totalCount?: number | null;
    fetchedCount?: number;
    warning?: string | null;
    error?: string | null;
    xlsxPath?: string | null;
    docxPath?: string | null;
    friendRecords?: Prisma.FriendRecordCreateNestedManyWithoutJobInput;
};
export type ExportJobUncheckedCreateWithoutLogsInput = {
    id?: string;
    createdAt?: Date | string;
    status?: $Enums.ExportJobStatus;
    params: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    vkUserId?: number | null;
    okUserId?: bigint | number | null;
    totalCount?: number | null;
    fetchedCount?: number;
    warning?: string | null;
    error?: string | null;
    xlsxPath?: string | null;
    docxPath?: string | null;
    friendRecords?: Prisma.FriendRecordUncheckedCreateNestedManyWithoutJobInput;
};
export type ExportJobCreateOrConnectWithoutLogsInput = {
    where: Prisma.ExportJobWhereUniqueInput;
    create: Prisma.XOR<Prisma.ExportJobCreateWithoutLogsInput, Prisma.ExportJobUncheckedCreateWithoutLogsInput>;
};
export type ExportJobUpsertWithoutLogsInput = {
    update: Prisma.XOR<Prisma.ExportJobUpdateWithoutLogsInput, Prisma.ExportJobUncheckedUpdateWithoutLogsInput>;
    create: Prisma.XOR<Prisma.ExportJobCreateWithoutLogsInput, Prisma.ExportJobUncheckedCreateWithoutLogsInput>;
    where?: Prisma.ExportJobWhereInput;
};
export type ExportJobUpdateToOneWithWhereWithoutLogsInput = {
    where?: Prisma.ExportJobWhereInput;
    data: Prisma.XOR<Prisma.ExportJobUpdateWithoutLogsInput, Prisma.ExportJobUncheckedUpdateWithoutLogsInput>;
};
export type ExportJobUpdateWithoutLogsInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    status?: Prisma.EnumExportJobStatusFieldUpdateOperationsInput | $Enums.ExportJobStatus;
    params?: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    vkUserId?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    okUserId?: Prisma.NullableBigIntFieldUpdateOperationsInput | bigint | number | null;
    totalCount?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    fetchedCount?: Prisma.IntFieldUpdateOperationsInput | number;
    warning?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    error?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    xlsxPath?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    docxPath?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    friendRecords?: Prisma.FriendRecordUpdateManyWithoutJobNestedInput;
};
export type ExportJobUncheckedUpdateWithoutLogsInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    status?: Prisma.EnumExportJobStatusFieldUpdateOperationsInput | $Enums.ExportJobStatus;
    params?: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    vkUserId?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    okUserId?: Prisma.NullableBigIntFieldUpdateOperationsInput | bigint | number | null;
    totalCount?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    fetchedCount?: Prisma.IntFieldUpdateOperationsInput | number;
    warning?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    error?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    xlsxPath?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    docxPath?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    friendRecords?: Prisma.FriendRecordUncheckedUpdateManyWithoutJobNestedInput;
};
export type ExportJobCountOutputType = {
    friendRecords: number;
    logs: number;
};
export type ExportJobCountOutputTypeSelect<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    friendRecords?: boolean | ExportJobCountOutputTypeCountFriendRecordsArgs;
    logs?: boolean | ExportJobCountOutputTypeCountLogsArgs;
};
export type ExportJobCountOutputTypeDefaultArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.ExportJobCountOutputTypeSelect<ExtArgs> | null;
};
export type ExportJobCountOutputTypeCountFriendRecordsArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.FriendRecordWhereInput;
};
export type ExportJobCountOutputTypeCountLogsArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.JobLogWhereInput;
};
export type ExportJobSelect<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    createdAt?: boolean;
    status?: boolean;
    params?: boolean;
    vkUserId?: boolean;
    okUserId?: boolean;
    totalCount?: boolean;
    fetchedCount?: boolean;
    warning?: boolean;
    error?: boolean;
    xlsxPath?: boolean;
    docxPath?: boolean;
    friendRecords?: boolean | Prisma.ExportJob$friendRecordsArgs<ExtArgs>;
    logs?: boolean | Prisma.ExportJob$logsArgs<ExtArgs>;
    _count?: boolean | Prisma.ExportJobCountOutputTypeDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["exportJob"]>;
export type ExportJobSelectCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    createdAt?: boolean;
    status?: boolean;
    params?: boolean;
    vkUserId?: boolean;
    okUserId?: boolean;
    totalCount?: boolean;
    fetchedCount?: boolean;
    warning?: boolean;
    error?: boolean;
    xlsxPath?: boolean;
    docxPath?: boolean;
}, ExtArgs["result"]["exportJob"]>;
export type ExportJobSelectUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    createdAt?: boolean;
    status?: boolean;
    params?: boolean;
    vkUserId?: boolean;
    okUserId?: boolean;
    totalCount?: boolean;
    fetchedCount?: boolean;
    warning?: boolean;
    error?: boolean;
    xlsxPath?: boolean;
    docxPath?: boolean;
}, ExtArgs["result"]["exportJob"]>;
export type ExportJobSelectScalar = {
    id?: boolean;
    createdAt?: boolean;
    status?: boolean;
    params?: boolean;
    vkUserId?: boolean;
    okUserId?: boolean;
    totalCount?: boolean;
    fetchedCount?: boolean;
    warning?: boolean;
    error?: boolean;
    xlsxPath?: boolean;
    docxPath?: boolean;
};
export type ExportJobOmit<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetOmit<"id" | "createdAt" | "status" | "params" | "vkUserId" | "okUserId" | "totalCount" | "fetchedCount" | "warning" | "error" | "xlsxPath" | "docxPath", ExtArgs["result"]["exportJob"]>;
export type ExportJobInclude<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    friendRecords?: boolean | Prisma.ExportJob$friendRecordsArgs<ExtArgs>;
    logs?: boolean | Prisma.ExportJob$logsArgs<ExtArgs>;
    _count?: boolean | Prisma.ExportJobCountOutputTypeDefaultArgs<ExtArgs>;
};
export type ExportJobIncludeCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {};
export type ExportJobIncludeUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {};
export type $ExportJobPayload<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    name: "ExportJob";
    objects: {
        friendRecords: Prisma.$FriendRecordPayload<ExtArgs>[];
        logs: Prisma.$JobLogPayload<ExtArgs>[];
    };
    scalars: runtime.Types.Extensions.GetPayloadResult<{
        id: string;
        createdAt: Date;
        status: $Enums.ExportJobStatus;
        params: runtime.JsonValue;
        vkUserId: number | null;
        okUserId: bigint | null;
        totalCount: number | null;
        fetchedCount: number;
        warning: string | null;
        error: string | null;
        xlsxPath: string | null;
        docxPath: string | null;
    }, ExtArgs["result"]["exportJob"]>;
    composites: {};
};
export type ExportJobGetPayload<S extends boolean | null | undefined | ExportJobDefaultArgs> = runtime.Types.Result.GetResult<Prisma.$ExportJobPayload, S>;
export type ExportJobCountArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = Omit<ExportJobFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
    select?: ExportJobCountAggregateInputType | true;
};
export interface ExportJobDelegate<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: {
        types: Prisma.TypeMap<ExtArgs>['model']['ExportJob'];
        meta: {
            name: 'ExportJob';
        };
    };
    findUnique<T extends ExportJobFindUniqueArgs>(args: Prisma.SelectSubset<T, ExportJobFindUniqueArgs<ExtArgs>>): Prisma.Prisma__ExportJobClient<runtime.Types.Result.GetResult<Prisma.$ExportJobPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    findUniqueOrThrow<T extends ExportJobFindUniqueOrThrowArgs>(args: Prisma.SelectSubset<T, ExportJobFindUniqueOrThrowArgs<ExtArgs>>): Prisma.Prisma__ExportJobClient<runtime.Types.Result.GetResult<Prisma.$ExportJobPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    findFirst<T extends ExportJobFindFirstArgs>(args?: Prisma.SelectSubset<T, ExportJobFindFirstArgs<ExtArgs>>): Prisma.Prisma__ExportJobClient<runtime.Types.Result.GetResult<Prisma.$ExportJobPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    findFirstOrThrow<T extends ExportJobFindFirstOrThrowArgs>(args?: Prisma.SelectSubset<T, ExportJobFindFirstOrThrowArgs<ExtArgs>>): Prisma.Prisma__ExportJobClient<runtime.Types.Result.GetResult<Prisma.$ExportJobPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    findMany<T extends ExportJobFindManyArgs>(args?: Prisma.SelectSubset<T, ExportJobFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$ExportJobPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>;
    create<T extends ExportJobCreateArgs>(args: Prisma.SelectSubset<T, ExportJobCreateArgs<ExtArgs>>): Prisma.Prisma__ExportJobClient<runtime.Types.Result.GetResult<Prisma.$ExportJobPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    createMany<T extends ExportJobCreateManyArgs>(args?: Prisma.SelectSubset<T, ExportJobCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    createManyAndReturn<T extends ExportJobCreateManyAndReturnArgs>(args?: Prisma.SelectSubset<T, ExportJobCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$ExportJobPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>;
    delete<T extends ExportJobDeleteArgs>(args: Prisma.SelectSubset<T, ExportJobDeleteArgs<ExtArgs>>): Prisma.Prisma__ExportJobClient<runtime.Types.Result.GetResult<Prisma.$ExportJobPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    update<T extends ExportJobUpdateArgs>(args: Prisma.SelectSubset<T, ExportJobUpdateArgs<ExtArgs>>): Prisma.Prisma__ExportJobClient<runtime.Types.Result.GetResult<Prisma.$ExportJobPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    deleteMany<T extends ExportJobDeleteManyArgs>(args?: Prisma.SelectSubset<T, ExportJobDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    updateMany<T extends ExportJobUpdateManyArgs>(args: Prisma.SelectSubset<T, ExportJobUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    updateManyAndReturn<T extends ExportJobUpdateManyAndReturnArgs>(args: Prisma.SelectSubset<T, ExportJobUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$ExportJobPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>;
    upsert<T extends ExportJobUpsertArgs>(args: Prisma.SelectSubset<T, ExportJobUpsertArgs<ExtArgs>>): Prisma.Prisma__ExportJobClient<runtime.Types.Result.GetResult<Prisma.$ExportJobPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    count<T extends ExportJobCountArgs>(args?: Prisma.Subset<T, ExportJobCountArgs>): Prisma.PrismaPromise<T extends runtime.Types.Utils.Record<'select', any> ? T['select'] extends true ? number : Prisma.GetScalarType<T['select'], ExportJobCountAggregateOutputType> : number>;
    aggregate<T extends ExportJobAggregateArgs>(args: Prisma.Subset<T, ExportJobAggregateArgs>): Prisma.PrismaPromise<GetExportJobAggregateType<T>>;
    groupBy<T extends ExportJobGroupByArgs, HasSelectOrTake extends Prisma.Or<Prisma.Extends<'skip', Prisma.Keys<T>>, Prisma.Extends<'take', Prisma.Keys<T>>>, OrderByArg extends Prisma.True extends HasSelectOrTake ? {
        orderBy: ExportJobGroupByArgs['orderBy'];
    } : {
        orderBy?: ExportJobGroupByArgs['orderBy'];
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
    }[OrderFields]>(args: Prisma.SubsetIntersection<T, ExportJobGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetExportJobGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>;
    readonly fields: ExportJobFieldRefs;
}
export interface Prisma__ExportJobClient<T, Null = never, ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise";
    friendRecords<T extends Prisma.ExportJob$friendRecordsArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.ExportJob$friendRecordsArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$FriendRecordPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>;
    logs<T extends Prisma.ExportJob$logsArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.ExportJob$logsArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$JobLogPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>;
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): runtime.Types.Utils.JsPromise<TResult1 | TResult2>;
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): runtime.Types.Utils.JsPromise<T | TResult>;
    finally(onfinally?: (() => void) | undefined | null): runtime.Types.Utils.JsPromise<T>;
}
export interface ExportJobFieldRefs {
    readonly id: Prisma.FieldRef<"ExportJob", 'String'>;
    readonly createdAt: Prisma.FieldRef<"ExportJob", 'DateTime'>;
    readonly status: Prisma.FieldRef<"ExportJob", 'ExportJobStatus'>;
    readonly params: Prisma.FieldRef<"ExportJob", 'Json'>;
    readonly vkUserId: Prisma.FieldRef<"ExportJob", 'Int'>;
    readonly okUserId: Prisma.FieldRef<"ExportJob", 'BigInt'>;
    readonly totalCount: Prisma.FieldRef<"ExportJob", 'Int'>;
    readonly fetchedCount: Prisma.FieldRef<"ExportJob", 'Int'>;
    readonly warning: Prisma.FieldRef<"ExportJob", 'String'>;
    readonly error: Prisma.FieldRef<"ExportJob", 'String'>;
    readonly xlsxPath: Prisma.FieldRef<"ExportJob", 'String'>;
    readonly docxPath: Prisma.FieldRef<"ExportJob", 'String'>;
}
export type ExportJobFindUniqueArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.ExportJobSelect<ExtArgs> | null;
    omit?: Prisma.ExportJobOmit<ExtArgs> | null;
    include?: Prisma.ExportJobInclude<ExtArgs> | null;
    where: Prisma.ExportJobWhereUniqueInput;
};
export type ExportJobFindUniqueOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.ExportJobSelect<ExtArgs> | null;
    omit?: Prisma.ExportJobOmit<ExtArgs> | null;
    include?: Prisma.ExportJobInclude<ExtArgs> | null;
    where: Prisma.ExportJobWhereUniqueInput;
};
export type ExportJobFindFirstArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.ExportJobSelect<ExtArgs> | null;
    omit?: Prisma.ExportJobOmit<ExtArgs> | null;
    include?: Prisma.ExportJobInclude<ExtArgs> | null;
    where?: Prisma.ExportJobWhereInput;
    orderBy?: Prisma.ExportJobOrderByWithRelationInput | Prisma.ExportJobOrderByWithRelationInput[];
    cursor?: Prisma.ExportJobWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.ExportJobScalarFieldEnum | Prisma.ExportJobScalarFieldEnum[];
};
export type ExportJobFindFirstOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.ExportJobSelect<ExtArgs> | null;
    omit?: Prisma.ExportJobOmit<ExtArgs> | null;
    include?: Prisma.ExportJobInclude<ExtArgs> | null;
    where?: Prisma.ExportJobWhereInput;
    orderBy?: Prisma.ExportJobOrderByWithRelationInput | Prisma.ExportJobOrderByWithRelationInput[];
    cursor?: Prisma.ExportJobWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.ExportJobScalarFieldEnum | Prisma.ExportJobScalarFieldEnum[];
};
export type ExportJobFindManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.ExportJobSelect<ExtArgs> | null;
    omit?: Prisma.ExportJobOmit<ExtArgs> | null;
    include?: Prisma.ExportJobInclude<ExtArgs> | null;
    where?: Prisma.ExportJobWhereInput;
    orderBy?: Prisma.ExportJobOrderByWithRelationInput | Prisma.ExportJobOrderByWithRelationInput[];
    cursor?: Prisma.ExportJobWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.ExportJobScalarFieldEnum | Prisma.ExportJobScalarFieldEnum[];
};
export type ExportJobCreateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.ExportJobSelect<ExtArgs> | null;
    omit?: Prisma.ExportJobOmit<ExtArgs> | null;
    include?: Prisma.ExportJobInclude<ExtArgs> | null;
    data: Prisma.XOR<Prisma.ExportJobCreateInput, Prisma.ExportJobUncheckedCreateInput>;
};
export type ExportJobCreateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    data: Prisma.ExportJobCreateManyInput | Prisma.ExportJobCreateManyInput[];
    skipDuplicates?: boolean;
};
export type ExportJobCreateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.ExportJobSelectCreateManyAndReturn<ExtArgs> | null;
    omit?: Prisma.ExportJobOmit<ExtArgs> | null;
    data: Prisma.ExportJobCreateManyInput | Prisma.ExportJobCreateManyInput[];
    skipDuplicates?: boolean;
};
export type ExportJobUpdateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.ExportJobSelect<ExtArgs> | null;
    omit?: Prisma.ExportJobOmit<ExtArgs> | null;
    include?: Prisma.ExportJobInclude<ExtArgs> | null;
    data: Prisma.XOR<Prisma.ExportJobUpdateInput, Prisma.ExportJobUncheckedUpdateInput>;
    where: Prisma.ExportJobWhereUniqueInput;
};
export type ExportJobUpdateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    data: Prisma.XOR<Prisma.ExportJobUpdateManyMutationInput, Prisma.ExportJobUncheckedUpdateManyInput>;
    where?: Prisma.ExportJobWhereInput;
    limit?: number;
};
export type ExportJobUpdateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.ExportJobSelectUpdateManyAndReturn<ExtArgs> | null;
    omit?: Prisma.ExportJobOmit<ExtArgs> | null;
    data: Prisma.XOR<Prisma.ExportJobUpdateManyMutationInput, Prisma.ExportJobUncheckedUpdateManyInput>;
    where?: Prisma.ExportJobWhereInput;
    limit?: number;
};
export type ExportJobUpsertArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.ExportJobSelect<ExtArgs> | null;
    omit?: Prisma.ExportJobOmit<ExtArgs> | null;
    include?: Prisma.ExportJobInclude<ExtArgs> | null;
    where: Prisma.ExportJobWhereUniqueInput;
    create: Prisma.XOR<Prisma.ExportJobCreateInput, Prisma.ExportJobUncheckedCreateInput>;
    update: Prisma.XOR<Prisma.ExportJobUpdateInput, Prisma.ExportJobUncheckedUpdateInput>;
};
export type ExportJobDeleteArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.ExportJobSelect<ExtArgs> | null;
    omit?: Prisma.ExportJobOmit<ExtArgs> | null;
    include?: Prisma.ExportJobInclude<ExtArgs> | null;
    where: Prisma.ExportJobWhereUniqueInput;
};
export type ExportJobDeleteManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.ExportJobWhereInput;
    limit?: number;
};
export type ExportJob$friendRecordsArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.FriendRecordSelect<ExtArgs> | null;
    omit?: Prisma.FriendRecordOmit<ExtArgs> | null;
    include?: Prisma.FriendRecordInclude<ExtArgs> | null;
    where?: Prisma.FriendRecordWhereInput;
    orderBy?: Prisma.FriendRecordOrderByWithRelationInput | Prisma.FriendRecordOrderByWithRelationInput[];
    cursor?: Prisma.FriendRecordWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.FriendRecordScalarFieldEnum | Prisma.FriendRecordScalarFieldEnum[];
};
export type ExportJob$logsArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
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
export type ExportJobDefaultArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.ExportJobSelect<ExtArgs> | null;
    omit?: Prisma.ExportJobOmit<ExtArgs> | null;
    include?: Prisma.ExportJobInclude<ExtArgs> | null;
};
export {};
