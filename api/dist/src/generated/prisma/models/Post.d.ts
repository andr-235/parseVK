import type * as runtime from "@prisma/client/runtime/client";
import type * as Prisma from "../internal/prismaNamespace.js";
export type PostModel = runtime.Types.Result.DefaultSelection<Prisma.$PostPayload>;
export type AggregatePost = {
    _count: PostCountAggregateOutputType | null;
    _avg: PostAvgAggregateOutputType | null;
    _sum: PostSumAggregateOutputType | null;
    _min: PostMinAggregateOutputType | null;
    _max: PostMaxAggregateOutputType | null;
};
export type PostAvgAggregateOutputType = {
    id: number | null;
    ownerId: number | null;
    vkPostId: number | null;
    fromId: number | null;
    commentsCount: number | null;
    commentsCanPost: number | null;
    groupId: number | null;
};
export type PostSumAggregateOutputType = {
    id: number | null;
    ownerId: number | null;
    vkPostId: number | null;
    fromId: number | null;
    commentsCount: number | null;
    commentsCanPost: number | null;
    groupId: number | null;
};
export type PostMinAggregateOutputType = {
    id: number | null;
    ownerId: number | null;
    vkPostId: number | null;
    fromId: number | null;
    postedAt: Date | null;
    text: string | null;
    commentsCount: number | null;
    commentsCanPost: number | null;
    commentsGroupsCanPost: boolean | null;
    commentsCanClose: boolean | null;
    commentsCanOpen: boolean | null;
    createdAt: Date | null;
    updatedAt: Date | null;
    groupId: number | null;
};
export type PostMaxAggregateOutputType = {
    id: number | null;
    ownerId: number | null;
    vkPostId: number | null;
    fromId: number | null;
    postedAt: Date | null;
    text: string | null;
    commentsCount: number | null;
    commentsCanPost: number | null;
    commentsGroupsCanPost: boolean | null;
    commentsCanClose: boolean | null;
    commentsCanOpen: boolean | null;
    createdAt: Date | null;
    updatedAt: Date | null;
    groupId: number | null;
};
export type PostCountAggregateOutputType = {
    id: number;
    ownerId: number;
    vkPostId: number;
    fromId: number;
    postedAt: number;
    text: number;
    attachments: number;
    commentsCount: number;
    commentsCanPost: number;
    commentsGroupsCanPost: number;
    commentsCanClose: number;
    commentsCanOpen: number;
    createdAt: number;
    updatedAt: number;
    groupId: number;
    _all: number;
};
export type PostAvgAggregateInputType = {
    id?: true;
    ownerId?: true;
    vkPostId?: true;
    fromId?: true;
    commentsCount?: true;
    commentsCanPost?: true;
    groupId?: true;
};
export type PostSumAggregateInputType = {
    id?: true;
    ownerId?: true;
    vkPostId?: true;
    fromId?: true;
    commentsCount?: true;
    commentsCanPost?: true;
    groupId?: true;
};
export type PostMinAggregateInputType = {
    id?: true;
    ownerId?: true;
    vkPostId?: true;
    fromId?: true;
    postedAt?: true;
    text?: true;
    commentsCount?: true;
    commentsCanPost?: true;
    commentsGroupsCanPost?: true;
    commentsCanClose?: true;
    commentsCanOpen?: true;
    createdAt?: true;
    updatedAt?: true;
    groupId?: true;
};
export type PostMaxAggregateInputType = {
    id?: true;
    ownerId?: true;
    vkPostId?: true;
    fromId?: true;
    postedAt?: true;
    text?: true;
    commentsCount?: true;
    commentsCanPost?: true;
    commentsGroupsCanPost?: true;
    commentsCanClose?: true;
    commentsCanOpen?: true;
    createdAt?: true;
    updatedAt?: true;
    groupId?: true;
};
export type PostCountAggregateInputType = {
    id?: true;
    ownerId?: true;
    vkPostId?: true;
    fromId?: true;
    postedAt?: true;
    text?: true;
    attachments?: true;
    commentsCount?: true;
    commentsCanPost?: true;
    commentsGroupsCanPost?: true;
    commentsCanClose?: true;
    commentsCanOpen?: true;
    createdAt?: true;
    updatedAt?: true;
    groupId?: true;
    _all?: true;
};
export type PostAggregateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.PostWhereInput;
    orderBy?: Prisma.PostOrderByWithRelationInput | Prisma.PostOrderByWithRelationInput[];
    cursor?: Prisma.PostWhereUniqueInput;
    take?: number;
    skip?: number;
    _count?: true | PostCountAggregateInputType;
    _avg?: PostAvgAggregateInputType;
    _sum?: PostSumAggregateInputType;
    _min?: PostMinAggregateInputType;
    _max?: PostMaxAggregateInputType;
};
export type GetPostAggregateType<T extends PostAggregateArgs> = {
    [P in keyof T & keyof AggregatePost]: P extends '_count' | 'count' ? T[P] extends true ? number : Prisma.GetScalarType<T[P], AggregatePost[P]> : Prisma.GetScalarType<T[P], AggregatePost[P]>;
};
export type PostGroupByArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.PostWhereInput;
    orderBy?: Prisma.PostOrderByWithAggregationInput | Prisma.PostOrderByWithAggregationInput[];
    by: Prisma.PostScalarFieldEnum[] | Prisma.PostScalarFieldEnum;
    having?: Prisma.PostScalarWhereWithAggregatesInput;
    take?: number;
    skip?: number;
    _count?: PostCountAggregateInputType | true;
    _avg?: PostAvgAggregateInputType;
    _sum?: PostSumAggregateInputType;
    _min?: PostMinAggregateInputType;
    _max?: PostMaxAggregateInputType;
};
export type PostGroupByOutputType = {
    id: number;
    ownerId: number;
    vkPostId: number;
    fromId: number;
    postedAt: Date;
    text: string;
    attachments: runtime.JsonValue | null;
    commentsCount: number;
    commentsCanPost: number;
    commentsGroupsCanPost: boolean;
    commentsCanClose: boolean;
    commentsCanOpen: boolean;
    createdAt: Date;
    updatedAt: Date;
    groupId: number | null;
    _count: PostCountAggregateOutputType | null;
    _avg: PostAvgAggregateOutputType | null;
    _sum: PostSumAggregateOutputType | null;
    _min: PostMinAggregateOutputType | null;
    _max: PostMaxAggregateOutputType | null;
};
type GetPostGroupByPayload<T extends PostGroupByArgs> = Prisma.PrismaPromise<Array<Prisma.PickEnumerable<PostGroupByOutputType, T['by']> & {
    [P in ((keyof T) & (keyof PostGroupByOutputType))]: P extends '_count' ? T[P] extends boolean ? number : Prisma.GetScalarType<T[P], PostGroupByOutputType[P]> : Prisma.GetScalarType<T[P], PostGroupByOutputType[P]>;
}>>;
export type PostWhereInput = {
    AND?: Prisma.PostWhereInput | Prisma.PostWhereInput[];
    OR?: Prisma.PostWhereInput[];
    NOT?: Prisma.PostWhereInput | Prisma.PostWhereInput[];
    id?: Prisma.IntFilter<"Post"> | number;
    ownerId?: Prisma.IntFilter<"Post"> | number;
    vkPostId?: Prisma.IntFilter<"Post"> | number;
    fromId?: Prisma.IntFilter<"Post"> | number;
    postedAt?: Prisma.DateTimeFilter<"Post"> | Date | string;
    text?: Prisma.StringFilter<"Post"> | string;
    attachments?: Prisma.JsonNullableFilter<"Post">;
    commentsCount?: Prisma.IntFilter<"Post"> | number;
    commentsCanPost?: Prisma.IntFilter<"Post"> | number;
    commentsGroupsCanPost?: Prisma.BoolFilter<"Post"> | boolean;
    commentsCanClose?: Prisma.BoolFilter<"Post"> | boolean;
    commentsCanOpen?: Prisma.BoolFilter<"Post"> | boolean;
    createdAt?: Prisma.DateTimeFilter<"Post"> | Date | string;
    updatedAt?: Prisma.DateTimeFilter<"Post"> | Date | string;
    groupId?: Prisma.IntNullableFilter<"Post"> | number | null;
    group?: Prisma.XOR<Prisma.GroupNullableScalarRelationFilter, Prisma.GroupWhereInput> | null;
    comments?: Prisma.CommentListRelationFilter;
};
export type PostOrderByWithRelationInput = {
    id?: Prisma.SortOrder;
    ownerId?: Prisma.SortOrder;
    vkPostId?: Prisma.SortOrder;
    fromId?: Prisma.SortOrder;
    postedAt?: Prisma.SortOrder;
    text?: Prisma.SortOrder;
    attachments?: Prisma.SortOrderInput | Prisma.SortOrder;
    commentsCount?: Prisma.SortOrder;
    commentsCanPost?: Prisma.SortOrder;
    commentsGroupsCanPost?: Prisma.SortOrder;
    commentsCanClose?: Prisma.SortOrder;
    commentsCanOpen?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
    groupId?: Prisma.SortOrderInput | Prisma.SortOrder;
    group?: Prisma.GroupOrderByWithRelationInput;
    comments?: Prisma.CommentOrderByRelationAggregateInput;
};
export type PostWhereUniqueInput = Prisma.AtLeast<{
    id?: number;
    ownerId_vkPostId?: Prisma.PostOwnerIdVkPostIdCompoundUniqueInput;
    AND?: Prisma.PostWhereInput | Prisma.PostWhereInput[];
    OR?: Prisma.PostWhereInput[];
    NOT?: Prisma.PostWhereInput | Prisma.PostWhereInput[];
    ownerId?: Prisma.IntFilter<"Post"> | number;
    vkPostId?: Prisma.IntFilter<"Post"> | number;
    fromId?: Prisma.IntFilter<"Post"> | number;
    postedAt?: Prisma.DateTimeFilter<"Post"> | Date | string;
    text?: Prisma.StringFilter<"Post"> | string;
    attachments?: Prisma.JsonNullableFilter<"Post">;
    commentsCount?: Prisma.IntFilter<"Post"> | number;
    commentsCanPost?: Prisma.IntFilter<"Post"> | number;
    commentsGroupsCanPost?: Prisma.BoolFilter<"Post"> | boolean;
    commentsCanClose?: Prisma.BoolFilter<"Post"> | boolean;
    commentsCanOpen?: Prisma.BoolFilter<"Post"> | boolean;
    createdAt?: Prisma.DateTimeFilter<"Post"> | Date | string;
    updatedAt?: Prisma.DateTimeFilter<"Post"> | Date | string;
    groupId?: Prisma.IntNullableFilter<"Post"> | number | null;
    group?: Prisma.XOR<Prisma.GroupNullableScalarRelationFilter, Prisma.GroupWhereInput> | null;
    comments?: Prisma.CommentListRelationFilter;
}, "id" | "ownerId_vkPostId">;
export type PostOrderByWithAggregationInput = {
    id?: Prisma.SortOrder;
    ownerId?: Prisma.SortOrder;
    vkPostId?: Prisma.SortOrder;
    fromId?: Prisma.SortOrder;
    postedAt?: Prisma.SortOrder;
    text?: Prisma.SortOrder;
    attachments?: Prisma.SortOrderInput | Prisma.SortOrder;
    commentsCount?: Prisma.SortOrder;
    commentsCanPost?: Prisma.SortOrder;
    commentsGroupsCanPost?: Prisma.SortOrder;
    commentsCanClose?: Prisma.SortOrder;
    commentsCanOpen?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
    groupId?: Prisma.SortOrderInput | Prisma.SortOrder;
    _count?: Prisma.PostCountOrderByAggregateInput;
    _avg?: Prisma.PostAvgOrderByAggregateInput;
    _max?: Prisma.PostMaxOrderByAggregateInput;
    _min?: Prisma.PostMinOrderByAggregateInput;
    _sum?: Prisma.PostSumOrderByAggregateInput;
};
export type PostScalarWhereWithAggregatesInput = {
    AND?: Prisma.PostScalarWhereWithAggregatesInput | Prisma.PostScalarWhereWithAggregatesInput[];
    OR?: Prisma.PostScalarWhereWithAggregatesInput[];
    NOT?: Prisma.PostScalarWhereWithAggregatesInput | Prisma.PostScalarWhereWithAggregatesInput[];
    id?: Prisma.IntWithAggregatesFilter<"Post"> | number;
    ownerId?: Prisma.IntWithAggregatesFilter<"Post"> | number;
    vkPostId?: Prisma.IntWithAggregatesFilter<"Post"> | number;
    fromId?: Prisma.IntWithAggregatesFilter<"Post"> | number;
    postedAt?: Prisma.DateTimeWithAggregatesFilter<"Post"> | Date | string;
    text?: Prisma.StringWithAggregatesFilter<"Post"> | string;
    attachments?: Prisma.JsonNullableWithAggregatesFilter<"Post">;
    commentsCount?: Prisma.IntWithAggregatesFilter<"Post"> | number;
    commentsCanPost?: Prisma.IntWithAggregatesFilter<"Post"> | number;
    commentsGroupsCanPost?: Prisma.BoolWithAggregatesFilter<"Post"> | boolean;
    commentsCanClose?: Prisma.BoolWithAggregatesFilter<"Post"> | boolean;
    commentsCanOpen?: Prisma.BoolWithAggregatesFilter<"Post"> | boolean;
    createdAt?: Prisma.DateTimeWithAggregatesFilter<"Post"> | Date | string;
    updatedAt?: Prisma.DateTimeWithAggregatesFilter<"Post"> | Date | string;
    groupId?: Prisma.IntNullableWithAggregatesFilter<"Post"> | number | null;
};
export type PostCreateInput = {
    ownerId: number;
    vkPostId: number;
    fromId: number;
    postedAt: Date | string;
    text: string;
    attachments?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    commentsCount: number;
    commentsCanPost: number;
    commentsGroupsCanPost: boolean;
    commentsCanClose: boolean;
    commentsCanOpen: boolean;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    group?: Prisma.GroupCreateNestedOneWithoutPostsInput;
    comments?: Prisma.CommentCreateNestedManyWithoutPostInput;
};
export type PostUncheckedCreateInput = {
    id?: number;
    ownerId: number;
    vkPostId: number;
    fromId: number;
    postedAt: Date | string;
    text: string;
    attachments?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    commentsCount: number;
    commentsCanPost: number;
    commentsGroupsCanPost: boolean;
    commentsCanClose: boolean;
    commentsCanOpen: boolean;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    groupId?: number | null;
    comments?: Prisma.CommentUncheckedCreateNestedManyWithoutPostInput;
};
export type PostUpdateInput = {
    ownerId?: Prisma.IntFieldUpdateOperationsInput | number;
    vkPostId?: Prisma.IntFieldUpdateOperationsInput | number;
    fromId?: Prisma.IntFieldUpdateOperationsInput | number;
    postedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    text?: Prisma.StringFieldUpdateOperationsInput | string;
    attachments?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    commentsCount?: Prisma.IntFieldUpdateOperationsInput | number;
    commentsCanPost?: Prisma.IntFieldUpdateOperationsInput | number;
    commentsGroupsCanPost?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    commentsCanClose?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    commentsCanOpen?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    group?: Prisma.GroupUpdateOneWithoutPostsNestedInput;
    comments?: Prisma.CommentUpdateManyWithoutPostNestedInput;
};
export type PostUncheckedUpdateInput = {
    id?: Prisma.IntFieldUpdateOperationsInput | number;
    ownerId?: Prisma.IntFieldUpdateOperationsInput | number;
    vkPostId?: Prisma.IntFieldUpdateOperationsInput | number;
    fromId?: Prisma.IntFieldUpdateOperationsInput | number;
    postedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    text?: Prisma.StringFieldUpdateOperationsInput | string;
    attachments?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    commentsCount?: Prisma.IntFieldUpdateOperationsInput | number;
    commentsCanPost?: Prisma.IntFieldUpdateOperationsInput | number;
    commentsGroupsCanPost?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    commentsCanClose?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    commentsCanOpen?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    groupId?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    comments?: Prisma.CommentUncheckedUpdateManyWithoutPostNestedInput;
};
export type PostCreateManyInput = {
    id?: number;
    ownerId: number;
    vkPostId: number;
    fromId: number;
    postedAt: Date | string;
    text: string;
    attachments?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    commentsCount: number;
    commentsCanPost: number;
    commentsGroupsCanPost: boolean;
    commentsCanClose: boolean;
    commentsCanOpen: boolean;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    groupId?: number | null;
};
export type PostUpdateManyMutationInput = {
    ownerId?: Prisma.IntFieldUpdateOperationsInput | number;
    vkPostId?: Prisma.IntFieldUpdateOperationsInput | number;
    fromId?: Prisma.IntFieldUpdateOperationsInput | number;
    postedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    text?: Prisma.StringFieldUpdateOperationsInput | string;
    attachments?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    commentsCount?: Prisma.IntFieldUpdateOperationsInput | number;
    commentsCanPost?: Prisma.IntFieldUpdateOperationsInput | number;
    commentsGroupsCanPost?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    commentsCanClose?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    commentsCanOpen?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type PostUncheckedUpdateManyInput = {
    id?: Prisma.IntFieldUpdateOperationsInput | number;
    ownerId?: Prisma.IntFieldUpdateOperationsInput | number;
    vkPostId?: Prisma.IntFieldUpdateOperationsInput | number;
    fromId?: Prisma.IntFieldUpdateOperationsInput | number;
    postedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    text?: Prisma.StringFieldUpdateOperationsInput | string;
    attachments?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    commentsCount?: Prisma.IntFieldUpdateOperationsInput | number;
    commentsCanPost?: Prisma.IntFieldUpdateOperationsInput | number;
    commentsGroupsCanPost?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    commentsCanClose?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    commentsCanOpen?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    groupId?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
};
export type PostListRelationFilter = {
    every?: Prisma.PostWhereInput;
    some?: Prisma.PostWhereInput;
    none?: Prisma.PostWhereInput;
};
export type PostOrderByRelationAggregateInput = {
    _count?: Prisma.SortOrder;
};
export type PostOwnerIdVkPostIdCompoundUniqueInput = {
    ownerId: number;
    vkPostId: number;
};
export type PostCountOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    ownerId?: Prisma.SortOrder;
    vkPostId?: Prisma.SortOrder;
    fromId?: Prisma.SortOrder;
    postedAt?: Prisma.SortOrder;
    text?: Prisma.SortOrder;
    attachments?: Prisma.SortOrder;
    commentsCount?: Prisma.SortOrder;
    commentsCanPost?: Prisma.SortOrder;
    commentsGroupsCanPost?: Prisma.SortOrder;
    commentsCanClose?: Prisma.SortOrder;
    commentsCanOpen?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
    groupId?: Prisma.SortOrder;
};
export type PostAvgOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    ownerId?: Prisma.SortOrder;
    vkPostId?: Prisma.SortOrder;
    fromId?: Prisma.SortOrder;
    commentsCount?: Prisma.SortOrder;
    commentsCanPost?: Prisma.SortOrder;
    groupId?: Prisma.SortOrder;
};
export type PostMaxOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    ownerId?: Prisma.SortOrder;
    vkPostId?: Prisma.SortOrder;
    fromId?: Prisma.SortOrder;
    postedAt?: Prisma.SortOrder;
    text?: Prisma.SortOrder;
    commentsCount?: Prisma.SortOrder;
    commentsCanPost?: Prisma.SortOrder;
    commentsGroupsCanPost?: Prisma.SortOrder;
    commentsCanClose?: Prisma.SortOrder;
    commentsCanOpen?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
    groupId?: Prisma.SortOrder;
};
export type PostMinOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    ownerId?: Prisma.SortOrder;
    vkPostId?: Prisma.SortOrder;
    fromId?: Prisma.SortOrder;
    postedAt?: Prisma.SortOrder;
    text?: Prisma.SortOrder;
    commentsCount?: Prisma.SortOrder;
    commentsCanPost?: Prisma.SortOrder;
    commentsGroupsCanPost?: Prisma.SortOrder;
    commentsCanClose?: Prisma.SortOrder;
    commentsCanOpen?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
    groupId?: Prisma.SortOrder;
};
export type PostSumOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    ownerId?: Prisma.SortOrder;
    vkPostId?: Prisma.SortOrder;
    fromId?: Prisma.SortOrder;
    commentsCount?: Prisma.SortOrder;
    commentsCanPost?: Prisma.SortOrder;
    groupId?: Prisma.SortOrder;
};
export type PostScalarRelationFilter = {
    is?: Prisma.PostWhereInput;
    isNot?: Prisma.PostWhereInput;
};
export type PostCreateNestedManyWithoutGroupInput = {
    create?: Prisma.XOR<Prisma.PostCreateWithoutGroupInput, Prisma.PostUncheckedCreateWithoutGroupInput> | Prisma.PostCreateWithoutGroupInput[] | Prisma.PostUncheckedCreateWithoutGroupInput[];
    connectOrCreate?: Prisma.PostCreateOrConnectWithoutGroupInput | Prisma.PostCreateOrConnectWithoutGroupInput[];
    createMany?: Prisma.PostCreateManyGroupInputEnvelope;
    connect?: Prisma.PostWhereUniqueInput | Prisma.PostWhereUniqueInput[];
};
export type PostUncheckedCreateNestedManyWithoutGroupInput = {
    create?: Prisma.XOR<Prisma.PostCreateWithoutGroupInput, Prisma.PostUncheckedCreateWithoutGroupInput> | Prisma.PostCreateWithoutGroupInput[] | Prisma.PostUncheckedCreateWithoutGroupInput[];
    connectOrCreate?: Prisma.PostCreateOrConnectWithoutGroupInput | Prisma.PostCreateOrConnectWithoutGroupInput[];
    createMany?: Prisma.PostCreateManyGroupInputEnvelope;
    connect?: Prisma.PostWhereUniqueInput | Prisma.PostWhereUniqueInput[];
};
export type PostUpdateManyWithoutGroupNestedInput = {
    create?: Prisma.XOR<Prisma.PostCreateWithoutGroupInput, Prisma.PostUncheckedCreateWithoutGroupInput> | Prisma.PostCreateWithoutGroupInput[] | Prisma.PostUncheckedCreateWithoutGroupInput[];
    connectOrCreate?: Prisma.PostCreateOrConnectWithoutGroupInput | Prisma.PostCreateOrConnectWithoutGroupInput[];
    upsert?: Prisma.PostUpsertWithWhereUniqueWithoutGroupInput | Prisma.PostUpsertWithWhereUniqueWithoutGroupInput[];
    createMany?: Prisma.PostCreateManyGroupInputEnvelope;
    set?: Prisma.PostWhereUniqueInput | Prisma.PostWhereUniqueInput[];
    disconnect?: Prisma.PostWhereUniqueInput | Prisma.PostWhereUniqueInput[];
    delete?: Prisma.PostWhereUniqueInput | Prisma.PostWhereUniqueInput[];
    connect?: Prisma.PostWhereUniqueInput | Prisma.PostWhereUniqueInput[];
    update?: Prisma.PostUpdateWithWhereUniqueWithoutGroupInput | Prisma.PostUpdateWithWhereUniqueWithoutGroupInput[];
    updateMany?: Prisma.PostUpdateManyWithWhereWithoutGroupInput | Prisma.PostUpdateManyWithWhereWithoutGroupInput[];
    deleteMany?: Prisma.PostScalarWhereInput | Prisma.PostScalarWhereInput[];
};
export type PostUncheckedUpdateManyWithoutGroupNestedInput = {
    create?: Prisma.XOR<Prisma.PostCreateWithoutGroupInput, Prisma.PostUncheckedCreateWithoutGroupInput> | Prisma.PostCreateWithoutGroupInput[] | Prisma.PostUncheckedCreateWithoutGroupInput[];
    connectOrCreate?: Prisma.PostCreateOrConnectWithoutGroupInput | Prisma.PostCreateOrConnectWithoutGroupInput[];
    upsert?: Prisma.PostUpsertWithWhereUniqueWithoutGroupInput | Prisma.PostUpsertWithWhereUniqueWithoutGroupInput[];
    createMany?: Prisma.PostCreateManyGroupInputEnvelope;
    set?: Prisma.PostWhereUniqueInput | Prisma.PostWhereUniqueInput[];
    disconnect?: Prisma.PostWhereUniqueInput | Prisma.PostWhereUniqueInput[];
    delete?: Prisma.PostWhereUniqueInput | Prisma.PostWhereUniqueInput[];
    connect?: Prisma.PostWhereUniqueInput | Prisma.PostWhereUniqueInput[];
    update?: Prisma.PostUpdateWithWhereUniqueWithoutGroupInput | Prisma.PostUpdateWithWhereUniqueWithoutGroupInput[];
    updateMany?: Prisma.PostUpdateManyWithWhereWithoutGroupInput | Prisma.PostUpdateManyWithWhereWithoutGroupInput[];
    deleteMany?: Prisma.PostScalarWhereInput | Prisma.PostScalarWhereInput[];
};
export type PostCreateNestedOneWithoutCommentsInput = {
    create?: Prisma.XOR<Prisma.PostCreateWithoutCommentsInput, Prisma.PostUncheckedCreateWithoutCommentsInput>;
    connectOrCreate?: Prisma.PostCreateOrConnectWithoutCommentsInput;
    connect?: Prisma.PostWhereUniqueInput;
};
export type PostUpdateOneRequiredWithoutCommentsNestedInput = {
    create?: Prisma.XOR<Prisma.PostCreateWithoutCommentsInput, Prisma.PostUncheckedCreateWithoutCommentsInput>;
    connectOrCreate?: Prisma.PostCreateOrConnectWithoutCommentsInput;
    upsert?: Prisma.PostUpsertWithoutCommentsInput;
    connect?: Prisma.PostWhereUniqueInput;
    update?: Prisma.XOR<Prisma.XOR<Prisma.PostUpdateToOneWithWhereWithoutCommentsInput, Prisma.PostUpdateWithoutCommentsInput>, Prisma.PostUncheckedUpdateWithoutCommentsInput>;
};
export type PostCreateWithoutGroupInput = {
    ownerId: number;
    vkPostId: number;
    fromId: number;
    postedAt: Date | string;
    text: string;
    attachments?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    commentsCount: number;
    commentsCanPost: number;
    commentsGroupsCanPost: boolean;
    commentsCanClose: boolean;
    commentsCanOpen: boolean;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    comments?: Prisma.CommentCreateNestedManyWithoutPostInput;
};
export type PostUncheckedCreateWithoutGroupInput = {
    id?: number;
    ownerId: number;
    vkPostId: number;
    fromId: number;
    postedAt: Date | string;
    text: string;
    attachments?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    commentsCount: number;
    commentsCanPost: number;
    commentsGroupsCanPost: boolean;
    commentsCanClose: boolean;
    commentsCanOpen: boolean;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    comments?: Prisma.CommentUncheckedCreateNestedManyWithoutPostInput;
};
export type PostCreateOrConnectWithoutGroupInput = {
    where: Prisma.PostWhereUniqueInput;
    create: Prisma.XOR<Prisma.PostCreateWithoutGroupInput, Prisma.PostUncheckedCreateWithoutGroupInput>;
};
export type PostCreateManyGroupInputEnvelope = {
    data: Prisma.PostCreateManyGroupInput | Prisma.PostCreateManyGroupInput[];
    skipDuplicates?: boolean;
};
export type PostUpsertWithWhereUniqueWithoutGroupInput = {
    where: Prisma.PostWhereUniqueInput;
    update: Prisma.XOR<Prisma.PostUpdateWithoutGroupInput, Prisma.PostUncheckedUpdateWithoutGroupInput>;
    create: Prisma.XOR<Prisma.PostCreateWithoutGroupInput, Prisma.PostUncheckedCreateWithoutGroupInput>;
};
export type PostUpdateWithWhereUniqueWithoutGroupInput = {
    where: Prisma.PostWhereUniqueInput;
    data: Prisma.XOR<Prisma.PostUpdateWithoutGroupInput, Prisma.PostUncheckedUpdateWithoutGroupInput>;
};
export type PostUpdateManyWithWhereWithoutGroupInput = {
    where: Prisma.PostScalarWhereInput;
    data: Prisma.XOR<Prisma.PostUpdateManyMutationInput, Prisma.PostUncheckedUpdateManyWithoutGroupInput>;
};
export type PostScalarWhereInput = {
    AND?: Prisma.PostScalarWhereInput | Prisma.PostScalarWhereInput[];
    OR?: Prisma.PostScalarWhereInput[];
    NOT?: Prisma.PostScalarWhereInput | Prisma.PostScalarWhereInput[];
    id?: Prisma.IntFilter<"Post"> | number;
    ownerId?: Prisma.IntFilter<"Post"> | number;
    vkPostId?: Prisma.IntFilter<"Post"> | number;
    fromId?: Prisma.IntFilter<"Post"> | number;
    postedAt?: Prisma.DateTimeFilter<"Post"> | Date | string;
    text?: Prisma.StringFilter<"Post"> | string;
    attachments?: Prisma.JsonNullableFilter<"Post">;
    commentsCount?: Prisma.IntFilter<"Post"> | number;
    commentsCanPost?: Prisma.IntFilter<"Post"> | number;
    commentsGroupsCanPost?: Prisma.BoolFilter<"Post"> | boolean;
    commentsCanClose?: Prisma.BoolFilter<"Post"> | boolean;
    commentsCanOpen?: Prisma.BoolFilter<"Post"> | boolean;
    createdAt?: Prisma.DateTimeFilter<"Post"> | Date | string;
    updatedAt?: Prisma.DateTimeFilter<"Post"> | Date | string;
    groupId?: Prisma.IntNullableFilter<"Post"> | number | null;
};
export type PostCreateWithoutCommentsInput = {
    ownerId: number;
    vkPostId: number;
    fromId: number;
    postedAt: Date | string;
    text: string;
    attachments?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    commentsCount: number;
    commentsCanPost: number;
    commentsGroupsCanPost: boolean;
    commentsCanClose: boolean;
    commentsCanOpen: boolean;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    group?: Prisma.GroupCreateNestedOneWithoutPostsInput;
};
export type PostUncheckedCreateWithoutCommentsInput = {
    id?: number;
    ownerId: number;
    vkPostId: number;
    fromId: number;
    postedAt: Date | string;
    text: string;
    attachments?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    commentsCount: number;
    commentsCanPost: number;
    commentsGroupsCanPost: boolean;
    commentsCanClose: boolean;
    commentsCanOpen: boolean;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    groupId?: number | null;
};
export type PostCreateOrConnectWithoutCommentsInput = {
    where: Prisma.PostWhereUniqueInput;
    create: Prisma.XOR<Prisma.PostCreateWithoutCommentsInput, Prisma.PostUncheckedCreateWithoutCommentsInput>;
};
export type PostUpsertWithoutCommentsInput = {
    update: Prisma.XOR<Prisma.PostUpdateWithoutCommentsInput, Prisma.PostUncheckedUpdateWithoutCommentsInput>;
    create: Prisma.XOR<Prisma.PostCreateWithoutCommentsInput, Prisma.PostUncheckedCreateWithoutCommentsInput>;
    where?: Prisma.PostWhereInput;
};
export type PostUpdateToOneWithWhereWithoutCommentsInput = {
    where?: Prisma.PostWhereInput;
    data: Prisma.XOR<Prisma.PostUpdateWithoutCommentsInput, Prisma.PostUncheckedUpdateWithoutCommentsInput>;
};
export type PostUpdateWithoutCommentsInput = {
    ownerId?: Prisma.IntFieldUpdateOperationsInput | number;
    vkPostId?: Prisma.IntFieldUpdateOperationsInput | number;
    fromId?: Prisma.IntFieldUpdateOperationsInput | number;
    postedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    text?: Prisma.StringFieldUpdateOperationsInput | string;
    attachments?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    commentsCount?: Prisma.IntFieldUpdateOperationsInput | number;
    commentsCanPost?: Prisma.IntFieldUpdateOperationsInput | number;
    commentsGroupsCanPost?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    commentsCanClose?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    commentsCanOpen?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    group?: Prisma.GroupUpdateOneWithoutPostsNestedInput;
};
export type PostUncheckedUpdateWithoutCommentsInput = {
    id?: Prisma.IntFieldUpdateOperationsInput | number;
    ownerId?: Prisma.IntFieldUpdateOperationsInput | number;
    vkPostId?: Prisma.IntFieldUpdateOperationsInput | number;
    fromId?: Prisma.IntFieldUpdateOperationsInput | number;
    postedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    text?: Prisma.StringFieldUpdateOperationsInput | string;
    attachments?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    commentsCount?: Prisma.IntFieldUpdateOperationsInput | number;
    commentsCanPost?: Prisma.IntFieldUpdateOperationsInput | number;
    commentsGroupsCanPost?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    commentsCanClose?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    commentsCanOpen?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    groupId?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
};
export type PostCreateManyGroupInput = {
    id?: number;
    ownerId: number;
    vkPostId: number;
    fromId: number;
    postedAt: Date | string;
    text: string;
    attachments?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    commentsCount: number;
    commentsCanPost: number;
    commentsGroupsCanPost: boolean;
    commentsCanClose: boolean;
    commentsCanOpen: boolean;
    createdAt?: Date | string;
    updatedAt?: Date | string;
};
export type PostUpdateWithoutGroupInput = {
    ownerId?: Prisma.IntFieldUpdateOperationsInput | number;
    vkPostId?: Prisma.IntFieldUpdateOperationsInput | number;
    fromId?: Prisma.IntFieldUpdateOperationsInput | number;
    postedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    text?: Prisma.StringFieldUpdateOperationsInput | string;
    attachments?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    commentsCount?: Prisma.IntFieldUpdateOperationsInput | number;
    commentsCanPost?: Prisma.IntFieldUpdateOperationsInput | number;
    commentsGroupsCanPost?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    commentsCanClose?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    commentsCanOpen?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    comments?: Prisma.CommentUpdateManyWithoutPostNestedInput;
};
export type PostUncheckedUpdateWithoutGroupInput = {
    id?: Prisma.IntFieldUpdateOperationsInput | number;
    ownerId?: Prisma.IntFieldUpdateOperationsInput | number;
    vkPostId?: Prisma.IntFieldUpdateOperationsInput | number;
    fromId?: Prisma.IntFieldUpdateOperationsInput | number;
    postedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    text?: Prisma.StringFieldUpdateOperationsInput | string;
    attachments?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    commentsCount?: Prisma.IntFieldUpdateOperationsInput | number;
    commentsCanPost?: Prisma.IntFieldUpdateOperationsInput | number;
    commentsGroupsCanPost?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    commentsCanClose?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    commentsCanOpen?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    comments?: Prisma.CommentUncheckedUpdateManyWithoutPostNestedInput;
};
export type PostUncheckedUpdateManyWithoutGroupInput = {
    id?: Prisma.IntFieldUpdateOperationsInput | number;
    ownerId?: Prisma.IntFieldUpdateOperationsInput | number;
    vkPostId?: Prisma.IntFieldUpdateOperationsInput | number;
    fromId?: Prisma.IntFieldUpdateOperationsInput | number;
    postedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    text?: Prisma.StringFieldUpdateOperationsInput | string;
    attachments?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    commentsCount?: Prisma.IntFieldUpdateOperationsInput | number;
    commentsCanPost?: Prisma.IntFieldUpdateOperationsInput | number;
    commentsGroupsCanPost?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    commentsCanClose?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    commentsCanOpen?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type PostCountOutputType = {
    comments: number;
};
export type PostCountOutputTypeSelect<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    comments?: boolean | PostCountOutputTypeCountCommentsArgs;
};
export type PostCountOutputTypeDefaultArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.PostCountOutputTypeSelect<ExtArgs> | null;
};
export type PostCountOutputTypeCountCommentsArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.CommentWhereInput;
};
export type PostSelect<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    ownerId?: boolean;
    vkPostId?: boolean;
    fromId?: boolean;
    postedAt?: boolean;
    text?: boolean;
    attachments?: boolean;
    commentsCount?: boolean;
    commentsCanPost?: boolean;
    commentsGroupsCanPost?: boolean;
    commentsCanClose?: boolean;
    commentsCanOpen?: boolean;
    createdAt?: boolean;
    updatedAt?: boolean;
    groupId?: boolean;
    group?: boolean | Prisma.Post$groupArgs<ExtArgs>;
    comments?: boolean | Prisma.Post$commentsArgs<ExtArgs>;
    _count?: boolean | Prisma.PostCountOutputTypeDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["post"]>;
export type PostSelectCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    ownerId?: boolean;
    vkPostId?: boolean;
    fromId?: boolean;
    postedAt?: boolean;
    text?: boolean;
    attachments?: boolean;
    commentsCount?: boolean;
    commentsCanPost?: boolean;
    commentsGroupsCanPost?: boolean;
    commentsCanClose?: boolean;
    commentsCanOpen?: boolean;
    createdAt?: boolean;
    updatedAt?: boolean;
    groupId?: boolean;
    group?: boolean | Prisma.Post$groupArgs<ExtArgs>;
}, ExtArgs["result"]["post"]>;
export type PostSelectUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    ownerId?: boolean;
    vkPostId?: boolean;
    fromId?: boolean;
    postedAt?: boolean;
    text?: boolean;
    attachments?: boolean;
    commentsCount?: boolean;
    commentsCanPost?: boolean;
    commentsGroupsCanPost?: boolean;
    commentsCanClose?: boolean;
    commentsCanOpen?: boolean;
    createdAt?: boolean;
    updatedAt?: boolean;
    groupId?: boolean;
    group?: boolean | Prisma.Post$groupArgs<ExtArgs>;
}, ExtArgs["result"]["post"]>;
export type PostSelectScalar = {
    id?: boolean;
    ownerId?: boolean;
    vkPostId?: boolean;
    fromId?: boolean;
    postedAt?: boolean;
    text?: boolean;
    attachments?: boolean;
    commentsCount?: boolean;
    commentsCanPost?: boolean;
    commentsGroupsCanPost?: boolean;
    commentsCanClose?: boolean;
    commentsCanOpen?: boolean;
    createdAt?: boolean;
    updatedAt?: boolean;
    groupId?: boolean;
};
export type PostOmit<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetOmit<"id" | "ownerId" | "vkPostId" | "fromId" | "postedAt" | "text" | "attachments" | "commentsCount" | "commentsCanPost" | "commentsGroupsCanPost" | "commentsCanClose" | "commentsCanOpen" | "createdAt" | "updatedAt" | "groupId", ExtArgs["result"]["post"]>;
export type PostInclude<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    group?: boolean | Prisma.Post$groupArgs<ExtArgs>;
    comments?: boolean | Prisma.Post$commentsArgs<ExtArgs>;
    _count?: boolean | Prisma.PostCountOutputTypeDefaultArgs<ExtArgs>;
};
export type PostIncludeCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    group?: boolean | Prisma.Post$groupArgs<ExtArgs>;
};
export type PostIncludeUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    group?: boolean | Prisma.Post$groupArgs<ExtArgs>;
};
export type $PostPayload<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    name: "Post";
    objects: {
        group: Prisma.$GroupPayload<ExtArgs> | null;
        comments: Prisma.$CommentPayload<ExtArgs>[];
    };
    scalars: runtime.Types.Extensions.GetPayloadResult<{
        id: number;
        ownerId: number;
        vkPostId: number;
        fromId: number;
        postedAt: Date;
        text: string;
        attachments: runtime.JsonValue | null;
        commentsCount: number;
        commentsCanPost: number;
        commentsGroupsCanPost: boolean;
        commentsCanClose: boolean;
        commentsCanOpen: boolean;
        createdAt: Date;
        updatedAt: Date;
        groupId: number | null;
    }, ExtArgs["result"]["post"]>;
    composites: {};
};
export type PostGetPayload<S extends boolean | null | undefined | PostDefaultArgs> = runtime.Types.Result.GetResult<Prisma.$PostPayload, S>;
export type PostCountArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = Omit<PostFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
    select?: PostCountAggregateInputType | true;
};
export interface PostDelegate<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: {
        types: Prisma.TypeMap<ExtArgs>['model']['Post'];
        meta: {
            name: 'Post';
        };
    };
    findUnique<T extends PostFindUniqueArgs>(args: Prisma.SelectSubset<T, PostFindUniqueArgs<ExtArgs>>): Prisma.Prisma__PostClient<runtime.Types.Result.GetResult<Prisma.$PostPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    findUniqueOrThrow<T extends PostFindUniqueOrThrowArgs>(args: Prisma.SelectSubset<T, PostFindUniqueOrThrowArgs<ExtArgs>>): Prisma.Prisma__PostClient<runtime.Types.Result.GetResult<Prisma.$PostPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    findFirst<T extends PostFindFirstArgs>(args?: Prisma.SelectSubset<T, PostFindFirstArgs<ExtArgs>>): Prisma.Prisma__PostClient<runtime.Types.Result.GetResult<Prisma.$PostPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    findFirstOrThrow<T extends PostFindFirstOrThrowArgs>(args?: Prisma.SelectSubset<T, PostFindFirstOrThrowArgs<ExtArgs>>): Prisma.Prisma__PostClient<runtime.Types.Result.GetResult<Prisma.$PostPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    findMany<T extends PostFindManyArgs>(args?: Prisma.SelectSubset<T, PostFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$PostPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>;
    create<T extends PostCreateArgs>(args: Prisma.SelectSubset<T, PostCreateArgs<ExtArgs>>): Prisma.Prisma__PostClient<runtime.Types.Result.GetResult<Prisma.$PostPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    createMany<T extends PostCreateManyArgs>(args?: Prisma.SelectSubset<T, PostCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    createManyAndReturn<T extends PostCreateManyAndReturnArgs>(args?: Prisma.SelectSubset<T, PostCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$PostPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>;
    delete<T extends PostDeleteArgs>(args: Prisma.SelectSubset<T, PostDeleteArgs<ExtArgs>>): Prisma.Prisma__PostClient<runtime.Types.Result.GetResult<Prisma.$PostPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    update<T extends PostUpdateArgs>(args: Prisma.SelectSubset<T, PostUpdateArgs<ExtArgs>>): Prisma.Prisma__PostClient<runtime.Types.Result.GetResult<Prisma.$PostPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    deleteMany<T extends PostDeleteManyArgs>(args?: Prisma.SelectSubset<T, PostDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    updateMany<T extends PostUpdateManyArgs>(args: Prisma.SelectSubset<T, PostUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    updateManyAndReturn<T extends PostUpdateManyAndReturnArgs>(args: Prisma.SelectSubset<T, PostUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$PostPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>;
    upsert<T extends PostUpsertArgs>(args: Prisma.SelectSubset<T, PostUpsertArgs<ExtArgs>>): Prisma.Prisma__PostClient<runtime.Types.Result.GetResult<Prisma.$PostPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    count<T extends PostCountArgs>(args?: Prisma.Subset<T, PostCountArgs>): Prisma.PrismaPromise<T extends runtime.Types.Utils.Record<'select', any> ? T['select'] extends true ? number : Prisma.GetScalarType<T['select'], PostCountAggregateOutputType> : number>;
    aggregate<T extends PostAggregateArgs>(args: Prisma.Subset<T, PostAggregateArgs>): Prisma.PrismaPromise<GetPostAggregateType<T>>;
    groupBy<T extends PostGroupByArgs, HasSelectOrTake extends Prisma.Or<Prisma.Extends<'skip', Prisma.Keys<T>>, Prisma.Extends<'take', Prisma.Keys<T>>>, OrderByArg extends Prisma.True extends HasSelectOrTake ? {
        orderBy: PostGroupByArgs['orderBy'];
    } : {
        orderBy?: PostGroupByArgs['orderBy'];
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
    }[OrderFields]>(args: Prisma.SubsetIntersection<T, PostGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetPostGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>;
    readonly fields: PostFieldRefs;
}
export interface Prisma__PostClient<T, Null = never, ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise";
    group<T extends Prisma.Post$groupArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.Post$groupArgs<ExtArgs>>): Prisma.Prisma__GroupClient<runtime.Types.Result.GetResult<Prisma.$GroupPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    comments<T extends Prisma.Post$commentsArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.Post$commentsArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$CommentPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>;
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): runtime.Types.Utils.JsPromise<TResult1 | TResult2>;
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): runtime.Types.Utils.JsPromise<T | TResult>;
    finally(onfinally?: (() => void) | undefined | null): runtime.Types.Utils.JsPromise<T>;
}
export interface PostFieldRefs {
    readonly id: Prisma.FieldRef<"Post", 'Int'>;
    readonly ownerId: Prisma.FieldRef<"Post", 'Int'>;
    readonly vkPostId: Prisma.FieldRef<"Post", 'Int'>;
    readonly fromId: Prisma.FieldRef<"Post", 'Int'>;
    readonly postedAt: Prisma.FieldRef<"Post", 'DateTime'>;
    readonly text: Prisma.FieldRef<"Post", 'String'>;
    readonly attachments: Prisma.FieldRef<"Post", 'Json'>;
    readonly commentsCount: Prisma.FieldRef<"Post", 'Int'>;
    readonly commentsCanPost: Prisma.FieldRef<"Post", 'Int'>;
    readonly commentsGroupsCanPost: Prisma.FieldRef<"Post", 'Boolean'>;
    readonly commentsCanClose: Prisma.FieldRef<"Post", 'Boolean'>;
    readonly commentsCanOpen: Prisma.FieldRef<"Post", 'Boolean'>;
    readonly createdAt: Prisma.FieldRef<"Post", 'DateTime'>;
    readonly updatedAt: Prisma.FieldRef<"Post", 'DateTime'>;
    readonly groupId: Prisma.FieldRef<"Post", 'Int'>;
}
export type PostFindUniqueArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.PostSelect<ExtArgs> | null;
    omit?: Prisma.PostOmit<ExtArgs> | null;
    include?: Prisma.PostInclude<ExtArgs> | null;
    where: Prisma.PostWhereUniqueInput;
};
export type PostFindUniqueOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.PostSelect<ExtArgs> | null;
    omit?: Prisma.PostOmit<ExtArgs> | null;
    include?: Prisma.PostInclude<ExtArgs> | null;
    where: Prisma.PostWhereUniqueInput;
};
export type PostFindFirstArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.PostSelect<ExtArgs> | null;
    omit?: Prisma.PostOmit<ExtArgs> | null;
    include?: Prisma.PostInclude<ExtArgs> | null;
    where?: Prisma.PostWhereInput;
    orderBy?: Prisma.PostOrderByWithRelationInput | Prisma.PostOrderByWithRelationInput[];
    cursor?: Prisma.PostWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.PostScalarFieldEnum | Prisma.PostScalarFieldEnum[];
};
export type PostFindFirstOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.PostSelect<ExtArgs> | null;
    omit?: Prisma.PostOmit<ExtArgs> | null;
    include?: Prisma.PostInclude<ExtArgs> | null;
    where?: Prisma.PostWhereInput;
    orderBy?: Prisma.PostOrderByWithRelationInput | Prisma.PostOrderByWithRelationInput[];
    cursor?: Prisma.PostWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.PostScalarFieldEnum | Prisma.PostScalarFieldEnum[];
};
export type PostFindManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.PostSelect<ExtArgs> | null;
    omit?: Prisma.PostOmit<ExtArgs> | null;
    include?: Prisma.PostInclude<ExtArgs> | null;
    where?: Prisma.PostWhereInput;
    orderBy?: Prisma.PostOrderByWithRelationInput | Prisma.PostOrderByWithRelationInput[];
    cursor?: Prisma.PostWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.PostScalarFieldEnum | Prisma.PostScalarFieldEnum[];
};
export type PostCreateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.PostSelect<ExtArgs> | null;
    omit?: Prisma.PostOmit<ExtArgs> | null;
    include?: Prisma.PostInclude<ExtArgs> | null;
    data: Prisma.XOR<Prisma.PostCreateInput, Prisma.PostUncheckedCreateInput>;
};
export type PostCreateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    data: Prisma.PostCreateManyInput | Prisma.PostCreateManyInput[];
    skipDuplicates?: boolean;
};
export type PostCreateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.PostSelectCreateManyAndReturn<ExtArgs> | null;
    omit?: Prisma.PostOmit<ExtArgs> | null;
    data: Prisma.PostCreateManyInput | Prisma.PostCreateManyInput[];
    skipDuplicates?: boolean;
    include?: Prisma.PostIncludeCreateManyAndReturn<ExtArgs> | null;
};
export type PostUpdateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.PostSelect<ExtArgs> | null;
    omit?: Prisma.PostOmit<ExtArgs> | null;
    include?: Prisma.PostInclude<ExtArgs> | null;
    data: Prisma.XOR<Prisma.PostUpdateInput, Prisma.PostUncheckedUpdateInput>;
    where: Prisma.PostWhereUniqueInput;
};
export type PostUpdateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    data: Prisma.XOR<Prisma.PostUpdateManyMutationInput, Prisma.PostUncheckedUpdateManyInput>;
    where?: Prisma.PostWhereInput;
    limit?: number;
};
export type PostUpdateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.PostSelectUpdateManyAndReturn<ExtArgs> | null;
    omit?: Prisma.PostOmit<ExtArgs> | null;
    data: Prisma.XOR<Prisma.PostUpdateManyMutationInput, Prisma.PostUncheckedUpdateManyInput>;
    where?: Prisma.PostWhereInput;
    limit?: number;
    include?: Prisma.PostIncludeUpdateManyAndReturn<ExtArgs> | null;
};
export type PostUpsertArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.PostSelect<ExtArgs> | null;
    omit?: Prisma.PostOmit<ExtArgs> | null;
    include?: Prisma.PostInclude<ExtArgs> | null;
    where: Prisma.PostWhereUniqueInput;
    create: Prisma.XOR<Prisma.PostCreateInput, Prisma.PostUncheckedCreateInput>;
    update: Prisma.XOR<Prisma.PostUpdateInput, Prisma.PostUncheckedUpdateInput>;
};
export type PostDeleteArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.PostSelect<ExtArgs> | null;
    omit?: Prisma.PostOmit<ExtArgs> | null;
    include?: Prisma.PostInclude<ExtArgs> | null;
    where: Prisma.PostWhereUniqueInput;
};
export type PostDeleteManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.PostWhereInput;
    limit?: number;
};
export type Post$groupArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.GroupSelect<ExtArgs> | null;
    omit?: Prisma.GroupOmit<ExtArgs> | null;
    include?: Prisma.GroupInclude<ExtArgs> | null;
    where?: Prisma.GroupWhereInput;
};
export type Post$commentsArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
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
export type PostDefaultArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.PostSelect<ExtArgs> | null;
    omit?: Prisma.PostOmit<ExtArgs> | null;
    include?: Prisma.PostInclude<ExtArgs> | null;
};
export {};
