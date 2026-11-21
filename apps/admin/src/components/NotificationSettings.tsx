import React from "react";
import { useTranslation } from "react-i18next";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import NotificationPreferences from "@/components/NotificationPreferences";

const NotificationSettings: React.FC = () => {
  const { t } = useTranslation();
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("notifications.settingsTitle")}</CardTitle>
        <CardDescription>{t("notifications.settingsDesc")}</CardDescription>
      </CardHeader>
      <CardContent>
        <NotificationPreferences />
      </CardContent>
    </Card>
  );
};

export default NotificationSettings;
