/**
 * Billing utilities for QuickChat Pro subscription
 */

import { PLAN_NAME } from "../shopify.server";

/**
 * Check if the shop has an active Pro subscription
 */
export async function checkSubscription(admin) {
  const response = await admin.graphql(`
    query checkSubscription {
      app {
        installation {
          activeSubscriptions {
            id
            name
            status
            trialDays
            currentPeriodEnd
            test
          }
        }
      }
    }
  `);

  const data = await response.json();
  const subscriptions = data.data?.app?.installation?.activeSubscriptions || [];

  // Find active Pro Plan subscription
  const proSubscription = subscriptions.find(
    (sub) => sub.name === PLAN_NAME && sub.status === "ACTIVE"
  );

  return {
    isPro: !!proSubscription,
    subscription: proSubscription || null,
    trialDays: proSubscription?.trialDays || 0,
  };
}

/**
 * Request a new Pro subscription (redirects merchant to Shopify checkout)
 */
export async function requestSubscription(admin, shop, returnUrl) {
  const response = await admin.graphql(`
    mutation createSubscription($name: String!, $returnUrl: URL!, $trialDays: Int!, $amount: Decimal!, $currencyCode: CurrencyCode!) {
      appSubscriptionCreate(
        name: $name
        returnUrl: $returnUrl
        trialDays: $trialDays
        test: true
        lineItems: [
          {
            plan: {
              appRecurringPricingDetails: {
                price: { amount: $amount, currencyCode: $currencyCode }
                interval: EVERY_30_DAYS
              }
            }
          }
        ]
      ) {
        appSubscription {
          id
          status
        }
        confirmationUrl
        userErrors {
          field
          message
        }
      }
    }
  `, {
    variables: {
      name: PLAN_NAME,
      returnUrl: returnUrl,
      trialDays: 3,
      amount: 1.0,
      currencyCode: "USD",
    },
  });

  const data = await response.json();

  if (data.data?.appSubscriptionCreate?.userErrors?.length > 0) {
    throw new Error(data.data.appSubscriptionCreate.userErrors[0].message);
  }

  return {
    confirmationUrl: data.data?.appSubscriptionCreate?.confirmationUrl,
    subscription: data.data?.appSubscriptionCreate?.appSubscription,
  };
}

/**
 * Cancel the Pro subscription
 */
export async function cancelSubscription(admin, subscriptionId) {
  const response = await admin.graphql(`
    mutation cancelSubscription($id: ID!) {
      appSubscriptionCancel(id: $id) {
        appSubscription {
          id
          status
        }
        userErrors {
          field
          message
        }
      }
    }
  `, {
    variables: {
      id: subscriptionId,
    },
  });

  const data = await response.json();

  if (data.data?.appSubscriptionCancel?.userErrors?.length > 0) {
    throw new Error(data.data.appSubscriptionCancel.userErrors[0].message);
  }

  return data.data?.appSubscriptionCancel?.appSubscription;
}

/**
 * Update the plan metafield for theme access
 */
export async function updatePlanMetafield(admin, plan) {
  // Get shop ID first
  const shopResponse = await admin.graphql(`
    query getShop {
      shop {
        id
      }
    }
  `);
  const shopData = await shopResponse.json();
  const shopId = shopData.data.shop.id;

  const response = await admin.graphql(`
    mutation updatePlan($metafields: [MetafieldsSetInput!]!) {
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
        namespace: "quickchat",
        key: "plan",
        type: "single_line_text_field",
        value: plan,
      }],
    },
  });

  const data = await response.json();

  if (data.data?.metafieldsSet?.userErrors?.length > 0) {
    throw new Error(data.data.metafieldsSet.userErrors[0].message);
  }

  return data.data?.metafieldsSet?.metafields;
}
