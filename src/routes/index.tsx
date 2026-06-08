import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { generateRecipe, type Recipe } from "@/lib/recipe.functions";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "PantryChef — AI Recipe Generator" },
      {
        name: "description",
        content:
          "Turn the ingredients you already have into a delicious recipe in seconds. Substitutions, nutrition, and shopping lists included.",
      },
      { property: "og:title", content: "PantryChef — AI Recipe Generator" },
      {
        property: "og:description",
        content: "Tell us what's in your kitchen, get a full recipe in seconds.",
      },
    ],
  }),
  component: Home,
});

const DIETS = ["Vegan", "Vegetarian", "Halal", "Kosher", "Gluten-free", "Dairy-free", "Keto", "Pescatarian"];

function Home() {
  const generate = useServerFn(generateRecipe);
  const [ingredients, setIngredients] = useState("chicken, rice, onions, garlic");
  const [diets, setDiets] = useState<string[]>([]);
  const [otherDiet, setOtherDiet] = useState("");
  const [servings, setServings] = useState(4);
  const [maxMinutes, setMaxMinutes] = useState(30);

  const mutation = useMutation({
    mutationFn: async () => {
      const diet = [...diets, otherDiet.trim()].filter(Boolean).join(", ");
      return generate({ data: { ingredients, diet, servings, maxMinutes } });
    },
  });

  const toggleDiet = (d: string) =>
    setDiets((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]));

  return (
    <div className="min-h-screen">
      <header className="border-b border-border/60">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🍳</span>
            <span className="font-display text-xl font-semibold">PantryChef</span>
          </div>
          <span className="text-sm text-muted-foreground">AI Recipe Generator</span>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-10">
        <section className="mb-10 text-center">
          <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">
            What's in your{" "}
            <span
              className="bg-clip-text text-transparent"
              style={{ backgroundImage: "var(--gradient-warm)" }}
            >
              kitchen tonight?
            </span>
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
            List a few ingredients and we'll craft a recipe with nutrition, smart substitutions, and a
            shopping list.
          </p>
        </section>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            mutation.mutate();
          }}
          className="rounded-2xl border border-border bg-card p-6 md:p-8"
          style={{ boxShadow: "var(--shadow-soft)" }}
        >
          <label className="mb-2 block text-sm font-medium">Ingredients you have</label>
          <textarea
            value={ingredients}
            onChange={(e) => setIngredients(e.target.value)}
            placeholder="e.g. chicken, rice, onions, garlic"
            rows={3}
            className="w-full resize-none rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20"
            required
          />

          <div className="mt-6">
            <label className="mb-2 block text-sm font-medium">Dietary preferences</label>
            <div className="flex flex-wrap gap-2">
              {DIETS.map((d) => {
                const active = diets.includes(d);
                return (
                  <button
                    type="button"
                    key={d}
                    onClick={() => toggleDiet(d)}
                    className={`rounded-full border px-3 py-1.5 text-sm transition ${
                      active
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-secondary text-secondary-foreground hover:border-primary/40"
                    }`}
                  >
                    {d}
                  </button>
                );
              })}
            </div>
            <input
              value={otherDiet}
              onChange={(e) => setOtherDiet(e.target.value)}
              placeholder="Other (e.g. nut allergy)"
              className="mt-3 w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/20"
            />
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium">
                Servings: <span className="text-primary">{servings}</span>
              </label>
              <input
                type="range"
                min={1}
                max={12}
                value={servings}
                onChange={(e) => setServings(Number(e.target.value))}
                className="w-full accent-[var(--primary)]"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium">
                Max time: <span className="text-primary">{maxMinutes} min</span>
              </label>
              <input
                type="range"
                min={10}
                max={120}
                step={5}
                value={maxMinutes}
                onChange={(e) => setMaxMinutes(Number(e.target.value))}
                className="w-full accent-[var(--primary)]"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={mutation.isPending}
            className="mt-8 w-full rounded-xl px-6 py-3.5 text-base font-semibold text-primary-foreground transition hover:opacity-95 disabled:opacity-60"
            style={{ backgroundImage: "var(--gradient-warm)" }}
          >
            {mutation.isPending ? "Cooking up your recipe…" : "Generate recipe"}
          </button>

          {mutation.isError && (
            <p className="mt-4 rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {(mutation.error as Error).message || "Something went wrong. Try again."}
            </p>
          )}
        </form>

        {mutation.data && <RecipeView recipe={mutation.data as Recipe} />}
      </main>

      <footer className="mt-16 border-t border-border/60 py-6 text-center text-xs text-muted-foreground">
        Powered by Lovable AI
      </footer>
    </div>
  );
}

function RecipeView({ recipe }: { recipe: Recipe }) {
  const n = recipe.nutritionPerServing;
  return (
    <article
      className="mt-10 rounded-2xl border border-border bg-card p-6 md:p-8"
      style={{ boxShadow: "var(--shadow-soft)" }}
    >
      <header className="mb-6 border-b border-border pb-6">
        <h2 className="text-3xl font-semibold">{recipe.name}</h2>
        <p className="mt-2 text-muted-foreground">{recipe.description}</p>
        <div className="mt-4 flex flex-wrap gap-2 text-xs">
          <Pill>⏱ {recipe.prepTimeMinutes + recipe.cookTimeMinutes} min total</Pill>
          <Pill>🍽 {recipe.servings} servings</Pill>
          <Pill>🔥 {n.calories} kcal / serving</Pill>
        </div>
      </header>

      <div className="grid gap-8 md:grid-cols-2">
        <section>
          <h3 className="mb-3 text-lg font-semibold">Ingredients</h3>
          <ul className="space-y-2 text-sm">
            {recipe.ingredients.map((ing, i) => (
              <li key={i} className="flex items-start gap-2">
                <span
                  className={`mt-1 inline-block h-2 w-2 rounded-full ${
                    ing.haveIt ? "bg-success" : "bg-accent"
                  }`}
                />
                <span>
                  <strong>{ing.quantity}</strong> {ing.item}
                  {!ing.haveIt && (
                    <span className="ml-1 text-xs text-muted-foreground">(to buy)</span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h3 className="mb-3 text-lg font-semibold">Nutrition / serving</h3>
          <div className="grid grid-cols-2 gap-3">
            <Stat label="Calories" value={`${n.calories} kcal`} />
            <Stat label="Protein" value={`${n.proteinGrams} g`} />
            <Stat label="Carbs" value={`${n.carbsGrams} g`} />
            <Stat label="Fat" value={`${n.fatGrams} g`} />
          </div>
        </section>
      </div>

      <section className="mt-8">
        <h3 className="mb-3 text-lg font-semibold">Instructions</h3>
        <ol className="space-y-3 text-sm">
          {recipe.instructions.map((step, i) => (
            <li key={i} className="flex gap-3">
              <span className="flex h-7 w-7 flex-none items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                {i + 1}
              </span>
              <span className="pt-0.5 leading-relaxed">{step}</span>
            </li>
          ))}
        </ol>
      </section>

      {recipe.substitutions.length > 0 && (
        <section className="mt-8">
          <h3 className="mb-3 text-lg font-semibold">Substitutions</h3>
          <ul className="space-y-2 text-sm">
            {recipe.substitutions.map((s, i) => (
              <li key={i} className="rounded-lg bg-muted px-4 py-3">
                <strong>{s.original}</strong> → {s.substitute}
                <p className="mt-1 text-xs text-muted-foreground">{s.reason}</p>
              </li>
            ))}
          </ul>
        </section>
      )}

      {recipe.shoppingList.length > 0 && (
        <section className="mt-8">
          <h3 className="mb-3 text-lg font-semibold">🛒 Shopping list</h3>
          <ul className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
            {recipe.shoppingList.map((item, i) => (
              <li key={i} className="rounded-lg border border-border bg-background px-3 py-2">
                {item}
              </li>
            ))}
          </ul>
        </section>
      )}

      {recipe.tips.length > 0 && (
        <section className="mt-8">
          <h3 className="mb-3 text-lg font-semibold">Chef's tips</h3>
          <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
            {recipe.tips.map((t, i) => (
              <li key={i}>{t}</li>
            ))}
          </ul>
        </section>
      )}
    </article>
  );
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full bg-secondary px-3 py-1 text-secondary-foreground">{children}</span>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-background px-4 py-3">
      <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-1 text-lg font-semibold">{value}</div>
    </div>
  );
}
