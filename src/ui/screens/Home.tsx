import { ButtonLink } from "../components/ui";

export function Home() {
  return (
    <main>
      <h1>Lëtzebuergesch</h1>
      <ButtonLink to="/revision?mode=jour" variant="primary" block>
        Session du jour
      </ButtonLink>
    </main>
  );
}
