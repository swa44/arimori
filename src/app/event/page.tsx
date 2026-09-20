import { redirect } from "next/navigation";

export const metadata = { title: "이벤트" };
export default function EventPage() {
  redirect("/schedule");
}
