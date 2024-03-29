export const ListType = {
  LearningPath: "LearningPath",
  UserList: "UserList",
} as const
export type ListType = (typeof ListType)[keyof typeof ListType]
