import { useIntlayer } from "react-intlayer";
import { useState } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { Card, Input, Button, ErrorDisplay } from "@components/common";
import { AiOutlineCheckCircle, AiOutlineCloseCircle } from "react-icons/ai";
import { usePasswordResetConfirm } from "@hooks/mutations/usePasswordResetConfirm";
import { validatePassword, isPasswordValid } from "@/utils/registerHelpers";
import passwordResetContent from "@/content/auth/password-reset.content";

export default function PasswordResetConfirmController() {
  const t = useIntlayer(passwordResetContent.key);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");

  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState(false);

  const resetConfirmMutation = usePasswordResetConfirm();

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
    // Clear error when user types
    setErrors((prev) => ({ ...prev, [e.target.name]: null }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setErrors({ confirmPassword: t.errorPasswordMatch });
      return;
    }

    // Validate password policy
    if (!isPasswordValid(formData.password)) {
      setErrors({ password: t.errorPasswordPolicy });
      return;
    }

    setErrors({});

    resetConfirmMutation.mutate(
      { token, password: formData.password },
      {
        onSuccess: () => {
          setSuccess(true);
          // Redirect to login after 3 seconds
          setTimeout(() => {
            navigate("/login");
          }, 3000);
        },
        onError: (error) => {
            console.log('Password reset confirm error:', error);
          const errorCode = error.response?.data?.error?.code;
          if (errorCode === "INVALID_RESET_TOKEN" || errorCode === "RESET_TOKEN_EXPIRED") {
            setErrors({ password: t.errorInvalidToken });
          } else {
            setErrors({ password: t.errorNetwork });
          }
        },
      }
    );
  };

  // Check if token is missing
  if (!token) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <div className="space-y-6">
          <h1 className="text-heading-3 text-center text-neutral-900">
            {t.confirmTitle}
          </h1>
          <ErrorDisplay
            error={{
              message: t.errorInvalidToken,
            }}
          />
          <div className="text-center">
            <Link
              to="/password-reset/request"
              className="text-sm text-secondary-600 hover:text-secondary-700 hover:underline"
            >
              Request New Link
            </Link>
          </div>
        </div>
      </Card>
    );
  }

  // Success message
  if (success) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <div className="space-y-6">
          <h1 className="text-heading-3 text-center text-neutral-900">
            {t.confirmTitle}
          </h1>
          <div className="bg-success/10 border border-success rounded-lg p-4">
            <p className="text-body-2 text-success text-center">
              {t.confirmSuccess}
            </p>
          </div>
          <div className="text-center">
            <p className="text-body-2 text-neutral-600 mb-2">
              Redirecting to login...
            </p>
            <Link
              to="/login"
              className="text-sm text-secondary-600 hover:text-secondary-700 hover:underline"
            >
              {t.backToLogin}
            </Link>
          </div>
        </div>
      </Card>
    );
  }

  const passwordChecks = formData.password ? validatePassword(formData.password) : null;

  return (
    <Card className="w-full max-w-md mx-auto">
      <div className="space-y-6">
        <div className="text-center">
          <h1 className="text-heading-3 text-neutral-900">{t.confirmTitle}</h1>
          <p className="text-body-2 text-neutral-600 mt-2">
            {t.confirmDescription}
          </p>
        </div>

        {resetConfirmMutation.isError && (
          <ErrorDisplay error={resetConfirmMutation.error}  />
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="password"
            label={t.passwordLabel.value}
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder={t.passwordPlaceholder.value}
            error={errors.password}
            disabled={resetConfirmMutation.isPending}
            required
          />

          {/* Password Policy Checklist */}
          {formData.password && passwordChecks && (
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
            value={formData.confirmPassword}
            onChange={handleChange}
            placeholder={t.confirmPasswordPlaceholder.value}
            error={errors.confirmPassword}
            disabled={resetConfirmMutation.isPending}
            required
          />

          <Button
            type="submit"
            variant="primary"
            loading={resetConfirmMutation.isPending}
            disabled={resetConfirmMutation.isPending || !formData.password || !formData.confirmPassword}
            className="w-full"
          >
            {t.confirmButton}
          </Button>
        </form>

        <div className="text-center">
          <Link
            to="/login"
            className="text-sm text-secondary-600 hover:text-secondary-700 hover:underline"
          >
            {t.backToLogin}
          </Link>
        </div>
      </div>
    </Card>
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
