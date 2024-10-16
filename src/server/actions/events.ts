"use server";

import { db } from "@/db";
import { EventTable } from "@/db/schema";
import { eventFormSchema } from "@/schema/events";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import "use-server";
import { z } from "zod";

export async function createEvent(
  unsafeData: z.infer<typeof eventFormSchema>
): Promise<{ error: boolean } | undefined> {
  const { userId } = auth();
  const { success, data: safeData } = eventFormSchema.safeParse(unsafeData);
  if (!success || userId === null) return { error: true };

  await db.insert(EventTable).values({ ...safeData, clerkUserId: userId });

  redirect("/events");
}
