import "next-auth";
import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    accessToken?: string;
  }

  interface Session extends DefaultSession {
    accessToken?: string;
    user: {
      id: string;
      name?: string | null;
      email: string;
    };
  }
}
