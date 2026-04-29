"use client";

// Extracted reference for integrating the upgraded motion editor shell.
// Source of truth in this repo:
// - app/page.tsx
// - components/ui/motion-panel.tsx
// - components/ui/motion-target-overlay.tsx

import React, { useCallback, useState } from "react";
import { AnimatePresence } from "framer-motion";
import MotionPanel, {
  EditorSelectButton,
  type MotionMode,
  type MotionTheme,
} from "@/components/ui/motion-panel";
import MotionTargetOverlay from "@/components/ui/motion-target-overlay";

// Example motion target defs from existing business components.
// Keep the target project's own defs/config types if they already exist.
import { AGENT_FAN_MOTION } from "@/components/ui/agent-card";
import { CHAT_INPUT_MOTION } from "@/components/ui/claude-style-chat-input";

export default function MotionIntegrationReference() {
  // Keep the target project's existing config state shape.
  const [fanConfig, setFanConfig] = useState(AGENT_FAN_MOTION.defaultConfig);
  const [chatInputConfig, setChatInputConfig] = useState(CHAT_INPUT_MOTION.defaultConfig);

  // New shell state required by the upgraded editor.
  const [motionMode, setMotionMode] = useState<MotionMode>("idle");
  const [motionTarget, setMotionTarget] = useState<string | null>(null);
  const [motionTheme, setMotionTheme] = useState<MotionTheme>("dark");

  const handleMotionButtonClick = useCallback(() => {
    setMotionMode("motion-selecting");
  }, []);

  const handleMotionReselect = useCallback(() => {
    setMotionMode("motion-selecting");
    setMotionTarget(null);
  }, []);

  const handleMotionClose = useCallback(() => {
    setMotionMode("idle");
    setMotionTarget(null);
  }, []);

  const handleMotionSelect = useCallback((targetId: string) => {
    setMotionTarget(targetId);
    setMotionMode("editing");
  }, []);

  const handleMotionPanelClose = useCallback(() => {
    setMotionMode("idle");
    setMotionTarget(null);
  }, []);

  return (
    <div>
      {/* Example: wrap each editable target with MotionTargetOverlay */}
      <MotionTargetOverlay
        targetId="agent-fan"
        targetLabel={AGENT_FAN_MOTION.label}
        isSelecting={motionMode === "motion-selecting"}
        onSelect={handleMotionSelect}
      >
        <div>{/* Existing target component here */}</div>
      </MotionTargetOverlay>

      <MotionTargetOverlay
        targetId="chat-input"
        targetLabel={CHAT_INPUT_MOTION.label}
        isSelecting={motionMode === "motion-selecting"}
        onSelect={handleMotionSelect}
      >
        <div>{/* Existing target component here */}</div>
      </MotionTargetOverlay>

      {/* Example: upgraded MotionPanel now receives theme */}
      <AnimatePresence>
        {motionMode === "editing" && motionTarget === "agent-fan" && (
          <MotionPanel
            targetLabel={AGENT_FAN_MOTION.label}
            theme={motionTheme}
            schema={AGENT_FAN_MOTION.schema}
            config={fanConfig}
            defaultConfig={AGENT_FAN_MOTION.defaultConfig}
            onChange={(config) => setFanConfig(config)}
            stateOptions={AGENT_FAN_MOTION.states}
            onClose={handleMotionPanelClose}
          />
        )}

        {motionMode === "editing" && motionTarget === "chat-input" && (
          <MotionPanel
            targetLabel={CHAT_INPUT_MOTION.label}
            theme={motionTheme}
            schema={CHAT_INPUT_MOTION.schema}
            config={chatInputConfig}
            defaultConfig={CHAT_INPUT_MOTION.defaultConfig}
            onChange={(config) => setChatInputConfig(config)}
            stateOptions={CHAT_INPUT_MOTION.states}
            onClose={handleMotionPanelClose}
          />
        )}
      </AnimatePresence>

      {/* Upgraded button now supports theme toggle */}
      <EditorSelectButton
        mode={motionMode}
        theme={motionTheme}
        expanded={false}
        onExpandedChange={() => {}}
        onToggle={handleMotionButtonClick}
        onReselect={handleMotionReselect}
        onExitEditing={handleMotionClose}
        onThemeToggle={() =>
          setMotionTheme((prev) => (prev === "dark" ? "light" : "dark"))
        }
        onClose={handleMotionClose}
      />
    </div>
  );
}
