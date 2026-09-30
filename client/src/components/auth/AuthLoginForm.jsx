import { useIntlayer } from "react-intlayer";
import { Link } from "react-router-dom";
import { Input, Button, Card } from "@components/common";
import GoogleSignInButton from "@components/auth/GoogleSignInButton";
import loginContent from "@/content/auth/login.content";
import googleAuthContent from "@/content/auth/google-auth.content";

export default function AuthLoginForm({
  email,
  password,
  errors,
  submitting,
  disabled,
  onChange,
  onSubmit,
  onGoogleSuccess,
  onGoogleError,
}) {
  const t = useIntlayer(loginContent.key);
  const g = useIntlayer(googleAuthContent.key);

  const handleInputChange = (e) => {
    onChange({ [e.target.name]: e.target.value });
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <div className="space-y-6">
        <h1 className="text-heading-3 text-center text-neutral-900">
          {t.pageTitle}
        </h1>

        <form onSubmit={onSubmit} className="space-y-4">
          <Input
            type="email"
            label={t.emailLabel.value}
            name="email"
            value={email}
            onChange={handleInputChange}
            placeholder={t.emailPlaceholder.value}
            error={errors.email}
            disabled={submitting || disabled}
            required
          />

          <Input
            type="password"
            label={t.passwordLabel.value}
            name="password"
            value={password}
            onChange={handleInputChange}
            placeholder={t.passwordPlaceholder.value}
            error={errors.password}
            disabled={submitting || disabled}
            required
          />

          <div className="flex justify-end">
            <Link
              to="/password-reset/request"
              className="text-sm text-secondary-600 hover:text-secondary-700 hover:underline"
            >
              {t.forgotPassword}
            </Link>
          </div>

          <Button
            type="submit"
            variant="primary"
            loading={submitting}
            disabled={disabled || submitting}
            className="w-full"
          >
            {t.submitButton}
          </Button>
        </form>

        {/* Divider + Google Sign-In */}
        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-neutral-200" />
          <span className="text-xs text-neutral-500">{g.orContinueWith}</span>
          <div className="h-px flex-1 bg-neutral-200" />
        </div>

        <GoogleSignInButton
          onSuccess={onGoogleSuccess}
          onError={onGoogleError}
          disabled={disabled || submitting}
        />

        <div className="text-center text-sm text-neutral-600">
          {t.noAccount}{" "}
          <Link
            to="/register"
            className="text-secondary-600 hover:text-secondary-700 font-semibold hover:underline"
          >
            {t.registerLink}
          </Link>
        </div>
      </div>
    </Card>
  );
}
