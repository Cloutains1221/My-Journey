export interface Trip {
  id: string;
  title: string;
  slug: string;
  date: string;
  location: string;
  latitude: number;
  longitude: number;
  cover_image: string | null;
  content: string | null;
  rating: number;
  created_at: string;
  photos?: Photo[];
  agreement_votes?: AgreementVote[];
  desire_votes?: DesireVote[];
}

export interface Photo {
  id: string;
  trip_id: string;
  url: string;
  caption: string | null;
  sort_order: number;
  width: number | null;
  height: number | null;
  created_at: string;
}

export interface AgreementVote {
  id: string;
  trip_id: string;
  nickname: string;
  agreement: number;
  comment: string | null;
  created_at: string;
}

export interface DesireVote {
  id: string;
  trip_id: string;
  nickname: string;
  desire_level: number;
  comment: string | null;
  created_at: string;
}

export const RATING_LABELS: Record<number, string> = {
  1: "拉完了",
  2: "npc",
  3: "人上人",
  4: "顶级",
  5: "夯",
};

export const AGREEMENT_LABELS: Record<number, string> = {
  1: "非常认同",
  2: "认同",
  3: "一般",
  4: "不认同",
  5: "非常不认同",
};

export const DESIRE_LABELS: Record<number, string> = {
  1: "我要马上出发",
  2: "有点想去",
  3: "考虑一下",
  4: "很一般啊",
  5: "狗都不去",
};
