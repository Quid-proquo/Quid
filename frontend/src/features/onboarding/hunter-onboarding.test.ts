import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  clearHunterOnboardingProgress,
  getHunterOnboardingProgress,
  isHunterOnboardingComplete,
  saveHunterOnboardingProgress,
} from "../../lib/onboarding";

class MemoryStorage {
  private values = new Map<string, string>();

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }

  removeItem(key: string): void {
    this.values.delete(key);
  }
}

function installWindow(): void {
  const storage = new MemoryStorage();
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: { localStorage: storage },
  });
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: storage,
  });
}

describe("hunter onboarding progress", () => {
  it("starts at the first step with no skills", () => {
    installWindow();
    const progress = getHunterOnboardingProgress("GTEST");

    assert.equal(progress.step, "skills");
    assert.deepEqual(progress.skills, []);
    assert.equal(progress.practicePassed, false);
    assert.equal(isHunterOnboardingComplete("GTEST"), false);
  });

  it("persists progress per wallet address", () => {
    installWindow();
    saveHunterOnboardingProgress(
      {
        step: "funding",
        skills: ["Bug hunting"],
        practicePassed: false,
        skipped: false,
        completedAt: null,
      },
      "GALICE",
    );

    assert.equal(getHunterOnboardingProgress("GALICE").step, "funding");
    assert.equal(getHunterOnboardingProgress("GBOB").step, "skills");

    clearHunterOnboardingProgress("GALICE");
    assert.equal(getHunterOnboardingProgress("GALICE").step, "skills");
  });

  it("treats completed and skipped walkthroughs as complete", () => {
    installWindow();
    saveHunterOnboardingProgress(
      {
        step: "complete",
        skills: ["UX feedback"],
        practicePassed: true,
        skipped: false,
        completedAt: "2026-11-23T00:00:00.000Z",
      },
      "GCOMPLETE",
    );
    saveHunterOnboardingProgress(
      {
        step: "complete",
        skills: [],
        practicePassed: false,
        skipped: true,
        completedAt: "2026-11-23T00:00:00.000Z",
      },
      "GSKIP",
    );

    assert.equal(isHunterOnboardingComplete("GCOMPLETE"), true);
    assert.equal(isHunterOnboardingComplete("GSKIP"), true);
  });
});
