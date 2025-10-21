// Agent demonstrating state management with setState() and SQL

import { Agent } from "agents";

interface Env {
  // Add bindings
}

interface UserProfile {
  userId: string;
  name: string;
  email: string;
  preferences: {
    theme: 'light' | 'dark' | 'system';
    notifications: boolean;
    language: string;
  };
  loginCount: number;
  lastLogin: Date | null;
}

export class UserAgent extends Agent<Env, UserProfile> {
  initialState: UserProfile = {
    userId: "",
    name: "",
    email: "",
    preferences: {
      theme: 'system',
      notifications: true,
      language: 'en'
    },
    loginCount: 0,
    lastLogin: null
  };

  // Setup SQL database on first start
  async onStart() {
    // Create tables if they don't exist
    await this.sql`
      CREATE TABLE IF NOT EXISTS activity_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        action TEXT NOT NULL,
        details TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `;

    await this.sql`
      CREATE INDEX IF NOT EXISTS idx_timestamp ON activity_log(timestamp)
    `;

    console.log('UserAgent started:', this.name);
  }

  // HTTP request handler
  async onRequest(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const method = request.method;

    // GET /profile - Return current profile
    if (method === "GET" && url.pathname === "/profile") {
      return Response.json({
        profile: this.state,
        activityCount: await this.getActivityCount()
      });
    }

    // POST /login - Record login
    if (method === "POST" && url.pathname === "/login") {
      const { userId, name, email } = await request.json();

      // Update state
      this.setState({
        ...this.state,
        userId,
        name,
        email,
        loginCount: this.state.loginCount + 1,
        lastLogin: new Date()
      });

      // Log activity
      await this.logActivity('login', `User ${name} logged in`);

      return Response.json({
        success: true,
        loginCount: this.state.loginCount
      });
    }

    // POST /preferences - Update preferences
    if (method === "POST" && url.pathname === "/preferences") {
      const { preferences } = await request.json();

      this.setState({
        ...this.state,
        preferences: { ...this.state.preferences, ...preferences }
      });

      await this.logActivity('preferences_updated', JSON.stringify(preferences));

      return Response.json({ success: true });
    }

    // GET /activity - Get recent activity
    if (method === "GET" && url.pathname === "/activity") {
      const limit = parseInt(url.searchParams.get('limit') || '10');
      const activities = await this.getRecentActivity(limit);

      return Response.json({ activities });
    }

    return new Response("Not Found", { status: 404 });
  }

  // SQL helper: Log activity
  async logActivity(action: string, details: string = "") {
    await this.sql`
      INSERT INTO activity_log (action, details)
      VALUES (${action}, ${details})
    `;
  }

  // SQL helper: Get activity count
  async getActivityCount(): Promise<number> {
    const result = await this.sql`
      SELECT COUNT(*) as count FROM activity_log
    `;

    return result[0]?.count || 0;
  }

  // SQL helper: Get recent activity
  async getRecentActivity(limit: number = 10) {
    const activities = await this.sql`
      SELECT * FROM activity_log
      ORDER BY timestamp DESC
      LIMIT ${limit}
    `;

    return activities;
  }

  // React to state updates
  onStateUpdate(state: UserProfile, source: "server" | Connection) {
    console.log('Profile updated for:', state.userId);
    console.log('Login count:', state.loginCount);

    // Trigger actions based on state changes
    if (state.loginCount === 1) {
      console.log('First login! Send welcome email.');
    }

    if (state.loginCount > 100) {
      console.log('Power user detected!');
    }
  }
}

export default UserAgent;
