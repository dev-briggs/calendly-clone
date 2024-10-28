"use server";

import "use-server";

import { z } from "zod";
import { auth } from "@clerk/nextjs/server";

import { meetingActionSchema } from "@/schema/meetings";
import { db } from "@/db";
import { getValidTimesFromSchedule } from "@/lib/getValidTimesFromSchedule";
import { createCalendarEvent } from "./googleCalendar";
import { redirect } from "next/navigation";
import { fromZonedTime } from "date-fns-tz";

export async function createMeeting(
  unsafeData: z.infer<typeof meetingActionSchema>
) {
  const { userId } = auth();
  const { success, data: safeData } = meetingActionSchema.safeParse(unsafeData);

  if (!success || !userId) return { error: true };

  const event = await db.query.EventTable.findFirst({
    where: ({ clerkUserId, isActive, id }, { eq, and }) =>
      and(
        eq(isActive, true),
        eq(clerkUserId, safeData.clerkUserId),
        eq(id, safeData.eventId)
      ),
  });

  if (!event) return { error: true };
  const startInTimezone = fromZonedTime(safeData.startTime, safeData.timezone)

  const validTimes = await getValidTimesFromSchedule(
    [startInTimezone],
    event
  );
  if (validTimes.length === 0) return { error: true };

  await createCalendarEvent({
    ...safeData,
    startTime: startInTimezone,
    durationInMinutes: event.durationInMinutes,
    eventName: event.name,
  });

  redirect(
    `/book/${safeData.clerkUserId}/${
      safeData.eventId
    }/sucess?startTime=${startInTimezone.toISOString()}`
  );
}
