import { useIntlayer } from "react-intlayer";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card, Input, Button, ErrorDisplay } from "@components/common";
import { usePasswordResetRequest } from "@hooks/mutations/usePasswordResetRequest";
import passwordResetContent from "@/content/auth/password-reset.content";
import dayjs from "dayjs";
import duration from "dayjs/plugin/duration";

dayjs.extend(duration);

const COOLDOWN_KEY = "password-reset-cooldown";
const COOLDOWN_DURATION = 15 * 60 * 1000; // 15 minutes

export default function PasswordResetRequestController() {
  const t = useIntlayer(passwordResetContent.key);
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState(false);
  const [cooldown, setCooldown] = useState(null);

  const resetRequestMutation = usePasswordResetRequest();

  // Check cooldown on mount
  useEffect(() => {
    const storedCooldown = localStorage.getItem(COOLDOWN_KEY);
    if (storedCooldown) {
      const cooldownEnd = parseInt(storedCooldown, 10);
      if (Date.now() < cooldownEnd) {
        setCooldown(cooldownEnd);
      } else {
        localStorage.removeItem(COOLDOWN_KEY);
      }
    }
  }, []);

  // Cooldown timer
  useEffect(() => {
    if (!cooldown) return;

    const interval = setInterval(() => {
      const remaining = cooldown - Date.now();
      if (remaining <= 0) {
        setCooldown(null);
        localStorage.removeItem(COOLDOWN_KEY);
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [cooldown]);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!email) {
      setErrors({ email: t.errorEmailInvalid });
      return;
    }

    setErrors({});

    resetRequestMutation.mutate(
      { email },
      {
        onSuccess: () => {
          setSuccess(true);
          setEmail("");
        },
        onError: (error) => {
          const errorCode = error.response?.data?.error?.code;

          if (errorCode === "TOO_MANY_REQUESTS") {
            const cooldownEnd = Date.now() + COOLDOWN_DURATION;
            localStorage.setItem(COOLDOWN_KEY, cooldownEnd.toString());
            setCooldown(cooldownEnd);
          } else {
            setErrors({ email: t.errorNetwork });
          }
        },
      }
    );
  };

  // Cooldown message
  if (cooldown) {
    const remaining = Math.ceil((cooldown - Date.now()) / 1000);
    const remainingDuration = dayjs.duration(remaining, "seconds");
    const timeString = remainingDuration.format("mm:ss");

    return (
      <Card className="w-full max-w-md mx-auto">
        <div className="space-y-6">
          <h1 className="text-heading-3 text-center text-neutral-900">
            {t.requestTitle}
          </h1>
          <ErrorDisplay
            error={{
              message: t.cooldownMessage.replace("{time}", timeString),
            }}
          />
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

  // Success message
  if (success) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <div className="space-y-6">
          <h1 className="text-heading-3 text-center text-neutral-900">
            {t.requestTitle}
          </h1>
          <div className="bg-success/10 border border-success rounded-lg p-4">
            <p className="text-body-2 text-success text-center">
              {t.requestSuccess}
            </p>
          </div>
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

  return (
    <Card className="w-full max-w-md mx-auto">
      <div className="space-y-6">
        <div className="text-center">
          <h1 className="text-heading-3 text-neutral-900">{t.requestTitle}</h1>
          <p className="text-body-2 text-neutral-600 mt-2">
            {t.requestDescription}
          </p>
        </div>

        {resetRequestMutation.isError && (
          <ErrorDisplay error={resetRequestMutation.error} />
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="email"
            label={t.emailLabel.value}
            name="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t.emailPlaceholder.value}
            error={errors.email}
            disabled={resetRequestMutation.isPending}
            required
          />

          <Button
            type="submit"
            variant="primary"
            loading={resetRequestMutation.isPending}
            disabled={resetRequestMutation.isPending || !email}
            className="w-full"
          >
            {t.requestButton}
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
