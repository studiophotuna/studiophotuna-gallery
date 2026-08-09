import BrandingEditor from "./BrandingEditor";

export default async function AdminEventPage({ params }) {
  const { eventId = "" } = await params;
  return <BrandingEditor eventId={eventId} />;
}
