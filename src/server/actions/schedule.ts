"use server";

import "use-server";
import { scheduleFormSchema } from "@/schema/schedule";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { ScheduleAvailabilityTable, ScheduleTable } from "@/db/schema";
import { db } from "@/db";
import { eq } from "drizzle-orm";
import { BatchItem } from "drizzle-orm/batch";

export async function saveSchedule(
  unsafeData: z.infer<typeof scheduleFormSchema>
) {
  const { userId } = auth();
  const { success, data: safeData } = scheduleFormSchema.safeParse(unsafeData);
  if (!success || !userId) return { error: true };

  const { availabilities, ...scheduleData } = safeData;

  const [{ id: scheduleId }] = await db
    .insert(ScheduleTable)
    .values({ ...scheduleData, clerkUserId: userId })
    .onConflictDoUpdate({
      target: ScheduleTable.clerkUserId,
      set: scheduleData,
    })
    .returning({ id: ScheduleTable.id });

  const statements: [BatchItem<"pg">] = [
    /**
     * Deletes every single schedule availability for particular user in db
     */
    db
      .delete(ScheduleAvailabilityTable)
      .where(eq(ScheduleAvailabilityTable.scheduleId, scheduleId)),
  ];

  if (availabilities.length > 0) {
    statements.push(
      db.insert(ScheduleAvailabilityTable).values(
        availabilities.map((availability) => ({
          ...availability,
          scheduleId,
        }))
      )
    );
  }

  await db.batch(statements);
}
