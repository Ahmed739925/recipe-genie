import { createServerFn } from "@tanstack/react-start";
import { generateText } from "ai";
import { z } from "zod";
import { createLovableAiGatewayProvider } from "./ai-gateway.server";


const RecipeInput = z.object({
  ingredients: z.string().min(1).max(2000),
  diet: z.string().max(200).optional(),
  servings: z.number().int().min(1).max(50),
  maxMinutes: z.number().int().min(5).max(480),
});

const RecipeSchema = z.object({
  name: z.string(),
  description: z.string(),
  prepTimeMinutes: z.number(),
  cookTimeMinutes: z.number(),
  servings: z.number(),
  ingredients: z.array(
    z.object({
      item: z.string(),
      quantity: z.string(),
      haveIt: z.boolean(),
    }),
  ),
  substitutions: z.array(
    z.object({
      original: z.string(),
      substitute: z.string(),
      reason: z.string(),
    }),
  ),
  instructions: z.array(z.string()),
  nutritionPerServing: z.object({
    calories: z.number(),
    proteinGrams: z.number(),
    carbsGrams: z.number(),
    fatGrams: z.number(),
  }),
  shoppingList: z.array(z.string()),
  tips: z.array(z.string()),
});

export type Recipe = z.infer<typeof RecipeSchema>;

export const generateRecipe = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => RecipeInput.parse(input))
  .handler(async ({ data }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Missing LOVABLE_API_KEY");

    const gateway = createLovableAiGatewayProvider(key);

    const prompt = `Create a recipe using these ingredients the user has: ${data.ingredients}.

Requirements:
- Total time (prep + cook) under ${data.maxMinutes} minutes
- ${data.servings} servings
- Dietary preferences: ${data.diet?.trim() ? data.diet : "none specified"}

Mark each ingredient with haveIt=true if the user already has it (matches their list), false if they need to buy it.
Suggest substitutions for any unusual or hard-to-find ingredients.
Provide accurate nutrition estimates per serving.
Build a shopping list of only the items the user does NOT already have.
Give 2-4 helpful cooking tips.

Return ONLY a valid JSON object (no markdown fences, no commentary) matching exactly this shape:
{
  "name": string,
  "description": string,
  "prepTimeMinutes": number,
  "cookTimeMinutes": number,
  "servings": number,
  "ingredients": [{ "item": string, "quantity": string, "haveIt": boolean }],
  "substitutions": [{ "original": string, "substitute": string, "reason": string }],
  "instructions": [string],
  "nutritionPerServing": { "calories": number, "proteinGrams": number, "carbsGrams": number, "fatGrams": number },
  "shoppingList": [string],
  "tips": [string]
}`;

    const { text } = await generateText({
      model: gateway("google/gemini-3-flash-preview"),
      prompt,
    });

    let cleaned = text.trim()
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/```\s*$/i, "")
      .trim();
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start > 0 || end < cleaned.length - 1) {
      if (start !== -1 && end > start) cleaned = cleaned.slice(start, end + 1);
    }

    const parsed = JSON.parse(cleaned);
    return RecipeSchema.parse(parsed);
  });
