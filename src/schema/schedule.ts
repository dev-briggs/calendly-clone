import { DAYS_OF_WEEK_IN_ORDER } from "@/data/constants";
import { z } from "zod";
import moment from "moment";
import { timeToInt } from "@/lib/utils";

const timeFormat = "HH:MM";

export const scheduleFormSchema = z.object({
  timezone: z.string().min(1, "Required"),
  availabilities: z
    .array(
      z.object({
        dayOfWeek: z.enum(DAYS_OF_WEEK_IN_ORDER),
          startTime: z.string().regex(/^([0-9]|0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/, "Time must be in the format HH:MM"),
          endTime: z.string().regex(/^([0-9]|0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/, "Time must be in the format HH:MM"),
        // startTime: z
        //   .string()
        //   .refine(
        //     (value) => moment(value, timeFormat, true).isValid(),
        //     `Time must be in the format ${timeFormat}`
        //   ),
        // endTime: z
        //   .string()
        //   .refine(
        //     (value) => moment(value, timeFormat, true).isValid(),
        //     `Time must be in the format ${timeFormat}`
        //   ),
      })
    )
    .superRefine((availabilities, ctx) => {
      availabilities.forEach((availability, index) => {
        const overlaps = availabilities.some((a, i) => {
          const isNotCurrentAvailability = i !== index;
          const onSameDay = a.dayOfWeek === availability.dayOfWeek;
          const timeOverlaps =
            timeToInt(a.startTime) < timeToInt(availability.endTime) &&
            timeToInt(a.endTime) > timeToInt(availability.startTime);
          return isNotCurrentAvailability && onSameDay && timeOverlaps;
        });

        if (overlaps) {
          ctx.addIssue({
            code: "custom",
            message: "Availability overlaps with another",
            path: [index],
          });
        }

        if (
          timeToInt(availability.startTime) >= timeToInt(availability.endTime)
        ) {
          ctx.addIssue({
            code: "custom",
            message: "End time must be after start time",
            path: [index],
          });
        }
      });
    }),
});
