"use client";

import React from "react";
import { createCache, extractStyle } from "@ant-design/cssinjs";
import { ConfigProvider, App, type ThemeConfig } from "antd";
import { useServerInsertedHTML } from "next/navigation";

const theme: ThemeConfig = {
  token: {
    // Brand colors from template.png
    colorPrimary: "#27AE60", // GREEN - Logo and active nav (was #0F766E teal)
    colorError: "#DC2626", // Unchanged - Red for destructive actions
    colorBgLayout: "#F5F5F5", // Changed from #F8FAFC - Content background
    colorBgContainer: "#FFFFFF",
    colorBgElevated: "#FFFFFF",
    colorText: "#0F172A",
    colorTextSecondary: "#475569",
    colorBorder: "#E2E8F0",
    colorFillTertiary: "#F1F5F9",
    colorWhite: "#FFFFFF",
    fontSize: 14,
    borderRadius: 8, // Reduced from 16 for template look
    borderRadiusLG: 8,
    borderRadiusSM: 6,
    wireframe: false,
  },
  components: {
    Menu: {
      colorItemBgSelected: "#E8F8EF", // Green tint (was #F0FDFA)
      colorItemTextSelected: "#27AE60", // Green for selected label
      colorItemBgHover: "#F1F5F9",
      colorItemTextHover: "#0F172A",
      colorItemBg: "transparent",
      colorItemText: "#475569", // Gray text - matches template
      borderRadius: 8,
      itemMarginInline: 8,
      itemMarginBlock: 4,
    },
    Button: {
      borderRadius: 8, // Reduced from 12
      controlHeight: 40,
      primaryColor: "#FFFFFF",
      defaultBorderColor: "#E2E8F0",
      defaultColor: "#0F172A",
      defaultBg: "#FFFFFF",
      colorPrimary: "#3498DB", // BLUE - Primary buttons (was #0F766E)
      colorPrimaryHover: "#2980B9", // Blue darker
      colorPrimaryActive: "#1F6391", // Blue darkest
    },
    Card: {
      padding: 16,
      paddingLG: 24,
      borderRadius: 16,
      colorBorderSecondary: "#E2E8F0",
    },
    Table: {
      borderRadius: 16,
      colorBgContainer: "#FFFFFF",
      headerBg: "#F8FAFC",
      headerColor: "#64748B",
      headerSortActiveBg: "#F1F5F9",
      rowHoverBg: "#F8FAFC",
      borderColor: "#E2E8F0",
    },
    Tag: {
      borderRadius: 9999,
    },
    Modal: {
      borderRadius: 16,
      borderRadiusLG: 16,
    },
  },
};

export default function AntdProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const cache = React.useMemo(() => createCache(), []);

  useServerInsertedHTML(() => {
    const styles = extractStyle(cache, true);
    return (
      <style
        id="antd"
        dangerouslySetInnerHTML={{ __html: styles }}
      />
    );
  });

  return (
    <ConfigProvider theme={theme}>
      <App>{children}</App>
    </ConfigProvider>
  );
}
