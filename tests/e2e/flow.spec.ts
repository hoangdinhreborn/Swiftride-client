import { test, expect } from "@playwright/test";

test.describe("SwiftRide Client End-to-End Scenarios", () => {
  test("Homepage loads and displays Rider and Driver options", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("SWIFTRIDE")).toBeVisible();
    await expect(page.getByText("Dành cho Rider")).toBeVisible();
    await expect(page.getByText("Dành cho Driver")).toBeVisible();
  });

  test("Rider login flow navigates to Rider booking screen", async ({ page }) => {
    await page.goto("/login?role=Rider");
    await expect(page.getByText("Chọn vai trò trải nghiệm")).toBeVisible();
    await page.click("text=Đăng nhập ngay với quyền Rider");
    await page.waitForURL("**/rider");
    await expect(page.getByText("Lộ trình chuyến đi")).toBeVisible();
  });

  test("Driver login flow navigates to Driver console", async ({ page }) => {
    await page.goto("/login?role=Driver");
    await expect(page.getByText("Chọn vai trò trải nghiệm")).toBeVisible();
    await page.click("text=Đăng nhập ngay với quyền Driver");
    await page.waitForURL("**/driver");
    await expect(page.getByText("BẢNG ĐIỀU KHIỂN")).toBeVisible();
  });
});
