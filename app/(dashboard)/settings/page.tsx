import { ApiKeyForm } from "@/components/settings/ApiKeyForm";

export default function SettingsPage() {
  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <h1 className="font-mono text-3xl font-semibold text-zinc-100">
          {"API \uD0A4 \uC124\uC815"}
        </h1>
        <p className="max-w-3xl text-sm leading-6 text-zinc-400">
          {
            "\uC790\uB3D9\uD654 \uC2E4\uD589\uC5D0 \uD544\uC694\uD55C API \uD0A4\uB97C \uB4F1\uB85D\uD558\uC138\uC694. \uD0A4\uB294 \uC11C\uBC84 \uCE21\uC5D0\uC11C\uB9CC \uCC98\uB9AC\uB418\uBA70 \uC751\uB2F5\uC5D0\uC11C\uB294 \uB9C8\uC2A4\uD0B9 \uC0C1\uD0DC\uB85C\uB9CC \uD45C\uC2DC\uB429\uB2C8\uB2E4."
          }
        </p>
      </div>
      <ApiKeyForm />
    </section>
  );
}
