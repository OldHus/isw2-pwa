
export type ActivityItemType = "post" | "poll" | "quiz";

export interface ActivityItem {
  id: string;
  type: ActivityItemType;
  courseId: string;
  title: string;
  body: string;
  createdAtMillis: number;
}