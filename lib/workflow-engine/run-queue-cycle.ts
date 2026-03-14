import { processWorkflowQueue } from "@/lib/workflow-engine/queue";
import { runScheduledWorkflows } from "@/lib/workflow-engine/run-scheduled-workflows";

export async function runWorkflowQueueCycle(now = new Date()) {
  const scheduled = await runScheduledWorkflows(now);
  const queue = await processWorkflowQueue();

  return {
    timestamp: scheduled.timestamp,
    scheduled,
    queue
  };
}
