import type * as runtime from "@prisma/client/runtime/client";
import type * as Prisma from "../internal/prismaNamespace.js";
export type DlImportFileModel = runtime.Types.Result.DefaultSelection<Prisma.$DlImportFilePayload>;
export type AggregateDlImportFile = {
    _count: DlImportFileCountAggregateOutputType | null;
    _avg: DlImportFileAvgAggregateOutputType | null;
    _sum: DlImportFileSumAggregateOutputType | null;
    _min: DlImportFileMinAggregateOutputType | null;
    _max: DlImportFileMaxAggregateOutputType | null;
};
export type DlImportFileAvgAggregateOutputType = {
    id: number | null;
    batchId: number | null;
    rowsTotal: number | null;
    rowsSuccess: number | null;
    rowsFailed: number | null;
    replacedFileId: number | null;
};
export type DlImportFileSumAggregateOutputType = {
    id: bigint | null;
    batchId: bigint | null;
    rowsTotal: number | null;
    rowsSuccess: number | null;
    rowsFailed: number | null;
    replacedFileId: bigint | null;
};
export type DlImportFileMinAggregateOutputType = {
    id: bigint | null;
    batchId: bigint | null;
    originalFileName: string | null;
    fileHash: string | null;
    status: string | null;
    rowsTotal: number | null;
    rowsSuccess: number | null;
    rowsFailed: number | null;
    error: string | null;
    isActive: boolean | null;
    replacedFileId: bigint | null;
    createdAt: Date | null;
    finishedAt: Date | null;
    updatedAt: Date | null;
};
export type DlImportFileMaxAggregateOutputType = {
    id: bigint | null;
    batchId: bigint | null;
    originalFileName: string | null;
    fileHash: string | null;
    status: string | null;
    rowsTotal: number | null;
    rowsSuccess: number | null;
    rowsFailed: number | null;
    error: string | null;
    isActive: boolean | null;
    replacedFileId: bigint | null;
    createdAt: Date | null;
    finishedAt: Date | null;
    updatedAt: Date | null;
};
export type DlImportFileCountAggregateOutputType = {
    id: number;
    batchId: number;
    originalFileName: number;
    fileHash: number;
    status: number;
    rowsTotal: number;
    rowsSuccess: number;
    rowsFailed: number;
    error: number;
    isActive: number;
    replacedFileId: number;
    createdAt: number;
    finishedAt: number;
    updatedAt: number;
    _all: number;
};
export type DlImportFileAvgAggregateInputType = {
    id?: true;
    batchId?: true;
    rowsTotal?: true;
    rowsSuccess?: true;
    rowsFailed?: true;
    replacedFileId?: true;
};
export type DlImportFileSumAggregateInputType = {
    id?: true;
    batchId?: true;
    rowsTotal?: true;
    rowsSuccess?: true;
    rowsFailed?: true;
    replacedFileId?: true;
};
export type DlImportFileMinAggregateInputType = {
    id?: true;
    batchId?: true;
    originalFileName?: true;
    fileHash?: true;
    status?: true;
    rowsTotal?: true;
    rowsSuccess?: true;
    rowsFailed?: true;
    error?: true;
    isActive?: true;
    replacedFileId?: true;
    createdAt?: true;
    finishedAt?: true;
    updatedAt?: true;
};
export type DlImportFileMaxAggregateInputType = {
    id?: true;
    batchId?: true;
    originalFileName?: true;
    fileHash?: true;
    status?: true;
    rowsTotal?: true;
    rowsSuccess?: true;
    rowsFailed?: true;
    error?: true;
    isActive?: true;
    replacedFileId?: true;
    createdAt?: true;
    finishedAt?: true;
    updatedAt?: true;
};
export type DlImportFileCountAggregateInputType = {
    id?: true;
    batchId?: true;
    originalFileName?: true;
    fileHash?: true;
    status?: true;
    rowsTotal?: true;
    rowsSuccess?: true;
    rowsFailed?: true;
    error?: true;
    isActive?: true;
    replacedFileId?: true;
    createdAt?: true;
    finishedAt?: true;
    updatedAt?: true;
    _all?: true;
};
export type DlImportFileAggregateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.DlImportFileWhereInput;
    orderBy?: Prisma.DlImportFileOrderByWithRelationInput | Prisma.DlImportFileOrderByWithRelationInput[];
    cursor?: Prisma.DlImportFileWhereUniqueInput;
    take?: number;
    skip?: number;
    _count?: true | DlImportFileCountAggregateInputType;
    _avg?: DlImportFileAvgAggregateInputType;
    _sum?: DlImportFileSumAggregateInputType;
    _min?: DlImportFileMinAggregateInputType;
    _max?: DlImportFileMaxAggregateInputType;
};
export type GetDlImportFileAggregateType<T extends DlImportFileAggregateArgs> = {
    [P in keyof T & keyof AggregateDlImportFile]: P extends '_count' | 'count' ? T[P] extends true ? number : Prisma.GetScalarType<T[P], AggregateDlImportFile[P]> : Prisma.GetScalarType<T[P], AggregateDlImportFile[P]>;
};
export type DlImportFileGroupByArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.DlImportFileWhereInput;
    orderBy?: Prisma.DlImportFileOrderByWithAggregationInput | Prisma.DlImportFileOrderByWithAggregationInput[];
    by: Prisma.DlImportFileScalarFieldEnum[] | Prisma.DlImportFileScalarFieldEnum;
    having?: Prisma.DlImportFileScalarWhereWithAggregatesInput;
    take?: number;
    skip?: number;
    _count?: DlImportFileCountAggregateInputType | true;
    _avg?: DlImportFileAvgAggregateInputType;
    _sum?: DlImportFileSumAggregateInputType;
    _min?: DlImportFileMinAggregateInputType;
    _max?: DlImportFileMaxAggregateInputType;
};
export type DlImportFileGroupByOutputType = {
    id: bigint;
    batchId: bigint;
    originalFileName: string;
    fileHash: string | null;
    status: string;
    rowsTotal: number;
    rowsSuccess: number;
    rowsFailed: number;
    error: string | null;
    isActive: boolean;
    replacedFileId: bigint | null;
    createdAt: Date;
    finishedAt: Date | null;
    updatedAt: Date;
    _count: DlImportFileCountAggregateOutputType | null;
    _avg: DlImportFileAvgAggregateOutputType | null;
    _sum: DlImportFileSumAggregateOutputType | null;
    _min: DlImportFileMinAggregateOutputType | null;
    _max: DlImportFileMaxAggregateOutputType | null;
};
type GetDlImportFileGroupByPayload<T extends DlImportFileGroupByArgs> = Prisma.PrismaPromise<Array<Prisma.PickEnumerable<DlImportFileGroupByOutputType, T['by']> & {
    [P in ((keyof T) & (keyof DlImportFileGroupByOutputType))]: P extends '_count' ? T[P] extends boolean ? number : Prisma.GetScalarType<T[P], DlImportFileGroupByOutputType[P]> : Prisma.GetScalarType<T[P], DlImportFileGroupByOutputType[P]>;
}>>;
export type DlImportFileWhereInput = {
    AND?: Prisma.DlImportFileWhereInput | Prisma.DlImportFileWhereInput[];
    OR?: Prisma.DlImportFileWhereInput[];
    NOT?: Prisma.DlImportFileWhereInput | Prisma.DlImportFileWhereInput[];
    id?: Prisma.BigIntFilter<"DlImportFile"> | bigint | number;
    batchId?: Prisma.BigIntFilter<"DlImportFile"> | bigint | number;
    originalFileName?: Prisma.StringFilter<"DlImportFile"> | string;
    fileHash?: Prisma.StringNullableFilter<"DlImportFile"> | string | null;
    status?: Prisma.StringFilter<"DlImportFile"> | string;
    rowsTotal?: Prisma.IntFilter<"DlImportFile"> | number;
    rowsSuccess?: Prisma.IntFilter<"DlImportFile"> | number;
    rowsFailed?: Prisma.IntFilter<"DlImportFile"> | number;
    error?: Prisma.StringNullableFilter<"DlImportFile"> | string | null;
    isActive?: Prisma.BoolFilter<"DlImportFile"> | boolean;
    replacedFileId?: Prisma.BigIntNullableFilter<"DlImportFile"> | bigint | number | null;
    createdAt?: Prisma.DateTimeFilter<"DlImportFile"> | Date | string;
    finishedAt?: Prisma.DateTimeNullableFilter<"DlImportFile"> | Date | string | null;
    updatedAt?: Prisma.DateTimeFilter<"DlImportFile"> | Date | string;
    batch?: Prisma.XOR<Prisma.DlImportBatchScalarRelationFilter, Prisma.DlImportBatchWhereInput>;
    contacts?: Prisma.DlContactListRelationFilter;
    replacedFile?: Prisma.XOR<Prisma.DlImportFileNullableScalarRelationFilter, Prisma.DlImportFileWhereInput> | null;
    replacingFiles?: Prisma.DlImportFileListRelationFilter;
};
export type DlImportFileOrderByWithRelationInput = {
    id?: Prisma.SortOrder;
    batchId?: Prisma.SortOrder;
    originalFileName?: Prisma.SortOrder;
    fileHash?: Prisma.SortOrderInput | Prisma.SortOrder;
    status?: Prisma.SortOrder;
    rowsTotal?: Prisma.SortOrder;
    rowsSuccess?: Prisma.SortOrder;
    rowsFailed?: Prisma.SortOrder;
    error?: Prisma.SortOrderInput | Prisma.SortOrder;
    isActive?: Prisma.SortOrder;
    replacedFileId?: Prisma.SortOrderInput | Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    finishedAt?: Prisma.SortOrderInput | Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
    batch?: Prisma.DlImportBatchOrderByWithRelationInput;
    contacts?: Prisma.DlContactOrderByRelationAggregateInput;
    replacedFile?: Prisma.DlImportFileOrderByWithRelationInput;
    replacingFiles?: Prisma.DlImportFileOrderByRelationAggregateInput;
};
export type DlImportFileWhereUniqueInput = Prisma.AtLeast<{
    id?: bigint | number;
    AND?: Prisma.DlImportFileWhereInput | Prisma.DlImportFileWhereInput[];
    OR?: Prisma.DlImportFileWhereInput[];
    NOT?: Prisma.DlImportFileWhereInput | Prisma.DlImportFileWhereInput[];
    batchId?: Prisma.BigIntFilter<"DlImportFile"> | bigint | number;
    originalFileName?: Prisma.StringFilter<"DlImportFile"> | string;
    fileHash?: Prisma.StringNullableFilter<"DlImportFile"> | string | null;
    status?: Prisma.StringFilter<"DlImportFile"> | string;
    rowsTotal?: Prisma.IntFilter<"DlImportFile"> | number;
    rowsSuccess?: Prisma.IntFilter<"DlImportFile"> | number;
    rowsFailed?: Prisma.IntFilter<"DlImportFile"> | number;
    error?: Prisma.StringNullableFilter<"DlImportFile"> | string | null;
    isActive?: Prisma.BoolFilter<"DlImportFile"> | boolean;
    replacedFileId?: Prisma.BigIntNullableFilter<"DlImportFile"> | bigint | number | null;
    createdAt?: Prisma.DateTimeFilter<"DlImportFile"> | Date | string;
    finishedAt?: Prisma.DateTimeNullableFilter<"DlImportFile"> | Date | string | null;
    updatedAt?: Prisma.DateTimeFilter<"DlImportFile"> | Date | string;
    batch?: Prisma.XOR<Prisma.DlImportBatchScalarRelationFilter, Prisma.DlImportBatchWhereInput>;
    contacts?: Prisma.DlContactListRelationFilter;
    replacedFile?: Prisma.XOR<Prisma.DlImportFileNullableScalarRelationFilter, Prisma.DlImportFileWhereInput> | null;
    replacingFiles?: Prisma.DlImportFileListRelationFilter;
}, "id">;
export type DlImportFileOrderByWithAggregationInput = {
    id?: Prisma.SortOrder;
    batchId?: Prisma.SortOrder;
    originalFileName?: Prisma.SortOrder;
    fileHash?: Prisma.SortOrderInput | Prisma.SortOrder;
    status?: Prisma.SortOrder;
    rowsTotal?: Prisma.SortOrder;
    rowsSuccess?: Prisma.SortOrder;
    rowsFailed?: Prisma.SortOrder;
    error?: Prisma.SortOrderInput | Prisma.SortOrder;
    isActive?: Prisma.SortOrder;
    replacedFileId?: Prisma.SortOrderInput | Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    finishedAt?: Prisma.SortOrderInput | Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
    _count?: Prisma.DlImportFileCountOrderByAggregateInput;
    _avg?: Prisma.DlImportFileAvgOrderByAggregateInput;
    _max?: Prisma.DlImportFileMaxOrderByAggregateInput;
    _min?: Prisma.DlImportFileMinOrderByAggregateInput;
    _sum?: Prisma.DlImportFileSumOrderByAggregateInput;
};
export type DlImportFileScalarWhereWithAggregatesInput = {
    AND?: Prisma.DlImportFileScalarWhereWithAggregatesInput | Prisma.DlImportFileScalarWhereWithAggregatesInput[];
    OR?: Prisma.DlImportFileScalarWhereWithAggregatesInput[];
    NOT?: Prisma.DlImportFileScalarWhereWithAggregatesInput | Prisma.DlImportFileScalarWhereWithAggregatesInput[];
    id?: Prisma.BigIntWithAggregatesFilter<"DlImportFile"> | bigint | number;
    batchId?: Prisma.BigIntWithAggregatesFilter<"DlImportFile"> | bigint | number;
    originalFileName?: Prisma.StringWithAggregatesFilter<"DlImportFile"> | string;
    fileHash?: Prisma.StringNullableWithAggregatesFilter<"DlImportFile"> | string | null;
    status?: Prisma.StringWithAggregatesFilter<"DlImportFile"> | string;
    rowsTotal?: Prisma.IntWithAggregatesFilter<"DlImportFile"> | number;
    rowsSuccess?: Prisma.IntWithAggregatesFilter<"DlImportFile"> | number;
    rowsFailed?: Prisma.IntWithAggregatesFilter<"DlImportFile"> | number;
    error?: Prisma.StringNullableWithAggregatesFilter<"DlImportFile"> | string | null;
    isActive?: Prisma.BoolWithAggregatesFilter<"DlImportFile"> | boolean;
    replacedFileId?: Prisma.BigIntNullableWithAggregatesFilter<"DlImportFile"> | bigint | number | null;
    createdAt?: Prisma.DateTimeWithAggregatesFilter<"DlImportFile"> | Date | string;
    finishedAt?: Prisma.DateTimeNullableWithAggregatesFilter<"DlImportFile"> | Date | string | null;
    updatedAt?: Prisma.DateTimeWithAggregatesFilter<"DlImportFile"> | Date | string;
};
export type DlImportFileCreateInput = {
    id?: bigint | number;
    originalFileName: string;
    fileHash?: string | null;
    status: string;
    rowsTotal?: number;
    rowsSuccess?: number;
    rowsFailed?: number;
    error?: string | null;
    isActive?: boolean;
    createdAt?: Date | string;
    finishedAt?: Date | string | null;
    updatedAt?: Date | string;
    batch: Prisma.DlImportBatchCreateNestedOneWithoutFilesInput;
    contacts?: Prisma.DlContactCreateNestedManyWithoutImportFileInput;
    replacedFile?: Prisma.DlImportFileCreateNestedOneWithoutReplacingFilesInput;
    replacingFiles?: Prisma.DlImportFileCreateNestedManyWithoutReplacedFileInput;
};
export type DlImportFileUncheckedCreateInput = {
    id?: bigint | number;
    batchId: bigint | number;
    originalFileName: string;
    fileHash?: string | null;
    status: string;
    rowsTotal?: number;
    rowsSuccess?: number;
    rowsFailed?: number;
    error?: string | null;
    isActive?: boolean;
    replacedFileId?: bigint | number | null;
    createdAt?: Date | string;
    finishedAt?: Date | string | null;
    updatedAt?: Date | string;
    contacts?: Prisma.DlContactUncheckedCreateNestedManyWithoutImportFileInput;
    replacingFiles?: Prisma.DlImportFileUncheckedCreateNestedManyWithoutReplacedFileInput;
};
export type DlImportFileUpdateInput = {
    id?: Prisma.BigIntFieldUpdateOperationsInput | bigint | number;
    originalFileName?: Prisma.StringFieldUpdateOperationsInput | string;
    fileHash?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    status?: Prisma.StringFieldUpdateOperationsInput | string;
    rowsTotal?: Prisma.IntFieldUpdateOperationsInput | number;
    rowsSuccess?: Prisma.IntFieldUpdateOperationsInput | number;
    rowsFailed?: Prisma.IntFieldUpdateOperationsInput | number;
    error?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    isActive?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    finishedAt?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    batch?: Prisma.DlImportBatchUpdateOneRequiredWithoutFilesNestedInput;
    contacts?: Prisma.DlContactUpdateManyWithoutImportFileNestedInput;
    replacedFile?: Prisma.DlImportFileUpdateOneWithoutReplacingFilesNestedInput;
    replacingFiles?: Prisma.DlImportFileUpdateManyWithoutReplacedFileNestedInput;
};
export type DlImportFileUncheckedUpdateInput = {
    id?: Prisma.BigIntFieldUpdateOperationsInput | bigint | number;
    batchId?: Prisma.BigIntFieldUpdateOperationsInput | bigint | number;
    originalFileName?: Prisma.StringFieldUpdateOperationsInput | string;
    fileHash?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    status?: Prisma.StringFieldUpdateOperationsInput | string;
    rowsTotal?: Prisma.IntFieldUpdateOperationsInput | number;
    rowsSuccess?: Prisma.IntFieldUpdateOperationsInput | number;
    rowsFailed?: Prisma.IntFieldUpdateOperationsInput | number;
    error?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    isActive?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    replacedFileId?: Prisma.NullableBigIntFieldUpdateOperationsInput | bigint | number | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    finishedAt?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    contacts?: Prisma.DlContactUncheckedUpdateManyWithoutImportFileNestedInput;
    replacingFiles?: Prisma.DlImportFileUncheckedUpdateManyWithoutReplacedFileNestedInput;
};
export type DlImportFileCreateManyInput = {
    id?: bigint | number;
    batchId: bigint | number;
    originalFileName: string;
    fileHash?: string | null;
    status: string;
    rowsTotal?: number;
    rowsSuccess?: number;
    rowsFailed?: number;
    error?: string | null;
    isActive?: boolean;
    replacedFileId?: bigint | number | null;
    createdAt?: Date | string;
    finishedAt?: Date | string | null;
    updatedAt?: Date | string;
};
export type DlImportFileUpdateManyMutationInput = {
    id?: Prisma.BigIntFieldUpdateOperationsInput | bigint | number;
    originalFileName?: Prisma.StringFieldUpdateOperationsInput | string;
    fileHash?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    status?: Prisma.StringFieldUpdateOperationsInput | string;
    rowsTotal?: Prisma.IntFieldUpdateOperationsInput | number;
    rowsSuccess?: Prisma.IntFieldUpdateOperationsInput | number;
    rowsFailed?: Prisma.IntFieldUpdateOperationsInput | number;
    error?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    isActive?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    finishedAt?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type DlImportFileUncheckedUpdateManyInput = {
    id?: Prisma.BigIntFieldUpdateOperationsInput | bigint | number;
    batchId?: Prisma.BigIntFieldUpdateOperationsInput | bigint | number;
    originalFileName?: Prisma.StringFieldUpdateOperationsInput | string;
    fileHash?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    status?: Prisma.StringFieldUpdateOperationsInput | string;
    rowsTotal?: Prisma.IntFieldUpdateOperationsInput | number;
    rowsSuccess?: Prisma.IntFieldUpdateOperationsInput | number;
    rowsFailed?: Prisma.IntFieldUpdateOperationsInput | number;
    error?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    isActive?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    replacedFileId?: Prisma.NullableBigIntFieldUpdateOperationsInput | bigint | number | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    finishedAt?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type DlImportFileListRelationFilter = {
    every?: Prisma.DlImportFileWhereInput;
    some?: Prisma.DlImportFileWhereInput;
    none?: Prisma.DlImportFileWhereInput;
};
export type DlImportFileOrderByRelationAggregateInput = {
    _count?: Prisma.SortOrder;
};
export type DlImportFileNullableScalarRelationFilter = {
    is?: Prisma.DlImportFileWhereInput | null;
    isNot?: Prisma.DlImportFileWhereInput | null;
};
export type DlImportFileCountOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    batchId?: Prisma.SortOrder;
    originalFileName?: Prisma.SortOrder;
    fileHash?: Prisma.SortOrder;
    status?: Prisma.SortOrder;
    rowsTotal?: Prisma.SortOrder;
    rowsSuccess?: Prisma.SortOrder;
    rowsFailed?: Prisma.SortOrder;
    error?: Prisma.SortOrder;
    isActive?: Prisma.SortOrder;
    replacedFileId?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    finishedAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
};
export type DlImportFileAvgOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    batchId?: Prisma.SortOrder;
    rowsTotal?: Prisma.SortOrder;
    rowsSuccess?: Prisma.SortOrder;
    rowsFailed?: Prisma.SortOrder;
    replacedFileId?: Prisma.SortOrder;
};
export type DlImportFileMaxOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    batchId?: Prisma.SortOrder;
    originalFileName?: Prisma.SortOrder;
    fileHash?: Prisma.SortOrder;
    status?: Prisma.SortOrder;
    rowsTotal?: Prisma.SortOrder;
    rowsSuccess?: Prisma.SortOrder;
    rowsFailed?: Prisma.SortOrder;
    error?: Prisma.SortOrder;
    isActive?: Prisma.SortOrder;
    replacedFileId?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    finishedAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
};
export type DlImportFileMinOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    batchId?: Prisma.SortOrder;
    originalFileName?: Prisma.SortOrder;
    fileHash?: Prisma.SortOrder;
    status?: Prisma.SortOrder;
    rowsTotal?: Prisma.SortOrder;
    rowsSuccess?: Prisma.SortOrder;
    rowsFailed?: Prisma.SortOrder;
    error?: Prisma.SortOrder;
    isActive?: Prisma.SortOrder;
    replacedFileId?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    finishedAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
};
export type DlImportFileSumOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    batchId?: Prisma.SortOrder;
    rowsTotal?: Prisma.SortOrder;
    rowsSuccess?: Prisma.SortOrder;
    rowsFailed?: Prisma.SortOrder;
    replacedFileId?: Prisma.SortOrder;
};
export type DlImportFileScalarRelationFilter = {
    is?: Prisma.DlImportFileWhereInput;
    isNot?: Prisma.DlImportFileWhereInput;
};
export type DlImportFileCreateNestedManyWithoutBatchInput = {
    create?: Prisma.XOR<Prisma.DlImportFileCreateWithoutBatchInput, Prisma.DlImportFileUncheckedCreateWithoutBatchInput> | Prisma.DlImportFileCreateWithoutBatchInput[] | Prisma.DlImportFileUncheckedCreateWithoutBatchInput[];
    connectOrCreate?: Prisma.DlImportFileCreateOrConnectWithoutBatchInput | Prisma.DlImportFileCreateOrConnectWithoutBatchInput[];
    createMany?: Prisma.DlImportFileCreateManyBatchInputEnvelope;
    connect?: Prisma.DlImportFileWhereUniqueInput | Prisma.DlImportFileWhereUniqueInput[];
};
export type DlImportFileUncheckedCreateNestedManyWithoutBatchInput = {
    create?: Prisma.XOR<Prisma.DlImportFileCreateWithoutBatchInput, Prisma.DlImportFileUncheckedCreateWithoutBatchInput> | Prisma.DlImportFileCreateWithoutBatchInput[] | Prisma.DlImportFileUncheckedCreateWithoutBatchInput[];
    connectOrCreate?: Prisma.DlImportFileCreateOrConnectWithoutBatchInput | Prisma.DlImportFileCreateOrConnectWithoutBatchInput[];
    createMany?: Prisma.DlImportFileCreateManyBatchInputEnvelope;
    connect?: Prisma.DlImportFileWhereUniqueInput | Prisma.DlImportFileWhereUniqueInput[];
};
export type DlImportFileUpdateManyWithoutBatchNestedInput = {
    create?: Prisma.XOR<Prisma.DlImportFileCreateWithoutBatchInput, Prisma.DlImportFileUncheckedCreateWithoutBatchInput> | Prisma.DlImportFileCreateWithoutBatchInput[] | Prisma.DlImportFileUncheckedCreateWithoutBatchInput[];
    connectOrCreate?: Prisma.DlImportFileCreateOrConnectWithoutBatchInput | Prisma.DlImportFileCreateOrConnectWithoutBatchInput[];
    upsert?: Prisma.DlImportFileUpsertWithWhereUniqueWithoutBatchInput | Prisma.DlImportFileUpsertWithWhereUniqueWithoutBatchInput[];
    createMany?: Prisma.DlImportFileCreateManyBatchInputEnvelope;
    set?: Prisma.DlImportFileWhereUniqueInput | Prisma.DlImportFileWhereUniqueInput[];
    disconnect?: Prisma.DlImportFileWhereUniqueInput | Prisma.DlImportFileWhereUniqueInput[];
    delete?: Prisma.DlImportFileWhereUniqueInput | Prisma.DlImportFileWhereUniqueInput[];
    connect?: Prisma.DlImportFileWhereUniqueInput | Prisma.DlImportFileWhereUniqueInput[];
    update?: Prisma.DlImportFileUpdateWithWhereUniqueWithoutBatchInput | Prisma.DlImportFileUpdateWithWhereUniqueWithoutBatchInput[];
    updateMany?: Prisma.DlImportFileUpdateManyWithWhereWithoutBatchInput | Prisma.DlImportFileUpdateManyWithWhereWithoutBatchInput[];
    deleteMany?: Prisma.DlImportFileScalarWhereInput | Prisma.DlImportFileScalarWhereInput[];
};
export type DlImportFileUncheckedUpdateManyWithoutBatchNestedInput = {
    create?: Prisma.XOR<Prisma.DlImportFileCreateWithoutBatchInput, Prisma.DlImportFileUncheckedCreateWithoutBatchInput> | Prisma.DlImportFileCreateWithoutBatchInput[] | Prisma.DlImportFileUncheckedCreateWithoutBatchInput[];
    connectOrCreate?: Prisma.DlImportFileCreateOrConnectWithoutBatchInput | Prisma.DlImportFileCreateOrConnectWithoutBatchInput[];
    upsert?: Prisma.DlImportFileUpsertWithWhereUniqueWithoutBatchInput | Prisma.DlImportFileUpsertWithWhereUniqueWithoutBatchInput[];
    createMany?: Prisma.DlImportFileCreateManyBatchInputEnvelope;
    set?: Prisma.DlImportFileWhereUniqueInput | Prisma.DlImportFileWhereUniqueInput[];
    disconnect?: Prisma.DlImportFileWhereUniqueInput | Prisma.DlImportFileWhereUniqueInput[];
    delete?: Prisma.DlImportFileWhereUniqueInput | Prisma.DlImportFileWhereUniqueInput[];
    connect?: Prisma.DlImportFileWhereUniqueInput | Prisma.DlImportFileWhereUniqueInput[];
    update?: Prisma.DlImportFileUpdateWithWhereUniqueWithoutBatchInput | Prisma.DlImportFileUpdateWithWhereUniqueWithoutBatchInput[];
    updateMany?: Prisma.DlImportFileUpdateManyWithWhereWithoutBatchInput | Prisma.DlImportFileUpdateManyWithWhereWithoutBatchInput[];
    deleteMany?: Prisma.DlImportFileScalarWhereInput | Prisma.DlImportFileScalarWhereInput[];
};
export type DlImportFileCreateNestedOneWithoutReplacingFilesInput = {
    create?: Prisma.XOR<Prisma.DlImportFileCreateWithoutReplacingFilesInput, Prisma.DlImportFileUncheckedCreateWithoutReplacingFilesInput>;
    connectOrCreate?: Prisma.DlImportFileCreateOrConnectWithoutReplacingFilesInput;
    connect?: Prisma.DlImportFileWhereUniqueInput;
};
export type DlImportFileCreateNestedManyWithoutReplacedFileInput = {
    create?: Prisma.XOR<Prisma.DlImportFileCreateWithoutReplacedFileInput, Prisma.DlImportFileUncheckedCreateWithoutReplacedFileInput> | Prisma.DlImportFileCreateWithoutReplacedFileInput[] | Prisma.DlImportFileUncheckedCreateWithoutReplacedFileInput[];
    connectOrCreate?: Prisma.DlImportFileCreateOrConnectWithoutReplacedFileInput | Prisma.DlImportFileCreateOrConnectWithoutReplacedFileInput[];
    createMany?: Prisma.DlImportFileCreateManyReplacedFileInputEnvelope;
    connect?: Prisma.DlImportFileWhereUniqueInput | Prisma.DlImportFileWhereUniqueInput[];
};
export type DlImportFileUncheckedCreateNestedManyWithoutReplacedFileInput = {
    create?: Prisma.XOR<Prisma.DlImportFileCreateWithoutReplacedFileInput, Prisma.DlImportFileUncheckedCreateWithoutReplacedFileInput> | Prisma.DlImportFileCreateWithoutReplacedFileInput[] | Prisma.DlImportFileUncheckedCreateWithoutReplacedFileInput[];
    connectOrCreate?: Prisma.DlImportFileCreateOrConnectWithoutReplacedFileInput | Prisma.DlImportFileCreateOrConnectWithoutReplacedFileInput[];
    createMany?: Prisma.DlImportFileCreateManyReplacedFileInputEnvelope;
    connect?: Prisma.DlImportFileWhereUniqueInput | Prisma.DlImportFileWhereUniqueInput[];
};
export type DlImportFileUpdateOneWithoutReplacingFilesNestedInput = {
    create?: Prisma.XOR<Prisma.DlImportFileCreateWithoutReplacingFilesInput, Prisma.DlImportFileUncheckedCreateWithoutReplacingFilesInput>;
    connectOrCreate?: Prisma.DlImportFileCreateOrConnectWithoutReplacingFilesInput;
    upsert?: Prisma.DlImportFileUpsertWithoutReplacingFilesInput;
    disconnect?: Prisma.DlImportFileWhereInput | boolean;
    delete?: Prisma.DlImportFileWhereInput | boolean;
    connect?: Prisma.DlImportFileWhereUniqueInput;
    update?: Prisma.XOR<Prisma.XOR<Prisma.DlImportFileUpdateToOneWithWhereWithoutReplacingFilesInput, Prisma.DlImportFileUpdateWithoutReplacingFilesInput>, Prisma.DlImportFileUncheckedUpdateWithoutReplacingFilesInput>;
};
export type DlImportFileUpdateManyWithoutReplacedFileNestedInput = {
    create?: Prisma.XOR<Prisma.DlImportFileCreateWithoutReplacedFileInput, Prisma.DlImportFileUncheckedCreateWithoutReplacedFileInput> | Prisma.DlImportFileCreateWithoutReplacedFileInput[] | Prisma.DlImportFileUncheckedCreateWithoutReplacedFileInput[];
    connectOrCreate?: Prisma.DlImportFileCreateOrConnectWithoutReplacedFileInput | Prisma.DlImportFileCreateOrConnectWithoutReplacedFileInput[];
    upsert?: Prisma.DlImportFileUpsertWithWhereUniqueWithoutReplacedFileInput | Prisma.DlImportFileUpsertWithWhereUniqueWithoutReplacedFileInput[];
    createMany?: Prisma.DlImportFileCreateManyReplacedFileInputEnvelope;
    set?: Prisma.DlImportFileWhereUniqueInput | Prisma.DlImportFileWhereUniqueInput[];
    disconnect?: Prisma.DlImportFileWhereUniqueInput | Prisma.DlImportFileWhereUniqueInput[];
    delete?: Prisma.DlImportFileWhereUniqueInput | Prisma.DlImportFileWhereUniqueInput[];
    connect?: Prisma.DlImportFileWhereUniqueInput | Prisma.DlImportFileWhereUniqueInput[];
    update?: Prisma.DlImportFileUpdateWithWhereUniqueWithoutReplacedFileInput | Prisma.DlImportFileUpdateWithWhereUniqueWithoutReplacedFileInput[];
    updateMany?: Prisma.DlImportFileUpdateManyWithWhereWithoutReplacedFileInput | Prisma.DlImportFileUpdateManyWithWhereWithoutReplacedFileInput[];
    deleteMany?: Prisma.DlImportFileScalarWhereInput | Prisma.DlImportFileScalarWhereInput[];
};
export type DlImportFileUncheckedUpdateManyWithoutReplacedFileNestedInput = {
    create?: Prisma.XOR<Prisma.DlImportFileCreateWithoutReplacedFileInput, Prisma.DlImportFileUncheckedCreateWithoutReplacedFileInput> | Prisma.DlImportFileCreateWithoutReplacedFileInput[] | Prisma.DlImportFileUncheckedCreateWithoutReplacedFileInput[];
    connectOrCreate?: Prisma.DlImportFileCreateOrConnectWithoutReplacedFileInput | Prisma.DlImportFileCreateOrConnectWithoutReplacedFileInput[];
    upsert?: Prisma.DlImportFileUpsertWithWhereUniqueWithoutReplacedFileInput | Prisma.DlImportFileUpsertWithWhereUniqueWithoutReplacedFileInput[];
    createMany?: Prisma.DlImportFileCreateManyReplacedFileInputEnvelope;
    set?: Prisma.DlImportFileWhereUniqueInput | Prisma.DlImportFileWhereUniqueInput[];
    disconnect?: Prisma.DlImportFileWhereUniqueInput | Prisma.DlImportFileWhereUniqueInput[];
    delete?: Prisma.DlImportFileWhereUniqueInput | Prisma.DlImportFileWhereUniqueInput[];
    connect?: Prisma.DlImportFileWhereUniqueInput | Prisma.DlImportFileWhereUniqueInput[];
    update?: Prisma.DlImportFileUpdateWithWhereUniqueWithoutReplacedFileInput | Prisma.DlImportFileUpdateWithWhereUniqueWithoutReplacedFileInput[];
    updateMany?: Prisma.DlImportFileUpdateManyWithWhereWithoutReplacedFileInput | Prisma.DlImportFileUpdateManyWithWhereWithoutReplacedFileInput[];
    deleteMany?: Prisma.DlImportFileScalarWhereInput | Prisma.DlImportFileScalarWhereInput[];
};
export type DlImportFileCreateNestedOneWithoutContactsInput = {
    create?: Prisma.XOR<Prisma.DlImportFileCreateWithoutContactsInput, Prisma.DlImportFileUncheckedCreateWithoutContactsInput>;
    connectOrCreate?: Prisma.DlImportFileCreateOrConnectWithoutContactsInput;
    connect?: Prisma.DlImportFileWhereUniqueInput;
};
export type DlImportFileUpdateOneRequiredWithoutContactsNestedInput = {
    create?: Prisma.XOR<Prisma.DlImportFileCreateWithoutContactsInput, Prisma.DlImportFileUncheckedCreateWithoutContactsInput>;
    connectOrCreate?: Prisma.DlImportFileCreateOrConnectWithoutContactsInput;
    upsert?: Prisma.DlImportFileUpsertWithoutContactsInput;
    connect?: Prisma.DlImportFileWhereUniqueInput;
    update?: Prisma.XOR<Prisma.XOR<Prisma.DlImportFileUpdateToOneWithWhereWithoutContactsInput, Prisma.DlImportFileUpdateWithoutContactsInput>, Prisma.DlImportFileUncheckedUpdateWithoutContactsInput>;
};
export type DlImportFileCreateWithoutBatchInput = {
    id?: bigint | number;
    originalFileName: string;
    fileHash?: string | null;
    status: string;
    rowsTotal?: number;
    rowsSuccess?: number;
    rowsFailed?: number;
    error?: string | null;
    isActive?: boolean;
    createdAt?: Date | string;
    finishedAt?: Date | string | null;
    updatedAt?: Date | string;
    contacts?: Prisma.DlContactCreateNestedManyWithoutImportFileInput;
    replacedFile?: Prisma.DlImportFileCreateNestedOneWithoutReplacingFilesInput;
    replacingFiles?: Prisma.DlImportFileCreateNestedManyWithoutReplacedFileInput;
};
export type DlImportFileUncheckedCreateWithoutBatchInput = {
    id?: bigint | number;
    originalFileName: string;
    fileHash?: string | null;
    status: string;
    rowsTotal?: number;
    rowsSuccess?: number;
    rowsFailed?: number;
    error?: string | null;
    isActive?: boolean;
    replacedFileId?: bigint | number | null;
    createdAt?: Date | string;
    finishedAt?: Date | string | null;
    updatedAt?: Date | string;
    contacts?: Prisma.DlContactUncheckedCreateNestedManyWithoutImportFileInput;
    replacingFiles?: Prisma.DlImportFileUncheckedCreateNestedManyWithoutReplacedFileInput;
};
export type DlImportFileCreateOrConnectWithoutBatchInput = {
    where: Prisma.DlImportFileWhereUniqueInput;
    create: Prisma.XOR<Prisma.DlImportFileCreateWithoutBatchInput, Prisma.DlImportFileUncheckedCreateWithoutBatchInput>;
};
export type DlImportFileCreateManyBatchInputEnvelope = {
    data: Prisma.DlImportFileCreateManyBatchInput | Prisma.DlImportFileCreateManyBatchInput[];
    skipDuplicates?: boolean;
};
export type DlImportFileUpsertWithWhereUniqueWithoutBatchInput = {
    where: Prisma.DlImportFileWhereUniqueInput;
    update: Prisma.XOR<Prisma.DlImportFileUpdateWithoutBatchInput, Prisma.DlImportFileUncheckedUpdateWithoutBatchInput>;
    create: Prisma.XOR<Prisma.DlImportFileCreateWithoutBatchInput, Prisma.DlImportFileUncheckedCreateWithoutBatchInput>;
};
export type DlImportFileUpdateWithWhereUniqueWithoutBatchInput = {
    where: Prisma.DlImportFileWhereUniqueInput;
    data: Prisma.XOR<Prisma.DlImportFileUpdateWithoutBatchInput, Prisma.DlImportFileUncheckedUpdateWithoutBatchInput>;
};
export type DlImportFileUpdateManyWithWhereWithoutBatchInput = {
    where: Prisma.DlImportFileScalarWhereInput;
    data: Prisma.XOR<Prisma.DlImportFileUpdateManyMutationInput, Prisma.DlImportFileUncheckedUpdateManyWithoutBatchInput>;
};
export type DlImportFileScalarWhereInput = {
    AND?: Prisma.DlImportFileScalarWhereInput | Prisma.DlImportFileScalarWhereInput[];
    OR?: Prisma.DlImportFileScalarWhereInput[];
    NOT?: Prisma.DlImportFileScalarWhereInput | Prisma.DlImportFileScalarWhereInput[];
    id?: Prisma.BigIntFilter<"DlImportFile"> | bigint | number;
    batchId?: Prisma.BigIntFilter<"DlImportFile"> | bigint | number;
    originalFileName?: Prisma.StringFilter<"DlImportFile"> | string;
    fileHash?: Prisma.StringNullableFilter<"DlImportFile"> | string | null;
    status?: Prisma.StringFilter<"DlImportFile"> | string;
    rowsTotal?: Prisma.IntFilter<"DlImportFile"> | number;
    rowsSuccess?: Prisma.IntFilter<"DlImportFile"> | number;
    rowsFailed?: Prisma.IntFilter<"DlImportFile"> | number;
    error?: Prisma.StringNullableFilter<"DlImportFile"> | string | null;
    isActive?: Prisma.BoolFilter<"DlImportFile"> | boolean;
    replacedFileId?: Prisma.BigIntNullableFilter<"DlImportFile"> | bigint | number | null;
    createdAt?: Prisma.DateTimeFilter<"DlImportFile"> | Date | string;
    finishedAt?: Prisma.DateTimeNullableFilter<"DlImportFile"> | Date | string | null;
    updatedAt?: Prisma.DateTimeFilter<"DlImportFile"> | Date | string;
};
export type DlImportFileCreateWithoutReplacingFilesInput = {
    id?: bigint | number;
    originalFileName: string;
    fileHash?: string | null;
    status: string;
    rowsTotal?: number;
    rowsSuccess?: number;
    rowsFailed?: number;
    error?: string | null;
    isActive?: boolean;
    createdAt?: Date | string;
    finishedAt?: Date | string | null;
    updatedAt?: Date | string;
    batch: Prisma.DlImportBatchCreateNestedOneWithoutFilesInput;
    contacts?: Prisma.DlContactCreateNestedManyWithoutImportFileInput;
    replacedFile?: Prisma.DlImportFileCreateNestedOneWithoutReplacingFilesInput;
};
export type DlImportFileUncheckedCreateWithoutReplacingFilesInput = {
    id?: bigint | number;
    batchId: bigint | number;
    originalFileName: string;
    fileHash?: string | null;
    status: string;
    rowsTotal?: number;
    rowsSuccess?: number;
    rowsFailed?: number;
    error?: string | null;
    isActive?: boolean;
    replacedFileId?: bigint | number | null;
    createdAt?: Date | string;
    finishedAt?: Date | string | null;
    updatedAt?: Date | string;
    contacts?: Prisma.DlContactUncheckedCreateNestedManyWithoutImportFileInput;
};
export type DlImportFileCreateOrConnectWithoutReplacingFilesInput = {
    where: Prisma.DlImportFileWhereUniqueInput;
    create: Prisma.XOR<Prisma.DlImportFileCreateWithoutReplacingFilesInput, Prisma.DlImportFileUncheckedCreateWithoutReplacingFilesInput>;
};
export type DlImportFileCreateWithoutReplacedFileInput = {
    id?: bigint | number;
    originalFileName: string;
    fileHash?: string | null;
    status: string;
    rowsTotal?: number;
    rowsSuccess?: number;
    rowsFailed?: number;
    error?: string | null;
    isActive?: boolean;
    createdAt?: Date | string;
    finishedAt?: Date | string | null;
    updatedAt?: Date | string;
    batch: Prisma.DlImportBatchCreateNestedOneWithoutFilesInput;
    contacts?: Prisma.DlContactCreateNestedManyWithoutImportFileInput;
    replacingFiles?: Prisma.DlImportFileCreateNestedManyWithoutReplacedFileInput;
};
export type DlImportFileUncheckedCreateWithoutReplacedFileInput = {
    id?: bigint | number;
    batchId: bigint | number;
    originalFileName: string;
    fileHash?: string | null;
    status: string;
    rowsTotal?: number;
    rowsSuccess?: number;
    rowsFailed?: number;
    error?: string | null;
    isActive?: boolean;
    createdAt?: Date | string;
    finishedAt?: Date | string | null;
    updatedAt?: Date | string;
    contacts?: Prisma.DlContactUncheckedCreateNestedManyWithoutImportFileInput;
    replacingFiles?: Prisma.DlImportFileUncheckedCreateNestedManyWithoutReplacedFileInput;
};
export type DlImportFileCreateOrConnectWithoutReplacedFileInput = {
    where: Prisma.DlImportFileWhereUniqueInput;
    create: Prisma.XOR<Prisma.DlImportFileCreateWithoutReplacedFileInput, Prisma.DlImportFileUncheckedCreateWithoutReplacedFileInput>;
};
export type DlImportFileCreateManyReplacedFileInputEnvelope = {
    data: Prisma.DlImportFileCreateManyReplacedFileInput | Prisma.DlImportFileCreateManyReplacedFileInput[];
    skipDuplicates?: boolean;
};
export type DlImportFileUpsertWithoutReplacingFilesInput = {
    update: Prisma.XOR<Prisma.DlImportFileUpdateWithoutReplacingFilesInput, Prisma.DlImportFileUncheckedUpdateWithoutReplacingFilesInput>;
    create: Prisma.XOR<Prisma.DlImportFileCreateWithoutReplacingFilesInput, Prisma.DlImportFileUncheckedCreateWithoutReplacingFilesInput>;
    where?: Prisma.DlImportFileWhereInput;
};
export type DlImportFileUpdateToOneWithWhereWithoutReplacingFilesInput = {
    where?: Prisma.DlImportFileWhereInput;
    data: Prisma.XOR<Prisma.DlImportFileUpdateWithoutReplacingFilesInput, Prisma.DlImportFileUncheckedUpdateWithoutReplacingFilesInput>;
};
export type DlImportFileUpdateWithoutReplacingFilesInput = {
    id?: Prisma.BigIntFieldUpdateOperationsInput | bigint | number;
    originalFileName?: Prisma.StringFieldUpdateOperationsInput | string;
    fileHash?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    status?: Prisma.StringFieldUpdateOperationsInput | string;
    rowsTotal?: Prisma.IntFieldUpdateOperationsInput | number;
    rowsSuccess?: Prisma.IntFieldUpdateOperationsInput | number;
    rowsFailed?: Prisma.IntFieldUpdateOperationsInput | number;
    error?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    isActive?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    finishedAt?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    batch?: Prisma.DlImportBatchUpdateOneRequiredWithoutFilesNestedInput;
    contacts?: Prisma.DlContactUpdateManyWithoutImportFileNestedInput;
    replacedFile?: Prisma.DlImportFileUpdateOneWithoutReplacingFilesNestedInput;
};
export type DlImportFileUncheckedUpdateWithoutReplacingFilesInput = {
    id?: Prisma.BigIntFieldUpdateOperationsInput | bigint | number;
    batchId?: Prisma.BigIntFieldUpdateOperationsInput | bigint | number;
    originalFileName?: Prisma.StringFieldUpdateOperationsInput | string;
    fileHash?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    status?: Prisma.StringFieldUpdateOperationsInput | string;
    rowsTotal?: Prisma.IntFieldUpdateOperationsInput | number;
    rowsSuccess?: Prisma.IntFieldUpdateOperationsInput | number;
    rowsFailed?: Prisma.IntFieldUpdateOperationsInput | number;
    error?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    isActive?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    replacedFileId?: Prisma.NullableBigIntFieldUpdateOperationsInput | bigint | number | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    finishedAt?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    contacts?: Prisma.DlContactUncheckedUpdateManyWithoutImportFileNestedInput;
};
export type DlImportFileUpsertWithWhereUniqueWithoutReplacedFileInput = {
    where: Prisma.DlImportFileWhereUniqueInput;
    update: Prisma.XOR<Prisma.DlImportFileUpdateWithoutReplacedFileInput, Prisma.DlImportFileUncheckedUpdateWithoutReplacedFileInput>;
    create: Prisma.XOR<Prisma.DlImportFileCreateWithoutReplacedFileInput, Prisma.DlImportFileUncheckedCreateWithoutReplacedFileInput>;
};
export type DlImportFileUpdateWithWhereUniqueWithoutReplacedFileInput = {
    where: Prisma.DlImportFileWhereUniqueInput;
    data: Prisma.XOR<Prisma.DlImportFileUpdateWithoutReplacedFileInput, Prisma.DlImportFileUncheckedUpdateWithoutReplacedFileInput>;
};
export type DlImportFileUpdateManyWithWhereWithoutReplacedFileInput = {
    where: Prisma.DlImportFileScalarWhereInput;
    data: Prisma.XOR<Prisma.DlImportFileUpdateManyMutationInput, Prisma.DlImportFileUncheckedUpdateManyWithoutReplacedFileInput>;
};
export type DlImportFileCreateWithoutContactsInput = {
    id?: bigint | number;
    originalFileName: string;
    fileHash?: string | null;
    status: string;
    rowsTotal?: number;
    rowsSuccess?: number;
    rowsFailed?: number;
    error?: string | null;
    isActive?: boolean;
    createdAt?: Date | string;
    finishedAt?: Date | string | null;
    updatedAt?: Date | string;
    batch: Prisma.DlImportBatchCreateNestedOneWithoutFilesInput;
    replacedFile?: Prisma.DlImportFileCreateNestedOneWithoutReplacingFilesInput;
    replacingFiles?: Prisma.DlImportFileCreateNestedManyWithoutReplacedFileInput;
};
export type DlImportFileUncheckedCreateWithoutContactsInput = {
    id?: bigint | number;
    batchId: bigint | number;
    originalFileName: string;
    fileHash?: string | null;
    status: string;
    rowsTotal?: number;
    rowsSuccess?: number;
    rowsFailed?: number;
    error?: string | null;
    isActive?: boolean;
    replacedFileId?: bigint | number | null;
    createdAt?: Date | string;
    finishedAt?: Date | string | null;
    updatedAt?: Date | string;
    replacingFiles?: Prisma.DlImportFileUncheckedCreateNestedManyWithoutReplacedFileInput;
};
export type DlImportFileCreateOrConnectWithoutContactsInput = {
    where: Prisma.DlImportFileWhereUniqueInput;
    create: Prisma.XOR<Prisma.DlImportFileCreateWithoutContactsInput, Prisma.DlImportFileUncheckedCreateWithoutContactsInput>;
};
export type DlImportFileUpsertWithoutContactsInput = {
    update: Prisma.XOR<Prisma.DlImportFileUpdateWithoutContactsInput, Prisma.DlImportFileUncheckedUpdateWithoutContactsInput>;
    create: Prisma.XOR<Prisma.DlImportFileCreateWithoutContactsInput, Prisma.DlImportFileUncheckedCreateWithoutContactsInput>;
    where?: Prisma.DlImportFileWhereInput;
};
export type DlImportFileUpdateToOneWithWhereWithoutContactsInput = {
    where?: Prisma.DlImportFileWhereInput;
    data: Prisma.XOR<Prisma.DlImportFileUpdateWithoutContactsInput, Prisma.DlImportFileUncheckedUpdateWithoutContactsInput>;
};
export type DlImportFileUpdateWithoutContactsInput = {
    id?: Prisma.BigIntFieldUpdateOperationsInput | bigint | number;
    originalFileName?: Prisma.StringFieldUpdateOperationsInput | string;
    fileHash?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    status?: Prisma.StringFieldUpdateOperationsInput | string;
    rowsTotal?: Prisma.IntFieldUpdateOperationsInput | number;
    rowsSuccess?: Prisma.IntFieldUpdateOperationsInput | number;
    rowsFailed?: Prisma.IntFieldUpdateOperationsInput | number;
    error?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    isActive?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    finishedAt?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    batch?: Prisma.DlImportBatchUpdateOneRequiredWithoutFilesNestedInput;
    replacedFile?: Prisma.DlImportFileUpdateOneWithoutReplacingFilesNestedInput;
    replacingFiles?: Prisma.DlImportFileUpdateManyWithoutReplacedFileNestedInput;
};
export type DlImportFileUncheckedUpdateWithoutContactsInput = {
    id?: Prisma.BigIntFieldUpdateOperationsInput | bigint | number;
    batchId?: Prisma.BigIntFieldUpdateOperationsInput | bigint | number;
    originalFileName?: Prisma.StringFieldUpdateOperationsInput | string;
    fileHash?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    status?: Prisma.StringFieldUpdateOperationsInput | string;
    rowsTotal?: Prisma.IntFieldUpdateOperationsInput | number;
    rowsSuccess?: Prisma.IntFieldUpdateOperationsInput | number;
    rowsFailed?: Prisma.IntFieldUpdateOperationsInput | number;
    error?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    isActive?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    replacedFileId?: Prisma.NullableBigIntFieldUpdateOperationsInput | bigint | number | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    finishedAt?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    replacingFiles?: Prisma.DlImportFileUncheckedUpdateManyWithoutReplacedFileNestedInput;
};
export type DlImportFileCreateManyBatchInput = {
    id?: bigint | number;
    originalFileName: string;
    fileHash?: string | null;
    status: string;
    rowsTotal?: number;
    rowsSuccess?: number;
    rowsFailed?: number;
    error?: string | null;
    isActive?: boolean;
    replacedFileId?: bigint | number | null;
    createdAt?: Date | string;
    finishedAt?: Date | string | null;
    updatedAt?: Date | string;
};
export type DlImportFileUpdateWithoutBatchInput = {
    id?: Prisma.BigIntFieldUpdateOperationsInput | bigint | number;
    originalFileName?: Prisma.StringFieldUpdateOperationsInput | string;
    fileHash?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    status?: Prisma.StringFieldUpdateOperationsInput | string;
    rowsTotal?: Prisma.IntFieldUpdateOperationsInput | number;
    rowsSuccess?: Prisma.IntFieldUpdateOperationsInput | number;
    rowsFailed?: Prisma.IntFieldUpdateOperationsInput | number;
    error?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    isActive?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    finishedAt?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    contacts?: Prisma.DlContactUpdateManyWithoutImportFileNestedInput;
    replacedFile?: Prisma.DlImportFileUpdateOneWithoutReplacingFilesNestedInput;
    replacingFiles?: Prisma.DlImportFileUpdateManyWithoutReplacedFileNestedInput;
};
export type DlImportFileUncheckedUpdateWithoutBatchInput = {
    id?: Prisma.BigIntFieldUpdateOperationsInput | bigint | number;
    originalFileName?: Prisma.StringFieldUpdateOperationsInput | string;
    fileHash?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    status?: Prisma.StringFieldUpdateOperationsInput | string;
    rowsTotal?: Prisma.IntFieldUpdateOperationsInput | number;
    rowsSuccess?: Prisma.IntFieldUpdateOperationsInput | number;
    rowsFailed?: Prisma.IntFieldUpdateOperationsInput | number;
    error?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    isActive?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    replacedFileId?: Prisma.NullableBigIntFieldUpdateOperationsInput | bigint | number | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    finishedAt?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    contacts?: Prisma.DlContactUncheckedUpdateManyWithoutImportFileNestedInput;
    replacingFiles?: Prisma.DlImportFileUncheckedUpdateManyWithoutReplacedFileNestedInput;
};
export type DlImportFileUncheckedUpdateManyWithoutBatchInput = {
    id?: Prisma.BigIntFieldUpdateOperationsInput | bigint | number;
    originalFileName?: Prisma.StringFieldUpdateOperationsInput | string;
    fileHash?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    status?: Prisma.StringFieldUpdateOperationsInput | string;
    rowsTotal?: Prisma.IntFieldUpdateOperationsInput | number;
    rowsSuccess?: Prisma.IntFieldUpdateOperationsInput | number;
    rowsFailed?: Prisma.IntFieldUpdateOperationsInput | number;
    error?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    isActive?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    replacedFileId?: Prisma.NullableBigIntFieldUpdateOperationsInput | bigint | number | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    finishedAt?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type DlImportFileCreateManyReplacedFileInput = {
    id?: bigint | number;
    batchId: bigint | number;
    originalFileName: string;
    fileHash?: string | null;
    status: string;
    rowsTotal?: number;
    rowsSuccess?: number;
    rowsFailed?: number;
    error?: string | null;
    isActive?: boolean;
    createdAt?: Date | string;
    finishedAt?: Date | string | null;
    updatedAt?: Date | string;
};
export type DlImportFileUpdateWithoutReplacedFileInput = {
    id?: Prisma.BigIntFieldUpdateOperationsInput | bigint | number;
    originalFileName?: Prisma.StringFieldUpdateOperationsInput | string;
    fileHash?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    status?: Prisma.StringFieldUpdateOperationsInput | string;
    rowsTotal?: Prisma.IntFieldUpdateOperationsInput | number;
    rowsSuccess?: Prisma.IntFieldUpdateOperationsInput | number;
    rowsFailed?: Prisma.IntFieldUpdateOperationsInput | number;
    error?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    isActive?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    finishedAt?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    batch?: Prisma.DlImportBatchUpdateOneRequiredWithoutFilesNestedInput;
    contacts?: Prisma.DlContactUpdateManyWithoutImportFileNestedInput;
    replacingFiles?: Prisma.DlImportFileUpdateManyWithoutReplacedFileNestedInput;
};
export type DlImportFileUncheckedUpdateWithoutReplacedFileInput = {
    id?: Prisma.BigIntFieldUpdateOperationsInput | bigint | number;
    batchId?: Prisma.BigIntFieldUpdateOperationsInput | bigint | number;
    originalFileName?: Prisma.StringFieldUpdateOperationsInput | string;
    fileHash?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    status?: Prisma.StringFieldUpdateOperationsInput | string;
    rowsTotal?: Prisma.IntFieldUpdateOperationsInput | number;
    rowsSuccess?: Prisma.IntFieldUpdateOperationsInput | number;
    rowsFailed?: Prisma.IntFieldUpdateOperationsInput | number;
    error?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    isActive?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    finishedAt?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    contacts?: Prisma.DlContactUncheckedUpdateManyWithoutImportFileNestedInput;
    replacingFiles?: Prisma.DlImportFileUncheckedUpdateManyWithoutReplacedFileNestedInput;
};
export type DlImportFileUncheckedUpdateManyWithoutReplacedFileInput = {
    id?: Prisma.BigIntFieldUpdateOperationsInput | bigint | number;
    batchId?: Prisma.BigIntFieldUpdateOperationsInput | bigint | number;
    originalFileName?: Prisma.StringFieldUpdateOperationsInput | string;
    fileHash?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    status?: Prisma.StringFieldUpdateOperationsInput | string;
    rowsTotal?: Prisma.IntFieldUpdateOperationsInput | number;
    rowsSuccess?: Prisma.IntFieldUpdateOperationsInput | number;
    rowsFailed?: Prisma.IntFieldUpdateOperationsInput | number;
    error?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    isActive?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    finishedAt?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type DlImportFileCountOutputType = {
    contacts: number;
    replacingFiles: number;
};
export type DlImportFileCountOutputTypeSelect<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    contacts?: boolean | DlImportFileCountOutputTypeCountContactsArgs;
    replacingFiles?: boolean | DlImportFileCountOutputTypeCountReplacingFilesArgs;
};
export type DlImportFileCountOutputTypeDefaultArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.DlImportFileCountOutputTypeSelect<ExtArgs> | null;
};
export type DlImportFileCountOutputTypeCountContactsArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.DlContactWhereInput;
};
export type DlImportFileCountOutputTypeCountReplacingFilesArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.DlImportFileWhereInput;
};
export type DlImportFileSelect<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    batchId?: boolean;
    originalFileName?: boolean;
    fileHash?: boolean;
    status?: boolean;
    rowsTotal?: boolean;
    rowsSuccess?: boolean;
    rowsFailed?: boolean;
    error?: boolean;
    isActive?: boolean;
    replacedFileId?: boolean;
    createdAt?: boolean;
    finishedAt?: boolean;
    updatedAt?: boolean;
    batch?: boolean | Prisma.DlImportBatchDefaultArgs<ExtArgs>;
    contacts?: boolean | Prisma.DlImportFile$contactsArgs<ExtArgs>;
    replacedFile?: boolean | Prisma.DlImportFile$replacedFileArgs<ExtArgs>;
    replacingFiles?: boolean | Prisma.DlImportFile$replacingFilesArgs<ExtArgs>;
    _count?: boolean | Prisma.DlImportFileCountOutputTypeDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["dlImportFile"]>;
export type DlImportFileSelectCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    batchId?: boolean;
    originalFileName?: boolean;
    fileHash?: boolean;
    status?: boolean;
    rowsTotal?: boolean;
    rowsSuccess?: boolean;
    rowsFailed?: boolean;
    error?: boolean;
    isActive?: boolean;
    replacedFileId?: boolean;
    createdAt?: boolean;
    finishedAt?: boolean;
    updatedAt?: boolean;
    batch?: boolean | Prisma.DlImportBatchDefaultArgs<ExtArgs>;
    replacedFile?: boolean | Prisma.DlImportFile$replacedFileArgs<ExtArgs>;
}, ExtArgs["result"]["dlImportFile"]>;
export type DlImportFileSelectUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    batchId?: boolean;
    originalFileName?: boolean;
    fileHash?: boolean;
    status?: boolean;
    rowsTotal?: boolean;
    rowsSuccess?: boolean;
    rowsFailed?: boolean;
    error?: boolean;
    isActive?: boolean;
    replacedFileId?: boolean;
    createdAt?: boolean;
    finishedAt?: boolean;
    updatedAt?: boolean;
    batch?: boolean | Prisma.DlImportBatchDefaultArgs<ExtArgs>;
    replacedFile?: boolean | Prisma.DlImportFile$replacedFileArgs<ExtArgs>;
}, ExtArgs["result"]["dlImportFile"]>;
export type DlImportFileSelectScalar = {
    id?: boolean;
    batchId?: boolean;
    originalFileName?: boolean;
    fileHash?: boolean;
    status?: boolean;
    rowsTotal?: boolean;
    rowsSuccess?: boolean;
    rowsFailed?: boolean;
    error?: boolean;
    isActive?: boolean;
    replacedFileId?: boolean;
    createdAt?: boolean;
    finishedAt?: boolean;
    updatedAt?: boolean;
};
export type DlImportFileOmit<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetOmit<"id" | "batchId" | "originalFileName" | "fileHash" | "status" | "rowsTotal" | "rowsSuccess" | "rowsFailed" | "error" | "isActive" | "replacedFileId" | "createdAt" | "finishedAt" | "updatedAt", ExtArgs["result"]["dlImportFile"]>;
export type DlImportFileInclude<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    batch?: boolean | Prisma.DlImportBatchDefaultArgs<ExtArgs>;
    contacts?: boolean | Prisma.DlImportFile$contactsArgs<ExtArgs>;
    replacedFile?: boolean | Prisma.DlImportFile$replacedFileArgs<ExtArgs>;
    replacingFiles?: boolean | Prisma.DlImportFile$replacingFilesArgs<ExtArgs>;
    _count?: boolean | Prisma.DlImportFileCountOutputTypeDefaultArgs<ExtArgs>;
};
export type DlImportFileIncludeCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    batch?: boolean | Prisma.DlImportBatchDefaultArgs<ExtArgs>;
    replacedFile?: boolean | Prisma.DlImportFile$replacedFileArgs<ExtArgs>;
};
export type DlImportFileIncludeUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    batch?: boolean | Prisma.DlImportBatchDefaultArgs<ExtArgs>;
    replacedFile?: boolean | Prisma.DlImportFile$replacedFileArgs<ExtArgs>;
};
export type $DlImportFilePayload<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    name: "DlImportFile";
    objects: {
        batch: Prisma.$DlImportBatchPayload<ExtArgs>;
        contacts: Prisma.$DlContactPayload<ExtArgs>[];
        replacedFile: Prisma.$DlImportFilePayload<ExtArgs> | null;
        replacingFiles: Prisma.$DlImportFilePayload<ExtArgs>[];
    };
    scalars: runtime.Types.Extensions.GetPayloadResult<{
        id: bigint;
        batchId: bigint;
        originalFileName: string;
        fileHash: string | null;
        status: string;
        rowsTotal: number;
        rowsSuccess: number;
        rowsFailed: number;
        error: string | null;
        isActive: boolean;
        replacedFileId: bigint | null;
        createdAt: Date;
        finishedAt: Date | null;
        updatedAt: Date;
    }, ExtArgs["result"]["dlImportFile"]>;
    composites: {};
};
export type DlImportFileGetPayload<S extends boolean | null | undefined | DlImportFileDefaultArgs> = runtime.Types.Result.GetResult<Prisma.$DlImportFilePayload, S>;
export type DlImportFileCountArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = Omit<DlImportFileFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
    select?: DlImportFileCountAggregateInputType | true;
};
export interface DlImportFileDelegate<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: {
        types: Prisma.TypeMap<ExtArgs>['model']['DlImportFile'];
        meta: {
            name: 'DlImportFile';
        };
    };
    findUnique<T extends DlImportFileFindUniqueArgs>(args: Prisma.SelectSubset<T, DlImportFileFindUniqueArgs<ExtArgs>>): Prisma.Prisma__DlImportFileClient<runtime.Types.Result.GetResult<Prisma.$DlImportFilePayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    findUniqueOrThrow<T extends DlImportFileFindUniqueOrThrowArgs>(args: Prisma.SelectSubset<T, DlImportFileFindUniqueOrThrowArgs<ExtArgs>>): Prisma.Prisma__DlImportFileClient<runtime.Types.Result.GetResult<Prisma.$DlImportFilePayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    findFirst<T extends DlImportFileFindFirstArgs>(args?: Prisma.SelectSubset<T, DlImportFileFindFirstArgs<ExtArgs>>): Prisma.Prisma__DlImportFileClient<runtime.Types.Result.GetResult<Prisma.$DlImportFilePayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    findFirstOrThrow<T extends DlImportFileFindFirstOrThrowArgs>(args?: Prisma.SelectSubset<T, DlImportFileFindFirstOrThrowArgs<ExtArgs>>): Prisma.Prisma__DlImportFileClient<runtime.Types.Result.GetResult<Prisma.$DlImportFilePayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    findMany<T extends DlImportFileFindManyArgs>(args?: Prisma.SelectSubset<T, DlImportFileFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$DlImportFilePayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>;
    create<T extends DlImportFileCreateArgs>(args: Prisma.SelectSubset<T, DlImportFileCreateArgs<ExtArgs>>): Prisma.Prisma__DlImportFileClient<runtime.Types.Result.GetResult<Prisma.$DlImportFilePayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    createMany<T extends DlImportFileCreateManyArgs>(args?: Prisma.SelectSubset<T, DlImportFileCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    createManyAndReturn<T extends DlImportFileCreateManyAndReturnArgs>(args?: Prisma.SelectSubset<T, DlImportFileCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$DlImportFilePayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>;
    delete<T extends DlImportFileDeleteArgs>(args: Prisma.SelectSubset<T, DlImportFileDeleteArgs<ExtArgs>>): Prisma.Prisma__DlImportFileClient<runtime.Types.Result.GetResult<Prisma.$DlImportFilePayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    update<T extends DlImportFileUpdateArgs>(args: Prisma.SelectSubset<T, DlImportFileUpdateArgs<ExtArgs>>): Prisma.Prisma__DlImportFileClient<runtime.Types.Result.GetResult<Prisma.$DlImportFilePayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    deleteMany<T extends DlImportFileDeleteManyArgs>(args?: Prisma.SelectSubset<T, DlImportFileDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    updateMany<T extends DlImportFileUpdateManyArgs>(args: Prisma.SelectSubset<T, DlImportFileUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    updateManyAndReturn<T extends DlImportFileUpdateManyAndReturnArgs>(args: Prisma.SelectSubset<T, DlImportFileUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$DlImportFilePayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>;
    upsert<T extends DlImportFileUpsertArgs>(args: Prisma.SelectSubset<T, DlImportFileUpsertArgs<ExtArgs>>): Prisma.Prisma__DlImportFileClient<runtime.Types.Result.GetResult<Prisma.$DlImportFilePayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    count<T extends DlImportFileCountArgs>(args?: Prisma.Subset<T, DlImportFileCountArgs>): Prisma.PrismaPromise<T extends runtime.Types.Utils.Record<'select', any> ? T['select'] extends true ? number : Prisma.GetScalarType<T['select'], DlImportFileCountAggregateOutputType> : number>;
    aggregate<T extends DlImportFileAggregateArgs>(args: Prisma.Subset<T, DlImportFileAggregateArgs>): Prisma.PrismaPromise<GetDlImportFileAggregateType<T>>;
    groupBy<T extends DlImportFileGroupByArgs, HasSelectOrTake extends Prisma.Or<Prisma.Extends<'skip', Prisma.Keys<T>>, Prisma.Extends<'take', Prisma.Keys<T>>>, OrderByArg extends Prisma.True extends HasSelectOrTake ? {
        orderBy: DlImportFileGroupByArgs['orderBy'];
    } : {
        orderBy?: DlImportFileGroupByArgs['orderBy'];
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
    }[OrderFields]>(args: Prisma.SubsetIntersection<T, DlImportFileGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetDlImportFileGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>;
    readonly fields: DlImportFileFieldRefs;
}
export interface Prisma__DlImportFileClient<T, Null = never, ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise";
    batch<T extends Prisma.DlImportBatchDefaultArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.DlImportBatchDefaultArgs<ExtArgs>>): Prisma.Prisma__DlImportBatchClient<runtime.Types.Result.GetResult<Prisma.$DlImportBatchPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>;
    contacts<T extends Prisma.DlImportFile$contactsArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.DlImportFile$contactsArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$DlContactPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>;
    replacedFile<T extends Prisma.DlImportFile$replacedFileArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.DlImportFile$replacedFileArgs<ExtArgs>>): Prisma.Prisma__DlImportFileClient<runtime.Types.Result.GetResult<Prisma.$DlImportFilePayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    replacingFiles<T extends Prisma.DlImportFile$replacingFilesArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.DlImportFile$replacingFilesArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$DlImportFilePayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>;
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): runtime.Types.Utils.JsPromise<TResult1 | TResult2>;
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): runtime.Types.Utils.JsPromise<T | TResult>;
    finally(onfinally?: (() => void) | undefined | null): runtime.Types.Utils.JsPromise<T>;
}
export interface DlImportFileFieldRefs {
    readonly id: Prisma.FieldRef<"DlImportFile", 'BigInt'>;
    readonly batchId: Prisma.FieldRef<"DlImportFile", 'BigInt'>;
    readonly originalFileName: Prisma.FieldRef<"DlImportFile", 'String'>;
    readonly fileHash: Prisma.FieldRef<"DlImportFile", 'String'>;
    readonly status: Prisma.FieldRef<"DlImportFile", 'String'>;
    readonly rowsTotal: Prisma.FieldRef<"DlImportFile", 'Int'>;
    readonly rowsSuccess: Prisma.FieldRef<"DlImportFile", 'Int'>;
    readonly rowsFailed: Prisma.FieldRef<"DlImportFile", 'Int'>;
    readonly error: Prisma.FieldRef<"DlImportFile", 'String'>;
    readonly isActive: Prisma.FieldRef<"DlImportFile", 'Boolean'>;
    readonly replacedFileId: Prisma.FieldRef<"DlImportFile", 'BigInt'>;
    readonly createdAt: Prisma.FieldRef<"DlImportFile", 'DateTime'>;
    readonly finishedAt: Prisma.FieldRef<"DlImportFile", 'DateTime'>;
    readonly updatedAt: Prisma.FieldRef<"DlImportFile", 'DateTime'>;
}
export type DlImportFileFindUniqueArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.DlImportFileSelect<ExtArgs> | null;
    omit?: Prisma.DlImportFileOmit<ExtArgs> | null;
    include?: Prisma.DlImportFileInclude<ExtArgs> | null;
    where: Prisma.DlImportFileWhereUniqueInput;
};
export type DlImportFileFindUniqueOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.DlImportFileSelect<ExtArgs> | null;
    omit?: Prisma.DlImportFileOmit<ExtArgs> | null;
    include?: Prisma.DlImportFileInclude<ExtArgs> | null;
    where: Prisma.DlImportFileWhereUniqueInput;
};
export type DlImportFileFindFirstArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.DlImportFileSelect<ExtArgs> | null;
    omit?: Prisma.DlImportFileOmit<ExtArgs> | null;
    include?: Prisma.DlImportFileInclude<ExtArgs> | null;
    where?: Prisma.DlImportFileWhereInput;
    orderBy?: Prisma.DlImportFileOrderByWithRelationInput | Prisma.DlImportFileOrderByWithRelationInput[];
    cursor?: Prisma.DlImportFileWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.DlImportFileScalarFieldEnum | Prisma.DlImportFileScalarFieldEnum[];
};
export type DlImportFileFindFirstOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.DlImportFileSelect<ExtArgs> | null;
    omit?: Prisma.DlImportFileOmit<ExtArgs> | null;
    include?: Prisma.DlImportFileInclude<ExtArgs> | null;
    where?: Prisma.DlImportFileWhereInput;
    orderBy?: Prisma.DlImportFileOrderByWithRelationInput | Prisma.DlImportFileOrderByWithRelationInput[];
    cursor?: Prisma.DlImportFileWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.DlImportFileScalarFieldEnum | Prisma.DlImportFileScalarFieldEnum[];
};
export type DlImportFileFindManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.DlImportFileSelect<ExtArgs> | null;
    omit?: Prisma.DlImportFileOmit<ExtArgs> | null;
    include?: Prisma.DlImportFileInclude<ExtArgs> | null;
    where?: Prisma.DlImportFileWhereInput;
    orderBy?: Prisma.DlImportFileOrderByWithRelationInput | Prisma.DlImportFileOrderByWithRelationInput[];
    cursor?: Prisma.DlImportFileWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.DlImportFileScalarFieldEnum | Prisma.DlImportFileScalarFieldEnum[];
};
export type DlImportFileCreateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.DlImportFileSelect<ExtArgs> | null;
    omit?: Prisma.DlImportFileOmit<ExtArgs> | null;
    include?: Prisma.DlImportFileInclude<ExtArgs> | null;
    data: Prisma.XOR<Prisma.DlImportFileCreateInput, Prisma.DlImportFileUncheckedCreateInput>;
};
export type DlImportFileCreateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    data: Prisma.DlImportFileCreateManyInput | Prisma.DlImportFileCreateManyInput[];
    skipDuplicates?: boolean;
};
export type DlImportFileCreateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.DlImportFileSelectCreateManyAndReturn<ExtArgs> | null;
    omit?: Prisma.DlImportFileOmit<ExtArgs> | null;
    data: Prisma.DlImportFileCreateManyInput | Prisma.DlImportFileCreateManyInput[];
    skipDuplicates?: boolean;
    include?: Prisma.DlImportFileIncludeCreateManyAndReturn<ExtArgs> | null;
};
export type DlImportFileUpdateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.DlImportFileSelect<ExtArgs> | null;
    omit?: Prisma.DlImportFileOmit<ExtArgs> | null;
    include?: Prisma.DlImportFileInclude<ExtArgs> | null;
    data: Prisma.XOR<Prisma.DlImportFileUpdateInput, Prisma.DlImportFileUncheckedUpdateInput>;
    where: Prisma.DlImportFileWhereUniqueInput;
};
export type DlImportFileUpdateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    data: Prisma.XOR<Prisma.DlImportFileUpdateManyMutationInput, Prisma.DlImportFileUncheckedUpdateManyInput>;
    where?: Prisma.DlImportFileWhereInput;
    limit?: number;
};
export type DlImportFileUpdateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.DlImportFileSelectUpdateManyAndReturn<ExtArgs> | null;
    omit?: Prisma.DlImportFileOmit<ExtArgs> | null;
    data: Prisma.XOR<Prisma.DlImportFileUpdateManyMutationInput, Prisma.DlImportFileUncheckedUpdateManyInput>;
    where?: Prisma.DlImportFileWhereInput;
    limit?: number;
    include?: Prisma.DlImportFileIncludeUpdateManyAndReturn<ExtArgs> | null;
};
export type DlImportFileUpsertArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.DlImportFileSelect<ExtArgs> | null;
    omit?: Prisma.DlImportFileOmit<ExtArgs> | null;
    include?: Prisma.DlImportFileInclude<ExtArgs> | null;
    where: Prisma.DlImportFileWhereUniqueInput;
    create: Prisma.XOR<Prisma.DlImportFileCreateInput, Prisma.DlImportFileUncheckedCreateInput>;
    update: Prisma.XOR<Prisma.DlImportFileUpdateInput, Prisma.DlImportFileUncheckedUpdateInput>;
};
export type DlImportFileDeleteArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.DlImportFileSelect<ExtArgs> | null;
    omit?: Prisma.DlImportFileOmit<ExtArgs> | null;
    include?: Prisma.DlImportFileInclude<ExtArgs> | null;
    where: Prisma.DlImportFileWhereUniqueInput;
};
export type DlImportFileDeleteManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.DlImportFileWhereInput;
    limit?: number;
};
export type DlImportFile$contactsArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.DlContactSelect<ExtArgs> | null;
    omit?: Prisma.DlContactOmit<ExtArgs> | null;
    include?: Prisma.DlContactInclude<ExtArgs> | null;
    where?: Prisma.DlContactWhereInput;
    orderBy?: Prisma.DlContactOrderByWithRelationInput | Prisma.DlContactOrderByWithRelationInput[];
    cursor?: Prisma.DlContactWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.DlContactScalarFieldEnum | Prisma.DlContactScalarFieldEnum[];
};
export type DlImportFile$replacedFileArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.DlImportFileSelect<ExtArgs> | null;
    omit?: Prisma.DlImportFileOmit<ExtArgs> | null;
    include?: Prisma.DlImportFileInclude<ExtArgs> | null;
    where?: Prisma.DlImportFileWhereInput;
};
export type DlImportFile$replacingFilesArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.DlImportFileSelect<ExtArgs> | null;
    omit?: Prisma.DlImportFileOmit<ExtArgs> | null;
    include?: Prisma.DlImportFileInclude<ExtArgs> | null;
    where?: Prisma.DlImportFileWhereInput;
    orderBy?: Prisma.DlImportFileOrderByWithRelationInput | Prisma.DlImportFileOrderByWithRelationInput[];
    cursor?: Prisma.DlImportFileWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.DlImportFileScalarFieldEnum | Prisma.DlImportFileScalarFieldEnum[];
};
export type DlImportFileDefaultArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.DlImportFileSelect<ExtArgs> | null;
    omit?: Prisma.DlImportFileOmit<ExtArgs> | null;
    include?: Prisma.DlImportFileInclude<ExtArgs> | null;
};
export {};
