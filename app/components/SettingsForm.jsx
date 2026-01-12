import { useState, useCallback } from "react";
import {
    Card,
    FormLayout,
    TextField,
    Select,
    Button,
    InlineStack,
    BlockStack,
    Text,
    Box,
    Divider,
    Badge,
    Checkbox,
    RangeSlider,
    DropZone,
    Thumbnail,
    Banner,
} from "@shopify/polaris";

// Free animations (5)
const FREE_ANIMATIONS = [
    { label: "None", value: "none" },
    { label: "Pulse", value: "pulse" },
    { label: "Bounce", value: "bounce" },
    { label: "Shake", value: "shake" },
    { label: "Fade", value: "fade" },
    { label: "Heartbeat", value: "heartbeat" },
];

// Pro animations (15 additional)
const PRO_ANIMATIONS = [
    { label: "Swing ⭐", value: "swing" },
    { label: "Tada ⭐", value: "tada" },
    { label: "Jello ⭐", value: "jello" },
    { label: "Float ⭐", value: "float" },
    { label: "Glow ⭐", value: "glow" },
    { label: "Spin ⭐", value: "spin" },
    { label: "Flip ⭐", value: "flip" },
    { label: "Rubber Band ⭐", value: "rubberband" },
    { label: "Wobble ⭐", value: "wobble" },
    { label: "Flash ⭐", value: "flash" },
    { label: "Zoom ⭐", value: "zoom" },
    { label: "Slide In ⭐", value: "slidein" },
    { label: "Pop ⭐", value: "pop" },
    { label: "Wave ⭐", value: "wave" },
    { label: "Morph ⭐", value: "morph" },
];

// Pro button effects
const BUTTON_EFFECT_OPTIONS = [
    { label: "None", value: "none" },
    { label: "Glassmorphism ⭐", value: "glass" },
    { label: "Liquid Glass ⭐", value: "liquidglass" },
    { label: "Neon ⭐", value: "neon" },
    { label: "Gradient Glow ⭐", value: "gradientglow" },
    { label: "3D Shadow ⭐", value: "3dshadow" },
];

const POSITION_OPTIONS = [
    { label: "Right", value: "right" },
    { label: "Left", value: "left" },
];

const DEVICE_OPTIONS = [
    { label: "All Devices", value: "all" },
    { label: "Desktop Only", value: "desktop" },
    { label: "Mobile Only", value: "mobile" },
];

const TRIGGER_OPTIONS = [
    { label: "Immediately", value: "immediate" },
    { label: "After Delay", value: "delay" },
    { label: "On Scroll", value: "scroll" },
];

export function SettingsForm({ initialSettings, onSave, saving, isPro = false }) {
    const [settings, setSettings] = useState({
        // Existing settings
        phoneNumber: initialSettings?.phoneNumber || "",
        ctaText: initialSettings?.ctaText || "Chat with us",
        defaultMessage: initialSettings?.defaultMessage || "",
        position: initialSettings?.position || "right",
        colorBg: initialSettings?.colorBg || "#25D366",
        colorText: initialSettings?.colorText || "#FFFFFF",
        animationStyle: initialSettings?.animationStyle || "pulse",
        // Pro settings
        deviceTarget: initialSettings?.deviceTarget || "all",
        triggerType: initialSettings?.triggerType || "immediate",
        triggerDelay: initialSettings?.triggerDelay || 3,
        triggerScroll: initialSettings?.triggerScroll || 25,
        enableBusinessHours: initialSettings?.enableBusinessHours || false,
        businessHoursStart: initialSettings?.businessHoursStart || "09:00",
        businessHoursEnd: initialSettings?.businessHoursEnd || "17:00",
        offlineMessage: initialSettings?.offlineMessage || "We're currently offline. Leave a message!",
        hideWhenOffline: initialSettings?.hideWhenOffline || false,
        // Multi-agent settings (Pro)
        enableMultiAgent: initialSettings?.enableMultiAgent || false,
        agents: initialSettings?.agents || [
            { name: "", phone: "" },
            { name: "", phone: "" },
            { name: "", phone: "" },
        ],
        // Page exclusion settings (Pro)
        enablePageExclusion: initialSettings?.enablePageExclusion || false,
        excludeCart: initialSettings?.excludeCart || false,
        excludeCheckout: initialSettings?.excludeCheckout || false,
        excludeCustomPages: initialSettings?.excludeCustomPages || "",
        // Context-aware messages (Pro)
        enableContextMessages: initialSettings?.enableContextMessages || false,
        productPageMessage: initialSettings?.productPageMessage || "Hi! I'm interested in {{product_name}}",
        collectionPageMessage: initialSettings?.collectionPageMessage || "Hi! I'm browsing {{collection_name}}",
        cartPageMessage: initialSettings?.cartPageMessage || "Hi! I have a question about my cart",
        // Analytics (Pro)
        enableAnalytics: initialSettings?.enableAnalytics || false,
        // Premium button effects (Pro)
        buttonEffect: initialSettings?.buttonEffect || "none",
        // Position margins (Pro)
        bottomMargin: initialSettings?.bottomMargin || 20,
        sideMargin: initialSettings?.sideMargin || 20,
        // Custom icon (Pro)
        customIcon: initialSettings?.customIcon || "",
    });

    const handleChange = (field) => (value) => {
        setSettings((prev) => ({ ...prev, [field]: value }));
    };

    const handleAgentChange = (index, field) => (value) => {
        setSettings((prev) => {
            const newAgents = [...prev.agents];
            newAgents[index] = { ...newAgents[index], [field]: value };
            return { ...prev, agents: newAgents };
        });
    };

    const handleSubmit = () => {
        onSave(settings);
    };

    // Combine animations based on plan
    const animationOptions = isPro
        ? [...FREE_ANIMATIONS, ...PRO_ANIMATIONS]
        : FREE_ANIMATIONS;

    return (
        <Card>
            <BlockStack gap="400">
                <Text as="h2" variant="headingMd">
                    Widget Settings
                </Text>

                <FormLayout>
                    {/* WhatsApp Number */}
                    <TextField
                        label="WhatsApp Phone Number"
                        type="tel"
                        value={settings.phoneNumber}
                        onChange={handleChange("phoneNumber")}
                        placeholder="+1234567890"
                        helpText="Include country code (e.g., +1 for USA)"
                        autoComplete="tel"
                    />

                    {/* Button Text */}
                    <TextField
                        label="Button Text"
                        value={settings.ctaText}
                        onChange={handleChange("ctaText")}
                        placeholder="Chat with us"
                        maxLength={30}
                    />

                    {/* Default Message */}
                    <TextField
                        label="Pre-filled Message"
                        value={settings.defaultMessage}
                        onChange={handleChange("defaultMessage")}
                        multiline={3}
                        placeholder="Hi! I have a question about..."
                        helpText="This message will be pre-filled when customers click the button"
                    />
                </FormLayout>

                <Divider />

                <Text as="h2" variant="headingMd">
                    Appearance
                </Text>

                <FormLayout>
                    <FormLayout.Group>
                        {/* Position */}
                        <Select
                            label="Position"
                            options={POSITION_OPTIONS}
                            value={settings.position}
                            onChange={handleChange("position")}
                        />

                        {/* Animation */}
                        <Select
                            label={
                                <InlineStack gap="100" blockAlign="center">
                                    <span>Animation</span>
                                    {isPro && <Badge tone="success" size="small">Pro</Badge>}
                                </InlineStack>
                            }
                            options={animationOptions}
                            value={settings.animationStyle}
                            onChange={handleChange("animationStyle")}
                        />
                    </FormLayout.Group>

                    <FormLayout.Group>
                        {/* Background Color */}
                        <Box>
                            <BlockStack gap="100">
                                <Text as="span" variant="bodyMd">
                                    Background Color
                                </Text>
                                <InlineStack gap="200" blockAlign="center">
                                    <input
                                        type="color"
                                        value={settings.colorBg}
                                        onChange={(e) => handleChange("colorBg")(e.target.value)}
                                        style={{
                                            width: "40px",
                                            height: "40px",
                                            border: "1px solid #ccc",
                                            borderRadius: "4px",
                                            cursor: "pointer",
                                        }}
                                    />
                                    <TextField
                                        value={settings.colorBg}
                                        onChange={handleChange("colorBg")}
                                        autoComplete="off"
                                        maxLength={7}
                                    />
                                </InlineStack>
                            </BlockStack>
                        </Box>

                        {/* Text Color */}
                        <Box>
                            <BlockStack gap="100">
                                <Text as="span" variant="bodyMd">
                                    Text Color
                                </Text>
                                <InlineStack gap="200" blockAlign="center">
                                    <input
                                        type="color"
                                        value={settings.colorText}
                                        onChange={(e) => handleChange("colorText")(e.target.value)}
                                        style={{
                                            width: "40px",
                                            height: "40px",
                                            border: "1px solid #ccc",
                                            borderRadius: "4px",
                                            cursor: "pointer",
                                        }}
                                    />
                                    <TextField
                                        value={settings.colorText}
                                        onChange={handleChange("colorText")}
                                        autoComplete="off"
                                        maxLength={7}
                                    />
                                </InlineStack>
                            </BlockStack>
                        </Box>
                    </FormLayout.Group>
                </FormLayout>

                {/* PRO FEATURES SECTION */}
                {isPro && (
                    <>
                        <Divider />
                        <InlineStack gap="200" blockAlign="center">
                            <Text as="h2" variant="headingMd">
                                Pro Features
                            </Text>
                            <Badge tone="success">Unlocked</Badge>
                        </InlineStack>

                        <FormLayout>
                            <FormLayout.Group>
                                {/* Device Targeting */}
                                <Select
                                    label="Device Targeting"
                                    options={DEVICE_OPTIONS}
                                    value={settings.deviceTarget}
                                    onChange={handleChange("deviceTarget")}
                                    helpText="Show widget on specific devices"
                                />

                                {/* Display Trigger */}
                                <Select
                                    label="Display Trigger"
                                    options={TRIGGER_OPTIONS}
                                    value={settings.triggerType}
                                    onChange={handleChange("triggerType")}
                                    helpText="When to show the widget"
                                />
                            </FormLayout.Group>

                            {/* Conditional: Delay slider */}
                            {settings.triggerType === "delay" && (
                                <Box paddingBlockStart="200">
                                    <RangeSlider
                                        label={`Show after ${settings.triggerDelay} seconds`}
                                        value={settings.triggerDelay}
                                        onChange={handleChange("triggerDelay")}
                                        min={1}
                                        max={30}
                                        output
                                    />
                                </Box>
                            )}

                            {/* Conditional: Scroll percentage */}
                            {settings.triggerType === "scroll" && (
                                <Box paddingBlockStart="200">
                                    <RangeSlider
                                        label={`Show after scrolling ${settings.triggerScroll}%`}
                                        value={settings.triggerScroll}
                                        onChange={handleChange("triggerScroll")}
                                        min={10}
                                        max={90}
                                        step={10}
                                        output
                                    />
                                </Box>
                            )}

                            {/* Business Hours */}
                            <Checkbox
                                label="Enable Business Hours"
                                checked={settings.enableBusinessHours}
                                onChange={handleChange("enableBusinessHours")}
                                helpText="Show different behavior outside business hours"
                            />

                            {settings.enableBusinessHours && (
                                <>
                                    <FormLayout.Group>
                                        <TextField
                                            label="Start Time"
                                            type="time"
                                            value={settings.businessHoursStart}
                                            onChange={handleChange("businessHoursStart")}
                                        />
                                        <TextField
                                            label="End Time"
                                            type="time"
                                            value={settings.businessHoursEnd}
                                            onChange={handleChange("businessHoursEnd")}
                                        />
                                    </FormLayout.Group>
                                    <Checkbox
                                        label="Hide widget when offline"
                                        checked={settings.hideWhenOffline}
                                        onChange={handleChange("hideWhenOffline")}
                                        helpText="If unchecked, shows offline message instead"
                                    />
                                    {!settings.hideWhenOffline && (
                                        <TextField
                                            label="Offline Message"
                                            value={settings.offlineMessage}
                                            onChange={handleChange("offlineMessage")}
                                            helpText="Message shown outside business hours"
                                        />
                                    )}
                                </>
                            )}

                            <Divider />

                            {/* Multi-Agent Support */}
                            <Checkbox
                                label="Enable Multi-Agent Support"
                                checked={settings.enableMultiAgent}
                                onChange={handleChange("enableMultiAgent")}
                                helpText="Show multiple team members for customers to choose from"
                            />

                            {settings.enableMultiAgent && (
                                <BlockStack gap="300">
                                    <Text as="p" variant="bodyMd" tone="subdued">
                                        Add up to 3 team members (leave empty to skip)
                                    </Text>
                                    {[0, 1, 2].map((index) => (
                                        <Box key={index} padding="300" background="bg-surface-secondary" borderRadius="200">
                                            <FormLayout.Group>
                                                <TextField
                                                    label={`Agent ${index + 1} Name`}
                                                    value={settings.agents[index]?.name || ""}
                                                    onChange={handleAgentChange(index, "name")}
                                                    placeholder="John"
                                                />
                                                <TextField
                                                    label={`Agent ${index + 1} Phone`}
                                                    type="tel"
                                                    value={settings.agents[index]?.phone || ""}
                                                    onChange={handleAgentChange(index, "phone")}
                                                    placeholder="+1234567890"
                                                />
                                            </FormLayout.Group>
                                        </Box>
                                    ))}
                                </BlockStack>
                            )}

                            <Divider />

                            {/* Page Exclusion Rules */}
                            <Checkbox
                                label="Enable Page Exclusion"
                                checked={settings.enablePageExclusion}
                                onChange={handleChange("enablePageExclusion")}
                                helpText="Hide widget on specific pages"
                            />

                            {settings.enablePageExclusion && (
                                <BlockStack gap="200">
                                    <Checkbox
                                        label="Hide on Cart page"
                                        checked={settings.excludeCart}
                                        onChange={handleChange("excludeCart")}
                                    />
                                    <Checkbox
                                        label="Hide on Checkout pages"
                                        checked={settings.excludeCheckout}
                                        onChange={handleChange("excludeCheckout")}
                                    />
                                    <TextField
                                        label="Hide on custom pages"
                                        value={settings.excludeCustomPages}
                                        onChange={handleChange("excludeCustomPages")}
                                        placeholder="/contact, /about, /faq"
                                        helpText="Comma-separated page paths"
                                        multiline={2}
                                    />
                                </BlockStack>
                            )}

                            <Divider />

                            {/* Context-Aware Messages */}
                            <Checkbox
                                label="Enable Context-Aware Messages"
                                checked={settings.enableContextMessages}
                                onChange={handleChange("enableContextMessages")}
                                helpText="Dynamic pre-filled messages based on current page"
                            />

                            {settings.enableContextMessages && (
                                <BlockStack gap="300">
                                    <TextField
                                        label="Product Page Message"
                                        value={settings.productPageMessage}
                                        onChange={handleChange("productPageMessage")}
                                        helpText="Use {{product_name}} for product title"
                                    />
                                    <TextField
                                        label="Collection Page Message"
                                        value={settings.collectionPageMessage}
                                        onChange={handleChange("collectionPageMessage")}
                                        helpText="Use {{collection_name}} for collection title"
                                    />
                                    <TextField
                                        label="Cart Page Message"
                                        value={settings.cartPageMessage}
                                        onChange={handleChange("cartPageMessage")}
                                    />
                                </BlockStack>
                            )}

                            <Divider />

                            {/* Analytics */}
                            <Checkbox
                                label="Enable Analytics Tracking"
                                checked={settings.enableAnalytics}
                                onChange={handleChange("enableAnalytics")}
                                helpText="Track widget clicks and impressions. View stats in the Analytics page."
                            />

                            <Divider />

                            {/* Premium Button Effects */}
                            <Text variant="headingSm" as="h3">Premium Button Effects</Text>
                            <Select
                                label="Button Effect"
                                options={BUTTON_EFFECT_OPTIONS}
                                value={settings.buttonEffect}
                                onChange={handleChange("buttonEffect")}
                                helpText="Apply premium visual effects to your WhatsApp button"
                            />

                            <Divider />

                            {/* Position Margins */}
                            <Text variant="headingSm" as="h3">Position Margins</Text>
                            <RangeSlider
                                label={`Bottom Margin: ${settings.bottomMargin}px`}
                                value={settings.bottomMargin}
                                onChange={handleChange("bottomMargin")}
                                min={0}
                                max={100}
                                output
                            />
                            <RangeSlider
                                label={`${settings.position === 'left' ? 'Left' : 'Right'} Margin: ${settings.sideMargin}px`}
                                value={settings.sideMargin}
                                onChange={handleChange("sideMargin")}
                                min={0}
                                max={100}
                                output
                            />

                            <Divider />

                            {/* Custom Icon */}
                            <Text variant="headingSm" as="h3">Custom Icon</Text>
                            <Text variant="bodySm" tone="subdued">
                                Upload your own icon instead of the WhatsApp logo (PNG, JPG, or SVG, max 500KB)
                            </Text>

                            {settings.customIcon ? (
                                <InlineStack gap="400" align="start" blockAlign="center">
                                    <Thumbnail
                                        source={settings.customIcon}
                                        alt="Custom icon preview"
                                        size="medium"
                                    />
                                    <Button
                                        onClick={() => handleChange("customIcon")("")}
                                        tone="critical"
                                        variant="plain"
                                    >
                                        Remove icon
                                    </Button>
                                </InlineStack>
                            ) : (
                                <DropZone
                                    accept="image/*"
                                    type="image"
                                    onDrop={(files) => {
                                        if (files.length > 0) {
                                            const file = files[0];
                                            if (file.size > 500000) {
                                                alert("Image too large. Maximum size is 500KB.");
                                                return;
                                            }
                                            const reader = new FileReader();
                                            reader.onload = (e) => {
                                                handleChange("customIcon")(e.target.result);
                                            };
                                            reader.readAsDataURL(file);
                                        }
                                    }}
                                >
                                    <DropZone.FileUpload actionHint="or drop files to upload" />
                                </DropZone>
                            )}
                        </FormLayout>
                    </>
                )}

                <Divider />

                {/* Preview */}
                <Text as="h2" variant="headingMd">
                    Preview
                </Text>

                <Box
                    background="bg-surface-secondary"
                    padding="600"
                    borderRadius="200"
                    minHeight="100px"
                >
                    <div
                        style={{
                            display: "flex",
                            justifyContent: settings.position === "right" ? "flex-end" : "flex-start",
                        }}
                    >
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "10px",
                                padding: "12px 20px",
                                backgroundColor: settings.colorBg,
                                color: settings.colorText,
                                borderRadius: "50px",
                                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
                                fontSize: "14px",
                                fontWeight: 600,
                            }}
                        >
                            <svg
                                width="24"
                                height="24"
                                viewBox="0 0 24 24"
                                fill="currentColor"
                            >
                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                            </svg>
                            <span>{settings.ctaText || "Chat with us"}</span>
                        </div>
                    </div>
                </Box>

                <InlineStack align="end">
                    <Button variant="primary" onClick={handleSubmit} loading={saving}>
                        Save Settings
                    </Button>
                </InlineStack>
            </BlockStack>
        </Card>
    );
}
