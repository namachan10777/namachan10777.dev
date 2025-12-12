import * as v from "valibot";

const TurnstileResponseSchema = v.object({
  success: v.boolean(),
  "error-codes": v.optional(v.array(v.string())),
  challenge_ts: v.optional(v.string()),
  hostname: v.optional(v.string()),
});

export type TurnstileResponse = v.InferOutput<typeof TurnstileResponseSchema>;

export async function verifyTurnstileToken(
  token: string,
  secretKey: string,
): Promise<TurnstileResponse> {
  const formData = new FormData();
  formData.append("secret", secretKey);
  formData.append("response", token);

  const response = await fetch(
    "https://challenges.cloudflare.com/turnstile/v0/siteverify",
    {
      method: "POST",
      body: formData,
    },
  );

  const data = await response.json();
  return v.parse(TurnstileResponseSchema, data);
}
