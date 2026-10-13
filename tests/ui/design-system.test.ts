import { describe, expect, it } from "vitest";
import { buttonVariants } from "../../frontend/src/components/ui/button";
import { cn } from "../../frontend/src/lib/utils";

describe("Bab 3 Design System — CVA & Token Utility Tests", () => {
  it("cn() merges Tailwind classes correctly and resolves conflicts", () => {
    // Normal merge
    expect(cn("px-2 py-1", "bg-blue-500")).toContain("bg-blue-500");
    // Conflict resolution (p-4 should override px-2 py-1)
    const resolved = cn("px-2 py-1", "p-4");
    expect(resolved).toBe("p-4");
  });

  it("buttonVariants produces correct default styling classes", () => {
    const classes = buttonVariants();
    expect(classes).toContain("bg-blue-600");
    expect(classes).toContain("h-10");
    expect(classes).toContain("rounded-xl");
  });

  it("buttonVariants produces correct variant styling for destructive and teacher roles", () => {
    const destructive = buttonVariants({ variant: "destructive" });
    expect(destructive).toContain("bg-rose-600");

    const teacher = buttonVariants({ variant: "teacher" });
    expect(teacher).toContain("bg-purple-600");
  });

  it("buttonVariants produces correct sizing classes", () => {
    const small = buttonVariants({ size: "sm" });
    expect(small).toContain("h-8");

    const large = buttonVariants({ size: "lg" });
    expect(large).toContain("h-11");
  });
});
