import { useState } from "react";
import { useUser } from "@/hooks/use-user";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, ArrowRight, ArrowLeft } from "lucide-react";
import { useLocation, Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";

type FormData = {
  username: string;
  password: string;
};

type Step = {
  id: number;
  title: string;
  field: keyof FormData;
  type: string;
  placeholder: string;
};

const steps: Step[] = [
  {
    id: 1,
    title: "What's your username?",
    field: "username",
    type: "text",
    placeholder: "Enter your username",
  },
  {
    id: 2,
    title: "Choose a password",
    field: "password",
    type: "password",
    placeholder: "Enter your password",
  },
];

export function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>({ username: "", password: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const { login, register } = useUser();
  const [, setLocation] = useLocation();

  const handleSubmit = async () => {
    if (isLoading) return;

    setError(null);
    setIsLoading(true);

    try {
      const action = isLogin ? login : register;
      const result = await action(formData);

      if (!result.ok) {
        setError(result.message);
        setIsLoading(false);
        return;
      }

      setLocation("/editor");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setIsLoading(false);
    }
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleNext();
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background">
      <Card className="w-full max-w-md mx-4">
        <CardContent className="pt-6">
          <div className="flex justify-between items-center mb-8">
            <Link href="/" className="text-xl font-bold hover:text-primary transition-colors">
              AI IDE
            </Link>
            <Button
              variant="ghost"
              onClick={() => {
                setIsLogin(!isLogin);
                setCurrentStep(0);
                setFormData({ username: "", password: "" });
                setError(null);
              }}
            >
              {isLogin ? "Need an account?" : "Already have an account?"}
            </Button>
          </div>

          <div className="relative">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                <div className="space-y-2">
                  <h2 className="text-xl font-medium">
                    {steps[currentStep].title}
                  </h2>
                  <Input
                    type={steps[currentStep].type}
                    placeholder={steps[currentStep].placeholder}
                    value={formData[steps[currentStep].field]}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        [steps[currentStep].field]: e.target.value,
                      })
                    }
                    onKeyDown={handleKeyDown}
                    className="text-lg py-6"
                    autoFocus
                    disabled={isLoading}
                  />
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {error && (
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-sm text-destructive mt-4"
            >
              {error}
            </motion.p>
          )}

          <div className="flex justify-between mt-8">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={currentStep === 0 || isLoading}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <Button
              onClick={handleNext}
              disabled={!formData[steps[currentStep].field] || isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  {currentStep === steps.length - 1 ? (
                    isLogin ? "Login" : "Sign Up"
                  ) : (
                    <>
                      Next
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}