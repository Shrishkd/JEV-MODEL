import { redirect } from "next/navigation";

// Temporary: the app's home will become the JEV sentiment analyser (Moodify 2.0).
// Until then, send visitors straight to the comparison lab.
export default function Home() {
  redirect("/compare");
}
