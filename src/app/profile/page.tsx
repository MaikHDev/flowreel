import { redirect } from "next/navigation";
import { useSession } from "next-auth/react";
import { auth } from "~/server/auth";

export default async function Home(){
  const session = await auth();

  if(!session?.user){
    redirect("/api/auth/signin");
  }

  redirect(`/profile/${session?.user?.name}`);

}