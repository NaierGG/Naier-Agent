import { schedule } from "@netlify/functions";

import { runScheduledWorkflows } from "../../lib/workflow-engine/run-scheduled-workflows";

export const handler = schedule("* * * * *", async () => {
  const result = await runScheduledWorkflows(new Date());

  return {
    statusCode: 200,
    body: JSON.stringify(result)
  };
});
