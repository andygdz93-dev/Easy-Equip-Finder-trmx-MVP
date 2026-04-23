import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { Landing } from "../src/pages/Landing";

it("renders landing page", () => {
  render(
    <MemoryRouter>
      <Landing />
    </MemoryRouter>
  );
  expect(
    screen.getByRole("heading", { level: 1, name: /Easy Finder AI/i })
  ).toBeInTheDocument();
});
