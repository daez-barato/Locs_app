export interface User {
    id: string;
    username: string;
    avatar_url: string;
    coins: number;
    created_at: string;
    public: boolean;
};

export function User(data: any): User {
    return {
        id: data.id,
        username: data.username,
        avatar_url: data.avatar_url,
        coins: data.coins,
        created_at: data.created_at,
        public: data.public,
    };
}

export interface UserProfile extends User {
    is_following: boolean;
    has_requested: boolean;
    follower_count: number;
    following_count: number;
    owner: boolean;
    created: number;
    participated: number;
    requests: number;
};

export function UserProfile(data: any): UserProfile {
    return {
        ...User(data),
        is_following: data.is_following,
        has_requested: data.has_requested,
        follower_count: data.followers,
        following_count: data.following,
        owner: data.owner,
        created: data.events,
        participated: data.participated,
        requests: data.follow_requests,
    };
}

export interface Event{
    id: string;
    template_id: string;
    expire_date: string;
    title: string;
    description: string;
    locked: boolean;
    decided: boolean;
    thumbnail_url: string;
    creator_username: string;
    is_creator: boolean;
    participants_count: number;
    total_pot: number;
    likes_count: number;
    public: boolean;
};

export function Event(data: any): Event {
    return {
        id: data.id,
        template_id: data.template_id,
        expire_date: data.expire_date,
        title: data.title,
        description: data.description,
        locked: data.locked,
        decided: data.decided,
        thumbnail_url: data.thumbnail_url,
        creator_username: data.creator_username,
        is_creator: data.is_creator,
        participants_count: data.participants_count,
        total_pot: data.total_pot,
        likes_count: data.likes_count,
        public: data.public,
    };
}

export interface ExpandedEvent extends Event {
    creator: SearchUser;
    questions: { [key: string]: string[] };
    bets: { [key: string]: { [key: string]: number } };
    user_bets: { [key: string]: string };
    template_posted: boolean;
    template_saved: boolean;
}

export function ExpandedEvent(data: any): ExpandedEvent {
    return {
        creator: SearchUser(data),
        ...Event(data),
        questions: data.questions,
        bets: data.bets,
        user_bets: data.user_bets,
        template_posted: data.template_posted,
        template_saved: data.template_saved,
    };
}

export interface Bet {
  totalPot: number;
  userBet?: {
    options: Record<string, number>;
  };
  optionPots: Record<string, number>;
};

export function BetInfo(data: any): Bet {
  return {
    totalPot: data.totalPot,
    userBet: data.userBet ? { options: data.userBet.options } : undefined,
    optionPots: data.optionPots,
  };
}

export type SearchObject = SearchUser | SearchTemplate | SearchEvent;

export interface SearchUser extends User{
    id: string;
    is_following?: boolean;
    has_requested?: boolean;
    requester?: boolean;
    onPress: () => void;
};

export function SearchUser(data: any): SearchUser {
    return {
        ...User(data),
        is_following: data.is_following,
        has_requested: data.has_requested,
        requester: data.requester,
        onPress: data.onPress,
    };
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


