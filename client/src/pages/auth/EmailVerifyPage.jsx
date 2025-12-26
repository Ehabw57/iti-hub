import { useEffect, useState } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import { useIntlayer } from "react-intlayer";
import { Card, Button, ErrorDisplay } from "@components/common";
import emailVerificationContent from "@/content/auth/email-verification.content";
import { useVerifyEmail } from "@hooks/mutations/useVerifyEmail";

export default function EmailVerifyPage() {
  const t = useIntlayer(emailVerificationContent.key);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const token = searchParams.get("token");
  const verifyEmailMutation = useVerifyEmail();

  const [status, setStatus] = useState("loading");
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setError(t.errorInvalidToken);
      return;
    }

    verifyEmailMutation.mutate(
      { token },
      {
        onSuccess: () => {
          setStatus("success");
          setTimeout(() => navigate("/login"), 3000);
        },
        onError: (err) => {
          const code = err.response?.data?.error?.code;

          if (code === "EMAIL_ALREADY_VERIFIED") {
            setError(t.errorAlreadyVerified);
          } else if (code === "INVALID_VERIFICATION_TOKEN") {
            setError(t.errorInvalidToken);
          } else {
            setError(t.networkError);
          }

          setStatus("error");
        },
      }
    );
  }, [token, navigate, t, verifyEmailMutation]);

  return (
    <Card className="w-full max-w-md mx-auto">
      <div className="space-y-6 text-center">
        <h1 className="text-heading-3">{t.title}</h1>

        {status === "loading" && (
          <p className="text-body-2 text-neutral-600">
            {t.description}
          </p>
        )}

        {status === "success" && (
          <>
            <div className="bg-success/10 border border-success rounded-lg p-4">
              <p className="text-success">{t.successMessage}</p>
            </div>
            <p className="text-body-2 text-neutral-600">
              Redirecting to login...
            </p>
          </>
        )}

        {status === "error" && (
          <>
            <ErrorDisplay error={{ message: error }} />
            <Link to="/login">
              <Button variant="secondary" className="w-full">
                {t.backToLogin}
              </Button>
            </Link>
          </>
        )}
      </div>
    </Card>
  );
}
