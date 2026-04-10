import { env } from "~/env";

enum HTTPMethod {
  GET = "GET",
  POST = "POST",
  PUT = "PUT",
  DELETE = "DELETE",
}

export type TaskStats = {
  summary: {
    total: number;
    success: number;
    failure: number;
    pending: number;
    started: number;
    retry: number;
    success_rate: number;
  };
  top_tasks: Array<{ name: string; count: number }>;
  generated_at: string;
};

export type Task = {
  id: number;
  task_id: string;
  status: string;
  name: string;
  worker: string;
  queue: string;
  retries: number;
  date_done: string;
  traceback: string;
  args: {
    decoded: JSON | null;
    format: string;
  };
  kwargs: {
    decoded: JSON | null;
    format: string;
  };
  result: {
    decoded: JSON | null;
    format: string;
  };
};

class WorkerDashboardAPI {
  private apiUrl: string;
  private secret: string;

  constructor() {
    if (env.WORKER_API_URL === undefined || env.WORKER_SECRET === undefined) {
      throw new Error("WORKER_API_URL and WORKER_SECRET are required");
    }

    this.apiUrl = env.WORKER_API_URL;
    this.secret = env.WORKER_SECRET;

    console.log("Initializing WorkerDashboardAPI");
  }

  async makeRequest(
    method: HTTPMethod,
    endpoint: string,
    data: JSON | null = null,
    opts: RequestInit = {},
  ): Promise<Response> {
    const res = await fetch(`${this.apiUrl}${endpoint}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        "X-Hackfest-Secret": this.secret,
        ...opts.headers,
      },
      body: data ? JSON.stringify(data) : null,
      ...opts,
    });

    return res;
  }

  async getDetails(): Promise<TaskStats | null> {
    const res = await this.makeRequest(HTTPMethod.GET, "/api/stats");

    if (!res.ok) {
      return null;
    }

    return (await res.json()) as TaskStats;
  }

  async getTaskList(params: { [k: string]: string }): Promise<{
    items: Array<Task>;
    total: number;
    limit: number;
    offset: number;
  } | null> {
    const queryParams = new URLSearchParams(params).toString();
    const res = await this.makeRequest(
      HTTPMethod.GET,
      `/api/tasks?${queryParams}`,
    );

    if (!res.ok) {
      return null;
    }

    const data = (await res.json()) as {
      items: Array<Task>;
      total: number;
      limit: number;
      offset: number;
    };

    return data;
  }

  async toggleDataSync(): Promise<{
    status: "started" | "stopped" | "running" | "not_running";
    message: string;
  }> {
    const enabledRes = await this.makeRequest(
      HTTPMethod.GET,
      "/api/sync/status",
    );
    const { running }: { running: boolean } = await enabledRes.json();

    if (!running) {
      const res = await this.makeRequest(HTTPMethod.POST, "/api/sync/start");
      return (await res.json()) as {
        status: "started" | "stopped" | "running" | "not_running";
        message: string;
      };
    } else {
      const res = await this.makeRequest(HTTPMethod.POST, "/api/sync/stop");
      return (await res.json()) as {
        status: "started" | "stopped" | "running" | "not_running";
        message: string;
      };
    }
  }
}

const globalForWorkerDashboardAPI = global as unknown as {
  workerDashboardAPI?: WorkerDashboardAPI;
};

function getWorkerDashboardAPI(): WorkerDashboardAPI {
  if (!globalForWorkerDashboardAPI.workerDashboardAPI) {
    globalForWorkerDashboardAPI.workerDashboardAPI = new WorkerDashboardAPI();
  }
  return globalForWorkerDashboardAPI.workerDashboardAPI;
}

export const workerDashboardAPI = getWorkerDashboardAPI();
