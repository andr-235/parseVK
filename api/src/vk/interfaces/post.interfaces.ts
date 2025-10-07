export interface IPost {
    id: number;
    owner_id: number;
    from_id: number;
    date: number;
    text: string;
    comments: {
        count: number;
        can_post: number;
        groups_can_post: boolean;
        can_close: boolean;
        can_open: boolean;
    };
}