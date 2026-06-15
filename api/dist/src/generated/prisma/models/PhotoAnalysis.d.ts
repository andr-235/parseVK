import type * as runtime from "@prisma/client/runtime/client";
import type * as $Enums from "../enums.js";
import type * as Prisma from "../internal/prismaNamespace.js";
export type PhotoAnalysisModel = runtime.Types.Result.DefaultSelection<Prisma.$PhotoAnalysisPayload>;
export type AggregatePhotoAnalysis = {
    _count: PhotoAnalysisCountAggregateOutputType | null;
    _avg: PhotoAnalysisAvgAggregateOutputType | null;
    _sum: PhotoAnalysisSumAggregateOutputType | null;
    _min: PhotoAnalysisMinAggregateOutputType | null;
    _max: PhotoAnalysisMaxAggregateOutputType | null;
};
export type PhotoAnalysisAvgAggregateOutputType = {
    id: number | null;
    authorId: number | null;
    confidence: number | null;
};
export type PhotoAnalysisSumAggregateOutputType = {
    id: number | null;
    authorId: number | null;
    confidence: number | null;
};
export type PhotoAnalysisMinAggregateOutputType = {
    id: number | null;
    authorId: number | null;
    photoUrl: string | null;
    photoVkId: string | null;
    analysisResult: string | null;
    hasSuspicious: boolean | null;
    suspicionLevel: $Enums.SuspicionLevel | null;
    confidence: number | null;
    explanation: string | null;
    analyzedAt: Date | null;
    createdAt: Date | null;
    updatedAt: Date | null;
};
export type PhotoAnalysisMaxAggregateOutputType = {
    id: number | null;
    authorId: number | null;
    photoUrl: string | null;
    photoVkId: string | null;
    analysisResult: string | null;
    hasSuspicious: boolean | null;
    suspicionLevel: $Enums.SuspicionLevel | null;
    confidence: number | null;
    explanation: string | null;
    analyzedAt: Date | null;
    createdAt: Date | null;
    updatedAt: Date | null;
};
export type PhotoAnalysisCountAggregateOutputType = {
    id: number;
    authorId: number;
    photoUrl: number;
    photoVkId: number;
    analysisResult: number;
    hasSuspicious: number;
    suspicionLevel: number;
    categories: number;
    confidence: number;
    explanation: number;
    analyzedAt: number;
    createdAt: number;
    updatedAt: number;
    _all: number;
};
export type PhotoAnalysisAvgAggregateInputType = {
    id?: true;
    authorId?: true;
    confidence?: true;
};
export type PhotoAnalysisSumAggregateInputType = {
    id?: true;
    authorId?: true;
    confidence?: true;
};
export type PhotoAnalysisMinAggregateInputType = {
    id?: true;
    authorId?: true;
    photoUrl?: true;
    photoVkId?: true;
    analysisResult?: true;
    hasSuspicious?: true;
    suspicionLevel?: true;
    confidence?: true;
    explanation?: true;
    analyzedAt?: true;
    createdAt?: true;
    updatedAt?: true;
};
export type PhotoAnalysisMaxAggregateInputType = {
    id?: true;
    authorId?: true;
    photoUrl?: true;
    photoVkId?: true;
    analysisResult?: true;
    hasSuspicious?: true;
    suspicionLevel?: true;
    confidence?: true;
    explanation?: true;
    analyzedAt?: true;
    createdAt?: true;
    updatedAt?: true;
};
export type PhotoAnalysisCountAggregateInputType = {
    id?: true;
    authorId?: true;
    photoUrl?: true;
    photoVkId?: true;
    analysisResult?: true;
    hasSuspicious?: true;
    suspicionLevel?: true;
    categories?: true;
    confidence?: true;
    explanation?: true;
    analyzedAt?: true;
    createdAt?: true;
    updatedAt?: true;
    _all?: true;
};
export type PhotoAnalysisAggregateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.PhotoAnalysisWhereInput;
    orderBy?: Prisma.PhotoAnalysisOrderByWithRelationInput | Prisma.PhotoAnalysisOrderByWithRelationInput[];
    cursor?: Prisma.PhotoAnalysisWhereUniqueInput;
    take?: number;
    skip?: number;
    _count?: true | PhotoAnalysisCountAggregateInputType;
    _avg?: PhotoAnalysisAvgAggregateInputType;
    _sum?: PhotoAnalysisSumAggregateInputType;
    _min?: PhotoAnalysisMinAggregateInputType;
    _max?: PhotoAnalysisMaxAggregateInputType;
};
export type GetPhotoAnalysisAggregateType<T extends PhotoAnalysisAggregateArgs> = {
    [P in keyof T & keyof AggregatePhotoAnalysis]: P extends '_count' | 'count' ? T[P] extends true ? number : Prisma.GetScalarType<T[P], AggregatePhotoAnalysis[P]> : Prisma.GetScalarType<T[P], AggregatePhotoAnalysis[P]>;
};
export type PhotoAnalysisGroupByArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.PhotoAnalysisWhereInput;
    orderBy?: Prisma.PhotoAnalysisOrderByWithAggregationInput | Prisma.PhotoAnalysisOrderByWithAggregationInput[];
    by: Prisma.PhotoAnalysisScalarFieldEnum[] | Prisma.PhotoAnalysisScalarFieldEnum;
    having?: Prisma.PhotoAnalysisScalarWhereWithAggregatesInput;
    take?: number;
    skip?: number;
    _count?: PhotoAnalysisCountAggregateInputType | true;
    _avg?: PhotoAnalysisAvgAggregateInputType;
    _sum?: PhotoAnalysisSumAggregateInputType;
    _min?: PhotoAnalysisMinAggregateInputType;
    _max?: PhotoAnalysisMaxAggregateInputType;
};
export type PhotoAnalysisGroupByOutputType = {
    id: number;
    authorId: number;
    photoUrl: string;
    photoVkId: string;
    analysisResult: string;
    hasSuspicious: boolean;
    suspicionLevel: $Enums.SuspicionLevel;
    categories: string[];
    confidence: number | null;
    explanation: string | null;
    analyzedAt: Date;
    createdAt: Date;
    updatedAt: Date;
    _count: PhotoAnalysisCountAggregateOutputType | null;
    _avg: PhotoAnalysisAvgAggregateOutputType | null;
    _sum: PhotoAnalysisSumAggregateOutputType | null;
    _min: PhotoAnalysisMinAggregateOutputType | null;
    _max: PhotoAnalysisMaxAggregateOutputType | null;
};
type GetPhotoAnalysisGroupByPayload<T extends PhotoAnalysisGroupByArgs> = Prisma.PrismaPromise<Array<Prisma.PickEnumerable<PhotoAnalysisGroupByOutputType, T['by']> & {
    [P in ((keyof T) & (keyof PhotoAnalysisGroupByOutputType))]: P extends '_count' ? T[P] extends boolean ? number : Prisma.GetScalarType<T[P], PhotoAnalysisGroupByOutputType[P]> : Prisma.GetScalarType<T[P], PhotoAnalysisGroupByOutputType[P]>;
}>>;
export type PhotoAnalysisWhereInput = {
    AND?: Prisma.PhotoAnalysisWhereInput | Prisma.PhotoAnalysisWhereInput[];
    OR?: Prisma.PhotoAnalysisWhereInput[];
    NOT?: Prisma.PhotoAnalysisWhereInput | Prisma.PhotoAnalysisWhereInput[];
    id?: Prisma.IntFilter<"PhotoAnalysis"> | number;
    authorId?: Prisma.IntFilter<"PhotoAnalysis"> | number;
    photoUrl?: Prisma.StringFilter<"PhotoAnalysis"> | string;
    photoVkId?: Prisma.StringFilter<"PhotoAnalysis"> | string;
    analysisResult?: Prisma.StringFilter<"PhotoAnalysis"> | string;
    hasSuspicious?: Prisma.BoolFilter<"PhotoAnalysis"> | boolean;
    suspicionLevel?: Prisma.EnumSuspicionLevelFilter<"PhotoAnalysis"> | $Enums.SuspicionLevel;
    categories?: Prisma.StringNullableListFilter<"PhotoAnalysis">;
    confidence?: Prisma.FloatNullableFilter<"PhotoAnalysis"> | number | null;
    explanation?: Prisma.StringNullableFilter<"PhotoAnalysis"> | string | null;
    analyzedAt?: Prisma.DateTimeFilter<"PhotoAnalysis"> | Date | string;
    createdAt?: Prisma.DateTimeFilter<"PhotoAnalysis"> | Date | string;
    updatedAt?: Prisma.DateTimeFilter<"PhotoAnalysis"> | Date | string;
    author?: Prisma.XOR<Prisma.AuthorScalarRelationFilter, Prisma.AuthorWhereInput>;
};
export type PhotoAnalysisOrderByWithRelationInput = {
    id?: Prisma.SortOrder;
    authorId?: Prisma.SortOrder;
    photoUrl?: Prisma.SortOrder;
    photoVkId?: Prisma.SortOrder;
    analysisResult?: Prisma.SortOrder;
    hasSuspicious?: Prisma.SortOrder;
    suspicionLevel?: Prisma.SortOrder;
    categories?: Prisma.SortOrder;
    confidence?: Prisma.SortOrderInput | Prisma.SortOrder;
    explanation?: Prisma.SortOrderInput | Prisma.SortOrder;
    analyzedAt?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
    author?: Prisma.AuthorOrderByWithRelationInput;
};
export type PhotoAnalysisWhereUniqueInput = Prisma.AtLeast<{
    id?: number;
    authorId_photoVkId?: Prisma.PhotoAnalysisAuthorIdPhotoVkIdCompoundUniqueInput;
    AND?: Prisma.PhotoAnalysisWhereInput | Prisma.PhotoAnalysisWhereInput[];
    OR?: Prisma.PhotoAnalysisWhereInput[];
    NOT?: Prisma.PhotoAnalysisWhereInput | Prisma.PhotoAnalysisWhereInput[];
    authorId?: Prisma.IntFilter<"PhotoAnalysis"> | number;
    photoUrl?: Prisma.StringFilter<"PhotoAnalysis"> | string;
    photoVkId?: Prisma.StringFilter<"PhotoAnalysis"> | string;
    analysisResult?: Prisma.StringFilter<"PhotoAnalysis"> | string;
    hasSuspicious?: Prisma.BoolFilter<"PhotoAnalysis"> | boolean;
    suspicionLevel?: Prisma.EnumSuspicionLevelFilter<"PhotoAnalysis"> | $Enums.SuspicionLevel;
    categories?: Prisma.StringNullableListFilter<"PhotoAnalysis">;
    confidence?: Prisma.FloatNullableFilter<"PhotoAnalysis"> | number | null;
    explanation?: Prisma.StringNullableFilter<"PhotoAnalysis"> | string | null;
    analyzedAt?: Prisma.DateTimeFilter<"PhotoAnalysis"> | Date | string;
    createdAt?: Prisma.DateTimeFilter<"PhotoAnalysis"> | Date | string;
    updatedAt?: Prisma.DateTimeFilter<"PhotoAnalysis"> | Date | string;
    author?: Prisma.XOR<Prisma.AuthorScalarRelationFilter, Prisma.AuthorWhereInput>;
}, "id" | "authorId_photoVkId">;
export type PhotoAnalysisOrderByWithAggregationInput = {
    id?: Prisma.SortOrder;
    authorId?: Prisma.SortOrder;
    photoUrl?: Prisma.SortOrder;
    photoVkId?: Prisma.SortOrder;
    analysisResult?: Prisma.SortOrder;
    hasSuspicious?: Prisma.SortOrder;
    suspicionLevel?: Prisma.SortOrder;
    categories?: Prisma.SortOrder;
    confidence?: Prisma.SortOrderInput | Prisma.SortOrder;
    explanation?: Prisma.SortOrderInput | Prisma.SortOrder;
    analyzedAt?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
    _count?: Prisma.PhotoAnalysisCountOrderByAggregateInput;
    _avg?: Prisma.PhotoAnalysisAvgOrderByAggregateInput;
    _max?: Prisma.PhotoAnalysisMaxOrderByAggregateInput;
    _min?: Prisma.PhotoAnalysisMinOrderByAggregateInput;
    _sum?: Prisma.PhotoAnalysisSumOrderByAggregateInput;
};
export type PhotoAnalysisScalarWhereWithAggregatesInput = {
    AND?: Prisma.PhotoAnalysisScalarWhereWithAggregatesInput | Prisma.PhotoAnalysisScalarWhereWithAggregatesInput[];
    OR?: Prisma.PhotoAnalysisScalarWhereWithAggregatesInput[];
    NOT?: Prisma.PhotoAnalysisScalarWhereWithAggregatesInput | Prisma.PhotoAnalysisScalarWhereWithAggregatesInput[];
    id?: Prisma.IntWithAggregatesFilter<"PhotoAnalysis"> | number;
    authorId?: Prisma.IntWithAggregatesFilter<"PhotoAnalysis"> | number;
    photoUrl?: Prisma.StringWithAggregatesFilter<"PhotoAnalysis"> | string;
    photoVkId?: Prisma.StringWithAggregatesFilter<"PhotoAnalysis"> | string;
    analysisResult?: Prisma.StringWithAggregatesFilter<"PhotoAnalysis"> | string;
    hasSuspicious?: Prisma.BoolWithAggregatesFilter<"PhotoAnalysis"> | boolean;
    suspicionLevel?: Prisma.EnumSuspicionLevelWithAggregatesFilter<"PhotoAnalysis"> | $Enums.SuspicionLevel;
    categories?: Prisma.StringNullableListFilter<"PhotoAnalysis">;
    confidence?: Prisma.FloatNullableWithAggregatesFilter<"PhotoAnalysis"> | number | null;
    explanation?: Prisma.StringNullableWithAggregatesFilter<"PhotoAnalysis"> | string | null;
    analyzedAt?: Prisma.DateTimeWithAggregatesFilter<"PhotoAnalysis"> | Date | string;
    createdAt?: Prisma.DateTimeWithAggregatesFilter<"PhotoAnalysis"> | Date | string;
    updatedAt?: Prisma.DateTimeWithAggregatesFilter<"PhotoAnalysis"> | Date | string;
};
export type PhotoAnalysisCreateInput = {
    photoUrl: string;
    photoVkId: string;
    analysisResult: string;
    hasSuspicious?: boolean;
    suspicionLevel?: $Enums.SuspicionLevel;
    categories?: Prisma.PhotoAnalysisCreatecategoriesInput | string[];
    confidence?: number | null;
    explanation?: string | null;
    analyzedAt?: Date | string;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    author: Prisma.AuthorCreateNestedOneWithoutPhotoAnalysesInput;
};
export type PhotoAnalysisUncheckedCreateInput = {
    id?: number;
    authorId: number;
    photoUrl: string;
    photoVkId: string;
    analysisResult: string;
    hasSuspicious?: boolean;
    suspicionLevel?: $Enums.SuspicionLevel;
    categories?: Prisma.PhotoAnalysisCreatecategoriesInput | string[];
    confidence?: number | null;
    explanation?: string | null;
    analyzedAt?: Date | string;
    createdAt?: Date | string;
    updatedAt?: Date | string;
};
export type PhotoAnalysisUpdateInput = {
    photoUrl?: Prisma.StringFieldUpdateOperationsInput | string;
    photoVkId?: Prisma.StringFieldUpdateOperationsInput | string;
    analysisResult?: Prisma.StringFieldUpdateOperationsInput | string;
    hasSuspicious?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    suspicionLevel?: Prisma.EnumSuspicionLevelFieldUpdateOperationsInput | $Enums.SuspicionLevel;
    categories?: Prisma.PhotoAnalysisUpdatecategoriesInput | string[];
    confidence?: Prisma.NullableFloatFieldUpdateOperationsInput | number | null;
    explanation?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    analyzedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    author?: Prisma.AuthorUpdateOneRequiredWithoutPhotoAnalysesNestedInput;
};
export type PhotoAnalysisUncheckedUpdateInput = {
    id?: Prisma.IntFieldUpdateOperationsInput | number;
    authorId?: Prisma.IntFieldUpdateOperationsInput | number;
    photoUrl?: Prisma.StringFieldUpdateOperationsInput | string;
    photoVkId?: Prisma.StringFieldUpdateOperationsInput | string;
    analysisResult?: Prisma.StringFieldUpdateOperationsInput | string;
    hasSuspicious?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    suspicionLevel?: Prisma.EnumSuspicionLevelFieldUpdateOperationsInput | $Enums.SuspicionLevel;
    categories?: Prisma.PhotoAnalysisUpdatecategoriesInput | string[];
    confidence?: Prisma.NullableFloatFieldUpdateOperationsInput | number | null;
    explanation?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    analyzedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type PhotoAnalysisCreateManyInput = {
    id?: number;
    authorId: number;
    photoUrl: string;
    photoVkId: string;
    analysisResult: string;
    hasSuspicious?: boolean;
    suspicionLevel?: $Enums.SuspicionLevel;
    categories?: Prisma.PhotoAnalysisCreatecategoriesInput | string[];
    confidence?: number | null;
    explanation?: string | null;
    analyzedAt?: Date | string;
    createdAt?: Date | string;
    updatedAt?: Date | string;
};
export type PhotoAnalysisUpdateManyMutationInput = {
    photoUrl?: Prisma.StringFieldUpdateOperationsInput | string;
    photoVkId?: Prisma.StringFieldUpdateOperationsInput | string;
    analysisResult?: Prisma.StringFieldUpdateOperationsInput | string;
    hasSuspicious?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    suspicionLevel?: Prisma.EnumSuspicionLevelFieldUpdateOperationsInput | $Enums.SuspicionLevel;
    categories?: Prisma.PhotoAnalysisUpdatecategoriesInput | string[];
    confidence?: Prisma.NullableFloatFieldUpdateOperationsInput | number | null;
    explanation?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    analyzedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type PhotoAnalysisUncheckedUpdateManyInput = {
    id?: Prisma.IntFieldUpdateOperationsInput | number;
    authorId?: Prisma.IntFieldUpdateOperationsInput | number;
    photoUrl?: Prisma.StringFieldUpdateOperationsInput | string;
    photoVkId?: Prisma.StringFieldUpdateOperationsInput | string;
    analysisResult?: Prisma.StringFieldUpdateOperationsInput | string;
    hasSuspicious?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    suspicionLevel?: Prisma.EnumSuspicionLevelFieldUpdateOperationsInput | $Enums.SuspicionLevel;
    categories?: Prisma.PhotoAnalysisUpdatecategoriesInput | string[];
    confidence?: Prisma.NullableFloatFieldUpdateOperationsInput | number | null;
    explanation?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    analyzedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type PhotoAnalysisListRelationFilter = {
    every?: Prisma.PhotoAnalysisWhereInput;
    some?: Prisma.PhotoAnalysisWhereInput;
    none?: Prisma.PhotoAnalysisWhereInput;
};
export type PhotoAnalysisOrderByRelationAggregateInput = {
    _count?: Prisma.SortOrder;
};
export type PhotoAnalysisAuthorIdPhotoVkIdCompoundUniqueInput = {
    authorId: number;
    photoVkId: string;
};
export type PhotoAnalysisCountOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    authorId?: Prisma.SortOrder;
    photoUrl?: Prisma.SortOrder;
    photoVkId?: Prisma.SortOrder;
    analysisResult?: Prisma.SortOrder;
    hasSuspicious?: Prisma.SortOrder;
    suspicionLevel?: Prisma.SortOrder;
    categories?: Prisma.SortOrder;
    confidence?: Prisma.SortOrder;
    explanation?: Prisma.SortOrder;
    analyzedAt?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
};
export type PhotoAnalysisAvgOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    authorId?: Prisma.SortOrder;
    confidence?: Prisma.SortOrder;
};
export type PhotoAnalysisMaxOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    authorId?: Prisma.SortOrder;
    photoUrl?: Prisma.SortOrder;
    photoVkId?: Prisma.SortOrder;
    analysisResult?: Prisma.SortOrder;
    hasSuspicious?: Prisma.SortOrder;
    suspicionLevel?: Prisma.SortOrder;
    confidence?: Prisma.SortOrder;
    explanation?: Prisma.SortOrder;
    analyzedAt?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
};
export type PhotoAnalysisMinOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    authorId?: Prisma.SortOrder;
    photoUrl?: Prisma.SortOrder;
    photoVkId?: Prisma.SortOrder;
    analysisResult?: Prisma.SortOrder;
    hasSuspicious?: Prisma.SortOrder;
    suspicionLevel?: Prisma.SortOrder;
    confidence?: Prisma.SortOrder;
    explanation?: Prisma.SortOrder;
    analyzedAt?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
};
export type PhotoAnalysisSumOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    authorId?: Prisma.SortOrder;
    confidence?: Prisma.SortOrder;
};
export type PhotoAnalysisCreateNestedManyWithoutAuthorInput = {
    create?: Prisma.XOR<Prisma.PhotoAnalysisCreateWithoutAuthorInput, Prisma.PhotoAnalysisUncheckedCreateWithoutAuthorInput> | Prisma.PhotoAnalysisCreateWithoutAuthorInput[] | Prisma.PhotoAnalysisUncheckedCreateWithoutAuthorInput[];
    connectOrCreate?: Prisma.PhotoAnalysisCreateOrConnectWithoutAuthorInput | Prisma.PhotoAnalysisCreateOrConnectWithoutAuthorInput[];
    createMany?: Prisma.PhotoAnalysisCreateManyAuthorInputEnvelope;
    connect?: Prisma.PhotoAnalysisWhereUniqueInput | Prisma.PhotoAnalysisWhereUniqueInput[];
};
export type PhotoAnalysisUncheckedCreateNestedManyWithoutAuthorInput = {
    create?: Prisma.XOR<Prisma.PhotoAnalysisCreateWithoutAuthorInput, Prisma.PhotoAnalysisUncheckedCreateWithoutAuthorInput> | Prisma.PhotoAnalysisCreateWithoutAuthorInput[] | Prisma.PhotoAnalysisUncheckedCreateWithoutAuthorInput[];
    connectOrCreate?: Prisma.PhotoAnalysisCreateOrConnectWithoutAuthorInput | Prisma.PhotoAnalysisCreateOrConnectWithoutAuthorInput[];
    createMany?: Prisma.PhotoAnalysisCreateManyAuthorInputEnvelope;
    connect?: Prisma.PhotoAnalysisWhereUniqueInput | Prisma.PhotoAnalysisWhereUniqueInput[];
};
export type PhotoAnalysisUpdateManyWithoutAuthorNestedInput = {
    create?: Prisma.XOR<Prisma.PhotoAnalysisCreateWithoutAuthorInput, Prisma.PhotoAnalysisUncheckedCreateWithoutAuthorInput> | Prisma.PhotoAnalysisCreateWithoutAuthorInput[] | Prisma.PhotoAnalysisUncheckedCreateWithoutAuthorInput[];
    connectOrCreate?: Prisma.PhotoAnalysisCreateOrConnectWithoutAuthorInput | Prisma.PhotoAnalysisCreateOrConnectWithoutAuthorInput[];
    upsert?: Prisma.PhotoAnalysisUpsertWithWhereUniqueWithoutAuthorInput | Prisma.PhotoAnalysisUpsertWithWhereUniqueWithoutAuthorInput[];
    createMany?: Prisma.PhotoAnalysisCreateManyAuthorInputEnvelope;
    set?: Prisma.PhotoAnalysisWhereUniqueInput | Prisma.PhotoAnalysisWhereUniqueInput[];
    disconnect?: Prisma.PhotoAnalysisWhereUniqueInput | Prisma.PhotoAnalysisWhereUniqueInput[];
    delete?: Prisma.PhotoAnalysisWhereUniqueInput | Prisma.PhotoAnalysisWhereUniqueInput[];
    connect?: Prisma.PhotoAnalysisWhereUniqueInput | Prisma.PhotoAnalysisWhereUniqueInput[];
    update?: Prisma.PhotoAnalysisUpdateWithWhereUniqueWithoutAuthorInput | Prisma.PhotoAnalysisUpdateWithWhereUniqueWithoutAuthorInput[];
    updateMany?: Prisma.PhotoAnalysisUpdateManyWithWhereWithoutAuthorInput | Prisma.PhotoAnalysisUpdateManyWithWhereWithoutAuthorInput[];
    deleteMany?: Prisma.PhotoAnalysisScalarWhereInput | Prisma.PhotoAnalysisScalarWhereInput[];
};
export type PhotoAnalysisUncheckedUpdateManyWithoutAuthorNestedInput = {
    create?: Prisma.XOR<Prisma.PhotoAnalysisCreateWithoutAuthorInput, Prisma.PhotoAnalysisUncheckedCreateWithoutAuthorInput> | Prisma.PhotoAnalysisCreateWithoutAuthorInput[] | Prisma.PhotoAnalysisUncheckedCreateWithoutAuthorInput[];
    connectOrCreate?: Prisma.PhotoAnalysisCreateOrConnectWithoutAuthorInput | Prisma.PhotoAnalysisCreateOrConnectWithoutAuthorInput[];
    upsert?: Prisma.PhotoAnalysisUpsertWithWhereUniqueWithoutAuthorInput | Prisma.PhotoAnalysisUpsertWithWhereUniqueWithoutAuthorInput[];
    createMany?: Prisma.PhotoAnalysisCreateManyAuthorInputEnvelope;
    set?: Prisma.PhotoAnalysisWhereUniqueInput | Prisma.PhotoAnalysisWhereUniqueInput[];
    disconnect?: Prisma.PhotoAnalysisWhereUniqueInput | Prisma.PhotoAnalysisWhereUniqueInput[];
    delete?: Prisma.PhotoAnalysisWhereUniqueInput | Prisma.PhotoAnalysisWhereUniqueInput[];
    connect?: Prisma.PhotoAnalysisWhereUniqueInput | Prisma.PhotoAnalysisWhereUniqueInput[];
    update?: Prisma.PhotoAnalysisUpdateWithWhereUniqueWithoutAuthorInput | Prisma.PhotoAnalysisUpdateWithWhereUniqueWithoutAuthorInput[];
    updateMany?: Prisma.PhotoAnalysisUpdateManyWithWhereWithoutAuthorInput | Prisma.PhotoAnalysisUpdateManyWithWhereWithoutAuthorInput[];
    deleteMany?: Prisma.PhotoAnalysisScalarWhereInput | Prisma.PhotoAnalysisScalarWhereInput[];
};
export type PhotoAnalysisCreatecategoriesInput = {
    set: string[];
};
export type EnumSuspicionLevelFieldUpdateOperationsInput = {
    set?: $Enums.SuspicionLevel;
};
export type PhotoAnalysisUpdatecategoriesInput = {
    set?: string[];
    push?: string | string[];
};
export type PhotoAnalysisCreateWithoutAuthorInput = {
    photoUrl: string;
    photoVkId: string;
    analysisResult: string;
    hasSuspicious?: boolean;
    suspicionLevel?: $Enums.SuspicionLevel;
    categories?: Prisma.PhotoAnalysisCreatecategoriesInput | string[];
    confidence?: number | null;
    explanation?: string | null;
    analyzedAt?: Date | string;
    createdAt?: Date | string;
    updatedAt?: Date | string;
};
export type PhotoAnalysisUncheckedCreateWithoutAuthorInput = {
    id?: number;
    photoUrl: string;
    photoVkId: string;
    analysisResult: string;
    hasSuspicious?: boolean;
    suspicionLevel?: $Enums.SuspicionLevel;
    categories?: Prisma.PhotoAnalysisCreatecategoriesInput | string[];
    confidence?: number | null;
    explanation?: string | null;
    analyzedAt?: Date | string;
    createdAt?: Date | string;
    updatedAt?: Date | string;
};
export type PhotoAnalysisCreateOrConnectWithoutAuthorInput = {
    where: Prisma.PhotoAnalysisWhereUniqueInput;
    create: Prisma.XOR<Prisma.PhotoAnalysisCreateWithoutAuthorInput, Prisma.PhotoAnalysisUncheckedCreateWithoutAuthorInput>;
};
export type PhotoAnalysisCreateManyAuthorInputEnvelope = {
    data: Prisma.PhotoAnalysisCreateManyAuthorInput | Prisma.PhotoAnalysisCreateManyAuthorInput[];
    skipDuplicates?: boolean;
};
export type PhotoAnalysisUpsertWithWhereUniqueWithoutAuthorInput = {
    where: Prisma.PhotoAnalysisWhereUniqueInput;
    update: Prisma.XOR<Prisma.PhotoAnalysisUpdateWithoutAuthorInput, Prisma.PhotoAnalysisUncheckedUpdateWithoutAuthorInput>;
    create: Prisma.XOR<Prisma.PhotoAnalysisCreateWithoutAuthorInput, Prisma.PhotoAnalysisUncheckedCreateWithoutAuthorInput>;
};
export type PhotoAnalysisUpdateWithWhereUniqueWithoutAuthorInput = {
    where: Prisma.PhotoAnalysisWhereUniqueInput;
    data: Prisma.XOR<Prisma.PhotoAnalysisUpdateWithoutAuthorInput, Prisma.PhotoAnalysisUncheckedUpdateWithoutAuthorInput>;
};
export type PhotoAnalysisUpdateManyWithWhereWithoutAuthorInput = {
    where: Prisma.PhotoAnalysisScalarWhereInput;
    data: Prisma.XOR<Prisma.PhotoAnalysisUpdateManyMutationInput, Prisma.PhotoAnalysisUncheckedUpdateManyWithoutAuthorInput>;
};
export type PhotoAnalysisScalarWhereInput = {
    AND?: Prisma.PhotoAnalysisScalarWhereInput | Prisma.PhotoAnalysisScalarWhereInput[];
    OR?: Prisma.PhotoAnalysisScalarWhereInput[];
    NOT?: Prisma.PhotoAnalysisScalarWhereInput | Prisma.PhotoAnalysisScalarWhereInput[];
    id?: Prisma.IntFilter<"PhotoAnalysis"> | number;
    authorId?: Prisma.IntFilter<"PhotoAnalysis"> | number;
    photoUrl?: Prisma.StringFilter<"PhotoAnalysis"> | string;
    photoVkId?: Prisma.StringFilter<"PhotoAnalysis"> | string;
    analysisResult?: Prisma.StringFilter<"PhotoAnalysis"> | string;
    hasSuspicious?: Prisma.BoolFilter<"PhotoAnalysis"> | boolean;
    suspicionLevel?: Prisma.EnumSuspicionLevelFilter<"PhotoAnalysis"> | $Enums.SuspicionLevel;
    categories?: Prisma.StringNullableListFilter<"PhotoAnalysis">;
    confidence?: Prisma.FloatNullableFilter<"PhotoAnalysis"> | number | null;
    explanation?: Prisma.StringNullableFilter<"PhotoAnalysis"> | string | null;
    analyzedAt?: Prisma.DateTimeFilter<"PhotoAnalysis"> | Date | string;
    createdAt?: Prisma.DateTimeFilter<"PhotoAnalysis"> | Date | string;
    updatedAt?: Prisma.DateTimeFilter<"PhotoAnalysis"> | Date | string;
};
export type PhotoAnalysisCreateManyAuthorInput = {
    id?: number;
    photoUrl: string;
    photoVkId: string;
    analysisResult: string;
    hasSuspicious?: boolean;
    suspicionLevel?: $Enums.SuspicionLevel;
    categories?: Prisma.PhotoAnalysisCreatecategoriesInput | string[];
    confidence?: number | null;
    explanation?: string | null;
    analyzedAt?: Date | string;
    createdAt?: Date | string;
    updatedAt?: Date | string;
};
export type PhotoAnalysisUpdateWithoutAuthorInput = {
    photoUrl?: Prisma.StringFieldUpdateOperationsInput | string;
    photoVkId?: Prisma.StringFieldUpdateOperationsInput | string;
    analysisResult?: Prisma.StringFieldUpdateOperationsInput | string;
    hasSuspicious?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    suspicionLevel?: Prisma.EnumSuspicionLevelFieldUpdateOperationsInput | $Enums.SuspicionLevel;
    categories?: Prisma.PhotoAnalysisUpdatecategoriesInput | string[];
    confidence?: Prisma.NullableFloatFieldUpdateOperationsInput | number | null;
    explanation?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    analyzedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type PhotoAnalysisUncheckedUpdateWithoutAuthorInput = {
    id?: Prisma.IntFieldUpdateOperationsInput | number;
    photoUrl?: Prisma.StringFieldUpdateOperationsInput | string;
    photoVkId?: Prisma.StringFieldUpdateOperationsInput | string;
    analysisResult?: Prisma.StringFieldUpdateOperationsInput | string;
    hasSuspicious?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    suspicionLevel?: Prisma.EnumSuspicionLevelFieldUpdateOperationsInput | $Enums.SuspicionLevel;
    categories?: Prisma.PhotoAnalysisUpdatecategoriesInput | string[];
    confidence?: Prisma.NullableFloatFieldUpdateOperationsInput | number | null;
    explanation?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    analyzedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type PhotoAnalysisUncheckedUpdateManyWithoutAuthorInput = {
    id?: Prisma.IntFieldUpdateOperationsInput | number;
    photoUrl?: Prisma.StringFieldUpdateOperationsInput | string;
    photoVkId?: Prisma.StringFieldUpdateOperationsInput | string;
    analysisResult?: Prisma.StringFieldUpdateOperationsInput | string;
    hasSuspicious?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    suspicionLevel?: Prisma.EnumSuspicionLevelFieldUpdateOperationsInput | $Enums.SuspicionLevel;
    categories?: Prisma.PhotoAnalysisUpdatecategoriesInput | string[];
    confidence?: Prisma.NullableFloatFieldUpdateOperationsInput | number | null;
    explanation?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    analyzedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type PhotoAnalysisSelect<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    authorId?: boolean;
    photoUrl?: boolean;
    photoVkId?: boolean;
    analysisResult?: boolean;
    hasSuspicious?: boolean;
    suspicionLevel?: boolean;
    categories?: boolean;
    confidence?: boolean;
    explanation?: boolean;
    analyzedAt?: boolean;
    createdAt?: boolean;
    updatedAt?: boolean;
    author?: boolean | Prisma.AuthorDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["photoAnalysis"]>;
export type PhotoAnalysisSelectCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    authorId?: boolean;
    photoUrl?: boolean;
    photoVkId?: boolean;
    analysisResult?: boolean;
    hasSuspicious?: boolean;
    suspicionLevel?: boolean;
    categories?: boolean;
    confidence?: boolean;
    explanation?: boolean;
    analyzedAt?: boolean;
    createdAt?: boolean;
    updatedAt?: boolean;
    author?: boolean | Prisma.AuthorDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["photoAnalysis"]>;
export type PhotoAnalysisSelectUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    authorId?: boolean;
    photoUrl?: boolean;
    photoVkId?: boolean;
    analysisResult?: boolean;
    hasSuspicious?: boolean;
    suspicionLevel?: boolean;
    categories?: boolean;
    confidence?: boolean;
    explanation?: boolean;
    analyzedAt?: boolean;
    createdAt?: boolean;
    updatedAt?: boolean;
    author?: boolean | Prisma.AuthorDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["photoAnalysis"]>;
export type PhotoAnalysisSelectScalar = {
    id?: boolean;
    authorId?: boolean;
    photoUrl?: boolean;
    photoVkId?: boolean;
    analysisResult?: boolean;
    hasSuspicious?: boolean;
    suspicionLevel?: boolean;
    categories?: boolean;
    confidence?: boolean;
    explanation?: boolean;
    analyzedAt?: boolean;
    createdAt?: boolean;
    updatedAt?: boolean;
};
export type PhotoAnalysisOmit<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetOmit<"id" | "authorId" | "photoUrl" | "photoVkId" | "analysisResult" | "hasSuspicious" | "suspicionLevel" | "categories" | "confidence" | "explanation" | "analyzedAt" | "createdAt" | "updatedAt", ExtArgs["result"]["photoAnalysis"]>;
export type PhotoAnalysisInclude<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    author?: boolean | Prisma.AuthorDefaultArgs<ExtArgs>;
};
export type PhotoAnalysisIncludeCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    author?: boolean | Prisma.AuthorDefaultArgs<ExtArgs>;
};
export type PhotoAnalysisIncludeUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    author?: boolean | Prisma.AuthorDefaultArgs<ExtArgs>;
};
export type $PhotoAnalysisPayload<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    name: "PhotoAnalysis";
    objects: {
        author: Prisma.$AuthorPayload<ExtArgs>;
    };
    scalars: runtime.Types.Extensions.GetPayloadResult<{
        id: number;
        authorId: number;
        photoUrl: string;
        photoVkId: string;
        analysisResult: string;
        hasSuspicious: boolean;
        suspicionLevel: $Enums.SuspicionLevel;
        categories: string[];
        confidence: number | null;
        explanation: string | null;
        analyzedAt: Date;
        createdAt: Date;
        updatedAt: Date;
    }, ExtArgs["result"]["photoAnalysis"]>;
    composites: {};
};
export type PhotoAnalysisGetPayload<S extends boolean | null | undefined | PhotoAnalysisDefaultArgs> = runtime.Types.Result.GetResult<Prisma.$PhotoAnalysisPayload, S>;
export type PhotoAnalysisCountArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = Omit<PhotoAnalysisFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
    select?: PhotoAnalysisCountAggregateInputType | true;
};
export interface PhotoAnalysisDelegate<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: {
        types: Prisma.TypeMap<ExtArgs>['model']['PhotoAnalysis'];
        meta: {
            name: 'PhotoAnalysis';
        };
    };
    findUnique<T extends PhotoAnalysisFindUniqueArgs>(args: Prisma.SelectSubset<T, PhotoAnalysisFindUniqueArgs<ExtArgs>>): Prisma.Prisma__PhotoAnalysisClient<runtime.Types.Result.GetResult<Prisma.$PhotoAnalysisPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    findUniqueOrThrow<T extends PhotoAnalysisFindUniqueOrThrowArgs>(args: Prisma.SelectSubset<T, PhotoAnalysisFindUniqueOrThrowArgs<ExtArgs>>): Prisma.Prisma__PhotoAnalysisClient<runtime.Types.Result.GetResult<Prisma.$PhotoAnalysisPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    findFirst<T extends PhotoAnalysisFindFirstArgs>(args?: Prisma.SelectSubset<T, PhotoAnalysisFindFirstArgs<ExtArgs>>): Prisma.Prisma__PhotoAnalysisClient<runtime.Types.Result.GetResult<Prisma.$PhotoAnalysisPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    findFirstOrThrow<T extends PhotoAnalysisFindFirstOrThrowArgs>(args?: Prisma.SelectSubset<T, PhotoAnalysisFindFirstOrThrowArgs<ExtArgs>>): Prisma.Prisma__PhotoAnalysisClient<runtime.Types.Result.GetResult<Prisma.$PhotoAnalysisPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    findMany<T extends PhotoAnalysisFindManyArgs>(args?: Prisma.SelectSubset<T, PhotoAnalysisFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$PhotoAnalysisPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>;
    create<T extends PhotoAnalysisCreateArgs>(args: Prisma.SelectSubset<T, PhotoAnalysisCreateArgs<ExtArgs>>): Prisma.Prisma__PhotoAnalysisClient<runtime.Types.Result.GetResult<Prisma.$PhotoAnalysisPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    createMany<T extends PhotoAnalysisCreateManyArgs>(args?: Prisma.SelectSubset<T, PhotoAnalysisCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    createManyAndReturn<T extends PhotoAnalysisCreateManyAndReturnArgs>(args?: Prisma.SelectSubset<T, PhotoAnalysisCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$PhotoAnalysisPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>;
    delete<T extends PhotoAnalysisDeleteArgs>(args: Prisma.SelectSubset<T, PhotoAnalysisDeleteArgs<ExtArgs>>): Prisma.Prisma__PhotoAnalysisClient<runtime.Types.Result.GetResult<Prisma.$PhotoAnalysisPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    update<T extends PhotoAnalysisUpdateArgs>(args: Prisma.SelectSubset<T, PhotoAnalysisUpdateArgs<ExtArgs>>): Prisma.Prisma__PhotoAnalysisClient<runtime.Types.Result.GetResult<Prisma.$PhotoAnalysisPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    deleteMany<T extends PhotoAnalysisDeleteManyArgs>(args?: Prisma.SelectSubset<T, PhotoAnalysisDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    updateMany<T extends PhotoAnalysisUpdateManyArgs>(args: Prisma.SelectSubset<T, PhotoAnalysisUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    updateManyAndReturn<T extends PhotoAnalysisUpdateManyAndReturnArgs>(args: Prisma.SelectSubset<T, PhotoAnalysisUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$PhotoAnalysisPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>;
    upsert<T extends PhotoAnalysisUpsertArgs>(args: Prisma.SelectSubset<T, PhotoAnalysisUpsertArgs<ExtArgs>>): Prisma.Prisma__PhotoAnalysisClient<runtime.Types.Result.GetResult<Prisma.$PhotoAnalysisPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    count<T extends PhotoAnalysisCountArgs>(args?: Prisma.Subset<T, PhotoAnalysisCountArgs>): Prisma.PrismaPromise<T extends runtime.Types.Utils.Record<'select', any> ? T['select'] extends true ? number : Prisma.GetScalarType<T['select'], PhotoAnalysisCountAggregateOutputType> : number>;
    aggregate<T extends PhotoAnalysisAggregateArgs>(args: Prisma.Subset<T, PhotoAnalysisAggregateArgs>): Prisma.PrismaPromise<GetPhotoAnalysisAggregateType<T>>;
    groupBy<T extends PhotoAnalysisGroupByArgs, HasSelectOrTake extends Prisma.Or<Prisma.Extends<'skip', Prisma.Keys<T>>, Prisma.Extends<'take', Prisma.Keys<T>>>, OrderByArg extends Prisma.True extends HasSelectOrTake ? {
        orderBy: PhotoAnalysisGroupByArgs['orderBy'];
    } : {
        orderBy?: PhotoAnalysisGroupByArgs['orderBy'];
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
    }[OrderFields]>(args: Prisma.SubsetIntersection<T, PhotoAnalysisGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetPhotoAnalysisGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>;
    readonly fields: PhotoAnalysisFieldRefs;
}
export interface Prisma__PhotoAnalysisClient<T, Null = never, ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise";
    author<T extends Prisma.AuthorDefaultArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.AuthorDefaultArgs<ExtArgs>>): Prisma.Prisma__AuthorClient<runtime.Types.Result.GetResult<Prisma.$AuthorPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>;
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): runtime.Types.Utils.JsPromise<TResult1 | TResult2>;
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): runtime.Types.Utils.JsPromise<T | TResult>;
    finally(onfinally?: (() => void) | undefined | null): runtime.Types.Utils.JsPromise<T>;
}
export interface PhotoAnalysisFieldRefs {
    readonly id: Prisma.FieldRef<"PhotoAnalysis", 'Int'>;
    readonly authorId: Prisma.FieldRef<"PhotoAnalysis", 'Int'>;
    readonly photoUrl: Prisma.FieldRef<"PhotoAnalysis", 'String'>;
    readonly photoVkId: Prisma.FieldRef<"PhotoAnalysis", 'String'>;
    readonly analysisResult: Prisma.FieldRef<"PhotoAnalysis", 'String'>;
    readonly hasSuspicious: Prisma.FieldRef<"PhotoAnalysis", 'Boolean'>;
    readonly suspicionLevel: Prisma.FieldRef<"PhotoAnalysis", 'SuspicionLevel'>;
    readonly categories: Prisma.FieldRef<"PhotoAnalysis", 'String[]'>;
    readonly confidence: Prisma.FieldRef<"PhotoAnalysis", 'Float'>;
    readonly explanation: Prisma.FieldRef<"PhotoAnalysis", 'String'>;
    readonly analyzedAt: Prisma.FieldRef<"PhotoAnalysis", 'DateTime'>;
    readonly createdAt: Prisma.FieldRef<"PhotoAnalysis", 'DateTime'>;
    readonly updatedAt: Prisma.FieldRef<"PhotoAnalysis", 'DateTime'>;
}
export type PhotoAnalysisFindUniqueArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.PhotoAnalysisSelect<ExtArgs> | null;
    omit?: Prisma.PhotoAnalysisOmit<ExtArgs> | null;
    include?: Prisma.PhotoAnalysisInclude<ExtArgs> | null;
    where: Prisma.PhotoAnalysisWhereUniqueInput;
};
export type PhotoAnalysisFindUniqueOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.PhotoAnalysisSelect<ExtArgs> | null;
    omit?: Prisma.PhotoAnalysisOmit<ExtArgs> | null;
    include?: Prisma.PhotoAnalysisInclude<ExtArgs> | null;
    where: Prisma.PhotoAnalysisWhereUniqueInput;
};
export type PhotoAnalysisFindFirstArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.PhotoAnalysisSelect<ExtArgs> | null;
    omit?: Prisma.PhotoAnalysisOmit<ExtArgs> | null;
    include?: Prisma.PhotoAnalysisInclude<ExtArgs> | null;
    where?: Prisma.PhotoAnalysisWhereInput;
    orderBy?: Prisma.PhotoAnalysisOrderByWithRelationInput | Prisma.PhotoAnalysisOrderByWithRelationInput[];
    cursor?: Prisma.PhotoAnalysisWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.PhotoAnalysisScalarFieldEnum | Prisma.PhotoAnalysisScalarFieldEnum[];
};
export type PhotoAnalysisFindFirstOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.PhotoAnalysisSelect<ExtArgs> | null;
    omit?: Prisma.PhotoAnalysisOmit<ExtArgs> | null;
    include?: Prisma.PhotoAnalysisInclude<ExtArgs> | null;
    where?: Prisma.PhotoAnalysisWhereInput;
    orderBy?: Prisma.PhotoAnalysisOrderByWithRelationInput | Prisma.PhotoAnalysisOrderByWithRelationInput[];
    cursor?: Prisma.PhotoAnalysisWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.PhotoAnalysisScalarFieldEnum | Prisma.PhotoAnalysisScalarFieldEnum[];
};
export type PhotoAnalysisFindManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.PhotoAnalysisSelect<ExtArgs> | null;
    omit?: Prisma.PhotoAnalysisOmit<ExtArgs> | null;
    include?: Prisma.PhotoAnalysisInclude<ExtArgs> | null;
    where?: Prisma.PhotoAnalysisWhereInput;
    orderBy?: Prisma.PhotoAnalysisOrderByWithRelationInput | Prisma.PhotoAnalysisOrderByWithRelationInput[];
    cursor?: Prisma.PhotoAnalysisWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.PhotoAnalysisScalarFieldEnum | Prisma.PhotoAnalysisScalarFieldEnum[];
};
export type PhotoAnalysisCreateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.PhotoAnalysisSelect<ExtArgs> | null;
    omit?: Prisma.PhotoAnalysisOmit<ExtArgs> | null;
    include?: Prisma.PhotoAnalysisInclude<ExtArgs> | null;
    data: Prisma.XOR<Prisma.PhotoAnalysisCreateInput, Prisma.PhotoAnalysisUncheckedCreateInput>;
};
export type PhotoAnalysisCreateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    data: Prisma.PhotoAnalysisCreateManyInput | Prisma.PhotoAnalysisCreateManyInput[];
    skipDuplicates?: boolean;
};
export type PhotoAnalysisCreateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.PhotoAnalysisSelectCreateManyAndReturn<ExtArgs> | null;
    omit?: Prisma.PhotoAnalysisOmit<ExtArgs> | null;
    data: Prisma.PhotoAnalysisCreateManyInput | Prisma.PhotoAnalysisCreateManyInput[];
    skipDuplicates?: boolean;
    include?: Prisma.PhotoAnalysisIncludeCreateManyAndReturn<ExtArgs> | null;
};
export type PhotoAnalysisUpdateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.PhotoAnalysisSelect<ExtArgs> | null;
    omit?: Prisma.PhotoAnalysisOmit<ExtArgs> | null;
    include?: Prisma.PhotoAnalysisInclude<ExtArgs> | null;
    data: Prisma.XOR<Prisma.PhotoAnalysisUpdateInput, Prisma.PhotoAnalysisUncheckedUpdateInput>;
    where: Prisma.PhotoAnalysisWhereUniqueInput;
};
export type PhotoAnalysisUpdateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    data: Prisma.XOR<Prisma.PhotoAnalysisUpdateManyMutationInput, Prisma.PhotoAnalysisUncheckedUpdateManyInput>;
    where?: Prisma.PhotoAnalysisWhereInput;
    limit?: number;
};
export type PhotoAnalysisUpdateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.PhotoAnalysisSelectUpdateManyAndReturn<ExtArgs> | null;
    omit?: Prisma.PhotoAnalysisOmit<ExtArgs> | null;
    data: Prisma.XOR<Prisma.PhotoAnalysisUpdateManyMutationInput, Prisma.PhotoAnalysisUncheckedUpdateManyInput>;
    where?: Prisma.PhotoAnalysisWhereInput;
    limit?: number;
    include?: Prisma.PhotoAnalysisIncludeUpdateManyAndReturn<ExtArgs> | null;
};
export type PhotoAnalysisUpsertArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.PhotoAnalysisSelect<ExtArgs> | null;
    omit?: Prisma.PhotoAnalysisOmit<ExtArgs> | null;
    include?: Prisma.PhotoAnalysisInclude<ExtArgs> | null;
    where: Prisma.PhotoAnalysisWhereUniqueInput;
    create: Prisma.XOR<Prisma.PhotoAnalysisCreateInput, Prisma.PhotoAnalysisUncheckedCreateInput>;
    update: Prisma.XOR<Prisma.PhotoAnalysisUpdateInput, Prisma.PhotoAnalysisUncheckedUpdateInput>;
};
export type PhotoAnalysisDeleteArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.PhotoAnalysisSelect<ExtArgs> | null;
    omit?: Prisma.PhotoAnalysisOmit<ExtArgs> | null;
    include?: Prisma.PhotoAnalysisInclude<ExtArgs> | null;
    where: Prisma.PhotoAnalysisWhereUniqueInput;
};
export type PhotoAnalysisDeleteManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.PhotoAnalysisWhereInput;
    limit?: number;
};
export type PhotoAnalysisDefaultArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.PhotoAnalysisSelect<ExtArgs> | null;
    omit?: Prisma.PhotoAnalysisOmit<ExtArgs> | null;
    include?: Prisma.PhotoAnalysisInclude<ExtArgs> | null;
};
export {};
