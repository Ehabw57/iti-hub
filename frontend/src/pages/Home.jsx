import { useIntlayer } from "react-intlayer";
import Hamada from "../components/Hamda/Hamada";
export default function Home() {
    const content = useIntlayer("app"); 
  return (
    <>
      <h1 className="text-3xl font-bold underline">{content.home}</h1>
      <Hamada />
    </>
  );
}
