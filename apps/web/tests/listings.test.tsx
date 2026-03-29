import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { AuthProvider } from "../src/lib/auth";
import { vi } from "vitest";

const renderWithProviders = (ListingsComponent: React.ComponentType) => {
  const queryClient = new QueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <MemoryRouter>
          <ListingsComponent />
        </MemoryRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
};

beforeEach(() => {
  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ data: { total: 0, listings: [] } }),
  }) as unknown as typeof fetch;
  process.env.VITE_API_URL = "http://localhost:3001";
});

it("renders listings page", async () => {
  const { Listings } = await import("../src/pages/Listings");
  renderWithProviders(Listings);
  expect(screen.getByPlaceholderText(/Max hours/i)).toBeInTheDocument();
});
