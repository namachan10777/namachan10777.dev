import { RequestHandler } from "@builder.io/qwik-city";

export const onGet: RequestHandler = async ({ request }) => {
  console.log(request);
};
