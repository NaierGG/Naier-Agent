import { schedule } from "@netlify/functions";

import { runWorkflowQueueCycle } from "../../lib/workflow-engine/run-queue-cycle";

export const handler = schedule("* * * * *", async () => {
  const result = await runWorkflowQueueCycle(new Date());

  return {
    statusCode: 200,
    body: JSON.stringify(result)
  };
});
