import type { EventOrganizer } from "~/components/events/layout";
import db from "..";
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
  const events = await db.query.events.findMany({
    where: (e, { not, eq }) => not(eq(e.status, "Draft")),
    orderBy: (e, { asc }) => asc(e.priority),
    with: {
      organizers: {
        with: {
          user: true,
        },
      },
    },
  });

  return events.map((event) => ({
    ...event,
    organizers: event.organizers.map((org) => {
      return {
        id: org.id,
        name: org.user.name,
        email: org.user.email,
        phone: org.user.phone,
      } as EventOrganizer;
    }) as EventOrganizer[],
  }));
}
