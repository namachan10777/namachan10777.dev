import { redirect } from "react-router";

export function loader() {
  return redirect("/post/page/1/", 301);
}
