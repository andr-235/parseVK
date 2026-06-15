import type * as runtime from "@prisma/client/runtime/client";
import type * as $Enums from "../enums.js";
import type * as Prisma from "../internal/prismaNamespace.js";
export type CommentKeywordMatchModel = runtime.Types.Result.DefaultSelection<Prisma.$CommentKeywordMatchPayload>;
export type AggregateCommentKeywordMatch = {
    _count: CommentKeywordMatchCountAggregateOutputType | null;
    _avg: CommentKeywordMatchAvgAggregateOutputType | null;
    _sum: CommentKeywordMatchSumAggregateOutputType | null;
    _min: CommentKeywordMatchMinAggregateOutputType | null;
    _max: CommentKeywordMatchMaxAggregateOutputType | null;
};
export type CommentKeywordMatchAvgAggregateOutputType = {
    commentId: number | null;
    keywordId: number | null;
};
export type CommentKeywordMatchSumAggregateOutputType = {
    commentId: number | null;
    keywordId: number | null;
};
export type CommentKeywordMatchMinAggregateOutputType = {
    commentId: number | null;
    keywordId: number | null;
    source: $Enums.MatchSource | null;
    createdAt: Date | null;
};
export type CommentKeywordMatchMaxAggregateOutputType = {
    commentId: number | null;
    keywordId: number | null;
    source: $Enums.MatchSource | null;
    createdAt: Date | null;
};
export type CommentKeywordMatchCountAggregateOutputType = {
    commentId: number;
    keywordId: number;
    source: number;
    createdAt: number;
    _all: number;
};
export type CommentKeywordMatchAvgAggregateInputType = {
    commentId?: true;
    keywordId?: true;
};
export type CommentKeywordMatchSumAggregateInputType = {
    commentId?: true;
    keywordId?: true;
};
export type CommentKeywordMatchMinAggregateInputType = {
    commentId?: true;
    keywordId?: true;
    source?: true;
    createdAt?: true;
};
export type CommentKeywordMatchMaxAggregateInputType = {
    commentId?: true;
    keywordId?: true;
    source?: true;
    createdAt?: true;
};
export type CommentKeywordMatchCountAggregateInputType = {
    commentId?: true;
    keywordId?: true;
    source?: true;
    createdAt?: true;
    _all?: true;
};
export type CommentKeywordMatchAggregateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.CommentKeywordMatchWhereInput;
    orderBy?: Prisma.CommentKeywordMatchOrderByWithRelationInput | Prisma.CommentKeywordMatchOrderByWithRelationInput[];
    cursor?: Prisma.CommentKeywordMatchWhereUniqueInput;
    take?: number;
    skip?: number;
    _count?: true | CommentKeywordMatchCountAggregateInputType;
    _avg?: CommentKeywordMatchAvgAggregateInputType;
    _sum?: CommentKeywordMatchSumAggregateInputType;
    _min?: CommentKeywordMatchMinAggregateInputType;
    _max?: CommentKeywordMatchMaxAggregateInputType;
};
export type GetCommentKeywordMatchAggregateType<T extends CommentKeywordMatchAggregateArgs> = {
    [P in keyof T & keyof AggregateCommentKeywordMatch]: P extends '_count' | 'count' ? T[P] extends true ? number : Prisma.GetScalarType<T[P], AggregateCommentKeywordMatch[P]> : Prisma.GetScalarType<T[P], AggregateCommentKeywordMatch[P]>;
};
export type CommentKeywordMatchGroupByArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.CommentKeywordMatchWhereInput;
    orderBy?: Prisma.CommentKeywordMatchOrderByWithAggregationInput | Prisma.CommentKeywordMatchOrderByWithAggregationInput[];
    by: Prisma.CommentKeywordMatchScalarFieldEnum[] | Prisma.CommentKeywordMatchScalarFieldEnum;
    having?: Prisma.CommentKeywordMatchScalarWhereWithAggregatesInput;
    take?: number;
    skip?: number;
    _count?: CommentKeywordMatchCountAggregateInputType | true;
    _avg?: CommentKeywordMatchAvgAggregateInputType;
    _sum?: CommentKeywordMatchSumAggregateInputType;
    _min?: CommentKeywordMatchMinAggregateInputType;
    _max?: CommentKeywordMatchMaxAggregateInputType;
};
export type CommentKeywordMatchGroupByOutputType = {
    commentId: number;
    keywordId: number;
    source: $Enums.MatchSource;
    createdAt: Date;
    _count: CommentKeywordMatchCountAggregateOutputType | null;
    _avg: CommentKeywordMatchAvgAggregateOutputType | null;
    _sum: CommentKeywordMatchSumAggregateOutputType | null;
    _min: CommentKeywordMatchMinAggregateOutputType | null;
    _max: CommentKeywordMatchMaxAggregateOutputType | null;
};
type GetCommentKeywordMatchGroupByPayload<T extends CommentKeywordMatchGroupByArgs> = Prisma.PrismaPromise<Array<Prisma.PickEnumerable<CommentKeywordMatchGroupByOutputType, T['by']> & {
    [P in ((keyof T) & (keyof CommentKeywordMatchGroupByOutputType))]: P extends '_count' ? T[P] extends boolean ? number : Prisma.GetScalarType<T[P], CommentKeywordMatchGroupByOutputType[P]> : Prisma.GetScalarType<T[P], CommentKeywordMatchGroupByOutputType[P]>;
}>>;
export type CommentKeywordMatchWhereInput = {
    AND?: Prisma.CommentKeywordMatchWhereInput | Prisma.CommentKeywordMatchWhereInput[];
    OR?: Prisma.CommentKeywordMatchWhereInput[];
    NOT?: Prisma.CommentKeywordMatchWhereInput | Prisma.CommentKeywordMatchWhereInput[];
    commentId?: Prisma.IntFilter<"CommentKeywordMatch"> | number;
    keywordId?: Prisma.IntFilter<"CommentKeywordMatch"> | number;
    source?: Prisma.EnumMatchSourceFilter<"CommentKeywordMatch"> | $Enums.MatchSource;
    createdAt?: Prisma.DateTimeFilter<"CommentKeywordMatch"> | Date | string;
    comment?: Prisma.XOR<Prisma.CommentScalarRelationFilter, Prisma.CommentWhereInput>;
    keyword?: Prisma.XOR<Prisma.KeywordScalarRelationFilter, Prisma.KeywordWhereInput>;
};
export type CommentKeywordMatchOrderByWithRelationInput = {
    commentId?: Prisma.SortOrder;
    keywordId?: Prisma.SortOrder;
    source?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    comment?: Prisma.CommentOrderByWithRelationInput;
    keyword?: Prisma.KeywordOrderByWithRelationInput;
};
export type CommentKeywordMatchWhereUniqueInput = Prisma.AtLeast<{
    commentId_keywordId_source?: Prisma.CommentKeywordMatchCommentIdKeywordIdSourceCompoundUniqueInput;
    AND?: Prisma.CommentKeywordMatchWhereInput | Prisma.CommentKeywordMatchWhereInput[];
    OR?: Prisma.CommentKeywordMatchWhereInput[];
    NOT?: Prisma.CommentKeywordMatchWhereInput | Prisma.CommentKeywordMatchWhereInput[];
    commentId?: Prisma.IntFilter<"CommentKeywordMatch"> | number;
    keywordId?: Prisma.IntFilter<"CommentKeywordMatch"> | number;
    source?: Prisma.EnumMatchSourceFilter<"CommentKeywordMatch"> | $Enums.MatchSource;
    createdAt?: Prisma.DateTimeFilter<"CommentKeywordMatch"> | Date | string;
    comment?: Prisma.XOR<Prisma.CommentScalarRelationFilter, Prisma.CommentWhereInput>;
    keyword?: Prisma.XOR<Prisma.KeywordScalarRelationFilter, Prisma.KeywordWhereInput>;
}, "commentId_keywordId_source">;
export type CommentKeywordMatchOrderByWithAggregationInput = {
    commentId?: Prisma.SortOrder;
    keywordId?: Prisma.SortOrder;
    source?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    _count?: Prisma.CommentKeywordMatchCountOrderByAggregateInput;
    _avg?: Prisma.CommentKeywordMatchAvgOrderByAggregateInput;
    _max?: Prisma.CommentKeywordMatchMaxOrderByAggregateInput;
    _min?: Prisma.CommentKeywordMatchMinOrderByAggregateInput;
    _sum?: Prisma.CommentKeywordMatchSumOrderByAggregateInput;
};
export type CommentKeywordMatchScalarWhereWithAggregatesInput = {
    AND?: Prisma.CommentKeywordMatchScalarWhereWithAggregatesInput | Prisma.CommentKeywordMatchScalarWhereWithAggregatesInput[];
    OR?: Prisma.CommentKeywordMatchScalarWhereWithAggregatesInput[];
    NOT?: Prisma.CommentKeywordMatchScalarWhereWithAggregatesInput | Prisma.CommentKeywordMatchScalarWhereWithAggregatesInput[];
    commentId?: Prisma.IntWithAggregatesFilter<"CommentKeywordMatch"> | number;
    keywordId?: Prisma.IntWithAggregatesFilter<"CommentKeywordMatch"> | number;
    source?: Prisma.EnumMatchSourceWithAggregatesFilter<"CommentKeywordMatch"> | $Enums.MatchSource;
    createdAt?: Prisma.DateTimeWithAggregatesFilter<"CommentKeywordMatch"> | Date | string;
};
export type CommentKeywordMatchCreateInput = {
    source?: $Enums.MatchSource;
    createdAt?: Date | string;
    comment: Prisma.CommentCreateNestedOneWithoutCommentKeywordMatchesInput;
    keyword: Prisma.KeywordCreateNestedOneWithoutCommentKeywordMatchesInput;
};
export type CommentKeywordMatchUncheckedCreateInput = {
    commentId: number;
    keywordId: number;
    source?: $Enums.MatchSource;
    createdAt?: Date | string;
};
export type CommentKeywordMatchUpdateInput = {
    source?: Prisma.EnumMatchSourceFieldUpdateOperationsInput | $Enums.MatchSource;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    comment?: Prisma.CommentUpdateOneRequiredWithoutCommentKeywordMatchesNestedInput;
    keyword?: Prisma.KeywordUpdateOneRequiredWithoutCommentKeywordMatchesNestedInput;
};
export type CommentKeywordMatchUncheckedUpdateInput = {
    commentId?: Prisma.IntFieldUpdateOperationsInput | number;
    keywordId?: Prisma.IntFieldUpdateOperationsInput | number;
    source?: Prisma.EnumMatchSourceFieldUpdateOperationsInput | $Enums.MatchSource;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type CommentKeywordMatchCreateManyInput = {
    commentId: number;
    keywordId: number;
    source?: $Enums.MatchSource;
    createdAt?: Date | string;
};
export type CommentKeywordMatchUpdateManyMutationInput = {
    source?: Prisma.EnumMatchSourceFieldUpdateOperationsInput | $Enums.MatchSource;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type CommentKeywordMatchUncheckedUpdateManyInput = {
    commentId?: Prisma.IntFieldUpdateOperationsInput | number;
    keywordId?: Prisma.IntFieldUpdateOperationsInput | number;
    source?: Prisma.EnumMatchSourceFieldUpdateOperationsInput | $Enums.MatchSource;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type CommentKeywordMatchListRelationFilter = {
    every?: Prisma.CommentKeywordMatchWhereInput;
    some?: Prisma.CommentKeywordMatchWhereInput;
    none?: Prisma.CommentKeywordMatchWhereInput;
};
export type CommentKeywordMatchOrderByRelationAggregateInput = {
    _count?: Prisma.SortOrder;
};
export type CommentKeywordMatchCommentIdKeywordIdSourceCompoundUniqueInput = {
    commentId: number;
    keywordId: number;
    source: $Enums.MatchSource;
};
export type CommentKeywordMatchCountOrderByAggregateInput = {
    commentId?: Prisma.SortOrder;
    keywordId?: Prisma.SortOrder;
    source?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
};
export type CommentKeywordMatchAvgOrderByAggregateInput = {
    commentId?: Prisma.SortOrder;
    keywordId?: Prisma.SortOrder;
};
export type CommentKeywordMatchMaxOrderByAggregateInput = {
    commentId?: Prisma.SortOrder;
    keywordId?: Prisma.SortOrder;
    source?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
};
export type CommentKeywordMatchMinOrderByAggregateInput = {
    commentId?: Prisma.SortOrder;
    keywordId?: Prisma.SortOrder;
    source?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
};
export type CommentKeywordMatchSumOrderByAggregateInput = {
    commentId?: Prisma.SortOrder;
    keywordId?: Prisma.SortOrder;
};
export type CommentKeywordMatchCreateNestedManyWithoutCommentInput = {
    create?: Prisma.XOR<Prisma.CommentKeywordMatchCreateWithoutCommentInput, Prisma.CommentKeywordMatchUncheckedCreateWithoutCommentInput> | Prisma.CommentKeywordMatchCreateWithoutCommentInput[] | Prisma.CommentKeywordMatchUncheckedCreateWithoutCommentInput[];
    connectOrCreate?: Prisma.CommentKeywordMatchCreateOrConnectWithoutCommentInput | Prisma.CommentKeywordMatchCreateOrConnectWithoutCommentInput[];
    createMany?: Prisma.CommentKeywordMatchCreateManyCommentInputEnvelope;
    connect?: Prisma.CommentKeywordMatchWhereUniqueInput | Prisma.CommentKeywordMatchWhereUniqueInput[];
};
export type CommentKeywordMatchUncheckedCreateNestedManyWithoutCommentInput = {
    create?: Prisma.XOR<Prisma.CommentKeywordMatchCreateWithoutCommentInput, Prisma.CommentKeywordMatchUncheckedCreateWithoutCommentInput> | Prisma.CommentKeywordMatchCreateWithoutCommentInput[] | Prisma.CommentKeywordMatchUncheckedCreateWithoutCommentInput[];
    connectOrCreate?: Prisma.CommentKeywordMatchCreateOrConnectWithoutCommentInput | Prisma.CommentKeywordMatchCreateOrConnectWithoutCommentInput[];
    createMany?: Prisma.CommentKeywordMatchCreateManyCommentInputEnvelope;
    connect?: Prisma.CommentKeywordMatchWhereUniqueInput | Prisma.CommentKeywordMatchWhereUniqueInput[];
};
export type CommentKeywordMatchUpdateManyWithoutCommentNestedInput = {
    create?: Prisma.XOR<Prisma.CommentKeywordMatchCreateWithoutCommentInput, Prisma.CommentKeywordMatchUncheckedCreateWithoutCommentInput> | Prisma.CommentKeywordMatchCreateWithoutCommentInput[] | Prisma.CommentKeywordMatchUncheckedCreateWithoutCommentInput[];
    connectOrCreate?: Prisma.CommentKeywordMatchCreateOrConnectWithoutCommentInput | Prisma.CommentKeywordMatchCreateOrConnectWithoutCommentInput[];
    upsert?: Prisma.CommentKeywordMatchUpsertWithWhereUniqueWithoutCommentInput | Prisma.CommentKeywordMatchUpsertWithWhereUniqueWithoutCommentInput[];
    createMany?: Prisma.CommentKeywordMatchCreateManyCommentInputEnvelope;
    set?: Prisma.CommentKeywordMatchWhereUniqueInput | Prisma.CommentKeywordMatchWhereUniqueInput[];
    disconnect?: Prisma.CommentKeywordMatchWhereUniqueInput | Prisma.CommentKeywordMatchWhereUniqueInput[];
    delete?: Prisma.CommentKeywordMatchWhereUniqueInput | Prisma.CommentKeywordMatchWhereUniqueInput[];
    connect?: Prisma.CommentKeywordMatchWhereUniqueInput | Prisma.CommentKeywordMatchWhereUniqueInput[];
    update?: Prisma.CommentKeywordMatchUpdateWithWhereUniqueWithoutCommentInput | Prisma.CommentKeywordMatchUpdateWithWhereUniqueWithoutCommentInput[];
    updateMany?: Prisma.CommentKeywordMatchUpdateManyWithWhereWithoutCommentInput | Prisma.CommentKeywordMatchUpdateManyWithWhereWithoutCommentInput[];
    deleteMany?: Prisma.CommentKeywordMatchScalarWhereInput | Prisma.CommentKeywordMatchScalarWhereInput[];
};
export type CommentKeywordMatchUncheckedUpdateManyWithoutCommentNestedInput = {
    create?: Prisma.XOR<Prisma.CommentKeywordMatchCreateWithoutCommentInput, Prisma.CommentKeywordMatchUncheckedCreateWithoutCommentInput> | Prisma.CommentKeywordMatchCreateWithoutCommentInput[] | Prisma.CommentKeywordMatchUncheckedCreateWithoutCommentInput[];
    connectOrCreate?: Prisma.CommentKeywordMatchCreateOrConnectWithoutCommentInput | Prisma.CommentKeywordMatchCreateOrConnectWithoutCommentInput[];
    upsert?: Prisma.CommentKeywordMatchUpsertWithWhereUniqueWithoutCommentInput | Prisma.CommentKeywordMatchUpsertWithWhereUniqueWithoutCommentInput[];
    createMany?: Prisma.CommentKeywordMatchCreateManyCommentInputEnvelope;
    set?: Prisma.CommentKeywordMatchWhereUniqueInput | Prisma.CommentKeywordMatchWhereUniqueInput[];
    disconnect?: Prisma.CommentKeywordMatchWhereUniqueInput | Prisma.CommentKeywordMatchWhereUniqueInput[];
    delete?: Prisma.CommentKeywordMatchWhereUniqueInput | Prisma.CommentKeywordMatchWhereUniqueInput[];
    connect?: Prisma.CommentKeywordMatchWhereUniqueInput | Prisma.CommentKeywordMatchWhereUniqueInput[];
    update?: Prisma.CommentKeywordMatchUpdateWithWhereUniqueWithoutCommentInput | Prisma.CommentKeywordMatchUpdateWithWhereUniqueWithoutCommentInput[];
    updateMany?: Prisma.CommentKeywordMatchUpdateManyWithWhereWithoutCommentInput | Prisma.CommentKeywordMatchUpdateManyWithWhereWithoutCommentInput[];
    deleteMany?: Prisma.CommentKeywordMatchScalarWhereInput | Prisma.CommentKeywordMatchScalarWhereInput[];
};
export type CommentKeywordMatchCreateNestedManyWithoutKeywordInput = {
    create?: Prisma.XOR<Prisma.CommentKeywordMatchCreateWithoutKeywordInput, Prisma.CommentKeywordMatchUncheckedCreateWithoutKeywordInput> | Prisma.CommentKeywordMatchCreateWithoutKeywordInput[] | Prisma.CommentKeywordMatchUncheckedCreateWithoutKeywordInput[];
    connectOrCreate?: Prisma.CommentKeywordMatchCreateOrConnectWithoutKeywordInput | Prisma.CommentKeywordMatchCreateOrConnectWithoutKeywordInput[];
    createMany?: Prisma.CommentKeywordMatchCreateManyKeywordInputEnvelope;
    connect?: Prisma.CommentKeywordMatchWhereUniqueInput | Prisma.CommentKeywordMatchWhereUniqueInput[];
};
export type CommentKeywordMatchUncheckedCreateNestedManyWithoutKeywordInput = {
    create?: Prisma.XOR<Prisma.CommentKeywordMatchCreateWithoutKeywordInput, Prisma.CommentKeywordMatchUncheckedCreateWithoutKeywordInput> | Prisma.CommentKeywordMatchCreateWithoutKeywordInput[] | Prisma.CommentKeywordMatchUncheckedCreateWithoutKeywordInput[];
    connectOrCreate?: Prisma.CommentKeywordMatchCreateOrConnectWithoutKeywordInput | Prisma.CommentKeywordMatchCreateOrConnectWithoutKeywordInput[];
    createMany?: Prisma.CommentKeywordMatchCreateManyKeywordInputEnvelope;
    connect?: Prisma.CommentKeywordMatchWhereUniqueInput | Prisma.CommentKeywordMatchWhereUniqueInput[];
};
export type CommentKeywordMatchUpdateManyWithoutKeywordNestedInput = {
    create?: Prisma.XOR<Prisma.CommentKeywordMatchCreateWithoutKeywordInput, Prisma.CommentKeywordMatchUncheckedCreateWithoutKeywordInput> | Prisma.CommentKeywordMatchCreateWithoutKeywordInput[] | Prisma.CommentKeywordMatchUncheckedCreateWithoutKeywordInput[];
    connectOrCreate?: Prisma.CommentKeywordMatchCreateOrConnectWithoutKeywordInput | Prisma.CommentKeywordMatchCreateOrConnectWithoutKeywordInput[];
    upsert?: Prisma.CommentKeywordMatchUpsertWithWhereUniqueWithoutKeywordInput | Prisma.CommentKeywordMatchUpsertWithWhereUniqueWithoutKeywordInput[];
    createMany?: Prisma.CommentKeywordMatchCreateManyKeywordInputEnvelope;
    set?: Prisma.CommentKeywordMatchWhereUniqueInput | Prisma.CommentKeywordMatchWhereUniqueInput[];
    disconnect?: Prisma.CommentKeywordMatchWhereUniqueInput | Prisma.CommentKeywordMatchWhereUniqueInput[];
    delete?: Prisma.CommentKeywordMatchWhereUniqueInput | Prisma.CommentKeywordMatchWhereUniqueInput[];
    connect?: Prisma.CommentKeywordMatchWhereUniqueInput | Prisma.CommentKeywordMatchWhereUniqueInput[];
    update?: Prisma.CommentKeywordMatchUpdateWithWhereUniqueWithoutKeywordInput | Prisma.CommentKeywordMatchUpdateWithWhereUniqueWithoutKeywordInput[];
    updateMany?: Prisma.CommentKeywordMatchUpdateManyWithWhereWithoutKeywordInput | Prisma.CommentKeywordMatchUpdateManyWithWhereWithoutKeywordInput[];
    deleteMany?: Prisma.CommentKeywordMatchScalarWhereInput | Prisma.CommentKeywordMatchScalarWhereInput[];
};
export type CommentKeywordMatchUncheckedUpdateManyWithoutKeywordNestedInput = {
    create?: Prisma.XOR<Prisma.CommentKeywordMatchCreateWithoutKeywordInput, Prisma.CommentKeywordMatchUncheckedCreateWithoutKeywordInput> | Prisma.CommentKeywordMatchCreateWithoutKeywordInput[] | Prisma.CommentKeywordMatchUncheckedCreateWithoutKeywordInput[];
    connectOrCreate?: Prisma.CommentKeywordMatchCreateOrConnectWithoutKeywordInput | Prisma.CommentKeywordMatchCreateOrConnectWithoutKeywordInput[];
    upsert?: Prisma.CommentKeywordMatchUpsertWithWhereUniqueWithoutKeywordInput | Prisma.CommentKeywordMatchUpsertWithWhereUniqueWithoutKeywordInput[];
    createMany?: Prisma.CommentKeywordMatchCreateManyKeywordInputEnvelope;
    set?: Prisma.CommentKeywordMatchWhereUniqueInput | Prisma.CommentKeywordMatchWhereUniqueInput[];
    disconnect?: Prisma.CommentKeywordMatchWhereUniqueInput | Prisma.CommentKeywordMatchWhereUniqueInput[];
    delete?: Prisma.CommentKeywordMatchWhereUniqueInput | Prisma.CommentKeywordMatchWhereUniqueInput[];
    connect?: Prisma.CommentKeywordMatchWhereUniqueInput | Prisma.CommentKeywordMatchWhereUniqueInput[];
    update?: Prisma.CommentKeywordMatchUpdateWithWhereUniqueWithoutKeywordInput | Prisma.CommentKeywordMatchUpdateWithWhereUniqueWithoutKeywordInput[];
    updateMany?: Prisma.CommentKeywordMatchUpdateManyWithWhereWithoutKeywordInput | Prisma.CommentKeywordMatchUpdateManyWithWhereWithoutKeywordInput[];
    deleteMany?: Prisma.CommentKeywordMatchScalarWhereInput | Prisma.CommentKeywordMatchScalarWhereInput[];
};
export type EnumMatchSourceFieldUpdateOperationsInput = {
    set?: $Enums.MatchSource;
};
export type CommentKeywordMatchCreateWithoutCommentInput = {
    source?: $Enums.MatchSource;
    createdAt?: Date | string;
    keyword: Prisma.KeywordCreateNestedOneWithoutCommentKeywordMatchesInput;
};
export type CommentKeywordMatchUncheckedCreateWithoutCommentInput = {
    keywordId: number;
    source?: $Enums.MatchSource;
    createdAt?: Date | string;
};
export type CommentKeywordMatchCreateOrConnectWithoutCommentInput = {
    where: Prisma.CommentKeywordMatchWhereUniqueInput;
    create: Prisma.XOR<Prisma.CommentKeywordMatchCreateWithoutCommentInput, Prisma.CommentKeywordMatchUncheckedCreateWithoutCommentInput>;
};
export type CommentKeywordMatchCreateManyCommentInputEnvelope = {
    data: Prisma.CommentKeywordMatchCreateManyCommentInput | Prisma.CommentKeywordMatchCreateManyCommentInput[];
    skipDuplicates?: boolean;
};
export type CommentKeywordMatchUpsertWithWhereUniqueWithoutCommentInput = {
    where: Prisma.CommentKeywordMatchWhereUniqueInput;
    update: Prisma.XOR<Prisma.CommentKeywordMatchUpdateWithoutCommentInput, Prisma.CommentKeywordMatchUncheckedUpdateWithoutCommentInput>;
    create: Prisma.XOR<Prisma.CommentKeywordMatchCreateWithoutCommentInput, Prisma.CommentKeywordMatchUncheckedCreateWithoutCommentInput>;
};
export type CommentKeywordMatchUpdateWithWhereUniqueWithoutCommentInput = {
    where: Prisma.CommentKeywordMatchWhereUniqueInput;
    data: Prisma.XOR<Prisma.CommentKeywordMatchUpdateWithoutCommentInput, Prisma.CommentKeywordMatchUncheckedUpdateWithoutCommentInput>;
};
export type CommentKeywordMatchUpdateManyWithWhereWithoutCommentInput = {
    where: Prisma.CommentKeywordMatchScalarWhereInput;
    data: Prisma.XOR<Prisma.CommentKeywordMatchUpdateManyMutationInput, Prisma.CommentKeywordMatchUncheckedUpdateManyWithoutCommentInput>;
};
export type CommentKeywordMatchScalarWhereInput = {
    AND?: Prisma.CommentKeywordMatchScalarWhereInput | Prisma.CommentKeywordMatchScalarWhereInput[];
    OR?: Prisma.CommentKeywordMatchScalarWhereInput[];
    NOT?: Prisma.CommentKeywordMatchScalarWhereInput | Prisma.CommentKeywordMatchScalarWhereInput[];
    commentId?: Prisma.IntFilter<"CommentKeywordMatch"> | number;
    keywordId?: Prisma.IntFilter<"CommentKeywordMatch"> | number;
    source?: Prisma.EnumMatchSourceFilter<"CommentKeywordMatch"> | $Enums.MatchSource;
    createdAt?: Prisma.DateTimeFilter<"CommentKeywordMatch"> | Date | string;
};
export type CommentKeywordMatchCreateWithoutKeywordInput = {
    source?: $Enums.MatchSource;
    createdAt?: Date | string;
    comment: Prisma.CommentCreateNestedOneWithoutCommentKeywordMatchesInput;
};
export type CommentKeywordMatchUncheckedCreateWithoutKeywordInput = {
    commentId: number;
    source?: $Enums.MatchSource;
    createdAt?: Date | string;
};
export type CommentKeywordMatchCreateOrConnectWithoutKeywordInput = {
    where: Prisma.CommentKeywordMatchWhereUniqueInput;
    create: Prisma.XOR<Prisma.CommentKeywordMatchCreateWithoutKeywordInput, Prisma.CommentKeywordMatchUncheckedCreateWithoutKeywordInput>;
};
export type CommentKeywordMatchCreateManyKeywordInputEnvelope = {
    data: Prisma.CommentKeywordMatchCreateManyKeywordInput | Prisma.CommentKeywordMatchCreateManyKeywordInput[];
    skipDuplicates?: boolean;
};
export type CommentKeywordMatchUpsertWithWhereUniqueWithoutKeywordInput = {
    where: Prisma.CommentKeywordMatchWhereUniqueInput;
    update: Prisma.XOR<Prisma.CommentKeywordMatchUpdateWithoutKeywordInput, Prisma.CommentKeywordMatchUncheckedUpdateWithoutKeywordInput>;
    create: Prisma.XOR<Prisma.CommentKeywordMatchCreateWithoutKeywordInput, Prisma.CommentKeywordMatchUncheckedCreateWithoutKeywordInput>;
};
export type CommentKeywordMatchUpdateWithWhereUniqueWithoutKeywordInput = {
    where: Prisma.CommentKeywordMatchWhereUniqueInput;
    data: Prisma.XOR<Prisma.CommentKeywordMatchUpdateWithoutKeywordInput, Prisma.CommentKeywordMatchUncheckedUpdateWithoutKeywordInput>;
};
export type CommentKeywordMatchUpdateManyWithWhereWithoutKeywordInput = {
    where: Prisma.CommentKeywordMatchScalarWhereInput;
    data: Prisma.XOR<Prisma.CommentKeywordMatchUpdateManyMutationInput, Prisma.CommentKeywordMatchUncheckedUpdateManyWithoutKeywordInput>;
};
export type CommentKeywordMatchCreateManyCommentInput = {
    keywordId: number;
    source?: $Enums.MatchSource;
    createdAt?: Date | string;
};
export type CommentKeywordMatchUpdateWithoutCommentInput = {
    source?: Prisma.EnumMatchSourceFieldUpdateOperationsInput | $Enums.MatchSource;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    keyword?: Prisma.KeywordUpdateOneRequiredWithoutCommentKeywordMatchesNestedInput;
};
export type CommentKeywordMatchUncheckedUpdateWithoutCommentInput = {
    keywordId?: Prisma.IntFieldUpdateOperationsInput | number;
    source?: Prisma.EnumMatchSourceFieldUpdateOperationsInput | $Enums.MatchSource;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type CommentKeywordMatchUncheckedUpdateManyWithoutCommentInput = {
    keywordId?: Prisma.IntFieldUpdateOperationsInput | number;
    source?: Prisma.EnumMatchSourceFieldUpdateOperationsInput | $Enums.MatchSource;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type CommentKeywordMatchCreateManyKeywordInput = {
    commentId: number;
    source?: $Enums.MatchSource;
    createdAt?: Date | string;
};
export type CommentKeywordMatchUpdateWithoutKeywordInput = {
    source?: Prisma.EnumMatchSourceFieldUpdateOperationsInput | $Enums.MatchSource;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    comment?: Prisma.CommentUpdateOneRequiredWithoutCommentKeywordMatchesNestedInput;
};
export type CommentKeywordMatchUncheckedUpdateWithoutKeywordInput = {
    commentId?: Prisma.IntFieldUpdateOperationsInput | number;
    source?: Prisma.EnumMatchSourceFieldUpdateOperationsInput | $Enums.MatchSource;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type CommentKeywordMatchUncheckedUpdateManyWithoutKeywordInput = {
    commentId?: Prisma.IntFieldUpdateOperationsInput | number;
    source?: Prisma.EnumMatchSourceFieldUpdateOperationsInput | $Enums.MatchSource;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type CommentKeywordMatchSelect<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    commentId?: boolean;
    keywordId?: boolean;
    source?: boolean;
    createdAt?: boolean;
    comment?: boolean | Prisma.CommentDefaultArgs<ExtArgs>;
    keyword?: boolean | Prisma.KeywordDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["commentKeywordMatch"]>;
export type CommentKeywordMatchSelectCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    commentId?: boolean;
    keywordId?: boolean;
    source?: boolean;
    createdAt?: boolean;
    comment?: boolean | Prisma.CommentDefaultArgs<ExtArgs>;
    keyword?: boolean | Prisma.KeywordDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["commentKeywordMatch"]>;
export type CommentKeywordMatchSelectUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    commentId?: boolean;
    keywordId?: boolean;
    source?: boolean;
    createdAt?: boolean;
    comment?: boolean | Prisma.CommentDefaultArgs<ExtArgs>;
    keyword?: boolean | Prisma.KeywordDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["commentKeywordMatch"]>;
export type CommentKeywordMatchSelectScalar = {
    commentId?: boolean;
    keywordId?: boolean;
    source?: boolean;
    createdAt?: boolean;
};
export type CommentKeywordMatchOmit<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetOmit<"commentId" | "keywordId" | "source" | "createdAt", ExtArgs["result"]["commentKeywordMatch"]>;
export type CommentKeywordMatchInclude<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    comment?: boolean | Prisma.CommentDefaultArgs<ExtArgs>;
    keyword?: boolean | Prisma.KeywordDefaultArgs<ExtArgs>;
};
export type CommentKeywordMatchIncludeCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    comment?: boolean | Prisma.CommentDefaultArgs<ExtArgs>;
    keyword?: boolean | Prisma.KeywordDefaultArgs<ExtArgs>;
};
export type CommentKeywordMatchIncludeUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    comment?: boolean | Prisma.CommentDefaultArgs<ExtArgs>;
    keyword?: boolean | Prisma.KeywordDefaultArgs<ExtArgs>;
};
export type $CommentKeywordMatchPayload<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    name: "CommentKeywordMatch";
    objects: {
        comment: Prisma.$CommentPayload<ExtArgs>;
        keyword: Prisma.$KeywordPayload<ExtArgs>;
    };
    scalars: runtime.Types.Extensions.GetPayloadResult<{
        commentId: number;
        keywordId: number;
        source: $Enums.MatchSource;
        createdAt: Date;
    }, ExtArgs["result"]["commentKeywordMatch"]>;
    composites: {};
};
export type CommentKeywordMatchGetPayload<S extends boolean | null | undefined | CommentKeywordMatchDefaultArgs> = runtime.Types.Result.GetResult<Prisma.$CommentKeywordMatchPayload, S>;
export type CommentKeywordMatchCountArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = Omit<CommentKeywordMatchFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
    select?: CommentKeywordMatchCountAggregateInputType | true;
};
export interface CommentKeywordMatchDelegate<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: {
        types: Prisma.TypeMap<ExtArgs>['model']['CommentKeywordMatch'];
        meta: {
            name: 'CommentKeywordMatch';
        };
    };
    findUnique<T extends CommentKeywordMatchFindUniqueArgs>(args: Prisma.SelectSubset<T, CommentKeywordMatchFindUniqueArgs<ExtArgs>>): Prisma.Prisma__CommentKeywordMatchClient<runtime.Types.Result.GetResult<Prisma.$CommentKeywordMatchPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    findUniqueOrThrow<T extends CommentKeywordMatchFindUniqueOrThrowArgs>(args: Prisma.SelectSubset<T, CommentKeywordMatchFindUniqueOrThrowArgs<ExtArgs>>): Prisma.Prisma__CommentKeywordMatchClient<runtime.Types.Result.GetResult<Prisma.$CommentKeywordMatchPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    findFirst<T extends CommentKeywordMatchFindFirstArgs>(args?: Prisma.SelectSubset<T, CommentKeywordMatchFindFirstArgs<ExtArgs>>): Prisma.Prisma__CommentKeywordMatchClient<runtime.Types.Result.GetResult<Prisma.$CommentKeywordMatchPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    findFirstOrThrow<T extends CommentKeywordMatchFindFirstOrThrowArgs>(args?: Prisma.SelectSubset<T, CommentKeywordMatchFindFirstOrThrowArgs<ExtArgs>>): Prisma.Prisma__CommentKeywordMatchClient<runtime.Types.Result.GetResult<Prisma.$CommentKeywordMatchPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    findMany<T extends CommentKeywordMatchFindManyArgs>(args?: Prisma.SelectSubset<T, CommentKeywordMatchFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$CommentKeywordMatchPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>;
    create<T extends CommentKeywordMatchCreateArgs>(args: Prisma.SelectSubset<T, CommentKeywordMatchCreateArgs<ExtArgs>>): Prisma.Prisma__CommentKeywordMatchClient<runtime.Types.Result.GetResult<Prisma.$CommentKeywordMatchPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    createMany<T extends CommentKeywordMatchCreateManyArgs>(args?: Prisma.SelectSubset<T, CommentKeywordMatchCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    createManyAndReturn<T extends CommentKeywordMatchCreateManyAndReturnArgs>(args?: Prisma.SelectSubset<T, CommentKeywordMatchCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$CommentKeywordMatchPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>;
    delete<T extends CommentKeywordMatchDeleteArgs>(args: Prisma.SelectSubset<T, CommentKeywordMatchDeleteArgs<ExtArgs>>): Prisma.Prisma__CommentKeywordMatchClient<runtime.Types.Result.GetResult<Prisma.$CommentKeywordMatchPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    update<T extends CommentKeywordMatchUpdateArgs>(args: Prisma.SelectSubset<T, CommentKeywordMatchUpdateArgs<ExtArgs>>): Prisma.Prisma__CommentKeywordMatchClient<runtime.Types.Result.GetResult<Prisma.$CommentKeywordMatchPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    deleteMany<T extends CommentKeywordMatchDeleteManyArgs>(args?: Prisma.SelectSubset<T, CommentKeywordMatchDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    updateMany<T extends CommentKeywordMatchUpdateManyArgs>(args: Prisma.SelectSubset<T, CommentKeywordMatchUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    updateManyAndReturn<T extends CommentKeywordMatchUpdateManyAndReturnArgs>(args: Prisma.SelectSubset<T, CommentKeywordMatchUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$CommentKeywordMatchPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>;
    upsert<T extends CommentKeywordMatchUpsertArgs>(args: Prisma.SelectSubset<T, CommentKeywordMatchUpsertArgs<ExtArgs>>): Prisma.Prisma__CommentKeywordMatchClient<runtime.Types.Result.GetResult<Prisma.$CommentKeywordMatchPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    count<T extends CommentKeywordMatchCountArgs>(args?: Prisma.Subset<T, CommentKeywordMatchCountArgs>): Prisma.PrismaPromise<T extends runtime.Types.Utils.Record<'select', any> ? T['select'] extends true ? number : Prisma.GetScalarType<T['select'], CommentKeywordMatchCountAggregateOutputType> : number>;
    aggregate<T extends CommentKeywordMatchAggregateArgs>(args: Prisma.Subset<T, CommentKeywordMatchAggregateArgs>): Prisma.PrismaPromise<GetCommentKeywordMatchAggregateType<T>>;
    groupBy<T extends CommentKeywordMatchGroupByArgs, HasSelectOrTake extends Prisma.Or<Prisma.Extends<'skip', Prisma.Keys<T>>, Prisma.Extends<'take', Prisma.Keys<T>>>, OrderByArg extends Prisma.True extends HasSelectOrTake ? {
        orderBy: CommentKeywordMatchGroupByArgs['orderBy'];
    } : {
        orderBy?: CommentKeywordMatchGroupByArgs['orderBy'];
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
    }[OrderFields]>(args: Prisma.SubsetIntersection<T, CommentKeywordMatchGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetCommentKeywordMatchGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>;
    readonly fields: CommentKeywordMatchFieldRefs;
}
export interface Prisma__CommentKeywordMatchClient<T, Null = never, ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise";
    comment<T extends Prisma.CommentDefaultArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.CommentDefaultArgs<ExtArgs>>): Prisma.Prisma__CommentClient<runtime.Types.Result.GetResult<Prisma.$CommentPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>;
    keyword<T extends Prisma.KeywordDefaultArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.KeywordDefaultArgs<ExtArgs>>): Prisma.Prisma__KeywordClient<runtime.Types.Result.GetResult<Prisma.$KeywordPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>;
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): runtime.Types.Utils.JsPromise<TResult1 | TResult2>;
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): runtime.Types.Utils.JsPromise<T | TResult>;
    finally(onfinally?: (() => void) | undefined | null): runtime.Types.Utils.JsPromise<T>;
}
export interface CommentKeywordMatchFieldRefs {
    readonly commentId: Prisma.FieldRef<"CommentKeywordMatch", 'Int'>;
    readonly keywordId: Prisma.FieldRef<"CommentKeywordMatch", 'Int'>;
    readonly source: Prisma.FieldRef<"CommentKeywordMatch", 'MatchSource'>;
    readonly createdAt: Prisma.FieldRef<"CommentKeywordMatch", 'DateTime'>;
}
export type CommentKeywordMatchFindUniqueArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.CommentKeywordMatchSelect<ExtArgs> | null;
    omit?: Prisma.CommentKeywordMatchOmit<ExtArgs> | null;
    include?: Prisma.CommentKeywordMatchInclude<ExtArgs> | null;
    where: Prisma.CommentKeywordMatchWhereUniqueInput;
};
export type CommentKeywordMatchFindUniqueOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.CommentKeywordMatchSelect<ExtArgs> | null;
    omit?: Prisma.CommentKeywordMatchOmit<ExtArgs> | null;
    include?: Prisma.CommentKeywordMatchInclude<ExtArgs> | null;
    where: Prisma.CommentKeywordMatchWhereUniqueInput;
};
export type CommentKeywordMatchFindFirstArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.CommentKeywordMatchSelect<ExtArgs> | null;
    omit?: Prisma.CommentKeywordMatchOmit<ExtArgs> | null;
    include?: Prisma.CommentKeywordMatchInclude<ExtArgs> | null;
    where?: Prisma.CommentKeywordMatchWhereInput;
    orderBy?: Prisma.CommentKeywordMatchOrderByWithRelationInput | Prisma.CommentKeywordMatchOrderByWithRelationInput[];
    cursor?: Prisma.CommentKeywordMatchWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.CommentKeywordMatchScalarFieldEnum | Prisma.CommentKeywordMatchScalarFieldEnum[];
};
export type CommentKeywordMatchFindFirstOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.CommentKeywordMatchSelect<ExtArgs> | null;
    omit?: Prisma.CommentKeywordMatchOmit<ExtArgs> | null;
    include?: Prisma.CommentKeywordMatchInclude<ExtArgs> | null;
    where?: Prisma.CommentKeywordMatchWhereInput;
    orderBy?: Prisma.CommentKeywordMatchOrderByWithRelationInput | Prisma.CommentKeywordMatchOrderByWithRelationInput[];
    cursor?: Prisma.CommentKeywordMatchWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.CommentKeywordMatchScalarFieldEnum | Prisma.CommentKeywordMatchScalarFieldEnum[];
};
export type CommentKeywordMatchFindManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.CommentKeywordMatchSelect<ExtArgs> | null;
    omit?: Prisma.CommentKeywordMatchOmit<ExtArgs> | null;
    include?: Prisma.CommentKeywordMatchInclude<ExtArgs> | null;
    where?: Prisma.CommentKeywordMatchWhereInput;
    orderBy?: Prisma.CommentKeywordMatchOrderByWithRelationInput | Prisma.CommentKeywordMatchOrderByWithRelationInput[];
    cursor?: Prisma.CommentKeywordMatchWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.CommentKeywordMatchScalarFieldEnum | Prisma.CommentKeywordMatchScalarFieldEnum[];
};
export type CommentKeywordMatchCreateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.CommentKeywordMatchSelect<ExtArgs> | null;
    omit?: Prisma.CommentKeywordMatchOmit<ExtArgs> | null;
    include?: Prisma.CommentKeywordMatchInclude<ExtArgs> | null;
    data: Prisma.XOR<Prisma.CommentKeywordMatchCreateInput, Prisma.CommentKeywordMatchUncheckedCreateInput>;
};
export type CommentKeywordMatchCreateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    data: Prisma.CommentKeywordMatchCreateManyInput | Prisma.CommentKeywordMatchCreateManyInput[];
    skipDuplicates?: boolean;
};
export type CommentKeywordMatchCreateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.CommentKeywordMatchSelectCreateManyAndReturn<ExtArgs> | null;
    omit?: Prisma.CommentKeywordMatchOmit<ExtArgs> | null;
    data: Prisma.CommentKeywordMatchCreateManyInput | Prisma.CommentKeywordMatchCreateManyInput[];
    skipDuplicates?: boolean;
    include?: Prisma.CommentKeywordMatchIncludeCreateManyAndReturn<ExtArgs> | null;
};
export type CommentKeywordMatchUpdateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.CommentKeywordMatchSelect<ExtArgs> | null;
    omit?: Prisma.CommentKeywordMatchOmit<ExtArgs> | null;
    include?: Prisma.CommentKeywordMatchInclude<ExtArgs> | null;
    data: Prisma.XOR<Prisma.CommentKeywordMatchUpdateInput, Prisma.CommentKeywordMatchUncheckedUpdateInput>;
    where: Prisma.CommentKeywordMatchWhereUniqueInput;
};
export type CommentKeywordMatchUpdateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    data: Prisma.XOR<Prisma.CommentKeywordMatchUpdateManyMutationInput, Prisma.CommentKeywordMatchUncheckedUpdateManyInput>;
    where?: Prisma.CommentKeywordMatchWhereInput;
    limit?: number;
};
export type CommentKeywordMatchUpdateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.CommentKeywordMatchSelectUpdateManyAndReturn<ExtArgs> | null;
    omit?: Prisma.CommentKeywordMatchOmit<ExtArgs> | null;
    data: Prisma.XOR<Prisma.CommentKeywordMatchUpdateManyMutationInput, Prisma.CommentKeywordMatchUncheckedUpdateManyInput>;
    where?: Prisma.CommentKeywordMatchWhereInput;
    limit?: number;
    include?: Prisma.CommentKeywordMatchIncludeUpdateManyAndReturn<ExtArgs> | null;
};
export type CommentKeywordMatchUpsertArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.CommentKeywordMatchSelect<ExtArgs> | null;
    omit?: Prisma.CommentKeywordMatchOmit<ExtArgs> | null;
    include?: Prisma.CommentKeywordMatchInclude<ExtArgs> | null;
    where: Prisma.CommentKeywordMatchWhereUniqueInput;
    create: Prisma.XOR<Prisma.CommentKeywordMatchCreateInput, Prisma.CommentKeywordMatchUncheckedCreateInput>;
    update: Prisma.XOR<Prisma.CommentKeywordMatchUpdateInput, Prisma.CommentKeywordMatchUncheckedUpdateInput>;
};
export type CommentKeywordMatchDeleteArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.CommentKeywordMatchSelect<ExtArgs> | null;
    omit?: Prisma.CommentKeywordMatchOmit<ExtArgs> | null;
    include?: Prisma.CommentKeywordMatchInclude<ExtArgs> | null;
    where: Prisma.CommentKeywordMatchWhereUniqueInput;
};
export type CommentKeywordMatchDeleteManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.CommentKeywordMatchWhereInput;
    limit?: number;
};
export type CommentKeywordMatchDefaultArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.CommentKeywordMatchSelect<ExtArgs> | null;
    omit?: Prisma.CommentKeywordMatchOmit<ExtArgs> | null;
    include?: Prisma.CommentKeywordMatchInclude<ExtArgs> | null;
};
export {};
