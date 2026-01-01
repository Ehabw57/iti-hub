import { useState } from "react";
import { Link } from "react-router-dom";
import { useIntlayer } from "react-intlayer";
import { Card, Button, ErrorDisplay } from "@components/common";
import resendVerificationContent from "@/content/auth/resend-verification.content";
import { useResendVerificationEmail } from "@hooks/mutations/useResendVerificationEmail";

export default function ResendVerificationPage() {
  const t = useIntlayer(resendVerificationContent.key);
  const resendMutation = useResendVerificationEmail();
  
  const [status, setStatus] = useState("idle"); // idle, success, error

  const handleResend = () => {
    resendMutation.mutate(undefined, {
      onSuccess: () => {
        setStatus("success");
      },
      onError: (err) => {
        setStatus("error");
      },
    });
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <div className="space-y-6">
        <div className="text-center">
          <h1 className="text-heading-3">{t.title}</h1>
          <p className="text-body-2 text-neutral-600 mt-2">
            {t.description}
          </p>
        </div>

        {status === "success" && (
          <div className="bg-success/10 border border-success rounded-lg p-4">
            <p className="text-success text-center">{t.successMessage}</p>
          </div>
        )}

        {status === "error" && (
          <ErrorDisplay 
            error={{ 
              message: resendMutation.error?.response?.data?.error?.message || t.errorMessage 
            }} 
          />
        )}

        <Button
          onClick={handleResend}
          disabled={resendMutation.isPending || status === "success"}
          className="w-full"
        >
          {resendMutation.isPending ? t.sending : t.buttonText}
        </Button>

        <div className="text-center">
          <Link to="/login" className="text-primary hover:underline text-body-2">
            {t.backToLogin}
          </Link>
        </div>
      </div>
    </Card>
  );
}
