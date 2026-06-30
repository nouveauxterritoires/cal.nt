import { getServerSession } from "@calcom/features/auth/lib/getServerSession";
import type { GetBookingType } from "@calcom/features/bookings/lib/get-booking";
import { getBookingForReschedule, getBookingForSeatedEvent } from "@calcom/features/bookings/lib/get-booking";
import type { getPublicEvent } from "@calcom/features/eventtypes/lib/getPublicEvent";
import { EventRepository } from "@calcom/features/eventtypes/repositories/EventRepository";
import slugify from "@calcom/lib/slugify";
import { prisma } from "@calcom/prisma";
import { BookingStatus } from "@calcom/prisma/enums";
import type { GetServerSidePropsContext } from "next";
import type { Session } from "next-auth";
import { z } from "zod";

type Props = {
  eventData: NonNullable<Awaited<ReturnType<typeof getPublicEvent>>>;
  booking?: GetBookingType;
  rescheduleUid: string | null;
  bookingUid: string | null;
  user: string;
  slug: string;
  isBrandingHidden: boolean;
  isSEOIndexable: boolean | null;
  themeBasis: null | string;
  orgBannerUrl: null;
};

const paramsSchema = z.object({
  // `slug` is the team slug, `type` is the event-type slug.
  slug: z.string().transform((s) => slugify(s)),
  type: z.string().transform((s) => slugify(s)),
});

async function processReschedule({
  props,
  rescheduleUid,
  session,
  allowRescheduleForCancelledBooking,
}: {
  props: Props;
  session: Session | null;
  rescheduleUid: string | string[] | undefined;
  allowRescheduleForCancelledBooking?: boolean;
}) {
  if (!rescheduleUid) return;

  const booking = await getBookingForReschedule(`${rescheduleUid}`, session?.user?.id);

  if (booking?.eventType?.disableRescheduling) {
    return {
      redirect: {
        destination: `/booking/${rescheduleUid}`,
        permanent: false,
      },
    };
  }

  if (
    booking === null ||
    !booking.eventTypeId ||
    (booking?.eventTypeId === props.eventData?.id &&
      (booking.status !== BookingStatus.CANCELLED || allowRescheduleForCancelledBooking))
  ) {
    props.booking = booking;
    props.rescheduleUid = Array.isArray(rescheduleUid) ? rescheduleUid[0] : rescheduleUid;
    return;
  }

  const redirectEventTypeTarget = await prisma.eventType.findUnique({
    where: { id: booking.eventTypeId },
    select: { slug: true },
  });
  if (!redirectEventTypeTarget) {
    return { notFound: true } as const;
  }
  return {
    redirect: {
      permanent: false,
      destination: redirectEventTypeTarget.slug,
    },
  };
}

async function processSeatedEvent({
  props,
  bookingUid,
  allowRescheduleForCancelledBooking,
}: {
  props: Props;
  bookingUid: string | string[] | undefined;
  allowRescheduleForCancelledBooking?: boolean;
}) {
  if (!bookingUid) return;
  const booking = await getBookingForSeatedEvent(`${bookingUid}`);
  if (booking?.status === BookingStatus.CANCELLED && !allowRescheduleForCancelledBooking) {
    return {
      redirect: {
        permanent: false,
        destination: `${props.slug}`,
      },
    };
  }
  props.booking = booking;
  props.bookingUid = Array.isArray(bookingUid) ? bookingUid[0] : bookingUid;
}

export const getServerSideProps = async (context: GetServerSidePropsContext) => {
  const session = await getServerSession({ req: context.req });
  const { slug: teamSlug, type: eventSlug } = paramsSchema.parse(context.params);
  const { rescheduleUid, bookingUid } = context.query;
  const allowRescheduleForCancelledBooking = context.query.allowRescheduleForCancelledBooking === "true";

  // Non-org teams only. Organization-scoped routing/SEO lives in commercial /ee and is out of scope.
  const team = await prisma.team.findFirst({
    where: { slug: teamSlug, parentId: null, isOrganization: false },
    select: { id: true, hideBranding: true },
  });
  if (!team) {
    return { notFound: true } as const;
  }

  const eventData = await EventRepository.getPublicEvent(
    {
      username: teamSlug,
      eventSlug,
      isTeamEvent: true,
      org: null,
      fromRedirectOfNonOrgLink: false,
    },
    session?.user?.id
  );

  if (!eventData) {
    return { notFound: true } as const;
  }

  const props: Props = {
    eventData,
    user: teamSlug,
    slug: eventSlug,
    isBrandingHidden: team.hideBranding ?? false,
    isSEOIndexable: true,
    themeBasis: teamSlug,
    bookingUid: bookingUid ? `${bookingUid}` : null,
    rescheduleUid: null,
    orgBannerUrl: null,
  };

  if (rescheduleUid) {
    const processRescheduleResult = await processReschedule({
      props,
      rescheduleUid,
      session,
      allowRescheduleForCancelledBooking,
    });
    if (processRescheduleResult) {
      return processRescheduleResult;
    }
  } else if (bookingUid) {
    const processSeatResult = await processSeatedEvent({
      props,
      bookingUid,
      allowRescheduleForCancelledBooking,
    });
    if (processSeatResult) {
      return processSeatResult;
    }
  }

  return { props };
};
