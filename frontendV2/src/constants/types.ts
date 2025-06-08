export interface ArticleType {
  id: number;
  user: number;
  created_at: string;
  views_count: number;
  comments_count: number;
  likes_count: number;
  like_status: boolean;
  save_status: boolean;
  view_status: boolean;
  user_school: string;
  user_temp_name: string;
  user_static_points: number;
  tag: [];
  title: string;
  body: string;
  unicon: boolean;
  course_code: string;
  edited: boolean;
  deleted: boolean;
}
export interface InitialDataType {
    id: number;
    access: string;
    email: string;
    points: number;
    university_colors: any;
    university: string;
    refresh: string;
    color: string;
    initial: string;
    is_validated: boolean;
}
export interface CommentType {
  id: number;
  user: number;
  created_at: string;
  comments_count: number;
  likes_count: number;
  body: string;
  article: number;
  parent_comment: number | null;
  like_status: boolean;
  user_school: string;
  user_temp_name: string;
  user_static_points: number;
  unicon: boolean;
  deleted: boolean;
  edited: boolean;
  showReplies: boolean;
  nested_comments: CommentType[];
  next: string;
}