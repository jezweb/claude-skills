// Agent with task scheduling (delays, dates, cron)

import { Agent } from "agents";

interface Env {
  // Add bindings
}

interface SchedulerState {
  tasksScheduled: number;
  tasksCompleted: number;
  lastTaskRun: Date | null;
}

export class SchedulerAgent extends Agent<Env, SchedulerState> {
  initialState: SchedulerState = {
    tasksScheduled: 0,
    tasksCompleted: 0,
    lastTaskRun: null
  };

  async onRequest(request: Request): Promise<Response> {
    const url = new URL(request.url);

    // POST /schedule/delay - Schedule task with delay (seconds)
    if (url.pathname === "/schedule/delay") {
      const { seconds, data } = await request.json();

      const { id } = await this.schedule(seconds, "runDelayedTask", data);

      this.setState({
        ...this.state,
        tasksScheduled: this.state.tasksScheduled + 1
      });

      return Response.json({ taskId: id, runsIn: seconds });
    }

    // POST /schedule/date - Schedule task for specific date
    if (url.pathname === "/schedule/date") {
      const { date, data } = await request.json();

      const targetDate = new Date(date);
      const { id } = await this.schedule(targetDate, "runScheduledTask", data);

      return Response.json({ taskId: id, runsAt: targetDate.toISOString() });
    }

    // POST /schedule/cron - Schedule recurring task
    if (url.pathname === "/schedule/cron") {
      const { cron, data } = await request.json();

      // Examples:
      // "*/10 * * * *" = Every 10 minutes
      // "0 8 * * *" = Every day at 8 AM
      // "0 9 * * 1" = Every Monday at 9 AM
      const { id } = await this.schedule(cron, "runCronTask", data);

      return Response.json({ taskId: id, schedule: cron });
    }

    // GET /tasks - List all scheduled tasks
    if (url.pathname === "/tasks") {
      const allTasks = this.getSchedules();

      return Response.json({
        total: allTasks.length,
        tasks: allTasks.map(task => ({
          id: task.id,
          callback: task.callback,
          type: task.type,
          time: new Date(task.time).toISOString(),
          payload: task.payload
        }))
      });
    }

    // GET /tasks/upcoming - Get tasks in next 24 hours
    if (url.pathname === "/tasks/upcoming") {
      const upcomingTasks = this.getSchedules({
        timeRange: {
          start: new Date(),
          end: new Date(Date.now() + 24 * 60 * 60 * 1000)
        }
      });

      return Response.json({ tasks: upcomingTasks });
    }

    // DELETE /tasks/:id - Cancel a task
    if (url.pathname.startsWith("/tasks/")) {
      const taskId = url.pathname.split("/")[2];
      const cancelled = await this.cancelSchedule(taskId);

      return Response.json({ cancelled });
    }

    // GET /status
    if (url.pathname === "/status") {
      return Response.json({
        state: this.state,
        activeTasks: this.getSchedules().length
      });
    }

    return new Response("Not Found", { status: 404 });
  }

  // CRITICAL: Callback methods must exist for scheduled tasks

  // Run delayed task (one-time)
  async runDelayedTask(data: any) {
    console.log('Running delayed task with data:', data);

    this.setState({
      ...this.state,
      tasksCompleted: this.state.tasksCompleted + 1,
      lastTaskRun: new Date()
    });

    // Perform task actions...
    // Send email, make API call, update database, etc.
  }

  // Run scheduled task (specific date)
  async runScheduledTask(data: any) {
    console.log('Running scheduled task at:', new Date());

    this.setState({
      ...this.state,
      tasksCompleted: this.state.tasksCompleted + 1,
      lastTaskRun: new Date()
    });

    // Perform scheduled actions...
  }

  // Run cron task (recurring)
  async runCronTask(data: any) {
    console.log('Running cron task at:', new Date());

    this.setState({
      ...this.state,
      tasksCompleted: this.state.tasksCompleted + 1,
      lastTaskRun: new Date()
    });

    // Perform recurring actions...
    // Daily report, hourly check, weekly backup, etc.
  }

  // Example: Setup recurring tasks on first start
  async onStart() {
    // Only schedule if not already scheduled
    const cronTasks = this.getSchedules({ type: "cron" });

    if (cronTasks.length === 0) {
      // Daily report at 8 AM
      await this.schedule("0 8 * * *", "runCronTask", {
        type: "daily_report"
      });

      // Hourly check
      await this.schedule("0 * * * *", "runCronTask", {
        type: "hourly_check"
      });

      console.log('Recurring tasks scheduled');
    }
  }
}

export default SchedulerAgent;
