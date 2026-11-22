"use client";

// /login and /signup both render this page with their tab selected so redirects and links keep working
import { useState, type FormEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/8bit/button";
import { Card } from "@/components/ui/8bit/card";
import { Input } from "@/components/ui/8bit/input";
import { Label } from "@/components/ui/8bit/label";
import { Spinner } from "@/components/ui/8bit/spinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/8bit/tabs";
import { CONTACT_URL, SitePage } from "@/components/site/SitePage";
import { signIn, signUp } from "@/components/site/session";

export type AuthTab = "sign-in" | "sign-up";

const TAB_PATH: Record<AuthTab, string> = { "sign-in": "/login", "sign-up": "/signup" };
const tabClass = "h-full flex-1 text-[11px] data-[state=active]:shadow-[inset_0_3px_0_0_var(--primary)]!";

function Field({
  id,
  label,
  children,
  note,
  error,
}: {
  id: string;
  label: string;
  children: ReactNode;
  note?: string;
  error?: string | null;
}) {
  return (
    <div className="flex flex-col gap-3">
      <Label htmlFor={id} font="normal" className="text-sm">
        {label}
      </Label>
      {children}
      {error && (
        <span id={`${id}-error`} className="text-sm text-hp">
          {error}
        </span>
      )}
      {note && <span className="text-xs text-muted-foreground">{note}</span>}
    </div>
  );
}

function SubmitButton({ busy, children }: { busy: boolean; children: ReactNode }) {
  return (
    <Button type="submit" className="mx-1.5 mt-2 gap-2 text-[11px]" disabled={busy}>
      {busy && <Spinner variant="diamond" className="size-4" />}
      {children}
    </Button>
  );
}

function SignInForm() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setBusy(true);
    setError(null);
    const problem = await signIn(String(form.get("email")).trim(), String(form.get("password")));
    setBusy(false);
    if (problem) return setError(problem);
    router.push("/");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-6 p-6 sm:p-8" noValidate>
      <Field id="signin-email" label="Email">
        <Input id="signin-email" name="email" type="email" autoComplete="email" required font="normal" className="text-[15px]" />
      </Field>
      <Field id="signin-password" label="Password" error={error}>
        <Input
          id="signin-password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          font="normal"
          aria-invalid={!!error}
          aria-describedby={error ? "signin-password-error" : undefined}
          className="text-[15px]"
        />
      </Field>
      <SubmitButton busy={busy}>Sign in</SubmitButton>
      <span className="text-center text-sm text-muted-foreground">
        Forgot your password?{" "}
        <a href={CONTACT_URL} className="text-primary underline underline-offset-4">
          Contact us
        </a>
      </span>
    </form>
  );
}

type SignUpErrors = Partial<Record<"username" | "email" | "password" | "form", string>>;

function validate(username: string, email: string, password: string): SignUpErrors {
  const errors: SignUpErrors = {};
  if (!username) errors.username = "Choose a username.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = "Enter a valid email address.";
  if (password.length < 8) errors.password = "At least 8 characters.";
  return errors;
}

function SignUpForm() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<SignUpErrors>({});

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const username = String(form.get("username")).trim();
    const email = String(form.get("email")).trim();
    const password = String(form.get("password"));
    const found = validate(username, email, password);
    setErrors(found);
    if (Object.keys(found).length > 0) return;
    setBusy(true);
    const problem = await signUp({ username, email, password });
    setBusy(false);
    if (problem) return setErrors({ [problem.field]: problem.message });
    router.push("/");
    router.refresh();
  }

  const invalid = (field: keyof SignUpErrors) => ({
    "aria-invalid": !!errors[field],
    "aria-describedby": errors[field] ? `signup-${field}-error` : undefined,
  });

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-6 p-6 sm:p-8" noValidate>
      <Field id="signup-username" label="Username" error={errors.username}>
        <Input id="signup-username" name="username" autoComplete="username" font="normal" className="text-[15px]" {...invalid("username")} />
      </Field>
      <Field id="signup-email" label="Email" error={errors.email}>
        <Input id="signup-email" name="email" type="email" autoComplete="email" font="normal" className="text-[15px]" {...invalid("email")} />
      </Field>
      {/* the note already says the rule, so a too-short password only turns the field red */}
      <Field id="signup-password" label="Password" note="At least 8 characters." error={errors.form}>
        <Input
          id="signup-password"
          name="password"
          type="password"
          autoComplete="new-password"
          font="normal"
          className="text-[15px]"
          aria-invalid={!!errors.password}
        />
      </Field>
      <SubmitButton busy={busy}>Sign up</SubmitButton>
    </form>
  );
}

export function AuthPage({ tab }: { tab: AuthTab }) {
  const [current, setCurrent] = useState<AuthTab>(tab);
  return (
    // top-aligned, so the tabs stay put when the form below them changes height
    <SitePage footer bare>
      <div className="mx-auto w-full max-w-[440px]">
        {/* font="normal" stops the retro font cascading into the forms; the tab list sets it back for the triggers */}
        <Tabs
          value={current}
          onValueChange={(v) => {
            setCurrent(v as AuthTab);
            window.history.replaceState(null, "", TAB_PATH[v as AuthTab]);
          }}
          font="normal"
          className="flex flex-col gap-7"
        >
          <TabsList className="retro mx-1.5 flex h-11 w-auto">
            <TabsTrigger value="sign-in" className={tabClass}>
              Sign in
            </TabsTrigger>
            <TabsTrigger value="sign-up" className={tabClass}>
              Sign up
            </TabsTrigger>
          </TabsList>
          <Card font="normal" className="gap-0 py-0">
            <TabsContent value="sign-in">
              <SignInForm />
            </TabsContent>
            <TabsContent value="sign-up">
              <SignUpForm />
            </TabsContent>
          </Card>
        </Tabs>
      </div>
    </SitePage>
  );
}
