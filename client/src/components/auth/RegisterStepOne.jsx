import { useIntlayer } from "react-intlayer";
import { Input, Button } from "@components/common";
import registerContent from "@/content/auth/register.content";

export default function RegisterStepOne({ email, errors, onChange, onNext, checking }) {
  const t = useIntlayer(registerContent.key);

  const handleInputChange = (e) => {
    onChange({ [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onNext();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="text-center mb-6">
        <h2 className="text-heading-4 text-neutral-900 dark:text-neutral-100">{t.step1Title}</h2>
      </div>

      <Input
        type="email"
        label={t.emailLabel.value}
        name="email"
        value={email}
        onChange={handleInputChange}
        placeholder={t.emailPlaceholder.value}
        error={errors.email}
        disabled={checking}
        required
      />

      <p className="text-body-2 text-neutral-600">{t.emailHint}</p>

      <Button
        type="submit"
        variant="primary"
        loading={checking}
        disabled={checking || !email}
        className="w-full"
      >
        {t.nextButton}
      </Button>
    </form>
  );
}
