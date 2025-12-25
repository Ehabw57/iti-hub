import { useIntlayer } from "react-intlayer";
import { Input, Button } from "@components/common";
import { AiOutlineCheckCircle, AiOutlineCloseCircle } from "react-icons/ai";
import { validatePassword } from "@/utils/registerHelpers";
import registerContent from "@/content/auth/register.content";

export default function RegisterStepThree({
  firstName,
  lastName,
  password,
  confirmPassword,
  errors,
  onChange,
  onSubmit,
  onBack,
  submitting,
}) {
  const t = useIntlayer(registerContent.key);

  const handleInputChange = (e) => {
    onChange({ [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit();
  };

  const passwordChecks = password ? validatePassword(password) : null;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="text-center mb-6">
        <h2 className="text-heading-4 text-neutral-900 dark:text-neutral-100">{t.step3Title}</h2>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Input
          type="text"
          label={t.firstNameLabel.value}
          name="firstName"
          value={firstName}
          onChange={handleInputChange}
          placeholder={t.firstNamePlaceholder.value}
          error={errors.firstName}
          disabled={submitting}
          required
        />

        <Input
          type="text"
          label={t.lastNameLabel.value}
          name="lastName"
          value={lastName}
          onChange={handleInputChange}
          placeholder={t.lastNamePlaceholder.value}
          error={errors.lastName}
          disabled={submitting}
          required
        />
      </div>

      <Input
        type="password"
        label={t.passwordLabel.value}
        name="password"
        value={password}
        onChange={handleInputChange}
        placeholder={t.passwordPlaceholder.value}
        error={errors.password}
        disabled={submitting}
        required
      />

      {/* Password Policy Checklist */}
      {password && passwordChecks && (
        <div className="bg-neutral-50 p-3 rounded-lg space-y-2">
          <p className="text-body-2 font-medium text-neutral-700">
            {t.passwordPolicyTitle}
          </p>
          <div className="space-y-1">
            <PolicyCheck met={passwordChecks.minLength} text={t.policyMinLength} />
            <PolicyCheck met={passwordChecks.hasLetter} text={t.policyLetter} />
            <PolicyCheck met={passwordChecks.hasNumber} text={t.policyNumber} />
            <PolicyCheck met={passwordChecks.hasSpecial} text={t.policySpecial} />
          </div>
        </div>
      )}

      <Input
        type="password"
        label={t.confirmPasswordLabel.value}
        name="confirmPassword"
        value={confirmPassword}
        onChange={handleInputChange}
        placeholder={t.confirmPasswordPlaceholder.value}
        error={errors.confirmPassword}
        disabled={submitting}
        required
      />

      <div className="flex gap-3">
        <Button
          type="button"
          variant="secondary"
          onClick={onBack}
          disabled={submitting}
          className="w-full"
        >
          {t.backButton}
        </Button>
        <Button
          type="submit"
          variant="primary"
          loading={submitting}
          disabled={submitting}
          className="w-full"
        >
          {t.submitButton}
        </Button>
      </div>
    </form>
  );
}

// Helper component for password policy checks
function PolicyCheck({ met, text }) {
  return (
    <div className="flex items-center gap-2 text-body-2">
      {met ? (
        <AiOutlineCheckCircle className="h-4 w-4 text-success shrink-0" />
      ) : (
        <AiOutlineCloseCircle className="h-4 w-4 text-neutral-400 shrink-0" />
      )}
      <span className={met ? "text-success" : "text-neutral-600"}>{text}</span>
    </div>
  );
}
