/**
 * Metafield Definitions and CRUD operations for QuickChat
 * Handles creating metafield definitions and reading/writing shop metafields
 */

// Metafield namespace and keys
export const METAFIELD_NAMESPACE = "quickchat";
export const SETTINGS_KEY = "settings";
export const PLAN_KEY = "plan";

/**
 * Create metafield definitions for the app
 * Should be called on first app load
 */
export async function ensureMetafieldDefinitions(admin) {
    // Check if definitions already exist
    const existingDefs = await admin.graphql(`
    query getMetafieldDefinitions {
      metafieldDefinitions(first: 10, ownerType: SHOP, namespace: "quickchat") {
        edges {
          node {
            id
            key
            namespace
          }
        }
      }
    }
  `);

    const existingDefsJson = await existingDefs.json();
    const definitions = existingDefsJson.data?.metafieldDefinitions?.edges || [];

    const hasSettingsDef = definitions.some(d => d.node.key === SETTINGS_KEY);
    const hasPlanDef = definitions.some(d => d.node.key === PLAN_KEY);

    // Create settings definition if not exists
    if (!hasSettingsDef) {
        await admin.graphql(`
      mutation createSettingsDefinition {
        metafieldDefinitionCreate(definition: {
          namespace: "quickchat"
          key: "settings"
          name: "Widget Settings"
          description: "QuickChat widget configuration"
          type: "json"
          ownerType: SHOP
          access: {
            storefront: PUBLIC_READ
          }
        }) {
          createdDefinition {
            id
          }
          userErrors {
            field
            message
          }
        }
      }
    `);
    }

    // Create plan definition if not exists
    if (!hasPlanDef) {
        await admin.graphql(`
      mutation createPlanDefinition {
        metafieldDefinitionCreate(definition: {
          namespace: "quickchat"
          key: "plan"
          name: "Subscription Plan"
          description: "Current subscription plan (free/pro)"
          type: "single_line_text_field"
          ownerType: SHOP
          access: {
            storefront: PUBLIC_READ
          }
        }) {
          createdDefinition {
            id
          }
          userErrors {
            field
            message
          }
        }
      }
    `);
    }

    return { hasSettingsDef, hasPlanDef };
}

/**
 * Get the shop's GID for metafield operations
 */
export async function getShopId(admin) {
    const response = await admin.graphql(`
    query getShop {
      shop {
        id
      }
    }
  `);
    const data = await response.json();
    return data.data.shop.id;
}

/**
 * Read widget settings from shop metafield
 */
export async function getWidgetSettings(admin) {
    const response = await admin.graphql(`
    query getWidgetSettings {
      shop {
        metafield(namespace: "quickchat", key: "settings") {
          value
        }
      }
    }
  `);

    const data = await response.json();
    const value = data.data?.shop?.metafield?.value;

    if (value) {
        try {
            return JSON.parse(value);
        } catch (e) {
            console.error("Failed to parse settings:", e);
            return getDefaultSettings();
        }
    }

    return getDefaultSettings();
}

/**
 * Save widget settings to shop metafield
 */
export async function saveWidgetSettings(admin, settings) {
    const shopId = await getShopId(admin);

    const response = await admin.graphql(`
    mutation saveSettings($metafields: [MetafieldsSetInput!]!) {
      metafieldsSet(metafields: $metafields) {
        metafields {
          id
          key
          value
        }
        userErrors {
          field
          message
        }
      }
    }
  `, {
        variables: {
            metafields: [{
                ownerId: shopId,
                namespace: METAFIELD_NAMESPACE,
                key: SETTINGS_KEY,
                type: "json",
                value: JSON.stringify(settings)
            }]
        }
    });

    const data = await response.json();

    if (data.data?.metafieldsSet?.userErrors?.length > 0) {
        throw new Error(data.data.metafieldsSet.userErrors[0].message);
    }

    return data.data?.metafieldsSet?.metafields;
}

/**
 * Get current subscription plan
 */
export async function getPlan(admin) {
    const response = await admin.graphql(`
    query getPlan {
      shop {
        metafield(namespace: "quickchat", key: "plan") {
          value
        }
      }
    }
  `);

    const data = await response.json();
    return data.data?.shop?.metafield?.value || "free";
}

/**
 * Default widget settings
 */
export function getDefaultSettings() {
    return {
        phoneNumber: "",
        ctaText: "Chat with us",
        defaultMessage: "Hi! I have a question about your products.",
        position: "right",
        colorBg: "#25D366",
        colorText: "#FFFFFF",
        animationStyle: "pulse"
    };
}
