"use server";

import { eq } from "drizzle-orm";
import { db } from "~/server/db";
import { users } from "~/server/db/schema";

export async function getUserFromDb(email: string, password: string) {
    try {
        const existedUser = await db.query.users.findFirst({
            where: eq(users.email, email),
        })

        if (!existedUser) {
        return {
            success: false,
            message: "No user found",
        }
    }

    if (existedUser.password !== password) {
        return {
            success: false,
            message: "Incorrect password",
        }
    }

    return {
        success: true,
        user: existedUser,
    }
    
    } catch (error: any) {
     return {
        success: false,
        message: error.message,
     }   
    }
}