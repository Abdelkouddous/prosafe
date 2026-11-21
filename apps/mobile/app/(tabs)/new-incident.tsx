import { Redirect } from "expo-router";

// The center "+" tab button pushes /incident/new directly; this route only exists
// so the tab can be declared. Reaching it by deep link forwards to the form.
export default function NewIncidentTab() {
  return <Redirect href="/incident/new" />;
}
