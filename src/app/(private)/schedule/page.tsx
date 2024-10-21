import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import EventForm from "@/components/forms/EventForm";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import ScheduleForm from "@/components/forms/ScheduleForm";

export default async function SchedulePage() {
  const { userId, redirectToSignIn } = auth();
  if (!userId) return redirectToSignIn();

  const schedule = await db.query.ScheduleTable.findFirst({
    where: ({ clerkUserId }, { eq }) => eq(clerkUserId, userId),
    with: {
      availabilities: true,
    },
  });

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Schedule</CardTitle>
      </CardHeader>
      <CardContent>
        <ScheduleForm schedule={schedule} />
      </CardContent>
    </Card>
  );
}
