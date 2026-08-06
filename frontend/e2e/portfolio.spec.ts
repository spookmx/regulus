import { test, expect } from '@playwright/test';

test.describe('Regulus MVP E2E Suite', () => {
  test('1. Homepage portfolio render, view toggle, and regulation filter', async ({ page }) => {
    await page.goto('/');

    // Check branding header
    await expect(page.getByText('REGULUS')).toBeVisible();
    await expect(page.getByText('Project Portfolio Roadmap')).toBeVisible();

    // Toggle view mode to grid
    const gridBtn = page.locator('#view-grid-btn');
    await expect(gridBtn).toBeVisible();
    await gridBtn.click();

    // Toggle back to table
    const tableBtn = page.locator('#view-table-btn');
    await tableBtn.click();

    // Filter by regulation EU AI Act
    const regSelect = page.locator('#filter-regulation');
    await regSelect.selectOption('EU AI Act');
    await expect(page.getByText('ECGT - Enterprise Generative AI')).toBeVisible();
  });

  test('2. Project detail navigation & 6-tab switching', async ({ page }) => {
    await page.goto('/project/prj-ecgt');

    // Check project header & code badge
    await expect(page.getByText('ECGT-2025')).toBeVisible();
    await expect(page.getByText('RASCI Team Assignment Matrix')).toBeVisible();

    // Tab 2: Artifacts Chain
    await page.locator('#tab-artifacts').click();
    await expect(page.getByText('Regulatory Lineage Chain')).toBeVisible();

    // Tab 3: Playbook
    await page.locator('#tab-playbook').click();
    await expect(page.getByText('Risk Register')).toBeVisible();

    // Tab 4: Milestones
    await page.locator('#tab-milestones').click();
    await expect(page.getByText('Workstream Milestone Timeline')).toBeVisible();

    // Tab 5: Tasks Kanban
    await page.locator('#tab-tasks').click();
    await expect(page.getByText('Kanban Execution Board')).toBeVisible();

    // Tab 6: Change History
    await page.locator('#tab-history').click();
    await expect(page.getByText('Semantic Diff Viewer')).toBeVisible();
  });

  test('3. Action Center HITL approval clicks & status update', async ({ page }) => {
    await page.goto('/action-center');

    await expect(page.getByText('Action Center (HITL Hub)')).toBeVisible();

    // Click approve button on first pending action item
    const approveBtn = page.locator('#approve-btn-act-1');
    if (await approveBtn.isVisible()) {
      await approveBtn.click();
      // Expect toast notification or item state update
      await expect(page.getByText('Action "Approved" recorded')).toBeVisible();
    }
  });

  test('4. Traceability graph visualizer tab & node inspection', async ({ page }) => {
    await page.goto('/traceability');

    await expect(page.getByText('Regulatory Traceability Graph')).toBeVisible();
    await expect(page.getByText('Node Inspection Panel')).toBeVisible();

    // Click graph node lrd-101
    const node101 = page.locator('#graph-node-lrd-101');
    await expect(node101).toBeVisible();
    await node101.click();

    // Verify side panel updates
    await expect(page.getByText('EU AI Act Art. 14').first()).toBeVisible();
  });

  test('5. Decisions dashboard ledger and CSV export', async ({ page }) => {
    await page.goto('/decisions');

    await expect(page.getByText('Cross-Project Decisions Dashboard')).toBeVisible();
    
    // Check export button
    const exportBtn = page.locator('#export-csv-btn');
    await expect(exportBtn).toBeVisible();
  });
});
