export async function getPublicEventName(supabase, eventId) {
  if (!eventId) return "";

  const { data, error } = await supabase.rpc("get_public_event_name", {
    p_event_id: eventId,
  });

  if (error) return "";
  return data || "";
}
