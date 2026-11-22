
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";

function Welcome() {
  return <h1>Welcome to Lectra</h1>;
}

describe("Lectra Frontend Tests", () => {
  it("TC-F01: displays the welcome heading", () => {
    render(<Welcome />);

    expect(
      screen.getByRole("heading", {
        name: "Welcome to Lectra",
      })
    ).toBeInTheDocument();
  });

  it("TC-F02: displays the correct heading level", () => {
    render(<Welcome />);

    const heading = screen.getByRole("heading", {
      level: 1,
    });

    expect(heading).toHaveTextContent("Welcome to Lectra");
  });
});
