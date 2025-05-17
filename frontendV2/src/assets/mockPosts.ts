
export interface Post {
  id: number;
  username: string;
  title: string;
  content: string;
  likes: number;
  timestamp: string;
  image?: string;
  tags?: string[];
}

export const mockPosts: Post[] = [
  {
    id: 1,
    username: "TechEnthusiast",
    title: "Campus Event: Annual Tech Symposium",
    content: "Join us for our biggest tech event of the year! Featured speakers from leading tech companies will share insights about AI and future technologies. Don't miss this opportunity to network with industry professionals and learn about the latest trends in technology.",
    likes: 290,
    timestamp: "2h ago",
    image: "/lovable-uploads/c0c5e2ce-74a9-4316-968e-84839c7cc76b.png",
    tags: ["Tech", "Event", "Networking"]
  },
  {
    id: 2,
    username: "MathWhiz",
    title: "Study Group Formation: Advanced Mathematics",
    content: "Looking for students interested in forming a study group for Advanced Calculus and Linear Algebra. Meeting twice a week.",
    likes: 145,
    timestamp: "3h ago",
    tags: ["Mathematics", "Study Group"]
  },
  {
    id: 3,
    username: "ResearchLab",
    title: "Research Opportunity Available",
    content: "The Computer Science department is seeking undergraduate students for a research project in machine learning. Previous experience with Python and data analysis is preferred but not required.",
    likes: 210,
    timestamp: "4h ago",
    tags: ["Research", "Computer Science", "ML"]
  }
];
