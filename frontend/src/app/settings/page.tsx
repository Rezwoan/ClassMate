"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useApi } from "@/lib/use-api";
import type { NotificationPreference, Semester } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import {
  pushSupported,
  subscribeToPush,
  unsubscribeFromPush,
} from "@/lib/push";
import { AppShell } from "@/components/layout/AppShell";
import {
  Button,
  Card,
  Field,
  Input,
  PageLoader,
  Select,
  Switch,
} from "@/components/ui/primitives";
import { useToast } from "@/components/ui/toast";
import { BellIcon, LogOutIcon } from "@/components/ui/icons";

function Row({
  title,
  desc,
  children,
}: {
  title: string;
  desc?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div className="min-w-0">
        <p className="font-semibold text-ink">{title}</p>
        {desc && <p className="text-xs text-muted">{desc}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="mb-2 mt-6 px-1 text-sm font-bold text-muted">{children}</h3>;
}

export default function SettingsPage() {
  const { user, logout, refreshUser } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const { data: prefData, loading } = useApi<NotificationPreference>("/notifications/preferences");
  const { data: semester } = useApi<Semester>("/semesters/active");
  const [pref, setPref] = useState<NotificationPreference | null>(null);
  const [busyPush, setBusyPush] = useState(false);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    if (prefData) setPref(prefData);
  }, [prefData]);

  // Profile form
  const [profile, setProfile] = useState({
    fullName: "",
    instituteName: "",
    studentId: "",
    department: "",
  });
  const [savingProfile, setSavingProfile] = useState(false);
  useEffect(() => {
    if (user)
      setProfile({
        fullName: user.fullName,
        instituteName: user.instituteName,
        studentId: user.studentId,
        department: user.department ?? "",
      });
  }, [user]);

  async function patchPref(partial: Partial<NotificationPreference>) {
    if (!pref) return;
    const optimistic = { ...pref, ...partial };
    setPref(optimistic);
    try {
      const updated = await api<NotificationPreference>("/notifications/preferences", {
        method: "PATCH",
        body: partial,
      });
      setPref(updated);
    } catch {
      toast("Couldn't save that setting", "error");
      setPref(pref);
    }
  }

  async function enablePush() {
    setBusyPush(true);
    try {
      const sub = await subscribeToPush();
      await api("/notifications/subscribe", {
        method: "POST",
        body: { ...sub, userAgent: navigator.userAgent },
      });
      await patchPref({ pushEnabled: true });
      toast("Notifications enabled 🔔", "success");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Could not enable", "error");
    } finally {
      setBusyPush(false);
    }
  }

  async function disablePush() {
    setBusyPush(true);
    try {
      const endpoint = await unsubscribeFromPush();
      if (endpoint)
        await api("/notifications/unsubscribe", { method: "POST", body: { endpoint } });
      await patchPref({ pushEnabled: false });
      toast("Notifications disabled", "info");
    } catch {
      toast("Could not disable", "error");
    } finally {
      setBusyPush(false);
    }
  }

  async function sendTest() {
    setTesting(true);
    try {
      const res = await api<{ message: string }>("/notifications/test", { method: "POST" });
      toast(res.message, "info");
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Test failed", "error");
    } finally {
      setTesting(false);
    }
  }

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSavingProfile(true);
    try {
      await api("/users/me", {
        method: "PATCH",
        body: { ...profile, department: profile.department || undefined },
      });
      await refreshUser();
      toast("Profile updated", "success");
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Could not save", "error");
    } finally {
      setSavingProfile(false);
    }
  }

  async function onLogout() {
    await logout();
    router.replace("/login");
  }

  return (
    <AppShell title="Settings" subtitle="Notifications, profile & more">
      {loading || !pref ? (
        <PageLoader />
      ) : (
        <div>
          {/* Notifications */}
          <SectionTitle>Notifications</SectionTitle>
          <Card>
            <Row
              title="Push notifications"
              desc={
                pushSupported()
                  ? "Reminders even when the app is closed."
                  : "Not supported on this browser."
              }
            >
              {pref.pushEnabled ? (
                <Button variant="soft" loading={busyPush} onClick={disablePush} className="px-3 py-2">
                  On
                </Button>
              ) : (
                <Button
                  loading={busyPush}
                  disabled={!pushSupported()}
                  onClick={enablePush}
                  className="px-3 py-2"
                >
                  <BellIcon className="size-4" /> Enable
                </Button>
              )}
            </Row>
            <div className="border-t border-line" />
            <Row title="Send a test notification" desc="Check that delivery works.">
              <Button variant="ghost" loading={testing} onClick={sendTest} className="px-3 py-2">
                Test
              </Button>
            </Row>
          </Card>

          <SectionTitle>Reminders</SectionTitle>
          <Card className="divide-y divide-line">
            <Row title="Before each class">
              <Switch
                checked={pref.classReminderEnabled}
                onChange={(v) => patchPref({ classReminderEnabled: v })}
              />
            </Row>
            <Row title="Class reminder lead time">
              <Select
                value={pref.classReminderMinutesBefore}
                onChange={(e) => patchPref({ classReminderMinutesBefore: Number(e.target.value) })}
                className="w-28"
              >
                {[5, 10, 15, 20, 30, 45, 60].map((m) => (
                  <option key={m} value={m}>
                    {m} min
                  </option>
                ))}
              </Select>
            </Row>
            <Row title="Quiz study reminder (weekend)">
              <Switch
                checked={pref.quizWeekendReminder}
                onChange={(v) => patchPref({ quizWeekendReminder: v })}
              />
            </Row>
            <Row title="Quiz reminder (day before)">
              <Switch
                checked={pref.quizDayBeforeReminder}
                onChange={(v) => patchPref({ quizDayBeforeReminder: v })}
              />
            </Row>
            <Row title="Homework due reminders">
              <Switch
                checked={pref.homeworkReminderEnabled}
                onChange={(v) => patchPref({ homeworkReminderEnabled: v })}
              />
            </Row>
            <Row title="Homework reminder lead time">
              <Select
                value={pref.homeworkReminderDaysBefore}
                onChange={(e) => patchPref({ homeworkReminderDaysBefore: Number(e.target.value) })}
                className="w-28"
              >
                {[0, 1, 2, 3, 5, 7].map((d) => (
                  <option key={d} value={d}>
                    {d === 0 ? "Same day" : `${d} day${d > 1 ? "s" : ""}`}
                  </option>
                ))}
              </Select>
            </Row>
          </Card>

          <SectionTitle>Email notifications</SectionTitle>
          <Card className="divide-y divide-line">
            <p className="pb-2 text-xs text-muted">
              Choose which reminders also arrive by email. Keep these focused to save your inbox.
            </p>
            <Row title="Quizzes">
              <Switch
                checked={pref.emailForQuizzes}
                onChange={(v) => patchPref({ emailForQuizzes: v })}
              />
            </Row>
            <Row title="Homework / assignments">
              <Switch
                checked={pref.emailForHomework}
                onChange={(v) => patchPref({ emailForHomework: v })}
              />
            </Row>
            <Row title="Class reminders" desc="Frequent — off by default.">
              <Switch
                checked={pref.emailForClasses}
                onChange={(v) => patchPref({ emailForClasses: v })}
              />
            </Row>
          </Card>

          {/* Profile */}
          <SectionTitle>Profile</SectionTitle>
          <Card>
            <form onSubmit={saveProfile} className="space-y-3">
              <Field label="Full name">
                <Input
                  value={profile.fullName}
                  onChange={(e) => setProfile((p) => ({ ...p, fullName: e.target.value }))}
                />
              </Field>
              <Field label="Institute">
                <Input
                  value={profile.instituteName}
                  onChange={(e) => setProfile((p) => ({ ...p, instituteName: e.target.value }))}
                />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Student ID">
                  <Input
                    value={profile.studentId}
                    onChange={(e) => setProfile((p) => ({ ...p, studentId: e.target.value }))}
                  />
                </Field>
                <Field label="Department">
                  <Input
                    value={profile.department}
                    onChange={(e) => setProfile((p) => ({ ...p, department: e.target.value }))}
                  />
                </Field>
              </div>
              <p className="text-xs text-muted">{user?.email}</p>
              <Button type="submit" loading={savingProfile} variant="soft" className="w-full">
                Save profile
              </Button>
            </form>
          </Card>

          {/* Semester */}
          <SectionTitle>Semester</SectionTitle>
          <Card className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-ink">{semester?.name ?? "No active semester"}</p>
              {semester && (
                <p className="text-xs text-muted">
                  {formatDate(semester.startDate)} – {formatDate(semester.endDate)}
                </p>
              )}
            </div>
            <Button variant="ghost" onClick={() => router.push("/onboarding")} className="px-3 py-2">
              New
            </Button>
          </Card>

          <button
            onClick={onLogout}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-field bg-danger-soft py-3 text-sm font-bold text-danger"
          >
            <LogOutIcon className="size-4" /> Log out
          </button>
          <p className="mt-4 mb-2 text-center text-xs text-muted">
            Tip: install ClassMate to your home screen for reminders. On iOS, use
            Share → Add to Home Screen.
          </p>
        </div>
      )}
    </AppShell>
  );
}
