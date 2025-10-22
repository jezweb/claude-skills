/**
 * Scheduled Workflow Example
 *
 * Demonstrates:
 * - step.sleep() for relative delays
 * - step.sleepUntil() for absolute times
 * - Scheduling daily/weekly tasks
 * - Long-running processes
 */

import { WorkflowEntrypoint, WorkflowStep, WorkflowEvent } from 'cloudflare:workers';

type Env = {
  MY_WORKFLOW: Workflow;
  DB: D1Database;
};

type ReportParams = {
  reportType: 'daily' | 'weekly' | 'monthly';
  recipients: string[];
};

/**
 * Scheduled Reporting Workflow
 *
 * Generates and sends reports on a schedule:
 * - Daily reports at 9am UTC
 * - Weekly reports on Monday 9am UTC
 * - Monthly reports on 1st of month 9am UTC
 */
export class ScheduledReportWorkflow extends WorkflowEntrypoint<Env, ReportParams> {
  async run(event: WorkflowEvent<ReportParams>, step: WorkflowStep) {
    const { reportType, recipients } = event.payload;

    if (reportType === 'daily') {
      await this.runDailyReport(step, recipients);
    } else if (reportType === 'weekly') {
      await this.runWeeklyReport(step, recipients);
    } else if (reportType === 'monthly') {
      await this.runMonthlyReport(step, recipients);
    }

    return { reportType, status: 'complete' };
  }

  /**
   * Daily report - runs every day at 9am UTC
   */
  private async runDailyReport(step: WorkflowStep, recipients: string[]) {
    // Calculate next 9am UTC
    const now = new Date();
    const next9am = new Date();
    next9am.setUTCDate(next9am.getUTCDate() + 1);
    next9am.setUTCHours(9, 0, 0, 0);

    // Sleep until tomorrow 9am
    await step.sleepUntil('wait until 9am tomorrow', next9am);

    // Generate report
    const report = await step.do('generate daily report', async () => {
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      const dateStr = yesterday.toISOString().split('T')[0];

      const results = await this.env.DB.prepare(
        'SELECT * FROM daily_metrics WHERE date = ?'
      ).bind(dateStr).all();

      return {
        date: dateStr,
        type: 'daily',
        metrics: results.results
      };
    });

    // Send report
    await step.do('send daily report', async () => {
      await this.sendReport(report, recipients);
      return { sent: true };
    });
  }

  /**
   * Weekly report - runs every Monday at 9am UTC
   */
  private async runWeeklyReport(step: WorkflowStep, recipients: string[]) {
    // Calculate next Monday 9am UTC
    const nextMonday = new Date();
    const daysUntilMonday = (1 + 7 - nextMonday.getDay()) % 7 || 7;
    nextMonday.setDate(nextMonday.getDate() + daysUntilMonday);
    nextMonday.setUTCHours(9, 0, 0, 0);

    await step.sleepUntil('wait until Monday 9am', nextMonday);

    // Generate report
    const report = await step.do('generate weekly report', async () => {
      const lastWeek = new Date();
      lastWeek.setDate(lastWeek.getDate() - 7);

      const results = await this.env.DB.prepare(
        'SELECT * FROM daily_metrics WHERE date >= ? ORDER BY date DESC'
      ).bind(lastWeek.toISOString().split('T')[0]).all();

      return {
        weekStart: lastWeek.toISOString().split('T')[0],
        type: 'weekly',
        metrics: results.results
      };
    });

    // Send report
    await step.do('send weekly report', async () => {
      await this.sendReport(report, recipients);
      return { sent: true };
    });
  }

  /**
   * Monthly report - runs on 1st of each month at 9am UTC
   */
  private async runMonthlyReport(step: WorkflowStep, recipients: string[]) {
    // Calculate first day of next month at 9am UTC
    const firstOfNextMonth = new Date();
    firstOfNextMonth.setUTCMonth(firstOfNextMonth.getUTCMonth() + 1, 1);
    firstOfNextMonth.setUTCHours(9, 0, 0, 0);

    await step.sleepUntil('wait until 1st of month 9am', firstOfNextMonth);

    // Generate report
    const report = await step.do('generate monthly report', async () => {
      const lastMonth = new Date();
      lastMonth.setMonth(lastMonth.getMonth() - 1);
      const monthStart = new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 1);
      const monthEnd = new Date(lastMonth.getFullYear(), lastMonth.getMonth() + 1, 0);

      const results = await this.env.DB.prepare(
        'SELECT * FROM daily_metrics WHERE date >= ? AND date <= ? ORDER BY date DESC'
      ).bind(
        monthStart.toISOString().split('T')[0],
        monthEnd.toISOString().split('T')[0]
      ).all();

      return {
        month: lastMonth.toISOString().substring(0, 7), // YYYY-MM
        type: 'monthly',
        metrics: results.results
      };
    });

    // Send report
    await step.do('send monthly report', async () => {
      await this.sendReport(report, recipients);
      return { sent: true };
    });
  }

  /**
   * Send report via email
   */
  private async sendReport(report: any, recipients: string[]) {
    const subject = `${report.type.charAt(0).toUpperCase() + report.type.slice(1)} Report`;

    await fetch('https://api.example.com/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: recipients,
        subject,
        body: this.formatReport(report)
      })
    });
  }

  /**
   * Format report data as HTML
   */
  private formatReport(report: any): string {
    // Format report metrics as HTML
    return `
      <h1>${report.type} Report</h1>
      <p>Period: ${report.date || report.weekStart || report.month}</p>
      <pre>${JSON.stringify(report.metrics, null, 2)}</pre>
    `;
  }
}

/**
 * Example: Reminder Workflow with Multiple Delays
 */
export class ReminderWorkflow extends WorkflowEntrypoint<Env, { userId: string; message: string }> {
  async run(event: WorkflowEvent<{ userId: string; message: string }>, step: WorkflowStep) {
    const { userId, message } = event.payload;

    // Send initial reminder
    await step.do('send initial reminder', async () => {
      await this.sendReminder(userId, message);
      return { sent: true };
    });

    // Wait 1 hour
    await step.sleep('wait 1 hour', '1 hour');

    // Send second reminder
    await step.do('send second reminder', async () => {
      await this.sendReminder(userId, `Reminder: ${message}`);
      return { sent: true };
    });

    // Wait 1 day
    await step.sleep('wait 1 day', '1 day');

    // Send final reminder
    await step.do('send final reminder', async () => {
      await this.sendReminder(userId, `Final reminder: ${message}`);
      return { sent: true };
    });

    return { userId, remindersSent: 3 };
  }

  private async sendReminder(userId: string, message: string) {
    await fetch(`https://api.example.com/send-notification`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, message })
    });
  }
}

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const url = new URL(req.url);

    if (url.pathname.startsWith('/favicon')) {
      return Response.json({}, { status: 404 });
    }

    // Create daily report workflow
    const instance = await env.MY_WORKFLOW.create({
      params: {
        reportType: 'daily',
        recipients: ['admin@example.com', 'team@example.com']
      }
    });

    return Response.json({
      id: instance.id,
      status: await instance.status(),
      message: 'Daily report workflow scheduled'
    });
  }
};
