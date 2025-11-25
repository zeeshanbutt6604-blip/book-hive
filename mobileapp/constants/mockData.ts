import { Post, Comment } from "@/components/PostCard";

export const mockPosts: Post[] = [
  {
    id: "1",
    userId: "user1",
    userName: "Sarah Johnson",
    userAvatar: "https://i.pravatar.cc/150?img=1",
    title: "The Great Gatsby - Classic Literature",
    description:
      "A timeless classic that explores the decadence and excess of the Jazz Age. F. Scott Fitzgerald's masterpiece is a must-read for any literature enthusiast.",
    bookType: "Novel",
    previewImage: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400",
    commentCount: 12,
    createdAt: "2 hours ago",
  },
  {
    id: "2",
    userId: "user2",
    userName: "Michael Chen",
    userAvatar: "https://i.pravatar.cc/150?img=5",
    title: "React Native Development Guide",
    description:
      "Comprehensive guide to building cross-platform mobile applications using React Native. Covers everything from basics to advanced patterns.",
    bookType: "Manual",
    previewImage: "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=400",
    pdfUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
    pdfName: "React_Native_Development_Guide.pdf",
    commentCount: 8,
    createdAt: "5 hours ago",
  },
  {
    id: "3",
    userId: "user3",
    userName: "Emily Rodriguez",
    userAvatar: "https://i.pravatar.cc/150?img=9",
    title: "Digital Photography Handbook",
    description:
      "Learn professional photography techniques and tips from industry experts. Perfect for both beginners and advanced photographers.",
    bookType: "PDF",
    previewImage: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400",
    pdfUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
    pdfName: "Digital_Photography_Handbook.pdf",
    commentCount: 15,
    createdAt: "1 day ago",
  },
  {
    id: "4",
    userId: "user4",
    userName: "David Kim",
    userAvatar: "https://i.pravatar.cc/150?img=12",
    title: "The Art of War - Audiobook",
    description:
      "Sun Tzu's ancient treatise on strategy and warfare, now available as an engaging audiobook narrated by renowned voice actors.",
    bookType: "Audio",
    previewImage: "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=400",
    commentCount: 22,
    createdAt: "2 days ago",
  },
  {
    id: "5",
    userId: "user5",
    userName: "Lisa Thompson",
    userAvatar: "https://i.pravatar.cc/150?img=20",
    title: "JavaScript Essentials - eBook",
    description:
      "Master JavaScript fundamentals and modern ES6+ features. Includes practical examples and coding exercises to reinforce learning.",
    bookType: "eBook",
    previewImage: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400",
    commentCount: 6,
    createdAt: "3 days ago",
  },
];

export const mockComments: Comment[] = [
  {
    id: "c1",
    userId: "user6",
    userName: "Alex Morgan",
    userAvatar: "https://i.pravatar.cc/150?img=33",
    text: "This looks amazing! Can't wait to read it. The preview is really intriguing.",
    createdAt: "1 hour ago",
  },
  {
    id: "c2",
    userId: "user7",
    userName: "Jordan Lee",
    userAvatar: "https://i.pravatar.cc/150?img=47",
    text: "I've been looking for something like this. Great recommendation!",
    createdAt: "2 hours ago",
  },
  {
    id: "c3",
    userId: "user8",
    userName: "Taylor Swift",
    userAvatar: "https://i.pravatar.cc/150?img=52",
    text: "The cover design is beautiful. Looking forward to diving into this one!",
    createdAt: "3 hours ago",
  },
];

export const mockUser = {
  id: "currentUser",
  name: "John Doe",
  email: "john.doe@example.com",
  avatar: "https://i.pravatar.cc/150?img=68",
  posts: mockPosts.filter((post) => post.userId === "currentUser"),
};

