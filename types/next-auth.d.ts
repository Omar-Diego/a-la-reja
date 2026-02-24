import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface User {
    id: string;
    name: string;
    email: string;
    accessToken: string;
    role: "admin" | "user";
  }

  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      role: "admin" | "user";
    };
    accessToken: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    accessToken: string;
    id: string;
    name: string;
    role: "admin" | "user";
  }
}
