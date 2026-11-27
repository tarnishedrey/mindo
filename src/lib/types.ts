export type Profile = {
  id: string;
  fullName: string;
  university: string;
  city: string;
  faculty: string;
  studyProgram: string;
  year: number;
  bio: string;
  courses: string[];
  availability: string[];
  quizAnswers: number[] | null;
  isSample?: boolean;
  createdAt: string;
};

export type ConnectionStatus = "pending" | "accepted" | "declined";

export type Connection = {
  id: string;
  requesterId: string;
  addresseeId: string;
  status: ConnectionStatus;
  createdAt: string;
};

export type StudySession = {
  date: string;
  time: string;
  mode: "online" | "offline";
  place: string;
  topic: string;
};

export type Message = {
  id: string;
  connectionId: string;
  senderId: string;
  body: string;
  kind: "text" | "session";
  session: StudySession | null;
  createdAt: string;
};

export type AuthUser = { id: string; email: string; name: string };
