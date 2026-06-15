import type * as runtime from "@prisma/client/runtime/client";
import type * as Prisma from "../internal/prismaNamespace.js";
export type DlImportBatchModel = runtime.Types.Result.DefaultSelection<Prisma.$DlImportBatchPayload>;
export type AggregateDlImportBatch = {
    _count: DlImportBatchCountAggregateOutputType | null;
    _avg: DlImportBatchAvgAggregateOutputType | null;
    _sum: DlImportBatchSumAggregateOutputType | null;
    _min: DlImportBatchMinAggregateOutputType | null;
    _max: DlImportBatchMaxAggregateOutputType | null;
};
export type DlImportBatchAvgAggregateOutputType = {
    id: number | null;
    filesTotal: number | null;
    filesSuccess: number | null;
    filesFailed: number | null;
};
export type DlImportBatchSumAggregateOutputType = {
    id: bigint | null;
    filesTotal: number | null;
    filesSuccess: number | null;
    filesFailed: number | null;
};
export type DlImportBatchMinAggregateOutputType = {
    id: bigint | null;
    status: string | null;
    filesTotal: number | null;
    filesSuccess: number | null;
    filesFailed: number | null;
    createdAt: Date | null;
    updatedAt: Date | null;
};
export type DlImportBatchMaxAggregateOutputType = {
    id: bigint | null;
    status: string | null;
    filesTotal: number | null;
    filesSuccess: number | null;
    filesFailed: number | null;
    createdAt: Date | null;
    updatedAt: Date | null;
};
export type DlImportBatchCountAggregateOutputType = {
    id: number;
    status: number;
    filesTotal: number;
    filesSuccess: number;
    filesFailed: number;
    createdAt: number;
    updatedAt: number;
    _all: number;
};
export type DlImportBatchAvgAggregateInputType = {
    id?: true;
    filesTotal?: true;
    filesSuccess?: true;
    filesFailed?: true;
};
export type DlImportBatchSumAggregateInputType = {
    id?: true;
    filesTotal?: true;
    filesSuccess?: true;
    filesFailed?: true;
};
export type DlImportBatchMinAggregateInputType = {
    id?: true;
    status?: true;
    filesTotal?: true;
    filesSuccess?: true;
    filesFailed?: true;
    createdAt?: true;
    updatedAt?: true;
};
export type DlImportBatchMaxAggregateInputType = {
    id?: true;
    status?: true;
    filesTotal?: true;
    filesSuccess?: true;
    filesFailed?: true;
    createdAt?: true;
    updatedAt?: true;
};
export type DlImportBatchCountAggregateInputType = {
    id?: true;
    status?: true;
    filesTotal?: true;
    filesSuccess?: true;
    filesFailed?: true;
    createdAt?: true;
    updatedAt?: true;
    _all?: true;
};
export type DlImportBatchAggregateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.DlImportBatchWhereInput;
    orderBy?: Prisma.DlImportBatchOrderByWithRelationInput | Prisma.DlImportBatchOrderByWithRelationInput[];
    cursor?: Prisma.DlImportBatchWhereUniqueInput;
    take?: number;
    skip?: number;
    _count?: true | DlImportBatchCountAggregateInputType;
    _avg?: DlImportBatchAvgAggregateInputType;
    _sum?: DlImportBatchSumAggregateInputType;
    _min?: DlImportBatchMinAggregateInputType;
    _max?: DlImportBatchMaxAggregateInputType;
};
export type GetDlImportBatchAggregateType<T extends DlImportBatchAggregateArgs> = {
    [P in keyof T & keyof AggregateDlImportBatch]: P extends '_count' | 'count' ? T[P] extends true ? number : Prisma.GetScalarType<T[P], AggregateDlImportBatch[P]> : Prisma.GetScalarType<T[P], AggregateDlImportBatch[P]>;
};
export type DlImportBatchGroupByArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.DlImportBatchWhereInput;
    orderBy?: Prisma.DlImportBatchOrderByWithAggregationInput | Prisma.DlImportBatchOrderByWithAggregationInput[];
    by: Prisma.DlImportBatchScalarFieldEnum[] | Prisma.DlImportBatchScalarFieldEnum;
    having?: Prisma.DlImportBatchScalarWhereWithAggregatesInput;
    take?: number;
    skip?: number;
    _count?: DlImportBatchCountAggregateInputType | true;
    _avg?: DlImportBatchAvgAggregateInputType;
    _sum?: DlImportBatchSumAggregateInputType;
    _min?: DlImportBatchMinAggregateInputType;
    _max?: DlImportBatchMaxAggregateInputType;
};
export type DlImportBatchGroupByOutputType = {
    id: bigint;
    status: string;
    filesTotal: number;
    filesSuccess: number;
    filesFailed: number;
    createdAt: Date;
    updatedAt: Date;
    _count: DlImportBatchCountAggregateOutputType | null;
    _avg: DlImportBatchAvgAggregateOutputType | null;
    _sum: DlImportBatchSumAggregateOutputType | null;
    _min: DlImportBatchMinAggregateOutputType | null;
    _max: DlImportBatchMaxAggregateOutputType | null;
};
type GetDlImportBatchGroupByPayload<T extends DlImportBatchGroupByArgs> = Prisma.PrismaPromise<Array<Prisma.PickEnumerable<DlImportBatchGroupByOutputType, T['by']> & {
    [P in ((keyof T) & (keyof DlImportBatchGroupByOutputType))]: P extends '_count' ? T[P] extends boolean ? number : Prisma.GetScalarType<T[P], DlImportBatchGroupByOutputType[P]> : Prisma.GetScalarType<T[P], DlImportBatchGroupByOutputType[P]>;
}>>;
export type DlImportBatchWhereInput = {
    AND?: Prisma.DlImportBatchWhereInput | Prisma.DlImportBatchWhereInput[];
    OR?: Prisma.DlImportBatchWhereInput[];
    NOT?: Prisma.DlImportBatchWhereInput | Prisma.DlImportBatchWhereInput[];
    id?: Prisma.BigIntFilter<"DlImportBatch"> | bigint | number;
    status?: Prisma.StringFilter<"DlImportBatch"> | string;
    filesTotal?: Prisma.IntFilter<"DlImportBatch"> | number;
    filesSuccess?: Prisma.IntFilter<"DlImportBatch"> | number;
    filesFailed?: Prisma.IntFilter<"DlImportBatch"> | number;
    createdAt?: Prisma.DateTimeFilter<"DlImportBatch"> | Date | string;
    updatedAt?: Prisma.DateTimeFilter<"DlImportBatch"> | Date | string;
    files?: Prisma.DlImportFileListRelationFilter;
};
export type DlImportBatchOrderByWithRelationInput = {
    id?: Prisma.SortOrder;
    status?: Prisma.SortOrder;
    filesTotal?: Prisma.SortOrder;
    filesSuccess?: Prisma.SortOrder;
    filesFailed?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
    files?: Prisma.DlImportFileOrderByRelationAggregateInput;
};
export type DlImportBatchWhereUniqueInput = Prisma.AtLeast<{
    id?: bigint | number;
    AND?: Prisma.DlImportBatchWhereInput | Prisma.DlImportBatchWhereInput[];
    OR?: Prisma.DlImportBatchWhereInput[];
    NOT?: Prisma.DlImportBatchWhereInput | Prisma.DlImportBatchWhereInput[];
    status?: Prisma.StringFilter<"DlImportBatch"> | string;
    filesTotal?: Prisma.IntFilter<"DlImportBatch"> | number;
    filesSuccess?: Prisma.IntFilter<"DlImportBatch"> | number;
    filesFailed?: Prisma.IntFilter<"DlImportBatch"> | number;
    createdAt?: Prisma.DateTimeFilter<"DlImportBatch"> | Date | string;
    updatedAt?: Prisma.DateTimeFilter<"DlImportBatch"> | Date | string;
    files?: Prisma.DlImportFileListRelationFilter;
}, "id">;
export type DlImportBatchOrderByWithAggregationInput = {
    id?: Prisma.SortOrder;
    status?: Prisma.SortOrder;
    filesTotal?: Prisma.SortOrder;
    filesSuccess?: Prisma.SortOrder;
    filesFailed?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
    _count?: Prisma.DlImportBatchCountOrderByAggregateInput;
    _avg?: Prisma.DlImportBatchAvgOrderByAggregateInput;
    _max?: Prisma.DlImportBatchMaxOrderByAggregateInput;
    _min?: Prisma.DlImportBatchMinOrderByAggregateInput;
    _sum?: Prisma.DlImportBatchSumOrderByAggregateInput;
};
export type DlImportBatchScalarWhereWithAggregatesInput = {
    AND?: Prisma.DlImportBatchScalarWhereWithAggregatesInput | Prisma.DlImportBatchScalarWhereWithAggregatesInput[];
    OR?: Prisma.DlImportBatchScalarWhereWithAggregatesInput[];
    NOT?: Prisma.DlImportBatchScalarWhereWithAggregatesInput | Prisma.DlImportBatchScalarWhereWithAggregatesInput[];
    id?: Prisma.BigIntWithAggregatesFilter<"DlImportBatch"> | bigint | number;
    status?: Prisma.StringWithAggregatesFilter<"DlImportBatch"> | string;
    filesTotal?: Prisma.IntWithAggregatesFilter<"DlImportBatch"> | number;
    filesSuccess?: Prisma.IntWithAggregatesFilter<"DlImportBatch"> | number;
    filesFailed?: Prisma.IntWithAggregatesFilter<"DlImportBatch"> | number;
    createdAt?: Prisma.DateTimeWithAggregatesFilter<"DlImportBatch"> | Date | string;
    updatedAt?: Prisma.DateTimeWithAggregatesFilter<"DlImportBatch"> | Date | string;
};
export type DlImportBatchCreateInput = {
    id?: bigint | number;
    status: string;
    filesTotal?: number;
    filesSuccess?: number;
    filesFailed?: number;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    files?: Prisma.DlImportFileCreateNestedManyWithoutBatchInput;
};
export type DlImportBatchUncheckedCreateInput = {
    id?: bigint | number;
    status: string;
    filesTotal?: number;
    filesSuccess?: number;
    filesFailed?: number;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    files?: Prisma.DlImportFileUncheckedCreateNestedManyWithoutBatchInput;
};
export type DlImportBatchUpdateInput = {
    id?: Prisma.BigIntFieldUpdateOperationsInput | bigint | number;
    status?: Prisma.StringFieldUpdateOperationsInput | string;
    filesTotal?: Prisma.IntFieldUpdateOperationsInput | number;
    filesSuccess?: Prisma.IntFieldUpdateOperationsInput | number;
    filesFailed?: Prisma.IntFieldUpdateOperationsInput | number;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    files?: Prisma.DlImportFileUpdateManyWithoutBatchNestedInput;
};
export type DlImportBatchUncheckedUpdateInput = {
    id?: Prisma.BigIntFieldUpdateOperationsInput | bigint | number;
    status?: Prisma.StringFieldUpdateOperationsInput | string;
    filesTotal?: Prisma.IntFieldUpdateOperationsInput | number;
    filesSuccess?: Prisma.IntFieldUpdateOperationsInput | number;
    filesFailed?: Prisma.IntFieldUpdateOperationsInput | number;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    files?: Prisma.DlImportFileUncheckedUpdateManyWithoutBatchNestedInput;
};
export type DlImportBatchCreateManyInput = {
    id?: bigint | number;
    status: string;
    filesTotal?: number;
    filesSuccess?: number;
    filesFailed?: number;
    createdAt?: Date | string;
    updatedAt?: Date | string;
};
export type DlImportBatchUpdateManyMutationInput = {
    id?: Prisma.BigIntFieldUpdateOperationsInput | bigint | number;
    status?: Prisma.StringFieldUpdateOperationsInput | string;
    filesTotal?: Prisma.IntFieldUpdateOperationsInput | number;
    filesSuccess?: Prisma.IntFieldUpdateOperationsInput | number;
    filesFailed?: Prisma.IntFieldUpdateOperationsInput | number;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type DlImportBatchUncheckedUpdateManyInput = {
    id?: Prisma.BigIntFieldUpdateOperationsInput | bigint | number;
    status?: Prisma.StringFieldUpdateOperationsInput | string;
    filesTotal?: Prisma.IntFieldUpdateOperationsInput | number;
    filesSuccess?: Prisma.IntFieldUpdateOperationsInput | number;
    filesFailed?: Prisma.IntFieldUpdateOperationsInput | number;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type DlImportBatchCountOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    status?: Prisma.SortOrder;
    filesTotal?: Prisma.SortOrder;
    filesSuccess?: Prisma.SortOrder;
    filesFailed?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
};
export type DlImportBatchAvgOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    filesTotal?: Prisma.SortOrder;
    filesSuccess?: Prisma.SortOrder;
    filesFailed?: Prisma.SortOrder;
};
export type DlImportBatchMaxOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    status?: Prisma.SortOrder;
    filesTotal?: Prisma.SortOrder;
    filesSuccess?: Prisma.SortOrder;
    filesFailed?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
};
export type DlImportBatchMinOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    status?: Prisma.SortOrder;
    filesTotal?: Prisma.SortOrder;
    filesSuccess?: Prisma.SortOrder;
    filesFailed?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
};
export type DlImportBatchSumOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    filesTotal?: Prisma.SortOrder;
    filesSuccess?: Prisma.SortOrder;
    filesFailed?: Prisma.SortOrder;
};
export type DlImportBatchScalarRelationFilter = {
    is?: Prisma.DlImportBatchWhereInput;
    isNot?: Prisma.DlImportBatchWhereInput;
};
export type DlImportBatchCreateNestedOneWithoutFilesInput = {
    create?: Prisma.XOR<Prisma.DlImportBatchCreateWithoutFilesInput, Prisma.DlImportBatchUncheckedCreateWithoutFilesInput>;
    connectOrCreate?: Prisma.DlImportBatchCreateOrConnectWithoutFilesInput;
    connect?: Prisma.DlImportBatchWhereUniqueInput;
};
export type DlImportBatchUpdateOneRequiredWithoutFilesNestedInput = {
    create?: Prisma.XOR<Prisma.DlImportBatchCreateWithoutFilesInput, Prisma.DlImportBatchUncheckedCreateWithoutFilesInput>;
    connectOrCreate?: Prisma.DlImportBatchCreateOrConnectWithoutFilesInput;
    upsert?: Prisma.DlImportBatchUpsertWithoutFilesInput;
    connect?: Prisma.DlImportBatchWhereUniqueInput;
    update?: Prisma.XOR<Prisma.XOR<Prisma.DlImportBatchUpdateToOneWithWhereWithoutFilesInput, Prisma.DlImportBatchUpdateWithoutFilesInput>, Prisma.DlImportBatchUncheckedUpdateWithoutFilesInput>;
};
export type DlImportBatchCreateWithoutFilesInput = {
    id?: bigint | number;
    status: string;
    filesTotal?: number;
    filesSuccess?: number;
    filesFailed?: number;
    createdAt?: Date | string;
    updatedAt?: Date | string;
};
export type DlImportBatchUncheckedCreateWithoutFilesInput = {
    id?: bigint | number;
    status: string;
    filesTotal?: number;
    filesSuccess?: number;
    filesFailed?: number;
    createdAt?: Date | string;
    updatedAt?: Date | string;
};
export type DlImportBatchCreateOrConnectWithoutFilesInput = {
    where: Prisma.DlImportBatchWhereUniqueInput;
    create: Prisma.XOR<Prisma.DlImportBatchCreateWithoutFilesInput, Prisma.DlImportBatchUncheckedCreateWithoutFilesInput>;
};
export type DlImportBatchUpsertWithoutFilesInput = {
    update: Prisma.XOR<Prisma.DlImportBatchUpdateWithoutFilesInput, Prisma.DlImportBatchUncheckedUpdateWithoutFilesInput>;
    create: Prisma.XOR<Prisma.DlImportBatchCreateWithoutFilesInput, Prisma.DlImportBatchUncheckedCreateWithoutFilesInput>;
    where?: Prisma.DlImportBatchWhereInput;
};
export type DlImportBatchUpdateToOneWithWhereWithoutFilesInput = {
    where?: Prisma.DlImportBatchWhereInput;
    data: Prisma.XOR<Prisma.DlImportBatchUpdateWithoutFilesInput, Prisma.DlImportBatchUncheckedUpdateWithoutFilesInput>;
};
export type DlImportBatchUpdateWithoutFilesInput = {
    id?: Prisma.BigIntFieldUpdateOperationsInput | bigint | number;
    status?: Prisma.StringFieldUpdateOperationsInput | string;
    filesTotal?: Prisma.IntFieldUpdateOperationsInput | number;
    filesSuccess?: Prisma.IntFieldUpdateOperationsInput | number;
    filesFailed?: Prisma.IntFieldUpdateOperationsInput | number;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type DlImportBatchUncheckedUpdateWithoutFilesInput = {
    id?: Prisma.BigIntFieldUpdateOperationsInput | bigint | number;
    status?: Prisma.StringFieldUpdateOperationsInput | string;
    filesTotal?: Prisma.IntFieldUpdateOperationsInput | number;
    filesSuccess?: Prisma.IntFieldUpdateOperationsInput | number;
    filesFailed?: Prisma.IntFieldUpdateOperationsInput | number;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type DlImportBatchCountOutputType = {
    files: number;
};
export type DlImportBatchCountOutputTypeSelect<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    files?: boolean | DlImportBatchCountOutputTypeCountFilesArgs;
};
export type DlImportBatchCountOutputTypeDefaultArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.DlImportBatchCountOutputTypeSelect<ExtArgs> | null;
};
export type DlImportBatchCountOutputTypeCountFilesArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.DlImportFileWhereInput;
};
export type DlImportBatchSelect<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    status?: boolean;
    filesTotal?: boolean;
    filesSuccess?: boolean;
    filesFailed?: boolean;
    createdAt?: boolean;
    updatedAt?: boolean;
    files?: boolean | Prisma.DlImportBatch$filesArgs<ExtArgs>;
    _count?: boolean | Prisma.DlImportBatchCountOutputTypeDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["dlImportBatch"]>;
export type DlImportBatchSelectCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    status?: boolean;
    filesTotal?: boolean;
    filesSuccess?: boolean;
    filesFailed?: boolean;
    createdAt?: boolean;
    updatedAt?: boolean;
}, ExtArgs["result"]["dlImportBatch"]>;
export type DlImportBatchSelectUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    status?: boolean;
    filesTotal?: boolean;
    filesSuccess?: boolean;
    filesFailed?: boolean;
    createdAt?: boolean;
    updatedAt?: boolean;
}, ExtArgs["result"]["dlImportBatch"]>;
export type DlImportBatchSelectScalar = {
    id?: boolean;
    status?: boolean;
    filesTotal?: boolean;
    filesSuccess?: boolean;
    filesFailed?: boolean;
    createdAt?: boolean;
    updatedAt?: boolean;
};
export type DlImportBatchOmit<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetOmit<"id" | "status" | "filesTotal" | "filesSuccess" | "filesFailed" | "createdAt" | "updatedAt", ExtArgs["result"]["dlImportBatch"]>;
export type DlImportBatchInclude<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    files?: boolean | Prisma.DlImportBatch$filesArgs<ExtArgs>;
    _count?: boolean | Prisma.DlImportBatchCountOutputTypeDefaultArgs<ExtArgs>;
};
export type DlImportBatchIncludeCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {};
export type DlImportBatchIncludeUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {};
export type $DlImportBatchPayload<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    name: "DlImportBatch";
    objects: {
        files: Prisma.$DlImportFilePayload<ExtArgs>[];
    };
    scalars: runtime.Types.Extensions.GetPayloadResult<{
        id: bigint;
        status: string;
        filesTotal: number;
        filesSuccess: number;
        filesFailed: number;
        createdAt: Date;
        updatedAt: Date;
    }, ExtArgs["result"]["dlImportBatch"]>;
    composites: {};
};
export type DlImportBatchGetPayload<S extends boolean | null | undefined | DlImportBatchDefaultArgs> = runtime.Types.Result.GetResult<Prisma.$DlImportBatchPayload, S>;
export type DlImportBatchCountArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = Omit<DlImportBatchFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
    select?: DlImportBatchCountAggregateInputType | true;
};
export interface DlImportBatchDelegate<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: {
        types: Prisma.TypeMap<ExtArgs>['model']['DlImportBatch'];
        meta: {
            name: 'DlImportBatch';
        };
    };
    findUnique<T extends DlImportBatchFindUniqueArgs>(args: Prisma.SelectSubset<T, DlImportBatchFindUniqueArgs<ExtArgs>>): Prisma.Prisma__DlImportBatchClient<runtime.Types.Result.GetResult<Prisma.$DlImportBatchPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    findUniqueOrThrow<T extends DlImportBatchFindUniqueOrThrowArgs>(args: Prisma.SelectSubset<T, DlImportBatchFindUniqueOrThrowArgs<ExtArgs>>): Prisma.Prisma__DlImportBatchClient<runtime.Types.Result.GetResult<Prisma.$DlImportBatchPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    findFirst<T extends DlImportBatchFindFirstArgs>(args?: Prisma.SelectSubset<T, DlImportBatchFindFirstArgs<ExtArgs>>): Prisma.Prisma__DlImportBatchClient<runtime.Types.Result.GetResult<Prisma.$DlImportBatchPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    findFirstOrThrow<T extends DlImportBatchFindFirstOrThrowArgs>(args?: Prisma.SelectSubset<T, DlImportBatchFindFirstOrThrowArgs<ExtArgs>>): Prisma.Prisma__DlImportBatchClient<runtime.Types.Result.GetResult<Prisma.$DlImportBatchPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    findMany<T extends DlImportBatchFindManyArgs>(args?: Prisma.SelectSubset<T, DlImportBatchFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$DlImportBatchPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>;
    create<T extends DlImportBatchCreateArgs>(args: Prisma.SelectSubset<T, DlImportBatchCreateArgs<ExtArgs>>): Prisma.Prisma__DlImportBatchClient<runtime.Types.Result.GetResult<Prisma.$DlImportBatchPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    createMany<T extends DlImportBatchCreateManyArgs>(args?: Prisma.SelectSubset<T, DlImportBatchCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    createManyAndReturn<T extends DlImportBatchCreateManyAndReturnArgs>(args?: Prisma.SelectSubset<T, DlImportBatchCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$DlImportBatchPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>;
    delete<T extends DlImportBatchDeleteArgs>(args: Prisma.SelectSubset<T, DlImportBatchDeleteArgs<ExtArgs>>): Prisma.Prisma__DlImportBatchClient<runtime.Types.Result.GetResult<Prisma.$DlImportBatchPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    update<T extends DlImportBatchUpdateArgs>(args: Prisma.SelectSubset<T, DlImportBatchUpdateArgs<ExtArgs>>): Prisma.Prisma__DlImportBatchClient<runtime.Types.Result.GetResult<Prisma.$DlImportBatchPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    deleteMany<T extends DlImportBatchDeleteManyArgs>(args?: Prisma.SelectSubset<T, DlImportBatchDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    updateMany<T extends DlImportBatchUpdateManyArgs>(args: Prisma.SelectSubset<T, DlImportBatchUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    updateManyAndReturn<T extends DlImportBatchUpdateManyAndReturnArgs>(args: Prisma.SelectSubset<T, DlImportBatchUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$DlImportBatchPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>;
    upsert<T extends DlImportBatchUpsertArgs>(args: Prisma.SelectSubset<T, DlImportBatchUpsertArgs<ExtArgs>>): Prisma.Prisma__DlImportBatchClient<runtime.Types.Result.GetResult<Prisma.$DlImportBatchPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    count<T extends DlImportBatchCountArgs>(args?: Prisma.Subset<T, DlImportBatchCountArgs>): Prisma.PrismaPromise<T extends runtime.Types.Utils.Record<'select', any> ? T['select'] extends true ? number : Prisma.GetScalarType<T['select'], DlImportBatchCountAggregateOutputType> : number>;
    aggregate<T extends DlImportBatchAggregateArgs>(args: Prisma.Subset<T, DlImportBatchAggregateArgs>): Prisma.PrismaPromise<GetDlImportBatchAggregateType<T>>;
    groupBy<T extends DlImportBatchGroupByArgs, HasSelectOrTake extends Prisma.Or<Prisma.Extends<'skip', Prisma.Keys<T>>, Prisma.Extends<'take', Prisma.Keys<T>>>, OrderByArg extends Prisma.True extends HasSelectOrTake ? {
        orderBy: DlImportBatchGroupByArgs['orderBy'];
    } : {
        orderBy?: DlImportBatchGroupByArgs['orderBy'];
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
    }[OrderFields]>(args: Prisma.SubsetIntersection<T, DlImportBatchGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetDlImportBatchGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>;
    readonly fields: DlImportBatchFieldRefs;
}
export interface Prisma__DlImportBatchClient<T, Null = never, ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise";
    files<T extends Prisma.DlImportBatch$filesArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.DlImportBatch$filesArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$DlImportFilePayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>;
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): runtime.Types.Utils.JsPromise<TResult1 | TResult2>;
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): runtime.Types.Utils.JsPromise<T | TResult>;
    finally(onfinally?: (() => void) | undefined | null): runtime.Types.Utils.JsPromise<T>;
}
export interface DlImportBatchFieldRefs {
    readonly id: Prisma.FieldRef<"DlImportBatch", 'BigInt'>;
    readonly status: Prisma.FieldRef<"DlImportBatch", 'String'>;
    readonly filesTotal: Prisma.FieldRef<"DlImportBatch", 'Int'>;
    readonly filesSuccess: Prisma.FieldRef<"DlImportBatch", 'Int'>;
    readonly filesFailed: Prisma.FieldRef<"DlImportBatch", 'Int'>;
    readonly createdAt: Prisma.FieldRef<"DlImportBatch", 'DateTime'>;
    readonly updatedAt: Prisma.FieldRef<"DlImportBatch", 'DateTime'>;
}
export type DlImportBatchFindUniqueArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.DlImportBatchSelect<ExtArgs> | null;
    omit?: Prisma.DlImportBatchOmit<ExtArgs> | null;
    include?: Prisma.DlImportBatchInclude<ExtArgs> | null;
    where: Prisma.DlImportBatchWhereUniqueInput;
};
export type DlImportBatchFindUniqueOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.DlImportBatchSelect<ExtArgs> | null;
    omit?: Prisma.DlImportBatchOmit<ExtArgs> | null;
    include?: Prisma.DlImportBatchInclude<ExtArgs> | null;
    where: Prisma.DlImportBatchWhereUniqueInput;
};
export type DlImportBatchFindFirstArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.DlImportBatchSelect<ExtArgs> | null;
    omit?: Prisma.DlImportBatchOmit<ExtArgs> | null;
    include?: Prisma.DlImportBatchInclude<ExtArgs> | null;
    where?: Prisma.DlImportBatchWhereInput;
    orderBy?: Prisma.DlImportBatchOrderByWithRelationInput | Prisma.DlImportBatchOrderByWithRelationInput[];
    cursor?: Prisma.DlImportBatchWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.DlImportBatchScalarFieldEnum | Prisma.DlImportBatchScalarFieldEnum[];
};
export type DlImportBatchFindFirstOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.DlImportBatchSelect<ExtArgs> | null;
    omit?: Prisma.DlImportBatchOmit<ExtArgs> | null;
    include?: Prisma.DlImportBatchInclude<ExtArgs> | null;
    where?: Prisma.DlImportBatchWhereInput;
    orderBy?: Prisma.DlImportBatchOrderByWithRelationInput | Prisma.DlImportBatchOrderByWithRelationInput[];
    cursor?: Prisma.DlImportBatchWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.DlImportBatchScalarFieldEnum | Prisma.DlImportBatchScalarFieldEnum[];
};
export type DlImportBatchFindManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.DlImportBatchSelect<ExtArgs> | null;
    omit?: Prisma.DlImportBatchOmit<ExtArgs> | null;
    include?: Prisma.DlImportBatchInclude<ExtArgs> | null;
    where?: Prisma.DlImportBatchWhereInput;
    orderBy?: Prisma.DlImportBatchOrderByWithRelationInput | Prisma.DlImportBatchOrderByWithRelationInput[];
    cursor?: Prisma.DlImportBatchWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.DlImportBatchScalarFieldEnum | Prisma.DlImportBatchScalarFieldEnum[];
};
export type DlImportBatchCreateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.DlImportBatchSelect<ExtArgs> | null;
    omit?: Prisma.DlImportBatchOmit<ExtArgs> | null;
    include?: Prisma.DlImportBatchInclude<ExtArgs> | null;
    data: Prisma.XOR<Prisma.DlImportBatchCreateInput, Prisma.DlImportBatchUncheckedCreateInput>;
};
export type DlImportBatchCreateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    data: Prisma.DlImportBatchCreateManyInput | Prisma.DlImportBatchCreateManyInput[];
    skipDuplicates?: boolean;
};
export type DlImportBatchCreateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.DlImportBatchSelectCreateManyAndReturn<ExtArgs> | null;
    omit?: Prisma.DlImportBatchOmit<ExtArgs> | null;
    data: Prisma.DlImportBatchCreateManyInput | Prisma.DlImportBatchCreateManyInput[];
    skipDuplicates?: boolean;
};
export type DlImportBatchUpdateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.DlImportBatchSelect<ExtArgs> | null;
    omit?: Prisma.DlImportBatchOmit<ExtArgs> | null;
    include?: Prisma.DlImportBatchInclude<ExtArgs> | null;
    data: Prisma.XOR<Prisma.DlImportBatchUpdateInput, Prisma.DlImportBatchUncheckedUpdateInput>;
    where: Prisma.DlImportBatchWhereUniqueInput;
};
export type DlImportBatchUpdateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    data: Prisma.XOR<Prisma.DlImportBatchUpdateManyMutationInput, Prisma.DlImportBatchUncheckedUpdateManyInput>;
    where?: Prisma.DlImportBatchWhereInput;
    limit?: number;
};
export type DlImportBatchUpdateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.DlImportBatchSelectUpdateManyAndReturn<ExtArgs> | null;
    omit?: Prisma.DlImportBatchOmit<ExtArgs> | null;
    data: Prisma.XOR<Prisma.DlImportBatchUpdateManyMutationInput, Prisma.DlImportBatchUncheckedUpdateManyInput>;
    where?: Prisma.DlImportBatchWhereInput;
    limit?: number;
};
export type DlImportBatchUpsertArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.DlImportBatchSelect<ExtArgs> | null;
    omit?: Prisma.DlImportBatchOmit<ExtArgs> | null;
    include?: Prisma.DlImportBatchInclude<ExtArgs> | null;
    where: Prisma.DlImportBatchWhereUniqueInput;
    create: Prisma.XOR<Prisma.DlImportBatchCreateInput, Prisma.DlImportBatchUncheckedCreateInput>;
    update: Prisma.XOR<Prisma.DlImportBatchUpdateInput, Prisma.DlImportBatchUncheckedUpdateInput>;
};
export type DlImportBatchDeleteArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.DlImportBatchSelect<ExtArgs> | null;
    omit?: Prisma.DlImportBatchOmit<ExtArgs> | null;
    include?: Prisma.DlImportBatchInclude<ExtArgs> | null;
    where: Prisma.DlImportBatchWhereUniqueInput;
};
export type DlImportBatchDeleteManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.DlImportBatchWhereInput;
    limit?: number;
};
export type DlImportBatch$filesArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
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
export type DlImportBatchDefaultArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.DlImportBatchSelect<ExtArgs> | null;
    omit?: Prisma.DlImportBatchOmit<ExtArgs> | null;
    include?: Prisma.DlImportBatchInclude<ExtArgs> | null;
};
export {};
