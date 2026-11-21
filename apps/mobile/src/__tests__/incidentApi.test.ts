jest.mock("@/services/api", () => ({ __esModule: true, default: {} }));
import {
  rewardPoints, MAX_MEDIA, MAX_IMAGE_BYTES, MAX_VIDEO_BYTES,
  ALLOWED_IMAGE_MIMES, ALLOWED_VIDEO_MIMES,
} from "@/services/incidentApi";

describe("rewardPoints", () => {
  it("reads pointsAwarded", () => expect(rewardPoints({ pointsAwarded: 10 })).toBe(10));
  it("reads points", () => expect(rewardPoints({ points: 5 })).toBe(5));
  it("prefers pointsAwarded over points", () =>
    expect(rewardPoints({ pointsAwarded: 3, points: 9 })).toBe(3));
  it("accepts a bare number incl. 0", () => {
    expect(rewardPoints(7)).toBe(7);
    expect(rewardPoints(0)).toBe(0);
  });
  it("returns null for null/undefined/empty/totalPoints only", () => {
    expect(rewardPoints(null)).toBeNull();
    expect(rewardPoints(undefined)).toBeNull();
    expect(rewardPoints({})).toBeNull();
    expect(rewardPoints({ totalPoints: 50 })).toBeNull();
  });
});

describe("media limits", () => {
  it("matches the spec", () => {
    expect(MAX_MEDIA).toBe(5);
    expect(MAX_IMAGE_BYTES).toBe(10 * 1024 * 1024);
    expect(MAX_VIDEO_BYTES).toBe(50 * 1024 * 1024);
    expect(ALLOWED_IMAGE_MIMES).toEqual(["image/jpeg", "image/png", "image/webp"]);
    expect(ALLOWED_VIDEO_MIMES).toEqual(["video/mp4", "video/quicktime"]);
  });
});
