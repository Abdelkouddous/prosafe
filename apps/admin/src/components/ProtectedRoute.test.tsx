import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { AdminRoute, ProtectedRoute } from "./ProtectedRoute";

const auth = vi.hoisted(() => ({ value: {} as Record<string, unknown> }));
vi.mock("@/contexts/AuthContext", () => ({ useAuth: () => auth.value }));

const setAuth = (o: Record<string, unknown>) => {
  auth.value = { isAuthenticated: false, isLoading: false, isManager: false, ...o };
};

const renderAt = (guard: JSX.Element) =>
  render(
    <MemoryRouter initialEntries={["/secret"]}>
      <Routes>
        <Route element={guard}>
          <Route path="/secret" element={<div>secret page</div>} />
        </Route>
        <Route path="/login" element={<div>login page</div>} />
        <Route path="/" element={<div>home page</div>} />
      </Routes>
    </MemoryRouter>
  );

beforeEach(() => setAuth({}));

describe("AdminRoute", () => {
  it("redirects anonymous users to /login", () => {
    renderAt(<AdminRoute />);
    expect(screen.getByText("login page")).toBeInTheDocument();
  });

  it("redirects employees to the home page", () => {
    setAuth({ isAuthenticated: true, isManager: false });
    renderAt(<AdminRoute />);
    expect(screen.getByText("home page")).toBeInTheDocument();
    expect(screen.queryByText("secret page")).toBeNull();
  });

  it("lets managers through", () => {
    setAuth({ isAuthenticated: true, isManager: true });
    renderAt(<AdminRoute />);
    expect(screen.getByText("secret page")).toBeInTheDocument();
  });

  it("shows a spinner while loading", () => {
    setAuth({ isLoading: true });
    renderAt(<AdminRoute />);
    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });
});

describe("ProtectedRoute", () => {
  it("redirects anonymous users to /login", () => {
    renderAt(<ProtectedRoute />);
    expect(screen.getByText("login page")).toBeInTheDocument();
  });

  it("lets any authenticated user through", () => {
    setAuth({ isAuthenticated: true });
    renderAt(<ProtectedRoute />);
    expect(screen.getByText("secret page")).toBeInTheDocument();
  });
});
