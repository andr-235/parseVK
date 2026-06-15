import type * as runtime from "@prisma/client/runtime/client";
import type * as $Enums from "../enums.js";
import type * as Prisma from "../internal/prismaNamespace.js";
export type WatchlistAuthorModel = runtime.Types.Result.DefaultSelection<Prisma.$WatchlistAuthorPayload>;
export type AggregateWatchlistAuthor = {
    _count: WatchlistAuthorCountAggregateOutputType | null;
    _avg: WatchlistAuthorAvgAggregateOutputType | null;
    _sum: WatchlistAuthorSumAggregateOutputType | null;
    _min: WatchlistAuthorMinAggregateOutputType | null;
    _max: WatchlistAuthorMaxAggregateOutputType | null;
};
export type WatchlistAuthorAvgAggregateOutputType = {
    id: number | null;
    authorVkId: number | null;
    sourceCommentId: number | null;
    foundCommentsCount: number | null;
    settingsId: number | null;
};
export type WatchlistAuthorSumAggregateOutputType = {
    id: number | null;
    authorVkId: number | null;
    sourceCommentId: number | null;
    foundCommentsCount: number | null;
    settingsId: number | null;
};
export type WatchlistAuthorMinAggregateOutputType = {
    id: number | null;
    authorVkId: number | null;
    sourceCommentId: number | null;
    status: $Enums.WatchlistStatus | null;
    lastCheckedAt: Date | null;
    lastActivityAt: Date | null;
    foundCommentsCount: number | null;
    monitoringStartedAt: Date | null;
    monitoringStoppedAt: Date | null;
    settingsId: number | null;
    createdAt: Date | null;
    updatedAt: Date | null;
};
export type WatchlistAuthorMaxAggregateOutputType = {
    id: number | null;
    authorVkId: number | null;
    sourceCommentId: number | null;
    status: $Enums.WatchlistStatus | null;
    lastCheckedAt: Date | null;
    lastActivityAt: Date | null;
    foundCommentsCount: number | null;
    monitoringStartedAt: Date | null;
    monitoringStoppedAt: Date | null;
    settingsId: number | null;
    createdAt: Date | null;
    updatedAt: Date | null;
};
export type WatchlistAuthorCountAggregateOutputType = {
    id: number;
    authorVkId: number;
    sourceCommentId: number;
    status: number;
    lastCheckedAt: number;
    lastActivityAt: number;
    foundCommentsCount: number;
    monitoringStartedAt: number;
    monitoringStoppedAt: number;
    settingsId: number;
    createdAt: number;
    updatedAt: number;
    _all: number;
};
export type WatchlistAuthorAvgAggregateInputType = {
    id?: true;
    authorVkId?: true;
    sourceCommentId?: true;
    foundCommentsCount?: true;
    settingsId?: true;
};
export type WatchlistAuthorSumAggregateInputType = {
    id?: true;
    authorVkId?: true;
    sourceCommentId?: true;
    foundCommentsCount?: true;
    settingsId?: true;
};
export type WatchlistAuthorMinAggregateInputType = {
    id?: true;
    authorVkId?: true;
    sourceCommentId?: true;
    status?: true;
    lastCheckedAt?: true;
    lastActivityAt?: true;
    foundCommentsCount?: true;
    monitoringStartedAt?: true;
    monitoringStoppedAt?: true;
    settingsId?: true;
    createdAt?: true;
    updatedAt?: true;
};
export type WatchlistAuthorMaxAggregateInputType = {
    id?: true;
    authorVkId?: true;
    sourceCommentId?: true;
    status?: true;
    lastCheckedAt?: true;
    lastActivityAt?: true;
    foundCommentsCount?: true;
    monitoringStartedAt?: true;
    monitoringStoppedAt?: true;
    settingsId?: true;
    createdAt?: true;
    updatedAt?: true;
};
export type WatchlistAuthorCountAggregateInputType = {
    id?: true;
    authorVkId?: true;
    sourceCommentId?: true;
    status?: true;
    lastCheckedAt?: true;
    lastActivityAt?: true;
    foundCommentsCount?: true;
    monitoringStartedAt?: true;
    monitoringStoppedAt?: true;
    settingsId?: true;
    createdAt?: true;
    updatedAt?: true;
    _all?: true;
};
export type WatchlistAuthorAggregateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.WatchlistAuthorWhereInput;
    orderBy?: Prisma.WatchlistAuthorOrderByWithRelationInput | Prisma.WatchlistAuthorOrderByWithRelationInput[];
    cursor?: Prisma.WatchlistAuthorWhereUniqueInput;
    take?: number;
    skip?: number;
    _count?: true | WatchlistAuthorCountAggregateInputType;
    _avg?: WatchlistAuthorAvgAggregateInputType;
    _sum?: WatchlistAuthorSumAggregateInputType;
    _min?: WatchlistAuthorMinAggregateInputType;
    _max?: WatchlistAuthorMaxAggregateInputType;
};
export type GetWatchlistAuthorAggregateType<T extends WatchlistAuthorAggregateArgs> = {
    [P in keyof T & keyof AggregateWatchlistAuthor]: P extends '_count' | 'count' ? T[P] extends true ? number : Prisma.GetScalarType<T[P], AggregateWatchlistAuthor[P]> : Prisma.GetScalarType<T[P], AggregateWatchlistAuthor[P]>;
};
export type WatchlistAuthorGroupByArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.WatchlistAuthorWhereInput;
    orderBy?: Prisma.WatchlistAuthorOrderByWithAggregationInput | Prisma.WatchlistAuthorOrderByWithAggregationInput[];
    by: Prisma.WatchlistAuthorScalarFieldEnum[] | Prisma.WatchlistAuthorScalarFieldEnum;
    having?: Prisma.WatchlistAuthorScalarWhereWithAggregatesInput;
    take?: number;
    skip?: number;
    _count?: WatchlistAuthorCountAggregateInputType | true;
    _avg?: WatchlistAuthorAvgAggregateInputType;
    _sum?: WatchlistAuthorSumAggregateInputType;
    _min?: WatchlistAuthorMinAggregateInputType;
    _max?: WatchlistAuthorMaxAggregateInputType;
};
export type WatchlistAuthorGroupByOutputType = {
    id: number;
    authorVkId: number;
    sourceCommentId: number | null;
    status: $Enums.WatchlistStatus;
    lastCheckedAt: Date | null;
    lastActivityAt: Date | null;
    foundCommentsCount: number;
    monitoringStartedAt: Date;
    monitoringStoppedAt: Date | null;
    settingsId: number;
    createdAt: Date;
    updatedAt: Date;
    _count: WatchlistAuthorCountAggregateOutputType | null;
    _avg: WatchlistAuthorAvgAggregateOutputType | null;
    _sum: WatchlistAuthorSumAggregateOutputType | null;
    _min: WatchlistAuthorMinAggregateOutputType | null;
    _max: WatchlistAuthorMaxAggregateOutputType | null;
};
type GetWatchlistAuthorGroupByPayload<T extends WatchlistAuthorGroupByArgs> = Prisma.PrismaPromise<Array<Prisma.PickEnumerable<WatchlistAuthorGroupByOutputType, T['by']> & {
    [P in ((keyof T) & (keyof WatchlistAuthorGroupByOutputType))]: P extends '_count' ? T[P] extends boolean ? number : Prisma.GetScalarType<T[P], WatchlistAuthorGroupByOutputType[P]> : Prisma.GetScalarType<T[P], WatchlistAuthorGroupByOutputType[P]>;
}>>;
export type WatchlistAuthorWhereInput = {
    AND?: Prisma.WatchlistAuthorWhereInput | Prisma.WatchlistAuthorWhereInput[];
    OR?: Prisma.WatchlistAuthorWhereInput[];
    NOT?: Prisma.WatchlistAuthorWhereInput | Prisma.WatchlistAuthorWhereInput[];
    id?: Prisma.IntFilter<"WatchlistAuthor"> | number;
    authorVkId?: Prisma.IntFilter<"WatchlistAuthor"> | number;
    sourceCommentId?: Prisma.IntNullableFilter<"WatchlistAuthor"> | number | null;
    status?: Prisma.EnumWatchlistStatusFilter<"WatchlistAuthor"> | $Enums.WatchlistStatus;
    lastCheckedAt?: Prisma.DateTimeNullableFilter<"WatchlistAuthor"> | Date | string | null;
    lastActivityAt?: Prisma.DateTimeNullableFilter<"WatchlistAuthor"> | Date | string | null;
    foundCommentsCount?: Prisma.IntFilter<"WatchlistAuthor"> | number;
    monitoringStartedAt?: Prisma.DateTimeFilter<"WatchlistAuthor"> | Date | string;
    monitoringStoppedAt?: Prisma.DateTimeNullableFilter<"WatchlistAuthor"> | Date | string | null;
    settingsId?: Prisma.IntFilter<"WatchlistAuthor"> | number;
    createdAt?: Prisma.DateTimeFilter<"WatchlistAuthor"> | Date | string;
    updatedAt?: Prisma.DateTimeFilter<"WatchlistAuthor"> | Date | string;
    settings?: Prisma.XOR<Prisma.WatchlistSettingsScalarRelationFilter, Prisma.WatchlistSettingsWhereInput>;
    author?: Prisma.XOR<Prisma.AuthorScalarRelationFilter, Prisma.AuthorWhereInput>;
    sourceComment?: Prisma.XOR<Prisma.CommentNullableScalarRelationFilter, Prisma.CommentWhereInput> | null;
    comments?: Prisma.CommentListRelationFilter;
};
export type WatchlistAuthorOrderByWithRelationInput = {
    id?: Prisma.SortOrder;
    authorVkId?: Prisma.SortOrder;
    sourceCommentId?: Prisma.SortOrderInput | Prisma.SortOrder;
    status?: Prisma.SortOrder;
    lastCheckedAt?: Prisma.SortOrderInput | Prisma.SortOrder;
    lastActivityAt?: Prisma.SortOrderInput | Prisma.SortOrder;
    foundCommentsCount?: Prisma.SortOrder;
    monitoringStartedAt?: Prisma.SortOrder;
    monitoringStoppedAt?: Prisma.SortOrderInput | Prisma.SortOrder;
    settingsId?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
    settings?: Prisma.WatchlistSettingsOrderByWithRelationInput;
    author?: Prisma.AuthorOrderByWithRelationInput;
    sourceComment?: Prisma.CommentOrderByWithRelationInput;
    comments?: Prisma.CommentOrderByRelationAggregateInput;
};
export type WatchlistAuthorWhereUniqueInput = Prisma.AtLeast<{
    id?: number;
    sourceCommentId?: number;
    authorVkId_settingsId?: Prisma.WatchlistAuthorAuthorVkIdSettingsIdCompoundUniqueInput;
    AND?: Prisma.WatchlistAuthorWhereInput | Prisma.WatchlistAuthorWhereInput[];
    OR?: Prisma.WatchlistAuthorWhereInput[];
    NOT?: Prisma.WatchlistAuthorWhereInput | Prisma.WatchlistAuthorWhereInput[];
    authorVkId?: Prisma.IntFilter<"WatchlistAuthor"> | number;
    status?: Prisma.EnumWatchlistStatusFilter<"WatchlistAuthor"> | $Enums.WatchlistStatus;
    lastCheckedAt?: Prisma.DateTimeNullableFilter<"WatchlistAuthor"> | Date | string | null;
    lastActivityAt?: Prisma.DateTimeNullableFilter<"WatchlistAuthor"> | Date | string | null;
    foundCommentsCount?: Prisma.IntFilter<"WatchlistAuthor"> | number;
    monitoringStartedAt?: Prisma.DateTimeFilter<"WatchlistAuthor"> | Date | string;
    monitoringStoppedAt?: Prisma.DateTimeNullableFilter<"WatchlistAuthor"> | Date | string | null;
    settingsId?: Prisma.IntFilter<"WatchlistAuthor"> | number;
    createdAt?: Prisma.DateTimeFilter<"WatchlistAuthor"> | Date | string;
    updatedAt?: Prisma.DateTimeFilter<"WatchlistAuthor"> | Date | string;
    settings?: Prisma.XOR<Prisma.WatchlistSettingsScalarRelationFilter, Prisma.WatchlistSettingsWhereInput>;
    author?: Prisma.XOR<Prisma.AuthorScalarRelationFilter, Prisma.AuthorWhereInput>;
    sourceComment?: Prisma.XOR<Prisma.CommentNullableScalarRelationFilter, Prisma.CommentWhereInput> | null;
    comments?: Prisma.CommentListRelationFilter;
}, "id" | "sourceCommentId" | "authorVkId_settingsId">;
export type WatchlistAuthorOrderByWithAggregationInput = {
    id?: Prisma.SortOrder;
    authorVkId?: Prisma.SortOrder;
    sourceCommentId?: Prisma.SortOrderInput | Prisma.SortOrder;
    status?: Prisma.SortOrder;
    lastCheckedAt?: Prisma.SortOrderInput | Prisma.SortOrder;
    lastActivityAt?: Prisma.SortOrderInput | Prisma.SortOrder;
    foundCommentsCount?: Prisma.SortOrder;
    monitoringStartedAt?: Prisma.SortOrder;
    monitoringStoppedAt?: Prisma.SortOrderInput | Prisma.SortOrder;
    settingsId?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
    _count?: Prisma.WatchlistAuthorCountOrderByAggregateInput;
    _avg?: Prisma.WatchlistAuthorAvgOrderByAggregateInput;
    _max?: Prisma.WatchlistAuthorMaxOrderByAggregateInput;
    _min?: Prisma.WatchlistAuthorMinOrderByAggregateInput;
    _sum?: Prisma.WatchlistAuthorSumOrderByAggregateInput;
};
export type WatchlistAuthorScalarWhereWithAggregatesInput = {
    AND?: Prisma.WatchlistAuthorScalarWhereWithAggregatesInput | Prisma.WatchlistAuthorScalarWhereWithAggregatesInput[];
    OR?: Prisma.WatchlistAuthorScalarWhereWithAggregatesInput[];
    NOT?: Prisma.WatchlistAuthorScalarWhereWithAggregatesInput | Prisma.WatchlistAuthorScalarWhereWithAggregatesInput[];
    id?: Prisma.IntWithAggregatesFilter<"WatchlistAuthor"> | number;
    authorVkId?: Prisma.IntWithAggregatesFilter<"WatchlistAuthor"> | number;
    sourceCommentId?: Prisma.IntNullableWithAggregatesFilter<"WatchlistAuthor"> | number | null;
    status?: Prisma.EnumWatchlistStatusWithAggregatesFilter<"WatchlistAuthor"> | $Enums.WatchlistStatus;
    lastCheckedAt?: Prisma.DateTimeNullableWithAggregatesFilter<"WatchlistAuthor"> | Date | string | null;
    lastActivityAt?: Prisma.DateTimeNullableWithAggregatesFilter<"WatchlistAuthor"> | Date | string | null;
    foundCommentsCount?: Prisma.IntWithAggregatesFilter<"WatchlistAuthor"> | number;
    monitoringStartedAt?: Prisma.DateTimeWithAggregatesFilter<"WatchlistAuthor"> | Date | string;
    monitoringStoppedAt?: Prisma.DateTimeNullableWithAggregatesFilter<"WatchlistAuthor"> | Date | string | null;
    settingsId?: Prisma.IntWithAggregatesFilter<"WatchlistAuthor"> | number;
    createdAt?: Prisma.DateTimeWithAggregatesFilter<"WatchlistAuthor"> | Date | string;
    updatedAt?: Prisma.DateTimeWithAggregatesFilter<"WatchlistAuthor"> | Date | string;
};
export type WatchlistAuthorCreateInput = {
    status?: $Enums.WatchlistStatus;
    lastCheckedAt?: Date | string | null;
    lastActivityAt?: Date | string | null;
    foundCommentsCount?: number;
    monitoringStartedAt?: Date | string;
    monitoringStoppedAt?: Date | string | null;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    settings: Prisma.WatchlistSettingsCreateNestedOneWithoutAuthorsInput;
    author: Prisma.AuthorCreateNestedOneWithoutWatchlistAuthorsInput;
    sourceComment?: Prisma.CommentCreateNestedOneWithoutWatchlistSourceInput;
    comments?: Prisma.CommentCreateNestedManyWithoutWatchlistAuthorInput;
};
export type WatchlistAuthorUncheckedCreateInput = {
    id?: number;
    authorVkId: number;
    sourceCommentId?: number | null;
    status?: $Enums.WatchlistStatus;
    lastCheckedAt?: Date | string | null;
    lastActivityAt?: Date | string | null;
    foundCommentsCount?: number;
    monitoringStartedAt?: Date | string;
    monitoringStoppedAt?: Date | string | null;
    settingsId: number;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    comments?: Prisma.CommentUncheckedCreateNestedManyWithoutWatchlistAuthorInput;
};
export type WatchlistAuthorUpdateInput = {
    status?: Prisma.EnumWatchlistStatusFieldUpdateOperationsInput | $Enums.WatchlistStatus;
    lastCheckedAt?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    lastActivityAt?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    foundCommentsCount?: Prisma.IntFieldUpdateOperationsInput | number;
    monitoringStartedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    monitoringStoppedAt?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    settings?: Prisma.WatchlistSettingsUpdateOneRequiredWithoutAuthorsNestedInput;
    author?: Prisma.AuthorUpdateOneRequiredWithoutWatchlistAuthorsNestedInput;
    sourceComment?: Prisma.CommentUpdateOneWithoutWatchlistSourceNestedInput;
    comments?: Prisma.CommentUpdateManyWithoutWatchlistAuthorNestedInput;
};
export type WatchlistAuthorUncheckedUpdateInput = {
    id?: Prisma.IntFieldUpdateOperationsInput | number;
    authorVkId?: Prisma.IntFieldUpdateOperationsInput | number;
    sourceCommentId?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    status?: Prisma.EnumWatchlistStatusFieldUpdateOperationsInput | $Enums.WatchlistStatus;
    lastCheckedAt?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    lastActivityAt?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    foundCommentsCount?: Prisma.IntFieldUpdateOperationsInput | number;
    monitoringStartedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    monitoringStoppedAt?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    settingsId?: Prisma.IntFieldUpdateOperationsInput | number;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    comments?: Prisma.CommentUncheckedUpdateManyWithoutWatchlistAuthorNestedInput;
};
export type WatchlistAuthorCreateManyInput = {
    id?: number;
    authorVkId: number;
    sourceCommentId?: number | null;
    status?: $Enums.WatchlistStatus;
    lastCheckedAt?: Date | string | null;
    lastActivityAt?: Date | string | null;
    foundCommentsCount?: number;
    monitoringStartedAt?: Date | string;
    monitoringStoppedAt?: Date | string | null;
    settingsId: number;
    createdAt?: Date | string;
    updatedAt?: Date | string;
};
export type WatchlistAuthorUpdateManyMutationInput = {
    status?: Prisma.EnumWatchlistStatusFieldUpdateOperationsInput | $Enums.WatchlistStatus;
    lastCheckedAt?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    lastActivityAt?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    foundCommentsCount?: Prisma.IntFieldUpdateOperationsInput | number;
    monitoringStartedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    monitoringStoppedAt?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type WatchlistAuthorUncheckedUpdateManyInput = {
    id?: Prisma.IntFieldUpdateOperationsInput | number;
    authorVkId?: Prisma.IntFieldUpdateOperationsInput | number;
    sourceCommentId?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    status?: Prisma.EnumWatchlistStatusFieldUpdateOperationsInput | $Enums.WatchlistStatus;
    lastCheckedAt?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    lastActivityAt?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    foundCommentsCount?: Prisma.IntFieldUpdateOperationsInput | number;
    monitoringStartedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    monitoringStoppedAt?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    settingsId?: Prisma.IntFieldUpdateOperationsInput | number;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type WatchlistAuthorNullableScalarRelationFilter = {
    is?: Prisma.WatchlistAuthorWhereInput | null;
    isNot?: Prisma.WatchlistAuthorWhereInput | null;
};
export type WatchlistAuthorListRelationFilter = {
    every?: Prisma.WatchlistAuthorWhereInput;
    some?: Prisma.WatchlistAuthorWhereInput;
    none?: Prisma.WatchlistAuthorWhereInput;
};
export type WatchlistAuthorOrderByRelationAggregateInput = {
    _count?: Prisma.SortOrder;
};
export type WatchlistAuthorAuthorVkIdSettingsIdCompoundUniqueInput = {
    authorVkId: number;
    settingsId: number;
};
export type WatchlistAuthorCountOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    authorVkId?: Prisma.SortOrder;
    sourceCommentId?: Prisma.SortOrder;
    status?: Prisma.SortOrder;
    lastCheckedAt?: Prisma.SortOrder;
    lastActivityAt?: Prisma.SortOrder;
    foundCommentsCount?: Prisma.SortOrder;
    monitoringStartedAt?: Prisma.SortOrder;
    monitoringStoppedAt?: Prisma.SortOrder;
    settingsId?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
};
export type WatchlistAuthorAvgOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    authorVkId?: Prisma.SortOrder;
    sourceCommentId?: Prisma.SortOrder;
    foundCommentsCount?: Prisma.SortOrder;
    settingsId?: Prisma.SortOrder;
};
export type WatchlistAuthorMaxOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    authorVkId?: Prisma.SortOrder;
    sourceCommentId?: Prisma.SortOrder;
    status?: Prisma.SortOrder;
    lastCheckedAt?: Prisma.SortOrder;
    lastActivityAt?: Prisma.SortOrder;
    foundCommentsCount?: Prisma.SortOrder;
    monitoringStartedAt?: Prisma.SortOrder;
    monitoringStoppedAt?: Prisma.SortOrder;
    settingsId?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
};
export type WatchlistAuthorMinOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    authorVkId?: Prisma.SortOrder;
    sourceCommentId?: Prisma.SortOrder;
    status?: Prisma.SortOrder;
    lastCheckedAt?: Prisma.SortOrder;
    lastActivityAt?: Prisma.SortOrder;
    foundCommentsCount?: Prisma.SortOrder;
    monitoringStartedAt?: Prisma.SortOrder;
    monitoringStoppedAt?: Prisma.SortOrder;
    settingsId?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
};
export type WatchlistAuthorSumOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    authorVkId?: Prisma.SortOrder;
    sourceCommentId?: Prisma.SortOrder;
    foundCommentsCount?: Prisma.SortOrder;
    settingsId?: Prisma.SortOrder;
};
export type WatchlistAuthorCreateNestedOneWithoutCommentsInput = {
    create?: Prisma.XOR<Prisma.WatchlistAuthorCreateWithoutCommentsInput, Prisma.WatchlistAuthorUncheckedCreateWithoutCommentsInput>;
    connectOrCreate?: Prisma.WatchlistAuthorCreateOrConnectWithoutCommentsInput;
    connect?: Prisma.WatchlistAuthorWhereUniqueInput;
};
export type WatchlistAuthorCreateNestedOneWithoutSourceCommentInput = {
    create?: Prisma.XOR<Prisma.WatchlistAuthorCreateWithoutSourceCommentInput, Prisma.WatchlistAuthorUncheckedCreateWithoutSourceCommentInput>;
    connectOrCreate?: Prisma.WatchlistAuthorCreateOrConnectWithoutSourceCommentInput;
    connect?: Prisma.WatchlistAuthorWhereUniqueInput;
};
export type WatchlistAuthorUncheckedCreateNestedOneWithoutSourceCommentInput = {
    create?: Prisma.XOR<Prisma.WatchlistAuthorCreateWithoutSourceCommentInput, Prisma.WatchlistAuthorUncheckedCreateWithoutSourceCommentInput>;
    connectOrCreate?: Prisma.WatchlistAuthorCreateOrConnectWithoutSourceCommentInput;
    connect?: Prisma.WatchlistAuthorWhereUniqueInput;
};
export type WatchlistAuthorUpdateOneWithoutCommentsNestedInput = {
    create?: Prisma.XOR<Prisma.WatchlistAuthorCreateWithoutCommentsInput, Prisma.WatchlistAuthorUncheckedCreateWithoutCommentsInput>;
    connectOrCreate?: Prisma.WatchlistAuthorCreateOrConnectWithoutCommentsInput;
    upsert?: Prisma.WatchlistAuthorUpsertWithoutCommentsInput;
    disconnect?: Prisma.WatchlistAuthorWhereInput | boolean;
    delete?: Prisma.WatchlistAuthorWhereInput | boolean;
    connect?: Prisma.WatchlistAuthorWhereUniqueInput;
    update?: Prisma.XOR<Prisma.XOR<Prisma.WatchlistAuthorUpdateToOneWithWhereWithoutCommentsInput, Prisma.WatchlistAuthorUpdateWithoutCommentsInput>, Prisma.WatchlistAuthorUncheckedUpdateWithoutCommentsInput>;
};
export type WatchlistAuthorUpdateOneWithoutSourceCommentNestedInput = {
    create?: Prisma.XOR<Prisma.WatchlistAuthorCreateWithoutSourceCommentInput, Prisma.WatchlistAuthorUncheckedCreateWithoutSourceCommentInput>;
    connectOrCreate?: Prisma.WatchlistAuthorCreateOrConnectWithoutSourceCommentInput;
    upsert?: Prisma.WatchlistAuthorUpsertWithoutSourceCommentInput;
    disconnect?: Prisma.WatchlistAuthorWhereInput | boolean;
    delete?: Prisma.WatchlistAuthorWhereInput | boolean;
    connect?: Prisma.WatchlistAuthorWhereUniqueInput;
    update?: Prisma.XOR<Prisma.XOR<Prisma.WatchlistAuthorUpdateToOneWithWhereWithoutSourceCommentInput, Prisma.WatchlistAuthorUpdateWithoutSourceCommentInput>, Prisma.WatchlistAuthorUncheckedUpdateWithoutSourceCommentInput>;
};
export type WatchlistAuthorUncheckedUpdateOneWithoutSourceCommentNestedInput = {
    create?: Prisma.XOR<Prisma.WatchlistAuthorCreateWithoutSourceCommentInput, Prisma.WatchlistAuthorUncheckedCreateWithoutSourceCommentInput>;
    connectOrCreate?: Prisma.WatchlistAuthorCreateOrConnectWithoutSourceCommentInput;
    upsert?: Prisma.WatchlistAuthorUpsertWithoutSourceCommentInput;
    disconnect?: Prisma.WatchlistAuthorWhereInput | boolean;
    delete?: Prisma.WatchlistAuthorWhereInput | boolean;
    connect?: Prisma.WatchlistAuthorWhereUniqueInput;
    update?: Prisma.XOR<Prisma.XOR<Prisma.WatchlistAuthorUpdateToOneWithWhereWithoutSourceCommentInput, Prisma.WatchlistAuthorUpdateWithoutSourceCommentInput>, Prisma.WatchlistAuthorUncheckedUpdateWithoutSourceCommentInput>;
};
export type WatchlistAuthorCreateNestedManyWithoutAuthorInput = {
    create?: Prisma.XOR<Prisma.WatchlistAuthorCreateWithoutAuthorInput, Prisma.WatchlistAuthorUncheckedCreateWithoutAuthorInput> | Prisma.WatchlistAuthorCreateWithoutAuthorInput[] | Prisma.WatchlistAuthorUncheckedCreateWithoutAuthorInput[];
    connectOrCreate?: Prisma.WatchlistAuthorCreateOrConnectWithoutAuthorInput | Prisma.WatchlistAuthorCreateOrConnectWithoutAuthorInput[];
    createMany?: Prisma.WatchlistAuthorCreateManyAuthorInputEnvelope;
    connect?: Prisma.WatchlistAuthorWhereUniqueInput | Prisma.WatchlistAuthorWhereUniqueInput[];
};
export type WatchlistAuthorUncheckedCreateNestedManyWithoutAuthorInput = {
    create?: Prisma.XOR<Prisma.WatchlistAuthorCreateWithoutAuthorInput, Prisma.WatchlistAuthorUncheckedCreateWithoutAuthorInput> | Prisma.WatchlistAuthorCreateWithoutAuthorInput[] | Prisma.WatchlistAuthorUncheckedCreateWithoutAuthorInput[];
    connectOrCreate?: Prisma.WatchlistAuthorCreateOrConnectWithoutAuthorInput | Prisma.WatchlistAuthorCreateOrConnectWithoutAuthorInput[];
    createMany?: Prisma.WatchlistAuthorCreateManyAuthorInputEnvelope;
    connect?: Prisma.WatchlistAuthorWhereUniqueInput | Prisma.WatchlistAuthorWhereUniqueInput[];
};
export type WatchlistAuthorUpdateManyWithoutAuthorNestedInput = {
    create?: Prisma.XOR<Prisma.WatchlistAuthorCreateWithoutAuthorInput, Prisma.WatchlistAuthorUncheckedCreateWithoutAuthorInput> | Prisma.WatchlistAuthorCreateWithoutAuthorInput[] | Prisma.WatchlistAuthorUncheckedCreateWithoutAuthorInput[];
    connectOrCreate?: Prisma.WatchlistAuthorCreateOrConnectWithoutAuthorInput | Prisma.WatchlistAuthorCreateOrConnectWithoutAuthorInput[];
    upsert?: Prisma.WatchlistAuthorUpsertWithWhereUniqueWithoutAuthorInput | Prisma.WatchlistAuthorUpsertWithWhereUniqueWithoutAuthorInput[];
    createMany?: Prisma.WatchlistAuthorCreateManyAuthorInputEnvelope;
    set?: Prisma.WatchlistAuthorWhereUniqueInput | Prisma.WatchlistAuthorWhereUniqueInput[];
    disconnect?: Prisma.WatchlistAuthorWhereUniqueInput | Prisma.WatchlistAuthorWhereUniqueInput[];
    delete?: Prisma.WatchlistAuthorWhereUniqueInput | Prisma.WatchlistAuthorWhereUniqueInput[];
    connect?: Prisma.WatchlistAuthorWhereUniqueInput | Prisma.WatchlistAuthorWhereUniqueInput[];
    update?: Prisma.WatchlistAuthorUpdateWithWhereUniqueWithoutAuthorInput | Prisma.WatchlistAuthorUpdateWithWhereUniqueWithoutAuthorInput[];
    updateMany?: Prisma.WatchlistAuthorUpdateManyWithWhereWithoutAuthorInput | Prisma.WatchlistAuthorUpdateManyWithWhereWithoutAuthorInput[];
    deleteMany?: Prisma.WatchlistAuthorScalarWhereInput | Prisma.WatchlistAuthorScalarWhereInput[];
};
export type WatchlistAuthorUncheckedUpdateManyWithoutAuthorNestedInput = {
    create?: Prisma.XOR<Prisma.WatchlistAuthorCreateWithoutAuthorInput, Prisma.WatchlistAuthorUncheckedCreateWithoutAuthorInput> | Prisma.WatchlistAuthorCreateWithoutAuthorInput[] | Prisma.WatchlistAuthorUncheckedCreateWithoutAuthorInput[];
    connectOrCreate?: Prisma.WatchlistAuthorCreateOrConnectWithoutAuthorInput | Prisma.WatchlistAuthorCreateOrConnectWithoutAuthorInput[];
    upsert?: Prisma.WatchlistAuthorUpsertWithWhereUniqueWithoutAuthorInput | Prisma.WatchlistAuthorUpsertWithWhereUniqueWithoutAuthorInput[];
    createMany?: Prisma.WatchlistAuthorCreateManyAuthorInputEnvelope;
    set?: Prisma.WatchlistAuthorWhereUniqueInput | Prisma.WatchlistAuthorWhereUniqueInput[];
    disconnect?: Prisma.WatchlistAuthorWhereUniqueInput | Prisma.WatchlistAuthorWhereUniqueInput[];
    delete?: Prisma.WatchlistAuthorWhereUniqueInput | Prisma.WatchlistAuthorWhereUniqueInput[];
    connect?: Prisma.WatchlistAuthorWhereUniqueInput | Prisma.WatchlistAuthorWhereUniqueInput[];
    update?: Prisma.WatchlistAuthorUpdateWithWhereUniqueWithoutAuthorInput | Prisma.WatchlistAuthorUpdateWithWhereUniqueWithoutAuthorInput[];
    updateMany?: Prisma.WatchlistAuthorUpdateManyWithWhereWithoutAuthorInput | Prisma.WatchlistAuthorUpdateManyWithWhereWithoutAuthorInput[];
    deleteMany?: Prisma.WatchlistAuthorScalarWhereInput | Prisma.WatchlistAuthorScalarWhereInput[];
};
export type WatchlistAuthorCreateNestedManyWithoutSettingsInput = {
    create?: Prisma.XOR<Prisma.WatchlistAuthorCreateWithoutSettingsInput, Prisma.WatchlistAuthorUncheckedCreateWithoutSettingsInput> | Prisma.WatchlistAuthorCreateWithoutSettingsInput[] | Prisma.WatchlistAuthorUncheckedCreateWithoutSettingsInput[];
    connectOrCreate?: Prisma.WatchlistAuthorCreateOrConnectWithoutSettingsInput | Prisma.WatchlistAuthorCreateOrConnectWithoutSettingsInput[];
    createMany?: Prisma.WatchlistAuthorCreateManySettingsInputEnvelope;
    connect?: Prisma.WatchlistAuthorWhereUniqueInput | Prisma.WatchlistAuthorWhereUniqueInput[];
};
export type WatchlistAuthorUncheckedCreateNestedManyWithoutSettingsInput = {
    create?: Prisma.XOR<Prisma.WatchlistAuthorCreateWithoutSettingsInput, Prisma.WatchlistAuthorUncheckedCreateWithoutSettingsInput> | Prisma.WatchlistAuthorCreateWithoutSettingsInput[] | Prisma.WatchlistAuthorUncheckedCreateWithoutSettingsInput[];
    connectOrCreate?: Prisma.WatchlistAuthorCreateOrConnectWithoutSettingsInput | Prisma.WatchlistAuthorCreateOrConnectWithoutSettingsInput[];
    createMany?: Prisma.WatchlistAuthorCreateManySettingsInputEnvelope;
    connect?: Prisma.WatchlistAuthorWhereUniqueInput | Prisma.WatchlistAuthorWhereUniqueInput[];
};
export type WatchlistAuthorUpdateManyWithoutSettingsNestedInput = {
    create?: Prisma.XOR<Prisma.WatchlistAuthorCreateWithoutSettingsInput, Prisma.WatchlistAuthorUncheckedCreateWithoutSettingsInput> | Prisma.WatchlistAuthorCreateWithoutSettingsInput[] | Prisma.WatchlistAuthorUncheckedCreateWithoutSettingsInput[];
    connectOrCreate?: Prisma.WatchlistAuthorCreateOrConnectWithoutSettingsInput | Prisma.WatchlistAuthorCreateOrConnectWithoutSettingsInput[];
    upsert?: Prisma.WatchlistAuthorUpsertWithWhereUniqueWithoutSettingsInput | Prisma.WatchlistAuthorUpsertWithWhereUniqueWithoutSettingsInput[];
    createMany?: Prisma.WatchlistAuthorCreateManySettingsInputEnvelope;
    set?: Prisma.WatchlistAuthorWhereUniqueInput | Prisma.WatchlistAuthorWhereUniqueInput[];
    disconnect?: Prisma.WatchlistAuthorWhereUniqueInput | Prisma.WatchlistAuthorWhereUniqueInput[];
    delete?: Prisma.WatchlistAuthorWhereUniqueInput | Prisma.WatchlistAuthorWhereUniqueInput[];
    connect?: Prisma.WatchlistAuthorWhereUniqueInput | Prisma.WatchlistAuthorWhereUniqueInput[];
    update?: Prisma.WatchlistAuthorUpdateWithWhereUniqueWithoutSettingsInput | Prisma.WatchlistAuthorUpdateWithWhereUniqueWithoutSettingsInput[];
    updateMany?: Prisma.WatchlistAuthorUpdateManyWithWhereWithoutSettingsInput | Prisma.WatchlistAuthorUpdateManyWithWhereWithoutSettingsInput[];
    deleteMany?: Prisma.WatchlistAuthorScalarWhereInput | Prisma.WatchlistAuthorScalarWhereInput[];
};
export type WatchlistAuthorUncheckedUpdateManyWithoutSettingsNestedInput = {
    create?: Prisma.XOR<Prisma.WatchlistAuthorCreateWithoutSettingsInput, Prisma.WatchlistAuthorUncheckedCreateWithoutSettingsInput> | Prisma.WatchlistAuthorCreateWithoutSettingsInput[] | Prisma.WatchlistAuthorUncheckedCreateWithoutSettingsInput[];
    connectOrCreate?: Prisma.WatchlistAuthorCreateOrConnectWithoutSettingsInput | Prisma.WatchlistAuthorCreateOrConnectWithoutSettingsInput[];
    upsert?: Prisma.WatchlistAuthorUpsertWithWhereUniqueWithoutSettingsInput | Prisma.WatchlistAuthorUpsertWithWhereUniqueWithoutSettingsInput[];
    createMany?: Prisma.WatchlistAuthorCreateManySettingsInputEnvelope;
    set?: Prisma.WatchlistAuthorWhereUniqueInput | Prisma.WatchlistAuthorWhereUniqueInput[];
    disconnect?: Prisma.WatchlistAuthorWhereUniqueInput | Prisma.WatchlistAuthorWhereUniqueInput[];
    delete?: Prisma.WatchlistAuthorWhereUniqueInput | Prisma.WatchlistAuthorWhereUniqueInput[];
    connect?: Prisma.WatchlistAuthorWhereUniqueInput | Prisma.WatchlistAuthorWhereUniqueInput[];
    update?: Prisma.WatchlistAuthorUpdateWithWhereUniqueWithoutSettingsInput | Prisma.WatchlistAuthorUpdateWithWhereUniqueWithoutSettingsInput[];
    updateMany?: Prisma.WatchlistAuthorUpdateManyWithWhereWithoutSettingsInput | Prisma.WatchlistAuthorUpdateManyWithWhereWithoutSettingsInput[];
    deleteMany?: Prisma.WatchlistAuthorScalarWhereInput | Prisma.WatchlistAuthorScalarWhereInput[];
};
export type EnumWatchlistStatusFieldUpdateOperationsInput = {
    set?: $Enums.WatchlistStatus;
};
export type WatchlistAuthorCreateWithoutCommentsInput = {
    status?: $Enums.WatchlistStatus;
    lastCheckedAt?: Date | string | null;
    lastActivityAt?: Date | string | null;
    foundCommentsCount?: number;
    monitoringStartedAt?: Date | string;
    monitoringStoppedAt?: Date | string | null;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    settings: Prisma.WatchlistSettingsCreateNestedOneWithoutAuthorsInput;
    author: Prisma.AuthorCreateNestedOneWithoutWatchlistAuthorsInput;
    sourceComment?: Prisma.CommentCreateNestedOneWithoutWatchlistSourceInput;
};
export type WatchlistAuthorUncheckedCreateWithoutCommentsInput = {
    id?: number;
    authorVkId: number;
    sourceCommentId?: number | null;
    status?: $Enums.WatchlistStatus;
    lastCheckedAt?: Date | string | null;
    lastActivityAt?: Date | string | null;
    foundCommentsCount?: number;
    monitoringStartedAt?: Date | string;
    monitoringStoppedAt?: Date | string | null;
    settingsId: number;
    createdAt?: Date | string;
    updatedAt?: Date | string;
};
export type WatchlistAuthorCreateOrConnectWithoutCommentsInput = {
    where: Prisma.WatchlistAuthorWhereUniqueInput;
    create: Prisma.XOR<Prisma.WatchlistAuthorCreateWithoutCommentsInput, Prisma.WatchlistAuthorUncheckedCreateWithoutCommentsInput>;
};
export type WatchlistAuthorCreateWithoutSourceCommentInput = {
    status?: $Enums.WatchlistStatus;
    lastCheckedAt?: Date | string | null;
    lastActivityAt?: Date | string | null;
    foundCommentsCount?: number;
    monitoringStartedAt?: Date | string;
    monitoringStoppedAt?: Date | string | null;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    settings: Prisma.WatchlistSettingsCreateNestedOneWithoutAuthorsInput;
    author: Prisma.AuthorCreateNestedOneWithoutWatchlistAuthorsInput;
    comments?: Prisma.CommentCreateNestedManyWithoutWatchlistAuthorInput;
};
export type WatchlistAuthorUncheckedCreateWithoutSourceCommentInput = {
    id?: number;
    authorVkId: number;
    status?: $Enums.WatchlistStatus;
    lastCheckedAt?: Date | string | null;
    lastActivityAt?: Date | string | null;
    foundCommentsCount?: number;
    monitoringStartedAt?: Date | string;
    monitoringStoppedAt?: Date | string | null;
    settingsId: number;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    comments?: Prisma.CommentUncheckedCreateNestedManyWithoutWatchlistAuthorInput;
};
export type WatchlistAuthorCreateOrConnectWithoutSourceCommentInput = {
    where: Prisma.WatchlistAuthorWhereUniqueInput;
    create: Prisma.XOR<Prisma.WatchlistAuthorCreateWithoutSourceCommentInput, Prisma.WatchlistAuthorUncheckedCreateWithoutSourceCommentInput>;
};
export type WatchlistAuthorUpsertWithoutCommentsInput = {
    update: Prisma.XOR<Prisma.WatchlistAuthorUpdateWithoutCommentsInput, Prisma.WatchlistAuthorUncheckedUpdateWithoutCommentsInput>;
    create: Prisma.XOR<Prisma.WatchlistAuthorCreateWithoutCommentsInput, Prisma.WatchlistAuthorUncheckedCreateWithoutCommentsInput>;
    where?: Prisma.WatchlistAuthorWhereInput;
};
export type WatchlistAuthorUpdateToOneWithWhereWithoutCommentsInput = {
    where?: Prisma.WatchlistAuthorWhereInput;
    data: Prisma.XOR<Prisma.WatchlistAuthorUpdateWithoutCommentsInput, Prisma.WatchlistAuthorUncheckedUpdateWithoutCommentsInput>;
};
export type WatchlistAuthorUpdateWithoutCommentsInput = {
    status?: Prisma.EnumWatchlistStatusFieldUpdateOperationsInput | $Enums.WatchlistStatus;
    lastCheckedAt?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    lastActivityAt?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    foundCommentsCount?: Prisma.IntFieldUpdateOperationsInput | number;
    monitoringStartedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    monitoringStoppedAt?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    settings?: Prisma.WatchlistSettingsUpdateOneRequiredWithoutAuthorsNestedInput;
    author?: Prisma.AuthorUpdateOneRequiredWithoutWatchlistAuthorsNestedInput;
    sourceComment?: Prisma.CommentUpdateOneWithoutWatchlistSourceNestedInput;
};
export type WatchlistAuthorUncheckedUpdateWithoutCommentsInput = {
    id?: Prisma.IntFieldUpdateOperationsInput | number;
    authorVkId?: Prisma.IntFieldUpdateOperationsInput | number;
    sourceCommentId?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    status?: Prisma.EnumWatchlistStatusFieldUpdateOperationsInput | $Enums.WatchlistStatus;
    lastCheckedAt?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    lastActivityAt?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    foundCommentsCount?: Prisma.IntFieldUpdateOperationsInput | number;
    monitoringStartedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    monitoringStoppedAt?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    settingsId?: Prisma.IntFieldUpdateOperationsInput | number;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type WatchlistAuthorUpsertWithoutSourceCommentInput = {
    update: Prisma.XOR<Prisma.WatchlistAuthorUpdateWithoutSourceCommentInput, Prisma.WatchlistAuthorUncheckedUpdateWithoutSourceCommentInput>;
    create: Prisma.XOR<Prisma.WatchlistAuthorCreateWithoutSourceCommentInput, Prisma.WatchlistAuthorUncheckedCreateWithoutSourceCommentInput>;
    where?: Prisma.WatchlistAuthorWhereInput;
};
export type WatchlistAuthorUpdateToOneWithWhereWithoutSourceCommentInput = {
    where?: Prisma.WatchlistAuthorWhereInput;
    data: Prisma.XOR<Prisma.WatchlistAuthorUpdateWithoutSourceCommentInput, Prisma.WatchlistAuthorUncheckedUpdateWithoutSourceCommentInput>;
};
export type WatchlistAuthorUpdateWithoutSourceCommentInput = {
    status?: Prisma.EnumWatchlistStatusFieldUpdateOperationsInput | $Enums.WatchlistStatus;
    lastCheckedAt?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    lastActivityAt?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    foundCommentsCount?: Prisma.IntFieldUpdateOperationsInput | number;
    monitoringStartedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    monitoringStoppedAt?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    settings?: Prisma.WatchlistSettingsUpdateOneRequiredWithoutAuthorsNestedInput;
    author?: Prisma.AuthorUpdateOneRequiredWithoutWatchlistAuthorsNestedInput;
    comments?: Prisma.CommentUpdateManyWithoutWatchlistAuthorNestedInput;
};
export type WatchlistAuthorUncheckedUpdateWithoutSourceCommentInput = {
    id?: Prisma.IntFieldUpdateOperationsInput | number;
    authorVkId?: Prisma.IntFieldUpdateOperationsInput | number;
    status?: Prisma.EnumWatchlistStatusFieldUpdateOperationsInput | $Enums.WatchlistStatus;
    lastCheckedAt?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    lastActivityAt?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    foundCommentsCount?: Prisma.IntFieldUpdateOperationsInput | number;
    monitoringStartedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    monitoringStoppedAt?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    settingsId?: Prisma.IntFieldUpdateOperationsInput | number;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    comments?: Prisma.CommentUncheckedUpdateManyWithoutWatchlistAuthorNestedInput;
};
export type WatchlistAuthorCreateWithoutAuthorInput = {
    status?: $Enums.WatchlistStatus;
    lastCheckedAt?: Date | string | null;
    lastActivityAt?: Date | string | null;
    foundCommentsCount?: number;
    monitoringStartedAt?: Date | string;
    monitoringStoppedAt?: Date | string | null;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    settings: Prisma.WatchlistSettingsCreateNestedOneWithoutAuthorsInput;
    sourceComment?: Prisma.CommentCreateNestedOneWithoutWatchlistSourceInput;
    comments?: Prisma.CommentCreateNestedManyWithoutWatchlistAuthorInput;
};
export type WatchlistAuthorUncheckedCreateWithoutAuthorInput = {
    id?: number;
    sourceCommentId?: number | null;
    status?: $Enums.WatchlistStatus;
    lastCheckedAt?: Date | string | null;
    lastActivityAt?: Date | string | null;
    foundCommentsCount?: number;
    monitoringStartedAt?: Date | string;
    monitoringStoppedAt?: Date | string | null;
    settingsId: number;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    comments?: Prisma.CommentUncheckedCreateNestedManyWithoutWatchlistAuthorInput;
};
export type WatchlistAuthorCreateOrConnectWithoutAuthorInput = {
    where: Prisma.WatchlistAuthorWhereUniqueInput;
    create: Prisma.XOR<Prisma.WatchlistAuthorCreateWithoutAuthorInput, Prisma.WatchlistAuthorUncheckedCreateWithoutAuthorInput>;
};
export type WatchlistAuthorCreateManyAuthorInputEnvelope = {
    data: Prisma.WatchlistAuthorCreateManyAuthorInput | Prisma.WatchlistAuthorCreateManyAuthorInput[];
    skipDuplicates?: boolean;
};
export type WatchlistAuthorUpsertWithWhereUniqueWithoutAuthorInput = {
    where: Prisma.WatchlistAuthorWhereUniqueInput;
    update: Prisma.XOR<Prisma.WatchlistAuthorUpdateWithoutAuthorInput, Prisma.WatchlistAuthorUncheckedUpdateWithoutAuthorInput>;
    create: Prisma.XOR<Prisma.WatchlistAuthorCreateWithoutAuthorInput, Prisma.WatchlistAuthorUncheckedCreateWithoutAuthorInput>;
};
export type WatchlistAuthorUpdateWithWhereUniqueWithoutAuthorInput = {
    where: Prisma.WatchlistAuthorWhereUniqueInput;
    data: Prisma.XOR<Prisma.WatchlistAuthorUpdateWithoutAuthorInput, Prisma.WatchlistAuthorUncheckedUpdateWithoutAuthorInput>;
};
export type WatchlistAuthorUpdateManyWithWhereWithoutAuthorInput = {
    where: Prisma.WatchlistAuthorScalarWhereInput;
    data: Prisma.XOR<Prisma.WatchlistAuthorUpdateManyMutationInput, Prisma.WatchlistAuthorUncheckedUpdateManyWithoutAuthorInput>;
};
export type WatchlistAuthorScalarWhereInput = {
    AND?: Prisma.WatchlistAuthorScalarWhereInput | Prisma.WatchlistAuthorScalarWhereInput[];
    OR?: Prisma.WatchlistAuthorScalarWhereInput[];
    NOT?: Prisma.WatchlistAuthorScalarWhereInput | Prisma.WatchlistAuthorScalarWhereInput[];
    id?: Prisma.IntFilter<"WatchlistAuthor"> | number;
    authorVkId?: Prisma.IntFilter<"WatchlistAuthor"> | number;
    sourceCommentId?: Prisma.IntNullableFilter<"WatchlistAuthor"> | number | null;
    status?: Prisma.EnumWatchlistStatusFilter<"WatchlistAuthor"> | $Enums.WatchlistStatus;
    lastCheckedAt?: Prisma.DateTimeNullableFilter<"WatchlistAuthor"> | Date | string | null;
    lastActivityAt?: Prisma.DateTimeNullableFilter<"WatchlistAuthor"> | Date | string | null;
    foundCommentsCount?: Prisma.IntFilter<"WatchlistAuthor"> | number;
    monitoringStartedAt?: Prisma.DateTimeFilter<"WatchlistAuthor"> | Date | string;
    monitoringStoppedAt?: Prisma.DateTimeNullableFilter<"WatchlistAuthor"> | Date | string | null;
    settingsId?: Prisma.IntFilter<"WatchlistAuthor"> | number;
    createdAt?: Prisma.DateTimeFilter<"WatchlistAuthor"> | Date | string;
    updatedAt?: Prisma.DateTimeFilter<"WatchlistAuthor"> | Date | string;
};
export type WatchlistAuthorCreateWithoutSettingsInput = {
    status?: $Enums.WatchlistStatus;
    lastCheckedAt?: Date | string | null;
    lastActivityAt?: Date | string | null;
    foundCommentsCount?: number;
    monitoringStartedAt?: Date | string;
    monitoringStoppedAt?: Date | string | null;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    author: Prisma.AuthorCreateNestedOneWithoutWatchlistAuthorsInput;
    sourceComment?: Prisma.CommentCreateNestedOneWithoutWatchlistSourceInput;
    comments?: Prisma.CommentCreateNestedManyWithoutWatchlistAuthorInput;
};
export type WatchlistAuthorUncheckedCreateWithoutSettingsInput = {
    id?: number;
    authorVkId: number;
    sourceCommentId?: number | null;
    status?: $Enums.WatchlistStatus;
    lastCheckedAt?: Date | string | null;
    lastActivityAt?: Date | string | null;
    foundCommentsCount?: number;
    monitoringStartedAt?: Date | string;
    monitoringStoppedAt?: Date | string | null;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    comments?: Prisma.CommentUncheckedCreateNestedManyWithoutWatchlistAuthorInput;
};
export type WatchlistAuthorCreateOrConnectWithoutSettingsInput = {
    where: Prisma.WatchlistAuthorWhereUniqueInput;
    create: Prisma.XOR<Prisma.WatchlistAuthorCreateWithoutSettingsInput, Prisma.WatchlistAuthorUncheckedCreateWithoutSettingsInput>;
};
export type WatchlistAuthorCreateManySettingsInputEnvelope = {
    data: Prisma.WatchlistAuthorCreateManySettingsInput | Prisma.WatchlistAuthorCreateManySettingsInput[];
    skipDuplicates?: boolean;
};
export type WatchlistAuthorUpsertWithWhereUniqueWithoutSettingsInput = {
    where: Prisma.WatchlistAuthorWhereUniqueInput;
    update: Prisma.XOR<Prisma.WatchlistAuthorUpdateWithoutSettingsInput, Prisma.WatchlistAuthorUncheckedUpdateWithoutSettingsInput>;
    create: Prisma.XOR<Prisma.WatchlistAuthorCreateWithoutSettingsInput, Prisma.WatchlistAuthorUncheckedCreateWithoutSettingsInput>;
};
export type WatchlistAuthorUpdateWithWhereUniqueWithoutSettingsInput = {
    where: Prisma.WatchlistAuthorWhereUniqueInput;
    data: Prisma.XOR<Prisma.WatchlistAuthorUpdateWithoutSettingsInput, Prisma.WatchlistAuthorUncheckedUpdateWithoutSettingsInput>;
};
export type WatchlistAuthorUpdateManyWithWhereWithoutSettingsInput = {
    where: Prisma.WatchlistAuthorScalarWhereInput;
    data: Prisma.XOR<Prisma.WatchlistAuthorUpdateManyMutationInput, Prisma.WatchlistAuthorUncheckedUpdateManyWithoutSettingsInput>;
};
export type WatchlistAuthorCreateManyAuthorInput = {
    id?: number;
    sourceCommentId?: number | null;
    status?: $Enums.WatchlistStatus;
    lastCheckedAt?: Date | string | null;
    lastActivityAt?: Date | string | null;
    foundCommentsCount?: number;
    monitoringStartedAt?: Date | string;
    monitoringStoppedAt?: Date | string | null;
    settingsId: number;
    createdAt?: Date | string;
    updatedAt?: Date | string;
};
export type WatchlistAuthorUpdateWithoutAuthorInput = {
    status?: Prisma.EnumWatchlistStatusFieldUpdateOperationsInput | $Enums.WatchlistStatus;
    lastCheckedAt?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    lastActivityAt?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    foundCommentsCount?: Prisma.IntFieldUpdateOperationsInput | number;
    monitoringStartedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    monitoringStoppedAt?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    settings?: Prisma.WatchlistSettingsUpdateOneRequiredWithoutAuthorsNestedInput;
    sourceComment?: Prisma.CommentUpdateOneWithoutWatchlistSourceNestedInput;
    comments?: Prisma.CommentUpdateManyWithoutWatchlistAuthorNestedInput;
};
export type WatchlistAuthorUncheckedUpdateWithoutAuthorInput = {
    id?: Prisma.IntFieldUpdateOperationsInput | number;
    sourceCommentId?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    status?: Prisma.EnumWatchlistStatusFieldUpdateOperationsInput | $Enums.WatchlistStatus;
    lastCheckedAt?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    lastActivityAt?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    foundCommentsCount?: Prisma.IntFieldUpdateOperationsInput | number;
    monitoringStartedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    monitoringStoppedAt?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    settingsId?: Prisma.IntFieldUpdateOperationsInput | number;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    comments?: Prisma.CommentUncheckedUpdateManyWithoutWatchlistAuthorNestedInput;
};
export type WatchlistAuthorUncheckedUpdateManyWithoutAuthorInput = {
    id?: Prisma.IntFieldUpdateOperationsInput | number;
    sourceCommentId?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    status?: Prisma.EnumWatchlistStatusFieldUpdateOperationsInput | $Enums.WatchlistStatus;
    lastCheckedAt?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    lastActivityAt?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    foundCommentsCount?: Prisma.IntFieldUpdateOperationsInput | number;
    monitoringStartedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    monitoringStoppedAt?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    settingsId?: Prisma.IntFieldUpdateOperationsInput | number;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type WatchlistAuthorCreateManySettingsInput = {
    id?: number;
    authorVkId: number;
    sourceCommentId?: number | null;
    status?: $Enums.WatchlistStatus;
    lastCheckedAt?: Date | string | null;
    lastActivityAt?: Date | string | null;
    foundCommentsCount?: number;
    monitoringStartedAt?: Date | string;
    monitoringStoppedAt?: Date | string | null;
    createdAt?: Date | string;
    updatedAt?: Date | string;
};
export type WatchlistAuthorUpdateWithoutSettingsInput = {
    status?: Prisma.EnumWatchlistStatusFieldUpdateOperationsInput | $Enums.WatchlistStatus;
    lastCheckedAt?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    lastActivityAt?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    foundCommentsCount?: Prisma.IntFieldUpdateOperationsInput | number;
    monitoringStartedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    monitoringStoppedAt?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    author?: Prisma.AuthorUpdateOneRequiredWithoutWatchlistAuthorsNestedInput;
    sourceComment?: Prisma.CommentUpdateOneWithoutWatchlistSourceNestedInput;
    comments?: Prisma.CommentUpdateManyWithoutWatchlistAuthorNestedInput;
};
export type WatchlistAuthorUncheckedUpdateWithoutSettingsInput = {
    id?: Prisma.IntFieldUpdateOperationsInput | number;
    authorVkId?: Prisma.IntFieldUpdateOperationsInput | number;
    sourceCommentId?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    status?: Prisma.EnumWatchlistStatusFieldUpdateOperationsInput | $Enums.WatchlistStatus;
    lastCheckedAt?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    lastActivityAt?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    foundCommentsCount?: Prisma.IntFieldUpdateOperationsInput | number;
    monitoringStartedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    monitoringStoppedAt?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    comments?: Prisma.CommentUncheckedUpdateManyWithoutWatchlistAuthorNestedInput;
};
export type WatchlistAuthorUncheckedUpdateManyWithoutSettingsInput = {
    id?: Prisma.IntFieldUpdateOperationsInput | number;
    authorVkId?: Prisma.IntFieldUpdateOperationsInput | number;
    sourceCommentId?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    status?: Prisma.EnumWatchlistStatusFieldUpdateOperationsInput | $Enums.WatchlistStatus;
    lastCheckedAt?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    lastActivityAt?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    foundCommentsCount?: Prisma.IntFieldUpdateOperationsInput | number;
    monitoringStartedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    monitoringStoppedAt?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type WatchlistAuthorCountOutputType = {
    comments: number;
};
export type WatchlistAuthorCountOutputTypeSelect<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    comments?: boolean | WatchlistAuthorCountOutputTypeCountCommentsArgs;
};
export type WatchlistAuthorCountOutputTypeDefaultArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.WatchlistAuthorCountOutputTypeSelect<ExtArgs> | null;
};
export type WatchlistAuthorCountOutputTypeCountCommentsArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.CommentWhereInput;
};
export type WatchlistAuthorSelect<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    authorVkId?: boolean;
    sourceCommentId?: boolean;
    status?: boolean;
    lastCheckedAt?: boolean;
    lastActivityAt?: boolean;
    foundCommentsCount?: boolean;
    monitoringStartedAt?: boolean;
    monitoringStoppedAt?: boolean;
    settingsId?: boolean;
    createdAt?: boolean;
    updatedAt?: boolean;
    settings?: boolean | Prisma.WatchlistSettingsDefaultArgs<ExtArgs>;
    author?: boolean | Prisma.AuthorDefaultArgs<ExtArgs>;
    sourceComment?: boolean | Prisma.WatchlistAuthor$sourceCommentArgs<ExtArgs>;
    comments?: boolean | Prisma.WatchlistAuthor$commentsArgs<ExtArgs>;
    _count?: boolean | Prisma.WatchlistAuthorCountOutputTypeDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["watchlistAuthor"]>;
export type WatchlistAuthorSelectCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    authorVkId?: boolean;
    sourceCommentId?: boolean;
    status?: boolean;
    lastCheckedAt?: boolean;
    lastActivityAt?: boolean;
    foundCommentsCount?: boolean;
    monitoringStartedAt?: boolean;
    monitoringStoppedAt?: boolean;
    settingsId?: boolean;
    createdAt?: boolean;
    updatedAt?: boolean;
    settings?: boolean | Prisma.WatchlistSettingsDefaultArgs<ExtArgs>;
    author?: boolean | Prisma.AuthorDefaultArgs<ExtArgs>;
    sourceComment?: boolean | Prisma.WatchlistAuthor$sourceCommentArgs<ExtArgs>;
}, ExtArgs["result"]["watchlistAuthor"]>;
export type WatchlistAuthorSelectUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    authorVkId?: boolean;
    sourceCommentId?: boolean;
    status?: boolean;
    lastCheckedAt?: boolean;
    lastActivityAt?: boolean;
    foundCommentsCount?: boolean;
    monitoringStartedAt?: boolean;
    monitoringStoppedAt?: boolean;
    settingsId?: boolean;
    createdAt?: boolean;
    updatedAt?: boolean;
    settings?: boolean | Prisma.WatchlistSettingsDefaultArgs<ExtArgs>;
    author?: boolean | Prisma.AuthorDefaultArgs<ExtArgs>;
    sourceComment?: boolean | Prisma.WatchlistAuthor$sourceCommentArgs<ExtArgs>;
}, ExtArgs["result"]["watchlistAuthor"]>;
export type WatchlistAuthorSelectScalar = {
    id?: boolean;
    authorVkId?: boolean;
    sourceCommentId?: boolean;
    status?: boolean;
    lastCheckedAt?: boolean;
    lastActivityAt?: boolean;
    foundCommentsCount?: boolean;
    monitoringStartedAt?: boolean;
    monitoringStoppedAt?: boolean;
    settingsId?: boolean;
    createdAt?: boolean;
    updatedAt?: boolean;
};
export type WatchlistAuthorOmit<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetOmit<"id" | "authorVkId" | "sourceCommentId" | "status" | "lastCheckedAt" | "lastActivityAt" | "foundCommentsCount" | "monitoringStartedAt" | "monitoringStoppedAt" | "settingsId" | "createdAt" | "updatedAt", ExtArgs["result"]["watchlistAuthor"]>;
export type WatchlistAuthorInclude<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    settings?: boolean | Prisma.WatchlistSettingsDefaultArgs<ExtArgs>;
    author?: boolean | Prisma.AuthorDefaultArgs<ExtArgs>;
    sourceComment?: boolean | Prisma.WatchlistAuthor$sourceCommentArgs<ExtArgs>;
    comments?: boolean | Prisma.WatchlistAuthor$commentsArgs<ExtArgs>;
    _count?: boolean | Prisma.WatchlistAuthorCountOutputTypeDefaultArgs<ExtArgs>;
};
export type WatchlistAuthorIncludeCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    settings?: boolean | Prisma.WatchlistSettingsDefaultArgs<ExtArgs>;
    author?: boolean | Prisma.AuthorDefaultArgs<ExtArgs>;
    sourceComment?: boolean | Prisma.WatchlistAuthor$sourceCommentArgs<ExtArgs>;
};
export type WatchlistAuthorIncludeUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    settings?: boolean | Prisma.WatchlistSettingsDefaultArgs<ExtArgs>;
    author?: boolean | Prisma.AuthorDefaultArgs<ExtArgs>;
    sourceComment?: boolean | Prisma.WatchlistAuthor$sourceCommentArgs<ExtArgs>;
};
export type $WatchlistAuthorPayload<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    name: "WatchlistAuthor";
    objects: {
        settings: Prisma.$WatchlistSettingsPayload<ExtArgs>;
        author: Prisma.$AuthorPayload<ExtArgs>;
        sourceComment: Prisma.$CommentPayload<ExtArgs> | null;
        comments: Prisma.$CommentPayload<ExtArgs>[];
    };
    scalars: runtime.Types.Extensions.GetPayloadResult<{
        id: number;
        authorVkId: number;
        sourceCommentId: number | null;
        status: $Enums.WatchlistStatus;
        lastCheckedAt: Date | null;
        lastActivityAt: Date | null;
        foundCommentsCount: number;
        monitoringStartedAt: Date;
        monitoringStoppedAt: Date | null;
        settingsId: number;
        createdAt: Date;
        updatedAt: Date;
    }, ExtArgs["result"]["watchlistAuthor"]>;
    composites: {};
};
export type WatchlistAuthorGetPayload<S extends boolean | null | undefined | WatchlistAuthorDefaultArgs> = runtime.Types.Result.GetResult<Prisma.$WatchlistAuthorPayload, S>;
export type WatchlistAuthorCountArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = Omit<WatchlistAuthorFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
    select?: WatchlistAuthorCountAggregateInputType | true;
};
export interface WatchlistAuthorDelegate<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: {
        types: Prisma.TypeMap<ExtArgs>['model']['WatchlistAuthor'];
        meta: {
            name: 'WatchlistAuthor';
        };
    };
    findUnique<T extends WatchlistAuthorFindUniqueArgs>(args: Prisma.SelectSubset<T, WatchlistAuthorFindUniqueArgs<ExtArgs>>): Prisma.Prisma__WatchlistAuthorClient<runtime.Types.Result.GetResult<Prisma.$WatchlistAuthorPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    findUniqueOrThrow<T extends WatchlistAuthorFindUniqueOrThrowArgs>(args: Prisma.SelectSubset<T, WatchlistAuthorFindUniqueOrThrowArgs<ExtArgs>>): Prisma.Prisma__WatchlistAuthorClient<runtime.Types.Result.GetResult<Prisma.$WatchlistAuthorPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    findFirst<T extends WatchlistAuthorFindFirstArgs>(args?: Prisma.SelectSubset<T, WatchlistAuthorFindFirstArgs<ExtArgs>>): Prisma.Prisma__WatchlistAuthorClient<runtime.Types.Result.GetResult<Prisma.$WatchlistAuthorPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    findFirstOrThrow<T extends WatchlistAuthorFindFirstOrThrowArgs>(args?: Prisma.SelectSubset<T, WatchlistAuthorFindFirstOrThrowArgs<ExtArgs>>): Prisma.Prisma__WatchlistAuthorClient<runtime.Types.Result.GetResult<Prisma.$WatchlistAuthorPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    findMany<T extends WatchlistAuthorFindManyArgs>(args?: Prisma.SelectSubset<T, WatchlistAuthorFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$WatchlistAuthorPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>;
    create<T extends WatchlistAuthorCreateArgs>(args: Prisma.SelectSubset<T, WatchlistAuthorCreateArgs<ExtArgs>>): Prisma.Prisma__WatchlistAuthorClient<runtime.Types.Result.GetResult<Prisma.$WatchlistAuthorPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    createMany<T extends WatchlistAuthorCreateManyArgs>(args?: Prisma.SelectSubset<T, WatchlistAuthorCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    createManyAndReturn<T extends WatchlistAuthorCreateManyAndReturnArgs>(args?: Prisma.SelectSubset<T, WatchlistAuthorCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$WatchlistAuthorPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>;
    delete<T extends WatchlistAuthorDeleteArgs>(args: Prisma.SelectSubset<T, WatchlistAuthorDeleteArgs<ExtArgs>>): Prisma.Prisma__WatchlistAuthorClient<runtime.Types.Result.GetResult<Prisma.$WatchlistAuthorPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    update<T extends WatchlistAuthorUpdateArgs>(args: Prisma.SelectSubset<T, WatchlistAuthorUpdateArgs<ExtArgs>>): Prisma.Prisma__WatchlistAuthorClient<runtime.Types.Result.GetResult<Prisma.$WatchlistAuthorPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    deleteMany<T extends WatchlistAuthorDeleteManyArgs>(args?: Prisma.SelectSubset<T, WatchlistAuthorDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    updateMany<T extends WatchlistAuthorUpdateManyArgs>(args: Prisma.SelectSubset<T, WatchlistAuthorUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    updateManyAndReturn<T extends WatchlistAuthorUpdateManyAndReturnArgs>(args: Prisma.SelectSubset<T, WatchlistAuthorUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$WatchlistAuthorPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>;
    upsert<T extends WatchlistAuthorUpsertArgs>(args: Prisma.SelectSubset<T, WatchlistAuthorUpsertArgs<ExtArgs>>): Prisma.Prisma__WatchlistAuthorClient<runtime.Types.Result.GetResult<Prisma.$WatchlistAuthorPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    count<T extends WatchlistAuthorCountArgs>(args?: Prisma.Subset<T, WatchlistAuthorCountArgs>): Prisma.PrismaPromise<T extends runtime.Types.Utils.Record<'select', any> ? T['select'] extends true ? number : Prisma.GetScalarType<T['select'], WatchlistAuthorCountAggregateOutputType> : number>;
    aggregate<T extends WatchlistAuthorAggregateArgs>(args: Prisma.Subset<T, WatchlistAuthorAggregateArgs>): Prisma.PrismaPromise<GetWatchlistAuthorAggregateType<T>>;
    groupBy<T extends WatchlistAuthorGroupByArgs, HasSelectOrTake extends Prisma.Or<Prisma.Extends<'skip', Prisma.Keys<T>>, Prisma.Extends<'take', Prisma.Keys<T>>>, OrderByArg extends Prisma.True extends HasSelectOrTake ? {
        orderBy: WatchlistAuthorGroupByArgs['orderBy'];
    } : {
        orderBy?: WatchlistAuthorGroupByArgs['orderBy'];
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
    }[OrderFields]>(args: Prisma.SubsetIntersection<T, WatchlistAuthorGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetWatchlistAuthorGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>;
    readonly fields: WatchlistAuthorFieldRefs;
}
export interface Prisma__WatchlistAuthorClient<T, Null = never, ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise";
    settings<T extends Prisma.WatchlistSettingsDefaultArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.WatchlistSettingsDefaultArgs<ExtArgs>>): Prisma.Prisma__WatchlistSettingsClient<runtime.Types.Result.GetResult<Prisma.$WatchlistSettingsPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>;
    author<T extends Prisma.AuthorDefaultArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.AuthorDefaultArgs<ExtArgs>>): Prisma.Prisma__AuthorClient<runtime.Types.Result.GetResult<Prisma.$AuthorPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>;
    sourceComment<T extends Prisma.WatchlistAuthor$sourceCommentArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.WatchlistAuthor$sourceCommentArgs<ExtArgs>>): Prisma.Prisma__CommentClient<runtime.Types.Result.GetResult<Prisma.$CommentPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    comments<T extends Prisma.WatchlistAuthor$commentsArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.WatchlistAuthor$commentsArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$CommentPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>;
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): runtime.Types.Utils.JsPromise<TResult1 | TResult2>;
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): runtime.Types.Utils.JsPromise<T | TResult>;
    finally(onfinally?: (() => void) | undefined | null): runtime.Types.Utils.JsPromise<T>;
}
export interface WatchlistAuthorFieldRefs {
    readonly id: Prisma.FieldRef<"WatchlistAuthor", 'Int'>;
    readonly authorVkId: Prisma.FieldRef<"WatchlistAuthor", 'Int'>;
    readonly sourceCommentId: Prisma.FieldRef<"WatchlistAuthor", 'Int'>;
    readonly status: Prisma.FieldRef<"WatchlistAuthor", 'WatchlistStatus'>;
    readonly lastCheckedAt: Prisma.FieldRef<"WatchlistAuthor", 'DateTime'>;
    readonly lastActivityAt: Prisma.FieldRef<"WatchlistAuthor", 'DateTime'>;
    readonly foundCommentsCount: Prisma.FieldRef<"WatchlistAuthor", 'Int'>;
    readonly monitoringStartedAt: Prisma.FieldRef<"WatchlistAuthor", 'DateTime'>;
    readonly monitoringStoppedAt: Prisma.FieldRef<"WatchlistAuthor", 'DateTime'>;
    readonly settingsId: Prisma.FieldRef<"WatchlistAuthor", 'Int'>;
    readonly createdAt: Prisma.FieldRef<"WatchlistAuthor", 'DateTime'>;
    readonly updatedAt: Prisma.FieldRef<"WatchlistAuthor", 'DateTime'>;
}
export type WatchlistAuthorFindUniqueArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.WatchlistAuthorSelect<ExtArgs> | null;
    omit?: Prisma.WatchlistAuthorOmit<ExtArgs> | null;
    include?: Prisma.WatchlistAuthorInclude<ExtArgs> | null;
    where: Prisma.WatchlistAuthorWhereUniqueInput;
};
export type WatchlistAuthorFindUniqueOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.WatchlistAuthorSelect<ExtArgs> | null;
    omit?: Prisma.WatchlistAuthorOmit<ExtArgs> | null;
    include?: Prisma.WatchlistAuthorInclude<ExtArgs> | null;
    where: Prisma.WatchlistAuthorWhereUniqueInput;
};
export type WatchlistAuthorFindFirstArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
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
export type WatchlistAuthorFindFirstOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
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
export type WatchlistAuthorFindManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
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
export type WatchlistAuthorCreateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.WatchlistAuthorSelect<ExtArgs> | null;
    omit?: Prisma.WatchlistAuthorOmit<ExtArgs> | null;
    include?: Prisma.WatchlistAuthorInclude<ExtArgs> | null;
    data: Prisma.XOR<Prisma.WatchlistAuthorCreateInput, Prisma.WatchlistAuthorUncheckedCreateInput>;
};
export type WatchlistAuthorCreateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    data: Prisma.WatchlistAuthorCreateManyInput | Prisma.WatchlistAuthorCreateManyInput[];
    skipDuplicates?: boolean;
};
export type WatchlistAuthorCreateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.WatchlistAuthorSelectCreateManyAndReturn<ExtArgs> | null;
    omit?: Prisma.WatchlistAuthorOmit<ExtArgs> | null;
    data: Prisma.WatchlistAuthorCreateManyInput | Prisma.WatchlistAuthorCreateManyInput[];
    skipDuplicates?: boolean;
    include?: Prisma.WatchlistAuthorIncludeCreateManyAndReturn<ExtArgs> | null;
};
export type WatchlistAuthorUpdateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.WatchlistAuthorSelect<ExtArgs> | null;
    omit?: Prisma.WatchlistAuthorOmit<ExtArgs> | null;
    include?: Prisma.WatchlistAuthorInclude<ExtArgs> | null;
    data: Prisma.XOR<Prisma.WatchlistAuthorUpdateInput, Prisma.WatchlistAuthorUncheckedUpdateInput>;
    where: Prisma.WatchlistAuthorWhereUniqueInput;
};
export type WatchlistAuthorUpdateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    data: Prisma.XOR<Prisma.WatchlistAuthorUpdateManyMutationInput, Prisma.WatchlistAuthorUncheckedUpdateManyInput>;
    where?: Prisma.WatchlistAuthorWhereInput;
    limit?: number;
};
export type WatchlistAuthorUpdateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.WatchlistAuthorSelectUpdateManyAndReturn<ExtArgs> | null;
    omit?: Prisma.WatchlistAuthorOmit<ExtArgs> | null;
    data: Prisma.XOR<Prisma.WatchlistAuthorUpdateManyMutationInput, Prisma.WatchlistAuthorUncheckedUpdateManyInput>;
    where?: Prisma.WatchlistAuthorWhereInput;
    limit?: number;
    include?: Prisma.WatchlistAuthorIncludeUpdateManyAndReturn<ExtArgs> | null;
};
export type WatchlistAuthorUpsertArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.WatchlistAuthorSelect<ExtArgs> | null;
    omit?: Prisma.WatchlistAuthorOmit<ExtArgs> | null;
    include?: Prisma.WatchlistAuthorInclude<ExtArgs> | null;
    where: Prisma.WatchlistAuthorWhereUniqueInput;
    create: Prisma.XOR<Prisma.WatchlistAuthorCreateInput, Prisma.WatchlistAuthorUncheckedCreateInput>;
    update: Prisma.XOR<Prisma.WatchlistAuthorUpdateInput, Prisma.WatchlistAuthorUncheckedUpdateInput>;
};
export type WatchlistAuthorDeleteArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.WatchlistAuthorSelect<ExtArgs> | null;
    omit?: Prisma.WatchlistAuthorOmit<ExtArgs> | null;
    include?: Prisma.WatchlistAuthorInclude<ExtArgs> | null;
    where: Prisma.WatchlistAuthorWhereUniqueInput;
};
export type WatchlistAuthorDeleteManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.WatchlistAuthorWhereInput;
    limit?: number;
};
export type WatchlistAuthor$sourceCommentArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.CommentSelect<ExtArgs> | null;
    omit?: Prisma.CommentOmit<ExtArgs> | null;
    include?: Prisma.CommentInclude<ExtArgs> | null;
    where?: Prisma.CommentWhereInput;
};
export type WatchlistAuthor$commentsArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.CommentSelect<ExtArgs> | null;
    omit?: Prisma.CommentOmit<ExtArgs> | null;
    include?: Prisma.CommentInclude<ExtArgs> | null;
    where?: Prisma.CommentWhereInput;
    orderBy?: Prisma.CommentOrderByWithRelationInput | Prisma.CommentOrderByWithRelationInput[];
    cursor?: Prisma.CommentWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.CommentScalarFieldEnum | Prisma.CommentScalarFieldEnum[];
};
export type WatchlistAuthorDefaultArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.WatchlistAuthorSelect<ExtArgs> | null;
    omit?: Prisma.WatchlistAuthorOmit<ExtArgs> | null;
    include?: Prisma.WatchlistAuthorInclude<ExtArgs> | null;
};
export {};
