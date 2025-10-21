// Human-in-the-Loop (HITL) Agent

import { Agent } from "agents";

interface Env {
  // Add bindings
}

interface ApprovalRequest {
  id: string;
  type: 'booking' | 'payment' | 'data_change' | 'high_value';
  data: any;
  confidence: number;
  requestedAt: number;
  status: 'pending' | 'approved' | 'rejected';
  reviewedBy?: string;
  reviewedAt?: number;
}

interface HITLState {
  pendingApprovals: ApprovalRequest[];
  approvalHistory: ApprovalRequest[];
  autoProcessedCount: number;
  humanReviewCount: number;
}

export class HITLAgent extends Agent<Env, HITLState> {
  initialState: HITLState = {
    pendingApprovals: [],
    approvalHistory: [],
    autoProcessedCount: 0,
    humanReviewCount: 0
  };

  async onRequest(request: Request): Promise<Response> {
    const url = new URL(request.url);

    // POST /process - Process request (auto or human review)
    if (url.pathname === "/process") {
      const { data, type } = await request.json();

      const result = await this.processRequest(data, type);

      return Response.json(result);
    }

    // GET /pending - Get pending approvals
    if (url.pathname === "/pending") {
      return Response.json({
        pending: this.state.pendingApprovals,
        count: this.state.pendingApprovals.length
      });
    }

    // POST /approve/:id - Approve a request
    if (url.pathname.startsWith("/approve/")) {
      const id = url.pathname.split("/")[2];
      const { reviewedBy } = await request.json();

      const result = await this.approveRequest(id, reviewedBy);

      return Response.json(result);
    }

    // POST /reject/:id - Reject a request
    if (url.pathname.startsWith("/reject/")) {
      const id = url.pathname.split("/")[2];
      const { reviewedBy, reason } = await request.json();

      const result = await this.rejectRequest(id, reviewedBy, reason);

      return Response.json(result);
    }

    // GET /stats - Get approval statistics
    if (url.pathname === "/stats") {
      return Response.json({
        autoProcessed: this.state.autoProcessedCount,
        humanReviewed: this.state.humanReviewCount,
        pending: this.state.pendingApprovals.length,
        approvalRate: this.calculateApprovalRate()
      });
    }

    return new Response("Not Found", { status: 404 });
  }

  // Process request (decide auto vs human review)
  async processRequest(data: any, type: ApprovalRequest['type']) {
    // Step 1: Analyze request
    const analysis = await this.analyzeRequest(data, type);

    // Step 2: Decide if human review needed
    const needsHumanReview = this.needsHumanReview(analysis);

    if (!needsHumanReview) {
      // High confidence - process automatically
      const result = await this.autoProcess(data, type);

      this.setState({
        ...this.state,
        autoProcessedCount: this.state.autoProcessedCount + 1
      });

      return {
        status: 'auto_processed',
        result
      };
    }

    // Low confidence - request human review
    const approvalRequest: ApprovalRequest = {
      id: crypto.randomUUID(),
      type,
      data,
      confidence: analysis.confidence,
      requestedAt: Date.now(),
      status: 'pending'
    };

    this.setState({
      ...this.state,
      pendingApprovals: [...this.state.pendingApprovals, approvalRequest],
      humanReviewCount: this.state.humanReviewCount + 1
    });

    // Send notification to human reviewers
    await this.notifyReviewers(approvalRequest);

    return {
      status: 'pending_review',
      approvalId: approvalRequest.id,
      reason: analysis.reason
    };
  }

  // Analyze request to determine confidence
  async analyzeRequest(data: any, type: string) {
    // Implement your analysis logic here
    // Could use AI model, rules engine, etc.

    // Example logic:
    let confidence = 0.5;
    let reason = '';

    if (type === 'high_value' && data.amount > 10000) {
      confidence = 0.3;
      reason = 'High value transaction requires human approval';
    } else if (type === 'booking' && data.urgent) {
      confidence = 0.6;
      reason = 'Urgent booking may need verification';
    } else {
      confidence = 0.9;
      reason = 'Standard request';
    }

    return { confidence, reason };
  }

  // Determine if human review is needed
  needsHumanReview(analysis: { confidence: number }): boolean {
    const CONFIDENCE_THRESHOLD = 0.8;
    return analysis.confidence < CONFIDENCE_THRESHOLD;
  }

  // Process automatically (high confidence)
  async autoProcess(data: any, type: string) {
    console.log('Auto-processing:', type, data);

    // Implement auto-processing logic
    return {
      processed: true,
      timestamp: Date.now()
    };
  }

  // Approve a pending request
  async approveRequest(id: string, reviewedBy: string) {
    const approval = this.state.pendingApprovals.find(a => a.id === id);

    if (!approval) {
      return { error: 'Approval request not found' };
    }

    // Update approval
    approval.status = 'approved';
    approval.reviewedBy = reviewedBy;
    approval.reviewedAt = Date.now();

    // Process the approved request
    const result = await this.autoProcess(approval.data, approval.type);

    // Update state
    this.setState({
      ...this.state,
      pendingApprovals: this.state.pendingApprovals.filter(a => a.id !== id),
      approvalHistory: [...this.state.approvalHistory, approval]
    });

    return {
      success: true,
      result
    };
  }

  // Reject a pending request
  async rejectRequest(id: string, reviewedBy: string, reason: string) {
    const approval = this.state.pendingApprovals.find(a => a.id === id);

    if (!approval) {
      return { error: 'Approval request not found' };
    }

    // Update approval
    approval.status = 'rejected';
    approval.reviewedBy = reviewedBy;
    approval.reviewedAt = Date.now();
    (approval.data as any).rejectionReason = reason;

    // Update state
    this.setState({
      ...this.state,
      pendingApprovals: this.state.pendingApprovals.filter(a => a.id !== id),
      approvalHistory: [...this.state.approvalHistory, approval]
    });

    return { success: true };
  }

  // Notify human reviewers
  async notifyReviewers(approval: ApprovalRequest) {
    console.log('Notifying reviewers for:', approval.id);

    // Implement notification logic:
    // - Send email
    // - Push notification
    // - Slack message
    // - Update dashboard
  }

  // Calculate approval rate
  calculateApprovalRate(): number {
    const approved = this.state.approvalHistory.filter(a => a.status === 'approved').length;
    const total = this.state.approvalHistory.length;

    return total > 0 ? approved / total : 0;
  }
}

export default HITLAgent;
