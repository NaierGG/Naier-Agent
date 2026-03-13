import { ChatToWorkflow } from "@/components/ai/ChatToWorkflow";

export default function NewWorkflowPage() {
  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <h1 className="font-mono text-3xl font-semibold text-zinc-100">
          {"\uC0C8 \uC6CC\uD06C\uD50C\uB85C\uC6B0"}
        </h1>
        <p className="max-w-3xl text-sm leading-6 text-zinc-400">
          {
            "\uC6D0\uD558\uB294 \uC8FC\uC2DD \uC790\uB3D9\uD654\uB97C \uB9D0\uB85C \uC124\uBA85\uD574\uBCF4\uC138\uC694. AI\uAC00 \uB178\uB4DC \uD750\uB984\uC744 \uC815\uB9AC\uD558\uACE0 \uBBF8\uB9AC\uBCF4\uAE30\uB97C \uC81C\uACF5\uD569\uB2C8\uB2E4."
          }
        </p>
      </div>
      <ChatToWorkflow />
    </section>
  );
}
