import { ExamplePage } from "@abstract-foundation/agw-example-ui";
import { Demo } from "@/components/Demo";

export default function Page() {
  return (
    <ExamplePage editPath="src/components/Demo.tsx">
      <Demo />
    </ExamplePage>
  );
}
