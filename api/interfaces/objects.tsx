export interface User {
    id: string;
    username: string;
    profile_image: string;
    coins: number;
    created_at: string;
    public: boolean;
};

export interface UserProfile extends User {
    is_following: boolean;
    has_requested: boolean;
    follower_count: number;
    following_count: number;
    owner: boolean;
    created: Event[];
    participated: Event[];
    requests: SearchUser[];
};

export interface Event{
    id: string;
    expire_date: string;
    title: string;
    description: string;
    locked: boolean;
    decided: boolean;
    thumbnail: string;
    creator_username: string;
    is_creator: boolean;
    participants_count: number;
    total_pot: number;
};

export type SearchObject = SearchUser | SearchTemplate | SearchEvent;

export interface SearchUser extends User{
    id: string;
    is_following?: boolean;
    has_requested?: boolean;
    requester?: boolean;
    onPress: () => void;
};

export interface SearchTemplate{
    id: string;
    onPress: () => void;
    title: string;
    description: string;
    thumbnail: string;
    type: string;
    creator_username: string;
};

export interface SearchEvent extends Event {
    id: string;
    onPress: () => void;
};


