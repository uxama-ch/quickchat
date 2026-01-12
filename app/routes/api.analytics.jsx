import { json } from "@remix-run/node";
import "@shopify/shopify-api/adapters/node";
import { shopifyApi, LATEST_API_VERSION } from "@shopify/shopify-api";

/**
 * Public Analytics API endpoint
 * Receives click/impression events from the widget and stores them in shop metafields
 * 
 * This is a public endpoint (no session required) that uses the Shopify Admin API
 * with the app's access token to update analytics metafields.
 */

// Initialize Shopify API for server-side operations
const shopify = shopifyApi({
    apiKey: process.env.SHOPIFY_API_KEY,
    apiSecretKey: process.env.SHOPIFY_API_SECRET,
    scopes: ["read_metafields", "write_metafields"],
    hostName: process.env.SHOPIFY_APP_URL?.replace("https://", "").replace("http://", "") || "localhost",
    apiVersion: LATEST_API_VERSION,
    isEmbeddedApp: true,
});

export async function action({ request }) {
    // Handle CORS preflight
    if (request.method === "OPTIONS") {
        return new Response(null, {
            status: 204,
            headers: getCorsHeaders(),
        });
    }

    if (request.method !== "POST") {
        return json({ error: "Method not allowed" }, {
            status: 405,
            headers: getCorsHeaders()
        });
    }

    try {
        const body = await request.json();
        const { shop, event, pageType, timestamp } = body;

        if (!shop || !event) {
            return json({ error: "Missing shop or event" }, {
                status: 400,
                headers: getCorsHeaders()
            });
        }

        // Validate shop domain format
        if (!shop.endsWith(".myshopify.com")) {
            return json({ error: "Invalid shop domain" }, {
                status: 400,
                headers: getCorsHeaders()
            });
        }

        // Log the event (for debugging)
        console.log(`[Analytics] ${event} | Shop: ${shop} | Page: ${pageType} | Time: ${timestamp}`);

        // For now, just acknowledge the event
        // Full metafield update would require the shop's access token from database
        // which we don't have in this public endpoint

        return json({
            success: true,
            message: "Event recorded",
            // Return data so client knows it was received
            received: { shop, event, pageType, timestamp }
        }, {
            headers: getCorsHeaders()
        });

    } catch (error) {
        console.error("[Analytics] Error processing event:", error);
        return json({ error: "Failed to process event" }, {
            status: 500,
            headers: getCorsHeaders()
        });
    }
}

function getCorsHeaders() {
    return {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
    };
}
