import type { Metadata } from "next";
import { CampaignStatus, ChannelType, MessageStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { enumLabel } from "@/lib/crm";
import { ResourceCrud } from "@/components/crm/resource-crud";

export const metadata: Metadata = {
  title: "Communications | CRM",
  description: "Automation rules, SMS/email triggers, and outbound delivery logs.",
};

export default async function AdminCommunicationsPage() {
  const [rules, logs, clients] = await Promise.all([
    prisma.automationRule.findMany({
      include: {
        client: { select: { companyName: true } },
        _count: { select: { logs: true } },
      },
      orderBy: [{ updatedAt: "desc" }],
      take: 100,
    }),
    prisma.messageLog.findMany({
      include: {
        campaign: { select: { name: true } },
        client: { select: { companyName: true } },
      },
      orderBy: [{ createdAt: "desc" }],
      take: 100,
    }),
    prisma.client.findMany({
      orderBy: [{ companyName: "asc" }],
      select: { id: true, companyName: true },
    }),
  ]);

  const channelOptions = Object.values(ChannelType).map((channel) => ({
    value: channel,
    label: enumLabel(channel),
  }));
  const campaignStatusOptions = Object.values(CampaignStatus).map((status) => ({
    value: status,
    label: enumLabel(status),
  }));
  const messageStatusOptions = Object.values(MessageStatus).map((status) => ({
    value: status,
    label: enumLabel(status),
  }));

  return (
    <div className="crm-stack">
      <ResourceCrud
        title="Automation Rules"
        description="Configure trigger-based messaging for confirmations, reminders, and follow-ups."
        endpoint="/api/automations"
        singularName="Automation Rule"
        initialItems={rules}
        searchKeys={["name", "triggerEvent", "channel", "client.companyName"]}
        filters={[{ name: "status", label: "Status", options: campaignStatusOptions }]}
        defaultValues={{ channel: "EMAIL", status: "ACTIVE", sendAfterMinutes: "0" }}
        columns={[
          { key: "name", label: "Name" },
          { key: "channel", label: "Channel", format: "pill" },
          { key: "triggerEvent", label: "Trigger" },
          { key: "status", label: "Status", format: "pill" },
          { key: "sendAfterMinutes", label: "Delay (min)" },
          { key: "client.companyName", label: "Client", empty: "Global" },
          { key: "_count.logs", label: "Sent Logs" },
        ]}
        fields={[
          { name: "name", label: "Name", type: "text", required: true },
          { name: "channel", label: "Channel", type: "select", required: true, options: channelOptions },
          { name: "triggerEvent", label: "Trigger Event", type: "text", required: true },
          {
            name: "sendAfterMinutes",
            label: "Send Delay Minutes",
            type: "number",
            valueType: "number",
            required: true,
          },
          { name: "templateSubject", label: "Template Subject", type: "text" },
          { name: "templateBody", label: "Template Body", type: "textarea", required: true },
          {
            name: "status",
            label: "Status",
            type: "select",
            required: true,
            options: campaignStatusOptions,
          },
          {
            name: "clientId",
            label: "Client Scope",
            type: "select",
            options: clients.map((client) => ({ value: client.id, label: client.companyName })),
          },
        ]}
      />

      <ResourceCrud
        title="Message Logs"
        description="Queue and audit outbound messages across email/SMS channels."
        endpoint="/api/messages"
        singularName="Message"
        initialItems={logs}
        searchKeys={["recipient", "subject", "body", "campaign.name", "client.companyName"]}
        filters={[{ name: "status", label: "Status", options: messageStatusOptions }]}
        defaultValues={{ channel: "EMAIL", status: "QUEUED" }}
        columns={[
          { key: "recipient", label: "Recipient" },
          { key: "channel", label: "Channel", format: "pill" },
          { key: "status", label: "Status", format: "pill" },
          { key: "campaign.name", label: "Rule", empty: "Manual" },
          { key: "client.companyName", label: "Client", empty: "-" },
          { key: "scheduledFor", label: "Scheduled", format: "datetime", empty: "Now" },
          { key: "sentAt", label: "Sent", format: "datetime", empty: "-" },
        ]}
        fields={[
          { name: "recipient", label: "Recipient", type: "text", required: true },
          { name: "channel", label: "Channel", type: "select", required: true, options: channelOptions },
          { name: "subject", label: "Subject", type: "text" },
          { name: "body", label: "Body", type: "textarea", required: true },
          {
            name: "status",
            label: "Status",
            type: "select",
            required: true,
            options: messageStatusOptions,
          },
          { name: "scheduledFor", label: "Scheduled For", type: "datetime-local" },
          { name: "sentAt", label: "Sent At", type: "datetime-local" },
          {
            name: "campaignId",
            label: "Automation Rule",
            type: "select",
            options: rules.map((rule) => ({ value: rule.id, label: rule.name })),
          },
          {
            name: "clientId",
            label: "Client",
            type: "select",
            options: clients.map((client) => ({ value: client.id, label: client.companyName })),
          },
        ]}
      />
    </div>
  );
}
