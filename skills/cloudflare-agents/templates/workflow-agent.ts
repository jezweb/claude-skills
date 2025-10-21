// Agent that triggers Cloudflare Workflows

import { Agent } from "agents";
import { WorkflowEntrypoint, WorkflowEvent, WorkflowStep } from "cloudflare:workers";

interface Env {
  MY_WORKFLOW: Workflow;
  MyAgent: AgentNamespace<MyAgent>;
}

interface WorkflowState {
  workflowsTriggered: number;
  activeWorkflows: string[];
}

export class WorkflowAgent extends Agent<Env, WorkflowState> {
  initialState: WorkflowState = {
    workflowsTriggered: 0,
    activeWorkflows: []
  };

  async onRequest(request: Request): Promise<Response> {
    const url = new URL(request.url);

    // POST /workflow/trigger - Trigger workflow immediately
    if (url.pathname === "/workflow/trigger") {
      const { userId, data } = await request.json();

      const instance = await this.env.MY_WORKFLOW.create({
        id: `workflow-${userId}-${Date.now()}`,
        params: { userId, ...data }
      });

      this.setState({
        ...this.state,
        workflowsTriggered: this.state.workflowsTriggered + 1,
        activeWorkflows: [...this.state.activeWorkflows, instance.id]
      });

      return Response.json({
        workflowId: instance.id,
        status: 'triggered'
      });
    }

    // POST /workflow/schedule - Schedule workflow for later
    if (url.pathname === "/workflow/schedule") {
      const { delaySeconds, data } = await request.json();

      // Schedule a task that will trigger the workflow
      const { id: taskId } = await this.schedule(
        delaySeconds,
        "triggerWorkflow",
        data
      );

      return Response.json({
        scheduledTaskId: taskId,
        runsIn: delaySeconds
      });
    }

    // POST /workflow/status - Check workflow status
    if (url.pathname === "/workflow/status") {
      const { workflowId } = await request.json();

      // Note: Workflow status checking depends on your Workflow implementation
      // See Cloudflare Workflows docs for details

      return Response.json({
        workflowId,
        message: 'Status checking not implemented (see Workflows docs)'
      });
    }

    return new Response("Not Found", { status: 404 });
  }

  // Triggered by scheduled task
  async triggerWorkflow(data: any) {
    const instance = await this.env.MY_WORKFLOW.create({
      id: `delayed-workflow-${Date.now()}`,
      params: data
    });

    this.setState({
      ...this.state,
      workflowsTriggered: this.state.workflowsTriggered + 1,
      activeWorkflows: [...this.state.activeWorkflows, instance.id]
    });

    // Schedule another task to check workflow status
    await this.schedule("*/5 * * * *", "checkWorkflowStatus", {
      workflowId: instance.id
    });

    console.log('Workflow triggered:', instance.id);
  }

  // Check workflow status periodically
  async checkWorkflowStatus(data: { workflowId: string }) {
    console.log('Checking workflow status:', data.workflowId);

    // Implement status checking logic here
    // If workflow completed, cancel this recurring task
  }
}

// Example Workflow definition (can be in same or different file/project)
export class MyWorkflow extends WorkflowEntrypoint<Env> {
  async run(event: WorkflowEvent<{ userId: string; data: any }>, step: WorkflowStep) {
    // Step 1: Process data
    const processed = await step.do('process-data', async () => {
      console.log('Processing data for user:', event.payload.userId);
      return { processed: true, userId: event.payload.userId };
    });

    // Step 2: Send notification
    await step.do('send-notification', async () => {
      console.log('Sending notification to:', processed.userId);
      // Send email, push notification, etc.
    });

    // Step 3: Update records
    await step.do('update-records', async () => {
      console.log('Updating records');
      // Update database, etc.
    });

    return { success: true, steps: 3 };
  }
}

export default WorkflowAgent;
