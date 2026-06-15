import type * as runtime from "@prisma/client/runtime/client";
import type * as Prisma from "../internal/prismaNamespace.js";
export type userModel = runtime.Types.Result.DefaultSelection<Prisma.$userPayload>;
export type AggregateUser = {
    _count: UserCountAggregateOutputType | null;
    _avg: UserAvgAggregateOutputType | null;
    _sum: UserSumAggregateOutputType | null;
    _min: UserMinAggregateOutputType | null;
    _max: UserMaxAggregateOutputType | null;
};
export type UserAvgAggregateOutputType = {
    id: number | null;
    user_id: number | null;
};
export type UserSumAggregateOutputType = {
    id: bigint | null;
    user_id: bigint | null;
};
export type UserMinAggregateOutputType = {
    id: bigint | null;
    user_id: bigint | null;
    bot: boolean | null;
    scam: boolean | null;
    premium: boolean | null;
    first_name: string | null;
    last_name: string | null;
    username: string | null;
    phone: string | null;
    upd_date: Date | null;
};
export type UserMaxAggregateOutputType = {
    id: bigint | null;
    user_id: bigint | null;
    bot: boolean | null;
    scam: boolean | null;
    premium: boolean | null;
    first_name: string | null;
    last_name: string | null;
    username: string | null;
    phone: string | null;
    upd_date: Date | null;
};
export type UserCountAggregateOutputType = {
    id: number;
    user_id: number;
    bot: number;
    scam: number;
    premium: number;
    first_name: number;
    last_name: number;
    username: number;
    phone: number;
    upd_date: number;
    _all: number;
};
export type UserAvgAggregateInputType = {
    id?: true;
    user_id?: true;
};
export type UserSumAggregateInputType = {
    id?: true;
    user_id?: true;
};
export type UserMinAggregateInputType = {
    id?: true;
    user_id?: true;
    bot?: true;
    scam?: true;
    premium?: true;
    first_name?: true;
    last_name?: true;
    username?: true;
    phone?: true;
    upd_date?: true;
};
export type UserMaxAggregateInputType = {
    id?: true;
    user_id?: true;
    bot?: true;
    scam?: true;
    premium?: true;
    first_name?: true;
    last_name?: true;
    username?: true;
    phone?: true;
    upd_date?: true;
};
export type UserCountAggregateInputType = {
    id?: true;
    user_id?: true;
    bot?: true;
    scam?: true;
    premium?: true;
    first_name?: true;
    last_name?: true;
    username?: true;
    phone?: true;
    upd_date?: true;
    _all?: true;
};
export type UserAggregateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.userWhereInput;
    orderBy?: Prisma.userOrderByWithRelationInput | Prisma.userOrderByWithRelationInput[];
    cursor?: Prisma.userWhereUniqueInput;
    take?: number;
    skip?: number;
    _count?: true | UserCountAggregateInputType;
    _avg?: UserAvgAggregateInputType;
    _sum?: UserSumAggregateInputType;
    _min?: UserMinAggregateInputType;
    _max?: UserMaxAggregateInputType;
};
export type GetUserAggregateType<T extends UserAggregateArgs> = {
    [P in keyof T & keyof AggregateUser]: P extends '_count' | 'count' ? T[P] extends true ? number : Prisma.GetScalarType<T[P], AggregateUser[P]> : Prisma.GetScalarType<T[P], AggregateUser[P]>;
};
export type userGroupByArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.userWhereInput;
    orderBy?: Prisma.userOrderByWithAggregationInput | Prisma.userOrderByWithAggregationInput[];
    by: Prisma.UserScalarFieldEnum[] | Prisma.UserScalarFieldEnum;
    having?: Prisma.userScalarWhereWithAggregatesInput;
    take?: number;
    skip?: number;
    _count?: UserCountAggregateInputType | true;
    _avg?: UserAvgAggregateInputType;
    _sum?: UserSumAggregateInputType;
    _min?: UserMinAggregateInputType;
    _max?: UserMaxAggregateInputType;
};
export type UserGroupByOutputType = {
    id: bigint;
    user_id: bigint;
    bot: boolean;
    scam: boolean;
    premium: boolean;
    first_name: string | null;
    last_name: string | null;
    username: string | null;
    phone: string | null;
    upd_date: Date | null;
    _count: UserCountAggregateOutputType | null;
    _avg: UserAvgAggregateOutputType | null;
    _sum: UserSumAggregateOutputType | null;
    _min: UserMinAggregateOutputType | null;
    _max: UserMaxAggregateOutputType | null;
};
type GetUserGroupByPayload<T extends userGroupByArgs> = Prisma.PrismaPromise<Array<Prisma.PickEnumerable<UserGroupByOutputType, T['by']> & {
    [P in ((keyof T) & (keyof UserGroupByOutputType))]: P extends '_count' ? T[P] extends boolean ? number : Prisma.GetScalarType<T[P], UserGroupByOutputType[P]> : Prisma.GetScalarType<T[P], UserGroupByOutputType[P]>;
}>>;
export type userWhereInput = {
    AND?: Prisma.userWhereInput | Prisma.userWhereInput[];
    OR?: Prisma.userWhereInput[];
    NOT?: Prisma.userWhereInput | Prisma.userWhereInput[];
    id?: Prisma.BigIntFilter<"user"> | bigint | number;
    user_id?: Prisma.BigIntFilter<"user"> | bigint | number;
    bot?: Prisma.BoolFilter<"user"> | boolean;
    scam?: Prisma.BoolFilter<"user"> | boolean;
    premium?: Prisma.BoolFilter<"user"> | boolean;
    first_name?: Prisma.StringNullableFilter<"user"> | string | null;
    last_name?: Prisma.StringNullableFilter<"user"> | string | null;
    username?: Prisma.StringNullableFilter<"user"> | string | null;
    phone?: Prisma.StringNullableFilter<"user"> | string | null;
    upd_date?: Prisma.DateTimeNullableFilter<"user"> | Date | string | null;
    dlMatches?: Prisma.DlMatchResultListRelationFilter;
};
export type userOrderByWithRelationInput = {
    id?: Prisma.SortOrder;
    user_id?: Prisma.SortOrder;
    bot?: Prisma.SortOrder;
    scam?: Prisma.SortOrder;
    premium?: Prisma.SortOrder;
    first_name?: Prisma.SortOrderInput | Prisma.SortOrder;
    last_name?: Prisma.SortOrderInput | Prisma.SortOrder;
    username?: Prisma.SortOrderInput | Prisma.SortOrder;
    phone?: Prisma.SortOrderInput | Prisma.SortOrder;
    upd_date?: Prisma.SortOrderInput | Prisma.SortOrder;
    dlMatches?: Prisma.DlMatchResultOrderByRelationAggregateInput;
};
export type userWhereUniqueInput = Prisma.AtLeast<{
    id?: bigint | number;
    user_id?: bigint | number;
    AND?: Prisma.userWhereInput | Prisma.userWhereInput[];
    OR?: Prisma.userWhereInput[];
    NOT?: Prisma.userWhereInput | Prisma.userWhereInput[];
    bot?: Prisma.BoolFilter<"user"> | boolean;
    scam?: Prisma.BoolFilter<"user"> | boolean;
    premium?: Prisma.BoolFilter<"user"> | boolean;
    first_name?: Prisma.StringNullableFilter<"user"> | string | null;
    last_name?: Prisma.StringNullableFilter<"user"> | string | null;
    username?: Prisma.StringNullableFilter<"user"> | string | null;
    phone?: Prisma.StringNullableFilter<"user"> | string | null;
    upd_date?: Prisma.DateTimeNullableFilter<"user"> | Date | string | null;
    dlMatches?: Prisma.DlMatchResultListRelationFilter;
}, "id" | "user_id">;
export type userOrderByWithAggregationInput = {
    id?: Prisma.SortOrder;
    user_id?: Prisma.SortOrder;
    bot?: Prisma.SortOrder;
    scam?: Prisma.SortOrder;
    premium?: Prisma.SortOrder;
    first_name?: Prisma.SortOrderInput | Prisma.SortOrder;
    last_name?: Prisma.SortOrderInput | Prisma.SortOrder;
    username?: Prisma.SortOrderInput | Prisma.SortOrder;
    phone?: Prisma.SortOrderInput | Prisma.SortOrder;
    upd_date?: Prisma.SortOrderInput | Prisma.SortOrder;
    _count?: Prisma.userCountOrderByAggregateInput;
    _avg?: Prisma.userAvgOrderByAggregateInput;
    _max?: Prisma.userMaxOrderByAggregateInput;
    _min?: Prisma.userMinOrderByAggregateInput;
    _sum?: Prisma.userSumOrderByAggregateInput;
};
export type userScalarWhereWithAggregatesInput = {
    AND?: Prisma.userScalarWhereWithAggregatesInput | Prisma.userScalarWhereWithAggregatesInput[];
    OR?: Prisma.userScalarWhereWithAggregatesInput[];
    NOT?: Prisma.userScalarWhereWithAggregatesInput | Prisma.userScalarWhereWithAggregatesInput[];
    id?: Prisma.BigIntWithAggregatesFilter<"user"> | bigint | number;
    user_id?: Prisma.BigIntWithAggregatesFilter<"user"> | bigint | number;
    bot?: Prisma.BoolWithAggregatesFilter<"user"> | boolean;
    scam?: Prisma.BoolWithAggregatesFilter<"user"> | boolean;
    premium?: Prisma.BoolWithAggregatesFilter<"user"> | boolean;
    first_name?: Prisma.StringNullableWithAggregatesFilter<"user"> | string | null;
    last_name?: Prisma.StringNullableWithAggregatesFilter<"user"> | string | null;
    username?: Prisma.StringNullableWithAggregatesFilter<"user"> | string | null;
    phone?: Prisma.StringNullableWithAggregatesFilter<"user"> | string | null;
    upd_date?: Prisma.DateTimeNullableWithAggregatesFilter<"user"> | Date | string | null;
};
export type userCreateInput = {
    id?: bigint | number;
    user_id: bigint | number;
    bot?: boolean;
    scam?: boolean;
    premium?: boolean;
    first_name?: string | null;
    last_name?: string | null;
    username?: string | null;
    phone?: string | null;
    upd_date?: Date | string | null;
    dlMatches?: Prisma.DlMatchResultCreateNestedManyWithoutTgmbaseUserInput;
};
export type userUncheckedCreateInput = {
    id?: bigint | number;
    user_id: bigint | number;
    bot?: boolean;
    scam?: boolean;
    premium?: boolean;
    first_name?: string | null;
    last_name?: string | null;
    username?: string | null;
    phone?: string | null;
    upd_date?: Date | string | null;
    dlMatches?: Prisma.DlMatchResultUncheckedCreateNestedManyWithoutTgmbaseUserInput;
};
export type userUpdateInput = {
    id?: Prisma.BigIntFieldUpdateOperationsInput | bigint | number;
    user_id?: Prisma.BigIntFieldUpdateOperationsInput | bigint | number;
    bot?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    scam?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    premium?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    first_name?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    last_name?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    username?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    phone?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    upd_date?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    dlMatches?: Prisma.DlMatchResultUpdateManyWithoutTgmbaseUserNestedInput;
};
export type userUncheckedUpdateInput = {
    id?: Prisma.BigIntFieldUpdateOperationsInput | bigint | number;
    user_id?: Prisma.BigIntFieldUpdateOperationsInput | bigint | number;
    bot?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    scam?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    premium?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    first_name?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    last_name?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    username?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    phone?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    upd_date?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    dlMatches?: Prisma.DlMatchResultUncheckedUpdateManyWithoutTgmbaseUserNestedInput;
};
export type userCreateManyInput = {
    id?: bigint | number;
    user_id: bigint | number;
    bot?: boolean;
    scam?: boolean;
    premium?: boolean;
    first_name?: string | null;
    last_name?: string | null;
    username?: string | null;
    phone?: string | null;
    upd_date?: Date | string | null;
};
export type userUpdateManyMutationInput = {
    id?: Prisma.BigIntFieldUpdateOperationsInput | bigint | number;
    user_id?: Prisma.BigIntFieldUpdateOperationsInput | bigint | number;
    bot?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    scam?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    premium?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    first_name?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    last_name?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    username?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    phone?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    upd_date?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
};
export type userUncheckedUpdateManyInput = {
    id?: Prisma.BigIntFieldUpdateOperationsInput | bigint | number;
    user_id?: Prisma.BigIntFieldUpdateOperationsInput | bigint | number;
    bot?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    scam?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    premium?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    first_name?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    last_name?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    username?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    phone?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    upd_date?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
};
export type userCountOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    user_id?: Prisma.SortOrder;
    bot?: Prisma.SortOrder;
    scam?: Prisma.SortOrder;
    premium?: Prisma.SortOrder;
    first_name?: Prisma.SortOrder;
    last_name?: Prisma.SortOrder;
    username?: Prisma.SortOrder;
    phone?: Prisma.SortOrder;
    upd_date?: Prisma.SortOrder;
};
export type userAvgOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    user_id?: Prisma.SortOrder;
};
export type userMaxOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    user_id?: Prisma.SortOrder;
    bot?: Prisma.SortOrder;
    scam?: Prisma.SortOrder;
    premium?: Prisma.SortOrder;
    first_name?: Prisma.SortOrder;
    last_name?: Prisma.SortOrder;
    username?: Prisma.SortOrder;
    phone?: Prisma.SortOrder;
    upd_date?: Prisma.SortOrder;
};
export type userMinOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    user_id?: Prisma.SortOrder;
    bot?: Prisma.SortOrder;
    scam?: Prisma.SortOrder;
    premium?: Prisma.SortOrder;
    first_name?: Prisma.SortOrder;
    last_name?: Prisma.SortOrder;
    username?: Prisma.SortOrder;
    phone?: Prisma.SortOrder;
    upd_date?: Prisma.SortOrder;
};
export type userSumOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    user_id?: Prisma.SortOrder;
};
export type UserNullableScalarRelationFilter = {
    is?: Prisma.userWhereInput | null;
    isNot?: Prisma.userWhereInput | null;
};
export type userCreateNestedOneWithoutDlMatchesInput = {
    create?: Prisma.XOR<Prisma.userCreateWithoutDlMatchesInput, Prisma.userUncheckedCreateWithoutDlMatchesInput>;
    connectOrCreate?: Prisma.userCreateOrConnectWithoutDlMatchesInput;
    connect?: Prisma.userWhereUniqueInput;
};
export type userUpdateOneWithoutDlMatchesNestedInput = {
    create?: Prisma.XOR<Prisma.userCreateWithoutDlMatchesInput, Prisma.userUncheckedCreateWithoutDlMatchesInput>;
    connectOrCreate?: Prisma.userCreateOrConnectWithoutDlMatchesInput;
    upsert?: Prisma.userUpsertWithoutDlMatchesInput;
    disconnect?: Prisma.userWhereInput | boolean;
    delete?: Prisma.userWhereInput | boolean;
    connect?: Prisma.userWhereUniqueInput;
    update?: Prisma.XOR<Prisma.XOR<Prisma.userUpdateToOneWithWhereWithoutDlMatchesInput, Prisma.userUpdateWithoutDlMatchesInput>, Prisma.userUncheckedUpdateWithoutDlMatchesInput>;
};
export type userCreateWithoutDlMatchesInput = {
    id?: bigint | number;
    user_id: bigint | number;
    bot?: boolean;
    scam?: boolean;
    premium?: boolean;
    first_name?: string | null;
    last_name?: string | null;
    username?: string | null;
    phone?: string | null;
    upd_date?: Date | string | null;
};
export type userUncheckedCreateWithoutDlMatchesInput = {
    id?: bigint | number;
    user_id: bigint | number;
    bot?: boolean;
    scam?: boolean;
    premium?: boolean;
    first_name?: string | null;
    last_name?: string | null;
    username?: string | null;
    phone?: string | null;
    upd_date?: Date | string | null;
};
export type userCreateOrConnectWithoutDlMatchesInput = {
    where: Prisma.userWhereUniqueInput;
    create: Prisma.XOR<Prisma.userCreateWithoutDlMatchesInput, Prisma.userUncheckedCreateWithoutDlMatchesInput>;
};
export type userUpsertWithoutDlMatchesInput = {
    update: Prisma.XOR<Prisma.userUpdateWithoutDlMatchesInput, Prisma.userUncheckedUpdateWithoutDlMatchesInput>;
    create: Prisma.XOR<Prisma.userCreateWithoutDlMatchesInput, Prisma.userUncheckedCreateWithoutDlMatchesInput>;
    where?: Prisma.userWhereInput;
};
export type userUpdateToOneWithWhereWithoutDlMatchesInput = {
    where?: Prisma.userWhereInput;
    data: Prisma.XOR<Prisma.userUpdateWithoutDlMatchesInput, Prisma.userUncheckedUpdateWithoutDlMatchesInput>;
};
export type userUpdateWithoutDlMatchesInput = {
    id?: Prisma.BigIntFieldUpdateOperationsInput | bigint | number;
    user_id?: Prisma.BigIntFieldUpdateOperationsInput | bigint | number;
    bot?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    scam?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    premium?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    first_name?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    last_name?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    username?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    phone?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    upd_date?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
};
export type userUncheckedUpdateWithoutDlMatchesInput = {
    id?: Prisma.BigIntFieldUpdateOperationsInput | bigint | number;
    user_id?: Prisma.BigIntFieldUpdateOperationsInput | bigint | number;
    bot?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    scam?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    premium?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    first_name?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    last_name?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    username?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    phone?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    upd_date?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
};
export type UserCountOutputType = {
    dlMatches: number;
};
export type UserCountOutputTypeSelect<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    dlMatches?: boolean | UserCountOutputTypeCountDlMatchesArgs;
};
export type UserCountOutputTypeDefaultArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.UserCountOutputTypeSelect<ExtArgs> | null;
};
export type UserCountOutputTypeCountDlMatchesArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.DlMatchResultWhereInput;
};
export type userSelect<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    user_id?: boolean;
    bot?: boolean;
    scam?: boolean;
    premium?: boolean;
    first_name?: boolean;
    last_name?: boolean;
    username?: boolean;
    phone?: boolean;
    upd_date?: boolean;
    dlMatches?: boolean | Prisma.user$dlMatchesArgs<ExtArgs>;
    _count?: boolean | Prisma.UserCountOutputTypeDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["user"]>;
export type userSelectCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    user_id?: boolean;
    bot?: boolean;
    scam?: boolean;
    premium?: boolean;
    first_name?: boolean;
    last_name?: boolean;
    username?: boolean;
    phone?: boolean;
    upd_date?: boolean;
}, ExtArgs["result"]["user"]>;
export type userSelectUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    user_id?: boolean;
    bot?: boolean;
    scam?: boolean;
    premium?: boolean;
    first_name?: boolean;
    last_name?: boolean;
    username?: boolean;
    phone?: boolean;
    upd_date?: boolean;
}, ExtArgs["result"]["user"]>;
export type userSelectScalar = {
    id?: boolean;
    user_id?: boolean;
    bot?: boolean;
    scam?: boolean;
    premium?: boolean;
    first_name?: boolean;
    last_name?: boolean;
    username?: boolean;
    phone?: boolean;
    upd_date?: boolean;
};
export type userOmit<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetOmit<"id" | "user_id" | "bot" | "scam" | "premium" | "first_name" | "last_name" | "username" | "phone" | "upd_date", ExtArgs["result"]["user"]>;
export type userInclude<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    dlMatches?: boolean | Prisma.user$dlMatchesArgs<ExtArgs>;
    _count?: boolean | Prisma.UserCountOutputTypeDefaultArgs<ExtArgs>;
};
export type userIncludeCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {};
export type userIncludeUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {};
export type $userPayload<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    name: "user";
    objects: {
        dlMatches: Prisma.$DlMatchResultPayload<ExtArgs>[];
    };
    scalars: runtime.Types.Extensions.GetPayloadResult<{
        id: bigint;
        user_id: bigint;
        bot: boolean;
        scam: boolean;
        premium: boolean;
        first_name: string | null;
        last_name: string | null;
        username: string | null;
        phone: string | null;
        upd_date: Date | null;
    }, ExtArgs["result"]["user"]>;
    composites: {};
};
export type userGetPayload<S extends boolean | null | undefined | userDefaultArgs> = runtime.Types.Result.GetResult<Prisma.$userPayload, S>;
export type userCountArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = Omit<userFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
    select?: UserCountAggregateInputType | true;
};
export interface userDelegate<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: {
        types: Prisma.TypeMap<ExtArgs>['model']['user'];
        meta: {
            name: 'user';
        };
    };
    findUnique<T extends userFindUniqueArgs>(args: Prisma.SelectSubset<T, userFindUniqueArgs<ExtArgs>>): Prisma.Prisma__userClient<runtime.Types.Result.GetResult<Prisma.$userPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    findUniqueOrThrow<T extends userFindUniqueOrThrowArgs>(args: Prisma.SelectSubset<T, userFindUniqueOrThrowArgs<ExtArgs>>): Prisma.Prisma__userClient<runtime.Types.Result.GetResult<Prisma.$userPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    findFirst<T extends userFindFirstArgs>(args?: Prisma.SelectSubset<T, userFindFirstArgs<ExtArgs>>): Prisma.Prisma__userClient<runtime.Types.Result.GetResult<Prisma.$userPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    findFirstOrThrow<T extends userFindFirstOrThrowArgs>(args?: Prisma.SelectSubset<T, userFindFirstOrThrowArgs<ExtArgs>>): Prisma.Prisma__userClient<runtime.Types.Result.GetResult<Prisma.$userPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    findMany<T extends userFindManyArgs>(args?: Prisma.SelectSubset<T, userFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$userPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>;
    create<T extends userCreateArgs>(args: Prisma.SelectSubset<T, userCreateArgs<ExtArgs>>): Prisma.Prisma__userClient<runtime.Types.Result.GetResult<Prisma.$userPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    createMany<T extends userCreateManyArgs>(args?: Prisma.SelectSubset<T, userCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    createManyAndReturn<T extends userCreateManyAndReturnArgs>(args?: Prisma.SelectSubset<T, userCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$userPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>;
    delete<T extends userDeleteArgs>(args: Prisma.SelectSubset<T, userDeleteArgs<ExtArgs>>): Prisma.Prisma__userClient<runtime.Types.Result.GetResult<Prisma.$userPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    update<T extends userUpdateArgs>(args: Prisma.SelectSubset<T, userUpdateArgs<ExtArgs>>): Prisma.Prisma__userClient<runtime.Types.Result.GetResult<Prisma.$userPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    deleteMany<T extends userDeleteManyArgs>(args?: Prisma.SelectSubset<T, userDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    updateMany<T extends userUpdateManyArgs>(args: Prisma.SelectSubset<T, userUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    updateManyAndReturn<T extends userUpdateManyAndReturnArgs>(args: Prisma.SelectSubset<T, userUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$userPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>;
    upsert<T extends userUpsertArgs>(args: Prisma.SelectSubset<T, userUpsertArgs<ExtArgs>>): Prisma.Prisma__userClient<runtime.Types.Result.GetResult<Prisma.$userPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    count<T extends userCountArgs>(args?: Prisma.Subset<T, userCountArgs>): Prisma.PrismaPromise<T extends runtime.Types.Utils.Record<'select', any> ? T['select'] extends true ? number : Prisma.GetScalarType<T['select'], UserCountAggregateOutputType> : number>;
    aggregate<T extends UserAggregateArgs>(args: Prisma.Subset<T, UserAggregateArgs>): Prisma.PrismaPromise<GetUserAggregateType<T>>;
    groupBy<T extends userGroupByArgs, HasSelectOrTake extends Prisma.Or<Prisma.Extends<'skip', Prisma.Keys<T>>, Prisma.Extends<'take', Prisma.Keys<T>>>, OrderByArg extends Prisma.True extends HasSelectOrTake ? {
        orderBy: userGroupByArgs['orderBy'];
    } : {
        orderBy?: userGroupByArgs['orderBy'];
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
    }[OrderFields]>(args: Prisma.SubsetIntersection<T, userGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetUserGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>;
    readonly fields: userFieldRefs;
}
export interface Prisma__userClient<T, Null = never, ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise";
    dlMatches<T extends Prisma.user$dlMatchesArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.user$dlMatchesArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$DlMatchResultPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>;
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): runtime.Types.Utils.JsPromise<TResult1 | TResult2>;
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): runtime.Types.Utils.JsPromise<T | TResult>;
    finally(onfinally?: (() => void) | undefined | null): runtime.Types.Utils.JsPromise<T>;
}
export interface userFieldRefs {
    readonly id: Prisma.FieldRef<"user", 'BigInt'>;
    readonly user_id: Prisma.FieldRef<"user", 'BigInt'>;
    readonly bot: Prisma.FieldRef<"user", 'Boolean'>;
    readonly scam: Prisma.FieldRef<"user", 'Boolean'>;
    readonly premium: Prisma.FieldRef<"user", 'Boolean'>;
    readonly first_name: Prisma.FieldRef<"user", 'String'>;
    readonly last_name: Prisma.FieldRef<"user", 'String'>;
    readonly username: Prisma.FieldRef<"user", 'String'>;
    readonly phone: Prisma.FieldRef<"user", 'String'>;
    readonly upd_date: Prisma.FieldRef<"user", 'DateTime'>;
}
export type userFindUniqueArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.userSelect<ExtArgs> | null;
    omit?: Prisma.userOmit<ExtArgs> | null;
    include?: Prisma.userInclude<ExtArgs> | null;
    where: Prisma.userWhereUniqueInput;
};
export type userFindUniqueOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.userSelect<ExtArgs> | null;
    omit?: Prisma.userOmit<ExtArgs> | null;
    include?: Prisma.userInclude<ExtArgs> | null;
    where: Prisma.userWhereUniqueInput;
};
export type userFindFirstArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.userSelect<ExtArgs> | null;
    omit?: Prisma.userOmit<ExtArgs> | null;
    include?: Prisma.userInclude<ExtArgs> | null;
    where?: Prisma.userWhereInput;
    orderBy?: Prisma.userOrderByWithRelationInput | Prisma.userOrderByWithRelationInput[];
    cursor?: Prisma.userWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.UserScalarFieldEnum | Prisma.UserScalarFieldEnum[];
};
export type userFindFirstOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.userSelect<ExtArgs> | null;
    omit?: Prisma.userOmit<ExtArgs> | null;
    include?: Prisma.userInclude<ExtArgs> | null;
    where?: Prisma.userWhereInput;
    orderBy?: Prisma.userOrderByWithRelationInput | Prisma.userOrderByWithRelationInput[];
    cursor?: Prisma.userWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.UserScalarFieldEnum | Prisma.UserScalarFieldEnum[];
};
export type userFindManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.userSelect<ExtArgs> | null;
    omit?: Prisma.userOmit<ExtArgs> | null;
    include?: Prisma.userInclude<ExtArgs> | null;
    where?: Prisma.userWhereInput;
    orderBy?: Prisma.userOrderByWithRelationInput | Prisma.userOrderByWithRelationInput[];
    cursor?: Prisma.userWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.UserScalarFieldEnum | Prisma.UserScalarFieldEnum[];
};
export type userCreateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.userSelect<ExtArgs> | null;
    omit?: Prisma.userOmit<ExtArgs> | null;
    include?: Prisma.userInclude<ExtArgs> | null;
    data: Prisma.XOR<Prisma.userCreateInput, Prisma.userUncheckedCreateInput>;
};
export type userCreateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    data: Prisma.userCreateManyInput | Prisma.userCreateManyInput[];
    skipDuplicates?: boolean;
};
export type userCreateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.userSelectCreateManyAndReturn<ExtArgs> | null;
    omit?: Prisma.userOmit<ExtArgs> | null;
    data: Prisma.userCreateManyInput | Prisma.userCreateManyInput[];
    skipDuplicates?: boolean;
};
export type userUpdateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.userSelect<ExtArgs> | null;
    omit?: Prisma.userOmit<ExtArgs> | null;
    include?: Prisma.userInclude<ExtArgs> | null;
    data: Prisma.XOR<Prisma.userUpdateInput, Prisma.userUncheckedUpdateInput>;
    where: Prisma.userWhereUniqueInput;
};
export type userUpdateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    data: Prisma.XOR<Prisma.userUpdateManyMutationInput, Prisma.userUncheckedUpdateManyInput>;
    where?: Prisma.userWhereInput;
    limit?: number;
};
export type userUpdateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.userSelectUpdateManyAndReturn<ExtArgs> | null;
    omit?: Prisma.userOmit<ExtArgs> | null;
    data: Prisma.XOR<Prisma.userUpdateManyMutationInput, Prisma.userUncheckedUpdateManyInput>;
    where?: Prisma.userWhereInput;
    limit?: number;
};
export type userUpsertArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.userSelect<ExtArgs> | null;
    omit?: Prisma.userOmit<ExtArgs> | null;
    include?: Prisma.userInclude<ExtArgs> | null;
    where: Prisma.userWhereUniqueInput;
    create: Prisma.XOR<Prisma.userCreateInput, Prisma.userUncheckedCreateInput>;
    update: Prisma.XOR<Prisma.userUpdateInput, Prisma.userUncheckedUpdateInput>;
};
export type userDeleteArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.userSelect<ExtArgs> | null;
    omit?: Prisma.userOmit<ExtArgs> | null;
    include?: Prisma.userInclude<ExtArgs> | null;
    where: Prisma.userWhereUniqueInput;
};
export type userDeleteManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.userWhereInput;
    limit?: number;
};
export type user$dlMatchesArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.DlMatchResultSelect<ExtArgs> | null;
    omit?: Prisma.DlMatchResultOmit<ExtArgs> | null;
    include?: Prisma.DlMatchResultInclude<ExtArgs> | null;
    where?: Prisma.DlMatchResultWhereInput;
    orderBy?: Prisma.DlMatchResultOrderByWithRelationInput | Prisma.DlMatchResultOrderByWithRelationInput[];
    cursor?: Prisma.DlMatchResultWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.DlMatchResultScalarFieldEnum | Prisma.DlMatchResultScalarFieldEnum[];
};
export type userDefaultArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.userSelect<ExtArgs> | null;
    omit?: Prisma.userOmit<ExtArgs> | null;
    include?: Prisma.userInclude<ExtArgs> | null;
};
export {};
