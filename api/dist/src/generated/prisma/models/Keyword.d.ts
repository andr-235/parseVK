import type * as runtime from "@prisma/client/runtime/client";
import type * as Prisma from "../internal/prismaNamespace.js";
export type KeywordModel = runtime.Types.Result.DefaultSelection<Prisma.$KeywordPayload>;
export type AggregateKeyword = {
    _count: KeywordCountAggregateOutputType | null;
    _avg: KeywordAvgAggregateOutputType | null;
    _sum: KeywordSumAggregateOutputType | null;
    _min: KeywordMinAggregateOutputType | null;
    _max: KeywordMaxAggregateOutputType | null;
};
export type KeywordAvgAggregateOutputType = {
    id: number | null;
};
export type KeywordSumAggregateOutputType = {
    id: number | null;
};
export type KeywordMinAggregateOutputType = {
    id: number | null;
    word: string | null;
    category: string | null;
    isPhrase: boolean | null;
    createdAt: Date | null;
    updatedAt: Date | null;
};
export type KeywordMaxAggregateOutputType = {
    id: number | null;
    word: string | null;
    category: string | null;
    isPhrase: boolean | null;
    createdAt: Date | null;
    updatedAt: Date | null;
};
export type KeywordCountAggregateOutputType = {
    id: number;
    word: number;
    category: number;
    isPhrase: number;
    createdAt: number;
    updatedAt: number;
    _all: number;
};
export type KeywordAvgAggregateInputType = {
    id?: true;
};
export type KeywordSumAggregateInputType = {
    id?: true;
};
export type KeywordMinAggregateInputType = {
    id?: true;
    word?: true;
    category?: true;
    isPhrase?: true;
    createdAt?: true;
    updatedAt?: true;
};
export type KeywordMaxAggregateInputType = {
    id?: true;
    word?: true;
    category?: true;
    isPhrase?: true;
    createdAt?: true;
    updatedAt?: true;
};
export type KeywordCountAggregateInputType = {
    id?: true;
    word?: true;
    category?: true;
    isPhrase?: true;
    createdAt?: true;
    updatedAt?: true;
    _all?: true;
};
export type KeywordAggregateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.KeywordWhereInput;
    orderBy?: Prisma.KeywordOrderByWithRelationInput | Prisma.KeywordOrderByWithRelationInput[];
    cursor?: Prisma.KeywordWhereUniqueInput;
    take?: number;
    skip?: number;
    _count?: true | KeywordCountAggregateInputType;
    _avg?: KeywordAvgAggregateInputType;
    _sum?: KeywordSumAggregateInputType;
    _min?: KeywordMinAggregateInputType;
    _max?: KeywordMaxAggregateInputType;
};
export type GetKeywordAggregateType<T extends KeywordAggregateArgs> = {
    [P in keyof T & keyof AggregateKeyword]: P extends '_count' | 'count' ? T[P] extends true ? number : Prisma.GetScalarType<T[P], AggregateKeyword[P]> : Prisma.GetScalarType<T[P], AggregateKeyword[P]>;
};
export type KeywordGroupByArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.KeywordWhereInput;
    orderBy?: Prisma.KeywordOrderByWithAggregationInput | Prisma.KeywordOrderByWithAggregationInput[];
    by: Prisma.KeywordScalarFieldEnum[] | Prisma.KeywordScalarFieldEnum;
    having?: Prisma.KeywordScalarWhereWithAggregatesInput;
    take?: number;
    skip?: number;
    _count?: KeywordCountAggregateInputType | true;
    _avg?: KeywordAvgAggregateInputType;
    _sum?: KeywordSumAggregateInputType;
    _min?: KeywordMinAggregateInputType;
    _max?: KeywordMaxAggregateInputType;
};
export type KeywordGroupByOutputType = {
    id: number;
    word: string;
    category: string | null;
    isPhrase: boolean;
    createdAt: Date;
    updatedAt: Date;
    _count: KeywordCountAggregateOutputType | null;
    _avg: KeywordAvgAggregateOutputType | null;
    _sum: KeywordSumAggregateOutputType | null;
    _min: KeywordMinAggregateOutputType | null;
    _max: KeywordMaxAggregateOutputType | null;
};
type GetKeywordGroupByPayload<T extends KeywordGroupByArgs> = Prisma.PrismaPromise<Array<Prisma.PickEnumerable<KeywordGroupByOutputType, T['by']> & {
    [P in ((keyof T) & (keyof KeywordGroupByOutputType))]: P extends '_count' ? T[P] extends boolean ? number : Prisma.GetScalarType<T[P], KeywordGroupByOutputType[P]> : Prisma.GetScalarType<T[P], KeywordGroupByOutputType[P]>;
}>>;
export type KeywordWhereInput = {
    AND?: Prisma.KeywordWhereInput | Prisma.KeywordWhereInput[];
    OR?: Prisma.KeywordWhereInput[];
    NOT?: Prisma.KeywordWhereInput | Prisma.KeywordWhereInput[];
    id?: Prisma.IntFilter<"Keyword"> | number;
    word?: Prisma.StringFilter<"Keyword"> | string;
    category?: Prisma.StringNullableFilter<"Keyword"> | string | null;
    isPhrase?: Prisma.BoolFilter<"Keyword"> | boolean;
    createdAt?: Prisma.DateTimeFilter<"Keyword"> | Date | string;
    updatedAt?: Prisma.DateTimeFilter<"Keyword"> | Date | string;
    commentKeywordMatches?: Prisma.CommentKeywordMatchListRelationFilter;
    keywordForms?: Prisma.KeywordFormListRelationFilter;
    keywordFormExclusions?: Prisma.KeywordFormExclusionListRelationFilter;
};
export type KeywordOrderByWithRelationInput = {
    id?: Prisma.SortOrder;
    word?: Prisma.SortOrder;
    category?: Prisma.SortOrderInput | Prisma.SortOrder;
    isPhrase?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
    commentKeywordMatches?: Prisma.CommentKeywordMatchOrderByRelationAggregateInput;
    keywordForms?: Prisma.KeywordFormOrderByRelationAggregateInput;
    keywordFormExclusions?: Prisma.KeywordFormExclusionOrderByRelationAggregateInput;
};
export type KeywordWhereUniqueInput = Prisma.AtLeast<{
    id?: number;
    word?: string;
    AND?: Prisma.KeywordWhereInput | Prisma.KeywordWhereInput[];
    OR?: Prisma.KeywordWhereInput[];
    NOT?: Prisma.KeywordWhereInput | Prisma.KeywordWhereInput[];
    category?: Prisma.StringNullableFilter<"Keyword"> | string | null;
    isPhrase?: Prisma.BoolFilter<"Keyword"> | boolean;
    createdAt?: Prisma.DateTimeFilter<"Keyword"> | Date | string;
    updatedAt?: Prisma.DateTimeFilter<"Keyword"> | Date | string;
    commentKeywordMatches?: Prisma.CommentKeywordMatchListRelationFilter;
    keywordForms?: Prisma.KeywordFormListRelationFilter;
    keywordFormExclusions?: Prisma.KeywordFormExclusionListRelationFilter;
}, "id" | "word">;
export type KeywordOrderByWithAggregationInput = {
    id?: Prisma.SortOrder;
    word?: Prisma.SortOrder;
    category?: Prisma.SortOrderInput | Prisma.SortOrder;
    isPhrase?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
    _count?: Prisma.KeywordCountOrderByAggregateInput;
    _avg?: Prisma.KeywordAvgOrderByAggregateInput;
    _max?: Prisma.KeywordMaxOrderByAggregateInput;
    _min?: Prisma.KeywordMinOrderByAggregateInput;
    _sum?: Prisma.KeywordSumOrderByAggregateInput;
};
export type KeywordScalarWhereWithAggregatesInput = {
    AND?: Prisma.KeywordScalarWhereWithAggregatesInput | Prisma.KeywordScalarWhereWithAggregatesInput[];
    OR?: Prisma.KeywordScalarWhereWithAggregatesInput[];
    NOT?: Prisma.KeywordScalarWhereWithAggregatesInput | Prisma.KeywordScalarWhereWithAggregatesInput[];
    id?: Prisma.IntWithAggregatesFilter<"Keyword"> | number;
    word?: Prisma.StringWithAggregatesFilter<"Keyword"> | string;
    category?: Prisma.StringNullableWithAggregatesFilter<"Keyword"> | string | null;
    isPhrase?: Prisma.BoolWithAggregatesFilter<"Keyword"> | boolean;
    createdAt?: Prisma.DateTimeWithAggregatesFilter<"Keyword"> | Date | string;
    updatedAt?: Prisma.DateTimeWithAggregatesFilter<"Keyword"> | Date | string;
};
export type KeywordCreateInput = {
    word: string;
    category?: string | null;
    isPhrase?: boolean;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    commentKeywordMatches?: Prisma.CommentKeywordMatchCreateNestedManyWithoutKeywordInput;
    keywordForms?: Prisma.KeywordFormCreateNestedManyWithoutKeywordInput;
    keywordFormExclusions?: Prisma.KeywordFormExclusionCreateNestedManyWithoutKeywordInput;
};
export type KeywordUncheckedCreateInput = {
    id?: number;
    word: string;
    category?: string | null;
    isPhrase?: boolean;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    commentKeywordMatches?: Prisma.CommentKeywordMatchUncheckedCreateNestedManyWithoutKeywordInput;
    keywordForms?: Prisma.KeywordFormUncheckedCreateNestedManyWithoutKeywordInput;
    keywordFormExclusions?: Prisma.KeywordFormExclusionUncheckedCreateNestedManyWithoutKeywordInput;
};
export type KeywordUpdateInput = {
    word?: Prisma.StringFieldUpdateOperationsInput | string;
    category?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    isPhrase?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    commentKeywordMatches?: Prisma.CommentKeywordMatchUpdateManyWithoutKeywordNestedInput;
    keywordForms?: Prisma.KeywordFormUpdateManyWithoutKeywordNestedInput;
    keywordFormExclusions?: Prisma.KeywordFormExclusionUpdateManyWithoutKeywordNestedInput;
};
export type KeywordUncheckedUpdateInput = {
    id?: Prisma.IntFieldUpdateOperationsInput | number;
    word?: Prisma.StringFieldUpdateOperationsInput | string;
    category?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    isPhrase?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    commentKeywordMatches?: Prisma.CommentKeywordMatchUncheckedUpdateManyWithoutKeywordNestedInput;
    keywordForms?: Prisma.KeywordFormUncheckedUpdateManyWithoutKeywordNestedInput;
    keywordFormExclusions?: Prisma.KeywordFormExclusionUncheckedUpdateManyWithoutKeywordNestedInput;
};
export type KeywordCreateManyInput = {
    id?: number;
    word: string;
    category?: string | null;
    isPhrase?: boolean;
    createdAt?: Date | string;
    updatedAt?: Date | string;
};
export type KeywordUpdateManyMutationInput = {
    word?: Prisma.StringFieldUpdateOperationsInput | string;
    category?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    isPhrase?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type KeywordUncheckedUpdateManyInput = {
    id?: Prisma.IntFieldUpdateOperationsInput | number;
    word?: Prisma.StringFieldUpdateOperationsInput | string;
    category?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    isPhrase?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type KeywordCountOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    word?: Prisma.SortOrder;
    category?: Prisma.SortOrder;
    isPhrase?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
};
export type KeywordAvgOrderByAggregateInput = {
    id?: Prisma.SortOrder;
};
export type KeywordMaxOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    word?: Prisma.SortOrder;
    category?: Prisma.SortOrder;
    isPhrase?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
};
export type KeywordMinOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    word?: Prisma.SortOrder;
    category?: Prisma.SortOrder;
    isPhrase?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
};
export type KeywordSumOrderByAggregateInput = {
    id?: Prisma.SortOrder;
};
export type KeywordScalarRelationFilter = {
    is?: Prisma.KeywordWhereInput;
    isNot?: Prisma.KeywordWhereInput;
};
export type KeywordCreateNestedOneWithoutKeywordFormsInput = {
    create?: Prisma.XOR<Prisma.KeywordCreateWithoutKeywordFormsInput, Prisma.KeywordUncheckedCreateWithoutKeywordFormsInput>;
    connectOrCreate?: Prisma.KeywordCreateOrConnectWithoutKeywordFormsInput;
    connect?: Prisma.KeywordWhereUniqueInput;
};
export type KeywordUpdateOneRequiredWithoutKeywordFormsNestedInput = {
    create?: Prisma.XOR<Prisma.KeywordCreateWithoutKeywordFormsInput, Prisma.KeywordUncheckedCreateWithoutKeywordFormsInput>;
    connectOrCreate?: Prisma.KeywordCreateOrConnectWithoutKeywordFormsInput;
    upsert?: Prisma.KeywordUpsertWithoutKeywordFormsInput;
    connect?: Prisma.KeywordWhereUniqueInput;
    update?: Prisma.XOR<Prisma.XOR<Prisma.KeywordUpdateToOneWithWhereWithoutKeywordFormsInput, Prisma.KeywordUpdateWithoutKeywordFormsInput>, Prisma.KeywordUncheckedUpdateWithoutKeywordFormsInput>;
};
export type KeywordCreateNestedOneWithoutKeywordFormExclusionsInput = {
    create?: Prisma.XOR<Prisma.KeywordCreateWithoutKeywordFormExclusionsInput, Prisma.KeywordUncheckedCreateWithoutKeywordFormExclusionsInput>;
    connectOrCreate?: Prisma.KeywordCreateOrConnectWithoutKeywordFormExclusionsInput;
    connect?: Prisma.KeywordWhereUniqueInput;
};
export type KeywordUpdateOneRequiredWithoutKeywordFormExclusionsNestedInput = {
    create?: Prisma.XOR<Prisma.KeywordCreateWithoutKeywordFormExclusionsInput, Prisma.KeywordUncheckedCreateWithoutKeywordFormExclusionsInput>;
    connectOrCreate?: Prisma.KeywordCreateOrConnectWithoutKeywordFormExclusionsInput;
    upsert?: Prisma.KeywordUpsertWithoutKeywordFormExclusionsInput;
    connect?: Prisma.KeywordWhereUniqueInput;
    update?: Prisma.XOR<Prisma.XOR<Prisma.KeywordUpdateToOneWithWhereWithoutKeywordFormExclusionsInput, Prisma.KeywordUpdateWithoutKeywordFormExclusionsInput>, Prisma.KeywordUncheckedUpdateWithoutKeywordFormExclusionsInput>;
};
export type KeywordCreateNestedOneWithoutCommentKeywordMatchesInput = {
    create?: Prisma.XOR<Prisma.KeywordCreateWithoutCommentKeywordMatchesInput, Prisma.KeywordUncheckedCreateWithoutCommentKeywordMatchesInput>;
    connectOrCreate?: Prisma.KeywordCreateOrConnectWithoutCommentKeywordMatchesInput;
    connect?: Prisma.KeywordWhereUniqueInput;
};
export type KeywordUpdateOneRequiredWithoutCommentKeywordMatchesNestedInput = {
    create?: Prisma.XOR<Prisma.KeywordCreateWithoutCommentKeywordMatchesInput, Prisma.KeywordUncheckedCreateWithoutCommentKeywordMatchesInput>;
    connectOrCreate?: Prisma.KeywordCreateOrConnectWithoutCommentKeywordMatchesInput;
    upsert?: Prisma.KeywordUpsertWithoutCommentKeywordMatchesInput;
    connect?: Prisma.KeywordWhereUniqueInput;
    update?: Prisma.XOR<Prisma.XOR<Prisma.KeywordUpdateToOneWithWhereWithoutCommentKeywordMatchesInput, Prisma.KeywordUpdateWithoutCommentKeywordMatchesInput>, Prisma.KeywordUncheckedUpdateWithoutCommentKeywordMatchesInput>;
};
export type KeywordCreateWithoutKeywordFormsInput = {
    word: string;
    category?: string | null;
    isPhrase?: boolean;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    commentKeywordMatches?: Prisma.CommentKeywordMatchCreateNestedManyWithoutKeywordInput;
    keywordFormExclusions?: Prisma.KeywordFormExclusionCreateNestedManyWithoutKeywordInput;
};
export type KeywordUncheckedCreateWithoutKeywordFormsInput = {
    id?: number;
    word: string;
    category?: string | null;
    isPhrase?: boolean;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    commentKeywordMatches?: Prisma.CommentKeywordMatchUncheckedCreateNestedManyWithoutKeywordInput;
    keywordFormExclusions?: Prisma.KeywordFormExclusionUncheckedCreateNestedManyWithoutKeywordInput;
};
export type KeywordCreateOrConnectWithoutKeywordFormsInput = {
    where: Prisma.KeywordWhereUniqueInput;
    create: Prisma.XOR<Prisma.KeywordCreateWithoutKeywordFormsInput, Prisma.KeywordUncheckedCreateWithoutKeywordFormsInput>;
};
export type KeywordUpsertWithoutKeywordFormsInput = {
    update: Prisma.XOR<Prisma.KeywordUpdateWithoutKeywordFormsInput, Prisma.KeywordUncheckedUpdateWithoutKeywordFormsInput>;
    create: Prisma.XOR<Prisma.KeywordCreateWithoutKeywordFormsInput, Prisma.KeywordUncheckedCreateWithoutKeywordFormsInput>;
    where?: Prisma.KeywordWhereInput;
};
export type KeywordUpdateToOneWithWhereWithoutKeywordFormsInput = {
    where?: Prisma.KeywordWhereInput;
    data: Prisma.XOR<Prisma.KeywordUpdateWithoutKeywordFormsInput, Prisma.KeywordUncheckedUpdateWithoutKeywordFormsInput>;
};
export type KeywordUpdateWithoutKeywordFormsInput = {
    word?: Prisma.StringFieldUpdateOperationsInput | string;
    category?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    isPhrase?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    commentKeywordMatches?: Prisma.CommentKeywordMatchUpdateManyWithoutKeywordNestedInput;
    keywordFormExclusions?: Prisma.KeywordFormExclusionUpdateManyWithoutKeywordNestedInput;
};
export type KeywordUncheckedUpdateWithoutKeywordFormsInput = {
    id?: Prisma.IntFieldUpdateOperationsInput | number;
    word?: Prisma.StringFieldUpdateOperationsInput | string;
    category?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    isPhrase?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    commentKeywordMatches?: Prisma.CommentKeywordMatchUncheckedUpdateManyWithoutKeywordNestedInput;
    keywordFormExclusions?: Prisma.KeywordFormExclusionUncheckedUpdateManyWithoutKeywordNestedInput;
};
export type KeywordCreateWithoutKeywordFormExclusionsInput = {
    word: string;
    category?: string | null;
    isPhrase?: boolean;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    commentKeywordMatches?: Prisma.CommentKeywordMatchCreateNestedManyWithoutKeywordInput;
    keywordForms?: Prisma.KeywordFormCreateNestedManyWithoutKeywordInput;
};
export type KeywordUncheckedCreateWithoutKeywordFormExclusionsInput = {
    id?: number;
    word: string;
    category?: string | null;
    isPhrase?: boolean;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    commentKeywordMatches?: Prisma.CommentKeywordMatchUncheckedCreateNestedManyWithoutKeywordInput;
    keywordForms?: Prisma.KeywordFormUncheckedCreateNestedManyWithoutKeywordInput;
};
export type KeywordCreateOrConnectWithoutKeywordFormExclusionsInput = {
    where: Prisma.KeywordWhereUniqueInput;
    create: Prisma.XOR<Prisma.KeywordCreateWithoutKeywordFormExclusionsInput, Prisma.KeywordUncheckedCreateWithoutKeywordFormExclusionsInput>;
};
export type KeywordUpsertWithoutKeywordFormExclusionsInput = {
    update: Prisma.XOR<Prisma.KeywordUpdateWithoutKeywordFormExclusionsInput, Prisma.KeywordUncheckedUpdateWithoutKeywordFormExclusionsInput>;
    create: Prisma.XOR<Prisma.KeywordCreateWithoutKeywordFormExclusionsInput, Prisma.KeywordUncheckedCreateWithoutKeywordFormExclusionsInput>;
    where?: Prisma.KeywordWhereInput;
};
export type KeywordUpdateToOneWithWhereWithoutKeywordFormExclusionsInput = {
    where?: Prisma.KeywordWhereInput;
    data: Prisma.XOR<Prisma.KeywordUpdateWithoutKeywordFormExclusionsInput, Prisma.KeywordUncheckedUpdateWithoutKeywordFormExclusionsInput>;
};
export type KeywordUpdateWithoutKeywordFormExclusionsInput = {
    word?: Prisma.StringFieldUpdateOperationsInput | string;
    category?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    isPhrase?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    commentKeywordMatches?: Prisma.CommentKeywordMatchUpdateManyWithoutKeywordNestedInput;
    keywordForms?: Prisma.KeywordFormUpdateManyWithoutKeywordNestedInput;
};
export type KeywordUncheckedUpdateWithoutKeywordFormExclusionsInput = {
    id?: Prisma.IntFieldUpdateOperationsInput | number;
    word?: Prisma.StringFieldUpdateOperationsInput | string;
    category?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    isPhrase?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    commentKeywordMatches?: Prisma.CommentKeywordMatchUncheckedUpdateManyWithoutKeywordNestedInput;
    keywordForms?: Prisma.KeywordFormUncheckedUpdateManyWithoutKeywordNestedInput;
};
export type KeywordCreateWithoutCommentKeywordMatchesInput = {
    word: string;
    category?: string | null;
    isPhrase?: boolean;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    keywordForms?: Prisma.KeywordFormCreateNestedManyWithoutKeywordInput;
    keywordFormExclusions?: Prisma.KeywordFormExclusionCreateNestedManyWithoutKeywordInput;
};
export type KeywordUncheckedCreateWithoutCommentKeywordMatchesInput = {
    id?: number;
    word: string;
    category?: string | null;
    isPhrase?: boolean;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    keywordForms?: Prisma.KeywordFormUncheckedCreateNestedManyWithoutKeywordInput;
    keywordFormExclusions?: Prisma.KeywordFormExclusionUncheckedCreateNestedManyWithoutKeywordInput;
};
export type KeywordCreateOrConnectWithoutCommentKeywordMatchesInput = {
    where: Prisma.KeywordWhereUniqueInput;
    create: Prisma.XOR<Prisma.KeywordCreateWithoutCommentKeywordMatchesInput, Prisma.KeywordUncheckedCreateWithoutCommentKeywordMatchesInput>;
};
export type KeywordUpsertWithoutCommentKeywordMatchesInput = {
    update: Prisma.XOR<Prisma.KeywordUpdateWithoutCommentKeywordMatchesInput, Prisma.KeywordUncheckedUpdateWithoutCommentKeywordMatchesInput>;
    create: Prisma.XOR<Prisma.KeywordCreateWithoutCommentKeywordMatchesInput, Prisma.KeywordUncheckedCreateWithoutCommentKeywordMatchesInput>;
    where?: Prisma.KeywordWhereInput;
};
export type KeywordUpdateToOneWithWhereWithoutCommentKeywordMatchesInput = {
    where?: Prisma.KeywordWhereInput;
    data: Prisma.XOR<Prisma.KeywordUpdateWithoutCommentKeywordMatchesInput, Prisma.KeywordUncheckedUpdateWithoutCommentKeywordMatchesInput>;
};
export type KeywordUpdateWithoutCommentKeywordMatchesInput = {
    word?: Prisma.StringFieldUpdateOperationsInput | string;
    category?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    isPhrase?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    keywordForms?: Prisma.KeywordFormUpdateManyWithoutKeywordNestedInput;
    keywordFormExclusions?: Prisma.KeywordFormExclusionUpdateManyWithoutKeywordNestedInput;
};
export type KeywordUncheckedUpdateWithoutCommentKeywordMatchesInput = {
    id?: Prisma.IntFieldUpdateOperationsInput | number;
    word?: Prisma.StringFieldUpdateOperationsInput | string;
    category?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    isPhrase?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    keywordForms?: Prisma.KeywordFormUncheckedUpdateManyWithoutKeywordNestedInput;
    keywordFormExclusions?: Prisma.KeywordFormExclusionUncheckedUpdateManyWithoutKeywordNestedInput;
};
export type KeywordCountOutputType = {
    commentKeywordMatches: number;
    keywordForms: number;
    keywordFormExclusions: number;
};
export type KeywordCountOutputTypeSelect<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    commentKeywordMatches?: boolean | KeywordCountOutputTypeCountCommentKeywordMatchesArgs;
    keywordForms?: boolean | KeywordCountOutputTypeCountKeywordFormsArgs;
    keywordFormExclusions?: boolean | KeywordCountOutputTypeCountKeywordFormExclusionsArgs;
};
export type KeywordCountOutputTypeDefaultArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.KeywordCountOutputTypeSelect<ExtArgs> | null;
};
export type KeywordCountOutputTypeCountCommentKeywordMatchesArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.CommentKeywordMatchWhereInput;
};
export type KeywordCountOutputTypeCountKeywordFormsArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.KeywordFormWhereInput;
};
export type KeywordCountOutputTypeCountKeywordFormExclusionsArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.KeywordFormExclusionWhereInput;
};
export type KeywordSelect<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    word?: boolean;
    category?: boolean;
    isPhrase?: boolean;
    createdAt?: boolean;
    updatedAt?: boolean;
    commentKeywordMatches?: boolean | Prisma.Keyword$commentKeywordMatchesArgs<ExtArgs>;
    keywordForms?: boolean | Prisma.Keyword$keywordFormsArgs<ExtArgs>;
    keywordFormExclusions?: boolean | Prisma.Keyword$keywordFormExclusionsArgs<ExtArgs>;
    _count?: boolean | Prisma.KeywordCountOutputTypeDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["keyword"]>;
export type KeywordSelectCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    word?: boolean;
    category?: boolean;
    isPhrase?: boolean;
    createdAt?: boolean;
    updatedAt?: boolean;
}, ExtArgs["result"]["keyword"]>;
export type KeywordSelectUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    word?: boolean;
    category?: boolean;
    isPhrase?: boolean;
    createdAt?: boolean;
    updatedAt?: boolean;
}, ExtArgs["result"]["keyword"]>;
export type KeywordSelectScalar = {
    id?: boolean;
    word?: boolean;
    category?: boolean;
    isPhrase?: boolean;
    createdAt?: boolean;
    updatedAt?: boolean;
};
export type KeywordOmit<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetOmit<"id" | "word" | "category" | "isPhrase" | "createdAt" | "updatedAt", ExtArgs["result"]["keyword"]>;
export type KeywordInclude<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    commentKeywordMatches?: boolean | Prisma.Keyword$commentKeywordMatchesArgs<ExtArgs>;
    keywordForms?: boolean | Prisma.Keyword$keywordFormsArgs<ExtArgs>;
    keywordFormExclusions?: boolean | Prisma.Keyword$keywordFormExclusionsArgs<ExtArgs>;
    _count?: boolean | Prisma.KeywordCountOutputTypeDefaultArgs<ExtArgs>;
};
export type KeywordIncludeCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {};
export type KeywordIncludeUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {};
export type $KeywordPayload<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    name: "Keyword";
    objects: {
        commentKeywordMatches: Prisma.$CommentKeywordMatchPayload<ExtArgs>[];
        keywordForms: Prisma.$KeywordFormPayload<ExtArgs>[];
        keywordFormExclusions: Prisma.$KeywordFormExclusionPayload<ExtArgs>[];
    };
    scalars: runtime.Types.Extensions.GetPayloadResult<{
        id: number;
        word: string;
        category: string | null;
        isPhrase: boolean;
        createdAt: Date;
        updatedAt: Date;
    }, ExtArgs["result"]["keyword"]>;
    composites: {};
};
export type KeywordGetPayload<S extends boolean | null | undefined | KeywordDefaultArgs> = runtime.Types.Result.GetResult<Prisma.$KeywordPayload, S>;
export type KeywordCountArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = Omit<KeywordFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
    select?: KeywordCountAggregateInputType | true;
};
export interface KeywordDelegate<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: {
        types: Prisma.TypeMap<ExtArgs>['model']['Keyword'];
        meta: {
            name: 'Keyword';
        };
    };
    findUnique<T extends KeywordFindUniqueArgs>(args: Prisma.SelectSubset<T, KeywordFindUniqueArgs<ExtArgs>>): Prisma.Prisma__KeywordClient<runtime.Types.Result.GetResult<Prisma.$KeywordPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    findUniqueOrThrow<T extends KeywordFindUniqueOrThrowArgs>(args: Prisma.SelectSubset<T, KeywordFindUniqueOrThrowArgs<ExtArgs>>): Prisma.Prisma__KeywordClient<runtime.Types.Result.GetResult<Prisma.$KeywordPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    findFirst<T extends KeywordFindFirstArgs>(args?: Prisma.SelectSubset<T, KeywordFindFirstArgs<ExtArgs>>): Prisma.Prisma__KeywordClient<runtime.Types.Result.GetResult<Prisma.$KeywordPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    findFirstOrThrow<T extends KeywordFindFirstOrThrowArgs>(args?: Prisma.SelectSubset<T, KeywordFindFirstOrThrowArgs<ExtArgs>>): Prisma.Prisma__KeywordClient<runtime.Types.Result.GetResult<Prisma.$KeywordPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    findMany<T extends KeywordFindManyArgs>(args?: Prisma.SelectSubset<T, KeywordFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$KeywordPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>;
    create<T extends KeywordCreateArgs>(args: Prisma.SelectSubset<T, KeywordCreateArgs<ExtArgs>>): Prisma.Prisma__KeywordClient<runtime.Types.Result.GetResult<Prisma.$KeywordPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    createMany<T extends KeywordCreateManyArgs>(args?: Prisma.SelectSubset<T, KeywordCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    createManyAndReturn<T extends KeywordCreateManyAndReturnArgs>(args?: Prisma.SelectSubset<T, KeywordCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$KeywordPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>;
    delete<T extends KeywordDeleteArgs>(args: Prisma.SelectSubset<T, KeywordDeleteArgs<ExtArgs>>): Prisma.Prisma__KeywordClient<runtime.Types.Result.GetResult<Prisma.$KeywordPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    update<T extends KeywordUpdateArgs>(args: Prisma.SelectSubset<T, KeywordUpdateArgs<ExtArgs>>): Prisma.Prisma__KeywordClient<runtime.Types.Result.GetResult<Prisma.$KeywordPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    deleteMany<T extends KeywordDeleteManyArgs>(args?: Prisma.SelectSubset<T, KeywordDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    updateMany<T extends KeywordUpdateManyArgs>(args: Prisma.SelectSubset<T, KeywordUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    updateManyAndReturn<T extends KeywordUpdateManyAndReturnArgs>(args: Prisma.SelectSubset<T, KeywordUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$KeywordPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>;
    upsert<T extends KeywordUpsertArgs>(args: Prisma.SelectSubset<T, KeywordUpsertArgs<ExtArgs>>): Prisma.Prisma__KeywordClient<runtime.Types.Result.GetResult<Prisma.$KeywordPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    count<T extends KeywordCountArgs>(args?: Prisma.Subset<T, KeywordCountArgs>): Prisma.PrismaPromise<T extends runtime.Types.Utils.Record<'select', any> ? T['select'] extends true ? number : Prisma.GetScalarType<T['select'], KeywordCountAggregateOutputType> : number>;
    aggregate<T extends KeywordAggregateArgs>(args: Prisma.Subset<T, KeywordAggregateArgs>): Prisma.PrismaPromise<GetKeywordAggregateType<T>>;
    groupBy<T extends KeywordGroupByArgs, HasSelectOrTake extends Prisma.Or<Prisma.Extends<'skip', Prisma.Keys<T>>, Prisma.Extends<'take', Prisma.Keys<T>>>, OrderByArg extends Prisma.True extends HasSelectOrTake ? {
        orderBy: KeywordGroupByArgs['orderBy'];
    } : {
        orderBy?: KeywordGroupByArgs['orderBy'];
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
    }[OrderFields]>(args: Prisma.SubsetIntersection<T, KeywordGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetKeywordGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>;
    readonly fields: KeywordFieldRefs;
}
export interface Prisma__KeywordClient<T, Null = never, ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise";
    commentKeywordMatches<T extends Prisma.Keyword$commentKeywordMatchesArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.Keyword$commentKeywordMatchesArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$CommentKeywordMatchPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>;
    keywordForms<T extends Prisma.Keyword$keywordFormsArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.Keyword$keywordFormsArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$KeywordFormPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>;
    keywordFormExclusions<T extends Prisma.Keyword$keywordFormExclusionsArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.Keyword$keywordFormExclusionsArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$KeywordFormExclusionPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>;
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): runtime.Types.Utils.JsPromise<TResult1 | TResult2>;
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): runtime.Types.Utils.JsPromise<T | TResult>;
    finally(onfinally?: (() => void) | undefined | null): runtime.Types.Utils.JsPromise<T>;
}
export interface KeywordFieldRefs {
    readonly id: Prisma.FieldRef<"Keyword", 'Int'>;
    readonly word: Prisma.FieldRef<"Keyword", 'String'>;
    readonly category: Prisma.FieldRef<"Keyword", 'String'>;
    readonly isPhrase: Prisma.FieldRef<"Keyword", 'Boolean'>;
    readonly createdAt: Prisma.FieldRef<"Keyword", 'DateTime'>;
    readonly updatedAt: Prisma.FieldRef<"Keyword", 'DateTime'>;
}
export type KeywordFindUniqueArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.KeywordSelect<ExtArgs> | null;
    omit?: Prisma.KeywordOmit<ExtArgs> | null;
    include?: Prisma.KeywordInclude<ExtArgs> | null;
    where: Prisma.KeywordWhereUniqueInput;
};
export type KeywordFindUniqueOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.KeywordSelect<ExtArgs> | null;
    omit?: Prisma.KeywordOmit<ExtArgs> | null;
    include?: Prisma.KeywordInclude<ExtArgs> | null;
    where: Prisma.KeywordWhereUniqueInput;
};
export type KeywordFindFirstArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.KeywordSelect<ExtArgs> | null;
    omit?: Prisma.KeywordOmit<ExtArgs> | null;
    include?: Prisma.KeywordInclude<ExtArgs> | null;
    where?: Prisma.KeywordWhereInput;
    orderBy?: Prisma.KeywordOrderByWithRelationInput | Prisma.KeywordOrderByWithRelationInput[];
    cursor?: Prisma.KeywordWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.KeywordScalarFieldEnum | Prisma.KeywordScalarFieldEnum[];
};
export type KeywordFindFirstOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.KeywordSelect<ExtArgs> | null;
    omit?: Prisma.KeywordOmit<ExtArgs> | null;
    include?: Prisma.KeywordInclude<ExtArgs> | null;
    where?: Prisma.KeywordWhereInput;
    orderBy?: Prisma.KeywordOrderByWithRelationInput | Prisma.KeywordOrderByWithRelationInput[];
    cursor?: Prisma.KeywordWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.KeywordScalarFieldEnum | Prisma.KeywordScalarFieldEnum[];
};
export type KeywordFindManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.KeywordSelect<ExtArgs> | null;
    omit?: Prisma.KeywordOmit<ExtArgs> | null;
    include?: Prisma.KeywordInclude<ExtArgs> | null;
    where?: Prisma.KeywordWhereInput;
    orderBy?: Prisma.KeywordOrderByWithRelationInput | Prisma.KeywordOrderByWithRelationInput[];
    cursor?: Prisma.KeywordWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.KeywordScalarFieldEnum | Prisma.KeywordScalarFieldEnum[];
};
export type KeywordCreateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.KeywordSelect<ExtArgs> | null;
    omit?: Prisma.KeywordOmit<ExtArgs> | null;
    include?: Prisma.KeywordInclude<ExtArgs> | null;
    data: Prisma.XOR<Prisma.KeywordCreateInput, Prisma.KeywordUncheckedCreateInput>;
};
export type KeywordCreateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    data: Prisma.KeywordCreateManyInput | Prisma.KeywordCreateManyInput[];
    skipDuplicates?: boolean;
};
export type KeywordCreateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.KeywordSelectCreateManyAndReturn<ExtArgs> | null;
    omit?: Prisma.KeywordOmit<ExtArgs> | null;
    data: Prisma.KeywordCreateManyInput | Prisma.KeywordCreateManyInput[];
    skipDuplicates?: boolean;
};
export type KeywordUpdateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.KeywordSelect<ExtArgs> | null;
    omit?: Prisma.KeywordOmit<ExtArgs> | null;
    include?: Prisma.KeywordInclude<ExtArgs> | null;
    data: Prisma.XOR<Prisma.KeywordUpdateInput, Prisma.KeywordUncheckedUpdateInput>;
    where: Prisma.KeywordWhereUniqueInput;
};
export type KeywordUpdateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    data: Prisma.XOR<Prisma.KeywordUpdateManyMutationInput, Prisma.KeywordUncheckedUpdateManyInput>;
    where?: Prisma.KeywordWhereInput;
    limit?: number;
};
export type KeywordUpdateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.KeywordSelectUpdateManyAndReturn<ExtArgs> | null;
    omit?: Prisma.KeywordOmit<ExtArgs> | null;
    data: Prisma.XOR<Prisma.KeywordUpdateManyMutationInput, Prisma.KeywordUncheckedUpdateManyInput>;
    where?: Prisma.KeywordWhereInput;
    limit?: number;
};
export type KeywordUpsertArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.KeywordSelect<ExtArgs> | null;
    omit?: Prisma.KeywordOmit<ExtArgs> | null;
    include?: Prisma.KeywordInclude<ExtArgs> | null;
    where: Prisma.KeywordWhereUniqueInput;
    create: Prisma.XOR<Prisma.KeywordCreateInput, Prisma.KeywordUncheckedCreateInput>;
    update: Prisma.XOR<Prisma.KeywordUpdateInput, Prisma.KeywordUncheckedUpdateInput>;
};
export type KeywordDeleteArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.KeywordSelect<ExtArgs> | null;
    omit?: Prisma.KeywordOmit<ExtArgs> | null;
    include?: Prisma.KeywordInclude<ExtArgs> | null;
    where: Prisma.KeywordWhereUniqueInput;
};
export type KeywordDeleteManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.KeywordWhereInput;
    limit?: number;
};
export type Keyword$commentKeywordMatchesArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
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
export type Keyword$keywordFormsArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.KeywordFormSelect<ExtArgs> | null;
    omit?: Prisma.KeywordFormOmit<ExtArgs> | null;
    include?: Prisma.KeywordFormInclude<ExtArgs> | null;
    where?: Prisma.KeywordFormWhereInput;
    orderBy?: Prisma.KeywordFormOrderByWithRelationInput | Prisma.KeywordFormOrderByWithRelationInput[];
    cursor?: Prisma.KeywordFormWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.KeywordFormScalarFieldEnum | Prisma.KeywordFormScalarFieldEnum[];
};
export type Keyword$keywordFormExclusionsArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.KeywordFormExclusionSelect<ExtArgs> | null;
    omit?: Prisma.KeywordFormExclusionOmit<ExtArgs> | null;
    include?: Prisma.KeywordFormExclusionInclude<ExtArgs> | null;
    where?: Prisma.KeywordFormExclusionWhereInput;
    orderBy?: Prisma.KeywordFormExclusionOrderByWithRelationInput | Prisma.KeywordFormExclusionOrderByWithRelationInput[];
    cursor?: Prisma.KeywordFormExclusionWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.KeywordFormExclusionScalarFieldEnum | Prisma.KeywordFormExclusionScalarFieldEnum[];
};
export type KeywordDefaultArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.KeywordSelect<ExtArgs> | null;
    omit?: Prisma.KeywordOmit<ExtArgs> | null;
    include?: Prisma.KeywordInclude<ExtArgs> | null;
};
export {};
