import { json } from "@remix-run/node";
import { useLoaderData, useSubmit, useNavigation, Link } from "@remix-run/react";
import { Page, Layout, BlockStack, Banner, Text, Card, Button, Badge, InlineStack } from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";
import {
  ensureMetafieldDefinitions,
  getWidgetSettings,
  saveWidgetSettings,
} from "../lib/metafields.server";
import { checkSubscription, updatePlanMetafield } from "../lib/billing.server";
import { SettingsForm } from "../components/SettingsForm";

export const loader = async ({ request }) => {
  try {
    const { admin } = await authenticate.admin(request);

    // Ensure metafield definitions exist
    await ensureMetafieldDefinitions(admin);

    // Get current settings
    const settings = await getWidgetSettings(admin);

    // Check subscription status
    const { isPro } = await checkSubscription(admin);

    // Sync plan metafield for theme access
    await updatePlanMetafield(admin, isPro ? "pro" : "free");

    return json({ settings, isPro, error: null });
  } catch (error) {
    console.error("Loader error:", error);
    return json({
      settings: null,
      isPro: false,
      error: "Failed to load settings. Please refresh the page."
    });
  }
};

export const action = async ({ request }) => {
  const { admin } = await authenticate.admin(request);

  const formData = await request.formData();
  const settingsJson = formData.get("settings");

  if (!settingsJson) {
    return json({ error: "No settings provided" }, { status: 400 });
  }

  try {
    const settings = JSON.parse(settingsJson);

    // Validate phone number
    if (!settings.phoneNumber || settings.phoneNumber.trim() === "") {
      return json({ error: "Phone number is required" }, { status: 400 });
    }

    // Clean phone number (remove spaces, keep + and digits)
    settings.phoneNumber = settings.phoneNumber.replace(/[^\d+]/g, "");

    await saveWidgetSettings(admin, settings);

    return json({ success: true, message: "Settings saved successfully!" });
  } catch (error) {
    console.error("Failed to save settings:", error);
    return json({ error: error.message || "Failed to save settings" }, { status: 500 });
  }
};

export default function Index() {
  const { settings, isPro, error } = useLoaderData();
  const submit = useSubmit();
  const navigation = useNavigation();

  const isSubmitting = navigation.state === "submitting";

  const handleSave = (newSettings) => {
    const formData = new FormData();
    formData.append("settings", JSON.stringify(newSettings));
    submit(formData, { method: "post" });
  };

  return (
    <Page>
      <TitleBar title="QuickChat Settings" />
      <BlockStack gap="500">
        <Layout>
          <Layout.Section>
            <BlockStack gap="400">
              {error && (
                <Banner tone="critical">
                  <Text as="p">{error}</Text>
                </Banner>
              )}

              {settings && !settings.phoneNumber && (
                <Banner tone="warning">
                  <Text as="p">
                    Enter your WhatsApp phone number to activate the widget on your store.
                  </Text>
                </Banner>
              )}

              {settings && (
                <SettingsForm
                  initialSettings={settings}
                  onSave={handleSave}
                  saving={isSubmitting}
                  isPro={isPro}
                />
              )}
            </BlockStack>
          </Layout.Section>

          <Layout.Section variant="oneThird">
            <BlockStack gap="400">
              {/* Current Plan Card */}
              <Card>
                <BlockStack gap="200">
                  <InlineStack align="space-between" blockAlign="center">
                    <Text as="h2" variant="headingMd">
                      Your Plan
                    </Text>
                    <Badge tone={isPro ? "success" : "info"}>
                      {isPro ? "Pro" : "Free"}
                    </Badge>
                  </InlineStack>
                  {!isPro && (
                    <BlockStack gap="200">
                      <Text as="p" variant="bodyMd" tone="subdued">
                        Upgrade to unlock premium features
                      </Text>
                      <Link to="/app/billing">
                        <Button variant="primary" fullWidth>
                          Upgrade to Pro - $1/mo
                        </Button>
                      </Link>
                    </BlockStack>
                  )}
                </BlockStack>
              </Card>

              <Card>
                <BlockStack gap="200">
                  <Text as="h2" variant="headingMd">
                    How to Enable
                  </Text>
                  <Text as="p" variant="bodyMd">
                    After saving your settings:
                  </Text>
                  <ol style={{ paddingLeft: "20px", margin: 0 }}>
                    <li>Go to <strong>Online Store → Themes</strong></li>
                    <li>Click <strong>Customize</strong></li>
                    <li>Add <strong>QuickChat Widget</strong> block</li>
                    <li>Save your theme</li>
                  </ol>
                </BlockStack>
              </Card>

              <Card>
                <BlockStack gap="200">
                  <Text as="h2" variant="headingMd">
                    Free Features
                  </Text>
                  <ul style={{ paddingLeft: "20px", margin: 0 }}>
                    <li>WhatsApp floating button</li>
                    <li>Custom button text</li>
                    <li>Pre-filled messages</li>
                    <li>Position (left/right)</li>
                    <li>Custom colors</li>
                    <li>5 animations</li>
                    <li>Basic click analytics</li>
                  </ul>
                </BlockStack>
              </Card>

              <Card>
                <BlockStack gap="200">
                  <InlineStack gap="200" blockAlign="center">
                    <Text as="h2" variant="headingMd">
                      Pro Features
                    </Text>
                    {isPro && <Badge tone="success">Unlocked</Badge>}
                  </InlineStack>
                  <ul style={{ paddingLeft: "20px", margin: 0, color: isPro ? "inherit" : "#6b7280" }}>
                    <li>15 premium animations</li>
                    <li>5 button effects (Glass, Neon, etc.)</li>
                    <li>Custom icon upload</li>
                    <li>Position margins</li>
                    <li>Display triggers</li>
                    <li>Device targeting</li>
                    <li>Business hours</li>
                    <li>Multi-agent support</li>
                    <li>Page exclusion rules</li>
                    <li>Context-aware messages</li>
                    <li>Full analytics dashboard</li>
                  </ul>
                </BlockStack>
              </Card>
            </BlockStack>
          </Layout.Section>
        </Layout>
      </BlockStack>
    </Page>
  );
}
