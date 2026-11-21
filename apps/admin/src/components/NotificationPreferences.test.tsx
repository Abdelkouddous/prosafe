import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import NotificationPreferences from "./NotificationPreferences";

const prefs = {
  incidents: true,
  trainings: false,
  audits: true,
  inventory: false,
  emergency: true,
  messages: true,
  push: true,
  email: false,
};

const api = vi.hoisted(() => ({
  getPreferences: vi.fn(),
  updatePreferences: vi.fn(),
}));

vi.mock("@/services/notificationApi", () => ({ notificationApi: api }));
vi.mock("react-i18next", () => ({ useTranslation: () => ({ t: (k: string) => k }) }));

beforeEach(() => {
  api.getPreferences.mockReset().mockResolvedValue({ data: prefs });
  api.updatePreferences.mockReset().mockImplementation((b) => Promise.resolve({ data: b }));
});

describe("NotificationPreferences", () => {
  it("loads preferences from the API and renders one switch per category", async () => {
    render(<NotificationPreferences />);
    await waitFor(() => expect(screen.getAllByRole("switch")).toHaveLength(8));
    expect(api.getPreferences).toHaveBeenCalledTimes(1);
    const switches = screen.getAllByRole("switch");
    expect(switches[0]).toHaveAttribute("aria-checked", "true");
    expect(switches[1]).toHaveAttribute("aria-checked", "false");
  });

  it("sends the toggled preferences when saving", async () => {
    render(<NotificationPreferences />);
    await waitFor(() => expect(screen.getAllByRole("switch")).toHaveLength(8));
    fireEvent.click(screen.getAllByRole("switch")[1]); // trainings -> true
    fireEvent.click(screen.getByRole("button"));
    await waitFor(() => expect(api.updatePreferences).toHaveBeenCalledTimes(1));
    expect(api.updatePreferences.mock.calls[0][0]).toEqual({ ...prefs, trainings: true });
  });
});
