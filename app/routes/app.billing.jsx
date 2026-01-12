import { json } from "@remix-run/node";
import { useLoaderData, useSubmit, useNavigation, useActionData } from "@remix-run/react";
import { useEffect } from "react";
import {
    Page,
    Layout,
    Card,
    BlockStack,
    Text,
    Button,
    Banner,
    InlineStack,
    Badge,
    Box,
    Divider,
    List,
} from "@shopify/polaris";
import { TitleBar, useAppBridge } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";
import {
    checkSubscription,
    requestSubscription,
    cancelSubscription,
    updatePlanMetafield,
} from "../lib/billing.server";

export const loader = async ({ request }) => {
    const { admin, session } = await authenticate.admin(request);

    // Check current subscription status
    const { isPro, subscription } = await checkSubscription(admin);

    // Sync plan metafield
    await updatePlanMetafield(admin, isPro ? "pro" : "free");

    return json({
        isPro,
        subscription,
        shop: session.shop,
    });
};

export const action = async ({ request }) => {
    const { admin, session } = await authenticate.admin(request);
    const formData = await request.formData();
    const actionType = formData.get("action");

    if (actionType === "upgrade") {
        try {
            // Return to main settings page after billing confirmation
            const returnUrl = `https://${session.shop}/admin/apps/quickchat`;
            const { confirmationUrl } = await requestSubscription(admin, session.shop, returnUrl);

            if (confirmationUrl) {
                // Return the URL for client-side redirect via App Bridge
                return json({ redirectUrl: confirmationUrl });
            }

            return json({ error: "Failed to create subscription" }, { status: 500 });
        } catch (error) {
            console.error("Upgrade error:", error);
            return json({ error: error.message }, { status: 500 });
        }
    }

    if (actionType === "cancel") {
        try {
            const { isPro, subscription } = await checkSubscription(admin);

            if (isPro && subscription?.id) {
                await cancelSubscription(admin, subscription.id);
                await updatePlanMetafield(admin, "free");
            }

            return json({ success: true, message: "Subscription cancelled" });
        } catch (error) {
            console.error("Cancel error:", error);
            return json({ error: error.message }, { status: 500 });
        }
    }

    return json({ error: "Invalid action" }, { status: 400 });
};

export default function Billing() {
    const { isPro, subscription } = useLoaderData();
    const actionData = useActionData();
    const submit = useSubmit();
    const navigation = useNavigation();
    const shopify = useAppBridge();

    const isLoading = navigation.state === "submitting";

    // Handle redirect via App Bridge when we get a confirmationUrl
    useEffect(() => {
        if (actionData?.redirectUrl) {
            // Use App Bridge to redirect to Shopify's billing confirmation page
            window.open(actionData.redirectUrl, "_top");
        }
    }, [actionData]);

    const handleUpgrade = () => {
        const formData = new FormData();
        formData.append("action", "upgrade");
        submit(formData, { method: "post" });
    };

    const handleCancel = () => {
        if (confirm("Are you sure you want to cancel your Pro subscription?")) {
            const formData = new FormData();
            formData.append("action", "cancel");
            submit(formData, { method: "post" });
        }
    };

    return (
        <Page>
            <TitleBar title="Billing" />
            <BlockStack gap="500">
                <Layout>
                    <Layout.Section>
                        <Card>
                            <BlockStack gap="400">
                                <InlineStack align="space-between" blockAlign="center">
                                    <BlockStack gap="100">
                                        <Text as="h2" variant="headingLg">
                                            Current Plan
                                        </Text>
                                        <InlineStack gap="200" blockAlign="center">
                                            <Text as="span" variant="headingXl">
                                                {isPro ? "Pro" : "Free"}
                                            </Text>
                                            {isPro && <Badge tone="success">Active</Badge>}
                                        </InlineStack>
                                    </BlockStack>
                                    {!isPro && (
                                        <Button
                                            variant="primary"
                                            onClick={handleUpgrade}
                                            loading={isLoading}
                                        >
                                            Upgrade to Pro - $1/month
                                        </Button>
                                    )}
                                </InlineStack>

                                {actionData?.error && (
                                    <Banner tone="critical">
                                        <Text as="p">{actionData.error}</Text>
                                    </Banner>
                                )}

                                {isPro && subscription && (
                                    <Banner tone="success">
                                        <Text as="p">
                                            Your Pro subscription is active.
                                            {subscription.trialDays > 0 && ` You have ${subscription.trialDays} trial days remaining.`}
                                        </Text>
                                    </Banner>
                                )}
                            </BlockStack>
                        </Card>
                    </Layout.Section>

                    <Layout.Section>
                        <Card>
                            <BlockStack gap="400">
                                <Text as="h2" variant="headingMd">
                                    Plan Comparison
                                </Text>

                                <Box
                                    background="bg-surface-secondary"
                                    padding="400"
                                    borderRadius="200"
                                >
                                    <InlineStack gap="800" wrap={false}>
                                        {/* Free Plan */}
                                        <Box minWidth="200px">
                                            <BlockStack gap="300">
                                                <Text as="h3" variant="headingMd">
                                                    Free
                                                </Text>
                                                <Text as="p" variant="headingLg">
                                                    $0
                                                </Text>
                                                <List>
                                                    <List.Item>WhatsApp button</List.Item>
                                                    <List.Item>Custom text & colors</List.Item>
                                                    <List.Item>Position (left/right)</List.Item>
                                                    <List.Item>4 animations</List.Item>
                                                </List>
                                            </BlockStack>
                                        </Box>

                                        <Divider />

                                        {/* Pro Plan */}
                                        <Box minWidth="200px">
                                            <BlockStack gap="300">
                                                <InlineStack gap="200" blockAlign="center">
                                                    <Text as="h3" variant="headingMd">
                                                        Pro
                                                    </Text>
                                                    <Badge tone="attention">Recommended</Badge>
                                                </InlineStack>
                                                <Text as="p" variant="headingLg">
                                                    $1<Text as="span" variant="bodyMd">/month</Text>
                                                </Text>
                                                <List>
                                                    <List.Item>Everything in Free</List.Item>
                                                    <List.Item>5 premium animations</List.Item>
                                                    <List.Item>Display triggers</List.Item>
                                                    <List.Item>Device targeting</List.Item>
                                                    <List.Item>Business hours</List.Item>
                                                    <List.Item>Multi-agent (up to 3)</List.Item>
                                                </List>
                                                {!isPro && (
                                                    <Button onClick={handleUpgrade} loading={isLoading}>
                                                        Start 3-day free trial
                                                    </Button>
                                                )}
                                            </BlockStack>
                                        </Box>
                                    </InlineStack>
                                </Box>
                            </BlockStack>
                        </Card>
                    </Layout.Section>

                    {isPro && (
                        <Layout.Section>
                            <Card>
                                <BlockStack gap="300">
                                    <Text as="h2" variant="headingMd">
                                        Manage Subscription
                                    </Text>
                                    <Text as="p" variant="bodyMd" tone="subdued">
                                        Your subscription will automatically renew each month.
                                    </Text>
                                    <Button
                                        variant="plain"
                                        tone="critical"
                                        onClick={handleCancel}
                                        loading={isLoading}
                                    >
                                        Cancel subscription
                                    </Button>
                                </BlockStack>
                            </Card>
                        </Layout.Section>
                    )}
                </Layout>
            </BlockStack>
        </Page>
    );
}
