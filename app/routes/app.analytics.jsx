import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import {
    Page,
    Layout,
    Card,
    BlockStack,
    Text,
    InlineStack,
    Box,
    Divider,
    Badge,
    Banner,
    DataTable,
    Icon,
} from "@shopify/polaris";
import { LockIcon } from "@shopify/polaris-icons";
import { authenticate } from "../shopify.server";
import { getWidgetSettings, getPlan } from "../lib/metafields.server";

// Supabase configuration
const SUPABASE_URL = "https://ohqnutrhqawhrvfeghad.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ocW51dHJocWF3aHJ2ZmVnaGFkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc5MDAxMjUsImV4cCI6MjA4MzQ3NjEyNX0._q6fWB-xK1a_7O6RjZ5v0EKTM8faJH_q5frO-kIY87g";

export async function loader({ request }) {
    const { admin, session } = await authenticate.admin(request);

    // Get current settings and plan
    const settings = await getWidgetSettings(admin);
    const plan = await getPlan(admin);
    const analyticsEnabled = settings?.enableAnalytics || false;
    const isPro = plan === "pro";

    // Get shop domain for filtering
    const shopDomain = session.shop;

    // Fetch analytics from Supabase
    let analyticsData = {
        totalClicks: 0,
        totalImpressions: 0,
        clicksByPage: [],
        clicksByDay: [],
        lastUpdated: null,
    };

    try {
        // Get total counts
        const clicksResponse = await fetch(
            `${SUPABASE_URL}/rest/v1/analytics_events?shop=eq.${shopDomain}&event_type=eq.click&select=id`,
            {
                headers: {
                    'apikey': SUPABASE_KEY,
                    'Authorization': `Bearer ${SUPABASE_KEY}`,
                }
            }
        );
        const clicksData = await clicksResponse.json();
        analyticsData.totalClicks = Array.isArray(clicksData) ? clicksData.length : 0;

        const impressionsResponse = await fetch(
            `${SUPABASE_URL}/rest/v1/analytics_events?shop=eq.${shopDomain}&event_type=eq.impression&select=id`,
            {
                headers: {
                    'apikey': SUPABASE_KEY,
                    'Authorization': `Bearer ${SUPABASE_KEY}`,
                }
            }
        );
        const impressionsData = await impressionsResponse.json();
        analyticsData.totalImpressions = Array.isArray(impressionsData) ? impressionsData.length : 0;

        // Get clicks by page type
        const pageTypeResponse = await fetch(
            `${SUPABASE_URL}/rest/v1/analytics_events?shop=eq.${shopDomain}&event_type=eq.click&select=page_type`,
            {
                headers: {
                    'apikey': SUPABASE_KEY,
                    'Authorization': `Bearer ${SUPABASE_KEY}`,
                }
            }
        );
        const pageTypeData = await pageTypeResponse.json();

        if (Array.isArray(pageTypeData)) {
            const pageCounts = {};
            pageTypeData.forEach(row => {
                const pt = row.page_type || 'other';
                pageCounts[pt] = (pageCounts[pt] || 0) + 1;
            });
            analyticsData.clicksByPage = Object.entries(pageCounts).map(([pageType, clicks]) => ({
                pageType,
                clicks
            })).sort((a, b) => b.clicks - a.clicks);
        }

        // Get recent events for activity
        const recentResponse = await fetch(
            `${SUPABASE_URL}/rest/v1/analytics_events?shop=eq.${shopDomain}&select=event_type,created_at&order=created_at.desc&limit=100`,
            {
                headers: {
                    'apikey': SUPABASE_KEY,
                    'Authorization': `Bearer ${SUPABASE_KEY}`,
                }
            }
        );
        const recentData = await recentResponse.json();

        if (Array.isArray(recentData) && recentData.length > 0) {
            // Group by day
            const dayCounts = {};
            recentData.forEach(row => {
                const day = row.created_at?.split('T')[0];
                if (day) {
                    if (!dayCounts[day]) {
                        dayCounts[day] = { clicks: 0, impressions: 0 };
                    }
                    if (row.event_type === 'click') {
                        dayCounts[day].clicks++;
                    } else if (row.event_type === 'impression') {
                        dayCounts[day].impressions++;
                    }
                }
            });
            analyticsData.clicksByDay = Object.entries(dayCounts).map(([date, data]) => ({
                date,
                clicks: data.clicks,
                impressions: data.impressions
            })).sort((a, b) => b.date.localeCompare(a.date));

            analyticsData.lastUpdated = recentData[0]?.created_at;
        }

    } catch (error) {
        console.error("Error fetching analytics from Supabase:", error);
    }

    return json({
        analyticsEnabled,
        analytics: analyticsData,
        shop: session.shop,
        isPro,
    });
}

// Small blur overlay for cards (no badge, just blur)
function SmallProOverlay({ children }) {
    return (
        <div style={{ position: "relative" }}>
            <div style={{
                filter: "blur(5px)",
                pointerEvents: "none",
                userSelect: "none",
                opacity: 0.6
            }}>
                {children}
            </div>
        </div>
    );
}

// Large blur overlay for sections with centered lock
function LargeProOverlay({ children }) {
    return (
        <div style={{ position: "relative" }}>
            <div style={{
                filter: "blur(5px)",
                pointerEvents: "none",
                userSelect: "none",
                opacity: 0.5
            }}>
                {children}
            </div>
            <div style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 10,
            }}>
                <div style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "16px",
                }}>
                    <svg
                        width="72"
                        height="72"
                        viewBox="0 0 20 20"
                        fill="none"
                        style={{ color: "#5c5f62" }}
                    >
                        <path
                            d="M14 8V6a4 4 0 00-8 0v2H5a1 1 0 00-1 1v8a1 1 0 001 1h10a1 1 0 001-1V9a1 1 0 00-1-1h-1zm-5.5 6a1.5 1.5 0 110-3 1.5 1.5 0 010 3zm3-6h-5V6a2.5 2.5 0 015 0v2z"
                            fill="currentColor"
                        />
                    </svg>
                    <Text variant="headingLg" as="p" tone="subdued">
                        Upgrade to unlock
                    </Text>
                </div>
            </div>
        </div>
    );
}

export default function AnalyticsPage() {
    const { analyticsEnabled, analytics, shop, isPro } = useLoaderData();

    const formatNumber = (num) => {
        return new Intl.NumberFormat().format(num || 0);
    };

    const clickRate = analytics.totalImpressions > 0
        ? ((analytics.totalClicks / analytics.totalImpressions) * 100).toFixed(1)
        : "0.0";

    return (
        <Page
            title="Analytics"
            subtitle="Track widget performance"
            backAction={{ content: "Settings", url: "/app" }}
        >
            <Layout>
                {!analyticsEnabled && (
                    <Layout.Section>
                        <Banner
                            title="Analytics is disabled"
                            action={{ content: "Enable in Settings", url: "/app" }}
                            tone="warning"
                        >
                            <p>Enable Analytics Tracking in your settings to start collecting data.</p>
                        </Banner>
                    </Layout.Section>
                )}

                {!isPro && (
                    <Layout.Section>
                        <Banner
                            title="Upgrade to Pro for full analytics"
                            action={{ content: "Upgrade Now", url: "/app/billing" }}
                            tone="info"
                        >
                            <p>Free plan shows total clicks only. Upgrade to Pro for impressions, click rate, page breakdown, and activity history.</p>
                        </Banner>
                    </Layout.Section>
                )}

                <Layout.Section>
                    <InlineStack gap="400" wrap={false}>
                        {/* Total Clicks - Available to all */}
                        <Box width="33%">
                            <Card>
                                <BlockStack gap="200">
                                    <Text variant="headingMd" as="h3">Total Clicks</Text>
                                    <Text variant="heading2xl" as="p" fontWeight="bold">
                                        {formatNumber(analytics.totalClicks)}
                                    </Text>
                                    <Text variant="bodySm" tone="subdued">
                                        WhatsApp button clicks
                                    </Text>
                                </BlockStack>
                            </Card>
                        </Box>

                        {/* Impressions - Pro only */}
                        <Box width="33%">
                            {isPro ? (
                                <Card>
                                    <BlockStack gap="200">
                                        <Text variant="headingMd" as="h3">Impressions</Text>
                                        <Text variant="heading2xl" as="p" fontWeight="bold">
                                            {formatNumber(analytics.totalImpressions)}
                                        </Text>
                                        <Text variant="bodySm" tone="subdued">
                                            Widget views
                                        </Text>
                                    </BlockStack>
                                </Card>
                            ) : (
                                <SmallProOverlay>
                                    <Card>
                                        <BlockStack gap="200">
                                            <Text variant="headingMd" as="h3">Impressions</Text>
                                            <Text variant="heading2xl" as="p" fontWeight="bold">
                                                --
                                            </Text>
                                            <Text variant="bodySm" tone="subdued">
                                                Widget views
                                            </Text>
                                        </BlockStack>
                                    </Card>
                                </SmallProOverlay>
                            )}
                        </Box>

                        {/* Click Rate - Pro only */}
                        <Box width="33%">
                            {isPro ? (
                                <Card>
                                    <BlockStack gap="200">
                                        <Text variant="headingMd" as="h3">Click Rate</Text>
                                        <Text variant="heading2xl" as="p" fontWeight="bold">
                                            {clickRate}%
                                        </Text>
                                        <Text variant="bodySm" tone="subdued">
                                            Conversion rate
                                        </Text>
                                    </BlockStack>
                                </Card>
                            ) : (
                                <SmallProOverlay>
                                    <Card>
                                        <BlockStack gap="200">
                                            <Text variant="headingMd" as="h3">Click Rate</Text>
                                            <Text variant="heading2xl" as="p" fontWeight="bold">
                                                --%
                                            </Text>
                                            <Text variant="bodySm" tone="subdued">
                                                Conversion rate
                                            </Text>
                                        </BlockStack>
                                    </Card>
                                </SmallProOverlay>
                            )}
                        </Box>
                    </InlineStack>
                </Layout.Section>

                {/* Clicks by Page Type + Recent Activity - Single Pro overlay for both */}
                {isPro ? (
                    <>
                        <Layout.Section>
                            <Card>
                                <BlockStack gap="400">
                                    <Text variant="headingMd" as="h3">Clicks by Page Type</Text>
                                    <Divider />
                                    {analytics.clicksByPage && analytics.clicksByPage.length > 0 ? (
                                        <DataTable
                                            columnContentTypes={["text", "numeric", "numeric"]}
                                            headings={["Page Type", "Clicks", "% of Total"]}
                                            rows={analytics.clicksByPage.map((item) => [
                                                item.pageType || "Unknown",
                                                formatNumber(item.clicks),
                                                analytics.totalClicks > 0
                                                    ? `${((item.clicks / analytics.totalClicks) * 100).toFixed(1)}%`
                                                    : "0%"
                                            ])}
                                        />
                                    ) : (
                                        <Box padding="400">
                                            <Text tone="subdued" alignment="center">
                                                No click data yet.
                                            </Text>
                                        </Box>
                                    )}
                                </BlockStack>
                            </Card>
                        </Layout.Section>

                        <Layout.Section>
                            <Card>
                                <BlockStack gap="400">
                                    <InlineStack align="space-between">
                                        <Text variant="headingMd" as="h3">Recent Activity</Text>
                                        {analytics.lastUpdated && (
                                            <Badge>
                                                Last event: {new Date(analytics.lastUpdated).toLocaleString()}
                                            </Badge>
                                        )}
                                    </InlineStack>
                                    <Divider />
                                    {analytics.clicksByDay && analytics.clicksByDay.length > 0 ? (
                                        <DataTable
                                            columnContentTypes={["text", "numeric", "numeric"]}
                                            headings={["Date", "Clicks", "Impressions"]}
                                            rows={analytics.clicksByDay.slice(0, 7).map((item) => [
                                                item.date,
                                                formatNumber(item.clicks),
                                                formatNumber(item.impressions),
                                            ])}
                                        />
                                    ) : (
                                        <Box padding="400">
                                            <Text tone="subdued" alignment="center">
                                                No activity data yet.
                                            </Text>
                                        </Box>
                                    )}
                                </BlockStack>
                            </Card>
                        </Layout.Section>
                    </>
                ) : (
                    <Layout.Section>
                        <LargeProOverlay>
                            <BlockStack gap="400">
                                <Card>
                                    <BlockStack gap="400">
                                        <Text variant="headingMd" as="h3">Clicks by Page Type</Text>
                                        <Divider />
                                        <DataTable
                                            columnContentTypes={["text", "numeric", "numeric"]}
                                            headings={["Page Type", "Clicks", "% of Total"]}
                                            rows={[
                                                ["product", "--", "--%"],
                                                ["home", "--", "--%"],
                                                ["collection", "--", "--%"],
                                            ]}
                                        />
                                    </BlockStack>
                                </Card>

                                <Card>
                                    <BlockStack gap="400">
                                        <Text variant="headingMd" as="h3">Recent Activity</Text>
                                        <Divider />
                                        <DataTable
                                            columnContentTypes={["text", "numeric", "numeric"]}
                                            headings={["Date", "Clicks", "Impressions"]}
                                            rows={[
                                                ["2026-01-09", "--", "--"],
                                                ["2026-01-08", "--", "--"],
                                            ]}
                                        />
                                    </BlockStack>
                                </Card>
                            </BlockStack>
                        </LargeProOverlay>
                    </Layout.Section>
                )}

                <Layout.Section>
                    {isPro ? (
                        <Card>
                            <BlockStack gap="300">
                                <Text variant="headingMd" as="h3">How Analytics Works</Text>
                                <Text variant="bodyMd">
                                    When a visitor views a page with your widget (impression) or clicks the WhatsApp button (click),
                                    the event is sent to your analytics database and displayed here.
                                </Text>
                                <Text variant="bodySm" tone="subdued">
                                    Data is stored securely in Supabase and collected anonymously.
                                </Text>
                            </BlockStack>
                        </Card>
                    ) : (
                        <SmallProOverlay>
                            <Card>
                                <BlockStack gap="300">
                                    <Text variant="headingMd" as="h3">How Analytics Works</Text>
                                    <Text variant="bodyMd">
                                        When a visitor views a page with your widget (impression) or clicks the WhatsApp button (click),
                                        the event is sent to your analytics database and displayed here.
                                    </Text>
                                    <Text variant="bodySm" tone="subdued">
                                        Data is stored securely in Supabase and collected anonymously.
                                    </Text>
                                </BlockStack>
                            </Card>
                        </SmallProOverlay>
                    )}
                </Layout.Section>
            </Layout>
        </Page>
    );
}
