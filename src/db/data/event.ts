import { asc, eq, not } from "drizzle-orm";
import db from "..";
import { dashboardUsers, eventOrganizers, events } from "../schema";
import { query } from ".";

export async function eventRegistrationOpen() {
  const settings = await query.siteSettings.findFirst();
  return settings?.eventRegistrationsOpen ?? false;
}

export async function findByEventId(id: string) {
  return await query.events.findOne({
    where: (e, { eq }) => eq(e.id, id),
  });
}

export async function findAllPublishedEvents() {
  return await db
    .select({
      event: events,
      organizerId: eventOrganizers.id,
      organizerUser: dashboardUsers,
    })
    .from(events)
    .leftJoin(eventOrganizers, eq(events.id, eventOrganizers.eventId))
    .leftJoin(
      dashboardUsers,
      eq(eventOrganizers.organizerId, dashboardUsers.id),
    )
    .where(not(eq(events.status, "Draft")))
    .orderBy(asc(events.priority));
}
