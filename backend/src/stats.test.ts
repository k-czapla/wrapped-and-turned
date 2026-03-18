import { describe, it, expect } from "vitest";
import {
  computeBaseStats,
  safeDate,
  withinRange,
  inc,
  monthKey,
  mapWithConcurrency,
} from "./stats.js";
import type { RavelryProjectListItem } from "./ravelryApi.js";

describe("stats", () => {
  describe("safeDate", () => {
    it("should parse valid ISO date strings", () => {
      const date = safeDate("2025-01-15");
      expect(date).toBeInstanceOf(Date);
      expect(date?.getFullYear()).toBe(2025);
      expect(date?.getMonth()).toBe(0); // January is 0
      expect(date?.getDate()).toBe(15);
    });

    it("should return null for invalid dates", () => {
      expect(safeDate("invalid-date")).toBeNull();
      expect(safeDate("")).toBeNull();
    });

    it("should return null for undefined", () => {
      expect(safeDate(undefined)).toBeNull();
    });
  });

  describe("withinRange", () => {
    it("should return true for dates within range", () => {
      const date = new Date("2025-06-15");
      const from = new Date("2025-01-01");
      const to = new Date("2025-12-31");
      expect(withinRange(date, from, to)).toBe(true);
    });

    it("should return false for dates before range", () => {
      const date = new Date("2024-12-31");
      const from = new Date("2025-01-01");
      const to = new Date("2025-12-31");
      expect(withinRange(date, from, to)).toBe(false);
    });

    it("should return false for dates after range", () => {
      const date = new Date("2026-01-01");
      const from = new Date("2025-01-01");
      const to = new Date("2025-12-31");
      expect(withinRange(date, from, to)).toBe(false);
    });

    it("should include boundary dates", () => {
      const from = new Date("2025-01-01");
      const to = new Date("2025-12-31");
      expect(withinRange(from, from, to)).toBe(true);
      expect(withinRange(to, from, to)).toBe(true);
    });
  });

  describe("inc", () => {
    it("should increment existing key", () => {
      const map: Record<string, number> = { Knitting: 5 };
      inc(map, "Knitting", 2);
      expect(map.Knitting).toBe(7);
    });

    it("should create new key with default increment", () => {
      const map: Record<string, number> = {};
      inc(map, "Crochet");
      expect(map.Crochet).toBe(1);
    });

    it("should handle zero values", () => {
      const map: Record<string, number> = {};
      inc(map, "Spinning", 0);
      expect(map.Spinning).toBe(0);
    });
  });

  describe("monthKey", () => {
    it("should format date as YYYY-MM", () => {
      const date = new Date("2025-03-15");
      expect(monthKey(date)).toBe("2025-03");
    });

    it("should pad single digit months", () => {
      const date = new Date("2025-01-15");
      expect(monthKey(date)).toBe("2025-01");
    });

    it("should handle December correctly", () => {
      const date = new Date("2025-12-31");
      expect(monthKey(date)).toBe("2025-12");
    });
  });

  describe("computeBaseStats", () => {
    const mockProjects: RavelryProjectListItem[] = [
      {
        id: 1,
        name: "Project 1",
        completed: "2025-03-15",
        started: "2025-03-01",
        craft_name: "Knitting",
      },
      {
        id: 2,
        name: "Project 2",
        completed: "2025-06-20",
        started: "2025-06-01",
        craft_name: "Crochet",
      },
      {
        id: 3,
        name: "Project 3",
        completed: "2025-08-10",
        started: "2025-08-01",
        craft_name: "Knitting",
      },
      {
        id: 4,
        name: "Project 4",
        started: "2024-12-01", // Outside range, no completion
        craft_name: "Knitting",
      },
      {
        id: 5,
        name: "Project 5",
        completed: "2026-01-15", // Outside range
        started: "2025-12-01",
        craft_name: "Crochet",
      },
    ];

    it("should filter finished projects (FOs) and all projects in range", () => {
      const result = computeBaseStats({
        from: "2025-01-01",
        to: "2025-12-31",
        items: mockProjects,
      });

      expect(result.finishedInRange).toHaveLength(3);
      expect(result.finishedInRange.map((p) => p.id)).toEqual([1, 2, 3]);
      // projectsInRange = started or completed in range, or in progress during range:
      // 1,2,3 (completed in range), 4 (started before range, still in progress), 5 (started in range)
      expect(result.projectsInRange).toHaveLength(5);
      expect(result.projectsInRange.map((p) => p.id)).toEqual([1, 2, 3, 4, 5]);
    });

    it("should count crafts correctly", () => {
      const result = computeBaseStats({
        from: "2025-01-01",
        to: "2025-12-31",
        items: mockProjects,
      });

      expect(result.craft.Knitting).toBe(2);
      expect(result.craft.Crochet).toBe(1);
    });

    it("should identify most productive month", () => {
      const projectsWithMultipleInMonth: RavelryProjectListItem[] = [
        {
          id: 1,
          name: "Project 1",
          completed: "2025-03-15",
          craft_name: "Knitting",
        },
        {
          id: 2,
          name: "Project 2",
          completed: "2025-03-20",
          craft_name: "Crochet",
        },
        {
          id: 3,
          name: "Project 3",
          completed: "2025-06-10",
          craft_name: "Knitting",
        },
      ];

      const result = computeBaseStats({
        from: "2025-01-01",
        to: "2025-12-31",
        items: projectsWithMultipleInMonth,
      });

      expect(result.mostProductiveMonth).toBe("2025-03");
    });

    it("should include projects started before range but still in progress (Project Update)", () => {
      const projects: RavelryProjectListItem[] = [
        {
          id: 1,
          name: "Ongoing",
          started: "2024-06-01",
          craft_name: "Knitting",
        },
      ];

      const result = computeBaseStats({
        from: "2025-01-01",
        to: "2025-12-31",
        items: projects,
      });

      expect(result.finishedInRange).toHaveLength(0);
      expect(result.projectsInRange).toHaveLength(1);
      expect(result.projectsInRange[0].id).toBe(1);
    });

    it("should exclude projects without completed date from FOs (only started does not count as FO)", () => {
      const projects: RavelryProjectListItem[] = [
        {
          id: 1,
          name: "Project 1",
          started: "2025-06-15",
          craft_name: "Knitting",
        },
      ];

      const result = computeBaseStats({
        from: "2025-01-01",
        to: "2025-12-31",
        items: projects,
      });

      expect(result.finishedInRange).toHaveLength(0);
      expect(result.projectsInRange).toHaveLength(1);
      expect(result.craft.Knitting ?? 0).toBe(0);
    });

    it("should handle empty project list", () => {
      const result = computeBaseStats({
        from: "2025-01-01",
        to: "2025-12-31",
        items: [],
      });

      expect(result.finishedInRange).toHaveLength(0);
      expect(result.projectsInRange).toHaveLength(0);
      expect(result.craft).toEqual({});
      expect(result.mostProductiveMonth).toBeUndefined();
    });
  });

  describe("mapWithConcurrency", () => {
    it("should process all items", async () => {
      const items = [1, 2, 3, 4, 5];
      const mapper = async (n: number) => n * 2;
      const result = await mapWithConcurrency(items, 3, mapper);
      expect(result).toEqual([2, 4, 6, 8, 10]);
    });

    it("should respect concurrency limit", async () => {
      const items = [1, 2, 3, 4, 5];
      let maxConcurrent = 0;
      let currentConcurrent = 0;

      const mapper = async (n: number) => {
        currentConcurrent++;
        maxConcurrent = Math.max(maxConcurrent, currentConcurrent);
        await new Promise((resolve) => setTimeout(resolve, 10));
        currentConcurrent--;
        return n * 2;
      };

      await mapWithConcurrency(items, 2, mapper);
      expect(maxConcurrent).toBeLessThanOrEqual(2);
    });

    it("should handle empty array", async () => {
      const result = await mapWithConcurrency([], 3, async (n: number) => n);
      expect(result).toEqual([]);
    });

    it("should preserve order", async () => {
      const items = [1, 2, 3, 4, 5];
      const mapper = async (n: number) => {
        // Simulate variable processing time
        await new Promise((resolve) => setTimeout(resolve, Math.random() * 10));
        return n;
      };
      const result = await mapWithConcurrency(items, 3, mapper);
      expect(result).toEqual([1, 2, 3, 4, 5]);
    });
  });
});
