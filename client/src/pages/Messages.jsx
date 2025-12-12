import { useIntlayer } from "react-intlayer";
export default function Messages() {
  const content = useIntlayer("app");
  return (
    <>
      <h1 className="text-3xl font-bold underline">{content.messages}</h1>
    </>
  );
}
