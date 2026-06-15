export class AuthorCardDto {
    id;
    vkUserId;
    firstName;
    lastName;
    fullName;
    photo50;
    photo100;
    photo200;
    domain;
    screenName;
    profileUrl;
    city;
    summary;
    photosCount;
    audiosCount;
    videosCount;
    friendsCount;
    followersCount;
    lastSeenAt;
    verifiedAt;
    isVerified;
}
export class AuthorDetailsDto extends AuthorCardDto {
    country;
    createdAt;
    updatedAt;
}
export class AuthorListDto {
    items;
    total;
    hasMore;
}
//# sourceMappingURL=author.dto.js.map