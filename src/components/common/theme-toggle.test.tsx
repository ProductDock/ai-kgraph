import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { ThemeToggle } from "@/components/common/theme-toggle";

describe("ThemeToggle", () => {
  it("renders and toggles the theme", async () => {
    render(<ThemeToggle />);

    const button = await screen.findByRole("button", {
      name: /switch to dark theme/i,
    });
    fireEvent.click(button);

    expect(
      await screen.findByRole("button", { name: /switch to light theme/i }),
    ).toBeInTheDocument();
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
  });
});
